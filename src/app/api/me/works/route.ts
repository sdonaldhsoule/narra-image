import { getCurrentUserRecord } from "@/lib/server/current-user";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/server/http";
import { listUserWorksPage } from "@/lib/server/works";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUserRecord();
    if (!user) {
      return jsonError("未登录", 401);
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limitRaw = searchParams.get("limit");
    let limit: number | undefined;
    if (limitRaw !== null) {
      const parsed = Number(limitRaw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return jsonError("limit 参数无效", 400);
      }
      limit = parsed;
    }

    const page = await listUserWorksPage({
      userId: user.id,
      cursor,
      limit,
    });
    return jsonOk(page);
  } catch (error) {
    return jsonError(getErrorMessage(error), 500);
  }
}
