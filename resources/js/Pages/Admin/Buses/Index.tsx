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
import BusMediaGallery from "@/Components/BusMediaGallery";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, {
  ActionButton,
  StatusBadge,
  type FilterTab,
  type PaginationMeta,
} from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";

// ─── Types ───────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
}

interface School {
  id: number;
  name: string;
}

interface BusDocument {
  id: number;
  type: string;
  file_path: string;
}

interface Route {
  id: number;
  name: string;
  code: string;
  school?: School;
}

interface Bus {
  id: number;
  bus_code: string;
  plate_number: string;
  model: string;
  year: number;
  capacity: number;
  type?: string;
  color?: string;
  status: "active" | "maintenance" | "out_of_service" | "inactive";
  qr_code_path: string | null;
  school_id: number | null;
  driver_id: number | null;
  supervisor_id: number | null;
  route_id: number | null;
  driver?: User;
  supervisor?: User;
  school?: School;
  route?: Route;
  documents?: BusDocument[];
  deactivation_reason?: string;
}

interface Props {
  buses: {
    data: Bus[];
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
    active: number;
    maintenance: number;
    out_of_service: number;
    archived: number;
  };
  filters: {
    search: string;
    status: string;
  };
  availableDrivers: User[];
  availableSupervisors: User[];
  schools: School[];
  routes: Route[];
}

// ─── Component ───────────────────────────────────────────────────

