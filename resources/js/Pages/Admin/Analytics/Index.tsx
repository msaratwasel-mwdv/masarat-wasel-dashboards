import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { motion } from 'framer-motion';
import {
    DS_pageWrapper, DS_card, DS_pageTitle,
    DS_statCard, DS_statIcon, DS_statLabel, DS_statValue2,
    DS_btnSecondary
} from '@/lib/DS';
import {
    ShieldCheck, Clock, TrendingUp, Wallet, Activity,
    Users, GraduationCap, Bus, AlertTriangle,
    ArrowUpRight, Printer, BarChart, FileText, ChevronRight
} from 'lucide-react';
import PrintReportHeader from '@/Components/PrintReportHeader';

interface Props {
    auth: any;
    kpis: {
        safe_trips_percent: number;
        safe_trips: number;
        total_completed: number;
        on_time_percent: number;
        on_time_trips: number;
        total_with_times: number;
        utilization_percent: number;
        total_students: number;
        total_capacity: number;
        monthly_expenses: number;
        total_trips_month: number;
        total_drivers: number;
        total_violations: number;
        total_delays: number;
        active_buses: number;
    };
    month_label: string;
}

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #analytics-print-area, #analytics-print-area * { visibility: visible !important; }
  #analytics-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
  @page { size: landscape; margin: 1cm; }
}
`;

export default function AnalyticsIndex({ auth, kpis, month_label }: Props) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === 'dark';

    const handlePrint = () => window.print();

    const reportSections = [
        {
            title: isRTL ? 'الأداء التشغيلي' : 'Operational Reports',
            subtitle: isRTL ? 'الرحلات الآمنة، الالتزام بالمواعيد، معدل الاستخدام' : 'Safe trips, on-time analysis, utilization',
            icon: <Activity size={24} />,
            route: 'admin.analytics.operational',
            color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
            borderColor: 'border-emerald-500',
            stats: [
                { label: isRTL ? 'رحلات آمنة' : 'Safe Trips', value: `${kpis.safe_trips_percent}%` },
                { label: isRTL ? 'التزام بالوقت' : 'On-Time', value: `${kpis.on_time_percent}%` },
            ],
        },
        {
            title: isRTL ? 'تحليلات السائقين' : 'Driver Analytics',
            subtitle: isRTL ? 'بطاقات الأداء، المخالفات، التقييمات' : 'Scorecards, violations, assessments',
            icon: <Users size={24} />,
            route: 'admin.analytics.drivers',
            color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
            borderColor: 'border-blue-500',
            stats: [
                { label: isRTL ? 'إجمالي السائقين' : 'Total Drivers', value: kpis.total_drivers },
                { label: isRTL ? 'المخالفات' : 'Violations', value: kpis.total_violations },
            ],
        },
        {
            title: isRTL ? 'التقارير المالية' : 'Financial Reports',
            subtitle: isRTL ? 'الوقود، الصيانة، التكاليف التشغيلية' : 'Fuel, maintenance, operational costs',
            icon: <Wallet size={24} />,
            route: 'admin.analytics.financial',
            color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
            borderColor: 'border-amber-500',
            stats: [
                { label: isRTL ? 'المصاريف الشهرية' : 'Monthly Expenses', value: `${(kpis.monthly_expenses / 1000).toFixed(1)}K` },
                { label: isRTL ? 'حافلات نشطة' : 'Active Buses', value: kpis.active_buses },
            ],
        },
        {
            title: isRTL ? 'تحليلات الطلاب' : 'Student Insights',
            subtitle: isRTL ? 'اتجاهات الحضور والغياب' : 'Attendance trends & patterns',
            icon: <GraduationCap size={24} />,
            route: 'admin.analytics.students',
            color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
            borderColor: 'border-purple-500',
            stats: [
                { label: isRTL ? 'طلاب نشطين' : 'Active Students', value: kpis.total_students },
                { label: isRTL ? 'التأخيرات' : 'Delays', value: kpis.total_delays },
            ],
        },
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? 'التقارير التحليلية' : 'Analytics Hub'} />
            <style>{PRINT_STYLES}</style>

            {/* ── Print Area ── */}
            <div id="analytics-print-area" className="hidden print:block bg-white text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
                <PrintReportHeader
                    title={isRTL ? "ملخص التقارير التحليلية" : "Analytics Summary Report"}
                    schoolName={isRTL ? "إدارة شركة مسارات واصل" : "Masarat Wasel Company"}
                    schoolLogo={null}
                    printDate={`${isRTL ? "تاريخ التقرير" : "Report Date"}: ${new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US")}`}
                    schoolAdminText={isRTL ? "إدارة العمليات" : "Operations Dept"}
                />
                <div className="px-4 mt-6">
                    <h2 className="text-xl font-black mb-4 text-center">{isRTL ? `ملخص شهر ${month_label}` : `${month_label} Summary`}</h2>
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-300 p-3 font-bold">{isRTL ? 'المؤشر' : 'KPI'}</th>
                                <th className="border border-gray-300 p-3 font-bold">{isRTL ? 'القيمة' : 'Value'}</th>
                                <th className="border border-gray-300 p-3 font-bold">{isRTL ? 'التفاصيل' : 'Details'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td className="border border-gray-300 p-2">{isRTL ? 'نسبة الرحلات الآمنة' : 'Safe Trips Rate'}</td><td className="border border-gray-300 p-2 text-center font-bold">{kpis.safe_trips_percent}%</td><td className="border border-gray-300 p-2">{kpis.safe_trips} / {kpis.total_completed}</td></tr>
                            <tr><td className="border border-gray-300 p-2">{isRTL ? 'معدل الالتزام بالمواعيد' : 'On-Time Rate'}</td><td className="border border-gray-300 p-2 text-center font-bold">{kpis.on_time_percent}%</td><td className="border border-gray-300 p-2">{kpis.on_time_trips} / {kpis.total_with_times}</td></tr>
                            <tr><td className="border border-gray-300 p-2">{isRTL ? 'معدل استخدام الأسطول' : 'Fleet Utilization'}</td><td className="border border-gray-300 p-2 text-center font-bold">{kpis.utilization_percent}%</td><td className="border border-gray-300 p-2">{kpis.total_students} / {kpis.total_capacity}</td></tr>
                            <tr><td className="border border-gray-300 p-2">{isRTL ? 'إجمالي المصاريف الشهرية' : 'Monthly Expenses'}</td><td className="border border-gray-300 p-2 text-center font-bold">{kpis.monthly_expenses.toLocaleString()} SAR</td><td className="border border-gray-300 p-2">{kpis.active_buses} {isRTL ? 'حافلة نشطة' : 'active buses'}</td></tr>
                            <tr><td className="border border-gray-300 p-2">{isRTL ? 'إجمالي الرحلات' : 'Total Trips'}</td><td className="border border-gray-300 p-2 text-center font-bold">{kpis.total_trips_month}</td><td className="border border-gray-300 p-2">{kpis.total_completed} {isRTL ? 'مكتملة' : 'completed'}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={DS_pageWrapper} dir={isRTL ? 'rtl' : 'ltr'}>
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                    <div>
                        <h1 className={DS_pageTitle}>
                            {isRTL ? 'التقارير التحليلية' : 'Analytics Hub'}
                        </h1>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
                            {isRTL ? `ملخص شهر ${month_label}` : `${month_label} Overview`}
                        </p>
                    </div>
                    <button onClick={handlePrint} className={DS_btnSecondary}>
                        <Printer size={16} />
                        {isRTL ? 'طباعة الملخص' : 'Print Summary'}
                    </button>
                </div>

                {/* ── Main KPI Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className={DS_statCard('green')}>
                        <div className="flex items-center gap-4">
                            <div className={DS_statIcon('green')}>
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <p className={DS_statLabel}>{isRTL ? 'الرحلات الآمنة' : 'Safe Trips'}</p>
                                <p className={DS_statValue2('green')}>{kpis.safe_trips_percent}%</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1">{kpis.safe_trips} / {kpis.total_completed}</p>
                            </div>
                        </div>
                    </div>

                    <div className={DS_statCard('blue')}>
                        <div className="flex items-center gap-4">
                            <div className={DS_statIcon('blue')}>
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className={DS_statLabel}>{isRTL ? 'الالتزام بالمواعيد' : 'On-Time Rate'}</p>
                                <p className={DS_statValue2('blue')}>{kpis.on_time_percent}%</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1">{kpis.on_time_trips} {isRTL ? 'رحلة في الوقت' : 'on-time trips'}</p>
                            </div>
                        </div>
                    </div>

                    <div className={DS_statCard('gold')}>
                        <div className="flex items-center gap-4">
                            <div className={DS_statIcon('gold')}>
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className={DS_statLabel}>{isRTL ? 'معدل الاستخدام' : 'Fleet Utilization'}</p>
                                <p className={DS_statValue2('gold')}>{kpis.utilization_percent}%</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1">{kpis.total_students} / {kpis.total_capacity}</p>
                            </div>
                        </div>
                    </div>

                    <div className={DS_statCard('red')}>
                        <div className="flex items-center gap-4">
                            <div className={DS_statIcon('red')}>
                                <Wallet size={24} />
                            </div>
                            <div>
                                <p className={DS_statLabel}>{isRTL ? 'المصاريف الشهرية' : 'Monthly Expenses'}</p>
                                <p className={DS_statValue2('red')}>{(kpis.monthly_expenses / 1000).toFixed(1)}K</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-1">SAR {kpis.monthly_expenses.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Sub-Stats Row ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: <BarChart size={18} />, label: isRTL ? 'رحلات الشهر' : 'Monthly Trips', value: kpis.total_trips_month, color: 'text-amber-500' },
                        { icon: <Users size={18} />, label: isRTL ? 'السائقين' : 'Drivers', value: kpis.total_drivers, color: 'text-blue-500' },
                        { icon: <AlertTriangle size={18} />, label: isRTL ? 'المخالفات' : 'Violations', value: kpis.total_violations, color: 'text-red-500' },
                        { icon: <Bus size={18} />, label: isRTL ? 'حافلات نشطة' : 'Active Buses', value: kpis.active_buses, color: 'text-emerald-500' },
                    ].map((stat, idx) => (
                        <div key={idx} className={`${DS_card} p-4 flex items-center justify-between border-r-4 border-transparent hover:border-[#f5b800] transition-all`}>
                            <div className={`w-10 h-10 rounded-xl bg-[#0f2044]/5 dark:bg-[#0f2044]/30 flex flex-shrink-0 items-center justify-center ${stat.color}`}>
                                {stat.icon}
                            </div>
                            <div className="text-end">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.label}</p>
                                <p className="text-lg font-black text-[#0f2044] dark:text-white mt-0.5">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Report Sections (Bento Grid) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reportSections.map((section, idx) => (
                        <Link key={idx} href={route(section.route)} className="block">
                            <motion.div
                                whileHover={{ y: -4 }}
                                className={`${DS_card} p-6 lg:p-8 h-full border-t-4 border-transparent hover:${section.borderColor} transition-all group cursor-pointer flex flex-col justify-between`}
                            >
                                <div>
                                    <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${section.color} group-hover:scale-110 transition-transform`}>
                                            {section.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-[#0f2044] dark:text-white group-hover:text-[#f5b800] transition-colors">
                                                {section.title}
                                            </h3>
                                            <p className="text-xs font-bold text-gray-500 mt-1">
                                                {section.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-[#0f2044]/5 dark:bg-[#0f2044]/30 flex items-center justify-center text-gray-400 group-hover:text-[#f5b800] group-hover:bg-[#f5b800]/10 transition-all">
                                        <ArrowUpRight size={20} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {section.stats.map((stat, sIdx) => (
                                        <div key={sIdx} className="p-4 rounded-xl bg-gray-50 dark:bg-[#0f2044]/20 border border-gray-100 dark:border-[#243460]">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                                            <p className="text-2xl font-black text-[#0f2044] dark:text-white">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[#243460] flex items-center gap-2 text-xs font-black text-[#0f2044]/40 dark:text-gray-500 group-hover:text-[#f5b800] transition-colors uppercase tracking-widest">
                                    <FileText size={14} />
                                    {isRTL ? 'عرض التقرير التفصيلي' : 'View Detailed Report'}
                                    <ChevronRight size={14} className={`${isRTL ? 'rotate-180' : ''} group-hover:-translate-x-1 transition-transform mr-auto`} />
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
