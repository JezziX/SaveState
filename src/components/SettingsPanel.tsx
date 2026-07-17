import React from 'react';
import { AppPreferences } from '../types';
import { Type, Palette, CalendarDays, Settings as SettingsIcon, Hexagon, Moon, Sun, Monitor } from 'lucide-react';

interface SettingsPanelProps {
  preferences: AppPreferences;
  onUpdatePreferences: (updates: Partial<AppPreferences>) => void;
  userName: string;
  onUpdateUserName: (name: string) => void;
  yearlyGoal: number;
  onUpdateYearlyGoal: (goal: number) => void;
}

export function SettingsPanel({
  preferences,
  onUpdatePreferences,
  userName,
  onUpdateUserName,
  yearlyGoal,
  onUpdateYearlyGoal
}: SettingsPanelProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-brand-purple/10 text-brand-purple rounded-xl border border-brand-purple/20">
          <SettingsIcon size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white font-display">Preferences</h2>
          <p className="text-[11px] text-[var(--color-text-muted)] font-medium">Customize your reading nook, layout, and tracker behavior</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personalization */}
        <section className="bg-app-card border border-app-border rounded-xl p-5 shadow-app-glow">
          <h3 className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-app-border pb-3">
            <Hexagon size={14} className="text-brand-turquoise" /> Profile & Goals
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => onUpdateUserName(e.target.value)}
                placeholder="Reader Name"
                className="w-full bg-app-base border border-app-border rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-brand-purple transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Yearly Reading Goal
              </label>
              <input
                type="number"
                min="1"
                value={yearlyGoal}
                onChange={(e) => onUpdateYearlyGoal(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-app-base border border-app-border rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-brand-purple transition-colors"
              />
              <p className="text-[9px] text-[var(--color-text-muted)] mt-1.5">How many books do you want to complete this year?</p>
            </div>
          </div>
        </section>

        {/* Visual Settings */}
        <section className="bg-app-card border border-app-border rounded-xl p-5 shadow-app-glow">
          <h3 className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-app-border pb-3">
            <Palette size={14} className="text-brand-purple" /> Visual Theme
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Color Palette
              </label>
              <select
                value={preferences.theme}
                onChange={(e) => onUpdatePreferences({ theme: e.target.value as any })}
                className="w-full bg-app-base border border-app-border rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-brand-purple transition-colors appearance-none cursor-pointer"
              >
                {[
                  { id: 'jx', label: 'Dark Slate - Sleek & minimal' },
                  { id: 'apothecary', label: 'Apothecary - Dark Academia' },
                  { id: 'cozy', label: 'Cozy Nook - Warm espresso' },
                  { id: 'cyber', label: 'Cyber Neon - Glowing nights' },
                  { id: 'forest', label: 'Forest Sanctuary - Deep evergreen' },
                  { id: 'neon', label: 'Neon Glow - Cyberpunk nights' },
                  { id: 'pastel', label: 'Cozy Pastel - Warm reading nook' },
                  { id: 'rainbow', label: 'Vibrant - High energy' }
                ].map((t) => (
                  <option key={t.id} value={t.id} className="bg-app-base text-[var(--color-text-main)]">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Typography
              </label>
              <select
                value={preferences.fontFamily}
                onChange={(e) => onUpdatePreferences({ fontFamily: e.target.value as any })}
                className="w-full bg-app-base border border-app-border rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-brand-purple transition-colors appearance-none cursor-pointer"
              >
                {[
                  { id: 'sans', label: 'Modern Sans' },
                  { id: 'serif', label: 'Classic Serif' },
                  { id: 'mono', label: 'Typewriter' },
                  { id: 'display', label: 'Tech Space' },
                  { id: 'handwriting', label: 'Handwritten' },
                  { id: 'merriweather', label: 'Merriweather' },
                  { id: 'playfair', label: 'Playfair' },
                  { id: 'cinzel', label: 'Cinzel' },
                  { id: 'lora', label: 'Lora' },
                  { id: 'firacode', label: 'Fira Code' },
                  { id: 'plusjakarta', label: 'Plus Jakarta' }
                ].map((f) => (
                  <option key={f.id} value={f.id} className="bg-app-base text-[var(--color-text-main)]">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Layout Settings */}
        <section className="bg-app-card border border-app-border rounded-xl p-5 shadow-app-glow md:col-span-2">
          <h3 className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-app-border pb-3">
            <CalendarDays size={14} className="text-emerald-400" /> Calendar & Tracker Options
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Calendar Start Day
              </label>
              <select
                value={preferences.calendarStartDay}
                onChange={(e) => onUpdatePreferences({ calendarStartDay: e.target.value as 'sunday' | 'monday' })}
                className="w-full bg-app-base border border-app-border rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-brand-purple transition-colors appearance-none cursor-pointer"
              >
                <option value="sunday" className="bg-app-base text-[var(--color-text-main)]">Sunday First</option>
                <option value="monday" className="bg-app-base text-[var(--color-text-main)]">Monday First</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                Daily Goal Tracker
              </label>
              <select
                value={preferences.showDailyGoal ? "true" : "false"}
                onChange={(e) => onUpdatePreferences({ showDailyGoal: e.target.value === "true" })}
                className="w-full bg-app-base border border-app-border rounded-lg px-3 py-2 text-sm text-[var(--color-text-main)] focus:outline-none focus:border-brand-purple transition-colors appearance-none cursor-pointer"
              >
                <option value="true" className="bg-app-base text-[var(--color-text-main)]">Show Daily Goal</option>
                <option value="false" className="bg-app-base text-[var(--color-text-main)]">Hide Daily Goal</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
