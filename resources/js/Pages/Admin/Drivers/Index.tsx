import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, Link, usePage } from "@inertiajs/react";
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
  CheckCircle2,
  Bus as BusIcon,
  UserCheck,
  Eye,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Plus,
  ArrowLeft,
  Search,
  ChevronRight,
  ChevronLeft,
  Printer,
  Edit2,
  Trash2,
  ShieldCheck,
  Briefcase,
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
    DS_btnEdit
} from "@/lib/DS";
import PrintReportHeader from "@/Components/PrintReportHeader";

// ─── Print CSS ──────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #drivers-print-area, #drivers-print-area * { visibility: visible !important; }
  #drivers-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

// ─── Types ───────────────────────────────────────────────────────

interface AssignedBus {
  id: number;
  bus_number: string;
  school: { id: number; name: string } | null;
}

interface Driver {
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
  address: string | null;
  driver: {
    license_number: string;
    license_expiry_date: string;
    status: string;
    license_front_image: string | null;
    license_back_image: string | null;
    id_card_front_image: string | null;
    id_card_back_image: string | null;
  } | null;
  image?: string | null;
  license_front_image?: string | null; 
  license_back_image?: string | null; 
  id_card_front_image?: string | null;
  id_card_back_image?: string | null;
  assigned_bus: AssignedBus | null;
}

interface Props {
  auth: any;
  drivers: {
    data: Driver[];
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

export default function DriversIndex({ auth, drivers, counts, filters }: Props) {
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
  const [currentDriverId, setCurrentDriverId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewLicenseFront, setPreviewLicenseFront] = useState<string | null>(null);
  const [previewLicenseBack, setPreviewLicenseBack] = useState<string | null>(null);
  const [previewIdCardFront, setPreviewIdCardFront] = useState<string | null>(null);
  const [previewIdCardBack, setPreviewIdCardBack] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

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
      license_number: "",
      license_expiry_date: "",
      address: "",
      image: null as File | null,
      license_front_image: null as File | null,
      license_back_image: null as File | null,
      id_card_front_image: null as File | null,
      id_card_back_image: null as File | null,
    });

