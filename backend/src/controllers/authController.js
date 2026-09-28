import { authenticateUser, findActiveUserById, registerUser } from "../services/authService.js";
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
    user,
  });
}

export async function getCurrentUser(request, response) {
  const user = await findActiveUserById(request.user.id);
  if (!user) {
    response.status(401).json({ success: false, message: "Invalid or expired token." });
    return;
  }

  response.status(200).json({ success: true, user });
}