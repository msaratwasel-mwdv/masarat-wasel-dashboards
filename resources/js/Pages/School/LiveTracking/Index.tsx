import React, { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import LiveTrackingMap from "@/Components/LiveTrackingMap";

declare global {
  interface Window {
    Echo: any;
  }
}

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
  capacity: number;
  status: "active" | "maintenance" | "inactive";
  latitude?: number;
  longitude?: number;
  current_latitude?: number;
  current_longitude?: number;
  trip_status?: "at_school" | "on_route" | "stopped" | "idle" | string;
  driver?: { id: number; name: string };
  students_count?: number;
}

interface Props {
  auth: any;
  buses: Bus[];
  schoolLocation: { lat: number; lng: number };
}

export default function LiveTracking({ auth, buses, schoolLocation }: Props) {
  const { t } = useTranslation();
  const [liveBuses, setLiveBuses] = useState<Bus[]>(buses);

  useEffect(() => {
    setLiveBuses(buses);
  }, [buses]);

  useEffect(() => {
    if (!window.Echo) return;

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

  // Amman coordinates as default if schoolLocation is missing
  const centerLat = schoolLocation?.lat || 31.9522;
  const centerLng = schoolLocation?.lng || 35.2332;

  return (
    <SchoolAuthenticatedLayout user={auth.user}>
      <Head title={t("Live Tracking")} />
      <LiveTrackingMap
        buses={liveBuses}
        centerLat={centerLat}
        centerLng={centerLng}
      />
    </SchoolAuthenticatedLayout>
  );
}
