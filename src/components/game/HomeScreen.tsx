import React from 'react';
import { getHighScore } from '@/lib/storage';
import { getSoundEnabled, setSoundEnabled } from '@/lib/sounds';
import { setMusicEnabled, playHomeMusic, markUserInteracted } from '@/lib/music';
import { Volume2, VolumeX } from 'lucide-react';


interface Props {
  onPlay: () => void;
  onLeaderboard: () => void;
}

const HomeScreen: React.FC<Props> = ({ onPlay, onLeaderboard }) => {
  const [soundOn, setSoundOn] = React.useState(getSoundEnabled());
  const highScore = getHighScore();

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    setMusicEnabled(next);
    if (next) playHomeMusic();
  };

  // Start home music on mount
  React.useEffect(() => {
    markUserInteracted();
    playHomeMusic();
  }, []);

  const handlePlay = () => {
    onPlay();
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[100dvh] px-6 grid-bg animate-float-in overflow-hidden">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center animate-slow-zoom"
        style={{
          backgroundImage: `url(/images/bg_home_tech.ai)`,
          filter: 'blur(5px)',
          transform: 'scale(1.1)',
        }}
      />
      <div className="absolute inset-0 bg-black/60" />
      {/* Content layer */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full">
      {/* Sound toggle */}
      <button
        onClick={toggleSound}
        className="absolute top-4 right-4 p-3 rounded-full border border-border hover:border-neon-blue transition-colors"
        aria-label="Toggle sound">

        {soundOn ?
        <Volume2 className="w-5 h-5 text-neon-blue" /> :

        <VolumeX className="w-5 h-5 text-muted-foreground" />
        }
      </button>

      {/* Title */}
      <h1 className="font-arcade text-2xl sm:text-3xl md:text-4xl neon-text-green text-center leading-relaxed mb-2">
        ONE WRONG
      </h1>
      <h1 className="font-arcade text-3xl sm:text-4xl md:text-5xl neon-text-red text-center leading-relaxed mb-10">
        TAP
      </h1>

      {/* High Score */}
      {highScore > 0 &&
      <div className="mb-8 text-center animate-slide-down">
          <p className="font-arcade text-[10px] text-muted-foreground mb-1">HIGH SCORE</p>
          <p className="font-arcade text-lg neon-text-blue">{highScore}</p>
        </div>
      }

      {/* Buttons */}
      <button
        onClick={handlePlay}
        className="w-full max-w-[280px] py-4 px-8 rounded-lg font-arcade text-sm bg-neon-green text-background neon-glow-green hover:scale-105 active:scale-95 transition-transform mb-4">

        PLAY
      </button>

      <button
        onClick={onLeaderboard}
        className="w-full max-w-[280px] py-3 px-8 rounded-lg font-arcade text-[10px] border-2 border-neon-blue text-neon-blue hover:bg-neon-blue/10 active:scale-95 transition-all">

        LEADERBOARD
      </button>

      </div>
    </div>);

};

export default HomeScreen;