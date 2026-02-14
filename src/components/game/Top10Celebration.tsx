import React, { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  life: number;
}

interface Props {
  onComplete: () => void;
}

const PARTICLE_COUNT = 40;
const COLORS = [
  'hsl(120, 100%, 55%)',  // neon-green
  'hsl(200, 100%, 55%)',  // neon-blue
  'hsl(45, 100%, 55%)',   // neon-gold
  'hsl(348, 100%, 50%)',  // neon-red
  'hsl(280, 100%, 60%)',  // purple
];

const Top10Celebration: React.FC<Props> = ({ onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showText, setShowText] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    // Vibrate on mobile
    if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 100]);

    // Generate particles from center
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const newParticles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5;
      newParticles.push({
        id: i,
        x: cx,
        y: cy,
        angle,
        speed: 3 + Math.random() * 6,
        size: 3 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
      });
    }
    setParticles(newParticles);

    // Show text after brief delay
    const textTimer = setTimeout(() => setShowText(true), 200);

    // Auto-complete after 1.5s
    const completeTimer = setTimeout(onComplete, 1500);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(completeTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [onComplete]);

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || particles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let localParticles = particles.map(p => ({ ...p }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      localParticles.forEach(p => {
        if (p.life <= 0) return;
        alive = true;

        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed + 0.5; // gravity
        p.life -= 0.015;
        p.speed *= 0.98;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (alive) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [particles]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-background/70"
        style={{ animation: 'top10-overlay-in 0.3s ease-out forwards' }}
      />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ zIndex: 1 }}
      />

      {/* Text */}
      {showText && (
        <div className="relative z-10 text-center" style={{ animation: 'top10-text-in 0.5s ease-out forwards' }}>
          <p
            className="font-arcade text-lg sm:text-2xl md:text-3xl neon-text-gold leading-relaxed"
            style={{ animation: 'top10-glitch 0.15s ease-in-out 4, top10-glow-pulse 1s ease-in-out infinite' }}
          >
            YOU ENTERED
          </p>
          <p
            className="font-arcade text-2xl sm:text-4xl md:text-5xl neon-text-green mt-2"
            style={{ animation: 'top10-glitch 0.15s ease-in-out 4 0.1s, top10-glow-pulse 1s ease-in-out infinite 0.2s' }}
          >
            THE TOP 10
          </p>
        </div>
      )}
    </div>
  );
};

export default Top10Celebration;
