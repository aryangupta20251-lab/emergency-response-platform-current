import {
  authenticateUser,
  findActiveUserById,
  registerUser,
  requestPasswordReset as requestPasswordResetService,
  resetPassword as resetPasswordService,
} from "../services/authService.js";
import { createAuthToken } from "../utils/authToken.js";

export async function register(request, response) {
  const user = await registerUser(request.body);
  response.status(201).json({
    success: true,
    message: "Registration successful",
    user,
  });
}

export async function login(request, response) {
  const user = await authenticateUser(request.body);
  if (!user) {
    response.status(401).json({ success: false, message: "Invalid email or password." });
    return;
  }

  response.status(200).json({
    success: true,
    message: "Login successful",
    token: createAuthToken(user),
    user: publicUser(user),
  });
}

export async function getCurrentUser(request, response) {
  const user = await findActiveUserById(request.user.id);
  if (!user) {
    response.status(401).json({ success: false, message: "Invalid or expired token." });
    return;
  }

  response.status(200).json({ success: true, user: publicUser(user) });
}

function publicUser(user) {
  const safeUser = { ...user };
  delete safeUser.sessionVersion;
  return safeUser;
}

export async function requestPasswordReset(request, response) {
  await requestPasswordResetService(request.body);
  response.status(202).json({
    success: true,
    message: "If an active account matches that information, password reset instructions will be sent.",
  });
}

export async function resetPassword(request, response) {
  const updated = await resetPasswordService(request.body);
  if (!updated) {
    response.status(400).json({ success: false, message: "The reset token is invalid or expired." });
    return;
  }
  response.status(200).json({ success: true, message: "Password updated. Sign in with your new password." });
}