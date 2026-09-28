import { getHospital, findNearbyHospitals, listHospitals } from "../services/hospitalsService.js";

export async function readHospitals(request, response) {
  const hospitals = await listHospitals(request.query);
  response.status(200).json({ success: true, hospitals });
}

export async function readNearbyHospitals(request, response) {
  const hospitals = await findNearbyHospitals(request.query);
  response.status(200).json({
    success: true,
    distanceUnit: "km",
    distanceType: "straight_line",
    hospitals,
  });
}

export async function readHospital(request, response) {
  const hospital = await getHospital(request.params.id);
  if (!hospital) {
    response.status(404).json({ success: false, message: "Hospital not found." });
    return;
  }
  response.status(200).json({ success: true, hospital });
}