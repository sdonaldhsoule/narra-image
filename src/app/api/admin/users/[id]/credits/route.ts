import { db } from "@/lib/db";
import { requireAdminRecord } from "@/lib/server/current-user";
import { getErrorMessage, jsonError, jsonOk, parseJsonBody } from "@/lib/server/http";
import { creditUpdateSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminRecord();
    const body = creditUpdateSchema.parse(await parseJsonBody(request));
    const { id } = await context.params;

    const updatedUser = await db.user.update({
      where: { id },
      data: {
        credits: {
          increment: body.amount,
        },
      },
      select: {
        credits: true,
        email: true,
        id: true,
      },
    });

    return jsonOk({
      user: updatedUser,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 400);
  }
}
