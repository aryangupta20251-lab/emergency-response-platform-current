import { Router } from "express";
import {
  getIncidentByAdmin,
  getResponderByAdmin,
  getUserByAdmin,
  listActiveIncidents,
  listAdminIncidents,
  listPendingResponders,
  listResponders,
  listUsers,
  getAdminStatistics,
  updateResponderVerification,
  updateUserRole,
  updateUserStatus,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

adminRouter.get("/users", listUsers);
adminRouter.get("/users/:id", getUserByAdmin);
adminRouter.patch("/users/:id/status", updateUserStatus);
adminRouter.patch("/users/:id/role", updateUserRole);

adminRouter.get("/responders", listResponders);
adminRouter.get("/responders/pending", listPendingResponders);
adminRouter.get("/responders/:id", getResponderByAdmin);
adminRouter.patch("/responders/:id/verification", updateResponderVerification);

adminRouter.get("/incidents", listAdminIncidents);
adminRouter.get("/incidents/active", listActiveIncidents);
adminRouter.get("/incidents/:id", getIncidentByAdmin);

adminRouter.get("/statistics", getAdminStatistics);
