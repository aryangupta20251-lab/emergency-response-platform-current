import { getPool } from "../db/pool.js";
import {
  createNotification,
  publishIncidentUpdate,
  publishNotification,
} from "./notificationsService.js";
import { httpError } from "../utils/httpError.js";
import { incidentColumns, toIncident, transitionIncidentStatus } from "./incidentsService.js";

const responderTypes = new Set([
  "ambulance",
  "paramedic",
  "police",
  "fire",
  "rescue",
  "first_responder",
]);
const availabilityStates = new Set(["available", "busy", "offline"]);
const uuidPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const maximumRadiusKm = 50;

const profileColumns = `
  profile.user_id, profile.responder_type, profile.organization, profile.service_area,
  profile.availability, profile.is_active, profile.is_verified,
  profile.latitude, profile.longitude, profile.created_at, profile.updated_at
`;

function validateUuid(value, fieldName) {
  if (typeof value !== "string" || !uuidPattern.test(value)) {
    throw httpError(400, `${fieldName} must be a valid UUID.`);
  }
}

function validateObject(body, allowedFields, requiredFields = []) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw httpError(400, "Request body must be a JSON object.");
  }
  if (Object.keys(body).some((field) => !allowedFields.includes(field))) {
    throw httpError(400, "The request contains unsupported fields.");
  }
  if (requiredFields.some((field) => body[field] === undefined)) {
    throw httpError(400, "One or more required fields are missing.");
  }
}

function optionalText(value, fieldName, maximumLength) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > maximumLength) {
    throw httpError(400, `${fieldName} must be no more than ${maximumLength} characters.`);
  }
  return value.trim() || null;
}

function parseCoordinate(value, fieldName, minimum, maximum) {
  if (value === undefined || value === "") {
    throw httpError(400, `${fieldName} is required.`);
  }
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) {
    throw httpError(400, `${fieldName} must be a valid geographic coordinate.`);
  }
  return coordinate;
}

function parseRadius(value) {
  if (value === undefined) return 10;
  const radius = Number(value);
  if (!Number.isFinite(radius) || radius <= 0 || radius > maximumRadiusKm) {
    throw httpError(400, `Radius must be greater than 0 and no more than ${maximumRadiusKm} km.`);
  }
  return radius;
}

function validateResponderType(value) {
  if (typeof value !== "string" || !responderTypes.has(value)) {
    throw httpError(400, "Responder type is invalid.");
  }
}

