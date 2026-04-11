import { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, {
  ActionButton,
  StatusBadge,
  type FilterTab,
} from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { motion } from "framer-motion";
import { Users, CheckCircle2, XCircle, MapPin } from "lucide-react";

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
  first_name_ar?: string;
  second_name_ar?: string;
  third_name_ar?: string;
  last_name_ar?: string;
  first_name_en?: string;
  second_name_en?: string;
  third_name_en?: string;
  last_name_en?: string;
}

type FilterType = "all" | "active" | "inactive";

export default function FieldSupervisorsIndex({ supervisors }: { supervisors: FieldSupervisor[] }) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    _method: "post",
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
    status: "Active",
    is_active: true,
    address: "",
    image: null as File | null,
  });

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setPreviewImage(null);
    setCurrentStep(1);
    reset();
    setData("_method", "post");
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (sup: FieldSupervisor) => {
    setIsEditing(true);
    setCurrentId(sup.id);
    setPreviewImage(sup.image ? `/storage/${sup.image}` : null);
    setCurrentStep(1);
    setData({
      _method: "put",
      first_name_ar: sup.first_name_ar || sup.name.split(" ")[0] || "",
      second_name_ar: sup.second_name_ar || "",
      third_name_ar: sup.third_name_ar || "",
      last_name_ar: sup.last_name_ar || sup.name.split(" ").slice(-1)[0] || "",
      first_name_en: sup.first_name_en || (sup.name_en ? sup.name_en.split(" ")[0] : ""),
      second_name_en: sup.second_name_en || "",
      third_name_en: sup.third_name_en || "",
      last_name_en: sup.last_name_en || (sup.name_en ? sup.name_en.split(" ").slice(-1)[0] : ""),
      national_id: sup.national_id || "",
      email: sup.email,
      phone: sup.phone || "",
      status: sup.is_active ? "Active" : "Inactive",
      is_active: sup.is_active,
      address: sup.address || "",
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
        transform: (data) => ({
          ...data,
          is_active: data.status === "Active"
        })
      });
    } else {
      post(route("admin.field-supervisors.store"), {
        forceFormData: true,
        onSuccess: () => closeModal(),
        transform: (data) => ({
          ...data,
          is_active: data.status === "Active"
        })
      });
    }
  };

  const deleteSupervisor = (id: number) => {
    if (confirm(isRTL ? "هل أنت متأكد؟" : "Are you sure?")) {
      router.delete(route("admin.field-supervisors.destroy", id));
    }
  };

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

  const statusLabel = (isActive: boolean) =>
    isActive
      ? isRTL ? "نشط" : "Active"
      : isRTL ? "غير نشط" : "Inactive";

  // ── Columns for BaseDataTable ──
  const columnHelper = createColumnHelper<FieldSupervisor>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: isRTL ? "المشرف الميداني" : "Field Supervisor",
        cell: (info) => {
          const sup = info.row.original;
          return (
            <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm overflow-hidden ring-2 ring-offset-1 ring-brand-dark/10">
                {sup.image
                  ? <img src={`/storage/${sup.image}`} alt={sup.name} className="w-full h-full object-cover" />
                  : sup.name.charAt(0)}
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{sup.name}</div>
                {sup.name_en && <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{sup.name_en}</div>}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("national_id", {
        header: isRTL ? "الهوية / الكود" : "ID / Code",
        cell: (info) => {
          const sup = info.row.original;
          return (
            <div className={isRTL ? "text-right" : "text-left"}>
              <div className={`text-sm font-mono font-medium ${isDark ? "text-gray-300" : "text-gray-800"}`}>{sup.national_id || "—"}</div>
              <div className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{sup.user_code}</div>
            </div>
          );
        },
      }),
      columnHelper.accessor("phone", {
        header: isRTL ? "بيانات الاتصال" : "Contact",
        cell: (info) => {
          const sup = info.row.original;
          return (
            <div className={isRTL ? "text-right" : "text-left"}>
              <div className={`text-sm font-mono ${isDark ? "text-gray-300" : "text-gray-800"}`}>{sup.phone}</div>
              <div className={`text-xs truncate max-w-[160px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>{sup.email}</div>
            </div>
          );
        },
      }),
      columnHelper.accessor("is_active", {
        header: isRTL ? "الحالة" : "Status",
        cell: (info) => {
          const isActive = info.getValue();
          return (
            <StatusBadge
              label={statusLabel(isActive)}
              variant={isActive ? "green" : "red"}
            />
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
          const sup = info.row.original;
          return (
            <div className={`flex gap-2 ${isRTL ? "justify-start" : "justify-end"}`}>
              <ActionButton label={isRTL ? "تعديل" : "Edit"} onClick={() => openEditModal(sup)} color="indigo" />
              <ActionButton label={isRTL ? "حذف" : "Delete"} onClick={() => deleteSupervisor(sup.id)} color="red" />
            </div>
          );
        },
      }),
    ],
    [isRTL, isDark]
  );

  const filterTabs: FilterTab[] = [
    { key: "all", label: isRTL ? "الكل" : "All", count: counts.all },
    { key: "active", label: isRTL ? "نشط" : "Active", count: counts.active, dotColor: "bg-emerald-400" },
    { key: "inactive", label: isRTL ? "غير نشط" : "Inactive", count: counts.inactive, dotColor: "bg-rose-400" },
  ];


  return (
    <AuthenticatedLayout
      header={<h2 className={`font-bold text-xl ${isDark ? "text-gray-200" : "text-gray-800"}`}>{isRTL ? "إدارة المشرفين الميدانيين" : "Field Supervisors Management"}</h2>}
    >
      <Head title={isRTL ? "المشرفين الميدانيين" : "Field Supervisors"} />

      <div className={`pb-8 space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>

        {/* Stats Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: isRTL ? "إجمالي" : "Total", value: counts.all, icon: <Users className="w-5 h-5" />, color: "blue" as const },
            { label: isRTL ? "نشط" : "Active", value: counts.active, icon: <CheckCircle2 className="w-5 h-5" />, color: "green" as const },
            { label: isRTL ? "غير نشط" : "Inactive", value: counts.inactive, icon: <XCircle className="w-5 h-5" />, color: "red" as const },
          ].map((stat, i) => (
            <FSStatCard key={i} {...stat} isDark={isDark} isRTL={isRTL} />
          ))}
        </motion.div>

        {/* Main Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <BaseDataTable<FieldSupervisor>
            columns={columns}
            data={filtered}
            title={isRTL ? "المشرفون الميدانيون" : "Field Supervisors"}
/*             subtitle={
              isRTL
                ? `${counts.all} مشرف — ${counts.active} نشط — ${counts.inactive} غير نشط`
                : `${counts.all} total — ${counts.active} active — ${counts.inactive} inactive`
            } */
            headerAction={
              <PrimaryButton onClick={openAddModal} className="bg-brand-yellow text-brand-dark hover:bg-yellow-500">
                {isRTL ? "+ إضافة مشرف ميداني" : "+ Add Field Supervisor"}
              </PrimaryButton>
            }
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={isRTL ? "بحث بالاسم، الهوية، الجوال..." : "Search name, ID, phone..."}
            filterTabs={filterTabs}
            activeFilter={filter}
            onFilterChange={(key) => setFilter(key as FilterType)}
            emptyMessage={isRTL ? "لا يوجد مشرفون ميدانيون" : "No Field Supervisors Yet"}
            emptyDescription={
              isRTL
                ? "لم يتم تسجيل أي مشرف ميداني بعد."
                : "No field supervisors registered yet."
            }
            emptyIcon={<MapPin className="w-10 h-10" />}
            emptyAction={
              filter === "all"
                ? { label: isRTL ? "+ إضافة مشرف" : "+ Add Supervisor", onClick: openAddModal }
                : undefined
            }
          />
        </motion.div>
      </div>

      <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
        <div className={`relative ${isDark ? "bg-gray-900 border border-gray-700" : "bg-white"} rounded-2xl overflow-hidden shadow-2xl`}>
          <button type="button" onClick={closeModal} className={`absolute top-6 ${isRTL ? "left-6" : "right-6"} p-2 rounded-full hover:bg-gray-100 transition-colors ${isDark ? "hover:bg-gray-800 text-gray-400" : "text-gray-500"}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className={`px-8 pt-8 pb-6 border-b ${isDark ? "border-gray-800" : "border-gray-100"}`}>
            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-brand-navy"}`}>
              {isEditing ? (isRTL ? "تعديل بيانات المشرف الميداني" : "Edit Field Supervisor") : (isRTL ? "تسجيل مشرف ميداني جديد" : "New Field Supervisor")}
            </h2>
            <div className="mt-6 relative flex items-center justify-between px-10">
              <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full z-0"></div>
              <div className="absolute left-10 top-1/2 -translate-y-1/2 h-1 bg-brand-yellow rounded-full z-0 transition-all duration-300" style={{ width: currentStep === 1 ? '0%' : '100%' }}></div>
              <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow z-10 ${currentStep >= 1 ? 'bg-brand-yellow text-brand-dark' : 'bg-gray-200 text-gray-500'}`}>1</div>
              <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow z-10 ${currentStep >= 2 ? 'bg-brand-yellow text-brand-dark' : 'bg-gray-200 text-gray-500'}`}>2</div>
            </div>
            <div className="flex justify-between px-4 mt-2 text-xs font-bold text-gray-500">
              <span>{isRTL ? 'البيانات الشخصية' : 'Personal Details'}</span>
              <span>{isRTL ? 'بيانات الاتصال' : 'Contact Details'}</span>
            </div>
          </div>

          <form onSubmit={submit} className="flex flex-col">
            <div className="p-8 space-y-8">
              {currentStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className={`flex items-start gap-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className="relative w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0 overflow-visible">
                      <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50">
                        {data.image ? <img src={URL.createObjectURL(data.image)} alt="Preview" className="w-full h-full object-cover" /> : previewImage ? <img src={previewImage} alt="Current" className="w-full h-full object-cover" /> : <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>}
                      </div>
                    </div>
                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                      <h4 className={`font-bold ${isDark ? "text-gray-200" : "text-gray-800"}`}>{isRTL ? "صورة الملف الشخصي" : "Profile Image"}</h4>
                      <div className={`flex gap-3 mt-3 ${isRTL ? "flex-row-reverse justify-end" : ""}`}>
                        <label className={`cursor-pointer px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isDark ? "bg-brand-navy border border-gray-600 text-white hover:bg-gray-800" : "bg-brand-navy text-white hover:bg-opacity-90"}`}>
                          {isRTL ? "رفع صورة" : "Upload Photo"}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} />
                        </label>
                      </div>
                      <InputError message={errors.image} className="mt-2" />
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-bold border-b pb-2 mb-4 ${isDark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"} ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الاسم بناءً على الهوية (عربي)" : "Name as per ID (Arabic)"}</h4>
                    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${isRTL ? "rtl" : "ltr"}`}>
                      {[
                        { key: 'first_name_ar', label: isRTL ? 'الاسم الأول' : 'First Name' },
                        { key: 'second_name_ar', label: isRTL ? 'اسم الأب' : 'Second Name' },
                        { key: 'third_name_ar', label: isRTL ? 'اسم الجد' : 'Third Name' },
                        { key: 'last_name_ar', label: isRTL ? 'الاسم الأخير' : 'Last Name' },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{field.label}</label>
                          <input type="text" value={(data as any)[field.key]} onChange={e => setData(field.key as any, e.target.value)} dir="rtl" required={field.key === 'first_name_ar' || field.key === 'last_name_ar'}
                            className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                          <InputError message={(errors as any)[field.key]} className="mt-1" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-bold border-b pb-2 mb-4 ${isDark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"} ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الاسم بناءً على الهوية (إنجليزي)" : "Name as per ID (English)"}</h4>
                    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${isRTL ? "rtl" : "ltr"}`}>
                      {[
                        { key: 'first_name_en', label: isRTL ? 'الاسم الأول' : 'First Name' },
                        { key: 'second_name_en', label: isRTL ? 'اسم الأب' : 'Second Name' },
                        { key: 'third_name_en', label: isRTL ? 'اسم الجد' : 'Third Name' },
                        { key: 'last_name_en', label: isRTL ? 'الاسم الأخير' : 'Last Name' },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{field.label}</label>
                          <input type="text" value={(data as any)[field.key]} onChange={e => setData(field.key as any, e.target.value)} dir="ltr"
                            className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                          <InputError message={(errors as any)[field.key]} className="mt-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 ${isRTL ? "rtl" : "ltr"}`}>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "رقم الهوية / الإقامة" : "National ID / Resident ID"}</label>
                      <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value)} dir="ltr" required
                        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all font-mono ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                      <InputError message={errors.national_id} className="mt-1" />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "رقم الجوال" : "Phone Number"}</label>
                      <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value)} dir="ltr" placeholder="5X XXX XXXX" required
                        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all font-mono ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                      <InputError message={errors.phone} className="mt-1" />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "البريد الإلكتروني" : "Email Address"}</label>
                      <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} dir="ltr" required
                        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                      <InputError message={errors.email} className="mt-1" />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "الحالة" : "Status"}</label>
                      <select value={data.status} onChange={e => setData("status", e.target.value)} required
                        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`}>
                        <option value="Active">{isRTL ? "نشط" : "Active"}</option>
                        <option value="Inactive">{isRTL ? "غير نشط" : "Inactive"}</option>
                      </select>
                      <InputError message={errors.status} className="mt-1" />
                    </div>
                    <div className="md:col-span-2">
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "العنوان" : "Address"}</label>
                      <input type="text" value={data.address} onChange={e => setData("address", e.target.value)}
                        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                      <InputError message={errors.address} className="mt-1" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`px-8 py-5 border-t flex justify-between items-center ${isDark ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
              {currentStep === 1 ? (
                <button type="button" onClick={closeModal} className={`text-sm font-semibold transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}>{isRTL ? "إلغاء" : "Cancel"}</button>
              ) : (
                <button type="button" onClick={() => setCurrentStep(1)} className={`text-sm font-semibold transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}>{isRTL ? "السابق" : "Previous"}</button>
              )}
              <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                {currentStep === 1 ? (
                  <button type="button" onClick={(e) => { e.preventDefault(); setCurrentStep(2); }} className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-opacity ${isDark ? "bg-brand-navy text-white hover:opacity-90" : "bg-brand-navy text-white hover:opacity-90"}`}>
                    {isRTL ? "التالي" : "Next"}
                  </button>
                ) : (
                  <button type="submit" disabled={processing} className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-opacity disabled:opacity-50 ${isDark ? "bg-brand-yellow text-brand-dark hover:opacity-90" : "bg-brand-yellow text-brand-dark hover:opacity-90"}`}>
                    {isEditing ? (isRTL ? "حفظ التعديلات" : "Save Changes") : (isRTL ? "إضافة المشرف الميداني" : "Add Field Supervisor")}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}

// ─── FSStatCard ───────────────────────────────────────

const fsStatColors = {
  blue: { bg: "bg-blue-50 dark:bg-blue-900/20", icon: "text-blue-500", border: "border-blue-100 dark:border-blue-900/30" },
  green: { bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "text-emerald-500", border: "border-emerald-100 dark:border-emerald-900/30" },
  red: { bg: "bg-rose-50 dark:bg-rose-900/20", icon: "text-rose-500", border: "border-rose-100 dark:border-rose-900/30" },
};

function FSStatCard({ label, value, icon, color, isDark, isRTL }: {
  label: string; value: number; icon: React.ReactNode;
  color: keyof typeof fsStatColors; isDark: boolean; isRTL: boolean;
}) {
  const scheme = fsStatColors[color];
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
        isDark ? "bg-gray-800/80 border-gray-700 hover:bg-gray-800" : `bg-white ${scheme.border} hover:shadow-md shadow-sm`
      } ${isRTL ? "flex-row-reverse" : ""}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isDark ? "bg-gray-700" : scheme.bg
      }`}><span className={scheme.icon}>{icon}</span></div>
      <div className={isRTL ? "text-right" : "text-left"}>
        <p className={`text-[11px] font-bold uppercase tracking-wide ${
          isDark ? "text-gray-500" : "text-gray-400"
        }`}>{label}</p>
        <p className={`text-2xl font-black mt-0.5 ${
          isDark ? "text-white" : "text-gray-900"
        }`}>{value}</p>
      </div>
    </motion.div>
  );
}
