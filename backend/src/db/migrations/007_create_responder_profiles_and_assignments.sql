CREATE TABLE responder_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  responder_type VARCHAR(32) NOT NULL DEFAULT 'first_responder'
    CHECK (responder_type IN (
      'ambulance',
      'paramedic',
      'police',
      'fire',
      'rescue',
      'first_responder'
    )),
  organization VARCHAR(120),
  service_area VARCHAR(120),
  availability VARCHAR(12) NOT NULL DEFAULT 'offline'
    CHECK (availability IN ('available', 'busy', 'offline')),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  latitude DOUBLE PRECISION CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((latitude IS NULL) = (longitude IS NULL))
);

INSERT INTO responder_profiles (user_id)
SELECT id
FROM users
WHERE role = 'responder'
ON CONFLICT (user_id) DO NOTHING;

CREATE INDEX responder_discovery_type_idx
  ON responder_profiles (responder_type, availability)
  WHERE is_active AND is_verified;

CREATE INDEX responder_location_idx
  ON responder_profiles (latitude, longitude)
  WHERE is_active AND is_verified AND availability = 'available';

ALTER TABLE incidents
  ADD COLUMN assigned_responder_user_id UUID
    REFERENCES responder_profiles(user_id) ON DELETE SET NULL;

CREATE UNIQUE INDEX incidents_one_active_assignment_per_responder
  ON incidents (assigned_responder_user_id)
  WHERE assigned_responder_user_id IS NOT NULL
    AND status NOT IN ('resolved', 'cancelled');