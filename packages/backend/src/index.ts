import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { aguiHandler } from "./transport/agui/server";
import { listAgents } from "./agents/registry";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/agents", (_req, res) => {
  res.json(listAgents());
});

// AG-UI-like SSE endpoint
app.post("/agui", aguiHandler);
console.log("PORT", env.PORT);
app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
