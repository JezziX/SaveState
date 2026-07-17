const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<MyLibrary
                theme={theme}
                books={books}
                readingLogs={readingLogs}
                reviews={reviews}
                onSelectBook={setSelectedBookId}`;

const replacement = `<MyLibrary
                theme={theme}
                shelfSkin={preferences.shelfSkin || 'Apothecary'}
                pinnedBadges={preferences.pinnedBadges || []}
                books={books}
                readingLogs={readingLogs}
                reviews={reviews}
                onSelectBook={setSelectedBookId}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
