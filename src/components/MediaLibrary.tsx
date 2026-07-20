import React, { useState } from 'react';
import { MediaItem, MediaLog, MediaReview, SavePoint } from '../types';
import { Headphones, Film, Tv, Search, CheckCircle2, Bookmark, Play, Plus, Trash2, X, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MediaDetailModal } from './MediaDetailModal';
import { getMediaPoints } from '../utils/points';

interface MediaLibraryProps {
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
}

export function MediaLibrary({ 
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);

  // Sorting - mirrors the sort options/behavior on the book shelf
  type SortField = 'rating' | 'title' | 'author' | 'date-read' | 'genre';
  type SortOrder = 'asc' | 'desc';
  const [sortBy, setSortBy] = useState<SortField>('date-read');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const getMediaRatingValue = (mediaId: string): number => {
    const r = mediaReviews.find(rev => rev.mediaId === mediaId);
    return r ? r.rating : 0;
  };

  const getMediaStatus = (mediaId: string): 'backlog' | 'active' | 'completed' | 'dnf' => {
    const logs = mediaLogs.filter(l => l.mediaId === mediaId);
    if (logs.length === 0) return 'backlog';
    if (logs.some(l => l.status === 'completed')) return 'completed';
    if (logs.some(l => l.status === 'active')) return 'active';
    if (logs.some(l => l.status === 'dnf')) return 'dnf';
    return 'backlog';
  };

  const getLatestMediaDate = (mediaId: string): string => {
    const logs = mediaLogs.filter(l => l.mediaId === mediaId && l.endDate);
    if (logs.length === 0) return '';
    return [...logs].sort((a, b) => b.endDate.localeCompare(a.endDate))[0].endDate;
  };

  const filteredItems = mediaItems
    .filter(item => item.type === type)
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'author') {
        comparison = a.creator.localeCompare(b.creator);
      } else if (sortBy === 'genre') {
        comparison = (a.genre || 'Other').localeCompare(b.genre || 'Other');
      } else if (sortBy === 'rating') {
        comparison = getMediaRatingValue(a.id) - getMediaRatingValue(b.id);
      } else if (sortBy === 'date-read') {
        const dateA = getLatestMediaDate(a.id);
        const dateB = getLatestMediaDate(b.id);
        if (!dateA && !dateB) comparison = a.title.localeCompare(b.title);
        else if (!dateA) comparison = 1;
        else if (!dateB) comparison = -1;
        else comparison = dateA.localeCompare(dateB);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  const selectedMediaItem = filteredItems.find(item => item.id === selectedMediaId);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const term = encodeURIComponent(searchQuery.trim());
      let endpoint = '';
      if (type === 'tv') endpoint = `/api/search/tv?q=${term}`;
      else if (type === 'movie') endpoint = `/api/search/movie?q=${term}`;
      else if (type === 'podcast') endpoint = `https://itunes.apple.com/search?media=podcast&entity=podcast&term=${term}&limit=12`;
      
      const res = await fetch(endpoint);
      const data = await res.json();
      
      let results = [];
      if (type === 'tv') {
        results = (data || []).map((item: any) => item.show);
      } else if (type === 'movie') {
        results = data.results || [];
      } else if (type === 'podcast') {
        results = data.results || [];
      }
      
      setSearchResults(results.slice(0, 12));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const addMedia = async (result: any) => {
    let newItem: MediaItem;

    if (type === 'tv') {
      let episodes = [];
      let cast = [];
      // Fetch details to get episodes and cast
      try {
        const detailRes = await fetch(`/api/details/tv?q=${encodeURIComponent(result.name)}`);
        const detailData = await detailRes.json();
        if (detailData && detailData._embedded) {
          if (detailData._embedded.cast) {
            cast = detailData._embedded.cast.map((c: any) => ({
              id: c.person.id.toString(),
              name: c.person.name,
              character: c.character.name,
              image: c.person.image?.medium || c.character.image?.medium
            }));
          }
          if (detailData._embedded.episodes) {
            episodes = detailData._embedded.episodes.map((e: any) => ({
              id: e.id.toString(),
              season: e.season,
              number: e.number,
              title: e.name,
              aired: e.airdate
            }));
          }
        }
      } catch (err) {
        console.error(err);
      }

      newItem = {
        id: result.id.toString(),
        type,
        title: result.name,
        creator: result.network?.name || result.webChannel?.name || 'Unknown Network',
        coverUrl: result.image?.original || result.image?.medium || '',
        releaseYear: result.premiered ? result.premiered.substring(0, 4) : undefined,
        genre: Array.isArray(result.genres) ? result.genres.join(', ') : '',
        overview: result.summary ? result.summary.replace(/<[^>]+>/g, '') : '',
        cast,
        episodes
      };
    } else if (type === 'movie') {
      newItem = {
        id: result.id.toString(),
        type,
        title: result.title,
        creator: '', // TMDB search doesn't give director easily
        coverUrl: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : '',
        releaseYear: result.release_date ? result.release_date.substring(0, 4) : undefined,
        overview: result.overview,
        rating: result.vote_average ? result.vote_average / 2 : undefined // scale to 5 stars
      };
    } else { // podcast
      newItem = {
        id: result.trackId ? result.trackId.toString() : result.collectionId?.toString() || Math.random().toString(),
        type,
        title: result.trackName || result.collectionName || 'Unknown Title',
        creator: result.artistName || 'Unknown Creator',
        coverUrl: (result.artworkUrl600 || result.artworkUrl100)?.replace('100x100', '600x600') || '',
        releaseYear: result.releaseDate ? result.releaseDate.substring(0, 4) : undefined,
        genre: result.primaryGenreName || (result.genres ? result.genres.join(', ') : ''),
      };
    }

    onUpdateMediaItem(newItem);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-app-border/60 pb-4 mb-4">
        <div className="p-2 bg-brand-purple/10 border border-brand-purple/20 text-[#CAB9D4] rounded-lg">
          {type === 'podcast' ? <Headphones size={20} /> : type === 'movie' ? <Film size={20} /> : <Tv size={20} />}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white font-display uppercase tracking-widest">
            {type === 'podcast' ? 'Podcasts' : type === 'movie' ? 'Movies' : 'TV'}
          </h2>
          <p className="text-[11px] text-[var(--color-text-muted)]">Total: {filteredItems.length} items</p>
        </div>
      </div>

      {/* Add New Media via iTunes */}
      <div className="bg-app-card border border-app-border rounded-xl p-4 shadow-app-glow">
        <h3 className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-wider mb-3">Add New {type}</h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search for a ${type}...`}
            className="flex-1 bg-app-base border border-app-border rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-brand-purple"
          />
          <button type="submit" className="bg-brand-purple text-[#340F04] font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#d8c7df] transition-colors cursor-pointer">
            <Search size={16} /> Search
          </button>
        </form>

        {isSearching && <p className="text-xs text-[var(--color-text-muted)] mt-4 animate-pulse">Searching...</p>}

        {searchResults.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {searchResults.map((res: any) => {
              let displayTitle = '';
              let displaySubtitle = '';
              let cover = '';
              let key = res.id || Math.random().toString();
              
              if (type === 'tv') {
                displayTitle = res.name;
                displaySubtitle = res.network?.name || res.webChannel?.name || 'Unknown Network';
                cover = res.image?.medium || res.image?.original || '';
              } else if (type === 'movie') {
                displayTitle = res.title;
                displaySubtitle = res.release_date ? res.release_date.substring(0, 4) : 'Unknown Year';
                cover = res.poster_path ? `https://image.tmdb.org/t/p/w200${res.poster_path}` : '';
              } else if (type === 'podcast') {
                displayTitle = res.trackName || res.collectionName;
                displaySubtitle = res.artistName || 'Unknown Host';
                cover = res.artworkUrl600 || res.artworkUrl100 || '';
              }

              return (
              <div key={key} className="bg-app-base border border-app-border rounded-lg p-2 flex flex-col gap-2 relative group">
                <div className="aspect-square rounded-md overflow-hidden bg-app-base border border-app-border">
                  {cover ? (
                    <img src={cover} className="w-full h-full object-cover" alt="Cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">No Image</div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-[10px] font-bold text-white truncate" title={displayTitle}>{displayTitle}</h4>
                  <p className="text-[9px] text-[var(--color-text-muted)] truncate" title={displaySubtitle}>{displaySubtitle}</p>
                </div>
                <button onClick={() => addMedia(res)} className="w-full mt-auto py-1 bg-brand-purple/20 text-brand-purple rounded text-[10px] font-bold hover:bg-brand-purple hover:text-[#340F04] transition-colors cursor-pointer">
                  Add to Collection
                </button>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Sort Controls Row - mirrors the book shelf's sort UI */}
      {filteredItems.length > 0 && (
        <div className="flex items-center gap-2 bg-[#141417] border border-app-border rounded-lg p-1 text-xs w-fit">
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] px-1 font-mono">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-app-base border border-app-border text-[var(--color-text-main)] text-[11px] font-bold px-2 py-1 rounded focus:outline-none cursor-pointer"
          >
            <option value="date-read">Date Added/Watched</option>
            <option value="rating">Rating</option>
            <option value="title">Alphabetical (A-Z)</option>
            <option value="author">Creator</option>
            <option value="genre">Genre (Category)</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-1 px-2.5 bg-app-base hover:bg-app-card text-[#CAB9D4] border border-app-border hover:border-brand-purple/35 rounded flex items-center gap-1 transition-all cursor-pointer font-bold text-[10px] uppercase font-mono"
            title={`Switch to ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <ArrowUpDown size={11} className="text-[#CAB9D4]" />
            {sortOrder}
          </button>
        </div>
      )}

      {/* Visual Shelves */}
      {filteredItems.length > 0 ? (
        <div className="bg-app-card border border-app-border rounded-xl p-6 shadow-inner">
           {type === 'podcast' ? (
             // Vinyl Shelf
             <div className="flex flex-wrap gap-6 justify-center">
               {filteredItems.map(item => (
                 <div key={item.id} className="w-28 flex flex-col items-center gap-1.5">
                   <div onClick={() => setSelectedMediaId(item.id)} className="relative w-28 h-28 group cursor-pointer">
                     {/* Vinyl Record */}
                     <div className="absolute inset-0 bg-black rounded-full shadow-2xl border-4 border-[#111] border-opacity-90 transform translate-x-0 group-hover:translate-x-8 transition-transform duration-500 z-0">
                        <div className="absolute inset-2 border-[0.5px] border-white/5 rounded-full" />
                        <div className="absolute inset-4 border-[0.5px] border-white/5 rounded-full" />
                        <div className="absolute inset-6 border-[0.5px] border-white/5 rounded-full" />
                        <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full overflow-hidden border border-[#222]">
                          <img src={item.coverUrl} className="w-full h-full object-cover opacity-80" />
                        </div>
                        <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-900 rounded-full" />
                     </div>
                     {/* Vinyl Sleeve */}
                     <div className="absolute inset-0 bg-app-base rounded-sm shadow-[2px_2px_15px_rgba(0,0,0,0.8)] border border-white/10 z-10 overflow-hidden group-hover:-rotate-2 transition-transform duration-500">
                       <img src={item.coverUrl} className="w-full h-full object-cover" />
                       {/* Gloss overlay */}
                       <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none" />
                       
                       <button onClick={(e) => { e.stopPropagation(); onRemoveMediaItem(item.id); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Trash2 size={12} />
                       </button>
                     </div>
                   </div>
                   {/* Title + Points caption */}
                   <div className="w-full text-center">
                     <p className="text-[9px] font-bold text-white truncate" title={item.title}>{item.title}</p>
                     <div className="points-wrap text-[11px] leading-none mt-0.5">
                       <span className="points-underline-glow" />
                       <span className="points-badge"><span className="points-badge-inner">{getMediaPoints(item, getMediaStatus(item.id)).toLocaleString()} PTS</span></span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             // DVD Shelf for Movies & TV
             <div className="relative py-4 px-2 rounded-lg bg-[#0a0a0c] border border-[#111] shadow-inner overflow-hidden">
                <div className="flex flex-wrap gap-1 relative z-10 justify-center">
                  {filteredItems.map(item => (
                    <div key={item.id} onClick={() => setSelectedMediaId(item.id)} className="w-10 sm:w-14 h-32 sm:h-44 bg-black rounded-xs border border-white/20 shadow-[2px_0_5px_rgba(0,0,0,0.6)] relative group cursor-pointer hover:scale-105 hover:-translate-y-2 transition-transform overflow-hidden flex flex-col justify-end pb-4 shrink-0">
                      <img src={item.coverUrl} className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[1px] group-hover:opacity-70 group-hover:blur-none transition-all" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/90 pointer-events-none" />
                      <div className="relative z-10 px-1 text-center -rotate-90 origin-left whitespace-nowrap bottom-6 left-1/2 -ml-2">
                        <span className="text-[7px] sm:text-[9px] font-bold text-white tracking-widest font-display">{item.title}</span>
                          <span className="points-wrap ml-2 text-[6px] sm:text-[8px]">
                            <span className="points-underline-glow" />
                            <span className="points-badge"><span className="points-badge-inner">{getMediaPoints(item, getMediaStatus(item.id)).toLocaleString()} PTS</span></span>
                          </span>
                          {(item.currentProgress || item.totalLength) && (
                            <span className="ml-2 text-[6px] sm:text-[7px] font-mono text-brand-purple opacity-80 tracking-wider">
                              [{item.currentProgress ? `${item.currentProgress}/` : ''}{item.totalLength || '?'}]
                            </span>
                          )}
                      </div>
                      <div className="absolute top-1 right-1 flex flex-col gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      )}
                    </div>
                  ))}
                </div>
                {/* DVD Shelf base */}
                <div className="absolute bottom-0 w-full h-2 bg-app-card border-t border-app-border rounded-b-sm shadow-[0_-2px_10px_rgba(0,0,0,0.5)] z-0" />
             </div>
           )}
        </div>
      ) : (
        <div className="text-center py-12 bg-app-card border border-app-border rounded-xl">
          <p className="text-[var(--color-text-muted)] font-bold text-sm">Your {type} collection is empty.</p>
          <p className="text-gray-600 text-xs mt-1">Search above to add items to your shelf.</p>
        </div>
      )}

      <AnimatePresence>
        {selectedMediaItem && (
          <MediaDetailModal
            item={selectedMediaItem}
            mediaLogs={mediaLogs}
            review={mediaReviews.find(r => r.mediaId === selectedMediaItem.id)}
            onClose={() => setSelectedMediaId(null)}
            onSaveReview={onSaveReview}
            onAddMediaLog={onAddMediaLog}
            onRemoveMediaLog={onRemoveMediaLog}
            onUpdateMediaItem={onUpdateMediaItem}
            onDeleteMedia={(id) => {
              onRemoveMediaItem(id);
              setSelectedMediaId(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
