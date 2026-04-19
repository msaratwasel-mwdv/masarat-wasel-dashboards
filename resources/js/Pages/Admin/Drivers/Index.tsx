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
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  CheckCircle2,
  Bus as BusIcon,
  UserCheck,
  Eye,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
} from "lucide-react";

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
  address: string | null;
  driver: {
    license_number: string;
    license_expiry_date: string;
    status: string;
    license_front_image: string | null;
    license_back_image: string | null;
  } | null;
  image?: string | null;
  license_front_image?: string | null; // From Controller flat mapping if used
  license_back_image?: string | null; // From Controller flat mapping if used
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
  const [previewLicenseFront, setPreviewLicenseFront] = useState<string | null>(null);
  const [previewLicenseBack, setPreviewLicenseBack] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // --- Form ---
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    _method: "post" as "post" | "put",
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
    address: "",
    image: null as File | null,
    license_front_image: null as File | null,
    license_back_image: null as File | null,
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
    setPreviewLicenseFront(null);
    setPreviewLicenseBack(null);
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
    setPreviewLicenseFront(driver.license_front_image ? `/storage/${driver.license_front_image}` : null);
    setPreviewLicenseBack(driver.license_back_image ? `/storage/${driver.license_back_image}` : null);
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
      license_number: driver.driver?.license_number || "",
      license_expiry_date: driver.driver?.license_expiry_date || "",
      address: driver.address || "",
      image: null,
      license_front_image: null,
      license_back_image: null,
    });
    clearErrors();
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const openDetailsModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null);
    setPreviewLicenseFront(null);
    setPreviewLicenseBack(null);
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
      columnHelper.accessor("driver.license_number", {
        header: isRTL ? "الرخصة" : "License",
        cell: (info) => {
          const driver = info.row.original;
          const licExpired = IS_EXPIRED(driver.driver?.license_expiry_date);
          return (
            <div className={isRTL ? "text-right" : "text-left"}>
              <div className={`text-sm font-mono ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                {driver.driver?.license_number || "—"}
              </div>
              <div className={`text-xs font-medium ${licExpired ? "text-red-500" : (isDark ? "text-gray-500" : "text-gray-400")}`}>
                {driver.driver?.license_expiry_date
                  ? (licExpired ? "⚠ " : "") + (isRTL ? "ينتهي: " : "Exp: ") + driver.driver.license_expiry_date
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
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
          const driver = info.row.original;
          return (
            <div className={`flex gap-2 column-actions ${isRTL ? "justify-start" : "justify-end"}`}>
              <ActionButton
                label={isRTL ? "عرض" : "Show"}
                onClick={() => openDetailsModal(driver)}
                color="blue"
              />
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

      <div className={`pb-8 space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>

        {/* Stats Header */}
        <motion.div
           layout
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { label: isRTL ? "إجمالي السائقين" : "Total Drivers", value: counts.all, icon: <Users className="w-5 h-5" />, color: "blue" as const },
            { label: isRTL ? "متاح" : "Available", value: counts.available, icon: <CheckCircle2 className="w-5 h-5" />, color: "green" as const },
            { label: isRTL ? "معين" : "Assigned", value: counts.assigned, icon: <BusIcon className="w-5 h-5" />, color: "orange" as const },
          ].map((stat, i) => (
            <PersonStatCard key={i} {...stat} isDark={isDark} isRTL={isRTL} />
          ))}
        </motion.div>

        {/* Main Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <BaseDataTable<Driver>
            columns={columns}
            data={drivers.data}
            pagination={pagination}
            title={isRTL ? "سائقو الأسطول" : "Fleet Drivers"}
            headerAction={headerAction}
            exportEnabled={true}
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder={isRTL ? "بحث بالاسم، الهوية، الجوال..." : "Search name, ID, phone..."}
            filterTabs={filterTabs}
            activeFilter={filters.status}
            onFilterChange={handleFilterChange}
            emptyMessage={isRTL ? "لا يوجد سائقون" : "No Drivers Yet"}
            emptyIcon={<UserCheck className="w-10 h-10" />}
          />

          {/* Details Modal */}
          <AnimatePresence>
            {showDetailsModal && selectedDriver && (
              <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="3xl">
                <div className={`relative ${isDark ? "bg-gray-900" : "bg-white"} rounded-3xl overflow-hidden shadow-2xl p-0`}>
                  {/* Backdrop Header */}
                  <div className="h-32 bg-gradient-to-r from-brand-navy to-brand-dark flex items-end px-8 pb-4 relative">
                    <button onClick={() => setShowDetailsModal(false)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"><X size={20}/></button>
                    <div className="absolute -bottom-12 left-8 w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-900 bg-gray-100 overflow-hidden shadow-lg">
                       {selectedDriver.image ? <img src={`/storage/${selectedDriver.image}`} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-brand-dark bg-yellow-50">{selectedDriver.name.charAt(0)}</div>}
                    </div>
                  </div>

                  <div className="pt-16 px-8 pb-8">
                     <div className="flex justify-between items-start">
                        <div>
                           <h2 className={`text-2xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>{selectedDriver.name}</h2>
                           <p className="text-brand-navy font-bold">{selectedDriver.name_en || ""}</p>
                           <div className="flex gap-2 mt-2">
                              <StatusBadge status={selectedDriver.driver?.status === 'active' ? 'active' : 'inactive'} />
                              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"}`}>{selectedDriver.user_code}</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRTL ? 'تاريخ التسجيل' : 'Registration Date'}</p>
                           <p className={`text-sm font-bold ${isDark ? "text-gray-200" : "text-gray-900"}`}>{new Date().toLocaleDateString()}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                        {/* Personal Info */}
                        <div className="space-y-4">
                           <h3 className="text-sm font-black text-brand-navy border-b pb-2 mb-4 flex items-center gap-2 uppercase tracking-wider underline decoration-brand-yellow decoration-4 underline-offset-4">
                              {isRTL ? 'معلومات الشخصية' : 'Personal Info'}
                           </h3>
                           <InfoRow icon={<CreditCard size={16}/>} label={isRTL ? "رقم الهوية" : "National ID"} value={selectedDriver.national_id} isDark={isDark}/>
                           <InfoRow icon={<Phone size={16}/>} label={isRTL ? "رقم الجوال" : "Phone"} value={selectedDriver.phone} isDark={isDark}/>
                           <InfoRow icon={<Mail size={16}/>} label={isRTL ? "البريد الإلكتروني" : "Email"} value={selectedDriver.email} isDark={isDark}/>
                           <InfoRow icon={<MapPin size={16}/>} label={isRTL ? "العنوان" : "Address"} value={selectedDriver.address || "—"} isDark={isDark}/>
                        </div>

                        {/* Professional Info */}
                        <div className="space-y-4">
                           <h3 className="text-sm font-black text-brand-navy border-b pb-2 mb-4 flex items-center gap-2 uppercase tracking-wider underline decoration-brand-yellow decoration-4 underline-offset-4">
                              {isRTL ? 'بيانات العمل' : 'Professional Info'}
                           </h3>
                           <InfoRow icon={<CreditCard size={16}/>} label={isRTL ? "رقم الرخصة" : "License Number"} value={selectedDriver.driver?.license_number || "—"} isDark={isDark}/>
                           <InfoRow icon={<Calendar size={16}/>} label={isRTL ? "انتهاء الرخصة" : "License Expiry"} value={selectedDriver.driver?.license_expiry_date || "—"} isDark={isDark} highlight={IS_EXPIRED(selectedDriver.driver?.license_expiry_date)}/>
                           <InfoRow icon={<BusIcon size={16}/>} label={isRTL ? "الحافلة المعينة" : "Assigned Bus"} value={selectedDriver.assigned_bus?.bus_number || (isRTL ? "غير محدد" : "Unassigned")} isDark={isDark}/>
                        </div>
                     </div>

                     {/* Documents Visualization */}
                     <div className="mt-12">
                        <h3 className="text-sm font-black text-brand-navy border-b pb-4 mb-6 flex items-center gap-2 uppercase tracking-wider underline decoration-brand-yellow decoration-4 underline-offset-4">
                           {isRTL ? 'المستندات والصور' : 'Documents & Photos'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                           <MediaCard label={isRTL ? "صورة السائق" : "Driver Photo"} src={selectedDriver.image} isDark={isDark} isRTL={isRTL}/>
                           <MediaCard label={isRTL ? "الرخصة (أمام)" : "License (Front)"} src={selectedDriver.license_front_image || selectedDriver.driver?.license_front_image} isDark={isDark} isRTL={isRTL}/>
                           <MediaCard label={isRTL ? "الرخصة (خلف)" : "License (Back)"} src={selectedDriver.license_back_image || selectedDriver.driver?.license_back_image} isDark={isDark} isRTL={isRTL}/>
                        </div>
                     </div>
                  </div>
                </div>
              </Modal>
            )}
          </AnimatePresence>

          {/* Add/Edit Modal */}
          <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
            <div className={`relative ${isDark ? "bg-gray-900 border border-gray-700" : "bg-white"} rounded-2xl overflow-hidden shadow-2xl`}>
              {/* Close Button */}
              <button
                type="button"
                onClick={closeModal}
                className={`absolute top-6 ${isRTL ? "left-6" : "right-6"} p-2 rounded-full hover:bg-gray-100 transition-colors ${isDark ? "hover:bg-gray-800 text-gray-400" : "text-gray-500"}`}
              >
                <X size={20}/>
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
                              <Users className="w-10 h-10 text-gray-300" />
                            )}
                          </div>
                        </div>

                        <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                          <h4 className={`font-bold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                            {isRTL ? "صورة السائق (أمامي)" : "Driver Photo (Front)"}
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
                                className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
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
                                className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow" : "bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-navy"}`} />
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

                        {/* License Front Image */}
                        <div>
                           <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "صورة الرخصة (أمامي)" : "License Front Image"}</label>
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-12 bg-gray-50 border rounded-lg overflow-hidden flex items-center justify-center">
                                 {data.license_front_image ? <img src={URL.createObjectURL(data.license_front_image)} className="w-full h-full object-cover"/> : (previewLicenseFront ? <img src={previewLicenseFront} className="w-full h-full object-cover"/> : <CreditCard size={20} className="text-gray-300"/>)}
                              </div>
                              <label className="cursor-pointer text-xs font-bold text-brand-navy underline">{isRTL ? 'اختيار' : 'Choose'}<input type="file" className="hidden" accept="image/*" onChange={(e) => setData("license_front_image", e.target.files?.[0] || null)}/></label>
                           </div>
                        </div>

                        {/* License Back Image */}
                        <div>
                           <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{isRTL ? "صورة الرخصة (خلفي)" : "License Back Image"}</label>
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-12 bg-gray-50 border rounded-lg overflow-hidden flex items-center justify-center">
                                 {data.license_back_image ? <img src={URL.createObjectURL(data.license_back_image)} className="w-full h-full object-cover"/> : (previewLicenseBack ? <img src={previewLicenseBack} className="w-full h-full object-cover"/> : <CreditCard size={20} className="text-gray-300"/>)}
                              </div>
                              <label className="cursor-pointer text-xs font-bold text-brand-navy underline">{isRTL ? 'اختيار' : 'Choose'}<input type="file" className="hidden" accept="image/*" onChange={(e) => setData("license_back_image", e.target.files?.[0] || null)}/></label>
                           </div>
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
                      <button type="button" onClick={(e) => { e.preventDefault(); setCurrentStep(2); }} className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-opacity bg-brand-navy text-white hover:opacity-90`}>
                        {isRTL ? "التالي" : "Next"}
                      </button>
                    ) : (
                      <button type="submit" disabled={processing} className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-opacity disabled:opacity-50 bg-brand-yellow text-brand-dark hover:opacity-90`}>
                        {isEditing ? (isRTL ? "حفظ التعديلات" : "Save Changes") : (isRTL ? "إضافة السائق" : "Add Driver")}
                      </button>
                    )}
                  </div>
                </div>
              </form>

            </div>
          </Modal>
        </motion.div>
      </div>
    </AuthenticatedLayout>
  );
}

