
-- Fix link_google_account to verify auth.uid() matches p_user_id
CREATE OR REPLACE FUNCTION public.link_google_account(p_device_id text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify user_id matches authenticated user
  IF auth.uid() IS NULL OR p_user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthorized');
  END IF;

  UPDATE public.players
  SET user_id = p_user_id, updated_at = now()
  WHERE device_id = p_device_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'player_not_found');
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$;
