import React, { useState, useMemo } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, { type PaginationMeta } from "@/Components/BaseDataTable";
import SchoolPrintLayout from "@/Components/Reports/SchoolPrintLayout";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Calendar,
  Download,
  Bus,
  Clock,
  Filter,
  BarChart3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  DS_pageWrapper,
  DS_card,
  DS_pageTitle,
  DS_statCard,
  DS_statIcon,
  DS_statLabel,
  DS_statValue2,
  DS_badge,
  DS_inputCls,
  DS_selectCls,
  DS_labelCls,
  DS_btnPrimary,
} from "@/lib/DS";

interface Attendance {
  id: number;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  student?: {
    id: number;
    full_name: string;
    student_code: string;
  };
  trip?: {
    id: number;
    trip_date: string;
    type: string;
    departure_time: string | null;
    arrival_time: string | null;
    bus?: { id: number; bus_number: string; plate_number: string };
    driver?: { id: number; first_name_ar: string; last_name_ar: string };
  };
}

interface TrendPoint {
  date: string;
  label: string;
  present: number;
  absent: number;
  total: number;
}

interface Props {
  attendances: {
    data: Attendance[];
    links: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  stats: {
    totalRecords: number;
    boardedCount: number;
    absentCount: number;
    attendanceRate: number;
  };
  trend: TrendPoint[];
  buses: { id: number; bus_number: string; plate_number: string }[];
  filters: { date_from: string; date_to: string; bus_id: string | null };
  auth?: any;
}

export default function StudentAttendanceReport({ attendances, stats, trend, buses, filters, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);
  const [busId, setBusId] = useState(filters.bus_id || "");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('per_page') === 'all') {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, []);

  const applyFilters = () => {
    router.get(route("school.reports.student-attendance"), {
      date_from: dateFrom,
      date_to: dateTo,
      bus_id: busId || undefined,
    }, { preserveState: true });
  };

  const quickFilter = (days: number) => {
    const to = new Date().toISOString().split("T")[0];
    const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    setDateFrom(from);
    setDateTo(to);
    router.get(route("school.reports.student-attendance"), { date_from: from, date_to: to, bus_id: busId || undefined }, { preserveState: true });
  };

