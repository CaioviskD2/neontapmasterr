import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playTapSound, playGameOverSound } from '@/lib/sounds';
import { playGameMusic, stopMusic } from '@/lib/music';
import { trackPlayStart, trackGameOver } from '@/lib/analytics';

interface Circle {
  id: number;
  x: number;
  y: number;
  isRed: boolean;
}

export interface GameConfig {
  /** Max game time in ms (0 = use normal per-round timer) */
  totalTimeMs?: number;
  /** Target score to win (0 = no target) */
  targetScore?: number;
  /** Disable continue/rewarded */
  disableContinue?: boolean;
  /** Callback when challenge objective is met */
  onChallengeComplete?: (score: number) => void;
}

interface Props {
  onGameOver: (score: number) => void;
  initialScore?: number;
  invulnerableStart?: boolean;
  config?: GameConfig;
}

const CIRCLE_SIZE = 64;
// Normal mode constants
const INITIAL_TIME = 2000;
const MIN_TIME = 800;
// Hardcore (challenge) mode constants
const HC_INITIAL_TIME = 1600;
const HC_MIN_TIME = 650;
const HC_TIME_REDUCTION = 45; // ms per point
const MIN_AREA = 200;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const generateCircles = (count: number, areaW: number, areaH: number, allGreen = false): Circle[] => {
  const circles: Circle[] = [];
  const padding = 10;
  const maxAttempts = 100;
  const maxX = Math.max(padding, areaW - CIRCLE_SIZE - padding);
  const maxY = Math.max(padding, areaH - CIRCLE_SIZE - padding);

  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = clamp(padding + Math.random() * (maxX - padding), padding, maxX);
      const y = clamp(padding + Math.random() * (maxY - padding), padding, maxY);

      if (isNaN(x) || isNaN(y)) continue;

      const overlaps = circles.some(c => {
        const dx = c.x - x;
        const dy = c.y - y;
        return Math.sqrt(dx * dx + dy * dy) < CIRCLE_SIZE + 12;
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

const GameScreen: React.FC<Props> = ({ onGameOver, initialScore, invulnerableStart, config }) => {
  const startScore = initialScore ?? 0;
  const isHardcore = !!(config && (config.totalTimeMs || config.targetScore || config.disableContinue));
  const [score, setScore] = useState(startScore);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [timeLeft, setTimeLeft] = useState(1);
  const [maxTime, setMaxTime] = useState(() => {
    if (isHardcore) return Math.max(HC_MIN_TIME, HC_INITIAL_TIME - startScore * HC_TIME_REDUCTION);
    return Math.max(MIN_TIME, INITIAL_TIME - startScore * 30);
  });
  const [ripple, setRipple] = useState<{ x: number; y: number; green: boolean } | null>(null);
  const [invulnerable, setInvulnerable] = useState(!!invulnerableStart);

  // Challenge timer state
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
    // Hardcore: +1 circle every 3 pts; Normal: every 5 pts
    return 3 + Math.floor(s / (isHardcore ? 3 : 5));
  }, [isHardcore]);

  const getMaxTime = useCallback((s: number) => {
    if (isHardcore) return Math.max(HC_MIN_TIME, HC_INITIAL_TIME - s * HC_TIME_REDUCTION);
    return Math.max(MIN_TIME, INITIAL_TIME - s * 30);
  }, [isHardcore]);

  const spawnCircles = useCallback((s: number, allGreen = false) => {
    const trySpawn = () => {
      if (!areaRef.current) return;
      const w = areaRef.current.clientWidth;
      const h = areaRef.current.clientHeight;
      if (w < MIN_AREA || h < MIN_AREA) {
        requestAnimationFrame(trySpawn);
        return;
      }
      const count = getCircleCount(s);
      setCircles(generateCircles(count, w, h, allGreen));
    };
    trySpawn();
  }, [getCircleCount]);

  // Re-spawn on resize/orientation change
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

  // Init
  useEffect(() => {
    playGameMusic();
    if (!initialScore) trackPlayStart();

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

  // Per-round timer loop (rAF + performance.now)
  useEffect(() => {
    startTimeRef.current = Date.now();

    const tick = () => {
      if (gameOverRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = 1 - elapsed / maxTime;
      if (remaining <= 0) {
        // In challenge mode with totalTime, round timeout = game over too
        gameOverRef.current = true;
        playGameOverSound();
        stopMusic();
        vibrate();
        trackGameOver(scoreRef.current);
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

  // Challenge global timer (rAF)
  useEffect(() => {
    if (!hasChallengeTimer) return;

    const tick = () => {
      if (gameOverRef.current) return;
      const elapsed = Date.now() - challengeStartRef.current;
      const remaining = config!.totalTimeMs! - elapsed;
      setChallengeTimeLeft(Math.max(0, remaining));

      if (remaining <= 0) {
        // Time's up — check if target was met
        gameOverRef.current = true;
        stopMusic();
        if (config?.targetScore && scoreRef.current >= config.targetScore) {
          config.onChallengeComplete?.(scoreRef.current);
        } else if (!config?.targetScore) {
          // Speed mode: complete with whatever score
          config?.onChallengeComplete?.(scoreRef.current);
        } else {
          playGameOverSound();
          vibrate();
          trackGameOver(scoreRef.current);
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

  // Check challenge target on score change
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
      trackGameOver(scoreRef.current);
      onGameOver(scoreRef.current);
    } else {
      playTapSound();
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      const newMax = getMaxTime(newScore);
      setMaxTime(newMax);
      startTimeRef.current = Date.now();
      setTimeLeft(1);
      // Use rAF to defer reposition so hit is confirmed first
      requestAnimationFrame(() => {
        spawnCircles(newScore, invulnerable);
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
          <p className="font-arcade text-[10px] text-muted-foreground">SCORE</p>
          {config?.targetScore && (
            <p className="font-arcade text-[8px] text-muted-foreground">/ {config.targetScore}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasChallengeTimer && (
            <span className="font-arcade text-[10px] neon-text-gold">
              ⏱ {formatChallengeTime(challengeTimeLeft)}
            </span>
          )}
          {invulnerable && (
            <span className="font-arcade text-[8px] neon-text-gold animate-pulse-neon">🛡️ SHIELD</span>
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
        {circles.map(circle => (
          <button
            key={circle.id}
            onPointerDown={(e) => handleTap(circle, e)}
            className={`absolute rounded-full transition-transform active:scale-90 animate-pulse-neon ${
              circle.isRed
                ? 'bg-neon-red neon-glow-red'
                : 'bg-neon-green neon-glow-green'
            }`}
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              transform: `translate3d(${circle.x}px, ${circle.y}px, 0)`,
              willChange: 'transform',
              left: 0,
              top: 0,
            }}
          />
        ))}

        {/* Ripple effect */}
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
      </div>
    </div>
  );
};

export default GameScreen;
