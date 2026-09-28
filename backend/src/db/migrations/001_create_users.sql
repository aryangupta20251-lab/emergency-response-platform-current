CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 100),
  email VARCHAR(254),
  phone_number VARCHAR(16),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'citizen'
    CHECK (role IN ('citizen', 'responder', 'admin')),
  account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

CREATE UNIQUE INDEX users_email_lower_unique
  ON users (lower(email))
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX users_phone_number_unique
  ON users (phone_number)
  WHERE phone_number IS NOT NULL;