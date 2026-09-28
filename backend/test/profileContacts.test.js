import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { app } from "../src/app.js";
import { closeDatabasePool, getPool } from "../src/db/pool.js";

const testPassword = "Profile-Contacts-Test-2026!";

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

test("profile and emergency contact APIs enforce validation and ownership", async (context) => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const createdUsers = [];

  try {
    const userA = await createTestUser(baseUrl, "profile-a");
    const userB = await createTestUser(baseUrl, "profile-b");
    createdUsers.push(userA.user.id, userB.user.id);

    await context.test("gets the authenticated profile and requires authentication", async () => {
      const unauthenticated = await request(baseUrl, "/api/profile");
      const response = await request(baseUrl, "/api/profile", { token: userA.token });
      const otherProfile = await request(baseUrl, "/api/profile", { token: userB.token });

      assert.equal(unauthenticated.status, 401);
      assert.equal(response.status, 200);
      assert.equal(response.body.user.id, userA.user.id);
      assert.equal(response.body.user.identifier, userA.user.identifier);
      assert.equal(response.body.user.role, "citizen");
      assert.equal(response.body.profile.userId, userA.user.id);
      assert.notEqual(otherProfile.body.profile.userId, response.body.profile.userId);
      assert.equal("password" in response.body.user, false);
      assert.equal("password_hash" in response.body.user, false);

      const storedProfile = await getPool().query(
        "SELECT user_id FROM profiles WHERE user_id = $1",
        [userA.user.id],
      );
      assert.equal(storedProfile.rowCount, 1);
    });

    await context.test("updates the permitted profile name and rejects protected fields", async () => {
      const updatedName = "Profile A Updated";
      const updated = await request(baseUrl, "/api/profile", {
        method: "PATCH",
        token: userA.token,
        body: { name: updatedName, identifier: userA.user.identifier },
      });

      assert.equal(updated.status, 200);
      assert.equal(updated.body.user.name, updatedName);

      const invalidBodies = [
        { name: " " },
        { name: "Spoofed", role: "admin" },
        { userId: userB.user.id },
        { name: "Spoofed", id: userB.user.id },
        { name: "Spoofed", password: "another-password" },
        { name: "Spoofed", identifier: "other@example.test" },
        null,
      ];

      for (const body of invalidBodies) {
        const response = await request(baseUrl, "/api/profile", {
          method: "PATCH",
          token: userA.token,
          body,
        });
        assert.equal(response.status, 400);
      }

      const unchanged = await request(baseUrl, "/api/profile", { token: userA.token });
      assert.equal(unchanged.body.user.id, userA.user.id);
      assert.equal(unchanged.body.user.name, updatedName);
      assert.equal(unchanged.body.user.role, "citizen");
    });

    await context.test("requires authentication and validates emergency contacts", async () => {
      const unauthenticatedList = await request(baseUrl, "/api/emergency-contacts");
      const unauthenticatedCreate = await request(baseUrl, "/api/emergency-contacts", {
        method: "POST",
        body: { name: "Contact", relation: "Friend", phone: "+15551234567" },
      });

      assert.equal(unauthenticatedList.status, 401);
      assert.equal(unauthenticatedCreate.status, 401);

      const invalidBodies = [
        null,
        { name: "", relation: "Friend", phone: "+15551234567" },
        { name: "Contact", relation: "", phone: "+15551234567" },
        { name: "Contact", relation: "Friend", phone: "not-a-phone" },
        { name: "Contact", relation: "Friend" },
        { name: "Contact", relation: "Friend", phone: "+15551234567", userId: userB.user.id },
        { name: "Contact", relation: "Friend", phone: "+15551234567", extra: "not allowed" },
        { name: "Contact", relation: "Friend", phone: "+15551234567", email: "not-an-email" },
      ];

      for (const body of invalidBodies) {
        const response = await request(baseUrl, "/api/emergency-contacts", {
          method: "POST",
          token: userA.token,
          body,
        });
        assert.equal(response.status, 400);
      }
    });

    let userAContact;
    let userBContact;
    await context.test("creates and lists contacts only for the authenticated owner", async () => {
      const injectionText = "Casey'); DROP TABLE users; --";
      const created = await request(baseUrl, "/api/emergency-contacts", {
        method: "POST",
        token: userA.token,
        body: {
          name: injectionText,
          relation: "Friend",
          phone: "+91 98765 43210",
          email: "CASEY@EXAMPLE.TEST",
        },
      });
      assert.equal(created.status, 201);
      assert.equal(created.body.contact.name, injectionText);
      assert.equal(created.body.contact.relation, "Friend");
      assert.equal(created.body.contact.phone, "+919876543210");
      assert.equal(created.body.contact.email, "casey@example.test");
      assert.equal("userId" in created.body.contact, false);
      userAContact = created.body.contact;

      const second = await request(baseUrl, "/api/emergency-contacts", {
        method: "POST",
        token: userB.token,
        body: { name: "User B Contact", relation: "Family", phone: "+1 555 234 5678" },
      });
      assert.equal(second.status, 201);
      userBContact = second.body.contact;

      const listA = await request(baseUrl, "/api/emergency-contacts", { token: userA.token });
      const listB = await request(baseUrl, "/api/emergency-contacts", { token: userB.token });
      assert.deepEqual(listA.body.contacts.map((contact) => contact.id), [userAContact.id]);
      assert.deepEqual(listB.body.contacts.map((contact) => contact.id), [userBContact.id]);

      const usersTable = await getPool().query("SELECT id FROM users WHERE id = $1", [userA.user.id]);
      assert.equal(usersTable.rowCount, 1);
    });

    await context.test("updates and deletes only owned contacts", async () => {
      const updated = await request(baseUrl, `/api/emergency-contacts/${userAContact.id}`, {
        method: "PUT",
        token: userA.token,
        body: { name: "Updated Contact", relation: "Family", phone: "+91 98765 12345" },
      });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.contact.name, "Updated Contact");

      const invalidIdUpdate = await request(baseUrl, "/api/emergency-contacts/not-a-uuid", {
        method: "PUT",
        token: userA.token,
        body: { name: "Updated Contact", relation: "Family", phone: "+919876512345" },
      });
      const invalidIdDelete = await request(baseUrl, "/api/emergency-contacts/not-a-uuid", {
        method: "DELETE",
        token: userA.token,
      });
      assert.equal(invalidIdUpdate.status, 400);
      assert.equal(invalidIdDelete.status, 400);

      const foreignUpdate = await request(baseUrl, `/api/emergency-contacts/${userAContact.id}`, {
        method: "PUT",
        token: userB.token,
        body: { name: "Stolen Update", relation: "Friend", phone: "+15557654321" },
      });
      const foreignDelete = await request(baseUrl, `/api/emergency-contacts/${userAContact.id}`, {
        method: "DELETE",
        token: userB.token,
      });
      assert.equal(foreignUpdate.status, 404);
      assert.equal(foreignDelete.status, 404);

      const ownerStillHasContact = await request(baseUrl, "/api/emergency-contacts", { token: userA.token });
      assert.equal(ownerStillHasContact.body.contacts[0].name, "Updated Contact");

      const deleted = await request(baseUrl, `/api/emergency-contacts/${userAContact.id}`, {
        method: "DELETE",
        token: userA.token,
      });
      assert.equal(deleted.status, 200);

      const afterDelete = await request(baseUrl, "/api/emergency-contacts", { token: userA.token });
      assert.equal(afterDelete.body.contacts.length, 0);
    });
  } finally {
    try {
      if (createdUsers.length > 0) {
        await getPool().query("DELETE FROM users WHERE id = ANY($1::uuid[])", [createdUsers]);
      }
    } finally {
      if (server.listening) {
        await new Promise((resolve) => server.close(resolve));
      }
      await closeDatabasePool();
    }
  }
});