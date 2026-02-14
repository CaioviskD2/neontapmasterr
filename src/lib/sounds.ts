const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

let soundEnabled = true;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
  localStorage.setItem('owt_sound', enabled ? '1' : '0');
};

export const getSoundEnabled = (): boolean => {
  const stored = localStorage.getItem('owt_sound');
  if (stored !== null) return stored === '1';
  return true;
};

const playTone = (freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) => {
  if (!soundEnabled || !audioCtx) return;
  // Resume context if suspended (mobile)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

export const playTapSound = () => {
  playTone(880, 0.1, 'square', 0.1);
  setTimeout(() => playTone(1320, 0.08, 'square', 0.08), 50);
};

export const playGameOverSound = () => {
  playTone(220, 0.3, 'sawtooth', 0.15);
  setTimeout(() => playTone(160, 0.4, 'sawtooth', 0.12), 200);
  setTimeout(() => playTone(100, 0.6, 'sawtooth', 0.1), 400);
};

export const playHighScoreSound = () => {
  [660, 880, 1100, 1320].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.15, 'square', 0.1), i * 100);
  });
};

export const playTop10Sound = () => {
  // Epic arcade victory fanfare
  const notes = [523, 659, 784, 1047, 784, 1047, 1319];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.2, 'square', 0.12), i * 80);
  });
  // Low bass accent
  setTimeout(() => playTone(130, 0.5, 'sawtooth', 0.1), 0);
  setTimeout(() => playTone(165, 0.5, 'sawtooth', 0.1), 300);
};

soundEnabled = getSoundEnabled();
