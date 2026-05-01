import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { FileText, DollarSign, Search, PlusCircle, CheckCircle2 } from 'lucide-react';
import { DS_card, DS_btnPrimary } from '@/lib/DS';

export default function InvoicesIndex({ invoices }: { invoices: any[] }) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === "dark";

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [formData, setFormData] = useState({ amount: 0, payment_method: 'bank_transfer', reference_number: '' });

    const openPaymentModal = (invoice: any) => {
        setSelectedInvoice(invoice);
        const remaining = Number(invoice.total_amount) - invoice.transactions.reduce((s:number, t:any) => s + Number(t.amount), 0);
        setFormData({ amount: remaining > 0 ? remaining : 0, payment_method: 'bank_transfer', reference_number: '' });
        setIsPaymentModalOpen(true);
    };

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('admin.invoices.payment', selectedInvoice.id), formData, {
            onSuccess: () => setIsPaymentModalOpen(false)
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={isRTL ? "الإدارة المالية والفواتير" : "Financials & Invoices"} />
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#0f2044] p-6 rounded-3xl shadow-xl border border-[#f5b800]/10">
                    <h1 className="text-2xl font-black text-white">{isRTL ? "الإدارة المالية" : "Financials & Invoices"}</h1>
                </div>

                <div className={`p-6 rounded-3xl shadow-xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                    <table className="w-full text-left">
                        <thead>
                            <tr className={`text-xs font-black uppercase text-slate-400 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'} pb-3 block md:table-row`}>
                                <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'المدرسة' : 'School'}</th>
                                <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'المبلغ الإجمالي' : 'Total'}</th>
                                <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'الحالة' : 'Status'}</th>
                                <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                                <th className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'إجراء' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(invoice => {
                                const totalPaid = invoice.transactions.reduce((s:number, t:any) => s + Number(t.amount), 0);
                                const isFullyPaid = invoice.status === 'paid' || totalPaid >= Number(invoice.total_amount);
                                return (
                                    <tr key={invoice.id} className={`border-b last:border-0 ${isDark ? 'border-slate-700/50' : 'border-slate-100'} hover:bg-slate-50/5 dark:hover:bg-slate-700/20`}>
                                        <td className={`p-3 font-bold ${isRTL ? 'text-right' : 'text-left'} ${isDark ? 'text-white' : 'text-slate-900'}`}>{invoice.school.name}</td>
                                        <td className={`p-3 font-black text-[#f5b800] ${isRTL ? 'text-right' : 'text-left'}`}>{invoice.total_amount}</td>
                                        <td className={`p-3 flex ${isRTL ? 'justify-start' : 'justify-start'}`}>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold inline-block text-center mt-1 ${
                                                isFullyPaid ? 'bg-emerald-500/10 text-emerald-500' : 
                                                invoice.status === 'partially_paid' ? 'bg-amber-500/10 text-amber-500' : 
                                                'bg-red-500/10 text-red-500'
                                            }`}>
                                                {isFullyPaid ? (isRTL ? 'مدفوعة' : 'Paid') : (isRTL ? 'غير مدفوعة' : 'Unpaid')}
                                            </span>
                                        </td>
                                        <td className={`p-3 font-mono text-xs ${isRTL ? 'text-right' : 'text-left'} ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{invoice.due_date}</td>
                                        <td className={`p-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                                            {!isFullyPaid && (
                                                <button onClick={() => openPaymentModal(invoice)} className="text-[11px] bg-blue-500/10 text-blue-500 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-500 hover:text-white transition-all whitespace-nowrap inline-flex items-center gap-1">
                                                    <DollarSign className="w-3 h-3" />
                                                    {isRTL ? "تسجيل دفعة" : "Log Payment"}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {invoices.length === 0 && (
                        <div className="text-center py-10 opacity-50">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="font-bold text-sm">{isRTL ? "لا توجد فواتير بعد" : "No invoices found"}</p>
                        </div>
                    )}
                </div>

                {isPaymentModalOpen && selectedInvoice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                            <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                                {isRTL ? 'تسجيل دفعة مالية' : 'Log Payment'}
                            </h2>
                            <form onSubmit={submitPayment} className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'المبلغ المدفوع' : 'Amount'}</label>
                                    <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} required />
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'طريقة الدفع' : 'Payment Method'}</label>
                                    <select value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})} className={`w-full p-3 rounded-xl border appearance-none ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}>
                                        <option value="bank_transfer">{isRTL ? 'حوالة بنكية' : 'Bank Transfer'}</option>
                                        <option value="cash">{isRTL ? 'نقدي' : 'Cash'}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? 'رقم المرجع (اختياري)' : 'Reference (Optional)'}</label>
                                    <input type="text" value={formData.reference_number} onChange={e => setFormData({...formData, reference_number: e.target.value})} className={`w-full p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                                </div>
                                <div className={`flex gap-4 pt-4 mt-6 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                                    <button type="button" onClick={() => setIsPaymentModalOpen(false)} className={`flex-1 p-3 rounded-xl font-bold ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                                        {isRTL ? 'إلغاء' : 'Cancel'}
                                    </button>
                                    <button type="submit" className="flex-1 p-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/20">
                                        {isRTL ? 'تأكيد הדفع' : 'Confirm Payment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
