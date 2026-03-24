import { Head, usePage } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import LiveTrackingMap from "@/Components/LiveTrackingMap";

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
  capacity: number;
  status: "active" | "maintenance" | "inactive";
  current_latitude?: number;
  current_longitude?: number;
  trip_status?: "at_school" | "on_route" | "stopped" | "idle";
  driver?: { id: number; name: string };
  students_count?: number;
}

interface Props {
  auth: any;
  buses: Bus[];
  schoolLocation: { lat: number; lng: number };
}

export default function LiveTracking({ auth, buses, schoolLocation }: Props) {
  const { t, isRtl } = useTranslation();

  const activeBuses = buses.filter((b) => b.status === "active").length;
  const onRouteBuses = buses.filter((b) => b.trip_status === "on_route").length;

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
          {isRtl ? "التتبع المباشر" : "Live Tracking"} 🗺️
        </h2>
      }
    >
      <Head title={isRtl ? "التتبع المباشر" : "Live Tracking"} />

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚌</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                {isRtl ? "إجمالي الحافلات" : "Total Buses"}
              </p>
              <p className="text-2xl font-extrabold text-[#0e7490] dark:text-cyan-400">
                {buses.length}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                {isRtl ? "نشطة" : "Active"}
              </p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {activeBuses}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🛣️</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                {isRtl ? "في الطريق" : "On Route"}
              </p>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {onRouteBuses}
              </p>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-[650px]">
            <LiveTrackingMap
              buses={buses}
              centerLat={schoolLocation.lat}
              centerLng={schoolLocation.lng}
            />
          </div>
        </div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
