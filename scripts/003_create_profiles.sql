CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view usernames" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Anyone can view usernames" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.generate_profile_username(email_text TEXT, source_user_id UUID)
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
    candidate := base_username || '_' || substring(replace(source_user_id::TEXT, '-', '') FROM 1 FOR 6);
  END IF;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (
    NEW.id,
    public.generate_profile_username(NEW.email, NEW.id)
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();

INSERT INTO public.profiles (user_id, username)
SELECT
  users.id,
  public.generate_profile_username(users.email, users.id)
FROM auth.users AS users
LEFT JOIN public.profiles AS profiles
  ON profiles.user_id = users.id
WHERE profiles.user_id IS NULL;
