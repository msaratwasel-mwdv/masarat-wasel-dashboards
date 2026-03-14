import React from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

interface User {
    id: number;
    name: string;
}

interface Bus {
    id: number;
    bus_number: string;
    driver?: User;
    supervisor?: User;
}

interface Trip {
    id: number;
    bus_id: number;
    route_id: number;
    driver_id: number | null;
    assistant_id: number | null;
    status: string;
    departure_time: string;
    arrival_time: string | null;
    bus: Bus | null;
}

interface Route {
    id: number;
    name: string;
}

interface Props {
    auth: any;
    trip: Trip;
    routes: Route[];
    buses: Bus[];
}

export default function Edit({ auth, trip, routes, buses }: Props) {
    const { isRTL } = useTheme();
    const { flash } = usePage().props as any;

    const { data, setData, put, processing, errors } = useForm({
        route_id: trip.route_id || '',
        driver_id: trip.driver_id || '',
        assistant_id: trip.assistant_id || '',
        status: trip.status,
        departure_time: trip.departure_time ? new Date(trip.departure_time).toISOString().slice(0, 16) : '',
        arrival_time: trip.arrival_time ? new Date(trip.arrival_time).toISOString().slice(0, 16) : '',
    });

    useEffect(() => {
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.daily-trips.update', trip.id));
    };

    const statusOptions = [
        { value: 'pending', label: 'Pending', labelAr: 'في الانتظار' },
        { value: 'ongoing', label: 'Ongoing', labelAr: 'جارية' },
        { value: 'completed', label: 'Completed', labelAr: 'مكتملة' },
        { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغاة' },
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? 'تعديل الرحلة' : 'Edit Trip'} />

            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isRTL ? '✏️ تعديل الرحلة' : '✏️ Edit Trip'}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {isRTL
                            ? `تعديل تفاصيل رحلة حافلة ${trip.bus?.bus_number || '---'}`
                            : `Editing trip details for bus ${trip.bus?.bus_number || '---'}`}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Route Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {isRTL ? 'المسار' : 'Route'}
                            </label>
                            <select
                                value={data.route_id}
                                onChange={e => setData('route_id', e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">{isRTL ? 'اختر المسار' : 'Select Route'}</option>
                                {routes.map(route => {
                                    const isDefault = trip.bus?.route_id === route.id;
                                    return (
                                        <option key={route.id} value={route.id}>
                                            {route.name} {isDefault ? (isRTL ? '(المسار الافتراضي)' : '(Bus Default)') : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            {errors.route_id && <p className="text-red-500 text-xs mt-1">{errors.route_id}</p>}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {isRTL ? 'حالة الرحلة' : 'Trip Status'}
                            </label>
                            <select
                                value={data.status}
                                onChange={e => setData('status', e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {isRTL ? opt.labelAr : opt.label}
                                    </option>
                                ))}
                            </select>
                            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Departure Time */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {isRTL ? 'وقت التحرك' : 'Departure Time'}
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.departure_time}
                                    onChange={e => setData('departure_time', e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                {errors.departure_time && <p className="text-red-500 text-xs mt-1">{errors.departure_time}</p>}
                            </div>

                            {/* Arrival Time */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {isRTL ? 'وقت الوصول' : 'Arrival Time'}
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.arrival_time}
                                    onChange={e => setData('arrival_time', e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.arrival_time && <p className="text-red-500 text-xs mt-1">{errors.arrival_time}</p>}
                            </div>
                        </div>

                        {/* Note: In a real "full control" scenario, we might want to change drivers here as well.
                            For now, we'll keep it focused on the trip status and times. */}

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => router.get(route('admin.daily-trips.index'))}
                                className="px-6 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                {isRTL ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                            >
                                {processing ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'تحديث الرحلة' : 'Update Trip')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
