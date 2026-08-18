// Player identity system using Device UUID + optional Google link
import { supabase } from '@/integrations/supabase/client';

const DEVICE_ID_KEY = 'owt_device_id';
const NICKNAME_KEY = 'owt_nickname';

// Generate or retrieve a persistent device UUID
export const getDeviceId = (): string => {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
};

// Get stored nickname
export const getNickname = (): string | null => {
  return localStorage.getItem(NICKNAME_KEY);
};

// Register nickname (atomic server-side check)
export const registerNickname = async (nickname: string): Promise<{ success: boolean; reason?: string }> => {
  const deviceId = getDeviceId();
  const { data, error } = await supabase.rpc('register_nickname', {
    p_nickname: nickname,
    p_device_id: deviceId,
  });

  if (error) {
    if (import.meta.env.DEV) console.error('Error registering nickname:', error);
    return { success: false, reason: 'server_error' };
  }

  const result = data as { success: boolean; reason?: string; already_owned?: boolean };
  if (result.success) {
    localStorage.setItem(NICKNAME_KEY, nickname.trim());
  }
  return result;
};

// Fetch player profile from DB
export const fetchPlayerProfile = async (nickname: string) => {
  const { data, error } = await supabase
    .from('players')
    .select('nickname, gold_count, silver_count, bronze_count, monthly_champion_count, top10_entry_count, best_monthly_rank, best_alltime_rank, updated_at, settings')
    .eq('nickname', nickname)
    .maybeSingle();

  if (error) {
    if (import.meta.env.DEV) console.error('Error fetching player profile:', error);
    return null;
  }
  return data;
};

// Check whether this device is already linked to a Google account
export const isDeviceLinked = async (): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_device_linked', { p_device_id: getDeviceId() });
  if (error) {
    if (import.meta.env.DEV) console.error('Error checking device link:', error);
    return false;
  }
  return !!data;
};

// Link Google account to current device player
export const linkGoogleAccount = async (userId: string): Promise<boolean> => {
  const deviceId = getDeviceId();
  const { data, error } = await supabase.rpc('link_google_account', {
    p_device_id: deviceId,
    p_user_id: userId,
  });

  if (error) {
    if (import.meta.env.DEV) console.error('Error linking Google account:', error);
    return false;
  }
  return (data as { success: boolean }).success;
};

// Check if player has a nickname set
export const hasNickname = (): boolean => {
  return !!getNickname();
};

// Validate nickname format
export const isValidNickname = (nickname: string): boolean => {
  const trimmed = nickname.trim();
  return trimmed.length >= 3 && trimmed.length <= 12 && /^[A-Za-z0-9_]+$/.test(trimmed);
};
