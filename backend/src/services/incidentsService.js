import { getPool } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";
import {
  createNotification,
  publishIncidentUpdate,
  publishNotification,
} from "./notificationsService.js";

const allowedFields = new Set([
  "accidentType",
  "peopleInvolved",
  "injuries",
  "vehicles",
  "description",
  "location",
  "locationState",
  "locationError",
  "submittedReport",
]);
const incidentIdPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const incidentTypes = new Set([
  "Vehicle collision",
  "Vehicle and pedestrian",
  "Single vehicle accident",
  "Other",
]);
const peopleOptions = new Set(["1", "2", "3", "4 or more", "Unknown"]);
const injuryOptions = new Set(["Yes", "No", "Unknown"]);
const vehicleOptions = new Set([
  "Car",
  "Motorcycle",
  "Truck or bus",
  "Multiple vehicle types",
  "Unknown",
]);
const incidentStatuses = new Set([
  "reported",
  "received",
  "verified",
  "responder_assigned",
  "responding",
  "arrived",
  "resolved",
  "cancelled",
]);
const allowedTransitions = new Map([
  ["reported", new Set(["received", "cancelled"])],
  ["received", new Set(["verified", "cancelled"])],
  ["verified", new Set(["responder_assigned", "cancelled"])],
  ["responder_assigned", new Set(["responding", "cancelled"])],
  ["responding", new Set(["arrived", "cancelled"])],
  ["arrived", new Set(["resolved"])],
  ["resolved", new Set()],
  ["cancelled", new Set()],
]);
const statusNotificationContent = new Map([
  ["received", {
    type: "incident_received",
    title: "Incident report received",
    message: "Your incident report has been received by the platform.",
  }],
  ["verified", {
    type: "incident_verified",
    title: "Incident report updated",
    message: "Your incident report status was updated to verified in the platform.",
  }],
  ["responder_assigned", {
    type: "responder_assigned",
    title: "Responder assignment updated",
    message: "A responder was assigned to your report in the platform. This does not confirm an external dispatch.",
  }],
  ["responding", {
    type: "responder_en_route",
    title: "Incident status updated",
    message: "The assigned responder updated your incident status in the platform.",
  }],
  ["arrived", {
    type: "responder_arrived",
    title: "Incident status updated",
    message: "The assigned responder updated your incident status to arrived in the platform.",
  }],
  ["resolved", {
    type: "incident_resolved",
    title: "Incident status updated",
    message: "Your incident status was marked resolved in the platform.",
  }],
  ["cancelled", {
    type: "incident_cancelled",
    title: "Incident status updated",
    message: "Your incident status was marked cancelled in the platform.",
  }],
]);

export const incidentColumns = `
  id, incident_type, people_involved, visible_injuries, vehicles,
  description, location_name, latitude, longitude, status,
  assigned_responder_user_id, created_at, updated_at
`;

function validateId(id) {
  if (typeof id !== "string" || !incidentIdPattern.test(id)) {
    throw httpError(400, "Incident ID must be a valid UUID.");
  }
}

