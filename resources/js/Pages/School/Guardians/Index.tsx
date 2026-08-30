import { useState, useMemo } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import PrintReportHeader from "@/Components/PrintReportHeader";
import GuardianAnalyticsOverview from "@/Components/GuardianAnalyticsOverview";
import useTranslation from "@/hooks/useTranslation";
import { motion } from "framer-motion";
import {
  Users, CheckCircle2, UserX, UserPlus, Baby, Printer, X, Edit2, Trash2, Eye,
  Mail, Phone, MapPin, Fingerprint, Camera, Loader2, Upload, Download, AlertTriangle, Search
} from "lucide-react";
import Toggle from "@/Components/Toggle";
import {
  DS_card, DS_pageWrapper, DS_pageTitle, DS_avatar, DS_tableWrapper, DS_tableBase,
  DS_tableHead, DS_tableRow, DS_tableTd, DS_searchInput, DS_btnGold, DS_btnSecondary,
  DS_btnEdit, DS_btnDanger, DS_labelCls, DS_cancelBtn, DS_confirmModal,
  DS_badge, DS_filterBtn, DS_tableTh, DS_modalHeader, DS_sectionHeader,
  DS_submitBtn, DS_btnSuccess, DS_modalBody, DS_modalClose, DS_modalContainer,
  DS_inputCls, DS_selectCls
} from "@/lib/DS";

// ─── Types ───────────────────────────────────────────────────────
interface Student {
  id: number;
  name: string;
  national_id: string;
  student_code: string;
  image: string | null;
  classroom: string;
}

interface Guardian {
  id: number;
  name: string;
  name_en: string;
  first_name_ar?: string | null;
  last_name_ar?: string | null;
  first_name_en?: string | null;
  last_name_en?: string | null;
  national_id: string;
  phone: string;
  email: string | null;
  address: string | null;
  image: string | null;
  preferred_language?: string;
  status: "active" | "inactive";
  students: Student[];
}

interface Props {
  auth: any;
  guardians: Guardian[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    with_students: number;
    no_students: number;
    multi_students: number;
    ar_lang: number;
    en_lang: number;
  };
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

// ─── Main Component ──────────────────────────────────────────────
export default function ParentsIndex({ auth, guardians, stats, filters }: Props) {
  const { t, isRtl } = useTranslation();
  const { flash } = usePage().props as any;

  const [search, setSearch] = useState(filters.search || "");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create" | "view_students">("view");
  const [currentGuardian, setCurrentGuardian] = useState<Guardian | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmType, setConfirmType] = useState<"parent" | "student" | "deactivate">("parent");
  const [deleteTargetParent, setDeleteTargetParent] = useState<Guardian | null>(null);
  const [deleteTargetStudent, setDeleteTargetStudent] = useState<Student | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Excel Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const { data: importData, setData: setImportData, post: postImport, processing: isImporting, errors: importErrors, reset: resetImport } = useForm({
    file: null as File | null,
  });

