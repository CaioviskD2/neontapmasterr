import React from 'react';
import { getHighScore } from '@/lib/storage';
import { getDifficulty } from '@/lib/difficulty';
import { markUserInteracted, playHomeMusic } from '@/lib/music';
import { getMedals, getTotalMedals } from '@/lib/medals';
import { Settings } from 'lucide-react';
import { t } from '@/i18n';
import AdBanner from './AdBanner';

interface Props {
  onPlay: () => void;
  onLeaderboard: () => void;
  onProfile: () => void;
  onChallenges: () => void;
  onSettings: () => void;
}

const HomeScreen: React.FC<Props> = ({ onPlay, onLeaderboard, onProfile, onChallenges, onSettings }) => {
  const highScore = getHighScore(getDifficulty());
  const medals = getMedals();
  const hasMedals = getTotalMedals(medals) > 0 || medals.monthlyChampionCount > 0 || medals.top10EntryCount > 0;

  React.useEffect(() => {
    markUserInteracted();
    playHomeMusic();
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] px-6 grid-bg animate-float-in overflow-hidden">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center animate-slow-zoom"
        style={{
          backgroundImage: `url(/images/bg_home_tech.jpeg)`,
          filter: 'blur(5px)',
          transform: 'scale(1.1)',
        }}
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full">
        {/* Settings gear icon */}
        <button
          onPointerDown={onSettings}
          className="absolute top-4 right-4 p-3 rounded-full border border-border hover:border-neon-blue transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-neon-blue" />
        </button>

        {/* Title */}
        <h1 className="text-center">
          <span className="block font-arcade text-2xl sm:text-3xl md:text-4xl neon-text-green leading-relaxed mb-2">
            {t('home_title_1')}
          </span>
          <span className="block font-arcade text-3xl sm:text-4xl md:text-5xl neon-text-red leading-relaxed mb-10">
            {t('home_title_2')}
          </span>
        </h1>

        {/* High Score */}
        {highScore > 0 && (
          <div className="mb-6 text-center animate-slide-down">
            <p className="font-arcade text-[10px] text-muted-foreground mb-1">{t('home_high_score')}</p>
            <p className="font-arcade text-lg neon-text-blue">{highScore}</p>
          </div>
        )}

        {/* Your Medals */}
        {hasMedals && (
          <div className="mb-8 w-full max-w-[280px] px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 animate-slide-down">
            <p className="font-arcade text-[8px] text-muted-foreground mb-2 text-center">{t('home_your_medals')}</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {medals.goldCount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xl">🥇</span>
                  <span className="font-arcade text-[10px] neon-text-gold">×{medals.goldCount}</span>
                </div>
              )}
              {medals.silverCount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xl">🥈</span>
                  <span className="font-arcade text-[10px] neon-text-silver">×{medals.silverCount}</span>
                </div>
              )}
              {medals.bronzeCount > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xl">🥉</span>
                  <span className="font-arcade text-[10px] neon-text-bronze">×{medals.bronzeCount}</span>
                </div>
              )}
            </div>
            {(medals.monthlyChampionCount > 0 || medals.top10EntryCount > 0) && (
              <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-border/30">
                {medals.monthlyChampionCount > 0 && (
                  <span className="font-arcade text-[7px] neon-text-gold">
                    👑 {t('home_champion')} ×{medals.monthlyChampionCount}
                  </span>
                )}
                {medals.top10EntryCount > 0 && (
                  <span className="font-arcade text-[7px] neon-text-green">
                    ⭐ {t('home_top10')} ×{medals.top10EntryCount}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <button
          onPointerDown={onPlay}
          className="w-full max-w-[280px] py-4 px-8 rounded-lg font-arcade text-sm bg-neon-green text-background neon-glow-green hover:scale-105 active:scale-95 transition-transform mb-4"
        >
          {t('home_play')}
        </button>

        <button
          onPointerDown={onLeaderboard}
          className="w-full max-w-[280px] py-3 px-8 rounded-lg font-arcade text-[10px] border-2 border-neon-blue text-neon-blue hover:bg-neon-blue/10 active:scale-95 transition-all mb-3"
        >
          {t('home_leaderboard')}
        </button>

        <button
          onPointerDown={onChallenges}
          className="w-full max-w-[280px] py-3 px-8 rounded-lg font-arcade text-[10px] border-2 border-neon-gold text-neon-gold hover:bg-neon-gold/10 active:scale-95 transition-all mb-3"
        >
          {t('home_challenges')}
        </button>

        <button
          onPointerDown={onProfile}
          className="w-full max-w-[280px] py-3 px-8 rounded-lg font-arcade text-[10px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 active:scale-95 transition-all"
        >
          {t('home_profile')}
        </button>

        {/* Banner ad */}
        <div className="mt-6 w-full max-w-[320px]">
          <AdBanner />
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
