
-- Add device_id and user_id to players for identity
ALTER TABLE public.players
ADD COLUMN device_id text,
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN settings jsonb NOT NULL DEFAULT '{"soundOn": true}'::jsonb;

-- Index for device_id lookups
CREATE UNIQUE INDEX idx_players_device_id ON public.players (device_id) WHERE device_id IS NOT NULL;
CREATE INDEX idx_players_user_id ON public.players (user_id) WHERE user_id IS NOT NULL;

-- Nicknames uniqueness table
CREATE TABLE public.nicknames (
  nickname text PRIMARY KEY,
  device_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.nicknames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view nicknames" ON public.nicknames FOR SELECT USING (true);

-- Function to register nickname (atomic check + create)
CREATE OR REPLACE FUNCTION public.register_nickname(
  p_nickname text,
  p_device_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_device text;
  v_clean text;
BEGIN
  v_clean := trim(p_nickname);
  
  -- Validate
  IF length(v_clean) < 3 OR length(v_clean) > 12 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_length');
  END IF;
  
  IF v_clean !~ '^[A-Za-z0-9_]+$' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_chars');
  END IF;

  -- Check if nickname taken
  SELECT device_id INTO v_existing_device FROM public.nicknames WHERE nickname = v_clean;
  
  IF v_existing_device IS NOT NULL THEN
    IF v_existing_device = p_device_id THEN
      -- Same device, already owns it
      RETURN jsonb_build_object('success', true, 'already_owned', true);
    ELSE
      RETURN jsonb_build_object('success', false, 'reason', 'nickname_taken');
    END IF;
  END IF;

  -- Register nickname
  INSERT INTO public.nicknames (nickname, device_id) VALUES (v_clean, p_device_id);
  
  -- Create/update player
  INSERT INTO public.players (nickname, device_id)
  VALUES (v_clean, p_device_id)
  ON CONFLICT (nickname) DO UPDATE SET device_id = p_device_id;

  RETURN jsonb_build_object('success', true, 'already_owned', false);
END;
$$;

-- Function to link Google account to device player
CREATE OR REPLACE FUNCTION public.link_google_account(
  p_device_id text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.players
  SET user_id = p_user_id, updated_at = now()
  WHERE device_id = p_device_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'player_not_found');
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Add device_id to season_scores and leaderboard for tracking
ALTER TABLE public.season_scores ADD COLUMN device_id text;
ALTER TABLE public.leaderboard ADD COLUMN device_id text;

-- Update upsert function to include device_id
CREATE OR REPLACE FUNCTION public.upsert_season_score(
  p_season_id text,
  p_nickname text,
  p_score integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_best integer;
  v_result jsonb;
BEGIN
  IF p_score <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_score');
  END IF;
  IF length(trim(p_nickname)) < 3 OR length(trim(p_nickname)) > 12 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_nickname');
  END IF;

  INSERT INTO public.seasons (id, status)
  VALUES (p_season_id, 'open')
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.seasons WHERE id = p_season_id AND status = 'closed') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'season_closed');
  END IF;

  SELECT best_score INTO v_current_best
  FROM public.season_scores
  WHERE season_id = p_season_id AND nickname = trim(p_nickname);

  IF v_current_best IS NULL THEN
    INSERT INTO public.season_scores (season_id, nickname, best_score, updated_at)
    VALUES (p_season_id, trim(p_nickname), p_score, now());
    v_result := jsonb_build_object('success', true, 'updated', true, 'best_score', p_score);
  ELSIF p_score > v_current_best THEN
    UPDATE public.season_scores
    SET best_score = p_score, updated_at = now()
    WHERE season_id = p_season_id AND nickname = trim(p_nickname);
    v_result := jsonb_build_object('success', true, 'updated', true, 'best_score', p_score);
  ELSE
    v_result := jsonb_build_object('success', true, 'updated', false, 'best_score', v_current_best);
  END IF;

  INSERT INTO public.players (nickname)
  VALUES (trim(p_nickname))
  ON CONFLICT (nickname) DO NOTHING;

  RETURN v_result;
END;
$$;
