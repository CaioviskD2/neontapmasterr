import React, { useEffect, useState } from 'react';
import { getHighScore, setHighScore } from '@/lib/storage';
import { submitScore, getPlayerRankMonthly, getPlayerRankAllTime } from '@/lib/leaderboard';
import { playHighScoreSound, playTop10Sound, playWorldNumberOneSound } from '@/lib/sounds';
import { stopMusic } from '@/lib/music';
import { incrementGamesPlayed, showInterstitialAd, showRewardedAd } from '@/lib/ads';
import { trackNewHighScore, trackRankSubmitted, trackEnteredTop10, trackBecameWorld1 } from '@/lib/analytics';
import { updateMedals, getMedalEmoji, type MedalUpdateResult } from '@/lib/medals';
import { getNickname, isValidNickname, registerNickname } from '@/lib/player';
import { t } from '@/i18n';
import Top10Celebration from './Top10Celebration';
import WorldNumberOneCelebration from './WorldNumberOneCelebration';
import { Loader2 } from 'lucide-react';

interface Props {
  score: number;
  onPlayAgain: () => void;
  onHome: () => void;
  onLeaderboard: () => void;
  onContinue?: () => void;
}

const GameOverScreen: React.FC<Props> = ({ score, onPlayAgain, onHome, onLeaderboard, onContinue }) => {
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
  const [loadingRewarded, setLoadingRewarded] = useState(false);
  const [continueUsed, setContinueUsed] = useState(false);

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
      setNicknameError(t('gameover_nick_error_length'));
      return;
    }

    setSaving(true);
    const regResult = await registerNickname(trimmed);
    if (!regResult.success) {
      setSaving(false);
      if (regResult.reason === 'nickname_taken') {
        setNicknameError(t('gameover_nick_error_taken'));
      } else if (regResult.reason === 'invalid_chars') {
        setNicknameError(t('gameover_nick_error_chars'));
      } else {
        setNicknameError(t('gameover_nick_error_generic'));
      }
      return;
    }

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
        {t('gameover_title')}
      </h1>

      <div className="text-center mb-4">
        <p className="font-arcade text-[10px] text-muted-foreground mb-1">{t('gameover_your_score')}</p>
        <p className="font-arcade text-3xl neon-text-blue">{score}</p>
      </div>

      <div className="text-center mb-6">
        <p className="font-arcade text-[10px] text-muted-foreground mb-1">{t('gameover_high_score')}</p>
        <p className="font-arcade text-lg neon-text-gold">{highScore}</p>
      </div>

      {isNewHighScore && (
        <div className="mb-6 animate-pulse-neon">
          <p className="font-arcade text-xs neon-text-gold">{t('gameover_new_high')}</p>
        </div>
      )}

      {existingNickname && saving && (
        <div className="mb-6 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin text-neon-blue" />
          <p className="font-arcade text-[8px] text-muted-foreground">{t('gameover_saving_as')} {existingNickname}...</p>
        </div>
      )}

      {medalResult?.newMedal && saved && (
        <div className="mb-6 animate-slide-down text-center">
          <p className="font-arcade text-[8px] text-muted-foreground mb-1">{t('gameover_new_medal')}</p>
          <p className="text-3xl mb-1">{getMedalEmoji(medalResult.newMedal)}</p>
          <p className="font-arcade text-xs neon-text-gold uppercase">{medalResult.newMedal}</p>
          {medalResult.isNewChampion && (
            <p className="font-arcade text-[8px] neon-text-gold mt-1 animate-pulse-neon">{t('gameover_monthly_champion')}</p>
          )}
        </div>
      )}

      {showNickname && !saved && !existingNickname && (
        <div className="w-full max-w-[280px] mb-6 animate-slide-down">
          <p className="font-arcade text-[8px] text-muted-foreground mb-2 text-center">{t('gameover_choose_nick')}</p>
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
            {saving ? t('gameover_saving') : t('gameover_save')}
          </button>
        </div>
      )}

      {saved && !medalResult?.newMedal && (
        <p className="font-arcade text-[8px] neon-text-green mb-6 animate-slide-down">{t('gameover_saved')}</p>
      )}

      {onContinue && !continueUsed && (
        <button
          onClick={async () => {
            setLoadingRewarded(true);
            const rewarded = await showRewardedAd();
            setLoadingRewarded(false);
            if (rewarded) {
              setContinueUsed(true);
              onContinue();
            }
          }}
          disabled={loadingRewarded}
          className="w-full max-w-[280px] py-4 px-8 rounded-lg font-arcade text-sm border-2 border-neon-gold text-neon-gold hover:bg-neon-gold/10 active:scale-95 transition-all mb-3 flex items-center justify-center gap-2"
        >
          {loadingRewarded ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('gameover_watching')}
            </>
          ) : (
            t('gameover_continue')
          )}
        </button>
      )}

      <button
        onClick={onPlayAgain}
        className="w-full max-w-[280px] py-4 px-8 rounded-lg font-arcade text-sm bg-neon-green text-background neon-glow-green hover:scale-105 active:scale-95 transition-transform mb-3"
      >
        {t('gameover_play_again')}
      </button>

      <button
        onClick={onHome}
        className="w-full max-w-[280px] py-3 px-8 rounded-lg font-arcade text-[10px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 active:scale-95 transition-all"
      >
        {t('gameover_home')}
      </button>
    </div>
    </>
  );
};

export default GameOverScreen;
