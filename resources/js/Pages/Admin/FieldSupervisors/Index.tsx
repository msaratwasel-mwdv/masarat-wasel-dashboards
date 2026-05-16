import { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, {
  ActionButton,
  StatusBadge,
  type FilterTab,
} from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, 
    CheckCircle2, 
    XCircle, 
    MapPin, 
    Plus, 
    Eye, 
    Edit2, 
    Trash2, 
    X, 
    ArrowLeft, 
    ChevronRight,
    Phone,
    Mail,
    CreditCard,
    AlertCircle,
    Printer,
    Briefcase,

    ShieldCheck,
    Upload,
    Download,
    Loader2
} from "lucide-react";
import { 
    DS_pageWrapper, 
    DS_card, 
    DS_pageTitle,
    DS_statCard,
    DS_statIcon,
    DS_statLabel,
    DS_statValue2,
    DS_btnGold,
    DS_btnSecondary,
    DS_modalContainer,
    DS_modalHeader,
    DS_modalHeaderTitle,
    DS_modalHeaderAccent,
    DS_modalClose,
    DS_modalBody,
    DS_modalFooter,
    DS_input,
    DS_label,
    DS_btnPrimary,
    DS_btnDanger,
    DS_btnEdit,
    DS_select
} from "@/lib/DS";
import PrintReportHeader from "@/Components/PrintReportHeader";

// ─── Print CSS ──────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #field-print-area, #field-print-area * { visibility: visible !important; }
  #field-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

interface FieldSupervisor {
  id: number;
  name: string;
  name_en: string | null;
  email: string;
  phone: string;
  national_id: string;
  user_code: string;
  is_active: boolean;
  image?: string | null;
  first_name_ar?: string;
  second_name_ar?: string;
  third_name_ar?: string;
  last_name_ar?: string;
  first_name_en?: string;
  second_name_en?: string;
  third_name_en?: string;
  last_name_en?: string;
  preferred_language?: string;
}

type FilterType = "all" | "active" | "inactive";

