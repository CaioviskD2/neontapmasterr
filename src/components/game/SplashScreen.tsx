import React, { useEffect, useState } from 'react';
import { playIntroMusic, markUserInteracted } from '@/lib/music';

interface Props {
  onComplete: () => void;
}

const SplashScreen: React.FC<Props> = ({ onComplete }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    markUserInteracted();
    playIntroMusic();

    // fade-in after a frame
    const t0 = requestAnimationFrame(() => setVisible(true));
    // fade-out
    const t1 = setTimeout(() => setVisible(false), 2150);
    // done
    const t2 = setTimeout(() => onComplete(), 2500);
    return () => { cancelAnimationFrame(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      onClick={() => { markUserInteracted(); playIntroMusic(); }}
      style={{
        backgroundColor: '#0A0A0A',
        opacity: visible ? 1 : 0,
        transition: 'opacity 350ms ease-in-out',
      }}
    >
      <h1
        className="font-orbitron text-4xl sm:text-5xl md:text-6xl font-black tracking-widest mb-4 animate-splash-glow"
        style={{
          color: '#a855f7',
          textShadow:
            '0 0 8px rgba(168,85,247,0.9), 0 0 24px rgba(168,85,247,0.6), 0 0 60px rgba(168,85,247,0.35), 0 0 100px rgba(168,85,247,0.15)',
        }}
      >
        SYRAX
      </h1>
      <p
        className="font-orbitron text-sm sm:text-base tracking-[0.35em] uppercase"
        style={{
          color: '#22d3ee',
          textShadow: '0 0 8px rgba(34,211,238,0.7), 0 0 24px rgba(34,211,238,0.35)',
        }}
      >
        Interactive Studios
      </p>
    </div>
  );
};

export default SplashScreen;
