import { db } from "@/lib/db";
import { serializeConversation } from "@/lib/prisma-mappers";
import { requireCurrentUserRecord } from "@/lib/server/current-user";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/server/http";

const MAX_TITLE_LENGTH = 80;
const MAX_CONVERSATIONS_PER_USER = 100;

// 列出当前用户的会话，按创建时间倒序，附带每条会话内 generation id 列表（仅 id，避免一次性把图片全拉出来）。
export async function GET() {
  try {
    const user = await requireCurrentUserRecord();
    const conversations = await db.conversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        generations: {
          select: { id: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
      take: MAX_CONVERSATIONS_PER_USER,
    });

    return jsonOk({
      conversations: conversations.map(serializeConversation),
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}

// 创建新会话。仅写入 title（可选）；title 缺省由数据库默认值"新对话"承担。
export async function POST(request: Request) {
  try {
    const user = await requireCurrentUserRecord();
    const body = (await request.json().catch(() => ({}))) as { title?: unknown };
    const rawTitle = typeof body.title === "string" ? body.title.trim() : "";
    const title = rawTitle ? rawTitle.slice(0, MAX_TITLE_LENGTH) : undefined;

    const conversation = await db.conversation.create({
      data: {
        userId: user.id,
        ...(title ? { title } : {}),
      },
      include: {
        generations: { select: { id: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      },
    });

    return jsonOk({ conversation: serializeConversation(conversation) });
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}
