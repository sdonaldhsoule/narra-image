import { createInviteClaimService } from "@/lib/invites/claim-invite";
import { claimInviteFromBatch } from "@/lib/invites/claim-invite.server";
import { getErrorMessage, jsonError, jsonOk } from "@/lib/server/http";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const service = createInviteClaimService({
      assignInvite: claimInviteFromBatch,
    });
    const result = await service.claim(id);

    return jsonOk(result);
  } catch (error) {
    return jsonError(getErrorMessage(error), 400);
  }
}
