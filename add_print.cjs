const fs = require('fs');
const path = 'resources/js/Pages/School/Attendance/AttendanceReports.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Printer to lucide-react imports
if (!content.includes('Printer')) {
    content = content.replace(/import {([^}]+)} from "lucide-react";/, (match, group) => {
        return `import {${group}, Printer} from "lucide-react";`;
    });
}

// 2. Add PrintReportHeader import
if (!content.includes('PrintReportHeader')) {
    content = content.replace(/import { motion, AnimatePresence } from "framer-motion";/, `import { motion, AnimatePresence } from "framer-motion";\nimport PrintReportHeader from "@/Components/PrintReportHeader";`);
}

// 3. Add PRINT_STYLES
const printStyles = `
// Print CSS
const PRINT_STYLES = \`
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
\`;
`;
if (!content.includes('PRINT_STYLES')) {
    content = content.replace(/export default function AttendanceReports\(\) {/, `${printStyles}\nexport default function AttendanceReports() {`);
}

// 4. Add handlePrint
if (!content.includes('const handlePrint = () => window.print();')) {
    content = content.replace(/const getFoundEntity = \(\) => {/, `const handlePrint = () => window.print();\n\n    const getFoundEntity = () => {`);
}

// 5. Add #print-area inside the return
const printArea = `
            <style>{PRINT_STYLES}</style>

            {/* Print Area */}
            <div id="print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRtl ? 'rtl' : 'ltr'}>
                <PrintReportHeader 
                    title={(isRtl ? 'تقرير الحضور اليومي' : 'Daily Attendance Report')}
                    schoolName={auth.user?.school?.name || (isRtl ? 'اسم المدرسة غير متوفر' : 'School name not available')}
                    schoolLogo={auth.user?.school?.logo || null}
                    printDate={\`\${isRtl ? 'تاريخ الطباعة' : 'Print Date'}: \${new Date().toLocaleDateString(isRtl ? "ar-SA" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' })}\`}
                    schoolAdminText={(isRtl ? 'إدارة المدرسة' : 'School Admin')}
                />
                <div className="px-4">
                    <table className="w-full border-collapse border border-gray-300 text-[10px]">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-1.5 text-right font-bold w-8 text-black">#</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{(isRtl ? 'التاريخ' : 'Date')}</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{(isRtl ? 'اسم الطالب' : 'Student Name')}</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{(isRtl ? 'الرقم المدني' : 'Civil ID')}</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{(isRtl ? 'الفصل' : 'Class')}</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{(isRtl ? 'المشرف' : 'Supervisor')}</th>
                                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{(isRtl ? 'الحالة' : 'Status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map((a, i) => (
                                <tr key={a.id} className="border-b border-gray-300">
                                    <td className="border border-gray-300 p-1.5 text-center text-gray-700 font-semibold">{i + 1}</td>
                                    <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{new Date(a.date).toLocaleDateString('en-GB')}</td>
                                    <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{a.student?.full_name || a.student?.name || (isRtl ? 'غير معروف' : 'Unknown')}</td>
                                    <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{a.student?.national_id || a.student?.student_national_id || '-'}</td>
                                    <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{a.classroom?.name || '-'}</td>
                                    <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{a.classroom?.teachers?.[0]?.name || a.classroom?.supervisor?.name || '-'}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">
                                        <span className={\`px-2 py-0.5 rounded text-[9px] font-bold \${a.status === 'present' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}\`}>
                                            {a.status === 'present' ? (isRtl ? 'حاضر' : 'Present') : (isRtl ? 'غائب' : 'Absent')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
                        <p>{(isRtl ? 'إجمالي السجلات' : 'Total Records')}: {stats.total}</p>
                        <p>{(isRtl ? 'توقيع المدير' : 'Principal Signature')}: ............................</p>
                    </div>
                </div>
            </div>
`;
if (!content.includes('id="print-area"')) {
    content = content.replace(/<Head title=\{\(isRtl \? 'تقرير الحضور اليومي' : 'Daily Attendance Report'\)\} \/>/, `<Head title={(isRtl ? 'تقرير الحضور اليومي' : 'Daily Attendance Report')} />\n${printArea}`);
}

// 6. Add Print Button
if (!content.includes('handlePrint')) {
    content = content.replace(/<button onClick=\{openBulkModal\} className=\{DS_btnGold\}>/g, `<button onClick={handlePrint} className={DS_btnSecondary}>
                            <Printer className="w-4 h-4" />
                            {(isRtl ? 'طباعة' : 'Print')}
                        </button>\n                        <button onClick={openBulkModal} className={DS_btnGold}>`);
}

// 7. Fix Select padding and modal height for "Single Record Modal"
content = content.replace(/<form onSubmit=\{handleSubmit\} className=\{DS_modalBody\}>/, `<form onSubmit={handleSubmit} className={\`\${DS_modalBody} min-h-[400px]\`}>`);

// Add custom padding to selects
content = content.replace(/className=\{DS_inputCls\}/g, "className={`${DS_inputCls} px-4 rtl:pl-10 ltr:pr-10`}");

fs.writeFileSync(path, content);
console.log('Done!');
