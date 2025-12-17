import type { TaskRequest, TaskResult, TaskRequestById } from "./types";
import { agents } from "../agents/registry";
import { Runner } from "@openai/agents"; // :contentReference[oaicite:9]{index=9}



export async function runPgQueryTask(
  req: TaskRequestById<"runPgQuery">
): Promise<TaskResult> {
  try {
    const agent = agents["pgQuery"];

    const runner = new Runner();

    const userMessage =
      `Run this SQL and summarize results.\n\nSQL:\n${req.input.sql}\n`;

    const result = await runner.run(agent, userMessage);

    // normalize output to the expected TaskResult shape { assistantText: string }
    const normalizeOutput = (out: any): string => {
      if (typeof out === "string") return out;
      if (Array.isArray(out)) return out.map(o => (typeof o === "string" ? o : JSON.stringify(o))).join("\n");
      try { return JSON.stringify(out); } catch { return String(out); }
    };

    return { ok: true, data: { assistantText: normalizeOutput(result.output) } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
