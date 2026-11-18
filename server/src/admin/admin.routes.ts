import { Router } from "express";
import { identifier } from "@ellma/shared";
import { accountOf } from "../platform/access.js";
import { endpoint } from "../platform/endpoint.js";
import * as service from "./admin.service.js";

/** Mounted behind requireAccount(true): administrators and root only. */
export const adminRoutes = Router();

adminRoutes.get(
  "/overview",
  endpoint(() => service.overview()),
);
adminRoutes.get(
  "/users",
  endpoint((_request, response) => service.listUsers(accountOf(response))),
);
adminRoutes.patch(
  "/users/:id",
  endpoint((request, response) =>
    service.setRole(accountOf(response), identifier.parse(request.params.id), request.body),
  ),
);
adminRoutes.post(
  "/users/:id/reset-two-factor",
  endpoint((request, response) =>
    service.resetTwoFactor(accountOf(response), identifier.parse(request.params.id)),
  ),
);
adminRoutes.post(
  "/users/:id/recovery",
  endpoint((request, response) =>
    service.sendRecovery(accountOf(response), identifier.parse(request.params.id), request.body),
  ),
);
adminRoutes.delete(
  "/users/:id",
  endpoint((request, response) =>
    service.deleteUser(accountOf(response), identifier.parse(request.params.id)),
  ),
);
