import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../utils/supabaseClient';
import { X, LogOut, Check, User, Image as ImageIcon } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  onProfileUpdate: () => void;
}

export function ProfileDrawer({ isOpen, onClose, session, onProfileUpdate }: ProfileDrawerProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [activeSkin, setActiveSkin] = useState('');

  useEffect(() => {
    if (isOpen && session) {
      loadProfile();
    }
  }, [isOpen, session]);

  const loadProfile = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setHandle(data.handle || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatar_url || '');
        setActiveSkin(data.active_skin || 'jx');
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const updates = {
        id: session.user.id,
        display_name: displayName,
        handle: handle,
        bio: bio,
        avatar_url: avatarUrl,
        active_skin: activeSkin,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;
      onProfileUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-app-base border-l border-app-border z-[101] flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-app-border bg-app-card">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User size={16} className="text-brand-purple" /> My Account
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full mx-auto" />
              <div className="h-4 bg-white/5 rounded w-1/2 mx-auto" />
              <div className="h-10 bg-white/5 rounded w-full" />
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-brand-purple object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-brand-purple/20 border-2 border-brand-purple flex items-center justify-center text-brand-purple">
                    <User size={32} />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{session?.user.email}</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-app-border/50">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your public name"
                    className="w-full bg-black/40 border border-app-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-purple transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Username Handle</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--color-text-muted)] font-mono">@</span>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="username"
                      className="w-full bg-black/40 border border-app-border rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-brand-purple transition-all font-mono"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={10} /> Choose Avatar
                  </label>
                  <div className="flex justify-center">
                    {(() => {
                      const presetUrl = `/icon-512.png`;
                      return (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl(presetUrl)}
                          className={`relative w-24 h-24 rounded-lg border-2 overflow-hidden transition-all hover:scale-105 cursor-pointer ${
                            avatarUrl === presetUrl ? 'border-brand-purple shadow-[0_0_10px_rgba(168,85,247,0.4)]' : 'border-app-border opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={presetUrl} alt="Mascot Logo" className="w-full h-full object-cover bg-black/40" />
                          {avatarUrl === presetUrl && (
                            <div className="absolute inset-0 bg-brand-purple/20 flex items-center justify-center">
                              <Check size={20} className="text-white drop-shadow-md" />
                            </div>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A bit about yourself..."
                    rows={3}
                    className="w-full bg-black/40 border border-app-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-purple transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Active Skin (Public Profile Theme)</label>
                  <select
                    value={activeSkin}
                    onChange={(e) => setActiveSkin(e.target.value)}
                    className="w-full bg-black/40 border border-app-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-purple transition-all appearance-none cursor-pointer"
                  >
                    <option value="jx">Dark Slate (Default)</option>
                    <option value="neon">Neon Glow</option>
                    <option value="pastel">Cozy Pastel</option>
                    <option value="rainbow">Vibrant</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-app-border bg-app-card space-y-3">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full py-2.5 bg-brand-purple hover:bg-[#ebdcf2] text-[#340F04] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : <><Check size={14} /> Save Profile</>}
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 border border-red-500/20"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </div>
    </>
  );
}
