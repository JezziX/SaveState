const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const targetQuickSave = `  const handleQuickSave = (bookId: string) => {
    if (!quickSaveData.milestone && !quickSaveData.notes) return;
    onAddSavePoint?.({
      mediaId: bookId,
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
      raw_brain_drop: quickSaveData.notes
    });
    setQuickSaveId(null);
    setQuickSaveData({ milestone: '', notes: '' });
  };`;
content = content.replace(targetQuickSave, replacementQuickSave);

fs.writeFileSync('src/components/MyLibrary.tsx', content);

console.log("Patched props for quicksave notes/raw_brain_drop mismatch.");
