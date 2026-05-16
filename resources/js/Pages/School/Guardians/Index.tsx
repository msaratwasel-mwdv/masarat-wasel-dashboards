import { useState, useMemo } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import PrintReportHeader from "@/Components/PrintReportHeader";
import useTranslation from "@/hooks/useTranslation";
import { motion } from "framer-motion";
import {
  Users, CheckCircle2, UserX, UserPlus, Baby, Printer, X, Edit2, Trash2, Eye, MoreVertical, Mail, Phone, MapPin, Fingerprint
} from "lucide-react";
import Dropdown from "@/Components/Dropdown";
import Toggle from "@/Components/Toggle";
import {
  DS_card, DS_pageWrapper, DS_pageTitle, DS_statLabel, DS_statValue,
  DS_avatar, DS_tableWrapper, DS_tableBase, DS_tableHead, DS_tableRow, DS_tableTd,
  DS_searchInput, DS_btnGold, DS_btnSecondary, DS_btnEdit, DS_btnDanger,
  DS_modalContainer, DS_modalHeaderTitle, DS_modalHeaderAccent, DS_modalClose, DS_modalBody,
  DS_inputCls, DS_labelCls, DS_cancelBtn, DS_childAvatar, DS_confirmModal,
  DS_statCard, DS_statIcon, DS_badge, DS_filterBtn, DS_tableTh,
  DS_modalHeader, DS_sectionHeader, DS_childItem, DS_submitBtn, DS_btnSuccess,
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
  national_id: string;
  phone: string;
  email: string | null;
  address: string | null;
  image: string | null;
  status: "active" | "inactive";
  students: Student[];
}

interface Props {
  auth: any;
  guardians: Guardian[];
  filters: { search?: string };
}

// ─── Print CSS ───────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

