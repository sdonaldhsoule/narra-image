import type { ProviderMode } from "@/lib/types";

type ProviderConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

type ResolveGenerationProviderInput = {
  providerMode: ProviderMode;
  builtIn: ProviderConfig;
  custom: ProviderConfig | null;
};

export function resolveGenerationProvider({
  providerMode,
  builtIn,
  custom,
}: ResolveGenerationProviderInput) {
  if (providerMode === "built_in") {
    return {
      ...builtIn,
      providerMode,
    };
  }

  if (!custom?.apiKey.trim() || !custom.baseUrl.trim()) {
    throw new Error("自填渠道配置不完整");
  }

  return {
    ...custom,
    providerMode,
  };
}
