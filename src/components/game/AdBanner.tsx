import React, { useEffect } from 'react';
import { showBanner, hideBanner } from '@/lib/ads';

/**
 * AdBanner — Placeholder banner ad component.
 * Renders at the bottom of Home and Leaderboard screens.
 *
 * WEB INTEGRATION (Google AdSense):
 *   Replace the placeholder div with:
 *   <ins className="adsbygoogle"
 *        style={{ display: 'block' }}
 *        data-ad-client="ca-pub-XXXXXXXX"
 *        data-ad-slot="YYYYYYYY"
 *        data-ad-format="auto"
 *        data-full-width-responsive="true" />
 *   Then call (window as any).adsbygoogle?.push({}) in useEffect.
 *
 * APK INTEGRATION (AdMob):
 *   This component is not needed for APK — AdMob banner is native.
 *   Use showBanner()/hideBanner() from ads.ts directly.
 */
const AdBanner: React.FC = () => {
  useEffect(() => {
    showBanner();
    return () => hideBanner();
  }, []);

  return (
    <div className="w-full flex items-center justify-center py-2 bg-secondary/80 border-t border-border/50">
      {/* TODO: Replace with actual ad unit */}
      <div className="w-full max-w-[320px] h-[50px] rounded bg-secondary border border-border/30 flex items-center justify-center">
        <span className="font-arcade text-[7px] text-muted-foreground/50">AD SPACE</span>
      </div>
    </div>
  );
};

export default AdBanner;
