import { Router } from "express";
import {
  createProfile,
  editMyAvailability,
  editMyLocation,
  editResponderVerification,
  readMyAssignedIncident,
  readMyAssignedIncidents,
  readMyProfile,
  readNearbyResponders,
} from "../controllers/respondersController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/requireRole.js";

export const respondersRouter = Router();

respondersRouter.post("/", authenticate, requireRole("admin"), createProfile);
respondersRouter.patch("/:userId/verification", authenticate, requireRole("admin"), editResponderVerification);
respondersRouter.get("/me/incidents", authenticate, requireRole("responder"), readMyAssignedIncidents);
respondersRouter.get("/me/incidents/:id", authenticate, requireRole("responder"), readMyAssignedIncident);
respondersRouter.get("/me", authenticate, requireRole("responder"), readMyProfile);
respondersRouter.patch("/me/location", authenticate, requireRole("responder"), editMyLocation);
respondersRouter.patch("/me/availability", authenticate, requireRole("responder"), editMyAvailability);
respondersRouter.get("/nearby", authenticate, requireRole("admin"), readNearbyResponders);