function validateRequest(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw httpError(400, "Request body must be a JSON object.");
  }

  if (Object.keys(body).some((field) => !allowedFields.has(field))) {
    throw httpError(400, "The request contains unsupported incident fields.");
  }

  const incident = {};
  const requiredFields = ["accidentType", "peopleInvolved", "injuries", "vehicles", "location"];

  if (!partial && requiredFields.some((field) => body[field] === undefined)) {
    throw httpError(400, "Incident type, people, injuries, vehicles, and location are required.");
  }

  if (body.accidentType !== undefined) {
    if (typeof body.accidentType !== "string" || !incidentTypes.has(body.accidentType.trim())) {
      throw httpError(400, "Select a valid accident type.");
    }
    incident.incidentType = body.accidentType.trim();
  }

  if (body.peopleInvolved !== undefined) {
    if (typeof body.peopleInvolved !== "string" || !peopleOptions.has(body.peopleInvolved.trim())) {
      throw httpError(400, "Select a valid number of people involved.");
    }
    incident.peopleInvolved = body.peopleInvolved.trim();
  }

  if (body.injuries !== undefined) {
    if (typeof body.injuries !== "string" || !injuryOptions.has(body.injuries.trim())) {
      throw httpError(400, "Select a valid visible-injury response.");
    }
    incident.visibleInjuries = body.injuries.trim();
  }

  if (body.vehicles !== undefined) {
    if (typeof body.vehicles !== "string" || !vehicleOptions.has(body.vehicles.trim())) {
      throw httpError(400, "Select a valid vehicle category.");
    }
    incident.vehicles = body.vehicles.trim();
  }

  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== "string") {
      throw httpError(400, "Description must be text.");
    }
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (description.length > 500) {
      throw httpError(400, "Description must not exceed 500 characters.");
    }
    incident.description = description || null;
  } else if (!partial) {
    incident.description = null;
  }

  if (body.location !== undefined) {
    const location = typeof body.location === "string"
      ? body.location
      : body.location && typeof body.location === "object" && !Array.isArray(body.location)
        ? body.location.name
        : undefined;
    if (typeof location !== "string" || location.trim().length < 2 || location.trim().length > 255) {
      throw httpError(400, "Provide a location name between 2 and 255 characters.");
    }
    const locationObject = typeof body.location === "object" && body.location !== null
      ? body.location
      : null;
    if (body.location && typeof body.location === "object"
      && Object.keys(body.location).some((field) => !["name", "source", "latitude", "longitude"].includes(field))) {
      throw httpError(400, "The location contains unsupported fields.");
    }
    incident.locationName = location.trim();

    if (locationObject) {
      const hasLatitude = Object.hasOwn(locationObject, "latitude");
      const hasLongitude = Object.hasOwn(locationObject, "longitude");
      if (hasLatitude !== hasLongitude) {
        throw httpError(400, "Latitude and longitude must both be provided.");
      }

      if (hasLatitude) {
        for (const [field, maximum] of [["latitude", 90], ["longitude", 180]]) {
          const value = locationObject[field];
          if (value !== null && (typeof value !== "number" || !Number.isFinite(value)
            || value < -maximum || value > maximum)) {
            throw httpError(400, `The ${field} must be a valid geographic coordinate.`);
          }
        }
        incident.latitude = locationObject.latitude;
        incident.longitude = locationObject.longitude;
      }
    }
  }

  const editableFields = Object.keys(incident);
  if (partial && editableFields.length === 0) {
    throw httpError(400, "Provide at least one incident field to update.");
  }

  return incident;
}

