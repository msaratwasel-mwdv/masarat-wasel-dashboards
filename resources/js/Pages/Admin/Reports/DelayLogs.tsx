import React, { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import ApplicationLogo from "@/Components/ApplicationLogo";
import BaseDataTable, { type PaginationMeta } from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { 
    Clock, 
    Calendar, 
    Download, 
    Trash2, 
    Printer, 
    Bus, 
    User, 
    AlertCircle, 
    CheckCircle2, 
    Search, 
    Filter,
    History,
    FileText,
    ChevronRight,
    XCircle,
    UserMinus
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

interface Delay {
  id: number;
  type: 'student' | 'bus';
  duration_minutes: number;
  reason: string;
  notes: string;
  created_at: string;
  student?: { id: number; full_name: string; national_id: string };
  bus?: { id: number; bus_code: string; bus_number: string };
  reporter?: { id: number; name: string };
}

interface Props {
  delays: {
    data: Delay[];
    links: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  filters: { search?: string; type?: string; date?: string };
  auth?: any;
}

export default function DelayLogs({ delays, filters, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch] = useState(filters.search || "");
  const [printingDelay, setPrintingDelay] = useState<Delay | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [delayToDelete, setDelayToDelete] = useState<number | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    router.get(route("admin.delay-logs.index"), { search: value, type: filters.type, date: filters.date }, { preserveState: true, replace: true });
  };

  const handleDelete = () => {
    if (delayToDelete) {
      router.delete(route("admin.delay-logs.destroy", delayToDelete), {
        onSuccess: () => setIsDeleteModalOpen(false),
      });
    }
  };

  const typeLabel = (type: string) => {
    if (type === 'student') return isRTL ? "تأخير طالب" : "Student Delay";
    if (type === 'bus') return isRTL ? "تأخير حافلة" : "Bus Delay";
    return type;
  };

  const handlePrintSingle = (delay: Delay) => {
      setPrintingDelay(delay);
      setTimeout(() => {
          window.print();
      }, 100);
  };

  const columnHelper = createColumnHelper<Delay>();

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
    columnHelper.accessor("type", {
      header: isRTL ? "النوع" : "Type",
      cell: (info) => (
        <div className={DS_badge(info.getValue() === 'bus' ? 'navy' : 'gold')}>
            {typeLabel(info.getValue())}
        </div>
      )
    }),
    columnHelper.display({
      id: "target",
      header: isRTL ? "الهدف" : "Target",
      cell: (info) => {
          const item = info.row.original;
          if (item.type === 'student') {
              return (
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-gold/10 rounded-lg text-brand-gold">
                        <User size={14} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-slate-800 dark:text-white">{item.student?.full_name || "—"}</span>
                        <span className="text-[10px] text-slate-400">{item.student?.national_id}</span>
                    </div>
                </div>
              );
          }
          return (
            <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-navy/10 rounded-lg text-brand-navy">
                    <Bus size={14} />
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-slate-800 dark:text-white">{item.bus?.bus_number || "—"}</span>
                    <span className="text-[10px] text-slate-400">{item.bus?.bus_code}</span>
                </div>
            </div>
          );
      }
    }),
    columnHelper.accessor("duration_minutes", {
      header: isRTL ? "المدة" : "Duration",
      cell: (info) => (
        <div className="flex items-center gap-1.5 font-black text-brand-gold">
            <Clock size={12} />
            {info.getValue()} {isRTL ? "د" : "min"}
        </div>
      )
    }),
    columnHelper.accessor("reason", {
        header: isRTL ? "السبب" : "Reason",
        cell: (info) => <span className="text-xs font-bold text-slate-500 line-clamp-1 max-w-[150px]">{info.getValue() || "—"}</span>,
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
              setDelayToDelete(info.row.original.id);
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
    links: delays.links,
    current_page: delays.current_page,
    last_page: delays.last_page,
    per_page: delays.per_page,
    total: delays.total,
    from: delays.from,
    to: delays.to,
  };

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title={isRTL ? "سجلات التأخير الميدانية" : "Field Delay Logs"} />

      {/* Individual Delay Print View */}
      {printingDelay && (
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
                        <h2 className="text-xl font-black text-slate-800">إشعار تسجيل تأخير</h2>
                        <p className="text-xs text-slate-400">الرقم المرجعي: #DELAY-{printingDelay.id}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">التاريخ والوقت</p>
                        <p className="font-bold">{new Date(printingDelay.created_at).toLocaleString('ar-SA')}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">نوع التأخير</p>
                        <p className="font-bold">{typeLabel(printingDelay.type)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">مدة التأخير</p>
                        <p className="font-bold text-brand-gold">{printingDelay.duration_minutes} دقيقة</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المُبلغ</p>
                        <p className="font-bold">{printingDelay.reporter?.name || "—"}</p>
                    </div>
                </div>

                {printingDelay.type === 'student' ? (
                     <div className="grid grid-cols-2 gap-8 mb-10">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">اسم الطالب</p>
                            <p className="font-bold">{printingDelay.student?.full_name || "—"}</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الرقم المدني</p>
                            <p className="font-bold">{printingDelay.student?.national_id || "—"}</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">رقم الحافلة</p>
                            <p className="font-bold">{printingDelay.bus?.bus_number || "—"}</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">كود الحافلة</p>
                            <p className="font-bold">{printingDelay.bus?.bus_code || "—"}</p>
                        </div>
                    </div>
                )}

                <div className="mb-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">سبب التأخير</p>
                    <div className="p-6 bg-white border border-slate-200 rounded-xl min-h-[100px] leading-relaxed text-slate-700">
                        {printingDelay.reason}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mt-20 text-center">
                    <div>
                        <p className="font-black text-slate-800 border-b border-slate-200 pb-2 mb-8">توقيع المسؤول</p>
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
                onClick={() => setPrintingDelay(null)}
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
                    {isRTL ? "سجلات التأخير الميدانية" : "Field Delay Logs"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {delays.total} {isRTL ? "حالة تأخير مسجلة" : "Total Delays Recorded"}
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
            <div className={DS_statCard('gold')}>
                <div className={DS_statIcon('gold')}><Clock size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "إجمالي الدقائق" : "Total Minutes"}</p>
                    <p className={DS_statValue2('gold')}>420</p>
                </div>
            </div>
            <div className={DS_statCard('navy')}>
                <div className={DS_statIcon('navy')}><History size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "حالات التأخير" : "Delay Cases"}</p>
                    <p className={DS_statValue2('navy')}>{delays.total}</p>
                </div>
            </div>
            <div className={DS_statCard('green')}>
                <div className={DS_statIcon('green')}><CheckCircle2 size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "تأخير حافلات" : "Bus Delays"}</p>
                    <p className={DS_statValue2('green')}>12</p>
                </div>
            </div>
            <div className={DS_statCard('red')}>
                <div className={DS_statIcon('red')}><UserMinus size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "تأخير طلاب" : "Student Delays"}</p>
                    <p className={DS_statValue2('red')}>8</p>
                </div>
            </div>
        </div>

        {/* Main Table */}
        <div className={DS_card}>
            <BaseDataTable<Delay>
                columns={columns}
                data={delays.data}
                pagination={pagination}
                searchValue={search}
                onSearchChange={handleSearch}
                searchPlaceholder={isRTL ? "ابحث عن طالب أو حافلة..." : "Search for student or bus..."}
                title={isRTL ? "سجلات التأخير" : "Delay Records"}
                subtitle={isRTL ? "متابعة كافة حالات التأخير التي تم رصدها" : "Track all recorded delay cases"}
            />
        </div>

        {/* Delete Confirmation */}
        <ConfirmationModal
            show={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDelete}
            title={isRTL ? "حذف سجل التأخير" : "Delete Delay Record"}
            message={isRTL ? "هل أنت متأكد من رغبتك في حذف هذا السجل؟" : "Are you sure you want to delete this record?"}
            confirmText={isRTL ? "حذف" : "Delete"}
            cancelText={isRTL ? "إلغاء" : "Cancel"}
            type="danger"
        />

      </div>
    </AuthenticatedLayout>
  );
}
