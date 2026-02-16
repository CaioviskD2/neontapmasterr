import React, { useEffect, useState } from 'react';
import { fetchPlayerProfile } from '@/lib/player';
import { getNickname } from '@/lib/player';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { linkGoogleAccount } from '@/lib/player';
import { getHighScore } from '@/lib/storage';
import { ArrowLeft, Loader2, User } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const ProfileScreen: React.FC<Props> = ({ onBack }) => {
  const nickname = getNickname();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const highScore = getHighScore();

  useEffect(() => {
    const load = async () => {
      if (nickname) {
        const data = await fetchPlayerProfile(nickname);
        setProfile(data);
        setIsLinked(!!data?.user_id);
      }
      setLoading(false);
    };
    load();
  }, [nickname]);

  const handleLinkGoogle = async () => {
    setLinking(true);
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });

    if (error) {
      console.error('Google sign-in error:', error);
      setLinking(false);
      return;
    }

    // After redirect back, check for session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await linkGoogleAccount(session.user.id);
      setIsLinked(true);
    }
    setLinking(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] grid-bg">
        <Loader2 className="w-6 h-6 text-neon-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] grid-bg animate-float-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={onBack} className="p-2 rounded-full border border-border hover:border-neon-blue transition-colors">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-neon-green" />
          <h1 className="font-arcade text-xs neon-text-green">PROFILE</h1>
        </div>
      </div>

      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        {/* Nickname */}
        <div className="text-center mb-6">
          <p className="font-arcade text-[8px] text-muted-foreground mb-1">PLAYER</p>
          <p className="font-arcade text-lg neon-text-green">{nickname || 'NO NAME'}</p>
        </div>

        {/* High Score */}
        <div className="text-center mb-6">
          <p className="font-arcade text-[8px] text-muted-foreground mb-1">LOCAL HIGH SCORE</p>
          <p className="font-arcade text-lg neon-text-blue">{highScore}</p>
        </div>

        {/* Best Ranks */}
        {profile && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
              <p className="font-arcade text-[7px] text-muted-foreground mb-1">BEST MONTHLY</p>
              <p className="font-arcade text-sm neon-text-gold">
                {profile.best_monthly_rank ? `#${profile.best_monthly_rank}` : '—'}
              </p>
            </div>
            <div className="px-4 py-3 rounded-lg bg-secondary/50 border border-border/50 text-center">
              <p className="font-arcade text-[7px] text-muted-foreground mb-1">BEST ALL-TIME</p>
              <p className="font-arcade text-sm neon-text-blue">
                {profile.best_alltime_rank ? `#${profile.best_alltime_rank}` : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Medals */}
        {profile && (
          <div className="mb-6 px-4 py-4 rounded-lg bg-secondary/50 border border-border/50">
            <p className="font-arcade text-[8px] text-muted-foreground mb-3 text-center">MEDALS</p>
            <div className="flex items-center justify-center gap-5">
              <div className="text-center">
                <span className="text-2xl">🥇</span>
                <p className="font-arcade text-[10px] neon-text-gold mt-1">{profile.gold_count}</p>
              </div>
              <div className="text-center">
                <span className="text-2xl">🥈</span>
                <p className="font-arcade text-[10px] neon-text-silver mt-1">{profile.silver_count}</p>
              </div>
              <div className="text-center">
                <span className="text-2xl">🥉</span>
                <p className="font-arcade text-[10px] neon-text-bronze mt-1">{profile.bronze_count}</p>
              </div>
            </div>
            {(profile.monthly_champion_count > 0 || profile.top10_entry_count > 0) && (
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/30">
                {profile.monthly_champion_count > 0 && (
                  <span className="font-arcade text-[7px] neon-text-gold">
                    👑 CHAMPION ×{profile.monthly_champion_count}
                  </span>
                )}
                {profile.top10_entry_count > 0 && (
                  <span className="font-arcade text-[7px] neon-text-green">
                    ⭐ TOP 10 ×{profile.top10_entry_count}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Google Link */}
        {!isLinked && (
          <button
            onClick={handleLinkGoogle}
            disabled={linking}
            className="w-full py-3 rounded-lg font-arcade text-[9px] border border-neon-blue text-neon-blue hover:bg-neon-blue/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {linking ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {linking ? 'LINKING...' : '🔗 LINK GOOGLE ACCOUNT'}
          </button>
        )}
        {isLinked && (
          <p className="font-arcade text-[8px] neon-text-green text-center">✓ GOOGLE ACCOUNT LINKED</p>
        )}
      </div>
    </div>
  );
};

export default ProfileScreen;
