import React, { useState, useCallback, useEffect } from 'react';
import SplashScreen from '@/components/game/SplashScreen';
import IntroScreen from '@/components/game/IntroScreen';
import TutorialScreen from '@/components/game/TutorialScreen';
import HomeScreen from '@/components/game/HomeScreen';
import GameScreen from '@/components/game/GameScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import LeaderboardScreen from '@/components/game/LeaderboardScreen';
import ProfileScreen from '@/components/game/ProfileScreen';
import ChallengesScreen from '@/components/game/ChallengesScreen';
import SettingsScreen from '@/components/game/SettingsScreen';
import { getSettings, applyTheme } from '@/lib/settings';
import { isTutorialCompleted, markFirstGameStart, checkQuickDeath } from '@/lib/tutorial';

type AppPhase = 'splash' | 'intro' | 'tutorial' | 'main';
type Screen = 'home' | 'game' | 'gameover' | 'leaderboard' | 'profile' | 'challenges' | 'settings';

const Index = () => {
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [screen, setScreen] = useState<Screen>('home');
  const [lastScore, setLastScore] = useState(0);
  const [continueUsedThisRun, setContinueUsedThisRun] = useState(false);
  const [showQuickDeathHint, setShowQuickDeathHint] = useState(false);

  // Apply saved theme on mount
  useEffect(() => {
    const { selectedTheme } = getSettings();
    applyTheme(selectedTheme);
  }, []);

  const handleSplashComplete = useCallback(() => setPhase('intro'), []);

  const handleIntroStart = useCallback(() => {
    // Show tutorial only the first time
    setPhase(isTutorialCompleted() ? 'main' : 'tutorial');
  }, []);

  const handleGameOver = (score: number) => {
    // Check quick-death hint condition (first ever game, died in < 2s with 0 score)
    if (checkQuickDeath(score)) {
      setShowQuickDeathHint(true);
      setTimeout(() => setShowQuickDeathHint(false), 4000);
    }
    setLastScore(score);
    setScreen('gameover');
  };

  const handleContinue = () => {
    setContinueUsedThisRun(true);
    setScreen('game');
  };

  const handleNewGame = () => {
    setContinueUsedThisRun(false);
    setLastScore(0);
    markFirstGameStart(); // track for quick-death hint
    setScreen('game');
  };

  if (phase === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (phase === 'intro') {
    return <IntroScreen onStart={handleIntroStart} />;
  }

  if (phase === 'tutorial') {
    return <TutorialScreen onComplete={() => setPhase('main')} />;
  }

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-background animate-fade-in">
      {/* Quick-death contextual hint */}
      {showQuickDeathHint && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-secondary border border-neon-gold animate-slide-down pointer-events-none">
          <p className="font-arcade text-[8px] neon-text-gold text-center">
            Tap only green circles!
          </p>
        </div>
      )}
      {screen === 'home' && (
        <HomeScreen
          onPlay={handleNewGame}
          onLeaderboard={() => setScreen('leaderboard')}
          onProfile={() => setScreen('profile')}
          onChallenges={() => setScreen('challenges')}
          onSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          onGameOver={handleGameOver}
          initialScore={continueUsedThisRun ? lastScore : undefined}
          invulnerableStart={continueUsedThisRun}
          key={continueUsedThisRun ? `continue-${lastScore}` : `new-${Date.now()}`}
        />
      )}
      {screen === 'gameover' && (
        <GameOverScreen
          score={lastScore}
          onPlayAgain={handleNewGame}
          onHome={() => setScreen('home')}
          onLeaderboard={() => setScreen('leaderboard')}
          onContinue={continueUsedThisRun ? undefined : handleContinue}
        />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen onBack={() => setScreen('home')} onPlay={handleNewGame} />
      )}
      {screen === 'profile' && (
        <ProfileScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'challenges' && (
        <ChallengesScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'settings' && (
        <SettingsScreen onBack={() => setScreen('home')} />
      )}
    </div>
  );
};

export default Index;

