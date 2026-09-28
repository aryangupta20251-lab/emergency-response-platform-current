import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationsService.js";
import { emitUserEvent } from "../realtime/socket.js";

export async function readNotifications(request, response) {
  const result = await listNotifications(request.user.id, request.query);
  response.status(200).json({ success: true, ...result });
}

export async function readUnreadCount(request, response) {
  const count = await getUnreadNotificationCount(request.user.id);
  response.status(200).json({ success: true, count });
}

export async function markNotificationAsRead(request, response) {
  const notification = await markNotificationRead(request.user.id, request.params.id);
  if (!notification) {
    response.status(404).json({ success: false, message: "Notification not found." });
    return;
  }
  emitUserEvent(request.user.id, "notification:read", { id: notification.id, readAt: notification.readAt });
  response.status(200).json({ success: true, notification });
}

export async function markAllNotificationsAsRead(request, response) {
  const updatedCount = await markAllNotificationsRead(request.user.id);
  emitUserEvent(request.user.id, "notification:read-all", { updatedCount });
  response.status(200).json({ success: true, updatedCount });
}