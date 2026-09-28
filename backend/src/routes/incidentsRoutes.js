import { Router } from "express";
import {
  addIncident,
  assignIncidentResponder,
  editIncident,
  editIncidentLocation,
  editIncidentStatus,
  readIncident,
  readAssignedResponder,
  readIncidentHistory,
  readIncidentResponders,
  readIncidents,
  readIncidentStatus,
} from "../controllers/incidentsController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";

export const incidentsRouter = Router();

incidentsRouter.use(authenticate);
incidentsRouter.get("/", readIncidents);
incidentsRouter.post("/", addIncident);
incidentsRouter.get("/:id/history", readIncidentHistory);
incidentsRouter.get("/:id/status", readIncidentStatus);
incidentsRouter.patch("/:id/status", requireRole("responder", "admin"), editIncidentStatus);
incidentsRouter.patch("/:id/location", editIncidentLocation);
incidentsRouter.get("/:id/responders", requireRole("admin"), readIncidentResponders);
incidentsRouter.post("/:id/assign-responder", requireRole("admin"), assignIncidentResponder);
incidentsRouter.get("/:id/assigned-responder", readAssignedResponder);
incidentsRouter.get("/:id", readIncident);
incidentsRouter.patch("/:id", editIncident);