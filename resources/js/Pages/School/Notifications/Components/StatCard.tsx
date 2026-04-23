import { LucideIcon } from 'lucide-react';
import React from 'react';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    colorClass: string;
    bgClass: string;
}

export default function StatCard({ title, value, icon: Icon, colorClass, bgClass }: StatCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            {/* Background decoration */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${bgClass}`} />
            
            <div className="flex items-center gap-5 relative z-10">
                <div className={`w-16 h-16 ${bgClass} rounded-[20px] flex items-center justify-center shadow-inner`}>
                    <Icon className={`w-8 h-8 ${colorClass}`} strokeWidth={2.5} />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</p>
                    <p className={`text-4xl lg:text-5xl font-extrabold mt-1 ${colorClass}`}>{value}</p>
                </div>
            </div>
        </div>
    );
}
