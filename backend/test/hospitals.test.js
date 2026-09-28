import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { app } from "../src/app.js";
import { closeDatabasePool, getPool } from "../src/db/pool.js";
import { seedDevelopmentHospitals } from "../src/db/seedDevelopmentHospitals.js";
import { createAuthToken } from "../src/utils/authToken.js";

const userToken = createAuthToken({ id: randomUUID(), role: "citizen" });
const cityHospital = {
  latitude: 30.7415,
  longitude: 76.7683,
};

async function request(baseUrl, path, token = userToken) {
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${baseUrl}${path}`, { headers });
  return { status: response.status, body: await response.json() };
}

test("hospital APIs validate filters, details, and nearby distance", async (context) => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await seedDevelopmentHospitals();

    await context.test("read-only hospital directory is publicly accessible", async () => {
      const publicList = await request(baseUrl, "/api/hospitals", null);
      const publicNearby = await request(
        baseUrl,
        `/api/hospitals/nearby?latitude=${cityHospital.latitude}&longitude=${cityHospital.longitude}`,
        null,
      );
      assert.equal(publicList.status, 200);
      assert.equal(publicNearby.status, 200);
    });

    await context.test("lists and filters clearly marked development records", async () => {
      const all = await request(baseUrl, "/api/hospitals?city=Chandigarh");
      assert.equal(all.status, 200);
      assert.ok(all.body.hospitals.length >= 3);
      assert.ok(all.body.hospitals.every((hospital) => hospital.isDemo === true));
      assert.ok(all.body.hospitals.every((hospital) => hospital.dataSource === "development_seed"));
      assert.ok(all.body.hospitals.every((hospital) => hospital.availabilityIsLive === false));

      const government = await request(baseUrl, "/api/hospitals?type=government&emergency=true&city=Chandigarh");
      assert.equal(government.status, 200);
      assert.ok(government.body.hospitals.length >= 1);
      assert.ok(government.body.hospitals.every((hospital) => hospital.type === "Government"));
      assert.ok(government.body.hospitals.every((hospital) => hospital.emergencyAvailable));

      const traumaWithoutEmergency = await request(baseUrl, "/api/hospitals?type=trauma_center&emergency=false");
      assert.equal(traumaWithoutEmergency.status, 200);
      assert.ok(traumaWithoutEmergency.body.hospitals.some((hospital) => hospital.id === "north-trauma-centre"));

      const injectionFilter = await request(
        baseUrl,
        "/api/hospitals?city=Chandigarh%27%20OR%201%3D1--",
      );
      assert.equal(injectionFilter.status, 200);
      assert.deepEqual(injectionFilter.body.hospitals, []);

      for (const query of ["type=unknown", "emergency=yes", "city=x"]) {
        const invalid = await request(baseUrl, `/api/hospitals?${query}`);
        assert.equal(invalid.status, 400);
      }
    });

    await context.test("returns details by stable frontend slug and handles invalid or missing IDs", async () => {
      const detail = await request(baseUrl, "/api/hospitals/city-hospital");
      assert.equal(detail.status, 200);
      assert.equal(detail.body.hospital.id, "city-hospital");
      assert.equal(detail.body.hospital.name, "City Hospital");
      assert.equal(detail.body.hospital.phone, null);
      assert.equal(detail.body.hospital.isDemo, true);
      assert.equal("databaseId" in detail.body.hospital, false);

      const invalid = await request(baseUrl, "/api/hospitals/not-a-valid-slug%3B--");
      const missing = await request(baseUrl, "/api/hospitals/no-such-hospital");
      assert.equal(invalid.status, 400);
      assert.equal(missing.status, 404);
      assert.equal(JSON.stringify(missing.body).includes("stack"), false);
    });

    await context.test("nearby search calculates straight-line kilometers and sorts within radius", async () => {
      const nearby = await request(
        baseUrl,
        `/api/hospitals/nearby?latitude=${cityHospital.latitude}&longitude=${cityHospital.longitude}&radius=50&city=Chandigarh`,
      );
      assert.equal(nearby.status, 200);
      assert.equal(nearby.body.distanceUnit, "km");
      assert.equal(nearby.body.distanceType, "straight_line");
      assert.ok(nearby.body.hospitals.length >= 3);
      assert.equal(nearby.body.hospitals[0].id, "city-hospital");
      assert.equal(nearby.body.hospitals[0].distanceKm, 0);
      for (let index = 1; index < nearby.body.hospitals.length; index += 1) {
        assert.ok(nearby.body.hospitals[index - 1].distanceKm <= nearby.body.hospitals[index].distanceKm);
      }

      const withinOneKm = await request(
        baseUrl,
        `/api/hospitals/nearby?latitude=${cityHospital.latitude}&longitude=${cityHospital.longitude}&radius=1&type=general&city=Chandigarh`,
      );
      assert.equal(withinOneKm.status, 200);
      assert.deepEqual(withinOneKm.body.hospitals.map((hospital) => hospital.id), ["city-hospital"]);

      const emergencyOnly = await request(
        baseUrl,
        `/api/hospitals/nearby?latitude=${cityHospital.latitude}&longitude=${cityHospital.longitude}&radius=50&emergency=true&city=Chandigarh`,
      );
      assert.ok(emergencyOnly.body.hospitals.every((hospital) => hospital.emergencyAvailable));

      const noEmergency = await request(
        baseUrl,
        `/api/hospitals/nearby?latitude=${cityHospital.latitude}&longitude=${cityHospital.longitude}&radius=50&type=trauma_center&emergency=true`,
      );
      assert.deepEqual(noEmergency.body.hospitals, []);
    });

    await context.test("rejects missing or invalid nearby coordinates and radius", async () => {
      const invalidQueries = [
        "",
        "latitude=30.7",
        "longitude=76.7",
        "latitude=90.1&longitude=76.7",
        "latitude=30.7&longitude=-180.1",
        "latitude=NaN&longitude=76.7",
        "latitude=30.7&longitude=76.7&radius=0",
        "latitude=30.7&longitude=76.7&radius=-1",
        "latitude=30.7&longitude=76.7&radius=50.1",
        "latitude=30.7&longitude=76.7&radius=abc",
        "latitude=30.7&longitude=76.7&emergency=yes",
      ];

      for (const query of invalidQueries) {
        const invalid = await request(baseUrl, `/api/hospitals/nearby${query ? `?${query}` : ""}`);
        assert.equal(invalid.status, 400, query);
        assert.equal(invalid.body.success, false);
        assert.equal(JSON.stringify(invalid.body).includes("DATABASE_URL"), false);
      }
    });

    await context.test("development seed is idempotent and database rejects invalid coordinates", async () => {
      await seedDevelopmentHospitals();
      const counts = await getPool().query(
        "SELECT slug, count(*)::int AS count FROM hospitals WHERE slug = ANY($1::text[]) GROUP BY slug",
        [["city-hospital", "government-hospital", "north-trauma-centre"]],
      );
      assert.equal(counts.rowCount, 3);
      assert.ok(counts.rows.every((row) => row.count === 1));

      const invalidSlug = `invalid-coordinate-${randomUUID()}`;
      await assert.rejects(
        getPool().query(
          `INSERT INTO hospitals (
             slug, name, hospital_type, address, city, state, latitude, longitude, is_demo, data_source
           ) VALUES ($1, 'Invalid Test Hospital', 'general', 'Test address', 'Test city', 'Test state', 91, 20, TRUE, 'test')`,
          [invalidSlug],
        ),
        (error) => error.code === "23514",
      );
    });
  } finally {
    if (server.listening) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabasePool();
  }
});