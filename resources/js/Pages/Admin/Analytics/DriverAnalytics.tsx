import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { DS_pageWrapper, DS_btnSecondary, DS_inputCls, DS_labelCls } from '@/lib/DS';
import PrintReportHeader from '@/Components/PrintReportHeader';
import {
    Users, Star, ShieldAlert, Clock3, Printer, Filter,
    TrendingUp, Award, AlertTriangle, CheckCircle2, Eye, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Driver {
    id: number; user_id: number; name: string; phone: string; image: string | null;
    license_number: string; license_expiry: string | null; status: string;
    completed_trips: number; total_trips: number; violations: number; delays: number;
    inspections: number; inspections_passed: number; on_time_trips: number;
    score: number; bus_number: string;
}

interface ViolationItem {
    id: number; type: string; description: string; status: string; date: string;
    bus_number: string; driver_name: string; supervisor_name: string;
}

interface Props {
    auth: any;
    drivers: Driver[];
    violations: ViolationItem[];
    filters: { date_from: string; date_to: string };
}

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #driver-print-area, #driver-print-area * { visibility: visible !important; }
  #driver-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
  @page { size: portrait; margin: 1cm; }
}
`;

export default function DriverAnalytics({ auth, drivers, violations, filters }: Props) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === 'dark';
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const applyFilters = () => {
        router.get(route('admin.analytics.drivers'), { date_from: dateFrom, date_to: dateTo }, { preserveState: true });
    };

    const handlePrint = () => window.print();

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-[#f5b800]';
        if (score >= 40) return 'text-orange-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'from-emerald-500 to-teal-600';
        if (score >= 60) return 'from-[#f5b800] to-amber-600';
        if (score >= 40) return 'from-orange-500 to-orange-600';
        return 'from-red-500 to-red-600';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return isRTL ? 'ممتاز' : 'Excellent';
        if (score >= 60) return isRTL ? 'جيد' : 'Good';
        if (score >= 40) return isRTL ? 'متوسط' : 'Average';
        return isRTL ? 'ضعيف' : 'Poor';
    };

    const getStars = (score: number) => Math.round(score / 20);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? 'تحليلات السائقين' : 'Driver Analytics'} />
            <style>{PRINT_STYLES}</style>

            {/* ── Print Area ── */}
            <div id="driver-print-area" className="hidden print:block bg-white text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
                <PrintReportHeader
                    title={isRTL ? "تقرير أداء السائقين" : "Driver Performance Report"}
                    schoolName={isRTL ? "إدارة شركة مسارات واصل" : "Masarat Wasel Company"}
                    schoolLogo={null}
                    printDate={`${filters.date_from} → ${filters.date_to}`}
                    schoolAdminText={isRTL ? "إدارة العمليات" : "Operations Dept"}
                />
                <div className="px-4 mt-4">
                    <table className="w-full border-collapse border border-gray-300 text-[10px]">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-300 p-1.5">#</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'السائق' : 'Driver'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'الحافلة' : 'Bus'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'الرحلات' : 'Trips'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'المخالفات' : 'Violations'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'التأخيرات' : 'Delays'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'في الوقت' : 'On-Time'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'النقاط' : 'Score'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'التقييم' : 'Rating'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map((d, i) => (
                                <tr key={d.id}>
                                    <td className="border border-gray-300 p-1.5 text-center">{i + 1}</td>
                                    <td className="border border-gray-300 p-1.5 font-bold">{d.name}</td>
                                    <td className="border border-gray-300 p-1.5">{d.bus_number}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{d.completed_trips}/{d.total_trips}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{d.violations}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{d.delays}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{d.on_time_trips}</td>
                                    <td className="border border-gray-300 p-1.5 text-center font-bold">{d.score}/100</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{getScoreLabel(d.score)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={`${DS_pageWrapper} space-y-8 px-4 sm:px-6 lg:px-8 pt-6 pb-12`} dir={isRTL ? 'rtl' : 'ltr'}>
                {/* ── Header ── */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-gray-100 dark:border-[#243460]">
                    <div>
                        <h1 className="text-3xl font-black text-[#0f2044] dark:text-white flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                                <Users size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span>{isRTL ? 'تحليلات السائقين' : 'Driver Analytics'}</span>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">
                                    {isRTL ? 'بطاقات الأداء وسجل المخالفات' : 'Performance Scorecards & Violations'}
                                </span>
                            </div>
                        </h1>
                    </div>
                    <button onClick={handlePrint} className={DS_btnSecondary}>
                        <Printer size={16} />
                        {isRTL ? 'طباعة التقرير' : 'Print Report'}
                    </button>
                </div>

                {/* ── Filters ── */}
                <div className="bg-white/80 dark:bg-[#1a2845]/80 backdrop-blur-xl p-5 rounded-[28px] border border-white/20 dark:border-white/5 shadow-lg flex flex-col md:flex-row items-end gap-4">
                    <div className="flex-1 w-full md:w-auto">
                        <label className={DS_labelCls}>{isRTL ? 'من تاريخ' : 'Date From'}</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={DS_inputCls} />
                    </div>
                    <div className="flex-1 w-full md:w-auto">
                        <label className={DS_labelCls}>{isRTL ? 'إلى تاريخ' : 'Date To'}</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={DS_inputCls} />
                    </div>
                    <button onClick={applyFilters} className="px-8 py-2.5 bg-[#0f2044] text-white rounded-[18px] text-sm font-black hover:bg-[#1a3a7a] transition-all shadow-lg">
                        <Filter size={14} className="inline mr-2" />
                        {isRTL ? 'تطبيق' : 'Apply'}
                    </button>
                </div>

                {/* ── Driver Scorecards Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {drivers.map((driver, idx) => (
                        <motion.div
                            key={driver.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden"
                        >
                            {/* Score Strip */}
                            <div className={`h-2 bg-gradient-to-r ${getScoreBg(driver.score)}`} />

                            <div className="p-6">
                                {/* Driver Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-2xl bg-[#0f2044]/10 dark:bg-[#0f2044]/40 text-[#0f2044] dark:text-[#7ba7e8] flex items-center justify-center font-bold text-lg overflow-hidden">
                                                {driver.image ? (
                                                    <img src={driver.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    driver.name.charAt(0)
                                                )}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-white text-[8px] font-black bg-gradient-to-r ${getScoreBg(driver.score)} shadow-lg`}>
                                                {driver.score}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[#0f2044] dark:text-white text-base">{driver.name}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">{driver.bus_number} · {driver.phone}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDriver(driver)}
                                        className="w-10 h-10 rounded-xl bg-[#0f2044]/5 dark:bg-[#0f2044]/30 flex items-center justify-center text-gray-400 hover:text-[#f5b800] hover:bg-[#f5b800]/10 transition-all"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </div>

                                {/* Stars */}
                                <div className="flex items-center gap-1 mb-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={16} className={i < getStars(driver.score) ? 'text-[#f5b800] fill-[#f5b800]' : 'text-gray-200 dark:text-gray-600'} />
                                    ))}
                                    <span className={`text-xs font-black ml-2 ${getScoreColor(driver.score)}`}>{getScoreLabel(driver.score)}</span>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-2xl bg-[#0f2044]/[0.03] dark:bg-[#0f2044]/20">
                                        <p className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">{isRTL ? 'الرحلات' : 'Trips'}</p>
                                        <p className="text-xl font-black text-[#0f2044] dark:text-white">{driver.completed_trips}<span className="text-sm text-gray-400">/{driver.total_trips}</span></p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-[#0f2044]/[0.03] dark:bg-[#0f2044]/20">
                                        <p className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">{isRTL ? 'في الوقت' : 'On-Time'}</p>
                                        <p className="text-xl font-black text-emerald-500">{driver.on_time_trips}</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-[#0f2044]/[0.03] dark:bg-[#0f2044]/20">
                                        <p className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">{isRTL ? 'المخالفات' : 'Violations'}</p>
                                        <p className={`text-xl font-black ${driver.violations > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{driver.violations}</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-[#0f2044]/[0.03] dark:bg-[#0f2044]/20">
                                        <p className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">{isRTL ? 'التأخيرات' : 'Delays'}</p>
                                        <p className={`text-xl font-black ${driver.delays > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>{driver.delays}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {drivers.length === 0 && (
                        <div className="col-span-full text-center py-16 text-gray-400">
                            <Users size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="font-bold">{isRTL ? 'لا يوجد سائقين' : 'No drivers found'}</p>
                        </div>
                    )}
                </div>

                {/* ── Violations Table ── */}
                <div className="bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-[#243460]">
                        <h3 className="text-lg font-black text-[#0f2044] dark:text-white flex items-center gap-2">
                            <ShieldAlert size={20} className="text-red-500" />
                            {isRTL ? 'سجل المخالفات المرتبط بالسائقين' : 'Driver-Linked Violations Log'}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#0f2044]/5 dark:bg-[#0f2044]/40">
                                <tr>
                                    {[
                                        '#',
                                        isRTL ? 'التاريخ' : 'Date',
                                        isRTL ? 'السائق' : 'Driver',
                                        isRTL ? 'الحافلة' : 'Bus',
                                        isRTL ? 'النوع' : 'Type',
                                        isRTL ? 'الحالة' : 'Status',
                                    ].map((h, i) => (
                                        <th key={i} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#0f2044]/60 dark:text-[#7ba7e8]/70 text-start">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {violations.map((v, i) => (
                                    <tr key={v.id} className="hover:bg-[#0f2044]/[0.03] dark:hover:bg-[#0f2044]/30 transition-colors border-b border-gray-50 dark:border-[#243460] last:border-0">
                                        <td className="px-4 py-3.5 text-gray-400 font-bold">{i + 1}</td>
                                        <td className="px-4 py-3.5 font-bold text-gray-700 dark:text-gray-300">{v.date}</td>
                                        <td className="px-4 py-3.5 font-black text-[#0f2044] dark:text-white">{v.driver_name}</td>
                                        <td className="px-4 py-3.5 font-bold text-gray-500">{v.bus_number}</td>
                                        <td className="px-4 py-3.5">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">{v.type}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${v.status === 'resolved' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-[#f5b800]/20 text-[#7a5c00] dark:bg-[#f5b800]/10 dark:text-[#f5b800]'}`}>
                                                {v.status === 'resolved' ? (isRTL ? 'محلولة' : 'Resolved') : (isRTL ? 'قيد الانتظار' : 'Pending')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {violations.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">{isRTL ? 'لا يوجد مخالفات' : 'No violations found'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Driver Detail Modal ── */}
            <AnimatePresence>
                {selectedDriver && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setSelectedDriver(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        >
                            <div className="bg-white dark:bg-[#1a2845] rounded-[22px] shadow-2xl overflow-hidden">
                                {/* Modal Header */}
                                <div className={`px-6 py-5 bg-gradient-to-r ${getScoreBg(selectedDriver.score)} flex items-center justify-between`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white text-lg font-bold">
                                            {selectedDriver.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{selectedDriver.name}</h3>
                                            <p className="text-xs text-white/70">{selectedDriver.bus_number}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedDriver(null)} className="p-1.5 rounded-[10px] bg-white/10 text-white hover:bg-white/20 transition-all">
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Score */}
                                <div className="p-6 text-center border-b border-gray-100 dark:border-[#243460]">
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star key={i} size={24} className={i < getStars(selectedDriver.score) ? 'text-[#f5b800] fill-[#f5b800]' : 'text-gray-200 dark:text-gray-600'} />
                                        ))}
                                    </div>
                                    <p className={`text-4xl font-black ${getScoreColor(selectedDriver.score)}`}>{selectedDriver.score}<span className="text-lg text-gray-300">/100</span></p>
                                    <p className={`text-sm font-black ${getScoreColor(selectedDriver.score)} mt-1`}>{getScoreLabel(selectedDriver.score)}</p>
                                </div>

                                {/* Details */}
                                <div className="p-6 space-y-3">
                                    {[
                                        { label: isRTL ? 'الرحلات المكتملة' : 'Completed Trips', value: `${selectedDriver.completed_trips} / ${selectedDriver.total_trips}`, icon: <TrendingUp size={16} className="text-sky-500" /> },
                                        { label: isRTL ? 'في الوقت المحدد' : 'On-Time Trips', value: selectedDriver.on_time_trips, icon: <Clock3 size={16} className="text-emerald-500" /> },
                                        { label: isRTL ? 'المخالفات' : 'Violations', value: selectedDriver.violations, icon: <AlertTriangle size={16} className="text-red-500" /> },
                                        { label: isRTL ? 'التأخيرات' : 'Delays', value: selectedDriver.delays, icon: <Clock3 size={16} className="text-orange-500" /> },
                                        { label: isRTL ? 'الفحوصات الناجحة' : 'Passed Inspections', value: `${selectedDriver.inspections_passed} / ${selectedDriver.inspections}`, icon: <CheckCircle2 size={16} className="text-emerald-500" /> },
                                        { label: isRTL ? 'رقم الرخصة' : 'License Number', value: selectedDriver.license_number || '—', icon: <Award size={16} className="text-[#f5b800]" /> },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-[#0f2044]/[0.03] dark:bg-[#0f2044]/20">
                                            <div className="flex items-center gap-3">
                                                {item.icon}
                                                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{item.label}</span>
                                            </div>
                                            <span className="text-sm font-black text-[#0f2044] dark:text-white">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </AuthenticatedLayout>
    );
}
