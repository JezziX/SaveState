const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Add pushReview function
const pushReviewCode = `
  const pushReview = async (review: BookReview, bookTitle: string, bookCover: string) => {
    if (!session) return;
    try {
      await supabase.from('public_reviews').upsert({
        id: session.user.id + '_' + review.bookId,
        user_id: session.user.id,
        media_id: review.bookId,
        media_title: bookTitle,
        media_cover_url: bookCover,
        rating: review.rating,
        review_text: review.notes,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error(e);
    }
  };
`;

app = app.replace(
  "const pushSavePoint = async (sp: any) => {",
  pushReviewCode + "\n  const pushSavePoint = async (sp: any) => {"
);

fs.writeFileSync('src/App.tsx', app);
