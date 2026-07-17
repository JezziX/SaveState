const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<button onClick={() => { setCurrentPage('shelves'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'shelves' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                    <button onClick={() => { setCurrentPage('community'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'community' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Users size={14} /> Community Feed
                    </button>
                      <BookMarked size={14} /> Book Shelves
                    </button>
                    <button onClick={() => { setCurrentPage('podcasts'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'podcasts' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Headphones size={14} /> Podcast Vinyls
                    </button>
                    <button onClick={() => { setCurrentPage('movies'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'movies' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Film size={14} /> Movie DVDs
                    </button>
                    <button onClick={() => { setCurrentPage('tv'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'tv' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Tv size={14} /> TV Shows
                    </button>
                    <button onClick={() => { setCurrentPage('notebook'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'notebook' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Pencil size={14} /> Notebook
                    </button>
                    <button onClick={() => { setCurrentPage('quotes'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'quotes' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Quote size={14} /> Quote Deck
                    </button>
                    <button onClick={() => { setCurrentPage('achievements'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'achievements' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Trophy size={14} /> Achievements
                    </button>`;

const replacement = `<button onClick={() => { setCurrentPage('community'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'community' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Users size={14} /> Reviews
                    </button>
                    <button onClick={() => { setCurrentPage('shelves'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'shelves' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <BookMarked size={14} /> Books
                    </button>
                    <button onClick={() => { setCurrentPage('podcasts'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'podcasts' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Headphones size={14} /> Podcasts
                    </button>
                    <button onClick={() => { setCurrentPage('movies'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'movies' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Film size={14} /> Movies
                    </button>
                    <button onClick={() => { setCurrentPage('tv'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'tv' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Tv size={14} /> TV
                    </button>
                    <button onClick={() => { setCurrentPage('notebook'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'notebook' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Pencil size={14} /> Notes
                    </button>
                    <button onClick={() => { setCurrentPage('quotes'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'quotes' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Quote size={14} /> Quotes
                    </button>
                    <button onClick={() => { setCurrentPage('achievements'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'achievements' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <Trophy size={14} /> Save Points
                    </button>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content);
  console.log('Success');
} else {
  console.log('Target not found');
}
