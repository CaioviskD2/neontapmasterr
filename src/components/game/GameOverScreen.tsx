import React, { useEffect, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { submitScore, getPlayerRank } from '@/lib/leaderboard';
import { playHighScoreSound, playTop10Sound, playWorldNumberOneSound } from '@/lib/sounds';
import { playHomeMusic, stopMusic } from '@/lib/music';
import { incrementGamesPlayed, showInterstitialAd } from '@/lib/ads';
import Top10Celebration from './Top10Celebration';
import WorldNumberOneCelebration from './WorldNumberOneCelebration';
import { Loader2 } from 'lucide-react';

interface Props {
  score: number;
  onPlayAgain: () => void;
  onHome: () => void;
  onLeaderboard: () => void;
}

const GameOverScreen: React.FC<Props> = ({ score, onPlayAgain, onHome, onLeaderboard }) => {
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [highScore, setHigh] = useState(0);
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [showTop10, setShowTop10] = useState(false);
  const [showWorldOne, setShowWorldOne] = useState(false);

  useEffect(() => {
    stopMusic();
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

    showInterstitialAd();
  }, [score]);

  const handleSave = async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 3 || trimmed.length > 12) return;
    
    setSaving(true);
    const success = await submitScore(trimmed, score);
    setSaving(false);
    
    if (success) {
      setSaved(true);
      const rank = await getPlayerRank(score);
      if (rank === 1) {
        // World #1 has priority over Top 10
        playWorldNumberOneSound();
        setShowWorldOne(true);
      } else if (rank > 0 && rank <= 10) {
        playTop10Sound();
        setShowTop10(true);
      }
    }
  };

  return (
    <>
    {showWorldOne && <WorldNumberOneCelebration onComplete={onLeaderboard} />}
    {showTop10 && !showWorldOne && <Top10Celebration onComplete={onLeaderboard} />}
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 grid-bg animate-float-in">
      <h1 className="font-arcade text-2xl sm:text-3xl neon-text-red animate-glitch mb-6">
        GAME OVER
      </h1>

      <div className="text-center mb-4">
        <p className="font-arcade text-[10px] text-muted-foreground mb-1">YOUR SCORE</p>
        <p className="font-arcade text-3xl neon-text-blue">{score}</p>
      </div>

      <div className="text-center mb-6">
        <p className="font-arcade text-[10px] text-muted-foreground mb-1">HIGH SCORE</p>
        <p className="font-arcade text-lg neon-text-gold">{highScore}</p>
      </div>

      {isNewHighScore && (
        <div className="mb-6 animate-pulse-neon">
          <p className="font-arcade text-xs neon-text-gold">★ NEW HIGH SCORE ★</p>
        </div>
      )}

      {showNickname && !saved && (
        <div className="w-full max-w-[280px] mb-6 animate-slide-down">
          <p className="font-arcade text-[8px] text-muted-foreground mb-2 text-center">ENTER NICKNAME FOR GLOBAL RANKING</p>
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
            disabled={nickname.trim().length < 3 || saving}
            className="w-full mt-2 py-2 rounded-lg font-arcade text-[10px] border border-neon-blue text-neon-blue hover:bg-neon-blue/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {saving ? 'SAVING...' : 'SAVE TO GLOBAL RANKING'}
          </button>
        </div>
      )}

      {saved && (
        <p className="font-arcade text-[8px] neon-text-green mb-6 animate-slide-down">✓ SCORE SAVED TO GLOBAL RANKING!</p>
      )}

      <button
        onClick={onPlayAgain}
        className="w-full max-w-[280px] py-4 px-8 rounded-lg font-arcade text-sm bg-neon-green text-background neon-glow-green hover:scale-105 active:scale-95 transition-transform mb-3"
      >
        PLAY AGAIN
      </button>

      <button
        onClick={onHome}
        className="w-full max-w-[280px] py-3 px-8 rounded-lg font-arcade text-[10px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 active:scale-95 transition-all"
      >
        HOME
      </button>
    </div>
    </>
  );
};

export default GameOverScreen;
