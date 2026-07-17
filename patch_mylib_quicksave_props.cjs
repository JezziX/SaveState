const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const targetProps = `  onAddReadingLog?: (log: Omit<ReadingLog, 'id'>) => void;`;
const replacementProps = `  onAddReadingLog?: (log: Omit<ReadingLog, 'id'>) => void;
  savePoints?: SavePoint[];
  onAddSavePoint?: (sp: Omit<SavePoint, 'id' | 'created_at'>) => void;`;
content = content.replace(targetProps, replacementProps);

const targetComp = `  onAddReadingLog
}: MyLibraryProps) {`;
const replacementComp = `  onAddReadingLog,
  savePoints = [],
  onAddSavePoint
}: MyLibraryProps) {`;
content = content.replace(targetComp, replacementComp);

const targetQuickSave = `  const handleQuickSave = (bookId: string) => {
    if (!quickSaveData.milestone && !quickSaveData.notes) return;
    onAddReadingLog?.({
      id: Date.now().toString(),
      bookId,
      date: new Date().toISOString(),
      milestone: quickSaveData.milestone,
      notes: quickSaveData.notes
    });
    setQuickSaveId(null);
    setQuickSaveData({ milestone: '', notes: '' });
  };`;

const replacementQuickSave = `  const handleQuickSave = (bookId: string) => {
    if (!quickSaveData.milestone && !quickSaveData.notes) return;
    onAddSavePoint?.({
      mediaId: bookId,
      milestone: quickSaveData.milestone,
      notes: quickSaveData.notes
    });
    setQuickSaveId(null);
    setQuickSaveData({ milestone: '', notes: '' });
  };`;
content = content.replace(targetQuickSave, replacementQuickSave);

fs.writeFileSync('src/components/MyLibrary.tsx', content);

// Update App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(`onAddReadingLog={handleAddReadingLog}
              />`, `onAddReadingLog={handleAddReadingLog}
                savePoints={savePoints}
                onAddSavePoint={(sp) => {
                  setSavePoints(prev => {
                    const next = [...prev, { ...sp, id: \`sp_\${Date.now()}\`, created_at: new Date().toISOString() }];
                    if (next.length >= 15) unlockBadge('lore-master');
                    return next;
                  });
                }}
              />`);
fs.writeFileSync('src/App.tsx', appContent);

console.log("Patched props for quicksave.");
