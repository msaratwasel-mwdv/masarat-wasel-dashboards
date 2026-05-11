import React from 'react';
import { Zap, Check } from 'lucide-react';
import OmaniRial from '@/Components/OmaniRial';

export default function PlanOption({
    id,
    title,
    description,
    price,
    isAvailable = true,
    currency = 'OMR',
    selected,
    onClick,
    badge,
    features = [],
    billingCycle = 'monthly',
    lang = 'ar',
    theme = 'light'
}: any) {
    const isAr = lang === 'ar';
    const isDark = theme === 'dark';

    return (
        <div
            onClick={isAvailable ? onClick : undefined}
            className={`relative p-6 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col h-full ${
                !isAvailable 
                    ? (isDark ? "opacity-40 border-slate-700 bg-slate-800/50 grayscale" : "opacity-40 border-slate-100 bg-slate-50 grayscale")
                    : selected
                        ? "cursor-pointer border-brand-navy bg-brand-navy text-white shadow-2xl shadow-brand-navy/30 scale-[1.02]"
                        : (isDark
                            ? "cursor-pointer border-slate-700 bg-slate-800 hover:border-brand-yellow hover:shadow-xl"
                            : "cursor-pointer border-slate-100 bg-white hover:border-brand-yellow hover:shadow-xl")
            }`}
        >
            {badge && isAvailable && (
                <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-10 whitespace-nowrap ${selected ? "bg-brand-yellow text-brand-dark" : "bg-brand-navy text-white"}`}
                >
                    {badge}
                </div>
            )}

            {/* Reduced height area */}
            <div className="mb-4 text-center min-h-[75px] flex flex-col justify-start">
                <h4
                    className={`text-lg font-black mb-1 ${
                        !isAvailable 
                            ? (isDark ? "text-slate-300" : "text-slate-700") 
                            : (selected ? "text-white" : (isDark ? "text-white" : "text-brand-navy"))
                    }`}
                >
                    {title}
                </h4>
                {description && (
                    <p className={`text-xs font-medium leading-relaxed line-clamp-2 ${
                        !isAvailable 
                            ? (isDark ? "text-slate-500" : "text-slate-400")
                            : (selected ? "text-white/60" : "text-slate-400")
                    }`}>
                        {description}
                    </p>
                )}
            </div>

            <div className="flex flex-col items-center mb-6">
                {isAvailable ? (
                    <>
                        <div className={`flex items-center justify-center gap-1 ${selected ? "text-white" : (isDark ? "text-white" : "text-brand-navy")}`}>
                            <span className="text-3xl font-black tracking-tighter leading-none">
                                {price}
                            </span>
                            <span className="flex items-center opacity-90">
                                {currency === 'OMR' ? (
                                    <OmaniRial 
                                        size="2rem" 
                                        className="-translate-y-[1px]" 
                                        color={selected ? "#ffffff" : (isDark ? "#ffffff" : "#0f172a")} 
                                    />
                                ) : (
                                    <span className="text-base font-bold">{currency}</span>
                                )}
                            </span>
                        </div>
                        <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${selected ? "text-brand-yellow" : (isDark ? "text-slate-400" : "text-brand-navy/50")}`}>
                            {isAr 
                                ? (billingCycle === 'monthly' ? 'لكل طالب / شهرياً' : 'لكل طالب / قسط شهري (سنوي)') 
                                : (billingCycle === 'monthly' ? '/ Per Student Monthly' : '/ Per Student Monthly (Yearly)')
                            }
                        </div>
                        {billingCycle === 'yearly' && (
                            <div className={`mt-1 text-[8px] font-bold px-2 py-0.5 rounded ${selected ? "bg-brand-yellow text-brand-dark" : "bg-emerald-500/10 text-emerald-500"}`}>
                                {isAr ? "يتم الدفع سنوياً" : "Billed annually"}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-4 flex flex-col items-center gap-1">
                        <span className={`text-[11px] font-black px-4 py-1.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200/50 text-slate-500'}`}>
                            {isAr ? "غير متوفر لهذا الخيار" : "Not Available for this cycle"}
                        </span>
                        <span className="text-[10px] font-bold opacity-60">
                            {isAr 
                                ? (billingCycle === 'monthly' ? "جرب الفوترة السنوية" : "جرب الفوترة الشهرية")
                                : (billingCycle === 'monthly' ? "Try yearly billing" : "Try monthly billing")
                            }
                        </span>
                    </div>
                )}
            </div>

            <ul className="space-y-3 w-full flex-1">
                {features.map((f: string, i: number) => (
                    <li
                        key={i}
                        className={`flex items-start gap-3 text-xs font-bold ${
                            !isAvailable 
                                ? (isDark ? "text-slate-600" : "text-slate-300")
                                : (selected ? "text-white/80" : (isDark ? "text-slate-300" : "text-slate-600"))
                        }`}
                    >
                        <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                            !isAvailable 
                                ? "bg-slate-200/50 text-slate-400" 
                                : (selected ? "bg-brand-yellow/20 text-brand-yellow" : "bg-brand-navy/10 text-brand-navy")
                        }`}>
                            <Check size={10} strokeWidth={3} />
                        </div>
                        <span className="leading-tight">{f}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-6">
                <div className={`w-full py-3 rounded-2xl text-center text-xs font-black transition-all ${
                    !isAvailable 
                        ? (isDark ? 'bg-slate-800 text-slate-600' : 'bg-slate-200 text-slate-400')
                        : selected 
                            ? 'bg-brand-yellow text-brand-dark shadow-xl' 
                            : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-400')
                }`}>
                    {isAvailable 
                        ? (selected ? (isAr ? "تم الاختيار" : "Selected") : (isAr ? "اختر الخطة" : "Select Plan"))
                        : (isAr ? "غير متاح" : "Unavailable")
                    }
                </div>
            </div>
        </div>
    );
}
