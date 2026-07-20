import { supabase } from './supabaseClient';
import { Quote } from '../types';

// All quotes live in one Supabase table called `quotes`. They're public by
// default (like a mini review) unless the user flips `isPublic` off for a
// specific one. There's no separate "personal quotes" system anymore -
// everything funnels through here so the app only has one quote concept.

const fromDbRow = (row: any): Quote => ({
  id: row.id,
  quote: row.quote,
  author: row.author || undefined,
  source: row.source || undefined,
  coverUrl: row.cover_url || undefined,
  isPublic: row.is_public !== false, // defaults to true if missing
  createdAt: row.created_at,
});

const toDbRow = (q: Quote, userId: string) => ({
  id: q.id,
  user_id: userId,
  quote: q.quote,
  author: q.author || null,
  source: q.source || null,
  cover_url: q.coverUrl || null,
  is_public: q.isPublic,
  created_at: q.createdAt,
});

export async function fetchMyQuotes(userId: string): Promise<Quote[]> {
  const { data, error } = await supabase.from('quotes').select('*').eq('user_id', userId);
  if (error) {
    console.error('Failed to load quotes:', error.message);
    return [];
  }
  return (data || []).map(fromDbRow);
}

export async function upsertQuote(q: Quote, userId: string): Promise<boolean> {
  const { error } = await supabase.from('quotes').upsert(toDbRow(q, userId));
  if (error) {
    console.error('Failed to save quote:', error.message, error.details, error.hint);
    return false;
  }
  return true;
}

export async function deleteQuote(id: string): Promise<boolean> {
  const { error } = await supabase.from('quotes').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete quote:', error.message);
    return false;
  }
  return true;
}
