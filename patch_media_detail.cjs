const fs = require('fs');
let content = fs.readFileSync('src/components/MediaDetailModal.tsx', 'utf8');

const target1 = `onUpdateItem: (item: MediaItem) => void;
}`;
const replacement1 = `onUpdateItem: (item: MediaItem) => void;
  onTriggerRecap?: (mediaId: string) => void;
}`;
content = content.replace(target1, replacement1);

const target2 = `onDeleteItem,
  onUpdateItem
}: MediaDetailModalProps) {`;
const replacement2 = `onDeleteItem,
  onUpdateItem,
  onTriggerRecap
}: MediaDetailModalProps) {`;
content = content.replace(target2, replacement2);

content = content.replace(`Trash2, CheckCircle2 } from 'lucide-react';`, `Trash2, CheckCircle2, Tv } from 'lucide-react';`);

const target3 = `{/* Action Buttons */}`;
const replacement3 = `{/* Action Buttons */}
                {onTriggerRecap && (
                  <button
                    onClick={() => onTriggerRecap(item.id)}
                    className="w-full mt-2 flex items-center justify-center gap-2 bg-brand-turquoise/10 text-brand-turquoise border border-brand-turquoise/30 hover:bg-brand-turquoise hover:text-[#000] py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Tv size={14} />
                    View Recap
                  </button>
                )}`;
content = content.replace(target3, replacement3);

fs.writeFileSync('src/components/MediaDetailModal.tsx', content);
