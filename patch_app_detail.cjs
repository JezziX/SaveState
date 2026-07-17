const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(`onUpdateBook={(b) => setBooks(prev => prev.map(old => old.id === b.id ? b : old))}
            />`, `onUpdateBook={(b) => setBooks(prev => prev.map(old => old.id === b.id ? b : old))}
              onTriggerRecap={(mediaId) => {
                  const item = books.find(b => b.id === mediaId) || mediaItems.find(m => m.id === mediaId);
                  if (item) setRecapData({ isOpen: true, mediaTitle: item.title, mediaId });
                }}
            />`);

content = content.replace(`onUpdateItem={(m) => setMediaItems(prev => prev.map(old => old.id === m.id ? m : old))}
          />`, `onUpdateItem={(m) => setMediaItems(prev => prev.map(old => old.id === m.id ? m : old))}
            onTriggerRecap={(mediaId) => {
              const item = mediaItems.find(m => m.id === mediaId) || books.find(b => b.id === mediaId);
              if (item) setRecapData({ isOpen: true, mediaTitle: item.title, mediaId });
            }}
          />`);

fs.writeFileSync('src/App.tsx', content);