  // --- Handlers ---
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.get(
          route("admin.drivers.index"),
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
      route("admin.drivers.index"),
      { search: filters.search, status: key === "all" ? undefined : key },
      { preserveState: true, replace: true }
    );
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentDriverId(null);
    setPreviewImage(null);
    setPreviewLicenseFront(null);
    setPreviewLicenseBack(null);
    setPreviewIdCardFront(null);
    setPreviewIdCardBack(null);
    reset();
    setData("_method", "post");
    clearErrors();
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setIsEditing(true);
    setCurrentDriverId(driver.id);
    setPreviewImage(driver.image ? `/storage/${driver.image}` : null);
    setPreviewLicenseFront(driver.license_front_image ? `/storage/${driver.license_front_image}` : null);
    setPreviewLicenseBack(driver.license_back_image ? `/storage/${driver.license_back_image}` : null);
    setPreviewIdCardFront(driver.id_card_front_image ? `/storage/${driver.id_card_front_image}` : null);
    setPreviewIdCardBack(driver.id_card_back_image ? `/storage/${driver.id_card_back_image}` : null);
    setData({
      _method: "put",
      first_name_ar: driver.first_name_ar || "",
      second_name_ar: driver.second_name_ar || "",
      third_name_ar: driver.third_name_ar || "",
      last_name_ar: driver.last_name_ar || "",
      first_name_en: driver.first_name_en || "",
      second_name_en: driver.second_name_en || "",
      third_name_en: driver.third_name_en || "",
      last_name_en: driver.last_name_en || "",
      national_id: driver.national_id || "",
      email: driver.email || "",
      phone: driver.phone || "",
      license_number: driver.driver?.license_number || "",
      license_expiry_date: driver.driver?.license_expiry_date || "",
      address: driver.address || "",
      image: null,
      license_front_image: null,
      license_back_image: null,
      id_card_front_image: null,
      id_card_back_image: null,
    });
    clearErrors();
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const openDetailsModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null);
    setPreviewLicenseFront(null);
    setPreviewLicenseBack(null);
    setPreviewIdCardFront(null);
    setPreviewIdCardBack(null);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentDriverId) {
      post(route("admin.drivers.update", currentDriverId), {
        forceFormData: true,
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("admin.drivers.store"), {
        onSuccess: () => closeModal(),
      });
    }
  };

  const deleteDriver = (driverId: number) => {
    if (confirm(isRTL ? "هل أنت متأكد من حذف هذا السائق؟" : "Are you sure?")) {
      router.delete(route("admin.drivers.destroy", driverId));
    }
  };

  const handlePrint = () => window.print();

  const IS_EXPIRED = (date: string | undefined | null) =>
    date && new Date(date) < new Date();

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
  const columnHelper = createColumnHelper<Driver>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: isRTL ? "السائق" : "Driver",
        cell: (info) => {
          const driver = info.row.original;
          return (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-[#0f2044]/10 dark:bg-[#0f2044]/40 text-[#0f2044] dark:text-[#f5b800] flex items-center justify-center font-black text-sm overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
                {driver.image ? (
                  <img
                    src={`/storage/${driver.image}`}
                    alt={driver.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  driver.name.charAt(0)
                )}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"} tracking-tight`}>
                  {driver.name}
                </span>
                {driver.name_en && (
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                    {driver.name_en}
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
          const driver = info.row.original;
          return (
            <div className="flex flex-col">
              <span className={`text-sm font-black ${isDark ? "text-gray-300" : "text-[#0f2044]"} font-mono`}>
                {driver.national_id || "—"}
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase">
                {driver.user_code}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("phone", {
        header: isRTL ? "الاتصال" : "Contact",
        cell: (info) => {
          const driver = info.row.original;
          return (
            <div className="flex flex-col">
              <span className={`text-sm font-black ${isDark ? "text-gray-300" : "text-[#0f2044]"} font-mono`}>
                {driver.phone}
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate max-w-[150px]">
                {driver.email}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("driver.license_number", {
        header: isRTL ? "الرخصة" : "License",
        cell: (info) => {
          const driver = info.row.original;
          const licExpired = IS_EXPIRED(driver.driver?.license_expiry_date);
          return (
            <div className="flex flex-col">
              <span className={`text-sm font-black ${isDark ? "text-gray-300" : "text-[#0f2044]"} font-mono`}>
                {driver.driver?.license_number || "—"}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 ${licExpired ? "text-rose-500" : "text-gray-400"}`}>
                {licExpired && <ShieldCheck size={10} className="text-rose-500" />}
                {driver.driver?.license_expiry_date || "—"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("assigned_bus", {
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
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
          const driver = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => openDetailsModal(driver)}
                className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                title={isRTL ? "عرض" : "View"}
              >
                <Eye size={16} />
              </button>
              <button 
                onClick={() => openEditModal(driver)}
                className={DS_btnEdit}
                title={isRTL ? "تعديل" : "Edit"}
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => deleteDriver(driver.id)}
                className={DS_btnDanger}
                title={isRTL ? "حذف" : "Delete"}
              >
                <Trash2 size={14} />
              </button>
              <button 
                onClick={() => {
                  toast.info(isRTL ? "جاري تحضير بطاقة السائق..." : "Preparing driver card for print...");
                  const url = route("admin.drivers.print", driver.id);
                  window.open(url, "PrintDriverCard", "width=1000,height=800,scrollbars=yes,status=yes,resizable=yes");
                }}
                className="p-2 bg-gray-100 dark:bg-[#0f2044] text-gray-600 dark:text-gray-300 rounded-lg hover:bg-[#0f2044] hover:text-[#f5b800] transition-all shadow-sm"
                title={isRTL ? "طباعة" : "Print"}
              >
                <Printer size={16} />
              </button>
            </div>
          );
        },
      }),
    ],
    [isRTL, isDark, openEditModal]
  );

  const pagination: PaginationMeta = {
    links: drivers.links,
    current_page: drivers.current_page,
    last_page: drivers.last_page,
    per_page: drivers.per_page,
    total: drivers.total,
    from: drivers.from,
    to: drivers.to,
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={isRTL ? "إدارة السائقين" : "Drivers Management"} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area (Unified System) ── */}
      <div id="drivers-print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
        <PrintReportHeader
          title={isRTL ? "تقرير بيانات السائقين" : "Drivers Operational Report"}
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
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "السائق" : "Driver"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "رقم الهوية" : "ID"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الجوال" : "Phone"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "رقم الرخصة" : "License"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "تاريخ الانتهاء" : "Expiry"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الوحدة" : "Unit"}</th>
              </tr>
            </thead>
            <tbody>
              {drivers.data.map((driver, i) => (
                <tr key={driver.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center text-gray-700">{i + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{driver.name}</td>
                  <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{driver.national_id}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{driver.phone}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{driver.driver?.license_number || "—"}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{driver.driver?.license_expiry_date || "—"}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{driver.assigned_bus?.bus_number || (isRTL ? "غير محدد" : "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{isRTL ? "إجمالي الكادر" : "Total Force"}: {drivers.data.length}</p>
            <p>{isRTL ? "التوقيع الرسمي" : "Official Signature"}: ............................</p>
          </div>
        </div>
      </div>

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex flex-col">
                <h1 className={DS_pageTitle}>
                    {isRTL ? "إدارة الأسطول: السائقين" : "Fleet Management: Drivers"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {drivers.total} {isRTL ? "سائق مسجل" : "Operatives Enrolled"}
                    </span>
                </div>
            </div>
        </div>

        {/* Intelligence Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={DS_statCard('blue')}>
                <div className={DS_statIcon('blue')}><Users size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "إجمالي السائقين" : "Total Drivers"}</p>
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

        {/* Action Button Section */}
        <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
            <button onClick={() => setIsImportModalOpen(true)} className={DS_btnSecondary}>
                <Upload size={18} />
                <span>{isRTL ? "استيراد" : "Import"}</span>
            </button>
            <a href={route("admin.drivers.export")} className={DS_btnSecondary}>
                <Download size={18} />
                <span>{isRTL ? "تصدير" : "Export"}</span>
            </a>
            <button 
                onClick={openAddModal}
                className={DS_btnGold}
            >
                <Plus size={18} />
                <span>{isRTL ? "إضافة سائق جديد" : "Enroll New Driver"}</span>
            </button>
        </div>

        {/* Main Operational Table */}
        <div className={DS_card}>
            <BaseDataTable<Driver>
                columns={columns}
                data={drivers.data}
                pagination={pagination}
                searchValue={search}
                onSearchChange={handleSearch}
                searchPlaceholder={isRTL ? "البحث في ملفات السائقين..." : "Search driver dossiers..."}
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
            {showDetailsModal && selectedDriver && (
                <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="3xl">
                    <div className={DS_modalContainer}>
                        {/* Dossier Header */}
                        <div className="relative h-48 bg-[#0f2044] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent z-10" />
                            <div className="absolute top-6 inset-x-6 flex justify-between items-center z-20">
                                <span className="px-3 py-1 bg-[#f5b800] text-[#0f2044] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    {isRTL ? "رقم الملف" : "Dossier ID"}: #{selectedDriver.user_code}
                                </span>
                                <button onClick={() => setShowDetailsModal(false)} className={DS_modalClose}>
                                    <X size={18} />
                                </button>
                            </div>
                            
                            {/* Visual ID */}
                            <div className="absolute -bottom-10 left-10 w-32 h-32 rounded-[2rem] border-4 border-white dark:border-[#1a2845] bg-white dark:bg-[#0f2044] shadow-2xl overflow-hidden z-20">
                                {selectedDriver.image ? (
                                    <img src={`/storage/${selectedDriver.image}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-[#0f2044] dark:text-[#f5b800] bg-gray-50">
                                        {selectedDriver.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-16 pb-10 px-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 dark:border-[#243460] pb-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-[#0f2044] dark:text-white tracking-tighter">
                                        {selectedDriver.name}
                                    </h2>
                                    <p className="text-lg font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                        {selectedDriver.name_en || (isRTL ? "غير محدد" : "UNSPECIFIED")}
                                    </p>
                                    <div className="flex gap-2 mt-4">
                                        <StatusBadge status={selectedDriver.driver?.status === "active" ? "active" : "inactive"} />
                                        <span className="px-3 py-1 bg-[#0f2044]/5 dark:bg-[#0f2044]/40 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                            {isRTL ? "الصفة: سائق ميداني" : "Role: Field Operative"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-[#0f2044]/30 rounded-2xl border border-gray-100 dark:border-[#243460] flex flex-col items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isRTL ? "الحافلة المعينة" : "Assigned Unit"}</span>
                                    <span className="text-xl font-black text-[#0f2044] dark:text-[#f5b800] flex items-center gap-2">
                                        <BusIcon size={20} /> {selectedDriver.assigned_bus?.bus_number || (isRTL ? "لا يوجد" : "NONE")}
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
                                        <InfoRow icon={<CreditCard size={14} />} label={isRTL ? "رقم الهوية" : "National ID"} value={selectedDriver.national_id} isDark={isDark} />
                                        <InfoRow icon={<Phone size={14} />} label={isRTL ? "رقم الجوال" : "Emergency Contact"} value={selectedDriver.phone} isDark={isDark} />
                                        <InfoRow icon={<Mail size={14} />} label={isRTL ? "البريد الإلكتروني" : "Primary Email"} value={selectedDriver.email} isDark={isDark} />
                                        <InfoRow icon={<MapPin size={14} />} label={isRTL ? "العنوان" : "Registered Address"} value={selectedDriver.address || "—"} isDark={isDark} />
                                    </div>
                                </div>

                                {/* Section: Professional */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Briefcase size={16} className="text-[#f5b800]" /> {isRTL ? "بيانات العمل" : "Operational Credentials"}
                                    </h3>
                                    <div className="space-y-4">
                                        <InfoRow icon={<CreditCard size={14} />} label={isRTL ? "رقم الرخصة" : "License Serial"} value={selectedDriver.driver?.license_number || "—"} isDark={isDark} />
                                        <InfoRow 
                                            icon={<Calendar size={14} />} 
                                            label={isRTL ? "انتهاء الرخصة" : "Expiry Protocol"} 
                                            value={selectedDriver.driver?.license_expiry_date || "—"} 
                                            isDark={isDark} 
                                            highlight={IS_EXPIRED(selectedDriver.driver?.license_expiry_date)}
                                        />
                                        <div className="p-4 bg-[#f5b800]/5 rounded-2xl border border-[#f5b800]/10 mt-2">
                                            <p className="text-[10px] font-black text-[#b38600] uppercase tracking-widest mb-1">{isRTL ? "تعيين الوحدة" : "Unit Assignment"}</p>
                                            <p className="text-sm font-bold text-[#0f2044] dark:text-gray-300">
                                                {selectedDriver.assigned_bus?.school?.name || (isRTL ? "سائق مستقل" : "Independent Contractor")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Media Assets */}
                            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-[#243460]">
                                <h3 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] mb-6">{isRTL ? "المستندات والصور" : "Documentary Evidence"}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <MediaCard label={isRTL ? "الرخصة (أمام)" : "License Front"} src={selectedDriver.license_front_image || selectedDriver.driver?.license_front_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الرخصة (خلف)" : "License Back"} src={selectedDriver.license_back_image || selectedDriver.driver?.license_back_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الهوية (أمام)" : "ID Card Front"} src={selectedDriver.id_card_front_image || selectedDriver.driver?.id_card_front_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "الهوية (خلف)" : "ID Card Back"} src={selectedDriver.id_card_back_image || selectedDriver.driver?.id_card_back_image} isDark={isDark} isRTL={isRTL} />
                                    <MediaCard label={isRTL ? "صورة المسح" : "Scan Reference"} src={selectedDriver.image} isDark={isDark} isRTL={isRTL} />
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
                            {isEditing ? (isRTL ? "تحديث ملف السائق" : "Update Operative Dossier") : (isRTL ? "تسجيل سائق ميداني جديد" : "Enroll New Field Operative")}
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
                        <span className={`text-[9px] font-black uppercase tracking-widest ${currentStep === 2 ? 'text-[#0f2044] dark:text-[#f5b800]' : 'text-gray-400'}`}>{isRTL ? "بيانات العمل" : "Professional Data"}</span>
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
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isRTL ? "الصورة الشخصية للسائق" : "Operative Visual ID"}</label>
                                        <label className="cursor-pointer px-4 py-2 bg-[#0f2044] text-white rounded-xl text-xs font-black hover:bg-[#1a3a7a] transition-all">
                                            {isRTL ? "رفع صورة السائق" : "Upload Dossier Photo"}
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
                                        <label className={DS_label}>{isRTL ? "رقم الجوال" : "Emergency Contact"}</label>
                                        <input type="text" value={data.phone} onChange={(e) => setData("phone", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" placeholder="5X XXX XXXX" required />
                                        <InputError message={errors.phone} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={DS_label}>{isRTL ? "رقم الرخصة" : "License Serial"}</label>
                                        <input type="text" value={data.license_number} onChange={(e) => setData("license_number", e.target.value)} className={`${DS_input} font-mono`} dir="ltr" required />
                                        <InputError message={errors.license_number} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={DS_label}>{isRTL ? "انتهاء الرخصة" : "License Expiry"}</label>
                                        <input type="date" value={data.license_expiry_date} onChange={(e) => setData("license_expiry_date", e.target.value)} className={DS_input} dir="ltr" required />
                                        <InputError message={errors.license_expiry_date} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={DS_label}>{isRTL ? "الرخصة (أمام)" : "License Front Image"}</label>
                                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460]">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                                                {data.license_front_image ? <img src={URL.createObjectURL(data.license_front_image)} className="w-full h-full object-cover" /> : previewLicenseFront ? <img src={previewLicenseFront} className="w-full h-full object-cover" /> : <CreditCard size={18} className="text-gray-300 m-auto mt-3" />}
                                            </div>
                                            <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">{isRTL ? "اختيار ملف" : "Choose File"}<input type="file" className="hidden" accept="image/*" onChange={(e) => setData("license_front_image", e.target.files?.[0] || null)} /></label>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={DS_label}>{isRTL ? "الرخصة (خلف)" : "License Back Image"}</label>
                                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460]">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                                                {data.license_back_image ? <img src={URL.createObjectURL(data.license_back_image)} className="w-full h-full object-cover" /> : previewLicenseBack ? <img src={previewLicenseBack} className="w-full h-full object-cover" /> : <CreditCard size={18} className="text-gray-300 m-auto mt-3" />}
                                            </div>
                                            <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">{isRTL ? "اختيار ملف" : "Choose File"}<input type="file" className="hidden" accept="image/*" onChange={(e) => setData("license_back_image", e.target.files?.[0] || null)} /></label>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={DS_label}>{isRTL ? "الهوية (أمام)" : "ID Card Front Image"}</label>
                                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460]">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                                                {data.id_card_front_image ? <img src={URL.createObjectURL(data.id_card_front_image)} className="w-full h-full object-cover" /> : previewIdCardFront ? <img src={previewIdCardFront} className="w-full h-full object-cover" /> : <CreditCard size={18} className="text-gray-300 m-auto mt-3" />}
                                            </div>
                                            <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">{isRTL ? "اختيار ملف" : "Choose File"}<input type="file" className="hidden" accept="image/*" onChange={(e) => setData("id_card_front_image", e.target.files?.[0] || null)} /></label>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={DS_label}>{isRTL ? "الهوية (خلف)" : "ID Card Back Image"}</label>
                                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-dashed border-gray-200 dark:border-[#243460]">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white">
                                                {data.id_card_back_image ? <img src={URL.createObjectURL(data.id_card_back_image)} className="w-full h-full object-cover" /> : previewIdCardBack ? <img src={previewIdCardBack} className="w-full h-full object-cover" /> : <CreditCard size={18} className="text-gray-300 m-auto mt-3" />}
                                            </div>
                                            <label className="cursor-pointer text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline">{isRTL ? "اختيار ملف" : "Choose File"}<input type="file" className="hidden" accept="image/*" onChange={(e) => setData("id_card_back_image", e.target.files?.[0] || null)} /></label>
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
                                    {isEditing ? (isRTL ? "حفظ التعديلات" : "Finalize Changes") : (isRTL ? "تسجيل السائق" : "Enroll Operative")}
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
                            {isRTL ? "استيراد السائقين (Excel)" : "Import Drivers (Excel)"}
                        </h3>
                    </div>
                    <button onClick={() => { setIsImportModalOpen(false); resetImport(); }} className={DS_modalClose}>
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    postImport(route('admin.drivers.import'), {
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
                                <a href={route('admin.drivers.template')} className="inline-flex items-center gap-2 mt-3 text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest underline">
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
                            <button 
                                type="submit" 
                                disabled={importProcessing} 
                                className={`${DS_btnGold} min-w-[120px] flex items-center justify-center gap-2`}
                            >
                                {importProcessing ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>{isRTL ? "جاري الرفع..." : "Uploading..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        <span>{isRTL ? "رفع واستيراد" : "Upload & Import"}</span>
                                    </>
                                )}
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
        <div className={`p-1.5 rounded-lg ${isDark ? "bg-gray-800 text-gray-500" : "bg-[#0f2044]/5 text-[#0f2044]"}`}>
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
