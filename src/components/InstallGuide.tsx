import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Share, PlusSquare, ArrowRight, Home } from 'lucide-react';

interface InstallGuideProps {
  onEnterApp: () => void;
}

export function InstallGuide({ onEnterApp }: InstallGuideProps) {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('ios');

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
      
      {/* Mascot Logo with CSS Legs */}
      <div className="relative mb-8 mt-10">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10"
        >
          <img src="/icon-512.png" alt="SaveState Mascot" className="w-32 h-32 rounded-3xl shadow-[0_0_30px_rgba(215,33,249,0.3)] border-2 border-brand-purple/50" />
        </motion.div>
        
        {/* Mascot Legs */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-6 z-0">
          <motion.div 
            animate={{ rotate: [0, 15, 0, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            className="w-2.5 h-8 bg-gradient-to-b from-brand-purple to-brand-teal rounded-full origin-top"
          />
          <motion.div 
            animate={{ rotate: [0, -15, 0, 15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-2.5 h-8 bg-gradient-to-b from-brand-purple to-brand-teal rounded-full origin-top"
          />
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold font-display text-[var(--color-text-main)] mb-3">
        Install <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-turquoise">SaveState</span>
      </h1>
      <p className="text-[var(--color-text-muted)] max-w-md mx-auto mb-8 text-sm">
        For the best experience, install SaveState on your home screen. It works offline and feels like a native app!
      </p>

      <div className="bg-app-card border border-app-border rounded-xl p-2 mb-8 inline-flex">
        <button 
          onClick={() => setPlatform('ios')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${platform === 'ios' ? 'bg-brand-purple/20 text-brand-purple' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          iOS
        </button>
        <button 
          onClick={() => setPlatform('android')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${platform === 'android' ? 'bg-brand-teal/20 text-brand-teal' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          Android
        </button>
        <button 
          onClick={() => setPlatform('desktop')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${platform === 'desktop' ? 'bg-brand-turquoise/20 text-brand-turquoise' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
        >
          Desktop
        </button>
      </div>

      <div className="bg-black/40 border border-brand-purple/20 rounded-xl p-6 max-w-sm w-full text-left mb-10 shadow-app-glow">
        {platform === 'ios' && (
          <ol className="space-y-4 text-sm text-[var(--color-text-main)] font-mono">
            <li className="flex gap-3 items-start">
              <span className="text-brand-purple font-bold">1.</span>
              <span>Open this page in <strong>Safari</strong></span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-brand-purple font-bold">2.</span>
              <span>Tap the <Share size={16} className="inline text-brand-purple mx-1" /> <strong>Share</strong> button at the bottom</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-brand-purple font-bold">3.</span>
              <span>Scroll down and tap <PlusSquare size={16} className="inline text-brand-purple mx-1" /> <strong>Add to Home Screen</strong></span>
            </li>
          </ol>
        )}

        {platform === 'android' && (
          <ol className="space-y-4 text-sm text-[var(--color-text-main)] font-mono">
            <li className="flex gap-3 items-start">
              <span className="text-brand-purple font-bold">1.</span>
              <span>Open this page in <strong>Chrome</strong></span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-brand-purple font-bold">2.</span>
              <span>Tap the <strong>Menu (3 dots)</strong> at the top right</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-brand-purple font-bold">3.</span>
              <span>Tap <Download size={16} className="inline text-brand-purple mx-1" /> <strong>Install App</strong> or Add to Home Screen</span>
            </li>
          </ol>
        )}

        {platform === 'desktop' && (
          <ol className="space-y-4 text-sm text-[var(--color-text-main)] font-mono">
            <li className="flex gap-3 items-start">
              <span className="text-brand-purple font-bold">1.</span>
              <span>Open this page in <strong>Chrome or Edge</strong></span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-brand-purple font-bold">2.</span>
              <span>Click the <Download size={16} className="inline text-brand-purple mx-1" /> <strong>Install</strong> icon in the address bar</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-brand-purple font-bold">3.</span>
              <span>Follow the prompt to install SaveState</span>
            </li>
          </ol>
        )}
      </div>

      <button 
        onClick={onEnterApp}
        className="px-8 py-3 bg-brand-purple text-[#340F04] font-bold uppercase tracking-widest rounded-xl hover:bg-brand-teal transition-all hover:scale-105 shadow-[0_0_20px_rgba(215,33,249,0.4)] flex items-center gap-2 cursor-pointer"
      >
        <Home size={18} />
        Continue to App
      </button>

    </div>
  );
}
