import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, BookOpen, Medal, ArrowLeft, Star, MessageSquare, Quote as QuoteIcon, Trophy } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { UserProfile as UserProfileType, Quote } from '../types';
import { getFollowCounts, fetchFollowerProfiles, fetchFollowingProfiles, isFollowing as checkIsFollowing, followUser, unfollowUser, PublicProfile } from '../utils/followsApi';

interface UserProfileProps {
  userId: string;
  onBack: () => void;
}

export function UserProfile({ userId, onBack }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [followersList, setFollowersList] = useState<PublicProfile[]>([]);
  const [followingList, setFollowingList] = useState<PublicProfile[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const isOwnProfile = viewerId === userId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const myId = session?.user?.id || null;
      setViewerId(myId);

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (profileData) setProfile(profileData);

      // RLS already guarantees we only ever see public rows (or our own),
      // so no extra client-side filtering is needed here for privacy.
      const { data: reviewData } = await supabase
        .from('public_reviews')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (reviewData) setReviews(reviewData);

      const { data: quoteRows } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6);
      if (quoteRows) {
        setQuotes(quoteRows.map((r: any) => ({
          id: r.id,
          quote: r.quote,
          author: r.author || undefined,
          source: r.source || undefined,
          character: r.character || undefined,
          coverUrl: r.cover_url || undefined,
          isPublic: r.is_public !== false,
          createdAt: r.created_at,
        })));
      }

      const counts = await getFollowCounts(userId);
      setFollowerCount(counts.followers);
      setFollowingCount(counts.following);

      if (myId && myId !== userId) {
        setIsFollowingUser(await checkIsFollowing(myId, userId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!viewerId || isOwnProfile) return;
    if (isFollowingUser) {
      const ok = await unfollowUser(viewerId, userId);
      if (ok) {
        setIsFollowingUser(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      }
    } else {
      const ok = await followUser(viewerId, userId);
      if (ok) {
        setIsFollowingUser(true);
        setFollowerCount(prev => prev + 1);
      }
    }
  };

  const openFollowersModal = async (tab: 'followers' | 'following') => {
    setActiveTab(tab);
    setShowFollowersModal(true);
    setModalLoading(true);
    const [followers, following] = await Promise.all([
      fetchFollowerProfiles(userId),
      fetchFollowingProfiles(userId),
    ]);
    setFollowersList(followers);
    setFollowingList(following);
    setModalLoading(false);
  };

  if (loading) {
    return <div className="text-center p-8 text-white animate-pulse">Loading Profile...</div>;
  }

  const displayName = profile?.display_name || 'Anonymous Reader';
  const handle = profile?.handle || 'reader';
  const avatarUrl = profile?.avatar_url || '/icon-512-any.png';
  const bio = profile?.bio || 'No bio provided.';
  const unlockedBadges = (profile as any)?.unlocked_badges || [];
  const activeSkin = profile?.active_skin || 'jx';

  // Try to parse top 4 from profile, or use empty
  let topFavorites: any[] = [];
  try {
    topFavorites = (profile as any)?.top_4_favorites || [];
  } catch (e) {}

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
              src={avatarUrl}
              alt={displayName}
              className="w-24 h-24 rounded-full border-4 border-app-base shadow-xl object-cover bg-app-base"
            />
            <div className="absolute -bottom-2 -right-2 bg-app-card border border-app-border rounded-full p-1.5 shadow-lg flex items-center justify-center">
              <Trophy size={14} className="text-brand-purple" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-black text-[var(--color-text-main)] font-display">{displayName}</h2>
            <p className="text-sm font-mono text-brand-purple/80 mb-2">@{handle}</p>

            <p className="text-xs text-[var(--color-text-muted)] mt-3 max-w-sm mx-auto sm:mx-0 leading-relaxed">{bio}</p>

            <div className="flex items-center justify-center sm:justify-start gap-4 mt-3">
              <button onClick={() => openFollowersModal('followers')} className="text-xs text-[var(--color-text-main)] hover:text-brand-purple transition-colors cursor-pointer flex gap-1.5 items-center">
                <span className="font-bold">{followerCount}</span> <span className="text-[var(--color-text-muted)]">Followers</span>
              </button>
              <button onClick={() => openFollowersModal('following')} className="text-xs text-[var(--color-text-main)] hover:text-brand-purple transition-colors cursor-pointer flex gap-1.5 items-center">
                <span className="font-bold">{followingCount}</span> <span className="text-[var(--color-text-muted)]">Following</span>
              </button>
            </div>

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

          {!isOwnProfile && viewerId && (
            <div className="shrink-0 flex flex-col items-center sm:items-end gap-3">
              <button
                onClick={handleToggleFollow}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isFollowingUser
                    ? 'bg-app-base border border-app-border text-[var(--color-text-main)] hover:border-rose-500 hover:text-rose-500'
                    : 'bg-brand-purple text-[#340F04] border border-brand-purple hover:bg-brand-teal'
                }`}
              >
                {isFollowingUser ? (
                  <><UserCheck size={14} /> Following</>
                ) : (
                  <><UserPlus size={14} /> Follow</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Stats Row - only real, privacy-safe numbers (public reviews / public quotes) */}
        <div className="grid grid-cols-2 gap-2 mt-6 pt-6 border-t border-app-border relative z-10">
          <div className="flex flex-col items-center justify-center p-3 bg-black/20 rounded-lg border border-app-border">
            <MessageSquare size={16} className="text-brand-purple mb-1.5" />
            <span className="text-lg font-black text-[var(--color-text-main)] font-mono">{reviews.length}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Public Reviews</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 bg-black/20 rounded-lg border border-app-border">
            <QuoteIcon size={16} className="text-brand-teal mb-1.5" />
            <span className="text-lg font-black text-[var(--color-text-main)] font-mono">{quotes.length}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Public Quotes</span>
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
                  <img src={fav.cover_url} alt={fav.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
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
            <QuoteIcon size={14} className="text-brand-teal" /> Public Quotes
          </h3>

          {quotes.length === 0 ? (
            <div className="bg-app-card border border-app-border rounded-xl p-6 text-center text-[var(--color-text-muted)] text-xs shadow-app-glow">
              No public quotes yet.
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div key={quote.id} className="bg-app-card border border-app-border rounded-xl p-5 shadow-app-glow hover:border-brand-teal/30 transition-colors relative overflow-hidden group">
                  <QuoteIcon size={40} className="absolute -top-2 -left-2 text-brand-teal/5 rotate-180 group-hover:text-brand-teal/10 transition-colors pointer-events-none" />
                  <p className="text-xs text-[var(--color-text-main)] italic leading-relaxed mb-3 relative z-10 font-serif">
                    "{quote.quote}"
                  </p>
                  <div className="flex items-center justify-end gap-2 text-[10px] text-[var(--color-text-muted)] font-mono">
                    {quote.character && <span className="font-bold text-[var(--color-text-main)]">{quote.character}</span>}
                    {quote.author && <span className="font-bold text-[var(--color-text-main)]">— {quote.author}</span>}
                    {quote.source && <span>in <span className="italic">{quote.source}</span></span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowFollowersModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-app-card border border-app-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex border-b border-app-border">
              <button
                onClick={() => setActiveTab('followers')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'followers' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-[var(--color-text-muted)] hover:text-white'}`}
              >
                Followers ({followerCount})
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'following' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-[var(--color-text-muted)] hover:text-white'}`}
              >
                Following ({followingCount})
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {modalLoading ? (
                <div className="text-center text-xs text-[var(--color-text-muted)] py-8 animate-pulse">Loading...</div>
              ) : (
                (activeTab === 'followers' ? followersList : followingList).length === 0 ? (
                  <div className="text-center text-xs text-[var(--color-text-muted)] py-8">
                    {activeTab === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
                  </div>
                ) : (
                  (activeTab === 'followers' ? followersList : followingList).map((u) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <img src={u.avatar_url || '/icon-512-any.png'} alt={u.display_name || 'User'} className="w-10 h-10 rounded-full border border-app-border object-cover bg-app-base" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{u.display_name || 'Anonymous Reader'}</h4>
                        <p className="text-[10px] text-[var(--color-text-muted)] font-mono truncate">@{u.handle || 'reader'}</p>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
            <div className="p-3 border-t border-app-border bg-black/20">
              <button onClick={() => setShowFollowersModal(false)} className="w-full py-2 rounded-lg bg-app-base border border-app-border text-xs font-bold text-white hover:bg-white/5 transition-colors cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
