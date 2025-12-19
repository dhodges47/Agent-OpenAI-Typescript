import type { TaskRequestById, TaskResult } from "./types";
import { agents } from "../agents/registry";
import { Runner } from "@openai/agents";
import { extractFinalStructured } from "../runner/extractFinalStructured";

export async function runPgQueryTask(
  req: TaskRequestById<"runPgQuery">
): Promise<TaskResult> {
  try {
    console.log("runPgQueryTask req:", req);
    const agent = agents["pgQuery"];

    const runner = new Runner();

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
