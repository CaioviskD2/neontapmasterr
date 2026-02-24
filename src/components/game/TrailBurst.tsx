import React, { useEffect, useState, useRef } from 'react';
import type { SkinDefinition, TrailStyle } from '@/lib/skins';

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  opacity: number;
}

interface TrailBurstProps {
  x: number;
  y: number;
  skin: SkinDefinition;
  onDone: () => void;
}

const MAX_PARTICLES = 12;
const DURATION = 300;

const createParticles = (style: TrailStyle): Particle[] => {
  const count = style === 'elite' ? 10 : style === 'gradient' ? 12 : 8;
  return Array.from({ length: Math.min(count, MAX_PARTICLES) }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 30 + Math.random() * 40;
    const size = style === 'elite' ? 6 + Math.random() * 4 : 3 + Math.random() * 3;
    return {
      id: i,
      x: 0,
      y: 0,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size,
      opacity: 1,
    };
  });
};

const TrailBurst: React.FC<TrailBurstProps> = ({ x, y, skin, onDone }) => {
  const [particles, setParticles] = useState<Particle[]>(() => createParticles(skin.trailStyle));
  const startRef = useRef(Date.now());
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);

      if (progress >= 1) {
        onDone();
        return;
      }

      setParticles(prev =>
        prev.map(p => ({
          ...p,
          x: p.dx * progress,
          y: p.dy * progress,
          opacity: 1 - progress,
        }))
      );

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [onDone]);

  const color = skin.trailColor || skin.primaryColor || '120 100% 50%';
  const style = skin.trailStyle;

  return (
    <div
      className="fixed pointer-events-none"
      style={{ left: x, top: y, zIndex: 50 }}
    >
      {particles.map(p => {
        const bg = style === 'gradient' || style === 'pulse'
          ? `radial-gradient(circle, hsl(${color} / ${p.opacity}), hsl(${color} / ${p.opacity * 0.3}))`
          : `hsl(${color} / ${p.opacity})`;

        const shadow = style === 'elite'
          ? `0 0 ${p.size * 2}px hsl(${color} / ${p.opacity * 0.8})`
          : style === 'pulse'
            ? `0 0 ${p.size}px hsl(${color} / ${p.opacity * 0.6})`
            : 'none';

        const scale = style === 'pulse' ? 1 + p.opacity * 0.5 : 1;

        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: bg,
              boxShadow: shadow,
              transform: `translate3d(${p.x}px, ${p.y}px, 0) scale(${scale})`,
              willChange: 'transform, opacity',
            }}
          />
        );
      })}
    </div>
  );
};

export default React.memo(TrailBurst);
