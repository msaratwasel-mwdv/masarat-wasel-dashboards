import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { CheckCircle2, Clock, Wallet, Calendar, Search, Filter, ArrowRight, LayoutGrid, AlertCircle, School } from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';

export default function InstallmentsIndex({ installments, schools = [], initialSearch = '' }: any) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [globalPayModalOpen, setGlobalPayModalOpen] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState('all');
    
    const [paymentData, setPaymentData] = useState({
        payment_method: 'bank_transfer',
        amount: 0,
        reference_number: ''
    });

    const openPayModal = (installment: any) => {
        setSelectedInstallment(installment);
        setPaymentData({
            ...paymentData,
            amount: installment.amount - (installment.paid_amount || 0)
        });
        setPayModalOpen(true);
    };

    const openGlobalPayModal = () => {
        setPaymentData({
            payment_method: 'bank_transfer',
            amount: 0,
            reference_number: ''
        });
        setGlobalPayModalOpen(true);
    };

    const handleSchoolSelect = (schoolId: number) => {
        setSelectedSchoolId(schoolId);
        const school = schools.find((s: any) => s.id === schoolId);
        if (school && school.oldest_installment) {
            setPaymentData({
                ...paymentData,
                amount: school.total_due
            });
        }
    };

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        const targetId = selectedInstallment?.id || schools.find((s: any) => s.id === selectedSchoolId)?.oldest_installment?.id;
        
        if (!targetId) {
            alert(isRTL ? 'يرجى اختيار مدرسة لديها أقساط مستحقة' : 'Please select a school with pending installments');
            return;
        }

        router.post(route('admin.subscriptions.installments.pay', targetId), paymentData, {
            onSuccess: () => {
                setPayModalOpen(false);
                setGlobalPayModalOpen(false);
                setSelectedInstallment(null);
                setSelectedSchoolId(null);
                setPaymentData({ payment_method: 'bank_transfer', amount: 0, reference_number: '' });
            }
        });
    };

    const filteredInstallments = installments.filter((inst: any) => {
        const matchesSearch = (inst.school?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const selectedSchool = schools.find((s: any) => s.id === selectedSchoolId);

    return (
        <AuthenticatedLayout 
            header={null}
        >
            <Head title={isRTL ? 'إدارة الأقساط' : 'Installments'} />

            <div className="space-y-8">
                {/* Premium Deep Contrast Header */}
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0a142c] via-[#11244d] to-[#0a142c] p-10 md:p-14 shadow-2xl shadow-[#11244d]/30 border border-white/10">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#f5b800]/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
                    
                    <div className={`relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#f5b800] text-xs font-black uppercase tracking-widest mb-6">
                                <Wallet size={14} />
                                <span>{isRTL ? 'المالية' : 'Financials'}</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-md">
                                {isRTL ? 'الأقساط والمتحصلات' : 'Installments & Collections'}
                            </h2>
                            <p className="text-lg font-bold text-slate-300 max-w-xl">
                                {isRTL 
                                    ? 'إدارة شاملة لجميع الدفعات المدرسية مع متابعة دقيقة لحالة السداد والمبالغ المستحقة' 
                                    : 'A comprehensive management hub for all school payments, overdue balances, and schedules.'}
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-4 w-full md:w-auto">
                            <button 
                                onClick={openGlobalPayModal}
                                className="flex items-center justify-center gap-2 px-8 py-5 bg-brand-yellow text-brand-navy font-black rounded-3xl hover:bg-yellow-400 transition-all shadow-xl shadow-brand-yellow/20 active:scale-95"
                            >
                                <CheckCircle2 size={20} />
                                <span>{isRTL ? 'تسجيل تحصيل مالي' : 'Register Collection'}</span>
                            </button>

                            <div className="flex bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl w-full min-w-[280px]">
                                <div className="w-full">
                                    <div className="text-xs font-black text-slate-300 uppercase tracking-widest mb-1">
                                        {isRTL ? 'إجمالي الدفعات المعلقة' : 'Total Pending Collections'}
                                    </div>
                                    <div className="text-4xl font-black text-[#f5b800] tracking-tighter" dir="ltr">
                                        ${installments.filter((i:any)=>i.status!=='paid').reduce((acc:any, curr:any)=>acc+Number(curr.amount), 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search - Glassmorphism */}
                <div className={`p-6 rounded-[2.5rem] bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-5 items-center z-20 relative ${isDark ? '' : 'backdrop-blur-xl bg-white/80'}`}>
                    <div className="flex-1 w-full relative group">
                        <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-6' : 'left-6'} text-slate-400 group-focus-within:text-brand-navy transition-colors`}>
                            <Search size={22} className="stroke-[2.5]" />
                        </div>
                        <input 
                            type="text" 
                            placeholder={isRTL ? "ابحث باسم المدرسة..." : "Search by school name..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full h-16 rounded-[2rem] border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 focus:border-brand-navy dark:focus:border-brand-yellow font-bold text-base transition-all shadow-inner ${isRTL ? 'pr-16 pl-6' : 'pl-16 pr-6'}`}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto h-16 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-2 border-2 border-slate-100 dark:border-slate-700 shrink-0">
                        {['all', 'pending', 'paid'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-6 h-full flex items-center justify-center rounded-[1.5rem] font-bold text-sm transition-all ${
                                    statusFilter === status 
                                        ? 'bg-white dark:bg-slate-700 shadow-md text-brand-navy dark:text-white' 
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                                }`}
                            >
                                {status === 'all' && (isRTL ? 'الكل' : 'All')}
                                {status === 'pending' && (isRTL ? 'معلق' : 'Pending')}
                                {status === 'paid' && (isRTL ? 'مدفوع' : 'Paid')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid Layout High Contrast Cards */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
                    {filteredInstallments.map((inst: any) => {
                        const isPaid = inst.status === 'paid';
                        const isPartiallyPaid = inst.status === 'partially_paid';
                        
                        return (
                            <div 
                                key={inst.id} 
                                className={`group overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-800 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col sm:flex-row ${
                                    isPaid 
                                    ? 'border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 shadow-emerald-100/50' 
                                    : isPartiallyPaid
                                    ? 'border-amber-100 dark:border-amber-900/30 hover:border-amber-300 shadow-amber-100/50'
                                    : 'border-slate-100 dark:border-slate-700 hover:border-brand-navy/30 dark:hover:border-brand-yellow/50 shadow-slate-200/50 dark:shadow-none'
                                }`}
                            >
                                {/* Left/Right Identity Block */}
                                <div className={`p-8 w-full sm:w-2/5 flex flex-col justify-center relative overflow-hidden shrink-0 ${
                                    isPaid 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-[#0f172a] text-white' // Deep rich navy block
                                }`}>
                                    <div className="absolute top-0 right-0 p-4 opacity-10 drop-shadow-2xl translate-x-4 -translate-y-4">
                                        <Wallet size={120} strokeWidth={1} />
                                    </div>
                                    
                                    <div className="relative z-10">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] tracking-widest uppercase mb-6 shadow-sm ${
                                            isPaid ? 'bg-emerald-600' : isPartiallyPaid ? 'bg-amber-600' : 'bg-white/10'
                                        }`}>
                                            {isPaid ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                                            {isPaid ? (isRTL ? 'تم السداد' : 'Paid') : isPartiallyPaid ? (isRTL ? 'سداد جزئي' : 'Partially Paid') : (isRTL ? 'بانتظار السداد' : 'Pending')}
                                        </div>

                                        <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1 relative z-10 flex gap-2 items-center">
                                            {isRTL ? 'المبلغ المتبقي' : 'Remaining Balance'}
                                        </div>
                                        <div className="text-4xl lg:text-5xl font-black tracking-tighter mb-4" dir="ltr">
                                            ${(inst.amount - (inst.paid_amount || 0)).toFixed(2)}
                                        </div>
                                        
                                        <div className="w-10 h-1 bg-white/20 rounded-full mb-4"></div>
                                        
                                        <div className="text-white/80 font-bold text-sm">
                                            {isRTL ? 'الإجمالي: ' : 'Total: '}${inst.amount}
                                        </div>
                                        {isPartiallyPaid && (
                                            <div className="text-white/60 font-medium text-[10px] mt-1">
                                                {isRTL ? 'تم دفع: ' : 'Paid: '}${inst.paid_amount}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content Details Block */}
                                <div className="p-8 w-full flex flex-col justify-between">
                                    <div>
                                        <div className={`flex items-start gap-4 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
                                                <School className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-800 dark:text-white leading-tight mb-1">
                                                    {inst.school?.name || '-'}
                                                </h4>
                                                <p className="text-sm font-bold text-slate-500">
                                                    {isRTL ? 'اشتراك المدرسة الموحد' : 'Unified School Subscription'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 mb-6">
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase flex flex-row items-center gap-1.5 mb-1">
                                                    <Calendar size={12}/>
                                                    {isPaid ? (isRTL ? 'تاريخ السداد' : 'Date Paid') : (isRTL ? 'تاريخ الاستحقاق' : 'Due Date')}
                                                </div>
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    {(isPaid || isPartiallyPaid) 
                                                        ? (inst.installment_payments?.[0]?.payment_transaction?.paid_at 
                                                            ? new Date(inst.installment_payments[0].payment_transaction.paid_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) 
                                                            : '-') 
                                                        : new Date(inst.due_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                            {(isPaid || isPartiallyPaid) && (
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">{isRTL ? 'طريقة الدفع' : 'Method'}</div>
                                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize text-xs">
                                                        {inst.installment_payments?.[0]?.payment_transaction?.payment_method || '-'}
                                                        {inst.installment_payments?.length > 1 && ` (+${inst.installment_payments.length - 1})`}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {!isPaid && (
                                        <div className={`mt-auto flex justify-end ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <button 
                                                onClick={() => openPayModal(inst)}
                                                className={`group/btn relative w-full overflow-hidden flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black transition-all active:scale-95 shadow-xl ${
                                                    isDark ? 'bg-brand-yellow text-brand-navy hover:shadow-brand-yellow/20' : 'bg-brand-navy text-white hover:bg-slate-800 hover:shadow-brand-navy/30'
                                                }`}
                                            >
                                                <span className="relative z-10">{isRTL ? 'تأكيد ودفع' : 'Record Payment'}</span>
                                                <ArrowRight className={`relative z-10 w-5 h-5 transition-transform ${isRTL ? 'rotate-180 group-hover/btn:-translate-x-1' : 'group-hover/btn:translate-x-1'}`} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {filteredInstallments.length === 0 && (
                        <div className="col-span-full pt-12">
                            <div className="max-w-md mx-auto text-center px-6 py-16 bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                                    {isRTL ? 'لا توجد نتائج' : 'No results found'}
                                </h3>
                                <p className="text-slate-500 font-bold">
                                    {isRTL ? 'جرب البحث باسم مدرسة آخر أو تغيير عوامل التصفية' : 'Try searching by a different school name or changing your filters.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Pay Modal */}
            {payModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
                    <form onSubmit={handlePayment} className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-lg p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative border outline outline-4 outline-white/10 dark:border-slate-700 transform transition-all">
                        <button type="button" onClick={() => setPayModalOpen(false)} className={`absolute top-8 ${isRTL ? 'left-8' : 'right-8'} text-slate-400 hover:text-rose-500 transition-colors bg-slate-100 dark:bg-slate-700 rounded-full p-2 hover:bg-rose-50 dark:hover:bg-rose-500/20`}>
                            <ArrowRight size={20} className={isRTL ? '' : 'rotate-180'} />
                        </button>
                        
                        <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <div className="w-14 h-14 bg-brand-navy/5 text-brand-navy dark:bg-brand-yellow/10 dark:text-brand-yellow rounded-2xl flex items-center justify-center mb-6">
                                <Wallet strokeWidth={2.5} size={28} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                                {isRTL ? 'تسجيل تحصيل مالي' : 'Record Collection'}
                            </h3>
                            <p className="text-sm font-bold text-slate-500">
                                {isRTL ? 'يتم سداد القسط المالي رقم' : 'Recording payment for installment'} <span className="text-brand-navy dark:text-brand-yellow font-black mx-1">#{selectedInstallment?.installment_number}</span>
                            </p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-[#0a142c] to-[#11244d] p-8 rounded-[2.5rem] mb-8 text-center relative overflow-hidden border border-[#1a2f60]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                            <div className="text-xs font-black text-white/50 uppercase tracking-widest mb-3 relative z-10">
                                {isRTL ? 'المبلغ المستحق حالياً' : 'Current Balance Due'}
                            </div>
                            <div className="text-5xl md:text-6xl font-black text-emerald-400 tracking-tighter relative z-10" dir="ltr">
                                ${selectedInstallment ? (selectedInstallment.amount - (selectedInstallment.paid_amount || 0)).toFixed(2) : '0.00'}
                            </div>
                            {selectedInstallment?.paid_amount > 0 && (
                                <div className="text-[10px] text-white/40 font-bold mt-2">
                                    {isRTL ? 'إجمالي القسط: ' : 'Total Installment: '}${selectedInstallment?.amount}
                                </div>
                            )}
                        </div>

                        <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-2">
                                        {isRTL ? 'المبلغ المراد دفعه' : 'Amount to Pay'}
                                    </label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData({...paymentData, amount: Number(e.target.value)})}
                                        className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 font-black text-xl focus:ring-0 focus:border-brand-navy dark:focus:border-brand-yellow shadow-sm transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-2">
                                        {isRTL ? 'طريقة السداد' : 'Payment Method'}
                                    </label>
                                    <select 
                                        value={paymentData.payment_method}
                                        onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                                        className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 font-bold focus:ring-0 focus:border-brand-navy dark:focus:border-brand-yellow shadow-sm transition-colors cursor-pointer appearance-none"
                                        dir={isRTL ? 'rtl' : 'ltr'}
                                    >
                                        <option value="bank_transfer">{isRTL ? 'حوالة بنكية' : 'Bank Transfer'}</option>
                                        <option value="cash">{isRTL ? 'نقدي' : 'Cash'}</option>
                                        <option value="cheque">{isRTL ? 'شيك' : 'Cheque'}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-2">
                                        {isRTL ? 'رقم الإيصال / المرجع' : 'Reference / Receipt Number'}
                                    </label>
                                    <input 
                                        type="text" 
                                        value={paymentData.reference_number}
                                        onChange={(e) => setPaymentData({...paymentData, reference_number: e.target.value})}
                                        className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 font-bold focus:ring-0 focus:border-brand-navy dark:focus:border-brand-yellow shadow-sm transition-colors"
                                        placeholder={isRTL ? "مثلاً: TRx123456" : "e.g. TRx123456"}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={`mt-8 flex gap-4 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
                            <button type="button" onClick={() => setPayModalOpen(false)} className="flex-1 h-14 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                {isRTL ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button type="submit" className="flex-[2] h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 text-lg">
                                {isRTL ? 'تأكيد التحصيل' : 'Confirm Collection'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Global Pay Modal */}
            {globalPayModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
                    <form onSubmit={handlePayment} className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative border outline outline-4 outline-white/10 dark:border-slate-700 transform transition-all">
                        <button type="button" onClick={() => setGlobalPayModalOpen(false)} className={`absolute top-8 ${isRTL ? 'left-8' : 'right-8'} text-slate-400 hover:text-rose-500 transition-colors bg-slate-100 dark:bg-slate-700 rounded-full p-2 hover:bg-rose-50 dark:hover:bg-rose-500/20`}>
                            <ArrowRight size={20} className={isRTL ? '' : 'rotate-180'} />
                        </button>
                        
                        <div className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <div className="w-14 h-14 bg-brand-navy/5 text-brand-navy dark:bg-brand-yellow/10 dark:text-brand-yellow rounded-2xl flex items-center justify-center mb-6">
                                <Wallet strokeWidth={2.5} size={28} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                                {isRTL ? 'تسجيل تحصيل مالي (عام)' : 'Register Global Collection'}
                            </h3>
                            <p className="text-sm font-bold text-slate-500">
                                {isRTL ? 'قم باختيار المدرسة والمبلغ المراد تحصيله' : 'Select a school and enter the collection amount'}
                            </p>
                        </div>

                        <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-2">
                                    {isRTL ? 'اختر المدرسة' : 'Select School'}
                                </label>
                                <select 
                                    value={selectedSchoolId ? String(selectedSchoolId) : ''}
                                    onChange={(e) => handleSchoolSelect(e.target.value ? Number(e.target.value) : 0)}
                                    className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 font-bold focus:ring-0 focus:border-brand-navy dark:focus:border-brand-yellow shadow-sm transition-colors cursor-pointer"
                                    dir={isRTL ? 'rtl' : 'ltr'}
                                >
                                    <option value="">{isRTL ? '--- اختر مدرسة ---' : '--- Select School ---'}</option>
                                    {schools.length > 0 ? (
                                        schools.map((school: any) => (
                                            <option key={school.id} value={String(school.id)}>
                                                {school.name} ({isRTL ? 'المستحق: ' : 'Due: '}${school.total_due.toFixed(2)})
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>{isRTL ? 'لا توجد مدارس بمديونية معلقة' : 'No schools with pending debt'}</option>
                                    )}
                                </select>
                            </div>

                            {selectedSchool && (
                                <div className="bg-gradient-to-br from-[#0a142c] to-[#11244d] p-8 rounded-[2.5rem] text-center relative overflow-hidden border border-[#1a2f60]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
                                    <div className="text-xs font-black text-white/50 uppercase tracking-widest mb-3 relative z-10">
                                        {isRTL ? 'إجمالي المديونية المستحقة' : 'Total Outstanding Balance'}
                                    </div>
                                    <div className="text-5xl md:text-6xl font-black text-emerald-400 tracking-tighter relative z-10" dir="ltr">
                                        ${selectedSchool.total_due.toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-white/40 font-bold mt-2">
                                        {isRTL ? 'أقدم قسط مستحق: ' : 'Oldest Pending: '} <span className="text-white/60">#{selectedSchool.oldest_installment?.installment_number}</span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-2">
                                        {isRTL ? 'المبلغ المراد تحصيله' : 'Amount to Collect'}
                                    </label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData({...paymentData, amount: Number(e.target.value)})}
                                        className="w-full h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 font-black text-xl focus:ring-0 focus:border-brand-navy dark:focus:border-brand-yellow shadow-sm transition-colors"
                                        placeholder="0.00"
                                    />
                                    <p className="mt-2 text-[10px] font-bold text-slate-400 italic px-2">
                                        {isRTL ? '* سيتم تطبيق المبلغ على الأقساط الأقدم أولاً وتلقائياً.' : '* Payment will be applied to the oldest installments automatically.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-2">
                                            {isRTL ? 'طريقة السداد' : 'Method'}
                                        </label>
                                        <select 
                                            value={paymentData.payment_method}
                                            onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                                            className="w-full h-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 font-bold focus:ring-0 focus:border-brand-navy dark:focus:border-brand-yellow shadow-sm transition-colors cursor-pointer appearance-none text-sm"
                                            dir={isRTL ? 'rtl' : 'ltr'}
                                        >
                                            <option value="bank_transfer">{isRTL ? 'حوالة' : 'Bank'}</option>
                                            <option value="cash">{isRTL ? 'نقدي' : 'Cash'}</option>
                                            <option value="cheque">{isRTL ? 'شيك' : 'Cheque'}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 px-2">
                                            {isRTL ? 'رقم المرجع' : 'Reference'}
                                        </label>
                                        <input 
                                            type="text" 
                                            value={paymentData.reference_number}
                                            onChange={(e) => setPaymentData({...paymentData, reference_number: e.target.value})}
                                            className="w-full h-14 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 font-bold focus:ring-0 focus:border-brand-navy dark:focus:border-brand-yellow shadow-sm transition-colors text-sm"
                                            placeholder="Ref #"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`mt-8 flex gap-4 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
                            <button type="button" onClick={() => setGlobalPayModalOpen(false)} className="flex-1 h-14 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                {isRTL ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button 
                                type="submit" 
                                disabled={!selectedSchoolId || paymentData.amount <= 0}
                                className="flex-[2] h-14 bg-brand-navy text-white font-black rounded-2xl transition-all shadow-lg active:scale-95 text-lg disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                {isRTL ? 'تأكيد ودفع' : 'Pay Now'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
