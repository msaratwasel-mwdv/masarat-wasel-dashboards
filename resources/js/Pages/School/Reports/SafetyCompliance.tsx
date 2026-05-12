import React, { useState, useMemo } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, { type PaginationMeta } from "@/Components/BaseDataTable";
import SchoolPrintLayout from "@/Components/Reports/SchoolPrintLayout";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bus,
  Download,
  Filter,
  Eye,
  ClipboardCheck,
  Activity,
} from "lucide-react";
import { DS_pageWrapper, DS_card, DS_pageTitle, DS_statCard, DS_statIcon, DS_statLabel, DS_statValue2, DS_badge, DS_inputCls, DS_labelCls, DS_btnPrimary } from "@/lib/DS";

interface Incident {
  id: number;
  type: string;
  severity: string;
  description: string;
  status: string;
  created_at: string;
  bus?: { id: number; bus_number: string };
  reporter?: { id: number; first_name_ar: string; last_name_ar: string };
}

interface InspectionItem {
  id: number;
  is_passed: boolean;
  notes: string | null;
  item: { id: number; name: string };
}

interface Inspection {
  id: number;
  overall_status: string;
  notes: string | null;
  created_at: string;
  bus?: { id: number; bus_number: string };
  field_supervisor?: { id: number; first_name_ar: string; last_name_ar: string };
  results: InspectionItem[];
}

