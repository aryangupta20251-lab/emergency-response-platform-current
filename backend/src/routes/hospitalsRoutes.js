import { Router } from "express";
import { readHospital, readHospitals, readNearbyHospitals } from "../controllers/hospitalsController.js";

export const hospitalsRouter = Router();

// Hospital directory records are public; incident and user data remain protected.
hospitalsRouter.get("/nearby", readNearbyHospitals);
hospitalsRouter.get("/", readHospitals);
hospitalsRouter.get("/:id", readHospital);