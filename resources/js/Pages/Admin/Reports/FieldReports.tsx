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

      {/* Individual Violation Print View */}
      {printingViolation && (
        <div className="fixed inset-0 z-[200] bg-white text-black p-0 print:block hidden dir-rtl">
            <div className="p-10">
                {/* Print Header */}
                <div className="flex justify-between items-center mb-10 pb-6 border-b-2 border-slate-200">
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
                        <h2 className="text-xl font-black text-slate-800">إشعار مخالفة ميدانية</h2>
                        <p className="text-xs text-slate-400">الرقم المرجعي: #VIOL-{printingViolation.id}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">التاريخ والوقت</p>
                        <p className="font-bold">{new Date(printingViolation.created_at).toLocaleString('ar-SA')}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الحافلة</p>
                        <p className="font-bold">{printingViolation.bus?.bus_number || "—"}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المشرف</p>
                        <p className="font-bold">{printingViolation.field_supervisor?.name || "—"}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">نوع المخالفة</p>
                        <p className="font-bold">{printingViolation.type}</p>
                    </div>
                </div>

                <div className="mb-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">وصف وتفاصيل المخالفة</p>
                    <div className="p-6 bg-white border border-slate-200 rounded-xl min-h-[200px] leading-relaxed text-slate-700">
                        {printingViolation.description}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mt-20 text-center">
                    <div>
                        <p className="font-black text-slate-800 border-b border-slate-200 pb-2 mb-8">توقيع المشرف الميداني</p>
                        <div className="h-20" />
                    </div>
                    <div>
                        <p className="font-black text-slate-800 border-b border-slate-200 pb-2 mb-8">اعتماد الإدارة</p>
                        <div className="h-20" />
                    </div>
                </div>
            </div>
            
            {/* Close Print Preview Button (Screen Only) */}
            <button 
                onClick={() => setPrintingViolation(null)}
                className="fixed bottom-10 left-10 bg-brand-navy text-white px-6 py-3 rounded-full font-bold shadow-2xl print:hidden flex items-center gap-2"
            >
                <XCircle size={20} />
                إغلاق وضع الطباعة
            </button>
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
                    onClick={() => window.print()}
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
            isOpen={isDeleteModalOpen}
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
