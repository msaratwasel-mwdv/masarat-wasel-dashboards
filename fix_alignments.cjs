const fs = require('fs');
const path = 'resources/js/Pages/School/Attendance/AttendanceReports.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix Search Input Icon position and padding
content = content.replace(/className={`w-4 h-4 absolute top-3.5 left-4 text-gray-400`}/g, 'className={`w-4 h-4 absolute top-3.5 ${isRtl ? \'right-4\' : \'left-4\'} text-gray-400`}');
content = content.replace(/className={`\${DS_inputCls} pl-11`}/g, 'className={`${DS_inputCls} ${isRtl ? \'pr-11\' : \'pl-11\'}`}');

// 2. Remove custom arrow from Date inputs (they have native icons that might clash)
// We'll target type="date" inputs that have the custom style
content = content.replace(/<input type="date"([^>]+)className={`\${DS_inputCls} appearance-none rtl:pl-12 ltr:pr-12`} style={{ backgroundImage: "url\('[^']+'\)", backgroundRepeat: "no-repeat", backgroundPosition: isRtl \? "left 1rem center" : "right 1rem center", backgroundSize: "1em" }}/g, '<input type="date"$1className={DS_inputCls}');

// 3. Ensure the found entity avatar doesn't flip weirdly
// The current code is flex-col md:flex-row, which is fine as it uses native dir.

// 4. Double check the Stats cards in LTR
// DS_statCard in DS.ts uses gap-4 and is flex-row by default. 
// In RTL, we might want to ensure they look good.
// Currently they are: <div className={DS_statCard('blue')}>...</div>

// 5. Fix any remaining hardcoded alignments
content = content.replace(/text-start/g, 'text-start'); // text-start is logical, leave it
content = content.replace(/text-end/g, 'text-end'); // text-end is logical, leave it

fs.writeFileSync(path, content);
console.log('Done!');
