// Level 1-25 progression matrix for the Media Mastery / Binge Connoisseur
// system. Titles/perks unlock at these XP thresholds but are NOT
// auto-equipped - see the "manual loadout" note in AchievementsDashboard.

export interface LevelDef {
  level: number;
  xpRequired: number;
  title: string;
  perk?: string;
}

export const LEVEL_MATRIX: LevelDef[] = [
  { level: 1, xpRequired: 0, title: 'Content Rookie', perk: 'Starter Frame, Default Avatar' },
  { level: 2, xpRequired: 250, title: 'Backlog Dabbler', perk: 'Pin Slot 1 Unlocked' },
  { level: 3, xpRequired: 550, title: 'Media Sampler' },
  { level: 4, xpRequired: 1000, title: 'Media Hound' },
  { level: 5, xpRequired: 1750, title: 'Media Junkie', perk: 'Pin Slot 2 Unlocked' },
  { level: 6, xpRequired: 2750, title: 'Plot Fiend' },
  { level: 7, xpRequired: 4000, title: 'Volume Glutton' },
  { level: 8, xpRequired: 5500, title: 'Queue Obliterator' },
  { level: 9, xpRequired: 7500, title: 'Lore Aficionado' },
  { level: 10, xpRequired: 10000, title: 'Binge Connoisseur', perk: 'Pin Slot 3 Unlocked, Animated Shelf Skin' },
  { level: 11, xpRequired: 13000, title: 'Culture Purist' },
  { level: 12, xpRequired: 16500, title: 'Franchise Addict' },
  { level: 13, xpRequired: 20500, title: 'Catalog Slayer' },
  { level: 14, xpRequired: 25000, title: 'Lore Tastemaker' },
  { level: 15, xpRequired: 30000, title: 'Canon Snob', perk: 'Rare Profile Neon Accent' },
  { level: 16, xpRequired: 36000, title: 'Media Monarch' },
  { level: 17, xpRequired: 43000, title: 'Backlog Executioner' },
  { level: 18, xpRequired: 51000, title: 'Saga Vacuum' },
  { level: 19, xpRequired: 60000, title: 'Aesthetic Architect' },
  { level: 20, xpRequired: 70000, title: 'Binge Titan', perk: 'Custom Avatar Frame' },
  { level: 21, xpRequired: 81000, title: 'Omni-Devourer' },
  { level: 22, xpRequired: 93000, title: 'Dimension Destroyer' },
  { level: 23, xpRequired: 106000, title: 'Apex Binger' },
  { level: 24, xpRequired: 120000, title: 'Media Overlord' },
  { level: 25, xpRequired: 135000, title: 'Master SaveState Royalty', perk: 'Legendary Golden Glow Skin' },
];

export interface LevelInfo {
  level: number;
  title: string;
  perk?: string;
  currentXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null; // null at max level
  progressPct: number; // 0-100 toward next level
  nextTitle?: string;
}

export function getLevelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, totalXp);
  let current = LEVEL_MATRIX[0];
  let next: LevelDef | undefined;

  for (let i = 0; i < LEVEL_MATRIX.length; i++) {
    if (xp >= LEVEL_MATRIX[i].xpRequired) {
      current = LEVEL_MATRIX[i];
      next = LEVEL_MATRIX[i + 1];
    } else {
      break;
    }
  }

  const xpIntoLevel = xp - current.xpRequired;
  const xpForNextLevel = next ? next.xpRequired - current.xpRequired : null;
  const progressPct = xpForNextLevel ? Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100)) : 100;

  return {
    level: current.level,
    title: current.title,
    perk: current.perk,
    currentXp: xp,
    xpIntoLevel,
    xpForNextLevel,
    progressPct,
    nextTitle: next?.title,
  };
}
