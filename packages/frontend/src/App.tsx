import { useState } from "react";
import { AgentPicker } from "./components/AgentPicker";
import { ChatPanel } from "./components/ChatPanel";
import { useAgents } from "./hooks/useAgents";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8787";

export default function App() {
  const { agents, loading } = useAgents(BACKEND_URL);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const [taskId, setTaskId] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();

  function onPickAgent(agentId: string, taskId: string) {
    setAgentId(agentId);
    setThreadId(crypto.randomUUID());
    setTaskId(taskId);
  }

  function onNewThread() {
    setThreadId(crypto.randomUUID());
  }

  if (loading) return <div className="app-loading">Loading agents...</div>;
  if (!agentId && agents.length > 0) {
    onPickAgent(agents[0].agentId, agents[0].taskId);
  }

  return (
    <div className="app">
      <div className="app-shell">
        <main className="app-card">
          <header className="app-header">
            <div className="app-kicker">E-SPEC<sup className="tm">TM</sup> - Engine Size, Power, Efficiency Calculator</div>
            <h1 className="app-title">
              E-SPEC<sup className="tm">TM</sup> Agents <span className="app-version">v1</span>
            </h1>
            <div className="app-subtitle">
              AI agent dashboard.
            </div>
          </header>

          <AgentPicker
            agents={agents}
            agentId={agentId!}
            setAgentId={onPickAgent}
          />

          <ChatPanel
            backendUrl={BACKEND_URL}
            agentId={agentId!}
            threadId={threadId}
            taskId={taskId!}
            onNewThread={onNewThread}
          />
        </main>

        <footer className="app-footer">
          ALL RIGHTS RESERVED &copy;GT-Edge, LLC {currentYear}
        </footer>
      </div>
    </div>
  );
}
