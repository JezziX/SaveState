const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');
console.log(content);
