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

type ChatStreamPayload = {
  content: string;
  created: number;
  generationId: string;
  id: string;
  model: string;
};

function createChatCompletionChunk(
  payload: ChatStreamPayload,
  delta: Record<string, string>,
  finishReason: "stop" | null,
) {
  return {
    choices: [
      {
        delta,
        finish_reason: finishReason,
        index: 0,
      },
    ],
    created: payload.created,
    generation_id: payload.generationId,
    id: payload.id,
    model: payload.model,
    object: "chat.completion.chunk",
  };
}

export function openAiChatStream(payload: ChatStreamPayload) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (value: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
      };

      send(createChatCompletionChunk(payload, { role: "assistant" }, null));
      send(createChatCompletionChunk(payload, { content: payload.content }, null));
      send(createChatCompletionChunk(payload, {}, "stop"));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