  // دالة ذكية لعرض الصور مع fallback
  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return "/defaults/avatar.png";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    return `/storage/${path}`;
  };

  const handleImageError = (e: any) => {
    e.target.src = "/defaults/avatar.png";
  };

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    _method: "post" as "post" | "put",
    first_name_ar: "",
    last_name_ar: "",
    first_name_en: "",
    last_name_en: "",
    national_id: "",
    phone: "",
    email: "",
    address: "",
    status: "active" as "active" | "inactive",
    preferred_language: "ar",
    image: null as File | null,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData("image", file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = (v: string) => {
    setSearch(v);
    router.get(route("school.parents.index"), { search: v }, { preserveState: true, replace: true });
  };

  const filtered = useMemo(() => {
    if (activeFilter === "active") return guardians.filter(g => g.status === "active");
    if (activeFilter === "inactive") return guardians.filter(g => g.status === "inactive");
    return guardians;
  }, [guardians, activeFilter]);

  const openAdd = () => { 
    setModalMode("create");
    setCurrentGuardian(null);
    reset(); 
    setData(prev => ({
      ...prev,
      _method: "post",
      first_name_ar: "",
      last_name_ar: "",
      first_name_en: "",
      last_name_en: "",
      national_id: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
      preferred_language: "ar",
      image: null,
    }));
    clearErrors(); 
    setImagePreview(null);
    setIsModalOpen(true); 
  };

  const openView = (g: Guardian) => {
    setCurrentGuardian(g);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openEdit = (g: Guardian) => {
    setModalMode("edit");
    setCurrentGuardian(g);
    setData({ 
      _method: "put", 
      first_name_ar: g.first_name_ar || "",
      last_name_ar: g.last_name_ar || "",
      first_name_en: g.first_name_en || "",
      last_name_en: g.last_name_en || "",
      national_id: g.national_id, 
      phone: g.phone, 
      email: g.email || "", 
      address: g.address || "", 
      status: g.status,
      preferred_language: g.preferred_language || "ar",
      image: null,
    });
    setImagePreview(g.image ? getImageUrl(g.image) : null);
    clearErrors(); 
    setIsModalOpen(true);
  };

  const closeModal = () => { 
    setIsModalOpen(false); 
    reset(); 
    setImagePreview(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = modalMode === "edit";
    if (isEdit && currentGuardian) {
      post(route("school.parents.update", currentGuardian.id), { forceFormData: true, onSuccess: () => closeModal() });
    } else {
      post(route("school.parents.store"), { forceFormData: true, onSuccess: () => closeModal() });
    }
  };

  const confirmDelete = (g: Guardian) => { 
    setDeleteTargetParent(g); 
    setConfirmType("parent");
    setShowConfirmModal(true); 
  };

  const confirmStudentDelete = (s: Student) => {
    setDeleteTargetStudent(s);
    setConfirmType("student");
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    if (isDeleting) return;
    setIsDeleting(true);

    if (confirmType === "parent" && deleteTargetParent) {
      router.delete(route("school.parents.destroy", deleteTargetParent.id), {
        onSuccess: () => { setShowConfirmModal(false); setDeleteTargetParent(null); setIsModalOpen(false); },
        onFinish: () => setIsDeleting(false),
      });
    } else if (confirmType === "student" && deleteTargetStudent && currentGuardian) {
      router.delete(route("school.parents.students.detach", { parent: currentGuardian.id, student: deleteTargetStudent.id }), {
        onSuccess: () => { 
          setShowConfirmModal(false); 
          setDeleteTargetStudent(null);
          if (currentGuardian) {
             const updatedStudents = currentGuardian.students.filter(st => st.id !== deleteTargetStudent.id);
             setCurrentGuardian({...currentGuardian, students: updatedStudents});
          }
        },
        onFinish: () => setIsDeleting(false),
      });
    } else if (confirmType === "deactivate") {
      setData("status", "inactive");
      setShowConfirmModal(false);
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    window.location.href = route("school.parents.export");
  };

  const handleDownloadTemplate = () => {
    window.location.href = route("school.parents.template");
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postImport(route("school.parents.import"), {
      onSuccess: () => {
        setShowImportModal(false);
        resetImport();
      },
    });
  };

  // Name Helpers matching Teacher patterns
  const getGuardianDisplayName = (g: Guardian, rtl: boolean) => {
    if (rtl) {
      if (g.first_name_ar || g.last_name_ar) {
        return `${g.first_name_ar || ""} ${g.last_name_ar || ""}`.trim();
      }
      return g.name || "";
    } else {
      if (g.first_name_en || g.last_name_en) {
        return `${g.first_name_en || ""} ${g.last_name_en || ""}`.trim();
      }
      return g.name_en || g.name || "";
    }
  };

  const getGuardianAlternateName = (g: Guardian, rtl: boolean) => {
    if (rtl) {
      if (g.first_name_en || g.last_name_en) {
        return `${g.first_name_en || ""} ${g.last_name_en || ""}`.trim();
      }
      return g.name_en || "";
    } else {
      if (g.first_name_ar || g.last_name_ar) {
        return `${g.first_name_ar || ""} ${g.last_name_ar || ""}`.trim();
      }
      return g.name || "";
    }
  };

  const tableHeaders = [
    t("Parent"), t("Civil ID"), t("Phone Number"), t("Email"), t("Preferred Language"), t("Children"), t("Actions"),
  ];

  const filterBtns = [
    { key: "all", label: t("All"), count: stats.total },
    { key: "active", label: t("Active"), count: stats.active },
    { key: "inactive", label: t("Inactive"), count: stats.inactive },
  ];

  const printHeaders = ["#", t("Parent"), t("Civil ID"), t("Phone Number"), t("Preferred Language")];

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={<h2 className={DS_pageTitle}>{t("Parents Management")}</h2>}
    >
      <Head title={t("Parents")} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area ─────────────────────────────────────────────── */}
      <div id="print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRtl ? "rtl" : "ltr"}>
        <PrintReportHeader
          title={t("Parents Report")}
          schoolName=""
          schoolLogo={null}
          printDate={`${t("Print Date")}: ${new Date().toLocaleDateString(isRtl ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}`}
          schoolAdminText={t("School Admin")}
        />
        <div className="px-4">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                {printHeaders.map((h, i) => (
                  <th key={i} className={`border border-gray-300 p-3 ${isRtl ? "text-right" : "text-left"} font-bold text-black ${i === 0 ? "w-12" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => (
                <tr key={g.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-3 text-center text-gray-700 font-semibold">{i + 1}</td>
                  <td className="border border-gray-300 p-3 font-bold text-gray-900">{getGuardianDisplayName(g, isRtl)}</td>
                  <td className="border border-gray-300 p-3 font-mono text-gray-700">{g.national_id}</td>
                  <td className="border border-gray-300 p-3 font-mono text-gray-700" dir="ltr">{g.phone}</td>
                  <td className="border border-gray-300 p-3 text-gray-700">{g.preferred_language === 'ar' ? t("Arabic") : t("English")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{t("Total Parents")}: {filtered.length}</p>
            <p>{t("Principal Signature")}: ............................</p>
          </div>
        </div>
      </div>

      {/* ── Main UI ─────────────────────────────────────────────────── */}
      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`}>

        {/* Analytics Section */}
        <GuardianAnalyticsOverview stats={stats} />

        {/* Import Validation Flash Errors */}
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
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${DS_card} mt-6`}>

          {/* Custom Responsive Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-3 pb-6 mb-6 border-b border-gray-100 dark:border-white/5">
            {/* Search & Filter pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md group">
                <span className={`absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#f5b800] transition-colors`}>
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  value={search} 
                  onChange={e => handleSearch(e.target.value)} 
                  placeholder={t("Search by name, ID, phone...")} 
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
                <Download className="w-4 h-4" />
                <span>{t("Export")}</span>
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className={DS_btnSecondary}
                title={t("Import Excel")}
              >
                <Upload className="w-4 h-4" />
                <span>{t("Import")}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#0f2044] dark:hover:text-white transition-all shadow-sm"
                title={t("Print")}
              >
                <Printer className="w-4 h-4" />
              </button>
              <button onClick={openAdd} className={DS_btnSuccess}>
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>{isRtl ? "إضافة ولي أمر" : t("Add Parent")}</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className={DS_tableWrapper}>
            <table className={DS_tableBase}>
              <thead className={DS_tableHead}>
                <tr>{tableHeaders.map(h => <th key={h} className={DS_tableTh(isRtl)}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-bold">{t("No parents found")}</p>
                    </td>
                  </tr>
                ) : filtered.map(g => (
                  <tr key={g.id} className={DS_tableRow}>
                    {/* Name */}
                    <td className={DS_tableTd}>
                      <div className="flex items-center gap-3">
                        <div className={DS_avatar}>
                          {g.image ? <img src={getImageUrl(g.image)} alt={g.name} className="w-full h-full object-cover" onError={handleImageError} /> : getGuardianDisplayName(g, isRtl).charAt(0)}
                        </div>
                        <div className={isRtl ? "text-right" : "text-left"}>
                          <p className="font-semibold text-[#0f2044] dark:text-white">{getGuardianDisplayName(g, isRtl)}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${DS_tableTd} font-mono text-xs text-gray-500 dark:text-gray-400`}>{g.national_id}</td>
                    <td className={`${DS_tableTd} font-mono text-gray-700 dark:text-gray-300 text-xs`}>{g.phone}</td>
                    <td className={`${DS_tableTd} text-gray-500 dark:text-gray-400 text-xs`}>{g.email || "—"}</td>
                    <td className={DS_tableTd}>
                      <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] font-bold uppercase text-gray-500">
                        {g.preferred_language === 'ar' ? t("Arabic") : t("English")}
                      </span>
                    </td>
                    <td className={DS_tableTd}>
                      <button onClick={() => { setCurrentGuardian(g); setModalMode("view_students"); setIsModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#f5b800]/10 text-[#7a5c00] dark:text-[#f5b800] text-xs font-bold hover:bg-[#f5b800]/20 transition-all">
                        <Baby className="w-3.5 h-3.5" /><span>{g.students.length}</span>
                      </button>
                    </td>
                    <td className={DS_tableTd}>
                      <div className={`flex gap-2 ${isRtl ? "justify-start" : "justify-end"}`}>
                        <button onClick={() => openView(g)} className={DS_btnEdit} title={t("View Record")}>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(g)} className={DS_btnEdit} title={t("Edit")}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => confirmDelete(g)} className={DS_btnDanger} title={t("Delete")}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* ── Unified Modal ─────────────────────────────────────────── */}
      <Modal show={isModalOpen} onClose={closeModal} maxWidth="3xl">
        <div className={DS_modalContainer}>
          {/* Modal Header */}
          <div className={DS_modalHeader(isRtl)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <h3 className="text-xl font-bold text-white">
                  {modalMode === "view" || modalMode === "view_students" ? getGuardianDisplayName(currentGuardian || ({} as any), isRtl) : (modalMode === "edit" ? t("Edit Parent") : t("Add New Parent"))}
                </h3>
                {(modalMode === "view" || modalMode === "view_students") && <p className="text-[#7ba7e8] text-sm font-semibold">{currentGuardian?.national_id}</p>}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={closeModal} className={DS_modalClose}><X className="w-5 h-5" /></button>
            </div>
          </div>

          {modalMode === "view" || modalMode === "view_students" ? (
            /* View / View Students Mode Body */
            <div className={`p-8 ${modalMode === "view" ? "space-y-8" : "space-y-4"} overflow-y-auto max-h-[80vh]`}>
              {modalMode === "view" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="w-12 h-12 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600"><Fingerprint className="w-6 h-6" /></div>
                    <div><p className={DS_labelCls}>{t("Civil ID")}</p><p className="font-bold text-[#0f2044] dark:text-white">{currentGuardian?.national_id}</p></div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="w-12 h-12 rounded-[14px] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600"><Phone className="w-6 h-6" /></div>
                    <div><p className={DS_labelCls}>{t("Phone Number")}</p><p className="font-bold text-[#0f2044] dark:text-white" dir="ltr">{currentGuardian?.phone}</p></div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="w-12 h-12 rounded-[14px] bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600"><Mail className="w-6 h-6" /></div>
                    <div className="min-w-0"><p className={DS_labelCls}>{t("Email")}</p><p className="font-bold text-[#0f2044] dark:text-white truncate">{currentGuardian?.email || "—"}</p></div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="w-12 h-12 rounded-[14px] bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600"><MapPin className="w-6 h-6" /></div>
                    <div><p className={DS_labelCls}>{t("Address")}</p><p className="font-bold text-[#0f2044] dark:text-white">{currentGuardian?.address || "—"}</p></div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4 px-2">
                  <h4 className="font-bold text-[#0f2044] dark:text-white flex items-center gap-2">
                    <Baby className="w-5 h-5 text-[#f5b800]" /> {t("Children")}
                  </h4>
                  <span className="px-3 py-1 rounded-full bg-[#f5b800]/10 text-[#7a5c00] text-xs font-bold">
                    {currentGuardian?.students.length} {t("Students")}
                  </span>
                </div>
                <div className="space-y-3">
                  {currentGuardian?.students.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 dark:bg-white/5 rounded-[22px] border border-dashed border-gray-200 dark:border-white/10">
                      <p className="text-gray-400 font-bold">{t("No children registered")}</p>
                    </div>
                  ) : currentGuardian?.students.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 rounded-[18px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={DS_avatar}>{s.image ? <img src={`/storage/${s.image}`} alt={s.name} className="w-full h-full object-cover" /> : s.name.charAt(0)}</div>
                        <div><p className="font-bold text-sm text-[#0f2044] dark:text-white">{s.name}</p><p className="text-xs text-gray-500">{s.classroom}</p></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-[10px] font-bold bg-[#f5b800]/10 text-[#7a5c00] px-2.5 py-1 rounded-lg uppercase tracking-wider">{s.national_id}</div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => router.get(route('school.students.index'), { search: s.student_code })}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                            title={t("Edit Student")}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => confirmStudentDelete(s)}
                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                            title={t("Delete Student")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Edit / Create Mode Body */
            <form onSubmit={submit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 max-h-[85vh]">
                
                {/* §1 The Names */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#243460] pb-1.5">
                    <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] flex items-center gap-2">
                      <Users size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                      {isRtl ? "الأسماء الرسمية لولي الأمر" : "Parent's Official Names"}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Arabic Panel */}
                    <div className="p-3 bg-gray-50/50 dark:bg-[#0f2044]/10 rounded-xl border border-gray-100/80 dark:border-[#243460]/40 space-y-2">
                      <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider">{isRtl ? "البيانات بالعربية" : "ARABIC DOSSIER"}</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className={DS_labelCls}>{isRtl ? "الاسم الأول" : "First Name"} <span className="text-rose-500">*</span></label>
                          <input type="text" value={data.first_name_ar} onChange={e => setData("first_name_ar", e.target.value)} className={DS_inputCls} dir="rtl" required />
                          <InputError message={errors.first_name_ar} />
                        </div>
                        <div className="space-y-1">
                          <label className={DS_labelCls}>{isRtl ? "الاسم الأخير" : "Last Name"} <span className="text-rose-500">*</span></label>
                          <input type="text" value={data.last_name_ar} onChange={e => setData("last_name_ar", e.target.value)} className={DS_inputCls} dir="rtl" required />
                          <InputError message={errors.last_name_ar} />
                        </div>
                      </div>
                    </div>
                    {/* English Panel */}
                    <div className="p-3 bg-gray-50/50 dark:bg-[#0f2044]/10 rounded-xl border border-gray-100/80 dark:border-[#243460]/40 space-y-2">
                      <span className="text-[9px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-wider">{isRtl ? "البيانات بالإنجليزية" : "ENGLISH DOSSIER"}</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className={DS_labelCls}>{isRtl ? "الاسم الأول" : "First Name"} <span className="text-rose-500">*</span></label>
                          <input type="text" value={data.first_name_en} onChange={e => setData("first_name_en", e.target.value)} className={DS_inputCls} dir="ltr" required />
                          <InputError message={errors.first_name_en} />
                        </div>
                        <div className="space-y-1">
                          <label className={DS_labelCls}>{isRtl ? "الاسم الأخير" : "Last Name"} <span className="text-rose-500">*</span></label>
                          <input type="text" value={data.last_name_en} onChange={e => setData("last_name_en", e.target.value)} className={DS_inputCls} dir="ltr" required />
                          <InputError message={errors.last_name_en} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* §2 Personal Identity & Profile Photo */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-1.5 flex items-center gap-2">
                    <Fingerprint size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                    {isRtl ? "الهوية الشخصية والصورة" : "Personal Identity & Photo"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className={DS_labelCls}>{isRtl ? "الرقم المدني" : "Civil ID"} <span className="text-rose-500">*</span></label>
                          <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value.replace(/\D/g, ''))} minLength={7} maxLength={20} pattern="\d+" className={`${DS_inputCls} font-mono`} dir="ltr" required />
                          <InputError message={errors.national_id} />
                        </div>
                        <div className="space-y-1">
                          <label className={DS_labelCls}>{isRtl ? "رقم الجوال" : "Phone Number"} <span className="text-rose-500">*</span></label>
                          <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value.replace(/\D/g, ''))} minLength={8} maxLength={20} pattern="\d+" className={`${DS_inputCls} font-mono`} dir="ltr" required />
                          <InputError message={errors.phone} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-[#243460] flex items-center justify-center overflow-hidden bg-white dark:bg-[#0f2044] flex-shrink-0 relative group">
                          {imagePreview ? (
                            <>
                              <img src={imagePreview} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => { setImagePreview(null); setData("image", null); }} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={12} className="text-white" />
                              </button>
                            </>
                          ) : (
                            <Camera size={16} className="text-gray-400 dark:text-[#7ba7e8]/60" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-[#0f2044] dark:text-white leading-tight">{isRtl ? "الصورة الشخصية" : "Profile Photo"}</p>
                          {!imagePreview ? (
                            <label className="cursor-pointer text-[9px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase underline mt-0.5 inline-block">
                              {isRtl ? "اختيار صورة" : "Choose Photo"}
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                          ) : (
                            <span className="text-[9px] font-black text-gray-400 mt-0.5 inline-block uppercase">{isRtl ? "مرفق ✓" : "Attached ✓"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* §3 Account & Address */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.15em] border-b border-gray-100 dark:border-[#243460] pb-1.5 flex items-center gap-2">
                    <Mail size={14} className="text-[#f5b800] dark:text-[#7ba7e8]" />
                    {isRtl ? "البيانات الإضافية والحساب" : "Additional Credentials & Account"}
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={DS_labelCls}>{isRtl ? "البريد الإلكتروني" : "Email"}</label>
                        <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} className={DS_inputCls} dir="ltr" />
                        <InputError message={errors.email} />
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
                    <div>
                      <label className={DS_labelCls}>{t("Address / House #")}</label>
                      <input type="text" value={data.address} onChange={e => setData("address", e.target.value)} className={DS_inputCls} />
                      <InputError message={errors.address} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Footer Bar with Inline Independent Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 gap-4">
                <div>
                  <Toggle 
                    label={t("Status")}
                    description={data.status === 'active' ? t("Active") : t("Inactive")}
                    enabled={data.status === 'active'}
                    onChange={v => setData("status", v ? "active" : "inactive")}
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
                    {modalMode === "edit" ? (isRtl ? "حفظ التغييرات" : t("Save Changes")) : (isRtl ? "إضافة ولي أمر" : t("Add Parent"))}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* ── Dynamic Delete Confirm Modal ──────────────────────────── */}
      <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} maxWidth="md">
        <div className="p-8 text-center">
          <div className="w-20 h-20 rounded-[24px] bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6 border-4 border-red-100 dark:border-red-900/30">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-2xl font-black text-[#0f2044] dark:text-white mb-2">{t("Confirm Delete")}</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
            {confirmType === "parent" 
              ? t("This guardian will be deleted. Are you sure?") 
              : (
                <>
                  {t("Are you sure you want to permanently delete :name? This action cannot be undone.").replace(":name", deleteTargetStudent?.name || "")}
                  {currentGuardian?.students.length === 1 && (
                    <span className="block mt-2 text-orange-600 dark:text-orange-400 font-bold">
                      {t("Note: This is the only student related to this guardian. Removing them will cause the guardian to be hidden from this list.")}
                    </span>
                  )}
                </>
              )}
          </p>
          <div className="flex gap-4">
            <button onClick={() => setShowConfirmModal(false)} disabled={isDeleting} className={`flex-1 py-3 ${DS_cancelBtn} disabled:opacity-50`}>
              {t("Cancel")}
            </button>
            <button onClick={handleConfirmDelete} disabled={isDeleting} className="flex-1 flex justify-center items-center gap-2 py-3 px-6 rounded-[14px] bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/25 disabled:opacity-50">
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : t("Delete")}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Import Modal ─────────────────────────────────────────── */}
      <Modal show={showImportModal} onClose={() => setShowImportModal(false)} maxWidth="md">
        <div className={DS_modalHeader(isRtl)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <h3 className="text-xl font-bold text-white">{t("Import Parents")}</h3>
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
