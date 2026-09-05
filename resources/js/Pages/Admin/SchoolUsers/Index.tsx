import { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import ConfirmationModal from "@/Components/ConfirmationModal";
import InputError from "@/Components/InputError";
import { useTheme } from "@/Contexts/ThemeContext";
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
    XCircle,
    School,
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
    Loader2,
    Lock,
    MapPin
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
import SearchableSelect from "@/Components/SearchableSelect";

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #school-print-area, #school-print-area * { visibility: visible !important; }
  #school-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

interface SchoolData {
  id: number;
  name: string;
}

interface SchoolUser {
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
  address?: string;
  school_admin?: {
    status: string;
    school: SchoolData | null;
  } | null;
}

type FilterType = "all" | "active" | "inactive";

interface Props {
  auth: any;
  users: {
    data: SchoolUser[];
    links: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  counts: {
    all: number;
    active: number;
    inactive: number;
  };
  schools: SchoolData[];
  filters: {
    search: string;
    status: string;
  };
}

export default function SchoolUsersIndex({
  auth,
  users,
  counts,
  schools,
  filters,
}: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { data: importData, setData: setImportData, post: postImport, processing: importProcessing, errors: importErrors, reset: resetImport } = useForm({ file: null as File | null });
  const flash = usePage().props.flash as any;
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<SchoolUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<SchoolUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SchoolUser | null>(null);

  const { data, setData, post, processing, errors, reset, clearErrors } =
    useForm({
      _method: "post",
      first_name_ar: "",
      last_name_ar: "",
      first_name_en: "",
      last_name_en: "",
      national_id: "",
      email: "",
      phone: "",
      school_id: "" as string | number,
      status: "active",
      address: "",
      preferred_language: "ar",
      password: "",
      password_confirmation: "",
      image: null as File | null,
    });

  // --- isUnchanged check for edit modal ---
  const isUnchanged = useMemo(() => {
    if (!isEditing || !editingUser) return false;
    const arParts = (editingUser.name || "").split(" ");
    const enParts = (editingUser.name_en || "").split(" ");
    const initialFirstNameAr = editingUser.first_name_ar || arParts[0] || "";
    const initialLastNameAr = editingUser.last_name_ar || arParts.slice(1).join(" ") || "";
    const initialFirstNameEn = editingUser.first_name_en || enParts[0] || "";
    const initialLastNameEn = editingUser.last_name_en || enParts.slice(1).join(" ") || "";
    const initialSchoolId = String(editingUser.school_admin?.school?.id || "");
    const initialStatus = editingUser.school_admin?.status || "active";

    return (
      (data.first_name_ar || "").trim() === initialFirstNameAr.trim() &&
      (data.last_name_ar || "").trim() === initialLastNameAr.trim() &&
      (data.first_name_en || "").trim() === initialFirstNameEn.trim() &&
      (data.last_name_en || "").trim() === initialLastNameEn.trim() &&
      (data.national_id || "").trim() === (editingUser.national_id || "").trim() &&
      (data.email || "").trim() === (editingUser.email || "").trim() &&
      (data.phone || "").trim() === (editingUser.phone || "").trim() &&
      String(data.school_id || "") === initialSchoolId &&
      data.status === initialStatus &&
      (data.address || "").trim() === (editingUser.address || "").trim() &&
      (data.preferred_language || "ar") === (editingUser.preferred_language || "ar") &&
      !data.password &&
      !data.password_confirmation &&
      !data.image
    );
  }, [data, isEditing, editingUser]);

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setEditingUser(null);
    setPreviewImage(null);
    reset();
    setData("_method", "post");
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (user: SchoolUser) => {
    setIsEditing(true);
    setCurrentId(user.id);
    setEditingUser(user);
    setPreviewImage(user.image ? `/storage/${user.image}` : null);

    // Parse name components if not directly available
    const arParts = user.name.split(" ");
    const enParts = (user.name_en || "").split(" ");

    setData({
      _method: "put",
      first_name_ar: user.first_name_ar || arParts[0] || "",
      last_name_ar: user.last_name_ar || arParts.slice(1).join(" ") || "",
      first_name_en: user.first_name_en || enParts[0] || "",
      last_name_en: user.last_name_en || enParts.slice(1).join(" ") || "",
      national_id: user.national_id || "",
      email: user.email || "",
      phone: user.phone || "",
      school_id: user.school_admin?.school?.id || "",
      status: user.school_admin?.status || "active",
      address: user.address || "",
      preferred_language: user.preferred_language || "ar",
      password: "",
      password_confirmation: "",
      image: null,
    });
    clearErrors();
    setIsModalOpen(true);
  };

  const openDetailsModal = (user: SchoolUser) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setPreviewImage(null);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && currentId) {
      if (isUnchanged) return;
      post(route("admin.school-admins.update", currentId), {
        forceFormData: true,
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("admin.school-admins.store"), {
        forceFormData: true,
        onSuccess: () => closeModal(),
      });
    }
  };

  const deleteUser = (user: SchoolUser) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete || isDeleting) return;
    setIsDeleting(true);
    router.delete(route("admin.school-admins.destroy", userToDelete.id), {
      onFinish: () => {
        setIsDeleting(false);
        setUserToDelete(null);
      },
    });
  };

  const handlePrint = () => {
    const url = route("admin.school-admins.print-all", {
      search: filters.search || "",
      status: filters.status || "all",
    });
    window.open(url, "PrintReport", "width=1000,height=800,scrollbars=yes,status=yes,resizable=yes");
  };

  const handleSearch = (val: string) => {
    router.get(route('admin.school-admins.index'), {
        ...filters,
        search: val
    }, {
        preserveState: true,
        replace: true
    });
  };

  const handleFilterChange = (key: string) => {
    router.get(route('admin.school-admins.index'), {
        ...filters,
        status: key
    }, {
        preserveState: true,
        replace: true
    });
  };

  const columnHelper = createColumnHelper<SchoolUser>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: isRTL ? "مدير المدرسة" : "School Manager",
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-[#0f2044]/10 dark:bg-[#0f2044]/40 text-[#0f2044] dark:text-[#f5b800] flex items-center justify-center font-black text-sm overflow-hidden shadow-sm border border-gray-100 dark:border-white/5">
                {user.image ? (
                  <img
                    src={`/storage/${user.image}`}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (isRTL ? (user.name || user.name_en) : (user.name_en || user.name))?.charAt(0) || 'U'
                )}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-black ${isDark ? "text-white" : "text-[#0f2044]"} tracking-tight`}>
                  {isRTL ? (user.name || user.name_en) : (user.name_en || user.name)}
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("national_id", {
        header: isRTL ? "الرقم المدني" : "ID / Code",
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex flex-col">
              <span className={`text-sm font-black ${isDark ? "text-gray-300" : "text-[#0f2044]"} font-mono`}>
                {user.national_id || "—"}
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase">
                {user.user_code}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("phone", {
        header: isRTL ? "بيانات الاتصال" : "Contact",
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex flex-col">
              <span className={`text-sm font-black ${isDark ? "text-gray-300" : "text-[#0f2044]"} font-mono`}>
                {user.phone}
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate max-w-[160px]">
                {user.email}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("school_admin.school.name", {
        header: isRTL ? "المدرسة المرتبطة" : "Linked School",
        cell: (info) => {
          const schName = info.getValue();
          return (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#f5b800]/10 rounded-lg text-[#f5b800]">
                  <School size={14} />
              </div>
              <span className={`text-sm font-bold ${isDark ? "text-gray-300" : "text-[#0f2044]"}`}>
                  {schName || (isRTL ? "غير مرتبطة" : "UNLINKED")}
              </span>
            </div>
          );
        }
      }),
      columnHelper.accessor("school_admin.status", {
        header: isRTL ? "الحالة" : "Status",
        cell: (info) => {
            const st = info.getValue() || "active";
            return <StatusBadge status={st === "active" ? "active" : "inactive"} />;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex items-center gap-1.5">
              <ActionButton
                label={isRTL ? "عرض" : "View"}
                onClick={() => openDetailsModal(user)}
                color="blue"
                icon={<Eye size={15} />}
              />
              <ActionButton
                label={isRTL ? "تعديل" : "Edit"}
                onClick={() => openEditModal(user)}
                color="indigo"
                icon={<Edit2 size={15} />}
              />
              <ActionButton
                label={isRTL ? "حذف" : "Delete"}
                onClick={() => deleteUser(user)}
                color="red"
                icon={<Trash2 size={15} />}
              />
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

  const pagination: PaginationMeta = {
    links: users.links,
    current_page: users.current_page,
    last_page: users.last_page,
    per_page: users.per_page,
    total: users.total,
    from: users.from,
    to: users.to,
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={isRTL ? "إدارة مدراء المدارس" : "School Managers Management"} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area (Unified System) ── */}
      <div id="school-print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
        <PrintReportHeader
          title={isRTL ? "تقرير بيانات مدراء المدارس" : "School Managers Operational Report"}
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
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "مدير المدرسة" : "School Manager"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "المدرسة" : "School"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الرقم المدني" : "ID"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الجوال" : "Phone"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "البريد الإلكتروني" : "Email"}</th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((usr, i) => (
                <tr key={usr.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center text-gray-700">{i + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{usr.name}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{usr.school_admin?.school?.name || "—"}</td>
                  <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{usr.national_id}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{usr.phone}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{usr.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{isRTL ? "إجمالي الكادر" : "Total Force"}: {users.total}</p>
            <p>{isRTL ? "التوقيع الرسمي" : "Official Signature"}: ............................</p>
          </div>
        </div>
      </div>

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRTL ? 'rtl' : 'ltr'}>

        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex flex-col">
                <h1 className={DS_pageTitle}>
                    {isRTL ? "إدارة مدراء المدارس" : "School Managers Management"}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {users.total} {isRTL ? "مدير مدرسة مسجل" : "School Managers Enrolled"}
                    </span>
                </div>
            </div>
        </div>

        {/* Intelligence Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className={DS_statCard('blue')}>
                <div className={DS_statIcon('blue')}><Users size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "إجمالي المدراء" : "Total Managers"}</p>
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
            <BaseDataTable<SchoolUser>
                columns={columns}
                data={users.data}
                pagination={pagination}
                searchValue={filters.search || ""}
                onSearchChange={handleSearch}
                searchPlaceholder={isRTL ? "البحث في سجلات المدراء..." : "Search manager dossiers..."}
                filterTabs={filterTabs}
                activeFilter={filters.status || "all"}
                onFilterChange={handleFilterChange}
                exportEnabled={false}
                headerAction={
                    <div className="flex items-center gap-2">
                        <button onClick={openAddModal} className={DS_btnGold}>
                            <Plus size={16} />
                            <span className="hidden sm:inline">{isRTL ? "إضافة مدير جديد" : "New Manager"}</span>
                        </button>
                        <button onClick={() => setIsImportModalOpen(true)} className={DS_btnSecondary}>
                            <Upload size={16} />
                            <span className="hidden sm:inline">{isRTL ? "استيراد" : "Import"}</span>
                        </button>
                        <a href={route("admin.school-admins.export")} className={DS_btnSecondary}>
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
            {showDetailsModal && selectedUser && (
                <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="3xl">
                    <div className={DS_modalContainer}>
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {/* Dossier Header */}
                            <div className="relative h-48 shrink-0 bg-[#0f2044] overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent z-10" />
                            <div className="absolute top-6 inset-x-6 flex justify-between items-center z-20">
                                <span className="px-3 py-1 bg-[#f5b800] text-[#0f2044] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    {isRTL ? "كود المستخدم" : "User Code"}: #{selectedUser.user_code}
                                </span>
                                <button onClick={() => setShowDetailsModal(false)} className={DS_modalClose}>
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Visual ID */}
                            <div className="absolute -bottom-10 left-10 w-32 h-32 rounded-[2rem] border-4 border-white dark:border-[#1a2845] bg-white dark:bg-[#0f2044] shadow-2xl overflow-hidden z-20">
                                {selectedUser.image ? (
                                    <img src={`/storage/${selectedUser.image}`} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-[#0f2044] dark:text-[#f5b800] bg-gray-50">
                                        {(isRTL ? (selectedUser.name || selectedUser.name_en) : (selectedUser.name_en || selectedUser.name))?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-16 pb-10 px-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 dark:border-[#243460] pb-8">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-[#0f2044] dark:text-white tracking-tighter">
                                        {isRTL ? (selectedUser.name || selectedUser.name_en) : (selectedUser.name_en || selectedUser.name)}
                                    </h2>
                                    <div className="flex gap-2 mt-4">
                                        <StatusBadge status={selectedUser.school_admin?.status === "active" ? "active" : "inactive"} />
                                        <span className="px-3 py-1 bg-[#0f2044]/5 dark:bg-[#0f2044]/40 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                            {isRTL ? "الصفة: مدير مدرسة" : "Role: School Manager"}
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
                                        <InfoRow icon={<CreditCard size={14} />} label={isRTL ? "الرقم المدني" : "Civil ID"} value={selectedUser.national_id} isDark={isDark} />
                                        <InfoRow icon={<Phone size={14} />} label={isRTL ? "رقم الجوال" : "Primary Phone"} value={selectedUser.phone} isDark={isDark} />
                                        <InfoRow icon={<Mail size={14} />} label={isRTL ? "البريد الإلكتروني" : "Email Address"} value={selectedUser.email} isDark={isDark} />
                                        <InfoRow icon={<MapPin size={14} />} label={isRTL ? "العنوان" : "Registered Address"} value={selectedUser.address || "—"} isDark={isDark} />
                                    </div>
                                </div>

                                {/* Section: School Assignment */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <School size={16} className="text-[#f5b800]" /> {isRTL ? "المدرسة التشغيلية" : "Affiliated School"}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 rounded-2xl border border-gray-100 dark:border-[#243460]">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{isRTL ? "المدرسة المرتبطة" : "School Linked"}</p>
                                            <p className="text-sm font-bold text-[#0f2044] dark:text-gray-300">
                                                {selectedUser.school_admin?.school?.name ?? (isRTL ? "غير محدد" : "UNASSIGNED")}
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
                            {isEditing ? (isRTL ? "تحديث ملف المدير" : "Update Manager Dossier") : (isRTL ? "تسجيل مدير مدرسة جديد" : "Enroll New School Manager")}
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

                        {/* §2 Personal Identity & Profile Photo */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-2 flex items-center gap-2">
                                <CreditCard size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                                {isRTL ? "الهوية الشخصية" : "Personal Identity"}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "الرقم المدني / الإقامة" : "Civil ID / Iqama"} <span className="text-rose-500">*</span></label>
                                            <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value.replace(/\D/g, ''))} minLength={7} maxLength={20} pattern="\d+" className={`${DS_input} font-mono`} dir="ltr" required />
                                            <InputError message={errors.national_id} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={DS_label}>{isRTL ? "رقم الجوال" : "Phone Number"} <span className="text-rose-500">*</span></label>
                                            <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value.replace(/\D/g, ''))} minLength={8} maxLength={20} pattern="\d+" className={`${DS_input} font-mono`} dir="ltr" placeholder="5XXXXXXXX" required />
                                            <InputError message={errors.phone} />
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <label className={DS_label}>{isRTL ? "البريد الإلكتروني" : "Email Address"} <span className="text-rose-500">*</span></label>
                                            <input type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} className={DS_input} dir="ltr" required />
                                            <InputError message={errors.email} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-[#243460] flex items-center justify-center overflow-hidden bg-white dark:bg-[#0f2044] flex-shrink-0 relative group">
                                            {data.image ? (
                                                <>
                                                    <img src={URL.createObjectURL(data.image)} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => setData("image", null)} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X size={14} className="text-white" />
                                                    </button>
                                                </>
                                            ) : previewImage ? (
                                                <>
                                                    <img src={previewImage} className="w-full h-full object-cover" />
                                                    <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                        <Upload size={14} className="text-white" />
                                                        <input type="file" className="hidden" accept="image/*" onChange={e => setData("image", e.target.files?.[0] || null)} />
                                                    </label>
                                                </>
                                            ) : (
                                                <Users size={20} className="text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-[#0f2044] dark:text-gray-300 uppercase">{isRTL ? "الصورة الشخصية" : "Profile Photo"}</p>
                                            <p className="text-[9px] text-gray-400">{isRTL ? "JPEG, PNG حتى 2MB" : "JPEG, PNG up to 2MB"}</p>
                                        </div>
                                        {!data.image && !previewImage && (
                                            <label className="cursor-pointer px-3 py-1.5 bg-[#0f2044] dark:bg-white/10 text-white dark:text-gray-200 rounded-lg text-[10px] font-black hover:bg-[#1a3a7a] transition-all">
                                                {isRTL ? "تصفح" : "Browse"}
                                                <input type="file" className="hidden" accept="image/*" onChange={e => setData("image", e.target.files?.[0] || null)} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* §3 School Assignment & Settings */}
                        <div className="space-y-3">
                            <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-2 flex items-center gap-2">
                                <Briefcase size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                                {isRTL ? "الارتباط والمدرسة" : "Assignment & Details"}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <SearchableSelect
                                        label={isRTL ? "المؤسسة التعليمية" : "Educational School"}
                                        options={schools.map(s => ({ id: s.id, label: s.name }))}
                                        value={data.school_id}
                                        onChange={val => setData('school_id', val)}
                                        placeholder={isRTL ? "اختر المدرسة..." : "Choose School..."}
                                    />
                                    <InputError message={errors.school_id} />
                                </div>
                                <div className="space-y-1">
                                    <label className={DS_label}>{isRTL ? "العنوان" : "Registered Address"}</label>
                                    <input type="text" value={data.address} onChange={(e) => setData("address", e.target.value)} className={DS_input} dir={isRTL ? "rtl" : "ltr"} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className={DS_label}>{isRTL ? "اللغة المفضلة" : "Preferred Language"}</label>
                                    <select value={data.preferred_language} onChange={(e) => setData("preferred_language", e.target.value)} className={DS_select} dir={isRTL ? "rtl" : "ltr"}>
                                        <option value="ar">{isRTL ? "العربية" : "Arabic"}</option>
                                        <option value="en">{isRTL ? "الإنجليزية" : "English"}</option>
                                    </select>
                                    <InputError message={errors.preferred_language} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className={DS_label}>{isRTL ? "حالة الحساب" : "Operational Status"}</label>
                                    <select value={data.status} onChange={(e) => setData("status", e.target.value)} className={DS_select} required>
                                        <option value="active">{isRTL ? "نشط" : "Active"}</option>
                                        <option value="inactive">{isRTL ? "غير نشط" : "Inactive"}</option>
                                    </select>
                                    <InputError message={errors.status} />
                                </div>
                            </div>
                        </div>

                        {/* §4 Security Access */}
                        <div className="p-4 bg-gray-50 dark:bg-[#0f2044]/20 rounded-2xl border border-gray-100 dark:border-[#243460] space-y-3">
                            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
                                <Lock size={14} className="text-[#f5b800]" />
                                <h4 className="text-xs font-black text-[#0f2044] dark:text-gray-300 uppercase tracking-widest">
                                    {isRTL ? "إعدادات الأمان والسرية" : "Security Access Details"}
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className={DS_label}>{isRTL ? "كلمة المرور" : "Password"}</label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        className={DS_input}
                                        required={!isEditing}
                                        placeholder={isEditing ? (isRTL ? "اتركه فارغاً لعدم التغيير" : "Leave blank to keep same") : ""}
                                    />
                                    <InputError message={errors.password} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className={DS_label}>{isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}</label>
                                    <input
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={e => setData('password_confirmation', e.target.value)}
                                        className={DS_input}
                                        required={!isEditing}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className={DS_modalFooter(isRTL)}>
                        <div className="ml-auto flex items-center gap-3">
                            <button type="button" onClick={closeModal} className="text-xs font-bold text-gray-400 hover:text-[#0f2044] transition-colors">
                                {isRTL ? "إلغاء" : "Cancel"}
                            </button>
                            <button
                                type="submit"
                                disabled={processing || (isEditing && isUnchanged)}
                                className={`${DS_btnGold} ${isEditing && isUnchanged ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                {processing && <Loader2 size={16} className="animate-spin" />}
                                {isEditing ? (isRTL ? "حفظ التعديلات" : "Finalize Changes") : (isRTL ? "تسجيل المدير" : "Enroll Manager")}
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
                            {isRTL ? "استيراد مدراء المدارس (Excel)" : "Import School Managers (Excel)"}
                        </h3>
                    </div>
                    <button onClick={() => { setIsImportModalOpen(false); resetImport(); }} className={DS_modalClose}>
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    postImport(route('admin.school-admins.import'), {
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
                                <a href={route('admin.school-admins.template')} className="inline-flex items-center gap-2 mt-3 text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest underline">
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

        {/* --- Delete Confirmation Modal --- */}
        <ConfirmationModal
            show={!!userToDelete}
            onClose={() => !isDeleting && setUserToDelete(null)}
            onConfirm={confirmDeleteUser}
            title={isRTL ? "حذف مدير المدرسة" : "Delete School Manager"}
            message={
                isRTL
                    ? `هل أنت متأكد من حذف مدير المدرسة "${userToDelete?.name || ""}" بالكامل؟ لا يمكن التراجع عن هذا الإجراء.`
                    : `Are you sure you want to delete school manager "${userToDelete?.name || ""}"? This action cannot be undone.`
            }
            confirmText={isRTL ? "نعم، حذف" : "Yes, Delete"}
            cancelText={isRTL ? "إلغاء" : "Cancel"}
            type="danger"
            loading={isDeleting}
        />

      </div>
    </AuthenticatedLayout>
  );
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
