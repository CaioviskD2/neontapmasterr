import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Play } from 'lucide-react';
import {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  getChallengesByCategory,
  isChallengeCompleted,
  markChallengeCompleted,
  getChallengeTitle,
  getChallengeDesc,
  getMilestoneProgress,
  getQuickChallenges,
  type ChallengeDefinition,
  type ChallengeCategory,
} from '@/lib/challenges';
import { trackEvent } from '@/lib/analytics';
import { t, getLanguage } from '@/i18n';
import GameScreen, { type GameConfig } from './GameScreen';

interface Props {
  onBack: () => void;
}

const ChallengesScreen: React.FC<Props> = ({ onBack }) => {
  const [activeChallenge, setActiveChallenge] = useState<ChallengeDefinition | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [completedScore, setCompletedScore] = useState(0);
  const [, forceUpdate] = useState(0);
  const lang = getLanguage();

  const startChallenge = (c: ChallengeDefinition) => {
    if (c.type !== 'quick') return;
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
    <div className="flex flex-col h-[100dvh] grid-bg animate-float-in overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border/30">
        <button
          onClick={onBack}
          aria-label="Back"
          className="p-2 rounded-full border border-border hover:border-neon-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="font-arcade text-xs neon-text-blue">{t('ch_title')}</h1>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-6 overflow-y-auto overscroll-contain">
        {CATEGORY_ORDER.map((category) => {
          const challenges = getChallengesByCategory(category);
          if (challenges.length === 0) return null;
          const catInfo = CATEGORY_LABELS[category];
          const catLabel = lang === 'pt' ? catInfo.pt : catInfo.en;

          return (
            <div key={category} className="mt-5">
              {/* Category header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">{catInfo.icon}</span>
                <span className="font-arcade text-[9px] text-muted-foreground">{catLabel}</span>
                <div className="flex-1 h-px bg-border/30" />
              </div>

              <div className="space-y-2">
                {challenges.map((c) => {
                  const completed = isChallengeCompleted(c.id);
                  const isQuick = c.type === 'quick';
                  const progress = getMilestoneProgress(c);

                  return (
                    <button
                      key={c.id}
                      onClick={() => isQuick ? startChallenge(c) : undefined}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                        isQuick ? 'active:scale-[0.98]' : ''
                      } ${
                        completed
                          ? 'bg-neon-green/5 border-neon-green/30'
                          : 'bg-secondary/50 border-border/50 hover:border-neon-blue/40'
                      }`}
                      style={{ cursor: isQuick ? 'pointer' : 'default' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.icon}</span>
                          <span className="font-arcade text-[9px] text-foreground">{getChallengeTitle(c)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isQuick && !completed && (
                            <span className="flex items-center gap-1 font-arcade text-[7px] text-neon-blue">
                              <Play className="w-3 h-3" />
                              {t('ch_quick_label')}
                            </span>
                          )}
                          {!isQuick && !completed && (
                            <span className="font-arcade text-[7px] text-muted-foreground">
                              {t('ch_milestone_label')}
                            </span>
                          )}
                          {completed && <CheckCircle className="w-4 h-4 text-neon-green" />}
                        </div>
                      </div>
                      <p className="font-orbitron text-[10px] text-muted-foreground ml-7">{getChallengeDesc(c)}</p>

                      {/* Progress bar for milestones */}
                      {!completed && progress && (
                        <div className="ml-7 mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full bg-neon-blue transition-all"
                                style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }}
                              />
                            </div>
                            <span className="font-arcade text-[7px] text-muted-foreground">
                              {progress.current}/{progress.target}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Skin reward indicator */}
                      {c.unlocksSkin && !completed && (
                        <p className="font-arcade text-[7px] text-neon-gold mt-1.5 ml-7">🎨 {t('ch_skin_unlocked')}</p>
                      )}

                      {completed && (
                        <p className="font-arcade text-[7px] neon-text-green mt-1 ml-7">{t('ch_completed')}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChallengesScreen;
