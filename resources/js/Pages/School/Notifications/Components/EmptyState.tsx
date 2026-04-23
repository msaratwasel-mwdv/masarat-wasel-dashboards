import { LucideIcon } from 'lucide-react';
import React from 'react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
    return (
        <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-gray-100 dark:border-gray-700">
                <Icon className="w-12 h-12 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm text-center">
                {description}
            </p>
        </div>
    );
}
