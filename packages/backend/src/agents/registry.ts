import { pgQueryAgent } from "./pgQueryAgent";
import { agentChatAgent } from "./agentChatAgent";
import { anomalyStatusAgent } from "./anomalyStatusAgent";
import { anomalyReviewAgent } from "./anomalyReviewAgent";
import { engineDiscoveryAgent } from "./engineDiscoveryAgent";
import type { AgentDescriptor } from "./types";

export const agentDefinitions = {
  agentChat: {
    name: "Agent Chat",
    description: "General-purpose assistant for conversational help and local context.",
    capabilities: ["conversational", "summarize-results"],
    factory: agentChatAgent,
    taskId: "agentChat"
  },
  pgQuery: {
    name: "Postgres Query Agent",
    description: "Explore the Postgres database using read-only queries and schema introspection.",
    capabilities: ["read-db", "schema-introspection", "summarize-results"],
    factory: pgQueryAgent,
    taskId: "runPgQuery"
  },
  anomalyStatus: {
    name: "Anomaly Status Writer",
    description: "Update anomaly_status for a single engine_specs_main row.",
    capabilities: ["update-anomaly-status"],
    factory: anomalyStatusAgent,
    taskId: "runUpdateAnomalyStatus"
  },
  anomalyReview: {
    name: "Anomaly Review Agent",
    description: "Batch-review pending engine specs and set anomaly_status to passed/failed.",
    capabilities: ["read-db", "update-anomaly-status"],
    factory: anomalyReviewAgent,
    taskId: "runAnomalyReview"
  },
  engineDiscovery: {
    name: "Engine Discovery Agent",
    description: "Find new engine candidates from web sources and deduplicate against existing specs.",
    capabilities: ["read-db", "web-fetch", "summarize-results"],
    factory: engineDiscoveryAgent,
    taskId: "runEngineDiscovery"
  },
  // later:
  // engineAdmin: { capabilities: ["read-db","schema-introspection","write-engine-domain"] ... }
} as const;

export type AgentId = keyof typeof agentDefinitions;

export const agents: Record<AgentId, ReturnType<(typeof agentDefinitions)[AgentId]["factory"]>> =
  Object.fromEntries(
    Object.entries(agentDefinitions).map(([id, def]) => [id, def.factory()])
  ) as any;

export function listAgents(): AgentDescriptor[] {
  return Object.entries(agentDefinitions).map(([agentId, def]) => ({
    agentId,
    name: def.name,
    description: def.description,
    capabilities: [...def.capabilities],
    taskId: def.taskId
  }));
}
