import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import { useTheme } from "@/Contexts/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import BaseDataTable, {
  ActionButton,
  StatusBadge,
  type FilterTab,
  type PaginationMeta,
} from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, 
    CheckCircle2, 
    Bus as BusIcon, 
    UserCog, 
    Plus, 
    Eye, 
    Edit2, 
    Trash2, 
    X, 
    ArrowLeft, 
    ChevronRight,
    Phone,
    Mail,
    MapPin,
    ShieldCheck,
    Briefcase,
    CreditCard,
    AlertCircle,
    Printer
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
    DS_btnEdit
} from "@/lib/DS";
import PrintReportHeader from "@/Components/PrintReportHeader";

// ─── Print CSS ──────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #assistants-print-area, #assistants-print-area * { visibility: visible !important; }
  #assistants-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

// ─── Types ───────────────────────────────────────────────────────

interface AssignedBus {
  id: number;
  bus_number: string;
  school: { id: number; name: string } | null;
}

interface Assistant {
  id: number;
  first_name_ar: string;
  second_name_ar: string;
  third_name_ar: string;
  last_name_ar: string;
  first_name_en: string | null;
  second_name_en: string | null;
  third_name_en: string | null;
  last_name_en: string | null;
  name: string;
  name_en: string | null;
  email: string;
  phone: string;
  national_id: string;
  user_code: string;
  school_id: number | null;
  assistant: {
    emergency_contact_name: string;
    emergency_contact_phone: string;
    status: string;
  } | null;
  image?: string | null;
  address?: string | null;
  assigned_bus_as_assistant: AssignedBus | null;
}

