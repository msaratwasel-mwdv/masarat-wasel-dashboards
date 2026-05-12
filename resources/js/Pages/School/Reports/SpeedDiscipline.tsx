import React, { useState, useMemo } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, { type PaginationMeta } from "@/Components/BaseDataTable";
import SchoolPrintLayout from "@/Components/Reports/SchoolPrintLayout";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Gauge,
  AlertTriangle,
  Shield,
  Bus,
  Download,
  Filter,
  Zap,
  Activity,
  TrendingUp,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { DS_pageWrapper, DS_card, DS_pageTitle, DS_statCard, DS_statIcon, DS_statLabel, DS_statValue2, DS_badge, DS_inputCls, DS_labelCls, DS_btnPrimary } from "@/lib/DS";

interface Violation {
  id: number;
  type: string;
  description: string;
  status: string;
  photos: string | null;
  created_at: string;
  bus?: { id: number; bus_number: string; plate_number: string };
  field_supervisor?: { id: number; first_name_ar: string; last_name_ar: string };
}

interface SpeedEntry {
  bus_number: string;
  plate_number: string;
  avg_speed: number;
  max_speed: number;
  speed_violations: number;
  compliance_rate: number;
}

interface ViolationByBus {
  bus_number: string;
  count: number;
}

interface Props {
  violations: { data: Violation[]; links: any[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
  speedData: SpeedEntry[];
  violationsByBus: ViolationByBus[];
  stats: { totalViolations: number; avgSpeed: number; maxRecordedSpeed: number; complianceRate: number };
  filters: { date_from: string; date_to: string };
  auth?: any;
}

export default function SpeedDisciplineReport({ violations, speedData, violationsByBus, stats, filters, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";
  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('per_page') === 'all') {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, []);

  const applyFilters = () => {
    router.get(route("school.reports.speed-discipline"), { date_from: dateFrom, date_to: dateTo }, { preserveState: true });
  };

  const columnHelper = createColumnHelper<Violation>();
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
    columnHelper.display({
      id: "bus", header: isRTL ? "الحافلة" : "Bus",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-navy/5 dark:bg-brand-navy/20 rounded-lg"><Bus size={14} className="text-brand-navy dark:text-[#7ba7e8]" /></div>
          <div className="flex flex-col">
            <span className="font-black text-slate-800 dark:text-white text-xs">{info.row.original.bus?.bus_number || "—"}</span>
            <span className="text-[10px] text-slate-400">{info.row.original.bus?.plate_number}</span>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("type", {
      header: isRTL ? "النوع" : "Type",
      cell: (info) => <span className="font-bold text-slate-600 dark:text-slate-300 text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor("status", {
      header: isRTL ? "الحالة" : "Status",
      cell: (info) => {
        const v = info.getValue();
        const variant = v === "resolved" ? "green" : v === "pending" ? "gold" : v === "confirmed" ? "red" : "navy";
        const label = v === "resolved" ? (isRTL ? "تم الحل" : "Resolved") : v === "pending" ? (isRTL ? "معلق" : "Pending") : v === "confirmed" ? (isRTL ? "مؤكد" : "Confirmed") : v;
        return <div className={DS_badge(variant as any)}>{label}</div>;
      },
    }),
    columnHelper.accessor("description", {
      header: isRTL ? "الوصف" : "Description",
      cell: (info) => <span className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{info.getValue() || "—"}</span>,
    }),
  ], [isRTL]);

  const pagination: PaginationMeta = { links: violations.links, current_page: violations.current_page, last_page: violations.last_page, per_page: violations.per_page, total: violations.total, from: violations.from, to: violations.to };

  // Prepare Print Data
  const printStats = [
    { label: isRTL ? "متوسط السرعة" : "Avg Speed", value: `${stats.avgSpeed} km/h` },
    { label: isRTL ? "أعلى سرعة" : "Max Speed", value: `${stats.maxRecordedSpeed} km/h` },
    { label: isRTL ? "المخالفات" : "Violations", value: stats.totalViolations },
    { label: isRTL ? "نسبة الالتزام" : "Compliance", value: `${stats.complianceRate}%` },
  ];

  const printHeaders = isRTL 
    ? ["#", "التاريخ", "الحافلة", "النوع", "الحالة", "الوصف"]
    : ["#", "Date", "Bus", "Type", "Status", "Description"];

  const printRows = violations.data.map(v => [
    v.id,
    new Date(v.created_at).toLocaleDateString(isRTL ? "ar-SA" : "en-US"),
    v.bus?.bus_number || "—",
    v.type,
    v.status === "resolved" ? (isRTL ? "تم الحل" : "Resolved") : v.status === "pending" ? (isRTL ? "معلق" : "Pending") : (isRTL ? "مؤكد" : "Confirmed"),
    v.description || "—"
  ]);

  return (
    <SchoolAuthenticatedLayout user={auth?.user}>
      <Head title={isRTL ? "تقرير السرعة والانضباط المروري" : "Speed & Discipline Report"} />

      <SchoolPrintLayout
        title={isRTL ? "تقرير السرعة والانضباط المروري" : "Speed & Discipline Report"}
        reportId={`SPD-${new Date().getFullYear()}${new Date().getMonth()+1}`}
        stats={printStats}
        statsStyle="table"
        schoolName={auth.user.school?.name}
        schoolLogo={auth.user.school?.logo_url}
        tableHeaders={printHeaders}
        tableRows={printRows}
      >
        {/* Speed Per Bus for Print */}
        <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-lg font-black mb-4">{isRTL ? "ملخص السرعة لكل حافلة" : "Speed Summary Per Bus"}</h3>
            <table className="w-full text-xs border-collapse border border-slate-300">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "الحافلة" : "Bus"}</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "متوسط السرعة" : "Avg Speed"}</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "أعلى سرعة" : "Max Speed"}</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "المخالفات" : "Violations"}</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "نسبة الالتزام" : "Compliance"}</th>
                    </tr>
                </thead>
                <tbody>
                    {speedData.map((bus, i) => (
                        <tr key={i}>
                            <td className="px-2 py-2 border border-slate-300 font-bold">{bus.bus_number}</td>
                            <td className="px-2 py-2 border border-slate-300">{bus.avg_speed} km/h</td>
                            <td className="px-2 py-2 border border-slate-300">{bus.max_speed} km/h</td>
                            <td className="px-2 py-2 border border-slate-300">{bus.speed_violations}</td>
                            <td className="px-2 py-2 border border-slate-300">{bus.compliance_rate}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </SchoolPrintLayout>

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8 print:hidden`} dir={isRTL ? "rtl" : "ltr"}>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex flex-col">
            <h1 className={DS_pageTitle}>{isRTL ? "تقرير السرعة والانضباط المروري" : "Speed & Discipline Report"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRTL ? "مراقبة السرعة والمخالفات" : "Speed monitoring & violations"}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (violations.total > violations.data.length) {
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
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-[#f5b800]"><Gauge size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "متوسط السرعة" : "Avg Speed"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.avgSpeed} km/h</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600"><Zap size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "أعلى سرعة مسجلة" : "Max Speed"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.maxRecordedSpeed} km/h</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-brand-navy/5 flex items-center justify-center text-brand-navy"><AlertTriangle size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "مخالفات" : "Violations"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalViolations}</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle2 size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "نسبة الالتزام" : "Compliance"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.complianceRate}%</p></div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${DS_card} p-4 mb-8`}>
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={DS_labelCls}>{isRTL ? "من" : "From"}</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={DS_inputCls} /></div>
              <div><label className={DS_labelCls}>{isRTL ? "إلى" : "To"}</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={DS_inputCls} /></div>
              <div className="flex items-end"><button onClick={applyFilters} className={`${DS_btnPrimary} w-full justify-center`}>{isRTL ? "تطبيق" : "Apply"}</button></div>
            </div>
          </div>
        </div>

        {/* Speed Data Cards + Violations by Bus */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Speed per Bus */}
          <div className={`${DS_card} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"}`}>{isRTL ? "السرعة لكل حافلة" : "Speed Per Bus"}</h3>
              <Gauge className="w-5 h-5 text-gray-300" />
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {speedData.map((bus, i) => (
                <div key={i} className={`p-4 rounded-xl border transition-all hover:shadow-sm ${isDark ? "bg-[#1a2845] border-[#243460]" : "bg-gray-50/80 border-gray-100"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg"><Bus size={16} className="text-cyan-600 dark:text-cyan-400" /></div>
                      <div>
                        <span className="font-black text-slate-800 dark:text-white text-sm">{bus.bus_number}</span>
                        <p className="text-[10px] text-slate-400">{bus.plate_number}</p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      bus.compliance_rate >= 95 ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40" :
                      bus.compliance_rate >= 80 ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40" :
                      "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/40"
                    }`}>
                      {bus.compliance_rate}% {isRTL ? "التزام" : "compliant"}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-white dark:bg-[#0f2044]/40">
                      <p className="text-sm font-black text-[#0f2044] dark:text-white">{bus.avg_speed}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">{isRTL ? "متوسط" : "AVG"} km/h</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white dark:bg-[#0f2044]/40">
                      <p className={`text-sm font-black ${bus.max_speed > 70 ? "text-rose-500" : "text-[#0f2044] dark:text-white"}`}>{bus.max_speed}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">{isRTL ? "أعلى" : "MAX"} km/h</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-white dark:bg-[#0f2044]/40">
                      <p className="text-sm font-black text-rose-500">{bus.speed_violations}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">{isRTL ? "مخالفات" : "Violations"}</p>
                    </div>
                  </div>
                </div>
              ))}
              {speedData.length === 0 && <p className="text-sm text-gray-400 text-center py-6">{isRTL ? "لا توجد بيانات" : "No data"}</p>}
            </div>
          </div>

          {/* Violations by Bus */}
          <div className={`${DS_card} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"}`}>{isRTL ? "المخالفات لكل حافلة" : "Violations Per Bus"}</h3>
              <AlertTriangle className="w-5 h-5 text-gray-300" />
            </div>
            <div className="space-y-3">
              {violationsByBus.map((vb, i) => {
                const maxCount = Math.max(...violationsByBus.map(v => v.count), 1);
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-24 flex items-center gap-2">
                      <Bus size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate">{vb.bus_number}</span>
                    </div>
                    <div className="flex-1 h-8 bg-gray-100 dark:bg-[#0f2044]/30 rounded-xl overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-xl transition-all duration-700 flex items-center justify-end px-3"
                        style={{ width: `${Math.max(8, (vb.count / maxCount) * 100)}%` }}
                      >
                        <span className="text-[10px] font-black text-white">{vb.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {violationsByBus.length === 0 && (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-12 h-12 text-emerald-200 dark:text-emerald-800 mx-auto mb-3" />
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{isRTL ? "لا توجد مخالفات! ممتاز 🎉" : "No violations! Excellent 🎉"}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Violations Table */}
        <div className={DS_card}>
          <BaseDataTable<Violation>
            columns={columns} data={violations.data} pagination={violations}
            searchPlaceholder={isRTL ? "ابحث عن مخالفة..." : "Search violations..."}
            title={isRTL ? "سجل المخالفات المرورية" : "Traffic Violations Log"}
            subtitle={isRTL ? "جميع المخالفات المسجلة خلال الفترة المحددة" : "All violations during the selected period"}
          />
        </div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
