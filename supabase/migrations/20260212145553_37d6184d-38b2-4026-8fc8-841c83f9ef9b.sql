
-- Leaderboard table for global ranking
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL CHECK (char_length(nickname) >= 3 AND char_length(nickname) <= 12),
  score INTEGER NOT NULL CHECK (score > 0),
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Anyone can read the leaderboard
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard
  FOR SELECT
  USING (true);

-- Anyone can insert scores (no auth required for casual game)
CREATE POLICY "Anyone can submit scores"
  ON public.leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Index for fast ranking queries
CREATE INDEX idx_leaderboard_score ON public.leaderboard (score DESC, created_at ASC);
