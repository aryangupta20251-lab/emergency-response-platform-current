import { Server } from "socket.io";
import { env } from "../config/env.js";
import { getPool } from "../db/pool.js";
import { verifyAuthToken } from "../utils/authToken.js";

let io;

function userRoom(userId) {
  return "user:" + userId;
}

export function attachRealtime(httpServer) {
  if (io) {
    throw new Error("Realtime server is already attached.");
  }

  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || !token) {
      next(new Error("Authentication required."));
      return;
    }

    try {
      const claims = verifyAuthToken(token);
      if (!claims || typeof claims !== "object" || typeof claims.sub !== "string") {
        next(new Error("Invalid or expired token."));
        return;
      }

      const result = await getPool().query(
        "SELECT role, account_status, session_version FROM users WHERE id = $1",
        [claims.sub],
      );
      const user = result.rows[0];
      if (!user || user.account_status !== "active" || user.role !== claims.role
        || !Number.isInteger(claims.sessionVersion)
        || claims.sessionVersion !== Number(user.session_version)) {
        next(new Error("Invalid or expired token."));
        return;
      }

      socket.data.userId = claims.sub;
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.data.userId));
  });

  return io;
}

export function emitUserEvent(userId, eventName, payload) {
  if (!io) return false;
  io.to(userRoom(userId)).emit(eventName, payload);
  return true;
}

export async function disconnectUserSockets(userId) {
  if (!io) return 0;
  const sockets = await io.in(userRoom(userId)).fetchSockets();
  for (const socket of sockets) socket.disconnect(true);
  return sockets.length;
}

export async function closeRealtime() {
  if (!io) return;
  const activeServer = io;
  io = undefined;
  await new Promise((resolve) => activeServer.close(resolve));
}