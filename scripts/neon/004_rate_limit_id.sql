-- Better Auth Drizzle adapter auto-generates an `id` on every model create.
ALTER TABLE rate_limit ADD COLUMN IF NOT EXISTS id TEXT;

UPDATE rate_limit SET id = key WHERE id IS NULL;

ALTER TABLE rate_limit DROP CONSTRAINT IF EXISTS rate_limit_pkey;

ALTER TABLE rate_limit ALTER COLUMN id SET NOT NULL;

ALTER TABLE rate_limit ADD PRIMARY KEY (id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limit_key ON rate_limit(key);