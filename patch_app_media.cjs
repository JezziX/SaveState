const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `onUpdateMediaItem={handleUpdateMediaItem} 
                onRemoveMediaItem={handleRemoveMediaItem} 
                onSaveReview={handleSaveMediaReview}
                onAddMediaLog={handleAddMediaLog}
                onRemoveMediaLog={handleRemoveMediaLog}
              />`;

const replacement1 = `savePoints={savePoints}
                onAddSavePoint={(sp) => setSavePoints(prev => [...prev, { ...sp, id: \`sp_\${Date.now()}\`, created_at: new Date().toISOString() }])}
                onTriggerRecap={(mediaId) => {
                  const item = mediaItems.find(m => m.id === mediaId) || books.find(b => b.id === mediaId);
                  if (item) setRecapData({ isOpen: true, mediaTitle: item.title, mediaId });
                }}
                onUpdateMediaItem={handleUpdateMediaItem} 
                onRemoveMediaItem={handleRemoveMediaItem} 
                onSaveReview={handleSaveMediaReview}
                onAddMediaLog={handleAddMediaLog}
                onRemoveMediaLog={handleRemoveMediaLog}
              />`;

// Replace all occurrences (there are 3: podcasts, movies, tv)
content = content.replaceAll(target1, replacement1);

fs.writeFileSync('src/App.tsx', content);
