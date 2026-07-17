const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(`status: 'to-read' | 'reading' | 'completed' | 'dnf';`, `status: 'backlog' | 'active' | 'completed' | 'dnf';`);
content = content.replace(`status: 'to-consume' | 'consuming' | 'completed' | 'dnf';`, `status: 'backlog' | 'active' | 'completed' | 'dnf';`);

content += `
export interface SavePoint {
  id: string;
  mediaId: string;
  mediaTitle?: string;
  milestone: string;
  raw_brain_drop: string;
  created_at: string;
}
`;

content = content.replace(`mediaReviews?: MediaReview[];`, `mediaReviews?: MediaReview[];\n  savePoints?: SavePoint[];`);

fs.writeFileSync('src/types.ts', content);
