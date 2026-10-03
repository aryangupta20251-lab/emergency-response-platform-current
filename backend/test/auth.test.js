import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { closeDatabasePool, getPool } from "../src/db/pool.js";

const email = `auth-${randomUUID()}@example.test`;
const disabledEmail = `disabled-${randomUUID()}@example.test`;
const phoneNumber = "+15558675309";
const password = "TestOnly-Password-2026!";
const userName = "Authentication Test";
let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  try {
    await getPool().query(
      "DELETE FROM users WHERE email = ANY($1::text[]) OR phone_number = $2",
      [[email, disabledEmail], phoneNumber],
    );
  } finally {
    if (server?.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabasePool();
  }
});

async function request(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return { status: response.status, body: await response.json() };
}

function registration(overrides = {}) {
  return {
    name: userName,
    identifier: email,
    password,
    ...overrides,
  };
}

test("registration, login, and token authentication", async (context) => {
  await context.test("rejects missing or invalid registration fields", async () => {
    const invalidRequests = [
      null,
      registration({ name: "" }),
      registration({ identifier: "" }),
      registration({ password: "" }),
      registration({ identifier: "not-an-email" }),
      registration({ password: "12345" }),
      registration({ password: "x".repeat(73) }),
    ];

    for (const body of invalidRequests) {
      const response = await request("/api/auth/register", { method: "POST", body });
      assert.equal(response.status, 400);
      assert.equal(response.body.success, false);
    }
  });

  let registeredUser;
  await context.test("registers a citizen without returning a password", async () => {
    const response = await request("/api/auth/register", {
      method: "POST",
      body: registration({ role: "admin" }),
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.success, true);
    assert.equal(response.body.user.role, "citizen");
    assert.equal(response.body.user.identifier, email);
    assert.equal("password" in response.body.user, false);
    assert.equal("password_hash" in response.body.user, false);
    registeredUser = response.body.user;

    const result = await getPool().query(
      "SELECT password_hash FROM users WHERE id = $1",
      [registeredUser.id],
    );
    assert.notEqual(result.rows[0].password_hash, password);
    assert.equal(await bcrypt.compare(password, result.rows[0].password_hash), true);
  });

  await context.test("prevents duplicate email registration", async () => {
    const response = await request("/api/auth/register", {
      method: "POST",
      body: registration({ identifier: email.toUpperCase() }),
    });

    assert.equal(response.status, 409);
    assert.match(response.body.message, /already exists/i);
  });

  await context.test("supports registering and logging in by phone", async () => {
    const registrationResponse = await request("/api/auth/register", {
      method: "POST",
      body: registration({ identifier: "+1 (555) 867-5309" }),
    });

    assert.equal(registrationResponse.status, 201);
    assert.equal(registrationResponse.body.user.phoneNumber, phoneNumber);

    const loginResponse = await request("/api/auth/login", {
      method: "POST",
      body: { identifier: "+1 (555) 867-5309", password },
    });
    assert.equal(loginResponse.status, 200);
    assert.equal(loginResponse.body.user.identifier, phoneNumber);
  });

  let token;
  await context.test("logs in and issues a minimal expiring JWT", async () => {
    const response = await request("/api/auth/login", {
      method: "POST",
      body: { identifier: email, password },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(typeof response.body.token, "string");
    assert.equal("password" in response.body, false);
    assert.equal("password_hash" in response.body.user, false);
    token = response.body.token;

    const claims = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] });
    assert.equal(claims.sub, registeredUser.id);
    assert.equal(claims.role, "citizen");
    assert.equal("email" in claims, false);
    assert.equal("name" in claims, false);
    assert.ok(claims.exp > claims.iat);
  });

  await context.test("password reset links are single-use, hashed at rest, and expire", async () => {
    const previousToken = token;
    let resetLink = "";
    let requestReset;
    const originalInfo = console.info;
    console.info = (message) => { resetLink = String(message).slice(String(message).indexOf("http")); };
    try {
      requestReset = await request("/api/auth/password-reset/request", {
        method: "POST",
        body: { identifier: email },
      });
      assert.equal(requestReset.status, 202);
      assert.match(requestReset.body.message, /if an active account matches/i);
    } finally {
      console.info = originalInfo;
    }

    const resetToken = new URL(resetLink).searchParams.get("token");
    assert.match(resetToken, /^[A-Za-z0-9_-]{43}$/);
    const storedToken = await getPool().query(
      "SELECT token_hash, expires_at, consumed_at FROM password_reset_tokens WHERE user_id = $1",
      [registeredUser.id],
    );
    assert.equal(storedToken.rowCount, 1);
    assert.notEqual(storedToken.rows[0].token_hash, resetToken);
    assert.equal(storedToken.rows[0].consumed_at, null);
    assert.ok(new Date(storedToken.rows[0].expires_at).getTime() > Date.now());

    const invalid = await request("/api/auth/password-reset/confirm", {
      method: "POST",
      body: { token: "invalid", password: "Changed-Password-2026!" },
    });
    assert.equal(invalid.status, 400);

    const updated = await request("/api/auth/password-reset/confirm", {
      method: "POST",
      body: { token: resetToken, password: "Changed-Password-2026!" },
    });
    assert.equal(updated.status, 200);
    const reused = await request("/api/auth/password-reset/confirm", {
      method: "POST",
      body: { token: resetToken, password: "Another-Password-2026!" },
    });
    assert.equal(reused.status, 400);
    await getPool().query(
      `UPDATE password_reset_tokens
       SET consumed_at = NULL,
           created_at = CURRENT_TIMESTAMP - INTERVAL '2 hours',
           expires_at = CURRENT_TIMESTAMP - INTERVAL '1 second'
       WHERE user_id = $1`,
      [registeredUser.id],
    );
    const expired = await request("/api/auth/password-reset/confirm", {
      method: "POST",
      body: { token: resetToken, password: "Another-Password-2026!" },
    });
    assert.equal(expired.status, 400);

    const oldPassword = await request("/api/auth/login", {
      method: "POST",
      body: { identifier: email, password },
    });
    const newPassword = await request("/api/auth/login", {
      method: "POST",
      body: { identifier: email, password: "Changed-Password-2026!" },
    });
    assert.equal(oldPassword.status, 401);
    assert.equal(newPassword.status, 200);
    token = newPassword.body.token;
    const invalidatedSession = await request("/api/auth/me", { token: previousToken });
    assert.equal(invalidatedSession.status, 401);

    const unknownRequest = await request("/api/auth/password-reset/request", {
      method: "POST",
      body: { identifier: `missing-${randomUUID()}@example.test` },
    });
    assert.equal(unknownRequest.status, requestReset.status);
    assert.equal(unknownRequest.body.message, requestReset.body.message);
  });

  await context.test("uses the same generic response for incorrect and unknown credentials", async () => {
    const wrongPassword = await request("/api/auth/login", {
      method: "POST",
      body: { identifier: email, password: "incorrect-password" },
    });
    const unknownUser = await request("/api/auth/login", {
      method: "POST",
      body: { identifier: `unknown-${randomUUID()}@example.test`, password },
    });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownUser.status, 401);
    assert.equal(wrongPassword.body.message, "Invalid email or password.");
    assert.equal(unknownUser.body.message, wrongPassword.body.message);

    const missingCredentials = await request("/api/auth/login", {
      method: "POST",
      body: { identifier: email },
    });
    assert.equal(missingCredentials.status, 400);

    const nullBody = await request("/api/auth/login", {
      method: "POST",
      body: null,
    });
    assert.equal(nullBody.status, 400);
  });

  await context.test("rejects disabled accounts without revealing account status", async () => {
    const passwordHash = await bcrypt.hash(password, 12);
    await getPool().query(
      `INSERT INTO users (name, email, password_hash, role, account_status)
       VALUES ($1, $2, $3, 'citizen', 'disabled')`,
      [userName, disabledEmail, passwordHash],
    );

    const response = await request("/api/auth/login", {
      method: "POST",
      body: { identifier: disabledEmail, password },
    });
    assert.equal(response.status, 401);
    assert.equal(response.body.message, "Invalid email or password.");
  });

  await context.test("protects /me against missing, invalid, and expired tokens", async () => {
    const missingToken = await request("/api/auth/me");
    const invalidToken = await request("/api/auth/me", { token: "not-a-jwt" });
    const now = Math.floor(Date.now() / 1000);
    const expiredToken = jwt.sign(
      { sub: registeredUser.id, role: "citizen", iat: now - 20, exp: now - 10 },
      env.jwtSecret,
      { algorithm: "HS256" },
    );
    const expired = await request("/api/auth/me", { token: expiredToken });

    assert.equal(missingToken.status, 401);
    assert.equal(invalidToken.status, 401);
    assert.equal(expired.status, 401);
  });

  await context.test("returns only safe authenticated user information from /me", async () => {
    const response = await request("/api/auth/me", { token });

    assert.equal(response.status, 200);
    assert.equal(response.body.user.id, registeredUser.id);
    assert.equal(response.body.user.role, "citizen");
    assert.equal("password" in response.body.user, false);
    assert.equal("password_hash" in response.body.user, false);
  });

  await context.test("rejects tokens after account role or status changes", async () => {
    await getPool().query(
      "UPDATE users SET role = 'responder' WHERE id = $1",
      [registeredUser.id],
    );
    const staleRole = await request("/api/auth/me", { token });
    assert.equal(staleRole.status, 401);

    await getPool().query(
      "UPDATE users SET role = 'citizen', account_status = 'disabled' WHERE id = $1",
      [registeredUser.id],
    );
    const disabledAccount = await request("/api/auth/me", { token });
    assert.equal(disabledAccount.status, 401);
    assert.equal(disabledAccount.body.message, "Invalid or expired token.");
  });
});