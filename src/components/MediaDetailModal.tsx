import React, { useState, useEffect } from 'react';
import { MediaItem, MediaLog, MediaReview } from '../types';
import { X, Star, Calendar, Plus, Trash2, Edit3, Loader2, Sparkles, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface MediaDetailModalProps {
  item: MediaItem;
  mediaLogs: MediaLog[];
  review: MediaReview | undefined;
  onClose: () => void;
  onSaveReview: (review: MediaReview) => void;
  onAddMediaLog: (log: Omit<MediaLog, 'id'>) => void;
  onRemoveMediaLog: (logId: string) => void;
  onUpdateMediaItem: (item: MediaItem) => void;
  onDeleteMedia?: (id: string) => void;
  onNextMedia?: () => void;
  onPrevMedia?: () => void;
}

export function MediaDetailModal({
  item,
  mediaLogs,
  review,
  onClose,
  onSaveReview,
  onAddMediaLog,
  onRemoveMediaLog,
  onUpdateMediaItem,
  onDeleteMedia,
  onNextMedia,
  onPrevMedia
}: MediaDetailModalProps) {
  const [rating, setRating] = useState(review?.rating || 0);
  const [notes, setNotes] = useState(review?.notes || '');
  const [activeTab, setActiveTab] = useState<'info' | 'review' | 'dates'>(
    (item.overview || (item.cast && item.cast.length > 0) || (item.episodes && item.episodes.length > 0) || item.description) ? 'info' : 'review'
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Manual Edit state properties populated from current media detail
  const [editTitle, setEditTitle] = useState(item.title);
  const [editCreator, setEditCreator] = useState(item.creator);
  const [editReleaseYear, setEditReleaseYear] = useState(item.releaseYear || '');
  const [editStartDate, setEditStartDate] = useState(item.startDate || '');
  const [editCurrentProgress, setEditCurrentProgress] = useState(item.currentProgress?.toString() || '');
  const [editTotalLength, setEditTotalLength] = useState(item.totalLength?.toString() || '');
  const [editEndDate, setEditEndDate] = useState(item.endDate || '');
  const [editGenre, setEditGenre] = useState(item.genre || '');
  const [editDidNotFinish, setEditDidNotFinish] = useState(item.didNotFinish || false);
  const [editCoverUrl, setEditCoverUrl] = useState(item.coverUrl || '');

  // Reset/re-sync edit state when selected item changes
  useEffect(() => {
    setEditTitle(item.title);
    setEditCreator(item.creator);
    setEditReleaseYear(item.releaseYear || '');
    setEditStartDate(item.startDate || '');
    setEditEndDate(item.endDate || '');
    setEditGenre(item.genre || '');
    setEditDidNotFinish(item.didNotFinish || false);
    setEditCoverUrl(item.coverUrl || '');
    setLogStartDate(item.startDate || new Date().toISOString().split('T')[0]);
    setLogEndDate(item.endDate || new Date().toISOString().split('T')[0]);
  }, [item]);

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMediaItem({
      ...item,
      title: editTitle,
      creator: editCreator,
      releaseYear: editReleaseYear,
      genre: editGenre,
      startDate: editStartDate || undefined,
      currentProgress: editCurrentProgress.trim() || undefined,
      totalLength: editTotalLength.trim() || undefined,
      endDate: editEndDate || undefined,
      didNotFinish: editDidNotFinish,
      coverUrl: editCoverUrl,
    });
    setSuccessMsg("Details Saved successfully!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSaveNotes = () => {
    onSaveReview({
      mediaId: item.id,
      rating,
      notes,
      updatedAt: new Date().toISOString()
    });
    setSuccessMsg("Review Saved.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const itemLogs = mediaLogs.filter(log => log.mediaId === item.id);

  // Default Quick Add Log setup
  const [logStatus, setLogStatus] = useState<'backlog' | 'active' | 'completed' | 'dnf'>('completed');
  const [logStartDate, setLogStartDate] = useState(item.startDate || new Date().toISOString().split('T')[0]);
  const [logEndDate, setLogEndDate] = useState(item.endDate || new Date().toISOString().split('T')[0]);

  const handleCreateLog = () => {
    onAddMediaLog({
      mediaId: item.id,
      startDate: logStatus === 'active' || logStatus === 'completed' ? logStartDate : undefined,
      endDate: logStatus === 'completed' ? logEndDate : new Date().toISOString().split('T')[0],
      status: logStatus,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-12">
      <div className="relative max-w-xl w-full flex justify-center items-center h-full max-h-[85vh]">
        {/* Left Navigation Arrow */}
        {onPrevMedia && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrevMedia(); }}
            className="absolute top-1/2 -translate-y-1/2 -left-4 sm:-left-16 z-50 p-2 sm:p-3 bg-[#1a0b2e]/90 hover:bg-brand-purple/20 border border-brand-purple/40 text-brand-purple hover:text-[#e9d5ff] rounded-full transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.7)] backdrop-blur-md"
            title="Previous"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="bg-app-base border border-app-border w-full rounded-xl overflow-hidden shadow-2xl flex flex-col h-full relative z-40"
        >
          {/* Banner/Header */}
          <div className="relative p-5 border-b border-app-border flex gap-4 bg-app-card">
            <div className="absolute top-4 right-4 flex items-center z-20">
              <button
                onClick={onClose}
                className="p-1.5 text-[var(--color-text-muted)] hover:text-white hover:bg-app-card rounded-md transition-colors cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-md overflow-hidden bg-black shadow-lg border border-app-border relative z-10">
              <img 
                referrerPolicy="no-referrer"
                src={item.coverUrl} 
                alt={item.title} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="flex-1 min-w-0 pr-8 z-10 flex flex-col justify-center">
              <h2 className="text-lg sm:text-xl font-bold text-white leading-tight font-display mb-1">{item.title}</h2>
              <p className="text-[var(--color-text-muted)] text-sm">{item.creator}</p>
              
              <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-[var(--color-text-muted)] font-medium">
                {item.releaseYear && <span>{item.releaseYear}</span>}
                {item.genre && (
                  <span className="px-2 py-0.5 bg-app-border/60 text-brand-purple rounded-full uppercase tracking-wider font-bold truncate max-w-[120px]">
                    {item.genre}
                  </span>
                )}
                {item.rating !== undefined && (
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Star size={10} className="fill-yellow-500" />
                    {item.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Tabs Menu */}
          <div className="flex items-center gap-1 bg-app-card p-1 border-b border-app-border">
            {(item.overview || item.description || (item.cast && item.cast.length > 0) || (item.episodes && item.episodes.length > 0)) && (
              <button 
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-colors ${activeTab === 'info' ? 'bg-app-border text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[#212127]'}`}
              >
                Info
              </button>
            )}
            <button 
              onClick={() => setActiveTab('review')}
              className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-colors ${activeTab === 'review' ? 'bg-app-border text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[#212127]'}`}
            >
              Review & Notes
            </button>
            <button 
              onClick={() => setActiveTab('dates')}
              className={`flex-1 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded transition-colors ${activeTab === 'dates' ? 'bg-app-border text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[#212127]'}`}
            >
              Manual Edit
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
            {successMsg && (
              <div className="mb-4 p-2 bg-brand-turquoise/10 border border-brand-turquoise/20 text-brand-turquoise text-xs rounded flex items-center justify-center gap-2">
                <Check size={14} /> {successMsg}
              </div>
            )}

            {/* TAB: Info */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                {(item.overview || item.description) && (
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Overview</h3>
                    <p className="text-sm text-[var(--color-text-main)] leading-relaxed bg-app-card p-3 rounded-md border border-app-border">
                      {item.overview || item.description}
                    </p>
                  </div>
                )}
                
                {item.cast && item.cast.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Cast</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {item.cast.slice(0, 10).map((actor, idx) => (
                        <div key={`${actor.id}-${idx}`} className="flex items-center gap-2 bg-app-card p-2 rounded-md border border-app-border">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-black shrink-0">
                            {actor.image ? (
                              <img src={actor.image} alt={actor.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex justify-center items-center text-[8px] text-[var(--color-text-muted)] bg-app-border">N/A</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{actor.name}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)] truncate">{actor.character}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.episodes && item.episodes.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Seasons</h3>
                    <div className="space-y-2">
                      {Object.entries(
                        item.episodes.reduce((acc: any, ep: any) => {
                          if (!acc[ep.season]) acc[ep.season] = [];
                          acc[ep.season].push(ep);
                          return acc;
                        }, {})
                      ).map(([season, eps]: [string, any]) => (
                        <div key={season} className="bg-app-card rounded-md border border-app-border overflow-hidden">
                          <div className="bg-app-border/50 p-2 text-xs font-bold text-[var(--color-text-main)]">
                            Season {season} ({eps.length} Episodes)
                          </div>
                          <div className="p-2 space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                            {eps.map((ep: any) => (
                              <div key={ep.id} className="flex items-center justify-between text-xs p-1 hover:bg-app-border rounded">
                                <span className="text-[var(--color-text-main)]"><span className="text-[var(--color-text-muted)] mr-2">{ep.number}.</span>{ep.title}</span>
                                {ep.aired && <span className="text-[10px] text-[var(--color-text-muted)]">{ep.aired.substring(0, 4)}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'review' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-hidden cursor-pointer"
                      >
                        <Star 
                          size={24} 
                          className={star <= rating ? "fill-brand-purple text-brand-purple" : "text-gray-600"} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">My Review & Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write your thoughts..."
                    className="w-full h-32 bg-[#141417] border border-app-border rounded-lg p-3 text-sm text-[var(--color-text-main)] focus:outline-hidden resize-none"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleSaveNotes}
                      className="px-4 py-1.5 bg-white text-black font-bold text-xs rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Save Review
                    </button>
                  </div>
                </div>

                {/* Reading Logs Viewer */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Consumption Log History</label>
                  </div>

                  {itemLogs.length === 0 ? (
                    <p className="text-xs text-gray-600 italic border border-dashed border-app-border p-3 rounded text-center">No logs recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {itemLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between bg-[#141417] border border-app-border p-2.5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar size={14} className="text-brand-turquoise" />
                            <div>
                              <p className="text-xs text-[var(--color-text-main)] font-medium capitalize">{log.status.replace('-', ' ')}</p>
                              <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
                                {log.startDate && log.endDate ? `${log.startDate} to ${log.endDate}` : log.endDate}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveMediaLog(log.id)}
                            className="p-1.5 text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                            title="Remove log"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New Log Form inline */}
                <div className="mt-4 p-4 border border-app-border bg-app-card rounded-lg">
                  <h4 className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-3 flex items-center gap-1.5">
                    <Plus size={12} /> Add Timeline Log
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[var(--color-text-muted)] mb-1.5">Status</label>
                      <select 
                        value={logStatus}
                        onChange={(e) => setLogStatus(e.target.value as any)}
                        className="w-full bg-app-base border border-app-border rounded p-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden"
                      >
                        <option value="backlog">To Consume</option>
                        <option value="active">Consuming</option>
                        <option value="completed">Completed</option>
                        <option value="dnf">Did Not Finish</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[var(--color-text-muted)] mb-1.5">Start Date</label>
                      <input
                        type="date"
                        value={logStartDate}
                        onChange={(e) => setLogStartDate(e.target.value)}
                        disabled={logStatus === 'backlog'}
                        className="w-full bg-app-base border border-app-border rounded p-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[var(--color-text-muted)] mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={logEndDate}
                        onChange={(e) => setLogEndDate(e.target.value)}
                        disabled={logStatus === 'backlog' || logStatus === 'active'}
                        className="w-full bg-app-base border border-app-border rounded p-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCreateLog}
                    className="w-full py-1.5 bg-app-border hover:bg-[#3f3f4e] text-xs font-bold text-white rounded transition-colors cursor-pointer shadow-sm"
                  >
                    Add Log
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Manual Edits */}
            {activeTab === 'dates' && (
              <div className="space-y-6">
                <form onSubmit={handleManualSave}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 flex items-center gap-1"><Edit3 size={12}/> Edit Properties</label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="col-span-1 sm:col-span-2">
                        <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Creator</label>
                        <input
                          type="text"
                          value={editCreator}
                          onChange={(e) => setEditCreator(e.target.value)}
                          className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden"
                        />
                      </div>
                      
                      <div className="col-span-1 sm:col-span-2">
                        <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Cover Image URL</label>
                        <input
                          type="text"
                          value={editCoverUrl}
                          onChange={(e) => setEditCoverUrl(e.target.value)}
                          className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden font-mono text-[9px]"
                        />
                      </div>

                      <div className="col-span-1">
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
                        <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Genre</label>
                        <input
                          type="text"
                          value={editGenre}
                          onChange={(e) => setEditGenre(e.target.value)}
                          className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden"
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Release Year</label>
                        <input
                          type="text"
                          value={editReleaseYear}
                          onChange={(e) => setEditReleaseYear(e.target.value)}
                          className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 mt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-purple hover:bg-[#d8c7df] text-[#340F04] font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      Save Manual Properties
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-app-border p-3 flex justify-between items-center bg-app-card shrink-0">
            {onDeleteMedia && (
              <div className="flex items-center">
                {confirmDelete ? (
                  <div className="flex items-center gap-2 bg-[#1a1113] border border-red-900/40 px-2.5 py-1 rounded shadow-sm text-[10px]">
                    <span className="text-[10px] font-bold text-red-400">Permanently delete?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteMedia(item.id);
                        onClose();
                      }}
                      className="px-2 py-1 text-red-400 hover:text-white hover:bg-red-500 rounded transition-colors font-black uppercase cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 text-[var(--color-text-muted)] hover:text-white rounded transition-colors font-bold uppercase cursor-pointer bg-neutral-800"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-3 py-1.5 flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                    title="Delete Media from Library"
                  >
                    <Trash2 size={13} /> Delete Media
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-2 ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[var(--color-text-main)] rounded-md text-[10px] font-bold uppercase cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Navigation Arrow */}
        {onNextMedia && (
          <button
            onClick={(e) => { e.stopPropagation(); onNextMedia(); }}
            className="absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-16 z-50 p-2 sm:p-3 bg-[#1a0b2e]/90 hover:bg-brand-purple/20 border border-brand-purple/40 text-brand-purple hover:text-[#e9d5ff] rounded-full transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.7)] backdrop-blur-md"
            title="Next"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
