import { NextResponse } from "next/server";

import { runExternalGeneration } from "@/lib/generation/external-api";
import { openAiError, unixSeconds } from "@/lib/external-api/http";
import { requireApiUser } from "@/lib/server/api-auth";
import { parseJsonBody } from "@/lib/server/http";
import { externalImageGenerationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser(request);
    const body = externalImageGenerationSchema.parse(await parseJsonBody(request));
    if (body.responseFormat === "b64_json") {
      throw new Error("当前仅支持 response_format=url");
    }

    const job = await runExternalGeneration({
      apiKeyId: auth.apiKey.id,
      input: {
        count: body.count,
        generationType: "text_to_image",
        model: body.model,
        moderation: body.moderation,
        negativePrompt: body.negativePrompt,
        outputCompression: body.outputCompression,
        outputFormat: body.outputFormat,
        prompt: body.prompt,
        quality: body.quality,
        seed: body.seed,
        size: body.size,
      },
      user: auth.user,
    });

    return NextResponse.json({
      created: unixSeconds(job.createdAt),
      data: job.images.map((image) => ({
        height: image.height,
        url: image.url,
        width: image.width,
      })),
      generation_id: job.id,
    });
  } catch (error) {
    return openAiError(error);
  }
}
