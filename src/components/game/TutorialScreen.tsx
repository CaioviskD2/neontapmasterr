import React, { useState, useEffect, useRef, useCallback } from 'react';
import { markTutorialCompleted } from '@/lib/tutorial';
import { trackEvent } from '@/lib/analytics';
import { t } from '@/i18n';

interface Props {
  onComplete: () => void;
}

type Step = 1 | 2 | 3;

interface Circle {
  id: number;
  x: number;
  y: number;
  isRed: boolean;
}

const CIRCLE_SIZE = 64;
const PADDING = 20;

const placeCircles = (
  areaW: number,
  areaH: number,
  defs: { isRed: boolean }[],
): Circle[] => {
  const placed: Circle[] = [];
  const maxAttempts = 80;
  const maxX = areaW - CIRCLE_SIZE - PADDING;
  const maxY = areaH - CIRCLE_SIZE - PADDING;

  for (let i = 0; i < defs.length; i++) {
    let ok = false;
    for (let a = 0; a < maxAttempts; a++) {
      const x = PADDING + Math.random() * Math.max(0, maxX - PADDING);
      const y = PADDING + Math.random() * Math.max(0, maxY - PADDING);
      const overlaps = placed.some((c) => {
        const dx = c.x - x;
        const dy = c.y - y;
        return Math.sqrt(dx * dx + dy * dy) < CIRCLE_SIZE + 16;
      });
      if (!overlaps) {
        placed.push({ id: i, x, y, isRed: defs[i].isRed });
        ok = true;
        break;
      }
    }
    if (!ok) {
      placed.push({
        id: i,
        x: PADDING + Math.random() * Math.max(0, maxX - PADDING),
        y: PADDING + Math.random() * Math.max(0, maxY - PADDING),
        isRed: defs[i].isRed,
      });
    }
  }
  return placed;
};

const STEP_DEFS: Record<Step, { isRed: boolean }[]> = {
  1: [{ isRed: false }],
  2: [{ isRed: false }, { isRed: true }],
  3: [{ isRed: false }, { isRed: true }],
};

const TutorialScreen: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>(1);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1);
  const [ripple, setRipple] = useState<{ x: number; y: number; green: boolean } | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    trackEvent('tutorial_start');
  }, []);

  const spawn = useCallback((s: Step) => {
    const trySpawn = () => {
      if (!areaRef.current) return;
      const w = areaRef.current.clientWidth;
      const h = areaRef.current.clientHeight;
      if (w < 100 || h < 100) {
        requestAnimationFrame(trySpawn);
        return;
      }
      setCircles(placeCircles(w, h, STEP_DEFS[s]));
    };
    requestAnimationFrame(trySpawn);
  }, []);

  useEffect(() => {
    spawn(step);
    if (step === 3) startRef.current = Date.now();
  }, [step, spawn]);

  useEffect(() => {
    if (step !== 3) return;
    const DURATION = 3000;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / DURATION);
      setTimeLeft(remaining);
      if (remaining > 0) {
        timerRef.current = requestAnimationFrame(tick);
      } else {
        startRef.current = Date.now();
        setTimeLeft(1);
        timerRef.current = requestAnimationFrame(tick);
      }
    };
    timerRef.current = requestAnimationFrame(tick);
    return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
  }, [step]);

  useEffect(() => {
    const handler = () => spawn(step);
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, [step, spawn]);

  const handleTap = (circle: Circle, e: React.PointerEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setRipple({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, green: !circle.isRed });
    setTimeout(() => setRipple(null), 400);

    if (circle.isRed) {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 600);
      requestAnimationFrame(() => spawn(step));
      return;
    }

    if (step < 3) {
      setStep((prev) => (prev + 1) as Step);
    } else {
      markTutorialCompleted();
      trackEvent('tutorial_complete');
      onComplete();
    }
  };

  const headlines: Record<Step, string> = {
    1: t('tut_tap_green'),
    2: t('tut_avoid_red'),
    3: t('tut_be_fast'),
  };
  const subs: Record<Step, string> = {
    1: t('tut_tap_green_sub'),
    2: t('tut_avoid_red_sub'),
    3: t('tut_be_fast_sub'),
  };

  const barColor = timeLeft > 0.5 ? 'bg-neon-green' : timeLeft > 0.25 ? 'bg-neon-gold' : 'bg-neon-red';

  return (
    <div className="flex flex-col h-[100dvh] w-full grid-bg animate-float-in">
      {wrongFlash && (
        <div className="fixed inset-0 bg-neon-red/20 pointer-events-none z-50 animate-pulse" />
      )}

      <div className="flex flex-col items-center px-4 pt-6 pb-3 gap-1">
        <div className="flex gap-2 mb-3">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${
                s === step
                  ? 'bg-neon-green neon-glow-green scale-125'
                  : s < step
                  ? 'bg-neon-green/40'
                  : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        <p className="font-arcade text-lg neon-text-green text-center animate-pulse-neon">
          {headlines[step]}
        </p>
        <p className="font-orbitron text-xs text-muted-foreground text-center">
          {subs[step]}
        </p>

        {wrongFlash && (
          <p className="font-arcade text-[9px] neon-text-red animate-pulse mt-1">
            {t('tut_wrong')}
          </p>
        )}
      </div>

      {step === 3 && (
        <div className="mx-4 h-2 rounded-full bg-secondary overflow-hidden mb-1">
          <div
            className={`h-full rounded-full transition-none ${barColor}`}
            style={{ width: `${Math.max(0, timeLeft * 100)}%` }}
          />
        </div>
      )}

      <div
        ref={areaRef}
        className="flex-1 relative mx-2 mb-4 overflow-hidden rounded-lg"
        style={{ touchAction: 'none', minHeight: 0 }}
      >
        {circles.map((circle) => (
          <button
            key={`${step}-${circle.id}`}
            onPointerDown={(e) => handleTap(circle, e)}
            className={`absolute rounded-full animate-pulse-neon active:scale-90 transition-transform ${
              circle.isRed ? 'bg-neon-red neon-glow-red' : 'bg-neon-green neon-glow-green'
            }`}
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              left: 0,
              top: 0,
              transform: `translate3d(${circle.x}px, ${circle.y}px, 0)`,
              willChange: 'transform',
            }}
          />
        ))}

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

      <button
        onPointerDown={() => {
          markTutorialCompleted();
          trackEvent('tutorial_skipped');
          onComplete();
        }}
        className="mx-auto mb-6 font-arcade text-[8px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        {t('tut_skip')}
      </button>
    </div>
  );
};

export default TutorialScreen;
