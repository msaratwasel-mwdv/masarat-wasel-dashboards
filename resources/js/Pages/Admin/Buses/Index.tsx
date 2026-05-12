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
import { motion } from "framer-motion";
import {
  Bus as BusIcon,
  CheckCircle2,
  Wrench,
  XCircle,
  Archive,
  TrendingUp,
  X as LucideX,
  Image as PhotoIcon,
  FolderUp,
  AlertTriangle,
  FileText,
  Smartphone,
  Plus,
  Printer,
} from "lucide-react";
import {
  DS_pageTitle,
  DS_btnGold,
  DS_btnPrimary,
  DS_btnSecondary,
  DS_statCard,
  DS_statIcon,
  DS_statLabel,
  DS_statValue2,
} from "@/lib/DS";
import PrintReportHeader from "@/Components/PrintReportHeader";

// ─── Print CSS ──────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #bus-print-area, #bus-print-area * { visibility: visible !important; }
  #bus-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

// ─── Types ───────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  image?: string | null;
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
  bus_number: string;
  plate_number: string;
  model: string;
  year: number;
  capacity: number;
  type?: string;
  color?: string;
  status: "active" | "maintenance" | "out_of_service" | "inactive";
  front_qr: string | null;
  back_qr: string | null;
  school_id: number | null;
  driver_id: number | null;
  assistant_id: number | null;
  route_id: number | null;
  driver?: User;
  assistant?: User;
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
  availableAssistants: User[];
  schools: School[];
  routes: Route[];
}

// ─── Component ───────────────────────────────────────────────────

