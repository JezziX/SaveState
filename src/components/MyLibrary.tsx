import React, { useState, useEffect, useRef } from 'react';
import { Book, ReadingLog, BookReview, SavePoint } from '../types';
import { Save } from 'lucide-react';
import { Star, Bookmark, ChevronDown, X, CheckCircle2, BookOpen, Trash2, Search, SlidersHorizontal, Grid, Columns, List, ArrowUpDown, Quote, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../utils/supabaseClient';
import { upsertQuote } from '../utils/quotesApi';
import { getBookPoints } from '../utils/points';

// Unified helper to fallback to styled Unsplash covers in case Open Library or other URLs fail
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, title: string) => {
  const hash = Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000;
  e.currentTarget.src = `https://images.unsplash.com/photo-${hash % 2 === 0 ? '1544947950-fa07a98d237f' : '1543002588-bfa74002ed7e'}?q=80&w=300&auto=format&fit=crop`;
};

interface MyLibraryProps {
  theme?: 'jx' | 'neon' | 'pastel' | 'rainbow';
  shelfSkin?: string;
  pinnedBadges?: { id: string, x: number, y: number, badgeId: string, shelfIdx: number }[];
  unlockedBadges?: string[];
  onUpdateShelfSkin?: (skin: string) => void;
  onUpdatePinnedBadges?: (badges: { id: string, x: number, y: number, badgeId: string, shelfIdx: number }[]) => void;
  books: Book[];
  readingLogs: ReadingLog[];
  reviews: BookReview[];
  onSelectBook: (bookId: string) => void;
  onRemoveBook: (bookId: string) => void;
  onUpdateBook?: (book: Book) => void;
  onBatchRemoveBooks?: (bookIds: string[]) => void;
  onBatchUpdateBooks?: (updatedBooks: Book[]) => void;
  onAddReadingLog?: (log: Omit<ReadingLog, 'id'>) => void;
  savePoints?: SavePoint[];
  onAddSavePoint?: (sp: Omit<SavePoint, 'id' | 'created_at'>) => void;
}

type StatusFilter = 'all' | 'backlog' | 'active' | 'completed' | 'dnf';
type LayoutMode = 'grid' | 'shelf' | 'list';
type SortField = 'rating' | 'title' | 'author' | 'date-read' | 'genre';
type SortOrder = 'asc' | 'desc';

