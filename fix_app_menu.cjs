const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const badInjectionTarget = `                    <button onClick={() => { setCurrentPage('home'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'home' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <BookOpen size={14} /> Home
                    </button>
          {currentPage === 'community' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CommunityFeed onViewProfile={(id) => { setViewingProfileId(id); setCurrentPage('profile'); }} />
            </div>
          )}

          {currentPage === 'profile' && viewingProfileId && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <UserProfile userId={viewingProfileId} onBack={() => { setCurrentPage('community'); setViewingProfileId(null); }} />
            </div>
          )}

                    <button onClick={() => { setCurrentPage('community'); setIsNavMenuOpen(false); }}`;

const replacement = `                    <button onClick={() => { setCurrentPage('home'); setIsNavMenuOpen(false); }} className={\`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 \${currentPage === 'home' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}\`}>
                      <BookOpen size={14} /> Home
                    </button>
                    <button onClick={() => { setCurrentPage('community'); setIsNavMenuOpen(false); }}`;

content = content.replace(badInjectionTarget, replacement);
fs.writeFileSync('src/App.tsx', content);
