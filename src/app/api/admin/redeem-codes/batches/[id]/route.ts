import { db } from "@/lib/db";
import { requireAdminRecord } from "@/lib/server/current-user";
import { getErrorMessage, jsonError, jsonOk, parseJsonBody } from "@/lib/server/http";
import { redeemCodeToggleSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminRecord();
    const { id } = await context.params;
    const body = redeemCodeToggleSchema.parse(await parseJsonBody(request));

    const batch = await db.redeemCodeBatch.update({
      where: { id },
      data: {
        isActive: body.isActive,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    return jsonOk(batch);
  } catch (error) {
    return jsonError(getErrorMessage(error), 400);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminRecord();
    const { id } = await context.params;

    const batch = await db.redeemCodeBatch.findUnique({
      where: { id },
      select: { _count: { select: { codes: true } } },
    });
    if (!batch) {
      return jsonError("批次不存在", 404);
    }

    // RedeemCode 与 RedeemRedemption 都是 onDelete: Cascade，删除批次会级联清理
    await db.redeemCodeBatch.delete({ where: { id } });

    return jsonOk({
      deletedCount: batch._count.codes,
      message: `已删除批次及其 ${batch._count.codes} 个兑换码`,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 400);
  }
}
