ALTER TABLE users
  ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0
    CHECK (session_version >= 0);

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  CHECK (expires_at > created_at)
);

CREATE INDEX password_reset_tokens_user_pending_idx
  ON password_reset_tokens (user_id, expires_at)
  WHERE consumed_at IS NULL;
