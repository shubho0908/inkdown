-- Hardening: readiness flag + atomic single-row counter adjustments.
-- Counter bumps are O(1) and race-safe; heavy aggregation stays cron-only.

ALTER TABLE platform_metrics
  ADD COLUMN IF NOT EXISTS is_ready BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION inkdown_adjust_platform_metric(
  p_counter TEXT,
  p_delta BIGINT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_delta = 0 THEN
    RETURN;
  END IF;

  IF p_counter = 'total_users' THEN
    UPDATE platform_metrics
    SET total_users = GREATEST(0, total_users + p_delta)
    WHERE id = 'global';
  ELSIF p_counter = 'total_documents' THEN
    UPDATE platform_metrics
    SET total_documents = GREATEST(0, total_documents + p_delta)
    WHERE id = 'global';
  ELSIF p_counter = 'total_folders' THEN
    UPDATE platform_metrics
    SET total_folders = GREATEST(0, total_folders + p_delta)
    WHERE id = 'global';
  ELSIF p_counter = 'public_documents' THEN
    UPDATE platform_metrics
    SET public_documents = GREATEST(0, public_documents + p_delta)
    WHERE id = 'global';
  ELSE
    RAISE EXCEPTION 'Unknown platform metric counter: %', p_counter;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION inkdown_seed_platform_metrics_if_needed() RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM platform_metrics
    WHERE id = 'global' AND is_ready = TRUE
  ) THEN
    RETURN FALSE;
  END IF;

  UPDATE platform_metrics
  SET
    total_users = (SELECT count(*)::BIGINT FROM "user"),
    total_documents = (SELECT count(*)::BIGINT FROM files),
    total_folders = (SELECT count(*)::BIGINT FROM folders),
    public_documents = (
      SELECT count(*)::BIGINT
      FROM files
      WHERE is_public = TRUE AND slug IS NOT NULL
    ),
    daily_active_users = (
      SELECT count(DISTINCT user_id)::BIGINT
      FROM session
      WHERE updated_at >= NOW() - INTERVAL '1 day'
    ),
    computed_at = NOW(),
    is_ready = TRUE
  WHERE id = 'global';

  RETURN TRUE;
END;
$$;