import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
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
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, 
    User,
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
    Printer,
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
  last_name_ar: string;
  first_name_en: string | null;
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
    id_card_front_image: string | null;
    id_card_back_image: string | null;
  } | null;
  image?: string | null;
  address?: string | null;
  id_card_front_image?: string | null;
  id_card_back_image?: string | null;
  assigned_bus_as_assistant: AssignedBus | null;
  preferred_language?: string;
}

export const getAssistantName = (assistant: Assistant, isArabic?: boolean) => {
  const isAr = isArabic !== undefined ? isArabic : (document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl');
  const arName = [assistant.first_name_ar, assistant.last_name_ar].filter(Boolean).join(' ') || assistant.name;
  const enName = [assistant.first_name_en, assistant.last_name_en].filter(Boolean).join(' ') || assistant.name_en;
  
  if (isAr) {
    return arName || enName || assistant.email;
  } else {
    return enName || arName || assistant.email;
  }
};

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { data: importData, setData: setImportData, post: postImport, processing: importProcessing, errors: importErrors, reset: resetImport } = useForm({ file: null as File | null });
  const flash = usePage().props.flash as any;
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewIdCardFront, setPreviewIdCardFront] = useState<string | null>(null);
  const [previewIdCardBack, setPreviewIdCardBack] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);

  // --- Form ---
  const { data, setData, post, processing, errors, reset, clearErrors } =
    useForm({
      _method: "post" as "post" | "put",
      first_name_ar: "",
      last_name_ar: "",
      first_name_en: "",
      last_name_en: "",
      national_id: "",
      email: "",
      phone: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      status: "active",
      address: "",
      preferred_language: "ar",
      image: null as File | null,
      id_card_front_image: null as File | null,
      id_card_back_image: null as File | null,
      remove_image: false,
      remove_id_card_front_image: false,
      remove_id_card_back_image: false,
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
    setPreviewIdCardFront(null);
    setPreviewIdCardBack(null);
    reset();
    setData("_method", "post");
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (assistant: Assistant) => {
    setIsEditing(true);
    setCurrentId(assistant.id);
    setPreviewImage(assistant.image ? `/storage/${assistant.image}` : null);
    const idFront = assistant.assistant?.id_card_front_image || assistant.id_card_front_image;
    setPreviewIdCardFront(idFront ? `/storage/${idFront}` : null);
    const idBack = assistant.assistant?.id_card_back_image || assistant.id_card_back_image;
    setPreviewIdCardBack(idBack ? `/storage/${idBack}` : null);
    setData({
      _method: "put",
      first_name_ar: assistant.first_name_ar || "",
      last_name_ar: assistant.last_name_ar || "",
      first_name_en: assistant.first_name_en || "",
      last_name_en: assistant.last_name_en || "",
      national_id: assistant.national_id || "",
      email: assistant.email || "",
      phone: assistant.phone || "",
      emergency_contact_name: assistant.assistant?.emergency_contact_name || "",
      emergency_contact_phone: assistant.assistant?.emergency_contact_phone || "",
      status: assistant.assistant?.status === "active" ? "active" : "inactive",
      address: assistant.address || "",
      preferred_language: assistant.preferred_language || "ar",
      image: null,
      id_card_front_image: null,
      id_card_back_image: null,
      remove_image: false,
      remove_id_card_front_image: false,
      remove_id_card_back_image: false,
    });
    clearErrors();
    setIsModalOpen(true);
  };

  const openDetailsModal = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null);
    setPreviewIdCardFront(null);
    setPreviewIdCardBack(null);
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

  const handlePrint = () => {
    const url = route("admin.assistants.print-all", {
      status: filters.status,
      search: filters.search,
      lang: isRTL ? "ar" : "en",
    });
    window.open(url, "PrintAllAssistants", "width=1200,height=800,scrollbars=yes,status=yes,resizable=yes");
  };

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
        header: () => <div className={isRTL ? "text-right" : "text-left"}>{isRTL ? "المشرفة" : "Supervisor"}</div>,
        cell: (info) => {
          const assistant = info.row.original;
          const displayName = getAssistantName(assistant, isRTL);
          const arName = [assistant.first_name_ar, assistant.last_name_ar].filter(Boolean).join(' ') || assistant.name;
          const enName = [assistant.first_name_en, assistant.last_name_en].filter(Boolean).join(' ') || assistant.name_en;
          const alternateName = isRTL ? enName : arName;
              
          return (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-[#0f2044]/10 dark:bg-[#0f2044]/40 text-[#0f2044] dark:text-[#f5b800] flex items-center justify-center font-black text-sm overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
                {assistant.image ? (
                  <img
                    src={`/storage/${assistant.image}`}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName.charAt(0)
                )}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"} tracking-tight`}>
                  {displayName}
                </span>
                {alternateName && alternateName !== displayName && (
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                    {alternateName}
                  </span>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("national_id", {
        header: () => <div className={isRTL ? "text-right" : "text-left"}>{isRTL ? "الرقم المدني" : "ID / Code"}</div>,
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
        header: () => <div className={isRTL ? "text-right" : "text-left"}>{isRTL ? "الاتصال" : "Contact"}</div>,
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
      columnHelper.accessor("preferred_language", {
        header: () => <div className={isRTL ? "text-right" : "text-left"}>{isRTL ? "اللغة المفضلة" : "Language"}</div>,
        cell: (info) => {
          const lang = info.row.original.preferred_language || "ar";
          return (
            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700">
              {lang === "en" ? (isRTL ? "الإنجليزية" : "English") : (isRTL ? "العربية" : "Arabic")}
            </span>
          );
        },
      }),
      columnHelper.accessor("assigned_bus_as_assistant", {
        header: () => <div className={isRTL ? "text-right" : "text-left"}>{isRTL ? "الباص المُعيَّن" : "Assigned Bus"}</div>,
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
        header: () => <div className={isRTL ? "text-right" : "text-left"}>{isRTL ? "الحالة" : "Status"}</div>,
        cell: (info) => {
            const status = info.getValue() || "N/A";
            return <StatusBadge status={status.toLowerCase() === "active" ? "active" : "inactive"} />;
        }
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className={isRTL ? "text-right" : "text-left"}>{isRTL ? "الإجراءات" : "Actions"}</div>,
        cell: (info) => {
          const assistant = info.row.original;
          return (
            <div className="flex items-center gap-1.5">
              <ActionButton
                label={isRTL ? "عرض" : "View"}
                onClick={() => openDetailsModal(assistant)}
                color="blue"
                icon={<Eye size={15} />}
              />
              <ActionButton
                label={isRTL ? "تعديل" : "Edit"}
                onClick={() => openEditModal(assistant)}
                color="indigo"
                icon={<Edit2 size={15} />}
              />
              <ActionButton
                label={isRTL ? "حذف" : "Delete"}
                onClick={() => deleteAssistant(assistant.id)}
                color="red"
                icon={<Trash2 size={15} />}
              />
              <ActionButton
                label={isRTL ? "طباعة البطاقة" : "Print Card"}
                onClick={() => {
                    toast.info(isRTL ? "جاري تحضير بطاقة المشرفة..." : "Preparing assistant card for print...");
                    const url = route("admin.assistants.print", assistant.id);
                    window.open(url, "PrintAssistantCard", "width=1000,height=800,scrollbars=yes,status=yes,resizable=yes");
                }}
                color="yellow"
                icon={<Printer size={15} />}
              />
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
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الرقم المدني" : "ID"}</th>
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
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
                exportEnabled={false}
                headerAction={
                    <div className="flex items-center gap-2">
                        <button onClick={openAddModal} className={DS_btnGold}>
                            <Plus size={16} />
                            <span className="hidden sm:inline">{isRTL ? "مشرفة جديدة" : "New Supervisor"}</span>
                        </button>
                        <button onClick={() => setIsImportModalOpen(true)} className={DS_btnSecondary}>
                            <Upload size={16} />
                            <span className="hidden sm:inline">{isRTL ? "استيراد" : "Import"}</span>
                        </button>
                        <a href={route("admin.assistants.export")} className={DS_btnSecondary}>
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
            {showDetailsModal && selectedAssistant && (
                <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="3xl">
                    <div className={DS_modalContainer}>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {/* Dossier Header */}
                            <div className="relative h-48 shrink-0 bg-[#0f2044] overflow-hidden">
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
                                        {(isRTL ? (selectedAssistant.name || selectedAssistant.name_en) : (selectedAssistant.name_en || selectedAssistant.name)).charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-16 pb-10 px-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 dark:border-[#243460] pb-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-[#0f2044] dark:text-white tracking-tighter">
                                        {isRTL ? (selectedAssistant.name || selectedAssistant.name_en) : (selectedAssistant.name_en || selectedAssistant.name)}
                                    </h2>
                                    <p className="text-lg font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        {(() => {
                                            const altName = isRTL ? selectedAssistant.name_en : selectedAssistant.name;
                                            const displayName = isRTL ? (selectedAssistant.name || selectedAssistant.name_en) : (selectedAssistant.name_en || selectedAssistant.name);
                                            return altName && altName !== displayName ? altName : "";
                                        })()}
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
                                        <InfoRow icon={<CreditCard size={14} />} label={isRTL ? "الرقم المدني" : "Civil ID"} value={selectedAssistant.national_id} isDark={isDark} />
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

                            {/* Media Assets */}
                            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-[#243460]">
                                <h3 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] mb-6">{isRTL ? "المستندات والصور" : "Documentary Evidence"}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <MediaCard label={isRTL ? "الهوية (أمام)" : "ID Card Front"} src={selectedAssistant.id_card_front_image || selectedAssistant.assistant?.id_card_front_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الهوية (خلف)" : "ID Card Back"} src={selectedAssistant.id_card_back_image || selectedAssistant.assistant?.id_card_back_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "صورة المسح" : "Scan Reference"} src={selectedAssistant.image} isDark={isDark} isRTL={isRTL} />
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
                            {isEditing ? (isRTL ? "تحديث ملف المشرفة" : "Update Supervisor Dossier") : (isRTL ? "تسجيل مشرفة حافلة جديدة" : "Enroll New Bus Supervisor")}
                        </h3>
                    </div>
                    <button onClick={closeModal} className={DS_modalClose}>
                        <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
                    </button>
                </div>

                <form onSubmit={submit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 max-h-[78vh]">
                        {/* §1 The Names */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#243460] pb-2">
                                <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] flex items-center gap-2">
                                    <Users size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                                    {isRTL ? "الأسماء الرسمية" : "Official Names"}
                                </h4>
                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">
                                    {isRTL ? "* مطلوب عربي أو إنجليزي" : "* Req: Arabic or English"}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Arabic Panel */}
                                <div className="p-3 bg-gray-50/50 dark:bg-[#0f2044]/10 rounded-xl border border-gray-100/80 dark:border-[#243460]/40 space-y-3">
                                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider">{isRTL ? "البيانات بالعربية" : "ARABIC DOSSIER"}</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "الاسم الأول" : "First Name"} {!data.first_name_en && !data.last_name_en && <span className="text-rose-500">*</span>}</label>
                                            <input type="text" value={data.first_name_ar} onChange={e => setData("first_name_ar", e.target.value)} className={DS_input} dir="rtl" required={!data.first_name_en && !data.last_name_en} />
                                            <InputError message={errors.first_name_ar} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "الاسم الأخير" : "Last Name"} {!data.first_name_en && !data.last_name_en && <span className="text-rose-500">*</span>}</label>
                                            <input type="text" value={data.last_name_ar} onChange={e => setData("last_name_ar", e.target.value)} className={DS_input} dir="rtl" required={!data.first_name_en && !data.last_name_en} />
                                            <InputError message={errors.last_name_ar} />
                                        </div>
                                    </div>
                                </div>
                                {/* English Panel */}
                                <div className="p-3 bg-gray-50/50 dark:bg-[#0f2044]/10 rounded-xl border border-gray-100/80 dark:border-[#243460]/40 space-y-3">
                                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider">{isRTL ? "البيانات بالإنجليزية" : "ENGLISH DOSSIER"}</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "الاسم الأول" : "First Name"} {!data.first_name_ar && !data.last_name_ar && <span className="text-rose-500">*</span>}</label>
                                            <input type="text" value={data.first_name_en} onChange={e => setData("first_name_en", e.target.value)} className={DS_input} dir="ltr" required={!data.first_name_ar && !data.last_name_ar} />
                                            <InputError message={errors.first_name_en} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "الاسم الأخير" : "Last Name"} {!data.first_name_ar && !data.last_name_ar && <span className="text-rose-500">*</span>}</label>
                                            <input type="text" value={data.last_name_en} onChange={e => setData("last_name_en", e.target.value)} className={DS_input} dir="ltr" required={!data.first_name_ar && !data.last_name_ar} />
                                            <InputError message={errors.last_name_en} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* §2 Personal Identity & Employment */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-2 flex items-center gap-2">
                                <CreditCard size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                                {isRTL ? "الهوية الشخصية والمرفقات" : "Personal Identity & Documents"}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Col: Inputs & Profile photo */}
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "الرقم المدني / الإقامة" : "Civil ID / Iqama"} <span className="text-rose-500">*</span></label>
                                            <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required />
                                            <InputError message={errors.national_id} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "رقم الجوال" : "Phone Number"} <span className="text-rose-500">*</span></label>
                                            <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" placeholder="5XXXXXXXX" required />
                                            <InputError message={errors.phone} />
                                        </div>
                                    </div>


                                    {/* Profile photo upload directly next/under */}
                                    <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-[#243460] flex items-center justify-center overflow-hidden bg-white dark:bg-[#0f2044] flex-shrink-0 relative group">
                                            {data.image ? (
                                                <>
                                                    <img src={URL.createObjectURL(data.image)} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => setData("image", null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X size={12} className="text-white" />
                                                    </button>
                                                </>
                                            ) : previewImage ? (
                                                <>
                                                    <img src={previewImage} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => {
                                                        setPreviewImage(null);
                                                        setData("remove_image", true);
                                                    }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X size={12} className="text-white" />
                                                    </button>
                                                </>
                                            ) : (
                                                <User size={16} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold text-[#0f2044] dark:text-white leading-tight">{isRTL ? "الصورة الشخصية" : "Profile Photo"}</p>
                                            {!data.image && !previewImage ? (
                                                <label className="cursor-pointer text-[9px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline mt-0.5 inline-block">
                                                    {isRTL ? "اختيار صورة" : "Choose Photo"}
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                        const file = e.target.files?.[0] || null;
                                                        setData({ ...data, image: file, remove_image: false });
                                                    }} />
                                                </label>
                                            ) : (
                                                <span className="text-[9px] font-black text-gray-400 mt-0.5 inline-block uppercase">{isRTL ? "مرفق ✓" : "Attached ✓"}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col: Media Uploads */}
                                <div className="space-y-2">
                                    <div className="p-3 bg-gray-50/50 dark:bg-[#0f2044]/10 rounded-xl border border-gray-100/80 dark:border-[#243460]/40 space-y-2 h-full flex flex-col justify-between">
                                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2 block">{isRTL ? "المرفقات الثبوتية" : "DOCUMENTS"}</span>
                                        
                                        {/* ID Card Front */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-8 rounded border border-gray-200 dark:border-[#243460] flex items-center justify-center overflow-hidden bg-white dark:bg-[#0f2044] flex-shrink-0 relative group">
                                                {data.id_card_front_image ? (
                                                    <>
                                                        <img src={URL.createObjectURL(data.id_card_front_image)} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setData("id_card_front_image", null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} className="text-white" /></button>
                                                    </>
                                                ) : previewIdCardFront ? (
                                                    <>
                                                        <img src={previewIdCardFront} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => { setPreviewIdCardFront(null); setData("remove_id_card_front_image", true); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} className="text-white" /></button>
                                                    </>
                                                ) : <CreditCard size={12} className="text-gray-400 dark:text-[#7ba7e8]/60" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-[#0f2044] dark:text-white leading-tight">{isRTL ? "صورة الهوية (الوجه)" : "ID Card Front"}</p>
                                                {!data.id_card_front_image && !previewIdCardFront && (
                                                    <label className="cursor-pointer text-[9px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline mt-0.5 inline-block">
                                                        {isRTL ? "رفع الملف" : "Upload"} <input type="file" className="hidden" accept="image/*" onChange={e => setData({ ...data, id_card_front_image: e.target.files?.[0] || null, remove_id_card_front_image: false })} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        {/* ID Card Back */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-8 rounded border border-gray-200 dark:border-[#243460] flex items-center justify-center overflow-hidden bg-white dark:bg-[#0f2044] flex-shrink-0 relative group">
                                                {data.id_card_back_image ? (
                                                    <>
                                                        <img src={URL.createObjectURL(data.id_card_back_image)} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => setData("id_card_back_image", null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} className="text-white" /></button>
                                                    </>
                                                ) : previewIdCardBack ? (
                                                    <>
                                                        <img src={previewIdCardBack} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => { setPreviewIdCardBack(null); setData("remove_id_card_back_image", true); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} className="text-white" /></button>
                                                    </>
                                                ) : <CreditCard size={12} className="text-gray-400 dark:text-[#7ba7e8]/60" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-[#0f2044] dark:text-white leading-tight">{isRTL ? "صورة الهوية (الخلف)" : "ID Card Back"}</p>
                                                {!data.id_card_back_image && !previewIdCardBack && (
                                                    <label className="cursor-pointer text-[9px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline mt-0.5 inline-block">
                                                        {isRTL ? "رفع الملف" : "Upload"} <input type="file" className="hidden" accept="image/*" onChange={e => setData({ ...data, id_card_back_image: e.target.files?.[0] || null, remove_id_card_back_image: false })} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* §3 Contact & Emergency */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-2 flex items-center gap-2">
                                <Briefcase size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                                {isRTL ? "جهات اتصال الطوارئ والحالة" : "Emergency & Status"}
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3 p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                                    <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{isRTL ? "بروتوكول الطوارئ" : "Emergency Protocol"}</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "اسم جهة الطوارئ" : "Contact Name"}</label>
                                            <input type="text" value={data.emergency_contact_name} onChange={e => setData("emergency_contact_name", e.target.value)} className={DS_input} />
                                            <InputError message={errors.emergency_contact_name} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "رقم الطوارئ" : "Emergency Phone"}</label>
                                            <input type="text" value={data.emergency_contact_phone} onChange={e => setData("emergency_contact_phone", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" />
                                            <InputError message={errors.emergency_contact_phone} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "اللغة المفضلة" : "Preferred Language"}</label>
                                            <select value={data.preferred_language} onChange={(e) => setData("preferred_language", e.target.value)} className={DS_select} dir={isRTL ? "rtl" : "ltr"}>
                                                <option value="ar">{isRTL ? "العربية" : "Arabic"}</option>
                                                <option value="en">{isRTL ? "الإنجليزية" : "English"}</option>
                                            </select>
                                            <InputError message={errors.preferred_language} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "الحالة" : "Operational Status"} <span className="text-rose-500">*</span></label>
                                            <select value={data.status} onChange={e => setData("status", e.target.value)} className={DS_select} required>
                                                <option value="active">{isRTL ? "نشط" : "Active"}</option>
                                                <option value="inactive">{isRTL ? "غير نشط" : "Inactive"}</option>
                                            </select>
                                            <InputError message={errors.status} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "البريد الإلكتروني" : "Email Address"}</label>
                                            <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} className={DS_input} dir="ltr" />
                                            <InputError message={errors.email} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "العنوان السكني" : "Registered Address"}</label>
                                            <input type="text" value={data.address} onChange={e => setData("address", e.target.value)} className={DS_input} />
                                            <InputError message={errors.address} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className={DS_modalFooter(isRTL)}>
                        <div className="ml-auto flex items-center gap-3">
                            <button type="button" onClick={closeModal} className="text-xs font-bold text-gray-400 hover:text-[#0f2044] transition-colors">
                                {isRTL ? "إلغاء" : "Cancel"}
                            </button>
                            <button type="submit" disabled={processing} className={DS_btnGold}>
                                {processing && <Loader2 size={16} className="animate-spin" />}
                                {isEditing ? (isRTL ? "حفظ التعديلات" : "Finalize Changes") : (isRTL ? "تسجيل المشرفة" : "Enroll Supervisor")}
                            </button>
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
                            {isRTL ? "استيراد المشرفات (Excel)" : "Import Supervisors (Excel)"}
                        </h3>
                    </div>
                    <button onClick={() => { setIsImportModalOpen(false); resetImport(); }} className={DS_modalClose}>
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    postImport(route('admin.assistants.import'), {
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
                                <a href={route('admin.assistants.template')} className="inline-flex items-center gap-2 mt-3 text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest underline">
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

function MediaCard({ label, src, isDark, isRTL }: any) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
        {label}
      </span>
      <div className={`aspect-video rounded-2xl overflow-hidden border-2 ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"} group relative`}>
        {src ? (
          <a href={`/storage/${src}`} target="_blank" rel="noreferrer" className="w-full h-full block">
            <img src={`/storage/${src}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-[#0f2044]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Eye className="text-white" size={24} />
            </div>
          </a>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-300 uppercase italic">
            {isRTL ? "لا يوجد بيانات" : "No Data"}
          </div>
        )}
      </div>
    </div>
  );
}