interface Props {
  incidents: { data: Incident[]; links: any[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
  inspections: { data: Inspection[]; links: any[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
  stats: { totalTrips: number; safeTrips: number; safetyRate: number; totalInspections: number; inspectionPassRate: number; criticalIncidents: number; totalIncidents: number };
  filters: { date_from: string; date_to: string };
  auth?: any;
}

export default function SafetyComplianceReport({ incidents, inspections, stats, filters, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";
  const [dateFrom, setDateFrom] = useState(filters.date_from);
  const [dateTo, setDateTo] = useState(filters.date_to);
  const [activeTab, setActiveTab] = useState<"incidents" | "inspections">("incidents");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('per_page') === 'all') {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, []);

  const applyFilters = () => {
    router.get(route("school.reports.safety-compliance"), { date_from: dateFrom, date_to: dateTo }, { preserveState: true });
  };

  // Incident columns
  const incidentColHelper = createColumnHelper<Incident>();
  const incidentColumns = useMemo(() => [
    incidentColHelper.accessor("id", { header: "#", cell: (info) => <span className="font-bold text-slate-400">#{info.getValue()}</span> }),
    incidentColHelper.accessor("created_at", {
      header: isRTL ? "التاريخ" : "Date",
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 dark:text-slate-200">{new Date(info.getValue()).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}</span>
          <span className="text-[10px] text-slate-400">{new Date(info.getValue()).toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      ),
    }),
    incidentColHelper.display({
      id: "bus", header: isRTL ? "الحافلة" : "Bus",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-navy/5 dark:bg-brand-navy/20 rounded-lg"><Bus size={14} className="text-brand-navy dark:text-[#7ba7e8]" /></div>
          <span className="font-black text-slate-800 dark:text-white text-xs">{info.row.original.bus?.bus_number || "—"}</span>
        </div>
      ),
    }),
    incidentColHelper.accessor("type", {
      header: isRTL ? "النوع" : "Type",
      cell: (info) => <span className="font-bold text-slate-600 dark:text-slate-300 text-xs">{info.getValue()}</span>,
    }),
    incidentColHelper.accessor("severity", {
      header: isRTL ? "الخطورة" : "Severity",
      cell: (info) => {
        const v = info.getValue();
        const variant = v === "high" ? "red" : v === "medium" ? "gold" : "green";
        const label = v === "high" ? (isRTL ? "عالية" : "High") : v === "medium" ? (isRTL ? "متوسطة" : "Medium") : (isRTL ? "منخفضة" : "Low");
        return <div className={DS_badge(variant as any)}>{label}</div>;
      },
    }),
    incidentColHelper.accessor("status", {
      header: isRTL ? "الحالة" : "Status",
      cell: (info) => {
        const v = info.getValue();
        const variant = v === "resolved" ? "green" : v === "pending" ? "gold" : "navy";
        const label = v === "resolved" ? (isRTL ? "تم الحل" : "Resolved") : v === "pending" ? (isRTL ? "معلق" : "Pending") : v;
        return <div className={DS_badge(variant as any)}>{label}</div>;
      },
    }),
    incidentColHelper.accessor("description", {
      header: isRTL ? "الوصف" : "Description",
      cell: (info) => <span className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{info.getValue() || "—"}</span>,
    }),
  ], [isRTL]);

  // Inspection columns
  const inspColHelper = createColumnHelper<Inspection>();
  const inspectionColumns = useMemo(() => [
    inspColHelper.accessor("id", { header: "#", cell: (info) => <span className="font-bold text-slate-400">#{info.getValue()}</span> }),
    inspColHelper.accessor("created_at", {
      header: isRTL ? "التاريخ" : "Date",
      cell: (info) => <span className="font-bold text-slate-700 dark:text-slate-200">{new Date(info.getValue()).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}</span>,
    }),
    inspColHelper.display({
      id: "bus", header: isRTL ? "الحافلة" : "Bus",
      cell: (info) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-navy/5 dark:bg-brand-navy/20 rounded-lg"><Bus size={14} className="text-brand-navy dark:text-[#7ba7e8]" /></div>
          <span className="font-black text-slate-800 dark:text-white text-xs">{info.row.original.bus?.bus_number || "—"}</span>
        </div>
      ),
    }),
    inspColHelper.display({
      id: "supervisor", header: isRTL ? "المشرف" : "Supervisor",
      cell: (info) => {
        const s = info.row.original.field_supervisor;
        return <span className="font-bold text-slate-600 dark:text-slate-300 text-xs">{s ? `${s.first_name_ar} ${s.last_name_ar}` : "—"}</span>;
      },
    }),
    inspColHelper.accessor("overall_status", {
      header: isRTL ? "النتيجة" : "Result",
      cell: (info) => {
        const v = info.getValue();
        const variant = v === "pass" ? "green" : v === "fail" ? "red" : "gold";
        const label = v === "pass" ? (isRTL ? "اجتياز" : "Pass") : v === "fail" ? (isRTL ? "فشل" : "Fail") : (isRTL ? "تحذير" : "Warning");
        return <div className={DS_badge(variant as any)}>{label}</div>;
      },
    }),
    inspColHelper.display({
      id: "checklist", header: isRTL ? "البنود" : "Items",
      cell: (info) => {
        const results = info.row.original.results || [];
        const passed = results.filter(r => r.is_passed).length;
        return (
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-black text-xs">{passed}</span>
            <span className="text-slate-400 text-[10px]">/</span>
            <span className="text-slate-500 font-bold text-xs">{results.length}</span>
          </div>
        );
      },
    }),
  ], [isRTL]);

  const incidentPagination: PaginationMeta = { links: incidents.links, current_page: incidents.current_page, last_page: incidents.last_page, per_page: incidents.per_page, total: incidents.total, from: incidents.from, to: incidents.to };
  const inspectionPagination: PaginationMeta = { links: inspections.links, current_page: inspections.current_page, last_page: inspections.last_page, per_page: inspections.per_page, total: inspections.total, from: inspections.from, to: inspections.to };

  // Prepare Print Data
  const printStats = [
    { label: isRTL ? "إجمالي الرحلات" : "Total Trips", value: stats.totalTrips },
    { label: isRTL ? "مؤشر السلامة" : "Safety Rate", value: `${stats.safetyRate}%` },
    { label: isRTL ? "الحوادث" : "Incidents", value: stats.totalIncidents },
    { label: isRTL ? "الفحوصات" : "Inspections", value: stats.totalInspections },
    { label: isRTL ? "نسبة الاجتياز" : "Pass Rate", value: `${stats.inspectionPassRate}%` },
  ];

  return (
    <SchoolAuthenticatedLayout user={auth?.user}>
      <Head title={isRTL ? "تقرير السلامة والامتثال" : "Safety & Compliance Report"} />
      
      <SchoolPrintLayout
        title={isRTL ? "تقرير السلامة والامتثال" : "Safety & Compliance Report"}
        reportId={`SFT-${new Date().getFullYear()}${new Date().getMonth()+1}`}
        stats={printStats}
        statsStyle="table"
        schoolName={auth.user.school?.name}
        schoolLogo={auth.user.school?.logo_url}
      >
        {/* Incidents Table for Print */}
        <div className="mb-8">
            <h3 className="text-lg font-black mb-4 pb-2 border-b border-slate-200">
                {isRTL ? "سجل الحوادث والبلاغات" : "Incidents & Reports"}
            </h3>
            <table className="w-full text-xs border-collapse border border-slate-300">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-2 py-2 border border-slate-300 text-right">#</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "التاريخ" : "Date"}</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "الحافلة" : "Bus"}</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "النوع" : "Type"}</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "الخطورة" : "Severity"}</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "الحالة" : "Status"}</th>
                    </tr>
                </thead>
                <tbody>
                    {incidents.data.map(inc => (
                        <tr key={inc.id}>
                            <td className="px-2 py-2 border border-slate-300">{inc.id}</td>
                            <td className="px-2 py-2 border border-slate-300">{new Date(inc.created_at).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}</td>
                            <td className="px-2 py-2 border border-slate-300">{inc.bus?.bus_number || "—"}</td>
                            <td className="px-2 py-2 border border-slate-300">{inc.type}</td>
                            <td className="px-2 py-2 border border-slate-300">
                                {inc.severity === "high" ? (isRTL ? "عالية" : "High") : inc.severity === "medium" ? (isRTL ? "متوسطة" : "Medium") : (isRTL ? "منخفضة" : "Low")}
                            </td>
                            <td className="px-2 py-2 border border-slate-300">
                                {inc.status === "resolved" ? (isRTL ? "تم الحل" : "Resolved") : (isRTL ? "معلق" : "Pending")}
                            </td>
                        </tr>
                    ))}
                    {incidents.data.length === 0 && <tr><td colSpan={6} className="text-center py-4 text-slate-400">{isRTL ? "لا توجد بلاغات" : "No incidents reported"}</td></tr>}
                </tbody>
            </table>
        </div>

        {/* Inspections Table for Print */}
        <div>
            <h3 className="text-lg font-black mb-4 pb-2 border-b border-slate-200">
                {isRTL ? "سجل فحوصات السلامة" : "Safety Inspections"}
            </h3>
            <table className="w-full text-xs border-collapse border border-slate-300">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-2 py-2 border border-slate-300 text-right">#</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "التاريخ" : "Date"}</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "الحافلة" : "Bus"}</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "المشرف" : "Supervisor"}</th>
                        <th className="px-2 py-2 border border-slate-300 text-right">{isRTL ? "النتيجة" : "Result"}</th>
                    </tr>
                </thead>
                <tbody>
                    {inspections.data.map(insp => (
                        <tr key={insp.id}>
                            <td className="px-2 py-2 border border-slate-300">{insp.id}</td>
                            <td className="px-2 py-2 border border-slate-300">{new Date(insp.created_at).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}</td>
                            <td className="px-2 py-2 border border-slate-300">{insp.bus?.bus_number || "—"}</td>
                            <td className="px-2 py-2 border border-slate-300">{insp.field_supervisor ? `${insp.field_supervisor.first_name_ar} ${insp.field_supervisor.last_name_ar}` : "—"}</td>
                            <td className="px-2 py-2 border border-slate-300">
                                {insp.overall_status === "pass" ? (isRTL ? "اجتياز" : "Pass") : (isRTL ? "فشل" : "Fail")}
                            </td>
                        </tr>
                    ))}
                    {inspections.data.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-slate-400">{isRTL ? "لا توجد فحوصات" : "No inspections recorded"}</td></tr>}
                </tbody>
            </table>
        </div>
      </SchoolPrintLayout>

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8 print:hidden`} dir={isRTL ? "rtl" : "ltr"}>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex flex-col">
            <h1 className={DS_pageTitle}>{isRTL ? "تقرير السلامة والامتثال" : "Safety & Compliance Report"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRTL ? "الرحلات الآمنة والفحوصات" : "Safe Trips & Inspections"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const hasMoreIncidents = incidents.total > incidents.data.length;
                const hasMoreInspections = inspections.total > inspections.data.length;
                if (hasMoreIncidents || hasMoreInspections) {
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
        </div>

        {/* Safety Score Banner */}
        <div className={`rounded-[22px] p-6 md:p-8 mb-8 bg-gradient-to-r ${stats.safetyRate >= 90 ? "from-emerald-500 to-teal-600" : stats.safetyRate >= 70 ? "from-amber-500 to-orange-600" : "from-rose-500 to-red-600"} text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl">
                {stats.safetyRate >= 90 ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
              </div>
              <div>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{isRTL ? "مؤشر السلامة العام" : "Overall Safety Index"}</p>
                <p className="text-5xl font-black">{stats.safetyRate}%</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-black">{stats.safeTrips}</p>
                <p className="text-xs text-white/70 font-bold">{isRTL ? "رحلات آمنة" : "Safe Trips"}</p>
              </div>
              <div>
                <p className="text-3xl font-black">{stats.totalIncidents}</p>
                <p className="text-xs text-white/70 font-bold">{isRTL ? "حوادث" : "Incidents"}</p>
              </div>
              <div>
                <p className="text-3xl font-black">{stats.inspectionPassRate}%</p>
                <p className="text-xs text-white/70 font-bold">{isRTL ? "اجتياز الفحوصات" : "Insp. Pass Rate"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Classic Row Style */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex-1 min-w-[200px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><ShieldCheck size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "إجمالي الرحلات" : "Total Trips"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalTrips}</p></div>
          </div>
          <div className="flex-1 min-w-[200px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-brand-navy/5 flex items-center justify-center text-brand-navy"><ClipboardCheck size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "الفحوصات" : "Inspections"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalInspections}</p></div>
          </div>
          <div className="flex-1 min-w-[200px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600"><AlertTriangle size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "حوادث حرجة" : "Critical"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.criticalIncidents}</p></div>
          </div>
          <div className="flex-1 min-w-[200px] p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><Shield size={24} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isRTL ? "نسبة الاجتياز" : "Pass Rate"}</p><p className="text-xl font-black text-slate-800 dark:text-white">{stats.inspectionPassRate}%</p></div>
          </div>
        </div>

        {/* Filters Row */}
        <div className={`${DS_card} p-4 mb-8`}>
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={DS_labelCls}>{isRTL ? "من تاريخ" : "From"}</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={DS_inputCls} /></div>
              <div><label className={DS_labelCls}>{isRTL ? "إلى تاريخ" : "To"}</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={DS_inputCls} /></div>
              <div className="flex items-end"><button onClick={applyFilters} className={`${DS_btnPrimary} w-full justify-center`}>{isRTL ? "تطبيق الفلتر" : "Apply"}</button></div>
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab("incidents")} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "incidents" ? "bg-[#0f2044] text-[#f5b800] shadow" : "bg-[#0f2044]/5 dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-gray-300"}`}>
            <div className="flex items-center gap-2"><AlertTriangle size={16} />{isRTL ? `الحوادث (${stats.totalIncidents})` : `Incidents (${stats.totalIncidents})`}</div>
          </button>
          <button onClick={() => setActiveTab("inspections")} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "inspections" ? "bg-[#0f2044] text-[#f5b800] shadow" : "bg-[#0f2044]/5 dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-gray-300"}`}>
            <div className="flex items-center gap-2"><ClipboardCheck size={16} />{isRTL ? `الفحوصات (${stats.totalInspections})` : `Inspections (${stats.totalInspections})`}</div>
          </button>
        </div>

        {/* Tables */}
        {activeTab === "incidents" && (
          <div className={DS_card}>
            <BaseDataTable<Incident>
              columns={incidentColumns} data={incidents.data} pagination={incidentPagination}
              title={isRTL ? "سجل الحوادث والبلاغات" : "Incidents & Reports Log"}
              subtitle={isRTL ? "جميع الحوادث المبلغ عنها خلال الفترة المحددة" : "All reported incidents during the selected period"}
            />
          </div>
        )}
        {activeTab === "inspections" && (
          <div className={DS_card}>
            <BaseDataTable<Inspection>
              columns={inspectionColumns} data={inspections.data} pagination={inspectionPagination}
              title={isRTL ? "سجل فحوصات السلامة" : "Safety Inspections Log"}
              subtitle={isRTL ? "نتائج فحوصات سلامة الحافلات" : "Bus safety inspection results"}
            />
          </div>
        )}
      </div>
    </SchoolAuthenticatedLayout>
  );
}
