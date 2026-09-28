ALTER TABLE incidents
  DROP CONSTRAINT incidents_status_check;

ALTER TABLE incidents
  ADD CONSTRAINT incidents_status_check
  CHECK (status IN (
    'reported',
    'received',
    'verified',
    'responder_assigned',
    'responding',
    'arrived',
    'resolved',
    'cancelled'
  ));

ALTER TABLE incidents
  ADD COLUMN latitude DOUBLE PRECISION
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  ADD COLUMN longitude DOUBLE PRECISION
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  ADD CONSTRAINT incidents_coordinates_pair_check
    CHECK ((latitude IS NULL) = (longitude IS NULL));

CREATE TABLE incident_status_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  previous_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (previous_status IS NULL OR previous_status IN (
    'reported', 'received', 'verified', 'responder_assigned',
    'responding', 'arrived', 'resolved', 'cancelled'
  )),
  CHECK (new_status IN (
    'reported', 'received', 'verified', 'responder_assigned',
    'responding', 'arrived', 'resolved', 'cancelled'
  )),
  CHECK (previous_status IS NULL OR previous_status <> new_status)
);

CREATE UNIQUE INDEX incident_status_history_initial_unique
  ON incident_status_history (incident_id)
  WHERE previous_status IS NULL;

CREATE INDEX incident_status_history_timeline_idx
  ON incident_status_history (incident_id, created_at, id);

INSERT INTO incident_status_history (
  incident_id,
  previous_status,
  new_status,
  changed_by_user_id,
  created_at
)
SELECT id, NULL, status, reporter_id, created_at
FROM incidents
WHERE NOT EXISTS (
  SELECT 1
  FROM incident_status_history history
  WHERE history.incident_id = incidents.id
    AND history.previous_status IS NULL
);