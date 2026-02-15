import React from 'react';

interface Props {
  onStart: () => void;
}

const IntroScreen: React.FC<Props> = ({ onStart }) => {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-40 animate-fade-in"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      <h1
        className="font-arcade text-2xl sm:text-3xl md:text-4xl text-center leading-relaxed mb-2 animate-intro-glow"
        style={{
          color: '#a855f7',
        }}
      >
        NEON TAP
      </h1>
      <h1
        className="font-arcade text-3xl sm:text-4xl md:text-5xl text-center leading-relaxed mb-16 animate-intro-glow"
        style={{
          color: '#22d3ee',
        }}
      >
      MASTER
      </h1>

      <p
        className="font-orbitron text-xs sm:text-sm tracking-widest uppercase mb-16"
        style={{
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        Toque rápido. Suba no ranking.
      </p>

      <button
        onClick={onStart}
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
