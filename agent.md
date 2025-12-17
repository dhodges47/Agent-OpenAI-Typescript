# Agent Development Kit (ADK) + Postgres – Project Guide

This document is written **for coding agents (VS Code AI, Copilot, etc.)** and humans. It explains the architecture, constraints, and extension rules for this repository.

---

## High‑level goal

This project is a **local‑dev agent platform** using:

* **Backend:** Node.js + TypeScript
* **Frontend:** React (Vite)
* **Agents:** OpenAI Agents SDK (`@openai/agents`)
* **Transport:** AG‑UI–style Server‑Sent Events (SSE)
* **LLM Providers:** OpenAI **or** OpenRouter (OpenAI‑compatible)
* **Database:** Postgres

The system is intentionally designed to be **expandable**:

* multiple agents
* agent selection in the UI
* strict capability boundaries
* **read‑only DB access now**, domain‑specific writes later

---

## Monorepo layout

```
adk-pg-demo/
  packages/
    backend/
      src/
        agents/          # agent factories + registry
        tasks/           # task definitions (agentChat, etc.)
        runner/          # task dispatch + thread handling
        transport/agui/  # SSE / AG‑UI transport
        db/              # Postgres pool
        llm/             # OpenAI / OpenRouter provider
        config/          # env parsing
        index.ts         # express entrypoint
    frontend/
      src/
        components/      # AgentPicker, ChatPanel
        hooks/           # useAgents()
        agui/            # SSE client
```

---

## Backend architecture (critical)

### Agents

Agents live in:

```
packages/backend/src/agents/
```

Each agent is:

* created by a **factory function** (e.g. `pgQueryAgent()`)
* registered once in `agents/registry.ts`
* instantiated once per backend process

Agents **never** talk directly to HTTP, Express, or the frontend.

---

### Agent registry (single source of truth)

File:

```
packages/backend/src/agents/registry.ts
```

This file defines:

```ts
agentDefinitions = {
  pgQuery: {
    name,
    description,
    capabilities: [...],
    factory
  }
}
```

From this we derive:

* instantiated agents
* `/agents` API response
* frontend agent picker

⚠️ **Never hardcode agent IDs in the frontend.**

---

### Capabilities (very important)

Capabilities are **declarative permissions**, not decoration.

Examples:

* `read-db`
* `schema-introspection`
* `summarize-results`
* future: `write-engines`, `write-users`

Rules:

* Capabilities describe what an agent *may* do
* Tools must align with capabilities
* **Read‑only agents must never gain write capabilities**

When adding write agents later:

* add new capabilities
* add **domain‑specific tools only**
* do NOT add generic SQL write tools

---

### Tools

Tools are defined **inside agents** using `@openai/agents`.

Current tools:

* `pg_introspect_schema`

  * reads `information_schema`
  * lists tables / columns

* `pg_readonly_query`

  * allows ONLY `SELECT` / `WITH`
  * hard‑rejects inserts/updates/deletes

🚫 There is intentionally **no generic write tool**.

---

### Tasks

Tasks are the backend execution unit.

Current task:

```
agentChat
```

A task includes:

* `agentId`
* `threadId`
* user input

Tasks are dispatched in:

```
packages/backend/src/runner/runTask.ts
```

Agents never know about tasks. Tasks orchestrate agents.

---

### Threads (chat state)

Threads are keyed by `threadId`.

* One thread per agent selection
* Stored **in memory** for local dev
* Abstracted so it can later move to Redis/Postgres

Location:

```
packages/backend/src/runner/threadStore.ts
```

---

### Transport (AG‑UI style)

Backend exposes:

```
POST /agui
```

Protocol:

* Server‑Sent Events (SSE)
* Events:

  * `run.started`
  * `message.delta`
  * `run.completed`
  * `run.error`

This mirrors AG‑UI semantics so CopilotKit or other agent UIs can be dropped in later.

---

## Frontend architecture

### Agent selection

* Agents are fetched from `GET /agents`
* Picker is data‑driven
* Changing agent **creates a new threadId**

### Chat

* Simple chat UI
* Sends `{ agentId, threadId, userText }`
* Streams responses via SSE

Frontend never calls agents directly.

---

## LLM provider abstraction

File:

```
packages/backend/src/llm/provider.ts
```

Supports:

* OpenAI (default)
* OpenRouter (OpenAI‑compatible)

Switch via env:

```bash
LLM_PROVIDER=openai | openrouter
LLM_MODEL=...
```

No agent code should reference OpenAI/OpenRouter directly.

---

## Environment variables (backend)

```bash
DATABASE_URL=postgres://...

LLM_PROVIDER=openai | openrouter
OPENAI_API_KEY=...
OPENROUTER_API_KEY=...
LLM_MODEL=gpt-5-mini   # example
```

---

## Rules for future changes (read this first)

### Adding a new agent

1. Create `agents/<agentName>Agent.ts`
2. Define tools + instructions
3. Register in `agentDefinitions`
4. Restart backend

Frontend updates automatically.

---

### Adding write capabilities (later)

Allowed:

* Domain‑specific tools (e.g. `engine_create`)
* Clear Zod schemas

Forbidden:

* Generic SQL write tools
* Letting read‑only agents write

---

### What NOT to do

* Do NOT let the model execute arbitrary SQL writes
* Do NOT bypass the registry
* Do NOT hardcode agents in UI
* Do NOT mix HTTP logic into agents

---

## Intended evolution path

Planned, but not yet implemented:

* Capability enforcement at tool execution
* Persistent thread storage
* CopilotKit UI swap‑in
* Domain write agents
* Auth (optional, later)

---

## Mental model for coding agents

Think of this project as:

> "A small agent operating system, not a chatbot."

Agents are sandboxed workers.
Tasks schedule them.
Capabilities constrain them.
Transport streams results.

If you follow those boundaries, the system scales cleanly.
