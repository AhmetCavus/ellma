import { Router } from "express";
import { identifier } from "@ellma/shared";
import { ownerOf } from "../platform/access.js";
import { endpoint } from "../platform/endpoint.js";
import * as service from "./task.service.js";

export const taskRoutes = Router();

taskRoutes.get(
  "/",
  endpoint((request, response) => service.listTasks(ownerOf(response), request.query)),
);
taskRoutes.post(
  "/",
  endpoint((request, response) => service.createTask(ownerOf(response), request.body)),
);
taskRoutes.patch(
  "/:id",
  endpoint((request, response) =>
    service.updateTask(ownerOf(response), identifier.parse(request.params.id), request.body),
  ),
);
taskRoutes.delete(
  "/:id",
  endpoint((request, response) =>
    service.deleteTask(ownerOf(response), identifier.parse(request.params.id)),
  ),
);
