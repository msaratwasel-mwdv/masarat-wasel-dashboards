import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Receipt, Calendar, CreditCard, ChevronRight, Hash, School, Wallet } from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';

export default function TransactionsIndex({ transactions }: any) {
    const { isRTL } = useTheme();

    return (
        <AuthenticatedLayout 
            header={<h2 className="text-xl font-bold text-slate-800">{isRTL ? 'تاريخ المعاملات المالية' : 'Financial Transactions History'}</h2>}
        >
            <Head title={isRTL ? "المعاملات المالية" : "Financial Transactions"} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-2xl border border-slate-100">
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-brand-navy/5 rounded-xl text-brand-navy">
                                    <Receipt size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">{isRTL ? 'التحصيل والسدادات' : 'Collections & Payments'}</h3>
                                    <p className="text-sm text-slate-400 font-bold">{isRTL ? 'سجل بجميع المبالغ المحصلة من المدارس' : 'Log of all amounts collected from schools'}</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full whitespace-nowrap text-right">
                                    <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-widest">
                                        <tr className={isRTL ? 'text-right' : 'text-left'}>
                                            <th className={`px-6 py-4 ${isRTL ? 'rounded-r-xl' : 'rounded-l-xl'}`}>{isRTL ? 'المدرسة' : 'School'}</th>
                                            <th className="px-6 py-4">{isRTL ? 'المبلغ' : 'Amount'}</th>
                                            <th className="px-6 py-4">{isRTL ? 'طريقة الدفع' : 'Method'}</th>
                                            <th className="px-6 py-4">{isRTL ? 'مرجع الدفع' : 'Reference'}</th>
                                            <th className="px-6 py-4">{isRTL ? 'التاريخ' : 'Date'}</th>
                                            <th className="px-6 py-4">{isRTL ? 'الأقساط المغطاة' : 'Covered Installments'}</th>
                                            <th className={`px-6 py-4 ${isRTL ? 'rounded-l-xl' : 'rounded-r-xl'}`}></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {transactions.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-20">
                                                    <div className="flex flex-col items-center gap-2 text-slate-300">
                                                        <Hash size={48} />
                                                        <span className="font-bold">{isRTL ? 'لا توجد معاملات بعد' : 'No transactions found yet'}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : transactions.data.map((tx: any) => (
                                            <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                                                            {tx.school?.name?.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-slate-700 text-sm">{tx.school?.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: #{tx.school_id}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 font-black text-emerald-600 text-lg">
                                                    ${parseFloat(tx.amount).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max">
                                                        <CreditCard size={12} /> {isRTL ? tx.payment_method : tx.payment_method}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 font-mono text-xs text-slate-500 font-bold">
                                                    {tx.reference_number || '-'}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-600">{new Date(tx.paid_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                        <span className="text-[10px] text-slate-400">{new Date(tx.paid_at).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap gap-1">
                                                        {tx.installment_payments?.map((ip: any) => (
                                                            <div key={ip.id} className="px-2 py-0.5 bg-brand-navy/5 text-brand-navy rounded text-[10px] font-bold border border-brand-navy/10">
                                                                #{ip.installment?.installment_number} (${parseFloat(ip.amount)})
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-left">
                                                    <Link 
                                                        href={route('admin.installments.index', { school_id: tx.school_id })}
                                                        className="text-slate-300 group-hover:text-brand-navy transition-colors"
                                                    >
                                                        <ChevronRight size={20} className={isRTL ? 'rotate-180' : ''} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Placeholder */}
                            {transactions.last_page > 1 && (
                                <div className="mt-8 flex justify-center gap-2">
                                    {transactions.links.map((link: any, i: number) => (
                                        <Link
                                            key={i}
                                            href={link.url || '#'}
                                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                                link.active 
                                                ? 'bg-brand-navy text-white shadow-lg shadow-brand-navy/20' 
                                                : link.url 
                                                ? 'bg-white text-slate-400 hover:bg-slate-50' 
                                                : 'text-slate-200 cursor-default'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
