const fs = require('fs');
const path = 'resources/js/Pages/School/Attendance/AttendanceReports.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Ensure selects have much better padding for the native arrow (the '7' icon)
// We'll replace the previous padding with something more generous for RTL
content = content.replace(/className={`\${DS_inputCls} px-4 rtl:pl-10 ltr:pr-10`}/g, 'className={`${DS_inputCls} appearance-none rtl:pl-12 ltr:pr-12`} style={{ backgroundImage: "url(\'data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22currentColor%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22/%3E%3C/svg%3E\')", backgroundRepeat: "no-repeat", backgroundPosition: isRtl ? "left 1rem center" : "right 1rem center", backgroundSize: "1em" }}');

// 2. Fix the Print button placement once more to be sure it's visible
// I'll look for the header buttons container and ensure it's there
if (!content.includes('handlePrint')) {
    content = content.replace(/<div className="flex flex-col sm:flex-row gap-3">/g, `<div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={handlePrint} className={DS_btnSecondary}>
                            <Printer className="w-4 h-4" />
                            {(isRtl ? 'طباعة' : 'Print')}
                        </button>`);
}

// 3. Fix labels for consistency (always use 'الفصل' for Class)
content = content.replace(/'اختر الفصل'/g, "'الفصل'");

fs.writeFileSync(path, content);
console.log('Done!');
