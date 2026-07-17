const fs = require('fs');
let content = fs.readFileSync('src/components/RecapModal.tsx', 'utf8');

if (!content.includes('Share2')) {
  content = content.replace('SkipForward } from', 'SkipForward, Share2, Check } from');
}

const stateTarget = `const [staticEffect, setStaticEffect] = useState(true);`;
const stateReplacement = `const [staticEffect, setStaticEffect] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleShare = (point: SavePoint) => {
    const text = \`Just reached "\${point.milestone}" in \${mediaTitle}! 🤯\\nNo spoilers here, but my mind is blown.\\n\\nLogged via MediaTracker 📚📺\`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };`;
content = content.replace(stateTarget, stateReplacement);

const buttonTarget = `<button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-2 bg-brand-purple text-[#340F04] font-black uppercase tracking-wider text-xs rounded hover:bg-white transition-colors"
            >
              <SkipForward size={14} />
              Skip Recap
            </button>`;

const buttonReplacement = `<button
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
            )}`;

content = content.replace(buttonTarget, buttonReplacement);

fs.writeFileSync('src/components/RecapModal.tsx', content);
