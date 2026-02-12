import React, { useEffect, useState } from 'react';
import { fetchGlobalLeaderboard, getPlayerRank, type LeaderboardEntry } from '@/lib/leaderboard';
import { getHighScore } from '@/lib/storage';
import { ArrowLeft, Globe, Loader2 } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const LeaderboardScreen: React.FC<Props> = ({ onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const highScore = getHighScore();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchGlobalLeaderboard();
      setEntries(data);

      if (highScore > 0) {
        const rank = await getPlayerRank(highScore);
        if (rank > 100) setPlayerRank(rank);
      }
      setLoading(false);
    };
    load();
  }, [highScore]);

  const getRankStyle = (i: number) => {
    if (i === 0) return 'neon-text-gold';
    if (i === 1) return 'neon-text-silver';
    if (i === 2) return 'neon-text-bronze';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex flex-col min-h-[100dvh] grid-bg animate-float-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={onBack} className="p-2 rounded-full border border-border hover:border-neon-blue transition-colors">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-neon-blue" />
          <h1 className="font-arcade text-xs neon-text-blue">GLOBAL LEADERBOARD</h1>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-[50vh]">
            <p className="font-arcade text-[10px] text-muted-foreground text-center">
              NO SCORES YET<br />PLAY TO BE #1!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <div
                  key={entry.id || `${entry.nickname}-${i}`}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-secondary/50 border border-border/50"
                  style={{
                    borderColor: i === 0 ? 'hsl(45 100% 55% / 0.3)' : i === 1 ? 'hsl(0 0% 75% / 0.3)' : i === 2 ? 'hsl(30 70% 50% / 0.3)' : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-arcade text-[10px] w-8 ${getRankStyle(i)}`}>
                      #{i + 1}
                    </span>
                    <span className="font-orbitron text-sm text-foreground truncate max-w-[140px]">
                      {entry.nickname}
                    </span>
                  </div>
                  <span className={`font-arcade text-xs ${getRankStyle(i)}`}>
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>

            {/* Player rank if outside top 100 */}
            {playerRank && playerRank > 100 && (
              <div className="mt-6 px-4 py-3 rounded-lg border border-neon-blue/30 bg-secondary/30">
                <p className="font-arcade text-[8px] text-muted-foreground mb-1">YOUR RANK</p>
                <div className="flex items-center justify-between">
                  <span className="font-arcade text-xs neon-text-blue">#{playerRank}</span>
                  <span className="font-arcade text-xs text-foreground">{highScore} pts</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LeaderboardScreen;
