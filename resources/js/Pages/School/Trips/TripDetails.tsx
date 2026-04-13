import React from 'react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';
import { motion } from 'framer-motion';
import { 
    Bus as BusIcon, 
    User, 
    Route as RouteIcon, 
    Users, 
    Calendar, 
    Clock, 
    ArrowLeft,
    MapPin,
    Shield
} from 'lucide-react';

interface Attendance {
    id: number;
    student: {
        id: number;
        first_name_ar: string;
        last_name_ar: string;
        student_code: string;
    };
    status: 'absent' | 'boarded' | 'dropped' | 'excused';
    check_in_time?: string;
    check_out_time?: string;
}

interface Trip {
    id: number;
    type: string;
    status: 'pending' | 'in_progress' | 'finished';
    trip_date: string;
    bus: {
        id: number;
        bus_number: string;
        plate_number: string;
        driver?: { user?: { name: string } };
        assistant?: { name: string };
    };
    route?: {
        id: number;
        name: string;
        code: string;
    };
    attendances: Attendance[];
}

interface Props {
    auth: any;
    trip: Trip;
}

export default function TripDetails({ auth, trip }: Props) {
    const { t } = useTranslation();

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'finished': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link 
                        href={route('school.trips.dashboard')}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                            {t('Trip Details')}
                        </h2>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {trip.type === 'forth' ? t('Morning Shift') : t('Afternoon Shift')} • {trip.trip_date}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title={t('Trip Details')} />

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Status Hero */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-8">
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-xl ${getStatusStyle(trip.status)}`}>
                            <BusIcon className="w-10 h-10" />
                        </div>
                        <div className="flex-1 text-center md:text-start">
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-2">
                                <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusStyle(trip.status)}`}>
                                    {t(trip.status)}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase">
                                    {t('ID')}: #{trip.id}
                                </span>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                                {trip.route?.name || t('Custom Route')}
                            </h3>
                            <p className="text-slate-500 font-bold flex items-center justify-center md:justify-start gap-2">
                                <MapPin className="w-4 h-4" /> {trip.route?.code || 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/20 flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest opacity-80">{t('Occupancy')}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black">{trip.attendances.filter(a => ['boarded', 'dropped'].includes(a.status)).length}</span>
                            <span className="text-xl font-bold opacity-60">/ {trip.attendances.length}</span>
                        </div>
                        <p className="text-xs font-bold mt-2 opacity-80">{t('Students Participating')}</p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Personnel Card */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-700 shadow-sm col-span-1"
                    >
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-500" />
                            {t('Mission Crew')}
                        </h4>
                        
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t('Driver')}</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">
                                        {trip.bus?.driver?.user?.name || t('Unassigned')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t('Assistant')}</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">
                                        {trip.bus?.assistant?.name || t('Not Assigned')}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 dark:border-slate-700/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                                        <BusIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t('Vehicle Information')}</p>
                                        <p className="text-sm font-black text-slate-800 dark:text-white">
                                            {trip.bus?.bus_number} • {trip.bus?.plate_number}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Attendance Table */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" />
                                {t('Attendance Manifest')}
                            </h4>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-start border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/30 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                        <th className="px-8 py-4 text-start">{t('Student')}</th>
                                        <th className="px-8 py-4 text-start">{t('Status')}</th>
                                        <th className="px-8 py-4 text-center">{t('Check In')}</th>
                                        <th className="px-8 py-4 text-end">{t('Check Out')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {trip.attendances.map((attendance) => (
                                        <tr key={attendance.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs font-black text-slate-400 uppercase">
                                                        {attendance.student.first_name_ar[0]}{attendance.student.last_name_ar[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                            {attendance.student.first_name_ar} {attendance.student.last_name_ar}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {t('Code')}: {attendance.student.student_code}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                    attendance.status === 'dropped' 
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                                        : attendance.status === 'boarded'
                                                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                        : attendance.status === 'excused'
                                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                }`}>
                                                    <div className={`w-1 h-1 rounded-full bg-current`} />
                                                    {t(attendance.status)}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    {attendance.check_in_time ? attendance.check_in_time : '---'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-end">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    {attendance.check_out_time ? attendance.check_out_time : '---'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {trip.attendances.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-8 py-20 text-center opacity-30">
                                                <Users className="w-12 h-12 mx-auto mb-4" />
                                                <p className="text-sm font-black uppercase tracking-widest">{t('No attendance data for this trip')}</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
