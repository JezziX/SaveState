const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const t = `<h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider mb-1">Grid-Level Quote Transcription</h3>
                <p className="text-[10px] text-[var(--color-text-muted)] mb-3">Add a memorable quote snippet directly to {books.find(b => b.id === quoteEntryBookId)?.title}</p>
                
                <textarea
                  value={enteredQuoteText}
                  onChange={(e) => setEnteredQuoteText(e.target.value)}
                  placeholder="Paste or write the quote snippet here..."`;

const r = `<h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider mb-3">Add Quote</h3>
                
                <textarea
                  value={enteredQuoteText}
                  onChange={(e) => setEnteredQuoteText(e.target.value)}
                  placeholder="Enter quote..."`;

content = content.replace(t, r);
fs.writeFileSync('src/components/MyLibrary.tsx', content);
