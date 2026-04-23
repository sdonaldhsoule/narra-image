import { requireAdminRecord } from "@/lib/server/current-user";
import { getErrorMessage, jsonError, jsonOk, parseJsonBody } from "@/lib/server/http";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminRecord();
    const { id } = await context.params;
    const body = (await parseJsonBody<{ isPublic: boolean }>(request)) as { isPublic: boolean };

    const batch = await db.inviteBatch.update({
      where: { id },
      data: {
        isPublic: Boolean(body.isPublic),
      },
      select: {
        id: true,
        isPublic: true,
      },
    });

    return jsonOk(batch);
  } catch (error) {
    return jsonError(getErrorMessage(error), 400);
  }
}
