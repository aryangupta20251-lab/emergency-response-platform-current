import bcrypt from "bcryptjs";
import { getPool } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";

const bcryptRounds = 12;
const maximumPasswordBytes = 72;

function normalizeIdentifier(identifier) {
  if (typeof identifier !== "string" || identifier.trim().length === 0) {
    throw httpError(400, "Enter a valid email or phone number.");
  }

  const value = identifier.trim();

  if (value.includes("@")) {
    const email = value.toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw httpError(400, "Enter a valid email address.");
    }
    return { email, phoneNumber: null };
  }

  const phoneNumber = value.replace(/[\s().-]/g, "");
  if (!/^\+?\d{7,15}$/.test(phoneNumber)) {
    throw httpError(400, "Enter a valid email or phone number.");
  }

  return { email: null, phoneNumber };
}

function getSubmittedIdentifier(details) {
  return details.identifier ?? details.email ?? details.phoneNumber ?? details.phone_number;
}

function getRequestDetails(details) {
  return details && typeof details === "object" && !Array.isArray(details) ? details : {};
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 6) {
    throw httpError(400, "Password must be at least 6 characters long.");
  }

  if (Buffer.byteLength(password, "utf8") > maximumPasswordBytes) {
    throw httpError(400, "Password must not exceed 72 UTF-8 bytes.");
  }
}

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phoneNumber: row.phone_number,
    identifier: row.email || row.phone_number,
    role: row.role,
  };
}

export async function registerUser(details = {}) {
  details = getRequestDetails(details);
  const name = typeof details.name === "string" ? details.name.trim() : "";
  if (name.length < 2 || name.length > 100) {
    throw httpError(400, "Name must be between 2 and 100 characters.");
  }

  const identifier = normalizeIdentifier(getSubmittedIdentifier(details));
  validatePassword(details.password);

  const pool = getPool();
  const existingUser = await pool.query(
    `SELECT 1 FROM users
     WHERE ($1::text IS NOT NULL AND lower(email) = $1)
        OR ($2::text IS NOT NULL AND phone_number = $2)
     LIMIT 1`,
    [identifier.email, identifier.phoneNumber],
  );

  if (existingUser.rowCount > 0) {
    throw httpError(409, "An account with this email or phone number already exists.");
  }

  const passwordHash = await bcrypt.hash(details.password, bcryptRounds);

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, phone_number, password_hash, role)
       VALUES ($1, $2, $3, $4, 'citizen')
       RETURNING id, name, email, phone_number, role`,
      [name, identifier.email, identifier.phoneNumber, passwordHash],
    );
    return toPublicUser(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      throw httpError(409, "An account with this email or phone number already exists.");
    }
    throw error;
  }
}

export async function authenticateUser(details = {}) {
  details = getRequestDetails(details);
  const submittedIdentifier = getSubmittedIdentifier(details);
  if (typeof submittedIdentifier !== "string" || !submittedIdentifier.trim()
    || typeof details.password !== "string" || !details.password) {
    throw httpError(400, "Email or phone number and password are required.");
  }

  if (Buffer.byteLength(details.password, "utf8") > maximumPasswordBytes) {
    return null;
  }

  const identifier = normalizeIdentifier(submittedIdentifier);
  const result = await getPool().query(
    `SELECT id, name, email, phone_number, password_hash, role, account_status
     FROM users
     WHERE email = $1 OR phone_number = $2
     LIMIT 1`,
    [identifier.email, identifier.phoneNumber],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(details.password, row.password_hash);
  if (!passwordMatches || row.account_status !== "active") {
    return null;
  }

  return toPublicUser(row);
}

export async function findActiveUserById(userId) {
  const result = await getPool().query(
    `SELECT id, name, email, phone_number, role
     FROM users
     WHERE id = $1 AND account_status = 'active'`,
    [userId],
  );
  return result.rows[0] ? toPublicUser(result.rows[0]) : null;
}