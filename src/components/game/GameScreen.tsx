import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playTapSound, playGameOverSound } from '@/lib/sounds';
import { playGameMusic, stopMusic } from '@/lib/music';
import { trackPlayStart, trackGameOver, trackEvent } from '@/lib/analytics';
import { getDifficulty, getMaxTimeForScore, getCircleCountForScore, type Difficulty } from '@/lib/difficulty';
import { t } from '@/i18n';
import { getActiveSkin, getCircleBg, getCircleGlow, getCircleBorder } from '@/lib/skins';
import TrailBurst from './TrailBurst';

interface Circle {
  id: number;
  x: number;
  y: number;
  isRed: boolean;
}

export interface GameConfig {
  totalTimeMs?: number;
  targetScore?: number;
  disableContinue?: boolean;
  onChallengeComplete?: (score: number) => void;
}

interface Props {
  onGameOver: (score: number) => void;
  initialScore?: number;
  invulnerableStart?: boolean;
  config?: GameConfig;
  difficulty?: Difficulty;
}

const DEFAULT_CIRCLE_SIZE = 64;
const INSANE_SIZES = [44, 56, 68, 80];
// Hardcore (challenge) mode constants
const HC_INITIAL_TIME = 1600;
const HC_MIN_TIME = 650;
const HC_TIME_REDUCTION = 45;
const MIN_AREA = 200;

const pickNextSize = (lastSize: number): number => {
  const options = INSANE_SIZES.filter(s => s !== lastSize);
  return options[Math.floor(Math.random() * options.length)];
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const generateCircles = (count: number, areaW: number, areaH: number, allGreen = false, circleSize = DEFAULT_CIRCLE_SIZE): Circle[] => {
  const circles: Circle[] = [];
  const padding = 10;
  const maxAttempts = 100;
  const maxX = Math.max(padding, areaW - circleSize - padding);
  const maxY = Math.max(padding, areaH - circleSize - padding);
  const minDist = circleSize + 12;

  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = clamp(padding + Math.random() * (maxX - padding), padding, maxX);
      const y = clamp(padding + Math.random() * (maxY - padding), padding, maxY);
      if (isNaN(x) || isNaN(y)) continue;
      const overlaps = circles.some(c => {
        const dx = c.x - x;
        const dy = c.y - y;
        return Math.sqrt(dx * dx + dy * dy) < minDist;
      });
      if (!overlaps) {
        circles.push({ id: i, x, y, isRed: allGreen ? false : i === count - 1 });
        placed = true;
        break;
      }
    }
    if (!placed) {
      const x = clamp(padding + Math.random() * (maxX - padding), padding, maxX);
      const y = clamp(padding + Math.random() * (maxY - padding), padding, maxY);
      circles.push({
        id: i,
        x: isNaN(x) ? padding : x,
        y: isNaN(y) ? padding : y,
        isRed: allGreen ? false : i === count - 1,
      });
    }
  }

  for (let i = circles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [circles[i], circles[j]] = [circles[j], circles[i]];
  }

  return circles;
};

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: 'diff_easy',
  normal: 'diff_normal',
  hard: 'diff_hard',
  insane: 'diff_insane',
};

