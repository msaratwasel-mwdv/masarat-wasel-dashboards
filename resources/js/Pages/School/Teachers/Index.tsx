import React, { useState, useCallback } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import useTranslation from "@/hooks/useTranslation";
import { debounce } from "lodash";
import Modal from "@/Components/Modal";

interface Teacher {
  id: number;
  name: string;
  national_id: string;
  email: string | null;
  phone: string;
  is_active: boolean;
  image?: string | null;
  teacher?: {
    classroom_id: number | null;
  };
}

interface Classroom {
  id: number;
  name: string;
}

interface Props {
  auth: any;
  teachers: Teacher[];
  classrooms: Classroom[];
  filters: { search?: string };
}

export default function TeachersIndex({ auth, teachers, classrooms, filters }: Props) {
  const { t, isRtl } = useTranslation();
  const [search, setSearch] = useState(filters.search || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    _method: "post",
    name: "",
    national_id: "",
    email: "",
    phone: "",
    password: "",
    role: "teacher",
    is_active: true,
    image: null as File | null,
    classroom_id: "" as string | number,
  });

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setPreviewImage(null);
    reset();
    setData("_method", "post");
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setIsEditing(true);
    setCurrentId(teacher.id);
    setPreviewImage(teacher.image ? `/storage/${teacher.image}` : null);
    setData({
      _method: "put",
      name: teacher.name,
      national_id: teacher.national_id,
      email: teacher.email || "",
      phone: teacher.phone || "",
      password: "",
      role: "teacher",
      is_active: teacher.is_active,
      image: null,
      classroom_id: teacher.teacher?.classroom_id || "",
    });
    clearErrors();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentId) {
      post(route("school.teachers.update", currentId), {
        forceFormData: true,
        preserveScroll: true,
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("school.teachers.store"), {
        preserveScroll: true,
        onSuccess: () => closeModal(),
      });
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      router.get(
        route("school.teachers.index"),
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
        },
      });
    }
  };

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
          {t("Teachers Management")}
        </h2>
      }
    >
      <Head title={t("Teachers Management")} />

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
                  <span className="text-3xl">👨‍🏫</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#0e7490] dark:text-cyan-400 mb-1">
                    {t("Teachers List")}
                  </h1>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t("Total Teachers")}:{" "}
                    <span className="font-bold text-[#0e7490] dark:text-cyan-400">
                      {teachers.length}
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
                    className={`w-full bg-gray-50 dark:bg-[#1e293b] border-gray-200 dark:border-white/10 rounded-[35px] py-3 text-gray-800 dark:text-white placeholder-gray-500 focus:ring-[#0e7490] focus:border-[#0e7490] border transition-all ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"}`}
                  />
                  <div className={`absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 pointer-events-none`}>
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
                  onClick={openAddModal}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0e7490] hover:bg-[#155e75] text-white px-8 py-3 rounded-[35px] font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span className="text-xl">+</span>
                  {t("Add New Teacher")}
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
                      {t("Name")}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                      {t("National ID")}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                      {t("Email")}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                      {t("Phone Number")}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">
                      {t("Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {teachers.length > 0 ? (
                    teachers.map((teacher) => (
                      <tr
                        key={teacher.id}
                        className="transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-900/10"
                      >
                        <td
                          className={`px-6 py-4 text-gray-800 dark:text-white font-medium text-start`}
                        >
                          <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-[#0e7490] dark:text-cyan-400 flex items-center justify-center font-bold text-sm overflow-hidden border border-cyan-200 dark:border-cyan-800">
                              {teacher.image ? (
                                <img
                                  src={`/storage/${teacher.image}`}
                                  alt={teacher.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                teacher.name.charAt(0)
                              )}
                            </div>
                            <div className={isRtl ? "text-right" : ""}>
                              {teacher.name}
                            </div>
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-sm text-start`}
                        >
                          {teacher.national_id}
                        </td>
                        <td
                          className={`px-6 py-4 text-gray-600 dark:text-gray-300 text-start`}
                        >
                          {teacher.email || "-"}
                        </td>
                        <td
                          className={`px-6 py-4 text-gray-600 dark:text-gray-300 text-start`}
                        >
                          {teacher.phone}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-4">
                            <button
                              onClick={() => openEditModal(teacher)}
                              className="p-2.5 text-[#0e7490] bg-cyan-50 dark:bg-cyan-900/20 transition-all rounded-[15px] hover:bg-cyan-100 dark:hover:bg-cyan-900/40 hover:scale-105 border border-cyan-100 dark:border-cyan-800"
                              title={t("Edit")}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => confirmDelete(teacher)}
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
                        colSpan={5}
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

      {/* Unified Add/Edit Teacher Modal */}
      <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
        <div className={`relative bg-white dark:bg-[#1e293b] rounded-[30px] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/10`} dir={isRtl ? "rtl" : "ltr"}>
          
          {/* Header */}
          <div className="bg-[#0e7490] px-8 pt-8 pb-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isEditing ? t("Edit Teacher") : t("Add New Teacher")}
              </h2>
              <p className="mt-1 text-sm text-white/80">
                {isRtl ? "أكمل التفاصيل الشخصية والمهنية أدناه" : "Complete the identification and professional details below"}
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col">
            <div className="p-8 space-y-8">
              {/* Photo Upload Section */}
              <div className={`flex items-start gap-6`}>
                <div className="relative w-24 h-24 rounded-[20px] bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center border border-gray-200 dark:border-white/10 flex-shrink-0">
                  <div className="w-full h-full rounded-[20px] overflow-hidden flex items-center justify-center">
                    {data.image ? (
                      <img src={URL.createObjectURL(data.image)} alt="Preview" className="w-full h-full object-cover" />
                    ) : previewImage ? (
                      <img src={previewImage} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className={`absolute -bottom-2 ${isRtl ? "-left-2" : "-right-2"} w-8 h-8 rounded-full bg-[#0e7490] text-white flex flex-col items-center justify-center shadow-lg border-2 border-white dark:border-[#1e293b]`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    {t("Profile Picture")}
                  </h4>
                  <p className="text-xs mt-1 max-w-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {isRtl 
                      ? "مطلوبة لبطاقات الهوية. JPG أو PNG بحد أقصى 5MB. ضرورة وضوح الوجه بالكامل إلزامي." 
                      : "Required for identification cards. JPG or PNG, maximum 5MB. Clear face visibility is mandatory."}
                  </p>
                  <div className="flex gap-3 mt-3">
                    <label className="cursor-pointer px-4 py-2 rounded-[15px] text-sm font-semibold transition-all bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-200 border border-transparent dark:border-white/5">
                      {isRtl ? "رفع صورة" : "Upload Photo"}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} />
                    </label>
                    <button 
                      type="button" 
                      onClick={() => { setData('image', null); setPreviewImage(null); }}
                      className="px-4 py-2 rounded-[15px] text-sm font-semibold transition-all border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
                    >
                      {isRtl ? "إزالة" : "Remove"}
                    </button>
                  </div>
                  {errors.image && <div className="mt-2 text-sm text-red-500">{errors.image}</div>}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                
                {/* Name */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      {t("Name")}
                    </label>
                    <span className="text-[10px] italic text-gray-400">{t("Required")}</span>
                  </div>
                  <input 
                    type="text" value={data.name} onChange={(e) => setData("name", e.target.value)}
                    className={`w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-[20px] py-3 text-sm text-gray-800 dark:text-white focus:ring-[#0e7490] focus:border-transparent transition-all border`} 
                  />
                  {errors.name && <div className="mt-1 text-sm text-red-500">{errors.name}</div>}
                </div>

                {/* National ID */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      {t("National ID")}
                    </label>
                    <span className="text-[10px] italic text-gray-400">{t("Required")}</span>
                  </div>
                  <input 
                    type="text" value={data.national_id} onChange={(e) => setData("national_id", e.target.value)} dir="ltr"
                    className={`w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-[20px] py-3 text-sm text-gray-800 dark:text-white focus:ring-[#0e7490] focus:border-transparent transition-all border font-mono`} 
                  />
                  {errors.national_id && <div className="mt-1 text-sm text-red-500">{errors.national_id}</div>}
                </div>

                {/* Phone */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      {t("Phone Number")}
                    </label>
                    <span className="text-[10px] italic text-gray-400">{t("Required")}</span>
                  </div>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none font-mono text-sm text-gray-500 dark:text-gray-400`}>+966</div>
                    <input 
                      type="text" value={data.phone} onChange={(e) => setData("phone", e.target.value)} dir="ltr" placeholder="5X XXX XXXX"
                      className={`w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-[20px] pl-14 pr-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-[#0e7490] focus:border-transparent transition-all border font-mono`} 
                    />
                  </div>
                  {errors.phone && <div className="mt-1 text-sm text-red-500">{errors.phone}</div>}
                </div>

                {/* Email */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      {t("Email")}
                    </label>
                    <span className="text-[10px] italic text-gray-400">{t("Optional")}</span>
                  </div>
                  <input 
                    type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} dir="ltr" placeholder="user@example.com"
                    className={`w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-[20px] py-3 text-sm text-gray-800 dark:text-white focus:ring-[#0e7490] focus:border-transparent transition-all border`} 
                  />
                  {errors.email && <div className="mt-1 text-sm text-red-500">{errors.email}</div>}
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      {isEditing ? t("New Password") : t("Password")}
                    </label>
                    <span className="text-[10px] italic text-gray-400">{t("Optional")}</span>
                  </div>
                  <input 
                    type="password" value={data.password} onChange={(e) => setData("password", e.target.value)} dir="ltr"
                    placeholder={isEditing ? t("Leave empty to keep current password") : (data.phone || t("Leave empty to use phone as password"))}
                    className={`w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-[20px] py-3 text-sm text-gray-800 dark:text-white focus:ring-[#0e7490] focus:border-transparent transition-all border`} 
                  />
                  {errors.password && <div className="mt-1 text-sm text-red-500">{errors.password}</div>}
                  <p className="text-[10px] text-gray-400 mt-1 whitespace-nowrap">
                    💡 {isEditing ? t("Leave empty to keep current password") : t("Default password is the phone number")}
                  </p>
                </div>

                {/* Status Toggle */}
                <div className="flex flex-col justify-start">
                  <div className="flex justify-between items-center mb-1.5 opacity-0 pointer-events-none hidden md:flex">
                     <label className="text-[10px] font-bold">Spacer</label>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                     <div className="relative">
                       <input 
                         type="checkbox" 
                         className="sr-only" 
                         checked={data.is_active} 
                         onChange={(e) => setData("is_active", e.target.checked)} 
                       />
                       <div className={`block w-10 h-6 rounded-full transition-colors ${data.is_active ? "bg-[#0e7490]" : "bg-gray-300 dark:bg-gray-600"}`}></div>
                       <div className={`dot absolute start-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${data.is_active ? (isRtl ? "transform -translate-x-4" : "transform translate-x-4") : ""}`}></div>
                     </div>
                     <span className={`text-sm font-semibold text-gray-700 dark:text-gray-300`}>
                       {t("Active Account")}
                     </span>
                  </label>
                </div>

                {/* Classroom */}
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      {t("Classroom")}
                    </label>
                    <span className="text-[10px] italic text-gray-400">{t("Optional")}</span>
                  </div>
                  <select 
                    value={data.classroom_id} 
                    onChange={(e) => setData("classroom_id", e.target.value)}
                    className={`w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-[20px] py-3 text-sm text-gray-800 dark:text-white focus:ring-[#0e7490] focus:border-transparent transition-all border`} 
                  >
                    <option value="">{t("Select Classroom")}</option>
                    {classrooms.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  {errors.classroom_id && <div className="mt-1 text-sm text-red-500">{errors.classroom_id}</div>}
                </div>

              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 border-t bg-gray-50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 flex justify-between items-center rounded-b-[30px]">
              <button 
                type="button" 
                onClick={closeModal} 
                className="text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                {t("Cancel")}
              </button>
              
              <div className="flex items-center gap-4">
                <button 
                  type="submit" 
                  disabled={processing}
                  className="px-8 py-3 rounded-[35px] font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all text-white bg-[#0e7490] hover:bg-[#155e75] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {processing ? t("Saving...") : (isEditing ? t("Save Changes") : t("Add"))}
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>

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
                  "Are you sure you want to delete this teacher? This action cannot be undone."
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
