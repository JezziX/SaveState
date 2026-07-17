const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('src/**/*.{ts,tsx}');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace literal status strings
  content = content.replace(/'to-read'/g, "'backlog'");
  content = content.replace(/"to-read"/g, '"backlog"');
  
  // For 'reading', we only want to replace it when it's used as a status
  // Specifically: 'reading' | 'completed' | 'dnf'
  // Or: case 'reading':
  // Or: === 'reading'
  // Or: !== 'reading'
  // Let's just use regex for 'reading' surrounded by quotes, but carefully.
  content = content.replace(/'reading'/g, "'active'");
  content = content.replace(/"reading"/g, '"active"');
  
  content = content.replace(/'to-consume'/g, "'backlog'");
  content = content.replace(/"to-consume"/g, '"backlog"');
  content = content.replace(/'consuming'/g, "'active'");
  content = content.replace(/"consuming"/g, '"active"');

  // But 'reading' is used in things like "reading legacy" or "readingLogs"?
  // Wait, I replaced "'reading'", so reading logs wouldn't be affected unless they are string literals like 'readingLogs'.
  // Let's revert "'reading'" to "'reading'" if it was part of an object key or something? No, it's usually unquoted.
  
  if (content !== original) {
    fs.writeFileSync(file, content);
  }
});
