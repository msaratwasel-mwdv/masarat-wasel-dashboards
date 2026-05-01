import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Fuel,
  Wrench,
  Calendar,
  DollarSign,
  Bus as BusIcon,
  Plus,
  Filter,
  Image as ImageIcon,
  MoreHorizontal,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Zap,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  BarChart3,
  Printer
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer 
} from "recharts";
import PrimaryButton from "@/Components/PrimaryButton";
import ReportModal from "@/Components/Admin/BusExpenses/ReportModal";
import BaseDataTable, { ActionButton, type FilterTab } from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import PrintReportHeader from "@/Components/PrintReportHeader";
import {
  DS_pageTitle,
  DS_btnGold,
  DS_btnPrimary,
  DS_btnSecondary,
  DS_statCard,
  DS_statIcon,
  DS_statLabel,
  DS_statValue2,
} from "@/lib/DS";

// ─── Print CSS ──────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #expense-print-area, #expense-print-area * { visibility: visible !important; }
  #expense-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
}

interface Expense {
  id: number;
  bus_id: number;
  bus: Bus;
  type: 'fuel' | 'maintenance';
  amount: number;
  date: string;
  extra_info: string;
  receipt_photo: string | null;
  photo_url: string | null;
}

interface Props {
  expenses: {
    data: Expense[];
    links: any[];
    current_page: number;
    last_page: number;
    total: number;
  };
  buses: Bus[];
  filters: {
    type?: string;
  };
  stats: {
    total_fuel: number;
    total_maintenance: number;
    total_count: number;
    monthly_spending: number;
    trend: Array<{ date: string; count: number }>;
  };
}

