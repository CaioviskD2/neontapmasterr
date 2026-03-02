import React, { useEffect, useState } from 'react';
import { fetchPlayerProfile } from '@/lib/player';
import { getNickname } from '@/lib/player';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { linkGoogleAccount } from '@/lib/player';
import { getHighScore } from '@/lib/storage';
import { getDifficulty } from '@/lib/difficulty';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import { t } from '@/i18n';
import { getStreakData } from '@/lib/streaks';
import { BADGES, getUnlockedBadges } from '@/lib/badges';

interface Props {
  onBack: () => void;
}

const ProfileScreen: React.FC<Props> = ({ onBack }) => {
  const nickname = getNickname();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [tab, setTab] = useState<'stats' | 'badges'>('stats');
  const highScore = getHighScore(getDifficulty());
  const streak = getStreakData();
  const unlockedBadges = getUnlockedBadges();

  useEffect(() => {
    const load = async () => {
      if (nickname) {
        const data = await fetchPlayerProfile(nickname);
        setProfile(data);
        setIsLinked(!!data?.user_id);
      }
      setLoading(false);
    };
    load();
  }, [nickname]);

  const handleLinkGoogle = async () => {
    setLinking(true);
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (error) {
      if (import.meta.env.DEV) console.error('Google sign-in error:', error);
      setLinking(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await linkGoogleAccount(session.user.id);
      setIsLinked(true);
    }
    setLinking(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] grid-bg">
        <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] grid-bg animate-float-in">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={onBack} className="p-2 rounded-full border border-border hover:border-neon-blue transition-colors">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-neon-green" />
          <h1 className="font-arcade text-xs neon-text-green">{t('profile_title')}</h1>
        </div>
      </div>

      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        <div className="text-center mb-4">
          <p className="font-arcade text-[8px] text-muted-foreground mb-1">{t('profile_player')}</p>
          <p className="font-arcade text-lg neon-text-green">{nickname || t('profile_no_name')}</p>
        </div>

        {/* Streak */}
        <div className="flex items-center justify-center gap-6 mb-5">
          <div className="text-center">
            <p className="font-arcade text-[7px] text-muted-foreground mb-1">{t('streak_current')}</p>
            <p className="font-arcade text-lg neon-text-gold">🔥 {streak.current}</p>
          </div>
          <div className="text-center">
            <p className="font-arcade text-[7px] text-muted-foreground mb-1">{t('streak_best')}</p>
            <p className="font-arcade text-sm neon-text-blue">{streak.best} {t('streak_days')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('stats')}
            className={`flex-1 py-2 rounded-lg font-arcade text-[8px] border transition-all ${
              tab === 'stats' ? 'border-neon-blue bg-neon-blue/10 neon-text-blue' : 'border-border/40 text-muted-foreground'
            }`}
          >
            {t('profile_title')}
          </button>
          <button
            onClick={() => setTab('badges')}
            className={`flex-1 py-2 rounded-lg font-arcade text-[8px] border transition-all ${
              tab === 'badges' ? 'border-neon-blue bg-neon-blue/10 neon-text-blue' : 'border-border/40 text-muted-foreground'
            }`}
          >
            {t('badges_title')} ({unlockedBadges.length}/{BADGES.length})
          </button>
        </div>

        {tab === 'stats' && (
          <>
            <div className="text-center mb-5">
              <p className="font-arcade text-[8px] text-muted-foreground mb-1">{t('profile_local_high')}</p>
              <p className="font-arcade text-lg neon-text-blue">{highScore}</p>
            </div>

            {profile && (
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
                  <p className="font-arcade text-[7px] text-muted-foreground mb-1">{t('profile_best_monthly')}</p>
                  <p className="font-arcade text-sm neon-text-gold">
                    {profile.best_monthly_rank ? `#${profile.best_monthly_rank}` : '—'}
                  </p>
                </div>
                <div className="px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
                  <p className="font-arcade text-[7px] text-muted-foreground mb-1">{t('profile_best_alltime')}</p>
                  <p className="font-arcade text-sm neon-text-blue">
                    {profile.best_alltime_rank ? `#${profile.best_alltime_rank}` : '—'}
                  </p>
                </div>
              </div>
            )}

            {profile && (
              <div className="mb-5 px-4 py-4 rounded-lg bg-secondary/50 border border-border/50">
                <p className="font-arcade text-[8px] text-muted-foreground mb-3 text-center">{t('profile_medals')}</p>
                <div className="flex items-center justify-center gap-5">
                  <div className="text-center">
                    <span className="text-2xl">🥇</span>
                    <p className="font-arcade text-[10px] neon-text-gold mt-1">{profile.gold_count}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl">🥈</span>
                    <p className="font-arcade text-[10px] neon-text-silver mt-1">{profile.silver_count}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl">🥉</span>
                    <p className="font-arcade text-[10px] neon-text-bronze mt-1">{profile.bronze_count}</p>
                  </div>
                </div>
                {(profile.monthly_champion_count > 0 || profile.top10_entry_count > 0) && (
                  <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/30">
                    {profile.monthly_champion_count > 0 && (
                      <span className="font-arcade text-[7px] neon-text-gold">
                        👑 {t('profile_champion')} ×{profile.monthly_champion_count}
                      </span>
                    )}
                    {profile.top10_entry_count > 0 && (
                      <span className="font-arcade text-[7px] neon-text-green">
                        ⭐ {t('profile_top10')} ×{profile.top10_entry_count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isLinked && (
              <button
                onClick={handleLinkGoogle}
                disabled={linking}
                className="w-full py-3 rounded-lg font-arcade text-[9px] border border-neon-blue text-neon-blue hover:bg-neon-blue/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {linking ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {linking ? t('profile_linking') : t('profile_link_google')}
              </button>
            )}
            {isLinked && (
              <p className="font-arcade text-[8px] neon-text-green text-center">{t('profile_linked')}</p>
            )}
          </>
        )}

        {tab === 'badges' && (
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map(badge => {
              const isUnlocked = unlockedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`px-3 py-4 rounded-lg border text-center transition-all ${
                    isUnlocked
                      ? 'bg-secondary/50 border-neon-green/30'
                      : 'bg-secondary/20 border-border/30 opacity-50'
                  }`}
                >
                  <span className="text-2xl">{isUnlocked ? badge.icon : '🔒'}</span>
                  <p className={`font-arcade text-[7px] mt-2 ${isUnlocked ? 'neon-text-green' : 'text-muted-foreground'}`}>
                    {t(badge.nameKey as any)}
                  </p>
                  <p className="font-orbitron text-[9px] text-muted-foreground mt-1">
                    {t(badge.descKey as any)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileScreen;
