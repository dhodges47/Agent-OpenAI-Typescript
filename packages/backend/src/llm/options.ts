import { env } from "../config/env";

type LlmSelection = {
  provider?: string;
  model?: string;
};

type ModelsByProvider = Record<string, string[]>;

function parseList(value?: string) {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function uniqueList(values: string[]) {
  return Array.from(new Set(values));
}

function parseModelOptions(values: string[]) {
  const byProvider: ModelsByProvider = {};
  const unscoped: string[] = [];

  values.forEach((item) => {
    const separatorIndex = item.indexOf(":");
    if (separatorIndex > 0) {
      const provider = item.slice(0, separatorIndex).trim();
      const model = item.slice(separatorIndex + 1).trim();
      if (!provider || !model) {
        unscoped.push(item);
        return;
      }
      if (!byProvider[provider]) {
        byProvider[provider] = [];
      }
      byProvider[provider].push(model);
      return;
    }
    unscoped.push(item);
  });

  return { byProvider, unscoped };
}

export function getLlmOptions() {
  const providerOptions = parseList(env.LLM_PROVIDER_OPTIONS);
  const modelOptions = parseList(env.LLM_MODEL_OPTIONS);
  const { byProvider, unscoped } = parseModelOptions(modelOptions);
  const providers = uniqueList([
    ...(providerOptions.length ? providerOptions : ["openai", "openrouter", "ollama"]),
    env.LLM_PROVIDER,
  ]);
  const models = uniqueList([
    ...unscoped,
    ...Object.values(byProvider).flat(),
    env.LLM_MODEL,
  ]);
  const modelsByProvider: ModelsByProvider = {};
  providers.forEach((provider) => {
    const scopedModels = byProvider[provider] ?? [];
    let providerModels = uniqueList([...unscoped, ...scopedModels]);
    if (!providerModels.length) {
      providerModels = [env.LLM_MODEL];
    }
    if (provider === env.LLM_PROVIDER && !providerModels.includes(env.LLM_MODEL)) {
      providerModels = uniqueList([...providerModels, env.LLM_MODEL]);
    }
    modelsByProvider[provider] = providerModels;
  });

  return {
    provider: env.LLM_PROVIDER,
    model: env.LLM_MODEL,
    providers,
    models,
    modelsByProvider,
  };
}

export function resolveLlmSelection(selection?: LlmSelection) {
  const options = getLlmOptions();
  const provider = selection?.provider && options.providers.includes(selection.provider)
    ? selection.provider
    : options.provider;
  const providerModels = options.modelsByProvider?.[provider] ?? options.models;
  const model = selection?.model && providerModels.includes(selection.model)
    ? selection.model
    : providerModels[0] ?? options.model;

  return { provider, model };
}
