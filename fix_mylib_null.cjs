const fs = require('fs');
let content = fs.readFileSync('src/components/MyLibrary.tsx', 'utf8');

const target = `const decorElement = showDecorBefore ? getDecorForSlot(shelfIdx, slotIdx + 50).element : null;`;
const replacement = `const decorElement = showDecorBefore ? getDecorForSlot(shelfIdx, slotIdx + 50)?.element : null;`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('src/components/MyLibrary.tsx', content);
    console.log("Fixed null access.");
} else {
    console.log("Target not found!");
}
