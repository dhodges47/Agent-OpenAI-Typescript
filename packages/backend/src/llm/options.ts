import { env } from "../config/env";

type LlmSelection = {
  provider?: string;
  model?: string;
};

function parseList(value?: string) {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function uniqueList(values: string[]) {
  return Array.from(new Set(values));
}

export function getLlmOptions() {
  const providerOptions = parseList(env.LLM_PROVIDER_OPTIONS);
  const modelOptions = parseList(env.LLM_MODEL_OPTIONS);
  const providers = uniqueList([
    ...(providerOptions.length ? providerOptions : ["openai", "openrouter", "ollama"]),
    env.LLM_PROVIDER,
  ]);
  const models = uniqueList([...(modelOptions.length ? modelOptions : [env.LLM_MODEL]), env.LLM_MODEL]);

  return {
    provider: env.LLM_PROVIDER,
    model: env.LLM_MODEL,
    providers,
    models,
  };
}

export function resolveLlmSelection(selection?: LlmSelection) {
  const options = getLlmOptions();
  const provider = selection?.provider && options.providers.includes(selection.provider)
    ? selection.provider
    : options.provider;
  const model = selection?.model && options.models.includes(selection.model)
    ? selection.model
    : options.model;

  return { provider, model };
}
