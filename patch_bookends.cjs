const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const renderLeftBookend = `
const renderLeftBookend = () => {
  if (shelfSkin === 'Plain') {
    return <div className="w-4 h-[100px] bg-white rounded-t-sm self-end relative z-20 shadow-md border border-gray-200" />;
  }
  if (shelfSkin === 'Trophy Case') {
    return <div className="w-8 h-[130px] bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-t-md self-end relative z-20 shadow-[0_0_15px_rgba(255,215,0,0.4)] border border-yellow-700" />;
  }
  if (shelfSkin === 'Kitchen') {
    return <div className="w-6 h-[90px] bg-blue-200 rounded-t-lg self-end relative z-20 shadow-sm border border-blue-300" />;
  }
  if (shelfSkin === 'Spooky') {
    return <div className="w-8 h-[110px] bg-gradient-to-r from-green-900 to-black rounded-t-md self-end relative z-20 shadow-[0_0_10px_lime] border border-green-700" />;
  }
  // Default Apothecary
  return (
    <div className="w-6 sm:w-8 h-[125px] sm:h-[145px] bg-gradient-to-r from-[#d4af37] via-[#fdf5d3] to-[#aa801b] rounded-tl-[24px] rounded-bl-[4px] self-end relative shrink-0 -mr-[1px] z-20 overflow-hidden shadow-[inset_2px_2px_6px_rgba(255,255,255,0.7),_3px_0_6px_rgba(0,0,0,0.5)] border border-[#8b6508]">
      <div className="absolute inset-0 opacity-80 pointer-events-none">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-l-2 border-b-2 border-[#b8860b] rotate-[-45deg]" />
        <div className="absolute top-12 left-1.5 w-6 h-6 border-2 border-transparent border-t-[#b8860b] border-l-[#b8860b] rounded-full opacity-60" />
        <div className="absolute top-16 -left-2 w-5 h-5 border-2 border-transparent border-b-[#b8860b] border-r-[#b8860b] rounded-full opacity-60" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-4 h-4 border-2 border-transparent border-t-[#b8860b] border-r-[#b8860b] rounded-full opacity-60" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#b8860b] text-[8px] leading-none drop-shadow-sm">✦</div>
        <div className="absolute bottom-10 left-1 text-[#b8860b] text-[6px] leading-none drop-shadow-sm opacity-70">✧</div>
      </div>
    </div>
  );
};
`;

const renderRightBookend = `
const renderRightBookend = () => {
  if (shelfSkin === 'Plain') {
    return <div className="w-4 h-[100px] bg-white rounded-t-sm self-end relative z-20 shadow-md border border-gray-200" />;
  }
  if (shelfSkin === 'Trophy Case') {
    return <div className="w-8 h-[130px] bg-gradient-to-l from-yellow-400 to-yellow-600 rounded-t-md self-end relative z-20 shadow-[0_0_15px_rgba(255,215,0,0.4)] border border-yellow-700" />;
  }
  if (shelfSkin === 'Kitchen') {
    return <div className="w-6 h-[90px] bg-blue-200 rounded-t-lg self-end relative z-20 shadow-sm border border-blue-300" />;
  }
  if (shelfSkin === 'Spooky') {
    return <div className="w-8 h-[110px] bg-gradient-to-l from-green-900 to-black rounded-t-md self-end relative z-20 shadow-[0_0_10px_lime] border border-green-700" />;
  }
  // Default Apothecary
  return (
    <div className="w-6 sm:w-8 h-[125px] sm:h-[145px] bg-gradient-to-l from-[#d4af37] via-[#fdf5d3] to-[#aa801b] rounded-tr-[24px] rounded-br-[4px] self-end relative shrink-0 -ml-[1px] z-20 overflow-hidden shadow-[inset_-2px_2px_6px_rgba(255,255,255,0.7),_-3px_0_6px_rgba(0,0,0,0.5)] border border-[#8b6508]">
      <div className="absolute inset-0 opacity-80 pointer-events-none">
        <div className="absolute top-4 right-1/2 translate-x-1/2 w-4 h-4 rounded-full border-r-2 border-b-2 border-[#b8860b] rotate-[45deg]" />
        <div className="absolute top-12 right-1.5 w-6 h-6 border-2 border-transparent border-t-[#b8860b] border-r-[#b8860b] rounded-full opacity-60" />
        <div className="absolute top-16 -right-2 w-5 h-5 border-2 border-transparent border-b-[#b8860b] border-l-[#b8860b] rounded-full opacity-60" />
        <div className="absolute top-24 right-1/2 translate-x-1/2 w-4 h-4 border-2 border-transparent border-t-[#b8860b] border-l-[#b8860b] rounded-full opacity-60" />
        <div className="absolute bottom-6 right-1/2 translate-x-1/2 text-[#b8860b] text-[8px] leading-none drop-shadow-sm">✦</div>
        <div className="absolute bottom-10 right-1 text-[#b8860b] text-[6px] leading-none drop-shadow-sm opacity-70">✧</div>
      </div>
    </div>
  );
};
`;

