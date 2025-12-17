import { pgQueryAgent } from "./pgQueryAgent";
import { agentChatAgent } from "./agentChatAgent";
import type { AgentDescriptor } from "./types";

export const agentDefinitions = {
  agentChat: {
    name: "Agent Chat",
    description: "General-purpose assistant for conversational help and local context.",
    capabilities: ["conversational", "summarize-results"],
    factory: agentChatAgent,
  },
  pgQuery: {
    name: "Postgres Query Agent",
    description: "Explore the Postgres database using read-only queries and schema introspection.",
    capabilities: ["read-db", "schema-introspection", "summarize-results"],
    factory: pgQueryAgent,
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
  }));
}
