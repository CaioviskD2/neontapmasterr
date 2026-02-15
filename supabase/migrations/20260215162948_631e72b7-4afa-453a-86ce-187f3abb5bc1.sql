
-- Seasons table
CREATE TABLE public.seasons (
  id text PRIMARY KEY, -- YYYY-MM
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT USING (true);

-- Season scores: best score per nickname per season
CREATE TABLE public.season_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id text NOT NULL REFERENCES public.seasons(id),
  nickname text NOT NULL,
  best_score integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(season_id, nickname)
);
ALTER TABLE public.season_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view season scores" ON public.season_scores FOR SELECT USING (true);

-- Season results: frozen snapshot after close
CREATE TABLE public.season_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id text NOT NULL REFERENCES public.seasons(id),
  rank integer NOT NULL,
  nickname text NOT NULL,
  score integer NOT NULL,
  medal text
);
ALTER TABLE public.season_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view season results" ON public.season_results FOR SELECT USING (true);

-- Players: medal persistence
CREATE TABLE public.players (
  nickname text PRIMARY KEY,
  gold_count integer NOT NULL DEFAULT 0,
  silver_count integer NOT NULL DEFAULT 0,
  bronze_count integer NOT NULL DEFAULT 0,
  monthly_champion_count integer NOT NULL DEFAULT 0,
  top10_entry_count integer NOT NULL DEFAULT 0,
  best_monthly_rank integer,
  best_alltime_rank integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view players" ON public.players FOR SELECT USING (true);

-- Index for fast monthly leaderboard queries
CREATE INDEX idx_season_scores_leaderboard ON public.season_scores (season_id, best_score DESC, updated_at ASC);
CREATE INDEX idx_season_results_season ON public.season_results (season_id, rank ASC);

-- Function to upsert season score (only saves if better)
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
  -- Validate inputs
  IF p_score <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_score');
  END IF;
  IF length(trim(p_nickname)) < 3 OR length(trim(p_nickname)) > 12 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_nickname');
  END IF;

  -- Ensure season exists and is open
  INSERT INTO public.seasons (id, status)
  VALUES (p_season_id, 'open')
  ON CONFLICT (id) DO NOTHING;

  -- Check if season is open
  IF EXISTS (SELECT 1 FROM public.seasons WHERE id = p_season_id AND status = 'closed') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'season_closed');
  END IF;

  -- Get current best
  SELECT best_score INTO v_current_best
  FROM public.season_scores
  WHERE season_id = p_season_id AND nickname = trim(p_nickname);

  IF v_current_best IS NULL THEN
    -- First score this season
    INSERT INTO public.season_scores (season_id, nickname, best_score, updated_at)
    VALUES (p_season_id, trim(p_nickname), p_score, now());
    v_result := jsonb_build_object('success', true, 'updated', true, 'best_score', p_score);
  ELSIF p_score > v_current_best THEN
    -- Better score
    UPDATE public.season_scores
    SET best_score = p_score, updated_at = now()
    WHERE season_id = p_season_id AND nickname = trim(p_nickname);
    v_result := jsonb_build_object('success', true, 'updated', true, 'best_score', p_score);
  ELSE
    -- Not better
    v_result := jsonb_build_object('success', true, 'updated', false, 'best_score', v_current_best);
  END IF;

  -- Ensure player record exists
  INSERT INTO public.players (nickname)
  VALUES (trim(p_nickname))
  ON CONFLICT (nickname) DO NOTHING;

  RETURN v_result;
END;
$$;

-- Enable realtime for season_scores
ALTER PUBLICATION supabase_realtime ADD TABLE public.season_scores;
