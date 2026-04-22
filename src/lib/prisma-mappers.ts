import {
  GenerationStatus,
  ProviderMode,
  Role,
  type GenerationImage,
  type GenerationJob,
  type User,
} from "@prisma/client";

import type { ProviderMode as UiProviderMode, UserRole } from "@/lib/types";

export type SerializedGeneration = {
  count: number;
  createdAt: string;
  creditsSpent: number;
  errorMessage: string | null;
  featuredAt: string | null;
  id: string;
  images: Array<{
    id: string;
    url: string;
  }>;
  model: string;
  negativePrompt: string | null;
  prompt: string;
  providerMode: UiProviderMode;
  size: string;
  status: "pending" | "succeeded" | "failed";
  updatedAt: string;
};

export function toPrismaProviderMode(providerMode: UiProviderMode) {
  return providerMode === "built_in"
    ? ProviderMode.BUILT_IN
    : ProviderMode.CUSTOM;
}

export function fromPrismaProviderMode(providerMode: ProviderMode): UiProviderMode {
  return providerMode === ProviderMode.BUILT_IN ? "built_in" : "custom";
}

export function fromPrismaRole(role: Role): UserRole {
  return role === Role.ADMIN ? "admin" : "user";
}

export function serializeUser(user: Pick<User, "id" | "email" | "role" | "credits">) {
  return {
    credits: user.credits,
    email: user.email,
    id: user.id,
    role: fromPrismaRole(user.role),
  };
}

export function serializeGeneration(
  job: GenerationJob & { images: GenerationImage[] },
): SerializedGeneration {
  return {
    count: job.count,
    createdAt: job.createdAt.toISOString(),
    creditsSpent: job.creditsSpent,
    errorMessage: job.errorMessage,
    featuredAt: job.featuredAt?.toISOString() ?? null,
    id: job.id,
    images: job.images.map((image) => ({
      id: image.id,
      url: image.url,
    })),
    model: job.model,
    negativePrompt: job.negativePrompt,
    prompt: job.prompt,
    providerMode: fromPrismaProviderMode(job.providerMode),
    size: job.size,
    status:
      job.status === GenerationStatus.SUCCEEDED
        ? "succeeded"
        : job.status === GenerationStatus.FAILED
          ? "failed"
          : "pending",
    updatedAt: job.updatedAt.toISOString(),
  };
}
