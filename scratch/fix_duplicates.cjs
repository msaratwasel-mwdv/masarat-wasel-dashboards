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
    
    // Match keys like "Key": or Key:
    const match = line.match(/^\s+["']?([^"':]+)["']?\s*:/);
    if (match) {
      const key = match[1].trim();
      if (keys.has(key)) {
        console.log(`Removing duplicate key: ${key} at line ${i + 1}`);
        removedCount++;
        // Skip this line and its object until next key or end of dict
        // For simplicity, just skip this single line if it's a one-liner
        // but translations are often multi-line.
        // Actually, the duplicates I saw are all one-liners like:
        // "Key": { ar: "...", en: "..." },
        if (line.trim().endsWith('},')) {
           continue;
        } else {
           // Handle multi-line if needed, but let's see.
           // In this file, most are one-liners.
           // If it's multi-line, we need to skip until the closing },
           let j = i;
           while (j < lines.length && !lines[j].includes('},')) {
             j++;
           }
           i = j;
           continue;
        }
      }
      keys.add(key);
    }
  }
  newLines.push(line);
}

if (removedCount > 0) {
  fs.writeFileSync(path, newLines.join('\n'));
  console.log(`Successfully removed ${removedCount} duplicate keys.`);
} else {
  console.log('No duplicate keys found.');
}
