const fs = require('fs');
let content = fs.readFileSync('src/components/CommunityFeed.tsx', 'utf8');

const typeTarget = `type: 'review' | 'completed' | 'active';`;
if (content.indexOf(typeTarget) !== -1) {
    // The type is imported from types, we should check src/types.ts
}
