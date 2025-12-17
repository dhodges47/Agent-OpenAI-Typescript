import { useState } from "react";
import { AgentPicker } from "./components/AgentPicker";
import { ChatPanel } from "./components/ChatPanel";
import { useAgents } from "./hooks/useAgents";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8787";

export default function App() {
  const { agents, loading } = useAgents(BACKEND_URL);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());

  function onPickAgent(next: string) {
    setAgentId(next);
    setThreadId(crypto.randomUUID());
  }

  if (loading) return <div>Loading agents…</div>;
  if (!agentId && agents.length > 0) {
    onPickAgent(agents[0].agentId);
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", display: "grid", gap: 16 }}>
      <h1>Agents (v1)</h1>

      <AgentPicker
        agents={agents}
        agentId={agentId!}
        setAgentId={onPickAgent}
      />

      <ChatPanel
        backendUrl={BACKEND_URL}
        agentId={agentId!}
        threadId={threadId}
      />
    </div>
  );
}
