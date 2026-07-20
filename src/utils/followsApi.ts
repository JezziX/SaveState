import { supabase } from './supabaseClient';

export interface PublicProfile {
  id: string;
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
  bio: string | null;
}

// Two-step lookups (fetch the follow rows, then fetch the matching profiles)
// rather than a single joined query - this avoids relying on PostgREST's
// automatic foreign-key embedding across schemas, which can be finicky
// between `user_follows` and `profiles`. Simpler and more predictable.

export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  const [followersRes, followingRes] = await Promise.all([
    supabase.from('user_follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('user_follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return {
    followers: followersRes.count || 0,
    following: followingRes.count || 0,
  };
}

export async function fetchFollowerProfiles(userId: string): Promise<PublicProfile[]> {
  const { data: rows, error } = await supabase.from('user_follows').select('follower_id').eq('following_id', userId);
  if (error || !rows || rows.length === 0) return [];
  const ids = rows.map(r => r.follower_id);
  const { data: profiles } = await supabase.from('profiles').select('id, display_name, handle, avatar_url, bio').in('id', ids);
  return profiles || [];
}

export async function fetchFollowingProfiles(userId: string): Promise<PublicProfile[]> {
  const { data: rows, error } = await supabase.from('user_follows').select('following_id').eq('follower_id', userId);
  if (error || !rows || rows.length === 0) return [];
  const ids = rows.map(r => r.following_id);
  const { data: profiles } = await supabase.from('profiles').select('id, display_name, handle, avatar_url, bio').in('id', ids);
  return profiles || [];
}

export async function isFollowing(myId: string, otherId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('follower_id', myId)
    .eq('following_id', otherId)
    .maybeSingle();
  return !!data;
}

export async function followUser(myId: string, otherId: string): Promise<boolean> {
  const { error } = await supabase.from('user_follows').insert({ follower_id: myId, following_id: otherId });
  if (error) console.error('Failed to follow user:', error.message);
  return !error;
}

export async function unfollowUser(myId: string, otherId: string): Promise<boolean> {
  const { error } = await supabase.from('user_follows').delete().eq('follower_id', myId).eq('following_id', otherId);
  if (error) console.error('Failed to unfollow user:', error.message);
  return !error;
}
