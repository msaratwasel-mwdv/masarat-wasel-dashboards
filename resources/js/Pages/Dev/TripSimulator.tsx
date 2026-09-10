import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Head } from "@inertiajs/react";
import { GoogleMap, Marker, Polyline, useJsApiLoader } from "@react-google-maps/api";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  Navigation,
  Gauge,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Zap,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Building2,
  Bus as BusIcon,
  UserCheck,
  Check,
  X
} from "lucide-react";

interface Student {
  attendance_id: number;
  student_id: number;
  name: string;
  student_code: string;
  status: "pending" | "waiting" | "boarded" | "dropped" | "absent" | "excused";
  check_in_time?: string;
  check_out_time?: string;
  extra_wait_time: number;
  lat: number | null;
  lng: number | null;
  address?: string;
}

interface Trip {
  id: number;
  type: string;
  status: string;
  trip_date: string;
  departure_time?: string;
  arrival_time?: string;
  bus: {
    id: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
    latitude: number;
    longitude: number;
    driver_name?: string;
    speed_kmh?: number;
    heading?: number;
  } | null;
  school: {
    id: number;
    name: string;
    lat: number;
    lng: number;
  };
  route?: {
    id: number;
    name: string;
    estimated_distance_km: number;
  } | null;
  students: Student[];
  stats: {
    total_students: number;
    boarded_count: number;
    dropped_count: number;
    absent_count: number;
    pending_count: number;
    total_wait_minutes: number;
  };
}

interface SchoolBus {
  id: number;
  bus_number: string;
  plate_number: string;
  capacity: number;
  latitude: number | null;
  longitude: number | null;
  driver_name: string;
  driver_id: number | null;
  route_id: number | null;
  route_name: string | null;
  status: string;
}

interface SchoolStudent {
  id: number;
  name: string;
  student_code: string;
  gender: string;
  classroom: string;
  forth_bus_id: number | null;
  back_bus_id: number | null;
  lat: number | null;
  lng: number | null;
  forth_latitude?: number | null;
  forth_longitude?: number | null;
  back_latitude?: number | null;
  back_longitude?: number | null;
  address: string;
}

interface SchoolItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface Props {
  schools: SchoolItem[];
  selectedSchoolId: number;
  school: { id: number; name: string; latitude: number; longitude: number };
  schoolBuses: SchoolBus[];
  schoolStudents: SchoolStudent[];
  initialTrips: Trip[];
  googleMapsApiKey: string;
}

