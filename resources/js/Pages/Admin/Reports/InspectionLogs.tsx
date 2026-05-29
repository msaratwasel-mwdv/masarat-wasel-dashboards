import React, { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import ApplicationLogo from "@/Components/ApplicationLogo";
import BaseDataTable, { type PaginationMeta } from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { 
    Search, 
    Filter, 
    Calendar, 
    Download, 
    Trash2, 
    Eye, 
    Bus, 
    User, 
    ClipboardCheck, 
    AlertCircle, 
    ChevronRight,
    FileText,
    CheckCircle2,
    XCircle,
    Info
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
    DS_btnSecondary
} from "@/lib/DS";
import ConfirmationModal from "@/Components/ConfirmationModal";

interface InspectionResult {
  id: number;
  is_passed: boolean;
  notes: string | null;
  item: {
    id: number;
    name: string;
  };
}

interface Inspection {
  id: number;
  field_supervisor_id: number;
  bus_id: number;
  overall_status: string;
  notes: string | null;
  created_at: string;
  field_supervisor: {
    id: number;
    first_name_ar: string;
    last_name_ar: string;
    name?: string; // Derived in render if needed
  };
  bus: {
    id: number;
    bus_number: string;
  };
  results: InspectionResult[];
}

interface Props {
  inspections: {
    data: Inspection[];
    links: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  filters: { search?: string; status?: string; date?: string };
  auth?: any;
}

export default function InspectionLogs({ inspections, filters, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch] = useState(filters.search || "");
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<number | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    router.get(route("admin.inspection-logs.index"), { search: value, status: filters.status, date: filters.date }, { preserveState: true, replace: true });
  };

  const handleDelete = () => {
    if (inspectionToDelete) {
      router.delete(route("admin.inspection-logs.destroy", inspectionToDelete), {
        onSuccess: () => setIsDeleteModalOpen(false),
      });
    }
  };

  const statusColors: Record<string, "green" | "red" | "yellow" | "gray"> = {
    pass: "green",
    fail: "red",
    warning: "yellow",
  };

  const statusLabels: Record<string, string> = {
    pass: isRTL ? "اجتياز" : "Pass",
    fail: isRTL ? "فشل" : "Fail",
    warning: isRTL ? "تحذير" : "Warning",
  };

  const columnHelper = createColumnHelper<Inspection>();

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: "#",
      cell: (info) => <span className="font-bold text-slate-400">#{info.getValue()}</span>,
      meta: { className: "hidden sm:table-cell" }
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
        <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:block p-2 bg-brand-navy/5 rounded-lg text-brand-navy">
                <Bus size={14} />
            </div>
            <span className="font-black text-slate-800 dark:text-white">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor("field_supervisor", {
        header: isRTL ? "المشرف" : "Supervisor",
        cell: (info) => {
            const supervisor = info.getValue();
            const name = isRTL ? `${supervisor.first_name_ar} ${supervisor.last_name_ar}` : `${supervisor.first_name_ar} ${supervisor.last_name_ar}`;
            return (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{name}</span>
                </div>
            );
        }
    }),
    columnHelper.accessor("overall_status", {
      header: isRTL ? "النتيجة" : "Status",
      cell: (info) => {
        const val = info.getValue();
        return (
          <div className={DS_badge(statusColors[val] || "gray")}>
            {statusLabels[val] || val}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setSelectedInspection(info.row.original);
              setIsDetailsModalOpen(true);
            }}
            className="p-2 text-brand-navy hover:bg-brand-navy/5 rounded-lg transition-colors"
            title={isRTL ? "عرض التفاصيل" : "View Details"}
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => {
              setInspectionToDelete(info.row.original.id);
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
    links: inspections.links,
    current_page: inspections.current_page,
    last_page: inspections.last_page,
    per_page: inspections.per_page,
    total: inspections.total,
    from: inspections.from,
    to: inspections.to,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title={isRTL ? "سجلات الرقابة الميدانية" : "Field Inspection Logs"} />

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex flex-col">
                <h1 className={DS_pageTitle}>
                    {isRTL ? "سجلات الرقابة الميدانية" : "Field Inspection Logs"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {inspections.total} {isRTL ? "عملية تفتيش مسجلة" : "Total Inspections Recorded"}
                    </span>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Link
                    href={route('admin.inspection-items.index')}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-navy text-white font-bold text-xs rounded-xl hover:bg-brand-navy/90 transition-all shadow-md shadow-brand-navy/20 w-full sm:w-auto"
                >
                    <ClipboardCheck size={16} />
                    {isRTL ? "إدارة بنود الفحص" : "Manage Inspection Items"}
                </Link>
                <button 
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all shadow-sm w-full sm:w-auto"
                >
                    <Download size={16} />
                    {isRTL ? "تصدير التقرير" : "Export Report"}
                </button>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className={DS_statCard('navy')}>
                <div className={DS_statIcon('navy')}><ClipboardCheck size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "إجمالي الفحوصات" : "Total Inspections"}</p>
                    <p className={DS_statValue2('navy')}>{inspections.total}</p>
                </div>
            </div>
            <div className={DS_statCard('green')}>
                <div className={DS_statIcon('green')}><CheckCircle2 size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "نسبة الاجتياز" : "Pass Rate"}</p>
                    <p className={DS_statValue2('green')}>85%</p>
                </div>
            </div>
            <div className={DS_statCard('red')}>
                <div className={DS_statIcon('red')}><AlertCircle size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "حالات الفشل" : "Failures"}</p>
                    <p className={DS_statValue2('red')}>12</p>
                </div>
            </div>
            <div className={DS_statCard('gold')}>
                <div className={DS_statIcon('gold')}><Calendar size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "فحوصات الأسبوع" : "This Week"}</p>
                    <p className={DS_statValue2('gold')}>24</p>
                </div>
            </div>
        </div>

        {/* Main Table */}
        <div className={DS_card}>
            <BaseDataTable<Inspection>
                columns={columns}
                data={inspections.data}
                pagination={pagination}
                searchValue={search}
                onSearchChange={handleSearch}
                searchPlaceholder={isRTL ? "ابحث برقم الحافلة أو اسم المشرف..." : "Search by bus or supervisor..."}
                title={isRTL ? "سجلات الفحص الميداني" : "Field Inspection Logs"}
                subtitle={isRTL ? "قائمة بكافة عمليات الفحص التي قام بها المراقبون" : "List of all inspections performed by supervisors"}
            />
        </div>

        {/* Details Modal */}
        {isDetailsModalOpen && selectedInspection && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white">
                <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col print:rounded-none print:shadow-none print:max-h-none`}>
                    
                    {/* Modal Header */}
                    <div className="px-8 py-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-[#0f2044] gap-4 print:hidden">
                        <div className="flex items-center gap-3 justify-between sm:justify-start w-full sm:w-auto">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/10 text-brand-yellow rounded-2xl shrink-0">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">
                                        {isRTL ? `تقرير فحص #${selectedInspection.id}` : `Inspection Report #${selectedInspection.id}`}
                                    </h3>
                                    <p className="text-xs text-blue-100 font-bold uppercase tracking-widest opacity-80">
                                        {new Date(selectedInspection.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { dateStyle: 'full' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                            <button 
                                onClick={() => window.print()}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-gold text-brand-navy font-black text-xs rounded-xl hover:bg-brand-gold/90 transition-all flex-1 sm:flex-none"
                            >
                                <Download size={16} />
                                {isRTL ? "طباعة" : "Print"}
                            </button>
                            <button 
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="p-2 transition-colors rounded-lg text-white/80 hover:text-white hover:bg-white/10 shrink-0"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 overflow-y-auto p-8 print:p-0" dir={isRTL ? 'rtl' : 'ltr'}>
                        
                        {/* Print Only Header */}
                        <div className="hidden print:block mb-10 pb-6 border-b-2 border-slate-200">
                             <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-navy rounded-xl flex items-center justify-center">
                                        <ApplicationLogo className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black text-brand-navy">مسارات واصل</h1>
                                        <p className="text-[10px] font-bold text-brand-gold tracking-widest uppercase">MASARAT WASEL</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-xl font-black text-slate-800">تقرير فحص ميداني</h2>
                                    <p className="text-xs text-slate-400">الرقم المرجعي: #{selectedInspection.id}</p>
                                </div>
                             </div>
                        </div>

                        {/* Summary Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isRTL ? "الحافلة" : "Bus"}</p>
                                <p className="text-lg font-black text-slate-800 dark:text-white">{selectedInspection.bus?.bus_number}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isRTL ? "المشرف" : "Supervisor"}</p>
                                <p className="text-lg font-black text-slate-800 dark:text-white">
                                    {isRTL ? `${selectedInspection.field_supervisor.first_name_ar} ${selectedInspection.field_supervisor.last_name_ar}` : `${selectedInspection.field_supervisor.first_name_ar} ${selectedInspection.field_supervisor.last_name_ar}`}
                                </p>
                            </div>
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isRTL ? "النتيجة النهائية" : "Final Status"}</p>
                                <div className={DS_badge(statusColors[selectedInspection.overall_status] || "gray")}>
                                    {statusLabels[selectedInspection.overall_status] || selectedInspection.overall_status}
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {selectedInspection.notes && (
                            <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-900/10 border-r-4 border-amber-400 rounded-xl">
                                <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400">
                                    <Info size={18} />
                                    <span className="font-black text-sm">{isRTL ? "ملاحظات عامة" : "General Notes"}</span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 font-bold leading-relaxed italic">
                                    "{selectedInspection.notes}"
                                </p>
                            </div>
                        )}

                        {/* Checklist Results */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ClipboardCheck size={16} />
                                {isRTL ? "تفاصيل بنود الفحص" : "Checklist Results"}
                            </h4>
                            
                            {selectedInspection.results.map((result) => (
                                <div key={result.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:shadow-md transition-all gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-black text-slate-800 dark:text-white">{result.item.name}</span>
                                        {result.notes && (
                                            <span className="text-xs text-slate-400 italic">
                                                {isRTL ? "ملاحظة: " : "Note: "}{result.notes}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {result.is_passed ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100">
                                                <CheckCircle2 size={12} />
                                                {isRTL ? "اجتياز" : "Pass"}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black border border-rose-100">
                                                <XCircle size={12} />
                                                {isRTL ? "فشل" : "Fail"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Print Footer */}
                        <div className="hidden print:grid grid-cols-2 gap-12 mt-20 text-center">
                            <div>
                                <p className="font-black text-slate-800 border-b border-slate-200 pb-2 mb-8">توقيع المشرف الميداني</p>
                                <div className="h-20" />
                                <p className="text-xs font-bold text-slate-400">..................................................</p>
                            </div>
                            <div>
                                <p className="font-black text-slate-800 border-b border-slate-200 pb-2 mb-8">اعتماد الإدارة</p>
                                <div className="h-20" />
                                <p className="text-xs font-bold text-slate-400">..................................................</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDelete}
            title={isRTL ? "حذف سجل الفحص" : "Delete Inspection Log"}
            message={isRTL ? "هل أنت متأكد من رغبتك في حذف هذا السجل؟ لا يمكن التراجع عن هذه العملية." : "Are you sure you want to delete this log? This action cannot be undone."}
            confirmText={isRTL ? "حذف" : "Delete"}
            cancelText={isRTL ? "إلغاء" : "Cancel"}
            type="danger"
        />

      </div>
    </AuthenticatedLayout>
  );
}
