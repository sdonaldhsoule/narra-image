import { db } from "@/lib/db";
import {
  createApiKeySecret,
  getApiKeyPrefix,
  hashApiKey,
  serializeApiKey,
} from "@/lib/api-keys";
import { requireCurrentUserRecord } from "@/lib/server/current-user";
import { getErrorMessage, jsonError, jsonOk, parseJsonBody } from "@/lib/server/http";
import { apiKeyCreateSchema } from "@/lib/validators";

export async function GET() {
  try {
    const user = await requireCurrentUserRecord();
    const apiKeys = await db.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      apiKeys: apiKeys.map(serializeApiKey),
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUserRecord();
    const body = apiKeyCreateSchema.parse(await parseJsonBody(request));
    const secret = createApiKeySecret();
    const apiKey = await db.apiKey.create({
      data: {
        keyHash: hashApiKey(secret),
        keyPrefix: getApiKeyPrefix(secret),
        name: body.name,
        userId: user.id,
      },
    });

    return jsonOk({
      apiKey: serializeApiKey(apiKey),
      secret,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 400);
  }
}
