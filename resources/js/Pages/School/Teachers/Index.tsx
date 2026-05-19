import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import useTranslation from "@/hooks/useTranslation";
import PrintReportHeader from "@/Components/PrintReportHeader";
import { motion } from "framer-motion";
import { 
  Users, CheckCircle2, UserX, UserPlus, Printer, X, GraduationCap, Edit2, Trash2,
  Eye, MoreVertical, Phone, Mail, Fingerprint, AlertTriangle, ArrowLeft, CreditCard,
  Upload, Download, Loader2, Search
} from "lucide-react";
import Dropdown from "@/Components/Dropdown";
import Toggle from "@/Components/Toggle";
import BaseDataTable, { type FilterTab } from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import {
  DS_card, DS_pageWrapper, DS_pageTitle, DS_statLabel, DS_statValue,
  DS_avatar, DS_tableWrapper, DS_tableBase, DS_tableHead, DS_tableRow, DS_tableTd,
  DS_searchInput, DS_btnGold, DS_btnSuccess, DS_btnSecondary, DS_btnEdit, DS_btnDanger,
  DS_inputCls, DS_selectCls, DS_labelCls, DS_cancelBtn, DS_confirmModal,
  DS_statCard, DS_statIcon, DS_badge, DS_filterBtn, DS_tableTh,
  DS_modalHeader, DS_sectionHeader, DS_submitBtn,
  DS_modalContainer, DS_modalHeaderTitle, DS_modalHeaderAccent, DS_modalClose, DS_modalBody,
} from "@/lib/DS";

// ─── Types ───────────────────────────────────────────────────────
interface Teacher {
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
  national_id: string;
  email: string | null;
  phone: string;
  is_active: boolean;
  image?: string | null;
  grade_id?: number | null;
  grade_name?: string | null;
  preferred_language?: string | null;
  address?: string | null;
}

interface Grade {
  id: number;
  name: string;
  teacher_name?: string | null;
}

interface Props {
  auth: any;
  teachers: Teacher[];
  counts: { all: number; active: number; inactive: number };
  grades: Grade[];
  filters: { search?: string };
}

