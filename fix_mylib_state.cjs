const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const targetState = `  const [filter, setFilter] = useState<StatusFilter>('all');`;
const replacementState = `  const [filter, setFilter] = useState<StatusFilter>('all');
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

if (content.includes(targetState)) {
    content = content.replace(targetState, replacementState);
    fs.writeFileSync('src/components/MyLibrary.tsx', content);
    console.log("Added states.");
} else {
    console.log("State target not found.");
}
