ALTER TABLE emergency_contacts
  DROP CONSTRAINT emergency_contacts_phone_number_check;

ALTER TABLE emergency_contacts
  ADD CONSTRAINT emergency_contacts_phone_number_check
  CHECK (phone_number ~ '^[+]?[1-9][0-9]{6,14}$');

ALTER TABLE emergency_contacts
  DROP CONSTRAINT emergency_contacts_email_check;

ALTER TABLE emergency_contacts
  ADD CONSTRAINT emergency_contacts_email_check
  CHECK (
    email IS NULL
    OR email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  );