const GameScreen: React.FC<Props> = ({ onGameOver, initialScore, invulnerableStart, config, difficulty }) => {
  const startScore = initialScore ?? 0;
  const diff = difficulty ?? getDifficulty();
  const isHardcore = !!(config && (config.totalTimeMs || config.targetScore || config.disableContinue));
  const isInsane = diff === 'insane' && !isHardcore;
  const skin = getActiveSkin();
  const [score, setScore] = useState(startScore);
  const [circleSize, setCircleSize] = useState(() => isInsane ? INSANE_SIZES[Math.floor(Math.random() * INSANE_SIZES.length)] : DEFAULT_CIRCLE_SIZE);
  const circleSizeRef = useRef(isInsane ? INSANE_SIZES[Math.floor(Math.random() * INSANE_SIZES.length)] : DEFAULT_CIRCLE_SIZE);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [timeLeft, setTimeLeft] = useState(1);
  const [maxTime, setMaxTime] = useState(() => {
    if (isHardcore) return Math.max(HC_MIN_TIME, HC_INITIAL_TIME - startScore * HC_TIME_REDUCTION);
    return getMaxTimeForScore(startScore, diff);
  });
  const [ripple, setRipple] = useState<{ x: number; y: number; green: boolean } | null>(null);
  const [invulnerable, setInvulnerable] = useState(!!invulnerableStart);
  const [trailBursts, setTrailBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const trailCountRef = useRef(0);
  const trailTrackedRef = useRef(false);
  const MAX_BURSTS = 3;

  const [challengeTimeLeft, setChallengeTimeLeft] = useState(config?.totalTimeMs ?? 0);
  const challengeStartRef = useRef(Date.now());

  const areaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const challengeTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const gameOverRef = useRef(false);
  const scoreRef = useRef(startScore);

  const hasChallengeTimer = !!(config?.totalTimeMs && config.totalTimeMs > 0);

  const getCircleCount = useCallback((s: number) => {
    if (isHardcore) return 3 + Math.floor(s / 3);
    return getCircleCountForScore(s, diff);
  }, [isHardcore, diff]);

  const getMaxTimeCalc = useCallback((s: number) => {
    if (isHardcore) return Math.max(HC_MIN_TIME, HC_INITIAL_TIME - s * HC_TIME_REDUCTION);
    return getMaxTimeForScore(s, diff);
  }, [isHardcore, diff]);

  const spawnCircles = useCallback((s: number, allGreen = false, size?: number) => {
    const useSize = size ?? circleSizeRef.current;
    const trySpawn = () => {
      if (!areaRef.current) return;
      const w = areaRef.current.clientWidth;
      const h = areaRef.current.clientHeight;
      if (w < MIN_AREA || h < MIN_AREA) {
        requestAnimationFrame(trySpawn);
        return;
      }
      const count = getCircleCount(s);
      setCircles(generateCircles(count, w, h, allGreen, useSize));
    };
    trySpawn();
  }, [getCircleCount]);

  useEffect(() => {
    const handleResize = () => {
      if (gameOverRef.current) return;
      spawnCircles(scoreRef.current, invulnerable);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [spawnCircles, invulnerable]);

  useEffect(() => {
    playGameMusic();
    if (!initialScore) trackPlayStart(diff);

    if (hasChallengeTimer) {
      challengeStartRef.current = Date.now();
    }

    if (invulnerableStart) {
      setTimeout(() => spawnCircles(startScore, true), 50);
      const timer = setTimeout(() => {
        setInvulnerable(false);
        spawnCircles(startScore, false);
        startTimeRef.current = Date.now();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const timeout = setTimeout(() => spawnCircles(startScore), 50);
      return () => clearTimeout(timeout);
    }
  }, [spawnCircles]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    const tick = () => {
      if (gameOverRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = 1 - elapsed / maxTime;
      if (remaining <= 0) {
        gameOverRef.current = true;
        playGameOverSound();
        stopMusic();
        vibrate();
        trackGameOver(scoreRef.current, diff);
        onGameOver(scoreRef.current);
        return;
      }
      setTimeLeft(remaining);
      timerRef.current = requestAnimationFrame(tick);
    };
    timerRef.current = requestAnimationFrame(tick);
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [maxTime, score, onGameOver]);

  useEffect(() => {
    if (!hasChallengeTimer) return;
    const tick = () => {
      if (gameOverRef.current) return;
      const elapsed = Date.now() - challengeStartRef.current;
      const remaining = config!.totalTimeMs! - elapsed;
      setChallengeTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        gameOverRef.current = true;
        stopMusic();
        if (config?.targetScore && scoreRef.current >= config.targetScore) {
          config.onChallengeComplete?.(scoreRef.current);
        } else if (!config?.targetScore) {
          config?.onChallengeComplete?.(scoreRef.current);
        } else {
          playGameOverSound();
          vibrate();
          trackGameOver(scoreRef.current, diff);
          onGameOver(scoreRef.current);
        }
        return;
      }
      challengeTimerRef.current = requestAnimationFrame(tick);
    };
    challengeTimerRef.current = requestAnimationFrame(tick);
    return () => {
      if (challengeTimerRef.current) cancelAnimationFrame(challengeTimerRef.current);
    };
  }, [hasChallengeTimer, config, onGameOver]);

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(100);
  };

  useEffect(() => {
    if (config?.targetScore && score >= config.targetScore && !gameOverRef.current) {
      gameOverRef.current = true;
      stopMusic();
      config.onChallengeComplete?.(score);
    }
  }, [score, config]);

  const handleTap = (circle: Circle, e: React.PointerEvent) => {
    if (gameOverRef.current) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setRipple({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, green: !circle.isRed });
    setTimeout(() => setRipple(null), 400);

    if (circle.isRed) {
      if (invulnerable) return;
      gameOverRef.current = true;
      playGameOverSound();
      stopMusic();
      vibrate();
      trackGameOver(scoreRef.current, diff);
      onGameOver(scoreRef.current);
    } else {
      playTapSound();
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      const newMax = getMaxTimeCalc(newScore);
      setMaxTime(newMax);
      startTimeRef.current = Date.now();
      setTimeLeft(1);

      // Trail burst in insane mode
      if (isInsane && skin.trailStyle !== 'none') {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const burstId = ++trailCountRef.current;
        setTrailBursts(prev => {
          const next = [...prev, { id: burstId, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }];
          return next.slice(-MAX_BURSTS);
        });
        if (!trailTrackedRef.current) {
          trackEvent('insane_trail_triggered');
          trailTrackedRef.current = true;
        }
      }

      let nextSize = circleSizeRef.current;
      if (isInsane) {
        nextSize = pickNextSize(circleSizeRef.current);
        trackEvent('insane_size_change', { from: circleSizeRef.current, to: nextSize });
        circleSizeRef.current = nextSize;
        setCircleSize(nextSize);
      }

      requestAnimationFrame(() => {
        spawnCircles(newScore, invulnerable, nextSize);
      });
    }
  };

  const barColor = timeLeft > 0.5 ? 'bg-neon-green' : timeLeft > 0.25 ? 'bg-neon-gold' : 'bg-neon-red';
  const barGlow = timeLeft > 0.5 ? 'neon-glow-green' : timeLeft > 0.25 ? '' : 'neon-glow-red';

  const formatChallengeTime = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    return `${s}s`;
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full grid-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <p className="font-arcade text-[10px] text-muted-foreground">{t('game_score')}</p>
          {config?.targetScore && (
            <p className="font-arcade text-[8px] text-muted-foreground">/ {config.targetScore}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isHardcore && (
            <span className="font-arcade text-[7px] text-muted-foreground/60 uppercase">
              {t(DIFF_LABEL[diff] as any)}
            </span>
          )}
          {hasChallengeTimer && (
            <span className="font-arcade text-[10px] neon-text-gold">
              ⏱ {formatChallengeTime(challengeTimeLeft)}
            </span>
          )}
          {invulnerable && (
            <span className="font-arcade text-[8px] neon-text-gold animate-pulse-neon">{t('game_shield')}</span>
          )}
          <p className="font-arcade text-lg neon-text-blue">{score}</p>
        </div>
      </div>

      {/* Timer bar */}
      <div className="mx-4 h-2 rounded-full bg-secondary overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-none ${barColor} ${barGlow}`}
          style={{ width: `${Math.max(0, timeLeft * 100)}%` }}
        />
      </div>

      {/* Game area */}
      <div
        ref={areaRef}
        className="flex-1 relative mx-2 mb-2 overflow-hidden rounded-lg"
        style={{ touchAction: 'none', minHeight: 0 }}
      >
        {circles.map(circle => {
          const isDefault = skin.id === 'default';
          const bg = getCircleBg(skin, circle.isRed);
          const isGradient = bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient');
          const glow = getCircleGlow(skin, circle.isRed);
          const border = getCircleBorder(skin, circle.isRed);

          const isElite = skin.styleType === 'elite' && !circle.isRed && !isDefault;

          return (
            <button
              key={circle.id}
              onPointerDown={(e) => handleTap(circle, e)}
              className={`absolute rounded-full transition-transform active:scale-90 animate-pulse-neon ${
                isDefault ? (circle.isRed ? 'bg-neon-red neon-glow-red' : 'bg-neon-green neon-glow-green') : ''
              }`}
              style={{
                width: circleSize,
                height: circleSize,
                transform: `translate3d(${circle.x}px, ${circle.y}px, 0)`,
                willChange: 'transform',
                left: 0,
                top: 0,
                ...(!isDefault && bg ? (isGradient ? { background: bg } : { backgroundColor: bg }) : {}),
                ...(!isDefault && glow ? { boxShadow: glow } : {}),
                ...(!isDefault && border ? { border } : {}),
              }}
            >
              {isElite && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] pointer-events-none select-none" style={{ textShadow: `0 0 6px hsl(${skin.primaryColor})` }}>👑</span>
              )}
            </button>
          );
        })}

        {ripple && (
          <div
            className={`fixed pointer-events-none rounded-full ${ripple.green ? 'bg-neon-green/30' : 'bg-neon-red/30'}`}
            style={{
              left: ripple.x - 30,
              top: ripple.y - 30,
              width: 60,
              height: 60,
              animation: 'ripple 0.4s ease-out forwards',
            }}
          />
        )}

        {trailBursts.map(burst => (
          <TrailBurst
            key={burst.id}
            x={burst.x}
            y={burst.y}
            skin={skin}
            onDone={() => setTrailBursts(prev => prev.filter(b => b.id !== burst.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default GameScreen;
