const fs = require('fs');
let content = fs.readFileSync('src/components/QuoteDeck.tsx', 'utf8');

const t = `<p className="text-[10px] text-[var(--color-text-muted)] max-w-sm mt-1 leading-relaxed px-5">
            Try adjusting your search filters above, or submit custom standalone items via the "Add+" button to formulate a beautiful recall tray.
          </p>`;

const r = ``;

content = content.replace(t, r);
fs.writeFileSync('src/components/QuoteDeck.tsx', content);
