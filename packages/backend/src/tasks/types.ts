export type AgentId =
  | "pgQuery"
  | "anomalyStatus"
  | "anomalyReview"
  | "engineDiscovery";

export type TaskId =
  | "agentChat"
  | "runPgQuery"
  | "runUpdateAnomalyStatus"
  | "runAnomalyReview"
  | "runEngineDiscovery";


export type TaskRequest =
  | {
    taskId: "agentChat";
    agentId: string;
    threadId: string;
    input: { userText: string; llm?: { provider?: string; model?: string } };
  }
  | {
    taskId: "runPgQuery";
    agentId: string;
    threadId: string;
    input: { userText: string; llm?: { provider?: string; model?: string } };
  }
  | {
    taskId: "runUpdateAnomalyStatus";
    agentId: string;
    threadId: string;
    input: { userText: string; llm?: { provider?: string; model?: string } };
  }
  | {
    taskId: "runAnomalyReview";
    agentId: string;
    threadId: string;
    input: { userText: string; llm?: { provider?: string; model?: string } };
  }
  | {
    taskId: "runEngineDiscovery";
    agentId: string;
    threadId: string;
    input: { userText: string; llm?: { provider?: string; model?: string } };
  };
  
export type TaskResult = {
  ok: boolean;
  data?: { assistantText: string };
  error?: string;
};
export type TaskRequestById<T extends TaskId> = Extract<TaskRequest, { taskId: T }>;
