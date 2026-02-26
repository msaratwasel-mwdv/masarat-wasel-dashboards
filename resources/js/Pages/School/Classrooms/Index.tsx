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
  grade_level?: string;
  school_id: number;
  teachers?: { id: number; name: string; email?: string }[];
}

interface Supervisor {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  name: string;
}

interface Props {
  auth: any;
  classrooms: Classroom[];
  teachers?: Teacher[];
  filters: { search?: string };
}

export default function ClassroomIndex({
  auth,
  classrooms,
  teachers = [],
  filters,
}: Props) {
  const { t, isRtl } = useTranslation();
  const [search, setSearch] = useState(filters.search || "");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToEdit, setClassToEdit] = useState<Classroom | null>(null);
  const [classToDelete, setClassToDelete] = useState<Classroom | null>(null);

  // Form for adding new class
  const addForm = useForm({
    name: "",
    teacher_id: "",
  });

  // Form for editing class
  const editForm = useForm({
    name: "",
    teacher_id: "",
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addForm.post(route("school.classrooms.store"), {
      preserveScroll: true,
      onSuccess: () => {
        setShowAddModal(false);
        addForm.reset();
      },
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classToEdit) return;

    editForm.transform((data) => ({
      ...data,
      teacher_ids: data.teacher_id ? [parseInt(data.teacher_id)] : [],
    }));

    editForm.put(route("school.classrooms.update", classToEdit.id), {
      preserveScroll: true,
      onSuccess: () => {
        setShowEditModal(false);
        editForm.reset();
        setClassToEdit(null);
      },
    });
  };

  const openEditModal = (classroom: Classroom) => {
    setClassToEdit(classroom);
    editForm.setData({
      name: classroom.name,
      teacher_id:
        classroom.teachers && classroom.teachers.length > 0
          ? classroom.teachers[0].id.toString()
          : "",
    });
    setShowEditModal(true);
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

  const confirmDelete = (classroom: Classroom) => {
    setClassToDelete(classroom);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (classToDelete) {
      router.delete(route("school.classrooms.destroy", classToDelete.id), {
        onSuccess: () => {
          setShowDeleteModal(false);
          setClassToDelete(null);
        },
      });
    }
  };

  const getTeacherName = (id: string) => {
    const tObj = teachers.find((t) => t.id.toString() === id);
    return tObj ? tObj.name : t("Select Teacher");
  };

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
          {t("Classes Management")}
        </h2>
      }
    >
      <Head title={t("Classes Management")} />

      <div
        className={`max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8`}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="bg-white dark:bg-[#0f172a] rounded-[30px] overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#0e7490] text-white rounded-[20px] shadow-sm">
                  <span className="text-3xl">🏫</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#0e7490] dark:text-cyan-400 mb-1">
                    {t("Classes List")}
                  </h1>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t("Total Classes")}:{" "}
                    <span className="font-bold text-[#0e7490] dark:text-cyan-400">
                      {classrooms.length}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Search */}
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder={t("Search")}
                    className="w-full bg-gray-50 dark:bg-[#1e293b] border-gray-200 dark:border-white/10 rounded-[35px] py-3 pl-10 pr-4 text-gray-800 dark:text-white placeholder-gray-500 focus:ring-[#0e7490] focus:border-[#0e7490] border transition-all"
                  />
                  <div
                    className={`absolute ${
                      isRtl ? "right-3" : "left-3"
                    } top-3.5`}
                  >
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0e7490] hover:bg-[#155e75] text-white px-8 py-3 rounded-[35px] font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span className="text-xl">+</span>
                  {t("Add New Class")}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-[30px] border border-gray-200 dark:border-gray-700">
              <table
                className={`w-full text-start mb-0`}
                dir={isRtl ? "rtl" : "ltr"}
              >
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                      {t("Class Name")}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                      {t("Teacher")}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">
                      {t("Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {classrooms.length > 0 ? (
                    classrooms.map((classroom) => (
                      <tr
                        key={classroom.id}
                        className="transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-900/10"
                      >
                        <td
                          className={`px-6 py-4 text-gray-800 dark:text-white font-medium text-start`}
                        >
                          {classroom.name}
                        </td>
                        <td
                          className={`px-6 py-4 text-gray-600 dark:text-gray-300 text-start`}
                        >
                          {classroom.teachers && classroom.teachers.length > 0
                            ? classroom.teachers.map((t) => t.name).join(", ")
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-4">
                            <button
                              onClick={() => openEditModal(classroom)}
                              className="p-2.5 text-[#0e7490] bg-cyan-50 dark:bg-cyan-900/20 transition-all rounded-[15px] hover:bg-cyan-100 dark:hover:bg-cyan-900/40 hover:scale-105 border border-cyan-100 dark:border-cyan-800"
                              title={t("Edit")}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => confirmDelete(classroom)}
                              className="p-2.5 text-red-600 bg-red-50 dark:bg-red-900/20 transition-all rounded-[15px] hover:bg-red-100 dark:hover:bg-red-900/40 hover:scale-105 border border-red-100 dark:border-red-800"
                              title={t("Delete")}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 italic"
                      >
                        {t("No Data")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1e293b] rounded-[30px] overflow-hidden border border-gray-100 dark:border-white/10 w-full max-w-lg shadow-2xl"
            dir={isRtl ? "rtl" : "ltr"}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0e7490] p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {t("Add New Class")}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  {t("Class Name")}
                </label>
                <input
                  type="text"
                  value={addForm.data.name}
                  onChange={(e) => addForm.setData("name", e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-[35px] py-4 px-6 text-gray-800 dark:text-white focus:ring-[#0e7490] focus:border-transparent transition-all border"
                  placeholder={t("Class Name")}
                  required
                />
                {addForm.errors.name && (
                  <div className="mt-2 text-sm text-red-500">
                    {addForm.errors.name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  {t("Assign Teacher")}
                </label>
                <Listbox
                  value={addForm.data.teacher_id}
                  onChange={(val) => addForm.setData("teacher_id", val)}
                >
                  <div className="relative mt-1">
                    <ListboxButton
                      className={`relative w-full cursor-pointer rounded-[35px] bg-gray-50 dark:bg-[#0f172a] py-4 ${
                        isRtl ? "pl-10 pr-6 text-right" : "pr-10 pl-6 text-left"
                      } text-gray-800 dark:text-white border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#0e7490] sm:text-base`}
                    >
                      <span className="block truncate">
                        {getTeacherName(addForm.data.teacher_id)}
                      </span>
                      <span
                        className={`pointer-events-none absolute inset-y-0 ${
                          isRtl ? "left-0 pl-4" : "right-0 pr-4"
                        } flex items-center`}
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </span>
                    </ListboxButton>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[20px] bg-white dark:bg-[#1e293b] py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-100 dark:border-white/10">
                        <ListboxOption
                          value=""
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 px-4 ${
                              active
                                ? "bg-[#0e7490] text-white"
                                : "text-gray-700 dark:text-gray-300"
                            }`
                          }
                        >
                          {t("Select Teacher")}
                        </ListboxOption>
                        {teachers.map((tItem) => (
                          <ListboxOption
                            key={tItem.id}
                            value={tItem.id.toString()}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-3 px-4 ${
                                active
                                  ? "bg-[#0e7490] text-white"
                                  : "text-gray-700 dark:text-gray-300"
                              }`
                            }
                          >
                            {tItem.name}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>
                {addForm.errors.teacher_id && (
                  <div className="mt-2 text-sm text-red-500">
                    {addForm.errors.teacher_id}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-[#0f172a] hover:bg-gray-200 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 py-3.5 rounded-[35px] font-bold transition-all border border-gray-200 dark:border-white/10"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={addForm.processing}
                  className="flex-1 bg-[#0e7490] hover:bg-[#155e75] text-white py-3.5 rounded-[35px] font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                  {addForm.processing ? t("Saving...") : t("Add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1e293b] rounded-[30px] overflow-hidden border border-gray-100 dark:border-white/10 w-full max-w-lg shadow-2xl"
            dir={isRtl ? "rtl" : "ltr"}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0e7490] p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {t("Edit Class")}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  {t("Class Name")}
                </label>
                <input
                  type="text"
                  value={editForm.data.name}
                  onChange={(e) => editForm.setData("name", e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-[35px] py-4 px-6 text-gray-800 dark:text-white focus:ring-[#0e7490] focus:border-transparent transition-all border"
                  placeholder={t("Class Name")}
                  required
                />
                {editForm.errors.name && (
                  <div className="mt-2 text-sm text-red-500">
                    {editForm.errors.name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                  {t("Assign Teacher")}
                </label>
                <Listbox
                  value={editForm.data.teacher_id}
                  onChange={(val) => editForm.setData("teacher_id", val)}
                >
                  <div className="relative mt-1">
                    <ListboxButton
                      className={`relative w-full cursor-pointer rounded-[35px] bg-gray-50 dark:bg-[#0f172a] py-4 ${
                        isRtl ? "pl-10 pr-6 text-right" : "pr-10 pl-6 text-left"
                      } text-gray-800 dark:text-white border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#0e7490] sm:text-base`}
                    >
                      <span className="block truncate">
                        {getTeacherName(editForm.data.teacher_id)}
                      </span>
                      <span
                        className={`pointer-events-none absolute inset-y-0 ${
                          isRtl ? "left-0 pl-4" : "right-0 pr-4"
                        } flex items-center`}
                      >
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </span>
                    </ListboxButton>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[20px] bg-white dark:bg-[#1e293b] py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-100 dark:border-white/10">
                        <ListboxOption
                          value=""
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 px-4 ${
                              active
                                ? "bg-[#0e7490] text-white"
                                : "text-gray-700 dark:text-gray-300"
                            }`
                          }
                        >
                          {t("Select Teacher")}
                        </ListboxOption>
                        {teachers.map((tItem) => (
                          <ListboxOption
                            key={tItem.id}
                            value={tItem.id.toString()}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-3 px-4 ${
                                active
                                  ? "bg-[#0e7490] text-white"
                                  : "text-gray-700 dark:text-gray-300"
                              }`
                            }
                          >
                            {tItem.name}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </Transition>
                  </div>
                </Listbox>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-[#0f172a] hover:bg-gray-200 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 py-3.5 rounded-[35px] font-bold transition-all border border-gray-200 dark:border-white/10"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={editForm.processing}
                  className="flex-1 bg-[#0e7490] hover:bg-[#155e75] text-white py-3.5 rounded-[35px] font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                  {editForm.processing ? t("Saving...") : t("Save Changes")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-white dark:bg-[#1e293b] p-8 border border-gray-100 dark:border-white/10 rounded-[30px] transition-colors duration-300 w-full max-w-md shadow-2xl"
            dir={isRtl ? "rtl" : "ltr"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t("Confirm Deletion")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t(
                  "Are you sure you want to delete this class? This action cannot be undone."
                )}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-100 dark:bg-[#0f172a] hover:bg-gray-200 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 py-3.5 rounded-[35px] font-bold transition-all border border-gray-200 dark:border-white/10"
              >
                {t("Cancel")}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-[35px] font-bold shadow-lg shadow-red-500/20 transition-all"
              >
                {t("Yes, Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolAuthenticatedLayout>
  );
}
