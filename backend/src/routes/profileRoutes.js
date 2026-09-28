import { Router } from "express";
import { editProfile, readProfile } from "../controllers/profileController.js";
import { authenticate } from "../middleware/authenticate.js";

export const profileRouter = Router();

profileRouter.use(authenticate);
profileRouter.get("/", readProfile);
profileRouter.patch("/", editProfile);