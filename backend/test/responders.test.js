import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { app } from "../src/app.js";
import { closeDatabasePool, getPool } from "../src/db/pool.js";

const testPassword = "Responder-Tests-2026!";

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

async function createTestAccount(baseUrl, label, role = "citizen") {
  const identifier = `${label}-${randomUUID()}@example.test`;
  const registration = await request(baseUrl, "/api/auth/register", {
    method: "POST",
    body: { name: `${label} Test User`, identifier, password: testPassword },
  });
  assert.equal(registration.status, 201);
  const user = registration.body.user;

  if (role !== "citizen") {
    await getPool().query("UPDATE users SET role = $2 WHERE id = $1", [user.id, role]);
  }

  const login = await request(baseUrl, "/api/auth/login", {
    method: "POST",
    body: { identifier, password: testPassword },
  });
  assert.equal(login.status, 200);
  return { user, token: login.body.token };
}

function incident(overrides = {}) {
  return {
    accidentType: "Vehicle collision",
    peopleInvolved: "2",
    injuries: "Unknown",
    vehicles: "Car",
    description: "Responder assignment integration test.",
    location: { name: "Test location" },
    ...overrides,
  };
}

async function createIncident(baseUrl, account) {
  const created = await request(baseUrl, "/api/incidents", {
    method: "POST",
    token: account.token,
    body: incident(),
  });
  assert.equal(created.status, 201);
  const incidentId = created.body.incident.id;

  const location = await request(baseUrl, `/api/incidents/${incidentId}/location`, {
    method: "PATCH",
    token: account.token,
    body: { latitude: 30.7, longitude: 76.7, address: "Test location" },
  });
  assert.equal(location.status, 200);
  return incidentId;
}

async function verifyIncident(baseUrl, incidentId, adminToken) {
  for (const status of ["received", "verified"]) {
    const response = await request(baseUrl, `/api/incidents/${incidentId}/status`, {
      method: "PATCH",
      token: adminToken,
      body: { status },
    });
    assert.equal(response.status, 200);
  }
}

