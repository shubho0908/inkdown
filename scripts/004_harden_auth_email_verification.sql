ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

UPDATE public.profiles AS profiles
SET
  email_verified = (users.email_confirmed_at IS NOT NULL),
  email_verified_at = users.email_confirmed_at,
  updated_at = NOW()
FROM auth.users AS users
WHERE users.id = profiles.user_id
  AND (
    profiles.email_verified IS DISTINCT FROM (users.email_confirmed_at IS NOT NULL)
    OR profiles.email_verified_at IS DISTINCT FROM users.email_confirmed_at
  );

CREATE OR REPLACE FUNCTION public.handle_auth_user_profile_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    username,
    email_verified,
    email_verified_at
  )
  VALUES (
    NEW.id,
    public.generate_profile_username(NEW.email, NEW.id),
    NEW.email_confirmed_at IS NOT NULL,
    NEW.email_confirmed_at
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email_verified = EXCLUDED.email_verified,
    email_verified_at = EXCLUDED.email_verified_at,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_sync_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated_sync_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_sync_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_profile_sync();

CREATE TRIGGER on_auth_user_updated_sync_profile
  AFTER UPDATE OF email, email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_profile_sync();

DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN
    SELECT id, email, email_confirmed_at
    FROM auth.users
  LOOP
    INSERT INTO public.profiles (
      user_id,
      username,
      email_verified,
      email_verified_at
    )
    VALUES (
      auth_user.id,
      public.generate_profile_username(auth_user.email, auth_user.id),
      auth_user.email_confirmed_at IS NOT NULL,
      auth_user.email_confirmed_at
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      email_verified = EXCLUDED.email_verified,
      email_verified_at = EXCLUDED.email_verified_at,
      updated_at = NOW();
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_email_verified()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND email_verified = TRUE
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_email_verified() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_current_user_email_verified() FROM anon, public;

CREATE OR REPLACE FUNCTION public.get_profile_username(profile_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT username
  FROM public.profiles
  WHERE user_id = profile_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_username(UUID) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_profile_username(UUID) FROM public;

DROP POLICY IF EXISTS "Anyone can view usernames" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can create their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
DROP POLICY IF EXISTS "Users can create their own files" ON public.files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;

CREATE POLICY "Users can view their own folders" ON public.folders
  FOR SELECT USING (
    auth.uid() = user_id
    AND public.is_current_user_email_verified()
  );

CREATE POLICY "Users can create their own folders" ON public.folders
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.is_current_user_email_verified()
  );

CREATE POLICY "Users can update their own folders" ON public.folders
  FOR UPDATE USING (
    auth.uid() = user_id
    AND public.is_current_user_email_verified()
  );

CREATE POLICY "Users can delete their own folders" ON public.folders
  FOR DELETE USING (
    auth.uid() = user_id
    AND public.is_current_user_email_verified()
  );

CREATE POLICY "Users can view their own files" ON public.files
  FOR SELECT USING (
    auth.uid() = user_id
    AND public.is_current_user_email_verified()
  );

CREATE POLICY "Users can create their own files" ON public.files
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.is_current_user_email_verified()
  );

CREATE POLICY "Users can update their own files" ON public.files
  FOR UPDATE USING (
    auth.uid() = user_id
    AND public.is_current_user_email_verified()
  );

CREATE POLICY "Users can delete their own files" ON public.files
  FOR DELETE USING (
    auth.uid() = user_id
    AND public.is_current_user_email_verified()
  );
