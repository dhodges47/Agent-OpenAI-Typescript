import "dotenv/config";
import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().default(8787),

  DATABASE_URL: z.string(),

  // LLM provider switch
  LLM_PROVIDER: z.enum(["ollama", "openai", "openrouter"]).default("ollama"),

  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().optional(),

  // model name is provider-specific; keep it configurable
  LLM_MODEL: z.string().default("gpt-5-mini"),
  LLM_MAX_TURNS: z.coerce.number().int().min(1).max(50).default(10),
  LLM_PROVIDER_OPTIONS: z.string().optional(),
  LLM_MODEL_OPTIONS: z.string().optional(),
});

export const env = Env.parse(process.env);
