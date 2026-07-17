const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

// Add state
const importsTarget = `import { Book, ReadingLog, BookReview, SavePoint } from '../types';`;
const importsReplacement = `import { Book, ReadingLog, BookReview, SavePoint } from '../types';\nimport { Save } from 'lucide-react';`;
content = content.replace(importsTarget, importsReplacement);

const stateTarget = `const [activeTab, setActiveTab] = useState<StatusFilter>('all');`;
const stateReplacement = `const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [quickSaveId, setQuickSaveId] = useState<string | null>(null);
  const [quickSaveData, setQuickSaveData] = useState({ milestone: '', notes: '' });`;
content = content.replace(stateTarget, stateReplacement);

const saveFunc = `  const handleQuickSave = (bookId: string) => {
    if (!onAddSavePoint) return;
    onAddSavePoint({
      mediaId: bookId,
      milestone: quickSaveData.milestone || 'N/A',
      raw_brain_drop: quickSaveData.notes || 'No notes'
    });
    setQuickSaveId(null);
    setQuickSaveData({ milestone: '', notes: '' });
  };
`;

content = content.replace(`const filteredBooks = books.filter(b => {`, `${saveFunc}\n  const filteredBooks = books.filter(b => {`);

fs.writeFileSync('src/components/MyLibrary.tsx', content);
