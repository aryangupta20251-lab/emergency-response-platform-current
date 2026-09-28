CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(80) NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name VARCHAR(160) NOT NULL
    CHECK (char_length(btrim(name)) BETWEEN 2 AND 160),
  hospital_type VARCHAR(20) NOT NULL
    CHECK (hospital_type IN ('general', 'government', 'private', 'trauma_center', 'specialty')),
  address VARCHAR(255) NOT NULL
    CHECK (char_length(btrim(address)) BETWEEN 2 AND 255),
  city VARCHAR(100) NOT NULL
    CHECK (char_length(btrim(city)) BETWEEN 2 AND 100),
  state VARCHAR(100) NOT NULL
    CHECK (char_length(btrim(state)) BETWEEN 2 AND 100),
  postal_code VARCHAR(20),
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  phone_number VARCHAR(30),
  description VARCHAR(500),
  operating_hours VARCHAR(120),
  emergency_available BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  data_source VARCHAR(40) NOT NULL DEFAULT 'unverified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX hospitals_city_active_idx
  ON hospitals (lower(city), hospital_type)
  WHERE is_active;

CREATE INDEX hospitals_emergency_active_idx
  ON hospitals (emergency_available, hospital_type)
  WHERE is_active;