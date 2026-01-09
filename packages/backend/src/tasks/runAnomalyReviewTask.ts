import type { TaskRequestById, TaskResult } from "./types";
import { anomalyReviewAgent } from "../agents/anomalyReviewAgent";
import { extractFinalStructured } from "../runner/extractFinalStructured";
import { getRunner } from "../runner/getRunner";
import { resolveLlmSelection } from "../llm/options";
import { env } from "../config/env";
import { pool } from "../db/pool";

type ClaimedRow = {
  id: number;
  manufacturer: string | null;
  model: string | null;
  displacement_l: number | null;
  bore_mm: number | null;
  stroke_mm: number | null;
  stroke_type: string | null;
  compression_ratio: string | null;
  power_output_hp: number | null;
  torque_lbft: number | null;
  number_of_cylinders: number | null;
  cylinder_configuration: string | null;
  fuel_type: string | null;
  valvetrain: string | null;
  aspiration: string | null;
  fuel_system: string | null;
  redline_rpm: number | null;
  cooling_system: string | null;
  ignition_type: string | null;
  max_turbocharger_compression_psi: number | null;
  maximum_rpm: number | null;
};

type ReviewResult = {
  id: number;
  status: "passed" | "failed";
  reason?: string;
};

function parseLimit(text: string, fallback = 10) {
  const match = text.match(/\b(\d{1,3})\b/);
  if (!match) return fallback;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return fallback;
  return Math.min(Math.max(value, 1), 100);
}

async function claimPending(limit: number): Promise<ClaimedRow[]> {
  const sql = `
    with picked as (
      select id
      from espec.engine_specs_main
      where anomaly_status = 'pending'
      order by id
      limit $1
      for update skip locked
    )
    update espec.engine_specs_main as t
    set anomaly_status = 'processing',
        updated_at = now()
    from picked
    where t.id = picked.id
    returning
      t.id,
      t.manufacturer,
      t.model,
      t.displacement_l,
      t.bore_mm,
      t.stroke_mm,
      t.stroke_type,
      t.compression_ratio,
      t.power_output_hp,
      t.torque_lbft,
      t.number_of_cylinders,
      t.cylinder_configuration,
      t.fuel_type,
      t.valvetrain,
      t.aspiration,
      t.fuel_system,
      t.redline_rpm,
      t.cooling_system,
      t.ignition_type,
      t.max_turbocharger_compression_psi,
      t.maximum_rpm;
  `;
  const res = await pool.query(sql, [limit]);
  return res.rows as ClaimedRow[];
}

function buildPrompt(rows: ClaimedRow[]) {
  return [
    "Evaluate the following engine specs rows and return a JSON array of results.",
    "Each result must be { id, status, reason } where status is 'passed' or 'failed'.",
    "If any rule with severity 'error' fails, status must be failed; otherwise passed.",
    "",
    "Rows:",
    JSON.stringify(rows, null, 2),
  ].join("\n");
}

function stripCodeFences(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  const lines = trimmed.split("\n");
  if (lines.length <= 2) return trimmed;
  const fenceStart = lines[0];
  const fenceEnd = lines[lines.length - 1];
  if (!fenceStart.startsWith("```") || !fenceEnd.startsWith("```")) return trimmed;
  return lines.slice(1, -1).join("\n").trim();
}

function extractJsonArray(text: string) {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    return cleaned;
  }
  return cleaned.slice(start, end + 1);
}

function parseResults(text: string): ReviewResult[] | null {
  try {
    const cleaned = extractJsonArray(text);
    const parsed = JSON.parse(cleaned) as ReviewResult[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function applyUpdates(results: ReviewResult[], allowedIds: Set<number>) {
  const updates = results.filter(
    (result) =>
      allowedIds.has(result.id) && (result.status === "passed" || result.status === "failed")
  );

  for (const result of updates) {
    const sql = `
        update espec.engine_specs_main
        set anomaly_status = $1,
            updated_at = now()
        where id = $2;
      `;
    console.log("Executing SQL:", sql, "with params:", [result.status, result.id]);
    await pool.query(sql, [result.status, result.id]);
  }

  return updates;
}

export async function runAnomalyReviewTask(
  req: TaskRequestById<"runAnomalyReview">
): Promise<TaskResult> {
  try {
    console.log("runAnomalyReviewTask req:", req);
    const { provider, model } = resolveLlmSelection(req.input.llm);
    const agent = anomalyReviewAgent(model);
    const runner = getRunner(provider, model);

    const userMessage = `${req.input.userText}`;
    console.log("runAnomalyReviewTask userMessage:", userMessage);
    const limit = parseLimit(userMessage, 10);
    const rows = await claimPending(limit);
    if (!rows.length) {
      return { ok: true, data: { assistantText: "[]" } };
    }

    const prompt = buildPrompt(rows);
    const result = await runner.run(agent, `${userMessage}\n\n${prompt}`, {
      maxTurns: env.LLM_MAX_TURNS,
    });

    const assistantText = extractFinalStructured(result);
    console.log("runAnomalyReviewTask assistantText:", assistantText);

    const parsed = parseResults(assistantText);
    if (!parsed) {
      return { ok: false, error: "Failed to parse LLM output as JSON array." };
    }

    const allowedIds = new Set(rows.map((row) => row.id));
    const applied = await applyUpdates(parsed, allowedIds);

    return { ok: true, data: { assistantText: JSON.stringify(applied, null, 2) } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
