import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { searchOpenLibrary } from '../utils/openlibrary';
import { Search, Plus, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BookSearchProps {
  onAddBook: (book: Book) => void;
  existingBookIds: string[];
}

export function BookSearch({ onAddBook, existingBookIds }: BookSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Book[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Form State
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualPages, setManualPages] = useState('');
  const [manualCover, setManualCover] = useState('');
  const [manualPubYear, setManualPubYear] = useState('');

  // Selected search result being customized before adding
  const [configBook, setConfigBook] = useState<Book | null>(null);
  const [configStatus, setConfigStatus] = useState<'backlog' | 'active' | 'completed' | 'dnf'>('completed');
  const [configStartDate, setConfigStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [configEndDate, setConfigEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Custom (Manual) Form State additional fields
  const [customStatus, setCustomStatus] = useState<'backlog' | 'active' | 'completed' | 'dnf'>('completed');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Auto search on debounce
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const books = await searchOpenLibrary(query);
        setResults(books);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, title: string) => {
    e.currentTarget.src = `https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=150&auto=format&fit=crop`;
  };

  const handleSelectBookClick = (book: Book) => {
    setConfigBook(book);
    setConfigStatus('completed');
    setConfigStartDate(new Date().toISOString().split('T')[0]);
    setConfigEndDate(new Date().toISOString().split('T')[0]);
  };

  const handleAddConfiguredBook = () => {
    if (!configBook) return;
    const addedBook: Book = {
      ...configBook,
      startDate: configStatus !== 'backlog' ? configStartDate : undefined,
      endDate: configStatus === 'completed' ? configEndDate : undefined,
      didNotFinish: configStatus === 'dnf',
      genre: configBook.genre || (configBook.subjects ? configBook.subjects[0] : undefined),
    };
    onAddBook(addedBook);
    triggerToast(`Added "${addedBook.title}" to Library`);
    setConfigBook(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const customBook: Book = {
      id: `custom_${Date.now()}`,
      title: manualTitle.trim(),
      author: manualAuthor.trim() || 'Anonymous Author',
      coverUrl: manualCover.trim() || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop',
      pages: manualPages ? parseInt(manualPages) : undefined,
      publishYear: manualPubYear.trim() || undefined,
      startDate: customStatus !== 'backlog' ? customStartDate : undefined,
      endDate: customStatus === 'completed' ? customEndDate : undefined,
      didNotFinish: customStatus === 'dnf',
    };

    onAddBook(customBook);
    triggerToast(`Added custom Book: "${customBook.title}"`);

    // Reset Form
    setManualTitle('');
    setManualAuthor('');
    setManualPages('');
    setManualCover('');
    setManualPubYear('');
    setCustomStatus('completed');
    setIsManualMode(false);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  return (
    <div className="bg-[#141417] border border-app-border/60 rounded-xl p-5 shadow-xs relative overflow-hidden">
      {/* Toast Notification Container with brand-purple accents */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#CAB9D4] text-[#340F04] text-xs font-bold px-4 py-2 rounded-full shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Mode Toggle with color alignment */}
      <div className="flex items-center justify-between gap-4 mb-5 border-b border-app-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-purple/10 border border-brand-purple/20 text-[#CAB9D4] rounded-lg">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-100 font-display">Index & Fetch</h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">Search free volumes or log custom books</p>
          </div>
        </div>

        <button
          onClick={() => setIsManualMode(!isManualMode)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium bg-[#1a1a1f] border-[#25252e] text-[#CAB9D4] hover:text-white hover:border-brand-purple/40 transition-all cursor-pointer"
        >
          {isManualMode ? (
            <>
              <Search size={12} /> Global Search
            </>
          ) : (
            <>
              <Plus size={12} /> Custom Entry
            </>
          )}
        </button>
      </div>

      {!isManualMode ? (
        <div className="space-y-4">
          {/* Global Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={14} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, series, author..."
              className="w-full bg-app-base border border-app-border rounded-lg pl-9 pr-10 py-2.5 text-xs text-[var(--color-text-main)] placeholder-gray-500 focus:outline-hidden focus:border-brand-purple/80 focus:ring-1 focus:ring-brand-purple/50 transition-all"
            />
            {loading && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Loader2 className="animate-spin text-[#CAB9D4]" size={14} />
              </div>
            )}
          </div>

          {/* Config Option Panel for Selected Pending Book */}
          <AnimatePresence>
            {configBook && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="bg-[#0f0f13] border border-brand-purple/30 rounded-xl p-4 space-y-3 relative overflow-hidden"
              >
                <div className="flex gap-3 items-center border-b border-app-border pb-2">
                  <div className="w-10 h-14 rounded bg-black/60 overflow-hidden shrink-0 border border-app-border/80 shadow">
                    <img
                      referrerPolicy="no-referrer"
                      src={configBook.coverUrl}
                      alt={configBook.title}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, configBook.title)}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-155">Establish State & Shelf</h4>
                    <p className="text-[10px] text-[#CAB9D4] font-medium line-clamp-1">{configBook.title} by {configBook.author}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Shelf Status</label>
                    <select
                      value={configStatus}
                      onChange={(e) => setConfigStatus(e.target.value as any)}
                      className="w-full bg-[#141417] border border-app-border rounded px-2 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden cursor-pointer"
                    >
                      <option value="completed">Completed Shelf</option>
                      <option value="active">Currently Reading</option>
                      <option value="backlog">Plan to Read</option>
                      <option value="dnf">Did Not Finish (DNF)</option>
                    </select>
                  </div>

                  {configStatus !== 'backlog' && (
                    <div>
                      <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Start Date</label>
                      <input
                        type="date"
                        value={configStartDate}
                        onChange={(e) => setConfigStartDate(e.target.value)}
                        className="w-full bg-[#141417] border border-app-border rounded px-2 py-1 text-xs text-[var(--color-text-main)] focus:outline-hidden cursor-pointer text-center"
                      />
                    </div>
                  )}

                  {configStatus === 'completed' && (
                    <div>
                      <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] mb-1">End Date</label>
                      <input
                        type="date"
                        value={configEndDate}
                        onChange={(e) => setConfigEndDate(e.target.value)}
                        className="w-full bg-[#141417] border border-app-border rounded px-2 py-1 text-xs text-[var(--color-text-main)] focus:outline-hidden cursor-pointer text-center"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfigBook(null)}
                    className="px-3 py-1.5 bg-[#18181c] hover:bg-[#202027] text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider rounded transition-all cursor-pointer border border-app-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddConfiguredBook}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brand-purple text-[#340F04] hover:bg-[#d6c7de] text-[10px] font-black uppercase tracking-wider rounded transition-all cursor-pointer shadow-md"
                  >
                    Confirm & Shelve Book
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results List */}
          <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2 mt-1 custom-scrollbar">
            {results.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {results.map((book) => {
                  const alreadyAdded = existingBookIds.includes(book.id);
                  return (
                    <div
                      key={book.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-app-base border border-app-border/50 hover:border-[#31313a] transition-colors group relative"
                    >
                      <div className="w-10 h-14 rounded bg-black/60 overflow-hidden shrink-0 border border-app-border/80 shadow">
                        <img
                          referrerPolicy="no-referrer"
                          src={book.coverUrl}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => handleImageError(e, book.title)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-semibold text-[var(--color-text-main)] truncate group-hover:text-brand-purple transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-[10px] text-[var(--color-text-muted)] truncate">{book.author}</p>
                        <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">
                          {book.pages ? `${book.pages} pages` : 'Pages unstated'} · {book.publishYear}
                        </p>
                      </div>

                      {alreadyAdded ? (
                        <div className="text-[9px] uppercase font-bold text-[var(--color-text-muted)] border border-app-border bg-[#141417] rounded px-2.5 py-1 select-none">
                          In Shelf
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectBookClick(book)}
                          className="p-1.5 rounded-lg bg-brand-purple/10 border border-brand-purple/20 text-[#CAB9D4] hover:bg-brand-purple hover:text-[#340F04] transition-all cursor-pointer mr-1"
                          title="Select to customize status & shelf"
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : query.trim().length >= 3 && !loading ? (
              <div className="text-center py-8 text-[var(--color-text-muted)]">
                <BookOpen size={24} className="mx-auto mb-2 opacity-35 text-brand-purple" />
                <p className="text-xs">No active results. Try adjusting the query, or use 'Custom Entry'.</p>
              </div>
            ) : (
              <div className="text-center py-6 text-[var(--color-text-muted)] bg-app-base/40 rounded-lg border border-dashed border-[#232328]">
                <BookOpen size={20} className="mx-auto mb-2 opacity-20 text-[#CAB9D4]" />
                <p className="text-xs max-w-xs mx-auto text-[var(--color-text-muted)] leading-relaxed font-sans">
                  Start searching for published titles using the search bar above.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Manual entry details */
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-[9px] uppercase font-semibold text-[var(--color-text-muted)] mb-1 tracking-wider">Book Title *</label>
              <input
                type="text"
                required
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="The Secret Notebook"
                className="w-full bg-app-base border border-app-border rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-hidden focus:border-brand-purple"
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase font-semibold text-[var(--color-text-muted)] mb-1 tracking-wider">Author Name</label>
              <input
                type="text"
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value)}
                placeholder="E.g. Jane Doe"
                className="w-full bg-app-base border border-app-border rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-hidden focus:border-brand-purple"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] uppercase font-semibold text-[var(--color-text-muted)] mb-1 tracking-wider">Pages</label>
              <input
                type="number"
                value={manualPages}
                onChange={(e) => setManualPages(e.target.value)}
                placeholder="300"
                className="w-full bg-app-base border border-app-border rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-hidden focus:border-brand-purple"
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase font-semibold text-[var(--color-text-muted)] mb-1 tracking-wider">Publish Year</label>
              <input
                type="text"
                value={manualPubYear}
                onChange={(e) => setManualPubYear(e.target.value)}
                placeholder="2026"
                className="w-full bg-app-base border border-app-border rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-hidden focus:border-brand-purple"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase font-semibold text-[var(--color-text-muted)] mb-1 tracking-wider">Cover Image URL</label>
            <input
              type="url"
              value={manualCover}
              onChange={(e) => setManualCover(e.target.value)}
              placeholder="Paste custom cover URL image"
              className="w-full bg-app-base border border-app-border rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-600 focus:outline-hidden focus:border-brand-purple"
            />
          </div>

          <div className="bg-[#0e0e11] border border-app-border p-3 rounded-lg space-y-3">
            <h5 className="text-[9px] uppercase tracking-wider font-extrabold text-brand-purple flex items-center gap-1 bg-[#151218] px-2 py-1 rounded">
              📚 Establish State & Keep Calendar Aligned
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Shelf Status</label>
                <select
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value as any)}
                  className="w-full bg-[#141417] border border-app-border rounded px-2 py-1.5 text-xs text-[var(--color-text-main)] focus:outline-hidden cursor-pointer"
                >
                  <option value="completed">Completed Shelf</option>
                  <option value="active">Currently Reading</option>
                  <option value="backlog">Plan to Read</option>
                  <option value="dnf">Did Not Finish (DNF)</option>
                </select>
              </div>

              {customStatus !== 'backlog' && (
                <div>
                  <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full bg-[#141417] border border-app-border rounded px-2 py-1 text-xs text-[var(--color-text-main)] focus:outline-hidden cursor-pointer text-center"
                  />
                </div>
              )}

              {customStatus === 'completed' && (
                <div>
                  <label className="block text-[8px] uppercase font-bold text-[var(--color-text-muted)] mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full bg-[#141417] border border-app-border rounded px-2 py-1 text-xs text-[var(--color-text-main)] focus:outline-hidden cursor-pointer text-center"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsManualMode(false)}
              className="px-3.5 py-2 bg-[#1a1a1f] hover:bg-[#25252e] border border-app-border text-xs font-medium text-[var(--color-text-muted)] rounded-lg transition-all cursor-pointer font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-purple hover:bg-[#d4c5dd] text-[#340F04] text-xs font-extrabold rounded-lg shadow-sm transition-all cursor-pointer uppercase tracking-wider"
            >
              Add Book
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
