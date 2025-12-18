import { useEffect, useState } from "react";

export type AgentInfo = {
  agentId: string;
  name: string;
  description: string;
  capabilities: string[];
  taskId: string;
};


export function useAgents(backendUrl: string) {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${backendUrl}/agents`)
      .then(r => r.json())
      .then(setAgents)
      .finally(() => setLoading(false));
  }, [backendUrl]);

  return { agents, loading };
}
