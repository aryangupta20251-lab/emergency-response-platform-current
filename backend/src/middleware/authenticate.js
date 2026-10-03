import { findActiveUserById } from "../services/authService.js";
import { verifyAuthToken } from "../utils/authToken.js";

const allowedRoles = new Set(["citizen", "responder", "admin"]);
const userIdPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function rejectAuthentication(response, message) {
  response.status(401).json({ success: false, message });
}

export async function authenticate(request, response, next) {
  const authorization = request.get("authorization") || "";
  const [scheme, token, ...extraParts] = authorization.split(" ");

  if (scheme !== "Bearer" || !token || extraParts.length > 0) {
    rejectAuthentication(response, "A valid Bearer token is required.");
    return;
  }

  let claims;
  try {
    claims = verifyAuthToken(token);
  } catch {
    rejectAuthentication(response, "Invalid or expired token.");
    return;
  }

  if (!claims || typeof claims !== "object" || typeof claims.sub !== "string"
    || !userIdPattern.test(claims.sub) || !allowedRoles.has(claims.role)) {
    rejectAuthentication(response, "Invalid or expired token.");
    return;
  }

  try {
    const user = await findActiveUserById(claims.sub);
    if (!user || user.role !== claims.role
      || !Number.isInteger(claims.sessionVersion)
      || claims.sessionVersion !== user.sessionVersion) {
      rejectAuthentication(response, "Invalid or expired token.");
      return;
    }

    request.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
}