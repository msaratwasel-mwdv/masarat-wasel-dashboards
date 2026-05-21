import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useTheme } from "@/Contexts/ThemeContext";
import BaseDataTable, {
  ActionButton,
  StatusBadge,
  type FilterTab,
  type PaginationMeta,
} from "@/Components/BaseDataTable";
import PrintReportHeader from "@/Components/PrintReportHeader";
import Modal from "@/Components/Modal";
import OmaniRial from "@/Components/OmaniRial";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Bus as BusIcon,
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
  FileText,
  Printer,
  Calendar,
  CheckCheck,
  Search,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  CreditCard,
  X
} from "lucide-react";
import {
  DS_pageWrapper,
  DS_statCard,
  DS_statIcon,
  DS_statLabel,
  DS_statValue,
  DS_modalContainer,
  DS_modalHeader,
  DS_modalHeaderTitle,
  DS_modalHeaderAccent,
  DS_modalClose,
  DS_modalBody,
  DS_inputCls,
  DS_labelCls,
  DS_submitBtn,
  DS_cancelBtn,
  DS_btnSecondary,
} from "@/lib/DS";
import { useRealtimeToast } from "@/hooks/useRealtimeToast";
import { useEchoEvent } from "@/hooks/useEcho";
import BusRequestInvoice from "@/Components/Reports/BusRequestInvoice";

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

interface Person {
  name: string;
  name_en?: string;
  first_name_ar?: string;
  last_name_ar?: string;
  first_name_en?: string;
  last_name_en?: string;
  email?: string;
}

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
  capacity: number;
  driver_id: number | null;
  assistant_id: number | null;
  driver?: Person;
  assistant?: Person;
}

interface BusRequest {
  id: number;
  school_id: number;
  school: { id: number; name: string };
  request_type: string;
  seats: number;
  start_date: string;
  end_date?: string;
  purpose: string;
  details?: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  cost?: string | number;
  bus?: Bus;
  approved_at?: string;
  created_at: string;
}

interface Props {
  auth: any;
  requests: {
    data: BusRequest[];
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
    pending: number;
    approved: number;
    rejected: number;
  };
  filters: {
    search: string;
    status: string;
  };
  availableBuses: Bus[];
}

// ─── Page Component ──────────────────────────────────────────────

