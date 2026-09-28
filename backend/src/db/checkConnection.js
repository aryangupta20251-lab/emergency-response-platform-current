import { checkDatabaseConnection, closeDatabasePool } from "./pool.js";

try {
  const currentTime = await checkDatabaseConnection();
  console.log("PostgreSQL connection successful; SELECT NOW() returned " + currentTime.toISOString());
} catch (error) {
  const errorCode = error.code || "unknown";
  console.error("PostgreSQL connection test failed (" + errorCode + ").");
  if (error.code === "DATABASE_URL_MISSING") {
    console.error("Set DATABASE_URL in backend/.env before running this check.");
  }
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}