const fs = require('fs');
let content = fs.readFileSync('src/components/MediaLibrary.tsx', 'utf8');

const targetProps = `interface MediaLibraryProps {
  type: 'podcast' | 'movie' | 'tv';
  mediaItems: MediaItem[];
  mediaLogs: MediaLog[];
  mediaReviews: MediaReview[];
  onUpdateMediaItem: (item: MediaItem) => void;
  onRemoveMediaItem: (id: string) => void;
  onSaveReview: (review: MediaReview) => void;
  onAddMediaLog: (log: Omit<MediaLog, 'id'>) => void;
  onRemoveMediaLog: (logId: string) => void;
}`;

const replacementProps = `interface MediaLibraryProps {
  type: 'podcast' | 'movie' | 'tv';
  mediaItems: MediaItem[];
  mediaLogs: MediaLog[];
  mediaReviews: MediaReview[];
  savePoints?: SavePoint[];
  onAddSavePoint?: (savePoint: Omit<SavePoint, 'id' | 'created_at'>) => void;
  onTriggerRecap?: (mediaId: string) => void;
  onUpdateMediaItem: (item: MediaItem) => void;
  onRemoveMediaItem: (id: string) => void;
  onSaveReview: (review: MediaReview) => void;
  onAddMediaLog: (log: Omit<MediaLog, 'id'>) => void;
  onRemoveMediaLog: (logId: string) => void;
}`;

content = content.replace(targetProps, replacementProps);

const targetComp = `export function MediaLibrary({ 
  type, 
  mediaItems, 
  mediaLogs, 
  mediaReviews,
  onUpdateMediaItem, 
  onRemoveMediaItem,
  onSaveReview,
  onAddMediaLog,
  onRemoveMediaLog
}: MediaLibraryProps) {`;

const replacementComp = `export function MediaLibrary({ 
  type, 
  mediaItems, 
  mediaLogs, 
  mediaReviews,
  savePoints = [],
  onAddSavePoint,
  onTriggerRecap,
  onUpdateMediaItem, 
  onRemoveMediaItem,
  onSaveReview,
  onAddMediaLog,
  onRemoveMediaLog
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

content = content.replace(targetComp, replacementComp);

// Add quick save UI to the item cards
const targetCard = `<button onClick={(e) => { e.stopPropagation(); onRemoveMediaItem(item.id); }} className="absolute top-1 right-1 p-1 bg-black/80 rounded text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20">
                        <Trash2 size={10} />
                      </button>`;

const replacementCard = `<div className="absolute top-1 right-1 flex flex-col gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setQuickSaveId(item.id); }} className="p-1 bg-black/80 rounded text-brand-turquoise hover:text-brand-purple cursor-pointer">
                          <Bookmark size={10} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onRemoveMediaItem(item.id); }} className="p-1 bg-black/80 rounded text-red-400 hover:text-red-300 cursor-pointer">
                          <Trash2 size={10} />
                        </button>
                      </div>
                      
                      {quickSaveId === item.id && (
                        <div className="absolute inset-0 bg-app-base/95 backdrop-blur z-30 p-2 flex flex-col rounded-lg border border-brand-purple overflow-y-auto" onClick={e => e.stopPropagation()}>
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
                      )}`;

content = content.replace(targetCard, replacementCard);

// Add progress display on the spine text
const spineTarget = `<span className="text-[7px] sm:text-[9px] font-bold text-white tracking-widest font-display">{item.title}</span>`;
const spineReplacement = `<span className="text-[7px] sm:text-[9px] font-bold text-white tracking-widest font-display">{item.title}</span>
                          {(item.currentProgress || item.totalLength) && (
                            <span className="ml-2 text-[6px] sm:text-[7px] font-mono text-brand-purple opacity-80 tracking-wider">
                              [{item.currentProgress ? \`\${item.currentProgress}/\` : ''}{item.totalLength || '?'}]
                            </span>
                          )}`;
content = content.replace(spineTarget, spineReplacement);

// Make sure Save uses Bookmark since Save wasn't imported initially in MediaLibrary. I did add X.
if(content.indexOf('Tv') !== -1 && content.indexOf('Save') === -1) {
    content = content.replace('X } from', 'X, Save } from');
}

fs.writeFileSync('src/components/MediaLibrary.tsx', content);
