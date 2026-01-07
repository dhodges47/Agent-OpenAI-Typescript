import OpenAI from "openai";
import { env } from "../config/env";

export function getOpenAIClient() {
  switch (env.LLM_PROVIDER) {
    case "openrouter":
      return new OpenAI({
        apiKey: env.OPENROUTER_API_KEY!,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "http://localhost",
          "X-Title": "adk-pg-demo",
        },
      });

    case "ollama":
      return new OpenAI({
        apiKey: "ollama", // required but ignored
        baseURL: env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
      });

    case "openai":
    default:
      return new OpenAI({
        apiKey: env.OPENAI_API_KEY!,
      });
  }
}
