import type { Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import { EllmaError } from "./errors.js";

export function endpoint(
  action: (request: Request, response: Response) => Promise<unknown>,
): RequestHandler {
  return (request, response) => {
    void Promise.resolve()
      .then(() => action(request, response))
      .then((data) => {
        response.json({ success: true, data });
      })
      .catch((error: unknown) => {
        if (error instanceof ZodError) {
          response
            .status(400)
            .json({ success: false, error: "invalid_input", fields: error.flatten() });
          return;
        }
        if (error instanceof EllmaError) {
          response.status(error.status).json({ success: false, error: error.message });
          return;
        }
        if (error instanceof Error && error.name === "CastError") {
          response.status(404).json({ success: false, error: "not_found" });
          return;
        }
        console.error(
          "Ellma operation failed",
          error instanceof Error ? `${error.name}: ${error.message}` : "unknown",
        );
        response.status(503).json({ success: false, error: "service_unavailable" });
      });
  };
}