function toResponderProfile(row) {
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

export async function createResponderProfile(body) {
  validateObject(body, ["userId", "responderType", "organization", "serviceArea"], ["userId", "responderType"]);
  validateUuid(body.userId, "User ID");
  validateResponderType(body.responderType);
  const organization = optionalText(body.organization, "Organization", 120);
  const serviceArea = optionalText(body.serviceArea, "Service area", 120);

  try {
    const result = await getPool().query(
      `INSERT INTO responder_profiles (user_id, responder_type, organization, service_area)
      SELECT account.id, $2, $3, $4
      FROM users account
      WHERE account.id = $1 AND account.role = 'responder' AND account.account_status = 'active'
       RETURNING user_id, responder_type, organization, service_area, availability,
                 is_active, is_verified, latitude, longitude, created_at, updated_at`,
      [body.userId, body.responderType, organization, serviceArea],
    );
    if (result.rowCount === 0) {
      throw httpError(404, "Active responder account not found.");
    }
    return toResponderProfile(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      throw httpError(409, "A responder profile already exists for this account.");
    }
    throw error;
  }
}

export async function updateResponderVerification(userId, body) {
  validateUuid(userId, "Responder ID");
  validateObject(body, ["isActive", "isVerified"]);
  const changes = Object.keys(body);
  if (changes.length === 0 || changes.some((field) => typeof body[field] !== "boolean")) {
    throw httpError(400, "Provide isActive and/or isVerified as boolean values.");
  }

  const client = await getPool().connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;
    const profileResult = await client.query(
      `SELECT profile.user_id
       FROM responder_profiles profile
       JOIN users account ON account.id = profile.user_id
       WHERE profile.user_id = $1
         AND account.role = 'responder'
         AND account.account_status = 'active'
       FOR UPDATE OF profile`,
      [userId],
    );
    if (profileResult.rowCount === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return null;
    }

    if (body.isActive === false || body.isVerified === false) {
      const activeAssignment = await client.query(
        `SELECT 1 FROM incidents
         WHERE assigned_responder_user_id = $1
           AND status NOT IN ('resolved', 'cancelled')
         LIMIT 1`,
        [userId],
      );
      if (activeAssignment.rowCount > 0) {
        throw httpError(409, "A responder with an active assignment cannot be deactivated or unverified.");
      }
    }

    const result = await client.query(
      `UPDATE responder_profiles
       SET is_active = COALESCE($2, is_active),
           is_verified = COALESCE($3, is_verified),
           availability = CASE
             WHEN COALESCE($2, is_active) = FALSE OR COALESCE($3, is_verified) = FALSE
             THEN 'offline'
             ELSE availability
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING user_id, responder_type, organization, service_area, availability,
                 is_active, is_verified, latitude, longitude, created_at, updated_at`,
      [userId, body.isActive ?? null, body.isVerified ?? null],
    );
    await client.query("COMMIT");
    transactionStarted = false;
    return toResponderProfile(result.rows[0]);
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getResponderProfile(userId) {
  const result = await getPool().query(
    `SELECT ${profileColumns}
     FROM responder_profiles profile
     JOIN users account ON account.id = profile.user_id
     WHERE profile.user_id = $1
       AND account.role = 'responder'
       AND account.account_status = 'active'`,
    [userId],
  );
  return result.rows[0] ? toResponderProfile(result.rows[0]) : null;
}

export async function updateResponderLocation(userId, body) {
  validateObject(body, ["latitude", "longitude"], ["latitude", "longitude"]);
  if (typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    throw httpError(400, "Latitude and longitude must be numeric coordinates.");
  }
  const latitude = parseCoordinate(body.latitude, "Latitude", -90, 90);
  const longitude = parseCoordinate(body.longitude, "Longitude", -180, 180);
  const result = await getPool().query(
    `UPDATE responder_profiles profile
     SET latitude = $2, longitude = $3, updated_at = CURRENT_TIMESTAMP
     FROM users account
     WHERE profile.user_id = $1
       AND account.id = profile.user_id
       AND account.role = 'responder'
       AND account.account_status = 'active'
     RETURNING profile.user_id, profile.latitude, profile.longitude, profile.updated_at`,
    [userId, latitude, longitude],
  );
  if (!result.rows[0]) return null;
  return {
    latitude: result.rows[0].latitude,
    longitude: result.rows[0].longitude,
    updatedAt: result.rows[0].updated_at,
  };
}

export async function updateResponderAvailability(userId, body) {
  validateObject(body, ["availability"], ["availability"]);
  if (typeof body.availability !== "string" || !availabilityStates.has(body.availability)) {
    throw httpError(400, "Availability must be available, busy, or offline.");
  }

  const client = await getPool().connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;
    const profileResult = await client.query(
      `SELECT profile.availability, profile.is_active, profile.is_verified
       FROM responder_profiles profile
       JOIN users account ON account.id = profile.user_id
       WHERE profile.user_id = $1
         AND account.role = 'responder'
         AND account.account_status = 'active'
       FOR UPDATE OF profile`,
      [userId],
    );
    const profile = profileResult.rows[0];
    if (!profile) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return null;
    }

    const activeAssignment = await client.query(
      `SELECT 1 FROM incidents
       WHERE assigned_responder_user_id = $1
         AND status NOT IN ('resolved', 'cancelled')
       LIMIT 1`,
      [userId],
    );
    if (activeAssignment.rowCount > 0 && body.availability !== "busy") {
      throw httpError(409, "Availability cannot change while an incident is assigned.");
    }
    if (body.availability === "available" && (!profile.is_active || !profile.is_verified)) {
      throw httpError(409, "Only active, verified responders can become available.");
    }

    const result = await client.query(
      `UPDATE responder_profiles
       SET availability = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING user_id, responder_type, organization, service_area, availability,
                 is_active, is_verified, latitude, longitude, created_at, updated_at`,
      [userId, body.availability],
    );
    await client.query("COMMIT");
    transactionStarted = false;
    return toResponderProfile(result.rows[0]);
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function parseNearbyQuery(query) {
  const allowedFields = ["latitude", "longitude", "radius", "responderType"];
  if (Object.keys(query).some((field) => !allowedFields.includes(field))) {
    throw httpError(400, "The request contains unsupported search filters.");
  }
  const latitude = parseCoordinate(query.latitude, "Latitude", -90, 90);
  const longitude = parseCoordinate(query.longitude, "Longitude", -180, 180);
  const radiusKm = parseRadius(query.radius);
  if (query.responderType !== undefined) validateResponderType(query.responderType);
  return { latitude, longitude, radiusKm, responderType: query.responderType };
}

async function searchNearbyResponders({ latitude, longitude, radiusKm, responderType }) {
  const values = [latitude, longitude, radiusKm];
  let typeCondition = "";
  if (responderType) {
    values.push(responderType);
    typeCondition = `AND profile.responder_type = $${values.length}`;
  }

  const result = await getPool().query(
    `SELECT nearby.*
     FROM (
       SELECT profile.user_id, profile.responder_type, profile.organization,
              profile.service_area, profile.availability, profile.latitude,
              profile.longitude,
              6371.0 * 2 * ASIN(SQRT(LEAST(1.0, GREATEST(0.0,
                POWER(SIN(RADIANS(profile.latitude - $1) / 2), 2)
                + COS(RADIANS($1)) * COS(RADIANS(profile.latitude))
                * POWER(SIN(RADIANS(profile.longitude - $2) / 2), 2)
              )))) AS distance_km
       FROM responder_profiles profile
       JOIN users account ON account.id = profile.user_id
       WHERE account.role = 'responder'
         AND account.account_status = 'active'
         AND profile.is_active = TRUE
         AND profile.is_verified = TRUE
         AND profile.availability = 'available'
         AND profile.latitude IS NOT NULL
         ${typeCondition}
     ) nearby
     WHERE nearby.distance_km <= $3
     ORDER BY nearby.distance_km, nearby.user_id`,
    values,
  );
  return result.rows.map((row) => ({
    userId: row.user_id,
    responderType: row.responder_type,
    organization: row.organization,
    serviceArea: row.service_area,
    availability: row.availability,
    latitude: row.latitude,
    longitude: row.longitude,
    distanceKm: Number(row.distance_km),
  }));
}

export async function findNearbyResponders(query) {
  return searchNearbyResponders(parseNearbyQuery(query));
}

export async function findIncidentResponders(incidentId, query) {
  validateUuid(incidentId, "Incident ID");
  const incidentResult = await getPool().query(
    "SELECT latitude, longitude FROM incidents WHERE id = $1",
    [incidentId],
  );
  const incident = incidentResult.rows[0];
  if (!incident) return null;
  if (incident.latitude === null || incident.longitude === null) {
    throw httpError(409, "This incident does not have coordinates for nearby responder search.");
  }

  const queryFilters = { ...query, latitude: incident.latitude, longitude: incident.longitude };
  return searchNearbyResponders(parseNearbyQuery(queryFilters));
}

export async function assignResponder(actor, incidentId, body) {
  validateUuid(incidentId, "Incident ID");
  if (!actor || actor.role !== "admin") {
    throw httpError(403, "Only an admin can assign a responder.");
  }
  validateObject(body, ["responderId"], ["responderId"]);
  validateUuid(body.responderId, "Responder ID");

  const client = await getPool().connect();
  let transactionStarted = false;
  const pendingEvents = { notifications: [], incidentUpdates: [] };

  try {
    await client.query("BEGIN");
    transactionStarted = true;
    const incidentResult = await client.query(
      `SELECT status, assigned_responder_user_id, reporter_id, incident_type
       FROM incidents WHERE id = $1 FOR UPDATE`,
      [incidentId],
    );
    const incident = incidentResult.rows[0];
    if (!incident) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return null;
    }
    if (incident.assigned_responder_user_id
      && !["resolved", "cancelled"].includes(incident.status)) {
      throw httpError(409, "This incident already has an assigned responder.");
    }

    const responderResult = await client.query(
      `SELECT profile.user_id, profile.responder_type, profile.organization,
              profile.service_area, profile.availability, profile.is_active,
              profile.is_verified
       FROM responder_profiles profile
       JOIN users account ON account.id = profile.user_id
       WHERE profile.user_id = $1
         AND account.role = 'responder'
         AND account.account_status = 'active'
       FOR UPDATE OF profile`,
      [body.responderId],
    );
    const responder = responderResult.rows[0];
    if (!responder) {
      throw httpError(404, "Responder profile not found.");
    }
    if (!responder.is_active || !responder.is_verified || responder.availability !== "available") {
      throw httpError(409, "Responder must be active, verified, and available for assignment.");
    }

    const updatedIncident = await transitionIncidentStatus(
      client,
      actor,
      incidentId,
      "responder_assigned",
      pendingEvents,
    );
    if (!updatedIncident) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return null;
    }

    const busyResult = await client.query(
      `UPDATE responder_profiles
       SET availability = 'busy', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
         AND availability = 'available'
         AND is_active = TRUE
         AND is_verified = TRUE
       RETURNING user_id`,
      [body.responderId],
    );
    if (busyResult.rowCount !== 1) {
      throw httpError(409, "Responder is no longer available.");
    }

    const assignmentResult = await client.query(
      `UPDATE incidents
       SET assigned_responder_user_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING ${incidentColumns}`,
      [incidentId, body.responderId],
    );
    const responderNotification = await createNotification({
      userId: responder.user_id,
      type: "responder_assigned",
      title: "Incident assignment received",
      message: `You have been assigned to a ${incident.incident_type.toLowerCase()} report. Review the incident in the responder workspace.`,
      incidentId,
      responderUserId: responder.user_id,
    }, { queryable: client });
    pendingEvents.notifications.push(responderNotification);
    pendingEvents.incidentUpdates.push({ userId: responder.user_id, incident: assignmentResult.rows[0] });
    await client.query("COMMIT");
    transactionStarted = false;
    for (const notification of pendingEvents.notifications) publishNotification(notification);
    for (const event of pendingEvents.incidentUpdates) publishIncidentUpdate(event.userId, toIncident(event.incident));
    return {
      incident: toIncident(assignmentResult.rows[0]),
      responder: {
        userId: responder.user_id,
        responderType: responder.responder_type,
        organization: responder.organization,
        serviceArea: responder.service_area,
        availability: "busy",
      },
    };
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK");
    if (error.code === "23505") {
      throw httpError(409, "Responder is already assigned to an active incident.");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getIncidentAssignedResponder(actor, incidentId) {
  validateUuid(incidentId, "Incident ID");
  const result = await getPool().query(
    `SELECT incident.id AS incident_id, responder.user_id, account.name,
            responder.responder_type, responder.organization, responder.availability
     FROM incidents incident
     LEFT JOIN responder_profiles responder
       ON responder.user_id = incident.assigned_responder_user_id
     LEFT JOIN users account ON account.id = responder.user_id
     WHERE incident.id = $1
       AND (incident.reporter_id = $2 OR $3 = 'admin')`,
    [incidentId, actor.id, actor.role],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    incidentId: row.incident_id,
    responder: row.user_id ? {
      userId: row.user_id,
      name: row.name,
      responderType: row.responder_type,
      organization: row.organization,
      availability: row.availability,
    } : null,
  };
}