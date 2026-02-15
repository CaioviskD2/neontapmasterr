// Medal system - localStorage-based (no auth required)

export interface MedalData {
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  monthlyChampionCount: number;
  top10EntryCount: number;
  bestMonthlyRank: number;
  bestAllTimeRank: number;
  lastUpdatedMonth: string;
  // Flags to prevent duplicates within same month
  currentMonthMedal: 'gold' | 'silver' | 'bronze' | null;
  currentMonthTop10: boolean;
  currentMonthChampion: boolean;
}

const MEDAL_KEY = 'owt_medals';

const getDefaultMedals = (): MedalData => ({
  goldCount: 0,
  silverCount: 0,
  bronzeCount: 0,
  monthlyChampionCount: 0,
  top10EntryCount: 0,
  bestMonthlyRank: 0,
  bestAllTimeRank: 0,
  lastUpdatedMonth: '',
  currentMonthMedal: null,
  currentMonthTop10: false,
  currentMonthChampion: false,
});

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getMedals = (): MedalData => {
  try {
    const stored = localStorage.getItem(MEDAL_KEY);
    if (!stored) return getDefaultMedals();
    const data = JSON.parse(stored) as MedalData;
    
    // Reset monthly flags if month changed
    const currentMonth = getCurrentMonth();
    if (data.lastUpdatedMonth !== currentMonth) {
      data.currentMonthMedal = null;
      data.currentMonthTop10 = false;
      data.currentMonthChampion = false;
      data.lastUpdatedMonth = currentMonth;
      saveMedals(data);
    }
    return data;
  } catch {
    return getDefaultMedals();
  }
};

const saveMedals = (data: MedalData) => {
  localStorage.setItem(MEDAL_KEY, JSON.stringify(data));
};

export type MedalTier = 'gold' | 'silver' | 'bronze';

export interface MedalUpdateResult {
  newMedal: MedalTier | null;
  isNewTop10: boolean;
  isNewChampion: boolean;
}

export const getMedalForRank = (rank: number): MedalTier | null => {
  if (rank >= 1 && rank <= 10) return 'gold';
  if (rank >= 11 && rank <= 50) return 'silver';
  if (rank >= 51 && rank <= 100) return 'bronze';
  return null;
};

const MEDAL_PRIORITY: Record<MedalTier, number> = { gold: 3, silver: 2, bronze: 1 };

export const updateMedals = (monthlyRank: number, allTimeRank: number): MedalUpdateResult => {
  const medals = getMedals();
  const currentMonth = getCurrentMonth();
  medals.lastUpdatedMonth = currentMonth;

  const result: MedalUpdateResult = {
    newMedal: null,
    isNewTop10: false,
    isNewChampion: false,
  };

  // Update best ranks
  if (medals.bestMonthlyRank === 0 || monthlyRank < medals.bestMonthlyRank) {
    medals.bestMonthlyRank = monthlyRank;
  }
  if (medals.bestAllTimeRank === 0 || allTimeRank < medals.bestAllTimeRank) {
    medals.bestAllTimeRank = allTimeRank;
  }

  // Medal tier based on monthly rank
  const tier = getMedalForRank(monthlyRank);
  if (tier) {
    const currentPriority = medals.currentMonthMedal ? MEDAL_PRIORITY[medals.currentMonthMedal] : 0;
    const newPriority = MEDAL_PRIORITY[tier];

    if (newPriority > currentPriority) {
      // Upgrade medal: remove old, add new
      if (medals.currentMonthMedal) {
        // Undo previous medal count for this month
        if (medals.currentMonthMedal === 'gold') medals.goldCount = Math.max(0, medals.goldCount - 1);
        if (medals.currentMonthMedal === 'silver') medals.silverCount = Math.max(0, medals.silverCount - 1);
        if (medals.currentMonthMedal === 'bronze') medals.bronzeCount = Math.max(0, medals.bronzeCount - 1);
      }

      if (tier === 'gold') medals.goldCount++;
      if (tier === 'silver') medals.silverCount++;
      if (tier === 'bronze') medals.bronzeCount++;

      medals.currentMonthMedal = tier;
      result.newMedal = tier;
    }
  }

  // Top 10 entry (once per month)
  if (monthlyRank <= 10 && !medals.currentMonthTop10) {
    medals.currentMonthTop10 = true;
    medals.top10EntryCount++;
    result.isNewTop10 = true;
  }

  // Monthly Champion (once per month)
  if (monthlyRank === 1 && !medals.currentMonthChampion) {
    medals.currentMonthChampion = true;
    medals.monthlyChampionCount++;
    result.isNewChampion = true;
  }

  saveMedals(medals);
  return result;
};

export const getMedalEmoji = (tier: MedalTier): string => {
  switch (tier) {
    case 'gold': return '🥇';
    case 'silver': return '🥈';
    case 'bronze': return '🥉';
  }
};

export const getTotalMedals = (data: MedalData): number => {
  return data.goldCount + data.silverCount + data.bronzeCount;
};
