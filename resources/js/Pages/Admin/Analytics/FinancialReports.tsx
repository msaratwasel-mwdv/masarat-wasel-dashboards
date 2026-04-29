import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { DS_pageWrapper, DS_btnSecondary, DS_inputCls, DS_labelCls } from '@/lib/DS';
import PrintReportHeader from '@/Components/PrintReportHeader';
import { Wallet, Fuel, Wrench, Printer, Filter, TrendingUp, Package } from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Legend
} from 'recharts';

interface Props {
    auth: any;
    expensesByType: Array<{ type: string; total: number; count: number }>;
    expensesPerBus: Array<{
        bus_id: number; bus_number: string; plate_number: string;
        fuel_cost: number; maintenance_cost: number; other_cost: number;
        total_cost: number; entries: number;
    }>;
    monthlyTrend: Array<{ month: string; fuel: number; maintenance: number; other: number; total: number }>;
    summary: { total: number; fuel: number; maintenance: number; other: number };
    filters: { date_from: string; date_to: string };
}

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #financial-print-area, #financial-print-area * { visibility: visible !important; }
  #financial-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
  @page { size: landscape; margin: 1cm; }
}
`;

const PIE_COLORS = ['#f5b800', '#0f2044', '#10b981', '#ef4444', '#8b5cf6', '#f97316'];

export default function FinancialReports({ auth, expensesByType, expensesPerBus, monthlyTrend, summary, filters }: Props) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === 'dark';
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);

    const applyFilters = () => {
        router.get(route('admin.analytics.financial'), { date_from: dateFrom, date_to: dateTo }, { preserveState: true });
    };

    const handlePrint = () => window.print();

    const typeLabels: Record<string, { ar: string; en: string; icon: React.ReactNode }> = {
        fuel: { ar: 'وقود', en: 'Fuel', icon: <Fuel size={16} /> },
        maintenance: { ar: 'صيانة', en: 'Maintenance', icon: <Wrench size={16} /> },
        other: { ar: 'أخرى', en: 'Other', icon: <Package size={16} /> },
    };

    const getTypeLabel = (type: string) => typeLabels[type]?.[isRTL ? 'ar' : 'en'] ?? type;

    const pieData = expensesByType.map(e => ({
        name: getTypeLabel(e.type),
        value: Number(e.total),
        type: e.type,
    }));

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? 'التقارير المالية' : 'Financial Reports'} />
            <style>{PRINT_STYLES}</style>

            {/* ── Print Area ── */}
            <div id="financial-print-area" className="hidden print:block bg-white text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
                <PrintReportHeader
                    title={isRTL ? "تقرير المصاريف المالية" : "Financial Expense Report"}
                    schoolName={isRTL ? "إدارة شركة مسارات واصل" : "Masarat Wasel Company"}
                    schoolLogo={null}
                    printDate={`${filters.date_from} → ${filters.date_to}`}
                    schoolAdminText={isRTL ? "إدارة العمليات" : "Operations Dept"}
                />
                <div className="px-4 mt-4">
                    <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                        <div className="border border-gray-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-gray-500">{isRTL ? 'الإجمالي' : 'Total'}</p>
                            <p className="text-xl font-black">{summary.total.toLocaleString()} SAR</p>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-gray-500">{isRTL ? 'الوقود' : 'Fuel'}</p>
                            <p className="text-xl font-black text-amber-600">{summary.fuel.toLocaleString()} SAR</p>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-gray-500">{isRTL ? 'الصيانة' : 'Maintenance'}</p>
                            <p className="text-xl font-black text-blue-600">{summary.maintenance.toLocaleString()} SAR</p>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-gray-500">{isRTL ? 'أخرى' : 'Other'}</p>
                            <p className="text-xl font-black text-green-600">{summary.other.toLocaleString()} SAR</p>
                        </div>
                    </div>
                    <h3 className="text-lg font-black mb-2">{isRTL ? 'تفصيل لكل حافلة' : 'Per-Bus Breakdown'}</h3>
                    <table className="w-full border-collapse border border-gray-300 text-[10px]">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-300 p-1.5">#</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'الحافلة' : 'Bus'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'الوقود' : 'Fuel'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'الصيانة' : 'Maintenance'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'أخرى' : 'Other'}</th>
                                <th className="border border-gray-300 p-1.5">{isRTL ? 'الإجمالي' : 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expensesPerBus.map((bus, i) => (
                                <tr key={bus.bus_id}>
                                    <td className="border border-gray-300 p-1.5 text-center">{i + 1}</td>
                                    <td className="border border-gray-300 p-1.5 font-bold">{bus.bus_number}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{bus.fuel_cost.toLocaleString()}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{bus.maintenance_cost.toLocaleString()}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{bus.other_cost.toLocaleString()}</td>
                                    <td className="border border-gray-300 p-1.5 text-center font-bold">{bus.total_cost.toLocaleString()}</td>
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
                            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                                <Wallet size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span>{isRTL ? 'التقارير المالية' : 'Financial Reports'}</span>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">
                                    {isRTL ? 'الوقود والصيانة والتكاليف التشغيلية' : 'Fuel, Maintenance & Operational Costs'}
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
                        { icon: <Wallet size={20} />, label: isRTL ? 'إجمالي المصاريف' : 'Total Expenses', value: `${summary.total.toLocaleString()}`, sub: 'SAR', color: 'bg-[#0f2044]/10 text-[#0f2044] dark:bg-[#0f2044]/30 dark:text-[#7ba7e8]' },
                        { icon: <Fuel size={20} />, label: isRTL ? 'تكلفة الوقود' : 'Fuel Cost', value: `${summary.fuel.toLocaleString()}`, sub: 'SAR', color: 'bg-[#f5b800]/10 text-[#b38600]' },
                        { icon: <Wrench size={20} />, label: isRTL ? 'تكلفة الصيانة' : 'Maintenance Cost', value: `${summary.maintenance.toLocaleString()}`, sub: 'SAR', color: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600' },
                        { icon: <Package size={20} />, label: isRTL ? 'أخرى' : 'Other Costs', value: `${summary.other.toLocaleString()}`, sub: 'SAR', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
                    ].map((kpi, i) => (
                        <div key={i} className="flex items-center gap-4 p-5 rounded-[20px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] shadow-sm">
                            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
                                {kpi.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{kpi.label}</p>
                                <p className="text-2xl font-black text-[#0f2044] dark:text-white mt-0.5">{kpi.value} <span className="text-sm text-gray-400">{kpi.sub}</span></p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Charts Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm p-6">
                        <h3 className="text-lg font-black text-[#0f2044] dark:text-white mb-6 flex items-center gap-2">
                            <Wallet size={20} className="text-[#f5b800]" />
                            {isRTL ? 'توزيع المصاريف حسب النوع' : 'Expenses by Type'}
                        </h3>
                        <div className="h-[280px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} innerRadius={65} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {pieData.map((_, index) => (
                                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: any) => `${Number(value).toLocaleString()} SAR`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <span className="text-2xl font-black text-[#0f2044] dark:text-white">{summary.total.toLocaleString()}</span>
                                    <span className="block text-[9px] font-bold text-gray-400 uppercase">SAR</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Trend */}
                    <div className="bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm p-6">
                        <h3 className="text-lg font-black text-[#0f2044] dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-500" />
                            {isRTL ? 'اتجاه المصاريف الشهرية' : 'Monthly Expense Trend'}
                        </h3>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyTrend}>
                                    <defs>
                                        <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f5b800" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f5b800" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="maintGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0f2044" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#0f2044" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none' }} formatter={(value: any) => `${Number(value).toLocaleString()} SAR`} />
                                    <Area type="monotone" dataKey="fuel" stroke="#f5b800" strokeWidth={3} fillOpacity={1} fill="url(#fuelGrad)" name={isRTL ? 'الوقود' : 'Fuel'} />
                                    <Area type="monotone" dataKey="maintenance" stroke="#0f2044" strokeWidth={2} fillOpacity={1} fill="url(#maintGrad)" name={isRTL ? 'الصيانة' : 'Maintenance'} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ── Per-Bus Comparison (Bar Chart) ── */}
                {expensesPerBus.length > 0 && (
                    <div className="bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm p-6">
                        <h3 className="text-lg font-black text-[#0f2044] dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-sky-500" />
                            {isRTL ? 'مقارنة المصاريف بين الحافلات' : 'Bus-by-Bus Comparison'}
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={expensesPerBus}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                                    <XAxis dataKey="bus_number" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none' }} formatter={(value: any) => `${Number(value).toLocaleString()} SAR`} />
                                    <Legend />
                                    <Bar dataKey="fuel_cost" name={isRTL ? 'الوقود' : 'Fuel'} fill="#f5b800" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="maintenance_cost" name={isRTL ? 'الصيانة' : 'Maintenance'} fill="#0f2044" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="other_cost" name={isRTL ? 'أخرى' : 'Other'} fill="#10b981" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* ── Per-Bus Table ── */}
                <div className="bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-[#243460]">
                        <h3 className="text-lg font-black text-[#0f2044] dark:text-white flex items-center gap-2">
                            <Wallet size={20} className="text-[#f5b800]" />
                            {isRTL ? 'تفصيل المصاريف لكل حافلة' : 'Per-Bus Expense Breakdown'}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#0f2044]/5 dark:bg-[#0f2044]/40">
                                <tr>
                                    {[
                                        '#',
                                        isRTL ? 'الحافلة' : 'Bus',
                                        isRTL ? 'اللوحة' : 'Plate',
                                        isRTL ? 'الوقود' : 'Fuel',
                                        isRTL ? 'الصيانة' : 'Maintenance',
                                        isRTL ? 'أخرى' : 'Other',
                                        isRTL ? 'الإجمالي' : 'Total',
                                        isRTL ? 'السجلات' : 'Entries',
                                    ].map((h, i) => (
                                        <th key={i} className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#0f2044]/60 dark:text-[#7ba7e8]/70 text-start">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {expensesPerBus.map((bus, i) => (
                                    <tr key={bus.bus_id} className="hover:bg-[#0f2044]/[0.03] dark:hover:bg-[#0f2044]/30 transition-colors border-b border-gray-50 dark:border-[#243460] last:border-0">
                                        <td className="px-4 py-3.5 text-gray-400 font-bold">{i + 1}</td>
                                        <td className="px-4 py-3.5 font-black text-[#0f2044] dark:text-white">{bus.bus_number}</td>
                                        <td className="px-4 py-3.5 text-gray-500">{bus.plate_number}</td>
                                        <td className="px-4 py-3.5 font-bold text-[#b38600] dark:text-[#f5b800]">{bus.fuel_cost.toLocaleString()}</td>
                                        <td className="px-4 py-3.5 font-bold text-sky-600 dark:text-sky-400">{bus.maintenance_cost.toLocaleString()}</td>
                                        <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">{bus.other_cost.toLocaleString()}</td>
                                        <td className="px-4 py-3.5 font-black text-[#0f2044] dark:text-white">{bus.total_cost.toLocaleString()} <span className="text-[10px] text-gray-400">SAR</span></td>
                                        <td className="px-4 py-3.5 text-gray-500 font-bold">{bus.entries}</td>
                                    </tr>
                                ))}
                                {expensesPerBus.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">{isRTL ? 'لا توجد مصاريف' : 'No expenses found'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
