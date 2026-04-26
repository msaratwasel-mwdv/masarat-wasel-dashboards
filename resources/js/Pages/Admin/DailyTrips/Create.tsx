import React from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
    driver_id?: number | null;
    supervisor_id?: number | null;
    route_id?: number | null;
}

interface Route {
    id: number;
    name: string;
}

interface Props {
    auth: any;
    buses: Bus[];
    routes: Route[];
}

export default function Create({ auth, buses, routes }: Props) {
    const { isRTL } = useTheme();
    const { flash } = usePage().props as any;

    const getLocalDate = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };

    const { data, setData, post, processing, errors } = useForm({
        bus_id: '',
        route_id: '',
        type: 'forth',
        date: getLocalDate(),
    });

    useEffect(() => {
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    useEffect(() => {
        if (data.bus_id) {
            const bus = buses.find(b => b.id === parseInt(data.bus_id));
            if (bus && bus.route_id) {
                setData('route_id', bus.route_id.toString());
            }
        }
    }, [data.bus_id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.daily-trips.store'));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? 'إنشاء رحلة يدوية' : 'Create Manual Trip'} />

            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isRTL ? '➕ إنشاء رحلة يدوية' : '➕ Create Manual Trip'}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {isRTL
                            ? 'إضافة رحلة جديدة يدوياً لحافلة محددة'
                            : 'Manually add a new trip for a specific bus'}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Bus Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {isRTL ? 'الحافلة' : 'Bus'}
                            </label>
                            <select
                                value={data.bus_id}
                                onChange={e => setData('bus_id', e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">{isRTL ? 'اختر الحافلة' : 'Select Bus'}</option>
                                {buses.map(bus => {
                                    const isMissingInfo = !bus.driver_id || !bus.supervisor_id;
                                    return (
                                        <option key={bus.id} value={bus.id}>
                                            {bus.bus_number} ({bus.plate_number})
                                            {isMissingInfo ? (isRTL ? ' - تفاصيل ناقصة' : ' - Missing Info') : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            {errors.bus_id && <p className="text-red-500 text-xs mt-1">{errors.bus_id}</p>}
                        </div>

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
                                    const selectedBus = buses.find(b => b.id === parseInt(data.bus_id));
                                    const isDefault = selectedBus?.route_id === route.id;
                                    return (
                                        <option key={route.id} value={route.id}>
                                            {route.name} {isDefault ? (isRTL ? '(المسار الافتراضي)' : '(Bus Default)') : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            {errors.route_id && <p className="text-red-500 text-xs mt-1">{errors.route_id}</p>}
                        </div>

                        {/* Trip Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {isRTL ? 'نوع الرحلة' : 'Trip Type'}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setData('type', 'forth')}
                                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${data.type === 'forth'
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    ↗ {isRTL ? 'ذهاب' : 'Forth'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('type', 'back')}
                                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${data.type === 'back'
                                        ? 'bg-orange-600 border-orange-600 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    ↙ {isRTL ? 'إياب' : 'Back'}
                                </button>
                            </div>
                            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {isRTL ? 'التاريخ' : 'Date'}
                            </label>
                            <input
                                type="date"
                                value={data.date}
                                onChange={e => setData('date', e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                        </div>

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
                                {processing ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ الرحلة' : 'Save Trip')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