export default function Index({
  buses,
  counts,
  filters,
  availableDrivers,
  availableSupervisors,
  schools,
  routes,
}: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  // --- State ---
  const [search, setSearch] = useState(filters.search);
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "view" | "archive" | null;
    bus: Bus | null;
  }>({ type: null, bus: null });

  // --- Search & Filter ---
  // Handle debounced search securely
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.get(
          route("admin.buses.index"),
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
      route("admin.buses.index"),
      { search: filters.search, status: key === "all" ? undefined : key },
      { preserveState: true, replace: true }
    );
  };

  // --- Forms ---
  const busForm = useForm({
    plate_number: "",
    model: "",
    year: new Date().getFullYear(),
    capacity: 25,
    status: "active",
    driver_id: "",
    supervisor_id: "",
    school_id: "",
    route_id: "",
    photos: [] as File[],
    registration_file: null as File | null,
  });
  const archiveForm = useForm({ deactivation_reason: "" });

  // --- Handlers ---
  const closeModal = () => {
    setModalState({ type: null, bus: null });
    busForm.reset();
    archiveForm.reset();
  };

  const openModal = (type: "add" | "edit" | "view" | "archive", bus: Bus | null = null) => {
    setModalState({ type, bus });
    if (type === "edit" && bus) {
      busForm.setData({
        plate_number: bus.plate_number,
        model: bus.model,
        year: bus.year,
        capacity: bus.capacity,
        status: bus.status as any,
        driver_id: bus.driver_id?.toString() || "",
        supervisor_id: bus.supervisor_id?.toString() || "",
        school_id: bus.school_id?.toString() || "",
        route_id: bus.route_id?.toString() || "",
        photos: [],
        registration_file: null,
      });
    }
    if (type === "archive" && bus) {
      archiveForm.setData("deactivation_reason", bus.deactivation_reason || "");
    }
  };

  const submitBusForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalState.type === "add") {
      busForm.post(route("admin.buses.store"), { onSuccess: closeModal });
    } else if (modalState.type === "edit" && modalState.bus) {
      const bus = modalState.bus;
      const { school_id, route_id, photos, registration_file, ...coreData } = busForm.data;

      const formData = new FormData();
      formData.append("_method", "put");
      Object.entries(coreData).forEach(([key, val]) => {
        if (val !== null && val !== undefined) formData.append(key, String(val));
      });
      if (photos && photos.length > 0) {
        photos.forEach((p) => formData.append("photos[]", p));
      }
      if (registration_file) formData.append("registration_file", registration_file);

      router.post(route("admin.buses.update", bus.id), formData as any, {
        forceFormData: true,
        onSuccess: () => {
          const newSchoolId = school_id || "";
          const oldSchoolId = bus.school_id?.toString() || "";
          if (newSchoolId !== oldSchoolId) {
            router.post(route("admin.buses.assign", bus.id), { school_id: newSchoolId }, { preserveScroll: true });
          }
          const newRouteId = route_id || "";
          const oldRouteId = bus.route_id?.toString() || "";
          if (newRouteId !== oldRouteId) {
            router.post(route("admin.buses.assign-route", bus.id), { route_id: newRouteId }, { preserveScroll: true });
          }
          closeModal();
        },
      });
    }
  };

  const submitArchiveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalState.bus) {
      archiveForm.post(route("admin.buses.archive", modalState.bus.id), {
        onSuccess: closeModal,
      });
    }
  };

  // --- Driver/Supervisor options for edit ---
  const editDriverOptions = useMemo(() => {
    if (modalState.type !== "edit" || !modalState.bus) return availableDrivers;
    const currentDriver = modalState.bus.driver;
    if (!currentDriver) return availableDrivers;
    const alreadyIn = availableDrivers.some((d) => d.id === currentDriver.id);
    return alreadyIn ? availableDrivers : [currentDriver, ...availableDrivers];
  }, [modalState, availableDrivers]);

  const editSupervisorOptions = useMemo(() => {
    if (modalState.type !== "edit" || !modalState.bus) return availableSupervisors;
    const currentSupervisor = modalState.bus.supervisor;
    if (!currentSupervisor) return availableSupervisors;
    const alreadyIn = availableSupervisors.some((s) => s.id === currentSupervisor.id);
    return alreadyIn ? availableSupervisors : [currentSupervisor, ...availableSupervisors];
  }, [modalState, availableSupervisors]);

  // --- Helpers ---
  const getStatusVariant = (status: string): "green" | "yellow" | "red" | "gray" => {
    switch (status) {
      case "active": return "green";
      case "maintenance": return "yellow";
      case "out_of_service": return "red";
      default: return "gray";
    }
  };

  const getStatusLabel = (status: string) => {
    if (isRTL) {
      switch (status) {
        case "active": return "نشط";
        case "maintenance": return "صيانة";
        case "inactive": return "غير نشط";
        case "out_of_service": return "خارج الخدمة";
        case "archived": return "مؤرشفة";
        default: return status;
      }
    }
    return status;
  };

  // --- Filter tabs ---
  const filterTabs: FilterTab[] = [
    { key: "all", label: isRTL ? "الكل" : "All", count: counts.all },
    { key: "active", label: isRTL ? "نشط" : "Active", count: counts.active, dotColor: "bg-green-400" },
    { key: "maintenance", label: isRTL ? "صيانة" : "Maintenance", count: counts.maintenance, dotColor: "bg-yellow-400" },
    { key: "out_of_service", label: isRTL ? "خارج الخدمة" : "Out of Service", count: counts.out_of_service, dotColor: "bg-red-400" },
  ];
  if (counts.archived > 0) {
    filterTabs.push({ key: "archived", label: isRTL ? "مؤرشفة" : "Archived", count: counts.archived, dotColor: "bg-gray-400" });
  }

  // --- Columns ---
  const columnHelper = createColumnHelper<Bus>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("bus_code", {
        header: isRTL ? "الحافلة" : "Vehicle",
        cell: (info) => {
          const bus = info.row.original;
          return (
            <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="flex-shrink-0 h-9 min-w-[2.5rem] px-2 rounded-lg bg-brand-yellow flex items-center justify-center text-brand-dark font-bold text-xs shadow-sm whitespace-nowrap">
                {bus.bus_code}
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <div className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"} font-mono`}>
                  {bus.plate_number}
                </div>
                <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {bus.model} • {bus.capacity} {isRTL ? "مقعد" : "Seats"}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("driver.name", {
        header: isRTL ? "الطاقم" : "Crew",
        cell: (info) => {
          const bus = info.row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <div className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                <span className={`font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "سائق:" : "D:"} </span>
                <span className={!bus.driver ? "text-red-400 italic" : ""}>
                  {bus.driver?.name || (isRTL ? "غير مسند" : "—")}
                </span>
              </div>
              <div className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                <span className={`font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "مشرف:" : "S:"} </span>
                <span className={!bus.supervisor ? "text-red-400 italic" : ""}>
                  {bus.supervisor?.name || (isRTL ? "غير مسند" : "—")}
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("school.name", {
        header: isRTL ? "المدرسة" : "School",
        cell: (info) => {
          const bus = info.row.original;
          return bus.school ? (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-800"}`}>
              {bus.school.name}
            </span>
          ) : (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
              {isRTL ? "المقر الرئيسي" : "Central Pool"}
            </span>
          );
        },
      }),
      columnHelper.accessor("route.name", {
        header: isRTL ? "المسار" : "Route",
        cell: (info) => {
          const bus = info.row.original;
          return bus.route ? (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800"}`}>
              {bus.route.name}
            </span>
          ) : (
            <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>—</span>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: isRTL ? "الحالة" : "Status",
        cell: (info) => (
          <StatusBadge
            label={getStatusLabel(info.getValue())}
            variant={getStatusVariant(info.getValue())}
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
          const bus = info.row.original;
          return (
            <div className={`flex gap-2 ${isRTL ? "justify-start" : "justify-end"}`}>
              {filters.status === "archived" ? (
                <ActionButton
                  label={isRTL ? "استعادة" : "Restore"}
                  onClick={() => router.post(route("admin.buses.restore", bus.id), {}, { preserveScroll: true })}
                  color="green"
                />
              ) : (
                <>
                  <ActionButton
                    label={isRTL ? "عرض" : "View"}
                    onClick={() => openModal("view", bus)}
                    color="blue"
                  />
                  <ActionButton
                    label={isRTL ? "تعديل" : "Edit"}
                    onClick={() => openModal("edit", bus)}
                    color="indigo"
                  />
                  <ActionButton
                    label={isRTL ? "أرشفة" : "Archive"}
                    onClick={() => openModal("archive", bus)}
                    color="red"
                  />
                </>
              )}
            </div>
          );
        },
      }),
    ],
    [isRTL, isDark, filters.status, openModal]
  );

  // --- Pagination meta ---
  const pagination: PaginationMeta = {
    links: buses.links,
    current_page: buses.current_page,
    last_page: buses.last_page,
    per_page: buses.per_page,
    total: buses.total,
    from: buses.from,
    to: buses.to,
  };

  const headerAction = (
    <PrimaryButton
      onClick={() => openModal("add")}
      className="bg-brand-yellow text-brand-dark hover:bg-yellow-500"
    >
      {isRTL ? "+ تسجيل حافلة جديدة" : "+ Register New Bus"}
    </PrimaryButton>
  );

  return (
    <AuthenticatedLayout
      header={
        <h2 className={`font-bold text-xl ${isDark ? "text-gray-200" : "text-gray-800"}`}>
          {isRTL ? "إدارة أسطول الحافلات" : "Bus Fleet Management"}
        </h2>
      }
    >
      <Head title={isRTL ? "الحافلات" : "Buses"} />

      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <BaseDataTable<Bus>
            columns={columns}
            data={buses.data}
            pagination={pagination}
            title={isRTL ? "أسطول الحافلات" : "Fleet Vehicles"}
            subtitle={
              isRTL
                ? `${counts.all} حافلة — ${counts.active} نشط — ${counts.maintenance} صيانة — ${counts.out_of_service} خارج الخدمة`
                : `${counts.all} total — ${counts.active} active — ${counts.maintenance} maintenance — ${counts.out_of_service} out of service`
            }
            headerAction={headerAction}
            exportEnabled={true}
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder={isRTL ? "بحث بالكود، اللوحة، المدرسة، السائق..." : "Search code, plate, school, driver..."}
            filterTabs={filterTabs}
            activeFilter={filters.status}
            onFilterChange={handleFilterChange}
            emptyMessage={isRTL ? "لا توجد حافلات مطابقة." : "No buses found."}
          />

          {/* ==================== MODALS ==================== */}

          {/* View Modal */}
          {modalState.type === "view" && modalState.bus && (
            <Modal show={true} onClose={closeModal} maxWidth="2xl">
              <div className={`overflow-hidden ${isDark ? "bg-gray-800" : "bg-white"}`}>
                {/* Header */}
                <div className={`relative px-6 py-5 border-b ${isDark ? "border-gray-700 bg-gray-900/50" : "bg-gray-50 border-gray-200"}`}>
                  <div className={`flex justify-between items-start ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <div className={`flex items-center gap-3 mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <h2 className={`text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                          {modalState.bus.bus_code}
                        </h2>
                        <StatusBadge
                          label={getStatusLabel(modalState.bus.status)}
                          variant={getStatusVariant(modalState.bus.status)}
                        />
                      </div>
                      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        <span className="font-mono font-bold">{modalState.bus.plate_number}</span>
                        <span className="mx-2">•</span>
                        {modalState.bus.model} — {modalState.bus.year}
                      </p>
                    </div>
                    {modalState.bus.qr_code_path && (
                      <div className="flex flex-col items-center">
                        <div className={`p-1.5 bg-white rounded-lg border shadow-sm ${isDark ? "border-gray-600" : "border-gray-200"}`}>
                          <img src={`/storage/${modalState.bus.qr_code_path}`} alt="QR" className="w-16 h-16" />
                        </div>
                        <a href={`/storage/${modalState.bus.qr_code_path}`} download className="mt-1.5 text-[10px] font-bold text-blue-500 hover:underline uppercase tracking-wide">
                          {isRTL ? "تحميل QR" : "DOWNLOAD"}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
                  {/* Quick Stats */}
                  <div className={`grid grid-cols-4 gap-3 ${isRTL ? "rtl" : ""}`}>
                    {[
                      { label: isRTL ? "السعة" : "Capacity", value: `${modalState.bus.capacity}`, icon: "🪑" },
                      { label: isRTL ? "السنة" : "Year", value: `${modalState.bus.year}`, icon: "📅" },
                      { label: isRTL ? "النوع" : "Type", value: modalState.bus.type === "permanent" ? (isRTL ? "دائم" : "Permanent") : (isRTL ? "مؤقت" : "Temporary"), icon: "🔖" },
                      { label: isRTL ? "اللون" : "Color", value: modalState.bus.color || "—", icon: "🎨" },
                    ].map((item, i) => (
                      <div key={i} className={`text-center p-3 rounded-xl border ${isDark ? "bg-gray-700/30 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                        <div className="text-lg mb-0.5">{item.icon}</div>
                        <div className={`text-xs font-medium mb-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{item.label}</div>
                        <div className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Crew */}
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 pb-2 border-b ${isDark ? "text-gray-400 border-gray-700" : "text-gray-400 border-gray-100"} ${isRTL ? "text-right" : ""}`}>
                      {isRTL ? "الطاقم" : "CREW"}
                    </h3>
                    <div className={`grid grid-cols-2 gap-3 ${isRTL ? "rtl" : ""}`}>
                      {[
                        { label: isRTL ? "السائق" : "Driver", value: modalState.bus.driver?.name, icon: "🚗" },
                        { label: isRTL ? "المشرف" : "Supervisor", value: modalState.bus.supervisor?.name, icon: "👤" },
                      ].map((item, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? "bg-gray-700/30 border-gray-700" : "bg-gray-50 border-gray-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isDark ? "bg-gray-700" : "bg-gray-200/60"}`}>
                            {item.icon}
                          </div>
                          <div className={isRTL ? "text-right" : ""}>
                            <div className={`text-[10px] font-bold uppercase ${isDark ? "text-gray-500" : "text-gray-400"}`}>{item.label}</div>
                            <div className={`text-sm font-bold ${item.value ? (isDark ? "text-white" : "text-gray-900") : "text-gray-400 italic"}`}>
                              {item.value || (isRTL ? "غير مسند" : "Unassigned")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* School & Route */}
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 pb-2 border-b ${isDark ? "text-gray-400 border-gray-700" : "text-gray-400 border-gray-100"} ${isRTL ? "text-right" : ""}`}>
                      {isRTL ? "التشغيل" : "ASSIGNMENT"}
                    </h3>
                    <div className={`grid grid-cols-2 gap-3 ${isRTL ? "rtl" : ""}`}>
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? "bg-blue-900/10 border-blue-900/20" : "bg-blue-50 border-blue-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isDark ? "bg-blue-900/30" : "bg-blue-100"}`}>🏫</div>
                        <div className={isRTL ? "text-right" : ""}>
                          <div className={`text-[10px] font-bold uppercase ${isDark ? "text-blue-400" : "text-blue-600"}`}>{isRTL ? "المدرسة" : "School"}</div>
                          <div className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                            {modalState.bus.school?.name || (isRTL ? "المقر الرئيسي" : "Central Pool")}
                          </div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? "bg-green-900/10 border-green-900/20" : "bg-green-50 border-green-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isDark ? "bg-green-900/30" : "bg-green-100"}`}>🛣️</div>
                        <div className={isRTL ? "text-right" : ""}>
                          <div className={`text-[10px] font-bold uppercase ${isDark ? "text-green-400" : "text-green-600"}`}>{isRTL ? "المسار" : "Route"}</div>
                          <div className={`text-sm font-bold ${modalState.bus.route ? (isDark ? "text-white" : "text-gray-900") : "text-gray-400 italic"}`}>
                            {modalState.bus.route?.name || (isRTL ? "بدون مسار" : "No Route")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  {modalState.bus.documents && modalState.bus.documents.length > 0 && (
                    <div>
                      <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 pb-2 border-b ${isDark ? "text-gray-400 border-gray-700" : "text-gray-400 border-gray-100"} ${isRTL ? "text-right" : ""}`}>
                        {isRTL ? "الوثائق" : "DOCUMENTS"}
                      </h3>
                      <BusMediaGallery documents={modalState.bus.documents} />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t flex ${isRTL ? "justify-start" : "justify-end"} ${isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                  <SecondaryButton onClick={closeModal}>
                    {isRTL ? "إغلاق" : "Close"}
                  </SecondaryButton>
                </div>
              </div>
            </Modal>
          )}

          {/* Add/Edit Modal */}
          <Modal
            show={modalState.type === "add" || modalState.type === "edit"}
            onClose={closeModal}
            maxWidth="3xl"
          >
            <div className={`flex flex-col max-h-[90vh] ${isDark ? "bg-gray-800" : "bg-white"}`}>
              {/* Header */}
              <div className={`p-6 border-b sticky top-0 z-10 rounded-t-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <div className={`flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
                  <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    {modalState.type === "edit"
                      ? isRTL ? "تحديث بيانات المركبة" : "Update Vehicle"
                      : isRTL ? "تسجيل مركبة جديدة" : "Register New Vehicle"}
                  </h2>
                  {modalState.type === "edit" && (
                    <span className="text-xs font-bold text-brand-navy bg-brand-yellow/20 px-2 py-1 rounded">
                      {modalState.bus?.bus_code}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <form id="bus-form" onSubmit={submitBusForm} className="space-y-6">
                  {/* Core Fields */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
                    <div className={isRTL ? "text-right" : ""}>
                      <InputLabel value={isRTL ? "رقم اللوحة" : "Plate Number"} />
                      <TextInput value={busForm.data.plate_number} onChange={(e) => busForm.setData("plate_number", e.target.value)} className="w-full mt-1 font-mono uppercase" placeholder="ABC 1234" />
                      <InputError message={busForm.errors.plate_number} />
                    </div>
                    <div className={isRTL ? "text-right" : ""}>
                      <InputLabel value={isRTL ? "السعة" : "Capacity"} />
                      <TextInput type="number" value={busForm.data.capacity} onChange={(e) => busForm.setData("capacity", Number(e.target.value))} className="w-full mt-1" />
                      <InputError message={busForm.errors.capacity} />
                    </div>
                    <div className={isRTL ? "text-right" : ""}>
                      <InputLabel value={isRTL ? "الموديل" : "Model"} />
                      <TextInput value={busForm.data.model} onChange={(e) => busForm.setData("model", e.target.value)} className="w-full mt-1" />
                      <InputError message={busForm.errors.model} />
                    </div>
                    <div className={isRTL ? "text-right" : ""}>
                      <InputLabel value={isRTL ? "سنة الصنع" : "Year"} />
                      <TextInput type="number" value={busForm.data.year} onChange={(e) => busForm.setData("year", Number(e.target.value))} className="w-full mt-1" />
                      <InputError message={busForm.errors.year} />
                    </div>
                  </div>

                  {/* Crew Assignment */}
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-blue-900/10 border-blue-900/30" : "bg-blue-50/50 border-blue-100"}`}>
                    <h3 className={`text-xs font-bold uppercase mb-3 flex items-center gap-2 ${isDark ? "text-blue-400" : "text-blue-800"} ${isRTL ? "flex-row-reverse" : ""}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {isRTL ? "تعيين الطاقم التشغيلي" : "Crew Assignment"}
                    </h3>
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel value={isRTL ? "السائق" : "Driver"} />
                        <select className={`w-full rounded-lg mt-1 text-sm focus:ring-brand-yellow ${isDark ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"}`} value={busForm.data.driver_id} onChange={(e) => busForm.setData("driver_id", e.target.value)}>
                          <option value="">{isRTL ? "-- غير مسند --" : "-- Unassigned --"}</option>
                          {(modalState.type === "edit" ? editDriverOptions : availableDrivers).map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}{modalState.bus?.driver_id === d.id ? (isRTL ? " (الحالي)" : " (current)") : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel value={isRTL ? "المشرف" : "Supervisor"} />
                        <select className={`w-full rounded-lg mt-1 text-sm focus:ring-brand-yellow ${isDark ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"}`} value={busForm.data.supervisor_id} onChange={(e) => busForm.setData("supervisor_id", e.target.value)}>
                          <option value="">{isRTL ? "-- غير مسند --" : "-- Unassigned --"}</option>
                          {(modalState.type === "edit" ? editSupervisorOptions : availableSupervisors).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}{modalState.bus?.supervisor_id === s.id ? (isRTL ? " (الحالي)" : " (current)") : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* School & Route Assignment */}
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-green-900/10 border-green-900/30" : "bg-green-50/50 border-green-100"}`}>
                    <h3 className={`text-xs font-bold uppercase mb-3 flex items-center gap-2 ${isDark ? "text-green-400" : "text-green-800"} ${isRTL ? "flex-row-reverse" : ""}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      {isRTL ? "تعيين المدرسة والمسار" : "School & Route Assignment"}
                    </h3>
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel value={isRTL ? "المدرسة (اختياري)" : "School (optional)"} />
                        <select className={`w-full rounded-lg mt-1 text-sm focus:ring-green-500 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"}`} value={busForm.data.school_id} onChange={(e) => busForm.setData("school_id", e.target.value)}>
                          <option value="">{isRTL ? "-- المقر الرئيسي --" : "-- Central Pool (No School) --"}</option>
                          {schools.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel value={isRTL ? "المسار (اختياري)" : "Route (optional)"} />
                        <select className={`w-full rounded-lg mt-1 text-sm focus:ring-green-500 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"}`} value={busForm.data.route_id} onChange={(e) => busForm.setData("route_id", e.target.value)}>
                          <option value="">{isRTL ? "-- بدون مسار --" : "-- No Route --"}</option>
                          {routes.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.code}){r.school ? ` - ${r.school.name}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className={`border-t pt-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                    <h3 className={`text-xs font-bold uppercase mb-3 ${isDark ? "text-gray-400" : "text-gray-500"} ${isRTL ? "text-right" : ""}`}>
                      {isRTL ? "وثائق المركبة" : "Vehicle Documents"}
                    </h3>

                    {modalState.type === "edit" && modalState.bus?.documents && modalState.bus.documents.length > 0 && (
                      <div className={`mb-4 p-4 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-100"}`}>
                        <p className={`text-xs font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"} ${isRTL ? "text-right" : ""}`}>
                          {isRTL ? "الوسائط الحالية:" : "Current Media:"}
                        </p>
                        <BusMediaGallery
                          documents={modalState.bus.documents}
                          editable={true}
                          onDelete={(docId) => {
                            if (confirm(isRTL ? "هل أنت متأكد من حذف هذا المستند؟" : "Are you sure you want to delete this document?")) {
                              router.delete(route("admin.buses.documents.destroy", docId), {
                                preserveScroll: true,
                                onSuccess: () => {
                                  if (modalState.bus) {
                                    const updatedDocs = modalState.bus.documents?.filter((d) => d.id !== docId);
                                    setModalState({ ...modalState, bus: { ...modalState.bus, documents: updatedDocs } });
                                  }
                                },
                              });
                            }
                          }}
                        />
                      </div>
                    )}

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel value={isRTL ? "إضافة صور" : "Add Photos"} />
                        <input type="file" multiple accept="image/*" onChange={(e) => busForm.setData("photos", Array.from(e.target.files || []))} className={`block w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold transition ${isDark ? "text-gray-400 file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600" : "text-gray-500 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"}`} />
                      </div>
                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel value={isRTL ? "ملف الاستمارة (PDF/صورة)" : "Registration File"} />
                        <input type="file" accept=".pdf,image/*" onChange={(e) => busForm.setData("registration_file", e.target.files?.[0] || null)} className={`block w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold transition ${isDark ? "text-gray-400 file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600" : "text-gray-500 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"}`} />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className={`p-4 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-100"}`}>
                    <InputLabel value={isRTL ? "الحالة التشغيلية" : "Operational Status"} className={isRTL ? "text-right" : ""} />
                    <select className={`w-full rounded-lg mt-1 text-sm focus:ring-brand-yellow font-bold ${isDark ? "bg-gray-800 border-gray-600 text-white" : "border-gray-300"}`} value={busForm.data.status} onChange={(e) => busForm.setData("status", e.target.value as any)}>
                      <option value="active">{isRTL ? "🟢 نشط" : "🟢 Active"}</option>
                      <option value="maintenance">{isRTL ? "🟡 صيانة" : "🟡 Maintenance"}</option>
                      <option value="inactive">{isRTL ? "⚪ غير نشط" : "⚪ Inactive"}</option>
                      <option value="out_of_service">{isRTL ? "🔴 خارج الخدمة" : "🔴 Out of Service"}</option>
                    </select>
                    <InputError message={busForm.errors.status} className="mt-2" />
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className={`p-6 border-t flex gap-3 sticky bottom-0 z-10 rounded-b-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} ${isRTL ? "flex-row-reverse" : "justify-end"}`}>
                <SecondaryButton onClick={closeModal}>
                  {isRTL ? "إلغاء" : "Cancel"}
                </SecondaryButton>
                <PrimaryButton type="submit" form="bus-form" disabled={busForm.processing} className="bg-brand-dark">
                  {modalState.type === "edit" ? (isRTL ? "تحديث البيانات" : "Update Details") : (isRTL ? "تسجيل المركبة" : "Register Vehicle")}
                </PrimaryButton>
              </div>
            </div>
          </Modal>

          {/* Archive Modal */}
          <Modal show={modalState.type === "archive"} onClose={closeModal}>
            <div className={`p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {isRTL ? "أرشفة المركبة" : "Archive Vehicle"}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {isRTL ? "هذا الإجراء سيزيل الحافلة من الخدمة." : "This will remove the bus from active duty."}
                </p>
              </div>
              <form onSubmit={submitArchiveForm} className="space-y-4">
                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel value={isRTL ? "سبب الإلغاء" : "Reason for Deactivation"} />
                  <select
                    className={`w-full rounded-lg mt-1 ${isDark ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"}`}
                    value={archiveForm.data.deactivation_reason}
                    onChange={(e) => archiveForm.setData("deactivation_reason", e.target.value)}
                    required
                  >
                    <option value="">{isRTL ? "-- اختر السبب --" : "-- Select Reason --"}</option>
                    <option value="Maintenance">{isRTL ? "صيانة" : "Maintenance"}</option>
                    <option value="Accident">{isRTL ? "حادث" : "Accident"}</option>
                    <option value="Sold">{isRTL ? "تم البيع" : "Sold"}</option>
                    <option value="Other">{isRTL ? "أخرى" : "Other"}</option>
                  </select>
                </div>
                <div className={`flex gap-3 mt-6 ${isRTL ? "flex-row-reverse" : "justify-end"}`}>
                  <SecondaryButton onClick={closeModal}>
                    {isRTL ? "إلغاء" : "Cancel"}
                  </SecondaryButton>
                  <PrimaryButton className="bg-red-600 hover:bg-red-700 border-none" disabled={archiveForm.processing}>
                    {isRTL ? "أرشفة نهائية" : "Archive Permanently"}
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