export default function Index({ auth, requests, counts, filters, availableBuses }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";
  const { notifyEvent } = useRealtimeToast();

  const getCrewName = (person?: any) => {
    if (!person) return isRTL ? "غير معين" : "Not Assigned";
    const actualPerson = person.user || person;

    const nameAr = actualPerson.first_name_ar || actualPerson.last_name_ar
      ? `${actualPerson.first_name_ar || ""} ${actualPerson.last_name_ar || ""}`.trim()
      : actualPerson.name;

    const nameEn = actualPerson.first_name_en || actualPerson.last_name_en
      ? `${actualPerson.first_name_en || ""} ${actualPerson.last_name_en || ""}`.trim()
      : actualPerson.name_en;

    const email = actualPerson.email || "";

    if (isRTL) {
      return nameAr || nameEn || email || "غير معين";
    } else {
      return nameEn || nameAr || email || "Not Assigned";
    }
  };

  // Listen for real-time new bus requests
  useEchoEvent(
    'private',
    'admin.bus-requests',
    '.bus-request.created',
    (e: any) => {
      // Toast is now handled globally in AuthenticatedLayout
      router.reload({ only: ['requests', 'counts'], preserveState: true, preserveScroll: true } as any);
    }
  );

  const [search, setSearch] = useState(filters.search);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BusRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [cost, setCost] = useState<string>("");
  const [selectedInvoiceRequest, setSelectedInvoiceRequest] = useState<any | null>(null);

  // ── Server-side search (debounced via Inertia) ──
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.get(
          route("admin.bus-requests.index"),
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
      route("admin.bus-requests.index"),
      { search: filters.search, status: key === "all" ? undefined : key },
      { preserveState: true, replace: true }
    );
  };

  const handlePrint = () => window.print();

  // ── Actions ──
  const handleApprove = () => {
    if (selectedRequest && selectedBusId && cost !== "") {
      router.post(
        route("admin.bus-requests.approve", selectedRequest.id),
        { bus_id: selectedBusId, cost: parseFloat(cost) },
        {
          onSuccess: () => {
            setShowApproveModal(false);
            setSelectedRequest(null);
            setSelectedBusId(null);
            setCost("");
          },
        }
      );
    }
  };

  const handleReject = () => {
    if (selectedRequest) {
      router.post(
        route("admin.bus-requests.reject", selectedRequest.id),
        { rejection_reason: rejectionReason },
        {
          onSuccess: () => {
            setShowRejectModal(false);
            setSelectedRequest(null);
            setRejectionReason("");
          },
        }
      );
    }
  };

  // ── Helpers ──
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = isRTL
      ? { new_route: "مسار جديد", change_route: "تغيير مسار", maintenance: "صيانة", permanent: "دائم", temporary: "مؤقت", field_trip: "رحلة ميدانية" }
      : { new_route: "New Route", change_route: "Change Route", maintenance: "Maintenance", permanent: "Permanent", temporary: "Temporary", field_trip: "Field Trip" };
    return labels[type] || type;
  };

  const statusVariant = (s: string): "yellow" | "green" | "red" | "gray" => {
    if (s === "pending") return "yellow";
    if (s === "approved") return "green";
    if (s === "rejected") return "red";
    return "gray";
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = isRTL
      ? { pending: "معلّق", approved: "مقبول", rejected: "مرفوض" }
      : { pending: "Pending", approved: "Approved", rejected: "Rejected" };
    return map[s] || s;
  };

  const selectedBusCapacity = useMemo(() => {
    return availableBuses.find((b) => b.id === selectedBusId)?.capacity || 0;
  }, [selectedBusId, availableBuses]);

  // ── Filter tabs ──
  const filterTabs: FilterTab[] = [
    { key: "all", label: isRTL ? "الكل" : "All", count: counts.all },
    { key: "pending", label: isRTL ? "معلّق" : "Pending", count: counts.pending, dotColor: "bg-yellow-400" },
    { key: "approved", label: isRTL ? "مقبول" : "Approved", count: counts.approved, dotColor: "bg-green-400" },
    { key: "rejected", label: isRTL ? "مرفوض" : "Rejected", count: counts.rejected, dotColor: "bg-red-400" },
  ];

  // ── Column definitions ──
  const columnHelper = createColumnHelper<BusRequest>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("school.name", {
        header: isRTL ? "المدرسة" : "School",
        cell: (info) => {
          const req = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-brand-yellow/10 flex items-center justify-center text-brand-dark flex-shrink-0`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-start">
                <div className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {req.school.name}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  {new Date(req.created_at).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
                </div>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("request_type", {
        header: isRTL ? "النوع" : "Type",
        cell: (info) => (
          <StatusBadge label={getTypeLabel(info.getValue())} variant="blue" />
        ),
      }),
      columnHelper.accessor("seats", {
        header: isRTL ? "المقاعد" : "Seats",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-lg">💺</span>
            <span className={`text-sm font-black ${isDark ? "text-white" : "text-gray-900"}`}>
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: isRTL ? "الحالة" : "Status",
        cell: (info) => (
          <StatusBadge
            label={statusLabel(info.getValue())}
            variant={statusVariant(info.getValue())}
            className="font-bold"
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
          const req = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedInvoiceRequest(req)}
                className="p-2 bg-[#f5b800]/10 hover:bg-[#f5b800] text-[#7a5c00] dark:text-[#f5b800] dark:hover:text-[#0f2044] rounded-lg hover:shadow-sm transition-all"
                title={isRTL ? "التقرير الرسمي / الفاتورة" : "Official Report / Invoice"}
              >
                <Printer className="w-4.5 h-4.5" />
              </button>
              {req.status === "pending" && (
                <>
                  <button
                    onClick={() => {
                        setSelectedRequest(req);
                        setShowApproveModal(true);
                    }}
                    className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                    title={isRTL ? "قبول" : "Approve"}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setShowRejectModal(true);
                    }}
                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title={isRTL ? "رفض" : "Reject"}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          );
        },
      }),
    ],
    [isRTL, isDark]
  );

  const pagination: PaginationMeta = {
    links: requests.links,
    current_page: requests.current_page,
    last_page: requests.last_page,
    per_page: requests.per_page,
    total: requests.total,
    from: requests.from,
    to: requests.to,
  };

  return (
    <AuthenticatedLayout>
      <Head
        title={isRTL ? "إدارة طلبات الحافلات" : "Bus Requests Management"}
      />
      <style>{PRINT_STYLES}</style>

      {/* ── Print Area (hidden on screen, visible on print) ── */}
      <div
        id="bus-print-area"
        className="hidden print:block bg-white font-sans text-black w-full"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <PrintReportHeader
          title={isRTL ? "تقرير طلبات الحافلات" : "Bus Requests Report"}
          schoolName={
            isRTL ? "إدارة شركة مسارات واصل" : "Masarat Wasel Company"
          }
          schoolLogo={null}
          printDate={`${
            isRTL ? "تاريخ الطباعة" : "Print Date"
          }: ${new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`}
          schoolAdminText={isRTL ? "إدارة الشركة" : "Company Admin"}
        />
        {/* Print Table */}
        <div className="px-4">
          <table className="w-full border-collapse border border-gray-300 text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1.5 text-right font-bold w-8 text-black">
                  #
                </th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">
                  {isRTL ? "تاريخ الطلب" : "Request Date"}
                </th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">
                  {isRTL ? "المدرسة" : "School"}
                </th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">
                  {isRTL ? "السبب" : "Reason"}
                </th>
                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">
                  {isRTL ? "المقاعد" : "Seats"}
                </th>
                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">
                  {isRTL ? "تاريخ التعيين" : "Assigned Date"}
                </th>
                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">
                  {isRTL ? "الحالة" : "Status"}
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.data.map((req, i) => (
                <tr key={req.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center text-gray-700 font-semibold">
                    {i + 1}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-gray-700 font-mono">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className={`border border-gray-300 p-1.5 font-bold text-gray-900 ${isRTL ? "text-right" : "text-left"}`}>
                    {req.school.name}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">
                    {getTypeLabel(req.request_type)}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-center font-bold text-gray-800">
                    {req.seats}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-center text-gray-700 font-mono">
                    {req.approved_at
                      ? new Date(req.approved_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="border border-gray-300 p-1.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        req.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : req.status === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }`}
                    >
                      {statusLabel(req.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>
              {isRTL ? "إجمالي الطلبات" : "Total Requests"}:{" "}
              {requests.data.length}
            </p>
            <p>
              {isRTL ? "توقيع مدير الأسطول" : "Fleet Manager Signature"}:
              ............................
            </p>
          </div>
        </div>
      </div>

      <div
        className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 pt-6`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* ── Page Header (title only) ── */}
        <div className={isRTL ? "text-right mb-6" : "text-left mb-6"}>
          <h1 className="font-extrabold text-2xl text-[#0f2044] dark:text-white">
            {isRTL ? "إدارة طلبات الحافلات" : "Bus Requests Management"}
          </h1>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wider">
            {isRTL
              ? "تتبع وإدارة جميع طلبات المدارس الخاصة بالأسطول"
              : "Track and manage all school fleet requests"}
          </p>
        </div>
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className={DS_statCard("blue")}>
            <div className={DS_statIcon("blue")}>
              <FileText size={24} />
            </div>
            <div>
              <p className={DS_statLabel}>
                {isRTL ? "إجمالي الطلبات" : "Total Requests"}
              </p>
              <p className={DS_statValue}>{counts.all}</p>
            </div>
          </div>
          <div className={DS_statCard("gold")}>
            <div className={DS_statIcon("gold")}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className={DS_statLabel}>
                {isRTL ? "الطلبات المعلقة" : "Pending Requests"}
              </p>
              <p className={DS_statValue}>{counts.pending}</p>
            </div>
          </div>
          <div className={DS_statCard("green")}>
            <div className={DS_statIcon("green")}>
              <CheckCircle size={24} />
            </div>
            <div>
              <p className={DS_statLabel}>
                {isRTL ? "الطلبات المقبولة" : "Approved Requests"}
              </p>
              <p className={DS_statValue}>{counts.approved}</p>
            </div>
          </div>
          <div className={DS_statCard("red")}>
            <div className={DS_statIcon("red")}>
              <Trash2 size={24} />
            </div>
            <div>
              <p className={DS_statLabel}>
                {isRTL ? "الطلبات المرفوضة" : "Rejected Requests"}
              </p>
              <p className={DS_statValue}>{counts.rejected}</p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <BaseDataTable<BusRequest>
            columns={columns}
            data={requests.data}
            pagination={pagination}
            exportEnabled={true}
            headerAction={
              <button onClick={handlePrint} className={DS_btnSecondary}>
                <Printer className="w-4 h-4" />
                {isRTL ? "طباعة السجلات" : "Print Records"}
              </button>
            }
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder={
              isRTL
                ? "بحث باسم المدرسة أو السبب..."
                : "Search by school or reason..."
            }
            filterTabs={filterTabs}
            activeFilter={filters.status}
            onFilterChange={handleFilterChange}
            emptyMessage={
              isRTL ? "لا توجد طلبات مطابقة." : "No requests found."
            }
          />
        </div>
      </div>

      {/* Approve Modal (Bus Assignment) */}
      <Modal
        show={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        maxWidth="2xl"
      >
        <div
          className={`bg-white dark:bg-[#1a2845] w-full ${DS_modalContainer}`}
        >
          {/* Header */}
          <div className={DS_modalHeader(isRTL)}>
            <div className="flex items-center gap-3">
              <div className={DS_modalHeaderAccent} />
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#f5b800]" />
                <h2 className={DS_modalHeaderTitle}>
                  {isRTL ? "الموافقة وتعيين الحافلة" : "Approve & Assign Bus"}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowApproveModal(false)}
              className={DS_modalClose}
            >
              <X size={20} />
            </button>
          </div>

          <div className={DS_modalBody}>
            <p className="text-sm font-bold text-[#0f2044]/60 dark:text-[#7ba7e8]/60 px-2 mb-4">
              {isRTL
                ? `المدرسة: ${selectedRequest?.school.name} - مطلوب ${selectedRequest?.seats} مقعد`
                : `School: ${selectedRequest?.school.name} - Requested ${selectedRequest?.seats} seats`}
            </p>

            <div className="mb-4 flex justify-between items-center bg-[#f5b800]/10 p-4 rounded-[20px] border border-[#f5b800]/30">
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className="text-[10px] font-bold text-[#0f2044]/60 dark:text-[#7ba7e8]/60 uppercase">
                  {isRTL
                    ? "سعة الحافلة المختارة / المطلوبة"
                    : "Bus Capacity / Requested Seats"}
                </p>
                <p className="text-2xl font-black text-[#0f2044] dark:text-white mt-1">
                  <span
                    className={
                      selectedBusCapacity >= (selectedRequest?.seats || 0)
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }
                  >
                    {selectedBusCapacity}
                  </span>
                  <span className="text-lg text-gray-400 dark:text-gray-600 mx-1">
                    /
                  </span>
                  {selectedRequest?.seats || 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[#0f2044]/60 dark:text-[#7ba7e8]/60 uppercase">
                  {isRTL ? "حالة الاختيار" : "Selection Status"}
                </p>
                <p className="text-xl font-black text-[#0f2044] dark:text-white mt-1">
                  {selectedBusId
                    ? isRTL
                      ? "محددة"
                      : "Selected"
                    : isRTL
                    ? "غير محددة"
                    : "None"}
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {availableBuses.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-[#0f2044] dark:text-[#7ba7e8]" />
                  <p className="font-bold text-[#0f2044] dark:text-[#7ba7e8]">
                    {isRTL
                      ? "لا توجد حافلات متاحة في المستودع حالياً"
                      : "No available buses in inventory"}
                  </p>
                </div>
              ) : (
                availableBuses.map((bus) => {
                  const hasCrew = bus.driver_id && bus.assistant_id;

                  return (
                    <div
                      key={bus.id}
                      onClick={() => setSelectedBusId(bus.id)}
                      className={`p-4 rounded-[16px] border-2 transition-all cursor-pointer ${
                        selectedBusId === bus.id
                          ? "border-[#f5b800] bg-[#f5b800]/5"
                          : "border-[#0f2044]/10 dark:border-[#243460] bg-white dark:bg-[#1a2845] hover:border-[#f5b800]/50"
                      }`}
                    >
                      <div
                        className="flex items-center gap-4"
                      >
                        <div
                          className={`w-6 h-6 rounded-[8px] border-2 flex items-center justify-center transition-colors ${
                            selectedBusId === bus.id
                              ? "bg-[#f5b800] border-[#f5b800]"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {selectedBusId === bus.id && (
                            <CheckCheck className="w-4 h-4 text-[#0f2044]" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div
                            className="flex justify-between items-center mb-1"
                          >
                            <span className="font-bold text-sm text-[#0f2044] dark:text-white">
                              #{bus.bus_number} - {bus.plate_number}
                            </span>
                            <span className="text-xs font-black bg-[#0f2044]/10 dark:bg-[#0f2044]/40 text-[#0f2044] dark:text-white px-2.5 py-1 rounded-[10px]">
                              {bus.capacity} {isRTL ? "مقعد" : "Seats"}
                            </span>
                          </div>

                          <div
                            className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-bold uppercase tracking-tight mt-2 text-start"
                          >
                            <div
                              className={`flex items-center gap-1 ${
                                bus.driver_id
                                  ? "text-emerald-500"
                                  : "text-rose-500"
                              }`}
                            >
                              {bus.driver_id ? (
                                <UserCheck className="w-3 h-3 flex-shrink-0" />
                              ) : (
                                <UserX className="w-3 h-3 flex-shrink-0" />
                              )}
                              <span>
                                {isRTL ? "السائق:" : "Driver:"}{" "}
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  {getCrewName(bus.driver)}
                                </span>
                              </span>
                            </div>
                            <div
                              className={`flex items-center gap-1 ${
                                bus.assistant_id
                                  ? "text-emerald-500"
                                  : "text-rose-500"
                              }`}
                            >
                              {bus.assistant_id ? (
                                <UserCheck className="w-3 h-3 flex-shrink-0" />
                              ) : (
                                <UserX className="w-3 h-3 flex-shrink-0" />
                              )}
                              <span>
                                {isRTL ? "المشرفة:" : "Supervisor:"}{" "}
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  {getCrewName(bus.assistant)}
                                </span>
                              </span>
                            </div>
                            {!hasCrew && (
                              <div className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-[8px] text-[9px] flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {isRTL ? "طاقم غير مكتمل" : "Missing Crew"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#243460]">
              <label className={DS_labelCls}>
                {isRTL ? "التكلفة المطلوبة" : "Required Cost"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1 flex items-center w-full rounded-[20px] border border-[#f5b800]/40 focus-within:border-[#f5b800] focus-within:ring-2 focus-within:ring-[#f5b800]/20 bg-white dark:bg-[#152039] overflow-hidden shadow-inner transition-all h-12">
                {isRTL ? (
                  <>
                    <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 px-4 h-full border-r border-gray-100 dark:border-gray-800 flex-shrink-0">
                      <OmaniRial className="w-5 h-5" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                      required
                      className="block w-full bg-transparent border-0 outline-none focus:ring-0 text-right pr-4 pl-4 font-extrabold text-base text-gray-900 dark:text-white h-full"
                    />
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                      required
                      className="block w-full bg-transparent border-0 outline-none focus:ring-0 text-left pl-4 pr-4 font-extrabold text-base text-gray-900 dark:text-white h-full"
                    />
                    <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 px-4 h-full border-l border-gray-100 dark:border-gray-800 flex-shrink-0">
                      <OmaniRial className="w-5 h-5" />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div
              className={`pt-4 flex gap-3 ${
                isRTL ? "flex-row-reverse" : "justify-end"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedBusId(null);
                  setCost("");
                }}
                className={DS_cancelBtn}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={!selectedBusId || cost === ""}
                className={DS_submitBtn(!selectedBusId || cost === "")}
              >
                {isRTL ? "تأكيد وتعيين" : "Confirm & Assign"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <div
          className={`bg-white dark:bg-[#1a2845] w-full ${DS_modalContainer}`}
        >
          {/* Header */}
          <div className={DS_modalHeader(isRTL)}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-red-500 rounded-full flex-shrink-0" />
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                <h2 className={DS_modalHeaderTitle}>
                  {isRTL ? "رفض الطلب" : "Reject Request"}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRejectModal(false)}
              className={DS_modalClose}
            >
              <X size={20} />
            </button>
          </div>

          <div className={DS_modalBody}>
            <div className={isRTL ? "text-right" : ""}>
              <label className={DS_labelCls}>
                {isRTL ? "سبب الرفض" : "Rejection Reason"}
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className={DS_inputCls}
                placeholder={
                  isRTL
                    ? "يرجى توضيح سبب الرفض هنا..."
                    : "Please specify why the request is being rejected..."
                }
              />
            </div>

            <div
              className={`flex gap-3 pt-4 border-t border-gray-100 dark:border-[#243460] ${
                isRTL ? "flex-row-reverse" : "justify-end"
              }`}
            >
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionReason("");
                }}
                className={DS_cancelBtn}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason}
                className="px-6 py-2.5 rounded-[14px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold shadow hover:bg-red-100 dark:hover:bg-red-900/30 transition-all disabled:opacity-50"
              >
                {isRTL ? "تأكيد الرفض" : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Print/Invoice Preview Modal */}
      <BusRequestInvoice
        show={!!selectedInvoiceRequest}
        onClose={() => setSelectedInvoiceRequest(null)}
        request={selectedInvoiceRequest}
        isRtl={isRTL}
        schoolName={selectedInvoiceRequest?.school?.name}
      />
    </AuthenticatedLayout>
  );
}