export function MyLibrary({
  theme = 'jx',
  shelfSkin = 'Apothecary',
  pinnedBadges = [],
  unlockedBadges = [],
  onUpdateShelfSkin,
  onUpdatePinnedBadges,
  books,
  readingLogs,
  reviews,
  onSelectBook,
  onRemoveBook,
  onUpdateBook,
  onBatchRemoveBooks,
  onBatchUpdateBooks,
  onAddReadingLog,
  savePoints = [],
  onAddSavePoint
}: MyLibraryProps) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [pinningBadge, setPinningBadge] = useState<string | null>(null);
  const [quickSaveId, setQuickSaveId] = useState<string | null>(null);
  const [quickSaveData, setQuickSaveData] = useState({ milestone: '', notes: '' });

  const handleQuickSave = (bookId: string) => {
    if (!quickSaveData.milestone && !quickSaveData.notes) return;
    onAddSavePoint?.({
      mediaId: bookId,
      milestone: quickSaveData.milestone,
      raw_brain_drop: quickSaveData.notes
    });
    setQuickSaveId(null);
    setQuickSaveData({ milestone: '', notes: '' });
  };


  const BADGES = {
    'lore-master': { name: 'The Lore-Master', icon: '📜', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    'binge-burnout': { name: 'The Binge-Burnout', icon: '🔥', color: 'bg-red-100 text-red-900 border-red-300' },
    'time-traveler': { name: 'Time Traveler', icon: '⏳', color: 'bg-purple-100 text-purple-900 border-purple-300' }
  };

  const handleShelfClick = (e: React.MouseEvent, shelfIdx: number) => {
    if (!pinningBadge || !onUpdatePinnedBadges) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onUpdatePinnedBadges([...pinnedBadges, { id: `pin_${Date.now()}`, badgeId: pinningBadge, x, y, shelfIdx }]);
    setPinningBadge(null);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('shelf'); // default to shelf first as requested!
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('date-read');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Batch selection states
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  // Quote entry states
  const [quoteEntryBookId, setQuoteEntryBookId] = useState<string | null>(null);
  const [enteredQuoteText, setEnteredQuoteText] = useState('');
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState<string | null>(null);

  // Long press active tooltip state for mobile
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useRef(false);
  
  // Handle clicking outside to clear mobile tooltip
  useEffect(() => {
    const handleTouchOutside = () => setActiveTooltip(null);
    document.addEventListener('touchstart', handleTouchOutside);
    return () => document.removeEventListener('touchstart', handleTouchOutside);
  }, []);

  const handleBatchShelfUpdate = (status: string) => {
    if (!onUpdateBook || !onAddReadingLog) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedBooksList: Book[] = [];

    selectedBatchIds.forEach(bookId => {
      const book = books.find(b => b.id === bookId);
      if (!book) return;

      const isDnf = status === 'dnf';
      const isCompleted = status === 'completed';
      const isReading = status === 'active';

      const updatedBook: Book = {
        ...book,
        didNotFinish: isDnf,
        startDate: (isReading || isCompleted) ? (book.startDate || todayStr) : undefined,
        endDate: isCompleted ? (book.endDate || todayStr) : undefined,
      };

      updatedBooksList.push(updatedBook);
      onUpdateBook(updatedBook);

      onAddReadingLog({
        bookId: book.id,
        startDate: (isReading || isCompleted) ? (book.startDate || todayStr) : undefined,
        endDate: isCompleted ? (book.endDate || todayStr) : undefined,
        status: status as any,
      });
    });

    if (onBatchUpdateBooks) {
      onBatchUpdateBooks(updatedBooksList);
    }
    setSelectedBatchIds([]);
    setIsBatchMode(false);
  };

  const handleBatchDelete = () => {
    if (onBatchRemoveBooks) {
      onBatchRemoveBooks(selectedBatchIds);
    } else {
      selectedBatchIds.forEach(id => onRemoveBook(id));
    }
    setSelectedBatchIds([]);
    setIsBatchMode(false);
    setShowBatchDeleteConfirm(false);
  };

  const handleSaveQuickQuote = async (bookId: string, text: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book || !text.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await upsertQuote({
      id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      quote: text.trim(),
      author: book.author,
      source: book.title,
      coverUrl: book.coverUrl,
      isPublic: true, // quotes are public by default, like a review - user can flip it privately from the Quotes page
      createdAt: new Date().toISOString(),
    }, session.user.id);

    setQuoteSuccessMsg('Snippet saved to your Quote Deck!');
    setEnteredQuoteText('');
    setTimeout(() => {
      setQuoteSuccessMsg(null);
      setQuoteEntryBookId(null);
    }, 1200);
  };

  // Find all unique years available from completed or reading logs to filter
  const availableYears = Array.from(new Set(
    readingLogs
      .filter(log => log.endDate && log.endDate.trim() !== '')
      .map(log => log.endDate.split('-')[0])
      .filter(yr => /^\d{4}$/.test(yr))
  )).sort((a, b) => b.localeCompare(a));

  // Get current status of a book
  const getBookStatus = (bookId: string): ReadingLog['status'] => {
    const logs = readingLogs.filter(log => log.bookId === bookId);
    if (logs.length === 0) return 'backlog';
    
    const hasCompleted = logs.some(l => l.status === 'completed');
    if (hasCompleted) return 'completed';

    const hasReading = logs.some(l => l.status === 'active');
    if (hasReading) return 'active';

    return 'backlog';
  };

  // Get review/rating for a book
  const getBookReview = (bookId: string): BookReview | undefined => {
    return reviews.find(r => r.bookId === bookId);
  };

  const getLatestReadDate = (bookId: string): string => {
    const logs = readingLogs.filter(log => log.bookId === bookId && log.endDate);
    if (logs.length === 0) return '';
    const sorted = [...logs].sort((a, b) => b.endDate.localeCompare(a.endDate));
    return sorted[0].endDate;
  };

  const getBookRatingValue = (bookId: string): number => {
    const r = getBookReview(bookId);
    return r ? r.rating : 0;
  };

  // Filter books matching search or selected state (excludes DNF books from standard shelves unless 'dnf' tab is active)
  const filteredBooks = books.filter(book => {
    const isDnf = !!book.didNotFinish;
    const status = getBookStatus(book.id);
    const matchesFilter = 
      filter === 'all' 
        ? !isDnf 
        : filter === 'dnf'
          ? isDnf
          : !isDnf && status === filter;
    
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch = book.title.toLowerCase().includes(lowerQuery) || 
                          book.author.toLowerCase().includes(lowerQuery);
    
    return matchesFilter && matchesSearch;
  });

  // DNF count helper
  const dnfBooks = books.filter(book => book.didNotFinish);

  // Apply Sort and Year Filtering
  const processedBooks = [...filteredBooks]
    .filter(book => {
      if (filter === 'all' && selectedYear !== 'all') {
        const logs = readingLogs.filter(log => log.bookId === book.id);
        return logs.some(log => log.endDate && log.endDate.startsWith(selectedYear));
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'author') {
        comparison = a.author.localeCompare(b.author);
      } else if (sortBy === 'genre') {
        const genA = a.genre || (a.subjects && a.subjects[0]) || 'Other';
        const genB = b.genre || (b.subjects && b.subjects[0]) || 'Other';
        comparison = genA.localeCompare(genB);
      } else if (sortBy === 'rating') {
        comparison = getBookRatingValue(a.id) - getBookRatingValue(b.id);
      } else if (sortBy === 'date-read') {
        const dateA = getLatestReadDate(a.id);
        const dateB = getLatestReadDate(b.id);
        if (!dateA && !dateB) {
          comparison = a.title.localeCompare(b.title);
        } else if (!dateA) {
          comparison = 1;
        } else if (!dateB) {
          comparison = -1;
        } else {
          comparison = dateA.localeCompare(dateB);
        }
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const getStatusBadge = (status: ReadingLog['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-turquoise bg-brand-turquoise/10 border border-brand-turquoise/20 px-2 py-0.5 rounded-full select-none">
            <CheckCircle2 size={10} /> Completed
          </span>
        );
      case 'active':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/15 px-2 py-0.5 rounded-full select-none animate-pulse">
            <BookOpen size={10} /> Reading
          </span>
        );
      case 'backlog':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-2 py-0.5 rounded-full select-none">
            <Bookmark size={10} /> To Read
          </span>
        );
    }
  };

  // Cozy 2D Video Game (Terraria-style) vibrant & earthy color palette
  const getSpineColorAndHeight = (bookId: string, title: string, index: number, status: ReadingLog['status']) => {
    let spineColors: string[] = [];

    if (theme === 'pastel') {
      spineColors = [
        'bg-[#f7d1cd] text-[#8e605d] border-[#e8c0bc] shadow-[inset_4px_0_10px_rgba(255,255,255,0.6),_2px_2px_4px_rgba(0,0,0,0.1)]',
        'bg-[#e8dff5] text-[#716480] border-[#d8cce8] shadow-[inset_4px_0_10px_rgba(255,255,255,0.6),_2px_2px_4px_rgba(0,0,0,0.1)]',
        'bg-[#fce1e4] text-[#8a686b] border-[#ebd0d3] shadow-[inset_4px_0_10px_rgba(255,255,255,0.6),_2px_2px_4px_rgba(0,0,0,0.1)]',
        'bg-[#ddedea] text-[#5e7570] border-[#ccdedb] shadow-[inset_4px_0_10px_rgba(255,255,255,0.6),_2px_2px_4px_rgba(0,0,0,0.1)]',
        'bg-[#daeaf6] text-[#5d7182] border-[#c8d9e8] shadow-[inset_4px_0_10px_rgba(255,255,255,0.6),_2px_2px_4px_rgba(0,0,0,0.1)]',
        'bg-[#e2f0cb] text-[#697851] border-[#d1e0b8] shadow-[inset_4px_0_10px_rgba(255,255,255,0.6),_2px_2px_4px_rgba(0,0,0,0.1)]',
        'bg-[#ffdfd3] text-[#8f6d61] border-[#f0caba] shadow-[inset_4px_0_10px_rgba(255,255,255,0.6),_2px_2px_4px_rgba(0,0,0,0.1)]',
        'bg-[#f5e6e8] text-[#7a6a6c] border-[#e6d5d7] shadow-[inset_4px_0_10px_rgba(255,255,255,0.6),_2px_2px_4px_rgba(0,0,0,0.1)]',
      ];
    } else if (theme === 'neon') {
      spineColors = [
        'bg-[#ff0055] text-[#ffffff] border-[#cc0044] shadow-[inset_2px_0_8px_rgba(255,255,255,0.4),_0_0_10px_rgba(255,0,85,0.6)]',
        'bg-[#00ffcc] text-[#003322] border-[#00ccaa] shadow-[inset_2px_0_8px_rgba(255,255,255,0.5),_0_0_10px_rgba(0,255,204,0.6)]',
        'bg-[#bd00ff] text-[#ffffff] border-[#9900cc] shadow-[inset_2px_0_8px_rgba(255,255,255,0.4),_0_0_10px_rgba(189,0,255,0.6)]',
        'bg-[#ffff00] text-[#333300] border-[#cccc00] shadow-[inset_2px_0_8px_rgba(255,255,255,0.6),_0_0_10px_rgba(255,255,0,0.6)]',
        'bg-[#ffaa00] text-[#332200] border-[#cc8800] shadow-[inset_2px_0_8px_rgba(255,255,255,0.5),_0_0_10px_rgba(255,170,0,0.6)]',
        'bg-[#0055ff] text-[#ffffff] border-[#0044cc] shadow-[inset_2px_0_8px_rgba(255,255,255,0.4),_0_0_10px_rgba(0,85,255,0.6)]',
        'bg-[#ff00ff] text-[#ffffff] border-[#cc00cc] shadow-[inset_2px_0_8px_rgba(255,255,255,0.4),_0_0_10px_rgba(255,0,255,0.6)]',
        'bg-[#00ff00] text-[#003300] border-[#00cc00] shadow-[inset_2px_0_8px_rgba(255,255,255,0.5),_0_0_10px_rgba(0,255,0,0.6)]',
      ];
    } else if (theme === 'rainbow') {
      spineColors = [
        'bg-[#e84a5f] text-[#ffebef] border-[#c73b4d] shadow-[inset_4px_0_10px_rgba(255,255,255,0.2),_2px_2px_4px_rgba(0,0,0,0.3)]',
        'bg-[#ff847c] text-[#692520] border-[#df6961] shadow-[inset_4px_0_10px_rgba(255,255,255,0.3),_2px_2px_4px_rgba(0,0,0,0.3)]',
        'bg-[#feceab] text-[#7a5438] border-[#dfb18e] shadow-[inset_4px_0_10px_rgba(255,255,255,0.4),_2px_2px_4px_rgba(0,0,0,0.2)]',
        'bg-[#99b898] text-[#2c3d2b] border-[#819e80] shadow-[inset_4px_0_10px_rgba(255,255,255,0.3),_2px_2px_4px_rgba(0,0,0,0.3)]',
        'bg-[#2a363b] text-[#d6e0e5] border-[#1e272b] shadow-[inset_4px_0_10px_rgba(255,255,255,0.1),_2px_2px_4px_rgba(0,0,0,0.4)]',
        'bg-[#6c5b7b] text-[#eeeaf2] border-[#534561] shadow-[inset_4px_0_10px_rgba(255,255,255,0.2),_2px_2px_4px_rgba(0,0,0,0.3)]',
        'bg-[#355c7d] text-[#d9e5f0] border-[#254661] shadow-[inset_4px_0_10px_rgba(255,255,255,0.2),_2px_2px_4px_rgba(0,0,0,0.3)]',
        'bg-[#f8b195] text-[#7a4835] border-[#df9b81] shadow-[inset_4px_0_10px_rgba(255,255,255,0.3),_2px_2px_4px_rgba(0,0,0,0.2)]',
      ];
    } else { // 'jx' or default Strange Antiquities apothecary style
      spineColors = [
        'bg-gradient-to-r from-[#7a2e2e] to-[#591e1e] text-[#f2e1c9] border-[#3d1313]/50 shadow-[inset_2px_0_6px_rgba(255,255,255,0.2),_2px_2px_4px_rgba(0,0,0,0.5)]', // Vibrant Burgundy
        'bg-gradient-to-r from-[#2e5e4e] to-[#1b4034] text-[#d1e8df] border-[#122e25]/50 shadow-[inset_2px_0_6px_rgba(255,255,255,0.2),_2px_2px_4px_rgba(0,0,0,0.5)]', // Rich Emerald
        'bg-gradient-to-r from-[#9c7132] to-[#755220] text-[#fff3e0] border-[#4f3511]/50 shadow-[inset_2px_0_6px_rgba(255,255,255,0.2),_2px_2px_4px_rgba(0,0,0,0.5)]', // Warm Amber Gold
        'bg-gradient-to-r from-[#2d4c5e] to-[#1c3645] text-[#d8ebf5] border-[#112430]/50 shadow-[inset_2px_0_6px_rgba(255,255,255,0.2),_2px_2px_4px_rgba(0,0,0,0.5)]', // Deep Teal
        'bg-gradient-to-r from-[#5a3a6b] to-[#3f264d] text-[#eadef5] border-[#2a1736]/50 shadow-[inset_2px_0_6px_rgba(255,255,255,0.2),_2px_2px_4px_rgba(0,0,0,0.5)]', // Royal Violet
        'bg-gradient-to-r from-[#3d2b1f] to-[#261a12] text-[#e8ccb5] border-[#1a110a]/50 shadow-[inset_2px_0_6px_rgba(255,255,255,0.1),_2px_2px_4px_rgba(0,0,0,0.6)]', // Dark Leather
        'bg-gradient-to-r from-[#8c4a23] to-[#613114] text-[#f5d5c1] border-[#3d1d0a]/50 shadow-[inset_2px_0_6px_rgba(255,255,255,0.2),_2px_2px_4px_rgba(0,0,0,0.5)]', // Burnt Orange
        'bg-gradient-to-r from-[#404c38] to-[#2b3624] text-[#e0e8d8] border-[#1d2617]/50 shadow-[inset_2px_0_6px_rgba(255,255,255,0.2),_2px_2px_4px_rgba(0,0,0,0.5)]', // Mossy Green
      ];
    }

    const pattern = [0, 5, 1, 3, 2, 6, 3, 7, 4, 1, 6, 2, 7, 5, 0, 4, 2, 5, 1, 6, 3];
    const patIdx = (title.length + index) % pattern.length;
    const colorClass = spineColors[pattern[patIdx]];

    // Determine vertical heights range: varied heights added for organic look!
    const baseHeight = 125 + ((title.length * 4 + index * 5) % 40);
    return { colorClass, height: `${baseHeight}px` };
  };

  
const renderLeftBookend = () => {
  if (shelfSkin === 'Plain') {
    return <div className="w-4 h-[100px] bg-white rounded-t-sm self-end relative z-20 shadow-md border border-gray-200" />;
  }
  if (shelfSkin === 'Trophy Case') {
    return <div className="w-8 h-[130px] bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-t-md self-end relative z-20 shadow-[0_0_15px_rgba(255,215,0,0.4)] border border-yellow-700" />;
  }
  if (shelfSkin === 'Kitchen') {
    return <div className="w-6 h-[90px] bg-blue-200 rounded-t-lg self-end relative z-20 shadow-sm border border-blue-300" />;
  }
  if (shelfSkin === 'Spooky') {
    return <div className="w-8 h-[110px] bg-gradient-to-r from-green-900 to-black rounded-t-md self-end relative z-20 shadow-[0_0_10px_lime] border border-green-700" />;
  }
  // Default Apothecary
  return (
    <div className="w-6 sm:w-8 h-[125px] sm:h-[145px] bg-gradient-to-r from-[#d4af37] via-[#fdf5d3] to-[#aa801b] rounded-tl-[24px] rounded-bl-[4px] self-end relative shrink-0 -mr-[1px] z-20 overflow-hidden shadow-[inset_2px_2px_6px_rgba(255,255,255,0.7),_3px_0_6px_rgba(0,0,0,0.5)] border border-[#8b6508]">
      <div className="absolute inset-0 opacity-80 pointer-events-none">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-l-2 border-b-2 border-[#b8860b] rotate-[-45deg]" />
        <div className="absolute top-12 left-1.5 w-6 h-6 border-2 border-transparent border-t-[#b8860b] border-l-[#b8860b] rounded-full opacity-60" />
        <div className="absolute top-16 -left-2 w-5 h-5 border-2 border-transparent border-b-[#b8860b] border-r-[#b8860b] rounded-full opacity-60" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-4 h-4 border-2 border-transparent border-t-[#b8860b] border-r-[#b8860b] rounded-full opacity-60" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#b8860b] text-[8px] leading-none drop-shadow-sm">✦</div>
        <div className="absolute bottom-10 left-1 text-[#b8860b] text-[6px] leading-none drop-shadow-sm opacity-70">✧</div>
      </div>
    </div>
  );
};

const renderRightBookend = () => {
  if (shelfSkin === 'Plain') {
    return <div className="w-4 h-[100px] bg-white rounded-t-sm self-end relative z-20 shadow-md border border-gray-200" />;
  }
  if (shelfSkin === 'Trophy Case') {
    return <div className="w-8 h-[130px] bg-gradient-to-l from-yellow-400 to-yellow-600 rounded-t-md self-end relative z-20 shadow-[0_0_15px_rgba(255,215,0,0.4)] border border-yellow-700" />;
  }
  if (shelfSkin === 'Kitchen') {
    return <div className="w-6 h-[90px] bg-blue-200 rounded-t-lg self-end relative z-20 shadow-sm border border-blue-300" />;
  }
  if (shelfSkin === 'Spooky') {
    return <div className="w-8 h-[110px] bg-gradient-to-l from-green-900 to-black rounded-t-md self-end relative z-20 shadow-[0_0_10px_lime] border border-green-700" />;
  }
  // Default Apothecary
  return (
    <div className="w-6 sm:w-8 h-[125px] sm:h-[145px] bg-gradient-to-l from-[#d4af37] via-[#fdf5d3] to-[#aa801b] rounded-tr-[24px] rounded-br-[4px] self-end relative shrink-0 -ml-[1px] z-20 overflow-hidden shadow-[inset_-2px_2px_6px_rgba(255,255,255,0.7),_-3px_0_6px_rgba(0,0,0,0.5)] border border-[#8b6508]">
      <div className="absolute inset-0 opacity-80 pointer-events-none">
        <div className="absolute top-4 right-1/2 translate-x-1/2 w-4 h-4 rounded-full border-r-2 border-b-2 border-[#b8860b] rotate-[45deg]" />
        <div className="absolute top-12 right-1.5 w-6 h-6 border-2 border-transparent border-t-[#b8860b] border-r-[#b8860b] rounded-full opacity-60" />
        <div className="absolute top-16 -right-2 w-5 h-5 border-2 border-transparent border-b-[#b8860b] border-l-[#b8860b] rounded-full opacity-60" />
        <div className="absolute top-24 right-1/2 translate-x-1/2 w-4 h-4 border-2 border-transparent border-t-[#b8860b] border-l-[#b8860b] rounded-full opacity-60" />
        <div className="absolute bottom-6 right-1/2 translate-x-1/2 text-[#b8860b] text-[8px] leading-none drop-shadow-sm">✦</div>
        <div className="absolute bottom-10 right-1 text-[#b8860b] text-[6px] leading-none drop-shadow-sm opacity-70">✧</div>
      </div>
    </div>
  );
};
const getDecorForSlot = (shelfIdx: number, salt: number) => {
    if (shelfSkin === 'Plain') return null;
    
    if (shelfSkin === 'Spooky') {
      const assets = [
        {
          type: 'skull',
          name: 'Glowing Skull',
          element: (
            <div key={`skull-${shelfIdx}-${salt}`} className="flex flex-col items-center justify-end h-[60px] w-[50px] shrink-0 self-end px-1 relative group select-none transition-transform hover:-translate-y-1">
               <div className="w-8 h-8 bg-green-950 rounded-full border border-green-800 shadow-[0_0_10px_rgba(0,255,0,0.3)] relative overflow-hidden">
                 <div className="absolute top-2 left-1.5 w-2 h-2 bg-black rounded-full shadow-[0_0_5px_rgba(0,255,0,0.8)]" />
                 <div className="absolute top-2 right-1.5 w-2 h-2 bg-black rounded-full shadow-[0_0_5px_rgba(0,255,0,0.8)]" />
                 <div className="absolute bottom-1 left-2 w-4 h-1.5 bg-black rounded-sm" />
               </div>
            </div>
          )
        },
        {
          type: 'spider',
          name: 'Spider',
          element: (
            <div key={`spider-${shelfIdx}-${salt}`} className="flex flex-col items-center justify-end h-[40px] w-[40px] shrink-0 self-end relative group select-none transition-transform hover:-translate-y-1">
               <div className="w-4 h-4 bg-black rounded-full relative">
                 <div className="absolute -left-3 top-0 w-3 h-px bg-black rotate-45" />
                 <div className="absolute -right-3 top-0 w-3 h-px bg-black -rotate-45" />
                 <div className="absolute -left-3 bottom-0 w-3 h-px bg-black -rotate-45" />
                 <div className="absolute -right-3 bottom-0 w-3 h-px bg-black rotate-45" />
                 <div className="absolute top-1 left-0.5 w-1 h-1 bg-red-600 rounded-full shadow-[0_0_3px_red]" />
                 <div className="absolute top-1 right-0.5 w-1 h-1 bg-red-600 rounded-full shadow-[0_0_3px_red]" />
               </div>
            </div>
          )
        }
      ];
      return assets[(shelfIdx + salt) % assets.length].element;
    }
    
    if (shelfSkin === 'Kitchen') {
      const assets = [
        {
          type: 'spice',
          name: 'Spice Jar',
          element: (
            <div key={`spice-${shelfIdx}-${salt}`} className="flex flex-col items-center justify-end h-[60px] w-[35px] shrink-0 self-end relative group select-none transition-transform hover:-translate-y-1">
               <div className="w-5 h-2 bg-[#8c7365] rounded-t-sm" />
               <div className="w-7 h-10 bg-white/80 rounded-b-sm border border-[#e5dfd8] relative overflow-hidden flex items-center justify-center">
                 <div className="absolute bottom-0 w-full h-1/2 bg-[#cd853f]/80" />
                 <div className="w-5 h-3 bg-white border border-[#e5dfd8] rounded-sm z-10 text-[4px] flex items-center justify-center font-serif text-black">BASIL</div>
               </div>
            </div>
          )
        },
        {
          type: 'plant',
          name: 'Rosemary Pot',
          element: (
            <div key={`rosemary-${shelfIdx}-${salt}`} className="flex flex-col items-center justify-end h-[80px] w-[50px] shrink-0 self-end relative group select-none transition-transform hover:-translate-y-1">
               <div className="flex gap-0.5 items-end justify-center">
                  <div className="w-1 h-12 bg-green-600 rounded-full rotate-[-15deg] origin-bottom shadow-sm" />
                  <div className="w-1 h-14 bg-green-700 rounded-full z-10 shadow-sm" />
                  <div className="w-1 h-10 bg-green-500 rounded-full rotate-[15deg] origin-bottom shadow-sm" />
               </div>
               <div className="w-8 h-6 bg-[#d2691e] rounded-b-md border-t-2 border-[#a0522d] shadow-sm z-20" />
            </div>
          )
        }
      ];
      return assets[(shelfIdx + salt) % assets.length].element;
    }
    
    if (shelfSkin === 'Trophy Case') {
      const assets = [
        {
          type: 'trophy',
          name: 'Golden Cup',
          element: (
            <div key={`trophy-${shelfIdx}-${salt}`} className="flex flex-col items-center justify-end h-[80px] w-[50px] shrink-0 self-end relative group select-none transition-transform hover:-translate-y-1">
               <div className="w-10 h-8 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-b-full border border-yellow-700 shadow-[0_0_15px_rgba(255,215,0,0.3)] relative">
                 <div className="absolute -left-2 top-0 w-3 h-4 border-2 border-yellow-500 rounded-l-full" />
                 <div className="absolute -right-2 top-0 w-3 h-4 border-2 border-yellow-500 rounded-r-full" />
               </div>
               <div className="w-2 h-4 bg-yellow-600" />
               <div className="w-8 h-3 bg-gradient-to-b from-gray-700 to-gray-900 rounded-t-sm border border-gray-600" />
            </div>
          )
        },
        {
          type: 'plaque',
          name: 'Display Plaque',
          element: (
            <div key={`plaque-${shelfIdx}-${salt}`} className="flex flex-col items-center justify-end h-[50px] w-[40px] shrink-0 self-end relative group select-none transition-transform hover:-translate-y-1 pb-1">
               <div className="w-full h-8 bg-gradient-to-br from-amber-800 to-amber-950 rounded-sm border border-amber-900 p-1 shadow-md flex items-center justify-center relative">
                 <div className="w-full h-full border border-amber-700/50 flex flex-col items-center justify-center">
                   <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_5px_yellow] mb-0.5" />
                   <div className="w-6 h-0.5 bg-yellow-600/50 rounded-full" />
                 </div>
               </div>
            </div>
          )
        }
      ];
      return assets[(shelfIdx + salt) % assets.length].element;
    }

    const assets = [
      {
        type: 'potion',
        name: 'Glowing Potion Flask',
        element: (
          <div key={`flask-${shelfIdx}-${salt}`} className="flex flex-col items-center justify-end h-[140px] w-[40px] shrink-0 self-end px-1 pb-0.5 relative group select-none transition-transform hover:-translate-y-1">
            {/* Cork */}
            <div className="w-3 h-2 bg-[#8B5A2B] rounded-t-sm border border-[#5C3A21] shadow-inner z-10" />
            <div className="w-4 h-1 bg-[#5C3A21] rounded-sm -mt-px z-10" />
            {/* Glass Neck */}
            <div className="w-3.5 h-4 bg-gradient-to-r from-white/20 via-white/5 to-white/20 border-x border-white/30" />
            {/* Round Flask Body */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500/60 to-purple-900/80 border border-fuchsia-300/40 shadow-[0_0_15px_rgba(217,70,239,0.3)] relative flex items-center justify-center overflow-hidden">
              {/* Liquid level */}
              <div className="absolute bottom-0 w-full h-5 bg-gradient-to-t from-fuchsia-600 to-fuchsia-400/80" />
              {/* Highlight */}
              <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-white/40 rounded-full blur-[1px]" />
              {/* Bubbles */}
              <div className="absolute bottom-1 right-2 w-1 h-1 bg-white/50 rounded-full" />
              <div className="absolute bottom-3 left-2 w-0.5 h-0.5 bg-white/60 rounded-full" />
            </div>
            {/* Base shadow */}
            <div className="w-6 h-0.5 bg-black/60 shadow-[0_2px_4px_rgba(0,0,0,0.8)] rounded-full mt-0.5" />
            
            <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-[#2a1d2e]/90 border border-fuchsia-900/50 p-1 px-2 rounded-md text-[9px] text-[#CAB9D4] text-center shadow-lg font-sans z-50 backdrop-blur-sm">
              Amethyst Potion
            </span>
          </div>
        )
      },
      {
        type: 'tall-vial',
        name: 'Specimen Vial',
        element: (
          <div key={`vial-${shelfIdx}-${salt}`} className="flex flex-col items-center justify-end h-[140px] w-[30px] shrink-0 self-end px-1 pb-0.5 relative group select-none transition-transform hover:-translate-y-1">
            {/* Stopper */}
            <div className="w-2.5 h-2 bg-[#2a2a2a] rounded-t-sm border border-black" />
            {/* Tall Glass Body */}
            <div className="w-5 h-12 bg-gradient-to-b from-cyan-900/40 to-cyan-700/60 border border-cyan-200/30 rounded-b-md relative overflow-hidden shadow-[0_0_10px_rgba(34,211,238,0.15)]">
               {/* Specimen / Liquid */}
               <div className="absolute bottom-0 w-full h-8 bg-gradient-to-t from-cyan-600 to-cyan-400/50 border-t border-cyan-300/50" />
               <div className="absolute bottom-2 left-1 w-2 h-4 bg-cyan-900/40 rounded-full rotate-12 blur-[0.5px]" />
               {/* Glass reflection */}
               <div className="absolute top-0 left-0.5 bottom-0 w-1 bg-gradient-to-b from-white/30 to-transparent" />
            </div>
            {/* Base shadow */}
            <div className="w-5 h-0.5 bg-black/60 shadow-[0_2px_4px_rgba(0,0,0,0.8)] rounded-full mt-0.5" />
            <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-[#1d262a]/90 border border-cyan-900/50 p-1 px-2 rounded-md text-[9px] text-[#CAB9D4] text-center shadow-lg font-sans z-50 backdrop-blur-sm">
              Bioluminescent Specimen
            </span>
          </div>
        )
      },
      {
        type: 'candle',
        name: 'Melting Candle',
        element: (
          <div key={`candle-${shelfIdx}-${salt}`} className="flex flex-col items-center justify-end h-[140px] w-[35px] shrink-0 self-end px-1 pb-0.5 relative group select-none transition-transform hover:-translate-y-1">
            {/* Flame */}
            <div className="w-1.5 h-2.5 bg-amber-400 rounded-full blur-[1px] -mb-0.5 z-10 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
            {/* Wick */}
            <div className="w-px h-1.5 bg-black -mb-px z-10" />
            {/* Candle Body */}
            <div className="w-4 h-9 bg-gradient-to-b from-[#e5e5e0] via-[#d4d4d0] to-[#9c9c96] rounded-sm border-x border-[#80807b] relative">
              {/* Melt drips */}
              <div className="absolute top-0 -left-0.5 w-1 h-3 bg-[#e5e5e0] rounded-b-full border-b border-l border-[#80807b]" />
              <div className="absolute top-0 -right-0.5 w-1 h-2 bg-[#e5e5e0] rounded-b-full border-b border-r border-[#80807b]" />
              <div className="absolute top-0 left-1.5 w-1 h-4 bg-[#e5e5e0] rounded-b-full border-b border-r border-[#80807b] z-20" />
            </div>
            {/* Holder */}
            <div className="w-6 h-1 bg-[#4c3e2e] rounded-t-sm border border-black/40 shadow-sm" />
            <div className="w-7 h-1 bg-[#3a2f23] rounded-sm border border-black/50 shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-[#29221c]/90 border border-amber-900/50 p-1 px-2 rounded-md text-[9px] text-[#CAB9D4] text-center shadow-lg font-sans z-50 backdrop-blur-sm">
              Antiquarian Candle
            </span>
          </div>
        )
      },
      {
        type: 'jar',
        name: 'Apothecary Jar',
        element: (
          <div key={`jar-${shelfIdx}-${salt}`} className="flex flex-col items-center justify-end h-[140px] w-[45px] shrink-0 self-end px-1 pb-0.5 relative group select-none transition-transform hover:-translate-y-1">
            {/* Glass Lid */}
            <div className="w-2.5 h-2.5 bg-white/20 border border-white/30 rounded-t-full rounded-b-sm" />
            <div className="w-4 h-1 bg-white/30 border border-white/40 rounded-sm -mt-0.5" />
            {/* Wide Jar Body */}
            <div className="w-7 h-7 bg-gradient-to-br from-green-900/30 to-emerald-800/40 border border-white/20 rounded-md relative overflow-hidden shadow-[0_0_10px_rgba(16,185,129,0.1)] mt-px">
               {/* Contents (Herbs/Moss) */}
               <div className="absolute bottom-0 w-full h-4 bg-gradient-to-t from-green-900 to-green-700/80 border-t border-green-500/30">
                 <div className="w-full h-full opacity-50 bg-[radial-gradient(circle,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:3px_3px]" />
               </div>
               {/* Glass reflection */}
               <div className="absolute top-0.5 left-1 bottom-0.5 w-1.5 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
            </div>
            {/* Label */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-2.5 bg-[#ebdcc5] border border-black/40 rounded-xs flex items-center justify-center z-10">
               <div className="w-2.5 h-[0.5px] bg-black/60" />
            </div>
            {/* Base shadow */}
            <div className="w-6 h-0.5 bg-black/60 shadow-[0_2px_4px_rgba(0,0,0,0.8)] rounded-full mt-0.5" />
            <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-[#1b261f]/90 border border-green-900/50 p-1 px-2 rounded-md text-[9px] text-[#CAB9D4] text-center shadow-lg font-sans z-50 backdrop-blur-sm">
              Dried Mandrake Root
            </span>
          </div>
        )
      },
      {
        type: 'skull',
        name: 'Carved Skull',
        element: (
          <div key={`skull-${shelfIdx}-${salt}`} className="flex flex-col items-center justify-end h-[140px] w-[35px] shrink-0 self-end px-1 pb-0.5 relative group select-none transition-transform hover:-translate-y-1">
            {/* Skull Body */}
            <div className="w-6 h-5 bg-gradient-to-br from-[#ebdcc5] to-[#a69882] rounded-t-[12px] rounded-b-sm border border-[#8b6508]/40 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3)] relative flex flex-col items-center">
               {/* Eyes */}
               <div className="flex gap-1.5 mt-2">
                 <div className="w-1.5 h-1.5 bg-black rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" />
                 <div className="w-1.5 h-1.5 bg-black rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" />
               </div>
               {/* Nose */}
               <div className="w-0.5 h-1 bg-black rounded-full mt-0.5" />
               {/* Teeth */}
               <div className="flex gap-px mt-1 w-3">
                 <div className="w-px h-1 bg-black/40" />
                 <div className="w-px h-1 bg-black/40" />
                 <div className="w-px h-1 bg-black/40" />
               </div>
            </div>
            {/* Base shadow */}
            <div className="w-6 h-0.5 bg-black/60 shadow-[0_2px_4px_rgba(0,0,0,0.8)] rounded-full mt-0.5" />
            <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-[#1f1a14]/90 border border-amber-900/50 p-1 px-2 rounded-md text-[9px] text-[#CAB9D4] text-center shadow-lg font-sans z-50 backdrop-blur-sm">
              Strange Artifact
            </span>
          </div>
        )
      },
      {
        type: 'hourglass',
        name: 'Brass Hourglass',
        element: (
          <div key={`hg-${shelfIdx}-${salt}`} className="flex flex-col items-center justify-end h-[140px] w-[30px] shrink-0 self-end px-1 pb-0.5 relative group select-none transition-transform hover:-translate-y-1">
            {/* Top Base */}
            <div className="w-5 h-1 bg-gradient-to-r from-[#d4af37] to-[#aa801b] rounded-sm border border-[#8b6508] shadow-sm z-10" />
            {/* Glass */}
            <div className="w-4 h-6 bg-white/10 border-x border-white/30 rounded-full flex flex-col items-center justify-between overflow-hidden relative backdrop-blur-[1px] -my-[1px]">
               {/* Top Sand */}
               <div className="w-full h-2.5 bg-gradient-to-b from-amber-200 to-amber-400 opacity-90 rounded-b-full border-b border-amber-600/50" />
               {/* Falling stream */}
               <div className="w-px h-1 bg-amber-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
               {/* Bottom Sand */}
               <div className="w-full h-2 bg-gradient-to-t from-amber-400 to-amber-200 opacity-90 rounded-t-full mt-auto border-t border-amber-600/50" />
            </div>
            {/* Bottom Base */}
            <div className="w-5 h-1 bg-gradient-to-r from-[#d4af37] to-[#aa801b] rounded-sm border border-[#8b6508] shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10" />
            {/* Base shadow */}
            <div className="w-5 h-0.5 bg-black/60 rounded-full mt-0.5" />
            <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-[#2a241b]/90 border border-amber-900/50 p-1 px-2 rounded-md text-[9px] text-[#CAB9D4] text-center shadow-lg font-sans z-50 backdrop-blur-sm">
              Sands of Time
            </span>
          </div>
        )
      }
    ];
    return assets[(shelfIdx + salt) % assets.length];
  };

  const renderHorizontalStack = (shelfIdx: number, slotIdx: number) => {
    return (
      <div key={`hstack-${shelfIdx}-${slotIdx}`} className="flex flex-col items-center justify-end h-[140px] w-[110px] shrink-0 self-end -space-y-2 pb-0.5 relative group select-none mx-2">
        <div className="w-[84px] h-4.5 bg-[#5c2d25] rounded-xs border border-t-amber-300/30 border-black/40 shadow-md relative flex items-center justify-center rotate-[-3deg] hover:rotate-0 duration-200 transition-transform cursor-pointer">
          <div className="absolute left-1 top-0.5 bottom-0.5 w-1 border-r border-[#ebd8d5]/40" />
          <span className="text-[6.5px] font-bold text-[#ebd8d5]/90 font-mono tracking-tighter uppercase px-1 truncate max-w-[85%]">Spannend</span>
        </div>
        <div className="w-[94px] h-5 bg-[#2d4030] rounded-xs border border-t-emerald-300/30 border-black/40 shadow-sm relative flex items-center justify-center rotate-[1.5deg] hover:rotate-0 duration-200 transition-transform cursor-pointer">
          <div className="absolute left-1.5 top-0.5 bottom-0.5 w-1 border-r border-[#cfdfcf]/40" />
          <span className="text-[6.5px] font-bold text-[#cfdfcf]/90 font-mono tracking-tighter uppercase px-1 truncate max-w-[85%]">Habitats</span>
        </div>
        <div className="w-[104px] h-5.5 bg-[#4c3b2b] rounded-xs border border-t-amber-400/20 border-[#29221c] shadow-md relative flex items-center justify-center hover:scale-105 duration-200 transition-all cursor-pointer">
          <div className="absolute left-1 top-0.5 bottom-0.5 w-1 border-r border-[#ebdcc5]/40" />
          <span className="text-[6.5px] font-bold text-[#ebdcc5]/90 font-mono tracking-tighter uppercase px-1 truncate max-w-[85%]">Tome Of Ferns</span>
        </div>
        <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-[#0e0e11] border border-amber-900/50 p-1 px-2 rounded-md text-[9px] text-[#CAB9D4] text-center shadow-lg font-sans z-50">
          Stacked Ancient Tomes
        </span>
      </div>
    );
  };

  // Group books onto multiple shelves (14 per row looks magnificent and completely fills the wood planks)
  const CHUNK_SIZE = 14;
  const shelfRows = [];
  for (let i = 0; i < processedBooks.length; i += CHUNK_SIZE) {
    shelfRows.push(processedBooks.slice(i, i + CHUNK_SIZE));
  }

  // Compute count for each status
  const getCountForStatus = (status: StatusFilter): number => {
    if (status === 'all') return books.filter(b => !b.didNotFinish).length;
    if (status === 'dnf') return books.filter(b => b.didNotFinish).length;
    return books.filter(book => !book.didNotFinish && getBookStatus(book.id) === status).length;
  };

  return (
    <div className="relative">
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/[0.02] blur-[100px] rounded-full pointer-events-none" />

      {/* Search and Filters Header */}
      <div className="flex flex-col gap-4 border-b border-app-border/60 pb-4 mb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-purple/10 border border-brand-purple/20 text-[#CAB9D4] rounded-lg">
            <SlidersHorizontal size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-100 font-display">Books</h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">Total: {books.length} publications tracking</p>
          </div>
        </div>

        {/* Action controls for layout and search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Layout Mode Toggler */}
          <div className="flex items-center bg-app-base border border-app-border p-0.5 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setLayoutMode('shelf')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                layoutMode === 'shelf'
                  ? 'bg-brand-purple text-[#340F04] font-extrabold'
                  : 'text-[var(--color-text-muted)] hover:text-white'
              }`}
              title="Spines on Shelf View"
            >
              <Columns size={12} /> Spine
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                layoutMode === 'grid'
                  ? 'bg-brand-purple text-[#340F04] font-extrabold'
                  : 'text-[var(--color-text-muted)] hover:text-white'
              }`}
              title="Modern Grid View"
            >
              <Grid size={12} /> Grid
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                layoutMode === 'list'
                  ? 'bg-brand-purple text-[#340F04] font-extrabold'
                  : 'text-[var(--color-text-muted)] hover:text-white'
              }`}
              title="Detailed List View"
            >
              <List size={12} /> List
            </button>
          </div>

          {/* Skin Selector (Only visible in Shelf mode) */}
          {layoutMode === 'shelf' && onUpdateShelfSkin && (
            <div className="relative group w-full sm:w-auto">
              <select 
                value={shelfSkin} 
                onChange={e => onUpdateShelfSkin(e.target.value)}
                className="appearance-none bg-app-base border border-app-border text-[var(--color-text-main)] text-xs font-bold uppercase tracking-wider py-1.5 pl-3 pr-8 rounded-lg outline-none cursor-pointer hover:border-brand-purple transition-colors w-full sm:w-auto h-[30px]"
              >
                <option value="Plain">Plain Skin</option>
                <option value="Apothecary">Apothecary Skin</option>
                <option value="Trophy Case">Trophy Case</option>
                <option value="Kitchen">Kitchen Skin</option>
                <option value="Spooky">Spooky Skin</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          )}

          {/* Local Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={13} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search within shelf..."
              className="w-full bg-app-base border border-app-border rounded-lg pl-8 pr-4 py-1.5 text-xs text-[var(--color-text-main)] placeholder-gray-500 focus:outline-hidden focus:border-brand-purple/50"
            />
          </div>
        </div>
      </div>

      {/* Filters and Year Tabs Row */}
      <div className="flex flex-col gap-3 mb-5 p-3 bg-app-base border border-app-border rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 p-0.5 bg-[#141417] border border-app-border rounded-lg w-fit">
            {(['all', 'backlog', 'active', 'completed', 'dnf'] as StatusFilter[]).map((tab) => {
              const count = getCountForStatus(tab);
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 group ${
                    filter === tab
                      ? 'bg-brand-purple text-[#340F04] shadow-xs'
                      : 'text-[var(--color-text-muted)] hover:text-white hover:bg-app-card'
                  }`}
                >
                  <span>{tab.replace('-', ' ')}</span>
                  <span className={`px-1.5 py-0.5 text-[8.5px] font-mono font-extrabold rounded-md shadow-xs ${
                    filter === tab
                      ? 'bg-[#340F04]/10 text-[#340F04]'
                      : 'bg-[#212127] text-[#CAB9D4] group-hover:text-white'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Controls Row */}
          <div className="flex items-center gap-2 bg-[#141417] border border-app-border rounded-lg p-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] px-1 font-mono">Sort:</span>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="bg-app-base border border-app-border text-[var(--color-text-main)] text-[11px] font-bold px-2 py-1 rounded focus:outline-none cursor-pointer"
            >
              <option value="date-read">Date Added/Read</option>
              <option value="rating">Rating</option>
              <option value="title">Alphabetical (A-Z)</option>
              <option value="author">Author</option>
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
        </div>

        {/* Dynamic Year tab filter inside 'all' status tab */}
        {filter === 'all' && availableYears.length > 0 && (
          <div className="border-t border-app-border/60 pt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] uppercase font-black text-[#CAB9D4]/70 tracking-widest font-mono mr-2">Filter Year:</span>
            
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-2.5 py-1 text-[9.5px] font-black uppercase rounded-md transition-all cursor-pointer ${
                selectedYear === 'all'
                  ? 'bg-[#CAB9D4]/25 text-[#CAB9D4] border border-[#CAB9D4]/35 font-extrabold'
                  : 'text-[var(--color-text-muted)] hover:text-white bg-transparent border border-transparent hover:bg-[#141417]'
              }`}
            >
              All Years
            </button>

            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-2.5 py-1 text-[9.5px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-brand-turquoise/20 text-brand-turquoise border border-brand-turquoise/30 font-extrabold'
                    : 'text-[var(--color-text-muted)] hover:text-white bg-transparent border border-transparent hover:bg-[#141417]'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Shared Batch Mode Action Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-app-base border border-app-border/60 rounded-xl p-3 shadow-inner mt-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setIsBatchMode(!isBatchMode);
              setSelectedBatchIds([]);
            }}
            className={`px-3 py-1.5 border rounded-lg text-xs font-bold font-mono transition-all uppercase select-none cursor-pointer flex items-center gap-1.5 ${
              isBatchMode
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-[#15151a] hover:bg-app-card text-[var(--color-text-muted)] border-app-border hover:text-white'
            }`}
          >
            <SlidersHorizontal size={12} />
            {isBatchMode ? 'Cancel Selection' : 'Batch Manage'}
          </button>
          {isBatchMode && (
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase font-mono">
              {selectedBatchIds.length} of {processedBooks.length} Selected
            </span>
          )}
        </div>

        {isBatchMode && selectedBatchIds.length > 0 && (
          <div className="flex items-center flex-wrap gap-2">
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  handleBatchShelfUpdate(val);
                  e.target.value = "";
                }
              }}
              defaultValue=""
              className="bg-[#181820] border border-app-border text-xs px-2.5 py-1.5 rounded-lg text-[var(--color-text-main)] focus:outline-none focus:border-brand-purple/50 cursor-pointer"
            >
              <option value="" disabled>Move Selected To...</option>
              <option value="completed">Completed Shelf</option>
              <option value="active">Currently Reading</option>
              <option value="backlog">Plan to Read</option>
              <option value="dnf">Did Not Finish (DNF)</option>
            </select>

            <button
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="px-3 py-1.5 bg-red-955/20 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-900/40 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1"
            >
              <Trash2 size={12} />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Main Container Switch */}
      {layoutMode === 'shelf' ? (
        /* Bookshelf Spine View Mode */
        <div className="relative space-y-12 py-3 px-2 rounded-lg bg-[#2a1309] border-4 border-[#1c0c05] shadow-inner overflow-hidden mt-4">
          {/* Rich Mahogany Wall Background */}
          <div className="absolute inset-0 pointer-events-none mix-blend-overlay">
            <div className="w-full h-full bg-gradient-to-br from-[#3b1f15] via-[#2a1309] to-[#140804] opacity-90" />
            <div className="w-full h-full absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-black/60" />
            {/* Soft wood texture effect */}
            <div className="w-full h-full absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1601662528567-526cd06f6582?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center mix-blend-multiply" />
          </div>
          
          {shelfRows.length > 0 ? (
            shelfRows.map((shelfBooks, shelfIdx) => {
              // Books are rendered dynamically relative to the 14-column shelf
              // Dynamically hide or remove gold bookends if styled nicely with stacks and plants (which occurs when the shelf is not fully packed)
              const showLeftBookend = shelfBooks.length >= 11;
              const showRightBookend = shelfBooks.length >= 11;

              return (
                <div 
                  key={shelfIdx} 
                  className={`relative pt-6 ${pinningBadge ? 'cursor-crosshair' : ''}`} 
                  onClick={(e) => handleShelfClick(e, shelfIdx)}
                >
                  {/* Pinned Badges */}
                  {pinnedBadges.filter((b: any) => b.shelfIdx === shelfIdx).map((badge: any) => (
                    <div 
                      key={badge.id}
                      className="absolute z-30 flex items-center justify-center pointer-events-none drop-shadow-md"
                      style={{ left: `${badge.x}%`, top: `${badge.y}%`, transform: 'translate(-50%, -50%) rotate(-5deg)' }}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${(BADGES as any)[badge.badgeId]?.color}`}>
                        <span className="text-lg">{(BADGES as any)[badge.badgeId]?.icon}</span>
                      </div>
                    </div>
                  ))}

                  {shelfSkin === 'Apothecary' && (
                  <div className="absolute top-0 bottom-0 left-0 right-0 max-w-5xl mx-auto pointer-events-none z-0">
                    {/* Dried Herbs Bundle */}
                    {shelfIdx % 2 === 0 && (
                      <div className="absolute top-2 left-[10%] sm:left-1/4 flex flex-col items-center">
                        <div className="w-px h-8 bg-amber-950/60" />
                        <div className="w-2 h-1 bg-amber-800 rounded-sm" />
                        <div className="flex gap-1 -mt-1 opacity-80">
                          <div className="w-1.5 h-10 bg-gradient-to-b from-green-800 to-green-950 rounded-b-full rotate-6 origin-top" />
                          <div className="w-2 h-12 bg-gradient-to-b from-green-700 to-emerald-950 rounded-b-full rotate-2 origin-top" />
                          <div className="w-1.5 h-11 bg-gradient-to-b from-green-900 to-[#2a3a22] rounded-b-full -rotate-6 origin-top" />
                        </div>
                      </div>
                    )}
                    {/* Suspended Mystical Amulet */}
                    {shelfIdx % 3 === 0 && (
                      <div className="absolute top-0 left-[40%] sm:left-[55%] flex flex-col items-center" style={{ transform: `translateY(${shelfIdx * 5}px)` }}>
                        <div className="w-px h-12 bg-[#8b6508]/40" />
                        <div className="w-6 h-6 rounded-full bg-[#3b1f15]/80 border border-[#d4af37]/60 shadow-[0_0_15px_rgba(212,175,55,0.15)] flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-purple-400/80 blur-[1px] animate-pulse" />
                        </div>
                        <div className="w-0.5 h-3 bg-[#d4af37]/40" />
                      </div>
                    )}
                    {/* Hanging Rolled Scroll */}
                    {shelfIdx % 2 !== 0 && (
                      <div className="absolute top-4 right-[15%] sm:right-[20%] w-5 h-[70px] bg-gradient-to-b from-[#ebdcc5]/40 to-[#c2b39e]/20 border border-[#8b6508]/20 rounded-sm shadow-md rotate-3 flex flex-col items-center">
                         <div className="w-6 h-2 bg-gradient-to-b from-[#d4af37]/50 to-[#aa801b]/50 rounded-t-sm border border-[#8b6508]/40 -ml-0.5" />
                         <div className="w-3 h-[1px] bg-[#8b6508]/30 mt-2" />
                         <div className="w-2 h-[1px] bg-[#8b6508]/30 mt-1" />
                         <div className="w-4 h-[1px] bg-[#8b6508]/30 mt-1" />
                         <div className="w-6 h-2 bg-gradient-to-b from-[#d4af37]/50 to-[#aa801b]/50 rounded-b-sm border border-[#8b6508]/40 mt-auto -ml-0.5" />
                      </div>
                    )}
                  </div>
                  )}

                  {shelfSkin === 'Spooky' && (
                    <div className="absolute top-0 bottom-0 left-0 right-0 max-w-5xl mx-auto pointer-events-none z-0 overflow-hidden">
                      {/* Cobwebs */}
                      {shelfIdx % 2 === 0 && (
                        <div className="absolute -top-2 left-[5%] w-16 h-16 border-t-2 border-l-2 border-green-500/20 rounded-tl-full opacity-50" />
                      )}
                      {/* Slime drip */}
                      {shelfIdx % 2 !== 0 && (
                        <div className="absolute top-0 right-[20%] flex gap-1 opacity-70 drop-shadow-[0_0_5px_lime]">
                          <div className="w-1.5 h-8 bg-green-500 rounded-b-full" />
                          <div className="w-2 h-12 bg-green-400 rounded-b-full" />
                          <div className="w-1 h-5 bg-green-600 rounded-b-full" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Book Spines container aligned layout */}
                  <div className="flex items-end justify-center min-h-[190px] px-2 sm:px-4 gap-0.5 sm:gap-1.5 relative z-10 max-w-5xl mx-auto">
                    
                    {showLeftBookend ? renderLeftBookend() : (
                      // Cozy trailing plant/decor as Left book stopper instead!
                      <div className="w-8 shrink-0 self-end -mr-1 z-20 text-center text-xl cursor-default select-none animate-pulse" style={{ animationDuration: '4s' }}>
                        🌿
                      </div>
                    )}

                    {/* Render Books & Special Decor Items */}
                    {Array.from({ length: CHUNK_SIZE }).map((_, slotIdx) => {
                      const book = shelfBooks[slotIdx];
                      
                      // Interleave decor between books on the shelf naturally
                      const showDecorBefore = (shelfIdx + slotIdx) % 5 === 2;
                      const decorElement = showDecorBefore ? getDecorForSlot(shelfIdx, slotIdx + 50)?.element : null;

                      // If slot contains real user books
                      if (book) {
                        const status = getBookStatus(book.id);
                        const review = getBookReview(book.id);
                        const spine = getSpineColorAndHeight(book.id, book.title, slotIdx, status);
                        const isSelected = selectedBatchIds.includes(book.id);
                        
                        let leanClass = "rotate-0 z-10 shadow-none";
                        
                        return (
                          <React.Fragment key={`slot-${shelfIdx}-${slotIdx}`}>
                            {decorElement}
                            <div
                              onClick={(e) => {
                                if (isBatchMode) {
                                  setSelectedBatchIds(prev => 
                                    prev.includes(book.id) ? prev.filter(id => id !== book.id) : [...prev, book.id]
                                  );
                                  return;
                                }
                                if (isLongPressing.current) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  isLongPressing.current = false;
                                  return;
                                }
                                onSelectBook(book.id);
                              }}
                              onTouchStart={(e) => {
                                if (isBatchMode) return;
                                e.stopPropagation();
                                isLongPressing.current = false;
                                longPressTimer.current = setTimeout(() => {
                                  isLongPressing.current = true;
                                  setActiveTooltip(book.id);
                                }, 500);
                              }}
                              onTouchEnd={(e) => {
                                if (longPressTimer.current) clearTimeout(longPressTimer.current);
                              }}
                              onTouchMove={() => {
                                if (longPressTimer.current) clearTimeout(longPressTimer.current);
                                isLongPressing.current = false;
                              }}
                            className={`group relative flex flex-col justify-between w-[20px] sm:w-[32px] md:w-[36px] transition-transform duration-200 hover:-translate-y-2 cursor-pointer border-x border-t pb-0 rounded-t-sm shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${spine.colorClass} ${leanClass} ${isSelected && isBatchMode ? 'ring-2 ring-brand-purple ring-offset-1 ring-offset-[#2a1309] -translate-y-2' : ''}`}
                            style={{ height: spine.height }}
                          >
                            {/* Top binding organic detailing */}
                            <div className="h-2 w-full border-b border-black/40 bg-gradient-to-b from-white/30 to-transparent rounded-t-sm" />

                            {/* Status Hanging Fabric Ribbon Or Star Badge */}
                            {status === 'active' && (
                              <div className="absolute top-0 right-1 sm:right-1.5 w-2 h-6 bg-gradient-to-b from-[#4ade80] to-[#16a34a] rounded-b-sm shadow-md animate-pulse" title="Reading Now">
                                <div className="absolute bottom-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[4px] border-b-black/20 w-full" />
                              </div>
                            )}
                            {status === 'completed' && (
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" title="Completed!">
                                <Star size={10} fill="currentColor" strokeWidth={0} />
                              </div>
                            )}

                            {/* Vertically Aligned Spine text */}
                            <div className="flex-1 overflow-hidden flex items-center justify-center py-3 px-0.5 select-none relative">
                              {/* Spine texture overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
                              <div className="[writing-mode:vertical-rl] text-[7px] sm:text-[9px] font-bold text-center tracking-wide truncate uppercase max-h-[85%] font-serif leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] z-10">
                                {book.title}
                              </div>
                            </div>

                            {/* Bottom bound organic detailing */}
                            <div className="h-2.5 w-full border-t border-black/40 bg-gradient-to-t from-black/40 to-transparent" />

                            {/* Interactive floating detailed preview hover tooltip */}
                            <div className={`${activeTooltip === book.id ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0'} absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-[#231b2b]/95 border border-purple-900/50 rounded-md p-3 text-center text-white shadow-xl pointer-events-none z-50 backdrop-blur-sm transition-all duration-200`}>
                              <div className="text-[12px] font-bold line-clamp-2 leading-tight font-serif text-[#ebdcc5] drop-shadow-sm">
                                {book.title}
                              </div>
                              <div className="points-wrap text-[12px] leading-none mt-1">
                                <span className="points-underline-glow" />
                                <span className="points-badge"><span className="points-badge-inner">{getBookPoints(book, status).toLocaleString()} PTS</span></span>
                              </div>
                              <p className="text-[10px] text-purple-300 mt-1.5 truncate italic">{book.author}</p>
                              <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-purple-900/50 text-[10px] text-[var(--color-text-muted)] font-sans">
                                <span className="uppercase tracking-wider text-[9px]">{status.replace('-', ' ')}</span>
                                {review && review.rating > 0 && (
                                  <span className="text-amber-400 font-bold flex items-center gap-0.5 drop-shadow-sm">
                                    <Star size={9} fill="currentColor" strokeWidth={0} /> {review.rating}/5
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          </React.Fragment>
                        );
                      }

                      // If slot is empty filler, render decorative options or empty space
                      
                      // For remaining empty slots, render a blank watercolor spine
                      const spine = getSpineColorAndHeight(`empty-${slotIdx}`, ' ', slotIdx, 'backlog');
                      return (
                        <React.Fragment key={`filler-${shelfIdx}-${slotIdx}`}>
                        {decorElement}
                        <div
                          className={`w-[18px] sm:w-[28px] md:w-[32px] border-x border-t pb-0 rounded-t-sm cursor-default select-none ${spine.colorClass} opacity-30 hover:opacity-50 transition-opacity flex flex-col justify-between`}
                          style={{ height: spine.height }}
                        >
                          {/* Top flat detail */}
                          <div className="h-2 w-full border-b border-black/20 bg-white/10 rounded-t-sm" />

                          {/* Watercolor decorative bands */}
                          <div className="flex-1 flex flex-col items-center justify-around py-4 opacity-50">
                            <div className="w-full h-px bg-black/40" />
                            <div className="w-1.5 h-1.5 rounded-full bg-black/30" />
                            <div className="w-full h-px bg-black/40" />
                          </div>

                          {/* Bottom bound flat detail */}
                          <div className="h-2.5 w-full border-t border-black/30 bg-black/20" />
                        </div>
                        </React.Fragment>
                      );
                    })}

                    {showRightBookend ? renderRightBookend() : (
                      // Cozy candle or flower stopper
                      <div className="w-8 shrink-0 self-end -ml-1 z-20 text-center text-xl cursor-default select-none">
                        🕯️
                      </div>
                    )}
                  </div>

                  {/* Ghibli-style Hand-Painted Wood Shelf Plank */}
                  <div className="relative h-7 w-full z-10">
                    {/* Shelf Top Surface */}
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-b from-[#875c3d] to-[#6b442b] rounded-t-sm z-10 border-t border-[#a3795a]/40 shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
                    
                    {/* Shelf Front Edge (Organic) */}
                    <div className="absolute inset-0 top-[4px] bg-gradient-to-b from-[#4a2e1b] to-[#2a170b] rounded-b-md shadow-[0_8px_12px_rgba(0,0,0,0.8)] overflow-hidden border-b border-black">
                      {/* Organic Wood Grain Sweeps */}
                      <div className="absolute top-1 left-0 right-0 h-px bg-[#1f1007] opacity-60" />
                      <div className="absolute top-3 -left-4 right-1/2 h-0.5 bg-[#1f1007] opacity-50 rounded-[100%] rotate-1" />
                      <div className="absolute top-2 left-1/3 -right-4 h-0.5 bg-[#1f1007] opacity-50 rounded-[100%] -rotate-1" />
                      <div className="absolute bottom-1 left-0 right-0 h-px bg-black opacity-80" />
                      
                      {/* End cap shading for depth */}
                      <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/60 to-transparent" />
                      <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/60 to-transparent" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-[var(--color-text-muted)] rounded-lg bg-app-base border border-dashed border-app-border">
              <Bookmark size={24} className="mx-auto mb-2 opacity-30 text-[#CAB9D4]" />
              <p className="text-xs text-[var(--color-text-muted)] font-medium font-sans">
                {searchQuery ? 'No publications match your query.' : 'This bookshelf is empty. Find and add books above!'}
              </p>
            </div>
          )}
        </div>
      ) : layoutMode === 'grid' ? (
        /* Original Visual Grid layout styled with the palette */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {processedBooks.length > 0 ? (
              processedBooks.map((book, idx) => {
                const status = getBookStatus(book.id);
                const review = getBookReview(book.id);
                const isSelected = selectedBatchIds.includes(book.id);

                return (
                  <motion.div
                    key={`${book.id}-${idx}`}
                    layoutId={`book_card_${book.id}_${idx}`}
                    onClick={() => {
                      if (isBatchMode) {
                        setSelectedBatchIds(prev => 
                          prev.includes(book.id) ? prev.filter(id => id !== book.id) : [...prev, book.id]
                        );
                      } else {
                        onSelectBook(book.id);
                      }
                    }}
                    className={`group relative flex gap-3 p-3 rounded-lg transition-all cursor-pointer overflow-hidden border ${
                      isSelected
                        ? 'border-brand-purple bg-brand-purple/5 shadow-[0_0_12px_rgba(168,85,247,0.15)] animate-pulse-subtle'
                        : 'bg-app-base border-app-border/60 hover:border-brand-purple/30 hover:bg-[#141417]/80'
                    }`}
                  >
                    {/* Checkbox overlay for batch management */}
                    {isBatchMode && (
                      <div className="absolute top-2 right-2 z-20">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by onClick on card
                          className="w-3.5 h-3.5 border-gray-600 rounded text-brand-purple focus:ring-brand-purple accent-brand-purple cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Book Cover Image container */}
                    <div className="w-12 h-18 rounded bg-black/40 border border-app-border relative shadow overflow-hidden shrink-0 group-hover:scale-[1.03] transition-transform">
                      <img
                        referrerPolicy="no-referrer"
                        src={book.coverUrl}
                        alt={book.title}
                        onError={(e) => handleImageError(e, book.title)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    {/* Meta details text */}
                    <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-white leading-tight truncate group-hover:text-brand-purple transition-colors pr-4">
                          {book.title}
                        </h3>
                        <div className="points-wrap text-[13px] leading-none my-0.5">
                          <span className="points-underline-glow" />
                          <span className="points-badge"><span className="points-badge-inner">{getBookPoints(book, status).toLocaleString()} PTS</span></span>
                        </div>
                        <p className="text-[10px] text-[var(--color-text-muted)] font-medium truncate">{book.author}</p>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {getStatusBadge(status)}
                          {(book.currentProgress || book.totalLength || book.pages) && (
                            <span className="text-[9px] text-brand-purple/70 font-mono tracking-wider font-bold">
                              {book.currentProgress ? `${book.currentProgress} / ${book.totalLength || book.pages || '?'}` : `${book.totalLength || book.pages} Total`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rating indicator */}
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-app-border/40">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {review && review.rating > 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={9}
                                fill={i < review.rating ? 'currentColor' : 'none'}
                                className={i < review.rating ? 'text-amber-400' : 'text-gray-700'}
                              />
                            ))
                          ) : (
                            <span className="text-[9px] text-[var(--color-text-muted)] font-medium">Unrated</span>
                          )}
                        </div>

                        
                      {quickSaveId === book.id && (
                        <div className="absolute inset-0 bg-app-base/95 backdrop-blur z-30 p-2 flex flex-col rounded-lg border border-brand-purple" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider">Quick Save</span>
                            <button onClick={() => setQuickSaveId(null)} className="text-gray-500 hover:text-white cursor-pointer"><X size={12} /></button>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Milestone (e.g. Ch. 14)"
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
                            onClick={() => handleQuickSave(book.id)}
                            className="w-full bg-brand-purple text-[#340F04] font-bold text-[10px] py-1 rounded cursor-pointer hover:bg-white"
                          >
                            Save Point
                          </button>
                        </div>
                      )}
                      
                      {/* Interactive shortcuts - Quote Entry button & delete */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {!isBatchMode && (
                            <button
                              onClick={() => {
                                setQuoteEntryBookId(book.id);
                                setEnteredQuoteText('');
                              }}
                              className="p-1 px-1.5 bg-[#0f0e12] hover:bg-[#beb7dc]/15 text-[#beb7dc] hover:text-[#c8b9ff] border border-neutral-800 rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                              title="Instantly add Quote Snippet"
                            >
                              <Quote size={8} /> <span className="text-[8px] font-bold font-mono">Q+</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onRemoveBook(book.id);
                            }}
                            className="p-1 text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                            title="Delete from Shelf"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-10 text-[var(--color-text-muted)] rounded-lg bg-app-base border border-dashed border-app-border">
                <Bookmark size={24} className="mx-auto mb-2 opacity-30 text-[#CAB9D4]" />
                <p className="text-xs text-[var(--color-text-muted)] font-medium">
                  {searchQuery ? 'No publications match your query.' : 'No books in this shelf.'}
                </p>
              </div>
            )}
          </div>

          {/* Safe overlay dialog for batch delete */}
          {showBatchDeleteConfirm && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-app-card border border-red-950/40 rounded-xl p-6 max-w-sm w-full text-center shadow-2xl relative">
                <div className="w-12 h-12 bg-red-500/10 border border-red-500/25 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={22} className="animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wider mb-2">Destructive Action Safety</h3>
                <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed mb-5">
                  Are you sure you want to permanently delete the <span className="text-red-400 font-mono font-black">{selectedBatchIds.length} selected</span> books? This will also remove all associated logs and transcripts.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowBatchDeleteConfirm(false)}
                    className="px-4 py-2 bg-[#1b1c21] hover:bg-[#25262c] text-[var(--color-text-muted)] hover:text-white border border-[#2d2e31] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    className="px-4 py-2 bg-gradient-to-r from-red-650 to-red-800 text-white hover:brightness-110 active:scale-95 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick quote entry transcription modal overlay */}
          {quoteEntryBookId && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-[#101014] border border-app-border rounded-xl p-5 max-w-md w-full relative shadow-2xl text-left">
                <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider mb-3">Add Quote</h3>
                
                <textarea
                  value={enteredQuoteText}
                  onChange={(e) => setEnteredQuoteText(e.target.value)}
                  placeholder="Enter quote..."
                  className="w-full h-24 bg-[#09090c] border border-app-border/80 focus:border-brand-purple/60 text-amber-100 text-xs p-2.5 rounded-lg focus:outline-none transition-colors font-serif resize-none"
                />

                {quoteSuccessMsg && (
                  <p className="text-[10px] text-emerald-400 font-bold mb-3 mt-1">{quoteSuccessMsg}</p>
                )}

                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={() => setQuoteEntryBookId(null)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-[var(--color-text-muted)] hover:text-white rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (!enteredQuoteText.trim()) return;
                      handleSaveQuickQuote(quoteEntryBookId, enteredQuoteText.trim());
                    }}
                    className="px-3 py-1.5 bg-brand-purple text-[#340F04] hover:bg-[#bfabff] rounded-lg text-[11px] font-black uppercase transition-all active:scale-95 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DNF Grid section */}
          {dnfBooks.length > 0 && (
            <div className="pt-6 border-t border-dashed border-app-border mt-6">
              <h3 className="text-[10px] font-black uppercase text-red-400 bg-red-950/45 border border-red-900/40 px-2.5 py-1 rounded w-fit mb-3.5 tracking-wider font-mono">
                🍂 Did Not Finish (DNF)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dnfBooks.map((book, idx) => (
                  <div
                    key={`${book.id}-dnf-${idx}`}
                    onClick={() => onSelectBook(book.id)}
                    className="group relative flex gap-3 p-3 bg-red-950/5 border border-red-950/30 hover:border-red-500/30 hover:bg-neutral-800/40 rounded-lg transition-all cursor-pointer overflow-hidden brightness-80 hover:brightness-100"
                  >
                    <div className="w-12 h-18 rounded bg-black/40 border border-neutral-800 relative shadow overflow-hidden shrink-0">
                      <img
                        referrerPolicy="no-referrer"
                        src={book.coverUrl}
                        alt={book.title}
                        onError={(e) => handleImageError(e, book.title)}
                        className="w-full h-full object-cover filter grayscale"
                      />
                    </div>
                    <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-[var(--color-text-main)] leading-tight truncate">
                          {book.title}
                        </h3>
                        <p className="text-[10px] text-neutral-500 truncate">{book.author}</p>
                        <span className="text-[8px] bg-red-900/10 text-red-400 border border-red-900/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">DNF</span>
                      </div>
                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-neutral-900/40">
                        <span className="text-[9px] text-neutral-500 italic">No End Date</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveBook(book.id);
                          }}
                          className="p-1 text-neutral-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Brand-New High-Fidelity List View Layout Mode */
        <div className="space-y-2">
          {processedBooks.length > 0 ? (
            processedBooks.map((book, idx) => {
              const status = getBookStatus(book.id);
              const review = getBookReview(book.id);
              const lastReadDate = getLatestReadDate(book.id);

              const isSelected = selectedBatchIds.includes(book.id);

              return (
                <div
                  key={`${book.id}-list-${idx}`}
                  onClick={() => {
                    if (isBatchMode) {
                      setSelectedBatchIds(prev => 
                        prev.includes(book.id) ? prev.filter(id => id !== book.id) : [...prev, book.id]
                      );
                    } else {
                      onSelectBook(book.id);
                    }
                  }}
                  className={`group relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl transition-all cursor-pointer gap-4 overflow-hidden border ${
                    isSelected
                      ? 'border-brand-purple bg-brand-purple/5 shadow-[0_0_12px_rgba(168,85,247,0.15)] animate-pulse-subtle'
                      : 'bg-app-base border-app-border/60 hover:border-brand-purple/40 hover:bg-[#141417]/80'
                  }`}
                >
                  {isBatchMode && (
                    <div className="absolute top-4 left-2 z-20">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by onClick on card
                        className="w-3.5 h-3.5 border-gray-600 rounded text-brand-purple focus:ring-brand-purple accent-brand-purple cursor-pointer"
                      />
                    </div>
                  )}
                  <div className={`flex items-center gap-4 min-w-0 flex-1 ${isBatchMode ? 'ml-6' : ''}`}>
                    {/* Index count */}
                    <span className="text-[10px] font-mono text-gray-600 font-bold w-4 shrink-0 text-right">
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    {/* Compact cover thumbnail */}
                    <div className="w-10 h-14 bg-black/40 border border-app-border rounded shadow overflow-hidden shrink-0 group-hover:scale-[1.03] transition-all">
                      <img
                        referrerPolicy="no-referrer"
                        src={book.coverUrl}
                        alt={book.title}
                        onError={(e) => handleImageError(e, book.title)}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1 min-h-[44px] flex flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-bold text-white leading-tight truncate group-hover:text-brand-purple transition-all">
                          {book.title}
                        </h4>
                        <span className="text-[9px] text-[#CAB9D4]/60 font-bold font-mono">
                          {book.pages ? `(${book.pages} pages)` : ''}
                        </span>
                      </div>
                      <div className="points-wrap text-[11px] leading-none mt-0.5">
                        <span className="points-underline-glow" />
                        <span className="points-badge"><span className="points-badge-inner">{getBookPoints(book, status).toLocaleString()} PTS</span></span>
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-medium truncate mt-0.5">by {book.author}</p>
                      
                      {/* Snippet review */}
                      {review && review.notes && review.notes.trim() && (
                        <p className="text-[10px] text-[var(--color-text-muted)] italic mt-1 line-clamp-1 max-w-xl">
                          "{review.notes.replace(/<[^>]*>/g, '')}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-between md:justify-end">
                    {/* Status badge */}
                    <div className="shrink-0">{getStatusBadge(status)}</div>

                    {/* Last active read / finish date */}
                    {lastReadDate && (
                      <div className="text-[9.5px] font-mono text-[var(--color-text-muted)] font-semibold shrink-0">
                        Finished: <span className="text-[var(--color-text-main)]">{lastReadDate}</span>
                      </div>
                    )}

                    {/* Stars review */}
                    <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                      {review && review.rating > 0 ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            fill={i < review.rating ? 'currentColor' : 'none'}
                            className={i < review.rating ? 'text-amber-400' : 'text-gray-700'}
                          />
                        ))
                      ) : (
                        <span className="text-[9px] text-[var(--color-text-muted)] font-medium">Unrated</span>
                      )}
                    </div>

                    {/* Delete shelf item */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBook(book.id);
                      }}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Delete from Shelf"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-[var(--color-text-muted)] rounded-lg bg-app-base border border-dashed border-app-border">
              <Bookmark size={24} className="mx-auto mb-2 opacity-30 text-[#CAB9D4]" />
              <p className="text-xs text-[var(--color-text-muted)] font-medium">
                No items match your criteria in list view.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
