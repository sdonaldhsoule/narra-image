import { getApiConfig, serializeApiConfig, updateApiConfig } from "@/lib/api-config";
import { requireAdminRecord } from "@/lib/server/current-user";
import { getErrorMessage, jsonError, jsonOk, parseJsonBody } from "@/lib/server/http";
import { apiConfigUpdateSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdminRecord();
    const config = await getApiConfig();
    return jsonOk({ config: serializeApiConfig(config) });
  } catch (error) {
    return jsonError(getErrorMessage(error), 403);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminRecord();
    const body = apiConfigUpdateSchema.parse(await parseJsonBody(request));
    const config = await updateApiConfig(body);
    return jsonOk({ config: serializeApiConfig(config) });
  } catch (error) {
    return jsonError(getErrorMessage(error), 400);
  }
}
