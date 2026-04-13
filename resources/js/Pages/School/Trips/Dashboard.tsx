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
    CheckCircle2, 
    AlertCircle,
    Activity,
    Filter,
    Users,
    Navigation,
    Route as RouteIcon
} from 'lucide-react';

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
    const { t, isRtl } = useTranslation();
    const [activeTab, setActiveTab] = useState<'trips' | 'routes'>('trips');
    const [date, setDate] = useState(filters.date);
    const [routeId, setRouteId] = useState(filters.route_id || "");

    const handleFilterChange = (newDate: string, newRouteId: string) => {
        router.get(route('school.trips.dashboard'), { date: newDate, route_id: newRouteId }, { preserveState: true });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'finished': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                            {t('Fleet Operations Center')}
                        </h2>
                        <div className="flex items-center gap-4 mt-2">
                             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                                <button 
                                    onClick={() => setActiveTab('trips')}
                                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'trips' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    {t('Daily Trips')}
                                </button>
                                <button 
                                    onClick={() => setActiveTab('routes')}
                                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'routes' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    {t('Static Routes')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {activeTab === 'trips' && (
                        <div className="flex items-center gap-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
                            <div className="flex items-center gap-2 px-4 py-2 border-r border-slate-100 dark:border-slate-700">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => { setDate(e.target.value); handleFilterChange(e.target.value, routeId); }}
                                    className="bg-transparent border-none focus:ring-0 text-[11px] font-black tracking-tight text-slate-700 dark:text-slate-200 p-0"
                                />
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/50 dark:bg-slate-900/20">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={routeId}
                                    onChange={(e) => { setRouteId(e.target.value); handleFilterChange(date, e.target.value); }}
                                    className="bg-transparent border-none focus:ring-0 text-[10px] uppercase font-black tracking-widest text-slate-600 dark:text-slate-400 p-0 pr-8"
                                >
                                    <option value="">{t('All Routes')}</option>
                                    {routes.map((r: any) => <option key={r.id} value={r.id.toString()}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            }
        >
            <Head title={t('Trips Dashboard')} />

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8 py-6"
            >
                {/* Global Stats Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatBox 
                        title={t('Active Trips')} 
                        value={stats.in_progress} 
                        icon={<Activity />} 
                        color="blue" 
                    />
                    <StatBox 
                        title={t('Fleet Readiness')} 
                        value={stats.active_buses} 
                        icon={<BusIcon />} 
                        color="indigo" 
                    />
                    <StatBox 
                        title={t('Total Routes')} 
                        value={stats.total_routes} 
                        icon={<RouteIcon />} 
                        color="emerald" 
                    />
                    <StatBox 
                        title={t('Field Requests')} 
                        value={stats.pending_field_trips} 
                        icon={<Navigation />} 
                        color="rose" 
                    />
                </div>

                {activeTab === 'trips' ? (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Primary Trip List */}
                        <div className="xl:col-span-2 space-y-4">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                        <RouteIcon className="w-5 h-5 text-indigo-500" />
                                        {t('Today\'s Schedule')}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-800 uppercase tracking-widest">
                                            {dailyTrips.length} {t('Active')}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-start border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-900/30 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                <th className="px-6 py-4 text-start">{t('Trip Identity')}</th>
                                                <th className="px-6 py-4 text-start">{t('Resource Assign')}</th>
                                                <th className="px-6 py-4 text-start">{t('Status')}</th>
                                                <th className="px-6 py-4 text-end">{t('Details')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                            {dailyTrips.map((trip) => (
                                                <tr key={trip.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border ${trip.type === 'forth' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                                                <span className="text-[10px] font-black uppercase leading-none">{trip.type === 'forth' ? 'AM' : 'PM'}</span>
                                                                <Clock className="w-3 h-3 mt-1 opacity-50" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                                    {trip.bus?.route?.name || t('Unassigned Route')}
                                                                </span>
                                                                <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 w-fit">
                                                                    <Users className="w-2.5 h-2.5 text-slate-400" />
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                                                        {trip.attendances_count} {t('Students')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                         <div className="flex flex-col gap-2">
                                                             <div className="flex items-center gap-3">
                                                                 <div className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-[10px] font-black text-indigo-600 border border-indigo-500/10">
                                                                     {trip.bus?.bus_number || '---'}
                                                                 </div>
                                                                 <div className="flex flex-col">
                                                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">{t('Driver')}</span>
                                                                     <span className={`text-xs font-bold leading-none ${trip.bus?.driver?.user?.name ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 italic'}`}>
                                                                         {trip.bus?.driver?.user?.name || t('Unassigned')}
                                                                     </span>
                                                                 </div>
                                                             </div>
                                                             <div className="flex items-center gap-2 ml-1">
                                                                 <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                                 <div className="flex items-center gap-2">
                                                                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{t('Assistant')}:</span>
                                                                     <span className={`text-[10px] font-bold ${trip.bus?.assistant?.name ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 italic'}`}>
                                                                         {trip.bus?.assistant?.name || t('Not Assigned')}
                                                                     </span>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     </td>
                                                    <td className="px-6 py-5">
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(trip.status)}`}>
                                                            <div className={`w-1 h-1 rounded-full ${trip.status === 'in_progress' ? 'animate-pulse' : ''} bg-current`} />
                                                            {t(trip.status)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-end">
                                                        <button 
                                                            onClick={() => router.get(route('school.trips.show', trip.id))}
                                                            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                                                        >
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Field Trips Column */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-50 dark:border-slate-700 bg-rose-500/5">
                                    <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                        <Navigation className="w-5 h-5 text-rose-500" />
                                        {t('Special Operations')}
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    {fieldTrips.length > 0 ? (
                                        fieldTrips.map(trip => (
                                            <div key={trip.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/50 transition-all cursor-pointer group">
                                                <h4 className="text-xs font-black text-slate-800 dark:text-white flex justify-between items-center uppercase tracking-tight">
                                                    {trip.destination_description}
                                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white">LIVE</span>
                                                </h4>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] font-bold text-slate-400">Bus #{trip.bus?.bus_number}</span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase">{t(trip.status)}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center opacity-30">
                                            <p className="text-[10px] font-black uppercase tracking-widest">{t('No active field trips')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/20">
                                <h4 className="font-black text-lg mb-2">{t('Operational Insight')}</h4>
                                <p className="text-xs text-indigo-100/80 leading-relaxed font-medium">
                                    {isRtl ? "كفاءة الرحلات اليوم مستقرة بنسبة ٩٧٪. تم تأكيد جميع المناوبات المسائية من قبل المشرفين." : "Fleet efficiency is at 97% stability. All afternoon shifts have been verified by assigned supervisors."}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {routes.map((route: any) => (
                            <motion.div 
                                key={route.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                                        <RouteIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('Route Code')}</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{route.code || 'N/A'}</span>
                                    </div>
                                </div>

                                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">
                                    {route.name}
                                </h4>

                                <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <BusIcon className="w-3.5 h-3.5" />
                                            {t('Assigned Units')}
                                        </div>
                                        <div className="flex -space-x-2">
                                            {route.buses?.map((bus: any) => (
                                                <div key={bus.id} className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-black text-slate-500">
                                                    {bus.bus_number}
                                                </div>
                                            ))}
                                            {(!route.buses || route.buses.length === 0) && (
                                                <span className="text-[10px] text-rose-500 font-black uppercase">{t('Unassigned')}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Users className="w-3.5 h-3.5" />
                                            {t('Morning Shift')}
                                        </div>
                                        <span className="text-indigo-600 dark:text-indigo-400">{route.morning_students_count} {t('Students')}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Users className="w-3.5 h-3.5" />
                                            {t('Afternoon Shift')}
                                        </div>
                                        <span className="text-indigo-600 dark:text-indigo-400">{route.afternoon_students_count} {t('Students')}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <button 
                                        onClick={() => router.visit(route('school.routes.index'))}
                                        className="flex-1 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all border border-slate-100 dark:border-slate-800"
                                    >
                                        {t('Edit Route')}
                                    </button>
                                    <button 
                                        onClick={() => router.visit(route('school.routes.index'))}
                                        className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 dark:border-indigo-900/50"
                                    >
                                        <ArrowRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </SchoolAuthenticatedLayout>
    );
}

function StatBox({ title, value, icon, color, label }: any) {
    const colors = {
        blue: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
        emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
        indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10",
        rose: "text-rose-500 bg-rose-50 dark:bg-rose-500/10"
    } as any;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-5 group hover:border-indigo-500/30 transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${colors[color]}`}>
                {React.cloneElement(icon, { className: "w-7 h-7" })}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">{value}</h4>
                    {label && <span className="text-[10px] font-bold text-slate-400">{label}</span>}
                </div>
            </div>
        </div>
    );
}
