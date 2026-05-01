import React from 'react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';
import { useTheme } from '@/Contexts/ThemeContext';
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
    Shield,
    Home,
    School as SchoolIcon,
    ArrowRight
} from 'lucide-react';

interface Attendance {
    id: number;
    student: {
        id: number;
        first_name_ar: string;
        last_name_ar: string;
        student_code: string;
    };
    status: 'pending' | 'boarded' | 'dropped' | 'absent' | 'excused' | 'waiting';
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
    const { isRTL } = useTheme();

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'finished': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    // 5-stage journey timeline based on trip type and attendance status
    const getJourneyStages = (tripType: string, status: string) => {
        const isForth = tripType === 'forth';

        const stages = isForth
            ? [
                { key: 'home',   label: isRTL ? 'في المنزل' : 'At Home',   icon: Home,       statuses: ['pending', 'waiting'] },
                { key: 'bus1',   label: isRTL ? 'في الحافلة' : 'On Bus',    icon: BusIcon,    statuses: ['boarded'] },
                { key: 'school', label: isRTL ? 'في المدرسة' : 'At School', icon: SchoolIcon, statuses: ['dropped'] },
                { key: 'bus2',   label: isRTL ? 'في الحافلة' : 'On Bus',    icon: BusIcon,    statuses: [] },
                { key: 'home2',  label: isRTL ? 'في المنزل' : 'At Home',   icon: Home,       statuses: [] },
            ]
            : [
                { key: 'school', label: isRTL ? 'في المدرسة' : 'At School', icon: SchoolIcon, statuses: ['pending', 'waiting'] },
                { key: 'bus1',   label: isRTL ? 'في الحافلة' : 'On Bus',    icon: BusIcon,    statuses: ['boarded'] },
                { key: 'home',   label: isRTL ? 'في المنزل' : 'At Home',   icon: Home,       statuses: ['dropped'] },
                { key: 'bus2',   label: isRTL ? 'في الحافلة' : 'On Bus',    icon: BusIcon,    statuses: [] },
                { key: 'home2',  label: isRTL ? 'في المنزل' : 'At Home',   icon: Home,       statuses: [] },
            ];

        let activeIdx = -1;
        if (status === 'absent' || status === 'excused') return { stages, activeIdx: -1, isAbsent: true };
        stages.forEach((s, i) => { if (s.statuses.includes(status)) activeIdx = i; });
        return { stages, activeIdx, isAbsent: false };
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
                                        <th className="px-4 py-4 text-center" colSpan={5}>
                                            <span className="text-indigo-500">{t('Journey Status')}</span>
                                        </th>
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

                                            {/* 5-Stage Journey Timeline */}
                                            {(() => {
                                                const { stages, activeIdx, isAbsent } = getJourneyStages(trip.type, attendance.status);
                                                return stages.map((stage, stageIdx) => {
                                                    const Icon = stage.icon;
                                                    const isPast = stageIdx < activeIdx;
                                                    const isCurrent = stageIdx === activeIdx;
                                                    return (
                                                        <td key={stage.key} className="px-2 py-5 text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 ${
                                                                    isAbsent
                                                                        ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-400'
                                                                        : isCurrent
                                                                        ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-110'
                                                                        : isPast
                                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-500'
                                                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300'
                                                                }`}>
                                                                    <Icon className="w-3.5 h-3.5" />
                                                                </div>
                                                                <span className={`text-[8px] font-black uppercase leading-tight tracking-tight max-w-[52px] text-center ${
                                                                    isCurrent ? 'text-indigo-600 dark:text-indigo-400'
                                                                    : isPast ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : 'text-slate-300 dark:text-slate-600'
                                                                }`}>{stage.label}</span>
                                                            </div>
                                                        </td>
                                                    );
                                                });
                                            })()}

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
