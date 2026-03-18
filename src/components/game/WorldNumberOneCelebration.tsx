import React, { useEffect, useRef, useState } from 'react';
import { t } from '@/i18n';

interface Props {
  onComplete: () => void;
}

const GOLD_COLORS = [
  'hsl(45, 100%, 55%)',
  'hsl(40, 100%, 60%)',
  'hsl(50, 100%, 50%)',
  'hsl(35, 100%, 65%)',
  'hsl(55, 90%, 55%)',
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  decay: number;
}

const WorldNumberOneCelebration: React.FC<Props> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<'beam' | 'explode' | 'text'>('beam');

  useEffect(() => {
    // Intense vibration
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);

    // Play epic sound – animation lives until the track ends
    const audio = new Audio('/audio/world-number-one.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
    audioRef.current = audio;

    // When music ends, finish celebration
    audio.onended = () => {
      audioRef.current = null;
      onComplete();
    };

    // Fallback: if audio fails to play or is very long, cap at 30s
    const fallback = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      onComplete();
    }, 30000);

    // Phase timeline
    const t1 = setTimeout(() => setPhase('explode'), 800);
    const t2 = setTimeout(() => setPhase('text'), 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [onComplete]);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    let beamProgress = 0;
    const particles: Particle[] = [];
    let exploded = false;
    const startTime = Date.now();

    const spawnExplosion = () => {
      for (let i = 0; i < 60; i++) {
        const angle = (Math.PI * 2 * i) / 60 + (Math.random() - 0.5) * 0.4;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * (4 + Math.random() * 8),
          vy: Math.sin(angle) * (4 + Math.random() * 8),
          size: 3 + Math.random() * 6,
          color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
          life: 1,
          decay: 0.008 + Math.random() * 0.008,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = Date.now() - startTime;

      // Phase 1: Neon beam descending from top
      if (elapsed < 1200) {
        beamProgress = Math.min(1, elapsed / 800);
        const beamY = beamProgress * cy;
        const beamWidth = 4 + beamProgress * 8;

        // Beam glow
        const grad = ctx.createLinearGradient(cx, 0, cx, beamY);
        grad.addColorStop(0, 'hsla(45, 100%, 55%, 0)');
        grad.addColorStop(0.5, 'hsla(45, 100%, 55%, 0.8)');
        grad.addColorStop(1, 'hsla(45, 100%, 70%, 1)');

        ctx.shadowBlur = 30;
        ctx.shadowColor = 'hsl(45, 100%, 55%)';
        ctx.strokeStyle = grad;
        ctx.lineWidth = beamWidth;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, beamY);
        ctx.stroke();

        // Side beams
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(cx - 20, 0);
        ctx.lineTo(cx - 10, beamY * 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 20, 0);
        ctx.lineTo(cx + 10, beamY * 0.9);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Impact point glow
        if (beamProgress > 0.8) {
          const glowSize = (beamProgress - 0.8) * 5 * 40;
          const radGrad = ctx.createRadialGradient(cx, beamY, 0, cx, beamY, glowSize);
          radGrad.addColorStop(0, 'hsla(45, 100%, 70%, 0.6)');
          radGrad.addColorStop(1, 'hsla(45, 100%, 55%, 0)');
          ctx.fillStyle = radGrad;
          ctx.fillRect(cx - glowSize, beamY - glowSize, glowSize * 2, glowSize * 2);
        }
      }

      // Phase 2: Explosion
      if (elapsed >= 800 && !exploded) {
        exploded = true;
        spawnExplosion();
      }

      // Continuous sparkle particles after explosion
      if (elapsed > 800 && elapsed < 2800 && Math.random() > 0.6) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 100;
        particles.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 3,
          size: 1 + Math.random() * 3,
          color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
          life: 1,
          decay: 0.015 + Math.random() * 0.01,
        });
      }

      // Draw particles
      particles.forEach(p => {
        if (p.life <= 0) return;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // light gravity
        p.vx *= 0.99;
        p.life -= p.decay;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Full dark overlay */}
      <div
        className="absolute inset-0 bg-background/90"
        style={{ animation: 'world1-overlay 0.5s ease-out forwards' }}
      />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" style={{ zIndex: 1 }} />

      {/* Text - appears in phase 3 */}
      {phase === 'text' && (
        <div className="relative z-10 text-center" style={{ animation: 'top10-text-in 0.6s ease-out forwards' }}>
          <p className="text-4xl sm:text-5xl mb-2" style={{ animation: 'world1-crown 0.5s ease-out forwards' }}>👑</p>
          <p
            className="font-arcade text-sm sm:text-xl md:text-2xl neon-text-gold leading-relaxed"
            style={{ animation: 'top10-glitch 0.15s ease-in-out 5, top10-glow-pulse 1s ease-in-out infinite' }}
          >
            {t('cel_you_are')}
          </p>
          <p
            className="font-arcade text-2xl sm:text-4xl md:text-5xl mt-2"
            style={{
              color: 'hsl(var(--neon-gold))',
              textShadow: '0 0 20px hsl(var(--neon-gold) / 0.9), 0 0 60px hsl(var(--neon-gold) / 0.5), 0 0 100px hsl(var(--neon-gold) / 0.3)',
              animation: 'top10-glitch 0.15s ease-in-out 5 0.1s, world1-glow 1.5s ease-in-out infinite',
            }}
          >
            {t('cel_world1')}
          </p>
        </div>
      )}
    </div>
  );
};

export default WorldNumberOneCelebration;
