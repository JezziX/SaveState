const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
console.log(content.split('\n').slice(0, 50).join('\n'));
