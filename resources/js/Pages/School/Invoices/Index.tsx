import React from 'react';
import { Head, Link } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { FileText, Download } from 'lucide-react';

export default function InvoicesIndex({ invoices }: { invoices: any[] }) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <SchoolAuthenticatedLayout>
            <Head title={isRTL ? "الفواتير والإدارة المالية" : "Invoices"} />
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#0f2044] p-6 md:p-8 rounded-[32px] shadow-2xl border border-[#f5b800]/10">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white mb-2">{isRTL ? "الفواتير والإدارة المالية" : "Invoices"}</h1>
                        <p className="text-[#f5b800] text-sm font-bold uppercase tracking-widest">{isRTL ? "سجل فواتير الاشتراكات الخاصة بك" : "Your Subscription Invoices Log"}</p>
                    </div>
                </div>

                <div className={`p-6 md:p-8 rounded-[32px] shadow-xl overflow-hidden border ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white border-slate-100'}`}>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400 border-b border-slate-700/50' : 'text-slate-500 border-b border-slate-100'}`}>
                                    <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'رقم الفاتورة' : 'Invoice #'}</th>
                                    <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'المبلغ الإجمالي' : 'Total Amount'}</th>
                                    <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'المدفوع' : 'Paid Amount'}</th>
                                    <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'الحالة' : 'Status'}</th>
                                    <th className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => {
                                    const totalPaid = invoice.transactions.reduce((s:number, t:any) => s + Number(t.amount), 0);
                                    const isFullyPaid = invoice.status === 'paid' || totalPaid >= Number(invoice.total_amount);
                                    return (
                                        <tr key={invoice.id} className={`border-b last:border-0 transition-colors ${isDark ? 'border-slate-700/50 hover:bg-slate-800' : 'border-slate-100 hover:bg-slate-50'}`}>
                                            <td className={`p-4 font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'} ${isRTL ? 'text-right' : 'text-left'}`}>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-[#f5b800]" />
                                                    INV-{invoice.id.toString().padStart(6, '0')}
                                                </div>
                                            </td>
                                            <td className={`p-4 font-black text-lg text-[#f5b800] ${isRTL ? 'text-right' : 'text-left'}`}>{invoice.total_amount} <span className="text-xs">ريال</span></td>
                                            <td className={`p-4 font-bold text-emerald-500 ${isRTL ? 'text-right' : 'text-left'}`}>{totalPaid} <span className="text-xs">ريال</span></td>
                                            <td className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                                                <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black inline-block mt-1 ${
                                                    isFullyPaid ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                                                    invoice.status === 'partially_paid' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                                                    'bg-red-500/10 text-red-500 border border-red-500/20'
                                                }`}>
                                                    {isFullyPaid ? (isRTL ? 'مدفوعة' : 'Paid') : (isRTL ? 'غير مدفوعة / مستحقة' : 'Unpaid / Due')}
                                                </span>
                                            </td>
                                            <td className={`p-4 font-mono text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} ${isRTL ? 'text-right' : 'text-left'}`}>{invoice.due_date}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {invoices.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-[#0f2044]/5 flex items-center justify-center rounded-full mx-auto mb-4">
                                <FileText className="w-10 h-10 text-[#0f2044]/20 dark:text-white/10" />
                            </div>
                            <p className="font-bold text-slate-500 text-sm uppercase tracking-widest">{isRTL ? "لا توجد فواتير خاصة بك حتى الآن" : "No invoices found for your school yet"}</p>
                        </div>
                    )}
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
