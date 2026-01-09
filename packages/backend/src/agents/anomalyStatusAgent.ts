import { z } from "zod";
import { pool } from "../db/pool";
import { env } from "../config/env";
import { Agent, tool } from "@openai/agents";

const StatusEnum = z.enum(["pending", "processing", "passed", "failed"]);
const IdParam = z.union([z.number().int().positive(), z.string().min(1)]);

export function anomalyStatusAgent(model?: string) {
  const updateAnomalStatus = tool({
    name: "update_anomal_status",
    description:
      "Update anomaly_status for a single espec.engine_specs_main row by id.",
    parameters: z.object({
      id: IdParam,
      status: StatusEnum,
    }),
    execute: async ({ id, status }) => {
      const sql = `
        update espec.engine_specs_main
        set anomaly_status = $1,
            updated_at = now()
        where id = $2
        returning id, anomaly_status;
      `;
      const res = await pool.query(sql, [status, id]);
      if (res.rowCount === 0) {
        throw new Error("No row found for the provided id.");
      }
      return res.rows[0];
    },
  });

  const resolvedModel = model ?? env.LLM_MODEL;

  return new Agent({
    name: "Anomaly Status Writer",
    model: resolvedModel,
    tools: [updateAnomalStatus],
    instructions: [
      "You update anomaly_status for a single record in espec.engine_specs_main.",
      "Only use update_anomal_status for writes; do not attempt other SQL.",
      "Status must be one of: pending, processing, passed, failed.",
      "If asked for other writes, explain they are not supported.",
    ].join("\n"),
  });
}
