const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const getDecorForSlotTarget = `const getDecorForSlot = (shelfIdx: number, salt: number) => {`;
const getDecorForSlotReplacement = `const getDecorForSlot = (shelfIdx: number, salt: number) => {
    if (shelfSkin === 'Plain') return null;
    
    if (shelfSkin === 'Spooky') {
      const assets = [
        {
          type: 'skull',
          name: 'Glowing Skull',
          element: (
            <div key={\`skull-\${shelfIdx}-\${salt}\`} className="flex flex-col items-center justify-end h-[60px] w-[50px] shrink-0 self-end px-1 relative group select-none transition-transform hover:-translate-y-1">
               <div className="w-8 h-8 bg-green-950 rounded-full border border-green-800 shadow-[0_0_10px_rgba(0,255,0,0.3)] relative overflow-hidden">
                 <div className="absolute top-2 left-1.5 w-2 h-2 bg-black rounded-full shadow-[0_0_5px_rgba(0,255,0,0.8)]" />
                 <div className="absolute top-2 right-1.5 w-2 h-2 bg-black rounded-full shadow-[0_0_5px_rgba(0,255,0,0.8)]" />
                 <div className="absolute bottom-1 left-2 w-4 h-1.5 bg-black rounded-sm" />
               </div>
            </div>
          )
        },
        {
          type: 'spider',
          name: 'Spider',
          element: (
            <div key={\`spider-\${shelfIdx}-\${salt}\`} className="flex flex-col items-center justify-end h-[40px] w-[40px] shrink-0 self-end relative group select-none transition-transform hover:-translate-y-1">
               <div className="w-4 h-4 bg-black rounded-full relative">
                 <div className="absolute -left-3 top-0 w-3 h-px bg-black rotate-45" />
                 <div className="absolute -right-3 top-0 w-3 h-px bg-black -rotate-45" />
                 <div className="absolute -left-3 bottom-0 w-3 h-px bg-black -rotate-45" />
                 <div className="absolute -right-3 bottom-0 w-3 h-px bg-black rotate-45" />
                 <div className="absolute top-1 left-0.5 w-1 h-1 bg-red-600 rounded-full shadow-[0_0_3px_red]" />
                 <div className="absolute top-1 right-0.5 w-1 h-1 bg-red-600 rounded-full shadow-[0_0_3px_red]" />
               </div>
            </div>
          )
        }
      ];
      return assets[(shelfIdx + salt) % assets.length].element;
    }
    
    if (shelfSkin === 'Kitchen') {
      const assets = [
        {
          type: 'spice',
          name: 'Spice Jar',
          element: (
            <div key={\`spice-\${shelfIdx}-\${salt}\`} className="flex flex-col items-center justify-end h-[60px] w-[35px] shrink-0 self-end relative group select-none transition-transform hover:-translate-y-1">
               <div className="w-5 h-2 bg-[#8c7365] rounded-t-sm" />
               <div className="w-7 h-10 bg-white/80 rounded-b-sm border border-[#e5dfd8] relative overflow-hidden flex items-center justify-center">
                 <div className="absolute bottom-0 w-full h-1/2 bg-[#cd853f]/80" />
                 <div className="w-5 h-3 bg-white border border-[#e5dfd8] rounded-sm z-10 text-[4px] flex items-center justify-center font-serif text-black">BASIL</div>
               </div>
            </div>
          )
        },
        {
          type: 'plant',
          name: 'Rosemary Pot',
          element: (
            <div key={\`rosemary-\${shelfIdx}-\${salt}\`} className="flex flex-col items-center justify-end h-[80px] w-[50px] shrink-0 self-end relative group select-none transition-transform hover:-translate-y-1">
               <div className="flex gap-0.5 items-end justify-center">
                  <div className="w-1 h-12 bg-green-600 rounded-full rotate-[-15deg] origin-bottom shadow-sm" />
                  <div className="w-1 h-14 bg-green-700 rounded-full z-10 shadow-sm" />
                  <div className="w-1 h-10 bg-green-500 rounded-full rotate-[15deg] origin-bottom shadow-sm" />
               </div>
               <div className="w-8 h-6 bg-[#d2691e] rounded-b-md border-t-2 border-[#a0522d] shadow-sm z-20" />
            </div>
          )
        }
      ];
      return assets[(shelfIdx + salt) % assets.length].element;
    }
    
    if (shelfSkin === 'Trophy Case') {
      const assets = [
        {
          type: 'trophy',
          name: 'Golden Cup',
          element: (
            <div key={\`trophy-\${shelfIdx}-\${salt}\`} className="flex flex-col items-center justify-end h-[80px] w-[50px] shrink-0 self-end relative group select-none transition-transform hover:-translate-y-1">
               <div className="w-10 h-8 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-b-full border border-yellow-700 shadow-[0_0_15px_rgba(255,215,0,0.3)] relative">
                 <div className="absolute -left-2 top-0 w-3 h-4 border-2 border-yellow-500 rounded-l-full" />
                 <div className="absolute -right-2 top-0 w-3 h-4 border-2 border-yellow-500 rounded-r-full" />
               </div>
               <div className="w-2 h-4 bg-yellow-600" />
               <div className="w-8 h-3 bg-gradient-to-b from-gray-700 to-gray-900 rounded-t-sm border border-gray-600" />
            </div>
          )
        },
        {
          type: 'plaque',
          name: 'Display Plaque',
          element: (
            <div key={\`plaque-\${shelfIdx}-\${salt}\`} className="flex flex-col items-center justify-end h-[50px] w-[40px] shrink-0 self-end relative group select-none transition-transform hover:-translate-y-1 pb-1">
               <div className="w-full h-8 bg-gradient-to-br from-amber-800 to-amber-950 rounded-sm border border-amber-900 p-1 shadow-md flex items-center justify-center relative">
                 <div className="w-full h-full border border-amber-700/50 flex flex-col items-center justify-center">
                   <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_5px_yellow] mb-0.5" />
                   <div className="w-6 h-0.5 bg-yellow-600/50 rounded-full" />
                 </div>
               </div>
            </div>
          )
        }
      ];
      return assets[(shelfIdx + salt) % assets.length].element;
    }
`;

content = content.replace(getDecorForSlotTarget, getDecorForSlotTarget + '\n' + getDecorForSlotReplacement.split('\n').slice(1).join('\n'));

fs.writeFileSync('src/components/MyLibrary.tsx', content);
