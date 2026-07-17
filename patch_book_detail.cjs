const fs = require('fs');
let content = fs.readFileSync('src/components/BookDetailModal.tsx', 'utf8');

const target1 = `onUpdateBook: (book: Book) => void;
}`;
const replacement1 = `onUpdateBook: (book: Book) => void;
  onTriggerRecap?: (mediaId: string) => void;
}`;
content = content.replace(target1, replacement1);

const target2 = `onDeleteBook,
  onUpdateBook
}: BookDetailModalProps) {`;
const replacement2 = `onDeleteBook,
  onUpdateBook,
  onTriggerRecap
}: BookDetailModalProps) {`;
content = content.replace(target2, replacement2);

// Add TV icon for the recap button
content = content.replace(`Trash2 } from 'lucide-react';`, `Trash2, Tv } from 'lucide-react';`);

const target3 = `{/* Main Info Actions */}`;
const replacement3 = `{/* Main Info Actions */}
                {onTriggerRecap && (
                  <button
                    onClick={() => onTriggerRecap(book.id)}
                    className="w-full mt-2 flex items-center justify-center gap-2 bg-brand-turquoise/10 text-brand-turquoise border border-brand-turquoise/30 hover:bg-brand-turquoise hover:text-[#000] py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Tv size={14} />
                    View Recap
                  </button>
                )}`;
content = content.replace(target3, replacement3);

fs.writeFileSync('src/components/BookDetailModal.tsx', content);
