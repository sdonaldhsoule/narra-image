import { randomBytes } from "node:crypto";

import { db } from "@/lib/db";
import { requireAdminRecord } from "@/lib/server/current-user";
import { getErrorMessage, jsonError, jsonOk, parseJsonBody } from "@/lib/server/http";
import { inviteCreateSchema } from "@/lib/validators";

function createInviteCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function GET() {
  try {
    await requireAdminRecord();

    const invites = await db.inviteCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usedBy: {
          select: {
            email: true,
            id: true,
          },
        },
      },
      take: 50,
    });

    return jsonOk({
      invites: invites.map((invite) => ({
        code: invite.code,
        createdAt: invite.createdAt.toISOString(),
        id: invite.id,
        note: invite.note,
        usedAt: invite.usedAt?.toISOString() ?? null,
        usedBy: invite.usedBy,
      })),
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 403);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminRecord();
    const body = inviteCreateSchema.parse(await parseJsonBody(request));

    const invite = await db.inviteCode.create({
      data: {
        code: createInviteCode(),
        createdById: admin.id,
        note: body.note || null,
      },
    });

    return jsonOk(
      {
        invite: {
          code: invite.code,
          createdAt: invite.createdAt.toISOString(),
          id: invite.id,
          note: invite.note,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(getErrorMessage(error), 400);
  }
}
