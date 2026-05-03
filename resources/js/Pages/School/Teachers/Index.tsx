import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import useTranslation from "@/hooks/useTranslation";
import PrintReportHeader from "@/Components/PrintReportHeader";
import { motion } from "framer-motion";
import { Users, CheckCircle2, UserX, UserPlus, Printer, X, GraduationCap } from "lucide-react";
import {
  DS_card, DS_pageWrapper, DS_pageTitle, DS_statLabel, DS_statValue,
  DS_avatar, DS_tableWrapper, DS_tableBase, DS_tableHead, DS_tableRow, DS_tableTd,
  DS_searchInput, DS_btnGold, DS_btnSecondary, DS_btnEdit, DS_btnDanger,
  DS_inputCls, DS_labelCls, DS_cancelBtn, DS_confirmModal,
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
}

interface Grade {
  id: number;
  name: string;
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
  #print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

// ─── Component ───────────────────────────────────────────────────
export default function TeachersIndex({ auth, teachers, counts, grades = [], filters }: Props) {
  const { t, isRtl } = useTranslation();

  const [search, setSearch] = useState(filters.search || "");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
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
    password: "",
    is_active: true,
    image: null as File | null,
    grade_id: "" as string | number,
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
  const openAddModal = () => {
    setIsEditing(false); setCurrentId(null); setPreviewImage(null);
    reset(); setData("_method", "post"); clearErrors(); setCurrentStep(1); setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setIsEditing(true); setCurrentId(teacher.id);
    setPreviewImage(teacher.image ? `/storage/${teacher.image}` : null);
    setData({
      _method: "put",
      first_name_ar: teacher.first_name_ar || "",
      second_name_ar: teacher.second_name_ar || "",
      third_name_ar: teacher.third_name_ar || "",
      last_name_ar: teacher.last_name_ar || "",
      first_name_en: teacher.first_name_en || "",
      second_name_en: teacher.second_name_en || "",
      third_name_en: teacher.third_name_en || "",
      last_name_en: teacher.last_name_en || "",
      national_id: teacher.national_id || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      password: "",
      is_active: !!teacher.is_active,
      image: null,
      grade_id: teacher.grade_id || "",
    });
    clearErrors(); setCurrentStep(1); setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setPreviewImage(null); reset(); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentId) {
      post(route("school.teachers.update", currentId), { forceFormData: true, onSuccess: () => closeModal() });
    } else {
      post(route("school.teachers.store"), { onSuccess: () => closeModal() });
    }
  };

  const confirmDelete = (teacher: Teacher) => { setTeacherToDelete(teacher); setShowDeleteModal(true); };
  const handleDelete = () => {
    if (teacherToDelete) {
      router.delete(route("school.teachers.destroy", teacherToDelete.id), {
        onSuccess: () => { setShowDeleteModal(false); setTeacherToDelete(null); }
      });
    }
  };

  const filterBtns = [
    { key: "all",      label: t("All") },
    { key: "active",   label: t("Active") },
    { key: "inactive", label: t("Inactive") },
  ];

  const tableHeaders = [
    t("Teacher"), t("Civil ID"), t("Phone Number"), t("Email"),
    t("Grade Responsible For"), t("Status"), t("Actions"),
  ];

