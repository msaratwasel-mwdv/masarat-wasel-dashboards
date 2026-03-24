import React, { useState, useCallback, useRef } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import useTranslation from "@/hooks/useTranslation";
import { debounce } from "lodash";

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
}

interface Supervisor {
  id: number;
  name: string;
  name_en: string | null;
  user_code: string;
  national_id: string;
  email: string | null;
  phone: string;
  address: string | null;
  preferred_language: "ar" | "en";
  is_active: boolean;
  image: string | null;
  supervisor_type: "bus" | "class" | "both";
  tracking_type: "phone" | "vehicle";
  bus_id: number | null;
  bus_number: string | null;
}

interface Props {
  auth: any;
  supervisors: Supervisor[];
  buses: Bus[];
  filters: { search?: string };
}

export default function SupervisorsIndex({ auth, supervisors, buses, filters }: Props) {
  const { t, isRtl } = useTranslation();
  const [search, setSearch] = useState(filters.search || "");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supervisorToEdit, setSupervisorToEdit] = useState<Supervisor | null>(null);
  const [supervisorToDelete, setSupervisorToDelete] = useState<Supervisor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form for adding new supervisor
  const addForm = useForm({
    name: "",
    name_en: "",
    national_id: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    bus_id: "" as number | string,
    preferred_language: "ar" as "ar" | "en",
    is_active: true as boolean,
    supervisor_type: "bus" as "bus" | "class" | "both",
    tracking_type: "phone" as "phone" | "vehicle",
    status: "Active" as "Trainee" | "Active" | "On Leave" | "Inactive",
    image: null as File | null,
  });

  // Form for editing supervisor
  // Since we have file uploads, Inertia recommends using POST with _method=PUT for edits involving files
  const editForm = useForm({
    _method: "PUT",
    name: "",
    name_en: "",
    national_id: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    bus_id: "" as number | string,
    preferred_language: "ar" as "ar" | "en",
    is_active: true as boolean,
    supervisor_type: "bus" as "bus" | "class" | "both",
    tracking_type: "phone" as "phone" | "vehicle",
    image: null as File | null,
  });

  const getSupervisorTypeLabel = (type: string) => {
    switch (type) {
      case "bus":
        return isRtl ? "مشرف باص" : "Bus Supervisor";
      case "class":
        return isRtl ? "مشرف صف" : "Class Supervisor";
      case "both":
        return isRtl ? "مشرف باص وصف" : "Bus & Class Supervisor";
      default:
        return type;
    }
  };

  const getTrackingTypeLabel = (type: string) => {
    switch (type) {
      case "phone":
        return isRtl ? "التتبع عبر الهاتف" : "Phone Tracking";
      case "vehicle":
        return isRtl ? "التتبع عبر المركبة" : "Vehicle Tracking";
      default:
        return type;
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addForm.post(route("school.supervisors.store"), {
      preserveScroll: true,
      onSuccess: () => {
        setShowAddModal(false);
        addForm.reset();
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      forceFormData: true,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorToEdit) return;

    editForm.post(route("school.supervisors.update", supervisorToEdit.id), {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: () => {
        setShowEditModal(false);
        editForm.reset();
        setSupervisorToEdit(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  };

  const openEditModal = (supervisor: Supervisor) => {
    setSupervisorToEdit(supervisor);
    editForm.setData({
      _method: "PUT",
      name: supervisor.name,
      name_en: supervisor.name_en || "",
      national_id: supervisor.national_id,
      email: supervisor.email || "",
      phone: supervisor.phone || "",
      address: supervisor.address || "",
      password: "",
      bus_id: supervisor.bus_id || "",
      preferred_language: supervisor.preferred_language || "ar",
      is_active: supervisor.is_active,
      supervisor_type: supervisor.supervisor_type,
      tracking_type: supervisor.tracking_type,
      image: null,
    });
    setShowEditModal(true);
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      router.get(
        route("school.supervisors.index"),
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

  const confirmDelete = (supervisor: Supervisor) => {
    setSupervisorToDelete(supervisor);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (supervisorToDelete) {
      router.delete(route("school.supervisors.destroy", supervisorToDelete.id), {
        onSuccess: () => {
          setShowDeleteModal(false);
          setSupervisorToDelete(null);
        },
      });
    }
  };

  // Common input classes for the form
  const inputCls = "w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-[35px] py-3.5 px-6 text-gray-800 dark:text-white focus:ring-[#0e7490] focus:border-transparent transition-all";
  const selectCls = "w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-[35px] py-3.5 px-6 text-gray-800 dark:text-white focus:ring-[#0e7490] focus:border-transparent transition-all appearance-none";

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "1.25rem 1.25rem",
    backgroundPosition: isRtl ? "left 1.5rem center" : "right 1.5rem center",
    paddingInlineEnd: "3rem",
  } as React.CSSProperties;

  const renderModalInput = (
    label: string,
    id: string,
    type: string,
    value: any,
    onChange: (val: any) => void,
    error?: string,
    placeholder?: string,
    required = false,
    extraDesc?: string
  ) => (
    <div>
      <label htmlFor={id} className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        placeholder={placeholder}
        required={required}
      />
      {extraDesc && <p className="text-xs text-gray-400 mt-1.5 px-2">💡 {extraDesc}</p>}
      {error && <div className="mt-1.5 text-sm text-red-500 px-2">{error}</div>}
    </div>
  );

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
          {isRtl ? "إدارة المشرفين" : "Supervisors Management"}
        </h2>
      }
    >
      <Head title={isRtl ? "إدارة المشرفين" : "Supervisors Management"} />

      <div className={`max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="bg-white dark:bg-[#0f172a] rounded-[30px] overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#0e7490] text-white rounded-[20px] shadow-sm">
                  <span className="text-3xl">👥</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#0e7490] dark:text-cyan-400 mb-1">
                    {isRtl ? "قائمة المشرفين" : "Supervisors List"}
                  </h1>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {isRtl ? "إجمالي المشرفين" : "Total Supervisors"}:{" "}
                    <span className="font-bold text-[#0e7490] dark:text-cyan-400">
                      {supervisors.length}
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
                  {isRtl ? "إضافة مشرف جديد" : "Add New Supervisor"}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-[30px] border border-gray-200 dark:border-gray-700">
              <table className={`w-full text-start mb-0`} dir={isRtl ? "rtl" : "ltr"}>
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                      {isRtl ? "اسم المشرف" : "Supervisor Name"}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                      {isRtl ? "اسم المستخدم" : "Username"}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                      {t("National ID")}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                      {isRtl ? "رقم الحافلة" : "Bus Number"}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                      {t("Phone Number")}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">
                      {t("Status")}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                      {isRtl ? "نوع المشرف" : "Supervisor Type"}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">
                      {t("Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 whitespace-nowrap">
                  {supervisors.length > 0 ? (
                    supervisors.map((supervisor) => (
                      <tr key={supervisor.id} className="transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-900/10">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-[12px] overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-[#0e7490]/20 flex-shrink-0">
                              {supervisor.image ? (
                                <img src={`/storage/${supervisor.image}`} alt={supervisor.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-[#0e7490] font-bold text-lg bg-cyan-50 dark:bg-cyan-900/40">
                                  {supervisor.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <span className="text-gray-800 dark:text-white font-medium">{supervisor.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-sm text-start">
                          {supervisor.user_code}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-sm text-start">
                          {supervisor.national_id}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-bold text-start">
                          {supervisor.bus_number ? (
                            <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full text-xs">
                              {supervisor.bus_number}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-start">
                          {supervisor.phone}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-4 py-1.5 rounded-[20px] text-xs font-bold border ${
                            supervisor.is_active
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                              : "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                          }`}>
                            {supervisor.is_active ? (isRtl ? "فعال" : "Active") : (isRtl ? "غير فعال" : "Inactive")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm font-medium text-start">
                          <span className="bg-cyan-50 dark:bg-cyan-900/20 text-[#0e7490] dark:text-cyan-400 px-3 py-1.5 rounded-[12px]">
                            {getSupervisorTypeLabel(supervisor.supervisor_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => openEditModal(supervisor)}
                              className="p-2.5 text-[#0e7490] bg-cyan-50 dark:bg-cyan-900/20 transition-all rounded-[15px] hover:bg-cyan-100 dark:hover:bg-cyan-900/40 hover:scale-105 border border-cyan-100 dark:border-cyan-800"
                              title={t("Edit")}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => confirmDelete(supervisor)}
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
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 italic">
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

      {/* Add/Edit Modal Base Template */}
      {/* We will handle both Add and Edit with similar forms to match Teachers page but keep them separate for clarity */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-[#1e293b] rounded-[30px] overflow-hidden border border-gray-100 dark:border-white/10 w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col" dir={isRtl ? "rtl" : "ltr"} onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#0e7490] p-6 text-white shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{isRtl ? "إضافة مشرف جديد" : "Add New Supervisor"}</h2>
                <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-8">
              <form onSubmit={handleAddSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderModalInput(isRtl ? "الاسم بالعربية" : "Name (Arabic)", "add_name", "text", addForm.data.name, val => addForm.setData("name", val), addForm.errors.name, "", true)}
                  {renderModalInput(isRtl ? "الاسم بالإنجليزية" : "Name (English)", "add_name_en", "text", addForm.data.name_en, val => addForm.setData("name_en", val), addForm.errors.name_en)}
                  {renderModalInput(t("National ID"), "add_nid", "text", addForm.data.national_id, val => addForm.setData("national_id", val), addForm.errors.national_id, "", true)}
                  {renderModalInput(t("Email"), "add_email", "email", addForm.data.email, val => addForm.setData("email", val), addForm.errors.email)}
                  {renderModalInput(t("Phone Number"), "add_phone", "text", addForm.data.phone, val => addForm.setData("phone", val), addForm.errors.phone, "", true)}
                  {renderModalInput(isRtl ? "العنوان" : "Address", "add_address", "text", addForm.data.address, val => addForm.setData("address", val), addForm.errors.address)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bus Select */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                      {isRtl ? "اختيار الباص" : "Select Bus"}
                    </label>
                    <div className="relative">
                      <select
                        value={addForm.data.bus_id}
                        onChange={(e) => addForm.setData("bus_id", e.target.value)}
                        className={selectCls}
                        style={selectStyle}
                      >
                        <option value="">{isRtl ? "-- بدون باص --" : "-- No Bus --"}</option>
                        {buses.map(b => (
                          <option key={b.id} value={b.id}>{b.bus_number} ({b.plate_number})</option>
                        ))}
                      </select>
                    </div>
                    {addForm.errors.bus_id && <div className="mt-1.5 text-sm text-red-500 px-2">{addForm.errors.bus_id}</div>}
                  </div>

                  {/* Preferred Language */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                      {isRtl ? "اللغة المفضلة" : "Preferred Language"}
                    </label>
                    <div className="relative">
                      <select
                        value={addForm.data.preferred_language}
                        onChange={(e) => addForm.setData("preferred_language", e.target.value as "ar"|"en")}
                        className={selectCls}
                        style={selectStyle}
                      >
                        <option value="ar">{isRtl ? "العربية" : "Arabic"}</option>
                        <option value="en">{isRtl ? "الإنجليزية" : "English"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Supervisor Type */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                      {isRtl ? "نوع المشرف" : "Supervisor Type"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={addForm.data.supervisor_type}
                        onChange={(e) => addForm.setData("supervisor_type", e.target.value as any)}
                        className={selectCls}
                        style={selectStyle}
                      >
                        <option value="bus">{isRtl ? "مشرف باص" : "Bus Supervisor"}</option>
                        <option value="class">{isRtl ? "مشرف صف" : "Class Supervisor"}</option>
                        <option value="both">{isRtl ? "الاثنين معًا" : "Both"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Tracking Type */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                      {isRtl ? "نوع التتبع" : "Tracking Type"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={addForm.data.tracking_type}
                        onChange={(e) => addForm.setData("tracking_type", e.target.value as any)}
                        className={selectCls}
                        style={selectStyle}
                      >
                        <option value="phone">{isRtl ? "التتبع عبر الهاتف" : "Phone Tracking"}</option>
                        <option value="vehicle">{isRtl ? "التتبع عبر المركبة" : "Vehicle Tracking"}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                      {isRtl ? "صورة المشرف" : "Supervisor Image"}
                    </label>
                    <div className={inputCls + " !py-2.5 flex items-center justify-between"}>
                      <span className="text-sm text-gray-500 truncate max-w-[150px]">
                        {addForm.data.image ? addForm.data.image.name : (isRtl ? "لم يتم اختيار صورة" : "No image selected")}
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#0e7490]/10 text-[#0e7490] hover:bg-[#0e7490]/20 px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
                      >
                        {isRtl ? "اضغط هنا" : "Upload Image"}
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => addForm.setData('image', e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                      accept="image/*"
                    />
                    {addForm.errors.image && <div className="mt-1.5 text-sm text-red-500 px-2">{addForm.errors.image}</div>}
                  </div>

                  {/* Active Toggle */}
                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer p-3.5 bg-gray-50 dark:bg-[#0f172a] rounded-[35px] border border-gray-100 dark:border-gray-700 mt-5">
                      <div className="relative flex items-center px-2">
                        <input
                          type="checkbox"
                          checked={addForm.data.is_active}
                          onChange={(e) => addForm.setData("is_active", e.target.checked)}
                          className="w-5 h-5 rounded-md border-gray-300 text-[#0e7490] shadow-sm focus:border-[#0e7490] focus:ring focus:ring-[#0e7490] focus:ring-opacity-50"
                        />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-bold select-none">
                        {isRtl ? "تفعيل حساب المشرف" : "Activate Supervisor Account"}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-white/10 pt-6 mt-4 flex gap-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-100 dark:bg-[#0f172a] hover:bg-gray-200 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 py-3.5 rounded-[35px] font-bold transition-all border border-gray-200 dark:border-white/10">
                    {t("Cancel")}
                  </button>
                  <button type="submit" disabled={addForm.processing} className="flex-1 bg-[#0e7490] hover:bg-[#155e75] text-white py-3.5 rounded-[35px] font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50">
                    {addForm.processing ? t("Saving...") : t("Add")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-[#1e293b] rounded-[30px] overflow-hidden border border-gray-100 dark:border-white/10 w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col" dir={isRtl ? "rtl" : "ltr"} onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#0e7490] p-6 text-white shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{isRtl ? "تعديل بيانات المشرف" : "Edit Supervisor"}</h2>
                <button onClick={() => setShowEditModal(false)} className="text-white/80 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-8">
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderModalInput(isRtl ? "الاسم بالعربية" : "Name (Arabic)", "edit_name", "text", editForm.data.name, val => editForm.setData("name", val), editForm.errors.name, "", true)}
                  {renderModalInput(isRtl ? "الاسم بالإنجليزية" : "Name (English)", "edit_name_en", "text", editForm.data.name_en, val => editForm.setData("name_en", val), editForm.errors.name_en)}
                  {renderModalInput(t("National ID"), "edit_nid", "text", editForm.data.national_id, val => editForm.setData("national_id", val), editForm.errors.national_id, "", true)}
                  {renderModalInput(t("Email"), "edit_email", "email", editForm.data.email, val => editForm.setData("email", val), editForm.errors.email)}
                  {renderModalInput(t("Phone Number"), "edit_phone", "text", editForm.data.phone, val => editForm.setData("phone", val), editForm.errors.phone, "", true)}
                  {renderModalInput(isRtl ? "العنوان" : "Address", "edit_address", "text", editForm.data.address, val => editForm.setData("address", val), editForm.errors.address)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bus Select */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                      {isRtl ? "اختيار الباص" : "Select Bus"}
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.data.bus_id}
                        onChange={(e) => editForm.setData("bus_id", e.target.value)}
                        className={selectCls}
                        style={selectStyle}
                      >
                        <option value="">{isRtl ? "-- بدون باص --" : "-- No Bus --"}</option>
                        {buses.map(b => (
                          <option key={b.id} value={b.id}>{b.bus_number} ({b.plate_number})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preferred Language */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                      {isRtl ? "اللغة المفضلة" : "Preferred Language"}
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.data.preferred_language}
                        onChange={(e) => editForm.setData("preferred_language", e.target.value as "ar"|"en")}
                        className={selectCls}
                        style={selectStyle}
                      >
                        <option value="ar">{isRtl ? "العربية" : "Arabic"}</option>
                        <option value="en">{isRtl ? "الإنجليزية" : "English"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Supervisor Type */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                      {isRtl ? "نوع المشرف" : "Supervisor Type"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.data.supervisor_type}
                        onChange={(e) => editForm.setData("supervisor_type", e.target.value as any)}
                        className={selectCls}
                        style={selectStyle}
                      >
                        <option value="bus">{isRtl ? "مشرف باص" : "Bus Supervisor"}</option>
                        <option value="class">{isRtl ? "مشرف صف" : "Class Supervisor"}</option>
                        <option value="both">{isRtl ? "الاثنين معًا" : "Both"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Tracking Type */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                      {isRtl ? "نوع التتبع" : "Tracking Type"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={editForm.data.tracking_type}
                        onChange={(e) => editForm.setData("tracking_type", e.target.value as any)}
                        className={selectCls}
                        style={selectStyle}
                      >
                        <option value="phone">{isRtl ? "التتبع عبر الهاتف" : "Phone Tracking"}</option>
                        <option value="vehicle">{isRtl ? "التتبع عبر المركبة" : "Vehicle Tracking"}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                      {isRtl ? "صورة المشرف" : "Supervisor Image"}
                    </label>
                    <div className={inputCls + " !py-2.5 flex items-center justify-between"}>
                      <span className="text-sm text-gray-500 truncate max-w-[150px]">
                        {editForm.data.image ? editForm.data.image.name : (isRtl ? "لم يتم تغيير الصورة" : "Select new image (optional)")}
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#0e7490]/10 text-[#0e7490] hover:bg-[#0e7490]/20 px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
                      >
                        {isRtl ? "اضغط هنا" : "Upload Image"}
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => editForm.setData('image', e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                      accept="image/*"
                    />
                    {editForm.errors.image && <div className="mt-1.5 text-sm text-red-500 px-2">{editForm.errors.image}</div>}
                  </div>

                  {/* Active Toggle */}
                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer p-3.5 bg-gray-50 dark:bg-[#0f172a] rounded-[35px] border border-gray-100 dark:border-gray-700 mt-5">
                      <div className="relative flex items-center px-2">
                        <input
                          type="checkbox"
                          checked={editForm.data.is_active}
                          onChange={(e) => editForm.setData("is_active", e.target.checked)}
                          className="w-5 h-5 rounded-md border-gray-300 text-[#0e7490] shadow-sm focus:border-[#0e7490] focus:ring focus:ring-[#0e7490] focus:ring-opacity-50"
                        />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-bold select-none">
                        {isRtl ? "حساب المشرف فعال" : "Supervisor Account is Active"}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-white/10 pt-6 mt-4 flex gap-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-100 dark:bg-[#0f172a] hover:bg-gray-200 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 py-3.5 rounded-[35px] font-bold transition-all border border-gray-200 dark:border-white/10">
                    {t("Cancel")}
                  </button>
                  <button type="submit" disabled={editForm.processing} className="flex-1 bg-[#0e7490] hover:bg-[#155e75] text-white py-3.5 rounded-[35px] font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50">
                    {editForm.processing ? t("Saving...") : t("Save Changes")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-[#1e293b] p-8 border border-gray-100 dark:border-white/10 rounded-[30px] transition-colors duration-300 w-full max-w-md shadow-2xl" dir={isRtl ? "rtl" : "ltr"} onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t("Confirm Deletion")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {isRtl ? "هل أنت متأكد من حذف هذا المشرف؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this supervisor? This action cannot be undone."}
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-100 dark:bg-[#0f172a] hover:bg-gray-200 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 py-3.5 rounded-[35px] font-bold transition-all border border-gray-200 dark:border-white/10">
                {t("Cancel")}
              </button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-[35px] font-bold shadow-lg shadow-red-500/20 transition-all">
                {t("Yes, Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </SchoolAuthenticatedLayout>
  );
}
