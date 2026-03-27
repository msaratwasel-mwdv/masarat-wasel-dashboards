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
    reset();
    setData("_method", "post");
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setIsEditing(true);
    setCurrentDriverId(driver.id);
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

          {/* Modal */}
          <Modal show={isModalOpen} onClose={closeModal}>
            <div className={`p-6 ${isDark ? "bg-gray-800 text-gray-200" : "bg-white"}`}>
              <h2 className={`text-lg font-medium mb-4 ${isDark ? "text-white" : "text-gray-900"} ${isRTL ? "text-right" : ""}`}>
                {isEditing ? (isRTL ? "تعديل وبيانات السائق" : "Edit Driver Details") : (isRTL ? "تسجيل سائق جديد" : "Register New Driver")}
              </h2>
              <form onSubmit={submit} className="space-y-4">
                <div className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
                  <div className={isRTL ? "text-right" : ""}>
                    <InputLabel htmlFor="name" value={isRTL ? "الاسم الكامل (عربي)" : "Full Name (Arabic)"} />
                    <TextInput id="name" value={data.name} onChange={(e) => setData("name", e.target.value)} className="mt-1 block w-full" />
                    <InputError message={errors.name} className="mt-2" />
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <InputLabel htmlFor="name_en" value={isRTL ? "الاسم بالإنجليزية" : "English Name"} />
                    <TextInput id="name_en" value={data.name_en} onChange={(e) => setData("name_en", e.target.value)} className="mt-1 block w-full text-left" dir="ltr" />
                    <InputError message={errors.name_en} className="mt-2" />
                  </div>
                </div>
                <div className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
                  <div className={isRTL ? "text-right" : ""}>
                    <InputLabel htmlFor="national_id" value={isRTL ? "رقم الهوية" : "National ID"} />
                    <TextInput id="national_id" value={data.national_id} onChange={(e) => setData("national_id", e.target.value)} className="mt-1 block w-full" />
                    <InputError message={errors.national_id} className="mt-2" />
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <InputLabel htmlFor="phone" value={isRTL ? "رقم الجوال" : "Phone"} />
                    <TextInput id="phone" value={data.phone} onChange={(e) => setData("phone", e.target.value)} className="mt-1 block w-full text-left" dir="ltr" />
                    <InputError message={errors.phone} className="mt-2" />
                  </div>
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel htmlFor="email" value={isRTL ? "البريد الإلكتروني" : "Email"} />
                  <TextInput id="email" type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} className="mt-1 block w-full text-left" dir="ltr" />
                  <InputError message={errors.email} className="mt-2" />
                </div>
                <div className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
                  <div className={isRTL ? "text-right" : ""}>
                    <InputLabel htmlFor="license_number" value={isRTL ? "رقم الرخصة" : "License Number"} />
                    <TextInput id="license_number" value={data.license_number} onChange={(e) => setData("license_number", e.target.value)} className="mt-1 block w-full text-left font-mono" dir="ltr" />
                    <InputError message={errors.license_number} className="mt-2" />
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <InputLabel htmlFor="license_expiry_date" value={isRTL ? "تاريخ انتهاء الرخصة" : "License Expiry Date"} />
                    <TextInput id="license_expiry_date" type="date" value={data.license_expiry_date} onChange={(e) => setData("license_expiry_date", e.target.value)} className="mt-1 block w-full" />
                    <InputError message={errors.license_expiry_date} className="mt-2" />
                  </div>
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel htmlFor="image" value={isRTL ? "الصورة الشخصية" : "Profile Picture"} />
                  <input id="image" type="file" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                  <InputError message={errors.image} className="mt-2" />
                </div>
                <div className={`flex gap-3 justify-end mt-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <SecondaryButton onClick={closeModal}>{isRTL ? "إلغاء" : "Cancel"}</SecondaryButton>
                  <PrimaryButton className="bg-brand-dark" disabled={processing}>
                    {isEditing ? (isRTL ? "تحديث السائق" : "Update Driver") : (isRTL ? "إضافة السائق" : "Add Driver")}
                  </PrimaryButton>
                </div>
              </form>
            </div>
          </Modal>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
