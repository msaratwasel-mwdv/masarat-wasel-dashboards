import React, { useState, useMemo } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Receipt, 
    Calendar, 
    CreditCard, 
    ChevronRight, 
    Hash, 
    School, 
    Wallet,
    Search,
    Filter,
    Download,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    Clock,
    XCircle,
    MoreHorizontal
} from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';
import BaseDataTable, { type PaginationMeta } from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { 
    DS_pageWrapper, 
    DS_card, 
    DS_pageTitle,
    DS_statCard,
    DS_statIcon,
    DS_statLabel,
    DS_statValue2,
    DS_badge
} from "@/lib/DS";

interface Transaction {
    id: number;
    school_id: number;
    transaction_id: string;
    amount: string | number;
    payment_method: string;
    status: string;
    reference_number: string | null;
    paid_at: string;
    school: {
        id: number;
        name: string;
    };
    installment_payments?: {
        id: number;
        amount: string | number;
        installment: {
            installment_number: number;
        };
    }[];
}

interface Props {
    transactions: {
        data: Transaction[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    filters: {
        search: string;
    };
    auth: any;
}

export default function TransactionsIndex({ transactions, filters, auth }: Props) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === "dark";
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(route('admin.transactions.index'), { search: value }, { preserveState: true, replace: true });
    };

    const columnHelper = createColumnHelper<Transaction>();

    const columns = useMemo(() => [
        columnHelper.accessor("school.name", {
            header: isRTL ? "المدرسة" : "School",
            cell: (info) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs border border-slate-200 dark:border-slate-700">
                        {info.getValue()?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-[#0f2044] dark:text-white leading-tight">{info.getValue()}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">ID: #{info.row.original.school_id}</span>
                    </div>
                </div>
            )
        }),
        columnHelper.accessor("amount", {
            header: isRTL ? "المبلغ" : "Amount",
            cell: (info) => (
                <div className="flex flex-col" dir="ltr">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                        ${parseFloat(info.getValue() as string).toLocaleString()}
                    </span>
                </div>
            )
        }),
        columnHelper.accessor("payment_method", {
            header: isRTL ? "الوسيلة" : "Method",
            cell: (info) => (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-max">
                    <CreditCard size={12} /> {info.getValue()}
                </span>
            )
        }),
        columnHelper.accessor("paid_at", {
            header: isRTL ? "التاريخ" : "Date",
            cell: (info) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {new Date(info.getValue()).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-gray-400">
                        {new Date(info.getValue()).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        }),
        columnHelper.accessor("installment_payments", {
            header: isRTL ? "الأقساط" : "Installments",
            cell: (info) => (
                <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {info.getValue()?.map((ip) => (
                        <span key={ip.id} className="px-1.5 py-0.5 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8] rounded text-[9px] font-black border border-[#0f2044]/10 dark:border-[#243460]">
                            #{ip.installment.installment_number}
                        </span>
                    ))}
                </div>
            )
        }),
        columnHelper.display({
            id: "actions",
            header: "",
            cell: (info) => (
                <div className="flex justify-end">
                    <Link 
                        href={route('admin.installments.index', { school_id: info.row.original.school_id })}
                        className="p-2 text-slate-300 hover:text-[#0f2044] dark:hover:text-[#f5b800] transition-colors"
                    >
                        <ChevronRight size={18} className={isRTL ? 'rotate-180' : ''} />
                    </Link>
                </div>
            )
        })
    ], [isRTL]);

    const pagination: PaginationMeta = {
        links: transactions.links,
        current_page: transactions.current_page,
        last_page: transactions.last_page,
        per_page: transactions.per_page,
        total: transactions.total,
        from: transactions.from,
        to: transactions.to,
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? "سجل المعاملات" : "Financial Log"} />

            <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex flex-col">
                        <h1 className={DS_pageTitle}>
                            {isRTL ? "سجل التحصيل المالي" : "Financial Collection Log"}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {transactions.total} {isRTL ? "عملية مسجلة" : "Total Transactions Recorded"}
                            </span>
                        </div>
                    </div>
                    
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={16} />
                        {isRTL ? "تصدير التقرير" : "Export Report"}
                    </button>
                </div>

                {/* Intelligent Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className={DS_statCard('navy')}>
                        <div className={DS_statIcon('navy')}><Receipt size={20} /></div>
                        <div>
                            <p className={DS_statLabel}>{isRTL ? "إجمالي المحصل" : "Total Collected"}</p>
                            <p className={DS_statValue2('navy')}>
                                ${transactions.data.reduce((acc, curr) => acc + parseFloat(curr.amount as string), 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className={DS_statCard('green')}>
                        <div className={DS_statIcon('green')}><ArrowDownLeft size={20} /></div>
                        <div>
                            <p className={DS_statLabel}>{isRTL ? "عمليات اليوم" : "Today's Collections"}</p>
                            <p className={DS_statValue2('green')}>$0.00</p>
                        </div>
                    </div>
                    <div className={DS_statCard('gold')}>
                        <div className={DS_statIcon('gold')}><CheckCircle2 size={20} /></div>
                        <div>
                            <p className={DS_statLabel}>{isRTL ? "المعدل الشهري" : "Monthly Average"}</p>
                            <p className={DS_statValue2('gold')}>$0.00</p>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className={DS_card}>
                    <div className="p-6 border-b border-gray-100 dark:border-[#243460] flex items-center justify-between bg-slate-50/50 dark:bg-[#0f2044]/10">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-6 bg-[#f5b800] rounded-full" />
                            <h2 className="text-sm font-black text-[#0f2044] dark:text-white uppercase tracking-wider">
                                {isRTL ? "قائمة العمليات المالية" : "Transaction List"}
                            </h2>
                        </div>
                    </div>
                    
                    <BaseDataTable<Transaction>
                        columns={columns}
                        data={transactions.data}
                        pagination={pagination}
                        searchValue={search}
                        onSearchChange={handleSearch}
                        searchPlaceholder={isRTL ? "ابحث برقم المعاملة أو اسم المدرسة..." : "Search by transaction ID or school..."}
                    />
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
