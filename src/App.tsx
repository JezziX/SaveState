import React, { useState, useEffect } from 'react';
import { Book, ReadingLog, BookReview, AppState, AppPreferences, MediaItem, MediaLog, MediaReview } from './types';
import { POPULAR_STARTER_BOOKS } from './utils/openlibrary';
import { BookCalendar } from './components/BookCalendar';
import { BookSearch } from './components/BookSearch';
import { MyLibrary } from './components/MyLibrary';
import { BookDetailModal } from './components/BookDetailModal';
import { BookCelebrationModal } from './components/BookCelebrationModal';
import { NotesNotebook } from './components/NotesNotebook';
import { AchievementsDashboard } from './components/AchievementsDashboard';
import { SyncHub } from './components/SyncHub';
import { QuoteDeck } from './components/QuoteDeck';
import { SettingsPanel } from './components/SettingsPanel';
import { MediaLibrary } from './components/MediaLibrary';
import { RecapModal } from './components/RecapModal';
import { SavePoint } from './types';
import { CommunityFeed } from "./components/CommunityFeed";
import { UserProfile } from "./components/UserProfile";
import { ProfileDrawer } from "./components/ProfileDrawer";
import { InstallGuide } from "./components/InstallGuide";
import { Users } from "lucide-react";
import { BookOpen, Calendar, Star, Plus, Minus, Trophy, Sparkles, ChevronDown, ChevronUp, Share2, Pencil, Check, BarChart2, BookMarked, Quote, ArrowUp, ArrowDown, Settings, Headphones, Film, Tv, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from './utils/supabaseClient';
import { Auth } from './components/Auth';
import { Session } from '@supabase/supabase-js';

// Pre-populate some historical completed logs so the calendar is visually striking out-of-the-box
const getOnboardingLogs = (): ReadingLog[] => {
  const todayStr = new Date().toISOString().split('T')[0];
  const threeDaysAgoStr = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0];
  const tenDaysAgoStr = new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0];
  
  return [
    { id: 'log_starter_1', bookId: 'OL1168083W', endDate: todayStr, status: 'completed' },
    { id: 'log_starter_2', bookId: 'OL454378W', endDate: threeDaysAgoStr, status: 'completed' },
    { id: 'log_starter_3', bookId: 'OL82586W', endDate: tenDaysAgoStr, status: 'completed' },
  ];
};

