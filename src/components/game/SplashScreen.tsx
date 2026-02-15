import React, { useEffect, useState } from 'react';

interface Props {
  onComplete: () => void;
}

const SplashScreen: React.FC<Props> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 50);
    const t2 = setTimeout(() => setPhase('out'), 4000);
    const t3 = setTimeout(() => onComplete(), 4700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{
        backgroundColor: '#0A0A0A',
        opacity: phase === 'in' ? 0 : phase === 'out' ? 0 : 1,
        transition: 'opacity 500ms ease-in-out',
      }}
    >
      <h1
        className="font-orbitron text-4xl sm:text-5xl md:text-6xl font-black tracking-widest mb-3"
        style={{
          color: '#a855f7',
          textShadow: '0 0 20px rgba(168,85,247,0.8), 0 0 60px rgba(168,85,247,0.4), 0 0 100px rgba(168,85,247,0.2)',
        }}
      >
        SYRAX
      </h1>
      <p
        className="font-orbitron text-sm sm:text-base tracking-[0.3em] uppercase"
        style={{
          color: '#22d3ee',
          textShadow: '0 0 10px rgba(34,211,238,0.6), 0 0 30px rgba(34,211,238,0.3)',
        }}
      >
        Interactive Studios
      </p>
    </div>
  );
};

export default SplashScreen;
