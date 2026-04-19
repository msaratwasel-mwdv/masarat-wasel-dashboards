import React, { useState, useCallback, Fragment } from "react";
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
  Transition,
} from "@headlessui/react";

export interface Classroom {
  id: number;
  name: string;
  grade_id: number;
  grade_name?: string;
  school_id: number;
  teachers?: { user_id: number; name: string; email?: string }[];
}

export interface Grade {
  id: number;
  name: string;
  teacher_id?: number;
  teacher_name?: string;
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

export default function ClassroomIndex({
  auth,
  classrooms = [],
  grades = [],
  teachers = [],
  filters,
}: Props) {
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
  const classForm = useForm({
    name: "",
    grade_id: "",
  });

  const gradeForm = useForm({
    name: "",
    teacher_id: "",
  });

  // Handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "classrooms") {
      classForm.post(route("school.classrooms.store"), {
        preserveScroll: true,
        onSuccess: () => {
          setShowAddModal(false);
          classForm.reset();
        },
      });
    } else {
      gradeForm.post(route("school.classrooms.grades.store"), {
        preserveScroll: true,
        onSuccess: () => {
          setShowAddModal(false);
          gradeForm.reset();
        },
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityToEdit) return;

    if (activeTab === "classrooms") {
      classForm.put(route("school.classrooms.update", entityToEdit.id), {
        preserveScroll: true,
        onSuccess: () => {
          setShowEditModal(false);
          classForm.reset();
          setEntityToEdit(null);
        },
      });
    } else {
      gradeForm.put(route("school.classrooms.grades.update", entityToEdit.id), {
        preserveScroll: true,
        onSuccess: () => {
          setShowEditModal(false);
          gradeForm.reset();
          setEntityToEdit(null);
        },
      });
    }
  };

  const openEditModal = (entity: any) => {
    setEntityToEdit(entity);
    if (activeTab === "classrooms") {
      classForm.setData({
        name: entity.name,
        grade_id: entity.grade_id?.toString() || "",
      });
    } else {
      gradeForm.setData({
        name: entity.name,
        teacher_id: entity.teacher_id?.toString() || "",
      });
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
      onSuccess: () => {
        setShowDeleteModal(false);
        setEntityToDelete(null);
      },
    });
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      router.get(
        route("school.classrooms.index"),
        { search: value },
        { preserveState: true, preserveScroll: true }
      );
    }, 300),
    []
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
      header={
        <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
          {t("Education Structure")}
        </h2>
      }
    >
      <Head title={t("Classes & Grades")} />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" dir={isRtl ? "rtl" : "ltr"}>
        
        {/* Modern Tab Switcher */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800/50 rounded-[25px] mb-8 w-fit mx-auto sm:mx-0 border border-gray-200 dark:border-gray-700/50 backdrop-blur-md">
            <button
                onClick={() => setActiveTab("classrooms")}
                className={`px-8 py-3 rounded-[20px] font-bold transition-all duration-300 ${
                    activeTab === "classrooms" 
                    ? "bg-[#0e7490] text-white shadow-lg" 
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
                {t("Classrooms")}
            </button>
            <button
                onClick={() => setActiveTab("grades")}
                className={`px-8 py-3 rounded-[20px] font-bold transition-all duration-300 ${
                    activeTab === "grades" 
                    ? "bg-[#0e7490] text-white shadow-lg" 
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
            >
                {t("Grades")}
            </button>
        </div>

        <div className="bg-white dark:bg-[#0f172a] rounded-[30px] overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="p-8">
            
            {/* Header Content */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#0e7490] text-white rounded-[20px] shadow-sm">
                  <span className="text-3xl">{activeTab === "classrooms" ? "🏫" : "🎓"}</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#0e7490] dark:text-cyan-400 mb-1">
                    {activeTab === "classrooms" ? t("Classrooms List") : t("Grades List")}
                  </h1>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t("Total")}:{" "}
                    <span className="font-bold text-[#0e7490] dark:text-cyan-400">
                      {activeTab === "classrooms" ? classrooms.length : grades.length}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder={t("Search")}
                    className="w-full bg-gray-50 dark:bg-[#1e293b] border-gray-200 dark:border-white/10 rounded-[35px] py-3 pl-10 pr-4 text-gray-800 dark:text-white placeholder-gray-500 focus:ring-[#0e7490] focus:border-[#0e7490] border transition-all"
                  />
                  <div className={`absolute ${isRtl ? "right-3" : "left-3"} top-3.5`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0e7490] hover:bg-[#155e75] text-white px-8 py-3 rounded-[35px] font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span className="text-xl">+</span>
                  {activeTab === "classrooms" ? t("Add New Class") : t("Add New Grade")}
                </button>
              </div>
            </div>

            {/* Content Table */}
            <div className="overflow-hidden rounded-[30px] border border-gray-200 dark:border-gray-700">
                <table className="w-full text-start mb-0" dir={isRtl ? "rtl" : "ltr"}>
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                                {activeTab === "classrooms" ? t("Class Name") : t("Grade Name")}
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                                {activeTab === "classrooms" ? t("Grade") : t("Responsible Teacher")}
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">
                                {t("Actions")}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {activeTab === "classrooms" ? (
                            classrooms.length > 0 ? classrooms.map((c) => (
                                <tr key={c.id} className="transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-900/10">
                                    <td className="px-6 py-4 text-gray-800 dark:text-white font-medium">{c.name}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{c.grade_name || "-"}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => openEditModal(c)} className="p-2.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-[15px] hover:bg-cyan-100">✏️</button>
                                            <button onClick={() => confirmDelete(c)} className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-[15px] hover:bg-red-100">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400">{t("No Data")}</td></tr>
                            )
                        ) : (
                            grades.length > 0 ? grades.map((g) => (
                                <tr key={g.id} className="transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-900/10">
                                    <td className="px-6 py-4 text-gray-800 dark:text-white font-medium">{g.name}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{g.teacher_name || t("No Teacher Assigned")}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => openEditModal(g)} className="p-2.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-[15px] hover:bg-cyan-100">✏️</button>
                                            <button onClick={() => confirmDelete(g)} className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-[15px] hover:bg-red-100">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-400">{t("No Data")}</td></tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Entity Modal */}
      {showAddModal && (
          <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="lg">
              <div className="bg-[#0e7490] p-6 text-white flex justify-between items-center rounded-t-[30px]">
                  <h2 className="text-xl font-bold">{activeTab === "classrooms" ? t("Add New Class") : t("Add New Grade")}</h2>
              </div>
              <form onSubmit={handleAddSubmit} className="p-8 space-y-6 bg-white dark:bg-[#1e293b] rounded-b-[30px]">
                  {activeTab === "classrooms" ? (
                      <>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t("Class Name")}</label>
                            <input
                                type="text"
                                value={classForm.data.name}
                                onChange={(e) => classForm.setData("name", e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-[35px] py-4 px-6 text-gray-800 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t("Grade")}</label>
                            <Listbox value={classForm.data.grade_id} onChange={(val) => classForm.setData("grade_id", val)}>
                                <div className="relative">
                                    <ListboxButton className="relative w-full cursor-pointer rounded-[35px] bg-gray-50 dark:bg-[#0f172a] py-4 px-6 border text-start">
                                        {getGradeName(classForm.data.grade_id)}
                                    </ListboxButton>
                                    <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[20px] bg-white dark:bg-[#1e293b] py-1 shadow-2xl border">
                                        {grades.map((g) => (
                                            <ListboxOption key={g.id} value={g.id.toString()} className={({ active }) => `cursor-pointer py-3 px-4 ${active ? "bg-[#0e7490] text-white" : ""}`}>
                                                {g.name}
                                            </ListboxOption>
                                        ))}
                                    </ListboxOptions>
                                </div>
                            </Listbox>
                        </div>
                      </>
                  ) : (
                      <>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t("Grade Name")}</label>
                            <input
                                type="text"
                                value={gradeForm.data.name}
                                onChange={(e) => gradeForm.setData("name", e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-[35px] py-4 px-6 text-gray-800 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t("Responsible Teacher")}</label>
                            <Listbox value={gradeForm.data.teacher_id} onChange={(val) => gradeForm.setData("teacher_id", val)}>
                                <div className="relative">
                                    <ListboxButton className="relative w-full cursor-pointer rounded-[35px] bg-gray-50 dark:bg-[#0f172a] py-4 px-6 border text-start">
                                        {getTeacherName(gradeForm.data.teacher_id)}
                                    </ListboxButton>
                                    <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[20px] bg-white dark:bg-[#1e293b] py-1 shadow-2xl border">
                                        <ListboxOption value="" className="p-3 bg-gray-50 dark:bg-gray-800 italic text-gray-400">{t("None")}</ListboxOption>
                                        {teachers.map((tItem) => (
                                            <ListboxOption key={tItem.id} value={tItem.id.toString()} className={({ active }) => `cursor-pointer py-3 px-4 ${active ? "bg-[#0e7490] text-white" : ""}`}>
                                                {tItem.name}
                                            </ListboxOption>
                                        ))}
                                    </ListboxOptions>
                                </div>
                            </Listbox>
                        </div>
                      </>
                  )}
                  <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-white/10 mt-6">
                      <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-100 dark:bg-[#0f172a] py-3.5 rounded-[35px] font-bold">{t("Cancel")}</button>
                      <button type="submit" disabled={classForm.processing || gradeForm.processing} className="flex-1 bg-[#0e7490] text-white py-3.5 rounded-[35px] font-bold shadow-lg shadow-cyan-500/20">{t("Add")}</button>
                  </div>
              </form>
          </Modal>
      )}

      {/* Edit Entity Modal */}
      {showEditModal && (
          <Modal show={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="lg">
              <div className="bg-[#0e7490] p-6 text-white flex justify-between items-center rounded-t-[30px]">
                  <h2 className="text-xl font-bold">{activeTab === "classrooms" ? t("Edit Class") : t("Edit Grade")}</h2>
              </div>
              <form onSubmit={handleEditSubmit} className="p-8 space-y-6 bg-white dark:bg-[#1e293b] rounded-b-[30px]">
                  {activeTab === "classrooms" ? (
                      <>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t("Class Name")}</label>
                            <input
                                type="text"
                                value={classForm.data.name}
                                onChange={(e) => classForm.setData("name", e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-[35px] py-4 px-6 text-gray-800 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t("Grade")}</label>
                            <Listbox value={classForm.data.grade_id} onChange={(val) => classForm.setData("grade_id", val)}>
                                <div className="relative">
                                    <ListboxButton className="relative w-full cursor-pointer rounded-[35px] bg-gray-50 dark:bg-[#0f172a] py-4 px-6 border text-start">
                                        {getGradeName(classForm.data.grade_id)}
                                    </ListboxButton>
                                    <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[20px] bg-white dark:bg-[#1e293b] py-1 shadow-2xl border">
                                        {grades.map((g) => (
                                            <ListboxOption key={g.id} value={g.id.toString()} className={({ active }) => `cursor-pointer py-3 px-4 ${active ? "bg-[#0e7490] text-white" : ""}`}>
                                                {g.name}
                                            </ListboxOption>
                                        ))}
                                    </ListboxOptions>
                                </div>
                            </Listbox>
                        </div>
                      </>
                  ) : (
                      <>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t("Grade Name")}</label>
                            <input
                                type="text"
                                value={gradeForm.data.name}
                                onChange={(e) => gradeForm.setData("name", e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-[35px] py-4 px-6 text-gray-800 dark:text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t("Responsible Teacher")}</label>
                            <Listbox value={gradeForm.data.teacher_id} onChange={(val) => gradeForm.setData("teacher_id", val)}>
                                <div className="relative">
                                    <ListboxButton className="relative w-full cursor-pointer rounded-[35px] bg-gray-50 dark:bg-[#0f172a] py-4 px-6 border text-start">
                                        {getTeacherName(gradeForm.data.teacher_id)}
                                    </ListboxButton>
                                    <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[20px] bg-white dark:bg-[#1e293b] py-1 shadow-2xl border">
                                        <ListboxOption value="" className="p-3 bg-gray-50 dark:bg-gray-800 italic text-gray-400">{t("None")}</ListboxOption>
                                        {teachers.map((tItem) => (
                                            <ListboxOption key={tItem.id} value={tItem.id.toString()} className={({ active }) => `cursor-pointer py-3 px-4 ${active ? "bg-[#0e7490] text-white" : ""}`}>
                                                {tItem.name}
                                            </ListboxOption>
                                        ))}
                                    </ListboxOptions>
                                </div>
                            </Listbox>
                        </div>
                      </>
                  )}
                  <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-white/10 mt-6">
                      <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-100 dark:bg-[#0f172a] py-3.5 rounded-[35px] font-bold">{t("Cancel")}</button>
                      <button type="submit" disabled={classForm.processing || gradeForm.processing} className="flex-1 bg-[#0e7490] text-white py-3.5 rounded-[35px] font-bold shadow-lg shadow-cyan-500/20">{t("Save Changes")}</button>
                  </div>
              </form>
          </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
          <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="md">
              <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[30px] border">
                  <div className="text-center mb-6">
                      <div className="text-6xl mb-4">⚠️</div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("Confirm Deletion")}</h3>
                      <p className="text-gray-500 underline decoration-[#0e7490] underline-offset-4">{entityToDelete?.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">{t("Are you sure you want to delete this? This action cannot be undone.")}</p>
                  </div>
                  <div className="flex gap-4">
                      <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-100 py-3.5 rounded-[35px] font-bold">{t("Cancel")}</button>
                      <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-3.5 rounded-[35px] font-bold shadow-lg shadow-red-500/20">{t("Yes, Delete")}</button>
                  </div>
              </div>
          </Modal>
      )}
    </SchoolAuthenticatedLayout>
  );
}
