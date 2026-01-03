import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import useTranslation from "@/hooks/useTranslation";
import { useEffect, useState } from "react";

interface DashboardProps {
    auth: any;
    stats: {
        students: number;
        classes: number;
        staff: number;
        attendance_percentage: number;
        attendance_today_count: number;
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
            color: 'from-blue-500 to-blue-600',
            link: route('school.students.index')
        },
        {
            title: t('Classes'),
            value: stats.classes,
            sub: t('Total Classes'),
            icon: '🏫',
            color: 'from-yellow-400 to-yellow-600',
            link: route('school.classrooms.index')
        },
        {
            title: t('Staff'),
            value: stats.staff,
            sub: t('Drivers & Supervisors'),
            icon: '👔',
            color: 'from-green-500 to-green-600',
            link: route('school.teachers.index')
        },
        {
            title: t('Attendance'),
            value: `${stats.attendance_percentage}%`,
            sub: `${stats.attendance_today_count} ${t('Today\'s Presence')}`,
            icon: '📅',
            color: 'from-red-500 to-red-600',
            link: route('school.reports.attendance')
        }
    ];

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {t('School Control Panel')}
                    </h2>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {t('All systems operational')}
                    </div>
                </div>
            }
        >
            <Head title={t('Dashboard')} />

            <div className={`space-y-8 p-4 transition-opacity duration-1000 ${animate ? 'opacity-100' : 'opacity-0'}`}>

                {/* 1. WELCOME SECTION */}
                <div className="relative overflow-hidden bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border-l-8 border-brand-yellow">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-dark to-brand-primary dark:from-white dark:to-gray-300">
                            {t('Welcome back, Principal!')}
                        </h1>
                        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
                            {t('Here is today\'s overview for your school.')}
                        </p>
                    </div>
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand-yellow/10 blur-3xl"></div>
                </div>

                {/* 2. STATS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, idx) => (
                        <Link
                            key={idx}
                            href={stat.link}
                            className={`relative overflow-hidden rounded-2xl p-6 shadow-lg bg-white dark:bg-gray-800 border-b-4 border-transparent hover:border-brand-yellow transform transition-all hover:-translate-y-1 hover:shadow-2xl group`}
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.title}</p>
                                    <h3 className="text-4xl font-extrabold text-gray-800 dark:text-white mt-2 group-hover:text-brand-primary transition-colors">
                                        {stat.value}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.sub}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-lg shadow-gray-200 dark:shadow-none`}>
                                    {stat.icon}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* 3. MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* QUICK ACTIONS */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                ⚡ {t('Quick Actions')}
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <Link href={route('school.students.create')} className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition gap-2 group">
                                <span className="text-3xl group-hover:scale-110 transition-transform">🎓</span>
                                <span className="text-sm font-bold text-blue-700 dark:text-blue-300 text-center">{t('Enroll Student')}</span>
                            </Link>
                            <Link href={route('school.reports.attendance')} className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition gap-2 group">
                                <span className="text-3xl group-hover:scale-110 transition-transform">📋</span>
                                <span className="text-sm font-bold text-purple-700 dark:text-purple-300 text-center">{t('Take Attendance')}</span>
                            </Link>
                            <Link href={route('school.classrooms.index')} className="flex flex-col items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition gap-2 group">
                                <span className="text-3xl group-hover:scale-110 transition-transform">🏫</span>
                                <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300 text-center">{t('Add Class')}</span>
                            </Link>
                            <Link href={route('school.teachers.index')} className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition gap-2 group">
                                <span className="text-3xl group-hover:scale-110 transition-transform">👔</span>
                                <span className="text-sm font-bold text-green-700 dark:text-green-300 text-center">{t('Add Supervisor')}</span>
                            </Link>
                        </div>

                        {/* SUB-SECTION: SYSTEM FEATURES STATUS (VISUAL ONLY) */}
                        <div className="mt-8">
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">{t('System Health')}</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{t('Attendance System')}</span>
                                    </div>
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded dark:bg-green-900/50 dark:text-green-400">{t('Active')}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{t('Student Portal')}</span>
                                    </div>
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded dark:bg-green-900/50 dark:text-green-400">{t('Active')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RECENT ACTIVITY / SIDEBAR */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 border-b pb-2 dark:border-gray-700">
                            {t('Recently Added Students')}
                        </h3>
                        {recent_students.length > 0 ? (
                            <div className="space-y-4">
                                {recent_students.map((student) => {
                                    const displayName = student.full_name || student.name || t('Unknown');
                                    const initial = displayName.charAt(0) || '?';
                                    return (
                                        <div key={student.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition">
                                            <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-dark font-bold">
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
                            <div className="bg-gradient-to-r from-brand-dark to-black p-4 rounded-xl text-white text-center">
                                <p className="font-bold text-lg">Masarat Wasel 🚀</p>
                                <p className="text-xs opacity-70 mt-1">{t('Version')} 2.0.0</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
