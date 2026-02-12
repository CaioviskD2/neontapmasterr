// ============================================
// AD INTEGRATION PLACEHOLDERS
// ============================================
// For Web: Integrate Google AdSense
// For APK: Integrate Google AdMob via Capacitor plugin
// ============================================

let gamesPlayed = parseInt(localStorage.getItem('owt_games_played') || '0', 10);

export const incrementGamesPlayed = () => {
  gamesPlayed++;
  localStorage.setItem('owt_games_played', String(gamesPlayed));
};

export const getGamesPlayed = () => gamesPlayed;

/**
 * Show interstitial ad every 2 games.
 * TODO: Replace with actual ad SDK call.
 * - Web: Google AdSense interstitial
 * - APK: AdMob interstitial via @capacitor-community/admob
 */
export const showInterstitialAd = (): Promise<boolean> => {
  if (gamesPlayed > 0 && gamesPlayed % 2 === 0) {
    console.log('[AD] Interstitial ad would show here (game #' + gamesPlayed + ')');
    // return AdMob.showInterstitial();
  }
  return Promise.resolve(false);
};

/**
 * Show rewarded ad to continue game.
 * TODO: Replace with actual ad SDK call.
 * - Web: Google AdSense rewarded
 * - APK: AdMob rewarded via @capacitor-community/admob
 */
export const showRewardedAd = (): Promise<boolean> => {
  console.log('[AD] Rewarded ad would show here');
  // return AdMob.showRewardedAd();
  return Promise.resolve(false);
};
