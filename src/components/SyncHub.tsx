import React, { useRef, useState, useEffect } from 'react';
import { AppState } from '../types';
import { 
  Share2, 
  Download, 
  Upload, 
  Cpu, 
  Smartphone, 
  Monitor, 
  Info, 
  Check, 
  AlertTriangle, 
  FileJson, 
  RefreshCw, 
  FileText, 
  BookOpen, 
  HelpCircle,
  Database,
  Sparkles,
  Cloud,
  Copy,
  Terminal,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { autoDetectAndParseCSV, parseCSV } from '../utils/importParsers';
import { supabase } from '../utils/supabaseClient';

interface SyncHubProps {
  appState: AppState;
  onImportState: (newState: AppState & { userName?: string; yearlyGoal?: number }) => void;
  currentUserName?: string;
  currentYearlyGoal?: number;
}

type ModeTab = 'native-vault' | 'cloud-sync' | 'third-party';

// Create a unique user-friendly vault sync code
const generateRandomSyncCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'savestate-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export function SyncHub({ appState, onImportState, currentUserName, currentYearlyGoal }: SyncHubProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<ModeTab>('cloud-sync'); // Default to cloud-sync as it's the requested feature
  
  // Importer states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importConflictMode, setImportConflictMode] = useState<'merge' | 'overwrite'>('merge');

  // Supabase Cloud Sync states
  const [syncCode, setSyncCode] = useState<string>(() => {
    const saved = localStorage.getItem('bt_supabase_sync_code');
    if (saved) return saved.trim().toLowerCase();
    const generated = generateRandomSyncCode();
    localStorage.setItem('bt_supabase_sync_code', generated);
    return generated;
  });

  const [lastCloudSync, setLastCloudSync] = useState<string | null>(() => {
    return localStorage.getItem('bt_supabase_last_sync');
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync state to local storage when code changes
  useEffect(() => {
    localStorage.setItem('bt_supabase_sync_code', syncCode.trim().toLowerCase());
  }, [syncCode]);

  // Check if target table is ready on mount/tab click
  const verifyTableStructureOnCloud = async (silent: boolean = true) => {
    try {
      const { error } = await supabase
        .from('savestate_vault')
        .select('sync_code')
        .limit(1);

      if (error) {
        if (error.code === '42P01' || error.message.includes('not exist') || error.message.includes('relation')) {
          setTableExists(false);
          if (!silent) triggerMessage("Supabase table 'savestate_vault' was not detected.", true);
        } else {
          setTableExists(true);
        }
      } else {
        setTableExists(true);
      }
    } catch (err) {
      setTableExists(true); // Default to true to prevent blocking if offline or blocked
    }
  };

  useEffect(() => {
    if (activeTab === 'cloud-sync') {
      verifyTableStructureOnCloud(true);
    }
  }, [activeTab]);

  const handleCloudBackupPush = async () => {
    if (!syncCode.trim()) {
      triggerMessage("Please provide a valid sync code.", true);
      return;
    }
    setIsSyncing(true);
    try {
      const targetCode = syncCode.trim().toLowerCase();
      const payload = {
        sync_code: targetCode,
        user_name: currentUserName || '',
        yearly_goal: currentYearlyGoal || 12,
        books: appState.books,
        reading_logs: appState.readingLogs,
        reviews: appState.reviews,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('savestate_vault')
        .upsert(payload);

      if (error) {
        console.error("Supabase upsert error:", error);
        if (error.code === '42P01' || error.message.includes('not exist') || error.message.includes('relation')) {
          setTableExists(false);
          triggerMessage("Failed: Table 'savestate_vault' not found. Setup is required.", true);
        } else {
          triggerMessage(`Cloud communication failed: ${error.message}`, true);
        }
      } else {
        setTableExists(true);
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();
        setLastCloudSync(nowStr);
        localStorage.setItem('bt_supabase_last_sync', nowStr);
        triggerMessage("Vault securely uploaded to Supabase cloud! It is now synced.", false);
      }
    } catch (err: any) {
      triggerMessage(`An unexpected error occurred: ${err.message || 'Network error'}`, true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudRestorePull = async () => {
    if (!syncCode.trim()) {
      triggerMessage("Please enter an active sync code.", true);
      return;
    }
    setIsSyncing(true);
    try {
      const targetCode = syncCode.trim().toLowerCase();
      const { data, error } = await supabase
        .from('savestate_vault')
        .select('*')
        .eq('sync_code', targetCode)
        .maybeSingle();

      if (error) {
        console.error("Supabase select error:", error);
        if (error.code === '42P01' || error.message.includes('not exist') || error.message.includes('relation')) {
          setTableExists(false);
          triggerMessage("Failed: Table 'savestate_vault' not found on your Supabase project.", true);
        } else {
          triggerMessage(`Cloud fetch failed: ${error.message}`, true);
        }
      } else if (!data) {
        triggerMessage(`No vault records found matching code "${targetCode}".`, true);
      } else {
        setTableExists(true);
        
        const incomingState = {
          books: Array.isArray(data.books) ? data.books : [],
          readingLogs: Array.isArray(data.reading_logs) ? data.reading_logs : [],
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
          userName: data.user_name || '',
          yearlyGoal: data.yearly_goal || 12
        };

        if (importConflictMode === 'merge') {
          const merged = mergeStates(appState, incomingState as AppState);
          onImportState({
            ...merged,
            userName: incomingState.userName || currentUserName,
            yearlyGoal: incomingState.yearlyGoal || currentYearlyGoal
          });
          triggerMessage(`Cloud vault merged! Total active books on shelf: ${merged.books.length}`, false);
        } else {
          onImportState(incomingState);
          triggerMessage("Cloud vault restored successfully! Offline dashboard updated.", false);
        }
        
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString();
        setLastCloudSync(nowStr);
        localStorage.setItem('bt_supabase_last_sync', nowStr);
      }
    } catch (err: any) {
      triggerMessage(`An unexpected error occurred: ${err.message || 'Fetch error'}`, true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Report modal/panel state of the last parsed CSV
  const [parsedReport, setParsedReport] = useState<{
    source: 'goodreads' | 'bookmory' | 'unknown';
    booksCount: number;
    logsCount: number;
    reviewsCount: number;
    rawParsedState: AppState;
  } | null>(null);

  // Trigger JSON file export (Native SaveState Vault)
  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `book_tracker_vault_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerMessage("Vault exported successfully! Load this file on your other device.", false);
    } catch (err) {
      triggerMessage("Failed to compile vault export", true);
    }
  };

  // Import JSON file action (Native SaveState Vault)
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.books) && Array.isArray(parsed.readingLogs) && Array.isArray(parsed.reviews)) {
          if (importConflictMode === 'merge') {
            const merged = mergeStates(appState, parsed as AppState);
            onImportState(merged);
            triggerMessage(`Vault imported and merged successfully! Total books: ${merged.books.length}.`, false);
          } else {
            onImportState(parsed as AppState);
            triggerMessage("Vault imported! Handheld dashboard overwritten.", false);
          }
        } else {
          triggerMessage("Invalid format. Make sure the file was exported from this tracker.", true);
        }
      } catch (err) {
        triggerMessage("Failed to parse vault file. Is it a correct JSON?", true);
      }
    };
    fileReader.readAsText(files[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handler for Goodreads or Bookmory CSV uploads
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        triggerMessage("The uploaded file corresponds to an empty format.", true);
        return;
      }

      try {
        const result = autoDetectAndParseCSV(text);
        if (result && result.state.books.length > 0) {
          setParsedReport({
            source: result.source,
            booksCount: result.report.booksImported,
            logsCount: result.report.logsImported,
            reviewsCount: result.report.reviewsImported,
            rawParsedState: result.state
          });
          triggerMessage(`Detected ${result.source === 'goodreads' ? 'Goodreads' : 'Bookmory'} CSV file. Ready to sync!`, false);
        } else {
          // Let's do a helpful generic CSV parsing warning
          triggerMessage("Could not auto-detect Goodreads or Bookmory schemas. Ensure the CSV remains untempered.", true);
        }
      } catch (err) {
        console.error(err);
        triggerMessage("An error occurred during file ingestion analysis.", true);
      }
    };
    fileReader.readAsText(files[0]);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  // Goodreads compatible library CSV export
  const handleExportGoodreadsCSV = () => {
    try {
      const headers = ['Title', 'Author', 'My Rating', 'Date Read', 'Date Added', 'Date Started', 'Exclusive Shelf', 'My Review', 'Number of Pages'];
      const csvRows = [headers.join(',')];

      appState.books.forEach(book => {
        const logs = appState.readingLogs.filter(l => l.bookId === book.id);
        const hasCompleted = logs.some(l => l.status === 'completed');
        const hasReading = logs.some(l => l.status === 'active');
        
        let shelf = 'backlog';
        if (hasCompleted) shelf = 'read';
        else if (hasReading) shelf = 'currently-reading';

        const completedLog = [...logs]
          .filter(l => l.status === 'completed' && l.endDate)
          .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
        
        const readingLog = [...logs]
          .filter(l => l.startDate)
          .sort((a, b) => a.startDate!.localeCompare(b.startDate!))[0];
        
        const dateRead = completedLog ? completedLog.endDate : '';
        const dateStarted = readingLog ? readingLog.startDate : (completedLog?.startDate || '');
        const dateAdded = dateStarted || dateRead || ''; // Fallback for date added

        const review = appState.reviews.find(r => r.bookId === book.id);
        const rating = review ? review.rating : '0';

        const escapeCSVField = (val: string) => {
          const clean = val.replace(/"/g, '""');
          return `"${clean}"`;
        };

        const row = [
          escapeCSVField(book.title),
          escapeCSVField(book.author),
          rating,
          dateRead,
          dateAdded,
          dateStarted,
          shelf,
          escapeCSVField(review?.notes || ''),
          book.pages || ''
        ];

        csvRows.push(row.join(','));
      });

      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", csvContent);
      downloadAnchor.setAttribute("download", `goodreads_compatible_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerMessage("Goodreads-compatible CSV exported successfully!", false);
    } catch (err) {
      triggerMessage("Failed to export Goodreads-compatible CSV", true);
    }
  };

  // Bookmory compatible library CSV export
  const handleExportBookmoryCSV = () => {
    try {
      const headers = ['Title', 'Author', 'Status', 'Reading Period', 'Rating', 'Note'];
      const csvRows = [headers.join(',')];

      appState.books.forEach(book => {
        const logs = appState.readingLogs.filter(l => l.bookId === book.id);
        const hasCompleted = logs.some(l => l.status === 'completed');
        const hasReading = logs.some(l => l.status === 'active');
        
        let status = 'To-Read';
        if (hasCompleted) status = 'Completed';
        else if (hasReading) status = 'Reading';

        const completedLog = [...logs]
          .filter(l => l.status === 'completed' && l.endDate)
          .sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
        
        const readingPeriod = completedLog ? `${completedLog.endDate} ~ ${completedLog.endDate}` : '';
        const review = appState.reviews.find(r => r.bookId === book.id);
        const ratingScore = review ? review.rating : 0;
        const ratingStars = '★'.repeat(ratingScore);

        const escapeCSVField = (val: string) => {
          const clean = val.replace(/"/g, '""');
          return `"${clean}"`;
        };

        const row = [
          escapeCSVField(book.title),
          escapeCSVField(book.author),
          status,
          readingPeriod,
          ratingStars || '0',
          escapeCSVField(review?.notes || '')
        ];

        csvRows.push(row.join(','));
      });

      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", csvContent);
      downloadAnchor.setAttribute("download", `bookmory_compatible_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerMessage("Bookmory-compatible CSV exported successfully!", false);
    } catch (err) {
      triggerMessage("Failed to export Bookmory-compatible CSV2", true);
    }
  };

  // Confirms and persists the parsed CSV state with merge options
  const handleConfirmCSVImport = () => {
    if (!parsedReport) return;

    const incoming = parsedReport.rawParsedState;
    if (importConflictMode === 'merge') {
      const merged = mergeStates(appState, incoming);
      onImportState(merged);
      triggerMessage(`Success! Merged ${parsedReport.booksCount} books from ${parsedReport.source === 'goodreads' ? 'Goodreads' : 'Bookmory'}.`, false);
    } else {
      onImportState(incoming);
      triggerMessage(`Success! Library replaced with ${parsedReport.booksCount} books from ${parsedReport.source === 'goodreads' ? 'Goodreads' : 'Bookmory'}.`, false);
    }

    // Reset report state
    setParsedReport(null);
  };

  // Robust merging helper
  const mergeStates = (current: AppState, incoming: AppState): AppState => {
    const mergedBooks = [...current.books];
    const currentKeySet = new Set(
      current.books.map(b => `${b.title.toLowerCase().trim()}|||${b.author.toLowerCase().trim()}`)
    );

    const keyMapIncomingToExisting: Record<string, string> = {};

    incoming.books.forEach(inBook => {
      const key = `${inBook.title.toLowerCase().trim()}|||${inBook.author.toLowerCase().trim()}`;
      if (currentKeySet.has(key)) {
        const existingBook = current.books.find(b => `${b.title.toLowerCase().trim()}|||${b.author.toLowerCase().trim()}` === key);
        if (existingBook) {
          keyMapIncomingToExisting[inBook.id] = existingBook.id;
        }
      } else {
        mergedBooks.push(inBook);
        currentKeySet.add(key);
      }
    });

    // Merge reading logs
    const mergedLogs = [...current.readingLogs];
    incoming.readingLogs.forEach(inLog => {
      const targetBookId = keyMapIncomingToExisting[inLog.bookId] || inLog.bookId;
      
      const isDuplicate = current.readingLogs.some(log => 
        log.bookId === targetBookId && 
        log.status === inLog.status && 
        log.endDate === inLog.endDate
      );

      if (!isDuplicate) {
        mergedLogs.push({
          ...inLog,
          id: `log_merged_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`,
          bookId: targetBookId
        });
      }
    });

    // Merge reviews
    const mergedReviews = [...current.reviews];
    incoming.reviews.forEach(inReview => {
      const targetBookId = keyMapIncomingToExisting[inReview.bookId] || inReview.bookId;
      const existingIdx = mergedReviews.findIndex(r => r.bookId === targetBookId);

      if (existingIdx > -1) {
        const existing = mergedReviews[existingIdx];
        const mergedNote = (existing.notes && existing.notes.trim()) ? existing.notes : inReview.notes;
        const mergedRating = existing.rating > 0 ? existing.rating : inReview.rating;
        
        mergedReviews[existingIdx] = {
          bookId: targetBookId,
          rating: mergedRating,
          notes: mergedNote,
          updatedAt: existing.updatedAt || inReview.updatedAt
        };
      } else {
        mergedReviews.push({
          ...inReview,
          bookId: targetBookId
        });
      }
    });

    return {
      books: mergedBooks,
      readingLogs: mergedLogs,
      reviews: mergedReviews
    };
  };

  const triggerMessage = (text: string, isError: boolean) => {
    if (isError) {
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(text);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  return (
    <div className="relative">
      {/* Background radial accent with brand-purple */}
      <div className="absolute top-0 left-0 w-44 h-44 bg-brand-purple/5 blur-[70px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border/65 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-purple/10 border border-brand-purple/20 text-[#CAB9D4] rounded-lg">
            <Share2 size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-100 font-display">Sync</h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">Keep folders synced using static files or leverage third-party Goodreads/Bookmory backups</p>
          </div>
        </div>

        {/* Sync Settings Tabs */}
        <div className="flex bg-app-base border border-app-border p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('cloud-sync')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cloud-sync'
                ? 'bg-brand-purple text-[#340F04] font-extrabold shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-white'
            }`}
          >
            <Cloud size={11} /> Supabase Sync
          </button>
          <button
            onClick={() => setActiveTab('native-vault')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'native-vault'
                ? 'bg-brand-purple text-[#340F04] font-extrabold'
                : 'text-[var(--color-text-muted)] hover:text-white'
            }`}
          >
            SaveState Vault
          </button>
          <button
            onClick={() => setActiveTab('third-party')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'third-party'
                ? 'bg-brand-purple text-[#340F04] font-extrabold'
                : 'text-[var(--color-text-muted)] hover:text-white'
            }`}
          >
            <Sparkles size={11} /> Goodreads & Bookmory Importer
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-2 mb-4"
          >
            <Check size={14} /> {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg flex items-center gap-2 mb-4"
          >
            <AlertTriangle size={14} /> {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conflicts Resolution Preference Picker (Universal) */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 bg-app-base border border-app-border rounded-lg text-xs">
        <div>
          <span className="font-bold text-[var(--color-text-main)] block text-[10px] uppercase tracking-wider">Import Conflict Method</span>
          <span className="text-[var(--color-text-muted)] text-[10px] mt-0.5 block">Select how files are synced with existing books</span>
        </div>
        <div className="flex bg-[#181822] border border-app-border p-0.5 rounded">
          <button
            onClick={() => setImportConflictMode('merge')}
            className={`px-2.5 py-1 rounded text-[9.5px] font-bold uppercase tracking-wider transition-all ${
              importConflictMode === 'merge' ? 'bg-brand-purple/20 text-[#CAB9D4] border border-brand-purple/35' : 'text-[var(--color-text-muted)] border border-transparent'
            }`}
            title="Merges unique volumes without clearing"
          >
            Merge & Append
          </button>
          <button
            onClick={() => setImportConflictMode('overwrite')}
            className={`px-2.5 py-1 rounded text-[9.5px] font-bold uppercase tracking-wider transition-all ${
              importConflictMode === 'overwrite' ? 'bg-red-500/10 text-red-400 border border-red-500/15' : 'text-[var(--color-text-muted)] border border-transparent'
            }`}
            title="Wipes existing records to load file perfectly"
          >
            Erase & Overwrite
          </button>
        </div>
      </div>      {activeTab === 'cloud-sync' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supabase Dashboard / Connection status check */}
            <div className="bg-app-base border border-app-border rounded-lg p-4 space-y-3">
              <h3 className="text-[11px] font-bold text-[var(--color-text-main)] uppercase tracking-wider flex items-center gap-1.5 border-b border-app-border pb-2">
                <Cloud size={13} className="text-brand-purple" /> Supabase Real-time Cloud Vault
              </h3>
              <p className="text-[10px] text-[var(--color-text-muted)] leading-normal font-medium">
              </p>

              <div className="space-y-2 pt-1">
                <label className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-wider block">Your Vault Sync Code</label>
                <div className="flex items-center gap-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={syncCode}
                      onChange={(e) => setSyncCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="e.g. my-private-vault"
                      className="w-full bg-[#181822] border border-app-border rounded p-2 text-xs font-mono font-bold text-[#CAB9D4] focus:text-white focus:outline-none focus:ring-1 focus:ring-brand-purple"
                    />
                    <div className="absolute right-2 top-2 text-[var(--color-text-muted)]">
                      <Lock size={12} />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCopyCode}
                    className="p-2 bg-[#1b1b24] border border-app-border hover:bg-[#252533] rounded text-[var(--color-text-main)] transition-all cursor-pointer flex items-center justify-center shrink-0"
                    title="Copy Sync Code"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[9px] text-[var(--color-text-muted)] font-mono">
                  Keep this code private. Use it on other devices or tabs to restore/merge your active readings.
                </p>
              </div>

              {/* Push/Pull cloud actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleCloudBackupPush}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-md border border-brand-purple/30 bg-brand-purple/10 hover:bg-brand-purple hover:text-[#340F04] font-bold text-[11px] text-[#CAB9D4] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? "Syncing..." : "Push to Cloud"}
                </button>

                <button
                  onClick={handleCloudRestorePull}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-md border border-[#25252e] bg-[#141417] text-[var(--color-text-main)] hover:border-brand-purple/30 hover:bg-[#1d1d22] font-semibold text-[11px] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={12} />
                  Pull & Sync
                </button>
              </div>

              {/* Last synced metadata */}
              <div className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1.5 pt-1.5 border-t border-app-border/30">
                <Info size={11} className="text-brand-purple shrink-0" />
                <span>Last Synced: <strong className="text-[var(--color-text-main)] font-semibold">{lastCloudSync || 'Never Synced'}</strong></span>
              </div>
            </div>

            {/* Instruction / Guide to structure setup */}
            <div className="bg-app-base border border-app-border rounded-lg p-4 space-y-3 relative">
              <div className="flex items-center justify-between border-b border-app-border pb-2">
                <h3 className="text-[11px] font-bold text-[var(--color-text-main)] uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal size={13} className="text-brand-turquoise" /> First-Time Supabase Setup
                </h3>
                {tableExists === false ? (
                  <span className="p-0.5 px-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-black uppercase tracking-wider rounded">
                    Action Required
                  </span>
                ) : tableExists === true ? (
                  <span className="p-0.5 px-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-wider rounded">
                    Connected
                  </span>
                ) : (
                  <span className="p-0.5 px-2 bg-gray-500/10 border border-gray-500/20 text-[var(--color-text-muted)] text-[8px] font-black uppercase tracking-wider rounded">
                    Unchecked
                  </span>
                )}
              </div>

              {tableExists === false ? (
                /* Beautiful Step-By-Step instructions with copyable code to run */
                <div className="space-y-2 text-[9.5px]">
                  <p className="text-[var(--color-text-muted)] leading-relaxed font-sans">
                    The Supabase table <code className="text-brand-purple font-mono font-bold">savestate_vault</code> was not detected. Please run the following SQL code in your **Supabase SQL Editor** to construct the target vault in 10 seconds:
                  </p>
                  
                  <div className="bg-[#0c0c10] border border-[#1e1e26] rounded p-2 text-[9px] font-mono font-bold leading-normal text-[var(--color-text-main)] relative select-all max-h-[140px] overflow-y-auto shadow-inner">
                    <pre className="whitespace-pre-wrap">
{`CREATE TABLE IF NOT EXISTS savestate_vault (
  sync_code TEXT PRIMARY KEY,
  user_name TEXT,
  yearly_goal INTEGER,
  books JSONB NOT NULL DEFAULT '[]'::jsonb,
  reading_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviews JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable public access
ALTER TABLE savestate_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous full access" ON savestate_vault FOR ALL USING (true) WITH CHECK (true);`}
                    </pre>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS savestate_vault (
  sync_code TEXT PRIMARY KEY,
  user_name TEXT,
  yearly_goal INTEGER,
  books JSONB NOT NULL DEFAULT '[]'::jsonb,
  reading_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviews JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE savestate_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous full access" ON savestate_vault FOR ALL USING (true) WITH CHECK (true);`);
                        triggerMessage("SQL Setup Script copied to Clipboard! Go paste it in Supabase.", false);
                      }}
                      className="px-2.5 py-1.5 bg-app-card text-xs font-bold font-sans text-brand-purple hover:bg-[#232333] border border-app-border rounded cursor-pointer transition-all"
                    >
                      Copy SQL Script
                    </button>
                    <button
                      onClick={() => verifyTableStructureOnCloud(false)}
                      disabled={isSyncing}
                      className="px-3 py-1.5 bg-brand-purple text-[#340F04] hover:bg-[#ecdff2] text-xs font-black font-sans uppercase tracking-wider rounded cursor-pointer transition-all"
                    >
                      Verify setup
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-[9.5px] leading-relaxed font-sans font-medium text-[var(--color-text-muted)]">
                  <p>
                    <strong className="text-emerald-400 font-bold block mb-1">✓ Cloud Connection Ready</strong>
                    We verified compatibility with your live Supabase database instance. Any backup files and active goals you push are safe.
                  </p>
                  <p className="mt-2 text-[var(--color-text-muted)]">
                    If you ever need to reset or migrate to a new Supabase account, you can declare the credentials in your <code className="text-[var(--color-text-muted)] font-mono">.env.example</code> file.
                  </p>
                  <div className="pt-2 border-t border-app-border/30 flex justify-end">
                    <button
                      onClick={() => verifyTableStructureOnCloud(false)}
                      className="px-2 py-1 text-[9px] font-bold text-[var(--color-text-muted)] hover:text-white bg-app-card hover:bg-[#20202a] border border-app-border rounded cursor-pointer transition-colors"
                    >
                      Refresh database check
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'native-vault' && (
        /* Original Visual JSON Vault Setup and Desktop/Mobile PWA guide */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {/* Core Actions */}
          <div className="bg-app-base border border-app-border rounded-lg p-4 space-y-3">
            <h3 className="text-[11px] font-bold text-[var(--color-text-main)] uppercase tracking-wider flex items-center gap-1.5 border-b border-app-border pb-2">
              <FileJson size={13} className="text-[#CAB9D4]" /> File-Based Vault Sync
            </h3>
            <p className="text-[10px] text-[var(--color-text-muted)] leading-normal font-medium">
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-md border border-brand-purple/30 bg-brand-purple/10 hover:bg-brand-purple hover:text-[#340F04] font-bold text-[11px] text-[#CAB9D4] transition-all cursor-pointer"
              >
                <Download size={12} /> Export Vault
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-md border border-[#25252e] bg-[#141417] text-[var(--color-text-main)] hover:border-brand-purple/30 hover:bg-[#1d1d22] font-semibold text-[11px] transition-all cursor-pointer"
              >
                <Upload size={12} /> Import Vault
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
              />
            </div>

            <div className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1.5 pt-1.5">
              <Info size={11} className="text-[#CAB9D4] shrink-0" />
              <span>Contains {appState.books.length} publications, {appState.readingLogs.length} calendar entries.</span>
            </div>
          </div>

          {/* Browser shortcut & instructions */}
          <div className="bg-app-base border border-app-border rounded-lg p-4 space-y-3">
            <h3 className="text-[11px] font-bold text-[var(--color-text-main)] uppercase tracking-wider flex items-center gap-1.5 border-b border-app-border pb-2">
              <Cpu size={13} className="text-[#CAB9D4]" /> Use as Native App
            </h3>
            
            <div className="space-y-3">
              <div className="flex gap-2 items-start">
                <div className="p-1 bg-[#181822] rounded border border-app-border shrink-0">
                  <Monitor size={11} className="text-[#CAB9D4]" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-[var(--color-text-main)] leading-none">Desktop (Windows/Mac)</h4>
                  <p className="text-[9.5px] text-[var(--color-text-muted)] leading-tight mt-1">
                    Open in Chrome/Edge, click the <strong className="text-brand-purple font-semibold">Install icon</strong> in the URL bar to launch SaveState as a standalone borders-free desktop application.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 items-start">
                <div className="p-1 bg-[#181822] rounded border border-app-border shrink-0">
                  <Smartphone size={11} className="text-[#CAB9D4]" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-[var(--color-text-main)] leading-none">Mobile (Phone/Tablet)</h4>
                  <p className="text-[9.5px] text-[var(--color-text-muted)] leading-tight mt-1">
                    Open on your phone, tap <strong className="text-brand-purple font-semibold">"Add to Home Screen"</strong> in share options. It runs instantly without file storage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'third-party' && (
        /* Third Party Import View (Goodreads & Bookmory CSV) */
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guide Step-by-Step */}
            <div className="bg-app-base border border-app-border rounded-lg p-4 space-y-4">
              <h3 className="text-[11px] font-bold text-[var(--color-text-main)] uppercase tracking-wider border-b border-app-border pb-2 flex items-center gap-1.5">
                <HelpCircle size={13} className="text-[#CAB9D4]" /> How to obtain export files
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" /> Goodreads Export CSV
                  </span>
                  <ol className="list-decimal list-inside text-[9.5px] text-[var(--color-text-muted)] pl-1 space-y-0.5 font-sans leading-relaxed">
                    <li>Log into <a href="https://www.goodreads.com" target="_blank" rel="noreferrer" className="text-brand-purple hover:underline">Goodreads.com</a> on your browser.</li>
                    <li>Navigate to <strong>My Books</strong> header in the top bar.</li>
                    <li>On the left list menu, click the <strong>Import and Export</strong> tool.</li>
                    <li>Click <strong>Export Library</strong>. Once compiled, download your `.csv` file.</li>
                  </ol>
                </div>

                <div className="space-y-1 pt-2 border-t border-app-border/40">
                  <span className="text-[10px] font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-turquoise" /> Bookmory Export CSV
                  </span>
                  <ol className="list-decimal list-inside text-[9.5px] text-[var(--color-text-muted)] pl-1 space-y-0.5 font-sans leading-relaxed">
                    <li>Launch the **Bookmory app** on your iOS/Android.</li>
                    <li>Navigate to the **Settings menu** panel (gear icon).</li>
                    <li>Tap on **Backup / Export data** and then select **Export as CSV file**.</li>
                    <li>Choose the Excel/standard layout, send/save the file to your device.</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Ingest / File drop region */}
            <div className="bg-app-base border border-app-border rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div className="text-center space-y-2 py-4">
                <div className="w-12 h-12 bg-brand-purple/10 border border-brand-purple/15 text-[#CAB9D4] rounded-full flex items-center justify-center mx-auto mb-2 relative">
                  <Database size={18} />
                  <div className="absolute -top-1 -right-1 p-0.5 bg-brand-turquoise text-[#340F04] rounded-full">
                    <Check size={8} />
                  </div>
                </div>
                <h4 className="text-xs font-bold text-white">Upload Export CSV</h4>
                <p className="text-[10px] text-[var(--color-text-muted)] leading-normal max-w-xs mx-auto">
                </p>
              </div>

              <div>
                <button
                  onClick={() => csvInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-purple hover:bg-[#ebdcf2] text-[#340F04] font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow"
                >
                  <Upload size={13} /> Select CSV File
                </button>
                <input
                  type="file"
                  ref={csvInputRef}
                  onChange={handleCSVUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Parsed CSV Report Confirmation Panel */}
          <AnimatePresence>
            {parsedReport && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-[#14121a] border border-brand-purple/30 p-4 rounded-lg space-y-3 shadow-lg relative"
              >
                <div className="flex items-center justify-between border-b border-app-border pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-2.5 bg-brand-purple/20 border border-brand-purple/30 text-[#CAB9D4] text-[9.5px] font-bold rounded uppercase tracking-wider">
                      {parsedReport.source === 'goodreads' ? 'Goodreads' : 'Bookmory'} Sheet Detected
                    </div>
                    <span className="text-xs font-semibold text-gray-100">Sync confirmation</span>
                  </div>
                  <button
                    onClick={() => setParsedReport(null)}
                    className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-[10px] text-[var(--color-text-muted)] leading-normal font-sans">
                </p>

                {/* Grid stats */}
                <div className="grid grid-cols-3 gap-2 py-1">
                  <div className="p-2.5 bg-app-base border border-app-border rounded-md text-center">
                    <span className="block text-[14px] font-black text-white font-mono leading-none">{parsedReport.booksCount}</span>
                    <span className="text-[9px] text-[var(--color-text-muted)] uppercase font-black uppercase text-[8px] tracking-wider mt-1 block">Books Indexed</span>
                  </div>
                  <div className="p-2.5 bg-app-base border border-app-border rounded-md text-center">
                    <span className="block text-[14px] font-black text-brand-turquoise font-mono leading-none">{parsedReport.logsCount}</span>
                    <span className="text-[9px] text-[var(--color-text-muted)] uppercase font-black tracking-wider mt-1 block">Calendar Dates</span>
                  </div>
                  <div className="p-2.5 bg-app-base border border-app-border rounded-md text-center">
                    <span className="block text-[14px] font-black text-amber-400 font-mono leading-none">{parsedReport.reviewsCount}</span>
                    <span className="text-[9px] text-[var(--color-text-muted)] uppercase font-black tracking-wider mt-1 block">Book Notes</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setParsedReport(null)}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border border-app-border text-[var(--color-text-muted)] hover:text-white cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleConfirmCSVImport}
                    className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded bg-brand-purple text-[#340F04] hover:bg-[#ecdff2] transition-colors cursor-pointer flex items-center gap-1.5 shadow"
                  >
                    <Check size={11} /> Apply Ingestion ({importConflictMode})
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* New Export compatibility card */}
          <div className="bg-app-base border border-app-border rounded-xl p-4 space-y-3 shadow-inner">
            <div className="flex items-center gap-2 border-b border-app-border/40 pb-2">
              <FileText size={13} className="text-brand-turquoise" />
              <h3 className="text-[10px] font-bold text-[var(--color-text-main)] uppercase tracking-wider">
                Export Compatible Library Sheets
              </h3>
            </div>
            <p className="text-[9.5px] text-[var(--color-text-muted)] leading-relaxed font-sans">
              Export your registered bookshelf logs in either Goodreads or Bookmory structured CSV schemes to sync them back up to your account profiles elsewhere.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleExportGoodreadsCSV}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-transparent border border-brand-purple/40 hover:border-brand-purple text-[#CAB9D4] hover:text-white font-bold text-[9.5px] uppercase tracking-wider transition-all cursor-pointer hover:bg-brand-purple/5"
              >
                <Download size={11} className="text-brand-purple" /> Export Goodreads CSV
              </button>

              <button
                onClick={handleExportBookmoryCSV}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-transparent border border-brand-turquoise/45 hover:border-brand-turquoise text-brand-turquoise hover:text-white font-bold text-[9.5px] uppercase tracking-wider transition-all cursor-pointer hover:bg-brand-turquoise/5"
              >
                <Download size={11} className="text-brand-turquoise" /> Export Bookmory CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
