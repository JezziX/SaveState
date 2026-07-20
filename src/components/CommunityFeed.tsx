import React, { useState, useEffect } from 'react';
import { Star, Clock, Quote as QuoteIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../utils/supabaseClient';

interface FeedItem {
  id: string;
  type: 'review' | 'quote';
  userId: string;
  timestamp: string;
  // review fields
  mediaTitle?: string;
  mediaCoverUrl?: string;
  rating?: number;
  reviewText?: string;
  // quote fields
  quoteText?: string;
  quoteAuthor?: string;
  quoteSource?: string;
  quoteCharacter?: string;
}

interface FeedProfile {
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
}

interface CommunityFeedProps {
  onViewProfile: (userId: string) => void;
}

export function CommunityFeed({ onViewProfile }: CommunityFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [profiles, setProfiles] = useState<Record<string, FeedProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    try {
      // RLS already only returns rows that are public (or our own), so this
      // is naturally scoped to real, publicly-shared content across everyone.
      const [reviewsRes, quotesRes] = await Promise.all([
        supabase.from('public_reviews').select('*').order('updated_at', { ascending: false }).limit(30),
        supabase.from('quotes').select('*').order('created_at', { ascending: false }).limit(30),
      ]);

      const reviewItems: FeedItem[] = (reviewsRes.data || [])
        .filter((r: any) => r.is_public !== false)
        .map((r: any) => ({
          id: `review_${r.id}`,
          type: 'review' as const,
          userId: r.user_id,
          timestamp: r.updated_at,
          mediaTitle: r.media_title,
          mediaCoverUrl: r.media_cover_url,
          rating: r.rating,
          reviewText: r.review_text,
        }));

      const quoteItems: FeedItem[] = (quotesRes.data || [])
        .filter((q: any) => q.is_public !== false)
        .map((q: any) => ({
          id: `quote_${q.id}`,
          type: 'quote' as const,
          userId: q.user_id,
          timestamp: q.created_at,
          quoteText: q.quote,
          quoteAuthor: q.author,
          quoteSource: q.source,
          quoteCharacter: q.character,
        }));

      const merged = [...reviewItems, ...quoteItems]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 25);

      setItems(merged);

      const userIds = [...new Set(merged.map(i => i.userId))];
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase.from('profiles').select('id, display_name, handle, avatar_url').in('id', userIds);
        const map: Record<string, FeedProfile> = {};
        (profileRows || []).forEach((p: any) => { map[p.id] = p; });
        setProfiles(map);
      }
    } catch (e) {
      console.error('Failed to load community feed:', e);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return <div className="text-center p-8 text-white animate-pulse">Loading feed...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-app-border pb-4 mb-4">
        <h2 className="text-xl font-bold text-[var(--color-text-main)] font-display uppercase tracking-widest">
          Community
        </h2>
      </div>

      {items.length === 0 && (
        <div className="bg-app-card border border-app-border rounded-xl p-8 text-center text-[var(--color-text-muted)] text-sm shadow-app-glow">
          Nothing here yet - once people start posting public reviews or quotes, they'll show up here.
        </div>
      )}

      {items.map((item, idx) => {
        const profile = profiles[item.userId];
        const displayName = profile?.display_name || 'Anonymous Reader';
        const handle = profile?.handle || 'reader';
        const avatarUrl = profile?.avatar_url || '/icon-512-any.png';

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx, 8) * 0.05 }}
            className="bg-app-card border border-app-border rounded-xl p-5 shadow-app-glow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => onViewProfile(item.userId)}
              >
                <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full border border-brand-purple/50 group-hover:border-brand-purple transition-colors object-cover bg-app-base" />
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-main)] group-hover:text-brand-purple transition-colors">{displayName}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold">
                    <Clock size={10} /> {getTimeAgo(item.timestamp)}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] px-2 py-1 bg-app-base rounded border border-app-border uppercase">
                {item.type === 'review' ? 'Posted Review' : 'Shared Quote'}
              </span>
            </div>

            {item.type === 'review' ? (
              <div className="flex gap-4 bg-app-base border border-app-border rounded-lg p-3">
                <div className="w-16 h-24 shrink-0 rounded overflow-hidden border border-app-border bg-[#111]">
                  {item.mediaCoverUrl ? (
                    <img src={item.mediaCoverUrl} alt={item.mediaTitle} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-bold text-sm text-[var(--color-text-main)]">{item.mediaTitle}</h3>
                  {!!item.rating && (
                    <div className="flex gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={12} className={s <= (item.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'} />
                      ))}
                    </div>
                  )}
                  {item.reviewText && (
                    <p className="text-xs text-[var(--color-text-main)] mt-3 italic border-l-2 border-brand-purple/30 pl-2">
                      "{item.reviewText}"
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-app-base border border-app-border rounded-lg p-4 relative overflow-hidden">
                <QuoteIcon size={32} className="absolute -top-1 -left-1 text-brand-teal/5 rotate-180 pointer-events-none" />
                <p className="text-sm text-[var(--color-text-main)] italic leading-relaxed relative z-10 font-serif">
                  "{item.quoteText}"
                </p>
                <div className="flex items-center justify-end gap-2 text-[10px] text-[var(--color-text-muted)] font-mono mt-3">
                  {item.quoteCharacter && <span className="font-bold text-[var(--color-text-main)]">{item.quoteCharacter}</span>}
                  {item.quoteAuthor && <span className="font-bold text-[var(--color-text-main)]">— {item.quoteAuthor}</span>}
                  {item.quoteSource && <span>in <span className="italic">{item.quoteSource}</span></span>}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
