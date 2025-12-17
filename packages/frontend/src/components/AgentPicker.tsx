import type { AgentInfo } from "../hooks/useAgents";

export function AgentPicker(props: {
  agents: AgentInfo[];
  agentId: string;
  setAgentId: (v: string) => void;
}) {
  const selected = props.agents.find(a => a.agentId === props.agentId);

  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span>Agent</span>

      <select value={props.agentId} onChange={(e) => props.setAgentId(e.target.value)}>
        {props.agents.map(a => (
          <option key={a.agentId} value={a.agentId}>
            {a.name}
          </option>
        ))}
      </select>

      {selected && (
        <div style={{ display: "grid", gap: 6 }}>
          <small style={{ color: "#555" }}>{selected.description}</small>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {selected.capabilities.map((c) => (
              <span
                key={c}
                style={{
                  fontSize: 12,
                  border: "1px solid #ccc",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </label>
  );
}
