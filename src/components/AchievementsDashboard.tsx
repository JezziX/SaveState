import React, { useMemo } from 'react';
import { Book, ReadingLog, BookReview, MediaItem, MediaLog } from '../types';
import { Trophy, Star, TrendingUp, Clock, BookOpen, Crown, Zap, Moon, Flame, Target, Medal, Hexagon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'motion/react';
import { getBookPoints, getMediaPoints } from '../utils/points';
import { getLevelInfo } from '../utils/levels';

interface AchievementsDashboardProps {
  books: Book[];
  readingLogs: ReadingLog[];
  reviews: BookReview[];
  mediaItems?: MediaItem[];
  mediaLogs?: MediaLog[];
}

export function AchievementsDashboard({ books, readingLogs, reviews, mediaItems = [], mediaLogs = [] }: AchievementsDashboardProps) {
  const getBookStatus = (bookId: string): 'backlog' | 'active' | 'completed' | 'dnf' => {
    const logs = readingLogs.filter(l => l.bookId === bookId);
    if (logs.some(l => l.status === 'completed')) return 'completed';
    if (logs.some(l => l.status === 'dnf')) return 'dnf';
    if (logs.some(l => l.status === 'active')) return 'active';
    return 'backlog';
  };

  const getMediaStatus = (mediaId: string): 'backlog' | 'active' | 'completed' | 'dnf' => {
    const logs = mediaLogs.filter(l => l.mediaId === mediaId);
    if (logs.some(l => l.status === 'completed')) return 'completed';
    if (logs.some(l => l.status === 'dnf')) return 'dnf';
    if (logs.some(l => l.status === 'active')) return 'active';
    return 'backlog';
  };

  const completedBooks = useMemo(() => {
    return books.filter(b => b.endDate || readingLogs.some(l => l.bookId === b.id && l.status === 'completed'));
  }, [books, readingLogs]);

  // Total XP across every book AND every media item (podcasts/movies/tv) -
  // this feeds the 25-level Media Mastery matrix (see utils/levels.ts).
  // Unlocking a level/title here does NOT auto-equip it to the public
  // profile - per the manual loadout rule, the user must open the loadout
  // drawer and choose what to display.
  const totalXp = useMemo(() => {
    const bookXp = books.reduce((sum, b) => sum + getBookPoints(b, getBookStatus(b.id)), 0);
    const mediaXp = mediaItems.reduce((sum, m) => sum + getMediaPoints(m, getMediaStatus(m.id)), 0);
    return bookXp + mediaXp;
  }, [books, readingLogs, mediaItems, mediaLogs]);

  const levelInfo = useMemo(() => getLevelInfo(totalXp), [totalXp]);

  const totalPages = useMemo(() => completedBooks.reduce((sum, b) => sum + (b.pages || 0), 0), [completedBooks]);
  const avgPagesPerHour = 50;
  const totalHoursLogged = Math.round(totalPages / avgPagesPerHour);

  // Streak logic (basic approximation: check unique dates in readingLogs)
  const streakDays = useMemo(() => {
    const dates = new Set<string>();
    readingLogs.forEach(l => {
      if (l.endDate) dates.add(l.endDate);
      if (l.startDate) dates.add(l.startDate);
    });
    // For a real app, calculate consecutive days. Here we just count unique logging days
    // to simulate a streak for demo purposes.
    return dates.size;
  }, [readingLogs]);

  // Badges
  const badges = [
    { id: 'streak-3', name: '3-Day Streak', icon: <Flame size={16} />, active: streakDays >= 3, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'streak-7', name: '7-Day Streak', icon: <Flame size={16} />, active: streakDays >= 7, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'books-5', name: '5 Books', icon: <BookOpen size={16} />, active: completedBooks.length >= 5, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'books-10', name: '10 Books', icon: <Medal size={16} />, active: completedBooks.length >= 10, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'books-25', name: '25 Books', icon: <Trophy size={16} />, active: completedBooks.length >= 25, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'night-owl', name: 'Night Owl', icon: <Moon size={16} />, active: readingLogs.length > 5, color: 'text-indigo-400', bg: 'bg-indigo-500/10' }, // Fake logic for night owl
  ];

  const genreData = useMemo(() => {
    const counts: Record<string, number> = {};
    completedBooks.forEach(b => {
      const g = b.genre || (b.subjects && b.subjects[0]) || 'Other';
      counts[g] = (counts[g] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [completedBooks]);
  const COLORS = ['#A855F7', '#57C7BE', '#F59E0B', '#3B82F6', '#EC4899'];

  const quotes = [
    "A reader lives a thousand lives before he dies.",
    "There is no friend as loyal as a book.",
    "Books are a uniquely portable magic.",
    "I have always imagined that Paradise will be a kind of library."
  ];
  const dailyQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-0">
      <div className="flex items-center gap-3 border-b border-app-border pb-4 mb-4">
        <div className="p-2 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple rounded-lg">
          <Crown size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-main)] font-display uppercase tracking-widest">
            Achievements
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: XP and Badges */}
        <div className="md:col-span-8 space-y-6">
          {/* Level Card */}
          <section className="bg-app-card border border-app-border rounded-xl p-6 shadow-app-glow relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2 mb-1">
                  <Hexagon size={14} className="text-brand-turquoise" /> Current Rank
                </h3>
                <h2 className="text-2xl font-bold text-brand-purple font-display">{levelInfo.title}</h2>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-[var(--color-text-main)] font-mono">{levelInfo.currentXp.toLocaleString()}</span>
                <span className="text-[10px] text-[var(--color-text-muted)] block uppercase tracking-wider font-bold">Total XP</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                <span>Level {levelInfo.level} / 25</span>
                <span>{levelInfo.xpForNextLevel ? `Next: ${levelInfo.nextTitle} (${(levelInfo.xpForNextLevel - levelInfo.xpIntoLevel).toLocaleString()} XP to go)` : 'Max Level Achieved'}</span>
              </div>
              <div className="h-3 w-full bg-app-base rounded-full overflow-hidden border border-app-border">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${levelInfo.progressPct}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-brand-turquoise to-brand-purple"
                />
              </div>
              {levelInfo.perk && (
                <p className="text-[9px] text-[var(--color-text-muted)] pt-1">
                  Unlocked perk: <span className="text-brand-purple font-bold">{levelInfo.perk}</span> - equip it from your loadout drawer.
                </p>
              )}
            </div>
          </section>

          {/* Badges Gallery */}
          <section className="bg-app-card border border-app-border rounded-xl p-6 shadow-app-glow">
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-app-border pb-3">
              <Medal size={14} className="text-brand-purple" /> Unlockable Badges
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {badges.map(badge => (
                <div key={badge.id} className={`flex flex-col items-center justify-center p-3 rounded-xl border ${badge.active ? 'border-brand-purple bg-brand-purple/5' : 'border-app-border bg-app-base opacity-50 grayscale'} transition-all`}>
                  <div className={`p-2 rounded-full ${badge.active ? badge.bg + ' ' + badge.color : 'bg-gray-800 text-gray-500'} mb-2`}>
                    {badge.icon}
                  </div>
                  <span className="text-[9px] font-bold text-[var(--color-text-main)] text-center uppercase tracking-wider">{badge.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Key Metrics */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-app-card border border-app-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <BookOpen size={20} className="text-brand-turquoise mb-2" />
              <span className="text-2xl font-black text-[var(--color-text-main)] font-mono">{completedBooks.length}</span>
              <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Books Read</span>
            </div>
            <div className="bg-app-card border border-app-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <TrendingUp size={20} className="text-brand-purple mb-2" />
              <span className="text-2xl font-black text-[var(--color-text-main)] font-mono">{avgPagesPerHour}</span>
              <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Pages / Hour</span>
            </div>
            <div className="bg-app-card border border-app-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <Clock size={20} className="text-amber-500 mb-2" />
              <span className="text-2xl font-black text-[var(--color-text-main)] font-mono">{totalHoursLogged}</span>
              <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Hours Logged</span>
            </div>
            <div className="bg-app-card border border-app-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <Target size={20} className="text-rose-500 mb-2" />
              <span className="text-2xl font-black text-[var(--color-text-main)] font-mono">${(completedBooks.length * 15).toLocaleString()}</span>
              <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Shelf Value</span>
            </div>
          </section>
        </div>

        {/* Right Column: Quotes & Analytics */}
        <div className="md:col-span-4 space-y-6 flex flex-col">
          {/* Daily Quote & Streak */}
          <section className="bg-gradient-to-br from-[#2a1b38] to-app-card border border-brand-purple/30 rounded-xl p-5 shadow-app-glow relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-brand-purple uppercase tracking-widest flex items-center gap-1.5">
                <Zap size={12} className="fill-brand-purple" /> Daily Inspiration
              </span>
              <div className="px-2 py-1 bg-black/40 rounded-full flex items-center gap-1.5 border border-white/5">
                <Flame size={12} className={streakDays > 0 ? "text-orange-500 fill-orange-500" : "text-gray-500"} />
                <span className="text-[10px] font-bold text-white font-mono">{streakDays} Day Streak</span>
              </div>
            </div>
            <p className="text-sm font-serif italic text-[#e6e6fa] leading-relaxed">
              "{dailyQuote}"
            </p>
          </section>

          {/* Genre Analytics */}
          <section className="bg-app-card border border-app-border rounded-xl p-5 flex-1 shadow-app-glow flex flex-col">
            <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2 mb-4">
              <Star size={14} className="text-brand-turquoise" /> Top Genres
            </h3>
            
            {genreData.length > 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {genreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="w-full mt-4 space-y-2">
                  {genreData.map((genre, idx) => (
                    <div key={genre.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="truncate text-[var(--color-text-main)] font-medium capitalize">{genre.name}</span>
                      </div>
                      <span className="font-mono text-[var(--color-text-muted)] font-bold shrink-0">{genre.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[10px] font-medium text-[var(--color-text-muted)] italic">
                Read more books to unlock genre insights.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
