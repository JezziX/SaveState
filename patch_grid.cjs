const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const target1 = `{!isBatchMode && (
                            <button
                              onClick={() => {
                                setQuoteEntryBookId(book.id);
                                setEnteredQuoteText('');
                              }}
                              className="p-1 px-1.5 bg-[#0f0e12] hover:bg-[#beb7dc]/15 text-[#beb7dc] hover:text-[#c8b9ff] border border-neutral-800 rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                              title="Instantly add Quote Snippet"
                            >
                              <Quote size={10} />
                            </button>
                          )}`;

const replacement1 = `{!isBatchMode && (
                            <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickSaveId(book.id);
                                setQuickSaveData({ milestone: '', notes: '' });
                              }}
                              className="p-1 px-1.5 bg-[#0f0e12] hover:bg-brand-purple/20 text-brand-turquoise hover:text-brand-purple border border-neutral-800 rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                              title="Quick Save Progress"
                            >
                              <Save size={10} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuoteEntryBookId(book.id);
                                setEnteredQuoteText('');
                              }}
                              className="p-1 px-1.5 bg-[#0f0e12] hover:bg-[#beb7dc]/15 text-[#beb7dc] hover:text-[#c8b9ff] border border-neutral-800 rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                              title="Instantly add Quote Snippet"
                            >
                              <Quote size={10} />
                            </button>
                            </>
                          )}`;

content = content.replace(target1, replacement1);

// Add quick save overlay
const target2 = `{/* Interactive shortcuts - Quote Entry button & delete */}`;
const replacement2 = `
                      {quickSaveId === book.id && (
                        <div className="absolute inset-0 bg-app-base/95 backdrop-blur z-30 p-2 flex flex-col rounded-lg border border-brand-purple" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider">Quick Save</span>
                            <button onClick={() => setQuickSaveId(null)} className="text-gray-500 hover:text-white cursor-pointer"><X size={12} /></button>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Milestone (e.g. Ch. 14)"
                            value={quickSaveData.milestone}
                            onChange={e => setQuickSaveData({...quickSaveData, milestone: e.target.value})}
                            className="w-full bg-black/50 border border-app-border rounded px-2 py-1 text-[10px] text-white mb-1 focus:outline-none focus:border-brand-purple"
                          />
                          <textarea 
                            placeholder="Brain drop / notes..."
                            value={quickSaveData.notes}
                            onChange={e => setQuickSaveData({...quickSaveData, notes: e.target.value})}
                            className="w-full flex-1 bg-black/50 border border-app-border rounded px-2 py-1 text-[10px] text-white mb-1 focus:outline-none focus:border-brand-purple resize-none"
                          />
                          <button 
                            onClick={() => handleQuickSave(book.id)}
                            className="w-full bg-brand-purple text-[#340F04] font-bold text-[10px] py-1 rounded cursor-pointer hover:bg-white"
                          >
                            Save Point
                          </button>
                        </div>
                      )}
                      
                      {/* Interactive shortcuts - Quote Entry button & delete */}`;

content = content.replace(target2, replacement2);

fs.writeFileSync('src/components/MyLibrary.tsx', content);
