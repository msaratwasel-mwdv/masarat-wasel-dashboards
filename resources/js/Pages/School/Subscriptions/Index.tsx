import React from "react";
import { Head, router } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import {
    AlertTriangle,
    CreditCard,
    Wallet,
    Receipt,
    ArrowRightLeft,
} from "lucide-react";
import { useTheme } from "@/Contexts/ThemeContext";
import PlanSelectorGrid from "@/Components/PlanSelectorGrid";
import OmaniRial from "@/Components/OmaniRial";

export default function SubscriptionsIndex({ plans, billingData }: any) {
    const { isRTL } = useTheme();
    const {
        current_plan,
        total_owed,
        total_paid,
    } = billingData;

    return (
        <SchoolAuthenticatedLayout
            header={
                <h2 className="text-xl font-bold text-slate-800">
                    {isRTL ? 'إدارة الاشتراك والباقات' : 'Subscription & Plans Management'}
                </h2>
            }
        >
            <Head title={isRTL ? "الاشتراك والباقات" : "Subscription & Plans"} />

            <div className="py-8 space-y-10">
                {/* Smart Banners */}
                {billingData.subscription?.status === 'paused' && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-start gap-4">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-amber-800 font-bold">{isRTL ? 'الاشتراك مجمد مؤقتاً' : 'Subscription Paused'}</h4>
                            <p className="text-amber-700 text-sm mt-1">
                                {isRTL 
                                    ? 'تم تجميد هذا الاشتراك من قبل الإدارة. يرجى التواصل مع الدعم الفني لإعادة تفعيله وتتمكن من إضافة باصات ورحلات جديدة.' 
                                    : 'This subscription is currently paused by the administration. Please contact support to resume operations.'}
                            </p>
                        </div>
                    </div>
                )}
                
                {billingData.subscription?.grace_period_ends_at && billingData.subscription?.status !== 'paused' && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-start gap-4">
                        <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-rose-800 font-bold">{isRTL ? 'تنبيه تأخر في السداد' : 'Overdue Payment Alert'}</h4>
                            <p className="text-rose-700 text-sm mt-1">
                                {isRTL 
                                    ? `يوجد أقساط متأخرة. فترة السماح تنتهي في ${new Date(billingData.subscription.grace_period_ends_at).toLocaleDateString()}. يرجى رفع إيصال السداد لتجنب إيقاف الخدمة.` 
                                    : `There are overdue payments. The grace period ends on ${new Date(billingData.subscription.grace_period_ends_at).toLocaleDateString()}. Please upload the payment receipt to avoid service interruption.`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Billing Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-navy/5 rounded-bl-[4rem] transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-brand-navy/10 text-brand-navy rounded-2xl flex items-center justify-center mb-4">
                                <Wallet size={24} />
                            </div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                                {isRTL ? 'خطتك الحالية' : 'Current Plan'}
                            </h3>
                            <div className="text-3xl font-black text-brand-navy">
                                {current_plan ? current_plan.name : (isRTL ? "لا يوجد" : "No Active Plan")}
                            </div>
                            {current_plan && (
                                <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tight" dir="ltr">
                                    <span>{current_plan.price_per_student}</span>
                                    <OmaniRial className="w-3.5 h-3.5 inline-block" />
                                    <span>/ {isRTL ? 'طالب' : 'Student'}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-[4rem] transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                                <ArrowRightLeft size={24} />
                            </div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                                {isRTL ? 'الرصيد المستحق' : 'Outstanding Balance'}
                            </h3>
                            <div className="flex items-center gap-1.5 text-3xl font-black text-rose-500" dir="ltr">
                                <span>{parseFloat(total_owed).toLocaleString()}</span>
                                <OmaniRial className="w-6 h-6 inline-block" />
                            </div>
                            <div className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tight">
                                {isRTL ? 'إجمالي الأقساط غير المدفوعة' : 'Total Unpaid Installments'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[4rem] transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                                <CreditCard size={24} />
                            </div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                                {isRTL ? 'إجمالي المدفوعات' : 'Total Payments'}
                            </h3>
                            <div className="flex items-center gap-1.5 text-3xl font-black text-emerald-600" dir="ltr">
                                <span>{parseFloat(total_paid).toLocaleString()}</span>
                                <OmaniRial className="w-6 h-6 inline-block" />
                            </div>
                            <div className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tight">
                                {isRTL ? 'تم سدادها بنجاح' : 'Successfully Paid'}
                            </div>
                        </div>
                    </div>

                    {/* Subscription Calculator Widget */}
                    <div className="bg-brand-navy rounded-[2rem] p-8 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow flex flex-col justify-between border border-brand-navy/50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-bl-[4rem] transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div>
                                <h3 className="text-xs font-black text-brand-yellow uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-brand-yellow rounded-full" />
                                    {isRTL ? 'حاسبة الاشتراك (تلقائية)' : 'Subscription Calculator'}
                                </h3>
                                
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/70 font-bold">{isRTL ? "عدد الطلاب المسجلين" : "Students"}</span>
                                        <span className="text-white font-black">{billingData.subscription?.notes?.student_count || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/70 font-bold">{isRTL ? "السعر للطالب" : "Price/Student"}</span>
                                        <span className="text-white font-black flex items-center gap-1" dir="ltr">
                                            <span>{billingData.subscription?.notes?.approved_price_per_student || current_plan?.price_per_student || 0}</span>
                                            <OmaniRial className="w-3.5 h-3.5" />
                                        </span>
                                    </div>
                                    <div className="w-full h-px bg-white/10 my-2" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-black">{isRTL ? "إجمالي الفاتورة المتوقع" : "Est. Total"}</span>
                                        <span className="text-brand-yellow text-xl font-black flex items-center gap-1" dir="ltr">
                                            <span>{((billingData.subscription?.notes?.approved_price_per_student || current_plan?.price_per_student || 0) * (billingData.subscription?.notes?.student_count || 0)).toFixed(2)}</span>
                                            <OmaniRial className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Installments Table */}
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                    <h3 className="text-xl font-black text-slate-800 mb-6">
                        {isRTL ? 'الأقساط والدفعات المستحقة' : 'Installments & Due Payments'}
                    </h3>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse" dir={isRTL ? 'rtl' : 'ltr'}>
                            <thead>
                                <tr className="border-b-2 border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <th className="py-4 pr-6">{isRTL ? 'رقم القسط' : 'Installment #'}</th>
                                    <th className="py-4 px-6">{isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                                    <th className="py-4 px-6">{isRTL ? 'المبلغ' : 'Amount'}</th>
                                    <th className="py-4 px-6">{isRTL ? 'الحالة' : 'Status'}</th>
                                    <th className="py-4 pl-6 text-center">{isRTL ? 'الإجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billingData.installments?.length > 0 ? billingData.installments.map((inst: any) => (
                                    <tr key={inst.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 pr-6 font-black text-brand-navy">#{inst.installment_number}</td>
                                        <td className="py-4 px-6 font-bold text-slate-600">{new Date(inst.due_date).toLocaleDateString()}</td>
                                        <td className="py-4 px-6 font-black text-[#f5b800]">
                                            <div className="flex items-center gap-1" dir="ltr">
                                                <span>{inst.amount}</span>
                                                <OmaniRial className="w-3.5 h-3.5 inline-block" />
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            {inst.status === 'paid' && <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold">{isRTL ? 'مدفوع' : 'Paid'}</span>}
                                            {inst.status === 'pending' && inst.verification_status !== 'pending' && <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-bold">{isRTL ? 'غير مدفوع' : 'Unpaid'}</span>}
                                            {inst.verification_status === 'pending' && <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">{isRTL ? 'بانتظار المراجعة' : 'Pending Verification'}</span>}
                                        </td>
                                        <td className="py-4 pl-6 text-center">
                                            {inst.status === 'pending' && inst.verification_status !== 'pending' && (
                                                <form 
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        const formData = new FormData(e.currentTarget);
                                                        router.post(route('school.installments.receipt', inst.id), formData, {
                                                            preserveScroll: true
                                                        });
                                                    }}
                                                    className="inline-flex items-center gap-2"
                                                >
                                                    <label className="cursor-pointer bg-brand-navy text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-navy/90 transition-colors">
                                                        {isRTL ? 'إرفاق حوالة' : 'Upload Receipt'}
                                                        <input type="file" name="receipt" className="hidden" accept="image/*,.pdf" onChange={(e) => e.target.form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))} />
                                                    </label>
                                                </form>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                                            {isRTL ? 'لا توجد أقساط مسجلة' : 'No installments found'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Plans Selection */}
                <div className="space-y-6">
                    <div className={`text-center ${isRTL ? "md:text-right" : "md:text-left"}`}>
                        <h3 className="text-xl font-black text-slate-800">
                            {isRTL ? 'الباقات المتاحة' : 'Available Subscription Plans'}
                        </h3>
                        <p className="text-slate-400 font-bold text-sm mt-1">
                            {isRTL ? 'اختر الخطة المناسبة لاحتياجات مدرستك' : 'Choose the perfect plan for your school requirements'}
                        </p>
                    </div>

                    <div className="bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
                        <PlanSelectorGrid 
                            plans={plans} 
                            selectedId={current_plan?.id} 
                            onSelect={() => {}} // Read-only for schools now as per previous policy
                        />
                        
                        <div className="mt-8 flex items-center gap-3 p-4 bg-brand-navy/5 rounded-2xl border border-brand-navy/10 text-brand-navy max-w-2xl mx-auto">
                            <AlertTriangle size={20} />
                            <p className="text-xs font-bold leading-relaxed">
                                {isRTL 
                                    ? "لتغيير باقة الاشتراك أو ترقية حسابك، يرجى التواصل مع الدعم الفني أو مدير النظام." 
                                    : "To change your subscription plan or upgrade your account, please contact technical support or the system administrator."
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}

function FeatureItem({ active, text, icon }: any) {
    return (
        <div
            className={`flex items-center gap-3 font-bold ${active ? "text-slate-700" : "text-slate-300 line-through"}`}
        >
            <div
                className={`w-6 h-6 rounded-md flex items-center justify-center ${active ? "bg-emerald-100 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}
            >
                {icon ? (
                    icon
                ) : active ? (
                    <CheckCircle2 size={12} />
                ) : (
                    <XCircle size={12} />
                )}
            </div>
            {text}
        </div>
    );
}
