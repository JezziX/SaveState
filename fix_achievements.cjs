const fs = require('fs');
let content = fs.readFileSync('src/components/AchievementsDashboard.tsx', 'utf8');

const t = `          <h2 className="text-xl font-bold text-[var(--color-text-main)] font-display uppercase tracking-widest">
            Achievements
          </h2>
          <p className="text-[11px] text-[var(--color-text-muted)]">Track your reading legacy</p>`;

const r = `          <h2 className="text-xl font-bold text-[var(--color-text-main)] font-display uppercase tracking-widest">
            Save Points
          </h2>`;

content = content.replace(t, r);
fs.writeFileSync('src/components/AchievementsDashboard.tsx', content);
