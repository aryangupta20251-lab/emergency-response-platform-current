import { env } from "../config/env.js";
import { closeDatabasePool, getPool } from "./pool.js";
import { developmentHospitals } from "./seeds/developmentHospitals.js";

export async function seedDevelopmentHospitals() {
  if (env.nodeEnv === "production") {
    throw new Error("Development hospital records cannot be seeded in production.");
  }

  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    for (const hospital of developmentHospitals) {
      await client.query(
        `INSERT INTO hospitals (
           slug, name, hospital_type, address, city, state,
           latitude, longitude, description, emergency_available,
           is_demo, data_source
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, 'development_seed')
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           hospital_type = EXCLUDED.hospital_type,
           address = EXCLUDED.address,
           city = EXCLUDED.city,
           state = EXCLUDED.state,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           description = EXCLUDED.description,
           emergency_available = EXCLUDED.emergency_available,
           is_demo = TRUE,
           data_source = 'development_seed',
           updated_at = CURRENT_TIMESTAMP`,
        [
          hospital.slug,
          hospital.name,
          hospital.hospitalType,
          hospital.address,
          hospital.city,
          hospital.state,
          hospital.latitude,
          hospital.longitude,
          hospital.description,
          hospital.emergencyAvailable,
        ],
      );
    }
    await client.query("COMMIT");
    return developmentHospitals.length;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith("seedDevelopmentHospitals.js")) {
  try {
    const count = await seedDevelopmentHospitals();
    console.log("Seeded " + count + " clearly marked development hospital records.");
  } catch (error) {
    console.error("Hospital development seed failed (" + (error.code || "unknown") + ").");
    process.exitCode = 1;
  } finally {
    await closeDatabasePool();
  }
}