import { NextResponse } from "next/server";

import { ApiAuthError, ApiRateLimitError } from "@/lib/api-errors";
import { getErrorMessage } from "@/lib/server/http";

export function openAiError(error: unknown) {
  const status =
    error instanceof ApiAuthError || error instanceof ApiRateLimitError
      ? error.status
      : 400;
  const isAuthError = error instanceof ApiAuthError;
  const isRateLimitError = error instanceof ApiRateLimitError;
  const message = getErrorMessage(error);

  return NextResponse.json(
    {
      error: {
        code: isRateLimitError
          ? "rate_limit_exceeded"
          : isAuthError
            ? "invalid_api_key"
            : "invalid_request_error",
        message,
        type: isRateLimitError
          ? "rate_limit_error"
          : isAuthError
            ? "authentication_error"
            : "invalid_request_error",
      },
    },
    { status },
  );
}

export function unixSeconds(date = new Date()) {
  return Math.floor(date.getTime() / 1000);
}
