import { getPool } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";

const allowedRoles = new Set(["citizen", "responder", "admin"]);
const allowedStatuses = new Set(["active", "disabled"]);
const allowedVerificationStatuses = new Set(["pending", "verified", "rejected", "suspended"]);

function parsePage(value, fallback = 1) {
  const page = Number(value ?? fallback);
  if (!Number.isInteger(page) || page < 1) {
    return fallback;
  }
  return page;
}

function parseLimit(value, fallback = 20, maximum = 100) {
  const limit = Number(value ?? fallback);
  if (!Number.isInteger(limit) || limit < 1 || limit > maximum) {
    return fallback;
  }
  return limit;
}

function sanitizeSearch(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phoneNumber: row.phone_number,
    identifier: row.email || row.phone_number,
    role: row.role,
    accountStatus: row.account_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublicResponder(row) {
  return {
    userId: row.user_id,
    responderType: row.responder_type,
    organization: row.organization,
    serviceArea: row.service_area,
    availability: row.availability,
    isActive: row.is_active,
    isVerified: row.is_verified,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublicIncident(row) {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    type: row.incident_type,
    peopleInvolved: row.people_involved,
    injuries: row.visible_injuries,
    vehicles: row.vehicles,
    description: row.description,
    location: row.location_name,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status,
    assignedResponderId: row.assigned_responder_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listUsers(request, response) {
  const page = parsePage(request.query.page, 1);
  const limit = parseLimit(request.query.limit, 20, 100);
  const search = sanitizeSearch(request.query.search);
  const role = typeof request.query.role === "string" ? request.query.role.trim() : "";
  const status = typeof request.query.status === "string" ? request.query.status.trim() : "";

  const clauses = [];
  const values = [];
  let nextIndex = 1;

  if (role && allowedRoles.has(role)) {
    clauses.push(`role = $${nextIndex}`);
    values.push(role);
    nextIndex += 1;
  }
  if (status && allowedStatuses.has(status)) {
    clauses.push(`account_status = $${nextIndex}`);
    values.push(status);
    nextIndex += 1;
  }
  if (search) {
    clauses.push(`(LOWER(name) LIKE $${nextIndex} OR LOWER(email) LIKE $${nextIndex} OR LOWER(phone_number) LIKE $${nextIndex})`);
    values.push(`%${search.toLowerCase()}%`);
    nextIndex += 1;
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const offset = (page - 1) * limit;
  const countQuery = `SELECT COUNT(*)::int AS total FROM users ${whereClause}`;

  const totalResult = await getPool().query(countQuery, values);
  const result = await getPool().query(
    `SELECT id, name, email, phone_number, role, account_status, created_at, updated_at
     FROM users
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
    [...values, limit, offset],
  );

  response.status(200).json({
    success: true,
    page,
    limit,
    total: totalResult.rows[0].total,
    users: result.rows.map(toPublicUser),
  });
}

export async function getUserByAdmin(request, response) {
  const { id } = request.params;
  if (typeof id !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    response.status(400).json({ success: false, message: "User ID must be a valid UUID." });
    return;
  }

  const result = await getPool().query(
    `SELECT id, name, email, phone_number, role, account_status, created_at, updated_at
     FROM users WHERE id = $1`,
    [id],
  );
  if (result.rowCount === 0) {
    response.status(404).json({ success: false, message: "User not found." });
    return;
  }
  response.status(200).json({ success: true, user: toPublicUser(result.rows[0]) });
}

export async function updateUserStatus(request, response) {
  const { id } = request.params;
  const { status } = request.body ?? {};
  if (typeof id !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    response.status(400).json({ success: false, message: "User ID must be a valid UUID." });
    return;
  }
  if (typeof status !== "string" || !allowedStatuses.has(status)) {
    response.status(400).json({ success: false, message: "Status must be active or disabled." });
    return;
  }

  const result = await getPool().query(
    `UPDATE users
     SET account_status = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND id <> $3
     RETURNING id, name, email, phone_number, role, account_status, created_at, updated_at`,
    [id, status, request.user.id],
  );
  if (result.rowCount === 0) {
    response.status(404).json({ success: false, message: "User not found." });
    return;
  }

  response.status(200).json({ success: true, user: toPublicUser(result.rows[0]) });
}

export async function updateUserRole(request, response) {
  const { id } = request.params;
  const { role } = request.body ?? {};
  if (typeof id !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    response.status(400).json({ success: false, message: "User ID must be a valid UUID." });
    return;
  }
  if (typeof role !== "string" || !allowedRoles.has(role)) {
    response.status(400).json({ success: false, message: "Role must be citizen, responder, or admin." });
    return;
  }
  if (id === request.user.id) {
    response.status(403).json({ success: false, message: "Administrators cannot remove their own admin privileges." });
    return;
  }

  const result = await getPool().query(
    `UPDATE users
     SET role = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, name, email, phone_number, role, account_status, created_at, updated_at`,
    [id, role],
  );
  if (result.rowCount === 0) {
    response.status(404).json({ success: false, message: "User not found." });
    return;
  }

  response.status(200).json({ success: true, user: toPublicUser(result.rows[0]) });
}

export async function listResponders(request, response) {
  const page = parsePage(request.query.page, 1);
  const limit = parseLimit(request.query.limit, 20, 100);
  const offset = (page - 1) * limit;

  const total = await getPool().query("SELECT COUNT(*)::int AS total FROM responder_profiles");
  const result = await getPool().query(
    `SELECT profile.user_id, profile.responder_type, profile.organization, profile.service_area,
            profile.availability, profile.is_active, profile.is_verified,
            profile.latitude, profile.longitude, profile.created_at, profile.updated_at,
            account.name, account.email, account.role, account.account_status
     FROM responder_profiles profile
     JOIN users account ON account.id = profile.user_id
     ORDER BY profile.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  response.status(200).json({
    success: true,
    page,
    limit,
    total: total.rows[0].total,
    responders: result.rows.map((row) => ({
      userId: row.user_id,
      name: row.name,
      email: row.email,
      responderType: row.responder_type,
      organization: row.organization,
      serviceArea: row.service_area,
      availability: row.availability,
      isActive: row.is_active,
      isVerified: row.is_verified,
      accountStatus: row.account_status,
      latitude: row.latitude,
      longitude: row.longitude,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
}

export async function getResponderByAdmin(request, response) {
  const { id } = request.params;
  if (typeof id !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    response.status(400).json({ success: false, message: "Responder ID must be a valid UUID." });
    return;
  }

  const result = await getPool().query(
    `SELECT profile.user_id, profile.responder_type, profile.organization, profile.service_area,
            profile.availability, profile.is_active, profile.is_verified,
            profile.latitude, profile.longitude, profile.created_at, profile.updated_at,
            account.name, account.email, account.role, account.account_status
     FROM responder_profiles profile
     JOIN users account ON account.id = profile.user_id
     WHERE profile.user_id = $1`,
    [id],
  );
  if (result.rowCount === 0) {
    response.status(404).json({ success: false, message: "Responder not found." });
    return;
  }
  response.status(200).json({ success: true, responder: toPublicResponder(result.rows[0]) });
}

export async function listPendingResponders(request, response) {
  const result = await getPool().query(
    `SELECT profile.user_id, profile.responder_type, profile.organization, profile.service_area,
            profile.availability, profile.is_active, profile.is_verified,
            profile.latitude, profile.longitude, profile.created_at, profile.updated_at,
            account.name, account.email
     FROM responder_profiles profile
     JOIN users account ON account.id = profile.user_id
     WHERE account.role = 'responder'
       AND account.account_status = 'active'
       AND profile.is_verified = FALSE
     ORDER BY profile.created_at DESC`
  );

  response.status(200).json({ success: true, responders: result.rows.map((row) => ({
    userId: row.user_id,
    name: row.name,
    email: row.email,
    responderType: row.responder_type,
    organization: row.organization,
    serviceArea: row.service_area,
    availability: row.availability,
    isActive: row.is_active,
    isVerified: row.is_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })) });
}

export async function updateResponderVerification(request, response) {
  const { id } = request.params;
  const { status } = request.body ?? {};
  if (typeof id !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    response.status(400).json({ success: false, message: "Responder ID must be a valid UUID." });
    return;
  }
  if (typeof status !== "string" || !allowedVerificationStatuses.has(status)) {
    response.status(400).json({ success: false, message: "Verification status must be pending, verified, rejected, or suspended." });
    return;
  }

  const result = await getPool().query(
    `UPDATE responder_profiles
     SET is_verified = $2,
         is_active = CASE WHEN $2 = TRUE THEN TRUE ELSE is_active END,
         availability = CASE
           WHEN $2 = TRUE THEN CASE WHEN availability = 'offline' THEN 'offline' ELSE availability END
           ELSE 'offline'
         END,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1
     RETURNING user_id, responder_type, organization, service_area, availability,
               is_active, is_verified, latitude, longitude, created_at, updated_at`,
    [id, status === "verified"],
  );

  if (result.rowCount === 0) {
    response.status(404).json({ success: false, message: "Responder profile not found." });
    return;
  }

  response.status(200).json({ success: true, responder: toPublicResponder(result.rows[0]) });
}

export async function listAdminIncidents(request, response) {
  const page = parsePage(request.query.page, 1);
  const limit = parseLimit(request.query.limit, 20, 100);
  const offset = (page - 1) * limit;
  const status = typeof request.query.status === "string" ? request.query.status.trim() : "";
  const assignedResponderId = typeof request.query.assignedResponderId === "string" ? request.query.assignedResponderId.trim() : "";

  const filters = [];
  const values = [];
  let nextIndex = 1;

  if (status) {
    filters.push(`status = $${nextIndex}`);
    values.push(status);
    nextIndex += 1;
  }
  if (assignedResponderId) {
    filters.push(`assigned_responder_user_id = $${nextIndex}`);
    values.push(assignedResponderId);
    nextIndex += 1;
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
  const total = await getPool().query(`SELECT COUNT(*)::int AS total FROM incidents ${whereClause}`, values);

  const result = await getPool().query(
    `SELECT id, reporter_id, incident_type, people_involved, visible_injuries, vehicles,
            description, location_name, latitude, longitude, status,
            assigned_responder_user_id, created_at, updated_at
     FROM incidents
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
    [...values, limit, offset],
  );

  response.status(200).json({
    success: true,
    page,
    limit,
    total: total.rows[0].total,
    incidents: result.rows.map(toPublicIncident),
  });
}

export async function getIncidentByAdmin(request, response) {
  const { id } = request.params;
  if (typeof id !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    response.status(400).json({ success: false, message: "Incident ID must be a valid UUID." });
    return;
  }

  const incidentResult = await getPool().query(
    `SELECT id, reporter_id, incident_type, people_involved, visible_injuries, vehicles,
            description, location_name, latitude, longitude, status,
            assigned_responder_user_id, created_at, updated_at
     FROM incidents WHERE id = $1`,
    [id],
  );
  if (incidentResult.rowCount === 0) {
    response.status(404).json({ success: false, message: "Incident not found." });
    return;
  }

  const historyResult = await getPool().query(
    `SELECT previous_status, new_status, changed_by_user_id, created_at
     FROM incident_status_history WHERE incident_id = $1
     ORDER BY created_at ASC, id ASC`,
    [id],
  );

  const incident = toPublicIncident(incidentResult.rows[0]);
  incident.history = historyResult.rows.map((row) => ({
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    changedByUserId: row.changed_by_user_id,
    createdAt: row.created_at,
  }));

  response.status(200).json({ success: true, incident });
}

export async function listActiveIncidents(request, response) {
  const result = await getPool().query(
    `SELECT id, reporter_id, incident_type, people_involved, visible_injuries, vehicles,
            description, location_name, latitude, longitude, status,
            assigned_responder_user_id, created_at, updated_at
     FROM incidents
     WHERE status IN ('reported', 'received', 'verified', 'responder_assigned', 'responding', 'arrived')
     ORDER BY created_at DESC`
  );

  response.status(200).json({ success: true, incidents: result.rows.map(toPublicIncident) });
}

export async function getAdminStatistics(request, response) {
  const stats = await getPool().query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM users WHERE role = 'responder') AS responders,
      (SELECT COUNT(*) FROM responder_profiles WHERE is_verified = TRUE) AS verified_responders,
      (SELECT COUNT(*) FROM responder_profiles WHERE is_verified = TRUE AND availability = 'available') AS available_responders,
      (SELECT COUNT(*) FROM incidents WHERE status IN ('reported', 'received', 'verified', 'responder_assigned', 'responding', 'arrived')) AS active_incidents,
      (SELECT COUNT(*) FROM incidents WHERE status = 'resolved') AS resolved_incidents,
      (SELECT COUNT(*) FROM incidents WHERE created_at >= CURRENT_DATE) AS incidents_today,
      (SELECT COUNT(*) FROM incidents WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS incidents_this_week
    `);
  const row = stats.rows[0];
  response.status(200).json({
    success: true,
    users: Number(row.users),
    responders: Number(row.responders),
    verifiedResponders: Number(row.verified_responders),
    availableResponders: Number(row.available_responders),
    activeIncidents: Number(row.active_incidents),
    resolvedIncidents: Number(row.resolved_incidents),
    incidentsToday: Number(row.incidents_today),
    incidentsThisWeek: Number(row.incidents_this_week),
  });
}
