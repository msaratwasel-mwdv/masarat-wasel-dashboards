import React, { useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import PrintReportHeader from '@/Components/PrintReportHeader';

interface Column {
    key: string;
    label_ar: string;
    label_en: string;
    mono?: boolean;
    bold?: boolean;
}

interface Props {
    title_ar: string;
    title_en: string;
    subtitle_ar: string;
    subtitle_en: string;
    columns: Column[];
    data: Record<string, any>[];
    printDate: string;
    isRTL: boolean;
    totalLabel_ar?: string;
    totalLabel_en?: string;
}

export default function SharedPrintReport({
    title_ar,
    title_en,
    subtitle_ar,
    subtitle_en,
    columns,
    data,
    printDate,
    isRTL,
    totalLabel_ar = "إجمالي الكادر",
    totalLabel_en = "Total Force",
}: Props) {
    useEffect(() => {
        // Auto-trigger print dialog after a short delay
        const timer = setTimeout(() => window.print(), 600);
        return () => clearTimeout(timer);
    }, []);

    const title = isRTL ? title_ar : title_en;
    const subtitle = isRTL ? subtitle_ar : subtitle_en;
    const dateStr = `${isRTL ? "تاريخ الطباعة" : "Print Date"}: ${new Date(printDate).toLocaleDateString(isRTL ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}`;

    // Resolve nested keys like 'driver.license_number'
    const resolveValue = (row: Record<string, any>, key: string): string => {
        if (key === 'name') {
            if (isRTL) {
                return row.name || row.name_en || "غير محدد";
            } else {
                return row.name_en || row.name || "—";
            }
        }
        if (key === 'preferred_language') {
            const val = row[key];
            if (val === 'ar') return isRTL ? "العربية" : "Arabic";
            if (val === 'en') return isRTL ? "الإنجليزية" : "English";
            return val || (isRTL ? "غير محدد" : "—");
        }
        const keys = key.split('.');
        let value: any = row;
        for (const k of keys) {
            if (value === null || value === undefined) return isRTL ? "غير محدد" : "—";
            value = value[k];
        }
        return value !== null && value !== undefined ? String(value) : (isRTL ? "غير محدد" : "—");
    };

    return (
        <div className="bg-white min-h-screen font-sans text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
            <Head title={title} />
            <style>{`
                @media print {
                    @page { margin: 15mm; size: A4 portrait; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    body * { visibility: visible !important; }
                }
                @media screen {
                    body { background: #f0f0f0; }
                }
            `}</style>

            {/* Reuse the exact same PrintReportHeader used across all modules */}
            <PrintReportHeader
                title={title}
                schoolName={subtitle}
                schoolLogo={null}
                printDate={dateStr}
                schoolAdminText={isRTL ? "إدارة الشركة" : "Company Admin"}
            />

            {/* Table - matching the exact inline print table styles */}
            <div className="px-4">
                <table className="w-full border-collapse border border-gray-300 text-[10px]">
                    <thead>
                        <tr className="bg-gray-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                            <th className={`border border-gray-300 p-1.5 font-bold w-8 text-black ${isRTL ? "text-right" : "text-left"}`}>#</th>
                            {columns.map((col, i) => (
                                <th key={i} className={`border border-gray-300 p-1.5 font-bold text-black ${isRTL ? "text-right" : "text-left"}`}>
                                    {isRTL ? col.label_ar : col.label_en}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-gray-300">
                                <td className="border border-gray-300 p-1.5 text-center text-gray-700">{rowIndex + 1}</td>
                                {columns.map((col, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`border border-gray-300 p-1.5 text-gray-700 ${col.bold ? 'font-bold text-gray-900' : ''} ${col.mono ? 'font-mono' : ''}`}
                                    >
                                        {resolveValue(row, col.key)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer - matching the exact inline print footer */}
                <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
                    <p>{isRTL ? totalLabel_ar : totalLabel_en}: {data.length}</p>
                    <p>{isRTL ? "التوقيع الرسمي" : "Official Signature"}: ............................</p>
                </div>
            </div>
        </div>
    );
}
