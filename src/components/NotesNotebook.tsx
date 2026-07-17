import React, { useState } from 'react';
import { Book, BookReview } from '../types';
import { BookOpen, Star, Save, Search, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotesNotebookProps {
  books: Book[];
  reviews: BookReview[];
  onSaveReview: (review: BookReview) => void;
}

export function NotesNotebook({ books, reviews, onSaveReview }: NotesNotebookProps) {
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [notebookTheme, setNotebookTheme] = useState<'light' | 'dark'>('light');
  const [successSaved, setSuccessSaved] = useState(false);

  // Group books by year for the table of contents / index
  const getBookYear = (book: Book): string => {
    if (book.endDate) return book.endDate.split('-')[0];
    if (book.publishYear && /^\d{4}$/.test(book.publishYear)) return book.publishYear;
    return 'Other';
  };

  // Get active book note
  const activeBook = books.find(b => b.id === selectedBookId) || books[0];
  const activeReview = reviews.find(r => r.bookId === activeBook?.id);

  // Note form state local buffer
  const [noteText, setNoteText] = useState(activeReview?.notes || '');
  const [noteRating, setNoteRating] = useState(activeReview?.rating || 0);
  const [quoteInput, setQuoteInput] = useState('');
  const [quoteList, setQuoteList] = useState<string[]>(activeReview?.quotes || []);

  // Sync state when active book changes
  React.useEffect(() => {
    if (activeBook) {
      const rev = reviews.find(r => r.bookId === activeBook.id);
      setNoteText(rev?.notes || '');
      setNoteRating(rev?.rating || 0);
      setQuoteList(rev?.quotes || []);
      setQuoteInput('');
    }
  }, [selectedBookId, activeBook, reviews]);

  const handleSave = () => {
    if (!activeBook) return;
    onSaveReview({
      bookId: activeBook.id,
      rating: noteRating,
      notes: noteText,
      quotes: quoteList,
      updatedAt: new Date().toISOString(),
    });

    setSuccessSaved(true);
    setTimeout(() => {
      setSuccessSaved(false);
    }, 2000);
  };

  const getBookMonth = (book: Book): string => {
    if (book.endDate && book.endDate.includes('-')) {
      const parts = book.endDate.split('-');
      if (parts[1]) return parts[1];
    }
    return '00';
  };

  const [notebookSortBy, setNotebookSortBy] = useState<'year' | 'month' | 'genre' | 'title' | 'author'>('title');
  const [notebookSortOrder, setNotebookSortOrder] = useState<'asc' | 'desc'>('asc');

  const [editingQuoteIdx, setEditingQuoteIdx] = useState<number | null>(null);
  const [editingQuoteText, setEditingQuoteText] = useState('');

  const filteredBooks = books.filter(b => {
    const query = searchQuery.toLowerCase();
    return b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query);
  });

  // Sort books dynamically by Multi-Attributes
  const sortedBooks = React.useMemo(() => {
    const result = [...filteredBooks];
    result.sort((a, b) => {
      let comparison = 0;
      if (notebookSortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (notebookSortBy === 'author') {
        comparison = a.author.localeCompare(b.author);
      } else if (notebookSortBy === 'genre') {
        const ga = a.genre || 'Uncategorized';
        const gb = b.genre || 'Uncategorized';
        comparison = ga.localeCompare(gb);
      } else if (notebookSortBy === 'year') {
        const ya = getBookYear(a);
        const yb = getBookYear(b);
        comparison = ya.localeCompare(yb);
      } else if (notebookSortBy === 'month') {
        const ma = getBookMonth(a);
        const mb = getBookMonth(b);
        comparison = ma.localeCompare(mb);
      }

      if (comparison === 0) {
        comparison = a.title.localeCompare(b.title);
      }

      return notebookSortOrder === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [filteredBooks, notebookSortBy, notebookSortOrder]);

  const isDark = notebookTheme === 'dark';

  return (
    <div className="relative overflow-hidden group">
      {/* Glow highlight background */}
      <div className={`absolute top-0 right-0 w-48 h-48 blur-[80px] rounded-full pointer-events-none transition-colors duration-500 ${
        isDark ? 'bg-[#beb7dc]/5' : 'bg-brand-purple/5'
      }`} />

      {/* Header Banner */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 border rounded-xl transition-colors ${
            isDark 
              ? 'bg-[#2d2e31] border-[#beb7dc]/25 text-[#c8b9ff]' 
              : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
          }`}>
            <BookOpen size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-100 font-display">Notes</h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">Navigate and edit detailed memoirs and reading thoughts</p>
          </div>
        </div>

        {/* Notebook Mode Slider Toggle */}
        <button
          onClick={() => setNotebookTheme(prev => prev === 'light' ? 'dark' : 'light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs rounded-xl transition-all select-none cursor-pointer active:scale-95 ${
            isDark 
              ? 'bg-[#2d2e31] hover:bg-[#323438] text-[#c8b9ff] border-[#beb7dc]/30' 
              : 'bg-[#faf6ef]/10 hover:bg-[#faf6ef]/20 text-amber-100 border-[#523e35]/40'
          }`}
          title="Toggle between warm parchment index and serene lilac night book"
        >
          <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase">
            {isDark ? '☾ Lilac Twilight' : '☼ Light Ledger'}
          </span>
        </button>
      </div>

        {/* SKEUOMORPHIC NOTEBOOK FRAME */}
        <div className={`grid grid-cols-1 md:grid-cols-12 rounded-2xl p-4 md:p-6 shadow-[0_15px_35px_rgba(0,0,0,0.6)] relative min-h-[500px] border transition-colors duration-300 ${
          isDark 
            ? 'bg-[#1a1a1d]/98 border-[#9d89cc]/20' 
            : 'bg-[#3c2a21]/50 border-[#523e35]'
        }`}>
          {/* Ring Binding overlay for larger screens */}
          <div className="hidden md:block absolute left-[33.3%] top-0 bottom-0 w-8 z-30 pointer-events-none -translate-x-1/2">
            {/* Spiral binder loops */}
            <div className="flex flex-col justify-around h-full py-4">
              {Array.from({ length: 14 }).map((_, idx) => (
                <div key={idx} className="relative h-4 w-12 flex items-center justify-between">
                  {/* Silver Metal / Frost Lavender Ring loop */}
                  <div className={`absolute inset-y-0 left-2 right-2 rounded-full border transition-all duration-300 ${
                    isDark
                      ? 'bg-gradient-to-r from-[#111114] via-[#afa4db] to-[#111114] border-[#4b465c]/40 shadow-[1px_2px_4px_rgba(150,130,220,0.15)]'
                      : 'bg-gradient-to-r from-gray-500 via-gray-300 to-gray-500 border-gray-600/70 shadow-[1px_2px_4px_rgba(0,0,0,0.4)]'
                  }`} />
                  <div className={`absolute bottom-1 right-3 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    isDark ? 'bg-[#111114]' : 'bg-amber-955/40'
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* INDEX / TABLE OF CONTENTS (LEFT PAGE) */}
          <div className={`col-span-1 md:col-span-4 rounded-l-xl p-4 transition-colors duration-300 flex flex-col justify-between max-h-[500px] overflow-hidden relative shadow-inner ${
            isDark 
              ? 'bg-[#1a1a1d] text-[#c1b5df] border-r border-[#26262a]' 
              : 'bg-[#fcf8f2] text-amber-900 border-r border-amber-900/10'
          }`}>
            <div className={`absolute inset-y-0 left-0 w-2.5 border-r transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-r from-[#111114] to-[#1a1a1d] border-[#222226]' 
                : 'bg-gradient-to-r from-[#ebd6c4] to-[#fcf8f2] border-[#edd8c6]'
            }`} />
            <div className="relative pl-3 flex-1 flex flex-col min-h-0">
              {/* Table of contents title */}
              <div className={`border-b border-dashed pb-3 transition-colors ${
                isDark ? 'border-[#26262a]' : 'border-amber-900/25'
              }`}>
                <h3 className={`font-display font-black text-xs uppercase tracking-widest text-center mb-2 transition-colors ${
                  isDark ? 'text-[#a28dd3]' : 'text-[#5c3e35]'
                }`}>Notebook Index</h3>
                
                {/* Index search */}
                <div className="relative">
                  <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? 'text-[#9d89cc]/50' : 'text-amber-800/50'
                  }`} size={12} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Find notes..."
                    className={`w-full border rounded-md pl-7 pr-3 py-1 text-[11px] font-medium transition-colors ${
                      isDark 
                        ? 'bg-[#232327] border-[#303036] text-[#c1b5df] placeholder-[#7d7a8c]/65 focus:outline-[#9d89cc]/60' 
                        : 'bg-[#f2ebd9] border-amber-900/15 text-[#4a2e2b] placeholder-amber-900/40 focus:outline-[#5c3e35]/35'
                    }`}
                  />
                </div>

                {/* Dynamic sorting dropdown and ascending/descending toggle */}
                <div className="flex gap-1.5 mt-2">
                  <select
                    value={notebookSortBy}
                    onChange={(e) => setNotebookSortBy(e.target.value as any)}
                    className={`flex-1 border rounded text-[10px] font-bold px-1.5 py-1 focus:outline-none cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-[#232327] border-[#303036] text-[#c1b5df]'
                        : 'bg-[#f2ebd9] border-amber-900/15 text-amber-900'
                    }`}
                  >
                    <option value="title">Alphabetical (Title)</option>
                    <option value="author">Author</option>
                    <option value="genre">Genre</option>
                    <option value="year">Read Year</option>
                    <option value="month">Read Month</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setNotebookSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className={`px-2 border rounded text-[9.5px] font-black cursor-pointer uppercase flex items-center justify-center transition-colors ${
                      isDark
                        ? 'bg-[#232327] border-[#303036] text-[#c1b5df] hover:bg-[#2c2c31]'
                        : 'bg-[#f2ebd9] border-amber-900/15 text-amber-900 hover:bg-[#edd8c6]/60 transition-colors'
                    }`}
                    title="Toggle sorting direction"
                  >
                    {notebookSortOrder === 'asc' ? 'ASC ↑' : 'DESC ↓'}
                  </button>
                </div>
              </div>

            {/* List of books */}
            <div className="flex-1 overflow-y-auto py-2.5 space-y-1.5 custom-scrollbar min-h-0 pr-1">
              {sortedBooks.length > 0 ? (
                sortedBooks.map(book => {
                  const isSelected = book.id === selectedBookId;
                  const hasNote = reviews.some(r => r.bookId === book.id && r.notes.trim().length > 0);
                  const isDnf = book.didNotFinish;

                  return (
                    <button
                      key={book.id}
                      onClick={() => setSelectedBookId(book.id)}
                      className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between gap-2 border cursor-pointer ${
                        isSelected
                          ? isDark 
                            ? 'bg-[#232327] border-[#4e456d]/40 shadow-sm text-white'
                            : 'bg-[#edd8c6] border-amber-900/20 shadow-xs text-amber-955'
                          : isDark
                            ? 'bg-transparent border-transparent hover:bg-[#232327] text-[#c1b5df]'
                            : 'bg-transparent border-transparent hover:bg-[#ebd2bd]/40 text-amber-900'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`text-[10px] font-black block truncate ${
                          isSelected 
                            ? isDark ? 'text-white' : 'text-[#361e1b]' 
                            : isDark ? 'text-[#c1b5df]' : 'text-amber-955/85'
                        }`}>
                          {book.title}
                        </span>
                        <span className={`text-[8.5px] font-semibold truncate block mt-0.5 ${
                          isDark ? 'text-[#8f88a9]' : 'text-amber-800/75'
                        }`}>by {book.author}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {isDnf && (
                          <span className={`text-[7.5px] px-1 py-0.5 rounded font-black uppercase ${
                            isDark ? 'bg-red-950/30 border border-red-900/30 text-red-300' : 'bg-red-800/10 text-red-800'
                          }`}>DNF</span>
                        )}
                        {hasNote && (
                          <span className={`w-1.5 h-1.5 rounded-full shadow-xs ${
                            isDark ? 'bg-[#9d89cc]' : 'bg-indigo-700/60 shadow-[0_0_4px_rgba(79,70,229,0.3)]'
                          }`} title="Has Notes" />
                        )}
                        <ChevronRight size={10} className={isDark ? 'text-[#7e7696]/40' : 'text-amber-800/40'} />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-10 text-[10px] text-amber-800/40 font-bold">
                  No books catalogued matching search.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ACTIVE JOURNAL PAGE (RIGHT PAGE) */}
        <div className={`col-span-1 md:col-span-8 rounded-r-xl flex flex-col justify-between max-h-[500px] overflow-hidden relative shadow-lg transition-colors duration-300 ${
          isDark 
            ? 'bg-[#18191c] text-[#d4cbf0] border-l border-[#26262a]' 
            : 'bg-[#fdfaf5] text-[#3e2e2a] border-l border-amber-900/10'
        }`}>
          {/* Subtle binding shadow overlay */}
          <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {activeBook ? (
              <motion.div
                key={activeBook.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex-1 p-5 md:p-7 overflow-y-auto flex flex-col h-full pl-6 md:pl-10 relative custom-scrollbar"
              >
                {/* Top header details */}
                <div className={`border-b-2 pb-3 mb-4 transition-colors ${
                  isDark ? 'border-[#2d2e31]' : 'border-amber-800/15'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                       <h4 className={`font-display font-black text-sm md:text-base font-serif leading-tight transition-colors ${
                        isDark ? 'text-[#fbf9ff]' : 'text-amber-955'
                      }`}>
                        {activeBook.title}
                      </h4>
                      <p className={`text-xs font-bold italic mt-0.5 transition-colors ${
                        isDark ? 'text-[#beb7dc]' : 'text-amber-800/80'
                      }`}>by {activeBook.author}</p>
                    </div>
                    {/* Compact rating stars */}
                    <div className={`flex items-center gap-0.5 border px-2 py-1 rounded-lg shrink-0 transition-colors ${
                      isDark ? 'bg-[#2d2e31] border-[#3c3d40]' : 'bg-[#f5efe4] border-amber-950/10'
                    }`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNoteRating(i + 1)}
                          className="cursor-pointer"
                        >
                          <Star
                            size={12}
                            fill={i < noteRating ? (isDark ? '#c8b9ff' : '#b58348') : 'none'}
                            className={i < noteRating ? (isDark ? 'text-[#c8b9ff]' : 'text-[#b58348]') : (isDark ? 'text-[#3c3d40]' : 'text-amber-900/30')}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`flex flex-wrap gap-2 items-center mt-3 text-[9px] font-mono font-bold uppercase transition-colors ${
                    isDark ? 'text-[#beb7dc]/85' : 'text-amber-800/60'
                  }`}>
                    {activeBook.startDate && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                        isDark ? 'bg-[#232327] text-[#8f88a9]' : 'bg-amber-800/5'
                      }`}>
                        <Calendar size={10} /> Started: {activeBook.startDate}
                      </span>
                    )}
                    {activeBook.endDate ? (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                        isDark ? 'bg-[#232327] text-[#8f88a9]' : 'bg-amber-850/5'
                      }`}>
                        <Calendar size={10} /> Finished: {activeBook.endDate}
                      </span>
                    ) : activeBook.didNotFinish ? (
                      <span className={`font-extrabold border px-2 py-0.5 rounded transition-colors ${
                        isDark 
                          ? 'text-red-400 bg-[#351a1a] border-[#5a2c2c]' 
                          : 'text-red-700 bg-red-100/60 border border-red-200/50'
                      }`}>
                        Did Not Finish (DNF)
                      </span>
                    ) : (
                      <span className={`border px-2 py-0.5 rounded transition-colors ${
                        isDark
                          ? 'text-[#9d89cc] bg-[#232327] border-[#34343a]'
                          : 'text-amber-600 bg-amber-100/60 border border-amber-200/50'
                      }`}>
                        Reading Progression
                      </span>
                    )}

                    {activeBook.genre && (
                      <span className={`border px-2 py-0.5 rounded transition-colors ${
                        isDark
                          ? 'bg-[#232327] text-[#8f88a9] border-[#303036]'
                          : 'bg-amber-600/10 text-amber-800/90 border border-amber-600/15'
                      }`}>
                        {activeBook.genre}
                      </span>
                    )}
                  </div>
                </div>

                {/* Notebook Ruled Writing Line Section */}
                <div className="flex-1 relative mb-4">
                  {/* Skeuomorphic blue ruled lines backing */}
                  <div className={`absolute inset-0 bg-[linear-gradient(rgba(174,213,245,0.3)_1px,transparent_1px)] bg-[size:100%_24px] pointer-events-none mt-1 ${isDark ? 'opacity-[0.08]' : ''}`} />
                  {/* Notebook horizontal vertical pink margins line */}
                  <div className={`absolute left-4 top-0 bottom-0 w-[1.5px] pointer-events-none ${isDark ? 'bg-[#9887b5]/30' : 'bg-rose-300/60'}`} />

                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter notes..."
                    className={`w-full h-full min-h-[140px] bg-transparent border-none outline-none leading-6 text-[15px] pl-6 pr-2 py-1 placeholder-amber-800/35 focus:ring-0 custom-scrollbar resize-none md:text-[17px] transition-colors ${
                      isDark 
                        ? 'text-[#c3b6e0] placeholder-[#7d7a8c]/40' 
                        : 'text-[#3e2e2a] placeholder-amber-800/35'
                    }`}
                    style={{ fontFamily: 'var(--font-handwriting, Kalam, cursive)' }}
                    maxLength={2000}
                  />
                </div>

                {/* Highlights / Quote Deck section */}
                <div className={`mt-2.5 pt-3.5 border-t mb-4 transition-colors ${
                  isDark ? 'border-[#26262a]' : 'border-amber-800/15'
                }`}>
                  <label className={`block text-[8.5px] uppercase font-bold tracking-wider mb-1 px-1 font-mono transition-colors ${
                    isDark ? 'text-[#8f88a9]/70' : 'text-amber-900/60'
                  }`}>
                    ✦ Saved Quotes for Deck ({quoteList.length})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={quoteInput}
                      onChange={(e) => setQuoteInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (quoteInput.trim()) {
                            setQuoteList(prev => [...prev, quoteInput.trim()]);
                            setQuoteInput('');
                          }
                        }
                      }}
                      placeholder="Enter quote..."
                      className={`flex-1 border rounded px-2 md:px-3 py-1 text-xs font-serif transition-colors ${
                        isDark 
                          ? 'bg-[#232327] border-[#303036] text-[#c1b5df] placeholder-[#7d7a8c]/65 focus:outline-[#9d89cc]/60'
                          : 'bg-[#faf6ef] border-amber-900/15 text-amber-955 placeholder-amber-900/30 focus:outline-[#5c3e35]/35'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (quoteInput.trim()) {
                          setQuoteList(prev => [...prev, quoteInput.trim()]);
                          setQuoteInput('');
                        }
                      }}
                      className={`px-2.5 py-1 border rounded text-[10.5px] font-bold font-mono transition-all active:scale-95 cursor-pointer ${
                        isDark
                          ? 'bg-[#232327] hover:bg-[#2c2c31] text-[#c1b5df] border-[#36363a]'
                          : 'bg-amber-850/5 hover:bg-amber-850/15 text-amber-955 border-amber-900/15'
                      }`}
                    >
                      + Add
                    </button>
                  </div>

                  {/* List of quotes */}
                  {quoteList.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-[85px] overflow-y-auto custom-scrollbar pr-1">
                      {quoteList.map((q, idx) => {
                        const isEditingThis = editingQuoteIdx === idx;
                        return (
                          <div key={idx} className={`flex items-center justify-between px-2 py-1 rounded text-[10.5px] font-serif italic gap-3 transition-colors ${
                            isDark 
                              ? 'bg-[#25262a] text-[#edeaff]/95' 
                              : 'bg-[#faf6ef]/15 text-amber-955'
                          }`}>
                            {isEditingThis ? (
                               <input
                                type="text"
                                value={editingQuoteText}
                                onChange={(e) => setEditingQuoteText(e.target.value)}
                                className={`flex-1 border rounded px-1.5 py-0.5 text-[10.5px] font-serif focus:outline-none transition-colors ${
                                  isDark 
                                    ? 'bg-[#1e1f22] border-[#42444a] text-white' 
                                    : 'bg-[#faf6ef] border-amber-900/20 text-amber-955'
                                }`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (editingQuoteText.trim()) {
                                      const updatedList = [...quoteList];
                                      updatedList[idx] = editingQuoteText.trim();
                                      setQuoteList(updatedList);
                                    }
                                    setEditingQuoteIdx(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingQuoteIdx(null);
                                  }
                                }}
                                autoFocus
                              />
                            ) : (
                              <span className="leading-snug">“{q}”</span>
                            )}
                            
                            <div className="flex items-center gap-2 shrink-0">
                              {isEditingThis ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editingQuoteText.trim()) {
                                        const updatedList = [...quoteList];
                                        updatedList[idx] = editingQuoteText.trim();
                                        setQuoteList(updatedList);
                                      }
                                      setEditingQuoteIdx(null);
                                    }}
                                    className={`font-mono font-bold text-[8px] uppercase cursor-pointer ${
                                      isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-700 hover:text-emerald-800'
                                    }`}
                                  >
                                    Done
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingQuoteIdx(null)}
                                    className={`font-mono font-bold text-[8px] uppercase cursor-pointer ${
                                      isDark ? 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]' : 'text-[var(--color-text-muted)] hover:text-gray-700'
                                    }`}
                                  >
                                    X
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingQuoteIdx(idx);
                                      setEditingQuoteText(q);
                                    }}
                                    className={`font-mono font-bold text-[8px] uppercase cursor-pointer ${
                                      isDark ? 'text-[#bca0f0] hover:text-[#d3c2ff]' : 'text-[#b58348] hover:text-[#90622a]'
                                    }`}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setQuoteList(prev => prev.filter((_, i) => i !== idx))}
                                    className={`transition-colors text-[8px] font-mono font-bold uppercase cursor-pointer ${
                                      isDark ? 'text-[var(--color-text-muted)] hover:text-red-400' : 'text-amber-850/45 hover:text-red-750'
                                    }`}
                                  >
                                    Remove
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Note Actions */}
                <div className={`flex justify-between items-center border-t border-dashed pt-3.5 mt-auto transition-colors ${
                  isDark ? 'border-[#2d2e31]' : 'border-amber-800/15'
                }`}>
                  <span className={`text-[9px] font-mono font-semibold uppercase transition-colors ${
                    isDark ? 'text-[#9c93c4]/80' : 'text-amber-800/60'
                  }`}>
                    {activeReview?.updatedAt
                      ? `Last Saved: ${new Date(activeReview.updatedAt).toLocaleDateString()}`
                      : 'Unwritten Note Entry'}
                  </span>

                  <button
                    onClick={handleSave}
                    className={`flex items-center gap-1.5 px-4.5 py-2 text-white hover:brightness-105 active:scale-95 text-xs font-black rounded-lg transition-all shadow-md hover:shadow-lg cursor-pointer uppercase tracking-wider ${
                      isDark 
                        ? 'bg-gradient-to-r from-[#907ae2] to-[#7052df]' 
                        : 'bg-gradient-to-r from-[#d9aa76] to-[#b58348]'
                    }`}
                  >
                    <Save size={12} />
                    {successSaved ? 'Notes Saved!' : 'Save Page Note'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center transition-colors ${
                isDark ? 'text-[#9c93c4]/50' : 'text-amber-900/40'
              }`}>
                <BookOpen size={48} className={`stroke-[1.2] mb-3 transition-opacity ${
                  isDark ? 'opacity-20 text-[#bca0f0]' : 'opacity-30'
                }`} />
                <h4 className="font-display font-black text-sm uppercase">Empty Journal</h4>
                <p className={`text-[11px] max-w-xs mt-1 leading-relaxed ${
                  isDark ? 'text-[#9c93c4]/65' : 'text-[#3e2e2a]/60'
                }`}>
                  Search and catalog books first to add handwritten memories and reviews.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
