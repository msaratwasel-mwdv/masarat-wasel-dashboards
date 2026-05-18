import React, { useState, useMemo, useEffect } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, { type PaginationMeta } from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Bus,
  Clock,
  Download,
  Filter,
  MapPin,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  Route as RouteIcon,
  Timer,
} from "lucide-react";
import { DS_pageWrapper, DS_card, DS_pageTitle, DS_statCard, DS_statIcon, DS_statLabel, DS_statValue2, DS_badge, DS_inputCls, DS_selectCls, DS_labelCls, DS_btnPrimary } from "@/lib/DS";
import SchoolPrintLayout from "@/Components/Reports/SchoolPrintLayout";

interface Trip {
  id: number;
  trip_date: string;
  type: string;
  departure_time: string | null;
  arrival_time: string | null;
  status: string;
  bus?: { id: number; bus_number: string; plate_number: string; capacity: number };
  driver?: { id: number; first_name_ar: string; last_name_ar: string; first_name_en?: string | null; last_name_en?: string | null };
  route?: { id: number; name: string };
}

export const getTripDriverName = (driver: any, isRTL: boolean) => {
  if (!driver) return "—";
  if (isRTL) {
    const arName = [driver.first_name_ar, driver.last_name_ar].filter(Boolean).join(" ");
    if (arName) return arName;
    return [driver.first_name_en, driver.last_name_en].filter(Boolean).join(" ") || "—";
  } else {
    const enName = [driver.first_name_en, driver.last_name_en].filter(Boolean).join(" ");
    if (enName) return enName;
    return [driver.first_name_ar, driver.last_name_ar].filter(Boolean).join(" ") || "—";
  }
};

interface BusSummary {
  bus_number: string;
  trip_count: number;
  estimated_km: number;
}

