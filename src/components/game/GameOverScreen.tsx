import React, { useEffect, useState } from 'react';
import { getHighScore, setHighScore, addToLocalLeaderboard } from '@/lib/storage';
import { playHighScoreSound } from '@/lib/sounds';
import { incrementGamesPlayed, showInterstitialAd } from '@/lib/ads';

interface Props {
  score: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

const GameOverScreen: React.FC<Props> = ({ score, onPlayAgain, onHome }) => {
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [highScore, setHigh] = useState(0);
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);
  const [showNickname, setShowNickname] = useState(false);

  useEffect(() => {
    incrementGamesPlayed();
    const prev = getHighScore();
    setHigh(prev);

    if (score > prev) {
      setHighScore(score);
      setHigh(score);
      setIsNewHighScore(true);
      playHighScoreSound();
    }

    if (score > 0) {
      setShowNickname(true);
    }

    // Show interstitial ad placeholder
    showInterstitialAd();
  }, [score]);

  const handleSave = () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 3 || trimmed.length > 12) return;
    addToLocalLeaderboard({ nickname: trimmed, score, timestamp: Date.now() });
    setSaved(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 grid-bg animate-float-in">
      {/* Game Over Title */}
      <h1 className="font-arcade text-2xl sm:text-3xl neon-text-red animate-glitch mb-6">
        GAME OVER
      </h1>

      {/* Score */}
      <div className="text-center mb-4">
        <p className="font-arcade text-[10px] text-muted-foreground mb-1">YOUR SCORE</p>
        <p className="font-arcade text-3xl neon-text-blue">{score}</p>
      </div>

      {/* High Score */}
      <div className="text-center mb-6">
        <p className="font-arcade text-[10px] text-muted-foreground mb-1">HIGH SCORE</p>
        <p className="font-arcade text-lg neon-text-gold">{highScore}</p>
      </div>

      {/* New High Score */}
      {isNewHighScore && (
        <div className="mb-6 animate-pulse-neon">
          <p className="font-arcade text-xs neon-text-gold">★ NEW HIGH SCORE ★</p>
        </div>
      )}

      {/* Nickname input */}
      {showNickname && !saved && (
        <div className="w-full max-w-[280px] mb-6 animate-slide-down">
          <p className="font-arcade text-[8px] text-muted-foreground mb-2 text-center">ENTER NICKNAME (3-12 chars)</p>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value.slice(0, 12))}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground font-orbitron text-center text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
            placeholder="PLAYER"
            maxLength={12}
          />
          <button
            onClick={handleSave}
            disabled={nickname.trim().length < 3}
            className="w-full mt-2 py-2 rounded-lg font-arcade text-[10px] border border-neon-blue text-neon-blue hover:bg-neon-blue/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            SAVE SCORE
          </button>
        </div>
      )}

      {saved && (
        <p className="font-arcade text-[8px] neon-text-green mb-6 animate-slide-down">SCORE SAVED!</p>
      )}

      {/* Buttons */}
      <button
        onClick={onPlayAgain}
        className="w-full max-w-[280px] py-4 px-8 rounded-lg font-arcade text-sm bg-neon-green text-background neon-glow-green hover:scale-105 active:scale-95 transition-transform mb-3"
      >
        PLAY AGAIN
      </button>

      {/* Continue button - placeholder for rewarded ad */}
      {/* TODO: Integrate rewarded ad here */}
      {/* <button className="..." onClick={() => showRewardedAd()}>CONTINUE (AD)</button> */}

      <button
        onClick={onHome}
        className="w-full max-w-[280px] py-3 px-8 rounded-lg font-arcade text-[10px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 active:scale-95 transition-all"
      >
        HOME
      </button>
    </div>
  );
};

export default GameOverScreen;
