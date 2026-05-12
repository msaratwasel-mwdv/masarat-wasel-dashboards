import React, { useState, useMemo } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, { type PaginationMeta } from "@/Components/BaseDataTable";
import SchoolPrintLayout from "@/Components/Reports/SchoolPrintLayout";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Clock,
  Timer,
  Bus,
  User,
  Download,
  Filter,
  TrendingDown,
  AlertCircle,
  BarChart3,
  UserMinus,
} from "lucide-react";
import { DS_pageWrapper, DS_card, DS_pageTitle, DS_statCard, DS_statIcon, DS_statLabel, DS_statValue2, DS_badge, DS_inputCls, DS_selectCls, DS_labelCls, DS_btnPrimary } from "@/lib/DS";

interface Delay {
  id: number;
  type: string;
  duration_minutes: number;
  reason: string;
  notes: string;
  created_at: string;
  student?: { id: number; full_name: string; student_code: string };
  bus?: { id: number; bus_number: string; plate_number: string };
  reporter?: { id: number; first_name_ar: string; last_name_ar: string };
}

interface TrendPoint {
  date: string;
  label: string;
  count: number;
  minutes: number;
}

interface Props {
  delays: { data: Delay[]; links: any[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
  stats: { totalDelays: number; totalMinutes: number; avgMinutes: number; busDelays: number; studentDelays: number };
  trend: TrendPoint[];
  buses: { id: number; bus_number: string; plate_number: string }[];
  filters: { date_from: string; date_to: string; type: string | null; bus_id: string | null };
  auth?: any;
}

export default function DelayPunctualityReport({ delays, stats, trend, buses, filters, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";
  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);
  const [type, setType] = useState(filters.type || "");
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
    router.get(route("school.reports.delay-punctuality"), {
      date_from: dateFrom, date_to: dateTo, type: type || undefined, bus_id: busId || undefined,
    }, { preserveState: true });
  };

  const quickFilter = (days: number) => {
    const to = new Date().toISOString().split("T")[0];
    const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    setDateFrom(from); setDateTo(to);
    router.get(route("school.reports.delay-punctuality"), { date_from: from, date_to: to, type: type || undefined, bus_id: busId || undefined }, { preserveState: true });
  };

  const columnHelper = createColumnHelper<Delay>();
  const columns = useMemo(() => [
    columnHelper.accessor("id", { header: "#", cell: (info) => <span className="font-bold text-slate-400">#{info.getValue()}</span> }),
    columnHelper.accessor("created_at", {
      header: isRTL ? "التاريخ" : "Date",
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 dark:text-slate-200">{new Date(info.getValue()).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}</span>
          <span className="text-[10px] text-slate-400">{new Date(info.getValue()).toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      ),
    }),
    columnHelper.accessor("type", {
      header: isRTL ? "النوع" : "Type",
      cell: (info) => <div className={DS_badge(info.getValue() === "bus" ? "navy" : "gold")}>{info.getValue() === "bus" ? (isRTL ? "حافلة" : "Bus") : (isRTL ? "طالب" : "Student")}</div>,
    }),
    columnHelper.display({
      id: "target", header: isRTL ? "الهدف" : "Target",
      cell: (info) => {
        const d = info.row.original;
        if (d.type === "student") return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#f5b800]/10 rounded-lg text-[#b38600]"><User size={14} /></div>
            <div className="flex flex-col">
              <span className="font-black text-slate-800 dark:text-white text-xs">{d.student?.full_name || "—"}</span>
              <span className="text-[10px] text-slate-400">{d.student?.national_id}</span>
            </div>
          </div>
        );
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-navy/5 dark:bg-brand-navy/20 rounded-lg"><Bus size={14} className="text-brand-navy dark:text-[#7ba7e8]" /></div>
            <div className="flex flex-col">
              <span className="font-black text-slate-800 dark:text-white text-xs">{d.bus?.bus_number || "—"}</span>
              <span className="text-[10px] text-slate-400">{d.bus?.plate_number}</span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("duration_minutes", {
      header: isRTL ? "المدة" : "Duration",
      cell: (info) => (
        <div className="flex items-center gap-1.5 font-black text-[#f5b800]">
          <Clock size={12} />{info.getValue()} {isRTL ? "د" : "min"}
        </div>
      ),
    }),
    columnHelper.accessor("reason", {
      header: isRTL ? "السبب" : "Reason",
      cell: (info) => <span className="text-xs font-bold text-slate-500 line-clamp-1 max-w-[150px]">{info.getValue() || "—"}</span>,
    }),
    columnHelper.display({
      id: "reporter", header: isRTL ? "المشرف الميداني" : "Reporter",
      cell: (info) => {
        const r = info.row.original.reporter;
        return <span className="text-xs font-bold text-slate-500">{r ? `${r.first_name_ar} ${r.last_name_ar}` : "—"}</span>;
      },
    }),
  ], [isRTL]);

  // Prepare Print Data
  const printStats = [
    { label: isRTL ? "إجمالي الدقائق" : "Total Minutes", value: stats.totalMinutes },
    { label: isRTL ? "متوسط التأخير" : "Avg Delay", value: `${stats.avgMinutes} ${isRTL ? 'د' : 'min'}` },
    { label: isRTL ? "حالات التأخير" : "Total Delays", value: stats.totalDelays },
    { label: isRTL ? "تأخير حافلات" : "Bus Delays", value: stats.busDelays },
    { label: isRTL ? "تأخير طلاب" : "Student Delays", value: stats.studentDelays },
  ];

  const printHeaders = isRTL
    ? ["#", "التاريخ", "النوع", "الهدف", "المدة", "السبب", "المبلغ"]
    : ["#", "Date", "Type", "Target", "Duration", "Reason", "Reporter"];

  const printRows = delays.data.map(d => [
    d.id,
    new Date(d.created_at).toLocaleDateString(isRTL ? "ar-SA" : "en-US"),
    d.type === "bus" ? (isRTL ? "حافلة" : "Bus") : (isRTL ? "طالب" : "Student"),
    d.type === "student" ? (d.student?.full_name || "—") : (d.bus?.bus_number || "—"),
    `${d.duration_minutes} ${isRTL ? "د" : "min"}`,
    d.reason || "—",
    d.reporter ? `${d.reporter.first_name_ar} ${d.reporter.last_name_ar}` : "—"
  ]);

  const maxTrendCount = Math.max(...trend.map(t => t.count), 1);

  return (
    <SchoolAuthenticatedLayout user={auth?.user}>
      <Head title={isRTL ? "تقرير التأخيرات والالتزام" : "Delays & Punctuality Report"} />

      <SchoolPrintLayout
        title={isRTL ? "تقرير التأخيرات والالتزام بالمواعيد" : "Delays & Punctuality Report"}
        reportId={`DLY-${new Date().getFullYear()}${new Date().getMonth()+1}`}
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
            <h1 className={DS_pageTitle}>{isRTL ? "تقرير التأخيرات والالتزام بالمواعيد" : "Delays & Punctuality Report"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stats.totalDelays} {isRTL ? "حالة تأخير" : "Delay Cases"}</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (delays.total > delays.data.length) {
                const url = new URL(window.location.href);
                url.searchParams.set('per_page', 'all');
                window.location.href = url.toString();
                return;
              }
              window.print();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} />{isRTL ? "تصدير" : "Export"}
          </button>
        </div>

        {/* Stats - Classic Row Style */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-[#f5b800]"><Clock size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "إجمالي الدقائق" : "Total Minutes"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalMinutes}</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-brand-navy/5 flex items-center justify-center text-brand-navy"><Timer size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "متوسط التأخير" : "Avg Delay"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.avgMinutes} {isRTL ? "د" : "min"}</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600"><AlertCircle size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "حالات التأخير" : "Total Delays"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalDelays}</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Bus size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "تأخير حافلات" : "Bus Delays"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.busDelays}</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><UserMinus size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "تأخير طلاب" : "Student Delays"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.studentDelays}</p></div>
          </div>
        </div>

        {/* Trend + Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className={`lg:col-span-2 ${DS_card} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"}`}>{isRTL ? "اتجاه التأخيرات — آخر 7 أيام" : "Delay Trend — Last 7 Days"}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{isRTL ? "عدد حالات التأخير يومياً" : "Daily delay count"}</p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-300" />
            </div>
            <div className="flex items-end gap-3 h-40">
              {trend.map((t, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative" style={{ height: "120px" }}>
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-rose-500/30 to-rose-400/10 rounded-t-lg transition-all duration-500 hover:from-rose-500/50"
                      style={{ height: `${Math.max(4, (t.count / maxTrendCount) * 100)}%` }}
                    />
                    {t.count > 0 && (
                      <div className="absolute top-0 w-full text-center">
                        <span className="text-[10px] font-black text-rose-500">{t.count}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-gray-400">{t.label}</span>
                  <span className="text-[8px] font-bold text-gray-300">{t.minutes}{isRTL ? "د" : "m"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${DS_card} p-6`}>
            <div className="flex items-center gap-2 mb-6"><Filter className="w-4 h-4 text-[#f5b800]" /><h3 className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"}`}>{isRTL ? "فلتر البحث" : "Filters"}</h3></div>
            <div className="space-y-4">
              <div><label className={DS_labelCls}>{isRTL ? "من" : "From"}</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={DS_inputCls} /></div>
              <div><label className={DS_labelCls}>{isRTL ? "إلى" : "To"}</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={DS_inputCls} /></div>
              <div><label className={DS_labelCls}>{isRTL ? "النوع" : "Type"}</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className={DS_selectCls}>
                  <option value="">{isRTL ? "الكل" : "All"}</option>
                  <option value="bus">{isRTL ? "حافلة" : "Bus"}</option>
                  <option value="student">{isRTL ? "طالب" : "Student"}</option>
                </select>
              </div>
              <div><label className={DS_labelCls}>{isRTL ? "الحافلة" : "Bus"}</label>
                <select value={busId} onChange={(e) => setBusId(e.target.value)} className={DS_selectCls}>
                  <option value="">{isRTL ? "الكل" : "All"}</option>
                  {buses.map((b) => <option key={b.id} value={b.id}>{b.bus_number}</option>)}
                </select>
              </div>
              <button onClick={applyFilters} className={`${DS_btnPrimary} w-full justify-center`}>{isRTL ? "تطبيق" : "Apply"}</button>
              <div className="flex flex-wrap gap-2">
                {[{l:isRTL?"اليوم":"Today",d:0},{l:isRTL?"أسبوع":"Week",d:7},{l:isRTL?"شهر":"Month",d:30}].map(q=>(<button key={q.d} onClick={()=>quickFilter(q.d)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#0f2044]/5 dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-gray-300 hover:bg-[#0f2044]/10 transition-all">{q.l}</button>))}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={DS_card}>
          <BaseDataTable<Delay>
            columns={columns} data={delays.data} pagination={delays}
            searchPlaceholder={isRTL ? "ابحث عن طالب أو حافلة..." : "Search student or bus..."}
            title={isRTL ? "سجلات التأخير" : "Delay Records"}
            subtitle={isRTL ? "جميع حالات التأخير المسجلة مع التفاصيل" : "All recorded delay cases with details"}
          />
        </div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
