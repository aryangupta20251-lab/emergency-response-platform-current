import { getPool } from "../db/pool.js";
import { emitUserEvent } from "../realtime/socket.js";
import { httpError } from "../utils/httpError.js";

const notificationTypes = new Set([
  "incident_created",
  "incident_received",
  "incident_verified",
  "responder_assigned",
  "responder_en_route",
  "responder_arrived",
  "incident_resolved",
  "incident_cancelled",
  "system",
]);
const uuidPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const maximumPageSize = 100;

const notificationColumns = `
  id, user_id, type, title, message, related_incident_id,
  related_responder_user_id, is_read, created_at, read_at
`;

function toNotification(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    relatedIncidentId: row.related_incident_id,
    relatedResponderUserId: row.related_responder_user_id,
    isRead: row.is_read,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

function validateUuid(value, label) {
  if (typeof value !== "string" || !uuidPattern.test(value)) {
    throw httpError(400, `${label} must be a valid UUID.`);
  }
}

export async function createNotification(input, { queryable = getPool() } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw httpError(400, "Notification data must be an object.");
  }
  const allowedFields = [
    "userId",
    "type",
    "title",
    "message",
    "incidentId",
    "responderUserId",
  ];
  if (Object.keys(input).some((field) => !allowedFields.includes(field))) {
    throw httpError(400, "Notification contains unsupported fields.");
  }
  validateUuid(input.userId, "User ID");
  if (typeof input.type !== "string" || !notificationTypes.has(input.type)) {
    throw httpError(400, "Notification type is invalid.");
  }
  if (typeof input.title !== "string" || input.title.trim().length < 1 || input.title.trim().length > 120) {
    throw httpError(400, "Notification title must be between 1 and 120 characters.");
  }
  if (typeof input.message !== "string" || input.message.trim().length < 1 || input.message.trim().length > 1000) {
    throw httpError(400, "Notification message must be between 1 and 1000 characters.");
  }
  if (input.type !== "system" && input.incidentId === undefined) {
    throw httpError(400, "Incident notifications require a related incident.");
  }
  if (input.incidentId !== undefined) validateUuid(input.incidentId, "Incident ID");
  if (input.responderUserId !== undefined) validateUuid(input.responderUserId, "Responder ID");

  const result = await queryable.query(
    `INSERT INTO notifications (
       user_id, type, title, message, related_incident_id, related_responder_user_id
     ) VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${notificationColumns}`,
    [
      input.userId,
      input.type,
      input.title.trim(),
      input.message.trim(),
      input.incidentId ?? null,
      input.responderUserId ?? null,
    ],
  );
  return toNotification(result.rows[0]);
}

export function publishNotification(notification) {
  emitUserEvent(notification.userId, "notification:new", notification);
}

export function publishIncidentUpdate(userId, incident) {
  emitUserEvent(userId, "incident:update", {
    id: incident.id,
    status: incident.status,
    updatedAt: incident.updatedAt,
  });
}

function parsePagination(query) {
  if (Object.keys(query).some((field) => !["page", "limit"].includes(field))) {
    throw httpError(400, "Only page and limit pagination parameters are supported.");
  }
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1) {
    throw httpError(400, "Page must be a positive integer.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > maximumPageSize) {
    throw httpError(400, `Limit must be between 1 and ${maximumPageSize}.`);
  }
  return { page, limit, offset: (page - 1) * limit };
}

export async function listNotifications(userId, query) {
  const { page, limit, offset } = parsePagination(query);
  const pool = getPool();
  const [notificationsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT ${notificationColumns}
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    ),
    pool.query("SELECT count(*)::int AS total FROM notifications WHERE user_id = $1", [userId]),
  ]);
  return {
    notifications: notificationsResult.rows.map(toNotification),
    page,
    limit,
    total: countResult.rows[0].total,
  };
}

export async function getUnreadNotificationCount(userId) {
  const result = await getPool().query(
    "SELECT count(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE",
    [userId],
  );
  return result.rows[0].count;
}

export async function markNotificationRead(userId, notificationId) {
  validateUuid(notificationId, "Notification ID");
  const result = await getPool().query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE id = $1 AND user_id = $2
     RETURNING ${notificationColumns}`,
    [notificationId, userId],
  );
  return result.rows[0] ? toNotification(result.rows[0]) : null;
}

export async function markAllNotificationsRead(userId) {
  const result = await getPool().query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId],
  );
  return result.rowCount;
}