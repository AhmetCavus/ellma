import { Router } from "express";
import { accountOf } from "../platform/access.js";
import { endpoint } from "../platform/endpoint.js";
import { clientAddress } from "../platform/rateLimit.js";
import * as service from "./account.service.js";

/** Reachable without a session: signing in and recovering a forgotten password. */
export const accountPublicRoutes = Router();

accountPublicRoutes.post(
  "/login",
  endpoint((request) => service.login(request.body, clientAddress(request))),
);
accountPublicRoutes.get(
  "/options",
  endpoint(async () => service.accountOptions()),
);
accountPublicRoutes.post(
  "/recovery",
  endpoint((request) => service.requestRecovery(request.body, clientAddress(request))),
);
accountPublicRoutes.post(
  "/recovery/reset",
  endpoint((request) => service.resetPassword(request.body, clientAddress(request))),
);

/** The signed-in person's own account. */
export const accountRoutes = Router();

accountRoutes.get(
  "/",
  endpoint((_request, response) => service.accountInfo(accountOf(response))),
);
accountRoutes.post(
  "/password",
  endpoint((request, response) => service.changePassword(accountOf(response), request.body)),
);
accountRoutes.post(
  "/two-factor/setup",
  endpoint((request, response) => service.setupTwoFactor(accountOf(response), request.body)),
);
accountRoutes.post(
  "/two-factor/enable",
  endpoint((request, response) => service.enableTwoFactor(accountOf(response), request.body)),
);
accountRoutes.post(
  "/two-factor/disable",
  endpoint((request, response) => service.disableTwoFactor(accountOf(response), request.body)),
);
