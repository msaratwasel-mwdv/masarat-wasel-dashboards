import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import BusModal from "@/Components/BusModal";
import BusRequestModal from "@/Components/BusRequestModal";
import LiveTrackingMap from "@/Components/LiveTrackingMap";

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
  capacity: number;
  type: "permanent" | "temporary";
  status: "active" | "maintenance" | "inactive";
  model?: string;
  year?: number;
  color?: string;
  driver?: { id: number; name: string };
  supervisor?: { id: number; name: string };
  students_count?: number;
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: string;
  trip_status?: "at_school" | "on_route" | "stopped" | "idle";
  route_id?: number | null;
}

interface BusRequest {
  id: number;
  request_type: string;
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
  buses: Bus[];
  requests: BusRequest[];
  routes: { id: number; name: string }[];
  schoolLocation: { lat: number; lng: number };
}

type TabType = "inventory" | "tracking" | "requests";

export default function BusesManagement({
  auth,
  buses,
  requests,
  routes = [],
  schoolLocation,
}: Props) {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabType>("inventory");
  const [showBusModal, setShowBusModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BusRequest | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "maintenance" | "inactive"
  >("all");
  const [selectedBuses, setSelectedBuses] = useState<number[]>([]);
  const [requestSearchQuery, setRequestSearchQuery] = useState("");

  // Filter buses
  const filteredBuses = buses.filter((bus) => {
    const matchesSearch =
      bus.bus_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.plate_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || bus.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const searchLower = requestSearchQuery.toLowerCase();
    return (
      t(request.request_type).toLowerCase().includes(searchLower) ||
      request.reason.toLowerCase().includes(searchLower) ||
      request.status.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const totalBuses = buses.length;
  const activeBuses = buses.filter((b) => b.status === "active").length;
  const maintenanceBuses = buses.filter(
    (b) => b.status === "maintenance"
  ).length;

  const handleAddBus = () => {
    setSelectedBus(null);
    setShowBusModal(true);
  };

  const handleEditBus = (bus: Bus) => {
    setSelectedBus(bus);
    setShowBusModal(true);
  };

  const handleDeleteBus = (busId: number) => {
    if (confirm(t("Are you sure you want to delete this bus?"))) {
      router.delete(route("school.buses.destroy", busId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedBuses.length === 0) return;
    if (confirm(t("Are you sure you want to delete the selected buses?"))) {
      router.post(
        route("school.buses.bulk-destroy"),
        {
          ids: selectedBuses,
        },
        {
          onSuccess: () => setSelectedBuses([]),
        }
      );
    }
  };

  const toggleBusSelection = (busId: number) => {
    setSelectedBuses((prev) =>
      prev.includes(busId)
        ? prev.filter((id) => id !== busId)
        : [...prev, busId]
    );
  };

  const toggleAllBuses = () => {
    if (selectedBuses.length === filteredBuses.length) {
      setSelectedBuses([]);
    } else {
      setSelectedBuses(filteredBuses.map((b) => b.id));
    }
  };

  const handleAddRequest = () => {
    setSelectedRequest(null);
    setShowRequestModal(true);
  };

  const handleEditRequest = (request: BusRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-3 py-1.5 text-xs font-bold rounded-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            ✅ {t("Active")}
          </span>
        );
      case "maintenance":
        return (
          <span className="px-3 py-1.5 text-xs font-bold rounded-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            🔧 {t("Maintenance")}
          </span>
        );
      case "inactive":
        return (
          <span className="px-3 py-1.5 text-xs font-bold rounded-[10px] bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            ⏸️ {t("Inactive")}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
          {t("Bus Management")} 🚌
        </h2>
      }
    >
      <Head title={t("Bus Management")} />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[30px] shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  {t("Total Buses")}
                </p>
                <h3 className="text-5xl font-extrabold mt-3 text-[#0e7490]">
                  {totalBuses}
                </h3>
              </div>
              <div className="w-16 h-16 bg-cyan-50 dark:bg-cyan-900/30 rounded-[20px] flex items-center justify-center">
                <span className="text-4xl text-[#0e7490]">🚌</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-[30px] shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  {t("Active")}
                </p>
                <h3 className="text-5xl font-extrabold mt-3 text-emerald-600">
                  {activeBuses}
                </h3>
              </div>
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-[20px] flex items-center justify-center">
                <span className="text-4xl text-emerald-600">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-[30px] shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  {t("Under Maintenance")}
                </p>
                <h3 className="text-5xl font-extrabold mt-3 text-orange-500">
                  {maintenanceBuses}
                </h3>
              </div>
              <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/30 rounded-[20px] flex items-center justify-center">
                <span className="text-4xl text-orange-500">🔧</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-[35px] shadow-sm p-3 inline-flex gap-2">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-8 py-3 rounded-[30px] font-bold transition-all ${activeTab === "inventory"
                ? "bg-[#0e7490] text-white shadow-lg"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
          >
            📋 {t("Bus Inventory")}
          </button>
          <button
            onClick={() => setActiveTab("tracking")}
            className={`px-8 py-3 rounded-[30px] font-bold transition-all ${activeTab === "tracking"
                ? "bg-[#0e7490] text-white shadow-lg"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
          >
            🗺️ {t("Live Tracking")}
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-8 py-3 rounded-[30px] font-bold transition-all ${activeTab === "requests"
                ? "bg-[#0e7490] text-white shadow-lg"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
          >
            📝 {t("Requests")}{" "}
            {requests.length > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Tab 1: Bus Inventory Table */}
          {activeTab === "inventory" && (
            <div>
              {/* Toolbar */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col xl:flex-row gap-6 items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-grow md:flex-grow-0 md:w-80">
                    <input
                      type="text"
                      placeholder={t("Search buses by number or plate...")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-[20px] bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                    />
                    <svg
                      className="w-5 h-5 text-gray-400 absolute left-4 top-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-6 py-3 border border-gray-200 dark:border-gray-600 rounded-[20px] bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] appearance-none pr-10"
                    >
                      <option value="all">{t("All Status")}</option>
                      <option value="active">{t("Active")}</option>
                      <option value="maintenance">{t("Maintenance")}</option>
                      <option value="inactive">{t("Inactive")}</option>
                    </select>
                  </div>
                </div>

                {/* Info note - no CRUD actions */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-[20px] text-sm text-blue-700 dark:text-blue-400 font-medium">
                  <span>ℹ️</span>
                  <span>
                    {t(
                      "Buses are assigned by the main admin. Use Requests tab to request changes."
                    )}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                      <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase">
                        {t("Bus Number")}
                      </th>
                      <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase">
                        {t("Plate Number")}
                      </th>
                      <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">
                        {t("Capacity")}
                      </th>
                      <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase">
                        {t("Driver / Supervisor")}
                      </th>
                      <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">
                        {t("Status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredBuses.map((bus) => (
                      <tr
                        key={bus.id}
                        className="group hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 dark:text-white text-lg">
                            {bus.bus_number}
                          </div>
                          <div className="text-xs text-gray-500">
                            {bus.model} {bus.year}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded inline-block">
                            {bus.plate_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-gray-900 dark:text-white text-lg">
                              {bus.students_count || 0} / {bus.capacity}
                            </span>
                            <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1 dark:bg-gray-700">
                              <div
                                className="bg-[#0e7490] h-1.5 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    ((bus.students_count || 0) / bus.capacity) *
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-400">👨‍✈️</span>
                              <span
                                className={
                                  bus.driver
                                    ? "text-gray-900 dark:text-white font-medium"
                                    : "text-gray-400 italic"
                                }
                              >
                                {bus.driver?.name || t("No Driver")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-400">👀</span>
                              <span
                                className={
                                  bus.supervisor
                                    ? "text-gray-900 dark:text-white font-medium"
                                    : "text-gray-400 italic"
                                }
                              >
                                {bus.supervisor?.name || t("No Supervisor")}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(bus.status)}
                        </td>
                      </tr>
                    ))}
                    {filteredBuses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="text-6xl mb-6 opacity-20">🔍</div>
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                            {t("No Buses Found")}
                          </h3>
                          <p className="text-gray-500">
                            {t("Try adjusting your search or filters")}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Live Tracking */}
          {activeTab === "tracking" && (
            <div className="h-[600px]">
              <LiveTrackingMap
                buses={buses}
                centerLat={schoolLocation.lat}
                centerLng={schoolLocation.lng}
              />
            </div>
          )}

          {/* Tab 3: Bus Requests Table */}
          {activeTab === "requests" && (
            <div>
              {/* Toolbar */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      {t("Bus Request History")}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t("Manage your transportation requests")}
                    </p>
                  </div>
                  <div className="relative w-80">
                    <input
                      type="text"
                      placeholder={t("Search requests...")}
                      value={requestSearchQuery}
                      onChange={(e) => setRequestSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-[20px] bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                    />
                    <svg
                      className="w-5 h-5 text-gray-400 absolute left-4 top-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={handleAddRequest}
                  className="px-8 py-3 bg-[#0e7490] text-white font-bold rounded-[20px] hover:bg-[#155e75] transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <span className="text-xl">➕</span>
                  {t("New Request")}
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                      <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase">
                        {t("Request Type")}
                      </th>
                      <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">
                        {t("Buses")}
                      </th>
                      <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase">
                        {t("Dates")}
                      </th>
                      <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase">
                        {t("Reason")}
                      </th>
                      <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">
                        {t("Status")}
                      </th>
                      <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">
                        {t("Actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredRequests.map((request) => (
                      <tr
                        key={request.id}
                        className="group hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900 dark:text-white capitalize">
                            {t(request.request_type)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-[10px] bg-blue-50 text-blue-700 font-bold">
                            🚌 {request.number_of_buses}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {t("Start")}: {request.start_date}
                          </div>
                          {request.end_date && (
                            <div className="text-xs text-gray-500">
                              {t("End")}: {request.end_date}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p
                            className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 max-w-xs"
                            title={request.reason}
                          >
                            {request.reason}
                          </p>
                          {request.special_requirements && (
                            <span className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                              ⚠️ {t("Special Requirements")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold capitalize inline-flex items-center gap-1 ${request.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : request.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                          >
                            {request.status === "pending" && "⏳"}
                            {request.status === "approved" && "✅"}
                            {request.status === "rejected" && "❌"}
                            {t(request.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {request.status === "pending" && (
                            <button
                              onClick={() => handleEditRequest(request)}
                              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-[12px] hover:bg-[#0e7490] hover:text-white font-bold text-xs transition-all"
                            >
                              ✏️ {t("Edit")}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <div className="text-6xl mb-6 opacity-20">📝</div>
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                            {t("No Requests Found")}
                          </h3>
                          <p className="text-gray-500">
                            {t(
                              requestSearchQuery
                                ? "No requests match your search"
                                : "Click New Request to submit one"
                            )}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bus Modal */}
      <BusModal
        show={showBusModal}
        onClose={() => {
          setShowBusModal(false);
          setSelectedBus(null);
        }}
        bus={selectedBus}
        routes={routes}
      />

      {/* Bus Request Modal */}
      <BusRequestModal
        show={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
    </SchoolAuthenticatedLayout>
  );
}
