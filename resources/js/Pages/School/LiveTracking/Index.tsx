import React, { useState, useEffect, useRef } from "react";
import { Head } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";
import LiveTrackingMap from "@/Components/LiveTrackingMap";
import axios from "axios";

declare global {
  interface Window {
    Echo: any;
  }
}

interface StudentAttendance {
  attendance_id: number;
  student_id: number;
  name: string;
  student_code?: string;
  status: "present" | "boarded" | "dropped" | "absent" | "late" | "pending" | string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  extra_wait_time?: number;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
}

interface Waypoint {
  lat: number;
  lng: number;
  student_id?: number;
  name?: string;
  status?: string;
  is_school?: boolean;
}

interface ActiveTrip {
  id: number;
  type: "forth" | "back" | string;
  status: string;
  students?: StudentAttendance[];
  waypoints?: Waypoint[];
}

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
  capacity: number;
  status: "active" | "maintenance" | "inactive" | string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  current_latitude?: number | string | null;
  current_longitude?: number | string | null;
  trip_status?: "at_school" | "on_route" | "stopped" | "idle" | "in_progress" | string;
  driver?: { id: number; name?: string; phone?: string } | null;
  route?: { id: number; name?: string } | null;
  students_count?: number;
  students_on_board?: number;
  speed_kmh?: number;
  heading?: number;
  active_trip?: ActiveTrip | null;
  last_update?: string | null;
}

interface Stats {
  total_buses: number;
  active_buses: number;
  moving_buses: number;
  total_students: number;
  students_on_board?: number;
}

interface Props {
  auth: any;
  buses: Bus[];
  schoolLocation: { lat: number; lng: number; name?: string };
  stats?: Stats;
}

export default function LiveTracking({ auth, buses, schoolLocation, stats }: Props) {
  const { t, isRtl } = useTranslation();
  const [liveBuses, setLiveBuses] = useState<Bus[]>(buses || []);
  const [liveStats, setLiveStats] = useState<Stats>(
    stats || {
      total_buses: buses?.length || 0,
      active_buses: buses?.filter((b) => b.status === "active").length || 0,
      moving_buses: buses?.filter((b) => (b.speed_kmh || 0) > 0).length || 0,
      total_students: 0,
      students_on_board: 0,
    }
  );
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    setLiveBuses(buses || []);
    if (stats) {
      setLiveStats(stats);
    }
  }, [buses, stats]);

  // 1. WebSocket Real-time Listener (Laravel Reverb / Pusher)
  useEffect(() => {
    if (!window.Echo || !liveBuses || liveBuses.length === 0) return;

    liveBuses.forEach((bus) => {
      window.Echo.private(`bus.${bus.id}`).listen(".bus.location.updated", (e: any) => {
        if (!isMountedRef.current) return;
        setLiveBuses((prev) =>
          prev.map((b) => {
            if (b.id === e.bus_id) {
              return {
                ...b,
                current_latitude: e.latitude,
                current_longitude: e.longitude,
                latitude: e.latitude,
                longitude: e.longitude,
                trip_status: e.trip_status ?? b.trip_status,
                students_on_board: e.students_on_board ?? b.students_on_board,
                speed_kmh: e.speed_kmh ?? b.speed_kmh,
                heading: e.heading ?? b.heading,
              };
            }
            return b;
          })
        );
        setLastSyncTime(new Date());
      });
    });

    return () => {
      if (!window.Echo) return;
      liveBuses.forEach((bus) => {
        window.Echo.leave(`bus.${bus.id}`);
      });
    };
  }, [liveBuses?.length]);

  // 2. High-Performance Hybrid Auto-Polling with Non-Blocking AbortController
  useEffect(() => {
    const pollTracking = async () => {
      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const response = await axios.get("/school/buses/tracking/api", {
          signal: abortControllerRef.current.signal,
          headers: { "X-Requested-With": "XMLHttpRequest" },
        });

        if (isMountedRef.current && response.data?.buses) {
          setLiveBuses(response.data.buses);
          if (response.data.stats) {
            setLiveStats(response.data.stats);
          }
          setLastSyncTime(new Date());
        }
      } catch (err: any) {
        if (axios.isCancel(err) || err?.name === "CanceledError") {
          return;
        }
        console.debug("Live tracking poll error:", err);
      }
    };

    const intervalId = setInterval(pollTracking, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const response = await axios.get("/school/buses/tracking/api", {
        signal: abortControllerRef.current.signal,
      });

      if (response.data?.buses) {
        setLiveBuses(response.data.buses);
        if (response.data.stats) {
          setLiveStats(response.data.stats);
        }
        setLastSyncTime(new Date());
      }
    } catch (err: any) {
      if (!axios.isCancel(err)) {
        console.debug("Manual sync error:", err);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const centerLat = schoolLocation?.lat || 13.9407;
  const centerLng = schoolLocation?.lng || 43.7873;

  return (
    <SchoolAuthenticatedLayout user={auth.user} isLiveTracking={true}>
      <Head title={isRtl ? "التتبع المباشر للأسطول" : "Live Fleet Tracking"} />

      <LiveTrackingMap
        buses={liveBuses}
        centerLat={centerLat}
        centerLng={centerLng}
        schoolLocation={schoolLocation}
        stats={liveStats}
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        onRefresh={handleManualSync}
      />
    </SchoolAuthenticatedLayout>
  );
}
