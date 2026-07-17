import React, { useState } from 'react';
import { Book, ReadingLog } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, BookOpen, AlertCircle } from 'lucide-react';
import { handleImageError } from './MyLibrary';

interface BookCalendarProps {
  books: Book[];
  readingLogs: ReadingLog[];
  onSelectBook: (bookId: string) => void;
  onSelectDate: (dateString: string) => void;
  startDay?: 'sunday' | 'monday';
}

export function BookCalendar({ books, readingLogs, onSelectBook, onSelectDate, startDay = 'sunday' }: BookCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month metadata
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to generate calendar matrix
  let firstDayOfMonth = new Date(year, month, 1).getDay();
  if (startDay === 'monday') {
    firstDayOfMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonthDays = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    prevMonthDays.push({
      day: daysInPrevMonth - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false
    });
  }

  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push({
      day: i,
      month,
      year,
      isCurrentMonth: true
    });
  }

  // Next month initial padding days
  const totalDaysSoFar = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = (7 - (totalDaysSoFar % 7)) % 7;
  const nextMonthDays = [];
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    nextMonthDays.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false
    });
  }

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  const [layoutMode, setLayoutMode] = useState<'tiled' | 'stacked'>('tiled');

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Find books read/active on a specific day
  const getBooksForDay = (day: number, m: number, y: number): Book[] => {
    const cellDateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Core helper to resolve latest status of book
    const getBookStatus = (bookId: string) => {
      const logs = readingLogs.filter(log => log.bookId === bookId);
      if (logs.length === 0) return 'backlog';
      const sorted = [...logs].sort((a, b) => {
        const dateA = a.endDate || a.startDate || '';
        const dateB = b.endDate || b.startDate || '';
        return dateB.localeCompare(dateA);
      });
      const bookObj = books.find(b => b.id === bookId);
      if (bookObj?.didNotFinish) return 'dnf';
      return sorted[0].status;
    };

    return books.filter(book => {
      // DNF books do not appear on the calendar!
      if (book.didNotFinish) return false;

      const currentStatus = getBookStatus(book.id);
      // ONLY books explicitly set to "Reading" or "Completed" appear on the Reading Calendar
      if (currentStatus !== 'active' && currentStatus !== 'completed') return false;

      // 1. Direct dates on the Book object
      if (book.startDate) {
        const end = book.endDate || todayStr;
        return cellDateStr >= book.startDate && cellDateStr <= end;
      }
      if (book.endDate) {
        return book.endDate === cellDateStr;
      }

      // 2. ReadingLog range match (only for valid Logs)
      const logs = readingLogs.filter(log => log.bookId === book.id && (log.status === 'active' || log.status === 'completed'));
      if (logs.length > 0) {
        return logs.some(log => {
          const start = log.startDate || book.startDate;
          if (start) {
            const end = log.endDate || book.endDate || todayStr;
            return cellDateStr >= start && cellDateStr <= end;
          }
          if (log.endDate) {
            return log.endDate === cellDateStr;
          }
          return false;
        });
      }

      return false;
    });
  };

  return (
    <div className="relative overflow-hidden group">
      {/* Visual background atmospheric accent using brand-purple */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-purple/5 blur-[80px] rounded-full pointer-events-none" />
      
      {/* Prominent Month & Year Display banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3.5 px-5 bg-app-base border border-app-border rounded-xl mb-5 shadow-inner">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button 
            onClick={handlePrevMonth}
            className="p-2 text-[var(--color-text-muted)] hover:text-white hover:bg-app-card rounded-lg border border-app-border hover:border-brand-purple/30 transition-all cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          
          <button 
            onClick={handleToday}
            className="px-2.5 py-1 bg-[#181820] border border-app-border rounded-md text-[10px] uppercase tracking-wider font-extrabold text-[var(--color-text-muted)] hover:text-white hover:border-brand-purple/30 transition-all cursor-pointer flex items-center gap-1.5"
            title="Jump to Current Month"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-turquoise"></span>
            Today
          </button>

          <button 
            onClick={handleNextMonth}
            className="p-2 text-[#CAB9D4] hover:text-white hover:bg-app-card rounded-lg border border-app-border hover:border-brand-purple/30 transition-all cursor-pointer"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>

          {/* Stacking Options Controller */}
          <div className="flex items-center bg-app-base border border-app-border p-0.5 rounded-md ml-1.5">
            <button
              onClick={() => setLayoutMode('tiled')}
              className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                layoutMode === 'tiled' ? 'bg-brand-purple text-[#340F04] font-extrabold' : 'text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              Tile
            </button>
            <button
              onClick={() => setLayoutMode('stacked')}
              className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                layoutMode === 'stacked' ? 'bg-brand-purple text-[#340F04] font-extrabold' : 'text-[var(--color-text-muted)] hover:text-white'
              }`}
            >
              Stack
            </button>
          </div>
        </div>
        
        <div className="text-center sm:text-right font-display select-none">
          <div className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-purple to-brand-turquoise tracking-tight uppercase leading-none">
            {monthNames[month]}
          </div>
          <div className="text-[10px] font-black tracking-[0.2em] text-[#CAB9D4] font-mono mt-1 sm:mr-1 leading-none">
            {year}
          </div>
          {(() => {
            const completedThisMonth = books.filter(b => {
              if (b.didNotFinish) return false;
              if (b.endDate) {
                const parts = b.endDate.split('-');
                if (parts.length >= 2) {
                  return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month + 1;
                }
              }
              const logs = readingLogs.filter(log => log.bookId === b.id && log.status === 'completed' && log.endDate);
              return logs.some(log => {
                const parts = log.endDate!.split('-');
                if (parts.length >= 2) {
                  return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month + 1;
                }
                return false;
              });
            }).length;

            return (
              <div className="text-[9px] font-black font-mono mt-1.5 sm:mr-1 text-brand-turquoise/85 tracking-widest uppercase">
                ✦ {completedThisMonth} volume{completedThisMonth === 1 ? '' : 's'} read
              </div>
            );
          })()}
        </div>
      </div>

      {/* Week days labels */}
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {(startDay === 'monday' 
          ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] 
          : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        ).map((day, idx) => (
          <div 
            key={idx} 
            className="text-center text-[9px] uppercase tracking-wider font-bold text-[var(--color-text-muted)] py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {allCalendarDays.map((cell, idx) => {
          const dayBooks = getBooksForDay(cell.day, cell.month, cell.year);
          const cellDateString = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
          const isToday = new Date().toDateString() === new Date(cell.year, cell.month, cell.day).toDateString();

          return (
            <div 
              key={idx}
              onClick={() => onSelectDate(cellDateString)}
              className={`min-h-[90px] sm:min-h-[120px] p-1.5 rounded-lg border flex flex-col justify-between transition-all cursor-pointer relative group-all ${
                cell.isCurrentMonth 
                  ? 'bg-app-base border-app-border hover:border-brand-purple/20' 
                  : 'bg-app-base border-[#1e1e24] opacity-30 hover:opacity-75'
              } ${isToday ? 'outline-2 outline-brand-purple/40 border-brand-purple bg-[#1a1222]' : ''}`}
            >
              {/* Day indicator */}
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-bold ${
                  isToday ? 'text-brand-turquoise' : cell.isCurrentMonth ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-muted)]'
                }`}>
                  {cell.day}
                </span>
                
                {dayBooks.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-turquoise shadow-[0_0_6px_rgba(87,199,190,0.5)]" />
                )}
              </div>

              {/* Books listing */}
              <div className="flex-1 flex flex-col justify-end gap-1 overflow-hidden min-h-[40px] relative">
                {dayBooks.length > 0 ? (
                  layoutMode === 'tiled' ? (
                    /* Tiled Layout Mode - side-by-side */
                    <div className="flex flex-wrap gap-1 justify-center relative max-h-[90px] overflow-hidden">
                      {dayBooks.map((book) => (
                        <div
                          key={book.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBook(book.id);
                          }}
                          className="relative max-h-[58px] sm:max-h-[84px] w-[28px] sm:w-[42px] aspect-[2/3] rounded overflow-hidden bg-black border border-app-border shadow hover:scale-110 hover:border-brand-purple group/cover transition-all shrink-0"
                          title={`${book.title} by ${book.author}`}
                        >
                          <img 
                            referrerPolicy="no-referrer"
                            src={book.coverUrl} 
                            alt={book.title}
                            onError={(e) => handleImageError(e, book.title)}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center p-0.5 text-center transition-opacity">
                            <span className="text-[6px] leading-tight font-medium text-brand-purple truncate max-w-full">
                              {book.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Stacked Layout Mode - 3D overlapping stacked fanning */
                    <div className="relative flex items-center justify-center h-[60px] sm:h-[86px] w-full">
                      {dayBooks.map((book, bIdx) => {
                        const offsetLeft = bIdx * 8;
                        const zIndex = 10 + bIdx;
                        return (
                          <div
                            key={book.id}
                            style={{ 
                              left: `calc(50% - 18px + ${offsetLeft - (dayBooks.length - 1) * 4}px)`,
                              zIndex: zIndex
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBook(book.id);
                            }}
                            className="absolute h-[48px] sm:h-[72px] aspect-[2/3] rounded overflow-hidden bg-black border border-app-border/80 shadow-md hover:scale-125 hover:z-50 hover:border-brand-purple group/cover transition-all"
                            title={`${book.title} by ${book.author}`}
                          >
                            <img 
                              referrerPolicy="no-referrer"
                              src={book.coverUrl} 
                              alt={book.title}
                              onError={(e) => handleImageError(e, book.title)}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center p-0.5 text-center transition-opacity">
                              <span className="text-[5px] sm:text-[6px] leading-tight font-medium text-brand-purple truncate max-w-full">
                                {book.title}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity">
                    <BookOpen size={11} className="text-gray-700" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {readingLogs.length === 0 && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-brand-purple/5 border border-brand-purple/10 rounded-lg justify-center">
          <AlertCircle size={13} className="text-[#CAB9D4]" />
          <p className="text-xs text-[#CAB9D4]/80">No read dates logged. Marked complete items will overlay automatically!</p>
        </div>
      )}
    </div>
  );
}
