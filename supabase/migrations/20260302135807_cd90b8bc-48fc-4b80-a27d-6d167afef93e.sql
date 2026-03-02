
-- Create a table to track score submission timestamps for rate limiting
CREATE TABLE public.score_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_score_submissions_nickname_time ON public.score_submissions (nickname, submitted_at DESC);

-- Enable RLS and block all direct access
ALTER TABLE public.score_submissions ENABLE ROW LEVEL SECURITY;

-- No public access at all
CREATE POLICY "Block all direct access" ON public.score_submissions FOR ALL USING (false);

-- Auto-cleanup: delete entries older than 10 minutes to keep table small
CREATE OR REPLACE FUNCTION public.cleanup_old_submissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.score_submissions WHERE submitted_at < now() - interval '10 minutes';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_submissions
AFTER INSERT ON public.score_submissions
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_submissions();

-- Update submit_leaderboard_score with rate limiting (max 10 per minute)
CREATE OR REPLACE FUNCTION public.submit_leaderboard_score(p_nickname text, p_score integer, p_difficulty text DEFAULT 'normal'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_clean text;
  v_diff text;
  v_month text;
  v_recent_count integer;
BEGIN
  v_clean := trim(p_nickname);
  v_diff := COALESCE(p_difficulty, 'normal');
  v_month := to_char(now(), 'YYYY-MM');

  IF p_score <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_score');
  END IF;

  IF length(v_clean) < 3 OR length(v_clean) > 12 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_nickname');
  END IF;

  IF v_clean !~ '^[A-Za-z0-9_]+$' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_chars');
  END IF;

  IF v_diff NOT IN ('easy', 'normal', 'hard', 'insane') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_difficulty');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.nicknames WHERE nickname = v_clean) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'nickname_not_registered');
  END IF;

  -- Rate limiting: max 10 submissions per minute per nickname
  SELECT COUNT(*) INTO v_recent_count
  FROM public.score_submissions
  WHERE nickname = v_clean AND submitted_at > now() - interval '1 minute';

  IF v_recent_count >= 10 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'rate_limit');
  END IF;

  -- Record submission for rate limiting
  INSERT INTO public.score_submissions (nickname) VALUES (v_clean);

  INSERT INTO public.leaderboard (nickname, score, month, difficulty)
  VALUES (v_clean, p_score, v_month, v_diff);

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Update upsert_season_score (4-param version) with rate limiting
CREATE OR REPLACE FUNCTION public.upsert_season_score(p_season_id text, p_nickname text, p_score integer, p_difficulty text DEFAULT 'normal'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_best integer;
  v_result jsonb;
  v_diff text;
  v_clean text;
  v_recent_count integer;
BEGIN
  v_diff := COALESCE(p_difficulty, 'normal');
  v_clean := trim(p_nickname);

  IF p_score <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_score');
  END IF;
  IF length(v_clean) < 3 OR length(v_clean) > 12 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_nickname');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.nicknames WHERE nickname = v_clean) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'nickname_not_registered');
  END IF;

  -- Rate limiting: max 10 submissions per minute per nickname
  SELECT COUNT(*) INTO v_recent_count
  FROM public.score_submissions
  WHERE nickname = v_clean AND submitted_at > now() - interval '1 minute';

  IF v_recent_count >= 10 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'rate_limit');
  END IF;

  INSERT INTO public.score_submissions (nickname) VALUES (v_clean);

  INSERT INTO public.seasons (id, status)
  VALUES (p_season_id, 'open')
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.seasons WHERE id = p_season_id AND status = 'closed') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'season_closed');
  END IF;

  SELECT best_score INTO v_current_best
  FROM public.season_scores
  WHERE season_id = p_season_id AND nickname = v_clean AND difficulty = v_diff;

  IF v_current_best IS NULL THEN
    INSERT INTO public.season_scores (season_id, nickname, best_score, difficulty, updated_at)
    VALUES (p_season_id, v_clean, p_score, v_diff, now());
    v_result := jsonb_build_object('success', true, 'updated', true, 'best_score', p_score);
  ELSIF p_score > v_current_best THEN
    UPDATE public.season_scores
    SET best_score = p_score, updated_at = now()
    WHERE season_id = p_season_id AND nickname = v_clean AND difficulty = v_diff;
    v_result := jsonb_build_object('success', true, 'updated', true, 'best_score', p_score);
  ELSE
    v_result := jsonb_build_object('success', true, 'updated', false, 'best_score', v_current_best);
  END IF;

  INSERT INTO public.players (nickname)
  VALUES (v_clean)
  ON CONFLICT (nickname) DO NOTHING;

  RETURN v_result;
END;
$function$;

-- Update 3-param overload too
CREATE OR REPLACE FUNCTION public.upsert_season_score(p_season_id text, p_nickname text, p_score integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_best integer;
  v_result jsonb;
  v_clean text;
  v_recent_count integer;
BEGIN
  v_clean := trim(p_nickname);

  IF p_score <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_score');
  END IF;
  IF length(v_clean) < 3 OR length(v_clean) > 12 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_nickname');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.nicknames WHERE nickname = v_clean) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'nickname_not_registered');
  END IF;

  -- Rate limiting
  SELECT COUNT(*) INTO v_recent_count
  FROM public.score_submissions
  WHERE nickname = v_clean AND submitted_at > now() - interval '1 minute';

  IF v_recent_count >= 10 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'rate_limit');
  END IF;

  INSERT INTO public.score_submissions (nickname) VALUES (v_clean);

  INSERT INTO public.seasons (id, status)
  VALUES (p_season_id, 'open')
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.seasons WHERE id = p_season_id AND status = 'closed') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'season_closed');
  END IF;

  SELECT best_score INTO v_current_best
  FROM public.season_scores
  WHERE season_id = p_season_id AND nickname = v_clean;

  IF v_current_best IS NULL THEN
    INSERT INTO public.season_scores (season_id, nickname, best_score, updated_at)
    VALUES (p_season_id, v_clean, p_score, now());
    v_result := jsonb_build_object('success', true, 'updated', true, 'best_score', p_score);
  ELSIF p_score > v_current_best THEN
    UPDATE public.season_scores
    SET best_score = p_score, updated_at = now()
    WHERE season_id = p_season_id AND nickname = v_clean;
    v_result := jsonb_build_object('success', true, 'updated', true, 'best_score', p_score);
  ELSE
    v_result := jsonb_build_object('success', true, 'updated', false, 'best_score', v_current_best);
  END IF;

  INSERT INTO public.players (nickname)
  VALUES (v_clean)
  ON CONFLICT (nickname) DO NOTHING;

  RETURN v_result;
END;
$function$;
