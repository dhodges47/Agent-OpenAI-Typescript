import OpenAI from "openai";
import { Runner, setOpenAIAPI } from "@openai/agents";
import { OpenAIProvider } from "@openai/agents"; // OpenAIProvider is documented in the SDK API ref :contentReference[oaicite:4]{index=4}
import { env } from "../config/env";

type LlmProvider = "openai" | "openrouter";

const runnerCache = new Map<string, Runner>();

function runnerKey(provider: LlmProvider, model: string) {
  return `${provider}::${model}`;
}

function makeOpenAIClient(provider: LlmProvider) {
  if (provider === "openrouter") {
    return new OpenAI({
      apiKey: env.OPENROUTER_API_KEY!,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost",
        "X-Title": "adk-pg-demo",
      },
    });
  }

  return new OpenAI({ apiKey: env.OPENAI_API_KEY! });
}

export function getRunner(provider: LlmProvider, model: string) {
  const key = runnerKey(provider, model);
  const existing = runnerCache.get(key);
  if (existing) return existing;

  const client = makeOpenAIClient(provider);

  // OpenAI models like gpt-5.x require the Responses API; OpenRouter expects chat_completions.
  // The SDK supports switching which OpenAI API it uses. :contentReference[oaicite:5]{index=5}
  setOpenAIAPI(provider === "openai" ? "responses" : "chat_completions");

  const modelProvider = new OpenAIProvider({
    // docs + community examples use openAIClient here
    openAIClient: client,
  });

  const runner = new Runner({
    model,          // forces model for the run :contentReference[oaicite:6]{index=6}
    modelProvider,  // forces provider/client for the run :contentReference[oaicite:7]{index=7}
  });

  runnerCache.set(key, runner);
  return runner;
}
