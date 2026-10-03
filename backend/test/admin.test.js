import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { app } from "../src/app.js";
import { closeDatabasePool, getPool } from "../src/db/pool.js";

const testPassword = "Admin-Tests-2026!";
let server;
let baseUrl;
const createdUserIds = [];

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

async function createUser(label, role = "citizen") {
  const identifier = `${label}-${randomUUID()}@example.test`;
  const register = await request("/api/auth/register", {
    method: "POST",
    body: { name: `${label} User`, identifier, password: testPassword },
  });
  assert.equal(register.status, 201, `register failed for ${label}`);
  const login = await request("/api/auth/login", {
    method: "POST",
    body: { identifier, password: testPassword },
  });
  assert.equal(login.status, 200, `login failed for ${label}`);
  const user = login.body.user;
  createdUserIds.push(user.id);
  let token = login.body.token;
  if (role !== "citizen") {
    await getPool().query("UPDATE users SET role = $2 WHERE id = $1", [user.id, role]);
    user.role = role;
    const roleLogin = await request("/api/auth/login", {
      method: "POST",
      body: { identifier, password: testPassword },
    });
    assert.equal(roleLogin.status, 200, `role login failed for ${label}`);
    token = roleLogin.body.token;
  }
  return { user, token };
}

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
    if (server?.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (createdUserIds.length > 0) {
      await getPool().query(
        `DELETE FROM incidents
         WHERE reporter_id = ANY($1::uuid[])
            OR assigned_responder_user_id = ANY($1::uuid[])`,
        [createdUserIds],
      );
      await getPool().query("DELETE FROM users WHERE id = ANY($1::uuid[])", [createdUserIds]);
    }
  } finally {
    await closeDatabasePool();
  }
});

test("admin authorization and management APIs are enforced", async (context) => {
  const citizen = await createUser("admin-citizen");
  const responder = await createUser("admin-responder", "responder");
  const admin = await createUser("admin-admin", "admin");

  await context.test("unauthenticated and non-admin users are rejected", async () => {
    const routes = [
      "/api/admin/users",
      "/api/admin/responders",
      "/api/admin/incidents",
      "/api/admin/statistics",
    ];
    for (const route of routes) {
      const response = await request(route);
      assert.equal(response.status, 401, `${route} should require auth`);
    }

    const citizenList = await request("/api/admin/users", { token: citizen.token });
    const responderList = await request("/api/admin/users", { token: responder.token });
    assert.equal(citizenList.status, 403);
    assert.equal(responderList.status, 403);
  });

  await context.test("admin can list users, search and paginate safely", async () => {
    const list = await request("/api/admin/users?page=1&limit=2", { token: admin.token });
    assert.equal(list.status, 200);
    assert.equal(list.body.success, true);
    assert.ok(Array.isArray(list.body.users));
    assert.ok(list.body.page >= 1);
    assert.ok(list.body.limit >= 1);
    assert.equal("password_hash" in list.body.users[0], false);
    assert.equal("password" in list.body.users[0], false);

    const search = await request("/api/admin/users?search=admin-admin", { token: admin.token });
    assert.equal(search.status, 200);
    assert.ok(search.body.users.some((user) => user.email.includes("admin-admin")));

    const roleFiltered = await request("/api/admin/users?role=admin", { token: admin.token });
    assert.equal(roleFiltered.status, 200);
    assert.ok(roleFiltered.body.users.every((user) => user.role === "admin"));
  });

  await context.test("admin can update user role and status but not self-escalate", async () => {
    const target = await createUser("admin-target");
    const roleUpdate = await request(`/api/admin/users/${target.user.id}/role`, {
      method: "PATCH",
      token: admin.token,
      body: { role: "responder" },
    });
    assert.equal(roleUpdate.status, 200);
    assert.equal(roleUpdate.body.user.role, "responder");

    const selfDemote = await request(`/api/admin/users/${admin.user.id}/role`, {
      method: "PATCH",
      token: admin.token,
      body: { role: "citizen" },
    });
    assert.equal(selfDemote.status, 403);

    const disabled = await request(`/api/admin/users/${target.user.id}/status`, {
      method: "PATCH",
      token: admin.token,
      body: { status: "disabled" },
    });
    assert.equal(disabled.status, 200);
    assert.equal(disabled.body.user.accountStatus, "disabled");
  });

  await context.test("admin can manage responder verification and view pending responders", async () => {
    const responderUser = await createUser("admin-responder-profile", "responder");
    await getPool().query(
      `INSERT INTO responder_profiles (user_id, responder_type, is_active, is_verified, availability)
       VALUES ($1, 'paramedic', TRUE, FALSE, 'available')
       ON CONFLICT (user_id) DO UPDATE SET responder_type = EXCLUDED.responder_type, is_active = TRUE, is_verified = FALSE, availability = 'available'`,
      [responderUser.user.id],
    );

    const pending = await request("/api/admin/responders/pending", { token: admin.token });
    assert.equal(pending.status, 200);
    assert.ok(pending.body.responders.some((item) => item.userId === responderUser.user.id));

    const verify = await request(`/api/admin/responders/${responderUser.user.id}/verification`, {
      method: "PATCH",
      token: admin.token,
      body: { status: "verified" },
    });
    assert.equal(verify.status, 200);
    assert.equal(verify.body.responder.isVerified, true);

    const reject = await request(`/api/admin/responders/${responderUser.user.id}/verification`, {
      method: "PATCH",
      token: admin.token,
      body: { status: "rejected" },
    });
    assert.equal(reject.status, 200);
    assert.equal(reject.body.responder.isVerified, false);
  });

  await context.test("admin can review incidents and statistics", async () => {
    const citizenIncident = await request("/api/incidents", {
      method: "POST",
      token: citizen.token,
      body: {
        accidentType: "Vehicle collision",
        peopleInvolved: "2",
        injuries: "Unknown",
        vehicles: "Car",
        description: "Admin oversight incident.",
        location: { name: "Admin test zone" },
      },
    });
    assert.equal(citizenIncident.status, 201, "citizen incident creation failed");

    const list = await request("/api/admin/incidents?status=reported", { token: admin.token });
    assert.equal(list.status, 200);
    assert.ok(list.body.incidents.some((incident) => incident.id === citizenIncident.body.incident.id));

    const detail = await request(`/api/admin/incidents/${citizenIncident.body.incident.id}`, { token: admin.token });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.incident.id, citizenIncident.body.incident.id);

    const stats = await request("/api/admin/statistics", { token: admin.token });
    assert.equal(stats.status, 200);
    assert.ok(typeof stats.body.users === "number");
    assert.ok(typeof stats.body.activeIncidents === "number");
    assert.ok(typeof stats.body.verifiedResponders === "number");
  });
});
