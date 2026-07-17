const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const targetProps = `pinnedBadges?: { id: string, x: number, y: number, badgeId: string }[];
  books: Book[];`;
const replacementProps = `pinnedBadges?: { id: string, x: number, y: number, badgeId: string }[];
  unlockedBadges?: string[];
  onUpdatePinnedBadges?: (badges: { id: string, x: number, y: number, badgeId: string }[]) => void;
  books: Book[];`;
content = content.replace(targetProps, replacementProps);

const targetComp = `pinnedBadges = [],
  onSelectBook,`;
const replacementComp = `pinnedBadges = [],
  unlockedBadges = [],
  onUpdatePinnedBadges,
  onSelectBook,`;
content = content.replace(targetComp, replacementComp);

// Add pinning state
const targetState = `const [activeView, setActiveView] = useState<'grid' | 'shelf' | 'list'>('shelf');`;
const replacementState = `const [activeView, setActiveView] = useState<'grid' | 'shelf' | 'list'>('shelf');
  const [pinningBadge, setPinningBadge] = useState<string | null>(null);

  const BADGES = {
    'lore-master': { name: 'The Lore-Master', icon: '📜', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    'binge-burnout': { name: 'The Binge-Burnout', icon: '🔥', color: 'bg-red-100 text-red-900 border-red-300' },
    'time-traveler': { name: 'Time Traveler', icon: '⏳', color: 'bg-purple-100 text-purple-900 border-purple-300' }
  };

  const handleShelfClick = (e: React.MouseEvent, shelfIdx: number) => {
    if (!pinningBadge || !onUpdatePinnedBadges) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onUpdatePinnedBadges([...pinnedBadges, { id: \`pin_\${Date.now()}\`, badgeId: pinningBadge, x, y, shelfIdx }]);
    setPinningBadge(null);
  };
`;
content = content.replace(targetState, replacementState);

// Add to the top bar (next to search/filters) to show unlocked badges to pin
const targetTopBar = `{/* Search & Filters */}`;
const replacementTopBar = `{/* Search & Filters */}
        {unlockedBadges.length > 0 && activeView === 'shelf' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-app-card border border-brand-purple/30 p-3 rounded-lg mb-4">
            <span className="text-xs font-bold text-brand-purple uppercase tracking-wider">Pin Decals:</span>
            <div className="flex flex-wrap gap-2">
              {unlockedBadges.map(badgeId => (
                <button
                  key={badgeId}
                  onClick={() => setPinningBadge(pinningBadge === badgeId ? null : badgeId)}
                  className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border cursor-pointer transition-all \${pinningBadge === badgeId ? 'ring-2 ring-brand-turquoise scale-105' : 'hover:scale-105'} \${(BADGES as any)[badgeId]?.color}\`}
                >
                  <span className="text-base">{(BADGES as any)[badgeId]?.icon}</span>
                  {(BADGES as any)[badgeId]?.name}
                </button>
              ))}
            </div>
            {pinningBadge && <span className="text-[10px] text-[var(--color-text-muted)] animate-pulse ml-auto">Click anywhere on a shelf to pin...</span>}
          </div>
        )}
        `;
content = content.replace(targetTopBar, replacementTopBar);

// Add click handler and pinned decals rendering to the shelf row
const targetShelfRow = `<div key={shelfIdx} className="relative pt-6">`;
const replacementShelfRow = `<div 
                  key={shelfIdx} 
                  className={\`relative pt-6 \${pinningBadge ? 'cursor-crosshair' : ''}\`} 
                  onClick={(e) => handleShelfClick(e, shelfIdx)}
                >
                  {/* Pinned Badges */}
                  {pinnedBadges.filter((b: any) => b.shelfIdx === shelfIdx).map((badge: any) => (
                    <div 
                      key={badge.id}
                      className="absolute z-30 flex items-center justify-center pointer-events-none drop-shadow-md"
                      style={{ left: \`\${badge.x}%\`, top: \`\${badge.y}%\`, transform: 'translate(-50%, -50%) rotate(-5deg)' }}
                    >
                      <div className={\`w-8 h-8 flex items-center justify-center rounded-full border-2 \${(BADGES as any)[badge.badgeId]?.color}\`}>
                        <span className="text-lg">{(BADGES as any)[badge.badgeId]?.icon}</span>
                      </div>
                    </div>
                  ))}
`;
content = content.replace(targetShelfRow, replacementShelfRow);

fs.writeFileSync('src/components/MyLibrary.tsx', content);
