import React from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import { useTheme } from '@/Contexts/ThemeContext';

export interface PrintStat {
    label: string;
    value: string | number;
}

export interface SchoolPrintLayoutProps {
    title: string;
    reportId?: string;
    stats?: PrintStat[];
    tableHeaders?: React.ReactNode[];
    tableRows?: React.ReactNode[][];
    children?: React.ReactNode;
    statsStyle?: 'grid' | 'table';
    schoolName?: string;
    schoolLogo?: string;
}

export default function SchoolPrintLayout({
    title,
    reportId,
    stats,
    tableHeaders,
    tableRows,
    children,
    statsStyle = 'grid',
    schoolName,
    schoolLogo
}: SchoolPrintLayoutProps) {
    const { isRTL } = useTheme();

    return (
        <>
        <style dangerouslySetInnerHTML={{ __html: `
            @media print {
                @page { size: A4; margin: 0; }
                body { background: white !important; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }
            }
        ` }} />
        <div className="hidden print:block relative bg-white text-black p-0 w-full" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="p-10 mx-auto w-full max-w-full">
                {/* Header */}
                {/* Header - 3 Columns */}
                <div className="flex items-center justify-between mb-10 pb-8 border-b-2 border-slate-100">
                    {/* Left: Our Company (Masarat Wasel) */}
                    <div className="flex-1 flex flex-col items-start">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-white flex items-center justify-center">
                                <img src="/images/logo2.png" alt="Masarat Wasel" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-[#0f2044] text-base tracking-tighter leading-none">مسارات واصل</span>
                                <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">MASARAT WASEL</span>
                            </div>
                        </div>
                        <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-tight">{isRTL ? "منصة إدارة النقل المدرسي الذكي" : "Smart School Transport Management"}</p>
                    </div>

                    {/* Middle: Report Title & Details */}
                    <div className="flex-[2] text-center px-4">
                        <h1 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">{title}</h1>
                        <div className="flex items-center justify-center gap-3">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 tracking-wider font-mono uppercase">{reportId}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                    </div>

                    {/* Right: Real School Logo & Name */}
                    <div className="flex-1 flex flex-col items-end text-right">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex flex-col items-end">
                                <span className="font-black text-[#0f2044] text-base tracking-tight leading-none">{schoolName || (isRTL ? "اسم المدرسة" : "School Name")}</span>
                            </div>
                            <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 p-1">
                                {schoolLogo ? (
                                    <img src={schoolLogo} alt={schoolName} className="w-full h-full object-contain" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg text-[8px] text-slate-300 font-black tracking-widest">LOGO</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid or Table */}
                {stats && stats.length > 0 && (
                    statsStyle === 'grid' ? (
                        <div className={`grid grid-cols-${Math.min(stats.length, 6)} gap-4 mb-8`}>
                            {stats.map((stat, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl" style={{ backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mb-8 overflow-hidden rounded-xl border border-slate-300">
                            <table className="w-full text-center border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-300" style={{ backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                    <tr>
                                        {stats.map((stat, idx) => (
                                            <th key={idx} className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-x border-slate-300 first:border-l-0 last:border-r-0">
                                                {stat.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {stats.map((stat, idx) => (
                                            <td key={idx} className="px-3 py-3 text-sm font-bold text-slate-800 border-x border-slate-300 first:border-l-0 last:border-r-0">
                                                {stat.value}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {/* Table Data */}
                {tableHeaders && tableRows && tableRows.length > 0 && (
                    <div className="mb-10 overflow-x-visible">
                        <table className="w-full text-[10px] text-left border-collapse border border-slate-300" dir={isRTL ? 'rtl' : 'ltr'}>
                            <thead className="bg-slate-100 text-slate-700" style={{ backgroundColor: '#f1f5f9', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <tr>
                                    {tableHeaders.map((header, idx) => (
                                        <th key={idx} className={`px-4 py-3 border border-slate-300 font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableRows.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="border-b border-slate-300">
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} className="px-4 py-3 border border-slate-300 text-slate-800">
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Custom Content */}
                {children}

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 mt-20 text-center" style={{ pageBreakInside: 'avoid' }}>
                    <div>
                        <p className="font-bold text-slate-800 border-b border-slate-300 pb-2 mb-8 mx-12">
                            {isRTL ? "اعتماد إدارة المدرسة" : "School Administration"}
                        </p>
                        <div className="h-16" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 border-b border-slate-300 pb-2 mb-8 mx-12">
                            {isRTL ? "مدير النقل والمشرف العام" : "Transport Manager"}
                        </p>
                        <div className="h-16" />
                    </div>
                </div>

                <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                    <p>هذا التقرير مُصدر آلياً من نظام مسارات واصل لإدارة النقل المدرسي الذكي.</p>
                    <p>This report is automatically generated by Masarat Wasel Smart School Transport System.</p>
                </div>
            </div>
        </div>
        </>
    );
}
