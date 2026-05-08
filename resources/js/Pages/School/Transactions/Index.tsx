import React from 'react';
import { Head } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import { Receipt, CreditCard, Hash, Wallet, Calendar, ArrowRightLeft } from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';

export default function TransactionsIndex({ billingData }: any) {
    const { isRTL } = useTheme();
    const transactions = billingData.transactions || [];
    const { current_plan, total_owed, total_paid } = billingData;

    return (
        <SchoolAuthenticatedLayout 
            header={<h2 className="text-xl font-bold text-slate-800">{isRTL ? 'سجل المعاملات المالية' : 'Financial Transactions History'}</h2>}
        >
            <Head title={isRTL ? "المعاملات المالية" : "Financial Transactions"} />

            <div className="py-6 space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'إجمالي المدفوع' : 'Total Paid'}</p>
                                <p className="text-2xl font-black text-slate-800">{current_plan?.currency || '$'}{parseFloat(total_paid).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                <ArrowRightLeft size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'المبالغ المتبقية' : 'Outstanding Balance'}</p>
                                <p className="text-2xl font-black text-slate-800">{current_plan?.currency || '$'}{parseFloat(total_owed).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <Receipt size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isRTL ? 'عدد المعاملات' : 'Transactions Count'}</p>
                                <p className="text-2xl font-black text-slate-800">{transactions.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm rounded-3xl border border-slate-100">
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-brand-navy/5 rounded-xl text-brand-navy">
                                <Receipt size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">{isRTL ? 'عمليات السداد' : 'Payment History'}</h3>
                                <p className="text-sm text-slate-400 font-bold">{isRTL ? 'قائمة بجميع المبالغ التي تم دفعها والاشتراكات المغطاة' : 'List of all amounts paid and covered installments'}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-widest">
                                    <tr className={isRTL ? 'text-right' : 'text-left'}>
                                        <th className={`px-6 py-4 ${isRTL ? 'rounded-r-xl' : 'rounded-l-xl'}`}>{isRTL ? 'رقم المعاملة' : 'Transaction ID'}</th>
                                        <th className="px-6 py-4">{isRTL ? 'المبلغ' : 'Amount'}</th>
                                        <th className="px-6 py-4">{isRTL ? 'طريقة الدفع' : 'Method'}</th>
                                        <th className="px-6 py-4">{isRTL ? 'المرجع' : 'Reference'}</th>
                                        <th className="px-6 py-4">{isRTL ? 'التاريخ' : 'Date'}</th>
                                        <th className={`px-6 py-4 ${isRTL ? 'rounded-l-xl' : 'rounded-r-xl'}`}>{isRTL ? 'التفاصيل' : 'Details'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-20">
                                                <div className="flex flex-col items-center gap-2 text-slate-300">
                                                    <Hash size={48} />
                                                    <span className="font-bold">{isRTL ? 'لا توجد معاملات مسجلة بعد' : 'No transactions recorded yet'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : transactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-5">
                                                <span className="font-mono text-xs font-black text-slate-400">#TRX-{tx.id}</span>
                                            </td>
                                            <td className={`px-6 py-5 font-black text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                                                <span className="text-emerald-600">{current_plan?.currency || '$'}{parseFloat(tx.amount).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                                                    <CreditCard size={12} /> {tx.payment_method}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 font-mono text-xs text-slate-500 font-bold">
                                                {tx.reference_number || '-'}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-600">
                                                        {new Date(tx.paid_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold">
                                                        {new Date(tx.paid_at).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-1">
                                                    {tx.installment_payments?.map((ip: any) => (
                                                        <div key={ip.id} className="px-2 py-0.5 bg-brand-navy/5 text-brand-navy rounded text-[10px] font-bold border border-brand-navy/10 whitespace-nowrap">
                                                            {isRTL ? 'قسط' : 'Inst'} #{ip.installment?.installment_number} ({current_plan?.currency || '$'}{parseFloat(ip.amount)})
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
