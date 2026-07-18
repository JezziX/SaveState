const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const orig = `
                setReviews(prev => {
                  const existing = prev.find(r => r.bookId === updatedReview.bookId);
                  if (existing) {
                    return prev.map(r => r.bookId === updatedReview.bookId ? { ...r, rating } : r);
                  }
                  return [...prev, updatedReview];
                });
                setCompletedBookForCelebration(null);
`;

const replace = `
                setReviews(prev => {
                  const existing = prev.find(r => r.bookId === updatedReview.bookId);
                  if (existing) {
                    return prev.map(r => r.bookId === updatedReview.bookId ? { ...r, rating } : r);
                  }
                  return [...prev, updatedReview];
                });
                const book = books.find(b => b.id === updatedReview.bookId);
                if (book) {
                  pushReview(updatedReview, book.title, book.coverUrl);
                }
                setCompletedBookForCelebration(null);
`;

app = app.replace(orig.trim(), replace.trim());
fs.writeFileSync('src/App.tsx', app);
