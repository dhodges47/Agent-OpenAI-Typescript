import type { TaskResult, TaskRequestById } from "./types";
import { agentChatAgent } from "../agents/agentChatAgent";
import { appendMessage, getMessages } from "../runner/threadStore";
import { extractFinalText } from "../runner/extractFinalText";
import { normalizeMessagesForAgent } from "../runner/normalizeMessages";
import { getRunner } from "../runner/getRunner"
import { resolveLlmSelection } from "../llm/options";
import { env } from "../config/env";

export async function runAgentChatTask(
  req: TaskRequestById<"agentChat">
): Promise<TaskResult> {
  try {
    const { provider, model } = resolveLlmSelection(req.input.llm);
    const agent = agentChatAgent(model);
    const runner = getRunner(provider, model);

    appendMessage(req.threadId, { role: "user", content: req.input.userText });
    const history = getMessages(req.threadId);
    const normalizedHistory = normalizeMessagesForAgent(history);


    const result = await runner.run(agent, normalizedHistory as any, {
      maxTurns: env.LLM_MAX_TURNS,
    });

    const assistantText = extractFinalText(result);

    appendMessage(req.threadId, { role: "assistant", content: assistantText });

    return { ok: true, data: { assistantText } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
