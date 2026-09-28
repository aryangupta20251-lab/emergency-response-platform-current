import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { app } from "../src/app.js";
import { closeDatabasePool, getPool } from "../src/db/pool.js";

const testPassword = "Incident-Tests-2026!";

async function request(baseUrl, path, { method = "GET", body, token } = {}) {
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

async function createTestUser(baseUrl, label) {
  const identifier = `${label}-${randomUUID()}@example.test`;
  const registration = await request(baseUrl, "/api/auth/register", {
    method: "POST",
    body: { name: `${label} Test User`, identifier, password: testPassword },
  });
  assert.equal(registration.status, 201);

  const login = await request(baseUrl, "/api/auth/login", {
    method: "POST",
    body: { identifier, password: testPassword },
  });
  assert.equal(login.status, 200);
  return { user: registration.body.user, token: login.body.token };
}

function incident(overrides = {}) {
  return {
    accidentType: "Vehicle collision",
    peopleInvolved: "2",
    injuries: "Unknown",
    vehicles: "Car",
    description: "A test report submitted through the existing form.",
    location: { name: "Sector 12, Chandigarh", source: "Demo location" },
    ...overrides,
  };
}

test("incident APIs validate reports and enforce authenticated ownership", async (context) => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const createdUserIds = [];

  try {
    const userA = await createTestUser(baseUrl, "incident-a");
    const userB = await createTestUser(baseUrl, "incident-b");
    const admin = await createTestUser(baseUrl, "incident-admin");
    createdUserIds.push(userA.user.id, userB.user.id, admin.user.id);
    await getPool().query("UPDATE users SET role = 'admin' WHERE id = $1", [admin.user.id]);
    const adminLogin = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      body: { identifier: admin.user.identifier, password: testPassword },
    });
    assert.equal(adminLogin.status, 200);
    admin.token = adminLogin.body.token;

    await context.test("all incident endpoints require authentication", async () => {
      const unauthenticatedRequests = [
        request(baseUrl, "/api/incidents", { method: "POST", body: incident() }),
        request(baseUrl, "/api/incidents"),
        request(baseUrl, `/api/incidents/${randomUUID()}`),
        request(baseUrl, `/api/incidents/${randomUUID()}`, { method: "PATCH", body: { description: "Update" } }),
      ];
      const responses = await Promise.all(unauthenticatedRequests);
      assert.deepEqual(responses.map(({ status }) => status), [401, 401, 401, 401]);
    });

    const invalidReports = [
      null,
      {},
      incident({ accidentType: "Other; DROP TABLE users; --" }),
      incident({ peopleInvolved: "0" }),
      incident({ injuries: "Maybe" }),
      incident({ vehicles: "Spaceship" }),
      incident({ description: "x".repeat(501) }),
      incident({ location: { name: " " } }),
      incident({ location: { name: "Valid", latitude: 91 } }),
      incident({ reporterId: userB.user.id }),
      incident({ status: "resolved" }),
      incident({ latitude: "not-a-number" }),
    ];

    await context.test("rejects incomplete, invalid, and unsupported create data", async () => {
      for (const body of invalidReports) {
        const response = await request(baseUrl, "/api/incidents", {
          method: "POST",
          token: userA.token,
          body,
        });
        assert.equal(response.status, 400);
        assert.equal(response.body.success, false);
      }
    });

    let incidentA;
    let incidentB;
    await context.test("creates incidents for the authenticated reporter only", async () => {
      const created = await request(baseUrl, "/api/incidents", {
        method: "POST",
        token: userA.token,
        body: incident({
          description: "Report text with SQL-like value: '; DROP TABLE users; --",
          reporterId: userB.user.id,
        }),
      });
      assert.equal(created.status, 400);

      const validCreated = await request(baseUrl, "/api/incidents", {
        method: "POST",
        token: userA.token,
        body: incident({
          description: "Report text with SQL-like value: '; DROP TABLE users; --",
          locationState: "available",
          locationError: "",
          submittedReport: null,
        }),
      });
      assert.equal(validCreated.status, 201);
      assert.equal(validCreated.body.incident.status, "reported");
      assert.equal(validCreated.body.incident.type, "Vehicle collision");
      assert.equal(validCreated.body.incident.location, "Sector 12, Chandigarh");
      assert.equal("reporterId" in validCreated.body.incident, false);
      assert.equal("password" in validCreated.body.incident, false);
      assert.equal("password_hash" in validCreated.body.incident, false);
      assert.equal("jwtSecret" in validCreated.body.incident, false);
      incidentA = validCreated.body.incident;

      const stored = await getPool().query(
        "SELECT reporter_id, status, description FROM incidents WHERE id = $1",
        [incidentA.id],
      );
      assert.equal(stored.rowCount, 1);
      assert.equal(stored.rows[0].reporter_id, userA.user.id);
      assert.equal(stored.rows[0].status, "reported");
      assert.equal(stored.rows[0].description, "Report text with SQL-like value: '; DROP TABLE users; --");
      const initialHistory = await getPool().query(
        `SELECT previous_status, new_status, changed_by_user_id
         FROM incident_status_history WHERE incident_id = $1`,
        [incidentA.id],
      );
      assert.equal(initialHistory.rowCount, 1);
      assert.equal(initialHistory.rows[0].previous_status, null);
      assert.equal(initialHistory.rows[0].new_status, "reported");
      assert.equal(initialHistory.rows[0].changed_by_user_id, userA.user.id);

      const otherCreated = await request(baseUrl, "/api/incidents", {
        method: "POST",
        token: userB.token,
        body: incident({ accidentType: "Single vehicle accident", description: "Separate owner report." }),
      });
      assert.equal(otherCreated.status, 201);
      incidentB = otherCreated.body.incident;

      const secondA = await request(baseUrl, "/api/incidents", {
        method: "POST",
        token: userA.token,
        body: incident({ accidentType: "Vehicle and pedestrian", description: "Later test report." }),
      });
      assert.equal(secondA.status, 201);
    });

    await context.test("lists only owned incidents newest first", async () => {
      const listA = await request(baseUrl, "/api/incidents", { token: userA.token });
      const listB = await request(baseUrl, "/api/incidents", { token: userB.token });

      assert.equal(listA.status, 200);
      assert.equal(listA.body.incidents.length, 2);
      assert.equal(listB.body.incidents.length, 1);
      assert.notEqual(listA.body.incidents[0].id, incidentA.id);
      assert.equal(listA.body.incidents[1].id, incidentA.id);
      assert.equal(listB.body.incidents[0].id, incidentB.id);
    });

    await context.test("retrieves own detail and hides another user's incident", async () => {
      const ownIncident = await request(baseUrl, `/api/incidents/${incidentA.id}`, { token: userA.token });
      const foreignIncident = await request(baseUrl, `/api/incidents/${incidentA.id}`, { token: userB.token });
      const malformedId = await request(baseUrl, "/api/incidents/not-a-uuid", { token: userA.token });
      const currentStatus = await request(baseUrl, `/api/incidents/${incidentA.id}/status`, { token: userA.token });

      assert.equal(ownIncident.status, 200);
      assert.equal(ownIncident.body.incident.id, incidentA.id);
      assert.equal(foreignIncident.status, 404);
      assert.equal(malformedId.status, 400);
      assert.equal(currentStatus.status, 200);
      assert.equal(currentStatus.body.status.status, "reported");
      assert.equal(currentStatus.body.status.incidentId, incidentA.id);
      assert.equal(ownIncident.body.incident.latitude, null);
      assert.equal(ownIncident.body.incident.longitude, null);
    });

    await context.test("updates permitted fields and blocks changes to ownership or status", async () => {
      const updated = await request(baseUrl, `/api/incidents/${incidentA.id}`, {
        method: "PATCH",
        token: userA.token,
        body: { description: "Updated description", location: { name: "Sector 17, Chandigarh" } },
      });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.incident.description, "Updated description");
      assert.equal(updated.body.incident.location, "Sector 17, Chandigarh");
      assert.equal(updated.body.incident.status, "reported");

      const invalidUpdates = [
        { reporterId: userB.user.id },
        { id: randomUUID() },
        { status: "resolved" },
        { createdAt: "2000-01-01T00:00:00Z" },
        { severity: "critical" },
        { latitude: 91 },
        { peopleInvolved: "-1" },
      ];
      for (const body of invalidUpdates) {
        const response = await request(baseUrl, `/api/incidents/${incidentA.id}`, {
          method: "PATCH",
          token: userA.token,
          body,
        });
        assert.equal(response.status, 400);
      }

      const malformedId = await request(baseUrl, "/api/incidents/invalid", {
        method: "PATCH",
        token: userA.token,
        body: { description: "Attempt" },
      });
      const foreignUpdate = await request(baseUrl, `/api/incidents/${incidentA.id}`, {
        method: "PATCH",
        token: userB.token,
        body: { description: "Unauthorized change" },
      });
      assert.equal(malformedId.status, 400);
      assert.equal(foreignUpdate.status, 404);

      const stored = await getPool().query(
        "SELECT reporter_id, status, description FROM incidents WHERE id = $1",
        [incidentA.id],
      );
      assert.equal(stored.rows[0].reporter_id, userA.user.id);
      assert.equal(stored.rows[0].status, "reported");
      assert.equal(stored.rows[0].description, "Updated description");

      const clearedDescription = await request(baseUrl, `/api/incidents/${incidentA.id}`, {
        method: "PATCH",
        token: userA.token,
        body: { description: "" },
      });
      assert.equal(clearedDescription.status, 200);
      assert.equal(clearedDescription.body.incident.description, null);
    });

    await context.test("status transitions are role-limited, transactional, and recorded chronologically", async () => {
      const citizenAttempt = await request(baseUrl, `/api/incidents/${incidentA.id}/status`, {
        method: "PATCH",
        token: userA.token,
        body: { status: "received" },
      });
      const invalidStatus = await request(baseUrl, `/api/incidents/${incidentA.id}/status`, {
        method: "PATCH",
        token: admin.token,
        body: { status: "dispatched" },
      });
      const invalidTransition = await request(baseUrl, `/api/incidents/${incidentA.id}/status`, {
        method: "PATCH",
        token: admin.token,
        body: { status: "resolved" },
      });

      assert.equal(citizenAttempt.status, 403);
      assert.equal(invalidStatus.status, 400);
      assert.equal(invalidTransition.status, 409);

      const unchangedStatus = await request(baseUrl, `/api/incidents/${incidentA.id}/status`, { token: userA.token });
      const unchangedHistory = await request(baseUrl, `/api/incidents/${incidentA.id}/history`, { token: userA.token });
      assert.equal(unchangedStatus.body.status.status, "reported");
      assert.equal(unchangedHistory.body.history.length, 1);

      const beforeUpdate = new Date(unchangedStatus.body.status.updatedAt);
      await new Promise((resolve) => setTimeout(resolve, 15));
      const received = await request(baseUrl, `/api/incidents/${incidentA.id}/status`, {
        method: "PATCH",
        token: admin.token,
        body: { status: "received" },
      });
      assert.equal(received.status, 200);
      assert.equal(received.body.incident.status, "received");
      assert.ok(new Date(received.body.incident.updatedAt) > beforeUpdate);

      const history = await request(baseUrl, `/api/incidents/${incidentA.id}/history`, { token: userA.token });
      assert.equal(history.status, 200);
      assert.deepEqual(history.body.history.map((item) => [item.previousStatus, item.newStatus]), [
        [null, "reported"],
        ["reported", "received"],
      ]);
      assert.equal(history.body.history[1].changedByUserId, admin.user.id);
      assert.ok(new Date(history.body.history[0].createdAt) <= new Date(history.body.history[1].createdAt));

      const duplicateInitialRecords = await getPool().query(
        `SELECT count(*)::int AS count FROM incident_status_history
         WHERE incident_id = $1 AND previous_status IS NULL`,
        [incidentA.id],
      );
      assert.equal(duplicateInitialRecords.rows[0].count, 1);

      const foreignHistory = await request(baseUrl, `/api/incidents/${incidentA.id}/history`, { token: userB.token });
      const foreignStatus = await request(baseUrl, `/api/incidents/${incidentB.id}/status`, { token: userA.token });
      assert.equal(foreignHistory.status, 404);
      assert.equal(foreignStatus.status, 404);

      const directHistoryUpdate = await request(baseUrl, `/api/incidents/${incidentA.id}/history`, {
        method: "PUT",
        token: userA.token,
        body: { newStatus: "resolved" },
      });
      const directHistoryDelete = await request(baseUrl, `/api/incidents/${incidentA.id}/history`, {
        method: "DELETE",
        token: userA.token,
      });
      assert.equal(directHistoryUpdate.status, 404);
      assert.equal(directHistoryDelete.status, 404);
    });

    await context.test("location updates validate coordinates and enforce ownership", async () => {
      const invalidLocations = [
        { latitude: 90.1, longitude: 20 },
        { latitude: 20, longitude: -180.1 },
        { latitude: "30", longitude: 20 },
        { latitude: 30 },
        { address: " " },
        { latitude: 30, longitude: 20, userId: userB.user.id },
        { latitude: 30, longitude: 20, unexpected: true },
      ];

      for (const body of invalidLocations) {
        const response = await request(baseUrl, `/api/incidents/${incidentA.id}/location`, {
          method: "PATCH",
          token: userA.token,
          body,
        });
        assert.equal(response.status, 400);
      }

      const unauthenticated = await request(baseUrl, `/api/incidents/${incidentA.id}/location`, {
        method: "PATCH",
        body: { latitude: 30, longitude: 76 },
      });
      const foreignUpdate = await request(baseUrl, `/api/incidents/${incidentA.id}/location`, {
        method: "PATCH",
        token: userB.token,
        body: { latitude: 30, longitude: 76, address: "Private location" },
      });
      assert.equal(unauthenticated.status, 401);
      assert.equal(foreignUpdate.status, 404);

      const update = await request(baseUrl, `/api/incidents/${incidentA.id}/location`, {
        method: "PATCH",
        token: userA.token,
        body: { latitude: 30.7333, longitude: 76.7794, address: "Sector 12, Chandigarh" },
      });
      assert.equal(update.status, 200);
      assert.equal(update.body.location.latitude, 30.7333);
      assert.equal(update.body.location.longitude, 76.7794);
      assert.equal(update.body.location.address, "Sector 12, Chandigarh");

      const details = await request(baseUrl, `/api/incidents/${incidentA.id}`, { token: userA.token });
      assert.equal(details.body.incident.latitude, 30.7333);
      assert.equal(details.body.incident.longitude, 76.7794);
      assert.equal(details.body.incident.location, "Sector 12, Chandigarh");

      const persisted = await getPool().query(
        "SELECT latitude, longitude, location_name FROM incidents WHERE id = $1 AND reporter_id = $2",
        [incidentA.id, userA.user.id],
      );
      assert.equal(persisted.rowCount, 1);
      assert.equal(persisted.rows[0].latitude, 30.7333);
      assert.equal(persisted.rows[0].longitude, 76.7794);
    });
  } finally {
    try {
      if (createdUserIds.length > 0) {
        await getPool().query("DELETE FROM incidents WHERE reporter_id = ANY($1::uuid[])", [createdUserIds]);
        await getPool().query("DELETE FROM users WHERE id = ANY($1::uuid[])", [createdUserIds]);
      }
      await getPool().query(
        `DELETE FROM incidents i
         USING users u
         WHERE i.reporter_id = u.id
           AND (u.email LIKE 'incident-a-%@example.test' OR u.email LIKE 'incident-b-%@example.test')`,
      );
      await getPool().query(
        "DELETE FROM users WHERE email LIKE 'incident-a-%@example.test' OR email LIKE 'incident-b-%@example.test'",
      );
    } finally {
      if (server.listening) {
        await new Promise((resolve) => server.close(resolve));
      }
      await closeDatabasePool();
    }
  }
});