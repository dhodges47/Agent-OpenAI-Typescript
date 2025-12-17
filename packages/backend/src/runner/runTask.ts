import type { TaskRequest, TaskResult } from "../tasks/types";
import { runAgentChatTask } from "../tasks/runAgentChatTask";

export async function runTask(req: TaskRequest): Promise<TaskResult> {
  switch (req.taskId) {
    case "agentChat":
      return runAgentChatTask(req);
    default:
      return { ok: false, error: `Unknown taskId: ${(req as any).taskId}` };
  }
}
