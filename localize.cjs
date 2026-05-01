const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, 'resources', 'js');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(jsDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/\bSAR\b/g, 'OMR');
    content = content.replace(/ر\.س/g, 'ر.ع.');
    
    // For phone defaults +966 to +968
    content = content.replace(/\+966/g, '+968');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${file}`);
    }
});

console.log('Done.');
