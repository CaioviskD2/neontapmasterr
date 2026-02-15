-- Add month column for monthly filtering
ALTER TABLE public.leaderboard
ADD COLUMN month text NOT NULL DEFAULT to_char(now(), 'YYYY-MM');

-- Index for efficient monthly queries
CREATE INDEX idx_leaderboard_month_score ON public.leaderboard (month, score DESC, created_at ASC);