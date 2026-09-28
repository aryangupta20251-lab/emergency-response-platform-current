import { getPool } from "../db/pool.js";

export async function requireAdmin(request, response, next) {
  if (!request.user || !request.user.id) {
    response.status(401).json({ success: false, message: "A valid Bearer token is required." });
    return;
  }

  const result = await getPool().query(
    "SELECT role, account_status FROM users WHERE id = $1",
    [request.user.id],
  );
  const user = result.rows[0];

  if (!user || user.account_status !== "active" || user.role !== "admin") {
    response.status(403).json({ success: false, message: "You are not allowed to perform this action." });
    return;
  }

  request.user.role = user.role;
  next();
}