interface Props {
  auth: any;
  assistants: {
    data: Assistant[];
    links: PaginationMeta["links"];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  counts: {
    all: number;
    assigned: number;
    available: number;
  };
  filters: {
    search: string;
    status: string;
  };
}

// ─── Component ───────────────────────────────────────────────────

export default function AssistantsIndex({ auth, assistants, counts, filters }: Props) {
  const { isRTL, theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  // --- State ---
  const [search, setSearch] = useState(filters.search);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);

  // --- Form ---
  const { data, setData, post, processing, errors, reset, clearErrors } =
    useForm({
      _method: "post" as "post" | "put",
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
      emergency_contact_name: "",
      emergency_contact_phone: "",
      status: "active",
      address: "",
      image: null as File | null,
    });

  // --- Handlers ---
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.get(
          route("admin.assistants.index"),
          {
            search: value,
            status: filters.status === "all" ? undefined : filters.status,
          },
          { preserveState: true, replace: true }
        );
      }, 300),
    [filters.status]
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (key: string) => {
    router.get(
      route("admin.assistants.index"),
      { search: filters.search, status: key === "all" ? undefined : key },
      { preserveState: true, replace: true }
    );
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setPreviewImage(null);
    reset();
    setData("_method", "post");
    clearErrors();
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const openEditModal = (assistant: Assistant) => {
    setIsEditing(true);
    setCurrentId(assistant.id);
    setPreviewImage(assistant.image ? `/storage/${assistant.image}` : null);
    setData({
      _method: "put",
      first_name_ar: assistant.first_name_ar || "",
      second_name_ar: assistant.second_name_ar || "",
      third_name_ar: assistant.third_name_ar || "",
      last_name_ar: assistant.last_name_ar || "",
      first_name_en: assistant.first_name_en || "",
      second_name_en: assistant.second_name_en || "",
      third_name_en: assistant.third_name_en || "",
      last_name_en: assistant.last_name_en || "",
      national_id: assistant.national_id || "",
      email: assistant.email || "",
      phone: assistant.phone || "",
      emergency_contact_name: assistant.assistant?.emergency_contact_name || "",
      emergency_contact_phone: assistant.assistant?.emergency_contact_phone || "",
      status: assistant.assistant?.status === "active" ? "active" : "inactive",
      address: assistant.address || "",
      image: null,
    });
    clearErrors();
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const openDetailsModal = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentId) {
      post(route("admin.assistants.update", currentId), {
        forceFormData: true,
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("admin.assistants.store"), { onSuccess: () => closeModal() });
    }
  };

  const deleteAssistant = (id: number) => {
    if (confirm(isRTL ? "هل أنت متأكد من حذف هذه المشرفة؟" : "Are you sure?")) {
      router.delete(route("admin.assistants.destroy", id));
    }
  };

  const handlePrint = () => window.print();

  // --- Filter Tabs ---
  const filterTabs: FilterTab[] = [
    { key: "all", label: isRTL ? "الكل" : "All", count: counts.all },
    {
      key: "available",
      label: isRTL ? "متاح" : "Available",
      count: counts.available,
      dotColor: "bg-emerald-400",
    },
    {
      key: "assigned",
      label: isRTL ? "محجوز" : "Assigned",
      count: counts.assigned,
      dotColor: "bg-amber-400",
    },
  ];

  // --- Columns ---
  const columnHelper = createColumnHelper<Assistant>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: isRTL ? "المشرفة" : "Supervisor",
        cell: (info) => {
          const assistant = info.row.original;
          return (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-[#0f2044]/10 dark:bg-[#0f2044]/40 text-[#0f2044] dark:text-[#f5b800] flex items-center justify-center font-black text-sm overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
                {assistant.image ? (
                  <img
                    src={`/storage/${assistant.image}`}
                    alt={assistant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  assistant.name.charAt(0)
                )}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"} tracking-tight`}>
                  {assistant.name}
                </span>
                {assistant.name_en && (
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                    {assistant.name_en}
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
          const assistant = info.row.original;
          return (
            <div className="flex flex-col">
              <span className={`text-sm font-black ${isDark ? "text-gray-300" : "text-[#0f2044]"} font-mono`}>
                {assistant.national_id || "—"}
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase">
                {assistant.user_code}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("phone", {
        header: isRTL ? "الاتصال" : "Contact",
        cell: (info) => {
          const assistant = info.row.original;
          return (
            <div className="flex flex-col">
              <span className={`text-sm font-black ${isDark ? "text-gray-300" : "text-[#0f2044]"} font-mono`}>
                {assistant.phone}
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate max-w-[150px]">
                {assistant.email}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("assigned_bus_as_assistant", {
        header: isRTL ? "الباص المُعيَّن" : "Assigned Bus",
        cell: (info) => {
          const bus = info.getValue() as AssignedBus | null;
          return bus ? (
            <div className="flex flex-col gap-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-black border border-amber-100 dark:border-amber-900/30 uppercase">
                <BusIcon size={12} /> {bus.bus_number}
              </span>
              {bus.school && (
                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 px-1">
                  {bus.school.name}
                </span>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-100 dark:border-emerald-900/30 uppercase">
              <CheckCircle2 size={12} /> {isRTL ? "متاح" : "Available"}
            </span>
          );
        },
      }),
      columnHelper.accessor("assistant.status", {
        header: isRTL ? "الحالة" : "Status",
        cell: (info) => {
            const status = info.getValue() || "N/A";
            return <StatusBadge status={status.toLowerCase() === "active" ? "active" : "inactive"} />;
        }
      }),
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
          const assistant = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => openDetailsModal(assistant)}
                className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                title={isRTL ? "عرض" : "View"}
              >
                <Eye size={16} />
              </button>
              <button 
                onClick={() => openEditModal(assistant)}
                className={DS_btnEdit}
                title={isRTL ? "تعديل" : "Edit"}
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => deleteAssistant(assistant.id)}
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
    [isRTL, isDark, openEditModal]
  );

  const pagination: PaginationMeta = {
    links: assistants.links,
    current_page: assistants.current_page,
    last_page: assistants.last_page,
    per_page: assistants.per_page,
    total: assistants.total,
    from: assistants.from,
    to: assistants.to,
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={isRTL ? "إدارة مشرفات الحافلات" : "Bus Supervisors Management"} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area (Unified System) ── */}
      <div id="assistants-print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
        <PrintReportHeader
          title={isRTL ? "تقرير بيانات مشرفات الحافلات" : "Bus Supervisors Operational Report"}
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
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "المشرفة" : "Supervisor"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "رقم الهوية" : "ID"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الجوال" : "Phone"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "البريد الإلكتروني" : "Email"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الوحدة" : "Unit"}</th>
              </tr>
            </thead>
            <tbody>
              {assistants.data.map((asst, i) => (
                <tr key={asst.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center text-gray-700">{i + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{asst.name}</td>
                  <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{asst.national_id}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{asst.phone}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{asst.email}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{asst.assigned_bus_as_assistant?.bus_number || (isRTL ? "غير محدد" : "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{isRTL ? "إجمالي الكادر" : "Total Force"}: {assistants.data.length}</p>
            <p>{isRTL ? "التوقيع الرسمي" : "Official Signature"}: ............................</p>
          </div>
        </div>
      </div>

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex flex-col">
                <h1 className={DS_pageTitle}>
                    {isRTL ? "إدارة الأسطول: مشرفات الحافلات" : "Fleet Management: Bus Supervisors"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {assistants.total} {isRTL ? "مشرفة مسجلة" : "Supervisors Enrolled"}
                    </span>
                </div>
            </div>
        </div>

        {/* Intelligence Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={DS_statCard('blue')}>
                <div className={DS_statIcon('blue')}><Users size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "إجمالي المشرفات" : "Total Supervisors"}</p>
                    <p className={DS_statValue2('blue')}>{counts.all}</p>
                </div>
            </div>
            <div className={DS_statCard('green')}>
                <div className={DS_statIcon('green')}><CheckCircle2 size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "متاح للتعيين" : "Available"}</p>
                    <p className={DS_statValue2('green')}>{counts.available}</p>
                </div>
            </div>
            <div className={DS_statCard('gold')}>
                <div className={DS_statIcon('gold')}><BusIcon size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "على المسار" : "Assigned"}</p>
                    <p className={DS_statValue2('gold')}>{counts.assigned}</p>
                </div>
            </div>
        </div>

        {/* Action Button Section */}
        <div className="flex justify-end mb-4">
            <button 
                onClick={openAddModal}
                className={DS_btnGold}
            >
                <Plus size={18} />
                <span>{isRTL ? "إضافة مشرفة جديدة" : "Enroll New Supervisor"}</span>
            </button>
        </div>

        {/* Main Operational Table */}
        <div className={DS_card}>
            <BaseDataTable<Assistant>
                columns={columns}
                data={assistants.data}
                pagination={pagination}
                searchValue={search}
                onSearchChange={handleSearch}
                searchPlaceholder={isRTL ? "البحث في ملفات المشرفات..." : "Search supervisor dossiers..."}
                filterTabs={filterTabs}
                activeFilter={filters.status}
                onFilterChange={handleFilterChange}
                exportEnabled={true}
                headerAction={
                    <button onClick={handlePrint} className={DS_btnSecondary}>
                        <Printer size={16} />
                        <span>{isRTL ? "طباعة التقارير" : "Print Dossiers"}</span>
                    </button>
                }
            />
        </div>

        {/* --- High-End Details Modal --- */}
        <AnimatePresence>
            {showDetailsModal && selectedAssistant && (
                <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="3xl">
                    <div className={DS_modalContainer}>
                        {/* Dossier Header */}
                        <div className="relative h-48 bg-[#0f2044] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent z-10" />
                            <div className="absolute top-6 inset-x-6 flex justify-between items-center z-20">
                                <span className="px-3 py-1 bg-[#f5b800] text-[#0f2044] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    {isRTL ? "رقم الملف" : "Dossier ID"}: #{selectedAssistant.user_code}
                                </span>
                                <button onClick={() => setShowDetailsModal(false)} className={DS_modalClose}>
                                    <X size={18} />
                                </button>
                            </div>
                            
                            {/* Visual ID */}
                            <div className="absolute -bottom-10 left-10 w-32 h-32 rounded-[2rem] border-4 border-white dark:border-[#1a2845] bg-white dark:bg-[#0f2044] shadow-2xl overflow-hidden z-20">
                                {selectedAssistant.image ? (
                                    <img src={`/storage/${selectedAssistant.image}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-[#0f2044] dark:text-[#f5b800] bg-gray-50">
                                        {selectedAssistant.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-16 pb-10 px-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 dark:border-[#243460] pb-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-[#0f2044] dark:text-white tracking-tighter">
                                        {selectedAssistant.name}
                                    </h2>
                                    <p className="text-lg font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        {selectedAssistant.name_en || (isRTL ? "غير محدد" : "UNSPECIFIED")}
                                    </p>
                                    <div className="flex gap-2 mt-4">
                                        <StatusBadge status={selectedAssistant.assistant?.status === "active" ? "active" : "inactive"} />
                                        <span className="px-3 py-1 bg-[#0f2044]/5 dark:bg-[#0f2044]/40 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                            {isRTL ? "الصفة: مشرفة حافلة" : "Role: Bus Supervisor"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-[#0f2044]/30 rounded-2xl border border-gray-100 dark:border-[#243460] flex flex-col items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isRTL ? "الحافلة المعينة" : "Assigned Unit"}</span>
                                    <span className="text-xl font-black text-[#0f2044] dark:text-[#f5b800] flex items-center gap-2">
                                        <BusIcon size={20} /> {selectedAssistant.assigned_bus_as_assistant?.bus_number || (isRTL ? "لا يوجد" : "NONE")}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-10">
                                {/* Section: Personal */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Users size={16} className="text-[#f5b800]" /> {isRTL ? "الهوية الشخصية" : "Personal Identity"}
                                    </h3>
                                    <div className="space-y-4">
                                        <InfoRow icon={<CreditCard size={14} />} label={isRTL ? "رقم الهوية" : "National ID"} value={selectedAssistant.national_id} isDark={isDark} />
                                        <InfoRow icon={<Phone size={14} />} label={isRTL ? "رقم الجوال" : "Primary Phone"} value={selectedAssistant.phone} isDark={isDark} />
                                        <InfoRow icon={<Mail size={14} />} label={isRTL ? "البريد الإلكتروني" : "Email Address"} value={selectedAssistant.email} isDark={isDark} />
                                        <InfoRow icon={<MapPin size={14} />} label={isRTL ? "العنوان" : "Registered Address"} value={selectedAssistant.address || "—"} isDark={isDark} />
                                    </div>
                                </div>

                                {/* Section: Emergency */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <AlertCircle size={16} className="text-rose-500" /> {isRTL ? "بروتوكول الطوارئ" : "Emergency Protocol"}
                                    </h3>
                                    <div className="space-y-4">
                                        <InfoRow icon={<Users size={14} />} label={isRTL ? "جهة الاتصال" : "Emergency Contact"} value={selectedAssistant.assistant?.emergency_contact_name || "—"} isDark={isDark} />
                                        <InfoRow 
                                            icon={<Phone size={14} />} 
                                            label={isRTL ? "هاتف الطوارئ" : "Emergency Phone"} 
                                            value={selectedAssistant.assistant?.emergency_contact_phone || "—"} 
                                            isDark={isDark} 
                                            highlight={true}
                                        />
                                        <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10 mt-2">
                                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">{isRTL ? "مركز العمليات" : "Operation Center"}</p>
                                            <p className="text-sm font-bold text-[#0f2044] dark:text-gray-300">
                                                {selectedAssistant.assigned_bus_as_assistant?.school?.name || (isRTL ? "مشرفة مستقلة" : "Independent Supervisor")}
                                            </p>
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
        <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
            <div className={DS_modalContainer}>
                <div className={DS_modalHeader(isRTL)}>
                    <div className="flex items-center gap-3">
                        <div className={DS_modalHeaderAccent} />
                        <h3 className={DS_modalHeaderTitle}>
                            {isEditing ? (isRTL ? "تحديث ملف المشرفة" : "Update Supervisor Dossier") : (isRTL ? "تسجيل مشرفة حافلة جديدة" : "Enroll New Bus Supervisor")}
                        </h3>
                    </div>
                    <button onClick={closeModal} className={DS_modalClose}>
                        <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
                    </button>
                </div>

                {/* Tactical Stepper */}
                <div className="bg-[#0f2044]/5 dark:bg-[#0f2044]/30 px-10 py-6 border-b border-gray-100 dark:border-[#243460]">
                    <div className="relative flex items-center justify-between">
                        <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-[#243460]" />
                        <div className={`absolute left-10 top-1/2 -translate-y-1/2 h-0.5 bg-[#f5b800] transition-all duration-500`} style={{ width: currentStep === 1 ? '0%' : '100%' }} />
                        
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg transition-all ${currentStep >= 1 ? 'bg-[#f5b800] text-[#0f2044]' : 'bg-white dark:bg-[#1a2845] text-gray-400'}`}>1</div>
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg transition-all ${currentStep >= 2 ? 'bg-[#f5b800] text-[#0f2044]' : 'bg-white dark:bg-[#1a2845] text-gray-400'}`}>2</div>
                    </div>
                    <div className="flex justify-between mt-3 px-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#0f2044] dark:text-[#f5b800]">{isRTL ? "الهوية الشخصية" : "Personal Identity"}</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${currentStep === 2 ? 'text-[#0f2044] dark:text-[#f5b800]' : 'text-gray-400'}`}>{isRTL ? "بيانات العمل والطوارئ" : "Contact & Emergency"}</span>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div className={DS_modalBody}>
                        {currentStep === 1 && (
                            <motion.div initial={{ opacity: 0, x: isRTL ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                {/* Photo Upload */}
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-3xl bg-gray-100 dark:bg-[#0f2044]/40 border-2 border-dashed border-gray-200 dark:border-[#243460] flex items-center justify-center overflow-hidden">
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
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className={DS_label}>{isRTL ? "رقم الهوية / الإقامة" : "National Serial ID"}</label>
                                        <input type="text" value={data.national_id} onChange={(e) => setData("national_id", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required />
                                        <InputError message={errors.national_id} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={DS_label}>{isRTL ? "رقم الجوال" : "Primary Phone"}</label>
                                        <input type="text" value={data.phone} onChange={(e) => setData("phone", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" placeholder="5X XXX XXXX" required />
                                        <InputError message={errors.phone} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={DS_label}>{isRTL ? "البريد الإلكتروني" : "Primary Email"}</label>
                                        <input type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} className={DS_input} dir="ltr" required />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={DS_label}>{isRTL ? "الحالة" : "Operational Status"}</label>
                                        <select value={data.status} onChange={(e) => setData("status", e.target.value)} className={DS_input} required>
                                            <option value="active">{isRTL ? "نشط" : "Active"}</option>
                                            <option value="inactive">{isRTL ? "غير نشط" : "Inactive"}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className={DS_label}>{isRTL ? "العنوان" : "Registered Address"}</label>
                                    <input type="text" value={data.address} onChange={(e) => setData("address", e.target.value)} className={DS_input} />
                                </div>

                                <div className="p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-4">
                                    <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{isRTL ? "جهات اتصال الطوارئ" : "Emergency Contact Protocol"}</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "اسم جهة الطوارئ" : "Contact Name"}</label>
                                            <input type="text" value={data.emergency_contact_name} onChange={(e) => setData("emergency_contact_name", e.target.value)} className={DS_input} required />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className={DS_label}>{isRTL ? "رقم هاتف الطوارئ" : "Emergency Phone"}</label>
                                            <input type="text" value={data.emergency_contact_phone} onChange={(e) => setData("emergency_contact_phone", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required />
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
                                <button type="button" onClick={() => setCurrentStep(2)} className={DS_btnPrimary}>
                                    {isRTL ? "متابعة" : "Continue"} <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button type="submit" disabled={processing} className={DS_btnGold}>
                                    {isEditing ? (isRTL ? "حفظ التعديلات" : "Finalize Changes") : (isRTL ? "تسجيل المشرفة" : "Enroll Supervisor")}
                                </button>
                            )}
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
