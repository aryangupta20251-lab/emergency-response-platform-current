import "dotenv/config";

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const corsOriginSetting = process.env.CORS_ORIGIN?.trim() || "*";
const corsOrigin =
  corsOriginSetting === "*"
    ? "*"
    : corsOriginSetting.split(",").map((origin) => origin.trim());

export const env = Object.freeze({
  port,
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin,
  databaseUrl: process.env.DATABASE_URL?.trim() || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
});