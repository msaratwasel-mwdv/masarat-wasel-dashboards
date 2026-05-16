import React from "react";
import { Head } from "@inertiajs/react";
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
                {/* Billing Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                <div className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tight">
                                    {current_plan.currency}{current_plan.price_per_student} / {isRTL ? 'طالب شهرياً' : 'Student Monthly'}
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
                            <div className="text-3xl font-black text-rose-500">
                                {current_plan?.currency || '$'}{parseFloat(total_owed).toLocaleString()}
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
                            <div className="text-3xl font-black text-emerald-600">
                                {current_plan?.currency || '$'}{parseFloat(total_paid).toLocaleString()}
                            </div>
                            <div className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tight">
                                {isRTL ? 'تم سدادها بنجاح' : 'Successfully Paid'}
                            </div>
                        </div>
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
