import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playTapSound, playGameOverSound } from '@/lib/sounds';
import { playGameMusic } from '@/lib/music';

interface Circle {
  id: number;
  x: number;
  y: number;
  isRed: boolean;
}

interface Props {
  onGameOver: (score: number) => void;
}

const CIRCLE_SIZE = 64; // px
const INITIAL_TIME = 2000; // ms
const MIN_TIME = 800;

const generateCircles = (count: number, areaW: number, areaH: number): Circle[] => {
  const circles: Circle[] = [];
  const padding = 10;
  const maxAttempts = 100;

  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = padding + Math.random() * (areaW - CIRCLE_SIZE - padding * 2);
      const y = padding + Math.random() * (areaH - CIRCLE_SIZE - padding * 2);

      const overlaps = circles.some(c => {
        const dx = c.x - x;
        const dy = c.y - y;
        return Math.sqrt(dx * dx + dy * dy) < CIRCLE_SIZE + 12;
      });

      if (!overlaps) {
        circles.push({ id: i, x, y, isRed: i === count - 1 });
        placed = true;
        break;
      }
    }
    if (!placed) {
      circles.push({
        id: i,
        x: padding + Math.random() * (areaW - CIRCLE_SIZE - padding * 2),
        y: padding + Math.random() * (areaH - CIRCLE_SIZE - padding * 2),
        isRed: i === count - 1,
      });
    }
  }

  // Shuffle so red isn't always last visually
  for (let i = circles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [circles[i], circles[j]] = [circles[j], circles[i]];
  }

  return circles;
};

const GameScreen: React.FC<Props> = ({ onGameOver }) => {
  const [score, setScore] = useState(0);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [timeLeft, setTimeLeft] = useState(1);
  const [maxTime, setMaxTime] = useState(INITIAL_TIME);
  const [ripple, setRipple] = useState<{ x: number; y: number; green: boolean } | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const gameOverRef = useRef(false);
  const scoreRef = useRef(0);

  const getCircleCount = useCallback((s: number) => {
    return 3 + Math.floor(s / 5); // +1 green every 5 points
  }, []);

  const getMaxTime = useCallback((s: number) => {
    return Math.max(MIN_TIME, INITIAL_TIME - s * 30);
  }, []);

  const spawnCircles = useCallback((s: number) => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const count = getCircleCount(s);
    setCircles(generateCircles(count, rect.width, rect.height));
  }, [getCircleCount]);

  // Init
  useEffect(() => {
    playGameMusic();
    const timeout = setTimeout(() => spawnCircles(0), 50);
    return () => clearTimeout(timeout);
  }, [spawnCircles]);

  // Timer loop
  useEffect(() => {
    startTimeRef.current = Date.now();

    const tick = () => {
      if (gameOverRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = 1 - elapsed / maxTime;
      if (remaining <= 0) {
        gameOverRef.current = true;
        playGameOverSound();
        vibrate();
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

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(100);
  };

  const handleTap = (circle: Circle, e: React.MouseEvent | React.TouchEvent) => {
    if (gameOverRef.current) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setRipple({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, green: !circle.isRed });
    setTimeout(() => setRipple(null), 400);

    if (circle.isRed) {
      gameOverRef.current = true;
      playGameOverSound();
      vibrate();
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
      spawnCircles(newScore);
    }
  };

  // Timer bar color
  const barColor = timeLeft > 0.5 ? 'bg-neon-green' : timeLeft > 0.25 ? 'bg-neon-gold' : 'bg-neon-red';
  const barGlow = timeLeft > 0.5 ? 'neon-glow-green' : timeLeft > 0.25 ? '' : 'neon-glow-red';

  return (
    <div className="flex flex-col h-[100dvh] w-full grid-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <p className="font-arcade text-[10px] text-muted-foreground">SCORE</p>
        <p className="font-arcade text-lg neon-text-blue">{score}</p>
      </div>

      {/* Timer bar */}
      <div className="mx-4 h-2 rounded-full bg-secondary overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-75 ${barColor} ${barGlow}`}
          style={{ width: `${Math.max(0, timeLeft * 100)}%` }}
        />
      </div>

      {/* Game area */}
      <div ref={areaRef} className="flex-1 relative mx-2 mb-2 overflow-hidden rounded-lg">
        {circles.map(circle => (
          <button
            key={circle.id}
            onClick={(e) => handleTap(circle, e)}
            className={`absolute rounded-full transition-transform active:scale-90 animate-pulse-neon ${
              circle.isRed
                ? 'bg-neon-red neon-glow-red'
                : 'bg-neon-green neon-glow-green'
            }`}
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              left: circle.x,
              top: circle.y,
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
