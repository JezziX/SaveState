import React, { useState, useEffect } from 'react';
import { Book, ReadingLog, BookReview } from '../types';
import { X, Star, Calendar, Plus, Trash2, AlertCircle, Link, Edit3, Search as SearchIcon, Loader2, Sparkles, Check, ChevronLeft, ChevronRight, Share2, Lock, Globe, Quote as QuoteIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { handleImageError } from './MyLibrary';
import { searchOpenLibrary } from '../utils/openlibrary';
import { supabase } from '../utils/supabaseClient';
import { upsertQuote } from '../utils/quotesApi';

interface BookDetailModalProps {
  book: Book;
  readingLogs: ReadingLog[];
  review: BookReview | undefined;
  onClose: () => void;
  onSaveReview: (review: BookReview) => void;
  onAddReadingLog: (log: Omit<ReadingLog, 'id'>) => void;
  onRemoveReadingLog: (logId: string) => void;
  onUpdateReadingLog?: (log: ReadingLog) => void;
  onDeleteBook?: (bookId: string) => void;
  onUpdateBook: (book: Book) => void;
  onNextBook?: () => void;
  onPrevBook?: () => void;
}

export function BookDetailModal({
  book,
  readingLogs,
  review,
  onClose,
  onSaveReview,
  onAddReadingLog,
  onRemoveReadingLog,
  onUpdateReadingLog,
  onDeleteBook,
  onUpdateBook,
  onNextBook,
  onPrevBook
}: BookDetailModalProps) {
  const [rating, setRating] = useState(review?.rating || 0);
  const [notes, setNotes] = useState(review?.notes || '');
  const [reviewIsPublic, setReviewIsPublic] = useState(review?.isPublic ?? true);
  const [saveStateText, setSaveStateText] = useState(book.notes || '');
  const [saveStateSuccess, setSaveStateSuccess] = useState(false);
  const [detailSubTab, setDetailSubTab] = useState<'savestate' | 'review' | 'quotes'>('savestate');
  const [quoteText, setQuoteText] = useState('');
  const [quoteCharacter, setQuoteCharacter] = useState('');
  const [quoteAdded, setQuoteAdded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
  }, []);
  const [activeTab, setActiveTab] = useState<'review' | 'community' | 'dates' | 'link'>('review');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Overwrite & Linking States
  const [catQuery, setCatQuery] = useState(book.title);
  const [catLoading, setCatLoading] = useState(false);
  const [catResults, setCatResults] = useState<Book[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Manual Edit state properties populated from current book detail
  const [editTitle, setEditTitle] = useState(book.title);
  const [editAuthor, setEditAuthor] = useState(book.author);
  const [editPages, setEditPages] = useState(book.pages?.toString() || '');
  const [editCurrentProgress, setEditCurrentProgress] = useState(book.currentProgress?.toString() || '');
  const [editTotalLength, setEditTotalLength] = useState(book.totalLength?.toString() || '');
  const [editPublishYear, setEditPublishYear] = useState(book.publishYear || '');
  const [editIsbn, setEditIsbn] = useState(book.isbn || '');
  const [editStartDate, setEditStartDate] = useState(book.startDate || '');
  const [editEndDate, setEditEndDate] = useState(book.endDate || '');
  const [editGenre, setEditGenre] = useState(book.genre || '');
  const [editDidNotFinish, setEditDidNotFinish] = useState(book.didNotFinish || false);
  const [editCoverUrl, setEditCoverUrl] = useState(book.coverUrl || '');
  const [coverSearchLoading, setCoverSearchLoading] = useState(false);

  // Reset/re-sync edit state when selected book changes
  useEffect(() => {
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditPages(book.pages?.toString() || '');
    setEditCurrentProgress(book.currentProgress?.toString() || '');
    setEditTotalLength(book.totalLength?.toString() || '');
    setEditPublishYear(book.publishYear || '');
    setEditIsbn(book.isbn || '');
    setEditStartDate(book.startDate || '');
    setEditEndDate(book.endDate || '');
    setEditGenre(book.genre || '');
    setEditDidNotFinish(book.didNotFinish || false);
    setEditCoverUrl(book.coverUrl || '');
    setCatQuery(book.title);
    setLogStartDate(book.startDate || new Date().toISOString().split('T')[0]);
    setLogEndDate(book.endDate || new Date().toISOString().split('T')[0]);
  }, [book]);

  const handleAutoCover = async () => {
    if (!editTitle) return;
    setCoverSearchLoading(true);
    try {
      const results = await searchOpenLibrary(editTitle);
      const found = results.find(b => b.coverUrl);
      if (found && found.coverUrl) {
        setEditCoverUrl(found.coverUrl);
        setSuccessMsg("Found cover automatically!");
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setSuccessMsg("No cover found for this title.");
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (e) {
      setSuccessMsg("Error searching for cover.");
      setTimeout(() => setSuccessMsg(null), 3500);
    } finally {
      setCoverSearchLoading(false);
    }
  };

  // Debounced auto searching in modal when catQuery changes inside of activeTab link
  useEffect(() => {
    if (activeTab !== 'link' || !catQuery.trim()) {
      setCatResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setCatLoading(true);
      try {
        const queryResults = await searchOpenLibrary(catQuery);
        setCatResults(queryResults);
      } catch (err) {
        console.error(err);
      } finally {
        setCatLoading(false);
      }
    }, 450);
    return () => clearTimeout(delay);
  }, [catQuery, activeTab]);

  // Overwrite keeping original book ID exactly the same to preserve child dependencies
  const handleOverwriteFromCatalog = (catalogBook: Book) => {
    const overwritten: Book = {
      ...catalogBook,
      id: book.id, // CRITICAL: preserve ID to keep dates log & reviews linked
    };
    onUpdateBook(overwritten);
    
    // sync manual edit form properties
    setEditTitle(overwritten.title);
    setEditAuthor(overwritten.author);
    setEditPages(overwritten.pages?.toString() || '');
    setEditCurrentProgress(overwritten.currentProgress?.toString() || '');
    setEditTotalLength(overwritten.totalLength?.toString() || '');
    setEditPublishYear(overwritten.publishYear || '');
    setEditIsbn(overwritten.isbn || '');
    setEditStartDate(overwritten.startDate || '');
    setEditEndDate(overwritten.endDate || '');
    setEditGenre(overwritten.genre || (overwritten.subjects ? overwritten.subjects[0] : '') || '');
    setEditDidNotFinish(overwritten.didNotFinish || false);
    setEditCoverUrl(overwritten.coverUrl || '');
    
    setSuccessMsg(`Instantly overwritten manual details with catalog info for "${overwritten.title}"! All read dates and reviews kept intact.`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleSaveManualEdits = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Book = {
      ...book,
      title: editTitle.trim(),
      author: editAuthor.trim(),
      pages: editPages ? parseInt(editPages, 10) : undefined,
      currentProgress: editCurrentProgress.trim() || undefined,
      totalLength: editTotalLength.trim() || undefined,
      publishYear: editPublishYear.trim() || undefined,
      isbn: editIsbn.trim() || undefined,
      startDate: editStartDate || undefined,
      endDate: editDidNotFinish ? undefined : (editEndDate || undefined),
      genre: editGenre.trim() || undefined,
      didNotFinish: editDidNotFinish,
      coverUrl: editCoverUrl.trim() || undefined,
    };
    onUpdateBook(updated);
    setSuccessMsg('Successfully updated manual properties! All read dates and reviews kept intact.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Log Entry Form State
  const [logStatus, setLogStatus] = useState<'backlog' | 'active' | 'completed' | 'dnf'>('completed');
  const [logStartDate, setLogStartDate] = useState(book.startDate || new Date().toISOString().split('T')[0]);
  const [logEndDate, setLogEndDate] = useState(book.endDate || new Date().toISOString().split('T')[0]);

  // Log Edit State
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogStatus, setEditingLogStatus] = useState<'backlog' | 'active' | 'completed' | 'dnf'>('completed');
  const [editingLogStartDate, setEditingLogStartDate] = useState('');
  const [editingLogEndDate, setEditingLogEndDate] = useState('');

  // Book specific reading logs
  const currentLogs = readingLogs.filter(log => log.bookId === book.id);

  const handleSaveReview = () => {
    onSaveReview({
      bookId: book.id,
      rating,
      notes,
      updatedAt: new Date().toISOString(),
      isPublic: reviewIsPublic,
    });
    setSuccessMsg(reviewIsPublic ? 'Review posted publicly!' : 'Review saved - Only Me');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSaveSaveState = () => {
    onUpdateBook({
      ...book,
      notes: saveStateText,
    });
    setSaveStateSuccess(true);
    setTimeout(() => setSaveStateSuccess(false), 2000);
  };

  // Moves the review's text into the private SaveState note instead - handy
  // for imported reviews someone would rather keep as a note than a review.
  const handleMoveReviewToSaveState = () => {
    if (!notes.trim()) return;
    const ratingLine = rating > 0 ? `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}\n\n` : '';
    const combined = saveStateText
      ? `${saveStateText}\n\n${ratingLine}${notes}`
      : `${ratingLine}${notes}`;
    onUpdateBook({ ...book, notes: combined });
    setSaveStateText(combined);
    setNotes('');
    setRating(0);
    onSaveReview({
      bookId: book.id,
      rating: 0,
      notes: '',
      updatedAt: new Date().toISOString(),
      isPublic: false,
    });
    setSuccessMsg('Moved to your SaveState!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAddQuote = async () => {
    if (!quoteText.trim() || !userId) return;
    await upsertQuote({
      id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      quote: quoteText.trim(),
      author: book.author,
      source: book.title,
      character: quoteCharacter.trim() || undefined,
      coverUrl: book.coverUrl,
      isPublic: true,
      createdAt: new Date().toISOString(),
    }, userId);
    setQuoteText('');
    setQuoteCharacter('');
    setQuoteAdded(true);
    setTimeout(() => setQuoteAdded(false), 2000);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (logStatus === 'dnf') {
      const updated: Book = {
        ...book,
        didNotFinish: true,
        startDate: undefined,
        endDate: undefined,
      };
      onUpdateBook(updated);

      onAddReadingLog({
        bookId: book.id,
        startDate: undefined,
        endDate: undefined,
        status: 'dnf',
      });
      return;
    }

    if (logStatus === 'backlog') {
      const updated: Book = {
        ...book,
        didNotFinish: false,
        startDate: undefined,
        endDate: undefined,
      };
      onUpdateBook(updated);
      onAddReadingLog({
        bookId: book.id,
        startDate: undefined,
        endDate: undefined,
        status: 'backlog',
      });
      return;
    }

    const updated: Book = {
      ...book,
      didNotFinish: false,
      startDate: logStatus === 'active' || logStatus === 'completed' ? logStartDate : undefined,
      endDate: logStatus === 'completed' ? logEndDate : undefined,
    };
    onUpdateBook(updated);

    onAddReadingLog({
      bookId: book.id,
      startDate: logStatus === 'active' || logStatus === 'completed' ? logStartDate : undefined,
      endDate: logStatus === 'completed' ? logEndDate : undefined,
      status: logStatus,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-12">
      <div className="relative max-w-xl w-full flex justify-center items-center h-full max-h-[85vh]">
        {/* Left Navigation Arrow */}
        {onPrevBook && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrevBook(); }}
            className="absolute top-1/2 -translate-y-1/2 -left-4 sm:-left-16 z-50 p-2 sm:p-3 bg-[#1a0b2e]/90 hover:bg-brand-purple/20 border border-brand-purple/40 text-brand-purple hover:text-[#e9d5ff] rounded-full transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.7)] backdrop-blur-md"
            title="Previous Book"
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

          {/* Book Image */}
          <div className="w-16 h-24 rounded bg-black/70 overflow-hidden shrink-0 border border-app-border shadow-md">
            <img
              referrerPolicy="no-referrer"
              src={book.coverUrl}
              alt={book.title}
              onError={(e) => handleImageError(e, book.title)}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight mb-1 truncate font-display">
              {book.title}
            </h2>
            <p className="text-xs text-[#CAB9D4] font-bold truncate">{book.author}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {book.pages && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] border border-app-border px-2.5 py-0.5 rounded-full bg-app-base">
                  {book.pages} pages
                </span>
              )}
              {book.publishYear && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] border border-app-border px-2.5 py-0.5 rounded-full bg-app-base">
                  Published {book.publishYear}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic section tabs with brand-purple alignment */}
        <div className="flex border-b border-app-border bg-app-base/40">
          <button
            onClick={() => setActiveTab('review')}
            className={`flex-1 text-center py-2.5 text-[10px] uppercase tracking-widest font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'review'
                ? 'border-brand-purple text-brand-purple'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            SaveState
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 text-center py-2.5 text-[10px] uppercase tracking-widest font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'community'
                ? 'border-brand-purple text-brand-purple'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            Reviews
          </button>
          <button
            onClick={() => setActiveTab('dates')}
            className={`flex-1 text-center py-2.5 text-[10px] uppercase tracking-widest font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'dates'
                ? 'border-brand-purple text-brand-purple'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            Read Dates Logs ({currentLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 text-center py-2.5 text-[10px] uppercase tracking-widest font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'link'
                ? 'border-brand-purple text-brand-purple'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            Link / Edit Info
          </button>
        </div>

        {/* Content Panel */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar min-h-0">
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-purple/10 border border-brand-purple/35 rounded-lg p-3 text-[11px] font-bold text-[#CAB9D4] flex items-center gap-2 animate-pulse"
            >
              <Check size={14} className="text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-4">
              {/* SUB-TABS */}
              <div className="flex gap-1.5 bg-black/20 border border-app-border rounded-lg p-1">
                {([
                  { key: 'savestate', label: 'SaveState', icon: Lock },
                  { key: 'review', label: 'Review', icon: Globe },
                  { key: 'quotes', label: 'Quotes', icon: QuoteIcon },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setDetailSubTab(t.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                      detailSubTab === t.key
                        ? 'bg-brand-purple/15 text-brand-purple'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
                    }`}
                  >
                    <t.icon size={11} /> {t.label}
                  </button>
                ))}
              </div>

              {/* SAVESTATE PANEL */}
              {detailSubTab === 'savestate' && (
                <div className="space-y-1.5 bg-black/20 border border-app-border rounded-lg p-3.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                      <Lock size={10} /> SaveState (Private)
                    </label>
                    <span className="text-[8px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider">Only visible to you</span>
                  </div>
                  <textarea
                    value={saveStateText}
                    onChange={(e) => setSaveStateText(e.target.value)}
                    placeholder="Spoilers, theories, where you left off - just for you..."
                    className="w-full bg-app-base border border-app-border rounded-lg p-3 text-xs text-gray-100 placeholder-gray-600 focus:outline-hidden focus:border-brand-purple min-h-[140px]"
                    maxLength={2000}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveSaveState}
                      className="px-3 py-1.5 bg-app-card border border-app-border hover:border-brand-purple/50 text-[var(--color-text-main)] font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                      {saveStateSuccess ? 'Saved!' : 'Save SaveState'}
                    </button>
                  </div>
                </div>
              )}

              {/* REVIEW PANEL */}
              {detailSubTab === 'review' && (
                <div className="space-y-1.5 bg-black/20 border border-app-border rounded-lg p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                      <Globe size={10} /> Review
                    </label>
                    <button
                      type="button"
                      onClick={() => setReviewIsPublic(prev => !prev)}
                      className="flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-1 rounded-full cursor-pointer transition-colors"
                      style={{
                        backgroundColor: reviewIsPublic ? 'rgba(7,161,249,0.12)' : 'rgba(255,255,255,0.05)',
                        color: reviewIsPublic ? 'var(--color-brand-turquoise, #07a1f9)' : 'var(--color-text-muted)'
                      }}
                    >
                      {reviewIsPublic ? <Globe size={10} /> : <Lock size={10} />}
                      {reviewIsPublic ? 'Public' : 'Only Me'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i + 1)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          size={18}
                          fill={i < rating ? '#CAB9D4' : 'none'}
                          className={i < rating ? 'text-[#CAB9D4]' : 'text-gray-600'}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="text-[10px] font-bold text-[#CAB9D4] ml-2 bg-brand-purple/10 px-2.5 py-0.5 rounded border border-brand-purple/20">
                        {rating} / 5 stars
                      </span>
                    )}
                  </div>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={reviewIsPublic ? "Write a review anyone can see - your followers and other users browsing this book..." : "Write a review only you can see..."}
                    className="w-full bg-app-base border border-app-border rounded-lg p-3 text-xs text-gray-100 placeholder-gray-600 focus:outline-hidden focus:border-brand-purple min-h-[100px] mt-2"
                    maxLength={1200}
                  />

                  <div className="flex justify-between items-center pt-1 flex-wrap gap-2">
                    <span className="text-[9px] text-[var(--color-text-muted)] font-bold">
                      Last posted: {review?.updatedAt ? new Date(review.updatedAt).toLocaleDateString() : 'Never'}
                    </span>
                    <div className="flex items-center gap-2">
                      {notes.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={handleMoveReviewToSaveState}
                          title="Move this review's text into your private SaveState note instead"
                          className="px-3 py-2 bg-transparent border border-app-border hover:border-brand-purple/50 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Lock size={11} /> Move to SaveState
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveReview}
                        className="px-4 py-2 bg-brand-purple hover:bg-[#d8c7df] text-[#340F04] font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <Share2 size={13} /> {reviewIsPublic ? 'Post Public Review' : 'Save Review (Only Me)'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* QUOTES PANEL */}
              {detailSubTab === 'quotes' && (
                <div className="space-y-2.5 bg-black/20 border border-app-border rounded-lg p-3.5">
                  <label className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">
                    <QuoteIcon size={10} /> Add a Quote
                  </label>

                  {/* Auto-filled attribution, read-only */}
                  <div className="bg-app-base border border-app-border rounded-lg px-3 py-2 flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="block text-[11px] font-bold text-[var(--color-text-main)] truncate">{book.title}</span>
                      <span className="block text-[9px] text-[var(--color-text-muted)] truncate">by {book.author}</span>
                    </div>
                    <span className="text-[8px] font-mono uppercase text-[var(--color-text-muted)] shrink-0 ml-2">Auto-filled</span>
                  </div>

                  <div>
                    <label className="block text-[8.5px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Character (Optional)</label>
                    <input
                      type="text"
                      value={quoteCharacter}
                      onChange={(e) => setQuoteCharacter(e.target.value)}
                      placeholder="Who said it, e.g. Julian"
                      className="w-full bg-app-base border border-app-border text-white text-xs px-2.5 py-2 rounded focus:outline-none focus:border-brand-purple/60"
                    />
                  </div>

                  <div>
                    <label className="block text-[8.5px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Quote</label>
                    <textarea
                      value={quoteText}
                      onChange={(e) => setQuoteText(e.target.value)}
                      placeholder="Enter the quote..."
                      className="w-full bg-app-base border border-app-border rounded-lg p-3 text-xs text-gray-100 placeholder-gray-600 focus:outline-hidden focus:border-brand-purple min-h-[80px]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddQuote}
                      disabled={!quoteText.trim()}
                      className="px-4 py-2 bg-brand-purple hover:bg-[#d8c7df] disabled:opacity-40 disabled:cursor-not-allowed text-[#340F04] font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      {quoteAdded ? 'Added!' : 'Add Quote'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'community' && (
            <div className="space-y-4">
              <div className="bg-app-base border border-app-border rounded-xl p-4 text-center">
                <Star size={24} className="text-brand-turquoise mx-auto mb-2 opacity-50" />
                <h3 className="text-xs font-bold text-[var(--color-text-main)] mb-1">Reviews</h3>
                
              </div>
              <div className="space-y-3">
                <div className="bg-app-card border border-app-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Elena Vance" className="w-5 h-5 rounded-full border border-brand-purple/50" />
                    <span className="text-[10px] font-bold text-[var(--color-text-main)]">Elena Vance</span>
                    <div className="flex gap-0.5 ml-auto">
                      {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= 5 ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} />)}
                    </div>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] italic">"This book completely changed my perspective on the genre. The character development is unmatched."</p>
                </div>
                <div className="bg-app-card border border-app-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img src="https://i.pravatar.cc/150?u=a04258114e29026702d" alt="Sarah Chen" className="w-5 h-5 rounded-full border border-brand-purple/50" />
                    <span className="text-[10px] font-bold text-[var(--color-text-main)]">Sarah Chen</span>
                    <div className="flex gap-0.5 ml-auto">
                      {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} />)}
                    </div>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] italic">"Solid read. Pacing was a bit slow in the middle, but the ending made up for it."</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dates' && (
            <div className="space-y-4">
              {/* Logging Form */}
              <form onSubmit={handleAddLog} className="bg-app-base border border-app-border p-4 rounded-lg space-y-3">
                <h3 className="text-xs font-bold text-[var(--color-text-main)] flex items-center gap-1.5 pb-2 border-b border-app-border">
                  <Calendar size={13} className="text-brand-purple" /> Log a Reading State
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-[#CAB9D4] mb-1">State</label>
                    <select
                      value={logStatus}
                      onChange={(e) => setLogStatus(e.target.value as any)}
                      className="w-full bg-[#141417] border border-app-border rounded px-2 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-[#CAB9D4] cursor-pointer"
                    >
                      <option value="completed">Completed (shows on Calendar)</option>
                      <option value="active">Currently Reading</option>
                      <option value="backlog">Plan to Read</option>
                      <option value="dnf">Did Not Finish (DNF)</option>
                    </select>
                  </div>

                  {logStatus !== 'dnf' && logStatus !== 'backlog' && (
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[#CAB9D4] mb-1">Start Date</label>
                      <input
                        type="date"
                        required
                        value={logStartDate}
                        onChange={(e) => setLogStartDate(e.target.value)}
                        className="w-full bg-[#141417] border border-app-border rounded px-2 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-[#CAB9D4] cursor-pointer text-center"
                      />
                    </div>
                  )}

                  {logStatus === 'completed' ? (
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-[#CAB9D4] mb-1">Finish Date</label>
                      <input
                        type="date"
                        required
                        value={logEndDate}
                        onChange={(e) => setLogEndDate(e.target.value)}
                        className="w-full bg-[#141417] border border-app-border rounded px-2 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-[#CAB9D4] cursor-pointer text-center"
                      />
                    </div>
                  ) : logStatus === 'dnf' ? (
                    <div className="col-span-2 flex items-center justify-center text-[10px] text-red-300 font-bold bg-red-950/20 border border-red-900/40 rounded px-2.5 py-1.5">
                      🍂 Selecting DNF moves book to DNF shelf and removes from calendar
                    </div>
                  ) : logStatus === 'backlog' ? (
                    <div className="col-span-2 flex items-center justify-center text-[10px] text-[#CAB9D4] font-bold bg-[#141417] border border-app-border rounded px-2.5 py-1.5">
                      📚 Moves book to To-Read shelf
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-purple/10 hover:bg-brand-purple hover:text-[#340F04] border border-brand-purple/25 text-[#CAB9D4] text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
                  >
                    <Plus size={12} /> Log Read Date
                  </button>
                </div>
              </form>

              {/* Log History */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Logged History</h3>
                {currentLogs.length > 0 ? (
                  <div className="space-y-1.5">
                    {currentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-col p-3 bg-app-base border border-app-border/60 rounded-lg"
                      >
                        {editingLogId === log.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[8px] uppercase font-bold text-[#CAB9D4] mb-1">State</label>
                                <select
                                  value={editingLogStatus}
                                  onChange={(e) => setEditingLogStatus(e.target.value as any)}
                                  className="w-full bg-[#141417] border border-app-border rounded px-1.5 py-1 text-[10px] text-[var(--color-text-main)] focus:outline-[#CAB9D4] cursor-pointer"
                                >
                                  <option value="completed">Completed</option>
                                  <option value="active">Currently Reading</option>
                                  <option value="backlog">Plan to Read</option>
                                  <option value="dnf">Did Not Finish (DNF)</option>
                                </select>
                              </div>
                              {editingLogStatus !== 'dnf' && editingLogStatus !== 'backlog' && (
                                <div>
                                  <label className="block text-[8px] uppercase font-bold text-[#CAB9D4] mb-1">Start Date</label>
                                  <input
                                    type="date"
                                    value={editingLogStartDate}
                                    onChange={(e) => setEditingLogStartDate(e.target.value)}
                                    className="w-full bg-[#141417] border border-app-border rounded px-1.5 py-1 text-[10px] text-[var(--color-text-main)] focus:outline-[#CAB9D4]"
                                  />
                                </div>
                              )}
                              {editingLogStatus === 'completed' && (
                                <div>
                                  <label className="block text-[8px] uppercase font-bold text-[#CAB9D4] mb-1">Finish Date / Date Logged</label>
                                  <input
                                    type="date"
                                    value={editingLogEndDate}
                                    onChange={(e) => setEditingLogEndDate(e.target.value)}
                                    className="w-full bg-[#141417] border border-app-border rounded px-1.5 py-1 text-[10px] text-[var(--color-text-main)] focus:outline-[#CAB9D4]"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingLogId(null)}
                                className="px-2 py-1 text-[9px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] rounded"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onUpdateReadingLog) {
                                    onUpdateReadingLog({
                                      ...log,
                                      status: editingLogStatus,
                                      startDate: editingLogStatus === 'active' || editingLogStatus === 'completed' ? editingLogStartDate : undefined,
                                      endDate: editingLogStatus === 'completed' ? editingLogEndDate : (log.endDate || new Date().toISOString().split('T')[0]),
                                    });
                                  }
                                  setEditingLogId(null);
                                }}
                                className="px-2 py-1 text-[9px] font-bold bg-brand-purple text-[#340F04] rounded transition-colors"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  log.status === 'completed'
                                    ? 'bg-brand-turquoise'
                                    : log.status === 'active'
                                    ? 'bg-amber-400'
                                    : log.status === 'dnf'
                                    ? 'bg-rose-500'
                                    : 'bg-brand-purple'
                                }`}
                              />
                              <div>
                                <span className="text-xs font-bold text-[var(--color-text-main)] block capitalize">
                                  {log.status === 'completed' ? 'Completed Log' : log.status === 'active' ? 'Started Reading' : log.status === 'dnf' ? 'Did Not Finish' : 'Added to To-Read'}
                                </span>
                                <span className="text-[9px] text-[var(--color-text-muted)] font-mono">
                                  {log.startDate && log.endDate && log.startDate !== log.endDate
                                    ? `Started: ${log.startDate} | Finished: ${log.endDate}`
                                    : log.startDate 
                                      ? `Started: ${log.startDate}`
                                      : log.endDate 
                                        ? `Date logged: ${log.endDate}`
                                        : `Logged: ${new Date().toISOString().split('T')[0]}`}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLogId(log.id);
                                  setEditingLogStatus(log.status);
                                  setEditingLogStartDate(log.startDate || '');
                                  setEditingLogEndDate(log.endDate || '');
                                }}
                                className="p-1 text-[var(--color-text-muted)] hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                                title="Edit Log"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onRemoveReadingLog(log.id)}
                                className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                title="Delete Log"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-app-base border border-dashed border-app-border rounded-lg text-[var(--color-text-muted)] flex flex-col items-center justify-center">
                    <AlertCircle size={16} className="text-brand-purple opacity-40 mb-1.5" />
                    <p className="text-[11px] font-medium leading-relaxed">No calendar log events yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-5">
              {/* Block 1: Search & Overwrite */}
              <div className="bg-app-base border border-app-border rounded-xl p-4 space-y-3 relative overflow-hidden shadow-xs">
                <div className="flex items-center gap-2 border-b border-app-border pb-2">
                  <div className="p-1.5 bg-brand-purple/10 text-[#CAB9D4] rounded-md">
                    <Sparkles size={13} className="text-[#CAB9D4]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-text-main)]">Catalog Search & Overwrite</h4>
                    <p className="text-[9px] text-[var(--color-text-muted)]">Instantly replace metadata and fetch the official ISBN/cover image</p>
                  </div>
                </div>

                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={13} />
                  <input
                    type="text"
                    value={catQuery}
                    onChange={(e) => setCatQuery(e.target.value)}
                    placeholder="Search standard title or author on OpenLibrary..."
                    className="w-full bg-[#141417] border border-app-border rounded px-3 py-2 pl-9 text-xs text-[var(--color-text-main)] placeholder-gray-600 focus:outline-hidden focus:border-brand-purple"
                  />
                  {catLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={13} className="animate-spin text-brand-purple" />
                    </div>
                  )}
                </div>

                {/* Results List */}
                <div className="max-h-[170px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                  {catResults.length > 0 ? (
                    catResults.map((resultBook) => (
                      <div
                        key={resultBook.id}
                        className="flex items-center justify-between gap-3 p-1.5 rounded-lg bg-[#141417] border border-app-border/60 hover:border-brand-purple/40 transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-12 bg-black/60 rounded overflow-hidden border border-app-border/80 shrink-0">
                            <img
                              referrerPolicy="no-referrer"
                              src={resultBook.coverUrl}
                              alt={resultBook.title}
                              onError={(e) => handleImageError(e, resultBook.title)}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-[var(--color-text-main)] block truncate group-hover:text-white transition-colors">
                              {resultBook.title}
                            </span>
                            <span className="text-[9px] font-medium text-[var(--color-text-muted)] block truncate">
                              by {resultBook.author} {resultBook.publishYear ? `(${resultBook.publishYear})` : ''}
                            </span>
                            {resultBook.isbn && (
                              <span className="text-[8px] font-mono text-brand-purple block uppercase font-bold">
                                ISBN: {resultBook.isbn}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOverwriteFromCatalog(resultBook)}
                          className="px-2.5 py-1.5 bg-brand-purple/10 hover:bg-brand-purple text-[#CAB9D4] hover:text-[#340F04] border border-brand-purple/35 text-[9px] font-extrabold uppercase tracking-widest rounded-md transition-all cursor-pointer shrink-0 shrink-0 uppercase"
                        >
                          Overwrite
                        </button>
                      </div>
                    ))
                  ) : catQuery.trim().length >= 2 && !catLoading ? (
                    <div className="text-center py-4 text-[var(--color-text-muted)] text-[10px]">
                      No matched books found. Try custom terms.
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--color-text-muted)] text-[10px] italic">
                      Type above to trigger catalog auto-fetch
                    </div>
                  )}
                </div>
              </div>

              {/* Block 2: Manual Metadata Editing */}
              <form onSubmit={handleSaveManualEdits} className="bg-app-base border border-app-border rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 border-b border-app-border pb-2">
                  <div className="p-1.5 bg-brand-purple/10 text-brand-purple rounded-md">
                    <Edit3 size={13} className="text-[#CAB9D4]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-text-main)]">Manually Edit Properties</h4>
                    <p className="text-[9px] text-[var(--color-text-muted)]">Directly alter properties whilst keeping review ratings and calendar entries perfect</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Author</label>
                    <input
                      type="text"
                      required
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Cover URL</label>
                      <button
                        type="button"
                        onClick={handleAutoCover}
                        disabled={coverSearchLoading}
                        className="text-[8px] font-bold uppercase tracking-wider text-brand-purple hover:text-[#d8c7df] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {coverSearchLoading ? <Loader2 size={10} className="animate-spin" /> : <SearchIcon size={10} />}
                        Auto Find Cover
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editCoverUrl}
                      onChange={(e) => setEditCoverUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Genre / Category</label>
                    <input
                      type="text"
                      value={editGenre}
                      onChange={(e) => setEditGenre(e.target.value)}
                      placeholder="e.g. Fantasy, Biography, Sci-Fi"
                      className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden"
                    />
                  </div>

                  <div className="p-3 bg-[#131116] border border-[#251e2b] rounded-lg space-y-3">
                    <h5 className="text-[9px] uppercase tracking-widest font-black text-[var(--color-text-muted)] flex items-center gap-1.5 border-b border-app-border/60 pb-1.5 font-mono">
                      📚 Timeline Setting
                    </h5>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Start Date</label>
                        <input
                          type="date"
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="w-full bg-[#141417] border border-app-border rounded px-2 md:px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden text-center cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Finish Date</label>
                        <input
                          type="date"
                          value={editEndDate}
                          onChange={(e) => setEditEndDate(e.target.value)}
                          className="w-full bg-[#141417] border border-app-border rounded px-2 md:px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden text-center cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="col-span-1">
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
                    </div>

                    <div className="col-span-1">
                      <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">Year</label>
                      <input
                        type="text"
                        value={editPublishYear}
                        onChange={(e) => setEditPublishYear(e.target.value)}
                        placeholder="e.g. 1994"
                        className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden text-center"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">ISBN</label>
                      <input
                        type="text"
                        value={editIsbn}
                        onChange={(e) => setEditIsbn(e.target.value)}
                        placeholder="e.g. 0451524934"
                        className="w-full bg-[#141417] border border-app-border rounded px-2.5 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
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
          {onDeleteBook && (
            <div className="flex items-center">
              {confirmDelete ? (
                <div className="flex items-center gap-2 bg-[#1a1113] border border-red-900/40 px-2.5 py-1 rounded shadow-sm text-[10px]">
                  <span className="text-[10px] font-bold text-red-400">Permanently delete?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteBook(book.id);
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
                  title="Delete Book from Library"
                >
                  <Trash2 size={13} /> Delete Publication
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
      {onNextBook && (
        <button
          onClick={(e) => { e.stopPropagation(); onNextBook(); }}
          className="absolute top-1/2 -translate-y-1/2 -right-4 sm:-right-16 z-50 p-2 sm:p-3 bg-[#1a0b2e]/90 hover:bg-brand-purple/20 border border-brand-purple/40 text-brand-purple hover:text-[#e9d5ff] rounded-full transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.7)] backdrop-blur-md"
          title="Next Book"
        >
          <ChevronRight size={24} />
        </button>
      )}
      </div>
    </div>
  );
}
