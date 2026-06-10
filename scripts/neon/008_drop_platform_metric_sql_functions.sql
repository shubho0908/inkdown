-- Application counter logic lives in Drizzle (SELECT … FOR UPDATE).
-- Bootstrap seeding lives in scripts/seed-platform-metrics.mjs.

DROP FUNCTION IF EXISTS inkdown_adjust_platform_metric(TEXT, BIGINT);
DROP FUNCTION IF EXISTS inkdown_seed_platform_metrics_if_needed();