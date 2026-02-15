import React, { useState, useCallback } from 'react';
import SplashScreen from '@/components/game/SplashScreen';
import IntroScreen from '@/components/game/IntroScreen';
import HomeScreen from '@/components/game/HomeScreen';
import GameScreen from '@/components/game/GameScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import LeaderboardScreen from '@/components/game/LeaderboardScreen';

type AppPhase = 'splash' | 'intro' | 'main';
type Screen = 'home' | 'game' | 'gameover' | 'leaderboard';

const Index = () => {
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [screen, setScreen] = useState<Screen>('home');
  const [lastScore, setLastScore] = useState(0);

  const handleSplashComplete = useCallback(() => setPhase('intro'), []);
  const handleIntroStart = useCallback(() => setPhase('main'), []);

  const handleGameOver = (score: number) => {
    setLastScore(score);
    setScreen('gameover');
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
        />
      )}
      {screen === 'game' && (
        <GameScreen onGameOver={handleGameOver} />
      )}
      {screen === 'gameover' && (
        <GameOverScreen
          score={lastScore}
          onPlayAgain={() => setScreen('game')}
          onHome={() => setScreen('home')}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen onBack={() => setScreen('home')} onPlay={() => setScreen('game')} />
      )}
    </div>
  );
};

export default Index;
