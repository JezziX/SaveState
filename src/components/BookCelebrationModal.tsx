import React, { useState } from 'react';
import { Book } from '../types';
import { Trophy, Star, BookOpen, Check, X, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface BookCelebrationModalProps {
  book: Book;
  onClose: () => void;
  onSaveRating: (rating: number) => void;
}

export function BookCelebrationModal({ book, onClose, onSaveRating }: BookCelebrationModalProps) {
  const [rating, setRating] = useState(0);
  
  // Custom falling item animation
  const fallingItems = Array.from({ length: 40 }).map((_, i) => {
    const type = i % 3; // 0: star, 1: book, 2: sparkles
    const size = Math.random() * 16 + 10;
    const left = Math.random() * 100;
    const duration = Math.random() * 3 + 3;
    const delay = Math.random() * 2;
    
    return { id: i, type, size, left, duration, delay };
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      {/* Falling animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {fallingItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ y: -50, x: `${item.left}vw`, opacity: 0, rotate: 0 }}
            animate={{ 
              y: '100vh', 
              opacity: [0, 1, 1, 0], 
              rotate: 360,
              x: `calc(${item.left}vw + ${Math.random() * 50 - 25}px)`
            }}
            transition={{ duration: item.duration, delay: item.delay, ease: "linear", repeat: Infinity }}
            className="absolute top-0 text-brand-purple"
          >
            {item.type === 0 ? <Star size={item.size} className="fill-brand-purple/50" /> : 
             item.type === 1 ? <BookOpen size={item.size} /> : 
             <Sparkles size={item.size} />}
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-w-sm w-full bg-app-card border border-brand-purple/40 rounded-2xl shadow-app-glow p-6 text-center z-10"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] bg-black/20 rounded-full transition-colors cursor-pointer">
          <X size={16} />
        </button>

        <div className="w-20 h-20 bg-brand-purple/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-purple/40">
          <Trophy size={40} className="text-brand-purple" />
        </div>

        <h2 className="text-2xl font-bold text-[var(--color-text-main)] font-display mb-1">Book Finished!</h2>
        <p className="text-[12px] text-[var(--color-text-muted)] mb-4 uppercase tracking-widest font-bold">You completed</p>
        
        <div className="flex gap-4 items-center bg-app-base border border-app-border p-3 rounded-xl mb-6">
          <div className="w-12 h-16 rounded overflow-hidden shrink-0 border border-app-border">
            {book.coverUrl ? (
              <img src={book.coverUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full bg-[#111] flex items-center justify-center">
                <BookOpen size={16} className="text-gray-600" />
              </div>
            )}
          </div>
          <div className="text-left flex-1 min-w-0">
            <h3 className="font-bold text-sm text-[var(--color-text-main)] truncate" title={book.title}>{book.title}</h3>
            <p className="text-[10px] text-[var(--color-text-muted)] truncate">{book.author}</p>
            <p className="text-[10px] text-brand-turquoise font-mono mt-1">{book.pages || 0} Pages Read</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Quick Rating</p>
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`p-1 transition-all hover:scale-110 cursor-pointer ${rating >= star ? 'text-yellow-400' : 'text-gray-600'}`}
              >
                <Star size={24} className={rating >= star ? 'fill-yellow-400' : ''} />
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => {
            if (rating > 0) onSaveRating(rating);
            onClose();
          }} 
          className="w-full mt-6 py-3 bg-brand-purple text-[#340F04] font-bold rounded-xl hover:bg-[#d8c7df] transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check size={18} /> Continue
        </button>
      </motion.div>
    </div>
  );
}
