-- 1) Hide device/account identifiers via column-level privileges
REVOKE SELECT ON public.leaderboard FROM anon, authenticated;
GRANT SELECT (id, nickname, score, country, created_at, month, difficulty) ON public.leaderboard TO anon, authenticated;

REVOKE SELECT ON public.season_scores FROM anon, authenticated;
GRANT SELECT (id, season_id, nickname, best_score, updated_at, difficulty) ON public.season_scores TO anon, authenticated;

REVOKE SELECT ON public.players FROM anon, authenticated;
GRANT SELECT (nickname, gold_count, silver_count, bronze_count, monthly_champion_count, top10_entry_count, best_monthly_rank, best_alltime_rank, updated_at, settings) ON public.players TO anon, authenticated;

-- nicknames: no direct client reads needed (registration goes through RPC)
REVOKE ALL ON public.nicknames FROM anon, authenticated;
DROP POLICY IF EXISTS "Anyone can view nicknames" ON public.nicknames;
GRANT ALL ON public.nicknames TO service_role;
GRANT ALL ON public.leaderboard TO service_role;
GRANT ALL ON public.players TO service_role;
GRANT ALL ON public.season_scores TO service_role;

-- 2) SECURITY DEFINER function exposure
REVOKE EXECUTE ON FUNCTION public.cleanup_old_submissions() FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.upsert_season_score(text, text, integer);

REVOKE EXECUTE ON FUNCTION public.submit_leaderboard_score(text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_leaderboard_score(text, integer, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.upsert_season_score(text, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_season_score(text, text, integer, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.register_nickname(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_nickname(text, text) TO anon, authenticated;

-- account linking is only meaningful for signed-in users
REVOKE EXECUTE ON FUNCTION public.link_google_account(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_google_account(text, uuid) TO authenticated;

-- 3) Safe way to check if the current device is already linked, without exposing user_id
CREATE OR REPLACE FUNCTION public.is_device_linked(p_device_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.players WHERE device_id = p_device_id AND user_id IS NOT NULL);
$$;
REVOKE EXECUTE ON FUNCTION public.is_device_linked(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_device_linked(text) TO anon, authenticated;