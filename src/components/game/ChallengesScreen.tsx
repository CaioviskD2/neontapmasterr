import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Zap, Target, Trophy } from 'lucide-react';
import { CHALLENGES, isChallengeCompleted, markChallengeCompleted, getChallengeTitle, getChallengeDesc, type ChallengeDefinition } from '@/lib/challenges';
import { trackEvent } from '@/lib/analytics';
import { t } from '@/i18n';
import GameScreen, { type GameConfig } from './GameScreen';

interface Props {
  onBack: () => void;
}

const ICONS: Record<string, React.ReactNode> = {
  'beat_18_in_60s': <Target className="w-5 h-5 text-neon-blue" />,
  'speed_tap_20s': <Zap className="w-5 h-5 text-neon-gold" />,
  'perfect_12': <Trophy className="w-5 h-5 text-neon-green" />,
};

const ChallengesScreen: React.FC<Props> = ({ onBack }) => {
  const [activeChallenge, setActiveChallenge] = useState<ChallengeDefinition | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [completedScore, setCompletedScore] = useState(0);
  const [, forceUpdate] = useState(0);

  const startChallenge = (c: ChallengeDefinition) => {
    trackEvent('challenge_start', { id: c.id });
    setActiveChallenge(c);
    setShowComplete(false);
  };

  const handleChallengeComplete = (score: number) => {
    if (!activeChallenge) return;
    markChallengeCompleted(activeChallenge.id);
    trackEvent('challenge_complete', { id: activeChallenge.id, score });
    setCompletedScore(score);
    setShowComplete(true);
    setActiveChallenge(null);
    forceUpdate(n => n + 1);
  };

  const handleChallengeGameOver = (score: number) => {
    if (!activeChallenge) return;
    trackEvent('challenge_fail', { id: activeChallenge.id, score });
    setActiveChallenge(null);
  };

  if (activeChallenge) {
    const gameConfig: GameConfig = {
      totalTimeMs: activeChallenge.totalTimeMs || undefined,
      targetScore: activeChallenge.targetScore || undefined,
      disableContinue: activeChallenge.disableContinue,
      onChallengeComplete: handleChallengeComplete,
    };
    return (
      <GameScreen
        onGameOver={handleChallengeGameOver}
        config={gameConfig}
        key={`challenge-${activeChallenge.id}-${Date.now()}`}
      />
    );
  }

  if (showComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 grid-bg animate-float-in">
        <div className="text-6xl mb-6 animate-pulse-neon">🎉</div>
        <h1 className="font-arcade text-xl neon-text-green mb-4 text-center">
          {t('ch_complete')}
        </h1>
        <p className="font-arcade text-xs neon-text-blue mb-8">{t('ch_score')}: {completedScore}</p>
        <button
          onClick={() => setShowComplete(false)}
          className="w-full max-w-[280px] py-4 px-8 rounded-lg font-arcade text-sm bg-neon-green text-background neon-glow-green hover:scale-105 active:scale-95 transition-transform"
        >
          {t('ch_back')}
        </button>
      </div>
    );
  }

  trackEvent('challenge_open');

  return (
    <div className="flex flex-col min-h-[100dvh] grid-bg animate-float-in">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full border border-border hover:border-neon-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="font-arcade text-xs neon-text-blue">{t('ch_title')}</h1>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-3">
        {CHALLENGES.map((c) => {
          const completed = isChallengeCompleted(c.id);
          return (
            <button
              key={c.id}
              onClick={() => startChallenge(c)}
              className={`w-full text-left px-4 py-4 rounded-lg border transition-all active:scale-[0.98] ${
                completed
                  ? 'bg-neon-green/5 border-neon-green/30'
                  : 'bg-secondary/50 border-border/50 hover:border-neon-blue/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {ICONS[c.id]}
                  <span className="font-arcade text-[10px] text-foreground">{getChallengeTitle(c)}</span>
                </div>
                {completed && <CheckCircle className="w-4 h-4 text-neon-green" />}
              </div>
              <p className="font-orbitron text-xs text-muted-foreground">{getChallengeDesc(c)}</p>
              {completed && (
                <p className="font-arcade text-[7px] neon-text-green mt-2">{t('ch_completed')}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChallengesScreen;
