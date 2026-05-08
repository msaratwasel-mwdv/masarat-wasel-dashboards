import React from 'react';
import { Zap } from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';

export default function PlanOption({
    id,
    title,
    description,
    price,
    currency = '$',
    selected,
    onClick,
    isMostPopular,
    features = [],
}: any) {
    const { isRTL } = useTheme();
    return (
        <div
            onClick={onClick}
            className={`relative cursor-pointer p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center text-center h-full ${
                selected
                    ? "border-brand-navy bg-brand-navy text-white shadow-2xl shadow-brand-navy/30 scale-[1.03]"
                    : "border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-yellow hover:shadow-xl"
            }`}
        >
            {isMostPopular && (
                <div
                    className={`absolute -top-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${selected ? "bg-brand-yellow text-brand-dark" : "bg-brand-navy text-white"}`}
                >
                    {isRTL ? "شائع" : "Popular"}
                </div>
            )}
            <div className="mb-6">
                <h4
                    className={`text-lg font-black mb-1 ${selected ? "text-white" : "text-brand-navy dark:text-white"}`}
                >
                    {title}
                </h4>
                {description && (
                    <p className={`text-xs font-bold ${selected ? "text-white/60" : "text-slate-400"}`}>
                        {description}
                    </p>
                )}
            </div>
            
            <div className="flex flex-col items-center mb-8">
                <div className={`flex items-baseline gap-1 ${selected ? "text-white" : "text-slate-800 dark:text-gray-200"}`}>
                    <span className="text-xl font-bold opacity-70 mb-1">{currency}</span>
                    <span className="text-5xl font-black tracking-tighter">
                        {price}
                    </span>
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${selected ? "text-white/50" : "text-slate-400"}`}>
                    {isRTL ? 'لكل طالب / شهرياً' : '/ Per Student Monthly'}
                </div>
            </div>
            <ul className="space-y-3 w-full">
                {features.map((f: string, i: number) => (
                    <li
                        key={i}
                        className={`flex items-center justify-center gap-2 text-xs font-bold ${selected ? "text-white/70" : "text-slate-400"}`}
                    >
                        <Zap
                            size={14}
                            className={
                                selected
                                    ? "text-brand-yellow"
                                    : "text-brand-navy"
                            }
                        />{" "}
                        {f}
                    </li>
                ))}
            </ul>
        </div>
    );
}
