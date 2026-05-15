import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import useTranslation from "@/hooks/useTranslation";
import PrintReportHeader from "@/Components/PrintReportHeader";
import { motion } from "framer-motion";
import { 
  Users, CheckCircle2, UserX, UserPlus, Printer, X, GraduationCap, Edit2, Trash2,
  Eye, MoreVertical, Phone, Mail, Fingerprint
} from "lucide-react";
import Dropdown from "@/Components/Dropdown";
import Toggle from "@/Components/Toggle";
import {
  DS_card, DS_pageWrapper, DS_pageTitle, DS_statLabel, DS_statValue,
  DS_avatar, DS_tableWrapper, DS_tableBase, DS_tableHead, DS_tableRow, DS_tableTd,
  DS_searchInput, DS_btnGold, DS_btnSecondary, DS_btnEdit, DS_btnDanger,
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
  #print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

// ─── Component ───────────────────────────────────────────────────
export default function TeachersIndex({ auth, teachers, counts, grades = [], filters }: Props) {
  const { t, isRtl } = useTranslation();

  const [search, setSearch] = useState(filters.search || "");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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
    remove_image: false,
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
      remove_image: false,
      grade_id: teacher.grade_id || "",
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
    if (teacherToDelete) {
      router.delete(route("school.teachers.destroy", teacherToDelete.id), {
        onSuccess: () => {
          setShowDeleteModal(false);
          setTeacherToDelete(null);
          setIsModalOpen(false);
        },
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
                  <td className="border border-gray-300 p-2 font-bold text-gray-900">{!isRtl && teacher.name_en ? teacher.name_en : teacher.name}</td>
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
            { label: t("Active"),         val: counts.active,  icon: <CheckCircle2 className="w-5 h-5" />, accent: "green" as const },
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
              <Printer className="w-4 h-4" />
              <span>{t("Print")}</span>
            </button>
            <button onClick={openAdd} className={DS_btnGold}>
              <UserPlus className="w-4 h-4" />
              <span>{t("Add New Teacher")}</span>
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
                          <p className="font-semibold text-[#0f2044] dark:text-white">{!isRtl && teacher.name_en ? teacher.name_en : teacher.name}</p>
                          {(!isRtl && teacher.name_en ? teacher.name : teacher.name_en) ? <p className="text-xs text-gray-400">{!isRtl && teacher.name_en ? teacher.name : teacher.name_en}</p> : null}
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
                        <button onClick={() => openView(teacher)} className={DS_btnEdit} title={t("View Record")}>
                          <Eye size={14} />
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

      {/* ── Add / Edit Modal ──────────────────────────────────────── */}
      <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
        {/* Modal Header */}
        <div className={DS_modalHeader(isRtl)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <h3 className="text-xl font-bold text-white">
                {modalMode === "view" ? currentTeacher?.name : (modalMode === "edit" ? t("Edit Teacher") : t("Add New Teacher"))}
              </h3>
              {modalMode === "view" && <p className="text-[#7ba7e8] text-sm font-semibold">{currentTeacher?.national_id}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {modalMode === "view" && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => currentTeacher && openEdit(currentTeacher)} 
                  className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all flex items-center gap-2 text-sm font-bold border border-white/10"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("Edit")}</span>
                </button>
                <Dropdown>
                  <Dropdown.Trigger>
                    <button className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </Dropdown.Trigger>
                  <Dropdown.Content align={isRtl ? "left" : "right"} width="32" contentClasses="py-2 bg-white dark:bg-[#1a2845] shadow-2xl rounded-[16px] border border-gray-100 dark:border-[#243460]">
                    <button onClick={() => currentTeacher && confirmDelete(currentTeacher)} className="w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-start flex items-center gap-2">
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
              {/* Profile Card */}
              <div className="flex items-center gap-6 p-6 rounded-[22px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm">
                <div className={DS_avatar + " w-24 h-24 rounded-[22px] border-4 border-white dark:border-[#243460] overflow-hidden shadow-lg"}>
                  {currentTeacher?.image ? <img src={`/storage/${currentTeacher.image}`} className="w-full h-full object-cover" alt={currentTeacher.name} /> : currentTeacher?.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-2xl font-black text-[#0f2044] dark:text-white mb-1">
                    {!isRtl && currentTeacher?.name_en ? currentTeacher?.name_en : currentTeacher?.name}
                  </h4>
                  <div className="flex items-center gap-3">
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
            </>
          ) : (
            /* Edit / Create Mode Body */
            <form onSubmit={submit} className="space-y-6">
              {/* Profile Image Upload */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center transition-all group-hover:border-gold-500">
                    {previewImage ? (
                      <img src={previewImage} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-center">
                        <Users className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                        <span className="text-[9px] font-black text-gray-500 uppercase">{t("Photo")}</span>
                      </div>
                    )}
                  </div>
                  
                  {previewImage && (
                    <button 
                      type="button" 
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">{t("Change")}</span>
                  </label>
                </div>
                <InputError message={errors.image} className="mt-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Arabic Name Parts */}
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t("Name (Arabic)")} *</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {["first", "second", "third", "last"].map(p => (
                      <div key={p}>
                        <input type="text" value={(data as any)[`${p}_name_ar`]} onChange={e => setData(`${p}_name_ar` as any, e.target.value)} className={DS_inputCls} placeholder={t(`${p} Name`)} dir="rtl" required />
                        <InputError message={(errors as any)[`${p}_name_ar`]} className="mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
                {/* English Name Parts */}
                <div className="md:col-span-2 space-y-3 pt-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{t("Name (English)")}</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {["first", "second", "third", "last"].map(p => (
                      <div key={p}>
                        <input type="text" value={(data as any)[`${p}_name_en`]} onChange={e => setData(`${p}_name_en` as any, e.target.value)} className={DS_inputCls} placeholder={t(`${p} Name`)} dir="ltr" />
                        <InputError message={(errors as any)[`${p}_name_en`]} className="mt-1" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={DS_labelCls}>{t("Civil ID")} *</label>
                  <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value)} className={DS_inputCls} required />
                  <InputError message={errors.national_id} className="mt-1" />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Phone")} *</label>
                  <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value)} className={DS_inputCls} required />
                  <InputError message={errors.phone} className="mt-1" />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Email")}</label>
                  <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} className={DS_inputCls} />
                  <InputError message={errors.email} className="mt-1" />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Grade")}</label>
                  <select value={data.grade_id} onChange={e => setData("grade_id", e.target.value)} className={DS_selectCls}>
                    <option value="">{t("Select Grade")}</option>
                    {grades.map(g => {
                      const isTaken = g.teacher_name && g.id !== currentTeacher?.grade_id;
                      return (
                        <option key={g.id} value={g.id} disabled={isTaken}>
                          {g.name} {g.teacher_name ? `(${t("Taken by")}: ${g.teacher_name})` : ""}
                        </option>
                      );
                    })}
                  </select>
                  <InputError message={errors.grade_id} className="mt-1" />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Password")} {modalMode === "edit" ? `(${t("Leave blank to keep current")})` : "*"}</label>
                  <input type="password" value={data.password} onChange={e => setData("password", e.target.value)} className={DS_inputCls} required={modalMode === "create"} />
                  <InputError message={errors.password} className="mt-1" />
                </div>
                
                <div className="md:col-span-2">
                  <Toggle 
                    label={t("Status")}
                    description={data.is_active ? t("Active Teacher Account") : t("Deactivated Teacher Account")}
                    enabled={data.is_active}
                    onChange={v => setData("is_active", v)}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-white/5">
                <button type="button" onClick={() => (modalMode === "edit" ? setModalMode("view") : closeModal())} className={DS_cancelBtn}>{t("Cancel")}</button>
                <button type="submit" disabled={processing} className={DS_submitBtn(processing)}>{modalMode === "edit" ? t("Save Changes") : t("Add Teacher")}</button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* ── Delete Modal ──────────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowDeleteModal(false)}>
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
