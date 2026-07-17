const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const prefTarget = `return {
      fontFamily: 'sans',
      theme: (localStorage.getItem('bt_theme') as any) || 'jx',
      accentColor: 'indigo',
      showDailyGoal: true,
    };`;
const prefReplacement = `return {
      fontFamily: 'sans',
      theme: (localStorage.getItem('bt_theme') as any) || 'jx',
      accentColor: 'indigo',
      showDailyGoal: true,
      shelfSkin: 'Apothecary',
      unlockedBadges: [],
      pinnedBadges: [],
    };`;
content = content.replace(prefTarget, prefReplacement);

// Add Skin Switcher in the Header
const headerTarget = `</div>
        </header>`;
const headerReplacement = `<div className="flex items-center gap-3">
              <div className="relative group">
                <select 
                  value={preferences.shelfSkin || 'Apothecary'} 
                  onChange={e => handleUpdatePreferences({ shelfSkin: e.target.value })}
                  className="appearance-none bg-[#111] border border-[#333] text-[var(--color-text-main)] text-xs font-bold uppercase tracking-wider py-1.5 pl-3 pr-8 rounded-lg outline-none cursor-pointer hover:border-brand-purple transition-colors"
                >
                  <option value="Plain">Plain Skin</option>
                  <option value="Apothecary">Apothecary Skin</option>
                  <option value="Trophy Case">Trophy Case</option>
                  <option value="Kitchen">Kitchen Skin</option>
                  <option value="Spooky">Spooky Skin</option>
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </header>`;
content = content.replace(headerTarget, headerReplacement);

// Update <MyLibrary /> call to pass shelfSkin and pinned badges
const myLibTarget = `<MyLibrary 
                books={books} 
                readingLogs={readingLogs} 
                reviews={reviews}
                onUpdateBook={handleUpdateBook} 
                onRemoveBook={handleRemoveBook} 
                onSaveReview={handleSaveReview}
                onAddReadingLog={handleAddReadingLog}
                onRemoveReadingLog={handleRemoveReadingLog}
                theme={theme}
              />`;

const myLibReplacement = `<MyLibrary 
                books={books} 
                readingLogs={readingLogs} 
                reviews={reviews}
                shelfSkin={preferences.shelfSkin || 'Apothecary'}
                pinnedBadges={preferences.pinnedBadges || []}
                onUpdateBook={handleUpdateBook} 
                onRemoveBook={handleRemoveBook} 
                onSaveReview={handleSaveReview}
                onAddReadingLog={handleAddReadingLog}
                onRemoveReadingLog={handleRemoveReadingLog}
                theme={theme}
              />`;

content = content.replace(myLibTarget, myLibReplacement);

fs.writeFileSync('src/App.tsx', content);
