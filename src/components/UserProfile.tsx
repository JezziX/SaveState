import React, { useState } from 'react';
import { SocialUser } from '../types';
import { UserPlus, UserCheck, BookOpen, Flame, Medal, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { MOCK_USERS } from './CommunityFeed';

interface UserProfileProps {
  userId: string;
  onBack: () => void;
}

export function UserProfile({ userId, onBack }: UserProfileProps) {
  const [user, setUser] = useState<SocialUser | undefined>(MOCK_USERS.find(u => u.id === userId));
  
  if (!user) {
    return (
      <div className="text-center p-8 text-white">User not found.</div>
    );
  }

  const toggleFollow = () => {
    setUser(prev => prev ? { ...prev, isFollowing: !prev.isFollowing } : prev);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)] hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} /> Back to Reviews
      </button>

      <div className="bg-app-card border border-app-border rounded-xl p-6 shadow-app-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-purple/10 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <img 
            src={user.avatarUrl} 
            alt={user.displayName} 
            className="w-24 h-24 rounded-full border-4 border-app-base shadow-xl"
          />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-black text-[var(--color-text-main)] font-display">{user.displayName}</h2>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-2 max-w-sm mx-auto sm:mx-0">{user.bio}</p>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
              {user.badges.map(badge => (
                <span key={badge} className="px-2.5 py-1 bg-brand-purple/10 border border-brand-purple/30 text-brand-purple text-[9px] font-bold uppercase tracking-wider rounded-full">
                  {badge}
                </span>
              ))}
            </div>
          </div>
          
          <div className="shrink-0">
            <button 
              onClick={toggleFollow}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                user.isFollowing 
                  ? 'bg-app-base border border-app-border text-[var(--color-text-main)] hover:border-rose-500 hover:text-rose-500'
                  : 'bg-brand-purple text-[#340F04] border border-brand-purple hover:bg-[#d8c7df]'
              }`}
            >
              {user.isFollowing ? (
                <><UserCheck size={14} /> Following</>
              ) : (
                <><UserPlus size={14} /> Follow</>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-app-border/50">
          <div className="text-center">
            <BookOpen size={20} className="text-brand-turquoise mx-auto mb-2" />
            <span className="text-2xl font-black text-[var(--color-text-main)] font-mono">{user.booksRead}</span>
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mt-1">Books Read</span>
          </div>
          <div className="text-center">
            <Flame size={20} className="text-orange-500 mx-auto mb-2" />
            <span className="text-2xl font-black text-[var(--color-text-main)] font-mono">{user.streakDays}</span>
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mt-1">Day Streak</span>
          </div>
          <div className="text-center">
            <Medal size={20} className="text-brand-purple mx-auto mb-2" />
            <span className="text-2xl font-black text-[var(--color-text-main)] font-mono">{user.badges.length}</span>
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mt-1">Badges</span>
          </div>
          <div className="text-center">
            <UserCheck size={20} className="text-emerald-400 mx-auto mb-2" />
            <span className="text-2xl font-black text-[var(--color-text-main)] font-mono">1.2k</span>
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mt-1">Followers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
