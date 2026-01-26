import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// --- Fix for Leaflet Default Icons in React ---
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- Helper: Create Custom Colored Icon ---
const createCustomIcon = (color: string) => {
  return new L.DivIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 100%; height: 100%; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10], // Center it
  });
};

// --- Interfaces ---
interface DashboardProps {
  stats: {
    total_schools: number;
    total_students: number;
    buses: {
      total: number;
      available: number;
      booked: number;
      maintenance: number;
    };
    drivers: {
      total: number;
      available: number;
      booked: number;
    };
    supervisors: {
      total: number;
      available: number;
      booked: number;
    };
  };
  alerts: Array<{
    type: "warning" | "critical";
    category?: "bus" | "driver" | "general";
    message: string;
  }>;
  mapData: Array<{
    id: number;
    code: string;
    lat: number;
    lng: number;
    status: string;
    speed: string;
    school_id?: number;
  }>;
  filterSchools: Array<{ id: number; name: string }>;
  filterBuses: Array<{
    id: number;
    bus_code: string;
    plate_number: string;
    school_id: number;
  }>;
}

export default function Dashboard({
  stats,
  alerts,
  mapData,
  filterSchools,
  filterBuses,
}: DashboardProps) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  // --- States ---
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false); // Default OFF
  const [selectedSchool, setSelectedSchool] = useState<string>(""); // "" = All
  const [selectedBus, setSelectedBus] = useState<string>(""); // "" = All
  const [searchQuery, setSearchQuery] = useState("");

  // --- Filter Logic ---
  const filteredMapData = mapData.filter((bus) => {
    // 1. School Filter
    if (
      selectedSchool &&
      bus.school_id &&
      bus.school_id.toString() !== selectedSchool
    ) {
      return false;
    }
    // 2. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return bus.code.toLowerCase().includes(q);
    }
    return true;
  });

  // Center of Sana'a approximately
  const mapCenter: [number, number] = [15.3694, 44.191];

  return (
    <AuthenticatedLayout>
      <Head title={isRTL ? "لوحة التحكم" : "Dashboard"} />

      {/* --- 1. Welcome Header --- */}
      <div
        className={`flex ${
          isRTL ? "flex-row-reverse" : "flex-row"
        } justify-between items-start mb-8`}
      >
        <div className={isRTL ? "text-right" : "text-left"}>
          <h1
            className={`text-3xl font-black ${
              isDark ? "text-white" : "text-gray-900"
            } mb-2`}
          >
            {isRTL ? "مرحبًا، المدير العام" : "Welcome back, Admin"}
          </h1>
          <p className={`${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {isRTL
              ? "إليك ملخص الأداء المباشر للشبكة والأسطول."
              : "Here is your live network and fleet performance summary."}
          </p>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div
            className={`flex items-center px-4 py-2 rounded-full border shadow-sm ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {isRTL ? "حالة النظام: متصل" : "System Status: Online"}
            </span>
          </div>
        </div>
      </div>

      {/* --- 2. Comprehensive Stats Grid (5 Columns) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Schools */}
        <StatCard
          title={isRTL ? "المدارس" : "Schools"}
          value={stats.total_schools}
          icon="school"
          color="blue"
          isDark={isDark}
          isRTL={isRTL}
        />

        {/* Total Buses */}
        <StatCard
          title={isRTL ? "الحافلات" : "Buses"}
          value={stats.buses.total}
          icon="bus"
          color="yellow"
          isDark={isDark}
          isRTL={isRTL}
          details={[
            {
              label: isRTL ? "متوفر" : "Available",
              value: stats.buses.available,
              color: "text-green-500",
            },
            {
              label: isRTL ? "محجوز" : "Booked",
              value: stats.buses.booked,
              color: "text-blue-500",
            },
            {
              label: isRTL ? "صيانة" : "Maint.",
              value: stats.buses.maintenance,
              color: "text-red-500",
            },
          ]}
        />

        {/* Total Students */}
        <StatCard
          title={isRTL ? "الطلاب" : "Students"}
          value={stats.total_students}
          icon="academic"
          color="green"
          isDark={isDark}
          isRTL={isRTL}
        />

        {/* Total Drivers */}
        <StatCard
          title={isRTL ? "السائقين" : "Drivers"}
          value={stats.drivers.total}
          icon="driver"
          color="purple"
          isDark={isDark}
          isRTL={isRTL}
          details={[
            {
              label: isRTL ? "متوفر" : "Avail.",
              value: stats.drivers.available,
              color: "text-green-500",
            },
            {
              label: isRTL ? "محجوز" : "Booked",
              value: stats.drivers.booked,
              color: "text-blue-500",
            },
          ]}
        />

        {/* Total Supervisors */}
        <StatCard
          title={isRTL ? "المشرفين" : "Supervisors"}
          value={stats.supervisors.total}
          icon="supervisor"
          color="indigo"
          isDark={isDark}
          isRTL={isRTL}
          details={[
            {
              label: isRTL ? "متوفر" : "Avail.",
              value: stats.supervisors.available,
              color: "text-green-500",
            },
            {
              label: isRTL ? "محجوز" : "Booked",
              value: stats.supervisors.booked,
              color: "text-blue-500",
            },
          ]}
        />
      </div>

      {/* --- 3. Main Content: Map & Alerts (Split View) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* --- Column 1: Live Square Map (2/3 width) --- */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header & Controls Bar */}
          <div
            className={`p-4 rounded-xl border shadow-sm ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } flex flex-col md:flex-row gap-4 justify-between items-center`}
          >
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Live Toggle */}
              <button
                onClick={() => setIsTrackingEnabled(!isTrackingEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-sm ${
                  isTrackingEnabled
                    ? "bg-red-500 text-white shadow-red-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-full ${
                    isTrackingEnabled ? "bg-white animate-ping" : "bg-gray-400"
                  }`}
                ></span>
                {isTrackingEnabled
                  ? isRTL
                    ? "إيقاف التتبع"
                    : "Stop Tracking"
                  : isRTL
                  ? "تشغيل التتبع"
                  : "Start Tracking"}
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              {/* Schools Filter */}
              <select
                className={`text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 appearance-none py-2 px-3 ${
                  isRTL ? "text-right" : "text-left"
                }`}
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
              >
                <option value="">{isRTL ? "كل المدارس" : "All Schools"}</option>
                {filterSchools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Buses Search/Select */}
              <input
                type="text"
                placeholder={isRTL ? "بحث برقم الباص..." : "Search Bus Code..."}
                className="text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div
            className={`relative w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border transition-all ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            {!isTrackingEnabled && (
              <div className="absolute inset-0 z-[2000] bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <svg
                    className="w-10 h-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">
                  {isRTL ? "التتبع المباشر متوقف" : "Live Tracking is OFF"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                  {isRTL
                    ? "تم إيقاف الخريطة لتقليل استهلاك البيانات. اضغط 'تشغيل التتبع' أعلاه للمشاهدة الحية."
                    : "Map is disabled to save data. Click 'Start Tracking' above to view live fleet."}
                </p>
              </div>
            )}

            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={
                  isDark
                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                }
              />

              {/* Logic for markers */}
              {filteredMapData.map((bus) => (
                <Marker
                  key={bus.id}
                  position={[bus.lat, bus.lng]}
                  icon={createCustomIcon(
                    bus.status === "moving" ? "#22c55e" : "#ef4444"
                  )}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -20]}
                    opacity={1}
                    permanent
                    className="custom-tooltip"
                  >
                    <span className="font-bold text-xs">{bus.code}</span>
                  </Tooltip>
                  <Popup>
                    <div className={`text-center ${isRTL ? "rtl" : "ltr"}`}>
                      <strong className="block text-brand-dark">
                        {bus.code}
                      </strong>
                      <span className="text-xs text-gray-500">{bus.speed}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Simple Legend Overlay */}
            <div
              className={`absolute bottom-4 ${
                isRTL ? "right-4" : "left-4"
              } z-[1000] bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-2 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex gap-4 text-xs`}
            >
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-gray-700 dark:text-gray-300">
                  {isRTL ? "متحرك" : "Moving"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-gray-700 dark:text-gray-300">
                  {isRTL ? "متوقف" : "Stopped"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Column 2: Proactive Alerts (1/3 width) --- */}
        <div className="space-y-4">
          <h3
            className={`font-bold text-xl ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {isRTL ? "التنبيهات الاستباقية" : "Proactive Alerts"}
          </h3>

          <div
            className={`rounded-2xl border shadow-sm h-[500px] overflow-y-auto custom-scrollbar ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            {alerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  {isRTL ? "جميع الأنظمة تعمل بكفاءة" : "All systems normal"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {isRTL ? "لا توجد تنبيهات حالياً" : "No active alerts"}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-l-[6px] shadow-sm transform transition-all hover:scale-[1.02] ${
                      alert.type === "critical"
                        ? "bg-red-50 border-red-500 dark:bg-red-900/20"
                        : "bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`mt-1 ${
                          alert.type === "critical"
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`}
                      >
                        {alert.category === "bus" ? (
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                          </svg>
                        ) : alert.category === "driver" ? (
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                            />
                          </svg>
                        ) : (
                          // Default Fallback Icons
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            {alert.type === "critical" ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            )}
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h5
                          className={`font-bold text-sm ${
                            alert.type === "critical"
                              ? "text-red-800 dark:text-red-300"
                              : "text-yellow-800 dark:text-yellow-300"
                          }`}
                        >
                          {alert.type === "critical"
                            ? isRTL
                              ? "تنبيه هام جداً"
                              : "Critical Alert"
                            : isRTL
                            ? "تنبيه إداري"
                            : "Warning"}
                        </h5>
                        <p
                          className={`text-xs mt-1 leading-relaxed ${
                            alert.type === "critical"
                              ? "text-red-700 dark:text-red-400"
                              : "text-yellow-700 dark:text-yellow-400"
                          }`}
                        >
                          {alert.message}
                        </p>
                        <div className="mt-2 text-[10px] opacity-70 font-mono">
                          {isRTL
                            ? "المرجع: SYS-" + (idx + 101)
                            : "Ref: SYS-" + (idx + 101)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

// --- Helper Component for Stats ---
function StatCard({
  title,
  value,
  subValue,
  details,
  icon,
  color,
  isDark,
  isRTL,
}: {
  title: string;
  value: number | string;
  subValue?: string;
  details?: { label: string; value: number; color?: string }[];
  icon: string;
  color: string;
  isDark: boolean;
  isRTL: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl shadow-sm border transition-all hover:shadow-md ${
        isDark
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-100 hover:border-blue-100"
      }`}
    >
      <div
        className={`flex items-center justify-between mb-2 ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <div className="flex flex-col justify-center">
          <p
            className={`text-xs font-bold uppercase tracking-wider mb-1 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {title}
          </p>
          <p
            className={`text-2xl font-extrabold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {value}
          </p>
          {subValue && (
            <p
              className={`text-[10px] font-medium mt-1 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {subValue}
            </p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md bg-gradient-to-br`}
          style={{
            backgroundImage:
              color === "blue"
                ? "linear-gradient(to bottom right, #3b82f6, #2563eb)"
                : color === "green"
                ? "linear-gradient(to bottom right, #22c55e, #16a34a)"
                : color === "yellow"
                ? "linear-gradient(to bottom right, #eab308, #ca8a04)"
                : color === "purple"
                ? "linear-gradient(to bottom right, #a855f7, #9333ea)"
                : "linear-gradient(to bottom right, #6366f1, #4f46e5)", // Indigo default
          }}
        >
          {/* Icons */}
          {icon === "bus" && (
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          )}
          {icon === "school" && (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          )}
          {icon === "academic" && (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
              />
            </svg>
          )}
          {icon === "driver" && (
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {/* Steering Wheel / Driver Icon */}
              <circle
                cx="12"
                cy="12"
                r="3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
              />
            </svg>
          )}
          {icon === "users" && (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
          {icon === "supervisor" && (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Detailed Breakdown Section */}
      {details && details.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
          {details.map((item, idx) => (
            <div
              key={idx}
              className={`flex justify-between items-center text-xs font-medium ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                {item.label}
              </span>
              <span
                className={`${
                  item.color || (isDark ? "text-white" : "text-gray-800")
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
