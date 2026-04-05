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
  bus_code: string;
  school: { id: number; name: string } | null;
}

interface Driver {
  id: number;
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

  // --- Form ---
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    _method: "post",
    name: "",
    name_en: "",
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
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setIsEditing(true);
    setCurrentDriverId(driver.id);
    setPreviewImage(driver.image ? `/storage/${driver.image}` : null);
    setData({
      _method: "put",
      name: driver.name,
      name_en: driver.name_en || "",
      national_id: driver.national_id || "",
      email: driver.email,
      phone: driver.phone || "",
      license_number: driver.driver_profile?.license_number || "",
      license_expiry_date: driver.driver_profile?.license_expiry_date || "",
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
                🚌 {bus.bus_code}
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
                  {isEditing ? (isRTL ? "تعديل بيانات السائق" : "Edit Driver Details") : (isRTL ? "تسجيل ببيانات سائق جديد" : "Register New Driver")}
                </h2>
                <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {isRTL ? "أكمل التفاصيل التعريفية والمهنية أدناه" : "Complete the identification and professional details below"}
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
                        {isRTL ? "صورة الملف الشخصي للسائق" : "Driver Profile Image"}
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
                        id="email" type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} dir="ltr" placeholder="driver@fleet.com"
                        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy focus:border-transparent"}`} 
                      />
                      <InputError message={errors.email} className="mt-1" />
                    </div>

                    {/* License Number */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label htmlFor="license_number" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          {isRTL ? "رقم الرخصة" : "License Number"}
                        </label>
                      </div>
                      <input 
                        id="license_number" type="text" value={data.license_number} onChange={(e) => setData("license_number", e.target.value)} dir="ltr" placeholder="DL-XXXX"
                        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all font-mono ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy focus:border-transparent"}`} 
                      />
                      <InputError message={errors.license_number} className="mt-1" />
                    </div>

                    {/* License Expiry */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label htmlFor="license_expiry_date" className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          {isRTL ? "تاريخ انتهاء الرخصة" : "License Expiry Date"}
                        </label>
                      </div>
                      <input 
                        id="license_expiry_date" type="date" value={data.license_expiry_date} onChange={(e) => setData("license_expiry_date", e.target.value)} dir="ltr"
                        className={`w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy focus:border-transparent"}`} 
                      />
                      <InputError message={errors.license_expiry_date} className="mt-1" />
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
                      {isEditing ? (isRTL ? "حفظ التعديلات" : "Save Changes") : (isRTL ? "إضافة السائق" : "Add Driver")}
                    </button>
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
