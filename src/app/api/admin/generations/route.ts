import { db } from "@/lib/db";
import { serializeGeneration } from "@/lib/prisma-mappers";
import { requireAdminRecord } from "@/lib/server/current-user";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/server/http";

export async function GET() {
  try {
    await requireAdminRecord();

    const jobs = await db.generationJob.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          orderBy: { createdAt: "asc" },
        },
        user: {
          select: {
            email: true,
            id: true,
          },
        },
      },
      take: 60,
    });

    return jsonOk({
      generations: jobs.map((job) => ({
        ...serializeGeneration(job),
        user: job.user,
      })),
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 403);
  }
}
