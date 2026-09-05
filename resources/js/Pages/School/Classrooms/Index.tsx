import React, { useState, useCallback, useMemo } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import useTranslation from "@/hooks/useTranslation";
import { debounce } from "lodash";
import Modal from "@/Components/Modal";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { motion } from "framer-motion";
import { Plus, Search, BookOpen, GraduationCap, X, AlertTriangle, Edit2, Trash2, ChevronDown, Users, Layers } from "lucide-react";
import {
  DS_card, DS_pageWrapper, DS_pageTitle,
  DS_tableWrapper, DS_tableBase, DS_tableHead, DS_tableRow, DS_tableTd,
  DS_searchInput, DS_btnGold, DS_btnEdit, DS_btnDanger,
  DS_inputCls, DS_labelCls, DS_cancelBtn, DS_confirmModal,
  DS_tableTh, DS_modalHeader, DS_sectionHeader, DS_submitBtn,
  DS_modalContainer, DS_modalHeaderTitle, DS_modalHeaderAccent, DS_modalClose, DS_modalBody,
} from "@/lib/DS";

export interface Classroom {
  id: number;
  name: string;
  grade_id: number;
  grade_name?: string;
  school_id: number;
  teachers?: { user_id: number; name: string; email?: string }[];
  students_count?: number;
}

export interface Grade {
  id: number;
  name: string;
  teacher_id?: number;
  teacher_name?: string;
  teacher_name_en?: string;
  classrooms_count?: number;
  students_count?: number;
}

interface Teacher {
  id: number;
  name: string;
  name_en?: string;
  assigned_grade_id?: number | null;
  assigned_grade_name?: string | null;
}

interface Props {
  auth: any;
  classrooms: Classroom[];
  grades: Grade[];
  teachers?: Teacher[];
  filters: { search?: string };
}

