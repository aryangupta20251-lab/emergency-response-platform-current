import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;
let pool;

export function getPool() {
  if (!env.databaseUrl) {
    const error = new Error("DATABASE_URL is not configured.");
    error.code = "DATABASE_URL_MISSING";
    throw error;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      connectionTimeoutMillis: 5000,
    });
    pool.on("error", (error) => {
      console.error("Unexpected PostgreSQL pool error (" + (error.code || "unknown") + ").");
    });
  }

  return pool;
}

export async function checkDatabaseConnection() {
  const result = await getPool().query("SELECT NOW() AS current_time");
  return result.rows[0].current_time;
}

export async function closeDatabasePool() {
  if (pool) {
    const activePool = pool;
    pool = undefined;
    await activePool.end();
  }
}