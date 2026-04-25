import { GenerationStatus, ShowcaseStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    generationImage: {
      findMany: mockFindMany,
    },
  },
}));

import { listFeaturedWorksPage } from "@/lib/server/works";

function createFeaturedRecord(id: string, featuredAt: string) {
  return {
    createdAt: new Date("2026-04-23T08:00:00.000Z"),
    featuredAt: new Date(featuredAt),
    id,
    job: {
      createdAt: new Date("2026-04-23T07:00:00.000Z"),
      id: `job_${id}`,
      model: "gpt-image-1",
      negativePrompt: null,
      prompt: `prompt-${id}`,
      size: "1024x1024",
      status: GenerationStatus.SUCCEEDED,
      user: {
        avatarUrl: null,
        id: `user_${id}`,
        nickname: `作者-${id}`,
      },
      userId: `user_${id}`,
    },
    jobId: `job_${id}`,
    reviewNote: null,
    reviewedAt: null,
    reviewedBy: null,
    reviewedById: null,
    showcaseStatus: ShowcaseStatus.FEATURED,
    showPromptPublic: true,
    submittedAt: new Date("2026-04-23T08:30:00.000Z"),
    url: `https://example.com/${id}.png`,
  };
}

describe("首页精选分页查询", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("首屏查询限制为 24 条，并且只在最近 100 条精选内翻页", async () => {
    mockFindMany
      .mockResolvedValueOnce(
        Array.from({ length: 100 }, (_, index) =>
          createFeaturedRecord(
            `work_${String(index + 1).padStart(3, "0")}`,
            `2026-04-${String(24 - Math.floor(index / 4)).padStart(2, "0")}T12:00:00.000Z`,
          ),
        ),
      )
      .mockResolvedValueOnce([]);

    await listFeaturedWorksPage();

    expect(mockFindMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        orderBy: [{ featuredAt: "desc" }, { id: "desc" }],
        take: 100,
        where: {
          featuredAt: {
            not: null,
          },
          showcaseStatus: ShowcaseStatus.FEATURED,
        },
      }),
    );
  });

  it("带 cursor 时按 featuredAt desc, id desc 继续取下一页", async () => {
    mockFindMany
      .mockResolvedValueOnce([
        createFeaturedRecord("work_110", "2026-04-25T10:00:00.000Z"),
        createFeaturedRecord("work_109", "2026-04-25T10:00:00.000Z"),
        createFeaturedRecord("work_108", "2026-04-24T10:00:00.000Z"),
      ])
      .mockResolvedValueOnce([
        createFeaturedRecord("work_108", "2026-04-24T10:00:00.000Z"),
      ]);

    const result = await listFeaturedWorksPage({
      cursor: Buffer.from(
        JSON.stringify({
          featuredAt: "2026-04-25T10:00:00.000Z",
          id: "work_109",
        }),
      ).toString("base64url"),
      limit: 24,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("work_108");
    expect(result.hasMore).toBe(false);
  });
});
