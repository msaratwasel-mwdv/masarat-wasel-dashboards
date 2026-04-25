import React, { useState } from 'react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';
import { motion } from 'framer-motion';
import { 
    Calendar, 
    Bus as BusIcon, 
    Clock, 
    ArrowRight, 
    Activity,
    Filter,
    Users,
    Navigation,
    Route as RouteIcon,
    AlertCircle
} from 'lucide-react';
import {
    DS_pageWrapper,
    DS_pageTitle,
    DS_card,
    DS_searchInput,
    DS_statCard,
    DS_statIcon,
    DS_statLabel,
    DS_statValue,
    DS_tableWrapper,
    DS_tableBase,
    DS_tableHead,
    DS_tableTh,
    DS_tableRow,
    DS_tableTd,
    DS_badge
} from '@/lib/DS';

interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
    driver?: { id: number; user?: { id: number; name: string } };
    assistant?: { id: number; name: string };
    route?: { id: number; name: string };
}

interface Trip {
    id: number;
    type: string;
    status: 'pending' | 'in_progress' | 'finished';
    trip_date: string;
    attendances_count: number;
    bus: Bus;
}

interface FieldTrip {
    id: number;
    destination_description: string;
    status: string;
    bus: Bus;
}

interface Route {
    id: number;
    name: string;
    code?: string;
    morning_students_count?: number;
    afternoon_students_count?: number;
    buses?: any[];
}

interface Props {
    auth: any;
    dailyTrips: Trip[];
    fieldTrips: FieldTrip[];
    routes: Route[];
    filters: { date: string; route_id?: string };
    stats: {
        total_trips: number;
        finished: number;
        in_progress: number;
        total_routes: number;
        active_buses: number;
        pending_field_trips: number;
    };
}

