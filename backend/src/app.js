import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { apiRouter } from "./routes/apiRoutes.js";

export const app = express();

app.disable("x-powered-by");
app.use(
  (request, response, next) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Frame-Options", "DENY");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Permissions-Policy", "geolocation=(self), microphone=(), camera=()");
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  },
);
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);