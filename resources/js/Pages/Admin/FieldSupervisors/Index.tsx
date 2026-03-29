import { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { useTheme } from "@/Contexts/ThemeContext";

interface FieldSupervisor {
  id: number;
  name: string;
  name_en: string | null;
  email: string;
  phone: string;
  national_id: string;
  user_code: string;
  is_active: boolean;
  image?: string | null;
}

type FilterType = "all" | "active" | "inactive";

export default function FieldSupervisorsIndex({
  supervisors,
}: {
  supervisors: FieldSupervisor[];
}) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { data, setData, post, processing, errors, reset, clearErrors } =
    useForm({
      _method: "post",
      name: "",
      name_en: "",
      national_id: "",
      email: "",
      phone: "",
      is_active: true,
      image: null as File | null,
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

  const openEditModal = (sup: FieldSupervisor) => {
    setIsEditing(true);
    setCurrentId(sup.id);
    setPreviewImage(sup.image ? `/storage/${sup.image}` : null);
    setData({
      _method: "put",
      name: sup.name,
      name_en: sup.name_en || "",
      national_id: sup.national_id || "",
      email: sup.email,
      phone: sup.phone || "",
      is_active: sup.is_active,
      image: null,
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
      post(route("admin.field-supervisors.update", currentId), {
        forceFormData: true,
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("admin.field-supervisors.store"), {
        onSuccess: () => closeModal(),
      });
    }
  };

  const deleteSupervisor = (id: number) => {
    if (confirm(isRTL ? "هل أنت متأكد؟" : "Are you sure?")) {
      router.delete(route("admin.field-supervisors.destroy", id));
    }
  };

  // ---- Filter + Search ----
  const filtered = useMemo(() => {
    let list = supervisors;
    if (filter === "active") list = list.filter((s) => s.is_active);
    if (filter === "inactive") list = list.filter((s) => !s.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.name_en?.toLowerCase().includes(q) ?? false) ||
          s.national_id?.includes(q) ||
          s.phone?.includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.user_code?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [supervisors, filter, search]);

  const counts = useMemo(
    () => ({
      all: supervisors.length,
      active: supervisors.filter((s) => s.is_active).length,
      inactive: supervisors.filter((s) => !s.is_active).length,
    }),
    [supervisors]
  );

  const filterBtnClass = (f: FilterType) =>
    `px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
      filter === f
        ? "bg-brand-dark text-white border-brand-dark shadow"
        : isDark
        ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
    }`;

  const statusLabel = (isActive: boolean) => {
    return isActive
      ? isRTL
        ? "نشط"
        : "Active"
      : isRTL
      ? "غير نشط"
      : "Inactive";
  };

  return (
    <AuthenticatedLayout
      header={
        <h2
          className={`font-bold text-xl ${
            isDark ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {isRTL ? "إدارة المشرفين الميدانيين" : "Field Supervisors Management"}
        </h2>
      }
    >
      <Head title={isRTL ? "المشرفين الميدانيين" : "Field Supervisors"} />

      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-5">
          {/* Header */}
          <div
            className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
              isRTL ? "md:flex-row-reverse" : ""
            }`}
          >
            <div className={isRTL ? "text-right" : ""}>
              <h1
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-brand-dark"
                }`}
              >
                {isRTL ? "المشرفون الميدانيون" : "Field Supervisors"}
              </h1>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {isRTL
                  ? `${counts.all} مشرف — ${counts.active} نشط — ${counts.inactive} غير نشط`
                  : `${counts.all} total — ${counts.active} active — ${counts.inactive} inactive`}
              </p>
            </div>
            <PrimaryButton
              onClick={openAddModal}
              className="bg-brand-yellow text-brand-dark hover:bg-yellow-500"
            >
              {isRTL ? "+ إضافة مشرف ميداني" : "+ Add Field Supervisor"}
            </PrimaryButton>
          </div>

          {/* Controls */}
          <div
            className={`flex flex-col sm:flex-row gap-3 ${
              isRTL ? "sm:flex-row-reverse" : ""
            }`}
          >
            <div className="flex gap-2">
              <button
                className={filterBtnClass("all")}
                onClick={() => setFilter("all")}
              >
                {isRTL ? "الكل" : "All"} ({counts.all})
              </button>
              <button
                className={filterBtnClass("active")}
                onClick={() => setFilter("active")}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />
                {isRTL ? "نشط" : "Active"} ({counts.active})
              </button>
              <button
                className={filterBtnClass("inactive")}
                onClick={() => setFilter("inactive")}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />
                {isRTL ? "غير نشط" : "Inactive"} ({counts.inactive})
              </button>
            </div>
            <div className="relative flex-1 max-w-sm">
              <svg
                className={`w-4 h-4 absolute top-2.5 ${
                  isRTL ? "right-3" : "left-3"
                } text-gray-400`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isRTL
                    ? "بحث بالاسم، الهوية، الهاتف..."
                    : "Search name, ID, phone..."
                }
                className={`w-full ${
                  isRTL ? "pr-9 pl-4" : "pl-9 pr-4"
                } py-2 text-sm rounded-lg border focus:ring-2 focus:ring-brand-dark focus:border-transparent transition ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    : "bg-white border-gray-200"
                }`}
              />
            </div>
          </div>

          {/* Table */}
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } overflow-hidden shadow-sm sm:rounded-2xl border`}
          >
            <div className="overflow-x-auto">
              <table
                className={`min-w-full divide-y ${
                  isDark ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                <thead className={isDark ? "bg-gray-900/50" : "bg-gray-50"}>
                  <tr>
                    {[
                      isRTL ? "المشرف الميداني" : "Supervisor",
                      isRTL ? "الهوية / الكود" : "ID / Code",
                      isRTL ? "الاتصال" : "Contact",
                      isRTL ? "الحالة" : "Status",
                      isRTL ? "الإجراءات" : "Actions",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-4 py-3 text-xs font-bold ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        } uppercase tracking-wider ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className={`${
                    isDark
                      ? "bg-gray-800 divide-gray-700"
                      : "bg-white divide-gray-200"
                  } divide-y`}
                >
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className={`px-6 py-10 text-center ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {isRTL
                          ? "لا يوجد مشرفين ميدانيين."
                          : "No field supervisors found."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((sup) => (
                      <tr
                        key={sup.id}
                        className={`${
                          isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                        } transition`}
                      >
                        {/* Avatar + Name */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div
                            className={`flex items-center gap-3 ${
                              isRTL ? "flex-row-reverse" : ""
                            }`}
                          >
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm overflow-hidden ring-2 ring-offset-1 ring-blue-200">
                              {sup.image ? (
                                <img
                                  src={`/storage/${sup.image}`}
                                  alt={sup.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                sup.name.charAt(0)
                              )}
                            </div>
                            <div className={isRTL ? "text-right" : ""}>
                              <div
                                className={`text-sm font-semibold ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {sup.name}
                              </div>
                              {sup.name_en && (
                                <div
                                  className={`text-xs ${
                                    isDark ? "text-gray-400" : "text-gray-400"
                                  }`}
                                >
                                  {sup.name_en}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* ID + Code */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div
                            className={`text-sm font-mono font-medium ${
                              isDark ? "text-gray-300" : "text-gray-800"
                            }`}
                          >
                            {sup.national_id || "—"}
                          </div>
                          <div
                            className={`text-xs ${
                              isDark ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {sup.user_code}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div
                            className={`text-sm ${
                              isDark ? "text-gray-300" : "text-gray-800"
                            }`}
                          >
                            {sup.phone}
                          </div>
                          <div
                            className={`text-xs truncate max-w-[160px] ${
                              isDark ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {sup.email}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                              sup.is_active
                                ? isDark
                                  ? "bg-green-900/30 text-green-400"
                                  : "bg-green-100 text-green-800"
                                : isDark
                                ? "bg-red-900/30 text-red-400"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {statusLabel(sup.is_active)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                            isRTL ? "text-left" : "text-right"
                          }`}
                        >
                          <div
                            className={`flex gap-2 ${
                              isRTL ? "justify-start" : "justify-end"
                            }`}
                          >
                            <button
                              onClick={() => openEditModal(sup)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                isDark
                                  ? "bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/60"
                                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                              }`}
                            >
                              {isRTL ? "تعديل" : "Edit"}
                            </button>
                            <button
                              onClick={() => deleteSupervisor(sup.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                isDark
                                  ? "bg-red-900/30 text-red-400 hover:bg-red-900/60"
                                  : "bg-red-50 text-red-700 hover:bg-red-100"
                              }`}
                            >
                              {isRTL ? "حذف" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Add/Edit Modal */}
      <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
        <div className={`relative ${isDark ? "bg-gray-900 border border-gray-700" : "bg-white"} rounded-2xl overflow-hidden shadow-2xl`}>
          {/* Close Button */}
          <button
            type="button"
            onClick={closeModal}
            className={`absolute top-6 ${isRTL ? "left-6" : "right-6"} p-2 rounded-full hover:bg-gray-100 transition-colors ${isDark ? "hover:bg-gray-800 text-gray-400" : "text-gray-500"}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className={`px-8 pt-8 pb-6 border-b ${isDark ? "border-gray-800" : "border-gray-100"}`}>
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-brand-navy"}`}>
              {isEditing ? (isRTL ? "تعديل بيانات المشرف الميداني" : "Edit Field Supervisor") : (isRTL ? "تسجيل ببيانات مشرف ميداني جديد" : "New Field Supervisor")}
            </h2>
            <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {isRTL ? "أكمل التفاصيل الخصية والمهنية أدناه" : "Complete the identification and professional details below"}
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col">
            <div className="p-8 space-y-8">
              {/* Photo Upload Section */}
              <div className={`flex items-start gap-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="relative w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0 overflow-visible">
                  <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50">
                    {data.image ? (
                      <img src={URL.createObjectURL(data.image)} alt="Preview" className="w-full h-full object-cover" />
                    ) : previewImage ? (
                      <img src={previewImage} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className={`absolute -bottom-2 ${isRTL ? "-left-2" : "-right-2"} w-8 h-8 rounded-full bg-brand-yellow text-brand-dark flex flex-col items-center justify-center border-2 border-white shadow-sm`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                  <h4 className={`font-bold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                    {isRTL ? "صورة الملف الشخصي للمشرف الميداني" : "Field Supervisor Image"}
                  </h4>
                  <p className={`text-xs mt-1 max-w-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {isRTL 
                      ? "مطلوبة لبطاقات الهوية. JPG أو PNG بحد أقصى 5MB. ضرورة وضوح الوجه بالكامل إلزامي." 
                      : "Required for identification cards. JPG or PNG, maximum 5MB. Clear face visibility is mandatory."}
                  </p>
                  <div className={`flex gap-3 mt-3 ${isRTL ? "flex-row-reverse justify-end" : ""}`}>
                    <label className={`cursor-pointer px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isDark ? "bg-brand-navy border border-gray-600 text-white hover:bg-gray-800" : "bg-brand-navy text-white hover:bg-opacity-90"}`}>
                      {isRTL ? "رفع صورة" : "Upload Photo"}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} />
                    </label>
                    <button 
                      type="button" 
                      onClick={() => { setData('image', null); setPreviewImage(null); }}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {isRTL ? "إزالة" : "Remove"}
                    </button>
                  </div>
                  <InputError message={errors.image} className="mt-2" />
                </div>
              </div>

              {/* Form Grid */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 ${isRTL ? "rtl" : "ltr"}`}>
                
                {/* Name EN */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="name_en" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {isRTL ? "الاسم بالإنجليزية" : "Full Name (English)"}
                    </label>
                  </div>
                  <input 
                    id="name_en" type="text" value={data.name_en} onChange={(e) => setData("name_en", e.target.value)} dir="ltr"
                    className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy focus:border-transparent"}`} 
                  />
                  <InputError message={errors.name_en} className="mt-1" />
                </div>

                {/* Name AR */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="name" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {isRTL ? "الاسم الكامل (عربي)" : "Full Name (Arabic)"}
                    </label>
                    <span className="text-[10px] italic text-gray-400">{isRTL ? "مطلوب" : "Required"}</span>
                  </div>
                  <input 
                    id="name" type="text" value={data.name} onChange={(e) => setData("name", e.target.value)} dir="rtl"
                    className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy focus:border-transparent"}`} 
                  />
                  <InputError message={errors.name} className="mt-1" />
                </div>

                {/* National ID */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="national_id" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {isRTL ? "رقم الهوية / الإقامة" : "National ID / Resident ID"}
                    </label>
                    <span className="text-[10px] italic text-gray-400">{isRTL ? "مطلوب" : "Required"}</span>
                  </div>
                  <input 
                    id="national_id" type="text" value={data.national_id} onChange={(e) => setData("national_id", e.target.value)} dir="ltr"
                    className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all font-mono ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy focus:border-transparent"}`} 
                  />
                  <InputError message={errors.national_id} className="mt-1" />
                </div>

                {/* Phone */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="phone" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {isRTL ? "رقم الجوال" : "Phone Number"}
                    </label>
                    <span className="text-[10px] italic text-gray-400">{isRTL ? "مطلوب" : "Required"}</span>
                  </div>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none font-mono text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>+966</div>
                    <input 
                      id="phone" type="text" value={data.phone} onChange={(e) => setData("phone", e.target.value)} dir="ltr" placeholder="5X XXX XXXX"
                      className={`w-full rounded-lg pl-12 pr-4 py-2.5 text-sm outline-none transition-all font-mono ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy focus:border-transparent"}`} 
                    />
                  </div>
                  <InputError message={errors.phone} className="mt-1" />
                </div>

                {/* Email */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="email" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {isRTL ? "البريد الإلكتروني" : "Email Address"}
                    </label>
                    <span className="text-[10px] italic text-gray-400">{isRTL ? "مطلوب" : "Required"}</span>
                  </div>
                  <input 
                    id="email" type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} dir="ltr" placeholder="fieldsup@fleet.com"
                    className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy focus:border-transparent"}`} 
                  />
                  <InputError message={errors.email} className="mt-1" />
                </div>

                {/* Status Toggle */}
                <div className="flex flex-col justify-center">
                  <div className="justify-between items-center mb-1.5 opacity-0 pointer-events-none hidden md:flex">
                     <label className="text-[10px] font-bold">Spacer</label>
                  </div>
                  <label className={`flex items-center gap-3 cursor-pointer select-none ${isRTL ? "flex-row-reverse justify-end" : ""}`}>
                     <div className="relative">
                       <input 
                         type="checkbox" 
                         className="sr-only" 
                         checked={data.is_active} 
                         onChange={(e) => setData("is_active", e.target.checked)} 
                       />
                       <div className={`block w-10 h-6 rounded-full transition-colors ${data.is_active ? "bg-green-500" : "bg-gray-300"} ${isDark && !data.is_active ? "bg-gray-600" : ""}`}></div>
                       <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${data.is_active ? "transform translate-x-4" : ""}`}></div>
                     </div>
                     <span className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                       {data.is_active ? (isRTL ? "حساب نشط" : "Active Account") : (isRTL ? "حساب غير نشط" : "Inactive Account")}
                     </span>
                  </label>
                </div>

              </div>
            </div>

            {/* Footer Actions */}
            <div className={`px-8 py-5 border-t flex justify-between items-center ${isDark ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
              <button 
                type="button" 
                onClick={closeModal} 
                className={`text-sm font-semibold transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}
              >
                {isRTL ? "إلغاء المسودة" : "Discard Draft"}
              </button>
              
              <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className={`text-sm font-bold transition-colors ${isDark ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-black"}`}
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button 
                  type="submit" 
                  disabled={processing}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-opacity disabled:opacity-50 ${isDark ? "bg-brand-yellow text-brand-dark hover:opacity-90" : "bg-brand-yellow text-brand-dark hover:opacity-90"}`}
                >
                  {isEditing ? (isRTL ? "حفظ التعديلات" : "Save Changes") : (isRTL ? "إضافة المشرف الميداني" : "Add Field Supervisor")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
