import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { getPool } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";
import { deliverPasswordReset } from "./passwordResetDelivery.js";

const bcryptRounds = 12;
const maximumPasswordBytes = 72;
const passwordResetLifetimeMinutes = 30;
const passwordResetCooldownSeconds = 60;

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

function toSessionUser(row) {
  return { ...toPublicUser(row), sessionVersion: Number(row.session_version) };
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
    `SELECT id, name, email, phone_number, password_hash, role, account_status, session_version
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

  return toSessionUser(row);
}

export async function findActiveUserById(userId) {
  const result = await getPool().query(
    `SELECT id, name, email, phone_number, role, session_version
     FROM users
     WHERE id = $1 AND account_status = 'active'`,
    [userId],
  );
  return result.rows[0] ? toSessionUser(result.rows[0]) : null;
}

function hashResetToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(details = {}) {
  details = getRequestDetails(details);
  const identifier = normalizeIdentifier(getSubmittedIdentifier(details));
  const result = await getPool().query(
    `SELECT id, email, phone_number
     FROM users
     WHERE account_status = 'active'
       AND (($1::text IS NOT NULL AND lower(email) = $1)
         OR ($2::text IS NOT NULL AND phone_number = $2))
     LIMIT 1`,
    [identifier.email, identifier.phoneNumber],
  );
  const user = result.rows[0];
  if (!user) return;

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + passwordResetLifetimeMinutes * 60_000);
  const client = await getPool().connect();
  let transactionStarted = false;
  let tokenStored = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;
    await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [user.id]);
    const recent = await client.query(
      `SELECT 1 FROM password_reset_tokens
       WHERE user_id = $1
         AND created_at > CURRENT_TIMESTAMP - ($2 * INTERVAL '1 second')
       LIMIT 1`,
      [user.id, passwordResetCooldownSeconds],
    );
    if (recent.rowCount > 0) {
      await client.query("COMMIT");
      transactionStarted = false;
      return;
    }

    await client.query(
      `UPDATE password_reset_tokens
       SET consumed_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND consumed_at IS NULL`,
      [user.id],
    );
    await client.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt],
    );
    await client.query("COMMIT");
    transactionStarted = false;
    tokenStored = true;
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  if (!tokenStored) return;

  try {
    await deliverPasswordReset({
      recipient: user.email || user.phone_number,
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    await getPool().query(
      `UPDATE password_reset_tokens
       SET consumed_at = CURRENT_TIMESTAMP
       WHERE token_hash = $1 AND consumed_at IS NULL`,
      [tokenHash],
    );
    throw error;
  }
}

export async function resetPassword({ token, password } = {}) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return false;
  }
  validatePassword(password);
  const passwordHash = await bcrypt.hash(password, bcryptRounds);
  const client = await getPool().connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;
    const result = await client.query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = $1
         AND consumed_at IS NULL
         AND expires_at > CURRENT_TIMESTAMP
       FOR UPDATE`,
      [hashResetToken(token)],
    );
    const reset = result.rows[0];
    if (!reset) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return false;
    }

    await client.query(
      `UPDATE users
       SET password_hash = $2,
           session_version = session_version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [reset.user_id, passwordHash],
    );
    await client.query(
      `UPDATE password_reset_tokens
       SET consumed_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND consumed_at IS NULL`,
      [reset.user_id],
    );
    await client.query("COMMIT");
    transactionStarted = false;
    return true;
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}