import React, { useState } from 'react';
import HomeScreen from '@/components/game/HomeScreen';
import GameScreen from '@/components/game/GameScreen';
import GameOverScreen from '@/components/game/GameOverScreen';
import LeaderboardScreen from '@/components/game/LeaderboardScreen';

type Screen = 'home' | 'game' | 'gameover' | 'leaderboard';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [lastScore, setLastScore] = useState(0);

  const handleGameOver = (score: number) => {
    setLastScore(score);
    setScreen('gameover');
  };

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-background">
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
        <LeaderboardScreen onBack={() => setScreen('home')} />
      )}
    </div>
  );
};

export default Index;
