-- Pre-aggregated platform metrics snapshot (single row, O(1) reads).
-- Heavy COUNT queries run only via the cron recompute job.

CREATE TABLE IF NOT EXISTS platform_metrics (
  id TEXT PRIMARY KEY DEFAULT 'global',
  total_users BIGINT NOT NULL DEFAULT 0,
  total_documents BIGINT NOT NULL DEFAULT 0,
  total_folders BIGINT NOT NULL DEFAULT 0,
  daily_active_users BIGINT NOT NULL DEFAULT 0,
  public_documents BIGINT NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_metrics (id)
VALUES ('global')
ON CONFLICT (id) DO NOTHING;

-- Supports the cron-only DAU reconciliation query.
CREATE INDEX IF NOT EXISTS idx_session_updated_at ON session (updated_at);