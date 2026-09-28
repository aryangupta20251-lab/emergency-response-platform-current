import { getProfile, updateProfile } from "../services/profileService.js";

export async function readProfile(request, response) {
  const result = await getProfile(request.user.id);
  if (!result) {
    response.status(404).json({ success: false, message: "Profile not found." });
    return;
  }
  response.status(200).json(result);
}

export async function editProfile(request, response) {
  const result = await updateProfile(request.user.id, request.body);
  if (!result) {
    response.status(404).json({ success: false, message: "Profile not found." });
    return;
  }
  response.status(200).json({ ...result, message: "Profile updated successfully." });
}