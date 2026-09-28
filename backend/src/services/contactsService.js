import { getPool } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";

const allowedFields = new Set(["name", "relation", "relationship", "phone", "email"]);
const uuidPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function getRequestBody(body) {
  return body && typeof body === "object" && !Array.isArray(body) ? body : {};
}

function validateContact(body) {
  const details = getRequestBody(body);
  if (Object.keys(details).some((field) => !allowedFields.has(field))) {
    throw httpError(400, "The request contains unsupported contact fields.");
  }

  const name = typeof details.name === "string" ? details.name.trim() : "";
  const relationshipValue = details.relation ?? details.relationship;
  const relationship = typeof relationshipValue === "string" ? relationshipValue.trim() : "";
  const phoneValue = typeof details.phone === "string" ? details.phone.trim() : "";
  const phone = phoneValue.replace(/[\s().-]/g, "");

  if (name.length < 2 || name.length > 100) {
    throw httpError(400, "Contact name must be between 2 and 100 characters.");
  }
  if (relationship.length < 1 || relationship.length > 50) {
    throw httpError(400, "Relationship must be between 1 and 50 characters.");
  }
  if (!/^\+?[1-9]\d{6,14}$/.test(phone)) {
    throw httpError(400, "Enter a valid contact phone number.");
  }

  let email = null;
  if (details.email !== undefined && details.email !== null && details.email !== "") {
    if (typeof details.email !== "string") {
      throw httpError(400, "Enter a valid contact email address.");
    }
    email = details.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw httpError(400, "Enter a valid contact email address.");
    }
  }

  return { name, relationship, phone, email };
}

function validateContactId(contactId) {
  if (typeof contactId !== "string" || !uuidPattern.test(contactId)) {
    throw httpError(400, "Contact ID must be a valid UUID.");
  }
}

function toContact(row) {
  return {
    id: row.id,
    name: row.contact_name,
    relation: row.relationship,
    phone: row.phone_number,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const contactColumns = `
  id, contact_name, relationship, phone_number, email, created_at, updated_at
`;

export async function listContacts(userId) {
  const result = await getPool().query(
    `SELECT ${contactColumns}
     FROM emergency_contacts
     WHERE user_id = $1
     ORDER BY created_at, id`,
    [userId],
  );
  return result.rows.map(toContact);
}

export async function createContact(userId, body) {
  const contact = validateContact(body);
  const result = await getPool().query(
    `INSERT INTO emergency_contacts
       (user_id, contact_name, relationship, phone_number, email)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${contactColumns}`,
    [userId, contact.name, contact.relationship, contact.phone, contact.email],
  );
  return toContact(result.rows[0]);
}

export async function updateContact(userId, contactId, body) {
  validateContactId(contactId);
  const contact = validateContact(body);
  const result = await getPool().query(
    `UPDATE emergency_contacts
     SET contact_name = $3, relationship = $4, phone_number = $5, email = $6,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2
     RETURNING ${contactColumns}`,
    [contactId, userId, contact.name, contact.relationship, contact.phone, contact.email],
  );
  return result.rows[0] ? toContact(result.rows[0]) : null;
}

export async function deleteContact(userId, contactId) {
  validateContactId(contactId);
  const result = await getPool().query(
    "DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2",
    [contactId, userId],
  );
  return result.rowCount > 0;
}