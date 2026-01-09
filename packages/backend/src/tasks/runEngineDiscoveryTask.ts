import type { TaskRequestById, TaskResult } from "./types";
import { engineDiscoveryAgent } from "../agents/engineDiscoveryAgent";
import { extractFinalStructured } from "../runner/extractFinalStructured";
import { getRunner } from "../runner/getRunner";
import { resolveLlmSelection } from "../llm/options";
import { env } from "../config/env";

export async function runEngineDiscoveryTask(
  req: TaskRequestById<"runEngineDiscovery">
): Promise<TaskResult> {
  try {
    const { provider, model } = resolveLlmSelection(req.input.llm);
    const agent = engineDiscoveryAgent(model);
    const runner = getRunner(provider, model);

    const userMessage = `${req.input.userText}`;
    const result = await runner.run(agent, userMessage, {
      maxTurns: env.LLM_MAX_TURNS,
    });

    const assistantText = extractFinalStructured(result);
    return { ok: true, data: { assistantText } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
