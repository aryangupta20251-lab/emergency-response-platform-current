import "dotenv/config";

const defaultCorsOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const nodeEnv = process.env.NODE_ENV || "development";
const port = Number(process.env.PORT || 5000);
const host = process.env.HOST?.trim() || (nodeEnv === "production" ? "127.0.0.1" : "0.0.0.0");
const passwordResetDelivery = process.env.PASSWORD_RESET_DELIVERY?.trim()
  || (nodeEnv === "production" ? "disabled" : "console");

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
if (!["console", "webhook", "disabled"].includes(passwordResetDelivery)) {
  throw new Error("PASSWORD_RESET_DELIVERY must be console, webhook, or disabled.");
}
if (nodeEnv === "production" && passwordResetDelivery === "console") {
  throw new Error("PASSWORD_RESET_DELIVERY=console is allowed only outside production.");
}

const passwordResetWebhookUrl = process.env.PASSWORD_RESET_WEBHOOK_URL?.trim() || "";
const passwordResetWebhookToken = process.env.PASSWORD_RESET_WEBHOOK_TOKEN || "";
if (passwordResetDelivery === "webhook") {
  let webhookUrl;
  try {
    webhookUrl = new URL(passwordResetWebhookUrl);
  } catch {
    throw new Error("PASSWORD_RESET_WEBHOOK_URL must be a valid HTTPS URL.");
  }
  if (webhookUrl.protocol !== "https:" && !(nodeEnv !== "production" && webhookUrl.hostname === "localhost")) {
    throw new Error("PASSWORD_RESET_WEBHOOK_URL must use HTTPS outside local development.");
  }
  if (Buffer.byteLength(passwordResetWebhookToken, "utf8") < 16) {
    throw new Error("PASSWORD_RESET_WEBHOOK_TOKEN must contain at least 16 bytes.");
  }
}

const passwordResetUrl = process.env.PASSWORD_RESET_URL?.trim() || "http://localhost:5173/reset-password";
try {
  const parsedPasswordResetUrl = new URL(passwordResetUrl);
  if (!["http:", "https:"].includes(parsedPasswordResetUrl.protocol)) throw new Error();
} catch {
  throw new Error("PASSWORD_RESET_URL must be an absolute HTTP(S) URL.");
}

export function parseCorsOrigins(setting) {
  if (typeof setting !== "string" || !setting.trim()) {
    return [...defaultCorsOrigins];
  }

  const origins = setting.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (origins.length === 0) {
    throw new Error("CORS_ORIGIN must contain at least one HTTP(S) origin.");
  }

  return [...new Set(origins.map((origin) => {
    let parsedOrigin;
    try {
      parsedOrigin = new URL(origin);
    } catch {
      throw new Error("CORS_ORIGIN must contain comma-separated HTTP(S) origins.");
    }

    if (!["http:", "https:"].includes(parsedOrigin.protocol)
      || parsedOrigin.username
      || parsedOrigin.password
      || parsedOrigin.pathname !== "/"
      || parsedOrigin.search
      || parsedOrigin.hash) {
      throw new Error("CORS_ORIGIN must contain comma-separated HTTP(S) origins without paths or credentials.");
    }

    return parsedOrigin.origin;
  }))];
}

const corsOrigin = parseCorsOrigins(process.env.CORS_ORIGIN);
const databaseUrl = nodeEnv === "test"
  ? process.env.TEST_DATABASE_URL?.trim() || ""
  : process.env.DATABASE_URL?.trim() || "";

export const env = Object.freeze({
  port,
  host,
  nodeEnv,
  corsOrigin,
  databaseUrl,
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  passwordResetDelivery,
  passwordResetWebhookUrl,
  passwordResetWebhookToken,
  passwordResetUrl,
});