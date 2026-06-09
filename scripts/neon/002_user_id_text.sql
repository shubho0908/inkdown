-- Align app user_id columns with Better Auth TEXT primary keys.
-- Safe to run on databases created before profiles/files/folders used UUID user_id.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'user_id'
      AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE profiles
      ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'folders'
      AND column_name = 'user_id'
      AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE folders
      ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'files'
      AND column_name = 'user_id'
      AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE files
      ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_user_id_fkey'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'folders_user_id_fkey'
  ) THEN
    ALTER TABLE folders
      ADD CONSTRAINT folders_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'files_user_id_fkey'
  ) THEN
    ALTER TABLE files
      ADD CONSTRAINT files_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_profile_username(email_text TEXT, source_user_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_username TEXT;
  candidate TEXT;
BEGIN
  base_username := regexp_replace(lower(split_part(coalesce(email_text, ''), '@', 1)), '[^a-z0-9_]+', '', 'g');

  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  candidate := base_username;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate AND user_id <> source_user_id) THEN
    candidate := base_username || '_' || substring(replace(source_user_id, '-', '') FROM 1 FOR 6);
  END IF;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_profile_username(profile_user_id TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT username
  FROM public.profiles
  WHERE user_id = profile_user_id;
$$;