// ─── Sub-Components ───────────────────────────────────────

function InfoRow({ icon, label, value, isDark, highlight = false }: any) {
   return (
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${isDark ? "bg-gray-800 text-gray-500" : "bg-gray-50 text-brand-navy"}`}>{icon}</div>
            <span className={`text-xs font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>{label}</span>
         </div>
         <span className={`text-sm font-bold ${highlight ? "text-red-500" : (isDark ? "text-gray-200" : "text-gray-900")}`}>{value}</span>
      </div>
   );
}

function MediaCard({ label, src, isDark, isRTL }: any) {
   return (
      <div className={`flex flex-col gap-2 ${isRTL ? "text-right" : "text-left"}`}>
         <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}>{label}</span>
         <div className={`aspect-[4/3] rounded-2xl overflow-hidden border-2 ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-50"}`}>
            {src ? (
               <a href={`/storage/${src}`} target="_blank" rel="noreferrer" className="w-full h-full block">
                  <img src={`/storage/${src}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"/>
               </a>
            ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-300 italic text-xs">No Image</div>
            )}
         </div>
      </div>
   );
}

function PersonStatCard({
  label, value, icon, color, isDark, isRTL,
}: {
  label: string; value: number; icon: React.ReactNode;
  color: keyof typeof personStatColorMap; isDark: boolean; isRTL: boolean;
}) {
  const scheme = personStatColorMap[color as keyof typeof personStatColorMap];
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
        isDark
          ? "bg-gray-800/80 border-gray-700 hover:bg-gray-800"
          : `bg-white ${scheme.border} hover:shadow-md shadow-sm`
      } ${isRTL ? "flex-row-reverse" : ""}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isDark ? "bg-gray-700" : scheme.bg
      }`}>
        <span className={scheme.icon}>{icon}</span>
      </div>
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

const personStatColorMap = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "text-blue-500",
    border: "border-blue-100 dark:border-blue-900/30",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    icon: "text-emerald-500",
    border: "border-emerald-100 dark:border-emerald-900/30",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    icon: "text-orange-500",
    border: "border-orange-100 dark:border-orange-900/30",
  },
};
