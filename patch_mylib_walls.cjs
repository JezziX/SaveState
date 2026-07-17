const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const wallTarget = `{/* Strange Antiquities Floating Wall Decor (Scrolls, Amulets, Dried Herbs) */}
                  <div className="absolute top-0 bottom-0 left-0 right-0 max-w-5xl mx-auto pointer-events-none z-0">
                    {/* Dried Herbs Bundle */}
                    {shelfIdx % 2 === 0 && (`;
const wallReplacement = `{shelfSkin === 'Apothecary' && (
                  <div className="absolute top-0 bottom-0 left-0 right-0 max-w-5xl mx-auto pointer-events-none z-0">
                    {/* Dried Herbs Bundle */}
                    {shelfIdx % 2 === 0 && (`;

content = content.replace(wallTarget, wallReplacement);

const amuEndTarget = `</div>
                    )}
                  </div>
                  {/* Book Spines container aligned layout */}`;
const amuEndReplacement = `</div>
                    )}
                  </div>
                  )}

                  {shelfSkin === 'Spooky' && (
                    <div className="absolute top-0 bottom-0 left-0 right-0 max-w-5xl mx-auto pointer-events-none z-0 overflow-hidden">
                      {/* Cobwebs */}
                      {shelfIdx % 2 === 0 && (
                        <div className="absolute -top-2 left-[5%] w-16 h-16 border-t-2 border-l-2 border-green-500/20 rounded-tl-full opacity-50" />
                      )}
                      {/* Slime drip */}
                      {shelfIdx % 2 !== 0 && (
                        <div className="absolute top-0 right-[20%] flex gap-1 opacity-70 drop-shadow-[0_0_5px_lime]">
                          <div className="w-1.5 h-8 bg-green-500 rounded-b-full" />
                          <div className="w-2 h-12 bg-green-400 rounded-b-full" />
                          <div className="w-1 h-5 bg-green-600 rounded-b-full" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Book Spines container aligned layout */}`;
content = content.replace(amuEndTarget, amuEndReplacement);

fs.writeFileSync('src/components/MyLibrary.tsx', content);
