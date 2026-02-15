import React, { useEffect, useState, useCallback } from 'react';
import { fetchMonthlyLeaderboard, fetchAllTimeLeaderboard, getPlayerRankMonthly, getPlayerRankAllTime, type LeaderboardEntry } from '@/lib/leaderboard';
import { getHighScore } from '@/lib/storage';
import { playChampionMusic } from '@/lib/music';
import { ArrowLeft, Globe, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onBack: () => void;
  onPlay?: () => void;
}

type Tab = 'monthly' | 'alltime';

const LeaderboardScreen: React.FC<Props> = ({ onBack, onPlay }) => {
  const [tab, setTab] = useState<Tab>('monthly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const highScore = getHighScore();

  const loadData = useCallback(async (activeTab: Tab) => {
    setLoading(true);
    const data = activeTab === 'monthly'
      ? await fetchMonthlyLeaderboard()
      : await fetchAllTimeLeaderboard();
    setEntries(data);

    if (highScore > 0) {
      const rank = activeTab === 'monthly'
        ? await getPlayerRankMonthly(highScore)
        : await getPlayerRankAllTime(highScore);
      setPlayerRank(rank);
    }
    setLoading(false);
  }, [highScore]);

  useEffect(() => {
    playChampionMusic();
    loadData(tab);

    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leaderboard' },
        () => { loadData(tab); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tab, loadData]);

  const isCurrentPlayerFirst = playerRank === 1 && tab === 'monthly';

  const getRankStyle = (i: number) => {
    if (i === 0) return 'neon-text-gold';
    if (i === 1) return 'neon-text-silver';
    if (i === 2) return 'neon-text-bronze';
    return 'text-muted-foreground';
  };

  const handleTabChange = (newTab: Tab) => {
    if (newTab !== tab) setTab(newTab);
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
          <h1 className="font-arcade text-xs neon-text-blue">GLOBAL RANKING</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pb-3">
        <button
          onClick={() => handleTabChange('monthly')}
          className={`flex-1 py-2 rounded-lg font-arcade text-[9px] border transition-all ${
            tab === 'monthly'
              ? 'border-neon-gold/60 neon-text-gold bg-secondary/80'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
          }`}
        >
          MONTHLY
        </button>
        <button
          onClick={() => handleTabChange('alltime')}
          className={`flex-1 py-2 rounded-lg font-arcade text-[9px] border transition-all ${
            tab === 'alltime'
              ? 'border-neon-blue/60 neon-text-blue bg-secondary/80'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
          }`}
        >
          ALL-TIME
        </button>
      </div>

      {/* Defend Your Crown */}
      {isCurrentPlayerFirst && onPlay && (
        <div className="px-4 pb-3 animate-slide-down">
          <button
            onClick={onPlay}
            className="w-full py-3 rounded-lg font-arcade text-[10px] border-2 animate-pulse-neon"
            style={{
              borderColor: 'hsl(var(--neon-gold))',
              color: 'hsl(var(--neon-gold))',
              boxShadow: '0 0 15px hsl(var(--neon-gold) / 0.4), 0 0 40px hsl(var(--neon-gold) / 0.2)',
            }}
          >
            👑 DEFEND YOUR CROWN 👑
          </button>
        </div>
      )}

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
                  className={`flex items-center justify-between px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 ${i === 0 ? 'animate-pulse-neon' : ''}`}
                  style={{
                    borderColor: i === 0 ? 'hsl(45 100% 55% / 0.5)' : i === 1 ? 'hsl(0 0% 75% / 0.3)' : i === 2 ? 'hsl(30 70% 50% / 0.3)' : undefined,
                    boxShadow: i === 0 ? '0 0 12px hsl(45 100% 55% / 0.3), 0 0 30px hsl(45 100% 55% / 0.1)' : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-arcade text-[10px] w-8 ${getRankStyle(i)}`}>
                      {i === 0 ? '👑' : `#${i + 1}`}
                    </span>
                    <span
                      className={`font-orbitron text-sm truncate max-w-[140px] ${i === 0 ? 'font-bold' : 'text-foreground'}`}
                      style={i === 0 ? {
                        color: 'hsl(var(--neon-gold))',
                        textShadow: '0 0 10px hsl(var(--neon-gold) / 0.6), 0 0 25px hsl(var(--neon-gold) / 0.3)',
                      } : undefined}
                    >
                      {entry.nickname}
                    </span>
                  </div>
                  <span className={`font-arcade text-xs ${getRankStyle(i)}`}>
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>

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
