import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import BusModal from "@/Components/BusModal";
import { motion } from "framer-motion";
import { 
  Bus as BusIcon, 
  CheckCircle2, 
  Wrench, 
  Search, 
  Map, 
  User, 
  Users, 
  Car, 
  MapPin, 
  Edit 
} from "lucide-react";
import {
  DS_pageWrapper,
  DS_pageTitle,
  DS_statCard,
  DS_statIcon,
  DS_statLabel,
  DS_statValue,
  DS_card,
  DS_sectionHeader,
  DS_searchInput,
  DS_tableWrapper,
  DS_tableBase,
  DS_tableHead,
  DS_tableRow,
  DS_tableTh,
  DS_tableTd,
  DS_btnEdit,
} from "@/lib/DS";

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
  assistant?: { id: number; name: string };
  field_supervisor?: { id: number; name: string };
  students_count?: number;
  latitude?: number;
  longitude?: number;
  last_location_update?: string;
  trip_status?: "at_school" | "on_route" | "stopped" | "idle";
  route_id?: number | null;
  route?: { id: number; name: string; code?: string };
}

interface Props {
  auth: any;
  buses: Bus[];
  routes: { id: number; name: string }[];
  schoolLocation: { lat: number; lng: number };
}

type TabType = "inventory";

export default function BusesManagement({
  auth,
  buses = [],
  routes = [],
  schoolLocation,
}: Props) {
  const { t, isRtl } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabType>("inventory");
  const [showBusModal, setShowBusModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "maintenance" | "inactive"
  >("all");
  const [selectedBuses, setSelectedBuses] = useState<number[]>([]);

  // Filter buses
  const filteredBuses = (buses || []).filter((bus) => {
    const s = searchQuery?.toLowerCase() || "";
    const matchesSearch =
      (bus.bus_number?.toLowerCase() || "").includes(s) ||
      (bus.plate_number?.toLowerCase() || "").includes(s);
    const matchesStatus = statusFilter === "all" || bus.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalBuses = buses.length;
  const activeBuses = buses.filter((b) => b.status === "active").length;
  const maintenanceBuses = buses.filter(
    (b) => b.status === "maintenance"
  ).length;

  const handleEditBus = (bus: Bus) => {
    setSelectedBus(bus);
    setShowBusModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            {t("Active")}
          </span>
        );
      case "maintenance":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-[8px] bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
            {t("Maintenance")}
          </span>
        );
      case "inactive":
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-[8px] bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            {t("Inactive")}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={<h2 className={DS_pageTitle}>{t("Bus Management")}</h2>}
    >
      <Head title={t("Bus Management")} />

      <div className={DS_pageWrapper}>
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            {
              label: t("Total Buses"),
              val: totalBuses,
              icon: <BusIcon className="w-5 h-5" />,
              accent: "navy" as const,
            },
            {
              label: t("Active"),
              val: activeBuses,
              icon: <CheckCircle2 className="w-5 h-5" />,
              accent: "gold" as const,
            },
            {
              label: t("Under Maintenance"),
              val: maintenanceBuses,
              icon: <Wrench className="w-5 h-5" />,
              accent: "red" as const,
            },
          ].map((s, idx) => (
            <div key={idx} className={DS_statCard(s.accent)}>
              <div className={DS_statIcon(s.accent)}>{s.icon}</div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <p className={DS_statLabel}>{s.label}</p>
                <p className={DS_statValue}>{s.val}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={DS_card}
        >
          {/* Header Toolbar */}
          <div className={DS_sectionHeader(isRtl)}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#f5b800]/10 dark:bg-[#f5b800]/20 flex items-center justify-center text-[#b38600] flex-shrink-0">
                <Car className="w-6 h-6" />
              </div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <h3 className="text-xl font-bold text-[#0f2044] dark:text-white">
                  {t("Fleet Inventory")}
                </h3>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search
                  className={`absolute ${
                    isRtl ? "right-4" : "left-4"
                  } top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`}
                />
                <input
                  type="text"
                  placeholder={t("Search buses by number or plate...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${DS_searchInput} ${
                    isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
                  }`}
                  dir={isRtl ? "rtl" : "ltr"}
                />
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={`${DS_searchInput} cursor-pointer appearance-none ${
                    isRtl ? "pl-10" : "pr-10"
                  }`}
                >
                  <option value="all">{t("All Status")}</option>
                  <option value="active">{t("Active")}</option>
                  <option value="maintenance">{t("Maintenance")}</option>
                  <option value="inactive">{t("Inactive")}</option>
                </select>
                <div
                  className={`absolute ${
                    isRtl ? "left-4" : "right-4"
                  } top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {activeTab === "inventory" && (
            <div className={DS_tableWrapper}>
              <table className={DS_tableBase}>
                <thead className={DS_tableHead}>
                  <tr>
                    <th className={DS_tableTh(isRtl)}>{t("Bus Number")}</th>
                    <th className={DS_tableTh(isRtl)}>{t("Plate Number")}</th>
                    <th className={DS_tableTh(isRtl) + " text-center"}>
                      {t("Capacity")}
                    </th>
                    <th className={DS_tableTh(isRtl)}>{t("Route")}</th>
                    <th className={DS_tableTh(isRtl)}>{t("Crew")}</th>
                    <th className={DS_tableTh(isRtl) + " text-center"}>
                      {t("Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuses.map((bus, index) => (
                    <tr
                      key={bus.id || `bus-${index}`}
                      className={DS_tableRow}
                    >
                      <td className={DS_tableTd}>
                        <div className="font-bold text-[#0f2044] dark:text-white text-base">
                          {bus.bus_number}
                        </div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {bus.model} {bus.year}
                        </div>
                      </td>
                      <td className={DS_tableTd}>
                        <div className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-300 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 px-2 py-1 rounded-[6px] inline-block">
                          {bus.plate_number}
                        </div>
                      </td>
                      <td className={DS_tableTd}>
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-bold text-[#0f2044] dark:text-white text-sm">
                            {bus.students_count || 0} / {bus.capacity}
                          </span>
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className="bg-[#f5b800] dark:bg-[#f5b800] h-1.5 rounded-full"
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
                      <td className={DS_tableTd}>
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {bus.route?.name ? (
                            <span className="flex items-center gap-1.5 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8] px-2.5 py-1 rounded-[8px] text-xs font-bold w-fit">
                              <MapPin className="w-3.5 h-3.5" />
                              {bus.route.name}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              {t("Unassigned")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={DS_tableTd}>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span
                              className={
                                bus.driver
                                  ? "text-[#0f2044] dark:text-gray-200 font-bold"
                                  : "text-gray-400 italic font-semibold"
                              }
                            >
                              {bus.driver?.name || t("No Driver")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span
                              className={
                                bus.assistant
                                  ? "text-[#0f2044] dark:text-gray-200 font-bold"
                                  : "text-gray-400 italic font-semibold"
                              }
                            >
                              {bus.assistant?.name || t("No Assistant")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={DS_tableTd}>
                        <div className={`flex items-center gap-2 ${isRtl ? "justify-start" : "justify-end"}`}>
                          {getStatusBadge(bus.status)}
                          <button
                            onClick={() => handleEditBus(bus)}
                            className={DS_btnEdit}
                          >
                            {t("Assign Route")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredBuses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-[#0f2044]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BusIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-[#0f2044] dark:text-white mb-1">
                          {t("No Buses Found")}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {t("Try adjusting your search or filters")}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
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
    </SchoolAuthenticatedLayout>
  );
}
