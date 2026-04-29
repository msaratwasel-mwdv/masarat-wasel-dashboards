import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { DS_pageWrapper, DS_btnSecondary, DS_inputCls, DS_labelCls } from '@/lib/DS';
import PrintReportHeader from '@/Components/PrintReportHeader';
import {
    ShieldCheck, Clock3, Gauge, Printer, Filter, ArrowLeft,
    TrendingUp, Bus as BusIcon, Activity, CheckCircle2, XCircle
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';

interface Props {
    auth: any;
    safeTripsTrend: Array<{ date: string; total: number; completed: number; safe: number; cancelled: number }>;
    buses: Array<{
        id: number; bus_number: string; plate_number: string; capacity: number;
        students_count: number; utilization: number; completed_trips: number;
        driver_name: string; route_name: string; school_name: string;
    }>;
    onTimePerBus: Array<{ bus_number: string; total: number; on_time: number; percent: number }>;
    summary: { total_completed: number; total_safe: number; safe_percent: number; total_trips: number };
    filters: { date_from: string; date_to: string };
}

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #operational-print-area, #operational-print-area * { visibility: visible !important; }
  #operational-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
  @page { size: landscape; margin: 1cm; }
}
`;

export default function OperationalReports({ auth, safeTripsTrend, buses, onTimePerBus, summary, filters }: Props) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === 'dark';
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);

    const applyFilters = () => {
        router.get(route('admin.analytics.operational'), { date_from: dateFrom, date_to: dateTo }, { preserveState: true });
    };

    const handlePrint = () => window.print();

    const getUtilColor = (pct: number) => {
        if (pct >= 80) return 'text-emerald-500';
        if (pct >= 50) return 'text-[#f5b800]';
        return 'text-red-500';
    };

    const getUtilBg = (pct: number) => {
        if (pct >= 80) return 'bg-emerald-500';
        if (pct >= 50) return 'bg-[#f5b800]';
        return 'bg-red-500';
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? 'تقارير الأداء التشغيلي' : 'Operational Reports'} />
            <style>{PRINT_STYLES}</style>

            {/* ── Print Area ── */}
            <div id="operational-print-area" className="hidden print:block bg-white text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
                <PrintReportHeader
                    title={isRTL ? "تقرير الأداء التشغيلي" : "Operational Performance Report"}
                    schoolName={isRTL ? "إدارة شركة مسارات واصل" : "Masarat Wasel Company"}
                    schoolLogo={null}
                    printDate={`${filters.date_from} → ${filters.date_to}`}
                    schoolAdminText={isRTL ? "إدارة العمليات" : "Operations Dept"}
                />
                <div className="px-4 mt-4">
                    <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                        <div className="border border-gray-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-gray-500">{isRTL ? 'إجمالي الرحلات' : 'Total Trips'}</p>
                            <p className="text-2xl font-black">{summary.total_trips}</p>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-gray-500">{isRTL ? 'الرحلات الآمنة' : 'Safe Trips'}</p>
                            <p className="text-2xl font-black text-green-600">{summary.total_safe} ({summary.safe_percent}%)</p>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-gray-500">{isRTL ? 'المكتملة' : 'Completed'}</p>
                            <p className="text-2xl font-black">{summary.total_completed}</p>
                        </div>
                    </div>
                    <h3 className="text-lg font-black mb-2">{isRTL ? 'معدل استخدام الحافلات' : 'Bus Utilization'}</h3>
                    <table className="w-full border-collapse border border-gray-300 text-[10px]">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-300 p-1.5">#</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'الحافلة' : 'Bus'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'السعة' : 'Capacity'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'الطلاب' : 'Students'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'الاستخدام' : 'Usage'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'الرحلات' : 'Trips'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'السائق' : 'Driver'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {buses.map((bus, i) => (
                                <tr key={bus.id}>
                                    <td className="border border-gray-300 p-1.5 text-center">{i + 1}</td>
                                    <td className="border border-gray-300 p-1.5 font-bold">{bus.bus_number}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{bus.capacity}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{bus.students_count}</td>
                                    <td className="border border-gray-300 p-1.5 text-center font-bold">{bus.utilization}%</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{bus.completed_trips}</td>
                                    <td className="border border-gray-300 p-1.5">{bus.driver_name}</td>
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
                            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                                <Activity size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span>{isRTL ? 'تقارير الأداء التشغيلي' : 'Operational Reports'}</span>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">
                                    {isRTL ? 'الرحلات الآمنة والالتزام بالمواعيد ومعدل الاستخدام' : 'Safe Trips, On-Time Analysis & Utilization'}
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

                {/* ── Summary KPIs ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { icon: <Activity size={20} />, label: isRTL ? 'إجمالي الرحلات' : 'Total Trips', value: summary.total_trips, accent: 'blue' as const },
                        { icon: <CheckCircle2 size={20} />, label: isRTL ? 'المكتملة' : 'Completed', value: summary.total_completed, accent: 'green' as const },
                        { icon: <ShieldCheck size={20} />, label: isRTL ? 'الرحلات الآمنة' : 'Safe Trips', value: `${summary.total_safe} (${summary.safe_percent}%)`, accent: 'green' as const },
                        { icon: <XCircle size={20} />, label: isRTL ? 'الحوادث المرتبطة' : 'With Incidents', value: summary.total_completed - summary.total_safe, accent: 'red' as const },
                    ].map((kpi, i) => (
                        <div key={i} className={`flex items-center gap-4 p-5 rounded-[20px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] shadow-sm`}>
                            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 ${kpi.accent === 'green' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : kpi.accent === 'blue' ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-600' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
                                {kpi.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{kpi.label}</p>
                                <p className="text-2xl font-black text-[#0f2044] dark:text-white mt-0.5">{kpi.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Charts Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Safe Trips Trend */}
                    <div className="bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm p-6">
                        <h3 className="text-lg font-black text-[#0f2044] dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-500" />
                            {isRTL ? 'اتجاه الرحلات الآمنة' : 'Safe Trips Trend'}
                        </h3>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={safeTripsTrend}>
                                    <defs>
                                        <linearGradient id="safeFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0f2044" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#0f2044" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="total" stroke="#0f2044" strokeWidth={2} fillOpacity={1} fill="url(#totalFill)" name={isRTL ? 'الإجمالي' : 'Total'} />
                                    <Area type="monotone" dataKey="safe" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#safeFill)" name={isRTL ? 'الآمنة' : 'Safe'} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* On-Time per Bus */}
                    <div className="bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm p-6">
                        <h3 className="text-lg font-black text-[#0f2044] dark:text-white mb-6 flex items-center gap-2">
                            <Clock3 size={20} className="text-sky-500" />
                            {isRTL ? 'الالتزام بالمواعيد لكل حافلة' : 'On-Time Rate per Bus'}
                        </h3>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={onTimePerBus} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                                    <XAxis type="number" domain={[0, 100]} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                                    <YAxis dataKey="bus_number" type="category" width={70} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none' }} />
                                    <Bar dataKey="percent" radius={[0, 8, 8, 0]} name={isRTL ? 'نسبة الالتزام' : 'On-Time %'}>
                                        {onTimePerBus.map((entry, index) => (
                                            <Cell key={index} fill={entry.percent >= 80 ? '#10b981' : entry.percent >= 50 ? '#f5b800' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ── Bus Utilization Table ── */}
                <div className="bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-[#243460]">
                        <h3 className="text-lg font-black text-[#0f2044] dark:text-white flex items-center gap-2">
                            <Gauge size={20} className="text-[#f5b800]" />
                            {isRTL ? 'معدل استخدام الحافلات' : 'Bus Utilization Rate'}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#0f2044]/5 dark:bg-[#0f2044]/40">
                                <tr>
                                    {[
                                        '#',
                                        isRTL ? 'الحافلة' : 'Bus',
                                        isRTL ? 'السائق' : 'Driver',
                                        isRTL ? 'المسار' : 'Route',
                                        isRTL ? 'السعة' : 'Capacity',
                                        isRTL ? 'الطلاب' : 'Students',
                                        isRTL ? 'الاستخدام' : 'Utilization',
                                        isRTL ? 'الرحلات المكتملة' : 'Completed Trips',
                                    ].map((h, i) => (
                                        <th key={i} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#0f2044]/60 dark:text-[#7ba7e8]/70 text-start">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {buses.map((bus, i) => (
                                    <tr key={bus.id} className="hover:bg-[#0f2044]/[0.03] dark:hover:bg-[#0f2044]/30 transition-colors border-b border-gray-50 dark:border-[#243460] last:border-0">
                                        <td className="px-4 py-3.5 text-gray-400 font-bold">{i + 1}</td>
                                        <td className="px-4 py-3.5">
                                            <span className="font-black text-[#0f2044] dark:text-white">{bus.bus_number}</span>
                                            <span className="block text-[10px] text-gray-400">{bus.plate_number}</span>
                                        </td>
                                        <td className="px-4 py-3.5 font-bold text-gray-700 dark:text-gray-300">{bus.driver_name}</td>
                                        <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400">{bus.route_name}</td>
                                        <td className="px-4 py-3.5 font-black text-[#0f2044] dark:text-white">{bus.capacity}</td>
                                        <td className="px-4 py-3.5 font-black text-[#0f2044] dark:text-white">{bus.students_count}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-gray-100 dark:bg-[#0f2044]/30 rounded-full overflow-hidden max-w-[100px]">
                                                    <div className={`h-full rounded-full ${getUtilBg(bus.utilization)}`} style={{ width: `${Math.min(100, bus.utilization)}%` }} />
                                                </div>
                                                <span className={`text-sm font-black ${getUtilColor(bus.utilization)}`}>{bus.utilization}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 font-black text-[#0f2044] dark:text-white">{bus.completed_trips}</td>
                                    </tr>
                                ))}
                                {buses.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">{isRTL ? 'لا توجد بيانات' : 'No data available'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
