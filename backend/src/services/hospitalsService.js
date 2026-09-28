import { getPool } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";

const hospitalTypes = new Map([
  ["general", "general"],
  ["government", "government"],
  ["private", "private"],
  ["trauma_center", "trauma_center"],
  ["trauma centre", "trauma_center"],
  ["trauma center", "trauma_center"],
  ["specialty", "specialty"],
]);
const typeLabels = new Map([
  ["general", "General"],
  ["government", "Government"],
  ["private", "Private"],
  ["trauma_center", "Trauma centre"],
  ["specialty", "Specialty"],
]);
const hospitalSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const radiusMaximumKm = 50;

const hospitalColumns = `
  slug, name, hospital_type, address, city, state, postal_code,
  latitude, longitude, phone_number, description, operating_hours,
  emergency_available, is_demo, data_source
`;

function parseType(value) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !hospitalTypes.has(value.trim().toLowerCase())) {
    throw httpError(400, "Hospital type filter is invalid.");
  }
  return hospitalTypes.get(value.trim().toLowerCase());
}

function parseEmergency(value) {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw httpError(400, "Emergency filter must be true or false.");
}

function parseCity(value) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim().length < 2 || value.trim().length > 100) {
    throw httpError(400, "City filter must be between 2 and 100 characters.");
  }
  return value.trim();
}

function parseFilters(query) {
  return {
    type: parseType(query.type),
    emergency: parseEmergency(query.emergency),
    city: parseCity(query.city),
  };
}

function addFilterConditions(filters, values, alias = "hospital") {
  const conditions = [];
  if (filters.type !== undefined) {
    values.push(filters.type);
    conditions.push(`${alias}.hospital_type = $${values.length}`);
  }
  if (filters.emergency !== undefined) {
    values.push(filters.emergency);
    conditions.push(`${alias}.emergency_available = $${values.length}`);
  }
  if (filters.city !== undefined) {
    values.push(filters.city);
    conditions.push(`lower(${alias}.city) = lower($${values.length})`);
  }
  return conditions;
}

function toHospital(row) {
  return {
    id: row.slug,
    name: row.name,
    type: typeLabels.get(row.hospital_type),
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone_number,
    description: row.description,
    hours: row.operating_hours,
    emergencyAvailable: row.emergency_available,
    availabilityIsLive: false,
    isDemo: row.is_demo,
    dataSource: row.data_source,
    ...(row.distance_km === undefined ? {} : { distanceKm: Number(row.distance_km) }),
  };
}

function validateSlug(slug) {
  if (typeof slug !== "string" || slug.length > 80 || !hospitalSlugPattern.test(slug)) {
    throw httpError(400, "Hospital ID is invalid.");
  }
}

function parseCoordinate(value, field, minimum, maximum) {
  if (value === undefined || value === "") {
    throw httpError(400, `${field} is required.`);
  }
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) {
    throw httpError(400, `${field} must be a valid geographic coordinate.`);
  }
  return coordinate;
}

function parseRadius(value) {
  if (value === undefined) return 10;
  const radius = Number(value);
  if (!Number.isFinite(radius) || radius <= 0 || radius > radiusMaximumKm) {
    throw httpError(400, `Radius must be greater than 0 and no more than ${radiusMaximumKm} km.`);
  }
  return radius;
}

export async function listHospitals(query) {
  const filters = parseFilters(query);
  const values = [];
  const conditions = ["hospital.is_active = TRUE", ...addFilterConditions(filters, values)];
  const result = await getPool().query(
    `SELECT ${hospitalColumns}
     FROM hospitals hospital
     WHERE ${conditions.join(" AND ")}
     ORDER BY hospital.name, hospital.slug`,
    values,
  );
  return result.rows.map(toHospital);
}

export async function getHospital(slug) {
  validateSlug(slug);
  const result = await getPool().query(
    `SELECT ${hospitalColumns}
     FROM hospitals
     WHERE slug = $1 AND is_active = TRUE`,
    [slug],
  );
  return result.rows[0] ? toHospital(result.rows[0]) : null;
}

export async function findNearbyHospitals(query) {
  const latitude = parseCoordinate(query.latitude, "Latitude", -90, 90);
  const longitude = parseCoordinate(query.longitude, "Longitude", -180, 180);
  const radiusKm = parseRadius(query.radius);
  const filters = parseFilters(query);
  const values = [latitude, longitude, radiusKm];
  const conditions = ["hospital.is_active = TRUE", ...addFilterConditions(filters, values)];

  const result = await getPool().query(
    `SELECT nearby.*
     FROM (
       SELECT ${hospitalColumns},
         6371.0 * 2 * ASIN(SQRT(LEAST(1.0, GREATEST(0.0,
           POWER(SIN(RADIANS(hospital.latitude - $1) / 2), 2)
           + COS(RADIANS($1)) * COS(RADIANS(hospital.latitude))
           * POWER(SIN(RADIANS(hospital.longitude - $2) / 2), 2)
         )))) AS distance_km
       FROM hospitals hospital
       WHERE ${conditions.join(" AND ")}
     ) nearby
     WHERE nearby.distance_km <= $3
     ORDER BY nearby.distance_km, nearby.slug`,
    values,
  );

  return result.rows.map(toHospital);
}