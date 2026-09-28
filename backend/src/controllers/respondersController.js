import {
  createResponderProfile,
  findIncidentResponders,
  findNearbyResponders,
  getResponderProfile,
  updateResponderAvailability,
  updateResponderLocation,
  updateResponderVerification,
} from "../services/respondersService.js";

export async function createProfile(request, response) {
  const responder = await createResponderProfile(request.body);
  response.status(201).json({
    success: true,
    message: "Responder profile created in offline, unverified state.",
    responder,
  });
}

export async function readMyProfile(request, response) {
  const responder = await getResponderProfile(request.user.id);
  if (!responder) {
    response.status(404).json({ success: false, message: "Responder profile not found." });
    return;
  }
  response.status(200).json({ success: true, responder });
}

export async function editMyLocation(request, response) {
  const location = await updateResponderLocation(request.user.id, request.body);
  if (!location) {
    response.status(404).json({ success: false, message: "Responder profile not found." });
    return;
  }
  response.status(200).json({ success: true, location });
}

export async function editMyAvailability(request, response) {
  const responder = await updateResponderAvailability(request.user.id, request.body);
  if (!responder) {
    response.status(404).json({ success: false, message: "Responder profile not found." });
    return;
  }
  response.status(200).json({ success: true, responder });
}

export async function editResponderVerification(request, response) {
  const responder = await updateResponderVerification(request.params.userId, request.body);
  if (!responder) {
    response.status(404).json({ success: false, message: "Responder profile not found." });
    return;
  }
  response.status(200).json({ success: true, responder });
}

export async function readNearbyResponders(request, response) {
  const responders = await findNearbyResponders(request.query);
  response.status(200).json({
    success: true,
    distanceUnit: "km",
    distanceType: "straight_line",
    responders,
  });
}

export async function readIncidentResponders(request, response) {
  const responders = await findIncidentResponders(request.params.id, request.query);
  if (!responders) {
    response.status(404).json({ success: false, message: "Incident not found." });
    return;
  }
  response.status(200).json({
    success: true,
    distanceUnit: "km",
    distanceType: "straight_line",
    responders,
  });
}