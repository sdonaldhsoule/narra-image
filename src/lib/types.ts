export type ProviderMode = "built_in" | "custom";
export type GenerationType = "text_to_image" | "image_to_image";
export const generationSizeTokens = [
  "auto",
  "1:1",
  "3:4",
  "9:16",
  "4:3",
  "16:9",
] as const;

export type GenerationSizeToken = (typeof generationSizeTokens)[number];

export const legacyGenerationSizeMap = {
  "1024x1024": "1:1",
  "1024x1536": "3:4",
  "1536x1024": "4:3",
  "参考图": "auto",
} as const satisfies Record<string, GenerationSizeToken>;

export type UserRole = "user" | "admin";
