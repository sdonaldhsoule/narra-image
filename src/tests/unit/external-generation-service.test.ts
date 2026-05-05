import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAssertApiRateLimit,
  mockCreateGenerationImageMany,
  mockCreateGenerationJob,
  mockFailGenerationJobAndRefund,
  mockFindGenerationJob,
  mockGenerateImages,
  mockGetActiveChannels,
  mockPersistGeneratedImage,
  mockTopLevelGenerationJobUpdate,
  mockTransaction,
  mockTxGenerationJobUpdate,
  mockUserUpdateMany,
} = vi.hoisted(() => ({
  mockAssertApiRateLimit: vi.fn(),
  mockCreateGenerationImageMany: vi.fn(),
  mockCreateGenerationJob: vi.fn(),
  mockFailGenerationJobAndRefund: vi.fn(),
  mockFindGenerationJob: vi.fn(),
  mockGenerateImages: vi.fn(),
  mockGetActiveChannels: vi.fn(),
  mockPersistGeneratedImage: vi.fn(),
  mockTopLevelGenerationJobUpdate: vi.fn(),
  mockTransaction: vi.fn(),
  mockTxGenerationJobUpdate: vi.fn(),
  mockUserUpdateMany: vi.fn(),
}));

vi.mock("@/lib/api-config", () => ({
  assertApiRateLimit: mockAssertApiRateLimit,
}));

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: mockTransaction,
    generationJob: {
      findUniqueOrThrow: mockFindGenerationJob,
      update: mockTopLevelGenerationJobUpdate,
    },
  },
}));

vi.mock("@/lib/generation/job-refund", () => ({
  failGenerationJobAndRefund: mockFailGenerationJobAndRefund,
}));

vi.mock("@/lib/providers/built-in-provider", () => ({
  getActiveChannels: mockGetActiveChannels,
}));

vi.mock("@/lib/providers/generate-images", () => ({
  generateImages: mockGenerateImages,
}));

vi.mock("@/lib/storage/persist-generated-image", () => ({
  persistGeneratedImage: mockPersistGeneratedImage,
}));

import { runExternalGeneration } from "@/lib/generation/external-api";

const tx = {
  generationImage: {
    createMany: mockCreateGenerationImageMany,
  },
  generationJob: {
    create: mockCreateGenerationJob,
    update: mockTxGenerationJobUpdate,
  },
  user: {
    updateMany: mockUserUpdateMany,
  },
};

describe("外部 API 生成服务", () => {
  beforeEach(() => {
    mockAssertApiRateLimit.mockReset();
    mockCreateGenerationImageMany.mockReset();
    mockCreateGenerationJob.mockReset();
    mockFailGenerationJobAndRefund.mockReset();
    mockFindGenerationJob.mockReset();
    mockGenerateImages.mockReset();
    mockGetActiveChannels.mockReset();
    mockPersistGeneratedImage.mockReset();
    mockTopLevelGenerationJobUpdate.mockReset();
    mockTransaction.mockReset();
    mockTxGenerationJobUpdate.mockReset();
    mockUserUpdateMany.mockReset();

    mockTransaction.mockImplementation((callback) => callback(tx));
    mockCreateGenerationJob.mockResolvedValue({
      id: "job_1",
      images: [],
    });
    mockUserUpdateMany.mockResolvedValue({ count: 1 });
    mockGenerateImages.mockResolvedValue([
      {
        actualHeight: 1024,
        actualWidth: 1024,
        url: "https://example.com/out.png",
      },
    ]);
    mockFindGenerationJob.mockResolvedValue({
      id: "job_1",
      images: [{ url: "https://example.com/out.png" }],
    });
    mockGetActiveChannels.mockResolvedValue([
      {
        apiKey: "first-key",
        baseUrl: "https://first.example/v1",
        creditCost: 5,
        defaultModel: "gpt-image-2",
        id: "channel_1",
        models: [],
        name: "默认渠道",
      },
      {
        apiKey: "second-key",
        baseUrl: "https://second.example/v1",
        creditCost: 7,
        defaultModel: "seedream",
        id: "channel_2",
        models: ["seedream-pro"],
        name: "备用渠道",
      },
    ]);
  });

  it("按请求模型匹配对应内置渠道", async () => {
    await runExternalGeneration({
      apiKeyId: "key_1",
      input: {
        count: 1,
        generationType: "text_to_image",
        model: "seedream-pro",
        moderation: "auto",
        outputFormat: "png",
        prompt: "测试提示词",
        quality: "auto",
        size: "auto",
      },
      user: { credits: 500, id: "user_1" },
    });

    expect(mockCreateGenerationJob).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          creditsSpent: 7,
          model: "seedream-pro",
        }),
      }),
    );
    expect(mockGenerateImages).toHaveBeenCalledWith(
      expect.objectContaining({
        builtInProvider: {
          apiKey: "second-key",
          baseUrl: "https://second.example/v1",
          model: "seedream",
        },
        model: "seedream-pro",
      }),
    );
  });

  it("积分不足时不保存参考图", async () => {
    mockUserUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      runExternalGeneration({
        apiKeyId: "key_1",
        input: {
          count: 1,
          generationType: "image_to_image",
          moderation: "auto",
          outputFormat: "png",
          prompt: "测试提示词",
          quality: "auto",
          size: "auto",
          sourceImages: [
            {
              data: Buffer.from([1, 2, 3]),
              fileName: "source.png",
              mimeType: "image/png",
            },
          ],
        },
        user: { credits: 0, id: "user_1" },
      }),
    ).rejects.toThrow("积分不足");

    expect(mockPersistGeneratedImage).not.toHaveBeenCalled();
    expect(mockGenerateImages).not.toHaveBeenCalled();
    expect(mockFailGenerationJobAndRefund).not.toHaveBeenCalled();
  });
});
