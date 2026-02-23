import React, { useEffect, useState } from 'react';
import { getBadgeById } from '@/lib/badges';
import { t } from '@/i18n';

interface Props {
  badgeIds: string[];
  onComplete: () => void;
}

const BadgeUnlockedOverlay: React.FC<Props> = ({ badgeIds, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < badgeIds.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setVisible(false);
        setTimeout(onComplete, 300);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentIndex, badgeIds.length, onComplete]);

  const badge = getBadgeById(badgeIds[currentIndex]);
  if (!badge || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      style={{ animation: 'float-in 0.4s ease-out' }}
      onClick={() => {
        if (currentIndex < badgeIds.length - 1) {
          setCurrentIndex(i => i + 1);
        } else {
          setVisible(false);
          setTimeout(onComplete, 100);
        }
      }}
    >
      <div className="text-center animate-float-in">
        <p className="font-arcade text-[10px] neon-text-gold mb-4 animate-pulse-neon">
          {t('badge_unlocked_title')}
        </p>
        <div className="text-6xl mb-4" style={{ animation: 'top10-text-in 0.6s ease-out' }}>
          {badge.icon}
        </div>
        <p className="font-arcade text-sm neon-text-green mb-2">
          {t(badge.nameKey as any)}
        </p>
        <p className="font-orbitron text-xs text-muted-foreground">
          {t(badge.descKey as any)}
        </p>
      </div>
    </div>
  );
};

export default BadgeUnlockedOverlay;