// ─── Print CSS ───────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area {
    position: absolute;
    inset: 0;
    width: 100%;
    padding: 30px 24px;
    background: white !important;
    color: black !important;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  }
  table {
    width: 100% !important;
    border-collapse: collapse !important;
  }
  th, td {
    border: 1px solid #cbd5e1 !important;
    padding: 8px 12px !important;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
    font-size: 10px !important;
  }
  th {
    background-color: #f8fafc !important;
    font-weight: 700 !important;
    color: #1e293b !important;
  }
  tr:nth-child(even) {
    background-color: #f8fafc !important;
  }
}
`;

// Helper functions for dynamic name translations with fallbacks
const getTeacherDisplayName = (teacher: any, isRtl: boolean): string => {
  const nameAr = teacher.name || "";
  const nameEn = teacher.name_en || "";
  if (isRtl) {
    return nameAr.trim() ? nameAr : (nameEn.trim() ? nameEn : "—");
  } else {
    return nameEn.trim() ? nameEn : (nameAr.trim() ? nameAr : "—");
  }
};

const getTeacherAlternateName = (teacher: any, isRtl: boolean): string => {
  const nameAr = teacher.name || "";
  const nameEn = teacher.name_en || "";
  if (isRtl) {
    return nameEn.trim() && nameEn !== nameAr ? nameEn : "";
  } else {
    return nameAr.trim() && nameAr !== nameEn ? nameAr : "";
  }
};

// ─── Component ───────────────────────────────────────────────────
export default function TeachersIndex({ auth, teachers, counts, grades = [], filters }: Props) {
  const { t, isRtl } = useTranslation();
  const { flash } = usePage().props as any;

  const [search, setSearch] = useState(filters.search || "");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Import / Export State
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const {
    data: importData,
    setData: setImportData,
    post: postImport,
    errors: importErrors,
    reset: resetImport
  } = useForm({
    file: null as File | null
  });

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    _method: "post" as "post" | "put",
    first_name_ar: "",
    last_name_ar: "",
    first_name_en: "",
    last_name_en: "",
    national_id: "",
    email: "",
    phone: "",
    is_active: true,
    image: null as File | null,
    remove_image: false,
    grade_id: "" as string | number,
    preferred_language: "ar",
    address: "",
  });

  // ── Debounced Search ──────────────────────────────────────────
  const debouncedSearch = useMemo(() =>
    debounce((value: string) => {
      router.get(route("school.teachers.index"), { search: value }, { preserveState: true, replace: true });
    }, 300), []
  );
  const handleSearch = (value: string) => { setSearch(value); debouncedSearch(value); };

  // ── Filter ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (activeFilter === "active") return teachers.filter(t => t.is_active);
    if (activeFilter === "inactive") return teachers.filter(t => !t.is_active);
    return teachers;
  }, [teachers, activeFilter]);

  // ── Modal Helpers ─────────────────────────────────────────────
  const openAdd = () => {
    setModalMode("create");
    setCurrentTeacher(null);
    reset();
    setData("_method", "post");
    setPreviewImage(null);
    clearErrors();
    setIsModalOpen(true);
  };

  const openView = (teacher: Teacher) => {
    setCurrentTeacher(teacher);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openEdit = (teacher: Teacher) => {
    setModalMode("edit");
    setCurrentTeacher(teacher);
    setData({
      _method: "put",
      first_name_ar: teacher.first_name_ar || "",
      last_name_ar: teacher.last_name_ar || "",
      first_name_en: teacher.first_name_en || "",
      last_name_en: teacher.last_name_en || "",
      national_id: teacher.national_id || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      is_active: !!teacher.is_active,
      image: null,
      remove_image: false,
      grade_id: teacher.grade_id || "",
      preferred_language: teacher.preferred_language || "ar",
      address: teacher.address || "",
    });
    setPreviewImage(teacher.image ? `/storage/${teacher.image}` : null);
    clearErrors();
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData(data => ({ ...data, image: file, remove_image: false }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setData(data => ({ ...data, image: null, remove_image: true }));
    setPreviewImage(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "edit" && currentTeacher) {
      post(route("school.teachers.update", currentTeacher.id), {
        forceFormData: true,
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("school.teachers.store"), {
        onSuccess: () => closeModal(),
      });
    }
  };

  const confirmDelete = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    if (teacherToDelete) {
      router.delete(route("school.teachers.destroy", teacherToDelete.id), {
        onSuccess: () => {
          setShowDeleteModal(false);
          setTeacherToDelete(null);
          setIsModalOpen(false);
        },
        onFinish: () => setIsDeleting(false),
      });
    }
  };

  // Export & Import Handlers
  const handleExport = () => {
    window.location.href = route('school.teachers.export');
  };
  const handleDownloadTemplate = () => {
    window.location.href = route('school.teachers.template');
  };
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsImporting(true);
    postImport(route('school.teachers.import'), {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: () => {
        setShowImportModal(false);
        resetImport();
      },
      onFinish: () => setIsImporting(false)
    });
  };

  const filterBtns = [
    { key: "all",      label: t("All"),      count: counts.all },
    { key: "active",   label: t("Active"),   count: counts.active },
    { key: "inactive", label: t("Inactive"), count: counts.inactive },
  ];

  const columnHelper = createColumnHelper<Teacher>();
  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: t("Teacher"),
      cell: (info) => {
        const teacher = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className={DS_avatar}>
              {teacher.image ? (
                <img
                  src={`/storage/${teacher.image}`}
                  alt={teacher.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                getTeacherDisplayName(teacher, isRtl).charAt(0)
              )}
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <p className="font-semibold text-[#0f2044] dark:text-white">
                {getTeacherDisplayName(teacher, isRtl)}
              </p>
              {getTeacherAlternateName(teacher, isRtl) ? (
                <p className="text-xs text-gray-400">
                  {getTeacherAlternateName(teacher, isRtl)}
                </p>
              ) : null}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("national_id", {
      header: t("Civil ID"),
      cell: (info) => (
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("phone", {
      header: t("Phone Number"),
      cell: (info) => (
        <span className="font-mono text-gray-700 dark:text-gray-300 text-xs">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("email", {
      header: t("Email"),
      cell: (info) => (
        <span className="text-gray-500 dark:text-gray-400 text-xs">
          {info.getValue() || "—"}
        </span>
      ),
    }),
    columnHelper.accessor("grade_name", {
      header: t("Grade Responsible For"),
      cell: (info) => {
        const name = info.getValue();
        return name ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#0f2044]/[0.07] dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8]">
            {name}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-600 text-xs italic">
            {t("No Grade Assigned")}
          </span>
        );
      },
    }),
    columnHelper.accessor("is_active", {
      header: t("Status"),
      cell: (info) => (
        <span className={DS_badge(info.getValue())}>
          {info.getValue() ? t("Active") : t("Inactive")}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: t("Actions"),
      cell: (info) => {
        const teacher = info.row.original;
        return (
          <div className={`flex gap-2 ${isRtl ? "justify-start" : "justify-end"}`}>
            <button
              onClick={() => openView(teacher)}
              className={DS_btnEdit}
              title={t("View Record")}
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => openEdit(teacher)}
              className={DS_btnEdit}
              title={t("Edit")}
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => confirmDelete(teacher)}
              className={DS_btnDanger}
              title={t("Delete")}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      },
    }),
  ], [isRtl, t]);

  const printHeaders = ["#", t("Teacher"), t("Civil ID"), t("Phone Number"), t("Grade Responsible For"), t("Preferred Language")];

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={<h2 className={DS_pageTitle}>{t("Teachers Management")}</h2>}
    >
      <Head title={t("Teachers")} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area ─────────────────────────────────────────────── */}
      <div id="print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRtl ? "rtl" : "ltr"}>
        <PrintReportHeader
          title={t("Teachers Report")}
          schoolName=""
          schoolLogo={null}
          printDate={`${t("Print Date")}: ${new Date().toLocaleDateString(isRtl ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}`}
          schoolAdminText={t("School Admin")}
        />
        <div className="px-4">
          <table className="w-full border-collapse border border-gray-300 text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                {printHeaders.map((h, i) => (
                  <th key={i} className={`border border-gray-300 p-2 ${isRtl ? "text-right" : "text-left"} font-bold text-black ${i === 0 ? "w-10" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((teacher, i) => (
                <tr key={teacher.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-2 text-center text-gray-700 font-semibold">{i + 1}</td>
                  <td className="border border-gray-300 p-2 font-bold text-gray-900" style={{ textAlign: isRtl ? 'right' : 'left' }}>{getTeacherDisplayName(teacher, isRtl)}</td>
                  <td className="border border-gray-300 p-2 font-mono text-gray-700" style={{ textAlign: isRtl ? 'right' : 'left' }}>{teacher.national_id}</td>
                  <td className="border border-gray-300 p-2 font-mono text-gray-700" dir="ltr" style={{ textAlign: isRtl ? 'right' : 'left' }}>{teacher.phone}</td>
                  <td className="border border-gray-300 p-2 text-gray-700" style={{ textAlign: isRtl ? 'right' : 'left' }}>{teacher.grade_name || "—"}</td>
                  <td className="border border-gray-300 p-2 font-bold text-gray-900" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                    {teacher.preferred_language === "en" ? t("English") : t("Arabic")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{t("Total Teachers")}: {filtered.length}</p>
            <p>{t("Principal Signature")}: ............................</p>
          </div>
        </div>
      </div>

      {/* ── Main UI ─────────────────────────────────────────────────── */}
      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`}>

        {/* Simple Analytics Row */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 md:p-4 rounded-[18px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] shadow-sm">
            <div className="w-10 h-10 rounded-[12px] bg-[#0f2044]/10 dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 leading-none mb-1 truncate">{t("Total Teachers")}</p>
              <h4 className="text-lg md:text-xl font-black text-[#0f2044] dark:text-white leading-none">{counts.all}</h4>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 md:p-4 rounded-[18px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] shadow-sm">
            <div className="w-10 h-10 rounded-[12px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 leading-none mb-1 truncate">{t("Active")}</p>
              <h4 className="text-lg md:text-xl font-black text-[#0f2044] dark:text-white leading-none">{counts.active}</h4>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 md:p-4 rounded-[18px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] shadow-sm">
            <div className="w-10 h-10 rounded-[12px] bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 leading-none mb-1 truncate">{t("Inactive")}</p>
              <h4 className="text-lg md:text-xl font-black text-[#0f2044] dark:text-white leading-none">{counts.inactive}</h4>
            </div>
          </div>
        </motion.div>

        {/* Error reporting for import */}
        {flash?.import_errors && flash.import_errors.length > 0 && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl">
            <h4 className="text-rose-600 dark:text-rose-400 font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {isRtl ? "أخطاء في عملية الاستيراد:" : "Import Validation Errors:"}
            </h4>
            <ul className="list-disc list-inside text-xs text-rose-500 dark:text-rose-400 space-y-1 overflow-y-auto max-h-40 custom-scrollbar">
              {flash.import_errors.map((err: string, i: number) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Table Card */}
        <div className={DS_card}>
          {/* Custom Responsive Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 mb-6 border-b border-gray-100 dark:border-white/5">
            {/* Search & Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md group">
                <span className={`absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#f5b800] transition-colors`}>
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={t("Search name, ID, phone...")}
                  className={`${DS_searchInput} ${isRtl ? "pr-11" : "pl-11"}`}
                  dir={isRtl ? "rtl" : "ltr"}
                />
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 md:py-0">
                {filterBtns.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    className={`${DS_filterBtn(activeFilter === tab.key)} whitespace-nowrap flex items-center gap-2`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        activeFilter === tab.key 
                          ? "bg-white/20 text-white" 
                          : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleExport}
                className={DS_btnGold}
                title={t("Export Excel")}
              >
                <Download size={16} />
                <span>{t("Export")}</span>
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className={DS_btnSecondary}
                title={t("Import Excel")}
              >
                <Upload size={16} />
                <span>{t("Import")}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#0f2044] dark:hover:text-white transition-all shadow-sm"
                title={t("Print")}
              >
                <Printer size={16} />
              </button>
              <button onClick={openAdd} className={DS_btnSuccess}>
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>{t("Add New Teacher")}</span>
              </button>
            </div>
          </div>

          <BaseDataTable<Teacher>
            columns={columns}
            data={filtered}
            hideCard={true}
          />
        </div>
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────── */}
      <Modal show={isModalOpen} onClose={closeModal} maxWidth="3xl">
        <div className={DS_modalContainer}>
          <div className={DS_modalHeader(isRtl)}>
            <div className="flex items-center gap-3">
              <div className={DS_modalHeaderAccent} />
              <h3 className={DS_modalHeaderTitle}>
                {modalMode === "view"
                  ? (isRtl ? "بيانات المعلم" : "Teacher Dossier")
                  : modalMode === "edit"
                  ? (isRtl ? "تحديث ملف المعلم" : "Update Teacher Dossier")
                  : (isRtl ? "تسجيل معلم جديد" : "Enroll New Teacher")}
              </h3>
            </div>
            <button onClick={closeModal} className={DS_modalClose}>
              <ArrowLeft size={18} className={isRtl ? 'rotate-180' : ''} />
            </button>
          </div>

          {modalMode === "view" ? (
            /* View Mode Body */
            <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
              {/* Profile Card */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 sm:p-6 rounded-[22px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm text-center sm:text-start">
                <div className={DS_avatar + " w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] border-4 border-white dark:border-[#243460] overflow-hidden shadow-lg shrink-0"}>
                  {currentTeacher?.image ? <img src={`/storage/${currentTeacher.image}`} className="w-full h-full object-cover" alt={currentTeacher.name} /> : currentTeacher?.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl sm:text-2xl font-black text-[#0f2044] dark:text-white mb-2">
                    {!isRtl && currentTeacher?.name_en ? currentTeacher?.name_en : currentTeacher?.name}
                  </h4>
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                    <span className={DS_badge(currentTeacher?.is_active || false)}>{currentTeacher?.is_active ? t("Active") : t("Inactive")}</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#0f2044]/[0.07] dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8]">
                      {currentTeacher?.grade_name || t("No Grade")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600"><Fingerprint className="w-6 h-6" /></div>
                  <div><p className={DS_labelCls}>{t("Civil ID")}</p><p className="font-bold text-[#0f2044] dark:text-white">{currentTeacher?.national_id}</p></div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-[14px] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600"><Phone className="w-6 h-6" /></div>
                  <div><p className={DS_labelCls}>{t("Phone Number")}</p><p className="font-bold text-[#0f2044] dark:text-white" dir="ltr">{currentTeacher?.phone}</p></div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-[14px] bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600"><Mail className="w-6 h-6" /></div>
                  <div className="min-w-0"><p className={DS_labelCls}>{t("Email")}</p><p className="font-bold text-[#0f2044] dark:text-white truncate">{currentTeacher?.email || "—"}</p></div>
                </div>
              </div>
            </div>
          ) : (
            /* Edit / Create Mode Body */
            <form onSubmit={submit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-3.5 space-y-4 max-h-[85vh]">
                
                {/* §1 The Names */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#243460] pb-1.5">
                    <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] flex items-center gap-2">
                      <Users size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                      {isRtl ? "الأسماء الرسمية" : "Official Names"}
                    </h4>
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">
                      {isRtl ? "* مطلوب عربي أو إنجليزي" : "* Req: Arabic or English"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Arabic Panel */}
                    <div className="p-2.5 bg-gray-50/50 dark:bg-[#0f2044]/10 rounded-xl border border-gray-100/80 dark:border-[#243460]/40 space-y-2">
                      <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider">{isRtl ? "البيانات بالعربية" : "ARABIC DOSSIER"}</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className={DS_labelCls}>{isRtl ? "الاسم الأول" : "First Name"} {!data.first_name_en && !data.last_name_en && <span className="text-rose-500">*</span>}</label>
                          <input type="text" value={data.first_name_ar} onChange={e => setData("first_name_ar", e.target.value)} className={DS_inputCls} dir="rtl" required={!data.first_name_en && !data.last_name_en} />
                          <InputError message={errors.first_name_ar} />
                        </div>
                        <div className="space-y-1">
                          <label className={DS_labelCls}>{isRtl ? "الاسم الأخير" : "Last Name"} {!data.first_name_en && !data.last_name_en && <span className="text-rose-500">*</span>}</label>
                          <input type="text" value={data.last_name_ar} onChange={e => setData("last_name_ar", e.target.value)} className={DS_inputCls} dir="rtl" required={!data.first_name_en && !data.last_name_en} />
                          <InputError message={errors.last_name_ar} />
                        </div>
                      </div>
                    </div>
                    {/* English Panel */}
                    <div className="p-2.5 bg-gray-50/50 dark:bg-[#0f2044]/10 rounded-xl border border-gray-100/80 dark:border-[#243460]/40 space-y-2">
                      <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider">{isRtl ? "البيانات بالإنجليزية" : "ENGLISH DOSSIER"}</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className={DS_labelCls}>{isRtl ? "الاسم الأول" : "First Name"} {!data.first_name_ar && !data.last_name_ar && <span className="text-rose-500">*</span>}</label>
                          <input type="text" value={data.first_name_en} onChange={e => setData("first_name_en", e.target.value)} className={DS_inputCls} dir="ltr" required={!data.first_name_ar && !data.last_name_ar} />
                          <InputError message={errors.first_name_en} />
                        </div>
                        <div className="space-y-1">
                          <label className={DS_labelCls}>{isRtl ? "الاسم الأخير" : "Last Name"} {!data.first_name_ar && !data.last_name_ar && <span className="text-rose-500">*</span>}</label>
                          <input type="text" value={data.last_name_en} onChange={e => setData("last_name_en", e.target.value)} className={DS_inputCls} dir="ltr" required={!data.first_name_ar && !data.last_name_ar} />
                          <InputError message={errors.last_name_en} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* §2 Personal Identity & Profile Photo */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-1.5 flex items-center gap-2">
                    <CreditCard size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                    {isRtl ? "الهوية الشخصية والصورة" : "Personal Identity & Photo"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className={DS_labelCls}>{isRtl ? "الرقم المدني" : "Civil ID"} <span className="text-rose-500">*</span></label>
                          <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value)} className={`${DS_inputCls} font-mono`} dir="ltr" required />
                          <InputError message={errors.national_id} />
                        </div>
                        <div className="space-y-1">
                          <label className={DS_labelCls}>{isRtl ? "رقم الجوال" : "Phone Number"} <span className="text-rose-500">*</span></label>
                          <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value)} className={`${DS_inputCls} font-mono`} dir="ltr" required />
                          <InputError message={errors.phone} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-1.5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
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
                            <Users size={16} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-[#0f2044] dark:text-white leading-tight">{isRtl ? "الصورة الشخصية" : "Profile Photo"}</p>
                          {!data.image && !previewImage ? (
                            <label className="cursor-pointer text-[9px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline mt-0.5 inline-block">
                              {isRtl ? "اختيار صورة" : "Choose Photo"}
                              <input type="file" className="hidden" accept="image/*" onChange={e => {
                                const file = e.target.files?.[0] || null;
                                setData({ ...data, image: file, remove_image: false });
                              }} />
                            </label>
                          ) : (
                            <span className="text-[9px] font-black text-gray-400 mt-0.5 inline-block uppercase">{isRtl ? "مرفق ✓" : "Attached ✓"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* §3 Academic Assignment */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-1.5 flex items-center gap-2">
                    <GraduationCap size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                    {isRtl ? "البيانات الأكاديمية والحساب" : "Academic Credentials & Account"}
                  </h4>
                  <div className="space-y-3">
                    {/* Row 1: Grade & Preferred Language */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={DS_labelCls}>{isRtl ? "الصف الدراسي" : "Grade"}</label>
                        <select value={data.grade_id} onChange={e => setData("grade_id", e.target.value)} className={DS_selectCls}>
                          <option value="">{t("Select Grade")}</option>
                          {grades.map(g => {
                            const isTaken = g.teacher_name && g.id !== currentTeacher?.grade_id;
                            return (
                              <option key={g.id} value={g.id} disabled={!!isTaken}>
                                {g.name} {g.teacher_name ? `(${t("Taken by")}: ${g.teacher_name})` : ""}
                              </option>
                            );
                          })}
                        </select>
                        <InputError message={errors.grade_id} />
                      </div>
                      <div>
                        <label className={DS_labelCls}>{t("Preferred Language")}</label>
                        <select value={data.preferred_language} onChange={e => setData("preferred_language", e.target.value)} className={DS_selectCls}>
                          <option value="ar">{t("Arabic")}</option>
                          <option value="en">{t("English")}</option>
                        </select>
                        <InputError message={errors.preferred_language} />
                      </div>
                    </div>

                    {/* Row 2: Email & Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={DS_labelCls}>{isRtl ? "البريد الإلكتروني" : "Email"}</label>
                        <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} className={DS_inputCls} />
                        <InputError message={errors.email} />
                      </div>
                      <div>
                        <label className={DS_labelCls}>{t("Address")}</label>
                        <input type="text" value={data.address} onChange={e => setData("address", e.target.value)} className={DS_inputCls} />
                        <InputError message={errors.address} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Footer Bar with Inline Independent Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 gap-4">
                <div>
                  <Toggle 
                    label={t("Status")}
                    description={data.is_active ? t("Active") : t("Inactive")}
                    enabled={data.is_active}
                    onChange={v => setData("is_active", v)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => (modalMode === "edit" ? setModalMode("view") : closeModal())} 
                    className={DS_cancelBtn}
                  >
                    {t("Cancel")}
                  </button>
                  <button 
                    type="submit" 
                    disabled={processing} 
                    className={DS_submitBtn(processing)}
                  >
                    {modalMode === "edit" ? t("Save Changes") : t("Add Teacher")}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ───────────────────────────────── */}
      {showDeleteModal && (
        <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="sm">
          <div className={DS_confirmModal}>
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-[#0f2044] dark:text-white mb-2">{t("Confirm Deletion")}</h3>
            <p className="font-bold text-[#0f2044] dark:text-[#7ba7e8] bg-[#0f2044]/5 dark:bg-[#0f2044]/30 py-2 px-4 rounded-xl inline-block mb-3">
              {!isRtl && teacherToDelete?.name_en ? teacherToDelete?.name_en : teacherToDelete?.name}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {t("Are you sure you want to delete this? This action cannot be undone.")}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className={`flex-1 py-3 ${DS_cancelBtn} disabled:opacity-50`}>{t("Cancel")}</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-3 rounded-[14px] bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow disabled:opacity-50">
                {isDeleting ? t("Deleting...") : t("Yes, Delete")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      <Modal show={showImportModal} onClose={() => setShowImportModal(false)} maxWidth="md">
        <div className={DS_modalHeader(isRtl)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <h3 className="text-xl font-bold text-white">{t("Import Teachers")}</h3>
              <p className="text-[#7ba7e8] text-xs font-bold tracking-wider">{t("Upload Excel File")}</p>
            </div>
          </div>
          <button onClick={() => setShowImportModal(false)} className={DS_modalClose}>
            <X size={20} />
          </button>
        </div>
        <div className={DS_modalBody}>
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">{t("Important Notes:")}</h4>
            <ul className="text-xs text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
              <li>{t("The file must be an Excel file (.xlsx, .xls) or CSV.")}</li>
              <li>{t("First name, Last name, Civil ID, and Phone Number are strictly required.")}</li>
              <li>{t("Grade/Stage is not present in Excel and should be assigned manually after import.")}</li>
            </ul>
            <div className="mt-4">
              <button type="button" onClick={handleDownloadTemplate} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <Download size={14} /> {t("Download Excel Template")}
              </button>
            </div>
          </div>
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <label className={DS_labelCls}>{t("Select File")}</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportData('file', e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#0f2044] file:text-white hover:file:bg-[#162d60] transition-all cursor-pointer border border-gray-200 dark:border-gray-700 rounded-xl"
                required
              />
              <InputError message={importErrors.file} className="mt-2" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowImportModal(false)} className={DS_cancelBtn}>
                {t("Cancel")}
              </button>
              <button type="submit" disabled={isImporting || !importData.file} className={DS_submitBtn(isImporting || !importData.file)}>
                {isImporting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t("Import Data")}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </SchoolAuthenticatedLayout>
  );
}