export default function TripDashboard({ auth, dailyTrips, fieldTrips, routes, filters, stats }: Props) {
    const { t, lang } = useTranslation();
    const isRtl = lang === 'ar';
    const [activeTab, setActiveTab] = useState<'trips' | 'routes'>('trips');
    const [date, setDate] = useState(filters.date);
    const [routeId, setRouteId] = useState(filters.route_id || "");

    const [searchQuery, setSearchQuery] = useState('');

    const handleFilterChange = (newDate: string, newRouteId: string) => {
        router.get(route('school.trips.dashboard'), { date: newDate, route_id: newRouteId }, { preserveState: true });
    };

    const translateStatus = (status: string) => {
        if (status === 'finished') return isRtl ? 'مكتملة' : 'Finished';
        if (status === 'in_progress') return isRtl ? 'قيد التنفيذ' : 'In Progress';
        if (status === 'pending') return isRtl ? 'قيد الانتظار' : 'Pending';
        return status;
    };

    const filteredTrips = dailyTrips.filter(trip => {
        const matchesRoute = !routeId || trip.bus?.route?.id?.toString() === routeId.toString();
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || 
            trip.bus?.route?.name?.toLowerCase().includes(searchLower) ||
            trip.bus?.bus_number?.toLowerCase().includes(searchLower) ||
            trip.bus?.driver?.user?.name?.toLowerCase().includes(searchLower) ||
            (trip.type === 'forth' ? (isRtl ? 'صباحي' : 'am') : (isRtl ? 'مسائي' : 'pm')).includes(searchLower);
            
        return matchesRoute && matchesSearch;
    });

    const statsCards = [
        { label: isRtl ? 'الرحلات النشطة' : 'Active Trips', val: stats.in_progress, icon: <Activity className="w-5 h-5" />, accent: 'blue' as const },
        { label: isRtl ? 'جاهزية الحافلات' : 'Active Buses', val: stats.active_buses, icon: <BusIcon className="w-5 h-5" />, accent: 'navy' as const },
        { label: isRtl ? 'إجمالي المسارات' : 'Total Routes', val: stats.total_routes, icon: <RouteIcon className="w-5 h-5" />, accent: 'green' as const },
        { label: isRtl ? 'الرحلات الخارجية' : 'Field Trips', val: stats.pending_field_trips, icon: <Navigation className="w-5 h-5" />, accent: 'gold' as const },
    ];

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                    <h2 className={DS_pageTitle}>
                        {isRtl ? 'مركز إدارة الرحلات' : 'Fleet Operations Center'}
                    </h2>
                    
                    {/* Tabs */}
                    <div className="flex p-1 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 rounded-[14px]">
                        <button 
                            onClick={() => setActiveTab('trips')}
                            className={`px-6 py-2 rounded-[10px] text-xs font-bold transition-all ${
                                activeTab === 'trips' 
                                ? 'bg-white dark:bg-[#0f2044] text-[#0f2044] dark:text-[#f5b800] shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-[#0f2044] dark:hover:text-white'
                            }`}
                        >
                            {isRtl ? 'الرحلات اليومية' : 'Daily Trips'}
                        </button>
                        <button 
                            onClick={() => setActiveTab('routes')}
                            className={`px-6 py-2 rounded-[10px] text-xs font-bold transition-all ${
                                activeTab === 'routes' 
                                ? 'bg-white dark:bg-[#0f2044] text-[#0f2044] dark:text-[#f5b800] shadow-sm' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-[#0f2044] dark:hover:text-white'
                            }`}
                        >
                            {isRtl ? 'المسارات الثابتة' : 'Static Routes'}
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={isRtl ? 'لوحة الرحلات' : 'Trips Dashboard'} />

            <div className={DS_pageWrapper}>
                {/* Stats Grid */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statsCards.map(s => (
                        <div key={s.label} className={`${DS_statCard(s.accent)} ${isRtl ? "flex-row-reverse" : ""}`}>
                            <div className={DS_statIcon(s.accent)}>{s.icon}</div>
                            <div className={isRtl ? "text-right" : "text-left"}>
                                <p className={DS_statLabel}>{s.label}</p>
                                <p className={DS_statValue}>{s.val}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {activeTab === 'trips' ? (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Primary Trip List */}
                        <div className="xl:col-span-2 space-y-6">
                            <div className={DS_card}>
                                {/* Toolbar */}
                                <div className="p-4 border-b border-gray-100 dark:border-[#243460] flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 dark:bg-[#0f2044]/5">
                                    <div className="flex items-center gap-2">
                                        <RouteIcon className="w-5 h-5 text-[#0f2044] dark:text-[#7ba7e8]" />
                                        <h3 className="font-bold text-[#0f2044] dark:text-white">
                                            {isRtl ? 'جدول رحلات اليوم' : 'Today\'s Schedule'}
                                        </h3>
                                    </div>
                                    
                                    <div className="flex gap-3 flex-wrap">
                                        <div className="relative">
                                            <Calendar className={`absolute w-4 h-4 text-gray-400 top-1/2 -translate-y-1/2 ${isRtl ? "right-3" : "left-3"}`} />
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => { setDate(e.target.value); handleFilterChange(e.target.value, routeId); }}
                                                className={`${DS_searchInput} ${isRtl ? 'pr-10' : 'pl-10'} py-2 min-w-[150px]`}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Filter className={`absolute w-4 h-4 text-gray-400 top-1/2 -translate-y-1/2 ${isRtl ? "right-3" : "left-3"}`} />
                                            <select
                                                value={routeId}
                                                onChange={(e) => { setRouteId(e.target.value); handleFilterChange(date, e.target.value); }}
                                                className={`${DS_searchInput} ${isRtl ? 'pr-10' : 'pl-10'} py-2 min-w-[150px]`}
                                            >
                                                <option value="">{isRtl ? 'جميع المسارات' : 'All Routes'}</option>
                                                {routes.map((r: any) => <option key={r.id} value={r.id.toString()}>{r.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Table */}
                                <div className={DS_tableWrapper}>
                                    <table className={DS_tableBase}>
                                        <thead className={DS_tableHead}>
                                            <tr>
                                                <th className={DS_tableTh(isRtl)}>{isRtl ? 'الرحلة / المسار' : 'Trip Identity'}</th>
                                                <th className={DS_tableTh(isRtl)}>{isRtl ? 'الحافلة والطاقم' : 'Resource Assign'}</th>
                                                <th className={DS_tableTh(isRtl)}>{isRtl ? 'الحالة' : 'Status'}</th>
                                                <th className={`${DS_tableTh(isRtl)} ${isRtl ? 'text-left' : 'text-right'}`}>
                                                    {isRtl ? 'التفاصيل' : 'Details'}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTrips.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="py-16 text-center text-gray-400">
                                                        <RouteIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                                        <p className="font-bold">{isRtl ? 'لا توجد رحلات مطابقة للبحث أو الفلتر' : 'No trips found'}</p>
                                                    </td>
                                                </tr>
                                            ) : filteredTrips.map((trip) => (
                                                <tr key={trip.id} className={`${DS_tableRow} cursor-pointer group`} onClick={() => router.get(route('school.trips.show', trip.id))}>
                                                    <td className={DS_tableTd}>
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-[14px] flex flex-col items-center justify-center border ${
                                                                trip.type === 'forth' 
                                                                ? 'bg-[#0f2044]/5 border-[#0f2044]/10 text-[#0f2044] dark:bg-[#0f2044]/30 dark:border-[#243460] dark:text-[#7ba7e8]' 
                                                                : 'bg-[#f5b800]/10 border-[#f5b800]/20 text-[#7a5c00] dark:bg-[#f5b800]/20 dark:border-[#f5b800]/30 dark:text-[#f5b800]'
                                                            }`}>
                                                                <span className="text-[10px] font-black uppercase leading-none">{trip.type === 'forth' ? (isRtl ? 'صباحي' : 'AM') : (isRtl ? 'مسائي' : 'PM')}</span>
                                                                <Clock className="w-3 h-3 mt-1 opacity-50" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-[#0f2044] dark:text-white group-hover:text-indigo-600 transition-colors">
                                                                    {trip.bus?.route?.name || (isRtl ? 'غير معين' : 'Unassigned Route')}
                                                                </span>
                                                                <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-[8px] bg-gray-50 dark:bg-[#0f2044]/20 border border-gray-100 dark:border-[#243460] w-fit">
                                                                    <Users className="w-3 h-3 text-gray-400" />
                                                                    <span className="text-[10px] font-bold text-gray-500 tracking-tighter">
                                                                        {trip.attendances_count} {isRtl ? 'طلاب' : 'Students'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={DS_tableTd}>
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="px-2 py-0.5 rounded-[8px] bg-[#0f2044]/5 dark:bg-[#0f2044]/30 text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] border border-[#0f2044]/10 dark:border-[#243460]">
                                                                    {trip.bus?.bus_number || '---'}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-1">{isRtl ? 'السائق' : 'Driver'}</span>
                                                                    <span className={`text-xs font-bold leading-none ${trip.bus?.driver?.user?.name ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 italic'}`}>
                                                                        {trip.bus?.driver?.user?.name || (isRtl ? 'غير معين' : 'Unassigned')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-1 rtl:ml-0 rtl:mr-1">
                                                                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] font-black text-gray-400 tracking-tighter">{isRtl ? 'المشرف:' : 'Assistant:'}</span>
                                                                    <span className={`text-[10px] font-bold ${trip.bus?.assistant?.name ? 'text-gray-500' : 'text-gray-400 italic'}`}>
                                                                        {trip.bus?.assistant?.name || (isRtl ? 'غير معين' : 'Not Assigned')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className={DS_tableTd}>
                                                        <span className={`${DS_badge(trip.status === 'finished')} ${trip.status === 'in_progress' ? '!bg-blue-50 !text-blue-600 dark:!bg-blue-900/30 dark:!text-blue-400 !border-blue-100 dark:!border-blue-800' : ''}`}>
                                                            {trip.status === 'in_progress' && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse ml-1.5 rtl:mr-1.5 rtl:ml-0" />}
                                                            {translateStatus(trip.status)}
                                                        </span>
                                                    </td>
                                                    <td className={`${DS_tableTd} ${isRtl ? 'text-left' : 'text-right'}`}>
                                                        <button className="p-2 rounded-[10px] bg-[#0f2044]/5 text-gray-400 hover:text-[#0f2044] hover:bg-[#0f2044]/10 dark:bg-[#0f2044]/30 dark:hover:bg-[#0f2044]/50 dark:hover:text-white transition-all">
                                                            <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Column */}
                        <div className="space-y-6">
                            {/* Special Operations / Field Trips */}
                            <div className={DS_card}>
                                <div className="p-4 border-b border-rose-100 dark:border-rose-900/30 flex items-center gap-2 bg-rose-50/50 dark:bg-rose-900/10">
                                    <Navigation className="w-5 h-5 text-rose-500" />
                                    <h3 className="font-bold text-rose-600 dark:text-rose-400">
                                        {isRtl ? 'الرحلات الاستثنائية' : 'Special Operations'}
                                    </h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    {fieldTrips.length > 0 ? (
                                        fieldTrips.map(trip => (
                                            <div key={trip.id} className="p-4 rounded-[16px] bg-gray-50 dark:bg-[#0f2044]/10 border border-gray-100 dark:border-[#243460] hover:border-rose-200 transition-all cursor-pointer">
                                                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex justify-between items-center tracking-tight mb-2">
                                                    {trip.destination_description}
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-[6px] bg-rose-500 text-white animate-pulse">LIVE</span>
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-500 bg-white dark:bg-[#0f2044]/30 px-2 py-0.5 rounded-[6px] border border-gray-100 dark:border-[#243460]">
                                                        {isRtl ? 'حافلة' : 'Bus'} #{trip.bus?.bus_number}
                                                    </span>
                                                    <span className="text-[10px] font-black text-rose-500">{translateStatus(trip.status)}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-gray-400">
                                            <Navigation className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">{isRtl ? 'لا توجد رحلات خارجية' : 'No active field trips'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Operational Insight */}
                            <div className="bg-gradient-to-br from-[#0f2044] to-[#1a2b54] rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 opacity-10">
                                    <Activity className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <h4 className="font-black text-lg mb-2 text-[#f5b800]">{isRtl ? 'نظرة تشغيلية' : 'Operational Insight'}</h4>
                                    <p className="text-xs text-blue-100/80 leading-relaxed font-medium">
                                        {isRtl 
                                            ? "كفاءة تشغيل الرحلات اليوم مستقرة جداً. نرجو التحقق الدائم من حضور الطلاب في الرحلات المسائية." 
                                            : "Fleet efficiency is highly stable today. Ensure continuous attendance verification during afternoon shifts."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    /* Static Routes Tab */
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={DS_card}>
                        <div className="p-4 border-b border-gray-100 dark:border-[#243460] flex items-center gap-2 bg-gray-50/50 dark:bg-[#0f2044]/5">
                            <RouteIcon className="w-5 h-5 text-[#0f2044] dark:text-[#7ba7e8]" />
                            <h3 className="font-bold text-[#0f2044] dark:text-white">
                                {isRtl ? 'المسارات الثابتة' : 'Static Routes'}
                            </h3>
                        </div>
                        
                        <div className={DS_tableWrapper}>
                            <table className={DS_tableBase}>
                                <thead className={DS_tableHead}>
                                    <tr>
                                        <th className={DS_tableTh(isRtl)}>{isRtl ? 'كود واسم المسار' : 'Route Code & Name'}</th>
                                        <th className={DS_tableTh(isRtl)}>{isRtl ? 'الحافلات المعينة' : 'Assigned Units'}</th>
                                        <th className={DS_tableTh(isRtl)}>{isRtl ? 'رحلة الصباح (ذهاب)' : 'Morning Shift'}</th>
                                        <th className={DS_tableTh(isRtl)}>{isRtl ? 'رحلة المساء (إياب)' : 'Afternoon Shift'}</th>
                                        <th className={`${DS_tableTh(isRtl)} ${isRtl ? 'text-left' : 'text-right'}`}>{isRtl ? 'إدارة' : 'Manage'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routes.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center text-gray-400">
                                                <RouteIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                                <p className="font-bold">{isRtl ? 'لا توجد مسارات مسجلة' : 'No routes found'}</p>
                                            </td>
                                        </tr>
                                    ) : routes.map((rt: any) => (
                                        <tr key={rt.id} className={`${DS_tableRow} cursor-pointer group`} onClick={() => router.visit(route('school.routes.index'))}>
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-[12px] bg-[#0f2044]/5 dark:bg-[#0f2044]/30 flex items-center justify-center text-[#0f2044] dark:text-[#7ba7e8] border border-[#0f2044]/10 dark:border-[#243460]">
                                                        <RouteIcon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-[#0f2044] dark:text-white group-hover:text-indigo-600 transition-colors">
                                                            {rt.name}
                                                        </span>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                                            {rt.code || (isRtl ? 'بدون كود' : 'N/A')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {rt.buses?.map((bus: any) => (
                                                        <div key={bus.id} className="px-2.5 py-1 rounded-[8px] bg-gray-50 dark:bg-[#0f2044]/20 border border-gray-100 dark:border-[#243460] flex items-center gap-1.5 shadow-sm">
                                                            <BusIcon className="w-3 h-3 text-gray-400" />
                                                            <span className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8]">{bus.bus_number}</span>
                                                        </div>
                                                    ))}
                                                    {(!rt.buses || rt.buses.length === 0) && (
                                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-[#0f2044]/10 px-2.5 py-1 rounded-[8px] border border-gray-100 dark:border-[#243460]">{isRtl ? 'لا يوجد حافلات' : 'No buses assigned'}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                                                        <Users className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isRtl ? 'الطلاب' : 'Students'}</span>
                                                        <span className="text-sm font-black text-[#0f2044] dark:text-white">{rt.morning_students_count || 0}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
                                                        <Users className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isRtl ? 'الطلاب' : 'Students'}</span>
                                                        <span className="text-sm font-black text-[#0f2044] dark:text-white">{rt.afternoon_students_count || 0}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`${DS_tableTd} ${isRtl ? 'text-left' : 'text-right'}`}>
                                                <button className="p-2 rounded-[10px] bg-[#0f2044]/5 text-gray-400 hover:text-[#0f2044] hover:bg-[#0f2044]/10 dark:bg-[#0f2044]/30 dark:hover:bg-[#0f2044]/50 dark:hover:text-white transition-all">
                                                    <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </SchoolAuthenticatedLayout>
    );
}
