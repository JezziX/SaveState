import React, { useState, useMemo, useEffect } from 'react';
import { Book, BookReview } from '../types';
import { ChevronLeft, ChevronRight, Shuffle, Sparkles, BookMarked, Quote as QuoteIcon, Trash2, Search, Plus, Pencil, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { supabase } from '../utils/supabaseClient';

interface QuoteDeckProps {
  books: Book[];
  reviews: BookReview[];
  onSaveReview?: (review: BookReview) => void;
}

interface StandaloneQuote {
  id: string;
  quote: string;
  author: string;
  source?: string;
  createdAt: string;
}

interface QuoteItem {
  id: string;
  quote: string;
  bookTitle: string;
  bookAuthor: string;
  coverUrl: string;
  bookId?: string;
  quoteIndexInReview?: number;
  isStandalone?: boolean;
}

export function QuoteDeck({ books, reviews, onSaveReview }: QuoteDeckProps) {
  const [standaloneQuotes, setStandaloneQuotes] = useState<StandaloneQuote[]>([]);

  useEffect(() => {
    loadStandaloneQuotes();
  }, []);

  const loadStandaloneQuotes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('standalone_quotes').select('*').eq('user_id', session.user.id);
      if (data) {
        setStandaloneQuotes(data.map(d => ({
          id: d.id,
          quote: d.quote,
          author: d.author,
          source: d.source,
          createdAt: d.created_at
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const pushStandaloneQuote = async (sq: StandaloneQuote) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from('standalone_quotes').upsert({
        id: sq.id,
        user_id: session.user.id,
        quote: sq.quote,
        author: sq.author,
        source: sq.source,
        created_at: sq.createdAt
      });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteStandaloneQuote = async (id: string) => {
    try {
      await supabase.from('standalone_quotes').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  };

  const [quoteSearchQuery, setQuoteSearchQuery] = useState('');
  const [quoteLayoutMode, setQuoteLayoutMode] = useState<'deck' | 'list'>('deck');
  const [isAddingStandalone, setIsAddingStandalone] = useState(false);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [newQuoteSource, setNewQuoteSource] = useState('');

  // Editing state for cards
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [editQuoteText, setEditQuoteText] = useState('');
  const [editQuoteAuthor, setEditQuoteAuthor] = useState('');
  const [editQuoteSource, setEditQuoteSource] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Extract all quotes from both book reviews and standalone entry list
  const allQuotes = useMemo<QuoteItem[]>(() => {
    const items: QuoteItem[] = [];

    // 1. Add all book-linked quotes from active book reviews
    reviews.forEach(r => {
      const book = books.find(b => b.id === r.bookId);
      if (book && r.quotes && r.quotes.length > 0) {
        r.quotes.forEach((q, idx) => {
          if (q.trim()) {
            items.push({
              id: `${r.bookId}-user-quote-${idx}`,
              quote: q.trim(),
              bookTitle: book.title,
              bookAuthor: book.author,
              coverUrl: book.coverUrl,
              bookId: r.bookId,
              quoteIndexInReview: idx,
              isStandalone: false
            });
          }
        });
      }
    });

    // 2. Add all standalone quotes added by the user
    standaloneQuotes.forEach(sq => {
      items.push({
        id: sq.id,
        quote: sq.quote,
        bookTitle: sq.source || '',
        bookAuthor: sq.author,
        coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300&auto=format&fit=crop', // default fallback warm cover
        isStandalone: true
      });
    });

    // 3. Fallback defaults if there are zero quotes added yet at all
    if (items.length === 0) {
      const backupQuotes = [
        {
          id: 'def1',
          quote: "So we beat on, boats against the current, borne back ceaselessly into the past.",
          bookTitle: "The Great Gatsby",
          bookAuthor: "F. Scott Fitzgerald"
        },
        {
          id: 'def2',
          quote: "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell...",
          bookTitle: "The Hobbit",
          bookAuthor: "J.R.R. Tolkien"
        },
        {
          id: 'def3',
          quote: "War is peace. Freedom is slavery. Ignorance is strength.",
          bookTitle: "1984",
          bookAuthor: "George Orwell"
        }
      ];

      backupQuotes.forEach((bq, idx) => {
        items.push({
          id: `def-${idx}`,
          quote: bq.quote,
          bookTitle: bq.bookTitle,
          bookAuthor: bq.bookAuthor,
          coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop',
          isStandalone: false
        });
      });
    }

    return items;
  }, [books, reviews, standaloneQuotes]);

  // Handle live query filter mapping
  const filteredQuotes = useMemo(() => {
    if (!quoteSearchQuery.trim()) return allQuotes;
    const q = quoteSearchQuery.toLowerCase();
    return allQuotes.filter(item => 
      item.quote.toLowerCase().includes(q) || 
      item.bookAuthor.toLowerCase().includes(q) || 
      item.bookTitle.toLowerCase().includes(q)
    );
  }, [allQuotes, quoteSearchQuery]);

  const activeQuote = filteredQuotes[currentIndex % filteredQuotes.length] || null;

  const handleNext = () => {
    if (filteredQuotes.length <= 1) return;
    setDirection(1);
    setIsEditingCard(false);
    setShowDeleteConfirm(false);
    setCurrentIndex(prev => (prev + 1) % filteredQuotes.length);
  };

  const handlePrev = () => {
    if (filteredQuotes.length <= 1) return;
    setDirection(-1);
    setIsEditingCard(false);
    setShowDeleteConfirm(false);
    setCurrentIndex(prev => (prev - 1 + filteredQuotes.length) % filteredQuotes.length);
  };

  const handleShuffle = () => {
    if (filteredQuotes.length <= 1) return;
    let nextIdx = currentIndex;
    while (nextIdx === currentIndex) {
      nextIdx = Math.floor(Math.random() * filteredQuotes.length);
    }
    setDirection(Math.random() > 0.5 ? 1 : -1);
    setIsEditingCard(false);
    setShowDeleteConfirm(false);
    setCurrentIndex(nextIdx);
  };

  // Standalone Quote Saver
  const handleSaveStandalone = () => {
    if (!newQuoteText.trim() || !newQuoteAuthor.trim()) return;

    const newSq: StandaloneQuote = {
      id: `standalone-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      quote: newQuoteText.trim(),
      author: newQuoteAuthor.trim(),
      source: newQuoteSource.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setStandaloneQuotes(prev => [newSq, ...prev]);
    pushStandaloneQuote(newSq);
    setNewQuoteText('');
    setNewQuoteAuthor('');
    setNewQuoteSource('');
    setIsAddingStandalone(false);
    setCurrentIndex(0); // View immediately
  };

  // Card Content Editor Triggers
  const handleBeginEdit = () => {
    if (!activeQuote) return;
    setEditQuoteText(activeQuote.quote);
    setEditQuoteAuthor(activeQuote.bookAuthor);
    setEditQuoteSource(activeQuote.bookTitle);
    setIsEditingCard(true);
  };

  const handleSaveEdit = () => {
    if (!activeQuote || !editQuoteText.trim() || !editQuoteAuthor.trim()) return;

    if (activeQuote.isStandalone) {
      setStandaloneQuotes(prev => prev.map(sq => {
        if (sq.id === activeQuote.id) {
          const updated = {
            ...sq,
            quote: editQuoteText.trim(),
            author: editQuoteAuthor.trim(),
            source: editQuoteSource.trim() || undefined
          };
          pushStandaloneQuote(updated);
          return updated;
        }
        return sq;
      }));
    } else if (activeQuote.bookId && activeQuote.quoteIndexInReview !== undefined && onSaveReview) {
      const reviewToUpdate = reviews.find(r => r.bookId === activeQuote.bookId);
      if (reviewToUpdate && reviewToUpdate.quotes) {
        const updatedQuotes = [...reviewToUpdate.quotes];
        updatedQuotes[activeQuote.quoteIndexInReview] = editQuoteText.trim();
        onSaveReview({
          ...reviewToUpdate,
          quotes: updatedQuotes,
          updatedAt: new Date().toISOString()
        });
      }
    }

    setIsEditingCard(false);
  };

  // Card Highlight Deletion
  const handleConfirmDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeQuote) return;

    if (activeQuote.isStandalone) {
      setStandaloneQuotes(prev => prev.filter(sq => sq.id !== activeQuote.id));
      deleteStandaloneQuote(activeQuote.id);
    } else if (activeQuote.bookId && activeQuote.quoteIndexInReview !== undefined && onSaveReview) {
      const reviewToUpdate = reviews.find(r => r.bookId === activeQuote.bookId);
      if (reviewToUpdate && reviewToUpdate.quotes) {
        const updatedQuotes = reviewToUpdate.quotes.filter((_, idx) => idx !== activeQuote.quoteIndexInReview);
        onSaveReview({
          ...reviewToUpdate,
          quotes: updatedQuotes,
          updatedAt: new Date().toISOString()
        });
      }
    }

    setShowDeleteConfirm(false);
    setIsEditingCard(false);

    // Shift index elegantly
    if (filteredQuotes.length <= 1) {
      setCurrentIndex(0);
    } else if (currentIndex >= filteredQuotes.length - 1) {
      setCurrentIndex(Math.max(0, filteredQuotes.length - 2));
    }
  };

  // Card movement animation paths
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 120 : -120,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 28 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -120 : 120,
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: 'spring', stiffness: 350, damping: 28 },
        opacity: { duration: 0.18 }
      }
    })
  };

  return (
    <div className="relative p-1">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 blur-[75px] rounded-full pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-app-border/60 pb-5 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 bg-brand-teal/10 border border-brand-teal/25 text-brand-purple rounded-xl">
            <QuoteIcon size={15} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-100 font-display">Quotes</h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">Card-swipe flashcard player to revisit or recall saved text highlights</p>
          </div>
        </div>

        {/* Deck Utilities */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Layout Mode Selector (Deck vs List) */}
          <div className="flex items-center bg-app-base border border-app-border p-0.5 rounded-lg text-[9px]">
            <button
              onClick={() => setQuoteLayoutMode('deck')}
              className={`px-2.5 py-1 rounded text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                quoteLayoutMode === 'deck' ? 'bg-brand-teal/10 text-brand-purple border border-brand-teal/20 font-black' : 'text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              Deck
            </button>
            <button
              onClick={() => setQuoteLayoutMode('list')}
              className={`px-2.5 py-1 rounded text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                quoteLayoutMode === 'list' ? 'bg-brand-teal/10 text-brand-purple border border-brand-teal/20 font-black' : 'text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              List
            </button>
          </div>

          <span className="text-[9.5px] font-mono text-[var(--color-text-muted)] bg-app-base border border-neutral-800 px-2.5 py-1 rounded-lg font-bold">
            Deck: {filteredQuotes.length} quotes {quoteSearchQuery && '(filtered)'}
          </span>
          <button
            onClick={() => setIsAddingStandalone(!isAddingStandalone)}
            className="p-1 px-2.5 py-1 bg-[#0f0e12] hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-[10px] uppercase font-extrabold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Add Standing Freeform Quote Highlight"
          >
            <Plus size={10} /> Add+
          </button>
          {quoteLayoutMode === 'deck' && (
            <button
              onClick={handleShuffle}
              disabled={filteredQuotes.length <= 1}
              className="p-1 px-2.5 py-1 bg-[#0f0e12] hover:bg-brand-teal/10 text-brand-teal hover:text-brand-turquoise border border-brand-teal/20 hover:border-brand-teal/40 rounded-lg text-[10px] uppercase tracking-wider font-extrabold flex items-center gap-1 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
              title="Shuffle Quote Cards"
            >
              <Shuffle size={10} /> Shuffle
            </button>
          )}
        </div>
      </div>

      {/* Quote Search Section */}
      <div className="max-w-xl mx-auto mb-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={13} />
        <input
          type="text"
          value={quoteSearchQuery}
          onChange={(e) => {
            setQuoteSearchQuery(e.target.value);
            setCurrentIndex(0);
          }}
          placeholder="Search quotes..."
          className="w-full bg-[#0e0e11]/85 border border-[#1b1b22] hover:border-brand-purple/35 text-white text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:border-brand-purple/60 transition-colors placeholder:text-gray-600"
        />
      </div>

      {/* Standalone Input Form Sliding Panel */}
      <AnimatePresence>
        {isAddingStandalone && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-xl bg-app-card border border-brand-purple/35 rounded-xl p-4 sm:p-5 mb-5 text-left mx-auto shadow-2xl overflow-hidden relative"
          >
            <div className="text-[10px] font-mono uppercase font-black text-brand-turquoise/80 mb-2.5 tracking-widest flex items-center gap-1">
              ✦ Transcribe Freeform Standalone Highlight
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[8.5px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Quote Caption</label>
                <textarea
                  value={newQuoteText}
                  onChange={(e) => setNewQuoteText(e.target.value)}
                  placeholder="Enter quote..."
                  className="w-full h-20 bg-app-base border border-app-border text-white text-[11.5px] font-sans p-2.5 rounded focus:outline-none focus:border-brand-purple/60 transition-colors uppercase-none font-serif placeholder:font-serif placeholder:text-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8.5px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Attribution / Author</label>
                  <input
                    type="text"
                    value={newQuoteAuthor}
                    onChange={(e) => setNewQuoteAuthor(e.target.value)}
                    placeholder="e.g. Oscar Wilde"
                    className="w-full bg-app-base border border-app-border text-white text-xs px-2.5 py-2 rounded focus:outline-none focus:border-brand-purple/60"
                  />
                </div>
                <div>
                  <label className="block text-[8.5px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Origin/Title Clue (Optional)</label>
                  <input
                    type="text"
                    value={newQuoteSource}
                    onChange={(e) => setNewQuoteSource(e.target.value)}
                    placeholder="e.g. De Profundis"
                    className="w-full bg-app-base border border-app-border text-white text-xs px-2.5 py-2 rounded focus:outline-none focus:border-brand-purple/60"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsAddingStandalone(false)}
                  className="px-3 py-1.5 text-[9px] font-bold text-[var(--color-text-muted)] hover:text-white uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStandalone}
                  disabled={!newQuoteText.trim() || !newQuoteAuthor.trim()}
                  className="px-4 py-1.5 bg-gradient-to-tr from-emerald-800 to-emerald-600 text-[9.5px] font-black uppercase text-white rounded shadow-md disabled:opacity-40 transition-all cursor-pointer"
                >
                  Preserve Caption
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeQuote && quoteLayoutMode === 'list' ? (
        <div className="w-full max-w-2xl mx-auto mt-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuotes.map((item, index) => (
              <div 
                key={item.id}
                className="bg-[#09090B] border border-brand-purple/30 rounded-xl p-5 hover:border-brand-purple/70 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all flex flex-col justify-between relative group text-left min-h-[160px]"
              >
                {/* Vintage decorative header */}
                <div className="flex justify-between items-center text-brand-teal/50 text-[8px] font-mono tracking-widest uppercase border-b border-app-border/20 pb-2 mb-3">
                  <span>✦ {item.isStandalone ? 'Standalone Caption' : 'Memoir Highlight'}</span>
                  <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setCurrentIndex(index);
                        setQuoteLayoutMode('deck');
                        setTimeout(() => {
                          setEditQuoteText(item.quote);
                          setEditQuoteAuthor(item.bookAuthor);
                          setEditQuoteSource(item.bookTitle);
                          setIsEditingCard(true);
                        }, 50);
                      }}
                      className="p-1 text-brand-turquoise/60 hover:text-brand-turquoise hover:bg-brand-teal/10 rounded transition-colors cursor-pointer"
                      title="Edit Highlight"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => {
                        setCurrentIndex(index);
                        setShowDeleteConfirm(true);
                        setQuoteLayoutMode('deck');
                      }}
                      className="p-1 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                      title="Delete Highlight"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* Body Quote */}
                <p className="text-[11.5px] sm:text-[12.5px] font-serif leading-relaxed text-white italic flex-1">
                  “{item.quote}”
                </p>

                {/* Footer Speaker Details */}
                <div className="mt-3 pt-2.5 border-t border-app-border/20 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-serif font-black uppercase tracking-wider text-brand-turquoise">
                    — {item.bookAuthor}
                  </span>
                  {item.bookTitle && (
                    <span className="text-[9px] italic text-[#CAB9D4]/60">
                      unearthing {item.bookTitle}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeQuote ? (
        <div className="flex flex-col items-center py-4 bg-transparent max-w-xl mx-auto">
          {/* STACKED DECK PRESENTATION */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9.5] max-w-[420px] min-h-[240px] select-none perspective-lg">
            {/* Layered botanical card shadow spreads */}
            <div className="absolute inset-0 bg-brand-purple/5 border border-brand-purple/20 rounded-2xl rotate-2 translate-y-2 translate-x-1 blur-[2px]" />
            <div className="absolute inset-0 bg-brand-turquoise/5 border border-brand-turquoise/20 rounded-2xl -rotate-2 -translate-y-1 -translate-x-1 blur-[2px]" />

            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeQuote.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0 bg-[#09090B] border border-brand-purple/50 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.2)] overflow-hidden flex flex-col justify-between p-6 sm:p-7 relative backdrop-blur-xl"
              >
                {/* CARD TOOLBAR */}
                <div className="flex justify-between items-center text-brand-purple/80 font-mono text-[7.5px] border-b border-app-border/20 pb-2 relative z-20">
                  <span className="flex items-center gap-1 text-brand-turquoise/75 font-black uppercase tracking-widest font-mono">
                    ✦ {activeQuote.isStandalone ? 'Standalone Caption' : 'Memoir Highlight'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBeginEdit}
                      className="p-1 -my-1 text-brand-turquoise/60 hover:text-brand-turquoise hover:bg-brand-teal/10 rounded transition-colors cursor-pointer"
                      title="Edit Quote Text / Clues"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-1 -my-1 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                      title="Purge Card highlight"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>

                {/* MAIN INNER CONTENT AREA (CARDS ARE NOW HYPER-MINIMALIST ELEGANT BOOKPLATES) */}
                <div className="flex-1 flex flex-col justify-between py-4 relative">
                  {/* Subtle watermarked quote icon at center bg */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                    <QuoteIcon size={95} className="text-brand-teal" />
                  </div>

                  {isEditingCard ? (
                    /* CARD EDITOR PANEL */
                    <div className="z-10 flex flex-col gap-2 relative h-full justify-center">
                      <textarea
                        value={editQuoteText}
                        onChange={(e) => setEditQuoteText(e.target.value)}
                        className="w-full h-20 bg-app-base border border-app-border text-white text-[11px] font-sans p-1.5 rounded focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <input
                          type="text"
                          value={editQuoteAuthor}
                          onChange={(e) => setEditQuoteAuthor(e.target.value)}
                          placeholder="Author"
                          className="bg-app-base border border-app-border text-white text-[10px] px-2 py-1 rounded"
                        />
                        <input
                          type="text"
                          value={editQuoteSource}
                          onChange={(e) => setEditQuoteSource(e.target.value)}
                          placeholder="Clue Source (Optional)"
                          className="bg-app-base border border-app-border text-white text-[10px] px-2 py-1 rounded"
                        />
                      </div>
                      <div className="flex justify-end gap-1.5 mt-2">
                        <button
                          onClick={() => setIsEditingCard(false)}
                          className="p-1 text-[9px] text-[var(--color-text-muted)] hover:text-white uppercase tracking-wider font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 px-2.5 bg-brand-purple hover:bg-brand-teal text-white text-[9px] rounded font-black uppercase tracking-wider cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* HYPERMINIMAL DISPLAY */
                    <div className="flex-1 flex flex-col justify-between h-full relative z-10 text-center">
                      {/* Generous centered quote text style */}
                      <div className="flex-1 flex items-center justify-center text-center py-2 px-1">
                        <blockquote className="text-xs sm:text-[14px] md:text-[15px] font-semibold text-brand-purple/30 leading-none select-none absolute top-0">“</blockquote>
                        <blockquote className="text-xs sm:text-[13px] md:text-[14.5px] font-medium font-serif leading-relaxed text-[#E2D8F0] italic select-all break-words max-h-[110px] overflow-y-auto pr-1 drop-shadow-[0_0_8px_rgba(226,216,240,0.3)]">
                          {activeQuote.quote}
                        </blockquote>
                        <blockquote className="text-xs sm:text-[14px] md:text-[15px] font-semibold text-brand-purple/30 leading-none select-none absolute bottom-5">”</blockquote>
                      </div>

                      {/* Editorial Footnote attribution */}
                      <div className="mt-auto border-t border-app-border/30 pt-3.5">
                        <span className="block text-[10px] sm:text-[11px] font-serif font-black uppercase tracking-widest text-brand-turquoise select-none">
                          — {activeQuote.bookAuthor}
                        </span>
                        {activeQuote.bookTitle && (
                          <span className="block text-[9px] italic text-[#CAB9D4]/60 mt-0.5 tracking-wider select-none">
                            unearthing {activeQuote.bookTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Delete Confirmation Overlap */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-app-base/98 z-50 rounded-2xl flex flex-col items-center justify-center p-5 text-center border border-red-900/30 backdrop-blur-xs shadow-2xl"
                >
                  <div className="p-2 bg-red-600/15 rounded-full text-red-500 mb-2.5 animate-pulse">
                    <Trash2 size={16} />
                  </div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest font-mono mb-1">Evaporate Memoir Card?</h4>
                  <p className="text-[9.5px] text-[var(--color-text-muted)] leading-relaxed max-w-[280px] mb-4 font-sans">
                    Are you absolutely sure you want to completely erase this saved highlight snippet? This action is permanent.
                  </p>
                  <div className="flex items-center gap-2 w-full max-w-[240px]">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-1 bg-black/40 hover:bg-black/60 text-[9px] font-bold text-[var(--color-text-muted)] hover:text-white rounded border border-app-border/30 transition-colors cursor-pointer uppercase"
                    >
                      Keep
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="flex-1 py-1 bg-gradient-to-tr from-red-800 to-red-600 text-[9px] font-black uppercase text-white rounded transition-all active:scale-95 cursor-pointer shadow"
                    >
                      Erase
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls bar layout */}
          <div className="flex items-center gap-6 mt-6">
            <button
              onClick={handlePrev}
              disabled={filteredQuotes.length <= 1}
              className="p-1 px-2 text-brand-purple hover:text-white bg-app-card hover:bg-brand-teal/10 border border-brand-teal/20 hover:border-brand-teal/40 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed select-none active:scale-95 cursor-pointer"
              title="Previous Memoir"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-[9px] font-mono text-brand-teal/60 font-extrabold tracking-widest uppercase">
              CARD {currentIndex + 1} OF {filteredQuotes.length}
            </span>

            <button
              onClick={handleNext}
              disabled={filteredQuotes.length <= 1}
              className="p-1 px-2 text-brand-purple hover:text-white bg-app-card hover:bg-brand-teal/10 border border-brand-teal/20 hover:border-brand-teal/40 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed select-none active:scale-95 cursor-pointer"
              title="Next Memoir"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-app-card rounded-xl border border-dashed border-brand-teal/20 flex flex-col items-center max-w-xl mx-auto">
          <BookMarked size={28} className="text-brand-teal/40 mb-2" />
          <span className="text-[11px] text-white font-bold uppercase font-display">No Highlights Exist</span>
          
        </div>
      )}
    </div>
  );
}
