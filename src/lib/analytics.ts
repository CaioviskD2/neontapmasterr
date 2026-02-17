// ============================================
// ANALYTICS MODULE
// ============================================
// Console logging in dev. Ready to plug Firebase Analytics later.
// When you have a Firebase project, install firebase and
// uncomment the Firebase init + logEvent calls below.
// ============================================

// import { initializeApp } from 'firebase/app';
// import { getAnalytics, logEvent as fbLogEvent } from 'firebase/analytics';
//
// const firebaseConfig = {
//   apiKey: "...",
//   authDomain: "...",
//   projectId: "...",
//   storageBucket: "...",
//   messagingSenderId: "...",
//   appId: "...",
//   measurementId: "...",
// };
//
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const isDev = import.meta.env.DEV;

type AnalyticsParams = Record<string, string | number | boolean | undefined>;

/**
 * Track an analytics event.
 * Logs to console in dev mode; sends to Firebase Analytics in production (when configured).
 */
export const trackEvent = (name: string, params?: AnalyticsParams): void => {
  if (isDev) {
    console.log(
      `%c[ANALYTICS] ${name}`,
      'color: #22d3ee; font-weight: bold;',
      params ?? ''
    );
  }

  // Firebase Analytics (uncomment when configured):
  // try { fbLogEvent(analytics, name, params); } catch {}
};

// ── Pre-defined event helpers ──────────────────────────────────

export const trackSessionStart = () =>
  trackEvent('session_start');

export const trackPlayStart = () =>
  trackEvent('play_start');

export const trackGameOver = (score: number) =>
  trackEvent('game_over', { score });

export const trackNewHighScore = (score: number) =>
  trackEvent('new_high_score', { score });

export const trackLeaderboardOpen = (tab?: string) =>
  trackEvent('leaderboard_open', { tab: tab ?? 'monthly' });

export const trackRankSubmitted = (nickname: string, score: number) =>
  trackEvent('rank_submitted', { nickname, score });

export const trackEnteredTop10 = (rank: number, score: number) =>
  trackEvent('entered_top10', { rank, score });

export const trackBecameWorld1 = (score: number) =>
  trackEvent('became_world_1', { score });

export const trackAdInterstitialShown = () =>
  trackEvent('ad_interstitial_shown');

export const trackAdRewardedShown = () =>
  trackEvent('ad_rewarded_shown');

export const trackRewardContinueUsed = () =>
  trackEvent('reward_continue_used');
