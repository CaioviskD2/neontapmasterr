
-- Create secure RPC for leaderboard score submission
CREATE OR REPLACE FUNCTION public.submit_leaderboard_score(
  p_nickname text,
  p_score integer,
  p_difficulty text DEFAULT 'normal'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_clean text;
  v_diff text;
  v_month text;
BEGIN
  v_clean := trim(p_nickname);
  v_diff := COALESCE(p_difficulty, 'normal');
  v_month := to_char(now(), 'YYYY-MM');

  -- Validate score
  IF p_score <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_score');
  END IF;

  -- Validate nickname length
  IF length(v_clean) < 3 OR length(v_clean) > 12 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_nickname');
  END IF;

  -- Validate nickname chars
  IF v_clean !~ '^[A-Za-z0-9_]+$' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_chars');
  END IF;

  -- Validate difficulty
  IF v_diff NOT IN ('easy', 'normal', 'hard', 'insane') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_difficulty');
  END IF;

  -- Verify nickname is registered
  IF NOT EXISTS (SELECT 1 FROM public.nicknames WHERE nickname = v_clean) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'nickname_not_registered');
  END IF;

  -- Insert into leaderboard
  INSERT INTO public.leaderboard (nickname, score, month, difficulty)
  VALUES (v_clean, p_score, v_month, v_diff);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Block direct inserts on leaderboard (force usage through RPC)
DROP POLICY IF EXISTS "Anyone can submit scores" ON public.leaderboard;
CREATE POLICY "Prevent direct inserts on leaderboard"
  ON public.leaderboard FOR INSERT
  WITH CHECK (false);
