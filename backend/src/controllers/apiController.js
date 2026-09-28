import { env } from "../config/env.js";
import { checkDatabaseConnection } from "../db/pool.js";

export function getApiInfo(_request, response) {
  response.status(200).json({
    success: true,
    name: "Emergency Response Platform API",
    message: "The API foundation is available.",
  });
}

export async function getHealth(_request, response) {
  try {
    await checkDatabaseConnection();
    response.status(200).json({
      success: true,
      message: "Emergency Response Platform API is running",
      database: { status: "connected" },
    });
  } catch (error) {
    const status = env.databaseUrl ? "unavailable" : "not_configured";
    const errorCode = error.code || "unknown";
    console.error("Database health check failed (" + errorCode + ").");

    response.status(503).json({
      success: false,
      message: "Emergency Response Platform API is running but the database is " + status.replace("_", " "),
      database: { status },
    });
  }
}