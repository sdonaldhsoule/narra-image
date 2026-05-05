import { NextResponse } from "next/server";

import { openAiError } from "@/lib/external-api/http";
import { getActiveChannels } from "@/lib/providers/built-in-provider";
import { requireApiUser } from "@/lib/server/api-auth";

export async function GET(request: Request) {
  try {
    await requireApiUser(request);
    const channels = await getActiveChannels();
    const modelIds = new Set<string>();
    for (const channel of channels) {
      modelIds.add(channel.defaultModel);
      channel.models.forEach((model) => modelIds.add(model));
    }

    return NextResponse.json({
      data: Array.from(modelIds).map((id) => ({
        id,
        object: "model",
        owned_by: "narra-image",
      })),
      object: "list",
    });
  } catch (error) {
    return openAiError(error);
  }
}
