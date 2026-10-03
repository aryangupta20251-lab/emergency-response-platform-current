import { Router } from "express";
import {
  getCurrentUser,
  login,
  register,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/password-reset/request", requestPasswordReset);
authRouter.post("/password-reset/confirm", resetPassword);
authRouter.get("/me", authenticate, getCurrentUser);