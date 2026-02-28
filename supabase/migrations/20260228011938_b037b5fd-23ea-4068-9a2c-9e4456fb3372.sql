
-- Fix upsert_season_score: add nickname registration check (both overloads)

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
BEGIN
  v_diff := COALESCE(p_difficulty, 'normal');
  v_clean := trim(p_nickname);

  IF p_score <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_score');
  END IF;
  IF length(v_clean) < 3 OR length(v_clean) > 12 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_nickname');
  END IF;

  -- Verify nickname is registered
  IF NOT EXISTS (SELECT 1 FROM public.nicknames WHERE nickname = v_clean) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'nickname_not_registered');
  END IF;

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

-- Also fix the 3-arg overload
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
BEGIN
  v_clean := trim(p_nickname);

  IF p_score <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_score');
  END IF;
  IF length(v_clean) < 3 OR length(v_clean) > 12 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_nickname');
  END IF;

  -- Verify nickname is registered
  IF NOT EXISTS (SELECT 1 FROM public.nicknames WHERE nickname = v_clean) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'nickname_not_registered');
  END IF;

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
