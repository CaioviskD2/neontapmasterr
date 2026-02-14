const MUSIC_VOLUME = 0.5;
const FADE_DURATION = 800; // ms

type Track = 'home' | 'game';

const tracks: Record<Track, string> = {
  home: '/audio/home-music.mp3',
  game: '/audio/game-music.mp3',
};

let currentTrack: Track | null = null;
let audio: HTMLAudioElement | null = null;
let fadeInterval: number | null = null;
let musicEnabled = typeof window !== 'undefined' ? localStorage.getItem('owt_sound') !== '0' : true;
let userInteracted = false;

export const setMusicEnabled = (enabled: boolean) => {
  musicEnabled = enabled;
  if (!enabled) {
    stopMusic();
  } else if (currentTrack) {
    // Re-enable: resume current track
    playTrack(currentTrack);
  }
};

export const getMusicEnabled = () => musicEnabled;

const fadeOut = (el: HTMLAudioElement): Promise<void> => {
  return new Promise((resolve) => {
    if (fadeInterval) clearInterval(fadeInterval);
    const step = el.volume / (FADE_DURATION / 30);
    fadeInterval = window.setInterval(() => {
      const next = el.volume - step;
      if (next <= 0.01) {
        el.volume = 0;
        el.pause();
        if (fadeInterval) clearInterval(fadeInterval);
        fadeInterval = null;
        resolve();
      } else {
        el.volume = next;
      }
    }, 30);
  });
};

const fadeIn = (el: HTMLAudioElement) => {
  el.volume = 0;
  el.play().catch(() => {});
  if (fadeInterval) clearInterval(fadeInterval);
  const step = MUSIC_VOLUME / (FADE_DURATION / 30);
  fadeInterval = window.setInterval(() => {
    const next = el.volume + step;
    if (next >= MUSIC_VOLUME) {
      el.volume = MUSIC_VOLUME;
      if (fadeInterval) clearInterval(fadeInterval);
      fadeInterval = null;
    } else {
      el.volume = next;
    }
  }, 30);
};

const playTrack = async (track: Track) => {
  if (!musicEnabled || !userInteracted) return;

  // If same track already playing, do nothing
  if (audio && currentTrack === track && !audio.paused) return;

  // Fade out current
  if (audio && !audio.paused) {
    await fadeOut(audio);
  }

  // Create or reuse audio element
  if (!audio || currentTrack !== track) {
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    audio = new Audio(tracks[track]);
    audio.loop = true;
    audio.volume = 0;
  }

  currentTrack = track;
  fadeIn(audio);
};

export const stopMusic = () => {
  if (audio && !audio.paused) {
    fadeOut(audio);
  }
};

export const playHomeMusic = () => {
  userInteracted = true;
  playTrack('home');
};

export const playGameMusic = () => {
  userInteracted = true;
  playTrack('game');
};

export const markUserInteracted = () => {
  userInteracted = true;
};
