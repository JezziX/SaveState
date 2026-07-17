const fs = require('fs');
let code = fs.readFileSync('src/components/BookDetailModal.tsx', 'utf8');

// Remove the mistakenly added lines block
const badBlock = `          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={\`flex-1 text-center py-2.5 text-[10px] uppercase tracking-widest font-bold border-b-2 transition-colors cursor-pointer \${activeTab === 'community' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}\`}
          >
            Community Feed
`;
code = code.split(badBlock).join('');
fs.writeFileSync('src/components/BookDetailModal.tsx', code);