const getDecorForSlotTarget = `const getDecorForSlot = (shelfIdx: number, salt: number) => {`;
content = content.replace(getDecorForSlotTarget, renderLeftBookend + '\\n' + renderRightBookend + '\\n' + getDecorForSlotTarget);


const leftTarget = `{/* Whimsical Gold Left Bookend */}
                    {showLeftBookend ? (
                      <div 
                        className="w-6 sm:w-8 h-[125px] sm:h-[145px] bg-gradient-to-r from-[#d4af37] via-[#fdf5d3] to-[#aa801b] rounded-tl-[24px] rounded-bl-[4px] self-end relative shrink-0 -mr-[1px] z-20 overflow-hidden shadow-[inset_2px_2px_6px_rgba(255,255,255,0.7),_3px_0_6px_rgba(0,0,0,0.5)] border border-[#8b6508]"
                      >
                        {/* Whimsical Engravings */}
                        <div className="absolute inset-0 opacity-80 pointer-events-none">
                          {/* Crescent Moon */}
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-l-2 border-b-2 border-[#b8860b] rotate-[-45deg]" />
                          
                          {/* Swirls */}
                          <div className="absolute top-12 left-1.5 w-6 h-6 border-2 border-transparent border-t-[#b8860b] border-l-[#b8860b] rounded-full opacity-60" />
                          <div className="absolute top-16 -left-2 w-5 h-5 border-2 border-transparent border-b-[#b8860b] border-r-[#b8860b] rounded-full opacity-60" />
                          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-4 h-4 border-2 border-transparent border-t-[#b8860b] border-r-[#b8860b] rounded-full opacity-60" />

                          {/* Stars */}
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#b8860b] text-[8px] leading-none drop-shadow-sm">✦</div>
                          <div className="absolute bottom-10 left-1 text-[#b8860b] text-[6px] leading-none drop-shadow-sm opacity-70">✧</div>
                        </div>
                      </div>
                    ) : (`;

const rightTarget = `{/* Whimsical Gold Right Bookend */}
                    {showRightBookend ? (
                      <div 
                        className="w-6 sm:w-8 h-[125px] sm:h-[145px] bg-gradient-to-l from-[#d4af37] via-[#fdf5d3] to-[#aa801b] rounded-tr-[24px] rounded-br-[4px] self-end relative shrink-0 -ml-[1px] z-20 overflow-hidden shadow-[inset_-2px_2px_6px_rgba(255,255,255,0.7),_-3px_0_6px_rgba(0,0,0,0.5)] border border-[#8b6508]"
                      >
                        {/* Whimsical Engravings */}
                        <div className="absolute inset-0 opacity-80 pointer-events-none">
                          {/* Crescent Moon */}
                          <div className="absolute top-4 right-1/2 translate-x-1/2 w-4 h-4 rounded-full border-r-2 border-b-2 border-[#b8860b] rotate-[45deg]" />
                          
                          {/* Swirls */}
                          <div className="absolute top-12 right-1.5 w-6 h-6 border-2 border-transparent border-t-[#b8860b] border-r-[#b8860b] rounded-full opacity-60" />
                          <div className="absolute top-16 -right-2 w-5 h-5 border-2 border-transparent border-b-[#b8860b] border-l-[#b8860b] rounded-full opacity-60" />
                          <div className="absolute top-24 right-1/2 translate-x-1/2 w-4 h-4 border-2 border-transparent border-t-[#b8860b] border-l-[#b8860b] rounded-full opacity-60" />

                          {/* Stars */}
                          <div className="absolute bottom-6 right-1/2 translate-x-1/2 text-[#b8860b] text-[8px] leading-none drop-shadow-sm">✦</div>
                          <div className="absolute bottom-10 right-1 text-[#b8860b] text-[6px] leading-none drop-shadow-sm opacity-70">✧</div>
                        </div>
                      </div>
                    ) : (`;

