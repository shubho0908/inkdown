-- DAU metric removed; column and cron-only session index are no longer needed.

DROP INDEX IF EXISTS idx_session_updated_at;

ALTER TABLE platform_metrics
  DROP COLUMN IF EXISTS daily_active_users;