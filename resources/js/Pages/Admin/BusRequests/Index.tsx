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
import Modal from "@/Components/Modal";
import { createColumnHelper } from "@tanstack/react-table";
import { 
  Bus as BusIcon, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Trash2, 
  FileText, 
  Calendar,
  CheckCheck,
  Search,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  CreditCard
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
  capacity: number;
  driver_id: number | null;
  supervisor_id: number | null;
  driver?: { name: string };
  supervisor?: { name: string };
}

interface BusRequest {
  id: number;
  school_id: number;
  school: { id: number; name: string };
  request_type: string;
  requested_seats: number;
  start_date: string;
  end_date?: string;
  reason: string;
  special_requirements?: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  total_cost?: string | number;
  approved_by?: number;
  approvedBy?: { name: string };
  buses?: Bus[];
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

  const [search, setSearch] = useState(filters.search);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BusRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedBusIds, setSelectedBusIds] = useState<number[]>([]);
  const [totalCost, setTotalCost] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  // ── Actions ──
  const handleApprove = () => {
    if (selectedRequest && selectedBusIds.length > 0 && totalCost !== "") {
      router.post(
        route("admin.bus-requests.approve", selectedRequest.id),
        { bus_ids: selectedBusIds, total_cost: parseFloat(totalCost) },
        {
          onSuccess: () => {
            setShowApproveModal(false);
            setSelectedRequest(null);
            setSelectedBusIds([]);
            setTotalCost("");
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

  const totalSelectedCapacity = useMemo(() => {
    return availableBuses
      .filter((b) => selectedBusIds.includes(b.id))
      .reduce((sum, b) => sum + b.capacity, 0);
  }, [selectedBusIds, availableBuses]);

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
            <div
              className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-brand-yellow/10 flex items-center justify-center text-brand-dark`}>
                <CreditCard className="w-5 h-5" />
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
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
      columnHelper.accessor("requested_seats", {
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
          const isExpanded = expandedId === req.id;
          return (
            <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : req.id)}
                className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                title={isRTL ? "التفاصيل" : "Details"}
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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
    [isRTL, isDark, expandedId]
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
    <AuthenticatedLayout
      header={
        <h2 className={`font-bold text-xl ${isDark ? "text-gray-200" : "text-gray-800"}`}>
          {isRTL ? "إدارة طلبات الحافلات" : "Bus Requests Management"}
        </h2>
      }
    >
      <Head title={isRTL ? "طلبات الحافلات" : "Bus Requests"} />

      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <BaseDataTable<BusRequest>
            columns={columns}
            data={requests.data}
            pagination={pagination}
            title={isRTL ? "طلبات الحافلات" : "Bus Requests"}
            subtitle={
              isRTL
                ? `إدارة طلبات المدارس للحافلات الجديدة أو الصيانة`
                : `Manage school requests for new buses or maintenance`
            }
            exportEnabled={true}
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder={isRTL ? "بحث باسم المدرسة أو السبب..." : "Search by school or reason..."}
            filterTabs={filterTabs}
            activeFilter={filters.status}
            onFilterChange={handleFilterChange}
            emptyMessage={isRTL ? "لا توجد طلبات مطابقة." : "No requests found."}
            expandedRowId={expandedId}
            renderExpandedRow={(req) => (
              <div
                className={`my-4 p-6 rounded-2xl border ${
                  isDark ? "bg-gray-900/40 border-gray-700 shadow-xl" : "bg-white border-gray-100 shadow-sm"
                }`}
              >
                <div className={`space-y-6 ${isRTL ? "text-right" : "text-left"}`}>
                  <div className="flex justify-between items-center border-b pb-4 dark:border-gray-700">
                      <h4 className="font-bold text-lg flex items-center gap-2">
                          <Info className="w-5 h-5 text-brand-yellow" />
                          {isRTL ? "تفاصيل طلب التعيين" : "Request Details"}
                      </h4>
                      <div className="flex gap-4 text-xs font-bold text-gray-400">
                           <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(req.start_date).toLocaleDateString()}
                           </div>
                           {req.end_date && (
                              <div className="flex items-center gap-1">
                                  <span>→</span>
                                  {new Date(req.end_date).toLocaleDateString()}
                              </div>
                           )}
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{isRTL ? "السبب الرئيسي" : "Primary Reason"}</p>
                          <div className={`p-4 rounded-xl ${isDark ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-700"} border border-transparent hover:border-brand-yellow/30 transition-all`}>
                              {req.reason}
                          </div>
                      </div>

                      {req.special_requirements && (
                          <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{isRTL ? "متطلبات خاصة" : "Special Requirements"}</p>
                              <div className={`p-4 rounded-xl ${isDark ? "bg-brand-yellow/5 text-gray-300" : "bg-yellow-50 text-gray-700"} border border-dashed border-brand-yellow/40`}>
                                  {req.special_requirements}
                              </div>
                          </div>
                      )}
                  </div>

                  {req.status === "rejected" && req.rejection_reason && (
                      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                          <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">{isRTL ? "سبب الرفض" : "Rejection Reason"}</p>
                          <p className="text-sm dark:text-red-200">{req.rejection_reason}</p>
                      </div>
                  )}

                  {req.status === "approved" && (
                    <div className="mt-6 border-t pt-6 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-md text-[#0e7490] flex items-center gap-2">
                                <BusIcon className="w-5 h-5" />
                                {isRTL ? "الحافلات المُسندة للطلب" : "Assigned Buses"}
                            </h4>
                            <div className="bg-brand-yellow/10 border border-brand-yellow/30 px-4 py-2 rounded-xl text-center">
                                <p className="text-[10px] font-black uppercase text-brand-dark opacity-70 mb-0.5">{isRTL ? "التكلفة المُعتمدة" : "Approved Total Cost"}</p>
                                <p className="text-xl font-black text-brand-dark">
                                    {req.total_cost ? Number(req.total_cost).toLocaleString() : "0.00"} <span className="text-sm">SAR</span>
                                </p>
                            </div>
                        </div>

                        {req.buses && req.buses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {req.buses.map(bus => (
                                    <div key={bus.id} className={`p-4 rounded-xl border-l-4 border-[#0e7490] ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-sm">#{bus.bus_number}</span>
                                            <span className="font-mono text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">{bus.plate_number}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-3">
                                            <Users className="w-4 h-4" /> العتبة السعوية: {bus.capacity} مقعد
                                        </div>
                                        <div className="space-y-1 mt-2 border-t pt-2 dark:border-gray-700">
                                            <div className="flex items-center gap-2 text-xs">
                                                <UserCheck className="w-3.5 h-3.5 text-green-500" />
                                                <span className="font-bold opacity-70 w-12">{isRTL ? "السائق:" : "Driver:"}</span>
                                                <span className="text-gray-800 dark:text-gray-200">{bus.driver?.name || "---"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                                                <span className="font-bold opacity-70 w-12">{isRTL ? "المشرف:" : "Super:"}</span>
                                                <span className="text-gray-800 dark:text-gray-200">{bus.supervisor?.name || "---"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">{isRTL ? "لم يتم إسناد أية حافلات واضحة بعد." : "No specific buses assigned."}</p>
                        )}
                        
                        <div className="mt-4 flex items-center gap-2 text-xs opacity-60">
                            <span className="font-bold">{isRTL ? "تم الاعتماد بواسطة:" : "Approved by:"}</span> {req.approvedBy?.name || "---"} 
                            <span className="mx-2">•</span> 
                            {req.approved_at ? new Date(req.approved_at).toLocaleString() : ""}
                        </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          />
        </div>
      </div>

      {/* Approve Modal (Bus Assignment) */}
      <Modal show={showApproveModal} onClose={() => setShowApproveModal(false)} maxWidth="2xl">
        <div className={`${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"} rounded-2xl`}>
          <div className={`p-6 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              {isRTL ? "الموافقة وتعيين الحافلات" : "Approve & Assign Buses"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {isRTL ? `المدرسة: ${selectedRequest?.school.name} - مطلوب ${selectedRequest?.requested_seats} مقعد` : `School: ${selectedRequest?.school.name} - Requested ${selectedRequest?.requested_seats} seats`}
            </p>
          </div>

          <div className="p-6">
            <div className="mb-4 flex justify-between items-center bg-brand-yellow/10 p-4 rounded-xl border border-brand-yellow/30">
                <div className={isRTL ? "text-right" : "text-left"}>
                    <p className="text-xs font-bold text-brand-dark opacity-60 uppercase">{isRTL ? "المقاعد المختارة / المطلوبة" : "Selected / Requested Seats"}</p>
                    <p className="text-2xl font-black text-brand-dark">
                        <span className={totalSelectedCapacity >= (selectedRequest?.requested_seats || 0) ? "text-green-600" : "text-red-500"}>
                            {totalSelectedCapacity}
                        </span> 
                        <span className="text-lg text-gray-400 mx-1">/</span> 
                        {selectedRequest?.requested_seats || 0}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-brand-dark opacity-60 uppercase">{isRTL ? "الحافلات المختارة" : "Selected Buses"}</p>
                    <p className="text-2xl font-black text-brand-dark">{selectedBusIds.length}</p>
                </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {availableBuses.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                    <p>{isRTL ? "لا توجد حافلات متاحة في المستودع حالياً" : "No available buses in inventory"}</p>
                </div>
              ) : (
                availableBuses.map((bus) => {
                  const isSelected = selectedBusIds.includes(bus.id);
                  const hasCrew = bus.driver_id && bus.supervisor_id;
                  
                  return (
                    <div
                      key={bus.id}
                      onClick={() => {
                        setSelectedBusIds(prev => 
                          prev.includes(bus.id) ? prev.filter(id => id !== bus.id) : [...prev, bus.id]
                        );
                      }}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? "border-brand-yellow bg-brand-yellow/5" 
                          : isDark ? "border-gray-700 hover:border-gray-600" : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-brand-yellow border-brand-yellow" : "border-gray-300"}`}>
                           {isSelected && <CheckCheck className="w-4 h-4 text-brand-navy" />}
                        </div>
                        
                        <div className="flex-1">
                           <div className={`flex justify-between items-center mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                              <span className="font-bold text-sm">#{bus.bus_number} - {bus.plate_number}</span>
                              <span className="text-xs font-black bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {bus.capacity} {isRTL ? "مقعد" : "Seats"}
                              </span>
                           </div>
                           
                           <div className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-tight ${isRTL ? "flex-row-reverse" : ""}`}>
                                <div className={`flex items-center gap-1 ${bus.driver_id ? "text-green-500" : "text-red-500"}`}>
                                    {bus.driver_id ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                    {isRTL ? "طاقم السائق" : "Driver"}
                                </div>
                                <div className={`flex items-center gap-1 ${bus.supervisor_id ? "text-green-500" : "text-red-500"}`}>
                                    {bus.supervisor_id ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                    {isRTL ? "المشرفة" : "Supervisor"}
                                </div>
                                {!hasCrew && (
                                    <div className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[9px] flex items-center gap-1 animate-pulse">
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
            <div className="mt-4 pt-4 border-t border-brand-yellow/20">
              <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"} ${isRTL ? "text-right" : "text-left"}`}>
                {isRTL ? "التكلفة الإجمالية المطلوبة (بالريال)" : "Total Required Cost (SAR)"} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                placeholder="0.00"
                required
                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-brand-yellow/20 transition-all ${
                  isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-100 text-gray-800"
                }`}
              />
            </div>
          </div>

          <div className={`p-6 border-t ${isDark ? "border-gray-700" : "border-gray-200"} flex gap-3 ${isRTL ? "flex-row-reverse" : "justify-end"}`}>
            <button
                onClick={() => {
                    setShowApproveModal(false);
                    setSelectedBusIds([]);
                    setTotalCost("");
                }}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
            >
                {isRTL ? "إلغاء" : "Cancel"}
            </button>
            <button
                onClick={handleApprove}
                disabled={selectedBusIds.length === 0 || totalCost === ""}
                className={`px-8 py-2.5 bg-brand-yellow text-brand-dark font-black rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100`}
            >
                {isRTL ? "تأكيد وتعيين" : "Confirm & Assign"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <div className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-2xl`}>
          <div className={`p-6 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {isRTL ? "رفض الطلب" : "Reject Request"}
                </h3>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className={isRTL ? "text-right" : ""}>
              <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {isRTL ? "سبب الرفض" : "Rejection Reason"}
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-red-500/10 transition-all ${
                  isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-100 text-gray-800"
                }`}
                placeholder={isRTL ? "يرجى توضيح سبب الرفض هنا..." : "Please specify why the request is being rejected..."}
              />
            </div>

            <div className={`flex gap-3 pt-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"} ${isRTL ? "flex-row-reverse" : "justify-end"}`}>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionReason("");
                }}
                className={`px-5 py-2 rounded-xl font-bold transition-all ${isDark ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason}
                className="px-8 py-2 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {isRTL ? "تأكيد الرفض" : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
