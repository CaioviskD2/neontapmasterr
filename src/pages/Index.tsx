import React, { useState, useCallback } from 'react';
import SplashScreen from '@/components/game/SplashScreen';
import IntroScreen from '@/components/game/IntroScreen';
import HomeScreen from '@/components/game/HomeScreen';
import GameScreen from '@/components/game/GameScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import LeaderboardScreen from '@/components/game/LeaderboardScreen';
import ProfileScreen from '@/components/game/ProfileScreen';
import ChallengesScreen from '@/components/game/ChallengesScreen';

type AppPhase = 'splash' | 'intro' | 'main';
type Screen = 'home' | 'game' | 'gameover' | 'leaderboard' | 'profile' | 'challenges';

const Index = () => {
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [screen, setScreen] = useState<Screen>('home');
  const [lastScore, setLastScore] = useState(0);
  const [continueUsedThisRun, setContinueUsedThisRun] = useState(false);

  const handleSplashComplete = useCallback(() => setPhase('intro'), []);
  const handleIntroStart = useCallback(() => setPhase('main'), []);

  const handleGameOver = (score: number) => {
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
    setScreen('game');
  };

  if (phase === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (phase === 'intro') {
    return <IntroScreen onStart={handleIntroStart} />;
  }

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-background animate-fade-in">
      {screen === 'home' && (
        <HomeScreen
          onPlay={handleNewGame}
          onLeaderboard={() => setScreen('leaderboard')}
          onProfile={() => setScreen('profile')}
          onChallenges={() => setScreen('challenges')}
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
    </div>
  );
};

export default Index;
