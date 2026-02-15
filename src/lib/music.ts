/**
 * Central AudioManager – one track at a time, fade transitions, mobile-unlock.
 *
 * Track catalogue:
 *   intro, home, champion, musicgame1…musicgame10
 *
 * All mp3 files live in /audio/<name>.mp3
 */

const VOLUME = 0.5;
const FADE_MS = 600;

// ── track registry ──────────────────────────────────────────────
type TrackName =
  | 'intro'
  | 'home'
  | 'champion'
  | 'musicgame1' | 'musicgame2' | 'musicgame3' | 'musicgame4' | 'musicgame5'
  | 'musicgame6' | 'musicgame7' | 'musicgame8' | 'musicgame9' | 'musicgame10';

const trackPath = (name: TrackName) => `/audio/${name}.mp3`;

// ── state ───────────────────────────────────────────────────────
let audio: HTMLAudioElement | null = null;
let currentTrack: TrackName | null = null;
let fadeTimer: number | null = null;
let userUnlocked = false;
let musicEnabled = typeof window !== 'undefined' ? localStorage.getItem('owt_sound') !== '0' : true;
let lastGameTrack: TrackName | null = null;

// ── helpers ─────────────────────────────────────────────────────
const clearFade = () => {
  if (fadeTimer !== null) { clearInterval(fadeTimer); fadeTimer = null; }
};

const fadeOut = (el: HTMLAudioElement): Promise<void> =>
  new Promise((resolve) => {
    clearFade();
    if (el.paused || el.volume === 0) { el.pause(); resolve(); return; }
    const step = el.volume / (FADE_MS / 25);
    fadeTimer = window.setInterval(() => {
      const next = el.volume - step;
      if (next <= 0.01) { el.volume = 0; el.pause(); clearFade(); resolve(); }
      else el.volume = next;
    }, 25);
  });

const fadeIn = (el: HTMLAudioElement, vol: number) => {
  clearFade();
  el.volume = 0;
  el.play().catch(() => {});
  const step = vol / (FADE_MS / 25);
  fadeTimer = window.setInterval(() => {
    const next = el.volume + step;
    if (next >= vol) { el.volume = vol; clearFade(); }
    else el.volume = next;
  }, 25);
};

// ── public API ──────────────────────────────────────────────────

/** Call on the very first user gesture (tap / click). */
export const markUserInteracted = () => { userUnlocked = true; };

export const setMusicEnabled = (enabled: boolean) => {
  musicEnabled = enabled;
  if (!enabled) stopMusic();
};

export const getMusicEnabled = () => musicEnabled;

/**
 * Play a named track. Fades out the previous one first.
 * `loop` defaults to true.
 */
export const playTrack = async (
  name: TrackName,
  { loop = true, volume = VOLUME }: { loop?: boolean; volume?: number } = {},
) => {
  if (!musicEnabled || !userUnlocked) return;

  // same track already playing → noop
  if (audio && currentTrack === name && !audio.paused) return;

  // fade out whatever is playing
  if (audio && !audio.paused) await fadeOut(audio);

  // destroy old element
  if (audio) { audio.pause(); audio.src = ''; }

  const el = new Audio(trackPath(name));
  el.loop = loop;
  audio = el;
  currentTrack = name;
  fadeIn(el, volume);
};

/** Hard-stop (with short fade). */
export const stopMusic = async () => {
  if (audio && !audio.paused) await fadeOut(audio);
  currentTrack = null;
};

// ── screen-specific helpers ─────────────────────────────────────

export const playIntroMusic  = () => playTrack('intro');
export const playHomeMusic   = () => playTrack('home');
export const playChampionMusic = () => playTrack('champion');

/** Picks a random game track, avoiding the one played last time. */
export const playGameMusic = () => {
  const pool: TrackName[] = [
    'musicgame1','musicgame2','musicgame3','musicgame4','musicgame5',
    'musicgame6','musicgame7','musicgame8','musicgame9','musicgame10',
  ];
  const candidates = pool.filter(t => t !== lastGameTrack);
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  lastGameTrack = pick;
  return playTrack(pick);
};
