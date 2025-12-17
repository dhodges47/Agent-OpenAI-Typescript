import OpenAI from "openai";
import { env } from "../config/env";

export function getOpenAIClient() {
  if (env.LLM_PROVIDER === "openrouter") {
    // OpenRouter is OpenAI-compatible; typical base URL is /api/v1 :contentReference[oaicite:6]{index=6}
    return new OpenAI({
      apiKey: env.OPENROUTER_API_KEY!,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        // recommended by OpenRouter in many examples
        "HTTP-Referer": "http://localhost",
        "X-Title": "adk-pg-demo",
      },
    });
  }

  return new OpenAI({
    apiKey: env.OPENAI_API_KEY!,
  });
}
