import React from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
    DS_pageWrapper, 
    DS_inputCls, 
    DS_labelCls, 
    DS_submitBtn, 
    DS_cancelBtn 
} from "@/lib/DS";
import { Edit3, Calendar, Bus as BusIcon, MapPin, ArrowLeft, Clock, Activity } from 'lucide-react';

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

            <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 pt-6 pb-12`}>
                <div className="max-w-3xl mx-auto">
                    {/* Unified Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <button 
                                onClick={() => router.get(route('admin.daily-trips.index'))}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-[#1a2845] rounded-xl transition-all"
                            >
                                <ArrowLeft className={`w-5 h-5 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                            </button>
                            <h1 className="text-2xl font-extrabold text-[#0f2044] dark:text-white">
                                {isRTL ? 'تعديل بيانات الرحلة' : 'Edit Trip Details'}
                            </h1>
                        </div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-12">
                            {isRTL
                                ? `تعديل تفاصيل رحلة حافلة ${trip.bus?.bus_number || '---'}`
                                : `Editing trip details for bus ${trip.bus?.bus_number || '---'}`}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#1a2845] rounded-[22px] shadow-2xl shadow-[#0f2044]/5 border border-gray-100 dark:border-[#243460] overflow-hidden">
                        <div className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Route Selection */}
                                    <div>
                                        <label className={DS_labelCls}>
                                            <MapPin className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
                                            {isRTL ? 'المسار' : 'Route'}
                                        </label>
                                        <select
                                            value={data.route_id}
                                            onChange={e => setData('route_id', e.target.value)}
                                            className={DS_inputCls}
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
                                        {errors.route_id && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.route_id}</p>}
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className={DS_labelCls}>
                                            <Activity className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
                                            {isRTL ? 'حالة الرحلة' : 'Trip Status'}
                                        </label>
                                        <select
                                            value={data.status}
                                            onChange={e => setData('status', e.target.value)}
                                            className={DS_inputCls}
                                            required
                                        >
                                            {statusOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {isRTL ? opt.labelAr : opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.status && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.status}</p>}
                                    </div>

                                    {/* Departure Time */}
                                    <div>
                                        <label className={DS_labelCls}>
                                            <Clock className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
                                            {isRTL ? 'وقت التحرك' : 'Departure Time'}
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={data.departure_time}
                                            onChange={e => setData('departure_time', e.target.value)}
                                            className={DS_inputCls}
                                            required
                                        />
                                        {errors.departure_time && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.departure_time}</p>}
                                    </div>

                                    {/* Arrival Time */}
                                    <div>
                                        <label className={DS_labelCls}>
                                            <Clock className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
                                            {isRTL ? 'وقت الوصول' : 'Arrival Time'}
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={data.arrival_time}
                                            onChange={e => setData('arrival_time', e.target.value)}
                                            className={DS_inputCls}
                                        />
                                        {errors.arrival_time && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.arrival_time}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-100 dark:border-[#243460]">
                                    <button
                                        type="button"
                                        onClick={() => router.get(route('admin.daily-trips.index'))}
                                        className="px-8 py-2.5 text-xs font-black text-gray-400 dark:text-[#7ba7e8]/40 hover:text-gray-600 transition-colors uppercase tracking-widest"
                                    >
                                        {isRTL ? 'إلغاء' : 'Cancel'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-10 py-2.5 bg-[#f5b800] hover:bg-[#e5ac00] text-[#0f2044] rounded-xl text-xs font-black shadow-lg shadow-[#f5b800]/20 transition-all disabled:opacity-50 active:scale-95"
                                    >
                                        {processing ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'تحديث البيانات' : 'Update Trip')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
