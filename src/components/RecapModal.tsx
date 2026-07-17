import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Tv, SkipForward, Share2, Check } from 'lucide-react';
import { SavePoint, Book, MediaItem } from '../types';

interface RecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaTitle: string;
  savePoints: SavePoint[];
}

export function RecapModal({ isOpen, onClose, mediaTitle, savePoints }: RecapModalProps) {
  const [staticEffect, setStaticEffect] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleShare = (point: SavePoint) => {
    const text = `Just reached "${point.milestone}" in ${mediaTitle}! 🤯\nNo spoilers here, but my mind is blown.\n\nLogged via MediaTracker 📚📺`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (isOpen) {
      setStaticEffect(true);
      const timer = setTimeout(() => setStaticEffect(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Sort save points descending by date
  const sortedPoints = [...savePoints].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const lastSavePoint = sortedPoints[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      >
        <div className="relative w-full max-w-2xl bg-[#111] rounded-2xl overflow-hidden shadow-2xl border-4 border-[#222]">
          {/* Static Overlay */}
          {staticEffect && (
            <div className="absolute inset-0 z-20 pointer-events-none opacity-50 mix-blend-screen" 
                 style={{ 
                   backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
                   backgroundSize: '100px 100px'
                 }} 
            />
          )}

          {/* CRT scanline effect */}
          <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />

          {/* Header */}
          <div className="relative z-30 p-6 border-b border-[#333] bg-[#0a0a0a]">
            <h2 className="text-2xl font-black text-white uppercase tracking-widest font-display italic flex items-center gap-3">
              <Tv size={24} className="text-brand-turquoise" />
              Previously On {mediaTitle}...
            </h2>
          </div>

          {/* Content */}
          <div className="relative z-30 p-8 min-h-[300px] flex flex-col justify-center">
            {lastSavePoint ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-4 text-center"
              >
                <div className="inline-block px-3 py-1 mb-4 rounded border border-brand-purple/30 bg-brand-purple/10 text-brand-purple text-xs font-bold uppercase tracking-widest font-mono">
                  Milestone: {lastSavePoint.milestone}
                </div>
                <p className="text-lg text-gray-200 font-serif italic leading-relaxed max-w-xl mx-auto">
                  "{lastSavePoint.raw_brain_drop}"
                </p>
                <p className="text-[10px] text-gray-500 font-mono mt-4">
                  Logged on {new Date(lastSavePoint.created_at).toLocaleDateString()}
                </p>
              </motion.div>
            ) : (
              <div className="text-center text-gray-500 font-mono">
                [ NO PREVIOUS SAVE DATA FOUND FOR THIS MEDIA ]
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="relative z-30 p-4 border-t border-[#333] bg-[#0a0a0a] flex justify-center">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-2 bg-brand-purple text-[#340F04] font-black uppercase tracking-wider text-xs rounded hover:bg-white transition-colors"
            >
              <SkipForward size={14} />
              Skip Recap
            </button>
            {lastSavePoint && (
              <button
                onClick={() => handleShare(lastSavePoint)}
                className="flex items-center gap-2 px-4 py-2 bg-[#111] text-brand-turquoise border border-brand-turquoise font-black uppercase tracking-wider text-xs rounded hover:bg-brand-turquoise hover:text-black transition-colors ml-4 cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                {copied ? 'Copied!' : 'Share Spoiler-Free'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
