CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO profiles (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name VARCHAR(100) NOT NULL
    CHECK (char_length(btrim(contact_name)) BETWEEN 2 AND 100),
  relationship VARCHAR(50) NOT NULL
    CHECK (char_length(btrim(relationship)) BETWEEN 1 AND 50),
  phone_number VARCHAR(16) NOT NULL
    CHECK (phone_number ~ '^\\+?[1-9][0-9]{6,14}$'),
  email VARCHAR(254)
    CHECK (email IS NULL OR email ~* '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX emergency_contacts_user_created_idx
  ON emergency_contacts (user_id, created_at, id);