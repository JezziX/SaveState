const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const t1 = `<MyLibrary 
                theme={preferences.theme}
                books={books}
                readingLogs={readingLogs}
                reviews={reviews}
                onSelectBook={setSelectedBookId}
                onRemoveBook={handleRemoveBook}
                onUpdateBook={(b) => setBooks(prev => prev.map(old => old.id === b.id ? b : old))}
                onSaveReview={handleSaveReview}
                onBatchRemoveBooks={(ids) => {
                  setBooks(prev => prev.filter(b => !ids.includes(b.id)));
                  setReadingLogs(prev => prev.filter(log => !ids.includes(log.bookId)));
                  setReviews(prev => prev.filter(rev => !ids.includes(rev.bookId)));
                }}
              />`;

const r1 = `<MyLibrary 
                theme={preferences.theme}
                books={books}
                readingLogs={readingLogs}
                reviews={reviews}
                savePoints={savePoints}
                onAddSavePoint={(sp) => setSavePoints(prev => [...prev, { ...sp, id: \`sp_\${Date.now()}\`, created_at: new Date().toISOString() }])}
                onTriggerRecap={(mediaId) => {
                  const item = books.find(b => b.id === mediaId) || mediaItems.find(m => m.id === mediaId);
                  if (item) setRecapData({ isOpen: true, mediaTitle: item.title, mediaId });
                }}
                onSelectBook={setSelectedBookId}
                onRemoveBook={handleRemoveBook}
                onUpdateBook={(b) => setBooks(prev => prev.map(old => old.id === b.id ? b : old))}
                onSaveReview={handleSaveReview}
                onBatchRemoveBooks={(ids) => {
                  setBooks(prev => prev.filter(b => !ids.includes(b.id)));
                  setReadingLogs(prev => prev.filter(log => !ids.includes(log.bookId)));
                  setReviews(prev => prev.filter(rev => !ids.includes(rev.bookId)));
                }}
              />`;

content = content.replace(t1, r1);

// Handle MediaLibrary too
const t2 = `<MediaLibrary
                type={currentPage as 'podcast' | 'movie' | 'tv'}
                theme={preferences.theme}
                items={mediaItems}
                logs={mediaLogs}
                reviews={mediaReviews}
                onSelectItem={setSelectedMediaId}
                onRemoveItem={handleRemoveMedia}
                onUpdateItem={(m) => setMediaItems(prev => prev.map(old => old.id === m.id ? m : old))}
              />`;

const r2 = `<MediaLibrary
                type={currentPage as 'podcast' | 'movie' | 'tv'}
                theme={preferences.theme}
                items={mediaItems}
                logs={mediaLogs}
                reviews={mediaReviews}
                savePoints={savePoints}
                onAddSavePoint={(sp) => setSavePoints(prev => [...prev, { ...sp, id: \`sp_\${Date.now()}\`, created_at: new Date().toISOString() }])}
                onTriggerRecap={(mediaId) => {
                  const item = mediaItems.find(m => m.id === mediaId) || books.find(b => b.id === mediaId);
                  if (item) setRecapData({ isOpen: true, mediaTitle: item.title, mediaId });
                }}
                onSelectItem={setSelectedMediaId}
                onRemoveItem={handleRemoveMedia}
                onUpdateItem={(m) => setMediaItems(prev => prev.map(old => old.id === m.id ? m : old))}
              />`;

content = content.replace(t2, r2);

fs.writeFileSync('src/App.tsx', content);
