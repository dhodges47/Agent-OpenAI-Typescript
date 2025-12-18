import type { TaskRequest, TaskResult, TaskRequestById } from "./types";
import { agents } from "../agents/registry";
import { Runner } from "@openai/agents"; // :contentReference[oaicite:9]{index=9}
import { extractFinalText } from "../runner/extractFinalText";



export async function runPgQueryTask(
  req: TaskRequestById<"runPgQuery">
): Promise<TaskResult> {
  try {
    console.log("runPgQueryTask req:", req);
    const agent = agents["pgQuery"];

    const runner = new Runner();

    const userMessage = `${req.input.userText}`;
console.log("runPgQueryTask userMessage:", userMessage);
//let userMessage = "List the names of all tables in the espec schema.";
    const result = await runner.run(agent, userMessage);

    // normalize output to the expected TaskResult shape { assistantText: string }
    const normalizeOutput = (out: any): string => {
      if (typeof out === "string") return out;
      if (Array.isArray(out)) return out.map(o => (typeof o === "string" ? o : JSON.stringify(o))).join("\n");
      try { return JSON.stringify(out); } catch { return String(out); }
    };
const assistantText = extractFinalText(result);
console.log("runPgQueryTask assistantText:", assistantText);
   // return { ok: true, data: { assistantText: extractFinalText(normalizeOutput(result.output) ) } };
    return { ok: true, data: { assistantText } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
}
