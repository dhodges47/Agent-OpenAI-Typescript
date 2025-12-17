import { Agent } from "@openai/agents";
import { env } from "../config/env";
import { getOpenAIClient } from "../llm/provider";

export function agentChatAgent() {
  const client = getOpenAIClient();

  return new Agent({
    name: "Agent Chat",
    model: env.LLM_MODEL,
    tools: [],
    instructions: [
      "You are a concise, friendly assistant for general troubleshooting and brainstorming.",
      "Prefer short, actionable answers and call out uncertainties explicitly.",
      "Never claim to have executed code or run commands.",
    ].join("\n"),
  });
}
