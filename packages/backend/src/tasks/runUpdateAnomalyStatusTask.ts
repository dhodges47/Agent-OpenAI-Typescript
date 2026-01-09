import type { TaskRequestById, TaskResult } from "./types";
import { anomalyStatusAgent } from "../agents/anomalyStatusAgent";
import { extractFinalStructured } from "../runner/extractFinalStructured";
import { getRunner } from "../runner/getRunner";
import { resolveLlmSelection } from "../llm/options";
import { env } from "../config/env";

export async function runUpdateAnomalyStatusTask(
  req: TaskRequestById<"runUpdateAnomalyStatus">
): Promise<TaskResult> {
  try {
    console.log("runUpdateAnomalyStatusTask req:", req);
    const { provider, model } = resolveLlmSelection(req.input.llm);
    const agent = anomalyStatusAgent(model);
    const runner = getRunner(provider, model);

    const userMessage = `${req.input.userText}`;
    console.log("runUpdateAnomalyStatusTask userMessage:", userMessage);
    const result = await runner.run(agent, userMessage, {
      maxTurns: env.LLM_MAX_TURNS,
    });

    const assistantText = extractFinalStructured(result);
    console.log("runUpdateAnomalyStatusTask assistantText:", assistantText);

    return { ok: true, data: { assistantText } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
