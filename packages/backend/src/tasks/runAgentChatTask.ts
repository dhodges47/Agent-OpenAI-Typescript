import type { TaskResult, TaskRequestById } from "./types";
import { agents } from "../agents/registry";
import { appendMessage, getMessages } from "../runner/threadStore";
import { Runner } from "@openai/agents";
import { extractFinalText } from "../runner/extractFinalText";
import { normalizeMessagesForAgent } from "../runner/normalizeMessages";
import { env } from "../config/env";
import { getRunner } from "../runner/getRunner"

export async function runAgentChatTask(
  req: TaskRequestById<"agentChat">
): Promise<TaskResult> {
  try {
    const agent = agents["agentChat"]; // (assuming this is correct in your registry)

    appendMessage(req.threadId, { role: "user", content: req.input.userText });

     const runner = getRunner(env.LLM_PROVIDER, env.LLM_MODEL);
    const history = getMessages(req.threadId);
    const normalizedHistory = normalizeMessagesForAgent(history);
    
    
    const result = await runner.run(agent, normalizedHistory as any);

    const assistantText = extractFinalText(result);

    appendMessage(req.threadId, { role: "assistant", content: assistantText });

    return { ok: true, data: { assistantText } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
