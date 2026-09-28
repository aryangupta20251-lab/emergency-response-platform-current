import {
  createContact,
  deleteContact,
  listContacts,
  updateContact,
} from "../services/contactsService.js";

export async function readContacts(request, response) {
  const contacts = await listContacts(request.user.id);
  response.status(200).json({ success: true, contacts });
}

export async function addContact(request, response) {
  const contact = await createContact(request.user.id, request.body);
  response.status(201).json({ success: true, contact });
}

export async function editContact(request, response) {
  const contact = await updateContact(request.user.id, request.params.id, request.body);
  if (!contact) {
    response.status(404).json({ success: false, message: "Emergency contact not found." });
    return;
  }
  response.status(200).json({ success: true, contact });
}

export async function removeContact(request, response) {
  const deleted = await deleteContact(request.user.id, request.params.id);
  if (!deleted) {
    response.status(404).json({ success: false, message: "Emergency contact not found." });
    return;
  }
  response.status(200).json({ success: true, message: "Emergency contact deleted." });
}