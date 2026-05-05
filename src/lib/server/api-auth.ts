import "server-only";

import { db } from "@/lib/db";
import { ApiAuthError } from "@/lib/api-errors";
import { hashApiKey } from "@/lib/api-keys";
import { fromPrismaRole } from "@/lib/prisma-mappers";

function readBearerToken(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function requireApiUser(request: Request) {
  const token = readBearerToken(request);
  if (!token) {
    throw new ApiAuthError("缺少 Authorization: Bearer API_KEY");
  }

  const apiKey = await db.apiKey.findUnique({
    where: {
      keyHash: hashApiKey(token),
    },
    include: {
      user: {
        select: {
          avatarUrl: true,
          credits: true,
          email: true,
          id: true,
          nickname: true,
          role: true,
        },
      },
    },
  });

  if (!apiKey || apiKey.revokedAt) {
    throw new ApiAuthError("API Key 无效或已停用");
  }

  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    apiKey: {
      id: apiKey.id,
      keyPrefix: apiKey.keyPrefix,
      name: apiKey.name,
    },
    user: {
      ...apiKey.user,
      role: fromPrismaRole(apiKey.user.role),
    },
  };
}
