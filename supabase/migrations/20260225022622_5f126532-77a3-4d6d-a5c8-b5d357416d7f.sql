
-- Drop the old unique constraint that doesn't include difficulty
ALTER TABLE public.season_scores DROP CONSTRAINT IF EXISTS season_scores_season_id_nickname_key;

-- Create new unique constraint including difficulty
ALTER TABLE public.season_scores ADD CONSTRAINT season_scores_season_nickname_difficulty_key UNIQUE (season_id, nickname, difficulty);
