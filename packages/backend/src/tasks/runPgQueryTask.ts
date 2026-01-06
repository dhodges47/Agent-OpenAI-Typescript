import type { TaskRequestById, TaskResult } from "./types";
import { pgQueryAgent } from "../agents/pgQueryAgent";
import { extractFinalStructured } from "../runner/extractFinalStructured";
import { getRunner } from "../runner/getRunner"
import { resolveLlmSelection } from "../llm/options";

export async function runPgQueryTask(
  req: TaskRequestById<"runPgQuery">
): Promise<TaskResult> {
  try {
    console.log("runPgQueryTask req:", req);
    const { provider, model } = resolveLlmSelection(req.input.llm);
    const agent = pgQueryAgent(model);
    const runner = getRunner(provider, model);

    const userMessage = `${req.input.userText}`;
    console.log("runPgQueryTask userMessage:", userMessage);
    const result = await runner.run(agent, userMessage);

    const assistantText = extractFinalStructured(result);
    console.log("runPgQueryTask assistantText:", assistantText);

    return { ok: true, data: { assistantText } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
