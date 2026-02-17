import React, { useEffect, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { submitScore, getPlayerRankMonthly, getPlayerRankAllTime } from '@/lib/leaderboard';
import { playHighScoreSound, playTop10Sound, playWorldNumberOneSound } from '@/lib/sounds';
import { stopMusic } from '@/lib/music';
import { incrementGamesPlayed, showInterstitialAd } from '@/lib/ads';
import { trackNewHighScore, trackRankSubmitted, trackEnteredTop10, trackBecameWorld1 } from '@/lib/analytics';
import { updateMedals, getMedalEmoji, type MedalUpdateResult } from '@/lib/medals';
import { getNickname, isValidNickname, registerNickname } from '@/lib/player';
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
  const [nickname, setNicknameInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [showTop10, setShowTop10] = useState(false);
  const [showWorldOne, setShowWorldOne] = useState(false);
  const [medalResult, setMedalResult] = useState<MedalUpdateResult | null>(null);
  const [nicknameError, setNicknameError] = useState('');

  const existingNickname = getNickname();

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
      trackNewHighScore(score);
    }

    if (score > 0) {
      if (existingNickname) {
        // Auto-save with existing nickname
        setNicknameInput(existingNickname);
        handleAutoSave(existingNickname);
      } else {
        setShowNickname(true);
      }
    }

    showInterstitialAd();
  }, [score]);

  const handleAutoSave = async (name: string) => {
    setSaving(true);
    const success = await submitScore(name, score);
    setSaving(false);

    if (success) {
      setSaved(true);
      await checkRankAndCelebrate(score);
    }
  };

  const checkRankAndCelebrate = async (playerScore: number) => {
    const [monthlyRank, allTimeRank] = await Promise.all([
      getPlayerRankMonthly(playerScore),
      getPlayerRankAllTime(playerScore),
    ]);

    if (monthlyRank > 0) {
      const result = updateMedals(monthlyRank, allTimeRank > 0 ? allTimeRank : monthlyRank);
      if (result.newMedal) setMedalResult(result);
    }

    if (monthlyRank === 1) {
      playWorldNumberOneSound();
      setShowWorldOne(true);
      trackBecameWorld1(playerScore);
    } else if (monthlyRank > 0 && monthlyRank <= 10) {
      playTop10Sound();
      setShowTop10(true);
      trackEnteredTop10(monthlyRank, playerScore);
    }
  };

  const handleSave = async () => {
    const trimmed = nickname.trim();
    setNicknameError('');

    if (!isValidNickname(trimmed)) {
      setNicknameError('3-12 chars, A-Z, 0-9, _ only');
      return;
    }

    setSaving(true);

    // Register nickname first
    const regResult = await registerNickname(trimmed);
    if (!regResult.success) {
      setSaving(false);
      if (regResult.reason === 'nickname_taken') {
        setNicknameError('NICKNAME TAKEN');
      } else if (regResult.reason === 'invalid_chars') {
        setNicknameError('A-Z, 0-9, _ ONLY');
      } else {
        setNicknameError('ERROR, TRY AGAIN');
      }
      return;
    }

    // Submit score
    const success = await submitScore(trimmed, score);
    setSaving(false);

    if (success) {
      setSaved(true);
      trackRankSubmitted(trimmed, score);
      await checkRankAndCelebrate(score);
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

      {/* Auto-saving indicator */}
      {existingNickname && saving && (
        <div className="mb-6 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-neon-blue" />
          <p className="font-arcade text-[8px] text-muted-foreground">SAVING AS {existingNickname}...</p>
        </div>
      )}

      {/* New Medal Unlocked */}
      {medalResult?.newMedal && saved && (
        <div className="mb-6 animate-slide-down text-center">
          <p className="font-arcade text-[8px] text-muted-foreground mb-1">NEW MEDAL UNLOCKED</p>
          <p className="text-3xl mb-1">{getMedalEmoji(medalResult.newMedal)}</p>
          <p className="font-arcade text-xs neon-text-gold uppercase">{medalResult.newMedal}</p>
          {medalResult.isNewChampion && (
            <p className="font-arcade text-[8px] neon-text-gold mt-1 animate-pulse-neon">👑 MONTHLY CHAMPION 👑</p>
          )}
        </div>
      )}

      {/* Nickname input for first-time */}
      {showNickname && !saved && !existingNickname && (
        <div className="w-full max-w-[280px] mb-6 animate-slide-down">
          <p className="font-arcade text-[8px] text-muted-foreground mb-2 text-center">CHOOSE YOUR NICKNAME</p>
          <input
            type="text"
            value={nickname}
            onChange={e => {
              setNicknameInput(e.target.value.slice(0, 12).replace(/[^A-Za-z0-9_]/g, ''));
              setNicknameError('');
            }}
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground font-orbitron text-center text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue uppercase"
            placeholder="PLAYER_NAME"
            maxLength={12}
          />
          {nicknameError && (
            <p className="font-arcade text-[7px] text-destructive mt-1 text-center">{nicknameError}</p>
          )}
          <button
            onClick={handleSave}
            disabled={!isValidNickname(nickname) || saving}
            className="w-full mt-2 py-2 rounded-lg font-arcade text-[10px] border border-neon-blue text-neon-blue hover:bg-neon-blue/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {saving ? 'SAVING...' : 'SAVE TO GLOBAL RANKING'}
          </button>
        </div>
      )}

      {saved && !medalResult?.newMedal && (
        <p className="font-arcade text-[8px] neon-text-green mb-6 animate-slide-down">✓ SCORE SAVED!</p>
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