export default function Index({
  buses,
  counts,
  filters,
  availableDrivers,
  availableAssistants,
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
  const [photoPreviews, setPhotoPreviews] = useState<{ url: string; file: File }[]>([]);
  const [regPreview, setRegPreview] = useState<{ url: string; file: File; name: string } | null>(null);

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
    assistant_id: "",
    school_id: "",
    route_id: "",
    color: "",
    photos: [] as File[],
    registration_file: null as File | null,
  });
  const archiveForm = useForm({ deactivation_reason: "" });

  // --- Handlers ---
  const closeModal = () => {
    setModalState({ type: null, bus: null });
    busForm.reset();
    archiveForm.reset();
    setPhotoPreviews([]);
    setRegPreview(null);
  };

  const handlePhotoSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((f) => ({ url: URL.createObjectURL(f), file: f }));
    const merged = [...photoPreviews, ...newPreviews];
    setPhotoPreviews(merged);
    busForm.setData("photos", merged.map((p) => p.file));
  };

  const removePhotoPreview = (idx: number) => {
    const updated = photoPreviews.filter((_, i) => i !== idx);
    setPhotoPreviews(updated);
    busForm.setData("photos", updated.map((p) => p.file));
  };

  const handleRegFileSelect = (file: File | null) => {
    if (!file) { setRegPreview(null); busForm.setData("registration_file", null); return; }
    const url = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setRegPreview({ url, file, name: file.name });
    busForm.setData("registration_file", file);
  };

  const openModal = (type: "add" | "edit" | "view" | "archive", bus: Bus | null = null) => {
    setModalState({ type, bus });
    setPhotoPreviews([]);
    setRegPreview(null);
    if (type === "edit" && bus) {
      busForm.setData({
        plate_number: bus.plate_number,
        model: bus.model,
        year: bus.year,
        capacity: bus.capacity,
        status: bus.status as any,
        driver_id: (bus.driver as any)?.id?.toString() || (bus.driver as any)?.user_id?.toString() || "",
        assistant_id: bus.assistant_id?.toString() || "",
        school_id: bus.school_id?.toString() || "",
        route_id: bus.route_id?.toString() || "",
        color: bus.color || "",
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

    // Always use FormData to properly send files
    const formData = new FormData();
    const d = busForm.data;

    if (modalState.type === "edit") formData.append("_method", "put");
    formData.append("plate_number", d.plate_number);
    formData.append("model", d.model);
    formData.append("year", String(d.year));
    formData.append("capacity", String(d.capacity));
    formData.append("status", d.status);
    formData.append("driver_id", d.driver_id || "");
    formData.append("assistant_id", d.assistant_id || "");
    formData.append("school_id", d.school_id || "");
    formData.append("route_id", d.route_id || "");
    formData.append("color", d.color || "");
    if (d.photos && d.photos.length > 0) {
      d.photos.forEach((p) => formData.append("photos[]", p));
    }
    if (d.registration_file) formData.append("registration_file", d.registration_file);

    if (modalState.type === "add") {
      router.post(route("admin.buses.store"), formData as any, {
        forceFormData: true,
        onSuccess: closeModal,
      });
    } else if (modalState.type === "edit" && modalState.bus) {
      const bus = modalState.bus;
      router.post(route("admin.buses.update", bus.id), formData as any, {
        forceFormData: true,
        onSuccess: () => {
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
    const driverId = (currentDriver as any).user_id || (currentDriver as any).id;
    const alreadyIn = availableDrivers.some((d) => d.id === driverId);
    if (alreadyIn) return availableDrivers;
    // Normalize current driver to look like a User object for the dropdown
    return [{ ...currentDriver, id: driverId } as any, ...availableDrivers];
  }, [modalState, availableDrivers]);


  const editAssistantOptions = useMemo(() => {
    if (modalState.type !== "edit" || !modalState.bus) return availableAssistants;
    const currentAssistant = modalState.bus.assistant;
    if (!currentAssistant) return availableAssistants;
    const assistantId = currentAssistant.id;
    const alreadyIn = availableAssistants.some((s) => s.id === assistantId);
    return alreadyIn ? availableAssistants : [currentAssistant, ...availableAssistants];
  }, [modalState, availableAssistants]);

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
      columnHelper.accessor("bus_number", {
        header: isRTL ? "الحافلة" : "Vehicle",
        cell: (info) => {
          const bus = info.row.original;
          return (
            <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="flex-shrink-0 h-9 min-w-[2.5rem] px-2 rounded-lg bg-brand-yellow flex items-center justify-center text-brand-dark font-bold text-xs shadow-sm whitespace-nowrap">
                {bus.bus_number}
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <div className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"} font-mono`}>
                  {bus.plate_number}
                </div>
                <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} flex items-center gap-2`}>
                  {bus.color && (
                    <span 
                      className="w-2 h-2 rounded-full border border-gray-400/20" 
                      style={{ backgroundColor: bus.color }}
                      title={bus.color}
                    />
                  )}
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
                <span className={`font-bold ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "مشرفة:" : "S:"} </span>
                <span className={!bus.assistant ? "text-red-400 italic" : ""}>
                  {bus.assistant?.name || (isRTL ? "غير مسند" : "—")}
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

  const handlePrint = () => window.print();


  return (
    <AuthenticatedLayout>
      <Head title={isRTL ? "إدارة أسطول الحافلات" : "Bus Fleet Management"} />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area (hidden on screen, visible on print) ── */}
      <div id="bus-print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
        <PrintReportHeader
          title={isRTL ? "تقرير أسطول الحافلات" : "Bus Fleet Report"}
          schoolName={isRTL ? "إدارة شركة مسارات واصل" : "Masarat Wasel Company"}
          schoolLogo={null}
          printDate={`${isRTL ? "تاريخ الطباعة" : "Print Date"}: ${new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}`}
          schoolAdminText={isRTL ? "إدارة الشركة" : "Company Admin"}
        />
        {/* Print Table */}
        <div className="px-4">
          <table className="w-full border-collapse border border-gray-300 text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1.5 text-right font-bold w-8 text-black">#</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "رقم الحافلة" : "Bus No."}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "رقم اللوحة" : "Plate"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "الموديل / السنة" : "Model / Year"}</th>
                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{isRTL ? "السعة" : "Capacity"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "السائق" : "Driver"}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{isRTL ? "المسار" : "Route"}</th>
                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{isRTL ? "الحالة" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
              {buses.data.map((bus, i) => (
                <tr key={bus.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center text-gray-700 font-semibold">{i + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{bus.bus_number}</td>
                  <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{bus.plate_number}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{bus.model} {bus.year}</td>
                  <td className="border border-gray-300 p-1.5 text-center font-bold text-gray-800">{bus.capacity}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{bus.driver?.name || "—"}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{bus.route?.name || "—"}</td>
                  <td className="border border-gray-300 p-1.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                      bus.status === "active" ? "bg-gray-100 text-black border-gray-400"
                      : bus.status === "maintenance" ? "bg-gray-50 text-gray-600 border-gray-300"
                      : "bg-gray-50 text-gray-400 border-gray-200"
                    }`}>
                      {bus.status === "active" ? (isRTL ? "نشطة" : "Active")
                        : bus.status === "maintenance" ? (isRTL ? "صيانة" : "Maintenance")
                        : (isRTL ? "خارج الخدمة" : "Out of Service")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{isRTL ? "إجمالي الحافلات" : "Total Buses"}: {buses.data.length}</p>
            <p>{isRTL ? "توقيع مدير الشركة" : "Company Manager Signature"}: ............................</p>
          </div>
        </div>
      </div>

      <div className={`pb-8 space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>

        {/* ── Page Header (title only — matches school pages) ── */}
        <div className={isRTL ? "text-right" : "text-left"}>
          <h1 className={DS_pageTitle}>{isRTL ? "إدارة أسطول الحافلات" : "Bus Fleet Management"}</h1>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">
            {isRTL ? `إجمالي ${counts.all} حافلة في النظام` : `${counts.all} buses in the system`}
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: isRTL ? "إجمالي الحافلات" : "Total Buses",     value: counts.all,            icon: <BusIcon className="w-5 h-5" />,      accent: "navy"  as const },
            { label: isRTL ? "نشطة"            : "Active",           value: counts.active,         icon: <CheckCircle2 className="w-5 h-5" />, accent: "green" as const },
            { label: isRTL ? "في الصيانة"      : "Maintenance",      value: counts.maintenance,    icon: <Wrench className="w-5 h-5" />,       accent: "gold"  as const },
            { label: isRTL ? "خارج الخدمة"     : "Out of Service",   value: counts.out_of_service, icon: <XCircle className="w-5 h-5" />,      accent: "red"   as const },
          ].map((stat, i) => (
            <motion.div key={i} whileHover={{ y: -2 }} className={`${DS_statCard(stat.accent)} ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={DS_statIcon(stat.accent)}>{stat.icon}</div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className={DS_statLabel}>{stat.label}</p>
                <p className={DS_statValue2(stat.accent)}>{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <BaseDataTable<Bus>
            columns={columns}
            data={buses.data}
            pagination={pagination}
            exportEnabled={true}
            headerAction={
              <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button onClick={handlePrint} className={DS_btnSecondary}>
                  <Printer className="w-4 h-4" />
                  {isRTL ? "طباعة" : "Print"}
                </button>
                <button onClick={() => openModal("add")} className={DS_btnGold}>
                  <Plus className="w-4 h-4" />
                  {isRTL ? "تسجيل حافلة جديدة" : "Register New Bus"}
                </button>
              </div>
            }
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder={isRTL ? "بحث بالكود أو اللوحة أو السائق..." : "Search by code, plate, driver..."}
            filterTabs={filterTabs}
            activeFilter={filters.status}
            onFilterChange={handleFilterChange}
            emptyMessage={isRTL ? "لا توجد حافلات" : "No Buses Yet"}
            emptyDescription={
              isRTL
                ? "لم يتم تسجيل أي حافلة. ابدأ بإضافة أول حافلة."
                : "No buses registered. Start by adding your first bus."
            }
            emptyIcon={<BusIcon className="w-10 h-10" />}
            emptyAction={
              !filters.status || filters.status === "all"
                ? { label: isRTL ? "تسجيل حافلة جديدة" : "Register New Bus", onClick: () => openModal("add") }
                : undefined
            }
          />


          {/* ==================== MODALS ==================== */}

          {/* ──────────────────────────────────────────────────────────────────────── */}
          {/* View Modal — Premium Operational Dashboard */}
          {modalState.type === "view" && modalState.bus && (
            <Modal show={true} onClose={closeModal} maxWidth="4xl">
              <div className={`flex flex-col h-[90vh] ${isDark ? "bg-[#0f172a]" : "bg-white"} overflow-hidden shadow-2xl rounded-3xl relative`}>
                
                {/* ── Header Area ── */}
                <div className={`relative px-8 pt-10 pb-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 ${isDark ? "bg-gradient-to-br from-[#1e293b] to-[#0f172a]" : "bg-gradient-to-br from-brand-dark to-brand-navy"} text-white overflow-hidden`}>
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                  
                  <div className={`relative flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                    <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-brand-yellow border border-white/10">
                        {isRTL ? "مواصفات الأسطول الرقمي" : "Digital Fleet Specs"}
                      </span>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        modalState.bus.status === "active" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                      }`}>
                         {modalState.bus.status}
                      </div>
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter mb-4 drop-shadow-xl flex items-center gap-4 justify-center md:justify-start">
                      {modalState.bus.bus_number}
                      <span className="text-brand-yellow font-mono text-2xl opacity-80">{modalState.bus.plate_number}</span>
                    </h2>
                    <div className={`flex flex-wrap gap-4 justify-center md:justify-start ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-xs opacity-50 font-bold uppercase tracking-widest leading-none">Model:</span>
                        <span className="text-sm font-black whitespace-nowrap">{modalState.bus.model} {modalState.bus.year}</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                        <span className="text-xs opacity-50 font-bold uppercase tracking-widest leading-none">Seats:</span>
                        <span className="text-sm font-black whitespace-nowrap">{modalState.bus.capacity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Dual QR Code Passport */}
                  <div className={`flex gap-4 scrollbar-hide overflow-x-auto pb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                    {[
                      { id: 'front', label: isRTL ? 'الأمامي' : 'FRONT', path: modalState.bus.front_qr },
                      { id: 'back', label: isRTL ? 'الخلفي' : 'BACK', path: modalState.bus.back_qr }
                    ].map((qr) => (
                      <div key={qr.id} className="relative group shrink-0">
                        <div className="p-3 bg-white rounded-3xl shadow-xl transition-all duration-500 group-hover:scale-105 border border-white/20">
                          {qr.path ? (
                            <div className="flex flex-col items-center gap-2">
                              <img 
                                src={`/storage/${qr.path}?t=${new Date(modalState.bus!.updated_at || "").getTime()}`} 
                                className="w-24 h-24 object-contain" 
                                alt={`${qr.label} QR`} 
                              />
                              <div className="flex flex-col items-center gap-1 w-full">
                                <span className="text-[7px] font-black text-brand-dark opacity-40 uppercase tracking-widest">{qr.label}</span>
                                <a 
                                  href={`/storage/${qr.path}`} 
                                  download={`${modalState.bus!.bus_number}_${qr.id}_qr.png`}
                                  className="w-full py-1 bg-brand-dark/5 hover:bg-brand-dark/10 rounded-lg flex items-center justify-center transition-colors"
                                  title={isRTL ? "تنزيل" : "Download"}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FolderUp className="w-3 h-3 text-brand-dark opacity-60 rotate-180" />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="w-24 h-24 flex flex-col items-center justify-center gap-3 text-gray-300">
                              <Smartphone className="w-8 h-8 opacity-20 animate-pulse" />
                              <span className="text-[6px] font-black uppercase tracking-[0.2em] opacity-40 italic">Wait...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Dashboard Body ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Operational Alignment */}
                        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
                           {[
                             { title: isRTL ? "الطيار (السائق)" : "PILOT", name: modalState.bus.driver?.name, icon: "👨‍✈️", color: "amber", sub: isRTL ? "المشغل الرئيسي" : "Main Operator" },
                             { title: isRTL ? "مشرفة الحافلة" : "BUS SUPERVISOR", name: modalState.bus.assistant?.name, icon: "👩‍🏫", color: "rose", sub: isRTL ? "سلامة الركاب" : "Passenger Safety" },
                             { title: isRTL ? "الموقع (المدرسة)" : "LOCATION", name: modalState.bus.school?.name, icon: "🏫", color: "emerald", sub: modalState.bus.route?.name || (isRTL ? "في وضع الانتظار" : "Standby Route") },
                             { title: isRTL ? "لون الحافلة" : "VEHICLE COLOR", name: modalState.bus.color, icon: "🎨", color: "blue", sub: isRTL ? "المظهر الخارجي" : "Exterior Appearance" }
                           ].map(card => (
                         <div key={card.title} className={`p-4 rounded-[2rem] border transition-all ${isDark ? "bg-gray-800/40 border-gray-800 hover:bg-gray-800" : "bg-white border-gray-100 hover:shadow-lg shadow-sm"}`}>
                            <p className={`text-[9px] font-black mb-3 uppercase tracking-widest ${card.color === "amber" ? "text-amber-500" : card.color === "violet" ? "text-violet-500" : "text-emerald-500"}`}>{card.title}</p>
                            <div className="flex items-center gap-4">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isDark ? "bg-gray-700/50" : card.color === "amber" ? "bg-amber-50" : card.color === "violet" ? "bg-violet-50" : "bg-emerald-50"}`}>
                                 {card.icon}
                               </div>
                               <div>
                                  <p className={`text-sm font-black ${isDark ? "text-white" : "text-gray-900"}`}>{card.name || (isRTL ? "غير مسند" : "UNASSIGNED")}</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-0.5">{card.sub}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>

                    {/* Media Gallery */}
                    <div className="lg:col-span-12 space-y-8 mt-4">
                       <div className="flex items-center gap-3">
                          <span className="w-1.5 h-6 bg-brand-yellow rounded-full"></span>
                          <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {isRTL ? "الأصول والمستندات الرقمية" : "Digital Assets & Media"}
                          </h3>
                       </div>

                       {modalState.bus.documents?.length ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {modalState.bus.documents.filter(d => d.type === "registration").length > 0 && (
                              <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">📄 OFFICIAL DOCUMENTS</p>
                                <BusMediaGallery documents={modalState.bus.documents.filter(d => d.type === "registration")} isDark={isDark} />
                              </div>
                            )}
                            {modalState.bus.documents.filter(d => d.type === "photo").length > 0 && (
                              <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">📸 VEHICLE PHOTOS</p>
                                <BusMediaGallery documents={modalState.bus.documents.filter(d => d.type === "photo")} isDark={isDark} />
                              </div>
                            )}
                         </div>
                       ) : (
                         <div className={`p-10 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 ${isDark ? "bg-gray-900/40 border-gray-800 text-gray-600" : "bg-gray-50/50 border-gray-100 text-gray-400"}`}>
                            <div className="text-4xl opacity-20">📁</div>
                            <p className="text-[10px] font-black uppercase tracking-widest">No assets digitized yet</p>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className={`px-8 py-5 border-t flex items-center justify-between ${isDark ? "bg-[#0f172a] border-gray-800" : "bg-gray-50 border-gray-100"} flex-shrink-0`}>
                  <div className={`text-xs font-bold ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}>
                    ID: <span className="font-mono">{modalState.bus.id}</span>
                  </div>
                  <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <button
                      onClick={() => { closeModal(); openModal("edit", modalState.bus!); }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        isDark ? "bg-brand-yellow/10 text-brand-yellow hover:bg-brand-yellow/20" : "bg-brand-dark/5 text-brand-dark hover:bg-brand-dark/10"
                      }`}
                    >
                      {isRTL ? "✏️ تعديل" : "✏️ Edit"}
                    </button>
                    <button
                      onClick={closeModal}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        isDark
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {isRTL ? "إغلاق" : "Close"}
                    </button>
                  </div>
                </div>

              </div>
            </Modal>
          )}

          {/* Add/Edit Modal — Premium Professional Layout */}
          <Modal show={modalState.type === "add" || modalState.type === "edit"} onClose={closeModal} maxWidth="5xl">
            <div className={`flex flex-col h-[90vh] ${isDark ? "bg-[#111827]" : "bg-white"} overflow-hidden shadow-2xl rounded-2xl`}>

              {/* ── Header ── */}
              <div className={`px-8 py-6 bg-[#0f2044] flex items-center justify-between flex-shrink-0 text-white ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/10 text-brand-yellow">
                    <BusIcon className="w-6 h-6" />
                  </div>
                  <div className={isRTL ? "text-right" : ""}>
                    <h2 className="text-2xl font-bold text-white">
                      {modalState.type === "edit" ? (isRTL ? "تحديث بيانات الأسطول" : "Update Fleet Asset") : (isRTL ? "تسجيل أصل جديد" : "Register New Asset")}
                    </h2>
                    <p className="mt-1 text-sm text-blue-100">
                      {modalState.type === "edit" ? (isRTL ? "تعديل مواصفات الحافلة وتعيينات الطاقم" : "Modify vehicle specs and crew assignments") : (isRTL ? "إضافة حافلة جديدة لمنظومة النقل" : "Introduce a new vehicle to the transport system")}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={closeModal} className="p-2 transition-colors rounded-lg text-white/80 hover:text-white hover:bg-white/10">
                  <LucideX className="w-6 h-6" />
                </button>
              </div>

              {/* ── Body ── */}
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <form id="bus-form" onSubmit={submitBusForm} className="p-8 space-y-12">
                  
                  {/* Grid Container */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
                    
                    {/* Column 1: Core Specs */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-6 bg-brand-yellow rounded-full"></span>
                        <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {isRTL ? "المواصفات الجوهرية" : "Core Specifications"}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                         <div className={isRTL ? "text-right" : ""}>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "رقم الحافلة" : "Bus ID"}</label>
                          <input type="text" value={busForm.data.bus_number} disabled className={`w-full px-4 py-3 rounded-xl border text-sm font-bold ${isDark ? "bg-gray-800 border-gray-700 text-gray-500" : "bg-gray-50 border-gray-100 text-gray-400"}`} />
                        </div>
                        <div className={isRTL ? "text-right" : ""}>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "رقم اللوحة" : "License Plate"}</label>
                          <input type="text" value={busForm.data.plate_number} onChange={(e) => busForm.setData("plate_number", e.target.value.toUpperCase())} className={`w-full px-4 py-3 rounded-xl border text-sm font-mono font-black tracking-widest outline-none focus:ring-4 transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow/10 focus:border-brand-yellow" : "bg-white border-gray-200 focus:ring-brand-dark/5 focus:border-brand-dark"}`} />
                          {busForm.errors.plate_number && <p className="text-red-500 text-[10px] mt-1.5 font-bold uppercase">{busForm.errors.plate_number}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div className={isRTL ? "text-right" : ""}>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "الموديل" : "Manufacturer / Model"}</label>
                          <input type="text" value={busForm.data.model} onChange={(e) => busForm.setData("model", e.target.value)} className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:ring-4 transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow/10 focus:border-brand-yellow" : "bg-white border-gray-200 focus:ring-brand-dark/5 focus:border-brand-dark"}`} />
                        </div>
                        <div className={isRTL ? "text-right" : ""}>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "المقاعد" : "Capacity (Seats)"}</label>
                          <input type="number" value={busForm.data.capacity} onChange={(e) => busForm.setData("capacity", Number(e.target.value))} className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:ring-4 transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow/10 focus:border-brand-yellow" : "bg-white border-gray-200 focus:ring-brand-dark/5 focus:border-brand-dark"}`} />
                        </div>
                        <div className={isRTL ? "text-right" : ""}>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "لون الحافلة" : "Bus Color"}</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={busForm.data.color} 
                              onChange={(e) => busForm.setData("color", e.target.value)} 
                              placeholder={isRTL ? "أصفر، أبيض، #FFD700..." : "Yellow, White, #FFD700..."}
                              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:ring-4 transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow/10 focus:border-brand-yellow" : "bg-white border-gray-200 focus:ring-brand-dark/5 focus:border-brand-dark"}`} 
                            />
                            {busForm.data.color && (
                                <div 
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-400/20 shadow-sm"
                                    style={{ backgroundColor: busForm.data.color }}
                                />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={isRTL ? "text-right" : ""}>
                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "الحالة التشغيلية" : "Operational Status"}</label>
                        <div className={`grid grid-cols-2 gap-3 ${isRTL ? "rtl" : ""}`}>
                          {[
                            { val: "active", label: isRTL ? "نشط" : "Active", color: "bg-green-500" },
                            { val: "maintenance", label: isRTL ? "صيانة" : "Service", color: "bg-amber-500" },
                            { val: "inactive", label: isRTL ? "غير نشط" : "Idle", color: "bg-gray-400" },
                            { val: "out_of_service", label: isRTL ? "خارج الخدمة" : "Decommissioned", color: "bg-red-500" },
                          ].map(opt => (
                            <button key={opt.val} type="button" onClick={() => busForm.setData("status", opt.val as any)} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${busForm.data.status === opt.val ? "border-brand-yellow bg-brand-yellow/5" : "border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                              <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`}></span>
                              <span className={`text-[11px] font-black uppercase ${busForm.data.status === opt.val ? "text-brand-yellow" : "text-gray-500 dark:text-gray-400"}`}>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Assignment & Operations */}
                    <div className="space-y-8">
                       <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-6 bg-brand-navy rounded-full"></span>
                        <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {isRTL ? "تعيينات التشغيل" : "Operational Assignments"}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className={isRTL ? "text-right" : ""}>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "المدرسة" : "Educational Institution"}</label>
                          <select value={busForm.data.school_id} onChange={(e) => busForm.setData("school_id", e.target.value)} className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:ring-4 transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow/10 focus:border-brand-yellow" : "bg-white border-gray-200 focus:ring-brand-dark/5 focus:border-brand-dark"}`}>
                            <option value="">{isRTL ? "— بدون مدرسة —" : "— Unassigned —"}</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className={isRTL ? "text-right" : ""}>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "المسار" : "Strategic Route"}</label>
                          <select value={busForm.data.route_id || ""} onChange={(e) => busForm.setData("route_id", e.target.value)} className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:ring-4 transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow/10 focus:border-brand-yellow" : "bg-white border-gray-200 focus:ring-brand-dark/5 focus:border-brand-dark"}`}>
                            <option value="">{isRTL ? "— بدون مسار —" : "— Tactical Reserve —"}</option>
                            {routes.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className={isRTL ? "text-right" : ""}>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "السائق المعتمد" : "Certified Pilot (Driver)"}</label>
                          <select value={busForm.data.driver_id || ""} onChange={(e) => busForm.setData("driver_id", e.target.value)} className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:ring-4 transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow/10 focus:border-brand-yellow" : "bg-white border-gray-200 focus:ring-brand-dark/5 focus:border-brand-dark"}`}>
                            <option value="">{isRTL ? "— بدون سائق —" : "— Standby Mode —"}</option>
                            {(modalState.type === "edit" ? editDriverOptions : availableDrivers).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                        <div className={isRTL ? "text-right" : ""}>
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "مشرفة الحافلة" : "Bus Supervisor"}</label>
                           <select value={busForm.data.assistant_id || ""} onChange={(e) => busForm.setData("assistant_id", e.target.value)} className={`w-full px-4 py-3 rounded-xl border text-sm font-bold outline-none focus:ring-4 transition-all ${isDark ? "bg-gray-800 border-gray-700 text-white focus:ring-brand-yellow/10 focus:border-brand-yellow" : "bg-white border-gray-200 focus:ring-brand-dark/5 focus:border-brand-dark"}`}>
                            <option value="">{isRTL ? "— بدون مشرفة —" : "— No Supervisor —"}</option>
                            {(modalState.type === "edit" ? editAssistantOptions : availableAssistants).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="pt-6">
                        <InputLabel value={isRTL ? "المستندات والصور المرفقة" : "Documentation & Visual Assets"} />
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <label className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${isDark ? "border-gray-700 bg-gray-800/20 hover:bg-gray-800/50" : "border-gray-200 bg-gray-50/50 hover:bg-gray-100"}`}>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handlePhotoSelect(e.target.files)} />
                            <PhotoIcon className={`w-6 h-6 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500">{isRTL ? "صور الحافلة" : "Vehicle Photos"}</span>
                          </label>
                           <label className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${isDark ? "border-gray-700 bg-gray-800/20 hover:bg-gray-800/50" : "border-gray-200 bg-gray-50/50 hover:bg-gray-100"}`}>
                            <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleRegFileSelect(e.target.files?.[0] || null)} />
                            <FolderUp className={`w-6 h-6 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                            <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500">{isRTL ? "الاستمارة / PDF" : "Registry / PDF"}</span>
                          </label>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Attachment Preview Section */}
                  {(photoPreviews.length > 0 || regPreview) && (
                    <div className={`mt-8 p-6 rounded-3xl ${isDark ? "bg-gray-800/30" : "bg-gray-50/50"} border border-transparent`}>
                       <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{isRTL ? "معاينة الملفات المختارة" : "Attachment Inventory"}</h4>
                       <div className="flex flex-wrap gap-4">
                          {regPreview && (
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-brand-yellow shadow-lg group">
                              {regPreview.url ? <img src={regPreview.url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-[10px] font-bold">PDF</div>}
                              <button type="button" onClick={() => handleRegFileSelect(null)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><LucideX className="w-3 h-3" /></button>
                              <div className="absolute bottom-0 left-0 right-0 py-1 bg-brand-yellow text-brand-dark text-[8px] font-black text-center uppercase">Registry</div>
                            </div>
                          )}
                          {photoPreviews.map((p, idx) => (
                            <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                              <img src={p.url} className="w-full h-full object-cover" alt="" />
                              <button type="button" onClick={() => removePhotoPreview(idx)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><LucideX className="w-3 h-3" /></button>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                </form>
              </div>

              {/* ── Footer ── */}
              <div className={`px-8 py-6 border-t flex items-center justify-between flex-shrink-0 ${isDark ? "border-gray-800 bg-[#0f172a]" : "border-gray-100 bg-gray-50"} ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${busForm.processing ? "bg-brand-yellow animate-pulse" : "bg-green-500"}`}></div>
                  <span className={`text-[11px] font-black uppercase tracking-[0.1em] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    {busForm.processing ? (isRTL ? "جارِ مزامنة البيانات..." : "Syncing with Command Center") : (isRTL ? "جميع الأنظمة جاهزة" : "All Systems Nominal")}
                  </span>
                </div>
                <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <button type="button" onClick={closeModal} className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-tight transition-all ${isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}>
                    {isRTL ? "تجاهل" : "Dismiss"}
                  </button>
                  <button type="submit" form="bus-form" disabled={busForm.processing} className={`px-10 py-3 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 ${isDark ? "bg-brand-yellow text-brand-dark hover:shadow-yellow-500/10" : "bg-brand-dark text-white hover:bg-brand-navy shadow-brand-dark/20"}`}>
                    {busForm.processing ? (isRTL ? "جارِ الحفظ..." : "Processing...") : (modalState.type === "edit" ? (isRTL ? "تحديث السجل" : "Commit Records") : (isRTL ? "تشغيل الحافلة" : "Deploy Asset"))}
                  </button>
                </div>
              </div>
            </div>
          </Modal>




          {/* Archive Modal */}
          <Modal show={modalState.type === "archive"} onClose={closeModal}>
            <div className={`p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <AlertTriangle className="w-8 h-8" />
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
        </motion.div>
      </div>
    </AuthenticatedLayout>
  );
}

// ─── BusStatCard removed — replaced by DS.ts tokens inline ───────

