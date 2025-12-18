export async function runAgentTaskSSE(args: {
  backendUrl: string;
  taskId: string;
  agentId: string;
  threadId: string;
  input: any;
  onText: (delta: string) => void;
  onDone: (ok: boolean) => void;
  onError: (err: string) => void;
}) {
  const res = await fetch(`${args.backendUrl}/agui`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      taskId: args.taskId,
      agentId: args.agentId,
      threadId: args.threadId,
      input: args.input,
    }),
  });

  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const p of parts) {
      const lines = p.split("\n");
      const event = lines.find(l => l.startsWith("event:"))?.slice(6).trim();
      const dataLine = lines.find(l => l.startsWith("data:"))?.slice(5).trim();
      if (!event || !dataLine) continue;
      const data = JSON.parse(dataLine);
console.log("SSE Event:", event, data);
      if (event === "message.delta") args.onText(data.text ?? "");
      if (event === "run.error") args.onError(data.error ?? "Unknown error");
      if (event === "run.completed") args.onDone(Boolean(data.ok));
    }
  }
}