export default function ClassroomIndex({ auth, classrooms = [], grades = [], teachers = [], filters }: Props) {
  const { t, isRtl } = useTranslation();
  const [activeTab, setActiveTab] = useState<"classrooms" | "grades">("grades");
  const [search, setSearch] = useState(filters.search || "");
  
  // Dynamic search filtering for grades and classrooms by name (multi-word & bilingual raw_name support)
  const filteredGrades = useMemo(() => {
    if (!search.trim()) return grades;
    const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return grades.filter((g) => {
      const name = (g.name || "").toLowerCase();
      const rawName = (g.raw_name || "").toLowerCase();
      return terms.every((term) => name.includes(term) || rawName.includes(term));
    });
  }, [grades, search]);

  const filteredClassrooms = useMemo(() => {
    if (!search.trim()) return classrooms;
    const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return classrooms.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const rawName = (c.raw_name || "").toLowerCase();
      const nameEn = (c.name_en || "").toLowerCase();
      const gradeName = (c.grade_name || "").toLowerCase();
      return terms.every((term) => name.includes(term) || rawName.includes(term) || nameEn.includes(term) || gradeName.includes(term));
    });
  }, [classrooms, search]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Selection states
  const [entityToEdit, setEntityToEdit] = useState<any>(null);
  const [entityToDelete, setEntityToDelete] = useState<any>(null);

  // Teacher assignment conflict warning state
  const [teacherConflict, setTeacherConflict] = useState<{
    teacherName: string;
    assignedGradeName: string;
    targetTeacherId: string;
    isEdit: boolean;
  } | null>(null);

  // Forms
  const classForm = useForm({ name: "", grade_id: "" });
  const gradeForm = useForm({ name: "", teacher_id: "" });

  // Dirty / modification tracking for edit modal
  const isClassModified = Boolean(
    entityToEdit &&
      (classForm.data.name.trim() !== (entityToEdit.name || "").trim() ||
        classForm.data.grade_id.toString() !== (entityToEdit.grade_id?.toString() || ""))
  );

  const isGradeModified = Boolean(
    entityToEdit &&
      (gradeForm.data.name.trim() !== (entityToEdit.name || "").trim() ||
        (gradeForm.data.teacher_id?.toString() || "") !== (entityToEdit.teacher_id?.toString() || ""))
  );

  const isEditModified = activeTab === "classrooms" ? isClassModified : isGradeModified;

  // Teacher selection with assignment conflict check
  const handleTeacherSelect = (teacherId: string, isEdit: boolean) => {
    if (!teacherId) {
      gradeForm.setData("teacher_id", "");
      return;
    }

    const tObj = teachers.find((t) => t.id.toString() === teacherId);
    if (tObj && tObj.assigned_grade_id) {
      const isSameGradeBeingEdited =
        isEdit && entityToEdit && entityToEdit.id.toString() === tObj.assigned_grade_id.toString();

      if (!isSameGradeBeingEdited) {
        setTeacherConflict({
          teacherName: isRtl ? tObj.name : (tObj.name_en || tObj.name),
          assignedGradeName: tObj.assigned_grade_name || "",
          targetTeacherId: teacherId,
          isEdit,
        });
        return;
      }
    }

    gradeForm.setData("teacher_id", teacherId);
  };

  const confirmTeacherConflict = () => {
    if (teacherConflict) {
      gradeForm.setData("teacher_id", teacherConflict.targetTeacherId);
      setTeacherConflict(null);
    }
  };

  const cancelTeacherConflict = () => {
    setTeacherConflict(null);
  };

  // Handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "classrooms") {
      classForm.post(route("school.classrooms.store"), {
        preserveScroll: true,
        onSuccess: () => { setShowAddModal(false); classForm.reset(); },
      });
    } else {
      gradeForm.post(route("school.classrooms.grades.store"), {
        preserveScroll: true,
        onSuccess: () => { setShowAddModal(false); gradeForm.reset(); },
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityToEdit) return;

    if (activeTab === "classrooms") {
      classForm.put(route("school.classrooms.update", entityToEdit.id), {
        preserveScroll: true,
        onSuccess: () => { setShowEditModal(false); classForm.reset(); setEntityToEdit(null); },
      });
    } else {
      gradeForm.put(route("school.classrooms.grades.update", entityToEdit.id), {
        preserveScroll: true,
        onSuccess: () => { setShowEditModal(false); gradeForm.reset(); setEntityToEdit(null); },
      });
    }
  };

  const openEditModal = (entity: any) => {
    setEntityToEdit(entity);
    if (activeTab === "classrooms") {
      classForm.setData({ name: entity.name, grade_id: entity.grade_id?.toString() || "" });
    } else {
      gradeForm.setData({ name: entity.name, teacher_id: entity.teacher_id?.toString() || "" });
    }
    setShowEditModal(true);
  };

  const confirmDelete = (entity: any) => {
    setEntityToDelete(entity);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (!entityToDelete || isDeleting) return;
    setIsDeleting(true);
    const deleteRoute = activeTab === "classrooms" 
        ? route("school.classrooms.destroy", entityToDelete.id)
        : route("school.classrooms.grades.destroy", entityToDelete.id);

    router.delete(deleteRoute, {
      onSuccess: () => { setShowDeleteModal(false); setEntityToDelete(null); },
      onFinish: () => setIsDeleting(false),
    });
  };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      router.get(route("school.classrooms.index"), { search: value }, { preserveState: true, preserveScroll: true });
    }, 300), []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const getTeacherName = (id: string) => {
    const tObj = teachers.find((t) => t.id.toString() === id);
    if (!tObj) return t("Select Teacher");
    return isRtl ? tObj.name : (tObj.name_en || tObj.name);
  };

  const getGradeName = (id: string) => {
    const gObj = grades.find((g) => g.id.toString() === id);
    return gObj ? gObj.name : t("Select Grade");
  };

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={<h2 className={DS_pageTitle}>{t("Education Structure")}</h2>}
    >
      <Head title={t("Classes & Grades")} />

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-4`}>

        {/* Top Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          {/* Tab Switcher — Grades first */}
          <div className={`flex p-1.5 bg-white dark:bg-[#1a2845] rounded-[20px] shadow-sm border border-[#0f2044]/5 dark:border-[#243460] w-fit ${isRtl ? "md:mr-auto" : "md:ml-auto"}`}>
            <button
              onClick={() => setActiveTab("grades")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-[16px] text-sm font-bold transition-all ${
                activeTab === "grades"
                  ? "bg-[#0f2044] text-white shadow-md"
                  : "text-gray-500 hover:text-[#0f2044] hover:bg-[#0f2044]/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#243460]"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              {t("Grades")}
            </button>
            <button
              onClick={() => setActiveTab("classrooms")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-[16px] text-sm font-bold transition-all ${
                activeTab === "classrooms"
                  ? "bg-[#0f2044] text-white shadow-md"
                  : "text-gray-500 hover:text-[#0f2044] hover:bg-[#0f2044]/5 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#243460]"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              {t("Classrooms")}
            </button>
          </div>
        </div>

        {/* Main Content Card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={DS_card}>
          <div className={DS_sectionHeader(isRtl)}>
            {/* Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#f5b800]/10 dark:bg-[#f5b800]/20 flex items-center justify-center text-[#b38600] flex-shrink-0">
                {activeTab === "classrooms" ? <BookOpen className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
              </div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <h3 className="text-xl font-bold text-[#0f2044] dark:text-white">
                  {activeTab === "classrooms" ? t("Classrooms List") : t("Grades List")}
                </h3>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {t("Total")}: <span className="text-[#0f2044] dark:text-[#7ba7e8]">{activeTab === "classrooms" ? filteredClassrooms.length : filteredGrades.length}</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-72 flex-shrink-0">
                <Search className={`absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder={t("Search...")}
                  className={`${DS_searchInput} ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                  dir={isRtl ? "rtl" : "ltr"}
                />
              </div>
              <button onClick={() => setShowAddModal(true)} className={`${DS_btnGold} w-full sm:w-auto flex justify-center`}>
                <Plus className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{activeTab === "classrooms" ? t("Add New Class") : t("Add New Grade")}</span>
              </button>
            </div>
          </div>

          <div className={DS_tableWrapper}>
            <table className={DS_tableBase}>
              <thead className={DS_tableHead}>
                <tr>
                  <th className={DS_tableTh(isRtl)}>{activeTab === "classrooms" ? t("Class Name") : t("Grade Name")}</th>
                  <th className={DS_tableTh(isRtl)}>{activeTab === "classrooms" ? t("Grade") : t("Responsible Teacher")}</th>
                  <th className={DS_tableTh(isRtl)}>{t("Statistics")}</th>
                  <th className={DS_tableTh(isRtl)}>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === "classrooms" ? (
                  filteredClassrooms.length > 0 ? filteredClassrooms.map((c) => (
                    <tr key={c.id} className={DS_tableRow}>
                      <td className={DS_tableTd}>
                        <span className="font-bold text-[#0f2044] dark:text-white">{c.name}</span>
                      </td>
                      <td className={DS_tableTd}>
                        {c.grade_name ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#0f2044]/[0.07] dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8]">
                            {c.grade_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">—</span>
                        )}
                      </td>
                      <td className={DS_tableTd}>
                        <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                             <Users size={12} />
                             {c.students_count || 0} {t("Students")}
                           </div>
                        </div>
                      </td>
                      <td className={DS_tableTd}>
                        <div className={`flex gap-2 ${isRtl ? "justify-start" : "justify-end"}`}>
                          <button onClick={() => openEditModal(c)} className={DS_btnEdit} title={t("Edit")}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => confirmDelete(c)} className={DS_btnDanger} title={t("Delete")}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="py-12 text-center text-gray-400 font-bold">{t("No Data Found")}</td></tr>
                  )
                ) : (
                  filteredGrades.length > 0 ? filteredGrades.map((g) => (
                    <tr key={g.id} className={DS_tableRow}>
                      <td className={DS_tableTd}>
                        <span className="font-bold text-[#0f2044] dark:text-white">{g.name}</span>
                      </td>
                      <td className={DS_tableTd}>
                        {g.teacher_name ? (
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {isRtl ? g.teacher_name : (g.teacher_name_en || g.teacher_name)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">{t("No Teacher Assigned")}</span>
                        )}
                      </td>
                      <td className={DS_tableTd}>
                        <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                             <Layers size={12} />
                             {g.classrooms_count || 0} {t("Classes")}
                           </div>
                           <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                             <Users size={12} />
                             {g.students_count || 0} {t("Students")}
                           </div>
                        </div>
                      </td>
                      <td className={DS_tableTd}>
                        <div className={`flex gap-2 ${isRtl ? "justify-start" : "justify-end"}`}>
                          <button onClick={() => openEditModal(g)} className={DS_btnEdit} title={t("Edit")}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => confirmDelete(g)} className={DS_btnDanger} title={t("Delete")}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="py-12 text-center text-gray-400 font-bold">{t("No Data Found")}</td></tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* ── Add Entity Modal ──────────────────────────────────────── */}
      <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="md">
        <div className={DS_modalContainer}>
          <div className={DS_modalHeader(isRtl)}>
            <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className={DS_modalHeaderAccent} />
              <h2 className={DS_modalHeaderTitle}>
                {activeTab === "classrooms" ? t("Add New Class") : t("Add New Grade")}
              </h2>
            </div>
            <button onClick={() => setShowAddModal(false)} className={DS_modalClose}><X className="w-4 h-4" /></button>
          </div>

          <form onSubmit={handleAddSubmit} className={DS_modalBody}>
            {activeTab === "classrooms" ? (
              <div className="space-y-4">
                <div>
                  <label className={DS_labelCls}>{t("Class Name")}</label>
                  <input
                    type="text"
                    value={classForm.data.name}
                    onChange={(e) => classForm.setData("name", e.target.value)}
                    className={DS_inputCls}
                    required
                    dir="auto"
                  />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Grade")}</label>
                  <Listbox value={classForm.data.grade_id} onChange={(val) => classForm.setData("grade_id", val)}>
                    <div className="relative">
                      <ListboxButton className={`${DS_inputCls} flex items-center justify-between cursor-pointer`}>
                        <span className="block truncate">{getGradeName(classForm.data.grade_id)}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </ListboxButton>
                      <ListboxOptions anchor="bottom start" className="z-[9999] [--anchor-gap:4px] w-[var(--button-width)] max-h-60 overflow-auto rounded-[16px] bg-white dark:bg-[#1a2845] py-2 shadow-xl border border-[#0f2044]/10 dark:border-[#243460] focus:outline-none">
                        {grades.map((g) => (
                          <ListboxOption key={g.id} value={g.id.toString()} className={({ active }) => `cursor-pointer py-2.5 px-4 text-sm font-semibold transition-colors ${active ? "bg-[#0f2044]/5 dark:bg-[#243460] text-[#0f2044] dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                            {g.name}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </div>
                  </Listbox>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={DS_labelCls}>{t("Grade Name")}</label>
                  <input
                    type="text"
                    value={gradeForm.data.name}
                    onChange={(e) => gradeForm.setData("name", e.target.value)}
                    className={DS_inputCls}
                    required
                    dir="auto"
                  />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Responsible Teacher")}</label>
                  <Listbox value={gradeForm.data.teacher_id} onChange={(val) => handleTeacherSelect(val, false)}>
                    <div className="relative">
                      <ListboxButton className={`${DS_inputCls} flex items-center justify-between cursor-pointer`}>
                        <span className="block truncate">{getTeacherName(gradeForm.data.teacher_id)}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </ListboxButton>
                      <ListboxOptions anchor="bottom start" className="z-[9999] [--anchor-gap:4px] w-[var(--button-width)] max-h-60 overflow-auto rounded-[16px] bg-white dark:bg-[#1a2845] py-2 shadow-xl border border-[#0f2044]/10 dark:border-[#243460] focus:outline-none">
                        <ListboxOption value="" className="py-2.5 px-4 text-sm font-semibold text-gray-400 italic cursor-pointer hover:bg-gray-50 dark:hover:bg-[#243460]">{t("None")}</ListboxOption>
                        {teachers.map((tItem) => (
                          <ListboxOption key={tItem.id} value={tItem.id.toString()} className={({ active }) => `cursor-pointer py-2.5 px-4 text-sm font-semibold transition-colors ${active ? "bg-[#0f2044]/5 dark:bg-[#243460] text-[#0f2044] dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span>{isRtl ? tItem.name : (tItem.name_en || tItem.name)}</span>
                              {tItem.assigned_grade_name && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-normal">
                                  {isRtl ? `(معين: ${tItem.assigned_grade_name})` : `(Assigned: ${tItem.assigned_grade_name})`}
                                </span>
                              )}
                            </div>
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </div>
                  </Listbox>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-4 border-t border-[#0f2044]/10 dark:border-[#243460] mt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className={DS_cancelBtn}>{t("Cancel")}</button>
              <button type="submit" disabled={classForm.processing || gradeForm.processing} className={DS_submitBtn(classForm.processing || gradeForm.processing)}>
                {t("Add")}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Edit Entity Modal ─────────────────────────────────────── */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="md">
        <div className={DS_modalContainer}>
          <div className={DS_modalHeader(isRtl)}>
            <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="w-10 h-10 rounded-xl bg-[#f5b800] flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-[#0f2044]" />
              </div>
              <h2 className={DS_modalHeaderTitle}>
                {activeTab === "classrooms" ? t("Edit Class") : t("Edit Grade")}
              </h2>
            </div>
            <button onClick={() => setShowEditModal(false)} className={DS_modalClose}><X className="w-4 h-4" /></button>
          </div>

          <form onSubmit={handleEditSubmit} className={DS_modalBody}>
            {activeTab === "classrooms" ? (
              <div className="space-y-4">
                <div>
                  <label className={DS_labelCls}>{t("Class Name")}</label>
                  <input
                    type="text"
                    value={classForm.data.name}
                    onChange={(e) => classForm.setData("name", e.target.value)}
                    className={DS_inputCls}
                    required
                    dir="auto"
                  />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Grade")}</label>
                  <Listbox value={classForm.data.grade_id} onChange={(val) => classForm.setData("grade_id", val)}>
                    <div className="relative">
                      <ListboxButton className={`${DS_inputCls} flex items-center justify-between cursor-pointer`}>
                        <span className="block truncate">{getGradeName(classForm.data.grade_id)}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </ListboxButton>
                      <ListboxOptions anchor="bottom start" className="z-[9999] [--anchor-gap:4px] w-[var(--button-width)] max-h-60 overflow-auto rounded-[16px] bg-white dark:bg-[#1a2845] py-2 shadow-xl border border-[#0f2044]/10 dark:border-[#243460] focus:outline-none">
                        {grades.map((g) => (
                          <ListboxOption key={g.id} value={g.id.toString()} className={({ active }) => `cursor-pointer py-2.5 px-4 text-sm font-semibold transition-colors ${active ? "bg-[#0f2044]/5 dark:bg-[#243460] text-[#0f2044] dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                            {g.name}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </div>
                  </Listbox>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={DS_labelCls}>{t("Grade Name")}</label>
                  <input
                    type="text"
                    value={gradeForm.data.name}
                    onChange={(e) => gradeForm.setData("name", e.target.value)}
                    className={DS_inputCls}
                    required
                    dir="auto"
                  />
                </div>
                <div>
                  <label className={DS_labelCls}>{t("Responsible Teacher")}</label>
                  <Listbox value={gradeForm.data.teacher_id} onChange={(val) => handleTeacherSelect(val, true)}>
                    <div className="relative">
                      <ListboxButton className={`${DS_inputCls} flex items-center justify-between cursor-pointer`}>
                        <span className="block truncate">{getTeacherName(gradeForm.data.teacher_id)}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </ListboxButton>
                      <ListboxOptions anchor="bottom start" className="z-[9999] [--anchor-gap:4px] w-[var(--button-width)] max-h-60 overflow-auto rounded-[16px] bg-white dark:bg-[#1a2845] py-2 shadow-xl border border-[#0f2044]/10 dark:border-[#243460] focus:outline-none">
                        <ListboxOption value="" className="py-2.5 px-4 text-sm font-semibold text-gray-400 italic cursor-pointer hover:bg-gray-50 dark:hover:bg-[#243460]">{t("None")}</ListboxOption>
                        {teachers.map((tItem) => (
                          <ListboxOption key={tItem.id} value={tItem.id.toString()} className={({ active }) => `cursor-pointer py-2.5 px-4 text-sm font-semibold transition-colors ${active ? "bg-[#0f2044]/5 dark:bg-[#243460] text-[#0f2044] dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span>{isRtl ? tItem.name : (tItem.name_en || tItem.name)}</span>
                              {tItem.assigned_grade_name && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-normal">
                                  {isRtl ? `(معين: ${tItem.assigned_grade_name})` : `(Assigned: ${tItem.assigned_grade_name})`}
                                </span>
                              )}
                            </div>
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </div>
                  </Listbox>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center pt-4 border-t border-[#0f2044]/10 dark:border-[#243460] mt-2">
              <button type="button" onClick={() => setShowEditModal(false)} className={DS_cancelBtn}>{t("Cancel")}</button>
              <button
                type="submit"
                disabled={!isEditModified || classForm.processing || gradeForm.processing}
                className={DS_submitBtn(!isEditModified || classForm.processing || gradeForm.processing)}
              >
                {t("Save Changes")}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Teacher Conflict Confirmation Modal ────────────────────── */}
      {teacherConflict && (
        <Modal show={Boolean(teacherConflict)} onClose={cancelTeacherConflict} maxWidth="sm">
          <div className={DS_confirmModal}>
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-[#0f2044] dark:text-white mb-2">
              {isRtl ? "تنبيه تعيين المعلم" : "Teacher Assignment Warning"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {isRtl
                ? `المعلم "${teacherConflict.teacherName}" معين بالفعل لمرحلة أخرى (${teacherConflict.assignedGradeName}). هل تود المتابعة؟`
                : `The teacher "${teacherConflict.teacherName}" is already assigned to another class/grade (${teacherConflict.assignedGradeName}). Would you like to proceed?`}
            </p>
            <div className="flex gap-3">
              <button onClick={cancelTeacherConflict} className={`flex-1 py-3 ${DS_cancelBtn}`}>
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={confirmTeacherConflict}
                className="flex-1 py-3 rounded-[14px] bg-[#f5b800] hover:bg-[#e0a900] text-[#0f2044] font-bold transition-all shadow"
              >
                {isRtl ? "نعم، المتابعة" : "Yes, Proceed"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────── */}
      {showDeleteModal && (
        <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="sm">
          <div className={DS_confirmModal}>
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-[#0f2044] dark:text-white mb-2">{t("Confirm Deletion")}</h3>
            <p className="font-bold text-[#0f2044] dark:text-[#7ba7e8] bg-[#0f2044]/5 dark:bg-[#0f2044]/30 py-2 px-4 rounded-xl inline-block mb-3">
              {entityToDelete?.name}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {t("Are you sure you want to delete this? This action cannot be undone.")}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className={`flex-1 py-3 ${DS_cancelBtn}`}>{t("Cancel")}</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-[14px] bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow">{t("Yes, Delete")}</button>
            </div>
          </div>
        </Modal>
      )}
    </SchoolAuthenticatedLayout>
  );
}
