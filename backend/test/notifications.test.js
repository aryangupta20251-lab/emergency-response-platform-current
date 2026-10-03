import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { io as createSocketClient } from "socket.io-client";
import { app } from "../src/app.js";
import { closeDatabasePool, getPool } from "../src/db/pool.js";
import { attachRealtime, closeRealtime } from "../src/realtime/socket.js";

const testPassword = "Notification-Tests-2026!";

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
  return { user, identifier, token: login.body.token };
}

function waitForEvent(socket, eventName, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(eventName, handleEvent);
      reject(new Error(`Timed out waiting for ${eventName}.`));
    }, timeoutMs);
    const handleEvent = (payload) => {
      clearTimeout(timeout);
      resolve(payload);
    };
    socket.once(eventName, handleEvent);
  });
}

async function connectSocket(baseUrl, token) {
  const socket = createSocketClient(baseUrl, {
    auth: { token },
    transports: ["websocket"],
    reconnection: false,
    timeout: 3000,
  });
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
  return socket;
}

test("notifications persist per user and realtime incident updates stay user-scoped", async (context) => {
  const server = createServer(app);
  attachRealtime(server);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
    server.listen(0, "127.0.0.1");
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const createdUserIds = [];
  const sockets = [];

  try {
    const citizenA = await createTestAccount(baseUrl, "notifications-a");
    const citizenB = await createTestAccount(baseUrl, "notifications-b");
    const admin = await createTestAccount(baseUrl, "notifications-admin", "admin");
    const responder = await createTestAccount(baseUrl, "notifications-responder", "responder");
    const resetUser = await createTestAccount(baseUrl, "notifications-reset-session");
    createdUserIds.push(citizenA.user.id, citizenB.user.id, admin.user.id, responder.user.id, resetUser.user.id);

    const profile = await request(baseUrl, "/api/responders", {
      method: "POST",
      token: admin.token,
      body: { userId: responder.user.id, responderType: "paramedic" },
    });
    assert.equal(profile.status, 201);
    const verified = await request(baseUrl, `/api/responders/${responder.user.id}/verification`, {
      method: "PATCH",
      token: admin.token,
      body: { isActive: true, isVerified: true },
    });
    assert.equal(verified.status, 200);
    const available = await request(baseUrl, "/api/responders/me/availability", {
      method: "PATCH",
      token: responder.token,
      body: { availability: "available" },
    });
    assert.equal(available.status, 200);

    const socketA = await connectSocket(baseUrl, citizenA.token);
    const socketB = await connectSocket(baseUrl, citizenB.token);
    const responderSocket = await connectSocket(baseUrl, responder.token);
    const resetSocket = await connectSocket(baseUrl, resetUser.token);
    sockets.push(socketA, socketB, responderSocket, resetSocket);

    let notificationsSeenByB = 0;
    socketB.on("notification:new", () => { notificationsSeenByB += 1; });

    await context.test("rejects unauthenticated realtime connections", async () => {
      const unauthenticatedSocket = createSocketClient(baseUrl, {
        transports: ["websocket"],
        reconnection: false,
        timeout: 3000,
      });
      const connectionError = await new Promise((resolve, reject) => {
        unauthenticatedSocket.once("connect", () => reject(new Error("Unauthenticated socket connected.")));
        unauthenticatedSocket.once("connect_error", resolve);
      });
      assert.match(connectionError.message, /Authentication required/i);
      unauthenticatedSocket.close();
    });

    await context.test("password reset revokes existing and future realtime sessions", async () => {
      let resetLink = "";
      const originalInfo = console.info;
      console.info = (message) => { resetLink = String(message).slice(String(message).indexOf("http")); };
      let resetRequest;
      try {
        resetRequest = await request(baseUrl, "/api/auth/password-reset/request", {
          method: "POST",
          body: { identifier: resetUser.identifier },
        });
      } finally {
        console.info = originalInfo;
      }
      assert.equal(resetRequest.status, 202);
      const resetToken = new URL(resetLink).searchParams.get("token");
      assert.match(resetToken, /^[A-Za-z0-9_-]{43}$/);

      const disconnected = new Promise((resolve) => resetSocket.once("disconnect", resolve));
      const changed = await request(baseUrl, "/api/auth/password-reset/confirm", {
        method: "POST",
        body: { token: resetToken, password: "Changed-Session-Password-2026!" },
      });
      assert.equal(changed.status, 200);
      await disconnected;

      const staleApiSession = await request(baseUrl, "/api/auth/me", { token: resetUser.token });
      assert.equal(staleApiSession.status, 401);
      const staleSocket = createSocketClient(baseUrl, {
        auth: { token: resetUser.token },
        transports: ["websocket"],
        reconnection: false,
        timeout: 3000,
      });
      const connectionError = await new Promise((resolve, reject) => {
        staleSocket.once("connect", () => reject(new Error("A reset session reconnected.")));
        staleSocket.once("connect_error", resolve);
      });
      assert.match(connectionError.message, /Invalid or expired token/i);
      staleSocket.close();

      const oldPassword = await request(baseUrl, "/api/auth/login", {
        method: "POST",
        body: { identifier: resetUser.identifier, password: testPassword },
      });
      const newPassword = await request(baseUrl, "/api/auth/login", {
        method: "POST",
        body: { identifier: resetUser.identifier, password: "Changed-Session-Password-2026!" },
      });
      assert.equal(oldPassword.status, 401);
      assert.equal(newPassword.status, 200);
    });

    let incidentId;
    await context.test("incident creation stores and emits only the reporter's notification", async () => {
      const notificationEvent = waitForEvent(socketA, "notification:new");
      const incidentEvent = waitForEvent(socketA, "incident:update");
      const created = await request(baseUrl, "/api/incidents", {
        method: "POST",
        token: citizenA.token,
        body: {
          accidentType: "Vehicle collision",
          peopleInvolved: "2",
          injuries: "Unknown",
          vehicles: "Car",
          description: "Test-only incident notification.",
          location: { name: "Test notification area" },
        },
      });
      assert.equal(created.status, 201);
      incidentId = created.body.incident.id;

      const [notification, incidentUpdate] = await Promise.all([notificationEvent, incidentEvent]);
      assert.equal(notification.type, "incident_created");
      assert.equal(notification.userId, citizenA.user.id);
      assert.equal(incidentUpdate.id, incidentId);
      assert.equal(incidentUpdate.status, "reported");

      const ownList = await request(baseUrl, "/api/notifications", { token: citizenA.token });
      const otherList = await request(baseUrl, "/api/notifications", { token: citizenB.token });
      assert.equal(ownList.status, 200);
      assert.equal(ownList.body.notifications.length, 1);
      assert.equal(otherList.body.notifications.length, 0);
      assert.equal(ownList.body.notifications[0].isRead, false);
    });

    await context.test("status changes notify the citizen; assignment syncs only its two participants", async () => {
      for (const status of ["received", "verified"]) {
        const response = await request(baseUrl, `/api/incidents/${incidentId}/status`, {
          method: "PATCH",
          token: admin.token,
          body: { status },
        });
        assert.equal(response.status, 200);
      }

      const citizenNotification = waitForEvent(socketA, "notification:new");
      const responderNotification = waitForEvent(responderSocket, "notification:new");
      const citizenUpdate = waitForEvent(socketA, "incident:update");
      const responderUpdate = waitForEvent(responderSocket, "incident:update");
      const assignment = await request(baseUrl, `/api/incidents/${incidentId}/assign-responder`, {
        method: "POST",
        token: admin.token,
        body: { responderId: responder.user.id },
      });

      assert.equal(assignment.status, 200);
      assert.equal(assignment.body.incident.status, "responder_assigned");
      assert.equal(assignment.body.responder.availability, "busy");
      const [citizenNotice, responderNotice, citizenIncidentUpdate, responderIncidentUpdate] = await Promise.all([
        citizenNotification,
        responderNotification,
        citizenUpdate,
        responderUpdate,
      ]);
      assert.equal(citizenNotice.type, "responder_assigned");
      assert.equal(citizenNotice.userId, citizenA.user.id);
      assert.equal(responderNotice.userId, responder.user.id);
      assert.equal(citizenIncidentUpdate.status, "responder_assigned");
      assert.equal(responderIncidentUpdate.status, "responder_assigned");
      assert.equal(notificationsSeenByB, 0);

      const foreignRead = await request(baseUrl, `/api/notifications/${citizenNotice.id}/read`, {
        method: "PATCH",
        token: citizenB.token,
      });
      assert.equal(foreignRead.status, 404);

      const invalidPage = await request(baseUrl, "/api/notifications?page=0", { token: citizenA.token });
      const oversizedPage = await request(baseUrl, "/api/notifications?limit=101", { token: citizenA.token });
      assert.equal(invalidPage.status, 400);
      assert.equal(oversizedPage.status, 400);
    });

    await context.test("responder status updates create citizen notifications and synchronize both sockets", async () => {
      const citizenNoticePromise = waitForEvent(socketA, "notification:new");
      const citizenUpdatePromise = waitForEvent(socketA, "incident:update");
      const responderUpdatePromise = waitForEvent(responderSocket, "incident:update");
      const responding = await request(baseUrl, `/api/incidents/${incidentId}/status`, {
        method: "PATCH",
        token: responder.token,
        body: { status: "responding" },
      });
      assert.equal(responding.status, 200);
      const [notice, citizenUpdate, responderUpdate] = await Promise.all([
        citizenNoticePromise,
        citizenUpdatePromise,
        responderUpdatePromise,
      ]);
      assert.equal(notice.type, "responder_en_route");
      assert.equal(notice.userId, citizenA.user.id);
      assert.equal(citizenUpdate.status, "responding");
      assert.equal(responderUpdate.status, "responding");
      assert.equal(notificationsSeenByB, 0);
    });

    await context.test("read state and unread counts are private and synchronize", async () => {
      const before = await request(baseUrl, "/api/notifications/unread-count", { token: citizenA.token });
      const otherBefore = await request(baseUrl, "/api/notifications/unread-count", { token: citizenB.token });
      assert.ok(before.body.count >= 4);
      assert.equal(otherBefore.body.count, 0);

      const allReadEvent = waitForEvent(socketA, "notification:read-all");
      const markAll = await request(baseUrl, "/api/notifications/read-all", {
        method: "PATCH",
        token: citizenA.token,
      });
      assert.equal(markAll.status, 200);
      assert.ok(markAll.body.updatedCount >= 1);
      assert.equal((await allReadEvent).updatedCount, markAll.body.updatedCount);

      const after = await request(baseUrl, "/api/notifications/unread-count", { token: citizenA.token });
      const otherAfter = await request(baseUrl, "/api/notifications/unread-count", { token: citizenB.token });
      assert.equal(after.body.count, 0);
      assert.equal(otherAfter.body.count, 0);

      const unauthenticated = await request(baseUrl, "/api/notifications");
      const noCreateRoute = await request(baseUrl, "/api/notifications", {
        method: "POST",
        token: citizenA.token,
        body: { userId: citizenB.user.id, type: "system", title: "Forged", message: "Not allowed" },
      });
      assert.equal(unauthenticated.status, 401);
      assert.equal(noCreateRoute.status, 404);
    });
  } finally {
    for (const socket of sockets) socket.disconnect();
    await closeRealtime();
    try {
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
  }
});