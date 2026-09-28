CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL
    CHECK (type IN (
      'incident_created',
      'incident_received',
      'incident_verified',
      'responder_assigned',
      'responder_en_route',
      'responder_arrived',
      'incident_resolved',
      'incident_cancelled',
      'system'
    )),
  title VARCHAR(120) NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  message VARCHAR(1000) NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 1000),
  related_incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  related_responder_user_id UUID REFERENCES responder_profiles(user_id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMPTZ,
  CHECK ((is_read AND read_at IS NOT NULL) OR (NOT is_read AND read_at IS NULL)),
  CHECK (type = 'system' OR related_incident_id IS NOT NULL)
);

CREATE INDEX notifications_user_created_idx
  ON notifications (user_id, created_at DESC, id DESC);

CREATE INDEX notifications_user_unread_idx
  ON notifications (user_id, created_at DESC)
  WHERE is_read = FALSE;