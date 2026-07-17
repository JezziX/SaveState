const fs = require('fs');
let content = fs.readFileSync('src/components/MediaLibrary.tsx', 'utf8');

// Add props
const t1 = `interface MediaLibraryProps {
  type: 'podcast' | 'movie' | 'tv';
  theme?: string;
  items?: MediaItem[];
  logs?: MediaLog[];
  reviews?: MediaReview[];
  onSelectItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem?: (item: MediaItem) => void;
}`;

const r1 = `interface MediaLibraryProps {
  type: 'podcast' | 'movie' | 'tv';
  theme?: string;
  items?: MediaItem[];
  logs?: MediaLog[];
  reviews?: MediaReview[];
  savePoints?: SavePoint[];
  onAddSavePoint?: (savePoint: Omit<SavePoint, 'id' | 'created_at'>) => void;
  onTriggerRecap?: (mediaId: string) => void;
  onSelectItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem?: (item: MediaItem) => void;
}`;

content = content.replace(t1, r1);

const t2 = `export function MediaLibrary({
  type,
  theme = 'jx',
  items = [],
  logs = [],
  reviews = [],
  onSelectItem,
  onRemoveItem,
  onUpdateItem
}: MediaLibraryProps) {`;

const r2 = `export function MediaLibrary({
  type,
  theme = 'jx',
  items = [],
  logs = [],
  reviews = [],
  savePoints = [],
  onAddSavePoint,
  onTriggerRecap,
  onSelectItem,
  onRemoveItem,
  onUpdateItem
}: MediaLibraryProps) {
  const [quickSaveId, setQuickSaveId] = useState<string | null>(null);
  const [quickSaveData, setQuickSaveData] = useState({ milestone: '', notes: '' });

  const handleQuickSave = (mediaId: string) => {
    if (!onAddSavePoint) return;
    onAddSavePoint({
      mediaId,
      milestone: quickSaveData.milestone || 'N/A',
      raw_brain_drop: quickSaveData.notes || 'No notes'
    });
    setQuickSaveId(null);
    setQuickSaveData({ milestone: '', notes: '' });
  };
`;

content = content.replace(t2, r2);

// Add imports
if (content.indexOf('SavePoint') === -1) {
  content = content.replace(`import { MediaItem, MediaLog, MediaReview } from '../types';`, `import { MediaItem, MediaLog, MediaReview, SavePoint } from '../types';`);
}
content = content.replace(`import { Search, Grid, List, Plus, Trash2, Star, Play, CheckCircle2, Headphones, Film, Tv, SlidersHorizontal, ArrowUpDown } from 'lucide-react';`, `import { Search, Grid, List, Plus, Trash2, Star, Play, CheckCircle2, Headphones, Film, Tv, SlidersHorizontal, ArrowUpDown, Save, X } from 'lucide-react';`);

const t3 = `<button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveItem(item.id);
                            }}`;

const r3 = `<button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickSaveId(item.id);
                              setQuickSaveData({ milestone: '', notes: '' });
                            }}
                            className="p-1 px-1.5 bg-[#0f0e12] hover:bg-brand-purple/20 text-brand-turquoise hover:text-brand-purple border border-neutral-800 rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                            title="Quick Save Progress"
                          >
                            <Save size={10} />
                          </button>
                          
                          {quickSaveId === item.id && (
                        <div className="absolute inset-0 bg-app-base/95 backdrop-blur z-30 p-2 flex flex-col rounded-lg border border-brand-purple" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider">Quick Save</span>
                            <button onClick={() => setQuickSaveId(null)} className="text-gray-500 hover:text-white cursor-pointer"><X size={12} /></button>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Milestone (e.g. S2 E8)"
                            value={quickSaveData.milestone}
                            onChange={e => setQuickSaveData({...quickSaveData, milestone: e.target.value})}
                            className="w-full bg-black/50 border border-app-border rounded px-2 py-1 text-[10px] text-white mb-1 focus:outline-none focus:border-brand-purple"
                          />
                          <textarea 
                            placeholder="Brain drop / notes..."
                            value={quickSaveData.notes}
                            onChange={e => setQuickSaveData({...quickSaveData, notes: e.target.value})}
                            className="w-full flex-1 bg-black/50 border border-app-border rounded px-2 py-1 text-[10px] text-white mb-1 focus:outline-none focus:border-brand-purple resize-none"
                          />
                          <button 
                            onClick={() => handleQuickSave(item.id)}
                            className="w-full bg-brand-purple text-[#340F04] font-bold text-[10px] py-1 rounded cursor-pointer hover:bg-white"
                          >
                            Save Point
                          </button>
                        </div>
                      )}

<button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveItem(item.id);
                            }}`;

content = content.replace(t3, r3);

fs.writeFileSync('src/components/MediaLibrary.tsx', content);
