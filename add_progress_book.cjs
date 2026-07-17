const fs = require('fs');
let content = fs.readFileSync('src/components/BookDetailModal.tsx', 'utf8');

// Add states
const t1 = `const [editPages, setEditPages] = useState(book.pages?.toString() || '');`;
const r1 = `const [editPages, setEditPages] = useState(book.pages?.toString() || '');
  const [editCurrentProgress, setEditCurrentProgress] = useState(book.currentProgress?.toString() || '');
  const [editTotalLength, setEditTotalLength] = useState(book.totalLength?.toString() || '');`;
content = content.replace(t1, r1);

const t2 = `setEditPages(book.pages?.toString() || '');`;
const r2 = `setEditPages(book.pages?.toString() || '');
    setEditCurrentProgress(book.currentProgress?.toString() || '');
    setEditTotalLength(book.totalLength?.toString() || '');`;
content = content.replace(t2, r2);

const t3 = `setEditPages(overwritten.pages?.toString() || '');`;
const r3 = `setEditPages(overwritten.pages?.toString() || '');
    setEditCurrentProgress(overwritten.currentProgress?.toString() || '');
    setEditTotalLength(overwritten.totalLength?.toString() || '');`;
content = content.replace(t3, r3);

const t4 = `pages: editPages ? parseInt(editPages, 10) : undefined,`;
const r4 = `pages: editPages ? parseInt(editPages, 10) : undefined,
      currentProgress: editCurrentProgress.trim() || undefined,
      totalLength: editTotalLength.trim() || undefined,`;
content = content.replace(t4, r4);

const t5 = `<div className="col-span-1">
                      <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Pages</label>
                      <input
                        type="number"
                        min="1"
                        value={editPages}
                        onChange={(e) => setEditPages(e.target.value)}
                        placeholder="e.g. 240"
                        className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden text-center"
                      />
                    </div>`;

const r5 = `<div className="col-span-1">
                      <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Progress</label>
                      <input
                        type="text"
                        value={editCurrentProgress}
                        onChange={(e) => setEditCurrentProgress(e.target.value)}
                        placeholder="e.g. Ch 5"
                        className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden text-center"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Total Length</label>
                      <input
                        type="text"
                        value={editTotalLength}
                        onChange={(e) => setEditTotalLength(e.target.value)}
                        placeholder="e.g. 300 pages"
                        className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden text-center"
                      />
                    </div>`;
content = content.replace(t5, r5);

// Make grid col 3 -> col 4 maybe? or keep it responsive.
content = content.replace(`<div className="grid grid-cols-3 gap-3">`, `<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">`);

fs.writeFileSync('src/components/BookDetailModal.tsx', content);
