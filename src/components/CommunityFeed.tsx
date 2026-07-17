import React, { useState } from 'react';
import { SocialUser, SocialActivity } from '../types';
import { Heart, MessageCircle, Share2, Star, UserPlus, Check, Clock } from 'lucide-react';
import { motion } from 'motion/react';

// Mock Data
export const MOCK_USERS: SocialUser[] = [
  {
    id: 'u1',
    displayName: 'Elena Vance',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    bio: 'Sci-fi nerd and avid tea drinker. Searching for the perfect space opera.',
    booksRead: 142,
    streakDays: 14,
    badges: ['Sci-Fi Fanatic', 'Night Owl'],
    isFollowing: true,
  },
  {
    id: 'u2',
    displayName: 'Marcus Aurelius',
    avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    bio: 'Stoic philosophy, history, and the occasional thriller.',
    booksRead: 45,
    streakDays: 3,
    badges: ['Classic Reader'],
    isFollowing: false,
  },
  {
    id: 'u3',
    displayName: 'Sarah Chen',
    avatarUrl: 'https://i.pravatar.cc/150?u=a04258114e29026702d',
    bio: 'Fantasy realms and magical realism. Book club organizer.',
    booksRead: 231,
    streakDays: 45,
    badges: ['Bookworm Elite', 'Consistent'],
    isFollowing: true,
  },
];

export const MOCK_ACTIVITIES: SocialActivity[] = [
  {
    id: 'a4',
    userId: 'u1',
    type: 'save_point',
    bookId: 'b4',
    bookTitle: 'Severance',
    bookAuthor: 'Apple TV+',
    bookCoverUrl: 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?auto=format&fit=crop&q=80&w=200',
    vibeEmoji: '🤯',
    savePointNotes: 'The waffle party scene was absolutely unhinged. I cannot believe what just happened.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },

  {
    id: 'a1',
    userId: 'u1',
    type: 'review',
    bookId: 'b1',
    bookTitle: 'Dune',
    bookAuthor: 'Frank Herbert',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/10521270-L.jpg',
    rating: 5,
    reviewText: "Absolutely incredible world-building. The political intrigue and ecological themes are still so relevant today. A masterpiece.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'a2',
    userId: 'u3',
    type: 'completed',
    bookId: 'b2',
    bookTitle: 'The Name of the Wind',
    bookAuthor: 'Patrick Rothfuss',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/12318465-L.jpg',
    rating: 4,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'a3',
    userId: 'u2',
    type: 'active',
    bookId: 'b3',
    bookTitle: 'Meditations',
    bookAuthor: 'Marcus Aurelius',
    bookCoverUrl: 'https://covers.openlibrary.org/b/id/12975878-L.jpg',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  }
];

interface CommunityFeedProps {
  onViewProfile: (userId: string) => void;
}

export function CommunityFeed({ onViewProfile }: CommunityFeedProps) {
  const [activities] = useState<SocialActivity[]>(MOCK_ACTIVITIES);
  const [users] = useState<SocialUser[]>(MOCK_USERS);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const toggleLike = (activityId: string) => {
    setLiked(prev => ({ ...prev, [activityId]: !prev[activityId] }));
  };

  const getTimeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-app-border pb-4 mb-4">
        <h2 className="text-xl font-bold text-[var(--color-text-main)] font-display uppercase tracking-widest">
          Reviews
        </h2>
      </div>

      {activities.map((activity, idx) => {
        const user = users.find(u => u.id === activity.userId);
        if (!user) return null;

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-app-card border border-app-border rounded-xl p-5 shadow-app-glow"
          >
            <div className="flex items-center justify-between mb-4">
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => onViewProfile(user.id)}
              >
                <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full border border-brand-purple/50 group-hover:border-brand-purple transition-colors" />
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-main)] group-hover:text-brand-purple transition-colors">{user.displayName}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold">
                    <Clock size={10} /> {getTimeAgo(activity.timestamp)}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[var(--color-text-muted)] px-2 py-1 bg-app-base rounded border border-app-border uppercase">
                {activity.type === 'save_point' ? 'Saved Progress' : activity.type === 'review' ? 'Posted Review' : activity.type === 'completed' ? 'Finished Item' : 'Started Reading'}
              </span>
            </div>

            <div className="flex gap-4 bg-app-base border border-app-border rounded-lg p-3">
              <div className="w-16 h-24 shrink-0 rounded overflow-hidden border border-app-border bg-[#111]">
                <img src={activity.bookCoverUrl} alt={activity.bookTitle} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="font-bold text-sm text-[var(--color-text-main)]">{activity.bookTitle}</h3>
                <p className="text-[10px] text-[var(--color-text-muted)]">{activity.bookAuthor}</p>
                
                {(activity.rating || activity.rating === 0) && (
                  <div className="flex gap-0.5 mt-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= (activity.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'} />
                    ))}
                  </div>
                )}
                
                {activity.reviewText && (
                  <p className="text-xs text-[var(--color-text-main)] mt-3 italic border-l-2 border-brand-purple/30 pl-2">
                    "{activity.reviewText}"
                  </p>
                )}
                {activity.type === 'save_point' && activity.savePointNotes && (
                  <div className="mt-3 relative group/spoiler cursor-pointer">
                    <div className="absolute -left-2 -top-2 z-10 bg-black/80 rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-md border border-app-border" title="Current Vibe">
                      {activity.vibeEmoji || '🤔'}
                    </div>
                    <div className="bg-[#111] border border-app-border rounded p-3 text-xs italic text-[var(--color-text-main)] relative overflow-hidden transition-all duration-300">
                      <div className="absolute inset-0 backdrop-blur-md bg-black/60 z-10 flex flex-col items-center justify-center group-hover/spoiler:opacity-0 transition-opacity duration-300">
                        <span className="text-[10px] uppercase font-bold text-brand-purple tracking-widest bg-black/80 px-2 py-1 rounded">Spoiler - Hover to Reveal</span>
                      </div>
                      "{activity.savePointNotes}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-app-border/50">
              <button 
                onClick={() => toggleLike(activity.id)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${liked[activity.id] ? 'text-rose-500' : 'text-[var(--color-text-muted)] hover:text-white'}`}
              >
                <Heart size={14} className={liked[activity.id] ? 'fill-rose-500' : ''} /> {liked[activity.id] ? '13' : '12'}
              </button>
              <button className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-white transition-colors cursor-pointer">
                <MessageCircle size={14} /> 4
              </button>
              <button className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-white transition-colors cursor-pointer ml-auto">
                <Share2 size={14} /> Share
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
