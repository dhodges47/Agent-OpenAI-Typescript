import "dotenv/config";
import { z } from "zod";

const Env = z.object({
  PORT: z.coerce.number().default(8787),

  DATABASE_URL: z.string(),

  // LLM provider switch
  LLM_PROVIDER: z.enum(["openai", "openrouter"]).default("openai"),

  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),

  // model name is provider-specific; keep it configurable
  LLM_MODEL: z.string().default("gpt-5-mini"),
});

export const env = Env.parse(process.env);
