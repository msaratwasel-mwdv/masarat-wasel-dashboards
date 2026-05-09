import React, { useState, useCallback } from "react";
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
  classrooms_count?: number;
  students_count?: number;
}

interface Teacher {
  id: number;
  name: string;
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
  const [activeTab, setActiveTab] = useState<"classrooms" | "grades">("classrooms");
  const [search, setSearch] = useState(filters.search || "");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Selection states
  const [entityToEdit, setEntityToEdit] = useState<any>(null);
  const [entityToDelete, setEntityToDelete] = useState<any>(null);

  // Forms
  const classForm = useForm({ name: "", grade_id: "" });
  const gradeForm = useForm({ name: "", teacher_id: "" });

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
    if (!entityToDelete) return;
    const deleteRoute = activeTab === "classrooms" 
        ? route("school.classrooms.destroy", entityToDelete.id)
        : route("school.classrooms.grades.destroy", entityToDelete.id);

    router.delete(deleteRoute, {
      onSuccess: () => { setShowDeleteModal(false); setEntityToDelete(null); },
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
    return tObj ? tObj.name : t("Select Teacher");
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

      <div className={DS_pageWrapper}>
        
        {/* Top Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Tab Switcher */}
          <div className={`flex p-1.5 bg-white dark:bg-[#1a2845] rounded-[20px] shadow-sm border border-[#0f2044]/5 dark:border-[#243460] w-fit ${isRtl ? "md:mr-auto" : "md:ml-auto"}`}>
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
                  {t("Total")}: <span className="text-[#0f2044] dark:text-[#7ba7e8]">{activeTab === "classrooms" ? classrooms.length : grades.length}</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-72">
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
              <button onClick={() => setShowAddModal(true)} className={DS_btnGold}>
                <Plus className="w-4 h-4" />
                {activeTab === "classrooms" ? t("Add New Class") : t("Add New Grade")}
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
                  classrooms.length > 0 ? classrooms.map((c) => (
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
                    <tr><td colSpan={3} className="py-12 text-center text-gray-400 font-bold">{t("No Data Found")}</td></tr>
                  )
                ) : (
                  grades.length > 0 ? grades.map((g) => (
                    <tr key={g.id} className={DS_tableRow}>
                      <td className={DS_tableTd}>
                        <span className="font-bold text-[#0f2044] dark:text-white">{g.name}</span>
                      </td>
                      <td className={DS_tableTd}>
                        {g.teacher_name ? (
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{g.teacher_name}</span>
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
                    <tr><td colSpan={3} className="py-12 text-center text-gray-400 font-bold">{t("No Data Found")}</td></tr>
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
              <div className="w-10 h-10 rounded-xl bg-[#f5b800] flex items-center justify-center">
                <Plus className="w-5 h-5 text-[#0f2044]" />
              </div>
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
                      <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[16px] bg-white dark:bg-[#1a2845] py-2 shadow-xl border border-[#0f2044]/10 dark:border-[#243460] focus:outline-none">
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
                  <Listbox value={gradeForm.data.teacher_id} onChange={(val) => gradeForm.setData("teacher_id", val)}>
                    <div className="relative">
                      <ListboxButton className={`${DS_inputCls} flex items-center justify-between cursor-pointer`}>
                        <span className="block truncate">{getTeacherName(gradeForm.data.teacher_id)}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </ListboxButton>
                      <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[16px] bg-white dark:bg-[#1a2845] py-2 shadow-xl border border-[#0f2044]/10 dark:border-[#243460] focus:outline-none">
                        <ListboxOption value="" className="py-2.5 px-4 text-sm font-semibold text-gray-400 italic cursor-pointer hover:bg-gray-50 dark:hover:bg-[#243460]">{t("None")}</ListboxOption>
                        {teachers.map((tItem) => (
                          <ListboxOption key={tItem.id} value={tItem.id.toString()} className={({ active }) => `cursor-pointer py-2.5 px-4 text-sm font-semibold transition-colors ${active ? "bg-[#0f2044]/5 dark:bg-[#243460] text-[#0f2044] dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                            {tItem.name}
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
                      <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[16px] bg-white dark:bg-[#1a2845] py-2 shadow-xl border border-[#0f2044]/10 dark:border-[#243460] focus:outline-none">
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
                  <Listbox value={gradeForm.data.teacher_id} onChange={(val) => gradeForm.setData("teacher_id", val)}>
                    <div className="relative">
                      <ListboxButton className={`${DS_inputCls} flex items-center justify-between cursor-pointer`}>
                        <span className="block truncate">{getTeacherName(gradeForm.data.teacher_id)}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </ListboxButton>
                      <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[16px] bg-white dark:bg-[#1a2845] py-2 shadow-xl border border-[#0f2044]/10 dark:border-[#243460] focus:outline-none">
                        <ListboxOption value="" className="py-2.5 px-4 text-sm font-semibold text-gray-400 italic cursor-pointer hover:bg-gray-50 dark:hover:bg-[#243460]">{t("None")}</ListboxOption>
                        {teachers.map((tItem) => (
                          <ListboxOption key={tItem.id} value={tItem.id.toString()} className={({ active }) => `cursor-pointer py-2.5 px-4 text-sm font-semibold transition-colors ${active ? "bg-[#0f2044]/5 dark:bg-[#243460] text-[#0f2044] dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                            {tItem.name}
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
              <button type="submit" disabled={classForm.processing || gradeForm.processing} className={DS_submitBtn(classForm.processing || gradeForm.processing)}>
                {t("Save Changes")}
              </button>
            </div>
          </form>
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
