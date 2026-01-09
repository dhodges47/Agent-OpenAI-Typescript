import { z } from "zod";
import { Agent, tool } from "@openai/agents";
import { env } from "../config/env";
import { createEngineSimilarityCheckTool } from "./tools/engineSimilarityTool";

export function engineDiscoveryAgent(model?: string) {
  const resolvedModel = model ?? env.LLM_MODEL;

  const engineWebFetch = tool({
    name: "engine_web_fetch",
    description:
      "Fetch text content from a URL to extract engine candidates. Response is truncated to a max size.",
    parameters: z.object({
      url: z.string().min(1),
      maxChars: z.number().int().min(1000).max(200000).default(15000),
    }),
    execute: async ({ url, maxChars }) => {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "EngineDiscoveryAgent/1.0",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      }
      const text = await res.text();
      return text.slice(0, maxChars);
    },
  });

  const engineSimilarityCheck = createEngineSimilarityCheckTool();

  return new Agent({
    name: "Engine Discovery Agent",
    model: resolvedModel,
    tools: [engineWebFetch, engineSimilarityCheck],
    instructions: [
      "You discover engine candidates from web sources and deduplicate against the database.",
      "Use engine_web_fetch to retrieve source text; extract structured candidates.",
      "Call engine_similarity_check to filter out exact and near-duplicates.",
      "Return only candidates marked not_found or ambiguous cases needing review.",
      "Never attempt database writes or schema changes.",
      "Be explicit about uncertainty and cite the source URL for each candidate.",
    ].join("\n"),
  });
}
