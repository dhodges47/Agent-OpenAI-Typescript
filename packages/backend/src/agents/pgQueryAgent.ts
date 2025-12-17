import { z } from "zod";
import { pool } from "../db/pool";
import { env } from "../config/env";
import { getOpenAIClient } from "../llm/provider";
import { Agent, tool } from "@openai/agents";

export function pgQueryAgent() {
  const pgIntrospectSchema = tool({
    name: "pg_introspect_schema",
    description:
      "List tables/views and (optionally) columns in the Postgres database. Uses information_schema/pg_catalog.",
    parameters: z.object({
      schema: z.string().default("public"),
      includeColumns: z.boolean().default(false),
      tableName: z.string().nullable().default(null),
      limit: z.number().int().min(1).max(500).default(200),
    }),
    execute: async ({ schema, includeColumns, tableName, limit }) => {
      // list tables/views
      if (!includeColumns) {
        const sql = `
          select table_schema, table_name, table_type
          from information_schema.tables
          where table_schema = $1
          ${tableName ? "and table_name = $2" : ""}
          order by table_type, table_name
          limit $${tableName ? 3 : 2};
        `;
        const params = tableName ? [schema, tableName, limit] : [schema, limit];
        const res = await pool.query(sql, params);
        return res.rows;
      }

      // list columns for a table (or all tables in schema)
      const sql = `
        select table_schema, table_name, column_name, data_type, is_nullable
        from information_schema.columns
        where table_schema = $1
        ${tableName ? "and table_name = $2" : ""}
        order by table_name, ordinal_position
        limit $${tableName ? 3 : 2};
      `;
      const params = tableName ? [schema, tableName, limit] : [schema, limit];
      const res = await pool.query(sql, params);
      return res.rows;
    },
  });

  const pgReadonlyQuery = tool({
    name: "pg_readonly_query",
    description: "Run a read-only SQL query (SELECT/WITH only) against Postgres and return rows.",
    parameters: z.object({
      sql: z.string(),
      params: z.array(z.any()).default([]),
      limit: z.number().int().min(1).max(200).default(50),
    }),
    execute: async ({ sql, params, limit }) => {
      const lowered = sql.trim().toLowerCase();
      if (!lowered.startsWith("select") && !lowered.startsWith("with")) {
        throw new Error("Read-only mode: only SELECT/WITH queries are allowed.");
      }
      const res = await pool.query(sql, params ?? []);
      return res.rows.slice(0, limit);
    },
  });

  const client = getOpenAIClient();

  return new Agent({
    name: "Postgres Query Agent",
    model: env.LLM_MODEL,
    openai: client as any,
    tools: [pgIntrospectSchema, pgReadonlyQuery],
    instructions: [
      "You help the user explore a Postgres database.",
      "Use pg_introspect_schema when the user asks about available tables/columns.",
      "You may ONLY use pg_readonly_query for data retrieval. Never propose or attempt writes.",
      "If the user asks to insert/update/delete, explain that writes are not supported yet.",
      "Prefer small, safe queries with LIMIT.",
    ].join("\n"),
  });
}
