export type AgentId = "pgQuery";

export type TaskId = "agentChat" | "runPgQuery";


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
  };
  
export type TaskResult = {
  ok: boolean;
  data?: { assistantText: string };
  error?: string;
};
export type TaskRequestById<T extends TaskId> = Extract<TaskRequest, { taskId: T }>;
