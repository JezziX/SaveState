const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const t1 = `interface MyLibraryProps {
  theme?: 'jx' | 'neon' | 'pastel' | 'rainbow';
  books: Book[];
  readingLogs: ReadingLog[];
  reviews: BookReview[];
  onSelectBook: (bookId: string) => void;
  onRemoveBook: (bookId: string) => void;
  onUpdateBook?: (book: Book) => void;
  onSaveReview?: (review: BookReview) => void;
  onBatchRemoveBooks?: (bookIds: string[]) => void;
  onBatchUpdateBooks?: (updatedBooks: Book[]) => void;
}`;

const r1 = `interface MyLibraryProps {
  theme?: 'jx' | 'neon' | 'pastel' | 'rainbow';
  books: Book[];
  readingLogs: ReadingLog[];
  reviews: BookReview[];
  savePoints?: SavePoint[];
  onAddSavePoint?: (savePoint: Omit<SavePoint, 'id' | 'created_at'>) => void;
  onTriggerRecap?: (mediaId: string) => void;
  onSelectBook: (bookId: string) => void;
  onRemoveBook: (bookId: string) => void;
  onUpdateBook?: (book: Book) => void;
  onSaveReview?: (review: BookReview) => void;
  onBatchRemoveBooks?: (bookIds: string[]) => void;
  onBatchUpdateBooks?: (updatedBooks: Book[]) => void;
}`;

content = content.replace(t1, r1);

const t2 = `export function MyLibrary({
  theme = 'jx',
  books,
  readingLogs,
  reviews,
  onSelectBook,
  onRemoveBook,
  onUpdateBook,
  onSaveReview,
  onBatchRemoveBooks,
  onBatchUpdateBooks
}: MyLibraryProps) {`;

const r2 = `export function MyLibrary({
  theme = 'jx',
  books,
  readingLogs,
  reviews,
  savePoints = [],
  onAddSavePoint,
  onTriggerRecap,
  onSelectBook,
  onRemoveBook,
  onUpdateBook,
  onSaveReview,
  onBatchRemoveBooks,
  onBatchUpdateBooks
}: MyLibraryProps) {`;

content = content.replace(t2, r2);

// Add SavePoint import if not present
if (content.indexOf('SavePoint') === -1 || (content.indexOf('SavePoint') > content.indexOf('export function MyLibrary'))) {
    content = content.replace(`import { Book, ReadingLog, BookReview } from '../types';`, `import { Book, ReadingLog, BookReview, SavePoint } from '../types';`);
}

fs.writeFileSync('src/components/MyLibrary.tsx', content);
