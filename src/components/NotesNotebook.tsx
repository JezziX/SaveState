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

  return (
    <div className="relative overflow-hidden group">
      {/* Glow highlight background */}
      <div className="absolute top-0 right-0 w-48 h-48 blur-[80px] rounded-full pointer-events-none transition-colors duration-500 bg-brand-purple/5" />

      {/* Header Banner */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 border rounded-xl transition-colors bg-brand-purple/10 border-brand-purple/20 text-[#c8b9ff]">
            <BookOpen size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-main)] font-display uppercase tracking-wider">Save Points</h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">Navigate and edit detailed memoirs and reading thoughts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 rounded-2xl bg-app-card border border-app-border shadow-app-glow relative min-h-[500px] overflow-hidden">
        {/* INDEX / TABLE OF CONTENTS (LEFT PAGE) */}
        <div className="col-span-1 md:col-span-4 p-4 flex flex-col justify-between max-h-[500px] border-r border-app-border bg-black/20">
          <div className="relative flex-1 flex flex-col min-h-0">
            {/* Table of contents title */}
            <div className="border-b border-app-border pb-4 mb-4">
              <h3 className="font-display font-black text-xs uppercase tracking-widest text-brand-purple mb-3">Index</h3>
              
              {/* Index search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={12} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find save points..."
                  className="w-full bg-black/40 border border-app-border rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-hidden focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/40 transition-all"
                />
              </div>

              {/* Dynamic sorting dropdown and ascending/descending toggle */}
              <div className="flex gap-2">
                <select
                  value={notebookSortBy}
                  onChange={(e) => setNotebookSortBy(e.target.value as any)}
                  className="flex-1 bg-black/40 border border-app-border rounded-md text-xs font-bold px-2 py-1.5 focus:outline-none cursor-pointer text-[var(--color-text-main)]"
                >
                  <option value="title">Alphabetical</option>
                  <option value="author">Author</option>
                  <option value="genre">Genre</option>
                  <option value="year">Read Year</option>
                  <option value="month">Read Month</option>
                </select>

                <button
                  type="button"
                  onClick={() => setNotebookSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-2 bg-black/40 border border-app-border rounded-md text-[10px] font-black cursor-pointer uppercase flex items-center justify-center text-[var(--color-text-main)] hover:bg-[#2c2c31]"
                  title="Toggle sorting direction"
                >
                  {notebookSortOrder === 'asc' ? 'ASC ↑' : 'DESC ↓'}
                </button>
              </div>
            </div>

            {/* List of books */}
            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar min-h-0 pr-1">
              {sortedBooks.length > 0 ? (
                sortedBooks.map(book => {
                  const isSelected = book.id === selectedBookId;
                  const hasNote = reviews.some(r => r.bookId === book.id && r.notes.trim().length > 0);
                  const isDnf = book.didNotFinish;

                  return (
                    <button
                      key={book.id}
                      onClick={() => setSelectedBookId(book.id)}
                      className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center justify-between gap-2 border cursor-pointer ${
                        isSelected
                          ? 'bg-brand-purple/10 border-brand-purple/30 text-[var(--color-text-main)]'
                          : 'bg-transparent border-transparent hover:bg-black/40 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className={`text-[11px] font-bold block truncate ${isSelected ? 'text-[var(--color-text-main)]' : ''}`}>
                          {book.title}
                        </span>
                        <span className="text-[9px] font-semibold truncate block mt-0.5 opacity-70">
                          by {book.author}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isDnf && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase bg-red-950/40 text-red-400">DNF</span>
                        )}
                        {hasNote && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-turquoise shadow-[0_0_8px_rgba(7,161,249,0.5)]" title="Has Save Points" />
                        )}
                        <ChevronRight size={12} className="opacity-40" />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-10 text-[10px] text-[var(--color-text-muted)] font-bold">
                  No books catalogued matching search.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ACTIVE JOURNAL PAGE (RIGHT PAGE) */}
        <div className="col-span-1 md:col-span-8 flex flex-col justify-between max-h-[500px] bg-app-base relative">
          
          <AnimatePresence mode="wait">
            {activeBook ? (
              <motion.div
                key={activeBook.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 p-5 md:p-8 overflow-y-auto flex flex-col h-full custom-scrollbar"
              >
                {/* Top header details */}
                <div className="border-b border-app-border pb-4 mb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                       <h4 className="font-display font-bold text-lg md:text-xl text-[var(--color-text-main)] leading-tight">
                        {activeBook.title}
                      </h4>
                      <p className="text-sm font-bold text-[var(--color-text-muted)] mt-1">by {activeBook.author}</p>
                    </div>
                    {/* Compact rating stars */}
                    <div className="flex items-center gap-1 bg-black/40 border border-app-border px-2.5 py-1.5 rounded-lg shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNoteRating(i + 1)}
                          className="cursor-pointer"
                        >
                          <Star
                            size={14}
                            fill={i < noteRating ? 'var(--color-brand-yellow)' : 'none'}
                            className={i < noteRating ? 'text-brand-yellow' : 'text-gray-600'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center mt-4 text-[10px] font-mono font-bold uppercase text-[var(--color-text-muted)]">
                    {activeBook.startDate && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-app-border text-[var(--color-text-main)]">
                        <Calendar size={12} className="text-brand-purple" /> Started: {activeBook.startDate}
                      </span>
                    )}
                    {activeBook.endDate ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-app-border text-[var(--color-text-main)]">
                        <Calendar size={12} className="text-brand-teal" /> Finished: {activeBook.endDate}
                      </span>
                    ) : activeBook.didNotFinish ? (
                      <span className="font-extrabold border px-2.5 py-1 rounded-md text-red-400 bg-red-950/30 border-red-900/50">
                        Did Not Finish (DNF)
                      </span>
                    ) : (
                      <span className="border px-2.5 py-1 rounded-md text-brand-turquoise bg-brand-turquoise/10 border-brand-turquoise/30">
                        Reading Progression
                      </span>
                    )}

                    {activeBook.genre && (
                      <span className="px-2.5 py-1 rounded-md bg-brand-purple/10 border border-brand-purple/20 text-brand-purple">
                        {activeBook.genre}
                      </span>
                    )}
                  </div>
                </div>

                {/* Notebook Line Section */}
                <div className="flex-1 relative mb-5 bg-black/20 border border-app-border rounded-xl p-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter save points and thoughts..."
                    className="w-full h-full min-h-[140px] bg-transparent border-none outline-none leading-relaxed text-sm placeholder-[var(--color-text-muted)] focus:ring-0 custom-scrollbar resize-none text-[var(--color-text-main)] font-mono"
                    maxLength={2000}
                  />
                </div>

                {/* Highlights / Quote Deck section */}
                <div className="mt-2 pt-4 border-t border-app-border mb-4">
                  <label className="block text-[10px] uppercase font-bold tracking-wider mb-2 text-brand-purple font-mono">
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
                      className="flex-1 bg-black/40 border border-app-border rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-hidden focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/40"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (quoteInput.trim()) {
                          setQuoteList(prev => [...prev, quoteInput.trim()]);
                          setQuoteInput('');
                        }
                      }}
                      className="px-4 py-1.5 bg-[#141417] hover:bg-[#202027] border border-app-border rounded-lg text-xs font-bold font-mono transition-all active:scale-95 cursor-pointer text-[var(--color-text-main)]"
                    >
                      + Add
                    </button>
                  </div>

                  {/* List of quotes */}
                  {quoteList.length > 0 && (
                    <div className="mt-3 space-y-1.5 max-h-[85px] overflow-y-auto custom-scrollbar pr-1">
                      {quoteList.map((q, idx) => {
                        const isEditingThis = editingQuoteIdx === idx;
                        return (
                          <div key={idx} className="flex items-center justify-between px-3 py-2 bg-black/30 border border-app-border rounded-lg text-[11px] font-mono italic gap-3">
                            {isEditingThis ? (
                               <input
                                type="text"
                                value={editingQuoteText}
                                onChange={(e) => setEditingQuoteText(e.target.value)}
                                className="flex-1 bg-black border border-brand-purple/50 rounded px-2 py-1 text-[11px] font-mono focus:outline-none text-[var(--color-text-main)]"
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
                              <span className="leading-snug text-[var(--color-text-main)] opacity-90">"{q}"</span>
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
                                    className="font-mono font-bold text-[9px] uppercase cursor-pointer text-brand-teal hover:text-brand-teal/80"
                                  >
                                    Done
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingQuoteIdx(null)}
                                    className="font-mono font-bold text-[9px] uppercase cursor-pointer text-[var(--color-text-muted)] hover:text-white"
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
                                    className="font-mono font-bold text-[9px] uppercase cursor-pointer text-brand-purple hover:text-brand-purple/80"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setQuoteList(prev => prev.filter((_, i) => i !== idx))}
                                    className="font-mono font-bold text-[9px] uppercase cursor-pointer text-[var(--color-text-muted)] hover:text-red-400"
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
                <div className="flex justify-between items-center border-t border-app-border pt-4 mt-auto">
                  <span className="text-[10px] font-mono font-bold uppercase text-[var(--color-text-muted)]">
                    {activeReview?.updatedAt
                      ? `Last Saved: ${new Date(activeReview.updatedAt).toLocaleDateString()}`
                      : 'Unwritten Note Entry'}
                  </span>

                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2 bg-brand-purple text-[#340F04] hover:bg-brand-teal active:scale-95 text-xs font-black rounded-lg transition-all shadow-[0_0_15px_rgba(215,33,249,0.3)] cursor-pointer uppercase tracking-wider"
                  >
                    <Save size={14} />
                    {successSaved ? 'Saved!' : 'Save Page Note'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <BookOpen size={48} className="mb-4 opacity-20 text-brand-purple" />
                <h4 className="font-display font-black text-sm uppercase text-[var(--color-text-main)]">Empty Journal</h4>
                <p className="text-xs max-w-xs mt-2 leading-relaxed text-[var(--color-text-muted)]">
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
