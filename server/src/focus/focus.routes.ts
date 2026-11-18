import { Router } from "express";
import { identifier } from "@ellma/shared";
import { ownerOf } from "../platform/access.js";
import { endpoint } from "../platform/endpoint.js";
import * as service from "./focus.service.js";

export const focusRoutes = Router();

focusRoutes.get(
  "/",
  endpoint((_request, response) => service.focusState(ownerOf(response))),
);
focusRoutes.post(
  "/start",
  endpoint((request, response) => service.startFocus(ownerOf(response), request.body)),
);
focusRoutes.post(
  "/stop",
  endpoint((request, response) => service.stopFocus(ownerOf(response), request.body)),
);
focusRoutes.get(
  "/sessions",
  endpoint((request, response) => service.listSessions(ownerOf(response), request.query)),
);
focusRoutes.post(
  "/sessions",
  endpoint((request, response) => service.logSession(ownerOf(response), request.body)),
);
focusRoutes.delete(
  "/sessions/:id",
  endpoint((request, response) =>
    service.deleteSession(ownerOf(response), identifier.parse(request.params.id)),
  ),
);
