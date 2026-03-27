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

// ─── Types ───────────────────────────────────────────────────────

interface BusRequest {
  id: number;
  school_id: number;
  school: { id: number; name: string };
  request_type: "permanent" | "temporary" | "field_trip";
  number_of_buses: number;
  start_date: string;
  end_date?: string;
  reason: string;
  special_requirements?: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
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
}

// ─── Page Component ──────────────────────────────────────────────

export default function Index({ auth, requests, counts, filters }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch] = useState(filters.search);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BusRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
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
  const handleApprove = (req: BusRequest) => {
    if (
      confirm(
        isRTL
          ? "هل أنت متأكد من الموافقة على هذا الطلب؟"
          : "Are you sure you want to approve this request?"
      )
    ) {
      router.post(route("admin.bus-requests.approve", req.id));
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
      ? { permanent: "دائم", temporary: "مؤقت", field_trip: "رحلة ميدانية" }
      : { permanent: "Permanent", temporary: "Temporary", field_trip: "Field Trip" };
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
              className={`${isRTL ? "text-right" : "text-left"} cursor-pointer`}
              onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
            >
              <div className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                {req.school.name}
              </div>
              <div className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {new Date(req.created_at).toLocaleDateString("ar-SA")}
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
      columnHelper.accessor("number_of_buses", {
        header: isRTL ? "العدد" : "Buses",
        cell: (info) => (
          <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("start_date", {
        header: isRTL ? "التاريخ" : "Date",
        cell: (info) => {
          const req = info.row.original;
          return (
            <div className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              <div>{new Date(req.start_date).toLocaleDateString()}</div>
              {req.end_date && (
                <div className={isDark ? "text-gray-500" : "text-gray-400"}>
                  → {new Date(req.end_date).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: isRTL ? "الحالة" : "Status",
        cell: (info) => (
          <StatusBadge
            label={statusLabel(info.getValue())}
            variant={statusVariant(info.getValue())}
          />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: isRTL ? "الإجراءات" : "Actions",
        cell: (info) => {
          const req = info.row.original;
          if (req.status !== "pending") return null;
          return (
            <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <ActionButton
                label={isRTL ? "قبول" : "Approve"}
                onClick={() => handleApprove(req)}
                color="green"
              />
              <ActionButton
                label={isRTL ? "رفض" : "Reject"}
                onClick={() => {
                  setSelectedRequest(req);
                  setShowRejectModal(true);
                }}
                color="red"
              />
            </div>
          );
        },
      }),
    ],
    [isRTL, isDark, expandedId]
  );

  // ── Pagination meta ──
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
                ? `${counts.all} طلب — ${counts.pending} معلّق — ${counts.approved} مقبول — ${counts.rejected} مرفوض`
                : `${counts.all} total — ${counts.pending} pending — ${counts.approved} approved — ${counts.rejected} rejected`
            }
            exportEnabled={true}
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder={isRTL ? "بحث باسم المدرسة أو السبب..." : "Search by school or reason..."}
            filterTabs={filterTabs}
            activeFilter={filters.status}
            onFilterChange={handleFilterChange}
            emptyMessage={isRTL ? "لا توجد طلبات مطابقة." : "No requests found."}
          />

          {/* Expanded Details — rendered below table row*/}
          {expandedId && requests.data.find((r) => r.id === expandedId) && (
            <div
              className={`mt-1 mb-4 mx-1 p-4 rounded-xl border ${
                isDark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"
              }`}
            >
              {(() => {
                const req = requests.data.find((r) => r.id === expandedId)!;
                return (
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm ${isRTL ? "text-right" : ""}`}>
                    <div className={`p-3 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                      <p className={`text-xs font-bold uppercase mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        {isRTL ? "السبب" : "Reason"}
                      </p>
                      <p className={isDark ? "text-gray-200" : "text-gray-800"}>{req.reason}</p>
                    </div>
                    {req.special_requirements && (
                      <div className={`p-3 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                        <p className={`text-xs font-bold uppercase mb-1 ${isDark ? "text-purple-400" : "text-purple-600"}`}>
                          {isRTL ? "متطلبات خاصة" : "Special Requirements"}
                        </p>
                        <p className={isDark ? "text-gray-200" : "text-gray-800"}>{req.special_requirements}</p>
                      </div>
                    )}
                    {req.rejection_reason && (
                      <div className={`p-3 rounded-xl border md:col-span-2 ${isDark ? "bg-red-900/20 border-red-900/30" : "bg-red-50 border-red-200"}`}>
                        <p className={`text-xs font-bold uppercase mb-1 ${isDark ? "text-red-400" : "text-red-600"}`}>
                          {isRTL ? "سبب الرفض" : "Rejection Reason"}
                        </p>
                        <p className={isDark ? "text-red-300" : "text-red-700"}>{req.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <div className={`${isDark ? "bg-gray-800" : "bg-white"}`}>
          <div className={`p-6 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {isRTL ? "رفض الطلب" : "Reject Request"}
                </h3>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {selectedRequest?.school.name}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className={isRTL ? "text-right" : ""}>
              <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {isRTL ? "سبب الرفض (اختياري)" : "Rejection Reason (Optional)"}
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 rounded-xl border-2 focus:ring-2 focus:ring-red-500 transition ${
                  isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-800"
                }`}
                placeholder={isRTL ? "اشرح سبب رفض الطلب..." : "Explain why this request was rejected..."}
              />
            </div>

            <div
              className={`flex gap-3 pt-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"} ${
                isRTL ? "flex-row-reverse" : "justify-end"
              }`}
            >
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionReason("");
                }}
                className={`px-5 py-2 rounded-xl font-semibold border-2 transition ${
                  isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleReject}
                className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-500/20"
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
