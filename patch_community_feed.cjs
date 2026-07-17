const fs = require('fs');
let content = fs.readFileSync('src/components/CommunityFeed.tsx', 'utf8');

const newMock = `  {
    id: 'a4',
    userId: 'u1',
    type: 'save_point',
    bookId: 'b4',
    bookTitle: 'Severance',
    bookAuthor: 'Apple TV+',
    bookCoverUrl: 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?auto=format&fit=crop&q=80&w=200',
    vibeEmoji: '🤯',
    savePointNotes: 'The waffle party scene was absolutely unhinged. I cannot believe what just happened.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
`;
content = content.replace(`export const MOCK_ACTIVITIES: SocialActivity[] = [`, `export const MOCK_ACTIVITIES: SocialActivity[] = [\n${newMock}`);

// Change render to handle spoiler
const typeLabelTarget = `{activity.type === 'review' ? 'Posted Review' : activity.type === 'completed' ? 'Finished Book' : 'Started Reading'}`;
const typeLabelReplacement = `{activity.type === 'save_point' ? 'Saved Progress' : activity.type === 'review' ? 'Posted Review' : activity.type === 'completed' ? 'Finished Item' : 'Started Reading'}`;
content = content.replace(typeLabelTarget, typeLabelReplacement);

// Render the save point
const reviewRenderTarget = `{activity.reviewText && (
                  <p className="text-xs text-[var(--color-text-main)] mt-3 italic border-l-2 border-brand-purple/30 pl-2">
                    "{activity.reviewText}"
                  </p>
                )}`;
const reviewRenderReplacement = `{activity.reviewText && (
                  <p className="text-xs text-[var(--color-text-main)] mt-3 italic border-l-2 border-brand-purple/30 pl-2">
                    "{activity.reviewText}"
                  </p>
                )}
                {activity.type === 'save_point' && activity.savePointNotes && (
                  <div className="mt-3 relative group/spoiler cursor-pointer">
                    <div className="absolute -left-2 -top-2 z-10 bg-black/80 rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-md border border-app-border" title="Current Vibe">
                      {activity.vibeEmoji || '🤔'}
                    </div>
                    <div className="bg-[#111] border border-app-border rounded p-3 text-xs italic text-[var(--color-text-main)] relative overflow-hidden transition-all duration-300">
                      <div className="absolute inset-0 backdrop-blur-md bg-black/60 z-10 flex flex-col items-center justify-center group-hover/spoiler:opacity-0 transition-opacity duration-300">
                        <span className="text-[10px] uppercase font-bold text-brand-purple tracking-widest bg-black/80 px-2 py-1 rounded">Spoiler - Hover to Reveal</span>
                      </div>
                      "{activity.savePointNotes}"
                    </div>
                  </div>
                )}`;
content = content.replace(reviewRenderTarget, reviewRenderReplacement);

fs.writeFileSync('src/components/CommunityFeed.tsx', content);
