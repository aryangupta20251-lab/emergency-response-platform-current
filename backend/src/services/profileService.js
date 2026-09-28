import { getPool } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";

const editableProfileFields = new Set(["name", "identifier"]);

function getRequestBody(body) {
  return body && typeof body === "object" && !Array.isArray(body) ? body : {};
}

function normalizeIdentifier(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed.includes("@")
    ? trimmed.toLowerCase()
    : trimmed.replace(/[\s().-]/g, "");
}

function toProfile(row) {
  return {
    success: true,
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      phoneNumber: row.phone_number,
      identifier: row.email || row.phone_number,
      role: row.role,
    },
    profile: {
      userId: row.id,
      createdAt: row.profile_created_at,
      updatedAt: row.profile_updated_at,
    },
  };
}

const profileSelect = `
  SELECT u.id, u.name, u.email, u.phone_number, u.role,
         p.created_at AS profile_created_at, p.updated_at AS profile_updated_at
  FROM users u
  JOIN profiles p ON p.user_id = u.id
  WHERE u.id = $1 AND u.account_status = 'active'
`;

export async function getProfile(userId) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO profiles (user_id)
     SELECT id FROM users WHERE id = $1 AND account_status = 'active'
     ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  );

  const result = await pool.query(profileSelect, [userId]);
  return result.rows[0] ? toProfile(result.rows[0]) : null;
}

export async function updateProfile(userId, requestBody) {
  const body = getRequestBody(requestBody);
  if (Object.keys(body).some((field) => !editableProfileFields.has(field))) {
    throw httpError(400, "One or more profile fields cannot be changed here.");
  }

  if (typeof body.name !== "string") {
    throw httpError(400, "Provide a name to update.");
  }

  const name = body.name.trim();
  if (name.length < 2 || name.length > 100) {
    throw httpError(400, "Name must be between 2 and 100 characters.");
  }

  const client = await getPool().connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const userResult = await client.query(
      `SELECT id, email, phone_number
       FROM users
       WHERE id = $1 AND account_status = 'active'
       FOR UPDATE`,
      [userId],
    );
    const user = userResult.rows[0];

    if (!user) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      return null;
    }

    if (body.identifier !== undefined
      && normalizeIdentifier(body.identifier) !== normalizeIdentifier(user.email || user.phone_number)) {
      throw httpError(400, "Email or phone number is a login identifier and cannot be changed here.");
    }

    await client.query(
      `INSERT INTO profiles (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );
    await client.query(
      "UPDATE users SET name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [userId, name],
    );
    await client.query(
      "UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE user_id = $1",
      [userId],
    );

    const result = await client.query(profileSelect, [userId]);
    await client.query("COMMIT");
    transactionStarted = false;
    return result.rows[0] ? toProfile(result.rows[0]) : null;
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    client.release();
  }
}