import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, BookOpen, Flame, Medal, ArrowLeft, Star, MessageSquare, Quote, Trophy, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../utils/supabaseClient';
import { UserProfile as UserProfileType } from '../types';
import { MOCK_USERS } from './CommunityFeed';

interface UserProfileProps {
  userId: string;
  onBack: () => void;
}

export function UserProfile({ userId, onBack }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Fallback to mock data if cloud fails
  const mockUser = MOCK_USERS.find(u => u.id === userId);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileData) {
        setProfile(profileData);
      }

      const { data: reviewData } = await supabase
        .from('public_reviews')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (reviewData) {
        setReviews(reviewData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-white animate-pulse">Loading Profile...</div>;
  }

  // Use real data if available, fallback to mock data
  const displayName = profile?.display_name || mockUser?.displayName || 'Anonymous Reader';
  const avatarUrl = profile?.avatar_url || mockUser?.avatarUrl || '/icon-512.png';
  const bio = profile?.bio || mockUser?.bio || 'No bio provided.';
  const unlockedBadges = profile?.unlocked_badges || mockUser?.badges || [];
  const activeSkin = profile?.active_skin || 'jx';
  
  // Calculate Level and Points
  const booksReadCount = mockUser?.booksRead || (profile as any)?.books_read || 0;
  const streakCount = mockUser?.streakDays || 0;
  const totalPoints = (booksReadCount * 150) + (streakCount * 10) + (unlockedBadges.length * 50);

  const getLevelInfo = (books: number) => {
    if (books > 200) return { title: 'Arch-Mage Reader', level: 5, color: 'text-brand-purple' };
    if (books > 100) return { title: 'Master Scholar', level: 4, color: 'text-brand-turquoise' };
    if (books > 50) return { title: 'Bibliophile', level: 3, color: 'text-brand-teal' };
    if (books > 10) return { title: 'Apprentice Reader', level: 2, color: 'text-brand-yellow' };
    return { title: 'Novice Page-Turner', level: 1, color: 'text-[var(--color-text-main)]' };
  };

  const levelInfo = getLevelInfo(booksReadCount);

  // Try to parse top 4 from profile, or use empty
  let topFavorites = [];
  try {
    topFavorites = (profile as any)?.top_4_favorites || [];
  } catch(e) {}

  // Mock Quotes for visual representation if real quotes not available
  const mockQuotes = [
    { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou", source: "I Know Why the Caged Bird Sings" },
    { text: "We read to know we're not alone.", author: "William Nicholson", source: "Shadowlands" },
  ];

  return (
    <div data-theme={activeSkin} className="max-w-2xl mx-auto space-y-6 p-4 rounded-xl min-h-[60vh] bg-app-base text-[var(--color-text-main)] transition-colors duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} /> Back to Community
      </button>

      {/* Main Profile Header */}
      <div className="bg-app-card border border-app-border rounded-xl p-6 shadow-app-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-purple/10 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <div className="relative">
            <img 
              src={avatarUrl || 'https://via.placeholder.com/150'} 
              alt={displayName} 
              className="w-24 h-24 rounded-full border-4 border-app-base shadow-xl object-cover bg-app-base"
            />
            <div className="absolute -bottom-2 -right-2 bg-app-card border border-app-border rounded-full p-1.5 shadow-lg flex items-center justify-center">
              <Trophy size={14} className={levelInfo.color} />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-black text-[var(--color-text-main)] font-display">{displayName}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${levelInfo.color}`}>
                Lvl {levelInfo.level} · {levelInfo.title}
              </span>
            </div>
            
            <p className="text-xs text-[var(--color-text-muted)] mt-3 max-w-sm mx-auto sm:mx-0 leading-relaxed">{bio}</p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
              {unlockedBadges.map((badge: string) => (
                <span key={badge} className="px-2 py-1 bg-brand-purple/10 border border-brand-purple/30 text-brand-purple text-[9px] font-bold uppercase tracking-wider rounded-md">
                  {badge}
                </span>
              ))}
              {unlockedBadges.length === 0 && (
                <span className="text-[10px] text-[var(--color-text-muted)] italic">No badges yet</span>
              )}
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col items-center sm:items-end gap-3">
            <button 
              onClick={() => setIsFollowing(!isFollowing)}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isFollowing 
                  ? 'bg-app-base border border-app-border text-[var(--color-text-main)] hover:border-rose-500 hover:text-rose-500'
                  : 'bg-brand-purple text-[#340F04] border border-brand-purple hover:bg-brand-teal'
              }`}
            >
              {isFollowing ? (
                <><UserCheck size={14} /> Following</>
              ) : (
                <><UserPlus size={14} /> Follow</>
              )}
            </button>
            <div className="text-center sm:text-right mt-2">
              <div className="text-xl font-black text-[var(--color-text-main)] font-mono">{totalPoints.toLocaleString()}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-brand-turquoise">Total XP</div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-app-border relative z-10">
          <div className="flex flex-col items-center justify-center p-3 bg-black/20 rounded-lg border border-app-border">
            <BookOpen size={16} className="text-brand-purple mb-1.5" />
            <span className="text-lg font-black text-[var(--color-text-main)] font-mono">{booksReadCount}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Books Read</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-black/20 rounded-lg border border-app-border">
            <Flame size={16} className="text-orange-500 mb-1.5" />
            <span className="text-lg font-black text-[var(--color-text-main)] font-mono">{streakCount}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Day Streak</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-black/20 rounded-lg border border-app-border">
            <MessageSquare size={16} className="text-brand-teal mb-1.5" />
            <span className="text-lg font-black text-[var(--color-text-main)] font-mono">{reviews.length}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Reviews</span>
          </div>
        </div>
      </div>

      {/* Top 4 Favorites Row */}
      <div className="bg-app-card border border-app-border rounded-xl p-5 shadow-app-glow">
        <h3 className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-widest mb-4 flex items-center gap-2">
          <Star size={14} className="text-brand-turquoise" /> Top 4 Favorites
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x custom-scrollbar">
          {[0, 1, 2, 3].map((idx) => {
            const fav = topFavorites[idx];
            return (
              <div key={idx} className="shrink-0 w-24 h-36 bg-black/40 border border-app-border rounded-lg flex flex-col items-center justify-center snap-center relative overflow-hidden group shadow-md">
                {fav ? (
                  <>
                    <img src={fav.cover_url} alt={fav.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  </>
                ) : (
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest opacity-30">
                    Empty
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Public Reviews Feed */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-widest flex items-center gap-2 pl-1">
            <MessageSquare size={14} className="text-brand-purple" /> Public Reviews
          </h3>
          
          {reviews.length === 0 ? (
            <div className="bg-app-card border border-app-border rounded-xl p-6 text-center text-[var(--color-text-muted)] text-xs shadow-app-glow">
              No public reviews yet.
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-app-card border border-app-border rounded-xl p-4 shadow-app-glow hover:border-brand-purple/30 transition-colors">
                  <div className="flex items-start gap-3">
                    {review.media_cover_url ? (
                      <img src={review.media_cover_url} alt={review.media_title} className="w-10 h-14 object-cover rounded shadow-md border border-app-border shrink-0" />
                    ) : (
                      <div className="w-10 h-14 bg-black/40 border border-app-border rounded flex items-center justify-center shrink-0">
                        <BookOpen size={14} className="text-[var(--color-text-muted)]" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-[var(--color-text-main)] truncate">{review.media_title}</h4>
                        <div className="flex items-center gap-0.5 shrink-0 bg-black/20 px-1 py-0.5 rounded border border-app-border">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={8} 
                              className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} 
                            />
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2 font-mono">
                        {new Date(review.updated_at).toLocaleDateString()}
                      </p>
                      
                      <div className="text-[11px] text-[var(--color-text-main)]/90 leading-relaxed bg-black/20 p-2 rounded-lg border border-app-border/50 whitespace-pre-wrap">
                        {review.review_text || <span className="italic opacity-50">No text provided.</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorite Quotes */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-widest flex items-center gap-2 pl-1">
            <Quote size={14} className="text-brand-teal" /> Favorite Quotes
          </h3>
          
          <div className="space-y-4">
            {mockQuotes.map((quote, idx) => (
              <div key={idx} className="bg-app-card border border-app-border rounded-xl p-5 shadow-app-glow hover:border-brand-teal/30 transition-colors relative overflow-hidden group">
                <Quote size={40} className="absolute -top-2 -left-2 text-brand-teal/5 rotate-180 group-hover:text-brand-teal/10 transition-colors pointer-events-none" />
                <p className="text-xs text-[var(--color-text-main)] italic leading-relaxed mb-3 relative z-10 font-serif">
                  "{quote.text}"
                </p>
                <div className="flex items-center justify-end gap-2 text-[10px] text-[var(--color-text-muted)] font-mono">
                  <span className="font-bold text-[var(--color-text-main)]">— {quote.author}</span>
                  <span>in <span className="italic">{quote.source}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

