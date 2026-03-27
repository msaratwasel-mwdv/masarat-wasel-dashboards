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

interface Supervisor {
  id: number;
  name: string;
  name_en: string | null;
  email: string;
  phone: string;
  national_id: string;
  user_code: string;
  school_id: number | null;
  supervisor_profile: {
    emergency_contact_name: string;
    emergency_contact_phone: string;
    status: string;
  } | null;
  image?: string | null;
  assigned_bus_as_supervisor: AssignedBus | null;
}

interface Props {
  supervisors: {
    data: Supervisor[];
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

export default function SupervisorsIndex({ supervisors, counts, filters }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  // --- State ---
  const [search, setSearch] = useState(filters.search);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // --- Form ---
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    _method: "post",
    name: "",
    name_en: "",
    national_id: "",
    email: "",
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    status: "Trainee",
    image: null as File | null,
  });

  // --- Handlers ---
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.get(
          route("admin.supervisors.index"),
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
      route("admin.supervisors.index"),
      { search: filters.search, status: key === "all" ? undefined : key },
      { preserveState: true, replace: true }
    );
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    reset();
    setData("_method", "post");
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (sup: Supervisor) => {
    setIsEditing(true);
    setCurrentId(sup.id);
    setData({
      _method: "put",
      name: sup.name,
      name_en: sup.name_en || "",
      national_id: sup.national_id || "",
      email: sup.email,
      phone: sup.phone || "",
      emergency_contact_name: sup.supervisor_profile?.emergency_contact_name || "",
      emergency_contact_phone: sup.supervisor_profile?.emergency_contact_phone || "",
      status: sup.supervisor_profile?.status || "Trainee",
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
    if (isEditing && currentId) {
      post(route("admin.supervisors.update", currentId), {
        forceFormData: true,
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("admin.supervisors.store"), { onSuccess: () => closeModal() });
    }
  };

  const deleteSupervisor = (id: number) => {
    if (confirm(isRTL ? "هل أنت متأكد من حذف هذه المشرفة؟" : "Are you sure?")) {
      router.delete(route("admin.supervisors.destroy", id));
    }
  };

  // --- Filter Tabs ---
  const filterTabs: FilterTab[] = [
    { key: "all", label: isRTL ? "الكل" : "All", count: counts.all },
    { key: "available", label: isRTL ? "متاح" : "Available", count: counts.available, dotColor: "bg-green-400" },
    { key: "assigned", label: isRTL ? "محجوز" : "Assigned", count: counts.assigned, dotColor: "bg-orange-400" },
  ];

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      Active: "نشط",
      Trainee: "متدرب",
      "On Leave": "إجازة",
      Inactive: "غير نشط",
    };
    return isRTL ? map[status] || status : status;
  };

  // --- Columns ---
  const columnHelper = createColumnHelper<Supervisor>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: isRTL ? "المشرف(ة)" : "Supervisor",
        cell: (info) => {
          const sup = info.row.original;
          return (
            <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold text-sm overflow-hidden ring-2 ring-offset-1 ring-brand-dark/10">
                {sup.image ? (
                  <img src={`/storage/${sup.image}`} alt={sup.name} className="w-full h-full object-cover" />
                ) : (
                  sup.name.charAt(0)
                )}
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {sup.name}
                </div>
                {sup.name_en && (
                  <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {sup.name_en}
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
          const sup = info.row.original;
          return (
            <div className={isRTL ? "text-right" : "text-left"}>
              <div className={`text-sm font-mono font-medium ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                {sup.national_id || "—"}
              </div>
              <div className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {sup.user_code}
              </div>
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
              <div className={`text-sm font-mono ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                {sup.phone}
              </div>
              <div className={`text-xs truncate max-w-[160px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                {sup.email}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("supervisor_profile.emergency_contact_name", {
        header: isRTL ? "طوارئ الاستجابة" : "Emergency",
        cell: (info) => {
          const sup = info.row.original;
          return (
            <div className={isRTL ? "text-right" : "text-left"}>
              <div className={`text-sm font-medium ${isDark ? "text-red-400" : "text-red-600"}`}>
                {sup.supervisor_profile?.emergency_contact_phone || "—"}
              </div>
              <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {sup.supervisor_profile?.emergency_contact_name || "—"}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("assigned_bus_as_supervisor", {
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
      columnHelper.accessor("supervisor_profile.status", {
        header: isRTL ? "الحالة" : "Status",
        cell: (info) => {
          const status = info.getValue() || "N/A";
          const isActive = status === "Active";
          return (
            <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${isActive ? (isDark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-800") : (isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-800")}`}>
              {statusLabel(status)}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
          const sup = info.row.original;
          return (
            <div className={`flex gap-2 column-actions ${isRTL ? "justify-start" : "justify-end"}`}>
              <ActionButton
                label={isRTL ? "تعديل" : "Edit"}
                onClick={() => openEditModal(sup)}
                color="indigo"
              />
              <ActionButton
                label={isRTL ? "حذف" : "Delete"}
                onClick={() => deleteSupervisor(sup.id)}
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
    links: supervisors.links,
    current_page: supervisors.current_page,
    last_page: supervisors.last_page,
    per_page: supervisors.per_page,
    total: supervisors.total,
    from: supervisors.from,
    to: supervisors.to,
  };

  const headerAction = (
    <PrimaryButton
      onClick={openAddModal}
      className="bg-brand-yellow text-brand-dark hover:bg-yellow-500"
    >
      {isRTL ? "+ إضافة مشرفة جديدة" : "+ Add New Supervisor"}
    </PrimaryButton>
  );

  return (
    <AuthenticatedLayout
      header={
        <h2 className={`font-bold text-xl ${isDark ? "text-gray-200" : "text-gray-800"}`}>
          {isRTL ? "إدارة المشرفين" : "Supervisors Management"}
        </h2>
      }
    >
      <Head title={isRTL ? "المشرفين" : "Supervisors"} />

      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <BaseDataTable<Supervisor>
            columns={columns}
            data={supervisors.data}
            pagination={pagination}
            title={isRTL ? "مشرفو الحافلات" : "Bus Supervisors"}
            subtitle={
              isRTL
                ? `${counts.all} مشرفة — ${counts.assigned} محجوزة — ${counts.available} متاحة`
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
            emptyMessage={isRTL ? "لا يوجد مشرفين مطابقين." : "No supervisors found."}
          />

          {/* Modal */}
          <Modal show={isModalOpen} onClose={closeModal}>
            <div className={`p-6 ${isDark ? "bg-gray-800 text-gray-200" : "bg-white"}`}>
              <h2 className={`text-lg font-medium mb-4 ${isDark ? "text-white" : "text-gray-900"} ${isRTL ? "text-right" : ""}`}>
                {isEditing ? (isRTL ? "تعديل وبيانات المشرفة" : "Edit Supervisor Details") : (isRTL ? "تسجيل مشرفة جديدة" : "Register New Supervisor")}
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
                <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl border mt-2 ${isDark ? "bg-red-900/10 border-red-900/30" : "bg-red-50/50 border-red-100"} ${isRTL ? "rtl" : ""}`}>
                  <div className="col-span-2">
                    <h3 className={`text-xs font-bold uppercase ${isDark ? "text-red-400" : "text-red-800"}`}>
                      {isRTL ? "جهات اتصال الطوارئ" : "Emergency Contact"}
                    </h3>
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <InputLabel htmlFor="emergency_contact_name" value={isRTL ? "اسم جهة الطوارئ" : "Contact Name"} />
                    <TextInput id="emergency_contact_name" value={data.emergency_contact_name} onChange={(e) => setData("emergency_contact_name", e.target.value)} className="mt-1 block w-full" />
                    <InputError message={errors.emergency_contact_name} className="mt-2" />
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <InputLabel htmlFor="emergency_contact_phone" value={isRTL ? "رقم الهاتف (للطوارئ)" : "Contact Phone"} />
                    <TextInput id="emergency_contact_phone" value={data.emergency_contact_phone} onChange={(e) => setData("emergency_contact_phone", e.target.value)} className="mt-1 block w-full text-left" dir="ltr" />
                    <InputError message={errors.emergency_contact_phone} className="mt-2" />
                  </div>
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel value={isRTL ? "الحالة" : "Status"} />
                  <select
                    className={`mt-1 block w-full rounded-md shadow-sm text-sm focus:ring-brand-yellow ${isDark ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white"}`}
                    value={data.status}
                    onChange={(e) => setData("status", e.target.value)}
                  >
                    <option value="Active">{isRTL ? "نشط" : "Active"}</option>
                    <option value="Trainee">{isRTL ? "متدرب" : "Trainee"}</option>
                    <option value="On Leave">{isRTL ? "إجازة" : "On Leave"}</option>
                    <option value="Inactive">{isRTL ? "غير نشط" : "Inactive"}</option>
                  </select>
                  <InputError message={errors.status} className="mt-2" />
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel htmlFor="image" value={isRTL ? "الصورة الشخصية" : "Profile Picture"} />
                  <input id="image" type="file" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                  <InputError message={errors.image} className="mt-2" />
                </div>
                <div className={`flex gap-3 justify-end mt-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <SecondaryButton onClick={closeModal}>{isRTL ? "إلغاء" : "Cancel"}</SecondaryButton>
                  <PrimaryButton className="bg-brand-dark" disabled={processing}>
                    {isEditing ? (isRTL ? "تحديث المشرفة" : "Update Supervisor") : (isRTL ? "إضافة مشرفة" : "Add Supervisor")}
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
