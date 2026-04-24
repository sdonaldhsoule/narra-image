import { getChannelsForAdmin } from "@/lib/providers/built-in-provider";
import { requireAdminRecord } from "@/lib/server/current-user";
import {
  getErrorMessage,
  jsonError,
  jsonOk,
} from "@/lib/server/http";

/**
 * GET /api/admin/provider-config — backwards compat, returns channels list
 */
export async function GET() {
  try {
    await requireAdminRecord();
    const channels = await getChannelsForAdmin();
    // Return first channel as the "providerConfig" for backwards compat
    const first = channels[0];
    return jsonOk({
      providerConfig: first
        ? {
            apiKeyConfigured: first.apiKeyConfigured,
            baseUrl: first.baseUrl,
            creditCost: first.creditCost,
            model: first.defaultModel,
            models: first.models,
            name: first.name,
            source: "database" as const,
          }
        : null,
      channels,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 403);
  }
}

/**
 * PATCH — deprecated, use /api/admin/channels instead.
 */
export async function PATCH() {
  return jsonError("此接口已废弃，请使用 /api/admin/channels 管理渠道", 410);
}
