import { db } from "@/lib/db";
import { requireAdminRecord } from "@/lib/server/current-user";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/server/http";
import { fromPrismaRole } from "@/lib/prisma-mappers";

export async function GET() {
  try {
    await requireAdminRecord();

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        _count: {
          select: {
            generations: true,
          },
        },
        createdAt: true,
        credits: true,
        email: true,
        id: true,
        role: true,
      },
      take: 100,
    });

    return jsonOk({
      users: users.map((user) => ({
        createdAt: user.createdAt.toISOString(),
        credits: user.credits,
        email: user.email,
        generationCount: user._count.generations,
        id: user.id,
        role: fromPrismaRole(user.role),
      })),
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 403);
  }
}