export default function FieldSupervisorsIndex({
  auth,
  supervisors,
}: {
  auth: any;
  supervisors: FieldSupervisor[];
}) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { data: importData, setData: setImportData, post: postImport, processing: importProcessing, errors: importErrors, reset: resetImport } = useForm({ file: null as File | null });
  const flash = usePage().props.flash as any;
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<FieldSupervisor | null>(null);

  const { data, setData, post, processing, errors, reset, clearErrors } =
    useForm({
      _method: "post",
      first_name_ar: "",
      second_name_ar: "",
      third_name_ar: "",
      last_name_ar: "",
      first_name_en: "",
      second_name_en: "",
      third_name_en: "",
      last_name_en: "",
      national_id: "",
      email: "",
      phone: "",
      status: "Active",
      is_active: true,
      address: "",
      preferred_language: "ar",
      image: null as File | null,
    });

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setPreviewImage(null);
    setCurrentStep(1);
    reset();
    setData("_method", "post");
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (sup: FieldSupervisor) => {
    setIsEditing(true);
    setCurrentId(sup.id);
    setPreviewImage(sup.image ? `/storage/${sup.image}` : null);
    setCurrentStep(1);
    setData({
      _method: "put",
      first_name_ar: sup.first_name_ar || sup.name.split(" ")[0] || "",
      second_name_ar: sup.second_name_ar || "",
      third_name_ar: sup.third_name_ar || "",
      last_name_ar: sup.last_name_ar || sup.name.split(" ").slice(-1)[0] || "",
      first_name_en:
        sup.first_name_en || (sup.name_en ? sup.name_en.split(" ")[0] : ""),
      second_name_en: sup.second_name_en || "",
      third_name_en: sup.third_name_en || "",
      last_name_en:
        sup.last_name_en ||
        (sup.name_en ? sup.name_en.split(" ").slice(-1)[0] : ""),
      national_id: sup.national_id || "",
      email: sup.email,
      phone: sup.phone || "",
      status: sup.is_active ? "Active" : "Inactive",
      is_active: sup.is_active,
      address: sup.address || "",
      preferred_language: sup.preferred_language || "ar",
      image: null,
    });
    clearErrors();
    setIsModalOpen(true);
  };

  const openDetailsModal = (sup: FieldSupervisor) => {
    setSelectedSupervisor(sup);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent implicit form submission (e.g., from mobile keyboard "Next/Go") from saving data prematurely.
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (isEditing && currentId) {
      post(route("admin.field-supervisors.update", currentId), {
        forceFormData: true,
        onSuccess: () => closeModal(),
        transform: (data) => ({
          ...data,
          is_active: data.status === "Active",
        }),
      });
    } else {
      post(route("admin.field-supervisors.store"), {
        forceFormData: true,
        onSuccess: () => closeModal(),
        transform: (data) => ({
          ...data,
          is_active: data.status === "Active",
        }),
      });
    }
  };

  const deleteSupervisor = (id: number) => {
    if (confirm(isRTL ? "هل أنت متأكد من حذف هذا المشرف؟" : "Are you sure?")) {
      router.delete(route("admin.field-supervisors.destroy", id));
    }
  };

  const handlePrint = () => window.print();

  const filtered = useMemo(() => {
    let list = supervisors;
    if (filter === "active") list = list.filter((s) => s.is_active);
    if (filter === "inactive") list = list.filter((s) => !s.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.name_en?.toLowerCase().includes(q) ?? false) ||
          s.national_id?.includes(q) ||
          s.phone?.includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.user_code?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [supervisors, filter, search]);

  const counts = useMemo(
    () => ({
      all: supervisors.length,
      active: supervisors.filter((s) => s.is_active).length,
      inactive: supervisors.filter((s) => !s.is_active).length,
    }),
    [supervisors]
  );

  const filterBtnClass = (f: FilterType) =>
    `px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
      filter === f
        ? "bg-brand-dark text-white border-brand-dark shadow"
        : isDark
        ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
    }`;

  const statusLabel = (isActive: boolean) =>
    isActive ? (isRTL ? "نشط" : "Active") : isRTL ? "غير نشط" : "Inactive";

  // ── Columns for BaseDataTable ──
  const columnHelper = createColumnHelper<FieldSupervisor>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: isRTL ? "المشرف الميداني" : "Field Supervisor",
        cell: (info) => {
          const sup = info.row.original;
          return (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-[#0f2044]/10 dark:bg-[#0f2044]/40 text-[#0f2044] dark:text-[#f5b800] flex items-center justify-center font-black text-sm overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
                {sup.image ? (
                  <img
                    src={`/storage/${sup.image}`}
                    alt={sup.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  sup.name.charAt(0)
                )}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"} tracking-tight`}>
                  {sup.name}
                </span>
                {sup.name_en && (
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                    {sup.name_en}
                  </span>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("national_id", {
        header: isRTL ? "الرقم المدني" : "ID / Code",
        cell: (info) => {
          const sup = info.row.original;
          return (
            <div className="flex flex-col">
              <span className={`text-sm font-black ${isDark ? "text-gray-300" : "text-[#0f2044]"} font-mono`}>
                {sup.national_id || "—"}
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase">
                {sup.user_code}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("phone", {
        header: isRTL ? "بيانات الاتصال" : "Contact",
        cell: (info) => {
          const sup = info.row.original;
          return (
            <div className="flex flex-col">
              <span className={`text-sm font-black ${isDark ? "text-gray-300" : "text-[#0f2044]"} font-mono`}>
                {sup.phone}
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate max-w-[160px]">
                {sup.email}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("is_active", {
        header: isRTL ? "الحالة" : "Status",
        cell: (info) => {
            const isActive = info.getValue();
            return <StatusBadge status={isActive ? "active" : "inactive"} />;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
          const sup = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => openDetailsModal(sup)}
                className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                title={isRTL ? "عرض" : "View"}
              >
                <Eye size={16} />
              </button>
              <button 
                onClick={() => openEditModal(sup)}
                className={DS_btnEdit}
                title={isRTL ? "تعديل" : "Edit"}
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => deleteSupervisor(sup.id)}
                className={DS_btnDanger}
                title={isRTL ? "حذف" : "Delete"}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        },
      }),
    ],
    [isRTL, isDark]
  );

  const filterTabs: FilterTab[] = [
    { key: "all", label: isRTL ? "الكل" : "All", count: counts.all },
    {
      key: "active",
      label: isRTL ? "نشط" : "Active",
      count: counts.active,
      dotColor: "bg-emerald-400",
    },
    {
      key: "inactive",
      label: isRTL ? "غير نشط" : "Inactive",
      count: counts.inactive,
      dotColor: "bg-rose-400",
    },
  ];

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={isRTL ? "إدارة المشرفين الميدانيين" : "Field Supervisors Management"} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area (Unified System) ── */}
      <div id="field-print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
        <PrintReportHeader
          title={isRTL ? "تقرير بيانات المشرفين الميدانيين" : "Field Supervisors Operational Report"}
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
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "المشرف الميداني" : "Field Supervisor"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الرقم المدني" : "ID"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الجوال" : "Phone"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "البريد الإلكتروني" : "Email"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sup, i) => (
                <tr key={sup.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center text-gray-700">{i + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{sup.name}</td>
                  <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{sup.national_id}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{sup.phone}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{sup.email}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{sup.is_active ? (isRTL ? "نشط" : "Active") : (isRTL ? "غير نشط" : "Inactive")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{isRTL ? "إجمالي الكادر" : "Total Force"}: {filtered.length}</p>
            <p>{isRTL ? "التوقيع الرسمي" : "Official Signature"}: ............................</p>
          </div>
        </div>
      </div>

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex flex-col">
                <h1 className={DS_pageTitle}>
                    {isRTL ? "إدارة الأسطول: المشرفين الميدانيين" : "Fleet Management: Field Supervisors"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {supervisors.length} {isRTL ? "مشرف ميداني مسجل" : "Field Supervisors Enrolled"}
                    </span>
                </div>
            </div>
        </div>

        {/* Intelligence Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={DS_statCard('blue')}>
                <div className={DS_statIcon('blue')}><Users size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "إجمالي المشرفين" : "Total Supervisors"}</p>
                    <p className={DS_statValue2('blue')}>{counts.all}</p>
                </div>
            </div>
            <div className={DS_statCard('green')}>
                <div className={DS_statIcon('green')}><CheckCircle2 size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "النشطون" : "Active Units"}</p>
                    <p className={DS_statValue2('green')}>{counts.active}</p>
                </div>
            </div>
            <div className={DS_statCard('red')}>
                <div className={DS_statIcon('red')}><XCircle size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "غير النشطين" : "Inactive Units"}</p>
                    <p className={DS_statValue2('red')}>{counts.inactive}</p>
                </div>
            </div>
        </div>

        {/* Error reporting for import */}
        {flash?.import_errors && flash.import_errors.length > 0 && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <h4 className="text-rose-600 font-bold mb-2">أخطاء في عملية الاستيراد:</h4>
                <ul className="list-disc list-inside text-sm text-rose-500 space-y-1">
                    {flash.import_errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                    ))}
                </ul>
            </div>
        )}

        {/* Main Operational Table */}
        <div className={DS_card}>
            <BaseDataTable<FieldSupervisor>
                columns={columns}
                data={filtered}
                pagination={null as any}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder={isRTL ? "البحث في ملفات المشرفين..." : "Search supervisor dossiers..."}
                filterTabs={filterTabs}
                activeFilter={filter}
                onFilterChange={(key) => setFilter(key as FilterType)}
                exportEnabled={false}
                headerAction={
                    <div className="flex items-center gap-2">
                        <button onClick={openAddModal} className={DS_btnGold}>
                            <Plus size={16} />
                            <span className="hidden sm:inline">{isRTL ? "إضافة مشرف ميداني" : "New Field Supervisor"}</span>
                        </button>
                        <button onClick={() => setIsImportModalOpen(true)} className={DS_btnSecondary}>
                            <Upload size={16} />
                            <span className="hidden sm:inline">{isRTL ? "استيراد" : "Import"}</span>
                        </button>
                        <a href={route("admin.field-supervisors.export")} className={DS_btnSecondary}>
                            <Download size={16} />
                            <span className="hidden sm:inline">{isRTL ? "تصدير" : "Export"}</span>
                        </a>
                        <button onClick={handlePrint} className={DS_btnSecondary}>
                            <Printer size={16} />
                            <span className="hidden sm:inline">{isRTL ? "طباعة" : "Print"}</span>
                        </button>
                    </div>
                }
            />
        </div>

        {/* --- High-End Details Modal --- */}
        <AnimatePresence>
            {showDetailsModal && selectedSupervisor && (
                <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="3xl">
                    <div className={DS_modalContainer}>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {/* Dossier Header */}
                            <div className="relative h-48 shrink-0 bg-[#0f2044] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent z-10" />
                            <div className="absolute top-6 inset-x-6 flex justify-between items-center z-20">
                                <span className="px-3 py-1 bg-[#f5b800] text-[#0f2044] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    {isRTL ? "رقم الملف" : "Dossier ID"}: #{selectedSupervisor.user_code}
                                </span>
                                <button onClick={() => setShowDetailsModal(false)} className={DS_modalClose}>
                                    <X size={18} />
                                </button>
                            </div>
                            
                            {/* Visual ID */}
                            <div className="absolute -bottom-10 left-10 w-32 h-32 rounded-[2rem] border-4 border-white dark:border-[#1a2845] bg-white dark:bg-[#0f2044] shadow-2xl overflow-hidden z-20">
                                {selectedSupervisor.image ? (
                                    <img src={`/storage/${selectedSupervisor.image}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-[#0f2044] dark:text-[#f5b800] bg-gray-50">
                                        {selectedSupervisor.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-16 pb-10 px-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 dark:border-[#243460] pb-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-[#0f2044] dark:text-white tracking-tighter">
                                        {selectedSupervisor.name}
                                    </h2>
                                    <p className="text-lg font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        {selectedSupervisor.name_en || (isRTL ? "غير محدد" : "UNSPECIFIED")}
                                    </p>
                                    <div className="flex gap-2 mt-4">
                                        <StatusBadge status={selectedSupervisor.is_active ? "active" : "inactive"} />
                                        <span className="px-3 py-1 bg-[#0f2044]/5 dark:bg-[#0f2044]/40 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                            {isRTL ? "الصفة: مشرف ميداني" : "Role: Field Supervisor"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-10">
                                {/* Section: Personal */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Users size={16} className="text-[#f5b800]" /> {isRTL ? "الهوية الشخصية" : "Personal Identity"}
                                    </h3>
                                    <div className="space-y-4">
                                        <InfoRow icon={<CreditCard size={14} />} label={isRTL ? "الرقم المدني" : "Civil ID"} value={selectedSupervisor.national_id} isDark={isDark} />
                                        <InfoRow icon={<Phone size={14} />} label={isRTL ? "رقم الجوال" : "Primary Phone"} value={selectedSupervisor.phone} isDark={isDark} />
                                        <InfoRow icon={<Mail size={14} />} label={isRTL ? "البريد الإلكتروني" : "Email Address"} value={selectedSupervisor.email} isDark={isDark} />
                                        <InfoRow icon={<MapPin size={14} />} label={isRTL ? "العنوان" : "Registered Address"} value={selectedSupervisor.address || "—"} isDark={isDark} />
                                    </div>
                                </div>

                                {/* Section: Operational */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Briefcase size={16} className="text-[#f5b800]" /> {isRTL ? "البيانات التشغيلية" : "Operational Data"}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 dark:bg-[#0f2044]/30 rounded-2xl border border-gray-100 dark:border-[#243460]">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isRTL ? "كود المستخدم" : "Internal Code"}</p>
                                            <p className="text-sm font-bold text-[#0f2044] dark:text-gray-300 font-mono">
                                                {selectedSupervisor.user_code}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-[#f5b800]/5 rounded-2xl border border-[#f5b800]/10">
                                            <p className="text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase tracking-widest mb-1">{isRTL ? "الوصول للنظام" : "System Access"}</p>
                                            <p className="text-sm font-bold text-[#0f2044] dark:text-gray-300">
                                                {selectedSupervisor.is_active ? (isRTL ? "مصرح له بالدخول" : "Authorized Access") : (isRTL ? "ممنوع من الدخول" : "Revoked Access")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </AnimatePresence>

        {/* --- Enrollment / Edit Modal --- */}
        <Modal show={isModalOpen} onClose={closeModal} maxWidth="5xl">
            <div className={DS_modalContainer}>
                <div className={DS_modalHeader(isRTL)}>
                    <div className="flex items-center gap-3">
                        <div className={DS_modalHeaderAccent} />
                        <h3 className={DS_modalHeaderTitle}>
                            {isEditing ? (isRTL ? "تحديث ملف المشرف" : "Update Supervisor Dossier") : (isRTL ? "تسجيل مشرف ميداني جديد" : "Enroll New Field Supervisor")}
                        </h3>
                    </div>
                    <button onClick={closeModal} className={DS_modalClose}>
                        <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
                    </button>
                </div>

                {/* Tactical Stepper */}
                <div className="bg-[#0f2044]/5 dark:bg-[#0f2044]/30 px-10 py-3 border-b border-gray-100 dark:border-[#243460]">
                    <div className="relative flex items-center justify-between">
                        <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-[#243460]" />
                        <div className={`absolute left-10 top-1/2 -translate-y-1/2 h-0.5 bg-[#f5b800] transition-all duration-500`} style={{ width: currentStep === 1 ? '0%' : '100%' }} />
                        
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg transition-all ${currentStep >= 1 ? 'bg-[#f5b800] text-[#0f2044]' : 'bg-white dark:bg-[#1a2845] text-gray-400'}`}>1</div>
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg transition-all ${currentStep >= 2 ? 'bg-[#f5b800] text-[#0f2044]' : 'bg-white dark:bg-[#1a2845] text-gray-400'}`}>2</div>
                    </div>
                    <div className="flex justify-between mt-1 px-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#0f2044] dark:text-[#f5b800]">{isRTL ? "الهوية الشخصية" : "Personal Identity"}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${currentStep === 2 ? 'text-[#0f2044] dark:text-[#f5b800]' : 'text-gray-400'}`}>{isRTL ? "بيانات الاتصال" : "Contact Details"}</span>
                    </div>
                </div>

                <form onSubmit={submit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className={DS_modalBody}>
                        {currentStep === 1 && (
                            <motion.div initial={{ opacity: 0, x: isRTL ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                                {/* Photo Upload */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#0f2044]/40 border-2 border-dashed border-gray-200 dark:border-[#243460] flex items-center justify-center overflow-hidden">
                                        {data.image ? (
                                            <img src={URL.createObjectURL(data.image)} className="w-full h-full object-cover" />
                                        ) : previewImage ? (
                                            <img src={previewImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <Users size={32} className="text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRTL ? "الصورة الشخصية" : "Supervisor Visual ID"}</label>
                                        <label className="cursor-pointer px-4 py-2 bg-[#0f2044] text-white rounded-xl text-xs font-black hover:bg-[#1a3a7a] transition-all">
                                            {isRTL ? "رفع صورة" : "Upload Dossier Photo"}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} />
                                        </label>
                                        <InputError message={errors.image} />
                                    </div>
                                </div>

                                {/* Names Grid - Arabic */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] border-b border-gray-100 dark:border-[#243460] pb-2">
                                        {isRTL ? "البيانات الرسمية (بالعربية)" : "Official Dossier Name (Arabic)"}
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "الاسم الأول" : "First Name"}</label>
                                            <input type="text" value={data.first_name_ar} onChange={(e) => setData("first_name_ar", e.target.value)} className={DS_input} dir="rtl" required />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "اسم الأب" : "Father Name"}</label>
                                            <input type="text" value={data.second_name_ar} onChange={(e) => setData("second_name_ar", e.target.value)} className={DS_input} dir="rtl" required />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "اسم الجد" : "Grandfather Name"}</label>
                                            <input type="text" value={data.third_name_ar} onChange={(e) => setData("third_name_ar", e.target.value)} className={DS_input} dir="rtl" required />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "الاسم الأخير" : "Last Name"}</label>
                                            <input type="text" value={data.last_name_ar} onChange={(e) => setData("last_name_ar", e.target.value)} className={DS_input} dir="rtl" required />
                                        </div>
                                    </div>
                                </div>

                                {/* Names Grid - English */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-[#243460] pb-2">
                                        {isRTL ? "الاسم بناءً على الهوية (إنجليزي)" : "Official Dossier Name (English)"}
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "الاسم الأول" : "First Name"}</label>
                                            <input type="text" value={data.first_name_en} onChange={(e) => setData("first_name_en", e.target.value)} className={DS_input} dir="ltr" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "اسم الأب" : "Father Name"}</label>
                                            <input type="text" value={data.second_name_en} onChange={(e) => setData("second_name_en", e.target.value)} className={DS_input} dir="ltr" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "اسم الجد" : "Grandfather Name"}</label>
                                            <input type="text" value={data.third_name_en} onChange={(e) => setData("third_name_en", e.target.value)} className={DS_input} dir="ltr" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "الاسم الأخير" : "Last Name"}</label>
                                            <input type="text" value={data.last_name_en} onChange={(e) => setData("last_name_en", e.target.value)} className={DS_input} dir="ltr" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div initial={{ opacity: 0, x: isRTL ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                {/* Contact & Preferences */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] border-b border-gray-100 dark:border-[#243460] pb-2">
                                        {isRTL ? "معلومات التواصل واللغة" : "Contact & Preferences"}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "رقم الجوال" : "Primary Phone"}</label>
                                            <input type="text" value={data.phone} onChange={(e) => setData("phone", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" placeholder="5X XXX XXXX" required />
                                            <InputError message={errors.phone} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "البريد الإلكتروني" : "Email Address"}</label>
                                            <input type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} className={DS_input} dir="ltr" required />
                                            <InputError message={errors.email} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "اللغة المفضلة" : "Preferred Language"}</label>
                                            <select value={data.preferred_language} onChange={(e) => setData("preferred_language", e.target.value)} className={DS_select} dir={isRTL ? "rtl" : "ltr"}>
                                                <option value="ar">{isRTL ? "العربية" : "Arabic"}</option>
                                                <option value="en">{isRTL ? "الإنجليزية" : "English"}</option>
                                            </select>
                                            <InputError message={errors.preferred_language} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 mt-4">
                                        <label className={DS_label}>{isRTL ? "العنوان" : "Registered Address"}</label>
                                        <input type="text" value={data.address} onChange={(e) => setData("address", e.target.value)} className={DS_input} dir={isRTL ? "rtl" : "ltr"} />
                                    </div>
                                </div>

                                {/* Operational Data */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] border-b border-gray-100 dark:border-[#243460] pb-2">
                                        {isRTL ? "البيانات الوظيفية" : "Operational Data"}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "الرقم المدني / الإقامة" : "Civil ID / Iqama"}</label>
                                            <input type="text" value={data.national_id} onChange={(e) => setData("national_id", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required />
                                            <InputError message={errors.national_id} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "الحالة" : "Operational Status"}</label>
                                            <select value={data.status} onChange={(e) => setData("status", e.target.value)} className={DS_select} required>
                                                <option value="Active">{isRTL ? "نشط" : "Active"}</option>
                                                <option value="Inactive">{isRTL ? "غير نشط" : "Inactive"}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className={DS_modalFooter(isRTL)}>
                        {currentStep === 2 && (
                            <button type="button" onClick={() => setCurrentStep(1)} className={DS_btnSecondary}>
                                {isRTL ? "رجوع" : "Back"}
                            </button>
                        )}
                        <div className="ml-auto flex items-center gap-3">
                            <button type="button" onClick={closeModal} className="text-xs font-bold text-gray-400 hover:text-[#0f2044] transition-colors">
                                {isRTL ? "إلغاء" : "Cancel"}
                            </button>
                            {currentStep === 1 ? (
                                <button type="button" onClick={(e) => { e.preventDefault(); setCurrentStep(2); }} className={DS_btnPrimary}>
                                    {isRTL ? "متابعة" : "Continue"} <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button type="submit" disabled={processing} className={DS_btnGold}>
                                    {processing && <Loader2 size={16} className="animate-spin" />}
                                    {isEditing ? (isRTL ? "حفظ التعديلات" : "Finalize Changes") : (isRTL ? "تسجيل المشرف" : "Enroll Supervisor")}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </Modal>

        {/* --- Import Modal --- */}
        <Modal show={isImportModalOpen} onClose={() => { setIsImportModalOpen(false); resetImport(); }} maxWidth="md">
            <div className={DS_modalContainer}>
                <div className={DS_modalHeader(isRTL)}>
                    <div className="flex items-center gap-3">
                        <div className={DS_modalHeaderAccent} />
                        <h3 className={DS_modalHeaderTitle}>
                            {isRTL ? "استيراد المشرفين الميدانيين (Excel)" : "Import Field Supervisors (Excel)"}
                        </h3>
                    </div>
                    <button onClick={() => { setIsImportModalOpen(false); resetImport(); }} className={DS_modalClose}>
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    postImport(route('admin.field-supervisors.import'), {
                        forceFormData: true,
                        onSuccess: () => { setIsImportModalOpen(false); resetImport(); }
                    });
                }}>
                    <div className={DS_modalBody}>
                        <div className="space-y-6">
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <p className="text-sm font-bold text-[#0f2044]">
                                    {isRTL ? "يرجى تحميل القالب المخصص وتعبئته بالبيانات ثم إعادة رفعه هنا." : "Please download the template, fill it with data, and upload it here."}
                                </p>
                                <a href={route('admin.field-supervisors.template')} className="inline-flex items-center gap-2 mt-3 text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest underline">
                                    <Download size={14} /> {isRTL ? "تحميل القالب (Template)" : "Download Template"}
                                </a>
                            </div>

                            <div className="space-y-2">
                                <label className={DS_label}>{isRTL ? "ملف الإكسيل" : "Excel File"}</label>
                                <input 
                                    type="file" 
                                    accept=".xlsx,.xls,.csv" 
                                    onChange={e => setImportData('file', e.target.files ? e.target.files[0] : null)}
                                    className={DS_input} 
                                    required 
                                />
                                <InputError message={importErrors.file} />
                            </div>
                        </div>
                    </div>
                    <div className={DS_modalFooter(isRTL)}>
                        <div className="ml-auto flex items-center gap-3">
                            <button type="button" onClick={() => { setIsImportModalOpen(false); resetImport(); }} className="text-xs font-bold text-gray-400 hover:text-[#0f2044]">
                                {isRTL ? "إلغاء" : "Cancel"}
                            </button>
                            <button type="submit" disabled={importProcessing} className={DS_btnGold}>
                                {isRTL ? "رفع واستيراد" : "Upload & Import"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>

      </div>
    </AuthenticatedLayout>
  );
}

// ─── Sub-Components ───────────────────────────────────────

function FSStatCard({ label, value, icon, color, isDark, isRTL }: any) {
  return null; // Removed in favor of DS_statCard
}

function InfoRow({ icon, label, value, isDark, highlight = false }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded-lg ${highlight ? "bg-rose-500/10 text-rose-500" : isDark ? "bg-gray-800 text-gray-500" : "bg-[#0f2044]/5 text-[#0f2044]"}`}>
          {icon}
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <span className={`text-xs font-black ${highlight ? "text-rose-500" : isDark ? "text-gray-200" : "text-[#0f2044]"} font-mono`}>
        {value}
      </span>
    </div>
  );
}