content = content.replace(leftTarget, `{showLeftBookend ? renderLeftBookend() : (`);
content = content.replace(rightTarget, `{showRightBookend ? renderRightBookend() : (`);

// And we also want to modify the shelf base
const shelfBaseTarget = `{/* Deep Wood Apothecary Shelf Base */}`;
const renderShelfBase = `
const renderShelfBase = () => {
  if (shelfSkin === 'Plain') {
    return (
      <div className="absolute bottom-0 w-full z-0 h-4 bg-gray-100 border-t border-gray-300 rounded-b shadow-sm max-w-5xl mx-auto left-0 right-0" />
    );
  }
  if (shelfSkin === 'Trophy Case') {
    return (
      <div className="absolute bottom-0 w-full z-0 max-w-5xl mx-auto left-0 right-0">
        <div className="h-4 bg-gradient-to-r from-red-900 via-red-800 to-red-900 border-t-2 border-yellow-500 rounded-b shadow-[0_5px_15px_rgba(0,0,0,0.8)]" />
        <div className="h-1 w-full bg-yellow-400 opacity-50" />
      </div>
    );
  }
  if (shelfSkin === 'Kitchen') {
    return (
      <div className="absolute bottom-0 w-full z-0 max-w-5xl mx-auto left-0 right-0 h-6">
        <div className="h-4 bg-[#fdfbf7] border-t border-[#d8c3a5] border-b border-[#eae1d0] rounded flex overflow-hidden shadow-sm">
          {Array.from({length: 40}).map((_, i) => (
            <div key={i} className="h-full w-4 shrink-0 border-r border-[#d8c3a5]" />
          ))}
        </div>
        <div className="h-2 w-full bg-[#d8c3a5] rounded-b" />
      </div>
    );
  }
  if (shelfSkin === 'Spooky') {
    return (
      <div className="absolute bottom-0 w-full z-0 max-w-5xl mx-auto left-0 right-0 h-4 bg-black border-t-2 border-green-800 rounded-b shadow-[0_0_15px_rgba(0,255,0,0.2)]" />
    );
  }
  // Default Apothecary
  return (
    <div className="absolute bottom-0 w-full z-0">
      <div className="h-[12px] sm:h-[16px] bg-gradient-to-b from-[#2a1b12] to-[#1a110b] border-t-2 border-[#4a3219] w-full max-w-5xl mx-auto shadow-[0_-2px_10px_rgba(0,0,0,0.8)] relative rounded-[2px]" />
      <div className="h-[8px] sm:h-[12px] bg-[#140d08] w-[98%] max-w-[980px] mx-auto rounded-b-md shadow-[0_5px_15px_rgba(0,0,0,0.9)]" />
    </div>
  );
};
`;

content = content.replace(shelfBaseTarget, renderShelfBase + '\\n{/* Deep Wood Apothecary Shelf Base */}');

const oldShelfBase = `<div className="absolute bottom-0 w-full z-0">
                      <div className="h-[12px] sm:h-[16px] bg-gradient-to-b from-[#2a1b12] to-[#1a110b] border-t-2 border-[#4a3219] w-full max-w-5xl mx-auto shadow-[0_-2px_10px_rgba(0,0,0,0.8)] relative rounded-[2px]">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20" />
                      </div>
                      <div className="h-[8px] sm:h-[12px] bg-[#140d08] w-[98%] max-w-[980px] mx-auto rounded-b-md shadow-[0_5px_15px_rgba(0,0,0,0.9)]" />
                    </div>`;

content = content.replace(oldShelfBase, `{renderShelfBase()}`);

fs.writeFileSync('src/components/MyLibrary.tsx', content);
