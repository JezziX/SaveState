const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const unlockFn = `
  const unlockBadge = (badgeId: string) => {
    if (!preferences.unlockedBadges?.includes(badgeId)) {
      handleUpdatePreferences({
        unlockedBadges: [...(preferences.unlockedBadges || []), badgeId]
      });
      // Optionally show a toast or celebration!
    }
  };
`;

content = content.replace(`const handleUpdatePreferences = (updates: Partial<AppPreferences>) => {`, unlockFn + `\n  const handleUpdatePreferences = (updates: Partial<AppPreferences>) => {`);

// Add Time Traveler check in onTriggerRecap
const targetRecap = `onTriggerRecap={(mediaId) => {
                  const item = mediaItems.find(m => m.id === mediaId) || books.find(b => b.id === mediaId);
                  if (item) setRecapData({ isOpen: true, mediaTitle: item.title, mediaId });
                }}`;
const replacementRecap = `onTriggerRecap={(mediaId) => {
                  const item = mediaItems.find(m => m.id === mediaId) || books.find(b => b.id === mediaId);
                  if (item) {
                    const itemSavePoints = savePoints.filter(sp => sp.mediaId === mediaId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    if (itemSavePoints.length > 0) {
                      const lastSpDate = new Date(itemSavePoints[0].created_at);
                      const threeMonthsAgo = new Date();
                      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                      if (lastSpDate < threeMonthsAgo) {
                        unlockBadge('time-traveler');
                      }
                    }
                    setRecapData({ isOpen: true, mediaTitle: item.title, mediaId });
                  }
                }}`;
content = content.replaceAll(targetRecap, replacementRecap);

// Add The Lore-Master check in onAddSavePoint
const targetAddSp = `onAddSavePoint={(sp) => setSavePoints(prev => [...prev, { ...sp, id: \`sp_\${Date.now()}\`, created_at: new Date().toISOString() }])}`;
const replacementAddSp = `onAddSavePoint={(sp) => {
                  setSavePoints(prev => {
                    const next = [...prev, { ...sp, id: \`sp_\${Date.now()}\`, created_at: new Date().toISOString() }];
                    if (next.length >= 15) unlockBadge('lore-master');
                    return next;
                  });
                }}`;
content = content.replaceAll(targetAddSp, replacementAddSp);

// Add Binge-Burnout check in handleUpdateBook
const targetUpdBook = `const handleUpdateBook = (updatedBook: Book) => {
    setBooks(prev => prev.map(book => book.id === updatedBook.id ? updatedBook : book));
  };`;
const replacementUpdBook = `const handleUpdateBook = (updatedBook: Book) => {
    setBooks(prev => prev.map(book => {
      if (book.id === updatedBook.id) {
        if (book.status === 'active' && updatedBook.status === 'dnf') {
          unlockBadge('binge-burnout');
        }
        return updatedBook;
      }
      return book;
    }));
  };`;
content = content.replace(targetUpdBook, replacementUpdBook);

// Add Binge-Burnout check in handleUpdateMediaItem
const targetUpdMedia = `const handleUpdateMediaItem = (updatedItem: MediaItem) => {
    setMediaItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };`;
const replacementUpdMedia = `const handleUpdateMediaItem = (updatedItem: MediaItem) => {
    setMediaItems(prev => prev.map(item => {
      if (item.id === updatedItem.id) {
        if (item.status === 'active' && updatedItem.status === 'dnf') {
          unlockBadge('binge-burnout');
        }
        return updatedItem;
      }
      return item;
    }));
  };`;
content = content.replace(targetUpdMedia, replacementUpdMedia);

fs.writeFileSync('src/App.tsx', content);
