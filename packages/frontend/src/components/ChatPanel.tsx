import { useState } from "react";
import { runAgentTaskSSE } from "../agui/client";

type Msg = { role: "user" | "assistant"; text: string };

export function ChatPanel(props: { backendUrl: string; agentId: string; threadId: string }) {
  const [input, setInput] = useState("What tables are available?");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [running, setRunning] = useState(false);

  async function send() {
    const userText = input.trim();
    if (!userText) return;

    setMsgs(prev => [...prev, { role: "user", text: userText }, { role: "assistant", text: "" }]);
    setInput("");
    setRunning(true);

    await runAgentTaskSSE({
      backendUrl: props.backendUrl,
      taskId: "agentChat",
      agentId: props.agentId,
      threadId: props.threadId,
      input: { userText },
      onText: (t) => {
        setMsgs(prev => {
          const copy = [...prev];
          // append to last assistant message
          const lastIdx = copy.length - 1;
          if (lastIdx >= 0 && copy[lastIdx].role === "assistant") {
            copy[lastIdx] = { role: "assistant", text: copy[lastIdx].text + t };
          }
          return copy;
        });
      },
      onError: (e) => {
        setMsgs(prev => [...prev, { role: "assistant", text: `[error] ${e}` }]);
      },
      onDone: () => setRunning(false),
    });
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ border: "1px solid #ccc", padding: 12, minHeight: 240 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <b>{m.role}:</b> <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ flex: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          disabled={running}
        />
        <button onClick={send} disabled={running}>Send</button>
      </div>
    </div>
  );
}
