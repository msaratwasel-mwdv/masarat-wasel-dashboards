import React, { useState } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import SchoolPrintLayout from "@/Components/Reports/SchoolPrintLayout";
import {
  Star,
  Trophy,
  Users,
  Bus,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Download,
  Filter,
  TrendingUp,
  Phone,
  Award,
  Activity,
} from "lucide-react";
import { DS_pageWrapper, DS_card, DS_pageTitle, DS_statCard, DS_statIcon, DS_statLabel, DS_statValue2, DS_inputCls, DS_labelCls, DS_btnPrimary } from "@/lib/DS";

interface DriverData {
  driver_id: number;
  driver_name: string;
  driver_name_en: string;
  phone: string;
  bus_number: string;
  plate_number: string;
  total_trips: number;
  completed_trips: number;
  delays: number;
  total_delay_minutes: number;
  violations: number;
  incidents: number;
  score: number;
}

interface Props {
  drivers: { data: DriverData[]; total: number; per_page: number; current_page: number; links: any[] };
  stats: { totalDrivers: number; avgScore: number; topPerformer: string; totalTripsAll: number };
  filters: { date_from: string; date_to: string };
  auth?: any;
}

function StarRating({ score, size = 16 }: { score: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = score >= i;
    const half = !filled && score >= i - 0.5;
    stars.push(
      <Star
        key={i}
        size={size}
        className={`transition-colors ${filled ? "text-[#f5b800] fill-[#f5b800]" : half ? "text-[#f5b800] fill-[#f5b800]/50" : "text-gray-300 dark:text-gray-600"}`}
      />
    );
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

function getScoreColor(score: number): string {
  if (score >= 4.5) return "from-emerald-500 to-teal-600";
  if (score >= 3.5) return "from-blue-500 to-indigo-600";
  if (score >= 2.5) return "from-amber-500 to-orange-500";
  return "from-rose-500 to-red-600";
}

function getScoreLabel(score: number, isRTL: boolean): string {
  if (score >= 4.5) return isRTL ? "ممتاز" : "Excellent";
  if (score >= 3.5) return isRTL ? "جيد جداً" : "Very Good";
  if (score >= 2.5) return isRTL ? "مقبول" : "Acceptable";
  return isRTL ? "ضعيف" : "Poor";
}

export default function DriverPerformanceReport({ drivers, stats, filters, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";
  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);

  const applyFilters = () => {
    router.get(route("school.reports.driver-performance"), { date_from: dateFrom, date_to: dateTo }, { preserveState: true });
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('per_page') === 'all') {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, []);

  const topDriver = drivers.data[0];

  // Prepare Print Data
  const printStats = [
    { label: isRTL ? "عدد السائقين" : "Total Drivers", value: stats.totalDrivers },
    { label: isRTL ? "متوسط التقييم" : "Avg Score", value: `${stats.avgScore} / 5` },
    { label: isRTL ? "الأفضل أداءً" : "Top Performer", value: stats.topPerformer },
    { label: isRTL ? "إجمالي الرحلات" : "Total Trips", value: stats.totalTripsAll },
  ];

  const printHeaders = isRTL 
    ? ["#", "السائق", "الهاتف", "الحافلة", "الرحلات", "التأخيرات", "المخالفات", "الحوادث", "التقييم"]
    : ["#", "Driver", "Phone", "Bus", "Trips", "Delays", "Violations", "Incidents", "Score"];

  const printRows = drivers.data.map((d, idx) => [
    idx + 1,
    d.driver_name,
    d.phone || "—",
    d.bus_number,
    d.completed_trips,
    d.delays,
    d.violations,
    d.incidents,
    d.score
  ]);

  return (
    <SchoolAuthenticatedLayout user={auth?.user}>
      <Head title={isRTL ? "تقرير أداء السائقين" : "Driver Performance Report"} />

      <SchoolPrintLayout
        title={isRTL ? "تقرير أداء السائقين" : "Driver Performance Report"}
        reportId={`DRV-${new Date().getFullYear()}${new Date().getMonth()+1}`}
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
            <h1 className={DS_pageTitle}>{isRTL ? "تقرير أداء السائقين" : "Driver Performance Report"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRTL ? "تقييم شامل لأداء كل سائق" : "Comprehensive driver evaluation"}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (drivers.total > drivers.data.length) {
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
            <div className="w-12 h-12 rounded-xl bg-brand-navy/5 flex items-center justify-center text-brand-navy"><Users size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "عدد السائقين" : "Total Drivers"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalDrivers}</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-[#f5b800]"><Star size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "متوسط التقييم" : "Avg Score"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.avgScore} / 5</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Trophy size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "الأفضل أداءً" : "Top Performer"}</p><p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 truncate max-w-[120px]">{stats.topPerformer}</p></div>
          </div>
          <div className="flex-1 min-w-[150px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Activity size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "إجمالي الرحلات" : "Total Trips"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalTripsAll}</p></div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${DS_card} p-4 mb-8`}>
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={DS_labelCls}>{isRTL ? "من تاريخ" : "From"}</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={DS_inputCls} /></div>
              <div><label className={DS_labelCls}>{isRTL ? "إلى تاريخ" : "To"}</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={DS_inputCls} /></div>
              <div className="flex items-end"><button onClick={applyFilters} className={`${DS_btnPrimary} w-full justify-center`}>{isRTL ? "تطبيق" : "Apply"}</button></div>
            </div>
          </div>
        </div>

        {/* Top Performer Banner */}
        {topDriver && (
          <div className={`rounded-[22px] p-6 md:p-8 mb-8 bg-gradient-to-r ${getScoreColor(topDriver.score)} text-white relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="p-4 bg-white/10 rounded-2xl">
                <Trophy size={40} />
              </div>
              <div className="flex-1 text-center md:text-start">
                <p className="text-xs text-white/70 font-bold uppercase tracking-widest mb-1">{isRTL ? "أفضل سائق أداءً" : "Top Performing Driver"}</p>
                <p className="text-2xl md:text-3xl font-black">{isRTL ? topDriver.driver_name : (topDriver.driver_name_en || topDriver.driver_name)}</p>
                <div className="flex items-center gap-3 mt-2 justify-center md:justify-start">
                  <StarRating score={topDriver.score} size={20} />
                  <span className="text-lg font-black">{topDriver.score}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div><p className="text-2xl font-black">{topDriver.completed_trips}</p><p className="text-[10px] text-white/70 font-bold">{isRTL ? "رحلة" : "Trips"}</p></div>
                <div><p className="text-2xl font-black">{topDriver.delays}</p><p className="text-[10px] text-white/70 font-bold">{isRTL ? "تأخير" : "Delays"}</p></div>
                <div><p className="text-2xl font-black">{topDriver.violations}</p><p className="text-[10px] text-white/70 font-bold">{isRTL ? "مخالفة" : "Violations"}</p></div>
              </div>
            </div>
          </div>
        )}

        {/* Driver Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.data.map((driver, idx) => (
            <div key={driver.driver_id} className={`${DS_card} overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5`}>
              {/* Score bar */}
              <div className={`h-1.5 bg-gradient-to-r ${getScoreColor(driver.score)}`} />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getScoreColor(driver.score)} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className={`font-black text-sm ${isDark ? "text-white" : "text-[#0f2044]"}`}>{driver.driver_name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Phone size={10} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-bold" dir="ltr">{driver.phone || "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className={`text-xl font-black bg-gradient-to-r ${getScoreColor(driver.score)} bg-clip-text text-transparent`}>{driver.score}</p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">{getScoreLabel(driver.score, isRTL)}</p>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-[#243460]">
                  <StarRating score={driver.score} />
                  <div className="flex items-center gap-1.5">
                    <Bus size={12} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-500">{driver.bus_number}</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 text-center">
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{driver.completed_trips}</p>
                    <p className="text-[9px] font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase">{isRTL ? "رحلات مكتملة" : "Completed"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 text-center">
                    <p className="text-lg font-black text-amber-600 dark:text-amber-400">{driver.delays}</p>
                    <p className="text-[9px] font-bold text-amber-600/60 dark:text-amber-400/60 uppercase">{isRTL ? "تأخيرات" : "Delays"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-center">
                    <p className="text-lg font-black text-rose-600 dark:text-rose-400">{driver.violations}</p>
                    <p className="text-[9px] font-bold text-rose-600/60 dark:text-rose-400/60 uppercase">{isRTL ? "مخالفات" : "Violations"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-center">
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">{driver.incidents}</p>
                    <p className="text-[9px] font-bold text-blue-600/60 dark:text-blue-400/60 uppercase">{isRTL ? "حوادث" : "Incidents"}</p>
                  </div>
                </div>

                {/* Delay Summary */}
                {driver.total_delay_minutes > 0 && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-900/5 border border-amber-100 dark:border-amber-900/20">
                    <Clock size={14} className="text-amber-500" />
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {isRTL ? `إجمالي التأخير: ${driver.total_delay_minutes} دقيقة` : `Total delay: ${driver.total_delay_minutes} min`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {drivers.data.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Users className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">{isRTL ? "لا توجد بيانات سائقين" : "No driver data available"}</p>
            </div>
          )}
        </div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
