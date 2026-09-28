CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  incident_type VARCHAR(60) NOT NULL
    CHECK (incident_type IN (
      'Vehicle collision',
      'Vehicle and pedestrian',
      'Single vehicle accident',
      'Other'
    )),
  people_involved VARCHAR(20) NOT NULL
    CHECK (people_involved IN ('1', '2', '3', '4 or more', 'Unknown')),
  visible_injuries VARCHAR(10) NOT NULL
    CHECK (visible_injuries IN ('Yes', 'No', 'Unknown')),
  vehicles VARCHAR(40) NOT NULL
    CHECK (vehicles IN (
      'Car',
      'Motorcycle',
      'Truck or bus',
      'Multiple vehicle types',
      'Unknown'
    )),
  description VARCHAR(500),
  location_name VARCHAR(255) NOT NULL
    CHECK (char_length(btrim(location_name)) BETWEEN 2 AND 255),
  status VARCHAR(20) NOT NULL DEFAULT 'reported'
    CHECK (status = 'reported'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (description IS NULL OR char_length(description) <= 500)
);

CREATE INDEX incidents_reporter_created_idx
  ON incidents (reporter_id, created_at DESC, id DESC);