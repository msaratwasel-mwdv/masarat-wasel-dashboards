import { Head, usePage } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import LiveTrackingMap from "@/Components/LiveTrackingMap";
import { motion } from "framer-motion";
import { Bus as BusIcon, CheckCircle2, Route } from "lucide-react";
import {
  DS_pageWrapper,
  DS_pageTitle,
  DS_statCard,
  DS_statIcon,
  DS_statLabel,
  DS_statValue,
  DS_card,
} from "@/lib/DS";

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
        <h2 className={DS_pageTitle}>
          {t("Live Tracking")}
        </h2>
      }
    >
      <Head title={t("Live Tracking")} />

      <div className="space-y-8">
        {/* Map Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="relative"
        >
          <LiveTrackingMap
            buses={buses}
            centerLat={schoolLocation.lat}
            centerLng={schoolLocation.lng}
          />
        </motion.div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
