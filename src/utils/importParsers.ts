import { Book, ReadingLog, BookReview, AppState } from '../types';

/**
 * Parses CSV lines correctly handling quotes, commas, and escapes
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentValue = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quotes
        currentValue += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentValue.trim());
      currentValue = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      row.push(currentValue.trim());
      if (row.length > 0 && row.some(val => val !== '')) {
        lines.push(row);
      }
      row = [];
      currentValue = '';
      if (char === '\r' && nextChar === '\n') {
        i++; // skip '\n'
      }
    } else {
      currentValue += char;
    }
  }

  if (currentValue || row.length > 0) {
    row.push(currentValue.trim());
    if (row.some(val => val !== '')) {
      lines.push(row);
    }
  }

  return lines;
}

/**
 * Standardizes date formatting to YYYY-MM-DD
 */
function standardizeDate(rawDateStr: string | undefined): string | undefined {
  if (!rawDateStr || rawDateStr.trim() === '') return undefined;

  // Handles Goodreads / common formats like "2024/11/03", "11/03/24", "Nov 03, 2024", "2024-11-03", "2024.11.03"
  let cleaned = rawDateStr.trim().replace(/\s+/g, ' ');
  
  // Replace dots with slashes so Date.parse parses it universally and correctly
  cleaned = cleaned.replace(/\./g, '/');

  const parsedTimestamp = Date.parse(cleaned);

  if (!isNaN(parsedTimestamp)) {
    const date = new Date(parsedTimestamp);
    // Use local coordinates to avoid -1 day timezone shifts
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Fallback pattern matching for DD/MM/YYYY or MM/DD/YYYY if standard parse returns NaN
  const parts = cleaned.split(/[\/\-\.]/);
  if (parts.length === 3) {
    // Check if first part looks like a year
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    // Check if third part looks like a year
    if (parts[2].length === 4) {
      // Guess MM/DD/YYYY to be safe for US-centric Goodreads formats
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
  }

  return undefined;
}

interface ImportReport {
  booksImported: number;
  logsImported: number;
  reviewsImported: number;
  unmappedAuthors: number;
}

export interface ParseResult {
  state: AppState;
  report: ImportReport;
  source: 'goodreads' | 'bookmory' | 'unknown';
}

/**
 * Try to parse Goodreads CSV exports
 */
export function parseGoodreadsCSV(csvText: string): ParseResult | null {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return null;

  // Strip BOM, quotes, and normalize spaces
  const headers = rows[0].map(h => h.replace(/^\uFEFF/g, '').trim().toLowerCase().replace(/['"]+/g, ''));
  
  const findHeaderIndex = (keywords: string[]): number => {
    for (const kw of keywords) {
      const idx = headers.indexOf(kw.toLowerCase());
      if (idx !== -1) return idx;
    }
    for (const kw of keywords) {
      const idx = headers.findIndex(h => h.includes(kw.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const titleIdx = findHeaderIndex(['title', '제목']);
  const authorIdx = findHeaderIndex(['author', '작가', '저자']);
  
  // Verify this looks like a valid book table schema
  if (titleIdx === -1 || authorIdx === -1) {
    return null;
  }

  const avgRatingIdx = findHeaderIndex(['average rating', '평균']);
  const myRatingIdx = findHeaderIndex(['my rating', '내 평점', 'rating', '별점', '평점']);
  const pageCountIdx = findHeaderIndex(['number of pages', 'pages', '페이지', 'page']);
  const pubYearIdx = findHeaderIndex(['year published', 'original publication year', 'publication year', '출판']);
  const dateReadIdx = findHeaderIndex(['date read', 'read date', '완독', '읽은 날']);
  const dateAddedIdx = findHeaderIndex(['date added', 'added date', '등록일', '추가된']);
  const dateStartedIdx = findHeaderIndex(['date started', 'started date', '시작일', '읽기 시작']);
  const readCountIdx = findHeaderIndex(['read count', '횟수']);
  const exclusiveShelfIdx = findHeaderIndex(['exclusive shelf', 'shelf', '책장', '구분', '상태']);
  const allShelvesIdx = findHeaderIndex(['bookshelves', '책장 목록']);
  const myReviewIdx = findHeaderIndex(['my review', 'review', '리뷰', '서평', 'note', 'memo', '메모']);
  
  const isbn13Idx = findHeaderIndex(['isbn13']);
  const isbnIdx = headers.findIndex((h, idx) => h.includes('isbn') && idx !== isbn13Idx);

  const books: Book[] = [];
  const readingLogs: ReadingLog[] = [];
  const reviews: BookReview[] = [];
  let unmappedAuthors = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length <= Math.max(titleIdx, authorIdx)) continue;

    const title = row[titleIdx];
    const author = row[authorIdx] || 'Unknown Author';
    if (!title) continue;

    const id = `gr_${btoa(unescape(encodeURIComponent(title + '_' + author))).replace(/=/g, '').slice(0, 16)}`;

    // Pages
    let pages: number | undefined;
    if (pageCountIdx !== -1 && row[pageCountIdx]) {
      const parsedPages = parseInt(row[pageCountIdx].replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedPages)) pages = parsedPages;
    }

    // Publish Year
    let publishYear: string | undefined;
    if (pubYearIdx !== -1 && row[pubYearIdx]) {
      publishYear = row[pubYearIdx].replace(/[^0-9]/g, '').trim();
    }

    // Isbns
    const rawIsbn = isbnIdx !== -1 && row[isbnIdx] ? row[isbnIdx].replace(/[^0-9X]/gi, '').trim() : '';
    const rawIsbn13 = isbn13Idx !== -1 && row[isbn13Idx] ? row[isbn13Idx].replace(/[^0-9]/g, '').trim() : '';
    const isbn = rawIsbn13 || rawIsbn;
    let coverUrl = '';

    if (isbn && isbn.length >= 9) {
      coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    } else {
      const coverHash = Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000;
      coverUrl = `https://images.unsplash.com/photo-${coverHash % 2 === 0 ? '1544947950-fa07a98d237f' : '1543002588-bfa74002ed7e'}?q=80&w=300&auto=format&fit=crop`;
    }

    // Reading Status (exclusive shelf, read date, and DNF detection)
    const shelf = exclusiveShelfIdx !== -1 ? (row[exclusiveShelfIdx] || '').toLowerCase() : '';
    const allShelvesRaw = allShelvesIdx !== -1 ? (row[allShelvesIdx] || '').toLowerCase() : '';
    const dateReadRaw = dateReadIdx !== -1 ? row[dateReadIdx] : undefined;
    const dateRead = standardizeDate(dateReadRaw);
    const dateAddedRaw = dateAddedIdx !== -1 ? row[dateAddedIdx] : undefined;
    const dateAdded = standardizeDate(dateAddedRaw);
    const dateStartedRaw = dateStartedIdx !== -1 ? row[dateStartedIdx] : undefined;
    const dateStarted = standardizeDate(dateStartedRaw);

    // Goodreads has no official "did not finish" shelf - people track this with
    // a custom shelf of their own naming. We check both the Exclusive Shelf and
    // the full Bookshelves list for common names for it.
    const dnfKeywords = ['did-not-finish', 'did not finish', 'dnf', 'abandoned', 'gave up', 'gave-up'];
    const isDnf = dnfKeywords.some(kw => shelf.includes(kw) || allShelvesRaw.includes(kw));

    let status: 'backlog' | 'active' | 'completed' | 'dnf' = 'backlog';
    if (isDnf) {
      status = 'dnf';
    } else if (shelf === 'currently-reading' || shelf === 'active' || shelf.includes('읽는')) {
      status = 'active';
    } else if (dateRead) {
      // Only counts as "completed" if there's an actual finish date - Goodreads
      // sometimes exports "read" books with a blank Date Read (a known bug on
      // their end), and those shouldn't silently count as complete here.
      status = 'completed';
    } else {
      status = 'backlog';
    }

    const didNotFinish = status === 'dnf';
    // Workaround: Goodreads doesn't export a real "date started" field at all,
    // so we use "Date Added" as the closest available approximation.
    const bookStartDate = status === 'active' || status === 'completed' ? (dateStarted || dateAdded || undefined) : undefined;
    const bookEndDate = status === 'completed' ? dateRead : undefined;

    const book: Book = {
      id,
      title,
      author,
      pages,
      publishYear,
      coverUrl,
      startDate: bookStartDate,
      endDate: bookEndDate,
      didNotFinish,
    };
    books.push(book);

    // Add reading log too, so the calendar/shelves reflect this immediately
    // after import (before the first cloud refresh regenerates it from the
    // book's own saved fields).
    readingLogs.push({
      id: `log_gr_${i}_${Date.now()}`,
      bookId: id,
      endDate: bookEndDate || '',
      startDate: bookStartDate,
      status
    });

    // Handle user reviews and ratings
    const ratingStr = myRatingIdx !== -1 ? row[myRatingIdx] : '0';
    const rating = parseInt(ratingStr, 10);
    const notes = myReviewIdx !== -1 ? row[myReviewIdx]?.replace(/<[^>]*>/g, '') : ''; // strip HTML tags from Goodreads reviews

    if ((rating && rating > 0) || (notes && notes.trim().length > 0)) {
      reviews.push({
        bookId: id,
        rating: isNaN(rating) ? 0 : rating,
        notes: notes || '',
        updatedAt: bookEndDate || bookStartDate || new Date().toISOString().split('T')[0],
        isPublic: false
      });
    }
  }

  return {
    state: { books, readingLogs, reviews },
    report: {
      booksImported: books.length,
      logsImported: readingLogs.length,
      reviewsImported: reviews.length,
      unmappedAuthors
    },
    source: 'goodreads'
  };
}

/**
 * Try to parse Bookmory CSV exports
 */
export function parseBookmoryCSV(csvText: string): ParseResult | null {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return null;

  // Strip BOM, quotes, and normalize spaces
  const headers = rows[0].map(h => h.replace(/^\uFEFF/g, '').trim().toLowerCase().replace(/['"]+/g, ''));
  
  const findHeaderIndex = (keywords: string[]): number => {
    for (const kw of keywords) {
      const idx = headers.indexOf(kw.toLowerCase());
      if (idx !== -1) return idx;
    }
    for (const kw of keywords) {
      const idx = headers.findIndex(h => h.includes(kw.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const titleIdx = findHeaderIndex(['title', '제목']);
  const authorIdx = findHeaderIndex(['author', '작가', '저자']);
  
  // Basic validation that it contains title
  if (titleIdx === -1) return null;

  const statusIdx = findHeaderIndex(['status', '상태']);
  const rPeriodIdx = findHeaderIndex(['reading period', '독서 기간', 'period', '독서기간']);
  const ratingIdx = findHeaderIndex(['rating', '별점', '평점']);
  const memoIdx = findHeaderIndex(['note', 'memo', '메모', 'review', '한 줄 평', '한줄평']);
  const pageIdx = findHeaderIndex(['page', '페이지', 'number of pages']);
  const pubDateIdx = findHeaderIndex(['publish date', '출판일', 'publication date']);
  const publisherIdx = findHeaderIndex(['publisher', '출판사']);

  const books: Book[] = [];
  const readingLogs: ReadingLog[] = [];
  const reviews: BookReview[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length <= titleIdx) continue;

    const title = row[titleIdx];
    const author = authorIdx !== -1 && row[authorIdx] ? row[authorIdx] : 'Unknown Author';
    if (!title) continue;

    const id = `bm_${btoa(unescape(encodeURIComponent(title + '_' + author))).replace(/=/g, '').slice(0, 16)}`;

    // Pages
    let pages: number | undefined;
    if (pageIdx !== -1 && row[pageIdx]) {
      const parsedPages = parseInt(row[pageIdx].replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedPages)) pages = parsedPages;
    }

    // Publish Year
    let publishYear: string | undefined;
    if (pubDateIdx !== -1 && row[pubDateIdx]) {
      const rawPub = row[pubDateIdx].trim();
      const match = rawPub.match(/\b\d{4}\b/);
      if (match) publishYear = match[0];
    }

    // Random visually aligned book cover
    const coverHash = Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 1000;
    const coverUrl = `https://images.unsplash.com/photo-${coverHash % 2 === 0 ? '1544947950-fa07a98d237f' : '1543002588-bfa74002ed7e'}?q=80&w=300&auto=format&fit=crop`;

    const book: Book = {
      id,
      title,
      author,
      pages,
      publishYear,
      coverUrl
    };
    books.push(book);

    // Parse status
    const statusRaw = statusIdx !== -1 ? row[statusIdx].toLowerCase() : '';
    let status: 'backlog' | 'active' | 'completed' = 'completed'; // default completed
    if (statusRaw.includes('active') || statusRaw.includes('읽고 있는') || statusRaw.includes('중') || statusRaw.includes('읽고있는') || statusRaw.includes('온')) {
      status = 'active';
    } else if (statusRaw.includes('to read') || statusRaw.includes('backlog') || statusRaw.includes('읽고 싶은') || statusRaw.includes('희망') || statusRaw.includes('예정') || statusRaw.includes('읽고싶은')) {
      status = 'backlog';
    } else {
      status = 'completed';
    }

    // Parse reading period e.g. "2024.10.15 ~ 2024.11.02" or "2024-10-15"
    let startDateStr: string | undefined = undefined;
    let endDateStr = new Date().toISOString().split('T')[0];
    if (rPeriodIdx !== -1 && row[rPeriodIdx]) {
      const periodRaw = row[rPeriodIdx].trim();
      const delimiter = periodRaw.includes('~') ? '~' : (periodRaw.includes(' - ') ? ' - ' : null);
      if (delimiter) {
        const periodParts = periodRaw.split(delimiter);
        if (periodParts.length >= 2) {
          const rawStart = periodParts[0].trim();
          const rawEnd = periodParts[1].trim();
          const stdStart = standardizeDate(rawStart);
          const stdEnd = standardizeDate(rawEnd);
          if (stdStart) startDateStr = stdStart;
          if (stdEnd) endDateStr = stdEnd;
        } else if (periodParts.length === 1) {
          const stdEnd = standardizeDate(periodParts[0].trim());
          if (stdEnd) endDateStr = stdEnd;
        }
      } else {
        const stdEnd = standardizeDate(periodRaw);
        if (stdEnd) endDateStr = stdEnd;
      }
    }

    readingLogs.push({
      id: `log_bm_${i}_${Date.now()}`,
      bookId: id,
      endDate: endDateStr,
      startDate: startDateStr,
      status
    });

    // Parse rating and memory review notes
    let rating = 0;
    if (ratingIdx !== -1 && row[ratingIdx]) {
      // Handles formats like "★★★★★" or "5", "4.5"
      const rateVal = row[ratingIdx].trim();
      const starsMatch = (rateVal.match(/★/g) || []).length;
      if (starsMatch > 0) {
        rating = starsMatch;
      } else {
        const parsedRate = parseInt(rateVal, 10);
        if (!isNaN(parsedRate)) rating = parsedRate;
      }
    }

    const memo = memoIdx !== -1 ? row[memoIdx] : '';

    if (rating > 0 || (memo && memo.trim().length > 0)) {
      reviews.push({
        bookId: id,
        rating,
        notes: memo || '',
        updatedAt: endDateStr,
        isPublic: false
      });
    }
  }

  return {
    state: { books, readingLogs, reviews },
    report: {
      booksImported: books.length,
      logsImported: readingLogs.length,
      reviewsImported: reviews.length,
      unmappedAuthors: 0
    },
    source: 'bookmory'
  };
}

/**
 * Universal safe parser that auto-detects Goodreads vs Bookmory CSV
 */
export function autoDetectAndParseCSV(csvText: string): ParseResult | null {
  // Try Goodreads
  const gr = parseGoodreadsCSV(csvText);
  if (gr && gr.state.books.length > 0) return gr;

  // Try Bookmory
  const bm = parseBookmoryCSV(csvText);
  if (bm && bm.state.books.length > 0) return bm;

  return null;
}
