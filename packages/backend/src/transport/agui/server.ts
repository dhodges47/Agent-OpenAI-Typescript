import type { Request, Response } from "express";
import { z } from "zod";
import { runTask } from "../../runner/runTask";

const Body = z.object({
  taskId: z.string(),
  agentId: z.string(),
  threadId: z.string(),
  input: z.object({
    userText: z.string(),
    llm: z
      .object({
        provider: z.string().optional(),
        model: z.string().optional(),
      })
      .optional(),
  }),
});

function sseInit(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // some environments support flushHeaders
  if (typeof (res as any).flushHeaders === "function") {
    (res as any).flushHeaders();
  }
  // send a comment to establish the stream
  res.write(`:ok\n\n`);
}

function sseEvent(res: Response, event: string, data: any) {
  try {
    console.log(`Sending SSE event: ${event}`, data);
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    res.write(`event: ${event}\n`);
    // send each line of data prefixed with `data:` to be SSE-compliant
    for (const line of payload.split(/\r?\n/)) {
      res.write(`data: ${line}\n`);
    }
    res.write(`\n`);
  } catch (err) {
    // best-effort: swallow write errors (client may have disconnected)
  }
}

export async function aguiHandler(req: Request, res: Response) {
  console.log("AGUI Handler called");
  sseInit(res);

  try {
    console.log("Checking req.body:", req.body);
    const body = Body.parse(req.body);
  console.log("Parsed body:", body);
    sseEvent(res, "run.started", { agentId: body.agentId, taskId: body.taskId, threadId: body.threadId });
    console.log("runTask", body);
    const result = await runTask(body as any);

    if (!result.ok) {
      sseEvent(res, "run.error", { error: result.error });
      sseEvent(res, "run.completed", { ok: false });
      res.end();
      return;
    }
console.log("result.data.assistantText", result.data?.assistantText);
    sseEvent(res, "message.delta", { text: result.data?.assistantText ?? "" });
    sseEvent(res, "run.completed", { ok: true });
    res.end();
  } catch (e: any) {
    sseEvent(res, "run.error", { error: e?.message ?? "Bad request" });
    sseEvent(res, "run.completed", { ok: false });
    res.end();
  }
}
