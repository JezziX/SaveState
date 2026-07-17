const fs = require('fs');

let typesContent = fs.readFileSync('src/types.ts', 'utf8');
typesContent = typesContent.replace(`pinnedBadges?: { id: string, x: number, y: number, badgeId: string }[];`, `pinnedBadges?: { id: string, x: number, y: number, badgeId: string, shelfIdx: number }[];`);
fs.writeFileSync('src/types.ts', typesContent);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(`pinnedBadges={preferences.pinnedBadges || []}
                books={books}`, `pinnedBadges={preferences.pinnedBadges || []}
                unlockedBadges={preferences.unlockedBadges || []}
                onUpdatePinnedBadges={(badges) => handleUpdatePreferences({ pinnedBadges: badges })}
                books={books}`);
fs.writeFileSync('src/App.tsx', appContent);