export default function BusExpensesIndex({ expenses, buses, filters, stats }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [activeType, setActiveType] = useState(filters.type || "all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterChange = (type: string) => {
    setActiveType(type);
    router.get(route('admin.bus-expenses.index'), { type: type === 'all' ? '' : type }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const filteredExpenses = useMemo(() => {
    return expenses.data.filter(e => 
      e.bus.bus_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.bus.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.extra_info?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
  }, [expenses.data, searchQuery]);

  const handlePrint = () => window.print();

  const columnHelper = createColumnHelper<Expense>();
  const columns = useMemo(() => [
    columnHelper.accessor("bus", {
      header: isRTL ? "الحافلة" : "Bus",
      cell: (info) => {
        const bus = info.getValue();
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-navy/5 text-brand-navy flex items-center justify-center">
              <BusIcon size={14} />
            </div>
            <div className={isRTL ? "text-right" : "text-left"}>
              <div className="text-sm font-bold text-brand-navy dark:text-white">{bus.bus_number}</div>
              <div className="text-xs font-mono text-slate-500">{bus.plate_number}</div>
            </div>
          </div>
        );
      }
    }),
    columnHelper.accessor("type", {
      header: isRTL ? "النوع" : "Type",
      cell: (info) => {
        const type = info.getValue();
        const isFuel = type === 'fuel';
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
            isFuel ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
          }`}>
            {isFuel ? <Fuel size={12} /> : <Wrench size={12} />}
            {isFuel ? (isRTL ? "وقود" : "Fuel") : (isRTL ? "صيانة" : "Maintenance")}
          </span>
        );
      }
    }),
    columnHelper.accessor("amount", {
      header: isRTL ? "المبلغ" : "Amount",
      cell: (info) => (
        <div className="font-black text-brand-navy dark:text-white">
          <span className="text-[10px] opacity-50 mr-1">OMR</span>
          {Number(info.getValue()).toLocaleString()}
        </div>
      )
    }),
    columnHelper.accessor("date", {
      header: isRTL ? "التاريخ" : "Date",
      cell: (info) => (
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
          {new Date(info.getValue()).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    }),
    columnHelper.accessor("extra_info", {
      header: isRTL ? "التفاصيل" : "Details",
      cell: (info) => (
        <div className="max-w-[200px] truncate text-xs text-slate-500" title={info.getValue()}>
          {info.getValue() || "—"}
        </div>
      )
    }),
    columnHelper.display({
      id: "actions",
      header: isRTL ? "الإجراءات" : "Actions",
      cell: (info) => {
        const expense = info.row.original;
        return (
          <div className={`flex items-center gap-2 ${isRTL ? "justify-start" : "justify-end"}`}>
            {expense.photo_url ? (
              <button 
                onClick={() => setSelectedImage(expense.photo_url)}
                className="p-1.5 rounded-lg bg-brand-yellow/10 text-brand-yellow hover:bg-brand-yellow hover:text-brand-dark transition-all"
                title={isRTL ? "معاينة المرفق" : "Preview Attachment"}
              >
                <ImageIcon size={14} />
              </button>
            ) : (
              <div className="p-1.5 w-[26px] h-[26px]" />
            )}
            <ActionButton label={isRTL ? "حذف" : "Delete"} icon={<Trash2 size={14} />} onClick={() => {}} color="red" />
          </div>
        );
      }
    })
  ], [isRTL, isDark]);

  const filterTabs: FilterTab[] = [
    { key: "all", label: isRTL ? "الكل" : "All" },
    { key: "fuel", label: isRTL ? "وقود" : "Fuel", dotColor: "bg-blue-500" },
    { key: "maintenance", label: isRTL ? "صيانة" : "Maintenance", dotColor: "bg-indigo-500" }
  ];

  return (
    <AuthenticatedLayout>
      <Head title={isRTL ? "إدارة المصاريف" : "Expense Management"} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area (hidden on screen, visible on print) ── */}
      <div id="expense-print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
        <PrintReportHeader
          title={isRTL ? "تقرير مصاريف الحافلات" : "Bus Expenses Report"}
          schoolName={isRTL ? "إدارة شركة مسارات واصل" : "Masarat Wasel Company"}
          schoolLogo={null}
          printDate={`${isRTL ? "تاريخ الطباعة" : "Print Date"}: ${new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}`}
          schoolAdminText={isRTL ? "إدارة الشركة" : "Company Admin"}
        />
        <div className="px-4">
          <table className="w-full border-collapse border border-gray-300 text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1.5 text-right font-bold w-8 text-black">#</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الحافلة" : "Bus"}</th>
                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{isRTL ? "النوع" : "Type"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "المبلغ (OMR)" : "Amount (OMR)"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "التاريخ" : "Date"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "التفاصيل" : "Details"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense, i) => (
                <tr key={expense.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center text-gray-700 font-semibold">{i + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{expense.bus.bus_number} - {expense.bus.plate_number}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-bold">{expense.type === 'fuel' ? (isRTL ? "وقود" : "Fuel") : (isRTL ? "صيانة" : "Maintenance")}</td>
                  <td className="border border-gray-300 p-1.5 font-black text-gray-900">{Number(expense.amount).toLocaleString()}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{new Date(expense.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{expense.extra_info || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{isRTL ? "إجمالي السجلات" : "Total Logs"}: {filteredExpenses.length}</p>
            <p>{isRTL ? "توقيع مدير الشركة" : "Company Manager Signature"}: ............................</p>
          </div>
        </div>
      </div>

      <div className={`pb-8 space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        
        {/* ── Page Header (title only — matches system standard) ── */}
        <div className={isRTL ? "text-right" : "text-left"}>
          <h1 className={DS_pageTitle}>{isRTL ? "سجل المصاريف" : "Expense Logs"}</h1>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">
            {isRTL ? `إجمالي ${stats.total_count} سجل مالي` : `${stats.total_count} total financial records`}
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: isRTL ? "إجمالي الوقود" : "Total Fuel",       value: stats.total_fuel,        icon: <Fuel className="w-5 h-5" />,        accent: "navy"  as const },
            { label: isRTL ? "إجمالي الصيانة" : "Total Maintenance", value: stats.total_maintenance, icon: <Wrench className="w-5 h-5" />,      accent: "gold" as const },
            { label: isRTL ? "مصاريف الشهر"  : "Monthly Spending",  value: stats.monthly_spending,  icon: <TrendingUp className="w-5 h-5" />,  accent: "green"  as const },
            { label: isRTL ? "عدد العمليات"  : "Total Logs",        value: stats.total_count,       icon: <Activity className="w-5 h-5" />,    accent: "navy"   as const },
          ].map((stat, i) => (
            <motion.div key={i} whileHover={{ y: -2 }} className={`${DS_statCard(stat.accent)} ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={DS_statIcon(stat.accent)}>{stat.icon}</div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className={DS_statLabel}>{stat.label}</p>
                <p className={DS_statValue2(stat.accent)}>
                   {Number(stat.value).toLocaleString()} <span className="text-[10px] opacity-50">OMR</span>
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <BaseDataTable<Expense>
            columns={columns}
            data={filteredExpenses}
            exportEnabled={true}
            headerAction={
              <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button onClick={() => setIsReportModalOpen(true)} className={DS_btnSecondary}>
                  <BarChart3 className="w-4 h-4" />
                  {isRTL ? "تقرير استهلاك" : "Consumption Report"}
                </button>
                <button onClick={handlePrint} className={DS_btnSecondary}>
                  <Printer className="w-4 h-4" />
                  {isRTL ? "طباعة" : "Print"}
                </button>
                <PrimaryButton className="bg-brand-yellow text-brand-dark hover:shadow-lg border-none h-full rounded-[14px]">
                  <Plus className="w-4 h-4 mr-2" />
                  {isRTL ? "إضافة سجل" : "Add Record"}
                </PrimaryButton>
              </div>
            }
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={isRTL ? "بحث عن حافلة أو تفاصيل..." : "Search bus or details..."}
            filterTabs={filterTabs}
            activeFilter={activeType}
            onFilterChange={handleFilterChange}
            emptyMessage={isRTL ? "لا توجد سجلات مطابقة" : "No Matching Records"}
            emptyDescription={isRTL ? "لم نجد أي مصاريف تطابق بحثك." : "We couldn't find any expenses matching your search."}
            emptyIcon={<DollarSign className="w-10 h-10" />}
            emptyAction={
              !activeType || activeType === "all"
                ? { label: isRTL ? "إضافة سجل" : "Add Record", onClick: () => {} }
                : undefined
            }
          />
        </motion.div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
            {selectedImage && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedImage(null)}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md cursor-zoom-out"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.9, opacity: 0, rotate: 2 }}
                        className="relative max-w-5xl w-full max-h-[90vh] overflow-hidden rounded-[40px] bg-white dark:bg-slate-900 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-yellow via-blue-500 to-indigo-500" />
                        <img 
                            src={selectedImage} 
                            alt="Attachment" 
                            className="w-full h-full object-contain"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-black/50 text-white hover:bg-brand-yellow hover:text-brand-dark transition-all flex items-center justify-center shadow-lg backdrop-blur-md"
                        >
                            <Plus className="rotate-45" size={28} />
                        </button>
                        
                        {/* Modal Info Bar */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex justify-between items-center text-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md">
                                        <ImageIcon size={20} />
                                    </div>
                                    <span className="font-bold text-sm">{isRTL ? "معاينة المرفق" : "Attachment Preview"}</span>
                                </div>
                                <a 
                                  href={selectedImage} 
                                  download 
                                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2"
                                >
                                    <Download size={14} />
                                    {isRTL ? "تحميل" : "Download"}
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <ReportModal 
            isOpen={isReportModalOpen} 
            onClose={() => setIsReportModalOpen(false)} 
            buses={buses}
            isRTL={isRTL}
        />
    </AuthenticatedLayout>
  );
}


