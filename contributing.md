# Contributing Guide

This document explains **how to work in this repository without breaking its agent-oriented architecture**.

It is written for:

* human contributors
* AI coding agents (VS Code, Copilot, etc.)

If you are new, **read `agent.md` first**. This file focuses on *how* to change things safely.

---

## Core principles (non‑negotiable)

1. **Agents are isolated workers**

   * Agents do not know about HTTP, Express, or the UI
   * Agents only communicate via tools and instructions

2. **The registry is the source of truth**

   * Agents must be registered once
   * Frontend must never hardcode agent IDs

3. **Capabilities describe permission boundaries**

   * Capabilities are not cosmetic
   * Adding a capability is a design decision

4. **No generic database writes**

   * Read-only SQL is allowed
   * Writes must be domain-specific tools only

---

## Local development workflow

### Prerequisites

* Node.js (LTS)
* pnpm
* Local Postgres instance

### Start everything

From the repo root:

```bash
pnpm install
pnpm -r dev
```

* Backend: [http://localhost:8787](http://localhost:8787)
* Frontend: Vite dev server (usually [http://localhost:5173](http://localhost:5173))

---

## Backend contribution guidelines

### Where to put things

| Concern            | Location                          |
| ------------------ | --------------------------------- |
| Agent logic        | `packages/backend/src/agents/`    |
| Agent metadata     | `agents/registry.ts`              |
| Tools              | Inside agent files                |
| Task orchestration | `packages/backend/src/tasks/`     |
| Thread handling    | `packages/backend/src/runner/`    |
| HTTP / transport   | `packages/backend/src/transport/` |

---

### Adding a new agent

1. Create an agent factory:

   ```
   packages/backend/src/agents/<name>Agent.ts
   ```

2. Define:

   * instructions
   * tools
   * safety constraints

3. Register the agent in:

   ```
   agents/registry.ts
   ```

4. Restart the backend

The frontend will auto‑discover the agent via `GET /agents`.

---

### Adding tools

Rules for tools:

* Tools must have **clear, narrow intent**
* Tools must validate input with **Zod**
* Tools must fail fast on invalid or unsafe input

#### Allowed

* `pg_readonly_query`
* `pg_introspect_schema`
* Domain-specific write tools (later)

#### Forbidden

* Generic `execute_sql`
* Write tools that accept raw SQL strings

---

### Database rules

* Reads: allowed via read-only tools
* Writes: **domain tools only** (future)
* Always enforce LIMITs
* Never trust model-generated SQL blindly

---

### Threading rules

* Each chat session uses a `threadId`
* Thread storage is currently in-memory
* Do not bake persistence assumptions into agents

---

## Frontend contribution guidelines

### Responsibilities

The frontend is responsible for:

* agent selection
* thread lifecycle (reset on agent change)
* rendering streamed output

The frontend must **not**:

* implement agent logic
* decide which tools run
* embed business rules

---

### Agent picker

* Always populated from `GET /agents`
* Must display name, description, and capabilities
* Must reset thread on agent change

---

### Chat UI

* Treat agent output as streamed text
* Do not assume message completeness until `run.completed`
* Errors must be surfaced visibly

---

## Style and code quality

### TypeScript

* Prefer explicit types over inference at boundaries
* Use `zod` for runtime validation
* Avoid `any` except at SDK boundaries

### Errors

* Fail fast
* Return useful error messages
* Do not swallow exceptions silently

---

## Making architectural changes

Before making large changes, ask:

1. Does this blur agent boundaries?
2. Does this weaken capability enforcement?
3. Does this make future write agents less safe?

If yes, stop and redesign.

---

## What this project is NOT

* Not a generic chatbot
* Not a SQL console
* Not a free-form automation runner

It is an **agent platform with explicit constraints**.

---

## If you are an AI coding agent

Read these files in order:

1. `agent.md`
2. `CONTRIBUTING.md`
3. Relevant source files

Follow the documented constraints exactly.
