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
    DS_cancelBtn,
    DS_selectCls
} from "@/lib/DS";
import { Zap, Calendar, Bus as BusIcon, MapPin, ArrowLeft } from 'lucide-react';
import SearchableSelect from '@/Components/SearchableSelect';
import { useMemo } from 'react';

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

    const handleRouteChange = (val: string | number) => {
        const rId = val.toString();
        const selectedRoute = routes.find(r => r.id === Number(val));
        const assignedBus = (selectedRoute as any)?.buses?.[0] || buses.find(b => b.route_id === Number(val));

        setData(prev => ({
            ...prev,
            route_id: rId,
            bus_id: assignedBus ? assignedBus.id.toString() : ''
        }));
    };

    const routeOptions = useMemo(() => routes.map(route => {
        const assignedBus = (route as any)?.buses?.[0] || buses.find(b => b.route_id === route.id);
        const busText = assignedBus
            ? ` - ${isRTL ? 'حافلة' : 'Bus'} ${assignedBus.bus_number}${assignedBus.plate_number ? ` (${assignedBus.plate_number})` : ''}`
            : ` - (${isRTL ? 'بدون حافلة' : 'No bus'})`;

        return {
            id: route.id,
            label: `${route.name}${busText}`,
            subLabel: assignedBus?.plate_number ? `${isRTL ? 'اللوحة:' : 'Plate:'} ${assignedBus.plate_number}` : undefined
        };
    }), [routes, buses, isRTL]);

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
        post(route('admin.daily-trips.store'));
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? 'إنشاء رحلة يدوية' : 'Create Manual Trip'} />

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
                                {isRTL ? 'إنشاء رحلة يدوية' : 'Create Manual Trip'}
                            </h1>
                        </div>
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-12">
                            {isRTL ? 'إضافة رحلة جديدة يدوياً لحافلة محددة' : 'Manually add a new trip for a specific bus'}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#1a2845] rounded-[22px] shadow-2xl shadow-[#0f2044]/5 border border-gray-100 dark:border-[#243460] overflow-hidden">
                        <div className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Route Selection (Bus is automatically determined) */}
                                    <div className="col-span-1 md:col-span-2">
                                        <SearchableSelect
                                            label={isRTL ? 'المسار (مع الحافلة المرتبطة به)' : 'Route (With linked bus)'}
                                            options={routeOptions}
                                            value={data.route_id}
                                            onChange={handleRouteChange}
                                            placeholder={isRTL ? 'اختر المسار...' : 'Select Route...'}
                                        />
                                        {errors.route_id && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.route_id}</p>}
                                        {errors.bus_id && !errors.route_id && (
                                            <p className="text-amber-600 dark:text-amber-400 text-[10px] font-bold mt-1 uppercase">
                                                {isRTL ? 'تنبيه: هذا المسار لا توجد حافلة مخصصة له حالياً' : 'Warning: This route currently has no bus assigned'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label className={DS_labelCls}>
                                            <Calendar className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
                                            {isRTL ? 'التاريخ' : 'Date'}
                                        </label>
                                        <input
                                            type="date"
                                            value={data.date}
                                            onChange={e => setData('date', e.target.value)}
                                            className={DS_inputCls}
                                            required
                                        />
                                        {errors.date && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.date}</p>}
                                    </div>

                                    <div>
                                        <label className={DS_labelCls}>
                                            <Zap className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
                                            {isRTL ? 'نوع الرحلة' : 'Trip Type'}
                                        </label>
                                        <div className="grid grid-cols-3 gap-2 mt-1">
                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'forth')}
                                                className={`px-3 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${data.type === 'forth'
                                                    ? 'bg-[#0f2044] border-[#0f2044] text-white shadow-lg'
                                                    : 'bg-gray-50 dark:bg-[#243460] border-transparent text-gray-500 dark:text-[#7ba7e8]/60 hover:bg-gray-100'
                                                    }`}
                                            >
                                                ↗ {isRTL ? 'ذهاب' : 'Forth'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'back')}
                                                className={`px-3 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${data.type === 'back'
                                                    ? 'bg-[#f5b800] border-[#f5b800] text-[#0f2044] shadow-lg'
                                                    : 'bg-gray-50 dark:bg-[#243460] border-transparent text-gray-500 dark:text-[#7ba7e8]/60 hover:bg-gray-100'
                                                    }`}
                                            >
                                                ↙ {isRTL ? 'إياب' : 'Back'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('type', 'both')}
                                                className={`px-3 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${data.type === 'both'
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg'
                                                    : 'bg-gray-50 dark:bg-[#243460] border-transparent text-gray-500 dark:text-[#7ba7e8]/60 hover:bg-gray-100'
                                                    }`}
                                            >
                                                🔁 {isRTL ? 'ذهاب وإياب' : 'Both'}
                                            </button>
                                        </div>
                                        {errors.type && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.type}</p>}
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
                                        {processing ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ الرحلة' : 'Save Trip')}
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
