import { supabase } from './supabaseClient';
import { AppState, Book, ReadingLog, BookReview, SavePoint, MediaItem, MediaLog, MediaReview, AppPreferences } from '../types';

export const pushBookToSupabase = async (userId: string, book: Book) => {
  // We insert into media_items with type='book'
  const payload = {
    id: book.id,
    user_id: userId,
    type: 'book',
    title: book.title,
    creator: book.author,
    cover_url: book.coverUrl,
    release_year: book.publishYear,
    pages: book.pages,
    description: book.description,
    genre: book.genre,
    current_progress: book.currentProgress,
    total_length: book.totalLength
  };
  await supabase.from('media_items').upsert(payload);
};

export const pushLogToSupabase = async (userId: string, log: ReadingLog) => {
  // If we assume reading logs go into save_points
  const payload = {
    id: log.id,
    user_id: userId,
    media_id: log.bookId,
    milestone: log.status,
    raw_brain_drop: JSON.stringify({ startDate: log.startDate, endDate: log.endDate }),
    created_at: new Date().toISOString()
  };
  await supabase.from('save_points').upsert(payload);
};

export const pushGoalToSupabase = async (userId: string, goal: number) => {
  await supabase.from('user_profiles').upsert({ id: userId, yearly_goal: goal });
};
