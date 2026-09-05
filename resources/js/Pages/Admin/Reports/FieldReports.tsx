import React, { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import ApplicationLogo from "@/Components/ApplicationLogo";
import BaseDataTable, { type PaginationMeta } from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { 
    AlertTriangle, 
    Calendar, 
    Download, 
    Trash2, 
    Printer, 
    Bus, 
    User, 
    Info, 
    XCircle, 
    CheckCircle2, 
    Search, 
    Filter,
    ShieldAlert,
    Clock,
    FileText,
    ChevronRight
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
    DS_btnPrimary,
    DS_btnSecondary,
    DS_btnGold
} from "@/lib/DS";
import ConfirmationModal from "@/Components/ConfirmationModal";
import PrintReportHeader from "@/Components/PrintReportHeader";

const PRINT_STYLES = `
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
  body {
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body * {
    visibility: hidden;
  }
  main {
    margin: 0 !important;
    position: static !important;
  }
  #field-reports-print-area, #field-reports-print-area *,
  #single-violation-print-area, #single-violation-print-area * {
    visibility: visible !important;
  }
  #field-reports-print-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    padding: 0 !important;
    background: white !important;
    display: block !important;
  }
  #single-violation-print-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    padding: 0 !important;
    margin: 0 !important;
    background: white !important;
    display: block !important;
  }
}
`;

interface Violation {
  id: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
  bus?: { id: number; bus_number: string };
  field_supervisor?: { id: number; name: string };
}

interface Props {
  violations: {
    data: Violation[];
    links: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  filters: { search?: string; status?: string; type?: string; date?: string };
  auth?: any;
}

export default function FieldReports({ violations, filters, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch] = useState(filters.search || "");
  const [printingViolation, setPrintingViolation] = useState<Violation | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [violationToDelete, setViolationToDelete] = useState<number | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    router.get(route("admin.field-reports.index"), { search: value, status: filters.status, type: filters.type, date: filters.date }, { preserveState: true, replace: true });
  };

  const handleDelete = () => {
    if (violationToDelete) {
      router.delete(route("admin.field-reports.destroy", violationToDelete), {
        onSuccess: () => setIsDeleteModalOpen(false),
      });
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: isRTL ? "قيد الانتظار" : "Pending",
      resolved: isRTL ? "محلولة" : "Resolved",
    };
    return map[status] || status;
  };

  const statusColor = (status: string): "yellow" | "green" | "gray" => {
    if (status === "pending") return "yellow";
    if (status === "resolved") return "green";
    return "gray";
  };

  const handlePrintSingle = (violation: Violation) => {
      setPrintingViolation(violation);
      setTimeout(() => {
          window.print();
      }, 100);
  };

  const columnHelper = createColumnHelper<Violation>();

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: "#",
      cell: (info) => <span className="font-bold text-slate-400">#{info.getValue()}</span>,
    }),
    columnHelper.accessor("created_at", {
      header: isRTL ? "التاريخ والوقت" : "Date & Time",
      cell: (info) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {new Date(info.getValue()).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
          </span>
          <span className="text-[10px] text-slate-400 uppercase font-black">
            {new Date(info.getValue()).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("bus.bus_number", {
      header: isRTL ? "الحافلة" : "Bus",
      cell: (info) => (
        <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-navy/5 rounded-lg text-brand-navy">
                <Bus size={14} />
            </div>
            <span className="font-black text-slate-800 dark:text-white">{info.getValue() || "—"}</span>
        </div>
      ),
    }),
    columnHelper.accessor("field_supervisor.name", {
        header: isRTL ? "المشرف" : "Supervisor",
        cell: (info) => <span className="font-bold text-slate-700 dark:text-slate-200">{info.getValue() || "—"}</span>,
    }),
    columnHelper.accessor("type", {
      header: isRTL ? "النوع" : "Type",
      cell: (info) => <span className="text-xs font-black text-brand-navy dark:text-brand-gold uppercase tracking-tighter">{info.getValue()}</span>,
    }),
    columnHelper.accessor("status", {
        header: isRTL ? "الحالة" : "Status",
        cell: (info) => (
            <div className={DS_badge(statusColor(info.getValue()))}>
                {statusLabel(info.getValue())}
            </div>
        )
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handlePrintSingle(info.row.original)}
            className="p-2 text-brand-navy hover:bg-brand-navy/5 rounded-lg transition-colors"
            title={isRTL ? "طباعة الإشعار" : "Print Notice"}
          >
            <Printer size={18} />
          </button>
          <button
            onClick={() => {
              setViolationToDelete(info.row.original.id);
              setIsDeleteModalOpen(true);
            }}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            title={isRTL ? "حذف" : "Delete"}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    }),
  ], [isRTL]);

  const pagination: PaginationMeta = {
    links: violations.links,
    current_page: violations.current_page,
    last_page: violations.last_page,
    per_page: violations.per_page,
    total: violations.total,
    from: violations.from,
    to: violations.to,
  };

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title={isRTL ? "سجل المخالفات الميدانية" : "Field Violations Log"} />
      <style>{PRINT_STYLES}</style>

      {/* ── Single Violation Notice Print & Preview ── */}
      {printingViolation && (
        <div 
          id="single-violation-print-area"
          className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm overflow-y-auto p-4 md:p-10 flex items-center justify-center print:static print:p-0 print:bg-white print:overflow-visible"
        >
          <div 
            className="bg-white text-black w-full max-w-4xl rounded-2xl shadow-2xl p-8 md:p-12 relative print:shadow-none print:p-6 print:max-w-full print:rounded-none"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Screen-Only Toolbar */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Printer size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    {isRTL ? "معاينة إشعار المخالفة الميدانية" : "Field Violation Notice Preview"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isRTL ? "جاهز للطباعة أو الحفظ كـ PDF" : "Ready to print or save as PDF"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#0f2044] hover:bg-[#1a346e] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Printer size={16} />
                  {isRTL ? "طباعة الإشعار" : "Print Notice"}
                </button>
                <button
                  onClick={() => setPrintingViolation(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <XCircle size={16} />
                  {isRTL ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>

            {/* Print Header */}
            <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              {/* Dashboard Logo Container */}
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 p-1.5 shadow-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  <ApplicationLogo className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-[#0f2044]">
                      {isRTL ? "مسارات" : "Masarat"}
                    </span>
                    <span className="text-2xl font-black text-[#f5b800]">
                      {isRTL ? "واصل" : "Wasel"}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                    {isRTL ? "منظومة النقل المدرسي الذكية" : "Smart School Transport System"}
                  </p>
                </div>
              </div>

              <div className={isRTL ? "text-left" : "text-right"}>
                <h2 className="text-xl font-black text-slate-800">
                  {isRTL ? "إشعار مخالفة ميدانية" : "Field Violation Notice"}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {isRTL ? "الرقم المرجعي: " : "Reference No: "} #VIOL-{printingViolation.id}
                </p>
              </div>
            </div>

            {/* Violation Details Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl" style={{ backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {isRTL ? "التاريخ والوقت" : "Date & Time"}
                </p>
                <p className="font-bold text-slate-800">
                  {new Date(printingViolation.created_at).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl" style={{ backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {isRTL ? "الحافلة" : "Bus"}
                </p>
                <p className="font-bold text-slate-800">{printingViolation.bus?.bus_number || "—"}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl" style={{ backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {isRTL ? "المشرف الميداني" : "Field Supervisor"}
                </p>
                <p className="font-bold text-slate-800">{printingViolation.field_supervisor?.name || "—"}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl" style={{ backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {isRTL ? "نوع المخالفة" : "Violation Type"}
                </p>
                <p className="font-bold text-slate-800">{printingViolation.type}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {isRTL ? "وصف وتفاصيل المخالفة" : "Violation Details & Description"}
              </p>
              <div className="p-6 bg-white border border-slate-200 rounded-xl min-h-[160px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                {printingViolation.description}
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-12 mt-16 text-center">
              <div>
                <p className="font-black text-slate-800 border-b border-slate-300 pb-2 mb-12">
                  {isRTL ? "توقيع المشرف الميداني" : "Field Supervisor Signature"}
                </p>
                <div className="h-12" />
              </div>
              <div>
                <p className="font-black text-slate-800 border-b border-slate-300 pb-2 mb-12">
                  {isRTL ? "اعتماد الإدارة" : "Management Approval"}
                </p>
                <div className="h-12" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Full Field Violations Report Print Area ── */}
      {!printingViolation && (
        <div id="field-reports-print-area" className="hidden print:block bg-white text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
          {/* Official Report Header */}
          <div className="flex justify-between items-center pb-6 mb-8 border-b-2 border-slate-200" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 p-1.5 shadow-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#ffffff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              >
                <ApplicationLogo className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-[#0f2044]">
                    {isRTL ? "مسارات" : "Masarat"}
                  </span>
                  <span className="text-2xl font-black text-[#f5b800]">
                    {isRTL ? "واصل" : "Wasel"}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                  {isRTL ? "منظومة النقل المدرسي الذكية - الإدارة العامة" : "Smart School Transport System - General Administration"}
                </p>
              </div>
            </div>

            <div className={isRTL ? "text-left" : "text-right"}>
              <h2 className="text-2xl font-black text-slate-800">
                {isRTL ? "تقرير سجل المخالفات الميدانية" : "Field Violations Log Report"}
              </h2>
              <div className="flex items-center gap-2 mt-1 justify-end text-xs text-slate-500">
                <span>{isRTL ? "تاريخ التقرير: " : "Report Date: "} {new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span>•</span>
                <span>{isRTL ? "إجمالي المخالفات: " : "Total: "} {violations.total}</span>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50" style={{ backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <p className="text-xs font-bold text-slate-500">{isRTL ? "إجمالي المخالفات المسجلة" : "Total Recorded Violations"}</p>
              <p className="text-2xl font-black text-[#0f2044]">{violations.total}</p>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50" style={{ backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <p className="text-xs font-bold text-slate-500">{isRTL ? "المخالفات قيد المعالجة" : "Pending Violations"}</p>
              <p className="text-2xl font-black text-amber-600">
                {violations.data.filter(v => v.status === 'pending').length}
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50" style={{ backgroundColor: '#f8fafc', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <p className="text-xs font-bold text-slate-500">{isRTL ? "المخالفات المحلولة" : "Resolved Violations"}</p>
              <p className="text-2xl font-black text-emerald-600">
                {violations.data.filter(v => v.status === 'resolved').length}
              </p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse border border-slate-200 text-xs mb-8">
            <thead className="bg-slate-100" style={{ backgroundColor: '#f1f5f9', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <tr>
                <th className="border border-slate-200 p-2 text-center">#</th>
                <th className="border border-slate-200 p-2 text-start">{isRTL ? "التاريخ والوقت" : "Date & Time"}</th>
                <th className="border border-slate-200 p-2 text-start">{isRTL ? "الحافلة" : "Bus"}</th>
                <th className="border border-slate-200 p-2 text-start">{isRTL ? "المشرف الميداني" : "Supervisor"}</th>
                <th className="border border-slate-200 p-2 text-start">{isRTL ? "نوع المخالفة" : "Type"}</th>
                <th className="border border-slate-200 p-2 text-start">{isRTL ? "الوصف" : "Description"}</th>
                <th className="border border-slate-200 p-2 text-center">{isRTL ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {violations.data.map((violation, idx) => (
                <tr key={violation.id} className={idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                  <td className="border border-slate-200 p-2 text-center font-mono font-bold text-slate-600">#{violation.id}</td>
                  <td className="border border-slate-200 p-2 whitespace-nowrap">
                    {new Date(violation.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                  </td>
                  <td className="border border-slate-200 p-2 font-bold text-slate-800">
                    {violation.bus?.bus_number || "—"}
                  </td>
                  <td className="border border-slate-200 p-2">
                    {violation.field_supervisor?.name || "—"}
                  </td>
                  <td className="border border-slate-200 p-2 font-semibold">
                    {violation.type}
                  </td>
                  <td className="border border-slate-200 p-2 text-slate-600 max-w-xs truncate">
                    {violation.description}
                  </td>
                  <td className="border border-slate-200 p-2 text-center font-bold">
                    <span className={violation.status === 'resolved' ? "text-emerald-700" : "text-amber-700"}>
                      {statusLabel(violation.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer / Signatures */}
          <div className="grid grid-cols-2 gap-12 mt-12 text-center">
            <div>
              <p className="font-bold text-slate-700 border-b border-slate-300 pb-2 mb-10">
                {isRTL ? "مسؤول العمليات الميدانية" : "Field Operations Officer"}
              </p>
              <div className="h-10" />
            </div>
            <div>
              <p className="font-bold text-slate-700 border-b border-slate-300 pb-2 mb-10">
                {isRTL ? "مدير إدارة النقل والرقابة" : "Transport & Audit Director"}
              </p>
              <div className="h-10" />
            </div>
          </div>
        </div>
      )}

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8 print:hidden`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex flex-col">
                <h1 className={DS_pageTitle}>
                    {isRTL ? "سجل المخالفات الميدانية" : "Field Violations Log"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {violations.total} {isRTL ? "مخالفة مسجلة" : "Total Violations Recorded"}
                    </span>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => {
                        setPrintingViolation(null);
                        setTimeout(() => window.print(), 100);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Download size={16} />
                    {isRTL ? "تصدير التقرير" : "Export Report"}
                </button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={DS_statCard('red')}>
                <div className={DS_statIcon('red')}><ShieldAlert size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "إجمالي المخالفات" : "Total Violations"}</p>
                    <p className={DS_statValue2('red')}>{violations.total}</p>
                </div>
            </div>
            <div className={DS_statCard('yellow')}>
                <div className={DS_statIcon('yellow')}><Clock size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "قيد الانتظار" : "Pending"}</p>
                    <p className={DS_statValue2('yellow')}>5</p>
                </div>
            </div>
            <div className={DS_statCard('green')}>
                <div className={DS_statIcon('green')}><CheckCircle2 size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "محلولة" : "Resolved"}</p>
                    <p className={DS_statValue2('green')}>12</p>
                </div>
            </div>
            <div className={DS_statCard('navy')}>
                <div className={DS_statIcon('navy')}><FileText size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "مخالفات الأسبوع" : "This Week"}</p>
                    <p className={DS_statValue2('navy')}>3</p>
                </div>
            </div>
        </div>

        {/* Main Table */}
        <div className={DS_card}>
            <BaseDataTable<Violation>
                columns={columns}
                data={violations.data}
                pagination={pagination}
                searchValue={search}
                onSearchChange={handleSearch}
                searchPlaceholder={isRTL ? "ابحث برقم الحافلة أو اسم المشرف..." : "Search by bus or supervisor..."}
                title={isRTL ? "سجلات المخالفات" : "Violations Records"}
                subtitle={isRTL ? "قائمة بكافة المخالفات التي تم رصدها ميدانياً" : "List of all violations detected in the field"}
            />
        </div>

        {/* Delete Confirmation */}
        <ConfirmationModal
            show={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDelete}
            title={isRTL ? "حذف تقرير المخالفة" : "Delete Violation Report"}
            message={isRTL ? "هل أنت متأكد من رغبتك في حذف هذا التقرير؟" : "Are you sure you want to delete this report?"}
            confirmText={isRTL ? "حذف" : "Delete"}
            cancelText={isRTL ? "إلغاء" : "Cancel"}
            type="danger"
        />

      </div>
    </AuthenticatedLayout>
  );
}
