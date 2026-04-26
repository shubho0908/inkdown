CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

CREATE OR REPLACE FUNCTION public.create_password_reset_token(
  p_user_id UUID,
  p_email TEXT,
  p_expires_in_minutes INTEGER DEFAULT 5
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := NOW() + (p_expires_in_minutes || ' minutes')::INTERVAL;
  
  INSERT INTO public.password_reset_tokens (user_id, token, email, expires_at)
  VALUES (p_user_id, v_token, p_email, v_expires_at);
  
  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_password_reset_token(
  p_token TEXT
)
RETURNS TABLE(
  valid BOOLEAN,
  user_id UUID,
  email TEXT,
  expired BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT * INTO v_record
  FROM public.password_reset_tokens
  WHERE token = p_token
    AND used_at IS NULL
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::BOOLEAN;
    RETURN;
  END IF;
  
  IF v_record.expires_at < NOW() THEN
    RETURN QUERY SELECT false, v_record.user_id, v_record.email, true::BOOLEAN;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, v_record.user_id, v_record.email, false::BOOLEAN;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_password_reset_token_used(
  p_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.password_reset_tokens
  SET used_at = NOW()
  WHERE token = p_token;
  
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.password_reset_tokens
  WHERE expires_at < NOW()
    OR (used_at IS NOT NULL AND used_at < NOW() - INTERVAL '1 hour');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT SELECT, INSERT ON public.password_reset_tokens TO anon;
GRANT SELECT, INSERT ON public.password_reset_tokens TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_password_reset_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_password_reset_token TO anon;
GRANT EXECUTE ON FUNCTION public.validate_password_reset_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_password_reset_token_used TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_reset_tokens TO authenticated;
