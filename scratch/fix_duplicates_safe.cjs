const fs = require('fs');
const path = 'resources/js/hooks/useTranslation.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
const keys = new Set();
const newLines = [];
let inDict = false;
let removedCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('const dictionary = {')) {
    inDict = true;
    newLines.push(line);
    continue;
  }
  
  if (inDict) {
    if (line.includes('} as Record')) {
      inDict = false;
      newLines.push(line);
      continue;
    }
    
    // Match ONLY top-level keys (2 spaces indentation)
    // Note: Use \r?\n and handle whitespace carefully.
    const match = line.match(/^  ["']?([^"':]+)["']?\s*:/);
    if (match) {
      const key = match[1].trim();
      if (keys.has(key)) {
        console.log(`Removing duplicate key: ${key} at line ${i + 1}`);
        removedCount++;
        // Skip until the end of this object
        let j = i;
        if (!line.includes('},')) {
          while (j < lines.length && !lines[j].includes('},')) {
            j++;
          }
        }
        i = j;
        continue;
      }
      keys.add(key);
    }
  }
  newLines.push(line);
}

if (removedCount > 0) {
  fs.writeFileSync(path, newLines.join('\n'));
  console.log(`Successfully removed ${removedCount} duplicate top-level keys.`);
} else {
  console.log('No duplicate top-level keys found.');
}
