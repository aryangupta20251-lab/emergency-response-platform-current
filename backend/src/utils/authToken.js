import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

function getJwtSecret() {
  if (Buffer.byteLength(env.jwtSecret, "utf8") < 32) {
    const error = new Error("JWT_SECRET must be configured with at least 32 bytes.");
    error.statusCode = 500;
    throw error;
  }

  return env.jwtSecret;
}

export function createAuthToken(user) {
  return jwt.sign(
    { role: user.role, sessionVersion: user.sessionVersion ?? 0 },
    getJwtSecret(),
    {
      algorithm: "HS256",
      subject: user.id,
      expiresIn: env.jwtExpiresIn,
    },
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });
}