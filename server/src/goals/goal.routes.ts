import { Router } from "express";
import { z } from "zod";
import { identifier } from "@ellma/shared";
import { ownerOf } from "../platform/access.js";
import { endpoint } from "../platform/endpoint.js";
import * as service from "./goal.service.js";

export const goalRoutes = Router();

goalRoutes.get(
  "/",
  endpoint((_request, response) => service.listGoals(ownerOf(response))),
);
goalRoutes.get(
  "/totals",
  endpoint((_request, response) => service.goalTotals(ownerOf(response))),
);
goalRoutes.post(
  "/",
  endpoint((request, response) => service.createGoal(ownerOf(response), request.body)),
);
goalRoutes.post(
  "/order",
  endpoint((request, response) =>
    service.reorderGoals(
      ownerOf(response),
      z.object({ ids: z.array(identifier).max(500) }).parse(request.body).ids,
    ),
  ),
);
goalRoutes.put(
  "/:id",
  endpoint((request, response) =>
    service.updateGoal(ownerOf(response), identifier.parse(request.params.id), request.body),
  ),
);
goalRoutes.delete(
  "/:id",
  endpoint((request, response) =>
    service.deleteGoal(ownerOf(response), identifier.parse(request.params.id)),
  ),
);