  const columnHelper = createColumnHelper<Attendance>();

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: "#",
      cell: (info) => <span className="font-bold text-slate-400">#{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: "student",
      header: isRTL ? "اسم الطالب" : "Student",
      cell: (info) => {
        const att = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0f2044]/10 dark:bg-[#0f2044]/40 flex items-center justify-center text-[#0f2044] dark:text-[#7ba7e8] font-bold text-xs">
              {att.student?.full_name?.charAt(0) || "?"}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-800 dark:text-white text-sm">{att.student?.full_name || "—"}</span>
              <span className="text-[10px] text-slate-400">{att.student?.national_id}</span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "trip_info",
      header: isRTL ? "الرحلة" : "Trip",
      cell: (info) => {
        const trip = info.row.original.trip;
        return (
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${trip?.type === "forth" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"}`}>
              <Bus size={14} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{trip?.bus?.bus_number}</span>
              <span className="text-[10px] text-slate-400">
                {trip?.type === "forth" ? (isRTL ? "ذهاب" : "To School") : (isRTL ? "عودة" : "To Home")}
              </span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "date",
      header: isRTL ? "التاريخ" : "Date",
      cell: (info) => {
        const trip = info.row.original.trip;
        return (
          <div className="flex flex-col">
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {trip?.trip_date ? new Date(trip.trip_date).toLocaleDateString(isRTL ? "ar-SA" : "en-US") : "—"}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("check_in_time", {
      header: isRTL ? "وقت الصعود" : "Board Time",
      cell: (info) => {
        const val = info.getValue();
        return val ? (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <Clock size={12} />
            {new Date(val).toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
        ) : <span className="text-slate-400 text-xs">—</span>;
      },
    }),
    columnHelper.accessor("check_out_time", {
      header: isRTL ? "وقت النزول" : "Alight Time",
      cell: (info) => {
        const val = info.getValue();
        return val ? (
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs">
            <Clock size={12} />
            {new Date(val).toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
        ) : <span className="text-slate-400 text-xs">—</span>;
      },
    }),
    columnHelper.display({
      id: "status",
      header: isRTL ? "الحالة" : "Status",
      cell: (info) => {
        const att = info.row.original;
        const boarded = !!att.check_in_time;
        return boarded ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-full text-[10px] font-black border border-emerald-100 dark:border-emerald-800/40">
            <CheckCircle2 size={12} />
            {isRTL ? "حاضر" : "Boarded"}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-full text-[10px] font-black border border-rose-100 dark:border-rose-800/40">
            <XCircle size={12} />
            {isRTL ? "غائب" : "Absent"}
          </div>
        );
      },
    }),
  ], [isRTL]);

  const pagination: PaginationMeta = {
    links: attendances.links,
    current_page: attendances.current_page,
    last_page: attendances.last_page,
    per_page: attendances.per_page,
    total: attendances.total,
    from: attendances.from,
    to: attendances.to,
  };

  // Mini bar chart
  const maxTrendValue = Math.max(...trend.map(t => t.total), 1);

  // Prepare Print Data
  const printStats = [
    { label: isRTL ? "إجمالي السجلات" : "Total Records", value: stats.totalRecords },
    { label: isRTL ? "حاضرون" : "Boarded", value: stats.boardedCount },
    { label: isRTL ? "غائبون" : "Absent", value: stats.absentCount },
    { label: isRTL ? "نسبة الحضور" : "Attendance Rate", value: `${stats.attendanceRate}%` },
  ];

  const printHeaders = isRTL 
    ? ["#", "اسم الطالب", "الرقم المدني", "الحافلة", "نوع الرحلة", "التاريخ", "وقت الصعود", "وقت النزول", "الحالة"]
    : ["#", "Student", "Civil ID", "Bus", "Trip Type", "Date", "Board Time", "Alight Time", "Status"];

  const printRows = attendances.data.map(att => [
    att.id,
    att.student?.full_name || "—",
    att.student?.student_code || "—",
    att.trip?.bus?.bus_number || "—",
    (att.trip?.type === 'forth' || att.trip?.type === 'morning') ? (isRTL ? "ذهاب" : "To School") : (isRTL ? "عودة" : "To Home"),
    att.trip?.trip_date ? new Date(att.trip.trip_date).toLocaleDateString(isRTL ? "ar-SA" : "en-US") : "—",
    att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: '2-digit', minute: '2-digit' }) : "—",
    att.check_out_time ? new Date(att.check_out_time).toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: '2-digit', minute: '2-digit' }) : "—",
    att.check_in_time ? (isRTL ? "حاضر" : "Boarded") : (isRTL ? "غائب" : "Absent")
  ]);

  return (
    <SchoolAuthenticatedLayout user={auth?.user}>
      <Head title={isRTL ? "تقرير حضور الطلاب" : "Student Attendance Report"} />

      <SchoolPrintLayout
        title={isRTL ? "تقرير حضور الطلاب" : "Student Attendance Report"}
        reportId={`ATT-${new Date().getFullYear()}${new Date().getMonth()+1}`}
        stats={printStats}
        statsStyle="table"
        schoolName={auth.user.school?.name}
        schoolLogo={auth.user.school?.logo_url}
        tableHeaders={printHeaders}
        tableRows={printRows}
      />

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8 print:hidden`} dir={isRTL ? "rtl" : "ltr"}>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex flex-col">
            <h1 className={DS_pageTitle}>
              {isRTL ? "تقرير حضور الطلاب" : "Student Attendance Report"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {isRTL ? "حضور الطلاب في رحلات الحافلات" : "Student Bus Trip Attendance"}
              </span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (attendances.total > attendances.data.length) {
                const url = new URL(window.location.href);
                url.searchParams.set('per_page', 'all');
                window.location.href = url.toString();
                return;
              }
              window.print();
            }} 
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} />
            {isRTL ? "تصدير التقرير" : "Export Report"}
          </button>
        </div>

        {/* Stats Grid - Classic Row Style */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex-1 min-w-[200px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-brand-navy/5 flex items-center justify-center text-brand-navy"><Users size={24} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "إجمالي السجلات" : "Total Records"}</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalRecords}</p>
            </div>
          </div>
          <div className="flex-1 min-w-[200px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><UserCheck size={24} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "حاضرون" : "Boarded"}</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{stats.boardedCount}</p>
            </div>
          </div>
          <div className="flex-1 min-w-[200px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600"><UserX size={24} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "غائبون" : "Absent"}</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{stats.absentCount}</p>
            </div>
          </div>
          <div className="flex-1 min-w-[200px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><TrendingUp size={24} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "نسبة الحضور" : "Attendance Rate"}</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{stats.attendanceRate}%</p>
            </div>
          </div>
        </div>

        {/* Trend Chart + Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Trend Chart */}
          <div className={`lg:col-span-2 ${DS_card} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"}`}>
                  {isRTL ? "اتجاه الحضور — آخر 7 أيام" : "Attendance Trend — Last 7 Days"}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{isRTL ? "حاضر vs غائب" : "Present vs Absent"}</p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-300" />
            </div>
            <div className="flex items-end gap-2 h-40">
              {trend.map((t, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-0.5" style={{ height: "120px" }}>
                    <div
                      className="w-full bg-emerald-500/20 dark:bg-emerald-500/30 rounded-t-lg transition-all duration-500"
                      style={{ height: `${(t.present / maxTrendValue) * 100}%` }}
                      title={`${isRTL ? "حاضر" : "Present"}: ${t.present}`}
                    />
                    <div
                      className="w-full bg-rose-500/20 dark:bg-rose-500/30 rounded-b-lg transition-all duration-500"
                      style={{ height: `${(t.absent / maxTrendValue) * 100}%` }}
                      title={`${isRTL ? "غائب" : "Absent"}: ${t.absent}`}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-gray-400">{t.label}</span>
                  <span className="text-[8px] font-black text-gray-300">{t.total}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-[10px] font-bold text-gray-400">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500/30" />{isRTL ? "حاضر" : "Present"}</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-500/30" />{isRTL ? "غائب" : "Absent"}</div>
            </div>
          </div>

          {/* Filters */}
          <div className={`${DS_card} p-6`}>
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-4 h-4 text-[#f5b800]" />
              <h3 className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"}`}>
                {isRTL ? "فلتر البحث" : "Filter Options"}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className={DS_labelCls}>{isRTL ? "من تاريخ" : "From Date"}</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={DS_inputCls} />
              </div>
              <div>
                <label className={DS_labelCls}>{isRTL ? "إلى تاريخ" : "To Date"}</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={DS_inputCls} />
              </div>
              <div>
                <label className={DS_labelCls}>{isRTL ? "الحافلة" : "Bus"}</label>
                <select value={busId} onChange={(e) => setBusId(e.target.value)} className={DS_selectCls}>
                  <option value="">{isRTL ? "جميع الحافلات" : "All Buses"}</option>
                  {buses.map((b) => (
                    <option key={b.id} value={b.id}>{b.bus_number} — {b.plate_number}</option>
                  ))}
                </select>
              </div>

              <button onClick={applyFilters} className={`${DS_btnPrimary} w-full justify-center`}>
                {isRTL ? "تطبيق الفلتر" : "Apply Filter"}
              </button>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: isRTL ? "اليوم" : "Today", days: 0 },
                  { label: isRTL ? "أسبوع" : "Week", days: 7 },
                  { label: isRTL ? "شهر" : "Month", days: 30 },
                ].map((q) => (
                  <button key={q.days} onClick={() => quickFilter(q.days)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#0f2044]/5 dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-gray-300 hover:bg-[#0f2044]/10 transition-all">
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className={DS_card}>
          <BaseDataTable<Attendance>
            columns={columns}
            data={attendances.data}
            pagination={attendances}
            searchPlaceholder={isRTL ? "ابحث باسم الطالب أو رقم الحافلة..." : "Search by student name or bus..."}
            title={isRTL ? "سجل حضور الطلاب" : "Student Attendance Records"}
            subtitle={isRTL ? "قائمة بكافة سجلات صعود ونزول الطلاب من الحافلات" : "All student boarding and alighting records"}
          />
        </div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
