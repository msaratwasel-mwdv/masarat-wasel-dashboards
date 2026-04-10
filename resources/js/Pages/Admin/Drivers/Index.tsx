import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, {
  ActionButton,
  StatusBadge,
  type FilterTab,
  type PaginationMeta,
} from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";

// ─── Types ───────────────────────────────────────────────────────

interface AssignedBus {
  id: number;
  bus_number: string;
  school: { id: number; name: string } | null;
}

interface Driver {
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
  email: string;
  phone: string;
  national_id: string;
  user_code: string;
  school_id: number | null;
  driver_profile: {
    license_number: string;
    license_expiry_date: string;
    status: string;
  } | null;
  image?: string | null;
  assigned_bus: AssignedBus | null;
}

interface Props {
  drivers: {
    data: Driver[];
    links: PaginationMeta["links"];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  counts: {
    all: number;
    assigned: number;
    available: number;
  };
  filters: {
    search: string;
    status: string;
  };
}

// ─── Component ───────────────────────────────────────────────────

export default function DriversIndex({ drivers, counts, filters }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  // --- State ---
  const [search, setSearch] = useState(filters.search);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDriverId, setCurrentDriverId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // --- Form ---
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
    license_number: "",
    license_expiry_date: "",
    image: null as File | null,
  });

  // --- Handlers ---
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.get(
          route("admin.drivers.index"),
          { search: value, status: filters.status === "all" ? undefined : filters.status },
          { preserveState: true, replace: true }
        );
      }, 300),
    [filters.status]
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (key: string) => {
    router.get(
      route("admin.drivers.index"),
      { search: filters.search, status: key === "all" ? undefined : key },
      { preserveState: true, replace: true }
    );
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentDriverId(null);
    setPreviewImage(null);
    reset();
    setData("_method", "post");
    clearErrors();
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setIsEditing(true);
    setCurrentDriverId(driver.id);
    setPreviewImage(driver.image ? `/storage/${driver.image}` : null);
    setData({
      _method: "put",
      first_name_ar: driver.first_name_ar || "",
      second_name_ar: driver.second_name_ar || "",
      third_name_ar: driver.third_name_ar || "",
      last_name_ar: driver.last_name_ar || "",
      first_name_en: driver.first_name_en || "",
      second_name_en: driver.second_name_en || "",
      third_name_en: driver.third_name_en || "",
      last_name_en: driver.last_name_en || "",
      national_id: driver.national_id || "",
      email: driver.email || "",
      phone: driver.phone || "",
      license_number: driver.driver_profile?.license_number || "",
      license_expiry_date: driver.driver_profile?.license_expiry_date || "",
      image: null,
    });
    clearErrors();
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentDriverId) {
      post(route("admin.drivers.update", currentDriverId), {
        forceFormData: true,
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("admin.drivers.store"), {
        onSuccess: () => closeModal(),
      });
    }
  };

  const deleteDriver = (driverId: number) => {
    if (confirm(isRTL ? "هل أنت متأكد من حذف هذا السائق؟" : "Are you sure?")) {
      router.delete(route("admin.drivers.destroy", driverId));
    }
  };

  // --- Helpers ---
  const IS_EXPIRED = (date: string | undefined | null) => date && new Date(date) < new Date();

  // --- Filter Tabs ---
  const filterTabs: FilterTab[] = [
    { key: "all", label: isRTL ? "الكل" : "All", count: counts.all },
    { key: "available", label: isRTL ? "متاح" : "Available", count: counts.available, dotColor: "bg-green-400" },
    { key: "assigned", label: isRTL ? "محجوز" : "Assigned", count: counts.assigned, dotColor: "bg-orange-400" },
  ];

  // --- Columns ---
  const columnHelper = createColumnHelper<Driver>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: isRTL ? "السائق" : "Driver",
        cell: (info) => {
          const driver = info.row.original;
          return (
            <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold text-sm overflow-hidden ring-2 ring-offset-1 ring-brand-dark/10">
                {driver.image ? (
                  <img src={`/storage/${driver.image}`} alt={driver.name} className="w-full h-full object-cover" />
                ) : (
                  driver.name.charAt(0)
                )}
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {driver.name}
                </div>
                {driver.name_en && (
                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {driver.name_en}
                  </div>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("national_id", {
        header: isRTL ? "الهوية / الكود" : "ID / Code",
        cell: (info) => {
          const driver = info.row.original;
          return (
            <div className={isRTL ? "text-right" : "text-left"}>
              <div className={`text-sm font-mono font-medium ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                {driver.national_id || "—"}
              </div>
              <div className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {driver.user_code}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("phone", {
        header: isRTL ? "الاتصال" : "Contact",
        cell: (info) => {
          const driver = info.row.original;
          return (
            <div className={isRTL ? "text-right" : "text-left"}>
              <div className={`text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                {driver.phone}
              </div>
              <div className={`text-xs truncate max-w-[160px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {driver.email}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("driver_profile.license_number", {
        header: isRTL ? "الرخصة" : "License",
        cell: (info) => {
          const driver = info.row.original;
          const licExpired = IS_EXPIRED(driver.driver_profile?.license_expiry_date);
          return (
            <div className={isRTL ? "text-right" : "text-left"}>
              <div className={`text-sm font-mono ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                {driver.driver_profile?.license_number || "—"}
              </div>
              <div className={`text-xs font-medium ${licExpired ? "text-red-500" : (isDark ? "text-gray-500" : "text-gray-400")}`}>
                {driver.driver_profile?.license_expiry_date
                  ? (licExpired ? "⚠ " : "") + (isRTL ? "ينتهي: " : "Exp: ") + driver.driver_profile.license_expiry_date
                  : "—"}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("assigned_bus", {
        header: isRTL ? "الباص المُعيَّن" : "Assigned Bus",
        cell: (info) => {
          const bus = info.getValue() as AssignedBus | null;
          return bus ? (
            <div className={isRTL ? "text-right" : "text-left"}>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isDark ? "bg-orange-900/30 text-orange-300 border border-orange-700" : "bg-orange-100 text-orange-700 border border-orange-200"}`}>
                🚌 {bus.bus_number}
              </span>
              {bus.school && (
                <div className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  🏫 {bus.school.name}
                </div>
              )}
            </div>
          ) : (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? "bg-green-900/20 text-green-400 border border-green-800" : "bg-green-50 text-green-700 border border-green-200"}`}>
              {isRTL ? "متاح" : "Available"}
            </span>
          );
        },
      }),
      columnHelper.accessor("driver_profile.status", {
        header: isRTL ? "الحالة" : "Status",
        cell: (info) => {
          const status = info.getValue();
          const isActive = status === "Active";
          return (
            <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${isActive ? (isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-800") : (isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-800")}`}>
              {isRTL ? (isActive ? "نشط" : (status || "غير محدد")) : (status || "N/A")}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
          const driver = info.row.original;
          return (
            <div className={`flex gap-2 column-actions ${isRTL ? "justify-start" : "justify-end"}`}>
              <ActionButton
                label={isRTL ? "تعديل" : "Edit"}
                onClick={() => openEditModal(driver)}
                color="indigo"
              />
              <ActionButton
                label={isRTL ? "حذف" : "Delete"}
                onClick={() => deleteDriver(driver.id)}
                color="red"
              />
            </div>
          );
        },
      }),
    ],
    [isRTL, isDark, openEditModal]
  );

  // --- Pagination metadata ---
  const pagination: PaginationMeta = {
    links: drivers.links,
    current_page: drivers.current_page,
    last_page: drivers.last_page,
    per_page: drivers.per_page,
    total: drivers.total,
    from: drivers.from,
    to: drivers.to,
  };

  const headerAction = (
    <PrimaryButton
      onClick={openAddModal}
      className="bg-brand-yellow text-brand-dark hover:bg-yellow-500"
    >
      {isRTL ? "+ إضافة سائق جديد" : "+ Add New Driver"}
    </PrimaryButton>
  );

  return (
    <AuthenticatedLayout
      header={
        <h2 className={`font-bold text-xl ${isDark ? "text-gray-200" : "text-gray-800"}`}>
          {isRTL ? "إدارة السائقين" : "Drivers Management"}
        </h2>
      }
    >
      <Head title={isRTL ? "السائقين" : "Drivers"} />

      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <BaseDataTable<Driver>
            columns={columns}
            data={drivers.data}
            pagination={pagination}
            title={isRTL ? "سائقو الأسطول" : "Fleet Drivers"}
            subtitle={
              isRTL
                ? `${counts.all} سائق — ${counts.assigned} محجوز — ${counts.available} متاح`
                : `${counts.all} total — ${counts.assigned} assigned — ${counts.available} available`
            }
            headerAction={headerAction}
            exportEnabled={true}
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder={isRTL ? "بحث بالاسم، الهوية، الجوال..." : "Search name, ID, phone..."}
            filterTabs={filterTabs}
            activeFilter={filters.status}
            onFilterChange={handleFilterChange}
            emptyMessage={isRTL ? "لا يوجد سائقين مطابَقين." : "No drivers found."}
          />

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
                  {isEditing ? (isRTL ? "تعديل بيانات السائق" : "Edit Driver Details") : (isRTL ? "تسجيل بيانات سائق جديد" : "Register New Driver")}
                </h2>

                {/* Stepper */}
                <div className="mt-6 relative flex items-center justify-between px-10">
                  <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full z-0"></div>
                  <div className="absolute left-10 top-1/2 -translate-y-1/2 h-1 bg-brand-yellow rounded-full z-0 transition-all duration-300" style={{ width: currentStep === 1 ? '0%' : '100%' }}></div>
                  <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow z-10 ${currentStep >= 1 ? 'bg-brand-yellow text-brand-dark' : 'bg-gray-200 text-gray-500'}`}>1</div>
                  <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow z-10 ${currentStep >= 2 ? 'bg-brand-yellow text-brand-dark' : 'bg-gray-200 text-gray-500'}`}>2</div>
                </div>
                <div className="flex justify-between px-4 mt-2 text-xs font-bold text-gray-500">
                  <span>{isRTL ? 'البيانات الشخصية' : 'Personal Details'}</span>
                  <span>{isRTL ? 'بيانات الاتصال والرخصة' : 'Contact & License'}</span>
                </div>
              </div>

              <form onSubmit={submit} className="flex flex-col">
                <div className="p-8 space-y-8">

                  {/* Step 1 */}
                  {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

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
                        </div>

                        <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                          <h4 className={`font-bold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                            {isRTL ? "صورة الملف الشخصي للسائق" : "Driver Profile Image"}
                          </h4>
                          <div className={`flex gap-3 mt-3 ${isRTL ? "flex-row-reverse justify-end" : ""}`}>
                            <label className={`cursor-pointer px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isDark ? "bg-brand-navy border border-gray-600 text-white hover:bg-gray-800" : "bg-brand-navy text-white hover:bg-opacity-90"}`}>
                              {isRTL ? "رفع صورة" : "Upload Photo"}
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} />
                            </label>
                          </div>
                          <InputError message={errors.image} className="mt-2" />
                        </div>
                      </div>

                      {/* AR Names Grid */}
                      <div>
                        <h4 className={`text-sm font-bold border-b pb-2 mb-4 ${isDark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"} ${isRTL ? "text-right" : "text-left"}`}>
                          {isRTL ? "الاسم (عربي)" : "Name (Arabic)"}
                        </h4>
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
                                className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy focus:border-transparent"}`} />
                              <InputError message={(errors as any)[field.key]} className="mt-1" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* EN Names Grid */}
                      <div>
                         <h4 className={`text-sm font-bold border-b pb-2 mb-4 ${isDark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"} ${isRTL ? "text-right" : "text-left"}`}>
                          {isRTL ? "الاسم بناءً على الهوية (إنجليزي)" : "Name as per ID (English)"}
                        </h4>
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
                                className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy focus:border-transparent"}`} />
                              <InputError message={(errors as any)[field.key]} className="mt-1" />
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Step 2 */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">

                      <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 ${isRTL ? "rtl" : "ltr"}`}>
                        {/* National ID */}
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "رقم الهوية / الإقامة" : "National ID / Resident ID"}</label>
                          <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value)} dir="ltr" required
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all font-mono ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                          <InputError message={errors.national_id} className="mt-1" />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "رقم الجوال" : "Phone Number"}</label>
                          <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value)} dir="ltr" placeholder="5X XXX XXXX" required
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all font-mono ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                          <InputError message={errors.phone} className="mt-1" />
                        </div>

                        {/* Email */}
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "البريد الإلكتروني" : "Email Address"}</label>
                          <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} dir="ltr"
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                          <InputError message={errors.email} className="mt-1" />
                        </div>

                        {/* License Number */}
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "رقم الرخصة" : "License Number"}</label>
                          <input type="text" value={data.license_number} onChange={e => setData("license_number", e.target.value)} dir="ltr" required
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all font-mono ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                          <InputError message={errors.license_number} className="mt-1" />
                        </div>

                        {/* License Expiry */}
                        <div>
                          <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "تاريخ انتهاء الرخصة" : "License Expiry Date"}</label>
                          <input type="date" value={data.license_expiry_date} onChange={e => setData("license_expiry_date", e.target.value)} dir="ltr" required
                            className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
                          <InputError message={errors.license_expiry_date} className="mt-1" />
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                {/* Footer Actions */}
                <div className={`px-8 py-5 border-t flex justify-between items-center ${isDark ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
                  {currentStep === 1 ? (
                    <button type="button" onClick={closeModal} className={`text-sm font-semibold transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}>
                      {isRTL ? "إلغاء" : "Cancel"}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setCurrentStep(1)} className={`text-sm font-semibold transition-colors ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}>
                      {isRTL ? "السابق" : "Previous"}
                    </button>
                  )}

                  <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                    {currentStep === 1 ? (
                      <button type="button" onClick={(e) => { e.preventDefault(); setCurrentStep(2); }} className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-opacity ${isDark ? "bg-brand-navy text-white hover:opacity-90" : "bg-brand-navy text-white hover:opacity-90"}`}>
                        {isRTL ? "التالي" : "Next"}
                      </button>
                    ) : (
                      <button type="submit" disabled={processing} className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-opacity disabled:opacity-50 ${isDark ? "bg-brand-yellow text-brand-dark hover:opacity-90" : "bg-brand-yellow text-brand-dark hover:opacity-90"}`}>
                        {isEditing ? (isRTL ? "حفظ التعديلات" : "Save Changes") : (isRTL ? "إضافة السائق" : "Add Driver")}
                      </button>
                    )}
                  </div>
                </div>
              </form>

            </div>
          </Modal>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
