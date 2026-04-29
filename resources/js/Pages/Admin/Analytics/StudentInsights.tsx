import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { DS_pageWrapper, DS_btnSecondary, DS_inputCls, DS_labelCls } from '@/lib/DS';
import PrintReportHeader from '@/Components/PrintReportHeader';
import {
    GraduationCap, Printer, Filter, TrendingUp, CalendarDays,
    MapPin, UserCheck, UserX, Users, Building
} from 'lucide-react';
import {
    BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

interface Props {
    auth: any;
    absenceByDay: Array<{ day_num: number; day_ar: string; day_en: string; absent_count: number }>;
    absenceByRoute: Array<{ route_id: number; route_name: string; absent_count: number }>;
    weeklyTrend: Array<{ week: string; week_start: string; present: number; absent: number; total: number }>;
    groupedAbsences: Array<{
        school_id: number;
        school_name: string;
        total_absences: number;
        total_students_absent: number;
        students: Array<{ id: number; name: string; code: string; absent_count: number }>;
    }>;
    schools: Array<{ id: number; name: string }>;
    summary: { total_records: number; present: number; absent: number; attendance_rate: number };
    filters: { date_from: string; date_to: string; school_id: string | number };
}

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #student-print-area, #student-print-area * { visibility: visible !important; }
  #student-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
  @page { size: landscape; margin: 1cm; }
  .avoid-page-break { page-break-inside: avoid; }
}
`;

const DAY_COLORS = ['#ef4444', '#f97316', '#f5b800', '#10b981', '#0f2044', '#8b5cf6', '#ec4899'];

export default function StudentInsights({ auth, absenceByDay, absenceByRoute, weeklyTrend, groupedAbsences, schools, summary, filters }: Props) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === 'dark';
    const [dateFrom, setDateFrom] = useState(filters.date_from);
    const [dateTo, setDateTo] = useState(filters.date_to);
    const [schoolId, setSchoolId] = useState(filters.school_id?.toString() || 'all');

    const applyFilters = () => {
        router.get(route('admin.analytics.students'), { date_from: dateFrom, date_to: dateTo, school_id: schoolId }, { preserveState: true });
    };

    const handlePrint = () => window.print();

    const dayChartData = absenceByDay.map(d => ({
        name: isRTL ? d.day_ar : d.day_en,
        value: d.absent_count,
        day_num: d.day_num,
    }));

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? 'تحليلات الطلاب' : 'Student Insights'} />
            <style>{PRINT_STYLES}</style>

            {/* ── Print Area ── */}
            <div id="student-print-area" className="hidden print:block bg-white text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
                <PrintReportHeader
                    title={isRTL ? "تقرير تحليلات الحضور والغياب" : "Attendance & Absence Analysis Report"}
                    schoolName={isRTL ? "إدارة شركة مسارات واصل" : "Masarat Wasel Company"}
                    schoolLogo={null}
                    printDate={`${filters.date_from} → ${filters.date_to}`}
                    schoolAdminText={isRTL ? "إدارة العمليات" : "Operations Dept"}
                />
                <div className="px-4 mt-4">
                    <div className="grid grid-cols-4 gap-4 mb-6 text-center">
                        <div className="border border-gray-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-gray-500">{isRTL ? 'إجمالي السجلات' : 'Total Records'}</p>
                            <p className="text-xl font-black">{summary.total_records}</p>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-gray-500">{isRTL ? 'الحضور' : 'Present'}</p>
                            <p className="text-xl font-black text-green-600">{summary.present}</p>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-gray-500">{isRTL ? 'الغياب' : 'Absent'}</p>
                            <p className="text-xl font-black text-red-600">{summary.absent}</p>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-3">
                            <p className="text-xs font-bold text-gray-500">{isRTL ? 'نسبة الحضور' : 'Attendance Rate'}</p>
                            <p className="text-xl font-black">{summary.attendance_rate}%</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 mt-4">
                        <div>
                            <h3 className="text-lg font-black mb-2">{isRTL ? 'الغياب حسب اليوم' : 'Absence by Day'}</h3>
                            <table className="w-full border-collapse border border-gray-300 text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-gray-300 p-2">{isRTL ? 'اليوم' : 'Day'}</th>
                                        <th className="border border-gray-300 p-2">{isRTL ? 'عدد الغياب' : 'Absences'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {absenceByDay.map((d, i) => (
                                        <tr key={i}>
                                            <td className="border border-gray-300 p-2">{isRTL ? d.day_ar : d.day_en}</td>
                                            <td className="border border-gray-300 p-2 text-center font-bold">{d.absent_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div>
                            <h3 className="text-lg font-black mb-2">{isRTL ? 'أعلى خطوط سير غياباً' : 'Top Absence Routes'}</h3>
                            <table className="w-full border-collapse border border-gray-300 text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-gray-300 p-2">{isRTL ? 'المسار' : 'Route'}</th>
                                        <th className="border border-gray-300 p-2">{isRTL ? 'عدد الغياب' : 'Absences'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {absenceByRoute.map((r, i) => (
                                        <tr key={i}>
                                            <td className="border border-gray-300 p-2">{r.route_name}</td>
                                            <td className="border border-gray-300 p-2 text-center font-bold">{r.absent_count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {groupedAbsences.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-xl font-black mb-4">{isRTL ? 'تفصيل الغياب حسب المدارس والطلاب' : 'Detailed Absences by School & Student'}</h3>
                            {groupedAbsences.map(group => (
                                <div key={group.school_id} className="mb-6 avoid-page-break">
                                    <div className="bg-gray-100 p-3 font-bold flex justify-between border border-gray-300 border-b-0">
                                        <span className="text-base">{group.school_name}</span>
                                        <span className="text-gray-600">{group.total_students_absent} {isRTL ? 'طلاب' : 'students'} / {group.total_absences} {isRTL ? 'غياب' : 'absences'}</span>
                                    </div>
                                    <table className="w-full border-collapse border border-gray-300 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="border border-gray-300 p-2 text-start">{isRTL ? 'اسم الطالب' : 'Student Name'}</th>
                                                <th className="border border-gray-300 p-2 text-start">{isRTL ? 'الرقم الأكاديمي' : 'Student ID'}</th>
                                                <th className="border border-gray-300 p-2 text-center">{isRTL ? 'عدد مرات الغياب' : 'Absences'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.students.map(student => (
                                                <tr key={student.id}>
                                                    <td className="border border-gray-300 p-2 font-bold">{student.name}</td>
                                                    <td className="border border-gray-300 p-2 text-gray-600">{student.code}</td>
                                                    <td className="border border-gray-300 p-2 text-center font-bold text-red-600">{student.absent_count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={`${DS_pageWrapper} space-y-8 px-4 sm:px-6 lg:px-8 pt-6 pb-12`} dir={isRTL ? 'rtl' : 'ltr'}>
                {/* ── Header ── */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-gray-100 dark:border-[#243460]">
                    <div>
                        <h1 className="text-3xl font-black text-[#0f2044] dark:text-white flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                                <GraduationCap size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span>{isRTL ? 'تحليلات الطلاب' : 'Student Insights'}</span>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">
                                    {isRTL ? 'اتجاهات الحضور والغياب' : 'Attendance Trends & Absence Patterns'}
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
                    <div className="flex-1 w-full md:w-auto">
                        <label className={DS_labelCls}>{isRTL ? 'المدرسة' : 'School'}</label>
                        <select value={schoolId} onChange={e => setSchoolId(e.target.value)} className={DS_inputCls}>
                            <option value="all">{isRTL ? 'جميع المدارس' : 'All Schools'}</option>
                            {schools.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={applyFilters} className="px-8 py-2.5 bg-[#0f2044] text-white rounded-[18px] text-sm font-black hover:bg-[#1a3a7a] transition-all shadow-lg">
                        <Filter size={14} className="inline mr-2" />
                        {isRTL ? 'تطبيق' : 'Apply'}
                    </button>
                </div>

                {/* ── Summary KPIs ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { icon: <Users size={20} />, label: isRTL ? 'إجمالي السجلات' : 'Total Records', value: summary.total_records, color: 'bg-[#0f2044]/10 text-[#0f2044] dark:bg-[#0f2044]/30 dark:text-[#7ba7e8]' },
                        { icon: <UserCheck size={20} />, label: isRTL ? 'الحضور' : 'Present', value: summary.present, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
                        { icon: <UserX size={20} />, label: isRTL ? 'الغياب' : 'Absent', value: summary.absent, color: 'bg-red-50 dark:bg-red-900/20 text-red-500' },
                        { icon: <TrendingUp size={20} />, label: isRTL ? 'نسبة الحضور' : 'Attendance Rate', value: `${summary.attendance_rate}%`, color: 'bg-[#f5b800]/10 text-[#b38600]' },
                    ].map((kpi, i) => (
                        <div key={i} className="flex items-center gap-4 p-5 rounded-[20px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] shadow-sm">
                            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
                                {kpi.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{kpi.label}</p>
                                <p className="text-2xl font-black text-[#0f2044] dark:text-white mt-0.5">{kpi.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Grouped Absences by School ── */}
                <div className="bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm p-6 lg:p-8">
                    <h3 className="text-xl font-black text-[#0f2044] dark:text-white mb-6 flex items-center gap-2">
                        <Building size={24} className="text-blue-500" />
                        {filters.school_id === 'all' 
                            ? (isRTL ? 'تحليل الغياب حسب المدارس' : 'Absence Analysis by School')
                            : (isRTL ? 'أكثر الطلاب غياباً في المدرسة المحددة' : 'Most Absent Students in School')}
                    </h3>
                    
                    {groupedAbsences.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <UserX size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="font-bold">{isRTL ? 'لا توجد حالات غياب في هذه الفترة' : 'No absences found in this period'}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {groupedAbsences.map(schoolGroup => (
                                <div key={schoolGroup.school_id} className="border border-gray-100 dark:border-[#243460] rounded-[20px] overflow-hidden bg-white dark:bg-[#1a2845] shadow-sm">
                                    {filters.school_id === 'all' && (
                                        <div className="bg-gray-50/50 dark:bg-[#0f2044]/30 p-5 border-b border-gray-100 dark:border-[#243460] flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                                    <Building size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg text-[#0f2044] dark:text-white">{schoolGroup.school_name}</h4>
                                                    <p className="text-xs font-bold text-gray-500 mt-0.5">
                                                        {schoolGroup.total_students_absent} {isRTL ? 'طالب/طالبة غائبين' : 'absent students'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-end bg-white dark:bg-[#1a2845] px-4 py-2 rounded-xl border border-gray-100 dark:border-[#243460]">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{isRTL ? 'إجمالي الغيابات' : 'Total Absences'}</p>
                                                <p className="text-xl font-black text-red-500">{schoolGroup.total_absences}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {schoolGroup.students.map(student => (
                                            <div key={student.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#0f2044]/20 border border-gray-100 dark:border-[#243460] hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] flex items-center justify-center text-sm font-black text-[#0f2044] dark:text-[#7ba7e8] shadow-sm">
                                                        {student.name.substring(0, 1)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#0f2044] dark:text-white truncate max-w-[120px]">{student.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{student.code}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center justify-center w-12 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 border border-red-200 dark:border-red-900/50">
                                                    <span className="text-lg font-black leading-none">{student.absent_count}</span>
                                                    <span className="text-[9px] font-bold mt-0.5">{isRTL ? 'غياب' : 'absences'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Charts Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Absence by Day */}
                    <div className="bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm p-6">
                        <h3 className="text-lg font-black text-[#0f2044] dark:text-white mb-6 flex items-center gap-2">
                            <CalendarDays size={20} className="text-purple-500" />
                            {isRTL ? 'الغياب حسب أيام الأسبوع' : 'Absence by Day of Week'}
                        </h3>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dayChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                                    <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none' }} />
                                    <Bar dataKey="value" radius={[12, 12, 0, 0]} name={isRTL ? 'حالات الغياب' : 'Absences'}>
                                        {dayChartData.map((_, index) => (
                                            <Cell key={index} fill={DAY_COLORS[index % DAY_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Absence Routes */}
                    <div className="bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm p-6">
                        <h3 className="text-lg font-black text-[#0f2044] dark:text-white mb-6 flex items-center gap-2">
                            <MapPin size={20} className="text-red-500" />
                            {isRTL ? 'أكثر خطوط السير غياباً' : 'Top Routes by Absence'}
                        </h3>
                        <div className="space-y-3">
                            {absenceByRoute.length > 0 ? (
                                absenceByRoute.map((r, idx) => {
                                    const maxVal = absenceByRoute[0]?.absent_count || 1;
                                    const widthPercent = Math.max(10, (r.absent_count / maxVal) * 100);
                                    return (
                                        <div key={r.route_id} className="group">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-lg bg-[#0f2044]/5 dark:bg-[#0f2044]/30 flex items-center justify-center text-[10px] font-black text-gray-400">{idx + 1}</span>
                                                    <span className="text-sm font-bold text-[#0f2044] dark:text-white truncate max-w-[200px]">{r.route_name}</span>
                                                </div>
                                                <span className="text-sm font-black text-red-500">{r.absent_count}</span>
                                            </div>
                                            <div className="h-2.5 bg-gray-100 dark:bg-[#0f2044]/30 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
                                                    style={{ width: `${widthPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="font-bold">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Weekly Trend ── */}
                <div className="bg-white dark:bg-[#1a2845] rounded-[28px] border border-gray-100 dark:border-[#243460] shadow-sm p-6">
                    <h3 className="text-lg font-black text-[#0f2044] dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-emerald-500" />
                        {isRTL ? 'اتجاه الحضور والغياب الأسبوعي' : 'Weekly Attendance Trend'}
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyTrend}>
                                <defs>
                                    <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                                <XAxis dataKey="week_start" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} />
                                <RechartsTooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none' }} />
                                <Legend />
                                <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#presentGrad)" name={isRTL ? 'الحضور' : 'Present'} />
                                <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#absentGrad)" name={isRTL ? 'الغياب' : 'Absent'} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
