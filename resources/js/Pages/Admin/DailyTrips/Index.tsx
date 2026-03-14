import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { toast } from 'react-toastify';

interface Driver {
    name: string;
}

interface Bus {
    id: number;
    bus_number: string;
    driver?: Driver;
    route?: {
        name: string;
    };
}

interface Trip {
    id: number;
    type: 'forth' | 'back';
    status: string;
    departure_time: string;
    arrival_time: string | null;
    bus?: Bus;
    driver?: Driver;
    assistant?: {
        name: string;
    };
}

interface PaginatedTrips {
    data: Trip[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

interface Props {
    auth: any;
    trips: PaginatedTrips;
    filters: {
        date?: string;
        status?: string;
    };
}

const statusConfig: Record<string, { label: string; labelAr: string; class: string }> = {
    pending: { label: 'Pending', labelAr: 'في الانتظار', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
    in_progress: { label: 'In Progress', labelAr: 'جارية', class: 'bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300' },
    completed: { label: 'Completed', labelAr: 'مكتملة', class: 'bg-green-100  text-green-800  dark:bg-green-900/40  dark:text-green-300' },
    cancelled: { label: 'Cancelled', labelAr: 'ملغاة', class: 'bg-red-100    text-red-800    dark:bg-red-900/40    dark:text-red-300' },
};

export default function Index({ auth, trips, filters }: Props) {
    const { isRTL } = useTheme();
    const { flash } = usePage().props as any;
    const [dateFilter, setDateFilter] = useState(filters.date || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    useEffect(() => {
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    const applyFilters = () => {
        router.get(route('admin.daily-trips.index'), {
            date: dateFilter || undefined,
            status: statusFilter || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setDateFilter('');
        setStatusFilter('');
        router.get(route('admin.daily-trips.index'));
    };

    const getStatus = (status: string) => statusConfig[status] || { label: status, labelAr: status, class: 'bg-gray-100 text-gray-700' };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? 'الرحلات اليومية' : 'Daily Trips'} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {isRTL ? '🚌 الرحلات اليومية' : '🚌 Daily Trips'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {isRTL
                                ? 'رحلات الذهاب والعودة المُنشأة تلقائياً يومياً'
                                : 'Auto-generated forth & back trips for each school day'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2 mr-2">
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                                {isRTL ? `الإجمالي: ${trips.total} رحلة` : `Total: ${trips.total} trips`}
                            </span>
                        </div>

                        <button
                            onClick={() => router.get(route('admin.daily-trips.create'))}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
                        >
                            <span>➕</span>
                            {isRTL ? 'إنشاء يدوي' : 'Manual Create'}
                        </button>

                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
                            <input
                                type="date"
                                id="autoCreateDate"
                                className="bg-transparent border-none focus:ring-0 text-sm dark:text-white px-2 py-1"
                                defaultValue={new Date().toISOString().split('T')[0]}
                            />
                            <button
                                onClick={() => {
                                    const dateInput = document.getElementById('autoCreateDate') as HTMLInputElement;
                                    if (confirm(isRTL ? 'هل أنت متأكد من إنشاء رحلات لهذا اليوم؟' : 'Are you sure you want to create trips for this date?')) {
                                        router.post(route('admin.daily-trips.auto-create'), { date: dateInput.value });
                                    }
                                }}
                                className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
                            >
                                🚀 {isRTL ? 'توليد تلقائي' : 'Auto-Create'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                {isRTL ? 'التاريخ' : 'Date'}
                            </label>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                {isRTL ? 'الحالة' : 'Status'}
                            </label>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{isRTL ? 'كل الحالات' : 'All Statuses'}</option>
                                {Object.entries(statusConfig).map(([key, val]) => (
                                    <option key={key} value={key}>{isRTL ? val.labelAr : val.label}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={applyFilters}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            {isRTL ? 'تطبيق' : 'Apply'}
                        </button>

                        {(dateFilter || statusFilter) && (
                            <button
                                onClick={clearFilters}
                                className="px-5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg transition-colors"
                            >
                                {isRTL ? 'مسح الفلاتر' : 'Clear'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 text-center">#</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 text-center">
                                        {isRTL ? 'التاريخ' : 'Date'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 text-center">
                                        {isRTL ? 'الاتجاه' : 'Direction'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 text-center">
                                        {isRTL ? 'الحافلة' : 'Bus'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 text-center">
                                        {isRTL ? 'المسار' : 'Route'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 text-center">
                                        {isRTL ? 'السائق' : 'Driver'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 text-center">
                                        {isRTL ? 'المشرف' : 'Supervisor'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 text-center">
                                        {isRTL ? 'الحالة' : 'Status'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500 dark:text-gray-400 text-center">
                                        {isRTL ? 'إجراءات' : 'Actions'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {trips.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-20 text-center text-gray-400 dark:text-gray-500">
                                            <div className="flex flex-col items-center gap-3">
                                                <span className="text-5xl">🚌</span>
                                                <p className="text-base font-medium">
                                                    {isRTL ? 'لا توجد رحلات يومية بعد' : 'No daily trips found'}
                                                </p>
                                                <p className="text-xs">
                                                    {isRTL
                                                        ? 'سيتم إنشاؤها تلقائياً عند تشغيل الجدولة'
                                                        : 'They will be auto-created by the scheduler at 01:00 AM'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    trips.data.map((trip, index) => {
                                        const st = getStatus(trip.status);
                                        const isForte = trip.type === 'forth';
                                        return (
                                            <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="px-6 py-4 text-center text-gray-500 dark:text-gray-400 font-mono text-xs">
                                                    {(trips.current_page - 1) * trips.per_page + index + 1}
                                                </td>
                                                <td className="px-6 py-4 text-center font-medium text-gray-800 dark:text-gray-200">
                                                    {new Date(trip.departure_time).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isForte
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                                                        }`}>
                                                        {isForte ? '↗' : '↙'} {isForte
                                                            ? (isRTL ? 'ذهاب' : 'Forth')
                                                            : (isRTL ? 'إياب' : 'Back')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300 font-medium">
                                                    {trip.bus?.bus_number || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400 text-xs">
                                                    {trip.bus?.route?.name || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">
                                                    {trip.driver?.name || trip.bus?.driver?.name || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">
                                                    {trip.assistant?.name || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${st.class}`}>
                                                        {isRTL ? st.labelAr : st.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => router.get(route('admin.daily-trips.edit', trip.id))}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title={isRTL ? 'تعديل' : 'Edit'}
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
                                                                    router.delete(route('admin.daily-trips.destroy', trip.id));
                                                                }
                                                            }}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title={isRTL ? 'حذف' : 'Delete'}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {trips.last_page > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {isRTL
                                    ? `الصفحة ${trips.current_page} من ${trips.last_page}`
                                    : `Page ${trips.current_page} of ${trips.last_page}`}
                            </span>
                            <div className="flex gap-2">
                                {trips.current_page > 1 && (
                                    <button
                                        onClick={() => router.get(route('admin.daily-trips.index'), { ...filters, page: trips.current_page - 1 })}
                                        className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        {isRTL ? 'السابق' : 'Prev'}
                                    </button>
                                )}
                                {trips.current_page < trips.last_page && (
                                    <button
                                        onClick={() => router.get(route('admin.daily-trips.index'), { ...filters, page: trips.current_page + 1 })}
                                        className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        {isRTL ? 'التالي' : 'Next'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
