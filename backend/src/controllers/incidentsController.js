import {
  createIncident,
  getIncident,
  getIncidentStatus,
  listIncidentHistory,
  listIncidents,
  updateIncident,
  updateIncidentLocation,
  updateIncidentStatus,
} from "../services/incidentsService.js";
import {
  assignResponder as assignResponderService,
  findIncidentResponders,
  getIncidentAssignedResponder,
} from "../services/respondersService.js";

export async function addIncident(request, response) {
  const incident = await createIncident(request.user.id, request.body);
  response.status(201).json({
    success: true,
    message: "Incident report created.",
    incident,
  });
}

export async function readIncidents(request, response) {
  const incidents = await listIncidents(request.user.id);
  response.status(200).json({ success: true, incidents });
}

export async function readIncident(request, response) {
  const incident = await getIncident(request.user.id, request.params.id);
  if (!incident) {
    response.status(404).json({ success: false, message: "Incident not found." });
    return;
  }
  response.status(200).json({ success: true, incident });
}

export async function editIncident(request, response) {
  const incident = await updateIncident(request.user.id, request.params.id, request.body);
  if (!incident) {
    response.status(404).json({ success: false, message: "Incident not found." });
    return;
  }
  response.status(200).json({ success: true, incident });
}

export async function readIncidentHistory(request, response) {
  const history = await listIncidentHistory(request.user.id, request.params.id);
  if (!history) {
    response.status(404).json({ success: false, message: "Incident not found." });
    return;
  }
  response.status(200).json({ success: true, history });
}

export async function readIncidentStatus(request, response) {
  const status = await getIncidentStatus(request.user.id, request.params.id);
  if (!status) {
    response.status(404).json({ success: false, message: "Incident not found." });
    return;
  }
  response.status(200).json({ success: true, status });
}

export async function editIncidentStatus(request, response) {
  const incident = await updateIncidentStatus(request.user, request.params.id, request.body);
  if (!incident) {
    response.status(404).json({ success: false, message: "Incident not found." });
    return;
  }
  response.status(200).json({ success: true, incident });
}

export async function editIncidentLocation(request, response) {
  const location = await updateIncidentLocation(request.user.id, request.params.id, request.body);
  if (!location) {
    response.status(404).json({ success: false, message: "Incident not found." });
    return;
  }
  response.status(200).json({ success: true, location });
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

export async function assignIncidentResponder(request, response) {
  const assignment = await assignResponderService(request.user, request.params.id, request.body);
  if (!assignment) {
    response.status(404).json({ success: false, message: "Incident not found." });
    return;
  }
  response.status(200).json({
    success: true,
    message: "Responder assigned successfully.",
    incident: assignment.incident,
    responder: assignment.responder,
  });
}

export async function readAssignedResponder(request, response) {
  const assignment = await getIncidentAssignedResponder(request.user, request.params.id);
  if (!assignment) {
    response.status(404).json({ success: false, message: "Incident not found." });
    return;
  }
  response.status(200).json({ success: true, ...assignment });
}