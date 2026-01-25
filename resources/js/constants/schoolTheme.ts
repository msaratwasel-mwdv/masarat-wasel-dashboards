export const SCHOOL_THEME = {
    colors: {
        primary: '#0e7490', // Cyan-700 - Calm, professional
        primaryDark: '#155e75', // Cyan-800
        secondary: '#64748b', // Slate-500
        bg: {
            main: '#f8fafc', // Slate-50
            card: '#ffffff',
            darkCard: '#1f2937', // Gray-800
        },
        text: {
            primary: '#1e293b', // Slate-800
            secondary: '#64748b', // Slate-500
            light: '#f1f5f9', // Slate-100
        }
    },
    shapes: {
        // User requested 30-40px radius
        defaultRadius: '35px',
        cardRadius: '30px',
        modalRadius: '35px',
    }
};

export const COMMON_STYLES = {
    layout: {
        pageContainer: "space-y-6 p-6",
        cardContainer: "bg-white dark:bg-gray-800 rounded-[30px] border border-gray-100 dark:border-gray-700 shadow-sm p-6 relative overflow-hidden",
        headerGradient: "bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-t-[35px]",
    },
    inputs: {
        // Unified radius 35px, calm colors
        base: "w-full pl-6 pr-6 py-4 rounded-[35px] border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 transition-all text-gray-800 dark:text-gray-100 placeholder-gray-400 font-medium",
        label: "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2",
        select: "w-full pl-6 pr-10 py-4 rounded-[35px] border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-slate-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 appearance-none transition-all font-medium text-gray-800 dark:text-gray-100",
    },
    buttons: {
        primary: "px-8 py-3.5 rounded-[35px] bg-slate-800 text-white font-bold hover:bg-slate-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2",
        secondary: "px-8 py-3.5 rounded-[35px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2",
        danger: "px-8 py-3.5 rounded-[35px] bg-red-50 dark:bg-red-900/10 text-red-600 font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2",
    },
    badges: {
        base: "px-4 py-1.5 rounded-[20px] text-xs font-bold inline-flex items-center gap-1.5",
        success: "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
        warning: "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
        danger: "bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        info: "bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    }
};
