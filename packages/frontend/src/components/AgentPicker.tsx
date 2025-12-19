import type { AgentInfo } from "../hooks/useAgents";

export function AgentPicker(props: {
  agents: AgentInfo[];
  agentId: string;
  setAgentId: (v: string, taskId: string) => void;
}) {
  const selected = props.agents.find((a) => a.agentId === props.agentId);

  return (
    <label className="agent-picker">
      <span className="agent-label">Agent</span>

      <select
        className="agent-select"
        value={props.agentId}
        onChange={(e) => {
          const nextId = e.target.value;
          const nextAgent = props.agents.find((a) => a.agentId === nextId);
          props.setAgentId(nextId, nextAgent?.taskId ?? "");
        }}
      >
        {props.agents.map((a) => (
          <option key={a.agentId} value={a.agentId}>
            {a.name}
          </option>
        ))}
      </select>

      {selected && (
        <div className="agent-details">
          <small className="agent-desc">{selected.description}</small>

          <div className="agent-tags">
            {selected.capabilities.map((c) => (
              <span key={c} className="agent-tag">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </label>
  );
}
