const fs = require('fs');
let content = fs.readFileSync('src/components/MediaDetailModal.tsx', 'utf8');

const t1 = `const [editStartDate, setEditStartDate] = useState(item.startDate || '');`;
const r1 = `const [editStartDate, setEditStartDate] = useState(item.startDate || '');
  const [editCurrentProgress, setEditCurrentProgress] = useState(item.currentProgress?.toString() || '');
  const [editTotalLength, setEditTotalLength] = useState(item.totalLength?.toString() || '');`;
content = content.replace(t1, r1);

const t2 = `startDate: editStartDate || undefined,`;
const r2 = `startDate: editStartDate || undefined,
      currentProgress: editCurrentProgress.trim() || undefined,
      totalLength: editTotalLength.trim() || undefined,`;
content = content.replace(t2, r2);

const t3 = `<div className="col-span-1">
                        <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Genre</label>`;
const r3 = `<div className="col-span-1">
                        <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Progress</label>
                        <input
                          type="text"
                          value={editCurrentProgress}
                          onChange={(e) => setEditCurrentProgress(e.target.value)}
                          placeholder="e.g. S2 E4"
                          className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden text-center"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Total Length</label>
                        <input
                          type="text"
                          value={editTotalLength}
                          onChange={(e) => setEditTotalLength(e.target.value)}
                          placeholder="e.g. 10 Episodes"
                          className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden text-center"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Genre</label>`;
content = content.replace(t3, r3);

fs.writeFileSync('src/components/MediaDetailModal.tsx', content);
