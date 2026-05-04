import React, { useState, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import LiveTrackingMap from "@/Components/LiveTrackingMap";
import { motion } from "framer-motion";
import { Bus as BusIcon, CheckCircle2, Route } from "lucide-react";

declare global {
  interface Window {
    Echo: any;
  }
}

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
  const [liveBuses, setLiveBuses] = useState<Bus[]>(buses);

  useEffect(() => {
    // Re-initialize if props change
    setLiveBuses(buses);
  }, [buses]);

  useEffect(() => {
    if (!window.Echo) return;

    // Listen to each bus
    liveBuses.forEach((bus) => {
      window.Echo.private(`bus.${bus.id}`)
        .listen('.bus.location.updated', (e: any) => {
          setLiveBuses((prev) =>
            prev.map((b) => {
              if (b.id === e.bus_id) {
                return {
                  ...b,
                  current_latitude: e.latitude,
                  current_longitude: e.longitude,
                  trip_status: e.trip_status,
                  students_count: e.students_on_board ?? b.students_count,
                };
              }
              return b;
            })
          );
        });
    });

    return () => {
      if (!window.Echo) return;
      liveBuses.forEach((bus) => {
        window.Echo.leave(`bus.${bus.id}`);
      });
    };
  }, [buses]);

  const activeBuses = liveBuses.filter((b) => b.status === "active").length;
  const onRouteBuses = liveBuses.filter((b) => b.trip_status === "on_route").length;

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
            buses={liveBuses}
            centerLat={schoolLocation.lat}
            centerLng={schoolLocation.lng}
          />
        </motion.div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
