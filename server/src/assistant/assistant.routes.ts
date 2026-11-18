import { Router } from "express";
import type { AssistantStreamEvent } from "@ellma/shared";
import { ZodError } from "zod";
import { accountOf, ownerOf } from "../platform/access.js";
import { endpoint } from "../platform/endpoint.js";
import { EllmaError } from "../platform/errors.js";
import { AssistantUnavailable } from "./ollama.client.js";
import * as service from "./assistant.service.js";

export const assistantRoutes = Router();

assistantRoutes.get(
  "/messages",
  endpoint((_request, response) => service.listMessages(ownerOf(response))),
);
assistantRoutes.delete(
  "/messages",
  endpoint((_request, response) => service.clearMessages(ownerOf(response))),
);
assistantRoutes.post(
  "/daily",
  endpoint((request, response) => {
    const controller = new AbortController();
    response.on("close", () => controller.abort());
    return service
      .dailyNote(accountOf(response), request.body, controller.signal)
      .catch((error) => {
        throw error instanceof AssistantUnavailable
          ? new EllmaError(503, "assistant_unavailable")
          : error;
      });
  }),
);

assistantRoutes.post("/chat", (request, response) => {
  const controller = new AbortController();
  response.on("close", () => controller.abort());
  let streaming = false;
  const emit = (event: AssistantStreamEvent) => {
    if (!streaming) {
      streaming = true;
      response.status(200);
      response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      response.setHeader("Cache-Control", "no-store, no-transform");
      response.setHeader("X-Accel-Buffering", "no");
      response.flushHeaders();
    }
    response.write(`data: ${JSON.stringify(event)}\n\n`);
    // Yappio enables compression; flush so every token leaves immediately.
    (response as unknown as { flush?: () => void }).flush?.();
  };
  void service
    .chat(accountOf(response), request.body, emit, controller.signal)
    .catch((error: unknown) => {
      if (controller.signal.aborted) {
        return;
      }
      const code =
        error instanceof ZodError
          ? "invalid_input"
          : error instanceof EllmaError
            ? error.message
            : error instanceof AssistantUnavailable
              ? "assistant_unavailable"
              : "service_unavailable";
      if (!streaming) {
        const status =
          error instanceof ZodError ? 400 : error instanceof EllmaError ? error.status : 503;
        response.status(status).json({ success: false, error: code });
        return;
      }
      emit({ type: "error", code });
    })
    .finally(() => {
      if (streaming) {
        response.end();
      }
    });
});
