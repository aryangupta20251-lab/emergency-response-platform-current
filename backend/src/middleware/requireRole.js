export function requireRole(...allowedRoles) {
  const roleSet = new Set(allowedRoles);

  return function checkRole(request, response, next) {
    if (!request.user || !roleSet.has(request.user.role)) {
      response.status(403).json({ success: false, message: "You are not allowed to perform this action." });
      return;
    }

    next();
  };
}