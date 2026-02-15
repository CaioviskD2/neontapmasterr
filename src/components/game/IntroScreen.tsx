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

      <button
        onClick={onStart}
        className="font-arcade text-base sm:text-lg px-12 py-5 rounded-xl active:scale-[0.97] transition-transform duration-100"
        style={{
          backgroundColor: '#a855f7',
          color: '#0A0A0A',
          boxShadow: '0 0 20px rgba(168,85,247,0.6), 0 0 60px rgba(168,85,247,0.3)',
        }}
      >
        TAP TO START
      </button>
    </div>
  );
};

export default IntroScreen;