export function toIncident(row) {
  return {
    id: row.id,
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

export async function createIncident(reporterId, body) {
  const incident = validateRequest(body);
  const client = await getPool().connect();
  let notification;
  let createdIncident;

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO incidents
         (reporter_id, incident_type, people_involved, visible_injuries,
          vehicles, description, location_name, latitude, longitude, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'reported')
       RETURNING ${incidentColumns}`,
      [
        reporterId,
        incident.incidentType,
        incident.peopleInvolved,
        incident.visibleInjuries,
        incident.vehicles,
        incident.description,
        incident.locationName,
        incident.latitude ?? null,
        incident.longitude ?? null,
      ],
    );
    createdIncident = result.rows[0];

    await client.query(
      `INSERT INTO incident_status_history
         (incident_id, previous_status, new_status, changed_by_user_id, created_at)
       VALUES ($1, NULL, 'reported', $2, $3)`,
      [createdIncident.id, reporterId, createdIncident.created_at],
    );
    notification = await createNotification({
      userId: reporterId,
      type: "incident_created",
      title: "Incident report submitted",
      message: "Your incident report was received by the platform. No emergency service or responder has been contacted.",
      incidentId: createdIncident.id,
    }, { queryable: client });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  publishNotification(notification);
  publishIncidentUpdate(reporterId, toIncident(createdIncident));
  return toIncident(createdIncident);
}

export async function listIncidents(reporterId) {
  const result = await getPool().query(
    `SELECT ${incidentColumns}
     FROM incidents
     WHERE reporter_id = $1
     ORDER BY created_at DESC, id DESC`,
    [reporterId],
  );
  return result.rows.map(toIncident);
}

export async function getIncident(reporterId, incidentId) {
  validateId(incidentId);
  const result = await getPool().query(
    `SELECT ${incidentColumns}
     FROM incidents
     WHERE id = $1 AND reporter_id = $2`,
    [incidentId, reporterId],
  );
  return result.rows[0] ? toIncident(result.rows[0]) : null;
}

export async function updateIncident(reporterId, incidentId, body) {
  validateId(incidentId);
  const incident = validateRequest(body, { partial: true });
  const columnNames = {
    incidentType: "incident_type",
    peopleInvolved: "people_involved",
    visibleInjuries: "visible_injuries",
    vehicles: "vehicles",
    description: "description",
    locationName: "location_name",
    latitude: "latitude",
    longitude: "longitude",
  };
  const fields = Object.keys(incident);
  const values = [incidentId, reporterId];
  const setClauses = fields.map((field, index) => {
    values.push(incident[field]);
    return `${columnNames[field]} = $${index + 3}`;
  });
  setClauses.push("updated_at = CURRENT_TIMESTAMP");

  const result = await getPool().query(
    `UPDATE incidents
     SET ${setClauses.join(", ")}
     WHERE id = $1 AND reporter_id = $2
     RETURNING ${incidentColumns}`,
    values,
  );
  return result.rows[0] ? toIncident(result.rows[0]) : null;
}

export async function listIncidentHistory(reporterId, incidentId) {
  validateId(incidentId);
  const result = await getPool().query(
    `SELECT history.previous_status, history.new_status,
            history.changed_by_user_id, history.created_at
     FROM incident_status_history history
     JOIN incidents incident ON incident.id = history.incident_id
     WHERE incident.id = $1 AND incident.reporter_id = $2
     ORDER BY history.created_at ASC, history.id ASC`,
    [incidentId, reporterId],
  );

  if (result.rowCount === 0) {
    const incidentResult = await getPool().query(
      "SELECT 1 FROM incidents WHERE id = $1 AND reporter_id = $2",
      [incidentId, reporterId],
    );
    if (incidentResult.rowCount === 0) {
      return null;
    }
  }

  return result.rows.map((row) => ({
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    changedByUserId: row.changed_by_user_id,
    createdAt: row.created_at,
  }));
}

export async function getIncidentStatus(reporterId, incidentId) {
  validateId(incidentId);
  const result = await getPool().query(
    `SELECT id, status, created_at, updated_at
     FROM incidents
     WHERE id = $1 AND reporter_id = $2`,
    [incidentId, reporterId],
  );
  const row = result.rows[0];
  return row ? {
    incidentId: row.id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } : null;
}

export async function transitionIncidentStatus(
  client,
  actor,
  incidentId,
  nextStatus,
  pendingEvents = { notifications: [], incidentUpdates: [] },
) {
  validateId(incidentId);
  if (!actor || !["responder", "admin"].includes(actor.role)) {
    throw httpError(403, "Only an authorized responder or admin can update incident status.");
  }
  if (!incidentStatuses.has(nextStatus)) {
    throw httpError(400, "The requested incident status is not valid.");
  }

  const currentResult = await client.query(
    `SELECT status, assigned_responder_user_id, reporter_id
     FROM incidents WHERE id = $1 FOR UPDATE`,
    [incidentId],
  );
  const current = currentResult.rows[0];
  if (!current) {
    return null;
  }

  if (actor.role === "responder" && current.assigned_responder_user_id !== actor.id) {
    throw httpError(403, "A responder can update status only for an incident assigned to them.");
  }

  if (!allowedTransitions.get(current.status).has(nextStatus)) {
    throw httpError(409, "This incident status transition is not allowed.");
  }

  const updatedResult = await client.query(
    `UPDATE incidents
     SET status = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING ${incidentColumns}`,
    [incidentId, nextStatus],
  );
  await client.query(
    `INSERT INTO incident_status_history
       (incident_id, previous_status, new_status, changed_by_user_id)
     VALUES ($1, $2, $3, $4)`,
    [incidentId, current.status, nextStatus, actor.id],
  );

  const notificationContent = statusNotificationContent.get(nextStatus);
  if (notificationContent) {
    const notification = await createNotification({
      userId: current.reporter_id,
      type: notificationContent.type,
      title: notificationContent.title,
      message: notificationContent.message,
      incidentId,
    }, { queryable: client });
    pendingEvents.notifications.push(notification);
  }

  const updatedIncident = updatedResult.rows[0];
  const incidentRecipients = [current.reporter_id, current.assigned_responder_user_id].filter(Boolean);
  for (const userId of new Set(incidentRecipients)) {
    pendingEvents.incidentUpdates.push({ userId, incident: updatedIncident });
  }

  if (["resolved", "cancelled"].includes(nextStatus) && current.assigned_responder_user_id) {
    await client.query(
      `UPDATE responder_profiles
       SET availability = 'available', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_active = TRUE AND is_verified = TRUE`,
      [current.assigned_responder_user_id],
    );
  }

  return toIncident(updatedIncident);
}

export async function updateIncidentStatus(actor, incidentId, body) {
  validateId(incidentId);
  if (!body || typeof body !== "object" || Array.isArray(body)
    || Object.keys(body).length !== 1 || typeof body.status !== "string") {
    throw httpError(400, "Provide only a valid status value.");
  }
  const nextStatus = body.status.trim();
  if (nextStatus === "responder_assigned") {
    throw httpError(400, "Use the responder assignment endpoint to assign a responder.");
  }

  const client = await getPool().connect();
  let transactionStarted = false;
  const pendingEvents = { notifications: [], incidentUpdates: [] };

  try {
    await client.query("BEGIN");
    transactionStarted = true;
    const updatedIncident = await transitionIncidentStatus(client, actor, incidentId, nextStatus, pendingEvents);
    if (!updatedIncident) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return null;
    }
    await client.query("COMMIT");
    transactionStarted = false;
    for (const notification of pendingEvents.notifications) publishNotification(notification);
    for (const event of pendingEvents.incidentUpdates) publishIncidentUpdate(event.userId, toIncident(event.incident));
    return updatedIncident;
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function updateIncidentLocation(reporterId, incidentId, body) {
  validateId(incidentId);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw httpError(400, "Request body must be a JSON object.");
  }

  const allowedLocationFields = new Set(["latitude", "longitude", "address"]);
  const fields = Object.keys(body);
  if (fields.length === 0 || fields.some((field) => !allowedLocationFields.has(field))) {
    throw httpError(400, "Provide valid location fields only.");
  }

  for (const field of ["latitude", "longitude"]) {
    const value = body[field];
    const maximum = field === "latitude" ? 90 : 180;
    if (value !== undefined && value !== null
      && (typeof value !== "number" || !Number.isFinite(value) || value < -maximum || value > maximum)) {
      throw httpError(400, `The ${field} must be a valid geographic coordinate.`);
    }
  }

  let address;
  if (body.address !== undefined) {
    if (typeof body.address !== "string" || body.address.trim().length < 2 || body.address.trim().length > 255) {
      throw httpError(400, "Address must be between 2 and 255 characters.");
    }
    address = body.address.trim();
  }

  const client = await getPool().connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;
    const currentResult = await client.query(
      `SELECT location_name, latitude, longitude
       FROM incidents
       WHERE id = $1 AND reporter_id = $2
       FOR UPDATE`,
      [incidentId, reporterId],
    );
    const current = currentResult.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return null;
    }

    const latitude = body.latitude === undefined ? current.latitude : body.latitude;
    const longitude = body.longitude === undefined ? current.longitude : body.longitude;
    if ((latitude === null) !== (longitude === null)) {
      throw httpError(400, "Latitude and longitude must both be provided or both be null.");
    }

    const result = await client.query(
      `UPDATE incidents
       SET latitude = $3, longitude = $4, location_name = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND reporter_id = $2
       RETURNING location_name, latitude, longitude, updated_at`,
      [incidentId, reporterId, latitude, longitude, address ?? current.location_name],
    );
    await client.query("COMMIT");
    transactionStarted = false;
    const row = result.rows[0];
    return {
      address: row.location_name,
      latitude: row.latitude,
      longitude: row.longitude,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    client.release();
  }
}