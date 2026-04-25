const fs = require('fs');
const path = 'resources/js/Pages/School/Attendance/AttendanceReports.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace t('English', 'Arabic') with (isRtl ? 'Arabic' : 'English')
content = content.replace(/t\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/g, "(isRtl ? '$2' : '$1')");

// Replace "National ID" with "Civil ID", "رقم الهوية" with "الرقم المدني"
content = content.replace(/رقم الهوية/g, 'الرقم المدني');
content = content.replace(/National ID/g, 'Civil ID');

fs.writeFileSync(path, content);
console.log('Done!');
