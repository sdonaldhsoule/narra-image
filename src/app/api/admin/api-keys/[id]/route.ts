import { db } from "@/lib/db";
import { serializeApiKey } from "@/lib/api-keys";
import { requireAdminRecord } from "@/lib/server/current-user";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/server/http";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminRecord();
    const { id } = await context.params;
    const apiKey = await db.apiKey.findUnique({ where: { id } });

    if (!apiKey) {
      return jsonError("API Key 不存在", 404);
    }

    const updated = await db.apiKey.update({
      where: { id },
      data: {
        revokedAt: apiKey.revokedAt ?? new Date(),
      },
    });

    return jsonOk({
      apiKey: serializeApiKey(updated),
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 400);
  }
}
