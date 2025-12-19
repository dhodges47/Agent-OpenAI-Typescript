import { useState } from "react";
import { runAgentTaskSSE } from "../agui/client";

type Msg = { role: "user" | "assistant"; text: string; at: string };

type ChatPanelProps = {
  backendUrl: string;
  agentId: string;
  threadId: string;
  taskId: string;
  onNewThread: () => void;
};

export function ChatPanel(props: ChatPanelProps) {
  const defaultPrompt = "What tables are available in the espec Database?";
  const [input, setInput] = useState(defaultPrompt);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [running, setRunning] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);

  function formatTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function clearChat() {
    setMsgs([]);
    setInput(defaultPrompt);
    setLastLatencyMs(null);
    props.onNewThread();
  }

  async function send() {
    const userText = input.trim();
    if (!userText) return;

    const startTime = performance.now();
    const timestamp = formatTime();

    setMsgs((prev) => [
      ...prev,
      { role: "user", text: userText, at: timestamp },
      { role: "assistant", text: "", at: timestamp },
    ]);
    setInput("");
    setRunning(true);
    console.log("runAgentTaskSSE, props", props);
    await runAgentTaskSSE({
      backendUrl: props.backendUrl,
      taskId: props.taskId,
      agentId: props.agentId,
      threadId: props.threadId,
      input: { userText },
      onText: (t) => {
        setMsgs((prev) => {
          const copy = [...prev];
          // append to last assistant message
          const lastIdx = copy.length - 1;
          if (lastIdx >= 0 && copy[lastIdx].role === "assistant") {
            copy[lastIdx] = { ...copy[lastIdx], text: copy[lastIdx].text + t };
          }
          return copy;
        });
      },
      onError: (e) => {
        setMsgs((prev) => [...prev, { role: "assistant", text: `[error] ${e}`, at: formatTime() }]);
      },
      onDone: () => {
        setRunning(false);
        setLastLatencyMs(Math.round(performance.now() - startTime));
      },
    });
  }

  return (
    <div className="chat-panel">
      <div className="chat-status">
        <div className="chat-status-title">Session Status</div>
        <div className="chat-status-grid">
          <div className="chat-status-item">
            <span>Agent</span>
            <strong>{props.agentId}</strong>
          </div>
          <div className="chat-status-item">
            <span>Task</span>
            <strong>{props.taskId}</strong>
          </div>
          <div className="chat-status-item">
            <span>Thread</span>
            <strong>{props.threadId.slice(0, 8)}</strong>
          </div>
          <div className="chat-status-item">
            <span>Latency</span>
            <strong>{lastLatencyMs === null ? "--" : `${lastLatencyMs} ms`}</strong>
          </div>
        </div>
        <div className="chat-status-actions">
          <button className="chat-clear" onClick={clearChat} disabled={running}>
            New Chat
          </button>
          <div className={`chat-status-pill ${running ? "is-running" : ""}`}>
            {running ? "Running" : "Idle"}
          </div>
        </div>
      </div>

      <div className="chat-thread">
        {msgs.map((m, i) => (
          <div key={i} className={`chat-msg chat-msg-${m.role}`}>
            <div className="chat-meta">
              <span className="chat-role">{m.role}</span>
              <span className="chat-time">{m.at}</span>
            </div>
            <div className="chat-text">{m.text}</div>
          </div>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          disabled={running}
        />
        <button className="chat-send" onClick={send} disabled={running}>
          Send
        </button>
      </div>
    </div>
  );
}
