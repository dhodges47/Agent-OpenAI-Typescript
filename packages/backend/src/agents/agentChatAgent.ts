import { Agent } from "@openai/agents";
import { env } from "../config/env";

export function agentChatAgent(model?: string) {
  const resolvedModel = model ?? env.LLM_MODEL;
  console.log("using chat agent with model:", resolvedModel);
  return new Agent({
    name: "Agent Chat",
    model: resolvedModel,
    tools: [],
    instructions: [
      "You are a concise, friendly assistant for general troubleshooting and brainstorming.",
      "Prefer short, actionable answers and call out uncertainties explicitly.",
      "Never claim to have executed code or run commands.",
    ].join("\n"),
  });
}