  const printHeaders = ["#", t("Teacher"), t("Civil ID"), t("Phone Number"), t("Grade Responsible For"), t("Status")];

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={<h2 className={DS_pageTitle}>{t("Teachers Management")}</h2>}
    >
      <Head title={t("Teachers")} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area ─────────────────────────────────────────────── */}
      <div id="print-area" className="hidden print:block bg-white font-sans text-black w-full" dir="rtl">
        <PrintReportHeader
          title={t("Teachers Report")}
          schoolName={auth.user?.school?.name || t("School name not available")}
          schoolLogo={auth.user?.school?.logo || null}
          printDate={`${t("Print Date")}: ${new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}`}
          schoolAdminText={t("School Admin")}
        />
        <div className="px-4">
          <table className="w-full border-collapse border border-gray-300 text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                {printHeaders.map((h, i) => (
                  <th key={i} className={`border border-gray-300 p-2 text-right font-bold text-black ${i === 0 ? "w-10" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((teacher, i) => (
                <tr key={teacher.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-2 text-center text-gray-700 font-semibold">{i + 1}</td>
                  <td className="border border-gray-300 p-2 font-bold text-gray-900">{teacher.name}</td>
                  <td className="border border-gray-300 p-2 font-mono text-gray-700">{teacher.national_id}</td>
                  <td className="border border-gray-300 p-2 font-mono text-gray-700" dir="ltr">{teacher.phone}</td>
                  <td className="border border-gray-300 p-2 text-gray-700">{teacher.grade_name || "—"}</td>
                  <td className="border border-gray-300 p-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${teacher.is_active ? "bg-gray-100 text-black border-gray-400" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                      {teacher.is_active ? t("Active") : t("Inactive")}
                    </span>
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
      <div className={DS_pageWrapper}>

        {/* Stat Cards */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: t("Total Teachers"), val: counts.all,     icon: <Users className="w-5 h-5" />,        accent: "navy" as const },
            { label: t("Active"),         val: counts.active,  icon: <CheckCircle2 className="w-5 h-5" />, accent: "gold" as const },
            { label: t("Inactive"),       val: counts.inactive, icon: <UserX className="w-5 h-5" />,       accent: "red"  as const },
          ].map(s => (
            <div key={s.label} className={`${DS_statCard(s.accent)} ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className={DS_statIcon(s.accent)}>{s.icon}</div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <p className={DS_statLabel}>{s.label}</p>
                <p className={DS_statValue}>{s.val}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Table Card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={DS_card}>

          {/* Toolbar */}
          <div className={DS_sectionHeader(isRtl)}>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder={t("Search name, ID, phone...")}
                className={DS_searchInput}
                dir={isRtl ? "rtl" : "ltr"}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {filterBtns.map(f => (
                <button key={f.key} onClick={() => setActiveFilter(f.key)} className={DS_filterBtn(activeFilter === f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => window.print()} className={DS_btnSecondary}>
              <Printer className="w-4 h-4" />{t("Print")}
            </button>
            <button onClick={openAddModal} className={DS_btnGold}>
              <UserPlus className="w-4 h-4" />{t("+ Add New Teacher")}
            </button>
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
                      <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-bold">{t("No Teachers Yet")}</p>
                    </td>
                  </tr>
                ) : filtered.map(teacher => (
                  <tr key={teacher.id} className={DS_tableRow}>
                    {/* Name + Avatar */}
                    <td className={DS_tableTd}>
                      <div className="flex items-center gap-3">
                        <div className={DS_avatar}>
                          {teacher.image
                            ? <img src={`/storage/${teacher.image}`} alt={teacher.name} className="w-full h-full object-cover" />
                            : teacher.name.charAt(0)
                          }
                        </div>
                        <div className={isRtl ? "text-right" : "text-left"}>
                          <p className="font-semibold text-[#0f2044] dark:text-white">{teacher.name}</p>
                          {teacher.name_en && <p className="text-xs text-gray-400">{teacher.name_en}</p>}
                        </div>
                      </div>
                    </td>
                    <td className={`${DS_tableTd} font-mono text-xs text-gray-500 dark:text-gray-400`}>{teacher.national_id}</td>
                    <td className={`${DS_tableTd} font-mono text-gray-700 dark:text-gray-300 text-xs`}>{teacher.phone}</td>
                    <td className={`${DS_tableTd} text-gray-500 dark:text-gray-400 text-xs`}>{teacher.email || "—"}</td>
                    <td className={DS_tableTd}>
                      {teacher.grade_name ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#0f2044]/[0.07] dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8]">
                          {teacher.grade_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600 text-xs italic">{t("No Grade Assigned")}</span>
                      )}
                    </td>
                    <td className={DS_tableTd}>
                      <span className={DS_badge(teacher.is_active)}>
                        {teacher.is_active ? t("Active") : t("Inactive")}
                      </span>
                    </td>
                    <td className={DS_tableTd}>
                      <div className={`flex gap-2 ${isRtl ? "justify-start" : "justify-end"}`}>
                        <button onClick={() => openEditModal(teacher)} className={DS_btnEdit}>{t("Edit")}</button>
                        <button onClick={() => confirmDelete(teacher)} className={DS_btnDanger}>{t("Delete")}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────── */}
      <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
        <div className={DS_modalContainer}>
          {/* Header with step indicator */}
          <div className={DS_modalHeader(isRtl)}>
            <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className={DS_modalHeaderAccent} />
              <h2 className={DS_modalHeaderTitle}>
                {isEditing ? t("Edit Teacher Details") : t("Register New Teacher")}
              </h2>
            </div>
            <div className={`flex items-center gap-6 ${isRtl ? "flex-row-reverse" : ""}`}>
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {[1, 2].map(s => (
                  <div key={s} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${currentStep >= s ? "bg-[#f5b800] text-[#0f2044]" : "bg-white/20 text-white/50"}`}>
                    {s}
                  </div>
                ))}
              </div>
              <button onClick={closeModal} className={DS_modalClose}><X className="w-4 h-4" /></button>
            </div>
          </div>

          <form onSubmit={submit} className={DS_modalBody}>
            {/* Step 1: Name fields */}
            {currentStep === 1 && (
              <div className="space-y-5">
                {/* Image upload */}
                <div className={`flex items-center gap-4 p-4 rounded-[16px] bg-[#0f2044]/[0.04] dark:bg-[#0f2044]/20 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <div className="w-20 h-20 rounded-[14px] bg-white dark:bg-[#0f2044]/30 border border-[#0f2044]/10 dark:border-[#243460] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {data.image
                      ? <img src={URL.createObjectURL(data.image)} alt="Preview" className="w-full h-full object-cover" />
                      : previewImage
                      ? <img src={previewImage} alt="Current" className="w-full h-full object-cover" />
                      : <Users className="w-8 h-8 text-[#0f2044]/30 dark:text-[#7ba7e8]/30" />
                    }
                  </div>
                  <div className={isRtl ? "text-right" : "text-left"}>
                    <p className="text-sm font-bold text-[#0f2044] dark:text-white mb-2">{t("Profile Picture")}</p>
                    <label className="cursor-pointer inline-block px-4 py-2 bg-[#f5b800] hover:bg-[#e0a900] text-[#0f2044] rounded-[12px] text-xs font-bold transition-all">
                      {t("Upload Photo")}
                      <input type="file" className="hidden" accept="image/*" onChange={e => setData("image", e.target.files?.[0] || null)} />
                    </label>
                    <InputError message={errors.image} className="mt-1" />
                  </div>
                </div>

                {/* Arabic Name */}
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider text-[#0f2044]/50 dark:text-[#7ba7e8]/60 border-b border-[#0f2044]/10 dark:border-[#243460] pb-2 mb-3 ${isRtl ? "text-right" : "text-left"}`}>
                    {t("Name (Arabic)")}
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {['first_name_ar', 'second_name_ar', 'third_name_ar', 'last_name_ar'].map(key => (
                      <div key={key}>
                        <label className={DS_labelCls}>{t(key.replace(/_ar$/, '').replace(/_/g, ' '))}</label>
                        <input type="text" value={(data as any)[key]} onChange={e => setData(key as any, e.target.value)} dir="rtl" className={DS_inputCls} required={key.includes('first') || key.includes('last')} />
                        <InputError message={(errors as any)[key]} className="mt-1" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* English Name */}
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider text-[#0f2044]/50 dark:text-[#7ba7e8]/60 border-b border-[#0f2044]/10 dark:border-[#243460] pb-2 mb-3 ${isRtl ? "text-right" : "text-left"}`}>
                    {t("Name (English)")}
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {['first_name_en', 'second_name_en', 'third_name_en', 'last_name_en'].map(key => (
                      <div key={key}>
                        <label className={DS_labelCls}>{t(key.replace(/_en$/, '').replace(/_/g, ' '))}</label>
                        <input type="text" value={(data as any)[key]} onChange={e => setData(key as any, e.target.value)} dir="ltr" className={DS_inputCls} />
                        <InputError message={(errors as any)[key]} className="mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact & Preferences */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={DS_labelCls}>{t("Civil ID")}</label>
                    <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value)} dir="ltr" required className={DS_inputCls} />
                    <InputError message={errors.national_id} className="mt-1" />
                  </div>
                  <div>
                    <label className={DS_labelCls}>{t("Phone Number")}</label>
                    <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value)} dir="ltr" placeholder="5X XXX XXXX" required className={DS_inputCls} />
                    <InputError message={errors.phone} className="mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={DS_labelCls}>{t("Email")}</label>
                    <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} dir="ltr" className={DS_inputCls} />
                    <InputError message={errors.email} className="mt-1" />
                  </div>
                  <div>
                    <label className={DS_labelCls}>{t("Grade Responsible For")}</label>
                    <select value={data.grade_id} onChange={e => setData("grade_id", e.target.value)} className={DS_inputCls}>
                      <option value="">{t("Unassigned")}</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <InputError message={errors.grade_id} className="mt-1" />
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={data.is_active}
                      onChange={e => setData("is_active", e.target.checked)}
                      className="w-4 h-4 rounded accent-[#f5b800]"
                    />
                    <label htmlFor="is_active" className="text-sm font-bold text-[#0f2044] dark:text-white">{t("Active Account")}</label>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-[#0f2044]/10 dark:border-[#243460] mt-2">
              <button type="button" onClick={currentStep === 1 ? closeModal : () => setCurrentStep(1)} className={DS_cancelBtn}>
                {currentStep === 1 ? t("Cancel") : t("Back")}
              </button>
              <div className="flex gap-3">
                {currentStep === 1 ? (
                  <button type="button" onClick={() => setCurrentStep(2)} className={DS_btnGold}>
                    {t("Next")}
                  </button>
                ) : (
                  <button type="submit" disabled={processing} className={DS_submitBtn(processing)}>
                    {isEditing ? t("Save Changes") : t("Add Teacher")}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Delete Modal ──────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className={DS_confirmModal} onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-[#0f2044] dark:text-white mb-2">{t("Confirm Deletion")}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{t("Are you sure? This cannot be undone.")}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className={`flex-1 py-3 ${DS_cancelBtn}`}>{t("Cancel")}</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-[14px] bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow">{t("Delete")}</button>
            </div>
          </div>
        </div>
      )}
    </SchoolAuthenticatedLayout>
  );
}
