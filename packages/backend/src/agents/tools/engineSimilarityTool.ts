import { z } from "zod";
import { tool } from "@openai/agents";
import { pool } from "../../db/pool";
import {
  buildEngineIndex,
  canonicalManufacturer,
  findNearDuplicates,
  normalizeCandidateToRow,
  normalizeEngineKey,
} from "../../engines/normalize";

const EngineCandidateSchema = z.object({
  manufacturer: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  displacement: z.union([z.string(), z.number()]).nullable().optional(),
  number_of_cylinders: z.number().int().nullable().optional(),
  cylinder_configuration: z.string().nullable().optional(),
});

export function createEngineSimilarityCheckTool() {
  return tool({
    name: "engine_similarity_check",
    description:
      "Check engine candidates against existing records using TypeScript-side similarity. Returns exact matches, near-duplicates, or not_found.",
    parameters: z.object({
      candidates: z.array(EngineCandidateSchema).min(1).max(500),
      threshold: z.number().min(0).max(1).default(0.82),
      limit: z.number().int().min(1).max(5).default(3),
    }),
    execute: async ({ candidates, threshold, limit }) => {
      const sql = `
        select manufacturer, model, displacement_l, number_of_cylinders, cylinder_configuration
        from espec.engine_specs_main
      `;
      const res = await pool.query(sql);
      const rows = res.rows;
      const { engineIndex, byManufacturer } = buildEngineIndex(rows);

      return candidates.map((candidate) => {
        const candidateRow = normalizeCandidateToRow(candidate);
        const key = normalizeEngineKey(candidateRow);
        const exact = engineIndex.get(key);

        if (exact) {
          return {
            candidate,
            status: "exact_match",
            matches: [
              {
                manufacturer: exact.manufacturer,
                model: exact.model,
                displacement_l: exact.displacement_l,
                number_of_cylinders: exact.number_of_cylinders,
                cylinder_configuration: exact.cylinder_configuration,
                score: 1,
              },
            ],
          };
        }

        const manufacturerKey = canonicalManufacturer(candidateRow.manufacturer);
        const bucket = byManufacturer.get(manufacturerKey) ?? [];
        const near = findNearDuplicates(candidateRow, bucket, threshold, limit);

        if (near.length === 0) {
          return { candidate, status: "not_found", matches: [] };
        }

        return {
          candidate,
          status: "near_duplicate",
          matches: near.map(({ row, score }) => ({
            manufacturer: row.manufacturer,
            model: row.model,
            displacement_l: row.displacement_l,
            number_of_cylinders: row.number_of_cylinders,
            cylinder_configuration: row.cylinder_configuration,
            score,
          })),
        };
      });
    },
  });
}
