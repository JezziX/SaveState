const fs = require('fs');
let content = fs.readFileSync('src/components/BookDetailModal.tsx', 'utf8');

const target1 = `<label className="block text-[9px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                  Memory sentence & review notes
                </label>
                <p className="text-[10px] text-[var(--color-text-muted)] font-medium">
                  Write down a few sentences or keys about this reading for your older self to look back on.
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="The dialogue was profoundly moving. Key theme was the value of shared experiences... "`;

const replacement1 = `<label className="block text-[9px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes..."`;

content = content.replace(target1, replacement1);

const target2 = `<p className="text-[10px] text-[var(--color-text-muted)] max-w-sm mx-auto">These are public reviews from the community. Your private notes in the "Notes" tab remain hidden from other users.</p>`;
content = content.replace(target2, '');

fs.writeFileSync('src/components/BookDetailModal.tsx', content);
