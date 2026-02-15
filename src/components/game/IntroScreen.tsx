import React, { useEffect, useRef, useCallback } from 'react';

interface Props {
  onStart: () => void;
}

const vibrate = (ms: number) => {
  try { navigator?.vibrate?.(ms); } catch {}
};

const INTRO_VOLUME = 0.35;

const IntroScreen: React.FC<Props> = ({ onStart }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  const startMusic = useCallback(() => {
    if (audioRef.current || startedRef.current) return;
    startedRef.current = true;
    const a = new Audio('/audio/home-music.mp3');
    a.loop = true;
    a.volume = INTRO_VOLUME;
    a.play().catch(() => {});
    audioRef.current = a;
  }, []);

  const stopAndGo = useCallback(() => {
    vibrate(10);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    onStart();
  }, [onStart]);

  // Try autoplay on mount
  useEffect(() => {
    startMusic();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [startMusic]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-40 animate-fade-in"
      style={{ backgroundColor: '#0A0A0A' }}
      onClick={startMusic}
    >
      {/* Particle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-particle-float"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              backgroundColor: i % 2 === 0 ? 'rgba(168,85,247,0.4)' : 'rgba(34,211,238,0.3)',
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${6 + (i % 4) * 2}s`,
            }}
          />
        ))}
      </div>

      <h1
        className="font-arcade text-2xl sm:text-3xl md:text-4xl text-center leading-relaxed mb-2 animate-intro-glow"
        style={{ color: '#a855f7' }}
      >
        NEON TAP
      </h1>
      <h1
        className="font-arcade text-3xl sm:text-4xl md:text-5xl text-center leading-relaxed mb-2 animate-intro-glow"
        style={{ color: '#22d3ee' }}
      >
        MASTER
      </h1>

      <p
        className="font-orbitron text-xs sm:text-sm tracking-widest uppercase mb-16"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        Toque rápido. Suba no ranking.
      </p>

      <button
        onClick={(e) => { e.stopPropagation(); stopAndGo(); }}
        className="font-arcade text-base sm:text-lg px-14 py-6 rounded-2xl active:scale-[0.97] transition-transform duration-100"
        style={{
          backgroundColor: 'transparent',
          color: '#a855f7',
          border: '2px solid #a855f7',
          boxShadow: '0 0 20px rgba(168,85,247,0.5), 0 0 60px rgba(168,85,247,0.2), inset 0 0 20px rgba(168,85,247,0.15)',
        }}
      >
        TAP TO START
      </button>
    </div>
  );
};

export default IntroScreen;