const DEFAULT_REVIEWS: BookReview[] = [
  {
    bookId: "OL1168083W",
    rating: 5,
    notes: "A captivating study of surveillance, state power, and human memory. Doublethink still feels incredibly relevant.",
    updatedAt: new Date().toISOString()
  },
  {
    bookId: "OL454378W",
    rating: 4,
    notes: "The prose is flawless, especially the green light and valley of ashes symbols. Gatsby is tragically magnificent.",
    updatedAt: new Date().toISOString()
  }
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchCloudData(session.user.id);
      } else {
        setIsInitializing(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchCloudData(session.user.id);
      }
    });

    // Realtime subscriptions
    const mediaSub = supabase.channel('media_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_items' }, () => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) fetchCloudData(session.user.id);
        });
      }).subscribe();
      
    const savePointsSub = supabase.channel('sp_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'save_points' }, () => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) fetchCloudData(session.user.id);
        });
      }).subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(mediaSub);
      supabase.removeChannel(savePointsSub);
    };
  }, []);

  const fetchCloudData = async (userId: string) => {
    try {
      const [mediaRes, spRes] = await Promise.all([
        supabase.from('media_items').select('*').eq('user_id', userId),
        supabase.from('save_points').select('*').eq('user_id', userId)
      ]);
      
      if (mediaRes.data) {
        const cloudBooks = mediaRes.data.filter((m: any) => m.type === 'book');
        const cloudMedia = mediaRes.data.filter((m: any) => m.type !== 'book');
        if (cloudBooks.length > 0) setBooks(cloudBooks as any);
        if (cloudMedia.length > 0) setMediaItems(cloudMedia as any);
      }
      if (spRes.data && spRes.data.length > 0) {
        setSavePoints(spRes.data as any);
      }
      
      const { data: profileData } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
      if (profileData) {
        if (profileData.yearly_goal) {
          setYearlyGoal(profileData.yearly_goal);
        }
        if (profileData.display_name) {
          setUserName(profileData.display_name);
          localStorage.setItem('bt_user_name', profileData.display_name);
        }
        if (profileData.avatar_url) {
          setUserAvatar(profileData.avatar_url);
          localStorage.setItem('bt_user_avatar', profileData.avatar_url);
        }
      }
    } catch (e) {
      console.error('Failed to sync from cloud', e);
    } finally {
      setIsInitializing(false);
    }
  };

  const pushMediaItem = async (item: any, type: string) => {
    if (!session) return;
    try {
      await supabase.from('media_items').upsert({ user_id: session.user.id, type, ...item });
    } catch (e) {
      console.error(e);
    }
  };

  const pushSavePoint = async (sp: any) => {
    if (!session) return;
    try {
      await supabase.from('save_points').upsert({ user_id: session.user.id, ...sp });
    } catch (e) {
      console.error(e);
    }
  };

  const pushGoal = async (goal: number) => {
    if (!session) return;
    try {
      await supabase.from('user_profiles').upsert({ id: session.user.id, yearly_goal: goal });
    } catch (e) {
      console.error(e);
    }
  };

  // State Initialization from LocalStorage or starters
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('bt_books');
    return saved ? JSON.parse(saved) : POPULAR_STARTER_BOOKS;
  });

  const [readingLogs, setReadingLogs] = useState<ReadingLog[]>(() => {
    const saved = localStorage.getItem('bt_logs');
    return saved ? JSON.parse(saved) : getOnboardingLogs();
  });

  const [reviews, setReviews] = useState<BookReview[]>(() => {
    const saved = localStorage.getItem('bt_reviews');
    return saved ? JSON.parse(saved) : DEFAULT_REVIEWS;
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('bt_media');
    return saved ? JSON.parse(saved) : [];
  });

  const [mediaLogs, setMediaLogs] = useState<MediaLog[]>(() => {
    const saved = localStorage.getItem('bt_media_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [mediaReviews, setMediaReviews] = useState<MediaReview[]>(() => {
    const saved = localStorage.getItem('bt_media_reviews');
    return saved ? JSON.parse(saved) : [];
  });
  const [savePoints, setSavePoints] = useState<SavePoint[]>(() => {
    const saved = localStorage.getItem('bt_save_points');
    return saved ? JSON.parse(saved) : [];
  });
  const [recapData, setRecapData] = useState<{ isOpen: boolean; mediaTitle: string; mediaId: string; } | null>(null);

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [completedBookForCelebration, setCompletedBookForCelebration] = useState<Book | null>(null);

  // Yearly Reading Goal State
  const [yearlyGoal, setYearlyGoal] = useState<number>(() => {
    const saved = localStorage.getItem('bt_yearly_goal');
    return saved ? parseInt(saved, 10) : 12;
  });

  // Collapsible Search / custom book builder state
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);

  // Pagination / Theme state
  type Page = 'install' | 'home' | 'community' | 'profile' | 'shelves' | 'podcasts' | 'movies' | 'tv' | 'notebook' | 'quotes' | 'achievements' | 'sync' | 'settings';
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    return localStorage.getItem('bt_has_seen_install') ? 'home' : 'install';
  });
  const [shelfTab, setShelfTab] = useState<'books' | 'podcasts' | 'movies' | 'tv'>('books');
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'jx' | 'neon' | 'pastel' | 'rainbow' | 'savestate'>(() => {
    return (localStorage.getItem('bt_theme') as any) || 'savestate';
  });

  const [preferences, setPreferences] = useState<AppPreferences>(() => {
    const saved = localStorage.getItem('bt_preferences');
    if (saved) return JSON.parse(saved);
    return {
      fontFamily: 'sans',
      theme: (localStorage.getItem('bt_theme') as any) || 'savestate',
      calendarStartDay: 'sunday',
      showDailyGoal: true,
      accentColor: '#CAB9D4',
    };
  });

  
  const unlockBadge = (badgeId: string) => {
    if (!preferences.unlockedBadges?.includes(badgeId)) {
      handleUpdatePreferences({
        unlockedBadges: [...(preferences.unlockedBadges || []), badgeId]
      });
      // Optionally show a toast or celebration!
    }
  };

  const handleUpdatePreferences = (updates: Partial<AppPreferences>) => {
    setPreferences(prev => {
      const next = { ...prev, ...updates };
      if (updates.theme) {
        setTheme(updates.theme as any);
      }
      return next;
    });
  };

  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const [isAutosaving, setIsAutosaving] = useState<boolean>(false);
  const [autosaveStatus, setAutosaveStatus] = useState<string>('');

  // User name state for custom greeting with space before SaveState
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('bt_user_name') || '';
  });
  
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    const saved = localStorage.getItem('bt_user_avatar');
    if (saved === '/logo.jpg') return '/icon-512.png';
    return saved || '/icon-512.png';
  });

  const [prefilledDate, setPrefilledDate] = useState<string>('');
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  // Sync state to localstorage when changes happen
  useEffect(() => {
    localStorage.setItem('bt_user_name', userName);
  }, [userName]);
  
  useEffect(() => {
    localStorage.setItem('bt_user_avatar', userAvatar);
  }, [userAvatar]);

  useEffect(() => {
    localStorage.setItem('bt_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('bt_logs', JSON.stringify(readingLogs));
  }, [readingLogs]);

  useEffect(() => {
    localStorage.setItem('bt_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('bt_yearly_goal', String(yearlyGoal));
  }, [yearlyGoal]);

  useEffect(() => {
    localStorage.setItem('bt_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('bt_preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('bt_media', JSON.stringify(mediaItems));
  }, [mediaItems]);

  useEffect(() => {
    localStorage.setItem('bt_media_logs', JSON.stringify(mediaLogs));
  }, [mediaLogs]);

  useEffect(() => {
    localStorage.setItem('bt_media_reviews', JSON.stringify(mediaReviews));
    localStorage.setItem('bt_save_points', JSON.stringify(savePoints));
  }, [mediaReviews]);

  // Immediate/Debounced autosave effect that triggers EACH time a change is made
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const code = localStorage.getItem('bt_supabase_sync_code');
      // Always show local autosave indicator
      setIsAutosaving(true);
      setAutosaveStatus('Autosaving local state...');

      if (!code || !code.trim() || !code.startsWith('savestate-')) {
        // No remote code set, indicate local save
        setTimeout(() => {
          setIsAutosaving(false);
          setAutosaveStatus('Local Autosaved');
          setTimeout(() => setAutosaveStatus(''), 2500);
        }, 800);
        return;
      }

      setAutosaveStatus('Cloud Syncing...');
      try {
        const payload = {
          sync_code: code.trim().toLowerCase(),
          user_name: userName || '',
          yearly_goal: yearlyGoal || 12,
          books: books,
          reading_logs: readingLogs,
          reviews: reviews,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('savestate_vault')
          .upsert(payload);

        if (error) {
          console.warn("Autosave sync failed:", error.message);
          setAutosaveStatus('Local autosaved (Cloud Sync Error)');
        } else {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setAutosaveStatus(`Synced to Cloud: ${nowStr}`);
          localStorage.setItem('bt_supabase_last_sync', new Date().toISOString());
        }
      } catch (err: any) {
        setAutosaveStatus('Local autosaved');
      } finally {
        setIsAutosaving(false);
        setTimeout(() => setAutosaveStatus(''), 4000);
      }
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [books, readingLogs, reviews, userName, yearlyGoal]);

  // Calculations/Stats
  const currentYear = new Date().getFullYear();
  
  // Directly links completed logs to any finish date within the current year
  const completedThisYearLogs = readingLogs.filter(log => {
    return log.status === 'completed' && log.endDate && log.endDate.startsWith(String(currentYear));
  });
  
  // Filter unique book IDs finished this year to match a realistic "books read" index
  const finishedBooksThisYearCount = [...new Set(completedThisYearLogs.map(log => log.bookId))].length;

  const percentage = Math.round((finishedBooksThisYearCount / yearlyGoal) * 100) || 0;

  // Selected book details mapping
  const selectedBook = books.find(b => b.id === selectedBookId);

  // Core Mutation handlers
  const handleAddBook = (newBook: Book) => {
    if (books.some(b => b.id === newBook.id)) return;
    setBooks(prev => [newBook, ...prev]);
    pushMediaItem(newBook, 'book');

    // Construct correct ReadingLog depending on what was input:
    const status: ReadingLog['status'] = newBook.didNotFinish
      ? 'dnf'
      : (newBook.endDate
        ? 'completed'
        : (newBook.startDate ? 'active' : 'backlog'));

    // Only create a log if the status is reading or completed
    if (status === 'active' || status === 'completed') {
      const newLog: ReadingLog = {
        id: `log_${Date.now()}`,
        bookId: newBook.id,
        startDate: newBook.startDate,
        endDate: newBook.endDate || new Date().toISOString().split('T')[0],
        status: status,
      };
      setReadingLogs(prev => [...prev, newLog]);
    }
  };

  const handleRemoveBook = (bookId: string) => {
    setBooks(prev => prev.filter(b => b.id !== bookId));
    setReadingLogs(prev => prev.filter(log => log.bookId !== bookId));
    setReviews(prev => prev.filter(rev => rev.bookId !== bookId));
    if (selectedBookId === bookId) setSelectedBookId(null);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    setBooks(prev => prev.map(b => b.id === updatedBook.id ? updatedBook : b));
    pushMediaItem(updatedBook, 'book');
  };

  const handleNextBook = () => {
    if (!selectedBookId) return;
    const currentIndex = books.findIndex(b => b.id === selectedBookId);
    if (currentIndex !== -1 && currentIndex < books.length - 1) {
      setSelectedBookId(books[currentIndex + 1].id);
    } else if (currentIndex === books.length - 1 && books.length > 0) {
      setSelectedBookId(books[0].id); // wrap around
    }
  };

  const handlePrevBook = () => {
    if (!selectedBookId) return;
    const currentIndex = books.findIndex(b => b.id === selectedBookId);
    if (currentIndex > 0) {
      setSelectedBookId(books[currentIndex - 1].id);
    } else if (currentIndex === 0 && books.length > 0) {
      setSelectedBookId(books[books.length - 1].id); // wrap around
    }
  };

  const handleSaveReview = (updatedReview: BookReview) => {
    setReviews(prev => {
      const idx = prev.findIndex(r => r.bookId === updatedReview.bookId);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = updatedReview;
        return copy;
      }
      return [...prev, updatedReview];
    });
  };

  const handleUpdateMediaItem = (item: MediaItem) => {
    setMediaItems(prev => {
      const idx = prev.findIndex(m => m.id === item.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [...prev, item];
    });
  };

  const handleRemoveMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(m => m.id !== id));
    setMediaLogs(prev => prev.filter(l => l.mediaId !== id));
    setMediaReviews(prev => prev.filter(r => r.mediaId !== id));
  };

  const handleSaveMediaReview = (updatedReview: MediaReview) => {
    setMediaReviews(prev => {
      const idx = prev.findIndex(r => r.mediaId === updatedReview.mediaId);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = updatedReview;
        return copy;
      }
      return [...prev, updatedReview];
    });
  };

  const handleAddMediaLog = (newLogInput: Omit<MediaLog, 'id'>) => {
    const newLog: MediaLog = {
      ...newLogInput,
      id: `media_log_${Date.now()}`,
    };
    setMediaLogs(prev => [...prev, newLog]);
  };

  const handleRemoveMediaLog = (logId: string) => {
    setMediaLogs(prev => prev.filter(log => log.id !== logId));
  };

  const handleAddReadingLog = (newLogInput: Omit<ReadingLog, 'id'>) => {
    const newLog: ReadingLog = {
      ...newLogInput,
      id: `log_${Date.now()}`,
    };
    setReadingLogs(prev => [...prev, newLog]);
    if (newLog.status === 'completed') {
      const b = books.find(book => book.id === newLog.bookId);
      if (b) setCompletedBookForCelebration(b);
    }
  };

  const handleUpdateReadingLog = (updatedLog: ReadingLog) => {
    setReadingLogs(prev => {
      const oldLog = prev.find(l => l.id === updatedLog.id);
      if (oldLog && (oldLog.status === 'completed' || oldLog.status === 'backlog') && updatedLog.status === 'active') {
        const book = books.find(b => b.id === updatedLog.bookId);
        if (book) {
          setRecapData({ isOpen: true, mediaTitle: book.title, mediaId: book.id });
        }
      }
      return prev.map(log => log.id === updatedLog.id ? updatedLog : log);
    });
    if (updatedLog.status === 'completed') {
      const b = books.find(book => book.id === updatedLog.bookId);
      if (b) setCompletedBookForCelebration(b);
    }
  };

  const handleRemoveReadingLog = (logId: string) => {
    setReadingLogs(prev => prev.filter(log => log.id !== logId));
  };

  const handleImportVault = (newState: AppState & { userName?: string; yearlyGoal?: number }) => {
    if (newState.books) setBooks(newState.books);
    if (newState.readingLogs) setReadingLogs(newState.readingLogs);
    if (newState.reviews) setReviews(newState.reviews);
    if (newState.userName !== undefined) setUserName(newState.userName);
    if (newState.yearlyGoal !== undefined) setYearlyGoal(newState.yearlyGoal);
  };

  // Click on a calendar day logs callback
  const handleSelectDate = (dateString: string) => {
    setPrefilledDate(dateString);
    setIsAddOpen(true);
    // Let it render then scroll to Add+ section
    setTimeout(() => {
      document.getElementById('add-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const activeReview = reviews.find(r => r.bookId === selectedBookId);

  if (isInitializing) {
    return <div className="min-h-screen bg-app-base flex items-center justify-center"><div className="animate-spin text-brand-purple">Loading...</div></div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div data-theme={theme} className={`min-h-screen bg-app-base text-[var(--color-text-main)] font-${preferences.fontFamily} selection:bg-brand-purple/30 selection:text-[var(--color-text-main)] pb-16 transition-colors duration-500 relative overflow-hidden`}>
      {/* Outer ambient subtle mahogany deep glowing backgrounds to set the mood */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-brand-brown/[0.12] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-24 left-1/4 w-[280px] h-[280px] bg-brand-purple/[0.03] blur-[100px] rounded-full pointer-events-none" />

      {/* Savestate Theme Background Vectors (Circuitry Ws) */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          {/* Left Side Ws */}
          <path d="M 10,120 L 10,80 L 20,60 L 10,40 L 20,20 L 10,0 L 10,-20" stroke="var(--color-brand-purple)" strokeWidth="0.3" fill="none" className="drop-shadow-[0_0_5px_var(--color-brand-purple)]" />
          <path d="M 15,120 L 15,85 L 25,65 L 15,45 L 25,25 L 15,5 L 15,-20" stroke="var(--color-brand-teal)" strokeWidth="0.3" fill="none" className="drop-shadow-[0_0_5px_var(--color-brand-teal)]" />
          
          {/* Right Side Ws */}
          <path d="M 90,120 L 90,80 L 80,60 L 90,40 L 80,20 L 90,0 L 90,-20" stroke="var(--color-brand-magenta)" strokeWidth="0.3" fill="none" className="drop-shadow-[0_0_5px_var(--color-brand-magenta)]" />
          <path d="M 85,120 L 85,85 L 75,65 L 85,45 L 75,25 L 85,5 L 85,-20" stroke="var(--color-brand-yellow)" strokeWidth="0.3" fill="none" className="drop-shadow-[0_0_5px_var(--color-brand-yellow)]" />
        </svg>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-9 space-y-8 relative z-10">
        
        {currentPage === 'install' ? (
          <InstallGuide onEnterApp={() => {
            localStorage.setItem('bt_has_seen_install', 'true');
            setCurrentPage('home');
          }} />
        ) : (
          <>
            {/* Sleek App Branding & Navigation */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-app-border pb-6 relative z-50">
          <div className="flex items-center justify-between gap-3.5 flex-1">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                {/* Purple glowing banner ring */}
                <div className="absolute -inset-1 bg-brand-purple/20 rounded-xl blur-md -z-10 pointer-events-none" />
                <button 
                  onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                  className="relative px-3 py-2 bg-app-card border border-brand-purple/30 text-brand-purple rounded-xl shadow-lg cursor-pointer hover:bg-brand-purple/10 transition-colors flex items-center gap-2"
                  title="Navigation Menu"
                >
                  <BookOpen size={18} className="stroke-[1.8]" />
                  <span className="text-sm font-bold tracking-wide capitalize">{currentPage}</span>
                </button>
              
              {/* Navigation Dropdown Menu on click */}
              {isNavMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsNavMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 w-48 bg-app-card border border-brand-purple/30 rounded-xl shadow-2xl overflow-hidden z-50">
                    <button onClick={() => { setCurrentPage('home'); setIsNavMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 ${currentPage === 'home' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}`}>
                      <BookOpen size={14} /> Home
                    </button>
                    <button onClick={() => { setCurrentPage('community'); setIsNavMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 ${currentPage === 'community' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}`}>
                      <Users size={14} /> Reviews
                    </button>
                    <button onClick={() => { setCurrentPage('shelves'); setIsNavMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 ${currentPage === 'shelves' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}`}>
                      <BookMarked size={14} /> Shelves
                    </button>

                    <button onClick={() => { setCurrentPage('notebook'); setIsNavMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 ${currentPage === 'notebook' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}`}>
                      <Pencil size={14} /> Save Points
                    </button>
                    <button onClick={() => { setCurrentPage('quotes'); setIsNavMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 ${currentPage === 'quotes' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}`}>
                      <Quote size={14} /> Quotes
                    </button>
                    <button onClick={() => { setCurrentPage('achievements'); setIsNavMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 ${currentPage === 'achievements' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}`}>
                      <Trophy size={14} /> Achievements
                    </button>

                    <button onClick={() => { setCurrentPage('settings'); setIsNavMenuOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-brand-purple/10 ${currentPage === 'settings' ? 'text-brand-purple bg-brand-purple/5' : 'text-[var(--color-text-main)] hover:text-[var(--color-text-main)]'}`}>
                      <Settings size={14} /> Settings
                    </button>
                  </div>
                </>
              )}
            </div>
            </div>
            
            <div className="flex-1 flex items-center">
              <div className="flex items-center gap-2 flex-wrap">
                {currentPage !== 'home' && (
                  <button 
                    onClick={() => setCurrentPage('home')}
                    className="text-xs font-bold text-[var(--color-text-muted)] hover:text-brand-purple transition-colors bg-black/20 border border-app-border px-2 py-1 rounded cursor-pointer hidden md:block"
                  >
                    Home
                  </button>
                )}
                <div className="flex items-center gap-1.5 group/name pl-1 md:pl-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-main)] tracking-tight font-display">
                    {userName ? `${userName}'s ` : ''}SaveState
                  </h1>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsProfileDrawerOpen(true)}
              className="w-9 h-9 rounded-full bg-brand-purple/10 border border-brand-purple/30 text-brand-purple flex items-center justify-center hover:bg-brand-purple/20 transition-colors cursor-pointer shadow-sm relative overflow-hidden group ml-auto md:hidden shrink-0"
              title="Profile Settings"
            >
              <img src={userAvatar} alt="Profile Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            </button>
            
            <button
              onClick={() => setIsProfileDrawerOpen(true)}
              className="w-9 h-9 rounded-full bg-brand-purple/10 border border-brand-purple/30 text-brand-purple hidden md:flex items-center justify-center hover:bg-brand-purple/20 transition-colors cursor-pointer shadow-sm relative overflow-hidden group ml-auto"
              title="Profile Settings"
            >
              <img src={userAvatar} alt="Profile Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            </button>
            
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 shrink-0 relative">
            <div className="flex flex-col items-end gap-1 mt-3 sm:mt-0">
              {autosaveStatus && (
                <span className="text-[9px] font-mono text-teal-400 bg-teal-500/5 border border-teal-500/20 px-2.5 py-0.5 rounded flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-teal-400 animate-ping" />
                  {autosaveStatus}
                </span>
              )}
              <div className="text-[10px] font-mono text-[#CAB9D4]/90 bg-app-card border border-app-border px-3 py-1 rounded shadow-xs flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isAutosaving ? 'bg-teal-400 animate-spin' : 'bg-brand-turquoise animate-pulse'}`} />
                <span>Sync Engine active</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Rendering */}
        <main className="min-h-[500px]">
          {currentPage === 'home' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              
              {/* TOP ROW: Goal Section */}
              {preferences.showDailyGoal && (
                <section className="bg-app-card border border-app-border rounded-xl p-5 shadow-app-glow relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-turquoise/[0.02] blur-[40px] rounded-full pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-purple/10 border border-brand-purple/20 text-[#CAB9D4] rounded-lg">
                            <Trophy size={16} />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-wider font-display">
                              {currentYear} Goal
                            </h3>
                            <p className="text-sm font-bold text-[var(--color-text-main)] font-display mt-0.5">
                              <span className="text-brand-purple text-lg">{finishedBooksThisYearCount}</span> of <span className="text-[var(--color-text-muted)]">{yearlyGoal}</span> read
                            </p>
                          </div>
                        </div>
                        <p className="text-xs font-black text-brand-turquoise font-mono tracking-wide">{percentage}% Complete</p>
                      </div>
                      <div className="w-full h-4 bg-black/40 border border-app-border rounded-full overflow-hidden relative shadow-[inset_1px_1.5px_4px_rgba(0,0,0,0.6)]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-brand-purple via-brand-teal to-brand-turquoise rounded-full relative">
                          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-white/20" />
                        </motion.div>
                      </div>
                    </div>

                    <div className="shrink-0 flex justify-end md:border-l md:border-app-border md:pl-6">
                      {!isEditingGoal ? (
                        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-app-border/50">
                          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Target: <span className="text-brand-purple font-mono font-bold">{yearlyGoal}</span></span>
                          <button
                            onClick={() => setIsEditingGoal(true)}
                            className="p-1 text-[var(--color-text-muted)] hover:text-brand-purple transition-colors rounded hover:bg-black/30 cursor-pointer"
                          >
                            <Pencil size={11} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 bg-black/40 border border-brand-purple/40 rounded-lg p-2.5 shadow-md">
                          <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-center">Set Target</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setYearlyGoal(prev => { const n = Math.max(1, prev - 1); pushGoal(n); return n; })} className="p-1 bg-[#141417] hover:bg-[#202027] text-[var(--color-text-main)] rounded border border-app-border cursor-pointer"><Minus size={10} /></button>
                            <input type="number" min="1" value={yearlyGoal || ''} onChange={(e) => { const val = parseInt(e.target.value, 10); const n = isNaN(val) ? 0 : Math.max(0, val); setYearlyGoal(n); pushGoal(n); }} onBlur={() => { if (!yearlyGoal || yearlyGoal < 1) { setYearlyGoal(1); pushGoal(1); } }} className="w-12 bg-black/50 border border-app-border rounded-md py-1 text-xs font-black text-brand-purple font-mono text-center focus:outline-hidden focus:border-brand-purple" />
                            <button onClick={() => setYearlyGoal(prev => { const n = prev + 1; pushGoal(n); return n; })} className="p-1 bg-[#141417] hover:bg-[#202027] text-[var(--color-text-main)] rounded border border-app-border cursor-pointer"><Plus size={10} /></button>
                          </div>
                          <button onClick={() => setIsEditingGoal(false)} className="p-1 mt-1 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple hover:bg-brand-purple hover:text-[#340F04] text-[9px] font-bold rounded cursor-pointer flex items-center justify-center gap-1"><Check size={10} /> Done</button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* CALENDAR SECTION */}
              <section className="bg-app-card border border-app-border rounded-xl p-4 shadow-app-glow relative transition-all duration-300">
                <div className="flex items-center gap-2.5 mb-4 group cursor-pointer" onClick={() => setIsAddOpen(false)}>
                  <div className="p-1.5 bg-brand-purple/10 text-brand-purple rounded-md shrink-0"><Calendar size={14} /></div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-widest font-display">Calendar</h3>
                  </div>
                </div>
                <BookCalendar books={books} readingLogs={readingLogs} onSelectBook={setSelectedBookId} onSelectDate={handleSelectDate} startDay={preferences.calendarStartDay} />
              </section>

              {/* ADD SECTION */}
              <section id="add-section" className="bg-app-card border border-app-border rounded-xl p-4 shadow-app-glow relative transition-all duration-300">
                <div className="flex items-center justify-between cursor-pointer select-none group" onClick={() => { setIsAddOpen(prev => !prev); if (isAddOpen) setPrefilledDate(''); }}>
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="p-1.5 bg-brand-purple/10 text-brand-purple rounded-md group-hover:scale-105 transition-transform shrink-0"><Sparkles size={14} /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-text-main)] transition-colors uppercase tracking-widest font-display">Add+</h3>
                    </div>
                  </div>
                  <button className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] bg-black/20 hover:bg-black/40 rounded-lg border border-app-border transition-all shrink-0 cursor-pointer">
                    {isAddOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} className="text-brand-purple animate-bounce" />}
                  </button>
                </div>
                <AnimatePresence>
                  {isAddOpen && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden mt-4 pt-4 border-t border-app-border">
                      <BookSearch onAddBook={handleAddBook} existingBookIds={books.map(b => b.id)} defaultStartDate={prefilledDate} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </div>
          )}

          {currentPage === 'community' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CommunityFeed onViewProfile={(id) => { setViewingProfileId(id); setCurrentPage('profile'); }} />
            </div>
          )}

          {currentPage === 'profile' && viewingProfileId && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <UserProfile userId={viewingProfileId} onBack={() => { setCurrentPage('community'); setViewingProfileId(null); }} />
            </div>
          )}

          {currentPage === 'shelves' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
              <div className="flex border-b border-app-border mb-4">
                <button onClick={() => setShelfTab('books')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${shelfTab === 'books' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-[var(--color-text-muted)]'}`}>Books</button>
                <button onClick={() => setShelfTab('podcasts')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${shelfTab === 'podcasts' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-[var(--color-text-muted)]'}`}>Podcasts</button>
                <button onClick={() => setShelfTab('movies')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${shelfTab === 'movies' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-[var(--color-text-muted)]'}`}>Movies</button>
                <button onClick={() => setShelfTab('tv')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${shelfTab === 'tv' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-[var(--color-text-muted)]'}`}>TV</button>
              </div>
              <div className="flex-1 overflow-auto">
              {shelfTab === 'books' && (
              <MyLibrary
                theme={theme}
                shelfSkin={preferences.shelfSkin || 'Apothecary'}
                pinnedBadges={preferences.pinnedBadges || []}
                unlockedBadges={preferences.unlockedBadges || []}
                onUpdateShelfSkin={(skin) => handleUpdatePreferences({ shelfSkin: skin })}
                onUpdatePinnedBadges={(badges) => handleUpdatePreferences({ pinnedBadges: badges })}
                books={books}
                readingLogs={readingLogs}
                reviews={reviews}
                onSelectBook={setSelectedBookId}
                onRemoveBook={handleRemoveBook}
                onUpdateBook={handleUpdateBook}
                onSaveReview={handleSaveReview}
                onBatchRemoveBooks={(ids) => {
                  setBooks(prev => prev.filter(b => !ids.includes(b.id)));
                  setReadingLogs(prev => prev.filter(log => !ids.includes(log.bookId)));
                  setReviews(prev => prev.filter(rev => !ids.includes(rev.bookId)));
                }}
                onBatchUpdateBooks={(updated) => {
                  setBooks(prev => prev.map(b => updated.find(u => u.id === b.id) || b));
                }}
                onAddReadingLog={handleAddReadingLog}
                savePoints={savePoints}
                onAddSavePoint={(sp) => {
                  setSavePoints(prev => {
                    const newSp = { ...sp, id: `sp_${Date.now()}`, created_at: new Date().toISOString() };
                    pushSavePoint(newSp);
                    const next = [...prev, newSp];
                    if (next.length >= 15) unlockBadge('lore-master');
                    return next;
                  });
                }}
              />
              )}
              {shelfTab === 'podcasts' && (
              <MediaLibrary 
                type="podcast" 
                mediaItems={mediaItems} 
                mediaLogs={mediaLogs} 
                mediaReviews={mediaReviews}
                savePoints={savePoints}
                onUpdateMediaItem={handleUpdateMediaItem}
                onRemoveMediaItem={handleRemoveMediaItem}
                onSaveReview={handleSaveMediaReview}
                onAddMediaLog={handleAddMediaLog}
                onRemoveMediaLog={handleRemoveMediaLog}
                onAddSavePoint={(sp) => {
                  setSavePoints(prev => {
                    const newSp = { ...sp, id: `sp_${Date.now()}`, created_at: new Date().toISOString() };
                    pushSavePoint(newSp);
                    const next = [...prev, newSp];
                    if (next.length >= 15) unlockBadge('lore-master');
                    return next;
                  });
                }}
              />
              )}
              {shelfTab === 'movies' && (
              <MediaLibrary 
                type="movie" 
                mediaItems={mediaItems} 
                mediaLogs={mediaLogs} 
                mediaReviews={mediaReviews}
                savePoints={savePoints}
                onUpdateMediaItem={handleUpdateMediaItem}
                onRemoveMediaItem={handleRemoveMediaItem}
                onSaveReview={handleSaveMediaReview}
                onAddMediaLog={handleAddMediaLog}
                onRemoveMediaLog={handleRemoveMediaLog}
                onAddSavePoint={(sp) => {
                  setSavePoints(prev => {
                    const newSp = { ...sp, id: `sp_${Date.now()}`, created_at: new Date().toISOString() };
                    pushSavePoint(newSp);
                    const next = [...prev, newSp];
                    if (next.length >= 15) unlockBadge('lore-master');
                    return next;
                  });
                }}
              />
              )}
              {shelfTab === 'tv' && (
              <MediaLibrary 
                type="tv" 
                mediaItems={mediaItems} 
                mediaLogs={mediaLogs} 
                mediaReviews={mediaReviews}
                savePoints={savePoints}
                onUpdateMediaItem={handleUpdateMediaItem}
                onRemoveMediaItem={handleRemoveMediaItem}
                onSaveReview={handleSaveMediaReview}
                onAddMediaLog={handleAddMediaLog}
                onRemoveMediaLog={handleRemoveMediaLog}
                onAddSavePoint={(sp) => {
                  setSavePoints(prev => {
                    const newSp = { ...sp, id: `sp_${Date.now()}`, created_at: new Date().toISOString() };
                    pushSavePoint(newSp);
                    const next = [...prev, newSp];
                    if (next.length >= 15) unlockBadge('lore-master');
                    return next;
                  });
                }}
              />
              )}
              </div>
            </div>
          )}

          {currentPage === 'notebook' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <NotesNotebook books={books} reviews={reviews} onSaveReview={handleSaveReview} />
            </div>
          )}

          {currentPage === 'quotes' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <QuoteDeck books={books} reviews={reviews} onSaveReview={handleSaveReview} />
            </div>
          )}

          {currentPage === 'achievements' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AchievementsDashboard books={books} readingLogs={readingLogs} reviews={reviews} />
            </div>
          )}

          {currentPage === 'sync' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SyncHub appState={{ books, readingLogs, reviews }} onImportState={() => {}} currentUserName={userName} currentYearlyGoal={yearlyGoal} />
            </div>
          )}
          {currentPage === 'settings' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SettingsPanel 
                preferences={preferences} 
                onUpdatePreferences={handleUpdatePreferences}
                userName={userName}
                onUpdateUserName={setUserName}
                yearlyGoal={yearlyGoal}
                onUpdateYearlyGoal={setYearlyGoal}
              />
            </div>
          )}
        </main>
        <footer className="pt-8 border-t border-app-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[var(--color-text-muted)] text-[10px] font-mono leading-none">
          <p>© 2026 SaveState · Multimedia Tracking Log.</p>
          <p>Powered by Open Library indexing API.</p>
        </footer>
        </>
        )}

        {/* Book Details and Journal Modal overlay shadow */}
        <AnimatePresence>
          {selectedBookId && selectedBook && (
            <BookDetailModal
              book={selectedBook}
              readingLogs={readingLogs}
              review={activeReview}
              onClose={() => setSelectedBookId(null)}
              onSaveReview={handleSaveReview}
              onAddReadingLog={handleAddReadingLog}
              onRemoveReadingLog={handleRemoveReadingLog}
              onUpdateReadingLog={handleUpdateReadingLog}
              onDeleteBook={handleRemoveBook}
              onUpdateBook={handleUpdateBook}
              onNextBook={handleNextBook}
              onPrevBook={handlePrevBook}
            />
          )}

          {completedBookForCelebration && (
            <BookCelebrationModal
              book={completedBookForCelebration}
              onClose={() => setCompletedBookForCelebration(null)}
              onSaveRating={(rating) => {
                const updatedReview: BookReview = {
                  bookId: completedBookForCelebration.id,
                  rating,
                  notes: '',
                  updatedAt: new Date().toISOString(),
                };
                setReviews(prev => {
                  const existing = prev.find(r => r.bookId === updatedReview.bookId);
                  if (existing) {
                    return prev.map(r => r.bookId === updatedReview.bookId ? { ...r, rating } : r);
                  }
                  return [...prev, updatedReview];
                });
                setCompletedBookForCelebration(null);
              }}
            />
          )}
        </AnimatePresence>
        
        <ProfileDrawer
          isOpen={isProfileDrawerOpen}
          onClose={() => setIsProfileDrawerOpen(false)}
          session={session}
          onProfileUpdate={() => fetchCloudData(session?.user?.id || '')}
        />
      </div>
    </div>
  );
}
