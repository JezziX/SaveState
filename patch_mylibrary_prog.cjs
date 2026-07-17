const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const target = `<div className="pt-0.5">{getStatusBadge(status)}</div>`;
const replacement = `<div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {getStatusBadge(status)}
                          {(book.currentProgress || book.totalLength || book.pages) && (
                            <span className="text-[9px] text-brand-purple/70 font-mono tracking-wider font-bold">
                              {book.currentProgress ? \`\${book.currentProgress} / \${book.totalLength || book.pages || '?'}\` : \`\${book.totalLength || book.pages} Total\`}
                            </span>
                          )}
                        </div>`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/MyLibrary.tsx', content);
