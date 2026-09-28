import { Router } from "express";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  readNotifications,
  readUnreadCount,
} from "../controllers/notificationsController.js";
import { authenticate } from "../middleware/authenticate.js";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);
notificationsRouter.get("/unread-count", readUnreadCount);
notificationsRouter.patch("/read-all", markAllNotificationsAsRead);
notificationsRouter.patch("/:id/read", markNotificationAsRead);
notificationsRouter.get("/", readNotifications);