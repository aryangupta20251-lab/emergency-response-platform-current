import { Router } from "express";
import { getApiInfo, getHealth } from "../controllers/apiController.js";
import { adminRouter } from "./adminRoutes.js";
import { authRouter } from "./authRoutes.js";
import { contactsRouter } from "./contactsRoutes.js";
import { incidentsRouter } from "./incidentsRoutes.js";
import { hospitalsRouter } from "./hospitalsRoutes.js";
import { notificationsRouter } from "./notificationsRoutes.js";
import { profileRouter } from "./profileRoutes.js";
import { respondersRouter } from "./respondersRoutes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/emergency-contacts", contactsRouter);
apiRouter.use("/incidents", incidentsRouter);
apiRouter.use("/hospitals", hospitalsRouter);
apiRouter.use("/responders", respondersRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.get("/", getApiInfo);
apiRouter.get("/health", getHealth);