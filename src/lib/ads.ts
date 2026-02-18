// ============================================
// AD MANAGER — Interface Layer
// ============================================
// Web:  Integrate Google AdSense
//       - Banner: <ins class="adsbygoogle"> in AdBanner component
//       - Interstitial: AdSense auto ads or custom overlay
//       - Rewarded: Not natively supported; use rewarded web ads API or skip
//
// APK:  Integrate Google AdMob via Capacitor
//       - Install: @capacitor-community/admob
//       - Banner: AdMob.showBanner()
//       - Interstitial: AdMob.showInterstitial()
//       - Rewarded: AdMob.showRewardedAd()
// ============================================

import { trackAdInterstitialShown, trackAdRewardedShown } from '@/lib/analytics';

// --- Game counter ---
let gamesPlayed = parseInt(localStorage.getItem('owt_games_played') || '0', 10);

export const incrementGamesPlayed = () => {
  gamesPlayed++;
  localStorage.setItem('owt_games_played', String(gamesPlayed));
};

export const getGamesPlayed = () => gamesPlayed;

// ============================================
// showInterstitial()
// Called after game over. Shows every 3 games, never on the first.
// ============================================
// WEB:  Replace body with AdSense interstitial or overlay ad
// APK:  await AdMob.showInterstitial();
// ============================================
export const showInterstitialAd = async (): Promise<boolean> => {
  // Never on first game, then every 3 games
  if (gamesPlayed <= 1 || gamesPlayed % 3 !== 0) {
    return false;
  }

  console.log(`[AD] 🎬 Interstitial ad — game #${gamesPlayed}`);
  trackAdInterstitialShown();

  // TODO: Replace with actual SDK call
  // WEB:  Show AdSense interstitial overlay
  // APK:  return AdMob.showInterstitial();
  return Promise.resolve(true);
};

// ============================================
// showRewarded()
// Called when player taps "CONTINUE" button on GameOver.
// Returns true if reward was granted (player watched full ad).
// ============================================
// WEB:  Rewarded ads not standard in AdSense; consider video ad overlay
// APK:  const result = await AdMob.showRewardedAd();
//       return result.type === 'earned';
// ============================================
export const showRewardedAd = async (): Promise<boolean> => {
  console.log('[AD] 🎁 Rewarded ad shown — player wants to continue');
  trackAdRewardedShown();

  // TODO: Replace with actual SDK call
  // For now, simulate a successful reward (user "watched" the ad)
  // In production: only return true if user completed the ad
  return new Promise((resolve) => {
    // Simulate ad duration (2s placeholder)
    setTimeout(() => resolve(true), 2000);
  });
};

// ============================================
// showBanner()
// Called when Home or Leaderboard screen mounts.
// Should display a banner at the bottom of the screen.
// ============================================
// WEB:  Render <ins class="adsbygoogle"> in the AdBanner component
// APK:  await AdMob.showBanner({ adId: 'ca-app-pub-xxx', position: 'BOTTOM_CENTER' });
// ============================================
let bannerVisible = false;

export const showBanner = (): void => {
  if (bannerVisible) return;
  bannerVisible = true;
  console.log('[AD] 📢 Banner shown');

  // TODO: Replace with actual SDK call
  // WEB:  AdSense banner is handled by AdBanner React component
  // APK:  AdMob.showBanner({ adId: '...', position: 'BOTTOM_CENTER', isTesting: true });
};

export const hideBanner = (): void => {
  if (!bannerVisible) return;
  bannerVisible = false;
  console.log('[AD] 📢 Banner hidden');

  // TODO: Replace with actual SDK call
  // APK:  AdMob.hideBanner();
};

export const isBannerVisible = () => bannerVisible;
