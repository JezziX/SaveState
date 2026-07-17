const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const targetState = `  const handleQuickSave = (bookId: string) => {
    // Basic implementation since it might have been missing.
    // If it relies on a passed prop, we might need to add it, but it seems to just call something.
    // Actually, looking at the UI, let's see what handleQuickSave does.
    console.log("Quick save for book", bookId);
    setQuickSaveId(null);
  };`;

const replacementState = `  const handleQuickSave = (bookId: string) => {
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

if (content.includes(targetState)) {
    content = content.replace(targetState, replacementState);
    fs.writeFileSync('src/components/MyLibrary.tsx', content);
    console.log("Fixed quicksave.");
} else {
    console.log("State target not found.");
}
