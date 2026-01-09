import type { TaskRequest, TaskResult } from "../tasks/types";
import { runAgentChatTask } from "../tasks/runAgentChatTask";
import { runPgQueryTask } from "../tasks/runPgQueryTask";
import { runUpdateAnomalyStatusTask } from "../tasks/runUpdateAnomalyStatusTask";
import { runAnomalyReviewTask } from "../tasks/runAnomalyReviewTask";
import { runEngineDiscoveryTask } from "../tasks/runEngineDiscoveryTask";

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
    case "runUpdateAnomalyStatus":
      console.log("Running runUpdateAnomalyStatus task");
      console.log("runUpdateAnomalyStatus req:", req);
      return runUpdateAnomalyStatusTask(req);
    case "runAnomalyReview":
      console.log("Running runAnomalyReview task");
      console.log("runAnomalyReview req:", req);
      return runAnomalyReviewTask(req);
    case "runEngineDiscovery":
      console.log("Running runEngineDiscovery task");
      console.log("runEngineDiscovery req:", req);
      return runEngineDiscoveryTask(req);
    default:
      return { ok: false, error: `Unknown taskId: ${(req as any).taskId}` };
  }
}
