import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env";
import { Agent } from "@openai/agents";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadReasonablenessRules(): string {
  const cwdCandidates = [
    path.resolve(process.cwd(), "ReasonablenessChecks.json"),
    path.resolve(process.cwd(), "ResonablenessChecks.json"),
  ];
  const fallbackCandidates = [
    path.resolve(__dirname, "../../../../ReasonablenessChecks.json"),
    path.resolve(__dirname, "../../../../ResonablenessChecks.json"),
  ];
  const candidates = [...cwdCandidates, ...fallbackCandidates];
  const rulesPath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!rulesPath) {
    return "No reasonableness rules file found.";
  }

  try {
    return fs.readFileSync(rulesPath, "utf-8");
  } catch (err) {
    return `Failed to read reasonableness rules file at ${rulesPath}.`;
  }
}

export function anomalyReviewAgent(model?: string) {
  const resolvedModel = model ?? env.LLM_MODEL;
  const rulesText = loadReasonablenessRules();

  return new Agent({
    name: "Anomaly Review Agent",
    model: resolvedModel,
    tools: [],
    instructions: [
      "You review engine_specs_main rows for reasonableness and set anomaly_status.",
      "You will be given a JSON array of rows to evaluate.",
      "For each row, evaluate the reasonableness rules and decide passed or failed.",
      "Set status to failed if any rule with severity 'error' fails; otherwise set to passed.",
      "Return ONLY a JSON array of results: [{ id, status, reason }].",
      "Do not wrap the JSON in markdown or add any extra commentary.",
      "If no rows are provided, respond with an empty JSON array.",
      "",
      "Field mapping to rule names:",
      "- engine_name => model",
      "- engine_code => (not available; treat as null and skip those rules)",
      "- power_hp => power_output_hp",
      "- max_boost_psi => max_turbocharger_compression_psi",
      "- num_cylinders => number_of_cylinders",
      "- max_rpm => maximum_rpm",
      "",
      "Note: compression_ratio may be a string like '10.5:1'; interpret the numeric portion.",
      "",
      "Reasonableness rules (verbatim):",
      rulesText,
    ].join("\n"),
  });
}
