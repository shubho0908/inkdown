-- Migration: Add secure email checking function
-- This provides a failsafe way to check if an email exists without exposing user data

-- Create a function that checks if an email exists in auth.users
-- This function is security definer and can only return a boolean
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_count INTEGER;
BEGIN
  -- Validate input
  IF email_to_check IS NULL OR email_to_check = '' THEN
    RETURN FALSE;
  END IF;

  -- Normalize email (lowercase and trim)
  email_to_check := LOWER(TRIM(email_to_check));

  -- Count matching emails (limit 1 for performance)
  SELECT COUNT(*)
  INTO email_count
  FROM auth.users
  WHERE email = email_to_check;

  RETURN email_count > 0;
END;
$$;

-- Grant execute permission to authenticated and anon users
-- This is safe because the function only returns a boolean
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;

-- Add a comment for documentation
COMMENT ON FUNCTION public.check_email_exists(TEXT) IS 
'Securely checks if an email exists in auth.users. Returns boolean only, no user data exposed.';
