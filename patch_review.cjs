const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const orig = `
  const handleSaveReview = (updatedReview: BookReview) => {
    setReviews(prev => {
      const idx = prev.findIndex(r => r.bookId === updatedReview.bookId);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = updatedReview;
        return copy;
      }
      return [...prev, updatedReview];
    });
  };
`;

const replace = `
  const handleSaveReview = (updatedReview: BookReview) => {
    setReviews(prev => {
      const idx = prev.findIndex(r => r.bookId === updatedReview.bookId);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = updatedReview;
        return copy;
      }
      return [...prev, updatedReview];
    });
    const book = books.find(b => b.id === updatedReview.bookId);
    if (book) {
      pushReview(updatedReview, book.title, book.coverUrl);
    }
  };
`;

app = app.replace(orig.trim(), replace.trim());
fs.writeFileSync('src/App.tsx', app);
