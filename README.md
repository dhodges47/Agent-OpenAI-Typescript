# Agent-OpenAI Typescript

Modern local agent playground built with TypeScript, the OpenAI Agents SDK, and a Postgres database. This repository is designed for both humans and coding agents who need a clear, capability-driven architecture.

Purpose: to allow staff to use local LLM's for confidential queries and to run agents on the engines database.

Build by David Hodges, Outermost Software, LLC 12/17/2025 for GT-Edge LLC

I used ChatGpt 5.2 for vibe coding.

## Overview

| Layer     | Tech / Location                                    |
|-----------|----------------------------------------------------|
| Backend   | Node + TypeScript (`packages/backend`)              |
| Frontend  | React + Vite (`packages/frontend`)                  |
| Agents    | `@openai/agents` SDK with custom tools              |
| LLM       | OpenAI **or** OpenRouter (OpenAI-compatible API)    |
| Transport | SSE endpoint inspired by AG-UI (`transport/agui`)   |
| Database  | Postgres (read-only tools today)                    |

### Project layout
```
packages/
  backend/
    src/
      agents/          # Agent factories + registry
      tasks/           # Task execution (agentChat, pgQuery, ...)
      runner/          # Thread store + task dispatcher
      transport/agui/  # SSE server for the UI
      llm/             # OpenAI/OpenRouter client helper
      db/              # pg Pool
      config/          # env parsing
      index.ts         # Express entry
  frontend/
    src/
      components/      # AgentPicker, Chat UI
      hooks/           # useAgents (fetch registry)
      agui/            # SSE client
```

## Key concepts

### Agents & registry
- Each agent lives in `packages/backend/src/agents/<name>Agent.ts`.
- They expose instructions and tools, but never touch HTTP or the UI.
- `agents/registry.ts` is the **single source of truth** that instantiates agents, describes them, and powers the frontend picker.

### Capabilities
Capabilities describe **exactly what an agent may do** (e.g., `read-db`, `schema-introspection`, `summarize-results`).
- They are not decorative—tools and behavior must match the declared capabilities.
- Adding write abilities later requires adding new, domain-specific capabilities.

### Tools
Tools are defined inside agent factories using `@openai/agents` helpers.
Current notable tools:
- `pg_introspect_schema`: lists tables/columns via `information_schema`.
- `pg_readonly_query`: enforces `SELECT/WITH` only and applies conservative limits.

### Tasks & threads
- Tasks orchestrate agent runs (`packages/backend/src/tasks`).
- `runAgentChatTask` handles chat-style conversations using a thread store (`runner/threadStore.ts`).
- Threads are in-memory today but designed to move to Redis/Postgres later.

### Transport
- `POST /agui` streams Server-Sent Events: `run.started`, `message.delta`, `run.completed`, `run.error`.
- Mirrors AG-UI semantics so CopilotKit-like frontends can plug in easily.

## Getting started

```bash
pnpm install
pnpm dev:frontend
// in a new browser:
pnpm dev:backend
```
- Backend (Express): http://localhost:8787
- Frontend (Vite): usually http://localhost:5173

Set the following env vars (see `packages/backend/src/config/env.ts`):
```
DATABASE_URL=postgres://...
LLM_PROVIDER=openai | openrouter
LLM_MODEL=gpt-4.1-mini           # sample model name
OPENAI_API_KEY=...
OPENROUTER_API_KEY=...          # only when using OpenRouter
```

## Contribution guidelines (condensed)

1. **Honor agent boundaries** – Agents never depend on the transport, UI, or Express.
2. **Registry-first** – Add new agents to `agents/registry.ts`; frontend auto-discovers them.
3. **Capabilities matter** – Declare and enforce the exact verbs an agent can perform.
4. **No generic writes** – Read-only SQL only for now; future writes must be domain-specific tools.
5. **Validate inputs** – Use Zod schemas on every tool.
6. **Thread safety** – Use the thread store helpers; do not reinvent per-agent state.

For deeper architectural detail, see [`agent.md`](./agent.md). For change-process specifics, see [`contributing.md`](./contributing.md).
