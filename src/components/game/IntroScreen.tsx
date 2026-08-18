import React, { useEffect, useCallback } from 'react';
import { playIntroMusic, stopMusic, markUserInteracted } from '@/lib/music';
import { t } from '@/i18n';

interface Props {
  onStart: () => void;
}

const vibrate = (ms: number) => {
  try { navigator?.vibrate?.(ms); } catch {}
};

const IntroScreen: React.FC<Props> = ({ onStart }) => {
  useEffect(() => { playIntroMusic(); }, []);

  const handleTap = useCallback(() => {
    markUserInteracted();
    playIntroMusic();
  }, []);

  const stopAndGo = useCallback(() => {
    vibrate(10);
    stopMusic();
    onStart();
  }, [onStart]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-40"
      style={{
        backgroundColor: '#0A0A0A',
        animation: 'intro-fade-in 400ms ease-out both',
      }}
      onClick={handleTap}
    >
      {/* Particle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              backgroundColor: i % 2 === 0 ? 'rgba(168,85,247,0.4)' : 'rgba(34,211,238,0.3)',
              animation: `particle-float ${6 + (i % 4) * 2}s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>

      <h1 className="text-center">
        <span
          className="block font-arcade text-2xl sm:text-3xl md:text-4xl leading-relaxed mb-1"
          style={{
            color: '#a855f7',
            animation: 'neon-pulse 1.6s ease-in-out infinite alternate',
            textShadow: '0 0 10px rgba(168,85,247,0.8), 0 0 30px rgba(168,85,247,0.4)',
          }}
        >
          NEON TAP
        </span>
        <span
          className="block font-arcade text-3xl sm:text-4xl md:text-5xl leading-relaxed mb-3"
          style={{
            color: '#22d3ee',
            animation: 'neon-pulse 1.6s ease-in-out 0.3s infinite alternate',
            textShadow: '0 0 10px rgba(34,211,238,0.8), 0 0 30px rgba(34,211,238,0.4)',
          }}
        >
          MASTER
        </span>
      </h1>

      <p
        className="font-orbitron text-[10px] sm:text-xs tracking-[0.25em] uppercase mb-20"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {t('intro_subtitle')}
      </p>

      <button
        onClick={(e) => { e.stopPropagation(); stopAndGo(); }}
        onPointerDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.97)'; }}
        onPointerUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        onPointerCancel={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        className="font-arcade text-lg sm:text-xl px-16 py-7 rounded-2xl transition-transform duration-100"
        style={{
          backgroundColor: 'transparent',
          color: '#a855f7',
          border: '2px solid #a855f7',
          boxShadow:
            '0 0 12px rgba(168,85,247,0.6), 0 0 40px rgba(168,85,247,0.25), inset 0 0 16px rgba(168,85,247,0.12)',
          textShadow: '0 0 8px rgba(168,85,247,0.5)',
        }}
      >
        {t('intro_start')}
      </button>
    </div>
  );
};

export default IntroScreen;