test("responder privacy, availability, discovery, and assignment are enforced", async (context) => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const userIds = [];
  let triggerCreated = false;

  try {
    const citizenA = await createTestAccount(baseUrl, "responder-citizen-a");
    const citizenB = await createTestAccount(baseUrl, "responder-citizen-b");
    const admin = await createTestAccount(baseUrl, "responder-admin", "admin");
    const responderA = await createTestAccount(baseUrl, "responder-a", "responder");
    const responderB = await createTestAccount(baseUrl, "responder-b", "responder");
    const responderC = await createTestAccount(baseUrl, "responder-c", "responder");
    userIds.push(citizenA.user.id, citizenB.user.id, admin.user.id,
      responderA.user.id, responderB.user.id, responderC.user.id);

    const responders = [responderA, responderB, responderC];
    const responderTypes = ["paramedic", "ambulance", "fire"];
    for (let index = 0; index < responders.length; index += 1) {
      const created = await request(baseUrl, "/api/responders", {
        method: "POST",
        token: admin.token,
        body: {
          userId: responders[index].user.id,
          responderType: responderTypes[index],
          organization: `Test organization ${index + 1}`,
          serviceArea: "Test area",
        },
      });
      assert.equal(created.status, 201);
      assert.equal(created.body.responder.availability, "offline");
      assert.equal(created.body.responder.isActive, false);
      assert.equal(created.body.responder.isVerified, false);
      assert.equal("password_hash" in created.body.responder, false);
    }

    await context.test("only admins can activate or verify responder profiles", async () => {
      const citizenAttempt = await request(baseUrl, `/api/responders/${responderA.user.id}/verification`, {
        method: "PATCH",
        token: citizenA.token,
        body: { isActive: true, isVerified: true },
      });
      const responderAttempt = await request(baseUrl, `/api/responders/${responderA.user.id}/verification`, {
        method: "PATCH",
        token: responderA.token,
        body: { isVerified: true },
      });
      const invalidFlags = await request(baseUrl, `/api/responders/${responderA.user.id}/verification`, {
        method: "PATCH",
        token: admin.token,
        body: { isVerified: "true" },
      });
      assert.equal(citizenAttempt.status, 403);
      assert.equal(responderAttempt.status, 403);
      assert.equal(invalidFlags.status, 400);

      for (const responder of [responderA, responderB]) {
        const activated = await request(baseUrl, `/api/responders/${responder.user.id}/verification`, {
          method: "PATCH",
          token: admin.token,
          body: { isActive: true, isVerified: true },
        });
        assert.equal(activated.status, 200);
        assert.equal(activated.body.responder.isActive, true);
        assert.equal(activated.body.responder.isVerified, true);
        assert.equal(activated.body.responder.availability, "offline");
      }

      const activeUnverified = await request(baseUrl, `/api/responders/${responderC.user.id}/verification`, {
        method: "PATCH",
        token: admin.token,
        body: { isActive: true },
      });
      assert.equal(activeUnverified.status, 200);
      assert.equal(activeUnverified.body.responder.isActive, true);
      assert.equal(activeUnverified.body.responder.isVerified, false);
    });

    await getPool().query(
      `UPDATE responder_profiles
       SET latitude = CASE user_id WHEN $1 THEN 30.7 WHEN $2 THEN 30.71 ELSE 30.72 END,
           longitude = CASE user_id WHEN $1 THEN 76.7 WHEN $2 THEN 76.71 ELSE 76.72 END
       WHERE user_id = ANY($3::uuid[])`,
      [responderA.user.id, responderB.user.id, [responderA.user.id, responderB.user.id, responderC.user.id]],
    );
    await getPool().query(
      "UPDATE responder_profiles SET availability = 'available' WHERE user_id = $1",
      [responderC.user.id],
    );

    await context.test("profile creation is privileged, linked, unique, and never self-verifies", async () => {
      const citizenCreate = await request(baseUrl, "/api/responders", {
        method: "POST",
        token: citizenA.token,
        body: { userId: responderA.user.id, responderType: "paramedic" },
      });
      const responderCreate = await request(baseUrl, "/api/responders", {
        method: "POST",
        token: responderA.token,
        body: { userId: responderA.user.id, responderType: "paramedic" },
      });
      const duplicate = await request(baseUrl, "/api/responders", {
        method: "POST",
        token: admin.token,
        body: { userId: responderA.user.id, responderType: "paramedic" },
      });
      const selfVerify = await request(baseUrl, "/api/responders", {
        method: "POST",
        token: admin.token,
        body: { userId: responderB.user.id, responderType: "ambulance", isVerified: true },
      });
      const invalidType = await request(baseUrl, "/api/responders", {
        method: "POST",
        token: admin.token,
        body: { userId: citizenB.user.id, responderType: "doctor" },
      });

      assert.equal(citizenCreate.status, 403);
      assert.equal(responderCreate.status, 403);
      assert.equal(duplicate.status, 409);
      assert.equal(selfVerify.status, 400);
      assert.equal(invalidType.status, 400);

      const stored = await getPool().query(
        "SELECT user_id FROM responder_profiles WHERE user_id = $1",
        [responderA.user.id],
      );
      assert.equal(stored.rowCount, 1);
    });

    await context.test("self profile and availability endpoints enforce roles and controlled states", async () => {
      const anonymous = await request(baseUrl, "/api/responders/me");
      const citizen = await request(baseUrl, "/api/responders/me", { token: citizenA.token });
      const own = await request(baseUrl, "/api/responders/me", { token: responderA.token });
      assert.equal(anonymous.status, 401);
      assert.equal(citizen.status, 403);
      assert.equal(own.status, 200);
      assert.equal(own.body.responder.userId, responderA.user.id);

      const invalid = await request(baseUrl, "/api/responders/me/availability", {
        method: "PATCH",
        token: responderA.token,
        body: { availability: "ready" },
      });
      const smuggled = await request(baseUrl, "/api/responders/me/availability", {
        method: "PATCH",
        token: responderA.token,
        body: { availability: "available", responderId: responderB.user.id },
      });
      const citizenUpdate = await request(baseUrl, "/api/responders/me/availability", {
        method: "PATCH",
        token: citizenA.token,
        body: { availability: "available" },
      });
      assert.equal(invalid.status, 400);
      assert.equal(smuggled.status, 400);
      assert.equal(citizenUpdate.status, 403);

      for (const availability of ["available", "busy", "offline", "available"]) {
        const updated = await request(baseUrl, "/api/responders/me/availability", {
          method: "PATCH",
          token: responderA.token,
          body: { availability },
        });
        assert.equal(updated.status, 200);
        assert.equal(updated.body.responder.availability, availability);
      }

      const unverifiedAvailable = await request(baseUrl, "/api/responders/me/availability", {
        method: "PATCH",
        token: responderC.token,
        body: { availability: "available" },
      });
      assert.equal(unverifiedAvailable.status, 409);
    });

    await context.test("responders update only their own validated location", async () => {
      const ownLocation = await request(baseUrl, "/api/responders/me/location", {
        method: "PATCH",
        token: responderA.token,
        body: { latitude: 30.7, longitude: 76.7 },
      });
      assert.equal(ownLocation.status, 200);
      assert.equal(ownLocation.body.location.latitude, 30.7);
      assert.equal(ownLocation.body.location.longitude, 76.7);

      const invalidLocations = [
        { latitude: 90.1, longitude: 10 },
        { latitude: 10, longitude: -180.1 },
        { latitude: "30", longitude: 76 },
        { latitude: 30 },
        { latitude: 30, longitude: 76, responderId: responderB.user.id },
      ];
      for (const body of invalidLocations) {
        const response = await request(baseUrl, "/api/responders/me/location", {
          method: "PATCH",
          token: responderA.token,
          body,
        });
        assert.equal(response.status, 400);
      }

      const citizenLocation = await request(baseUrl, "/api/responders/me/location", {
        method: "PATCH",
        token: citizenA.token,
        body: { latitude: 30, longitude: 76 },
      });
      assert.equal(citizenLocation.status, 403);
      const responderBProfile = await request(baseUrl, "/api/responders/me", { token: responderB.token });
      assert.equal(responderBProfile.body.responder.latitude, 30.71);
    });

    await context.test("nearby discovery is admin-only and filters eligibility by distance", async () => {
      const query = "/api/responders/nearby?latitude=30.7&longitude=76.7&radius=10";
      const anonymous = await request(baseUrl, query);
      const citizen = await request(baseUrl, query, { token: citizenA.token });
      const responder = await request(baseUrl, query, { token: responderA.token });
      assert.equal(anonymous.status, 401);
      assert.equal(citizen.status, 403);
      assert.equal(responder.status, 403);

      const availableA = await request(baseUrl, "/api/responders/me/availability", {
        method: "PATCH",
        token: responderA.token,
        body: { availability: "available" },
      });
      assert.equal(availableA.status, 200);

      const nearby = await request(baseUrl, query, { token: admin.token });
      assert.equal(nearby.status, 200);
      assert.deepEqual(nearby.body.responders.map((item) => item.userId), [responderA.user.id]);
      assert.equal(nearby.body.responders[0].distanceKm, 0);
      assert.equal(nearby.body.distanceType, "straight_line");

      for (const invalidQuery of [
        "latitude=90.1&longitude=20",
        "latitude=30&longitude=-180.1",
        "latitude=30&longitude=76&radius=0",
        "latitude=30&longitude=76&radius=50.1",
        "latitude=30&longitude=76&responderType=doctor",
        "latitude=30&longitude=76&sql=1",
      ]) {
        const invalid = await request(baseUrl, `/api/responders/nearby?${invalidQuery}`, { token: admin.token });
        assert.equal(invalid.status, 400);
      }
    });

    const incidentA = await createIncident(baseUrl, citizenA);
    const incidentB = await createIncident(baseUrl, citizenB);
    await verifyIncident(baseUrl, incidentA, admin.token);
    await verifyIncident(baseUrl, incidentB, admin.token);

    await context.test("incident candidate discovery uses its stored location and is admin-only", async () => {
      const citizenRequest = await request(baseUrl, `/api/incidents/${incidentA}/responders`, { token: citizenA.token });
      const adminRequest = await request(baseUrl, `/api/incidents/${incidentA}/responders?radius=10`, { token: admin.token });
      assert.equal(citizenRequest.status, 403);
      assert.equal(adminRequest.status, 200);
      assert.ok(adminRequest.body.responders.some((responder) => responder.userId === responderA.user.id));
      assert.ok(adminRequest.body.responders.every((responder) => responder.availability === "available"));
      assert.equal(adminRequest.body.responders.some((responder) => responder.userId === responderC.user.id), false);

      const noCoordinatesIncident = await request(baseUrl, "/api/incidents", {
        method: "POST",
        token: citizenA.token,
        body: incident({ description: "No coordinates" }),
      });
      assert.equal(noCoordinatesIncident.status, 201);
      const noCoordinates = await request(
        baseUrl,
        `/api/incidents/${noCoordinatesIncident.body.incident.id}/responders`,
        { token: admin.token },
      );
      assert.equal(noCoordinates.status, 409);
    });

    await context.test("assignment requires admin, valid responder, and verified incident state", async () => {
      const citizenAttempt = await request(baseUrl, `/api/incidents/${incidentA}/assign-responder`, {
        method: "POST",
        token: citizenA.token,
        body: { responderId: responderA.user.id },
      });
      const malformedResponder = await request(baseUrl, `/api/incidents/${incidentA}/assign-responder`, {
        method: "POST",
        token: admin.token,
        body: { responderId: "not-a-uuid" },
      });
      const unknownResponder = await request(baseUrl, `/api/incidents/${incidentA}/assign-responder`, {
        method: "POST",
        token: admin.token,
        body: { responderId: randomUUID() },
      });
      const invalidIncident = await request(baseUrl, "/api/incidents/not-a-uuid/assign-responder", {
        method: "POST",
        token: admin.token,
        body: { responderId: responderA.user.id },
      });
      const arbitraryStatus = await request(baseUrl, `/api/incidents/${incidentA}/status`, {
        method: "PATCH",
        token: admin.token,
        body: { status: "responder_assigned" },
      });

      assert.equal(citizenAttempt.status, 403);
      assert.equal(malformedResponder.status, 400);
      assert.equal(unknownResponder.status, 404);
      assert.equal(invalidIncident.status, 400);
      assert.equal(arbitraryStatus.status, 400);

      const offline = await request(baseUrl, `/api/incidents/${incidentB}/assign-responder`, {
        method: "POST",
        token: admin.token,
        body: { responderId: responderB.user.id },
      });
      const unverified = await request(baseUrl, `/api/incidents/${incidentB}/assign-responder`, {
        method: "POST",
        token: admin.token,
        body: { responderId: responderC.user.id },
      });
      assert.equal(offline.status, 409);
      assert.equal(unverified.status, 409);
    });

    await context.test("concurrent assignment cannot double-book; assignment status and availability are atomic", async () => {
      const assignments = await Promise.all([
        request(baseUrl, `/api/incidents/${incidentA}/assign-responder`, {
          method: "POST",
          token: admin.token,
          body: { responderId: responderA.user.id },
        }),
        request(baseUrl, `/api/incidents/${incidentB}/assign-responder`, {
          method: "POST",
          token: admin.token,
          body: { responderId: responderA.user.id },
        }),
      ]);
      assert.deepEqual(assignments.map(({ status }) => status).sort(), [200, 409]);

      const assigned = assignments.find((item) => item.status === 200);
      const rejected = assignments.find((item) => item.status === 409);
      const assignedIncidentId = assigned.body.incident.id;
      const rejectedIncidentId = assignedIncidentId === incidentA ? incidentB : incidentA;
      assert.equal(assigned.body.incident.status, "responder_assigned");
      assert.equal(assigned.body.incident.assignedResponderId, responderA.user.id);
      assert.equal(assigned.body.responder.availability, "busy");

      const responderProfile = await request(baseUrl, "/api/responders/me", { token: responderA.token });
      assert.equal(responderProfile.body.responder.availability, "busy");
      const cannotSetAvailable = await request(baseUrl, "/api/responders/me/availability", {
        method: "PATCH",
        token: responderA.token,
        body: { availability: "available" },
      });
      assert.equal(cannotSetAvailable.status, 409);

      const failedIncident = await getPool().query(
        "SELECT status, assigned_responder_user_id FROM incidents WHERE id = $1",
        [rejectedIncidentId],
      );
      assert.equal(failedIncident.rows[0].status, "verified");
      assert.equal(failedIncident.rows[0].assigned_responder_user_id, null);
      const assignmentHistory = await getPool().query(
        `SELECT count(*)::int AS count FROM incident_status_history
         WHERE incident_id = $1 AND new_status = 'responder_assigned'`,
        [rejectedIncidentId],
      );
      assert.equal(assignmentHistory.rows[0].count, 0);
      assert.equal(rejected.body.success, false);
    });

    await context.test("assigned responder can progress status; wrong responder cannot; terminal status releases availability", async () => {
      const assignedRow = await getPool().query(
        "SELECT id FROM incidents WHERE assigned_responder_user_id = $1 AND status = 'responder_assigned'",
        [responderA.user.id],
      );
      const assignedIncidentId = assignedRow.rows[0].id;
      const assignedOwner = assignedIncidentId === incidentA ? citizenA : citizenB;
      const otherCitizen = assignedIncidentId === incidentA ? citizenB : citizenA;

      const ownAssignments = await request(baseUrl, "/api/responders/me/incidents", { token: responderA.token });
      const anonymousAssignments = await request(baseUrl, "/api/responders/me/incidents");
      const otherAssignments = await request(baseUrl, "/api/responders/me/incidents", { token: responderB.token });
      const ownAssignment = await request(baseUrl, `/api/responders/me/incidents/${assignedIncidentId}`, { token: responderA.token });
      const otherAssignment = await request(baseUrl, `/api/responders/me/incidents/${assignedIncidentId}`, { token: responderB.token });
      const citizenAssignments = await request(baseUrl, "/api/responders/me/incidents", { token: citizenA.token });
      assert.equal(ownAssignments.status, 200);
      assert.equal(anonymousAssignments.status, 401);
      assert.ok(ownAssignments.body.incidents.some((incident) => incident.id === assignedIncidentId));
      assert.equal(otherAssignments.status, 200);
      assert.equal(otherAssignments.body.incidents.some((incident) => incident.id === assignedIncidentId), false);
      assert.equal(ownAssignment.status, 200);
      assert.deepEqual(ownAssignment.body.history.map((item) => item.newStatus), [
        "reported", "received", "verified", "responder_assigned",
      ]);
      assert.equal(otherAssignment.status, 404);
      assert.equal(citizenAssignments.status, 403);

      const wrongResponder = await request(baseUrl, `/api/incidents/${assignedIncidentId}/status`, {
        method: "PATCH",
        token: responderB.token,
        body: { status: "responding" },
      });
      assert.equal(wrongResponder.status, 403);

      for (const status of ["responding", "arrived", "resolved"]) {
        const updated = await request(baseUrl, `/api/incidents/${assignedIncidentId}/status`, {
          method: "PATCH",
          token: responderA.token,
          body: { status },
        });
        assert.equal(updated.status, 200);
        assert.equal(updated.body.incident.status, status);
      }

      const profile = await request(baseUrl, "/api/responders/me", { token: responderA.token });
      assert.equal(profile.body.responder.availability, "available");
      const ownerAssignment = await request(baseUrl, `/api/incidents/${assignedIncidentId}/assigned-responder`, {
        token: assignedOwner.token,
      });
      const otherCitizenAssignment = await request(baseUrl, `/api/incidents/${assignedIncidentId}/assigned-responder`, {
        token: otherCitizen.token,
      });
      assert.equal(ownerAssignment.status, 200);
      assert.equal(ownerAssignment.body.responder.userId, responderA.user.id);
      assert.equal("latitude" in ownerAssignment.body.responder, false);
      assert.equal(otherCitizenAssignment.status, 404);
    });

    await context.test("assignment rolls back incident, history, and availability if history insertion fails", async () => {
      const incidentC = await createIncident(baseUrl, citizenA);
      await verifyIncident(baseUrl, incidentC, admin.token);
      await request(baseUrl, "/api/responders/me/availability", {
        method: "PATCH",
        token: responderA.token,
        body: { availability: "available" },
      });

      await getPool().query(`
        CREATE OR REPLACE FUNCTION fail_responder_assignment_history()
        RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.new_status = 'responder_assigned' THEN
            RAISE EXCEPTION 'test rollback' USING ERRCODE = 'P0001';
          END IF;
          RETURN NEW;
        END;
        $$
      `);
      await getPool().query(`
        CREATE TRIGGER fail_responder_assignment_history
        BEFORE INSERT ON incident_status_history
        FOR EACH ROW EXECUTE FUNCTION fail_responder_assignment_history()
      `);
      triggerCreated = true;

      const failedAssignment = await request(baseUrl, `/api/incidents/${incidentC}/assign-responder`, {
        method: "POST",
        token: admin.token,
        body: { responderId: responderA.user.id },
      });
      assert.equal(failedAssignment.status, 500);
      assert.equal(failedAssignment.body.message, "Internal server error");

      const incidentState = await getPool().query(
        "SELECT status, assigned_responder_user_id FROM incidents WHERE id = $1",
        [incidentC],
      );
      const responderState = await getPool().query(
        "SELECT availability FROM responder_profiles WHERE user_id = $1",
        [responderA.user.id],
      );
      const history = await getPool().query(
        "SELECT new_status FROM incident_status_history WHERE incident_id = $1 ORDER BY id",
        [incidentC],
      );
      assert.equal(incidentState.rows[0].status, "verified");
      assert.equal(incidentState.rows[0].assigned_responder_user_id, null);
      assert.equal(responderState.rows[0].availability, "available");
      assert.deepEqual(history.rows.map((row) => row.new_status), ["reported", "received", "verified"]);

      await getPool().query("DROP TRIGGER fail_responder_assignment_history ON incident_status_history");
      await getPool().query("DROP FUNCTION fail_responder_assignment_history()");
      triggerCreated = false;
    });
  } finally {
    if (triggerCreated) {
      await getPool().query("DROP TRIGGER IF EXISTS fail_responder_assignment_history ON incident_status_history");
      await getPool().query("DROP FUNCTION IF EXISTS fail_responder_assignment_history()");
    }
    try {
      if (userIds.length > 0) {
        await getPool().query(
          `DELETE FROM incidents
           WHERE reporter_id = ANY($1::uuid[])
              OR assigned_responder_user_id = ANY($1::uuid[])`,
          [userIds],
        );
        await getPool().query("DELETE FROM users WHERE id = ANY($1::uuid[])", [userIds]);
      }
    } finally {
      if (server.listening) await new Promise((resolve) => server.close(resolve));
      await closeDatabasePool();
    }
  }
});