import React, { useEffect, useState, useCallback } from 'react';
import {
  fetchMonthlyLeaderboard,
  fetchAllTimeLeaderboard,
  fetchClosedSeasons,
  fetchSeasonResults,
  getPlayerRankMonthly,
  getPlayerRankAllTime,
  type LeaderboardEntry,
  type Season,
  type SeasonResult,
} from '@/lib/leaderboard';
import { getHighScore } from '@/lib/storage';
import { getMedalForRank, getMedalEmoji } from '@/lib/medals';
import { playChampionMusic } from '@/lib/music';
import { trackLeaderboardOpen } from '@/lib/analytics';
import { ArrowLeft, Globe, Loader2, Trophy, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdBanner from './AdBanner';

interface Props {
  onBack: () => void;
  onPlay?: () => void;
}

type Tab = 'monthly' | 'alltime' | 'halloffame';

const LeaderboardScreen: React.FC<Props> = ({ onBack, onPlay }) => {
  const [tab, setTab] = useState<Tab>('monthly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const highScore = getHighScore();

  // Hall of Fame state
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [seasonResults, setSeasonResults] = useState<SeasonResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const loadData = useCallback(async (activeTab: Tab) => {
    if (activeTab === 'halloffame') return;
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

  const loadSeasons = useCallback(async () => {
    setLoading(true);
    const data = await fetchClosedSeasons();
    setSeasons(data);
    setLoading(false);
  }, []);

  const loadSeasonDetail = useCallback(async (seasonId: string) => {
    setLoadingResults(true);
    setSelectedSeason(seasonId);
    const data = await fetchSeasonResults(seasonId);
    setSeasonResults(data);
    setLoadingResults(false);
  }, []);

  useEffect(() => {
    playChampionMusic();
    trackLeaderboardOpen(tab);
    if (tab === 'halloffame') {
      loadSeasons();
    } else {
      setSelectedSeason(null);
      loadData(tab);
    }

    if (tab !== 'halloffame') {
      const channel = supabase
        .channel('leaderboard-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: tab === 'monthly' ? 'season_scores' : 'leaderboard' },
          () => { loadData(tab); }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'season_scores' },
          () => { if (tab === 'monthly') loadData(tab); }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [tab, loadData, loadSeasons]);

  const isCurrentPlayerFirst = playerRank === 1 && tab === 'monthly';

  const getRankStyle = (i: number) => {
    if (i === 0) return 'neon-text-gold';
    if (i === 1) return 'neon-text-silver';
    if (i === 2) return 'neon-text-bronze';
    return 'text-muted-foreground';
  };

  const formatSeasonName = (id: string) => {
    const [year, month] = id.split('-');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="flex flex-col min-h-[100dvh] grid-bg animate-float-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={selectedSeason ? () => setSelectedSeason(null) : onBack}
          className="p-2 rounded-full border border-border hover:border-neon-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          {tab === 'halloffame' ? (
            <Trophy className="w-4 h-4 text-neon-gold" />
          ) : (
            <Globe className="w-4 h-4 text-neon-blue" />
          )}
          <h1 className="font-arcade text-xs neon-text-blue">
            {selectedSeason ? formatSeasonName(selectedSeason) : 'GLOBAL RANKING'}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      {!selectedSeason && (
        <div className="flex gap-1 px-4 pb-3">
          {(['monthly', 'alltime', 'halloffame'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg font-arcade text-[8px] border transition-all ${
                tab === t
                  ? t === 'halloffame'
                    ? 'border-neon-gold/60 neon-text-gold bg-secondary/80'
                    : t === 'monthly'
                    ? 'border-neon-gold/60 neon-text-gold bg-secondary/80'
                    : 'border-neon-blue/60 neon-text-blue bg-secondary/80'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
            >
              {t === 'monthly' ? 'MONTHLY' : t === 'alltime' ? 'ALL-TIME' : 'HALL OF FAME'}
            </button>
          ))}
        </div>
      )}

      {/* Defend Your Crown */}
      {isCurrentPlayerFirst && onPlay && !selectedSeason && (
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
          </div>
        ) : tab === 'halloffame' && !selectedSeason ? (
          // Hall of Fame: list of closed seasons
          seasons.length === 0 ? (
            <div className="flex items-center justify-center h-[50vh]">
              <p className="font-arcade text-[10px] text-muted-foreground text-center">
                NO COMPLETED SEASONS YET<br />FIRST SEASON CLOSES END OF MONTH
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {seasons.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadSeasonDetail(s.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 hover:border-neon-gold/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-neon-gold" />
                    <span className="font-arcade text-[10px] neon-text-gold">
                      {formatSeasonName(s.id)}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )
        ) : tab === 'halloffame' && selectedSeason ? (
          // Season detail
          loadingResults ? (
            <div className="flex items-center justify-center h-[50vh]">
              <Loader2 className="w-6 h-6 text-neon-gold animate-spin" />
            </div>
          ) : seasonResults.length === 0 ? (
            <div className="flex items-center justify-center h-[50vh]">
              <p className="font-arcade text-[10px] text-muted-foreground">NO RESULTS</p>
            </div>
          ) : (
            <div className="space-y-2">
              {seasonResults.slice(0, 10).map((r) => (
                <div
                  key={`${r.season_id}-${r.rank}`}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 ${r.rank === 1 ? 'animate-pulse-neon' : ''}`}
                  style={{
                    borderColor: r.rank === 1 ? 'hsl(45 100% 55% / 0.5)' : undefined,
                    boxShadow: r.rank === 1 ? '0 0 12px hsl(45 100% 55% / 0.3)' : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-arcade text-[10px] w-8 ${getRankStyle(r.rank - 1)}`}>
                      {r.rank === 1 ? '👑' : `#${r.rank}`}
                    </span>
                    <span
                      className={`font-orbitron text-sm truncate max-w-[120px] ${r.rank === 1 ? 'font-bold' : 'text-foreground'}`}
                      style={r.rank === 1 ? {
                        color: 'hsl(var(--neon-gold))',
                        textShadow: '0 0 10px hsl(var(--neon-gold) / 0.6)',
                      } : undefined}
                    >
                      {r.nickname}
                    </span>
                    {r.medal && (
                      <span className="text-sm">
                        {r.medal === 'gold' ? '🥇' : r.medal === 'silver' ? '🥈' : '🥉'}
                      </span>
                    )}
                  </div>
                  <span className={`font-arcade text-xs ${getRankStyle(r.rank - 1)}`}>
                    {r.score}
                  </span>
                </div>
              ))}
            </div>
          )
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
                      className={`font-orbitron text-sm truncate max-w-[120px] ${i === 0 ? 'font-bold' : 'text-foreground'}`}
                      style={i === 0 ? {
                        color: 'hsl(var(--neon-gold))',
                        textShadow: '0 0 10px hsl(var(--neon-gold) / 0.6), 0 0 25px hsl(var(--neon-gold) / 0.3)',
                      } : undefined}
                    >
                      {entry.nickname}
                    </span>
                    {tab === 'monthly' && getMedalForRank(i + 1) && (
                      <span className="text-sm">{getMedalEmoji(getMedalForRank(i + 1)!)}</span>
                    )}
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

      {/* Banner ad */}
      <AdBanner />
    </div>
  );
};

export default LeaderboardScreen;
