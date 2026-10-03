import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { attachRealtime } from "./realtime/socket.js";

const server = createServer(app);
attachRealtime(server);

server.listen(env.port, env.host, () => {
  console.log("Emergency Response Platform API listening on " + env.host + ":" + env.port);
});

server.on("error", (error) => {
  console.error("Could not start the API server: " + error.message);
  process.exitCode = 1;
});