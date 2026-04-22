import {
  looksLikeImageModel,
  prioritizeModelIds,
} from "@/lib/providers/model-catalog";

describe("模型列表整理", () => {
  it("会优先把更像生图模型的 id 排到前面", () => {
    expect(
      prioritizeModelIds([
        "gpt-4.1-mini",
        "gemini-3-pro-image-preview",
        "gpt-image-1",
        "gemini-2.5-flash",
      ]),
    ).toEqual([
      "gemini-3-pro-image-preview",
      "gpt-image-1",
      "gemini-2.5-flash",
      "gpt-4.1-mini",
    ]);
  });

  it("只把明显的图片模型判定为 imageLikely", () => {
    expect(looksLikeImageModel("gpt-image-1")).toBe(true);
    expect(looksLikeImageModel("gemini-3-pro-image-preview")).toBe(true);
    expect(looksLikeImageModel("gpt-4.1-mini")).toBe(false);
    expect(looksLikeImageModel("gemini-2.5-flash")).toBe(false);
  });
});
