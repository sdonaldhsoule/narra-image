import "server-only";

import { GenerationClientSource, GenerationStatus } from "@prisma/client";

import { calculateGenerationCost } from "@/lib/credits";
import { db } from "@/lib/db";
import { assertApiRateLimit } from "@/lib/api-config";
import { persistGeneratedImage } from "@/lib/storage/persist-generated-image";
import { failGenerationJobAndRefund } from "@/lib/generation/job-refund";
import { generateImages } from "@/lib/providers/generate-images";
import {
  getActiveChannels,
  type ResolvedChannel,
} from "@/lib/providers/built-in-provider";
import type {
  GenerationModeration,
  GenerationOutputFormat,
  GenerationQuality,
  GenerationSizeToken,
  GenerationType,
} from "@/lib/types";

export type ExternalGenerationRequest = {
  count: number;
  generationType: GenerationType;
  model?: string | null;
  moderation: GenerationModeration;
  negativePrompt?: string | null;
  outputCompression?: number | null;
  outputFormat: GenerationOutputFormat;
  prompt: string;
  quality: GenerationQuality;
  seed?: number | null;
  size: GenerationSizeToken;
  sourceImages?: Array<{
    data: Buffer;
    fileName: string;
    mimeType: string;
  }>;
};

type ExternalGenerationUser = {
  credits: number;
  id: string;
};

type RunExternalGenerationInput = {
  apiKeyId: string;
  input: ExternalGenerationRequest;
  user: ExternalGenerationUser;
};

async function resolveApiChannel(model?: string | null): Promise<ResolvedChannel> {
  const channels = await getActiveChannels();
  if (channels.length === 0) {
    throw new Error("当前没有可用的内置渠道");
  }

  if (!model) {
    return channels[0];
  }

  const matched = channels.find((channel) =>
    channel.defaultModel === model || channel.models.includes(model),
  );
  if (!matched) {
    throw new Error("模型不可用，请先通过 /v1/models 查看可用模型");
  }

  return matched;
}

export async function runExternalGeneration({
  apiKeyId,
  input,
  user,
}: RunExternalGenerationInput) {
  let jobId: string | null = null;
  await assertApiRateLimit(apiKeyId);

  const builtInProvider = await resolveApiChannel(input.model);
  const cost = calculateGenerationCost({
    builtInCreditCost: builtInProvider.creditCost,
    providerMode: "built_in",
  });
  const sourceImages = input.sourceImages ?? [];
  const model = input.model || builtInProvider.defaultModel;
  const count = input.generationType === "image_to_image" ? 1 : input.count;

  try {
    const job = await db.$transaction(async (tx) => {
      const created = await tx.generationJob.create({
        data: {
          apiKeyId,
          clientSource: GenerationClientSource.API,
          count,
          creditsSpent: cost,
          generationType:
            input.generationType === "image_to_image"
              ? "IMAGE_TO_IMAGE"
              : "TEXT_TO_IMAGE",
          model,
          negativePrompt: input.negativePrompt ?? null,
          outputCompression: input.outputCompression ?? null,
          outputFormat: input.outputFormat,
          prompt: input.prompt,
          providerMode: "BUILT_IN",
          quality: input.quality,
          moderation: input.moderation,
          size: input.size,
          sourceImageUrls: [],
          status: GenerationStatus.PENDING,
          userId: user.id,
        },
        include: { images: true },
      });

      if (cost > 0) {
        const charged = await tx.user.updateMany({
          where: {
            credits: {
              gte: cost,
            },
            id: user.id,
          },
          data: {
            credits: {
              decrement: cost,
            },
          },
        });

        if (charged.count === 0) {
          throw new Error("积分不足，请联系管理员补充");
        }
      }

      return created;
    });
    jobId = job.id;

    const sourceImageUrls = await Promise.all(
      sourceImages.map((sourceImage) =>
        persistGeneratedImage({
          buffer: sourceImage.data,
          fileExtension: sourceImage.fileName.split(".").pop() || "png",
          mimeType: sourceImage.mimeType,
          userId: user.id,
        }),
      ),
    );
    if (sourceImageUrls.length > 0) {
      await db.generationJob.update({
        where: { id: job.id },
        data: { sourceImageUrls },
      });
    }

    const images = await generateImages({
      builtInProvider: {
        apiKey: builtInProvider.apiKey,
        baseUrl: builtInProvider.baseUrl,
        model: builtInProvider.defaultModel,
      },
      count,
      customProvider: null,
      generationType: input.generationType,
      model,
      moderation: input.moderation,
      negativePrompt: input.negativePrompt ?? null,
      outputCompression: input.outputCompression ?? null,
      outputFormat: input.outputFormat,
      prompt: input.prompt,
      providerMode: "built_in",
      quality: input.quality,
      seed: input.seed ?? null,
      size: input.size,
      sourceImages,
      userId: user.id,
    });

    await db.$transaction(async (tx) => {
      await tx.generationImage.createMany({
        data: images.map((image) => ({
          height: image.actualHeight,
          jobId: job.id,
          url: image.url,
          width: image.actualWidth,
        })),
      });

      await tx.generationJob.update({
        where: { id: job.id },
        data: {
          status: GenerationStatus.SUCCEEDED,
        },
      });
    });

    const completed = await db.generationJob.findUniqueOrThrow({
      where: { id: job.id },
      include: {
        images: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return completed;
  } catch (error) {
    if (jobId) {
      await failGenerationJobAndRefund({
        errorMessage: error instanceof Error ? error.message : "生成失败",
        jobId,
      });
    }
    throw error;
  }
}
