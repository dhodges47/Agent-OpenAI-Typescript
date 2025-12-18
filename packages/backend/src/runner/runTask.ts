import type { TaskRequest, TaskResult } from "../tasks/types";
import { runAgentChatTask } from "../tasks/runAgentChatTask";
import { runPgQueryTask } from "../tasks/runPgQueryTask";

export async function runTask(req: TaskRequest): Promise<TaskResult> {
  console.log("runTask req:", req);
  switch (req.taskId) {
    case "agentChat":
      console.log(`Running agentChat task `);
      console.log("agentChat req:", req);
      return runAgentChatTask(req);
    case "runPgQuery":
      console.log(`Running runPgQuery task`);
      console.log("runPgQuery req:", req);
      return runPgQueryTask(req);
    default:
      return { ok: false, error: `Unknown taskId: ${(req as any).taskId}` };
  }
}
