import React, { useState, useCallback } from 'react';
import SplashScreen from '@/components/game/SplashScreen';
import IntroScreen from '@/components/game/IntroScreen';
import HomeScreen from '@/components/game/HomeScreen';
import GameScreen from '@/components/game/GameScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import LeaderboardScreen from '@/components/game/LeaderboardScreen';
import ProfileScreen from '@/components/game/ProfileScreen';

type AppPhase = 'splash' | 'intro' | 'main';
type Screen = 'home' | 'game' | 'gameover' | 'leaderboard' | 'profile';

const Index = () => {
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [screen, setScreen] = useState<Screen>('home');
  const [lastScore, setLastScore] = useState(0);
  const [continueScore, setContinueScore] = useState<number | null>(null);

  const handleSplashComplete = useCallback(() => setPhase('intro'), []);
  const handleIntroStart = useCallback(() => setPhase('main'), []);

  const handleGameOver = (score: number) => {
    setLastScore(score);
    setScreen('gameover');
  };

  const handleContinue = () => {
    // Revive: go back to game with the current score as starting point
    setContinueScore(lastScore);
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
          onPlay={() => setScreen('game')}
          onLeaderboard={() => setScreen('leaderboard')}
          onProfile={() => setScreen('profile')}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          onGameOver={handleGameOver}
          initialScore={continueScore ?? undefined}
          key={continueScore !== null ? `continue-${continueScore}` : 'new'}
        />
      )}
      {screen === 'gameover' && (
        <GameOverScreen
          score={lastScore}
          onPlayAgain={() => { setContinueScore(null); setScreen('game'); }}
          onHome={() => setScreen('home')}
          onLeaderboard={() => setScreen('leaderboard')}
          onContinue={handleContinue}
        />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen onBack={() => setScreen('home')} onPlay={() => setScreen('game')} />
      )}
      {screen === 'profile' && (
        <ProfileScreen onBack={() => setScreen('home')} />
      )}
    </div>
  );
};

export default Index;