// Distance calculation helper (Haversine in km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Bearing/Heading calculation (degrees 0-360)
function calculateHeading(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export default function TripSimulator({
  schools = [],
  selectedSchoolId: initialSelectedSchoolId,
  school: initialSchool,
  schoolBuses: initialSchoolBuses = [],
  schoolStudents: initialSchoolStudents = [],
  initialTrips = [],
  googleMapsApiKey,
}: Props) {
  // School selection & state
  const [currentSchoolId, setCurrentSchoolId] = useState<number>(initialSelectedSchoolId);
  const [currentSchool, setCurrentSchool] = useState(initialSchool);
  const [schoolBuses, setSchoolBuses] = useState<SchoolBus[]>(initialSchoolBuses);
  const [schoolStudents, setSchoolStudents] = useState<SchoolStudent[]>(initialSchoolStudents);
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [selectedTripId, setSelectedTripId] = useState<number>(initialTrips[0]?.id || 0);

  // New Trip Creation Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createBusId, setCreateBusId] = useState<number>(initialSchoolBuses[0]?.id || 0);
  const [createType, setCreateType] = useState<"forth" | "back">("forth");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isCreatingTrip, setIsCreatingTrip] = useState<boolean>(false);

  // Simulation State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [currentCoordIndex, setCurrentCoordIndex] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentHeading, setCurrentHeading] = useState<number>(0);
  const [distanceCoveredKm, setDistanceCoveredKm] = useState<number>(0);
  const [totalRouteDistanceKm, setTotalRouteDistanceKm] = useState<number>(0);
  const [whatsAppLogs, setWhatsAppLogs] = useState<any[]>([]);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const lastPingTimeRef = useRef<number>(0);

  // Selected Trip
  const currentTrip = useMemo(() => {
    return trips.find((t) => t.id === selectedTripId) || trips[0] || null;
  }, [trips, selectedTripId]);

  const [busPosition, setBusPosition] = useState<{ lat: number; lng: number }>({
    lat: currentTrip?.bus?.latitude || currentSchool?.latitude || 24.7136,
    lng: currentTrip?.bus?.longitude || currentSchool?.longitude || 46.6753,
  });

  // Google Maps
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: googleMapsApiKey || "",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Switch School dynamically
  const handleSchoolChange = async (newSchoolId: number) => {
    setCurrentSchoolId(newSchoolId);
    setIsPlaying(false);
    setCurrentSpeed(0);

    try {
      const res = await axios.get("/dev/trip-simulator/school-data", {
        params: { school_id: newSchoolId },
      });

      if (res.data?.success) {
        setCurrentSchool(res.data.school);
        setSchoolBuses(res.data.buses);
        setSchoolStudents(res.data.students);
        setTrips(res.data.trips);
        setSelectedTripId(res.data.trips[0]?.id || 0);

        if (res.data.buses[0]) {
          setCreateBusId(res.data.buses[0].id);
        }

        // Center map to new school
        if (res.data.school?.latitude && res.data.school?.longitude) {
          setBusPosition({
            lat: res.data.school.latitude,
            lng: res.data.school.longitude,
          });
          map?.panTo({
            lat: res.data.school.latitude,
            lng: res.data.school.longitude,
          });
        }

        showToast(`تم تحميل بيانات ${res.data.school.name}`, "info");
      }
    } catch (err: any) {
      showToast("فشل تحميل بيانات المدرسة", "error");
    }
  };

  // Build the route waypoints from students to school
  const waypoints = useMemo(() => {
    if (!currentTrip) return [];

    const points: Array<{ lat: number; lng: number; studentId?: number; isSchool?: boolean }> = [];

    // Filter students with valid coordinates
    const studentStops = currentTrip.students
      .filter((s) => s.lat !== null && s.lng !== null)
      .map((s) => ({
        lat: s.lat as number,
        lng: s.lng as number,
        studentId: s.student_id,
      }));

    if (currentTrip.type === "forth") {
      // Forth (Morning): Student Stops -> School
      points.push(...studentStops);
      points.push({ lat: currentTrip.school.lat, lng: currentTrip.school.lng, isSchool: true });
    } else {
      // Back (Afternoon): School -> Student Stops
      points.push({ lat: currentTrip.school.lat, lng: currentTrip.school.lng, isSchool: true });
      points.push(...studentStops);
    }

    return points;
  }, [currentTrip]);

  // Interpolate waypoints to create smooth dense steps for the simulator
  const densePath = useMemo(() => {
    if (waypoints.length < 2) return waypoints.map((w) => ({ lat: w.lat, lng: w.lng }));

    const steps: Array<{ lat: number; lng: number }> = [];
    let totalDist = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const segmentDist = calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
      totalDist += segmentDist;

      // Create micro-steps every ~30-50 meters
      const subSteps = Math.max(10, Math.floor(segmentDist * 30));
      for (let j = 0; j <= subSteps; j++) {
        const ratio = j / subSteps;
        steps.push({
          lat: p1.lat + (p2.lat - p1.lat) * ratio,
          lng: p1.lng + (p2.lng - p1.lng) * ratio,
        });
      }
    }

    setTotalRouteDistanceKm(parseFloat(totalDist.toFixed(2)));
    return steps;
  }, [waypoints]);

  // Sync initial bus position when trip changes
  useEffect(() => {
    if (currentTrip) {
      const initialLat = currentTrip.bus?.latitude || currentTrip.school.lat;
      const initialLng = currentTrip.bus?.longitude || currentTrip.school.lng;
      setBusPosition({ lat: initialLat, lng: initialLng });
      setCurrentCoordIndex(0);
      setDistanceCoveredKm(0);
      setIsPlaying(false);
      setCurrentSpeed(0);
    }
  }, [selectedTripId]);

  // Simulation Loop
  useEffect(() => {
    if (!isPlaying || densePath.length === 0 || !currentTrip?.bus) return;

    const intervalMs = Math.max(250, Math.floor(1000 / speedMultiplier));

    const timer = setInterval(() => {
      setCurrentCoordIndex((prevIndex) => {
        if (prevIndex >= densePath.length - 1) {
          setIsPlaying(false);
          setCurrentSpeed(0);
          showToast("وصلت الحافلة إلى المحطة الأخيرة. يمكنك الآن إنهاء الرحلة الحقيقية.", "info");
          return prevIndex;
        }

        const nextIndex = prevIndex + 1;
        const currentPt = densePath[prevIndex];
        const nextPt = densePath[nextIndex];

        const stepDist = calculateDistance(currentPt.lat, currentPt.lng, nextPt.lat, nextPt.lng);
        setDistanceCoveredKm((d) => parseFloat((d + stepDist).toFixed(2)));

        const heading = calculateHeading(currentPt.lat, currentPt.lng, nextPt.lat, nextPt.lng);
        setCurrentHeading(Math.round(heading));

        const baseSpeed = 40 + (Math.sin(nextIndex) * 8);
        const speed = Math.round(baseSpeed);
        setCurrentSpeed(speed);

        setBusPosition(nextPt);

        // Ping location update to backend every ~1.5 seconds
        const now = Date.now();
        if (now - lastPingTimeRef.current >= 1500 || nextIndex === densePath.length - 1) {
          lastPingTimeRef.current = now;
          axios
            .post("/dev/trip-simulator/ping-location", {
              bus_id: currentTrip.bus!.id,
              trip_id: currentTrip.id,
              latitude: nextPt.lat,
              longitude: nextPt.lng,
              heading: Math.round(heading),
              speed_kmh: speed,
            })
            .catch((e) => console.debug("Ping error", e));
        }

        return nextIndex;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, densePath, currentTrip]);

  // Refresh trips
  const fetchTrips = async () => {
    try {
      const res = await axios.get("/dev/trip-simulator/trips", {
        params: { school_id: currentSchoolId },
      });
      if (res.data?.trips) {
        setTrips(res.data.trips);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch WhatsApp logs
  const fetchWhatsAppLogs = async () => {
    try {
      const res = await axios.get("/dev/trip-simulator/whatsapp-logs");
      if (res.data?.logs) {
        setWhatsAppLogs(res.data.logs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWhatsAppLogs();
  }, []);

  // Action: Create & Start Real Trip
  const handleCreateRealTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createBusId) {
      showToast("يرجى اختيار الحافلة", "error");
      return;
    }

    setIsCreatingTrip(true);
    try {
      const res = await axios.post("/dev/trip-simulator/create-trip", {
        school_id: currentSchoolId,
        bus_id: createBusId,
        type: createType,
        student_ids: selectedStudentIds,
      });

      if (res.data?.success && res.data?.trip) {
        const newTrip = res.data.trip;
        setTrips((prev) => [newTrip, ...prev]);
        setSelectedTripId(newTrip.id);
        setShowCreateModal(false);
        setSelectedStudentIds([]);
        setIsPlaying(true);
        showToast("تم إنشاء وبدء الرحلة الحقيقية بنجاح!", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "فشل إنشاء الرحلة", "error");
    } finally {
      setIsCreatingTrip(false);
    }
  };

  // Action: Start Pending Trip
  const handleStartTrip = async () => {
    if (!currentTrip) return;
    try {
      const res = await axios.post("/dev/trip-simulator/start-trip", {
        trip_id: currentTrip.id,
        latitude: busPosition.lat,
        longitude: busPosition.lng,
      });
      if (res.data?.trip) {
        setTrips((prev) => prev.map((t) => (t.id === res.data.trip.id ? res.data.trip : t)));
        setIsPlaying(true);
        showToast("تم بدء الرحلة وبدأت المحاكاة!", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "فشل بدء الرحلة", "error");
    }
  };

  // Action: End Real Trip
  const handleEndTrip = async () => {
    if (!currentTrip) return;
    setIsPlaying(false);
    setCurrentSpeed(0);

    try {
      const res = await axios.post("/dev/trip-simulator/end-trip", {
        trip_id: currentTrip.id,
        distance_km: distanceCoveredKm > 0 ? parseFloat(distanceCoveredKm.toFixed(2)) : (currentTrip.route?.estimated_distance_km || 0),
      });

      showToast("تم إنهاء الرحلة الحقيقية بنجاح! تم إرسال تقرير الواتساب وتحديث الداشبورد.", "success");
      await fetchTrips();
      await fetchWhatsAppLogs();
    } catch (err: any) {
      showToast(err.response?.data?.message || "فشل إنهاء الرحلة", "error");
    }
  };

  // Action: Reset Trip
  const handleResetTrip = async () => {
    if (!currentTrip) return;
    setIsPlaying(false);
    setCurrentSpeed(0);
    setCurrentCoordIndex(0);
    setDistanceCoveredKm(0);

    try {
      const res = await axios.post("/dev/trip-simulator/reset-trip", {
        trip_id: currentTrip.id,
      });
      if (res.data?.trip) {
        setTrips((prev) => prev.map((t) => (t.id === res.data.trip.id ? res.data.trip : t)));
        showToast("تمت إعادة ضبط الرحلة إلى الحالة المجدولة (Pending).", "info");
      }
    } catch (err: any) {
      showToast("حدث خطأ أثناء إعادة التعيين", "error");
    }
  };

  // Action: Update Student Attendance
  const handleUpdateStudent = async (attendanceId: number, status: string, extraWait: number = 0) => {
    // Instant Optimistic State Update
    setTrips((prevTrips) =>
      prevTrips.map((trip) => {
        if (trip.id !== selectedTripId) return trip;
        const updatedStudents = trip.students.map((stu) => {
          if (stu.attendance_id !== attendanceId) return stu;
          return {
            ...stu,
            status: status as any,
            extra_wait_time: extraWait,
          };
        });
        return {
          ...trip,
          students: updatedStudents,
          stats: {
            ...trip.stats,
            boarded_count: updatedStudents.filter((s) => s.status === "boarded").length,
            absent_count: updatedStudents.filter((s) => s.status === "absent").length,
            pending_count: updatedStudents.filter((s) => s.status === "pending").length,
            dropped_count: updatedStudents.filter((s) => s.status === "dropped").length,
            total_wait_minutes: updatedStudents.reduce((acc, s) => acc + (s.extra_wait_time || 0), 0),
          },
        };
      })
    );

    const statusLabels: Record<string, string> = {
      boarded: "صعود",
      absent: "غياب",
      waiting: "انتظار",
      dropped: "نزول",
    };
    showToast(`تم تحديث حالة الطالب إلى (${statusLabels[status] || status})`, "success");

    try {
      const res = await axios.post("/dev/trip-simulator/update-attendance", {
        attendance_id: attendanceId,
        status,
        extra_wait_time: extraWait,
      });
      if (res.data?.trip) {
        setTrips((prev) => prev.map((t) => (t.id === res.data.trip.id ? res.data.trip : t)));
      }
    } catch (err: any) {
      showToast("فشل حفظ التحديث على الخادم", "error");
      await fetchTrips();
    }
  };

  // Action: Smart Batch Attendance
  const handleSmartBatch = async () => {
    if (!currentTrip) return;
    try {
      const res = await axios.post("/dev/trip-simulator/smart-batch-attendance", {
        trip_id: currentTrip.id,
      });
      if (res.data?.trip) {
        setTrips((prev) => prev.map((t) => (t.id === res.data.trip.id ? res.data.trip : t)));
        showToast("تم تطبيق التحضير السريع لجميع الطلاب بنجاح!", "success");
      }
    } catch (err: any) {
      showToast("فشل تطبيق التحضير السريع", "error");
    }
  };

  const progressPercent = densePath.length > 0 ? Math.round((currentCoordIndex / (densePath.length - 1)) * 100) : 0;

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      <Head title="محاكي الحافلات والرحلات الحقيقية" />

      {/* Floating Notification */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 text-sm font-medium ${
              notificationMsg.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
                : notificationMsg.type === "error"
                ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
                : "bg-indigo-950/90 border-indigo-500/50 text-indigo-200"
            }`}
          >
            {notificationMsg.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {notificationMsg.type === "error" && <XCircle className="w-5 h-5 text-rose-400" />}
            {notificationMsg.type === "info" && <Sparkles className="w-5 h-5 text-indigo-400" />}
            <span>{notificationMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Navigation className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">محاكي الحافلات والرحلات الحقيقية</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                بيانات حقيقية 100%
              </span>
            </div>
            <p className="text-xs text-slate-400">تحكم كامل برحلات الحافلات الفعلية، تحضير الطلاب الحقيقيين، وبث إحداثيات GPS المباشرة</p>
          </div>
        </div>

        {/* School Selector & Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400 font-medium">المدرسة:</span>
            <select
              value={currentSchoolId}
              onChange={(e) => handleSchoolChange(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2">
            <span className="flex items-center gap-1.5 text-slate-300">
              <BusIcon className="w-3.5 h-3.5 text-emerald-400" />
              حافلات: <strong className="text-white font-mono">{schoolBuses.length}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              طلاب مقيدين: <strong className="text-white font-mono">{schoolStudents.length}</strong>
            </span>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            إنشاء رحلة جديدة
          </button>

          <a
            href="/school/live-tracking"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm hover:border-slate-600"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            التتبع المباشر
          </a>

          <button
            onClick={() => {
              fetchTrips();
              fetchWhatsAppLogs();
              showToast("تم تحديث البيانات من الخادم", "info");
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Info Banners if 0 Buses or 0 Students */}
      <div className="px-6 pt-4 max-w-[1700px] mx-auto space-y-3">
        {schoolStudents.length === 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>تنبيه دقة البيانات:</strong> هذه المدرسة لا تحتوي على أي طلاب مقيدين في فصولها حالياً. يمكنك إنشاء وبدء رحلة للحافلة لمتابعة حركتها وسرعتها فقط، أو إضافة طلاب رسميّاً من لوحة تحكم المدرسة.
              </span>
            </div>
          </div>
        )}

        {schoolBuses.length === 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>لا توجد حافلات:</strong> هذه المدرسة لا تملك أي حافلات مسجلة. يرجى تسجيل حافلة للمدرسة أولاً من لوحة الإدارة.
            </span>
          </div>
        )}
      </div>

      {/* Main Workspace Layout */}
      <main className="p-4 md:p-6 max-w-[1700px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left/Center Column: Interactive Map (7 Cols) */}
        <section className="xl:col-span-7 flex flex-col gap-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800/80 p-4 shadow-xl overflow-hidden flex flex-col h-[520px] md:h-[620px] relative">
            
            {/* Map Header Overlay */}
            <div className="absolute top-7 right-7 z-10 flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/60 text-xs font-medium text-slate-300 flex items-center gap-2 shadow-lg">
                <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`}></span>
                <span>الحافلة: {currentTrip?.bus?.bus_number || (schoolBuses[0]?.bus_number ?? "لا توجد حافلة")}</span>
                <span className="text-slate-500">|</span>
                <span className="text-emerald-400 font-bold">{currentSpeed} كم/س</span>
              </div>
            </div>

            {/* Google Map */}
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%", borderRadius: "1.25rem" }}
                center={busPosition}
                zoom={14}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  styles: [
                    { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
                    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1e293b" }] },
                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
                  ],
                }}
                onLoad={(mapInstance) => setMap(mapInstance)}
              >
                {/* Route Line */}
                {densePath.length > 1 && (
                  <Polyline
                    path={densePath}
                    options={{
                      strokeColor: "#10b981",
                      strokeOpacity: 0.8,
                      strokeWeight: 4,
                    }}
                  />
                )}

                {/* School Marker */}
                {currentSchool && (
                  <Marker
                    position={{ lat: currentSchool.latitude, lng: currentSchool.longitude }}
                    title={currentSchool.name}
                    label={{
                      text: "🏫",
                      fontSize: "22px",
                    }}
                  />
                )}

                {/* Real Student Stops Markers */}
                {currentTrip?.students.map((student, idx) => {
                  if (!student.lat || !student.lng) return null;
                  const isBoarded = student.status === "boarded";
                  const isAbsent = student.status === "absent";
                  const isDropped = student.status === "dropped";

                  return (
                    <Marker
                      key={`student-${student.attendance_id}`}
                      position={{ lat: student.lat, lng: student.lng }}
                      title={`${student.name} (${student.status})`}
                      label={{
                        text: isBoarded ? "✓" : isAbsent ? "✗" : isDropped ? "🏁" : `${idx + 1}`,
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                      icon={{
                        path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                        scale: 14,
                        fillColor: isBoarded ? "#10b981" : isAbsent ? "#ef4444" : isDropped ? "#3b82f6" : "#f59e0b",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                      }}
                    />
                  );
                })}

                {/* Moving Bus Marker */}
                <Marker
                  position={busPosition}
                  title={`حافلة ${currentTrip?.bus?.bus_number || ""}`}
                  label={{
                    text: "🚌",
                    fontSize: "26px",
                  }}
                  zIndex={999}
                />
              </GoogleMap>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
                <p>جاري تحميل خريطة جوجل...</p>
              </div>
            )}

            {/* Map Legend */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span> صعد الطالب
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span> غائب
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span> بالانتظار
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span> نزل بالمدرسة
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Lat: {busPosition.lat.toFixed(5)}, Lng: {busPosition.lng.toFixed(5)}
              </div>
            </div>
          </div>

          {/* Telemetry Strip (Gauges) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">السرعة الحالية</div>
                <div className="text-lg font-bold font-mono text-white flex items-baseline gap-1">
                  {currentSpeed} <span className="text-[10px] font-normal text-slate-400">كم/س</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">المسافة المقطوعة</div>
                <div className="text-lg font-bold font-mono text-white flex items-baseline gap-1">
                  {distanceCoveredKm} <span className="text-[10px] font-normal text-slate-400">/ {totalRouteDistanceKm} كم</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">الاتجاه (Heading)</div>
                <div className="text-lg font-bold font-mono text-white flex items-baseline gap-1">
                  {currentHeading}° <span className="text-[10px] font-normal text-slate-400">درجة</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400">وقت الانتظار</div>
                <div className="text-lg font-bold font-mono text-white flex items-baseline gap-1">
                  {currentTrip?.stats.total_wait_minutes || 0} <span className="text-[10px] font-normal text-slate-400">دقيقة</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Controls & Attendance (5 Cols) */}
        <section className="xl:col-span-5 flex flex-col gap-4">
          
          {/* Card 1: Trip Controls */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                التحكم بالرحلة والمحاكاة
              </h2>
              {currentTrip && (
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                    currentTrip.status === "in_progress"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse"
                      : currentTrip.status === "finished"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {currentTrip.status === "in_progress"
                    ? "نشطة جارية"
                    : currentTrip.status === "finished"
                    ? "مكتملة ومنتهية"
                    : "مجدولة (Pending)"}
                </span>
              )}
            </div>

            {/* Trip Selector */}
            {trips.length > 0 ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">اختر الرحلة الحالية:</label>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      رحلة #{t.id} - حافلة {t.bus?.bus_number || "N/A"} ({t.type === "forth" ? "صباحية ذهاب" : "مسائية عودة"}) - {t.status === "in_progress" ? "نشطة" : t.status === "finished" ? "منتهية" : "معلقة"} ({t.students.length} ركاب)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                <p>لا توجد رحلات مسجلة اليوم لهذه المدرسة.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  بدء رحلة جديدة الآن
                </button>
              </div>
            )}

            {currentTrip && (
              <>
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                    <span>مسار السير والتقدم</span>
                    <span className="font-mono text-emerald-400">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <motion.div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500"
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {currentTrip.status !== "in_progress" ? (
                    <button
                      onClick={handleStartTrip}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      بدء الرحلة (Start)
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 font-bold rounded-2xl text-xs transition-all active:scale-[0.98] ${
                        isPlaying
                          ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20"
                          : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20"
                      }`}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      {isPlaying ? "إيقاف مؤقت (Pause)" : "متابعة السير (Play)"}
                    </button>
                  )}

                  <button
                    onClick={handleEndTrip}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold rounded-2xl text-xs transition-all active:scale-[0.98]"
                  >
                    <Flag className="w-4 h-4" />
                    إنهاء الرحلة الحقيقية (End)
                  </button>
                </div>

                {/* Speed Multipliers & Step */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-[11px]">السرعة:</span>
                    {[1, 2, 5, 10].map((mult) => (
                      <button
                        key={mult}
                        onClick={() => setSpeedMultiplier(mult)}
                        className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition-colors ${
                          speedMultiplier === mult
                            ? "bg-emerald-500 text-slate-950 shadow-sm"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {mult}x
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleResetTrip}
                    className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-slate-200 transition-colors text-[11px]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    إعادة ضبط
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Card 2: Students Attendance Control */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-xl flex flex-col gap-3 flex-1 min-h-[300px]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  حضور وركوب الطلاب في الرحلة
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  صعود: {currentTrip?.stats.boarded_count || 0} | نزول: {currentTrip?.stats.dropped_count || 0} | غائب: {currentTrip?.stats.absent_count || 0}
                </p>
              </div>

              {currentTrip && currentTrip.students.length > 0 && (
                <button
                  onClick={handleSmartBatch}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  تحضير سريع للكل
                </button>
              )}
            </div>

            {/* Students List */}
            <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
              {currentTrip && currentTrip.students.length > 0 ? (
                currentTrip.students.map((student, idx) => (
                  <div
                    key={student.attendance_id}
                    className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          student.status === "boarded"
                            ? "bg-emerald-500 text-slate-950"
                            : student.status === "absent"
                            ? "bg-rose-500 text-white"
                            : student.status === "dropped"
                            ? "bg-blue-500 text-white"
                            : student.status === "waiting"
                            ? "bg-amber-500 text-slate-950"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{student.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">({student.student_code})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{student.address || "العنوان غير محدد"}</span>
                          {student.check_in_time && (
                            <span className="text-emerald-400">صعد: {student.check_in_time}</span>
                          )}
                          {student.check_out_time && (
                            <span className="text-blue-400">نزل: {student.check_out_time}</span>
                          )}
                          {student.extra_wait_time > 0 && (
                            <span className="text-amber-400">انتظار: {student.extra_wait_time} دقيقة</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleUpdateStudent(student.attendance_id, "boarded")}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                          student.status === "boarded"
                            ? "bg-emerald-500 text-slate-950 font-bold"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        صعود
                      </button>

                      <button
                        onClick={() => handleUpdateStudent(student.attendance_id, "dropped")}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                          student.status === "dropped"
                            ? "bg-blue-500 text-white font-bold"
                            : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        نزول
                      </button>

                      <button
                        onClick={() => handleUpdateStudent(student.attendance_id, "absent")}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                          student.status === "absent"
                            ? "bg-rose-500 text-white font-bold"
                            : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        غياب
                      </button>

                      <button
                        onClick={() => handleUpdateStudent(student.attendance_id, "waiting", (student.extra_wait_time || 0) + 2)}
                        className="px-2 py-1 text-[10px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700"
                        title="إضافة دقيقتين انتظار"
                      >
                        +2د
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  لا يوجد طلاب على متن هذه الرحلة.
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Real WhatsApp Logs */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                سجل رسائل الواتساب الصادرة عند إنهاء الرحلة
              </h4>
              <button onClick={fetchWhatsAppLogs} className="text-[10px] text-slate-400 hover:text-slate-200">
                تحديث السجل
              </button>
            </div>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {whatsAppLogs.length > 0 ? (
                whatsAppLogs.slice(0, 3).map((log: any) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>إلى: {log.recipient_phone || log.phone_number || "إدارة المدرسة"}</span>
                      <span className="font-mono">{log.created_at ? new Date(log.created_at).toLocaleTimeString("ar-SA") : ""}</span>
                    </div>
                    <p className="line-clamp-2 text-slate-200 font-sans text-[11px] leading-relaxed">
                      {log.message || log.body || "تم إرسال ملخص اكتمال الرحلة بنجاح."}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-[11px] text-slate-500">
                  لم يتم إرسال رسائل واتساب بعد. ستظهر هنا فور إنهاء أول رحلة.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Modal: Create & Start Real Trip */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">إنشاء وبدء رحلة حقيقية جديدة</h3>
                    <p className="text-xs text-slate-400">لـ: {currentSchool?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateRealTrip} className="space-y-4">
                {/* Bus Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">اختر الحافلة:</label>
                  {schoolBuses.length > 0 ? (
                    <select
                      value={createBusId}
                      onChange={(e) => setCreateBusId(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      required
                    >
                      {schoolBuses.map((bus) => (
                        <option key={bus.id} value={bus.id}>
                          حافلة {bus.bus_number} ({bus.plate_number}) - السائق: {bus.driver_name} - السعة: {bus.capacity}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-rose-400">لا توجد حافلات لهذه المدرسة.</p>
                  )}
                </div>

                {/* Trip Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الرحلة:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCreateType("forth")}
                      className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                        createType === "forth"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      ☀️ رحلة ذهاب (صباحية إلى المدرسة)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateType("back")}
                      className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                        createType === "back"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      🌙 رحلة عودة (مسائية إلى المنزل)
                    </button>
                  </div>
                </div>

                {/* Real Students Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      الطلاب المشاركون في الرحلة ({selectedStudentIds.length} من أصل {schoolStudents.length}):
                    </label>
                    {schoolStudents.length > 0 && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentIds(schoolStudents.map((s) => s.id))}
                          className="text-emerald-400 hover:underline"
                        >
                          تحديد الكل
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentIds([])}
                          className="text-slate-400 hover:underline"
                        >
                          إلغاء التحديد
                        </button>
                      </div>
                    )}
                  </div>

                  {schoolStudents.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-slate-950 rounded-2xl border border-slate-800">
                      {schoolStudents.map((stu) => {
                        const isChecked = selectedStudentIds.includes(stu.id);
                        return (
                          <label
                            key={stu.id}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition-colors ${
                              isChecked
                                ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                                : "bg-slate-900 border-slate-850 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentIds([...selectedStudentIds, stu.id]);
                                  } else {
                                    setSelectedStudentIds(selectedStudentIds.filter((id) => id !== stu.id));
                                  }
                                }}
                                className="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer bg-slate-800 border-slate-700"
                              />
                              <div>
                                <span className="font-bold">{stu.name}</span>
                                <span className="text-[10px] text-slate-400 mr-2">فصل: {stu.classroom}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{stu.student_code}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                      لا يوجد طلاب مقيدين في هذه المدرسة. سيتم بدء رحلة للحافلة وسائقها فقط بدون ركاب.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTrip || schoolBuses.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    {isCreatingTrip ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    بدء الرحلة الحقيقية الآن
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
