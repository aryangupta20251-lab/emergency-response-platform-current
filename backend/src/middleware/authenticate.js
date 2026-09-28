import { verifyAuthToken } from "../utils/authToken.js";

const allowedRoles = new Set(["citizen", "responder", "admin"]);

function rejectAuthentication(response, message) {
  response.status(401).json({ success: false, message });
}

export function authenticate(request, response, next) {
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
    || !allowedRoles.has(claims.role)) {
    rejectAuthentication(response, "Invalid or expired token.");
    return;
  }

  request.user = { id: claims.sub, role: claims.role };
  next();
}