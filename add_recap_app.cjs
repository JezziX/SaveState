const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add import RecapModal
content = content.replace(`import { MediaLibrary } from './components/MediaLibrary';`, `import { MediaLibrary } from './components/MediaLibrary';\nimport { RecapModal } from './components/RecapModal';\nimport { SavePoint } from './types';`);

// Add savePoints state
content = content.replace(`const [mediaReviews, setMediaReviews] = useState<MediaReview[]>(() => {
    const saved = localStorage.getItem('bt_media_reviews');
    return saved ? JSON.parse(saved) : [];
  });`, `const [mediaReviews, setMediaReviews] = useState<MediaReview[]>(() => {
    const saved = localStorage.getItem('bt_media_reviews');
    return saved ? JSON.parse(saved) : [];
  });
  const [savePoints, setSavePoints] = useState<SavePoint[]>(() => {
    const saved = localStorage.getItem('bt_save_points');
    return saved ? JSON.parse(saved) : [];
  });
  const [recapData, setRecapData] = useState<{ isOpen: boolean; mediaTitle: string; mediaId: string; } | null>(null);`);

// Update local storage save
content = content.replace(`localStorage.setItem('bt_media_reviews', JSON.stringify(mediaReviews));`, `localStorage.setItem('bt_media_reviews', JSON.stringify(mediaReviews));
    localStorage.setItem('bt_save_points', JSON.stringify(savePoints));`);

// Add RecapModal to render
content = content.replace(`{selectedBookId && (`, `{recapData && (
        <RecapModal
          isOpen={recapData.isOpen}
          onClose={() => setRecapData(null)}
          mediaTitle={recapData.mediaTitle}
          savePoints={savePoints.filter(p => p.mediaId === recapData.mediaId)}
        />
      )}
      {selectedBookId && (`);

// Function to handle reading log status change and trigger recap
content = content.replace(`setReadingLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));`, `setReadingLogs(prev => {
      const oldLog = prev.find(l => l.id === updatedLog.id);
      if (oldLog && (oldLog.status === 'completed' || oldLog.status === 'backlog') && updatedLog.status === 'active') {
        const book = books.find(b => b.id === updatedLog.bookId);
        if (book) {
          setRecapData({ isOpen: true, mediaTitle: book.title, mediaId: book.id });
        }
      }
      return prev.map(log => log.id === updatedLog.id ? updatedLog : log);
    });`);

// Update mediaLogs status change too (if they exist in App.tsx)
content = content.replace(`setMediaLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));`, `setMediaLogs(prev => {
      const oldLog = prev.find(l => l.id === updatedLog.id);
      if (oldLog && (oldLog.status === 'completed' || oldLog.status === 'backlog') && updatedLog.status === 'active') {
        const item = mediaItems.find(m => m.id === updatedLog.mediaId);
        if (item) {
          setRecapData({ isOpen: true, mediaTitle: item.title, mediaId: item.id });
        }
      }
      return prev.map(log => log.id === updatedLog.id ? updatedLog : log);
    });`);

fs.writeFileSync('src/App.tsx', content);
