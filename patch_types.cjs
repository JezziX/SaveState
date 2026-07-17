const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(
  `type: 'review' | 'completed' | 'active';`,
  `type: 'review' | 'completed' | 'active' | 'save_point';
  vibeEmoji?: string;
  savePointNotes?: string;`
);

// Add shelfSkin and badges to AppPreferences
if (!content.includes('shelfSkin?: string;')) {
    content = content.replace(
      `showDailyGoal: boolean;`,
      `showDailyGoal: boolean;
  shelfSkin?: string;
  unlockedBadges?: string[];
  pinnedBadges?: { id: string, x: number, y: number, badgeId: string }[];`
    );
}

fs.writeFileSync('src/types.ts', content);