// ─── Main Component ──────────────────────────────────────────────
export default function ParentsIndex({ auth, guardians, filters }: Props) {
  const { t, isRtl } = useTranslation();

  const [search, setSearch] = useState(filters.search || "");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");
  const [currentGuardian, setCurrentGuardian] = useState<Guardian | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmType, setConfirmType] = useState<"parent" | "student" | "deactivate">("parent");
  const [deleteTargetParent, setDeleteTargetParent] = useState<Guardian | null>(null);
  const [deleteTargetStudent, setDeleteTargetStudent] = useState<Student | null>(null);
  const [childrenModal, setChildrenModal] = useState<Guardian | null>(null);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    _method: "post" as "post" | "put",
    name: "", name_en: "", national_id: "", phone: "", email: "", address: "",
    status: "active" as "active" | "inactive",
    preferred_language: "ar",
  });

  const handleSearch = (v: string) => {
    setSearch(v);
    router.get(route("school.parents.index"), { search: v }, { preserveState: true, replace: true });
  };

  const filtered = useMemo(() => {
    if (activeFilter === "active") return guardians.filter(g => g.status === "active");
    if (activeFilter === "inactive") return guardians.filter(g => g.status === "inactive");
    return guardians;
  }, [guardians, activeFilter]);

  const counts = {
    all: guardians.length,
    active: guardians.filter(g => g.status === "active").length,
    inactive: guardians.filter(g => g.status === "inactive").length,
  };

  const openAdd = () => { 
    setModalMode("create");
    setCurrentGuardian(null);
    reset(); 
    setData("_method", "post"); 
    clearErrors(); 
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
      name: g.name, 
      name_en: g.name_en || "", 
      national_id: g.national_id, 
      phone: g.phone, 
      email: g.email || "", 
      address: g.address || "", 
      status: g.status,
      preferred_language: g.preferred_language || "ar",
    });
    clearErrors(); 
    setIsModalOpen(true);
  };

  const closeModal = () => { 
    setIsModalOpen(false); 
    reset(); 
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = modalMode === "edit";
    if (isEdit && currentGuardian) {
      post(route("school.parents.update", currentGuardian.id), { forceFormData: true, onSuccess: () => closeModal() });
    } else {
      post(route("school.parents.store"), { onSuccess: () => closeModal() });
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
    if (confirmType === "parent" && deleteTargetParent) {
      router.delete(route("school.parents.destroy", deleteTargetParent.id), {
        onSuccess: () => { setShowConfirmModal(false); setDeleteTargetParent(null); setIsModalOpen(false); }
      });
    } else if (confirmType === "student" && deleteTargetStudent && currentGuardian) {
      router.delete(route("school.parents.students.detach", { parent: currentGuardian.id, student: deleteTargetStudent.id }), {
        onSuccess: () => { 
          setShowConfirmModal(false); 
          setDeleteTargetStudent(null);
          // Refresh the current guardian data to reflect student removal
          if (currentGuardian) {
             const updatedStudents = currentGuardian.students.filter(st => st.id !== deleteTargetStudent.id);
             setCurrentGuardian({...currentGuardian, students: updatedStudents});
          }
        }
      });
    } else if (confirmType === "deactivate") {
      setData("status", "inactive");
      setShowConfirmModal(false);
    }
  };

  const handleEditFromView = () => {
    if (currentGuardian) {
      openEdit(currentGuardian);
    }
  };

  const handleDeleteFromView = () => {
    if (currentGuardian) {
      confirmDelete(currentGuardian);
    }
  };

  const stats = [
    { label: t("Total Parents"), val: counts.all,    icon: <Users className="w-5 h-5" />,        accent: "navy"  as const },
  ];

  const filterBtns: any[] = [];

  const tableHeaders = [
    t("Parent"), t("Civil ID"), t("Phone Number"), t("Email"), t("Children"), t("Actions"),
  ];

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={<h2 className={DS_pageTitle}>{t("Parents Management")}</h2>}
    >
      <Head title={t("Parents")} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area ─────────────────────────────────────────────── */}
      <div id="print-area" className="hidden print:block bg-white font-sans text-black w-full" dir="rtl">
        <PrintReportHeader
          title={t("Parents Report")}
          schoolName={auth.user?.school?.name || t("School name not available")}
          schoolLogo={auth.user?.school?.logo || null}
          printDate={`${t("Print Date")}: ${new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}`}
          schoolAdminText={t("School Admin")}
        />
        <div className="px-4">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                {["#", t("Parent"), t("Civil ID"), t("Phone Number")].map((h, i) => (
                  <th key={i} className={`border border-gray-300 p-3 text-right font-bold text-black ${i === 0 ? "w-12" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => (
                <tr key={g.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-3 text-center text-gray-700 font-semibold">{i + 1}</td>
                  <td className="border border-gray-300 p-3 font-bold text-gray-900">{!isRtl && g.name_en ? g.name_en : g.name}</td>
                  <td className="border border-gray-300 p-3 font-mono text-gray-700">{g.national_id}</td>
                  <td className="border border-gray-300 p-3 font-mono text-gray-700" dir="ltr">{g.phone}</td>
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
      <div className={DS_pageWrapper}>


        {/* Table Card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={DS_card}>

          {/* Toolbar */}
          <div className={DS_sectionHeader(isRtl)}>
            <div className="flex-1 min-w-[200px]">
              <input type="text" value={search} onChange={e => handleSearch(e.target.value)} placeholder={t("Search by name, ID, phone...")} className={DS_searchInput} dir={isRtl ? "rtl" : "ltr"} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Filter buttons removed */}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.print()} 
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#0f2044] dark:hover:text-white transition-all shadow-sm"
                title={t("Print")}
              >
                <Printer className="w-4 h-4" />
              </button>
              <button onClick={openAdd} className={DS_btnSuccess}>
                <UserPlus className="w-4 h-4" />
                <span>{t("+ Add Parent")}</span>
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
                          {g.image ? <img src={`/storage/${g.image}`} alt={g.name} className="w-full h-full object-cover" /> : g.name.charAt(0)}
                        </div>
                        <div className={isRtl ? "text-right" : "text-left"}>
                          <p className="font-semibold text-[#0f2044] dark:text-white">{!isRtl && g.name_en ? g.name_en : g.name}</p>
                          {(!isRtl && g.name_en ? g.name : g.name_en) ? <p className="text-xs text-gray-400">{!isRtl && g.name_en ? g.name : g.name_en}</p> : null}
                        </div>
                      </div>
                    </td>
                    <td className={`${DS_tableTd} font-mono text-xs text-gray-500 dark:text-gray-400`}>{g.national_id}</td>
                    <td className={`${DS_tableTd} font-mono text-gray-700 dark:text-gray-300`}>{g.phone}</td>
                    <td className={`${DS_tableTd} text-gray-500 dark:text-gray-400 text-xs`}>{g.email || "—"}</td>
                    <td className={DS_tableTd}>
                      <button onClick={() => setChildrenModal(g)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#f5b800]/10 text-[#7a5c00] dark:text-[#f5b800] text-xs font-bold hover:bg-[#f5b800]/20 transition-all">
                        <Baby className="w-3.5 h-3.5" /><span>{g.students.length}</span>
                      </button>
                    </td>
                    <td className={DS_tableTd}>
                      <div className={`flex gap-2 ${isRtl ? "justify-start" : "justify-end"}`}>
                        <button onClick={() => openView(g)} className={DS_btnEdit} title={t("View Record")}>
                          <Eye className="w-3.5 h-3.5" />
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
      <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
        {/* Modal Header */}
        <div className={DS_modalHeader(isRtl)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <h3 className="text-xl font-bold text-white">
                {modalMode === "view" ? currentGuardian?.name : (modalMode === "edit" ? t("Edit Parent") : t("Add New Parent"))}
              </h3>
              {modalMode === "view" && <p className="text-[#7ba7e8] text-sm font-semibold">{currentGuardian?.national_id}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {modalMode === "view" && (
              <div className="flex items-center gap-2">
                <Dropdown>
                  <Dropdown.Trigger>
                    <button className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </Dropdown.Trigger>
                  <Dropdown.Content align={isRtl ? "left" : "right"} width="40" contentClasses="py-2 bg-white dark:bg-[#1a2845] shadow-2xl rounded-[16px] border border-gray-100 dark:border-[#243460]">
                    <button onClick={handleEditFromView} className="w-full px-4 py-2.5 text-sm font-bold text-[#0f2044] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-start flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-blue-500" />
                      {t("Edit")}
                    </button>
                    <button onClick={handleDeleteFromView} className="w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-start flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      {t("Delete")}
                    </button>
                  </Dropdown.Content>
                </Dropdown>
              </div>
            )}
            <button onClick={closeModal} className={DS_modalClose}><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Modal Body */}
        <div className={`p-8 ${modalMode === "view" ? "space-y-8" : "space-y-4"} overflow-y-auto max-h-[80vh]`}>
          {modalMode === "view" ? (
            /* View Mode Body */
            <>
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
            </>
          ) : (
            /* Edit / Create Mode Body */
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={DS_labelCls}>{t("Name (Arabic)")} *</label>
                  <input type="text" value={data.name} onChange={e => setData("name", e.target.value)} dir="rtl" required className={DS_searchInput} />
                  <InputError message={errors.name} className="mt-1" />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Name (English)")}</label>
                  <input type="text" value={data.name_en} onChange={e => setData("name_en", e.target.value)} dir="ltr" className={DS_searchInput} />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Civil ID")} *</label>
                  <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value)} dir="ltr" required className={DS_searchInput} />
                  <InputError message={errors.national_id} className="mt-1" />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Phone Number")} *</label>
                  <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value)} dir="ltr" required className={DS_searchInput} />
                  <InputError message={errors.phone} className="mt-1" />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Email")}</label>
                  <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} dir="ltr" className={DS_searchInput} />
                  <InputError message={errors.email} className="mt-1" />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Address / House #")}</label>
                  <input type="text" value={data.address} onChange={e => setData("address", e.target.value)} className={DS_searchInput} />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Preferred Language")}</label>
                  <select 
                    value={data.preferred_language} 
                    onChange={e => setData("preferred_language", e.target.value)} 
                    className={DS_searchInput}
                  >
                    <option value="ar">{t("Arabic")}</option>
                    <option value="en">{t("English")}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Toggle
                    label={t("Account Status")}
                    description={data.status === 'active' ? t("Account is active and can login") : t("Account is deactivated. this guardian will no longer receive notifications")}
                    enabled={data.status === 'active'}
                    onChange={val => setData('status', val ? 'active' : 'inactive')}
                  />
                </div>
              </div>
              <div className={`flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 ${isRtl ? 'justify-start' : 'justify-end'}`}>
                <button type="button" onClick={modalMode === "edit" ? () => setModalMode("view") : closeModal} className={DS_cancelBtn}>{t("Cancel")}</button>
                <button type="submit" disabled={processing} className={DS_submitBtn(processing)}>
                  {processing ? t("Saving...") : (modalMode === "edit" ? t("Save Changes") : t("Add"))}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* ── Dynamic Delete Confirm Modal ──────────────────────────── */}
      <Modal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} maxWidth="sm" zIndex={60}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-[#0f2044] dark:text-white mb-2">{t("Confirm Delete")}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-6">
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
          <div className="flex gap-3">
            <button onClick={() => setShowConfirmModal(false)} className={`flex-1 py-3 ${DS_cancelBtn}`}>{t("Cancel")}</button>
            <button onClick={handleConfirmDelete} className="flex-1 py-3 rounded-[14px] bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow">{t("Delete")}</button>
          </div>
        </div>
      </Modal>
    </SchoolAuthenticatedLayout>
  );
}