interface Props {
  trips: { data: Trip[]; links: any[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
  stats: { totalTrips: number; completedTrips: number; cancelledTrips: number; forthTrips: number; backTrips: number; avgDuration: number };
  tripsByBus: BusSummary[];
  buses: { id: number; bus_number: string; plate_number: string }[];
  filters: { date_from: string; date_to: string; bus_id: string | null };
  auth?: any;
}

export default function TripOperationsReport({ trips, stats, tripsByBus, buses, filters, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";
  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);
  const [busId, setBusId] = useState(filters.bus_id || "");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('per_page') === 'all') {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, []);

  const applyFilters = () => {
    router.get(route("school.reports.trip-operations"), { date_from: dateFrom, date_to: dateTo, bus_id: busId || undefined }, { preserveState: true });
  };

  const quickFilter = (days: number) => {
    const to = new Date().toISOString().split("T")[0];
    const from = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    setDateFrom(from); setDateTo(to);
    router.get(route("school.reports.trip-operations"), { date_from: from, date_to: to, bus_id: busId || undefined }, { preserveState: true });
  };

  const columnHelper = createColumnHelper<Trip>();
  const columns = useMemo(() => [
    columnHelper.accessor("id", { header: "#", cell: (info) => <span className="font-bold text-slate-400">#{info.getValue()}</span> }),
    columnHelper.accessor("trip_date", {
      header: isRTL ? "التاريخ" : "Date",
      cell: (info) => <span className="font-bold text-slate-700 dark:text-slate-200">{new Date(info.getValue()).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}</span>,
    }),
    columnHelper.display({
      id: "bus", header: isRTL ? "الحافلة" : "Bus",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-navy/5 dark:bg-brand-navy/20 rounded-lg text-brand-navy dark:text-[#7ba7e8]"><Bus size={14} /></div>
          <div className="flex flex-col">
            <span className="font-black text-slate-800 dark:text-white text-xs">{info.row.original.bus?.bus_number}</span>
            <span className="text-[10px] text-slate-400">{info.row.original.bus?.plate_number}</span>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("type", {
      header: isRTL ? "الاتجاه" : "Direction",
      cell: (info) => (
        <div className={DS_badge(info.getValue() === "forth" ? "green" : "navy")}>
          {info.getValue() === "forth" ? (isRTL ? "ذهاب" : "To School") : (isRTL ? "عودة" : "To Home")}
        </div>
      ),
    }),
    columnHelper.accessor("departure_time", {
      header: isRTL ? "وقت المغادرة" : "Departure",
      cell: (info) => info.getValue() ? (
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
          <Clock size={12} />{new Date(info.getValue()!).toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
      ) : <span className="text-slate-400 text-xs">—</span>,
    }),
    columnHelper.accessor("arrival_time", {
      header: isRTL ? "وقت الوصول" : "Arrival",
      cell: (info) => info.getValue() ? (
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs">
          <Clock size={12} />{new Date(info.getValue()!).toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>
      ) : <span className="text-slate-400 text-xs">—</span>,
    }),
    columnHelper.accessor("status", {
      header: isRTL ? "الحالة" : "Status",
      cell: (info) => {
        const s = info.getValue();
        const variant = s === "finished" ? "green" : s === "cancelled" ? "red" : s === "in_progress" || s === "started" ? "gold" : "navy";
        const label = s === "finished" ? (isRTL ? "مكتملة" : "Completed") : s === "cancelled" ? (isRTL ? "ملغاة" : "Cancelled") : s === "in_progress" || s === "started" ? (isRTL ? "قيد التنفيذ" : "In Progress") : s;
        return <div className={DS_badge(variant as any)}>{label}</div>;
      },
    }),
    columnHelper.display({
      id: "driver", header: isRTL ? "السائق" : "Driver",
      cell: (info) => <span className="font-bold text-slate-600 dark:text-slate-300 text-xs">{getTripDriverName(info.row.original.driver, isRTL)}</span>,
    }),
  ], [isRTL]);

  const pagination: PaginationMeta = { links: trips.links, current_page: trips.current_page, last_page: trips.last_page, per_page: trips.per_page, total: trips.total, from: trips.from, to: trips.to };

  // Prepare Print Data
  const printStats = [
    { label: isRTL ? "إجمالي الرحلات" : "Total Trips", value: stats.totalTrips },
    { label: isRTL ? "مكتملة" : "Completed", value: stats.completedTrips },
    { label: isRTL ? "ملغاة" : "Cancelled", value: stats.cancelledTrips },
    { label: isRTL ? "رحلات ذهاب" : "Forth Trips", value: stats.forthTrips },
    { label: isRTL ? "رحلات عودة" : "Back Trips", value: stats.backTrips },
    { label: isRTL ? "متوسط المدة" : "Avg Duration", value: `${stats.avgDuration} ${isRTL ? 'د' : 'min'}` },
  ];

  const printHeaders = isRTL 
    ? ["#", "التاريخ", "الحافلة", "الاتجاه", "وقت المغادرة", "وقت الوصول", "الحالة", "السائق"]
    : ["#", "Date", "Bus", "Direction", "Departure", "Arrival", "Status", "Driver"];

  const printRows = trips.data.map(trip => [
    trip.id,
    new Date(trip.trip_date).toLocaleDateString(isRTL ? "ar-SA" : "en-US"),
    trip.bus?.bus_number || "—",
    (trip.type === 'forth' || trip.type === 'morning') ? (isRTL ? "ذهاب" : "To School") : (isRTL ? "عودة" : "To Home"),
    trip.departure_time ? new Date(trip.departure_time).toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: '2-digit', minute: '2-digit' }) : "—",
    trip.arrival_time ? new Date(trip.arrival_time).toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: '2-digit', minute: '2-digit' }) : "—",
    trip.status === "finished" ? (isRTL ? "مكتملة" : "Completed") : trip.status === "cancelled" ? (isRTL ? "ملغاة" : "Cancelled") : (isRTL ? "قيد التنفيذ" : "In Progress"),
    getTripDriverName(trip.driver, isRTL)
  ]);

  return (
    <SchoolAuthenticatedLayout user={auth?.user}>
      <Head title={isRTL ? "تقرير العمليات والرحلات" : "Trip Operations Report"} />

      <SchoolPrintLayout
        title={isRTL ? "تقرير العمليات والرحلات" : "Trip Operations Report"}
        reportId={`TRP-${new Date().getFullYear()}${new Date().getMonth()+1}`}
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
            <h1 className={DS_pageTitle}>{isRTL ? "تقرير العمليات والرحلات" : "Trip Operations Report"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {stats.totalTrips} {isRTL ? "رحلة مسجلة" : "Total Trips Recorded"}
              </span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (trips.total > trips.data.length) {
                const url = new URL(window.location.href);
                url.searchParams.set('per_page', 'all');
                window.location.href = url.toString();
                return;
              }
              window.print();
            }} 
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} />{isRTL ? "تصدير التقرير" : "Export Report"}
          </button>
        </div>

        {/* Stats - Classic Row Style */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-brand-navy/5 flex items-center justify-center text-brand-navy"><Activity size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "إجمالي الرحلات" : "Total Trips"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalTrips}</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle2 size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "مكتملة" : "Completed"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.completedTrips}</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600"><XCircle size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "ملغاة" : "Cancelled"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.cancelledTrips}</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-[#f5b800]"><ArrowRightLeft size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "رحلات ذهاب" : "Forth Trips"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.forthTrips}</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><ArrowRightLeft size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "رحلات عودة" : "Back Trips"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.backTrips}</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600"><Timer size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "متوسط المدة" : "Avg Duration"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.avgDuration} {isRTL ? "د" : "min"}</p></div>
          </div>
        </div>

        {/* Trips by Bus Summary + Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className={`lg:col-span-2 ${DS_card} p-6`}>
            <h3 className={`text-sm font-black mb-4 ${isDark ? "text-white" : "text-[#0f2044]"}`}>{isRTL ? "ملخص الرحلات لكل حافلة" : "Trips Summary Per Bus"}</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {tripsByBus.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#0f2044]/[0.03] dark:bg-[#0f2044]/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-navy/10 dark:bg-brand-navy/30 rounded-lg text-brand-navy dark:text-[#7ba7e8]"><Bus size={16} /></div>
                    <span className="font-black text-slate-800 dark:text-white text-sm">{b.bus_number}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-black text-[#0f2044] dark:text-white">{b.trip_count}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">{isRTL ? "رحلة" : "Trips"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-[#f5b800]">~{b.estimated_km}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">{isRTL ? "كم تقريبي" : "Est. KM"}</p>
                    </div>
                  </div>
                </div>
              ))}
              {tripsByBus.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{isRTL ? "لا توجد بيانات" : "No data available"}</p>}
            </div>
          </div>

          <div className={`${DS_card} p-6`}>
            <div className="flex items-center gap-2 mb-6"><Filter className="w-4 h-4 text-[#f5b800]" /><h3 className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"}`}>{isRTL ? "فلتر البحث" : "Filters"}</h3></div>
            <div className="space-y-4">
              <div><label className={DS_labelCls}>{isRTL ? "من تاريخ" : "From"}</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={DS_inputCls} /></div>
              <div><label className={DS_labelCls}>{isRTL ? "إلى تاريخ" : "To"}</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={DS_inputCls} /></div>
              <div><label className={DS_labelCls}>{isRTL ? "الحافلة" : "Bus"}</label>
                <select value={busId} onChange={(e) => setBusId(e.target.value)} className={DS_selectCls}>
                  <option value="">{isRTL ? "جميع الحافلات" : "All Buses"}</option>
                  {buses.map((b) => <option key={b.id} value={b.id}>{b.bus_number} — {b.plate_number}</option>)}
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
          <BaseDataTable<Trip>
            columns={columns} data={trips.data} pagination={trips}
            searchPlaceholder={isRTL ? "ابحث بالحافلة أو السائق..." : "Search by bus or driver..."}
            title={isRTL ? "سجل الرحلات" : "Trip Records"}
            subtitle={isRTL ? "جميع الرحلات اليومية مع تفاصيل الوقت والحالة" : "All daily trips with time and status details"}
          />
        </div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
