
-- Add difficulty column to leaderboard
ALTER TABLE public.leaderboard ADD COLUMN difficulty text NOT NULL DEFAULT 'normal';

-- Add difficulty column to season_scores
ALTER TABLE public.season_scores ADD COLUMN difficulty text NOT NULL DEFAULT 'normal';

-- Add difficulty column to season_results
ALTER TABLE public.season_results ADD COLUMN difficulty text NOT NULL DEFAULT 'normal';

-- Update upsert_season_score to support difficulty
CREATE OR REPLACE FUNCTION public.upsert_season_score(p_season_id text, p_nickname text, p_score integer, p_difficulty text DEFAULT 'normal')
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_best integer;
  v_result jsonb;
  v_diff text;
BEGIN
  v_diff := COALESCE(p_difficulty, 'normal');

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
  WHERE season_id = p_season_id AND nickname = trim(p_nickname) AND difficulty = v_diff;

  IF v_current_best IS NULL THEN
    INSERT INTO public.season_scores (season_id, nickname, best_score, difficulty, updated_at)
    VALUES (p_season_id, trim(p_nickname), p_score, v_diff, now());
    v_result := jsonb_build_object('success', true, 'updated', true, 'best_score', p_score);
  ELSIF p_score > v_current_best THEN
    UPDATE public.season_scores
    SET best_score = p_score, updated_at = now()
    WHERE season_id = p_season_id AND nickname = trim(p_nickname) AND difficulty = v_diff;
    v_result := jsonb_build_object('success', true, 'updated', true, 'best_score', p_score);
  ELSE
    v_result := jsonb_build_object('success', true, 'updated', false, 'best_score', v_current_best);
  END IF;

  INSERT INTO public.players (nickname)
  VALUES (trim(p_nickname))
  ON CONFLICT (nickname) DO NOTHING;

  RETURN v_result;
END;
$function$;
