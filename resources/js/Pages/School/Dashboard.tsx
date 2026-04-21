import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import useTranslation from "@/hooks/useTranslation";
import { useEffect, useState } from "react";

interface DashboardProps {
    auth: any;
    stats: {
        students: number;
        classes: number;
        buses: number;
        active_buses: number;
        routes: number;
        attendance_percentage: number;
        attendance_today_count: number;
        daily_trips_today: number;
    };
    recent_students: Array<{
        id: number;
        name: string;
        full_name?: string;
        image?: string;
        created_at: string;
    }>;
    system_status: string;
}

export default function SchoolDashboard({ auth, stats, recent_students, system_status }: DashboardProps) {
    const { t, isRtl } = useTranslation();
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
    }, []);

    const statCards = [
        {
            title: t('Students'),
            value: stats.students,
            sub: t('Registered Students'),
            icon: '🎓',
            iconBg: 'bg-[#0e7490]',
            textColor: 'text-[#0e7490]',
            link: route('school.students.index')
        },
        {
            title: t('Classes'),
            value: stats.classes,
            sub: t('Total Classes'),
            icon: '🏫',
            iconBg: 'bg-purple-500',
            textColor: 'text-purple-600',
            link: route('school.classrooms.index')
        },
        {
            title: t('Buses'),
            value: stats.buses,
            sub: `${stats.active_buses} ${t('Active')}`,
            icon: '🚌',
            iconBg: 'bg-green-500',
            textColor: 'text-green-600',
            link: route('school.buses.index')
        },
        {
            title: t('Routes'),
            value: stats.routes,
            sub: t('Assigned Paths'),
            icon: '📍',
            iconBg: 'bg-indigo-500',
            textColor: 'text-indigo-600',
            link: route('school.routes.index')
        },
        {
            title: t('Attendance'),
            value: `${stats.attendance_percentage}%`,
            sub: `${stats.attendance_today_count} ${t('Today\'s Presence')}`,
            icon: '📅',
            iconBg: 'bg-orange-500',
            textColor: 'text-orange-600',
            link: route('school.reports.attendance')
        },
        {
            title: t('Daily Trips'),
            value: stats.daily_trips_today,
            sub: t('Scheduled Today'),
            icon: '🚀',
            iconBg: 'bg-blue-500',
            textColor: 'text-blue-600',
            link: route('school.trips.dashboard')
        }
    ];

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
                        {t('School Control Panel')}
                    </h2>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-[20px] text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {t('All systems operational')}
                    </div>
                </div>
            }
        >
            <Head title={t('Dashboard')} />

            <div className={`space-y-8 p-4 transition-opacity duration-1000 ${animate ? 'opacity-100' : 'opacity-0'}`}>

                {/* 1. WELCOME SECTION */}
                <div className="relative overflow-hidden bg-white dark:bg-gray-800 shadow-sm rounded-[30px] p-8 border border-gray-100 dark:border-gray-700 border-l-4 border-l-[#0e7490]">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
                            {t('Welcome back, Principal!')}
                        </h1>
                        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                            {t('Here is today\'s overview for your school.')}
                        </p>
                    </div>
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-50/30 dark:bg-cyan-900/10 blur-3xl"></div>
                </div>

                {/* 2. STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {statCards.map((stat, idx) => (
                        <Link
                            key={idx}
                            href={stat.link}
                            className="relative overflow-hidden rounded-[30px] p-8 shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-cyan-200 dark:hover:border-cyan-800 transform transition-all hover:-translate-y-1 hover:shadow-md group"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{stat.title}</p>
                                    <h3 className={`text-5xl font-extrabold ${stat.textColor} mt-2`}>
                                        {stat.value}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">{stat.sub}</p>
                                </div>
                                <div className={`w-14 h-14 rounded-[20px] ${stat.iconBg} flex items-center justify-center text-2xl shadow-sm text-white`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* 3. MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* QUICK ACTIONS */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[30px] shadow-sm p-8 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                ⚡ {t('Quick Actions')}
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <Link href={route('school.students.create')} className="flex flex-col items-center justify-center p-5 bg-cyan-50 dark:bg-cyan-900/20 rounded-[20px] hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-all gap-3 group border border-cyan-100 dark:border-cyan-800">
                                <span className="text-4xl group-hover:scale-110 transition-transform">🎓</span>
                                <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300 text-center">{t('Enroll Student')}</span>
                            </Link>
                            <Link href={route('school.reports.attendance')} className="flex flex-col items-center justify-center p-5 bg-purple-50 dark:bg-purple-900/20 rounded-[20px] hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all gap-3 group border border-purple-100 dark:border-purple-800">
                                <span className="text-4xl group-hover:scale-110 transition-transform">📋</span>
                                <span className="text-sm font-bold text-purple-700 dark:text-purple-300 text-center">{t('Take Attendance')}</span>
                            </Link>
                            <Link href={route('school.classrooms.index')} className="flex flex-col items-center justify-center p-5 bg-orange-50 dark:bg-orange-900/20 rounded-[20px] hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all gap-3 group border border-orange-100 dark:border-orange-800">
                                <span className="text-4xl group-hover:scale-110 transition-transform">🏫</span>
                                <span className="text-sm font-bold text-orange-700 dark:text-orange-300 text-center">{t('Add Class')}</span>
                            </Link>
                            <Link href={route('school.teachers.index')} className="flex flex-col items-center justify-center p-5 bg-green-50 dark:bg-green-900/20 rounded-[20px] hover:bg-green-100 dark:hover:bg-green-900/40 transition-all gap-3 group border border-green-100 dark:border-green-800">
                                <span className="text-4xl group-hover:scale-110 transition-transform">👔</span>
                                <span className="text-sm font-bold text-green-700 dark:text-green-300 text-center">{t('Add Supervisor')}</span>
                            </Link>
                        </div>

                        {/* SUB-SECTION: SYSTEM FEATURES STATUS (VISUAL ONLY) */}
                        <div className="mt-8">
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">{t('System Health')}</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-[15px]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{t('Attendance System')}</span>
                                    </div>
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1.5 rounded-[10px] dark:bg-green-900/50 dark:text-green-400">{t('Active')}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-[15px]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{t('Student Portal')}</span>
                                    </div>
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1.5 rounded-[10px] dark:bg-green-900/50 dark:text-green-400">{t('Active')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RECENT ACTIVITY / SIDEBAR */}
                    <div className="bg-white dark:bg-gray-800 rounded-[30px] shadow-sm p-8 border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 pb-4 border-b dark:border-gray-700">
                            {t('Recently Added Students')}
                        </h3>
                        {recent_students.length > 0 ? (
                            <div className="space-y-4">
                                {recent_students.map((student) => {
                                    const displayName = student.full_name || student.name || t('Unknown');
                                    const initial = displayName.charAt(0) || '?';
                                    return (
                                        <div key={student.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-[15px] transition">
                                            <div className="w-12 h-12 rounded-[15px] bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-[#0e7490] font-bold text-lg">
                                                {initial}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white text-sm">
                                                    {displayName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {student.created_at ? new Date(student.created_at).toLocaleDateString() : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">{t('No recent activity')}</p>
                        )}

                        <div className="mt-8 pt-6 border-t dark:border-gray-700">
                            <div className="bg-[#0e7490] p-5 rounded-[20px] text-white text-center">
                                <p className="font-bold text-lg">Masarat Wasel 🚀</p>
                                <p className="text-xs opacity-90 mt-1">{t('Version')} 2.0.0</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
