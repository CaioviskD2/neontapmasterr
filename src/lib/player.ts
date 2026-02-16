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
    console.error('Error registering nickname:', error);
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
    .select('*')
    .eq('nickname', nickname)
    .maybeSingle();

  if (error) {
    console.error('Error fetching player profile:', error);
    return null;
  }
  return data;
};

// Link Google account to current device player
export const linkGoogleAccount = async (userId: string): Promise<boolean> => {
  const deviceId = getDeviceId();
  const { data, error } = await supabase.rpc('link_google_account', {
    p_device_id: deviceId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error linking Google account:', error);
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
