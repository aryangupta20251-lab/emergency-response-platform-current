import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { closeDatabasePool, getPool } from "./pool.js";

const migrationsDirectory = join(dirname(fileURLToPath(import.meta.url)), "migrations");

async function runMigrations() {
  const client = await getPool().connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const files = (await readdir(migrationsDirectory))
      .filter((fileName) => /^\d+_[a-z0-9_-]+\.sql$/i.test(fileName))
      .sort();

    for (const fileName of files) {
      const alreadyApplied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE migration_name = $1",
        [fileName],
      );

      if (alreadyApplied.rowCount > 0) {
        continue;
      }

      const sql = await readFile(join(migrationsDirectory, fileName), "utf8");
      await client.query("BEGIN");

      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (migration_name) VALUES ($1)",
          [fileName],
        );
        await client.query("COMMIT");
        console.log("Applied database migration " + fileName + ".");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
  }
}

try {
  await runMigrations();
} catch (error) {
  console.error("Database migration failed (" + (error.code || "unknown") + ").");
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}