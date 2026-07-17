const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

content = content.replace(`interface MyLibraryProps {
  theme?: 'jx' | 'neon' | 'pastel' | 'rainbow';
  books: Book[];`, `interface MyLibraryProps {
  theme?: 'jx' | 'neon' | 'pastel' | 'rainbow';
  shelfSkin?: string;
  pinnedBadges?: { id: string, x: number, y: number, badgeId: string }[];
  books: Book[];`);

content = content.replace(`export function MyLibrary({ 
  books, 
  readingLogs, 
  reviews, 
  onSelectBook, 
  onRemoveBook,
  onUpdateBook,
  onSaveReview,
  onBatchRemoveBooks,
  onBatchUpdateBooks,
  onAddReadingLog,
  onRemoveReadingLog,
  theme = 'jx',
}: MyLibraryProps) {`, `export function MyLibrary({ 
  books, 
  readingLogs, 
  reviews, 
  shelfSkin = 'Apothecary',
  pinnedBadges = [],
  onSelectBook, 
  onRemoveBook,
  onUpdateBook,
  onSaveReview,
  onBatchRemoveBooks,
  onBatchUpdateBooks,
  onAddReadingLog,
  onRemoveReadingLog,
  theme = 'jx',
}: MyLibraryProps) {`);

fs.writeFileSync('src/components/MyLibrary.tsx', content);
