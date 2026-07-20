// Central point-value calculator for the app's points/currency system.
// Every shelf (books, podcasts, movies, tv) pulls from this single function
// so scoring stays consistent. Implements the "Dynamic Completion Formulas"
// from the XP & Points Economy spec:
//   Books:          50 + (Total Pages / 2)
//   Feature Films:  75 XP flat
//   TV Seasons:     20 XP * Episode Count
//   Audio/Podcasts: 15 XP * Total Hours
//
// NOTE: this file only covers per-item completion XP (what a shelf card
// shows). The daily-cap action XP (logins, streaks, save points, quotes,
// group races, diminishing-returns timer scaling, etc.) from the full
// economy spec is a separate server-side ledger/cap system - not
// implemented here yet since it needs its own Supabase table + triggers.

import { Book, MediaItem } from '../types';

const PARTIAL_CREDIT_RATIO = 0.25; // in-progress items earn a fraction of full value

function progressRatio(item: Book | MediaItem): number {
  const current = Number(item.currentProgress) || 0;
  const total = Number(item.totalLength) || 0;
  if (total > 0 && current > 0) return Math.min(1, current / total);
  return 0;
}

export function getBookPoints(book: Book, status: 'backlog' | 'active' | 'completed' | 'dnf'): number {
  const pages = book.pages || 250; // fallback estimate when pages are unknown
  const fullValue = 50 + pages / 2;

  if (status === 'completed') return Math.round(fullValue);
  if (status === 'dnf') return Math.round(fullValue * 0.1);
  if (status === 'active') {
    const ratio = progressRatio(book) || PARTIAL_CREDIT_RATIO;
    return Math.round(fullValue * ratio);
  }
  return 0;
}

export function getMediaPoints(item: MediaItem, status: 'backlog' | 'active' | 'completed' | 'dnf'): number {
  let fullValue: number;

  if (item.type === 'movie') {
    fullValue = 75; // flat
  } else if (item.type === 'tv') {
    const episodeCount = item.episodes && item.episodes.length > 0 ? item.episodes.length : 10; // assume a season if unknown
    fullValue = 20 * episodeCount;
  } else {
    // podcast / audio - 15 XP per hour, estimated from totalLength (hours) if the user set one
    const hours = Number(item.totalLength) || 3; // fallback estimate
    fullValue = 15 * hours;
  }

  if (status === 'completed') return Math.round(fullValue);
  if (status === 'dnf') return Math.round(fullValue * 0.1);
  if (status === 'active') {
    const ratio = progressRatio(item) || PARTIAL_CREDIT_RATIO;
    return Math.round(fullValue * ratio);
  }
  return 0;
}
