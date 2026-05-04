import { db } from "@/lib/db";
import { serializeConversation } from "@/lib/prisma-mappers";
import { requireCurrentUserRecord } from "@/lib/server/current-user";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/server/http";

const MAX_TITLE_LENGTH = 80;

// 重命名会话；用于"会话首条 generation 的 prompt 截取"自动写回。
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireCurrentUserRecord();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { title?: unknown };
    const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
    if (!rawTitle) return jsonError("title 不能为空", 400);

    const existing = await db.conversation.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return jsonError("会话不存在", 404);

    const updated = await db.conversation.update({
      where: { id },
      data: { title: rawTitle.slice(0, MAX_TITLE_LENGTH) },
      include: {
        generations: { select: { id: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      },
    });
    return jsonOk({ conversation: serializeConversation(updated) });
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}

// 删除会话；级联策略：会话内 generation.conversationId 置 NULL，generation 本身保留。
// （在 prisma schema 通过 onDelete: SetNull 实现）
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireCurrentUserRecord();
    const { id } = await context.params;

    const existing = await db.conversation.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return jsonError("会话不存在", 404);

    await db.conversation.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}
