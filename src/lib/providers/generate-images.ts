import "server-only";

import OpenAI from "openai";

import { persistGeneratedImage } from "@/lib/storage/persist-generated-image";
import { getBuiltInProviderConfig } from "@/lib/providers/built-in-provider";
import { resolveGenerationProvider } from "@/lib/providers/resolve-provider";
import type { ProviderMode } from "@/lib/types";

type CustomProviderConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

type GenerateImagesInput = {
  count: number;
  customProvider: CustomProviderConfig | null;
  model: string;
  negativePrompt?: string | null;
  prompt: string;
  providerMode: ProviderMode;
  seed?: number | null;
  size: "1024x1024" | "1024x1536" | "1536x1024";
  userId: string;
};

export async function generateImages(input: GenerateImagesInput) {
  const builtInConfig = await getBuiltInProviderConfig();
  const provider = resolveGenerationProvider({
    builtIn: {
      apiKey: builtInConfig.apiKey,
      baseUrl: builtInConfig.baseUrl,
      model: builtInConfig.model,
    },
    custom: input.customProvider,
    providerMode: input.providerMode,
  });

  if (!provider.apiKey || !provider.baseUrl) {
    throw new Error("当前渠道未配置完成");
  }

  const client = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseUrl,
  });

  const result = await client.images.generate({
    model: input.model || provider.model,
    n: input.count,
    prompt: input.prompt,
    size: input.size,
    ...(input.negativePrompt || input.seed
      ? {
          extra_body: {
            negative_prompt: input.negativePrompt,
            seed: input.seed,
          },
        }
      : {}),
  });

  const items = result.data ?? [];

  if (items.length === 0) {
    throw new Error("渠道没有返回图片结果");
  }

  return Promise.all(
    items.map(async (item) => {
      if (item.url) {
        return persistGeneratedImage({
          url: item.url,
          userId: input.userId,
        });
      }

      if (item.b64_json) {
        return persistGeneratedImage({
          b64Json: item.b64_json,
          userId: input.userId,
        });
      }

      throw new Error("返回结果里没有可用图片");
    }),
  );
}
