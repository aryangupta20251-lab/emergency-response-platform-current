import { Router } from "express";
import {
  addContact,
  editContact,
  readContacts,
  removeContact,
} from "../controllers/contactsController.js";
import { authenticate } from "../middleware/authenticate.js";

export const contactsRouter = Router();

contactsRouter.use(authenticate);
contactsRouter.get("/", readContacts);
contactsRouter.post("/", addContact);
contactsRouter.put("/:id", editContact);
contactsRouter.delete("/:id", removeContact);