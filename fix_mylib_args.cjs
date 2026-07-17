const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const target = `export function MyLibrary({
  theme = 'jx',
  books,
  readingLogs,
  reviews,
  onSelectBook,
  onRemoveBook,
  onUpdateBook,
  onSaveReview,
  onBatchRemoveBooks,
  onBatchUpdateBooks,
  onAddReadingLog
}: MyLibraryProps) {`;

const replacement = `export function MyLibrary({
  theme = 'jx',
  shelfSkin = 'Apothecary',
  pinnedBadges = [],
  unlockedBadges = [],
  onUpdatePinnedBadges,
  books,
  readingLogs,
  reviews,
  onSelectBook,
  onRemoveBook,
  onUpdateBook,
  onSaveReview,
  onBatchRemoveBooks,
  onBatchUpdateBooks,
  onAddReadingLog
}: MyLibraryProps) {`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/MyLibrary.tsx', content);
    console.log("Replaced signature.");
} else {
    console.log("Target not found!");
}
