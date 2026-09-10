import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { useEchoEvent } from "@/hooks/useEcho";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Bus, Users, Route as RouteIcon,
  Activity, TrendingUp, Calendar, Rocket,
  UserSquare2, ArrowUpRight, CheckCircle2, BookOpen,
  ClipboardList, MapPin, Zap, Clock, ShieldCheck,
  ChevronRight, ArrowRight, Bell, CheckCheck,
  AlertTriangle, Users2, TrendingDown, LayoutDashboard,
  Navigation, UserCheck, ShieldAlert, Sparkles, Phone, AlertCircle,
  Building2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";

interface ShiftData {
  key: string;
  label_ar: string;
  label_en: string;
  description_ar: string;
  description_en: string;
  status_tone: string;
  next_event_ar: string;
  next_event_en: string;
}

interface FleetBus {
  id: number;
  bus_number: string;
  plate_number: string;
  model: string;
  year: number;
  capacity: number;
  status: string;
  assigned_students_count: number;
  occupancy_rate: number;
  route?: {
    id: number;
    name: string;
    code: string;
    distance_km: number;
  } | null;
  driver?: {
    name: string;
    phone: string;
  } | null;
  assistant?: {
    name: string;
    phone: string;
  } | null;
}

interface AttentionItems {
  has_calendar: boolean;
  unassigned_students_count: number;
  pending_absences_count: number;
  pending_absences: Array<{
    id: number;
    student_name: string;
    start_date: string;
    end_date: string;
    reason: string;
  }>;
  pending_locations_count: number;
  pending_locations: Array<{
    id: number;
    student_name: string;
    address: string;
  }>;
  buses_missing_crew_count: number;
}

interface DashboardProps {
  auth: any;
  school?: {
    id: number;
    name: string;
    code: string;
  } | null;
  shift?: ShiftData;
  fleet?: FleetBus[];
  studentPulse?: {
    total_enrolled: number;
    assigned_to_transport: number;
    unassigned_students: number;
    manifest: Array<any>;
  };
  attentionItems?: AttentionItems;
  stats: {
    students: number;
    classes: number;
    buses: number;
    active_buses: number;
    routes: number;
    teachers: number;
    attendance_percentage: number;
    attendance_today_count: number;
  };
  transport: {
    completed_trips_today: number;
    total_trips_today: number;
    students_transported_today: number;
    trip_success_rate: number;
    active_buses: number;
    total_buses: number;
    delays_this_month: number;
    completed_field_trips: number;
    active_trips_now: number;
    delayed_buses_now: number;
    distance_today: number;
    zero_incident_days: number;
  };
  attendanceTrend: Array<{ date: string; present: number; absent: number; total: number }>;
  studentsByBus: Array<{ name: string; value: number }>;
  recentActivities: Array<{
    id: string | number;
    type: string;
    title: string;
    title_ar?: string;
    title_en?: string;
    description_ar: string;
    description_en: string;
    time: string;
    status: string;
  }>;
  upcomingHolidays: Array<{
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    type: string;
    notes?: string;
  }>;
  system_status: string;
}

export default function SchoolDashboard({
  auth,
  school,
  shift,
  fleet = [],
  studentPulse,
  attentionItems,
  stats,
  transport,
  attendanceTrend = [],
  studentsByBus = [],
  recentActivities = [],
  upcomingHolidays = [],
}: DashboardProps) {
  const { isRTL: isRtl } = useTheme();

  // Real-time updates for dashboard stats
  useEchoEvent(
    "private",
    `App.Models.User.${auth.user.id}`,
    ".notification.pushed",
    () => {
      router.reload({ only: ["stats", "transport", "recentActivities", "attentionItems"] });
    }
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting =
    hour < 12
      ? isRtl ? "صباح الخير" : "Good Morning"
      : isRtl ? "مساء الخير" : "Good Evening";

  const totalActionItems =
    (attentionItems?.pending_absences_count || 0) +
    (attentionItems?.pending_locations_count || 0) +
    (attentionItems?.buses_missing_crew_count || 0) +
    (attentionItems?.unassigned_students_count || 0);

  return (
    <SchoolDashboardLayout
      user={auth.user}
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-black text-[#0f2044] dark:text-white tracking-tight">
              {isRtl ? "لوحة التحكم" : "Dashboard"}
            </h2>
            {school && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0f2044]/5 dark:bg-white/10 text-[#0f2044] dark:text-white border border-[#0f2044]/10">
                <Building2 className="w-3.5 h-3.5 text-[#f5b800]" />
                {school.name}
              </span>
            )}
          </div>
        </div>
      }
    >
      <Head title={isRtl ? "لوحة التحكم" : "Dashboard"} />

      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
        
        {/* ─── Compact Welcome & Status Bar ───────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="p-4 md:p-5 rounded-2xl bg-[#0f2044] text-white shadow-md border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{greeting}،</span>
              <span className="text-[#f5b800]">
                {isRtl
                  ? `${auth.user.first_name_ar || auth.user.name}`.trim()
                  : `${auth.user.first_name_en || auth.user.name}`.trim()}
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-blue-200/80 font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#f5b800]" />
              <span>
                {currentTime.toLocaleDateString(isRtl ? "ar-SA" : "en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span>•</span>
              <span className="font-mono tabular-nums text-white">
                {currentTime.toLocaleTimeString(isRtl ? "ar-SA" : "en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {shift && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs self-start sm:self-auto">
              <span className={`w-2 h-2 rounded-full ${
                shift.status_tone === "emerald" ? "bg-emerald-400 animate-pulse" : "bg-gray-400"
              }`} />
              <span className="font-bold text-white">
                {isRtl ? shift.label_ar : shift.label_en}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-gray-300">
                {isRtl ? shift.next_event_ar : shift.next_event_en}
              </span>
            </div>
          )}
        </motion.div>

        {/* ─── 4 Core Verified KPIs (Real Database Metrics) ────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Distance Covered Today */}
          <div className="group relative p-6 rounded-[24px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#0f2044]/5 dark:bg-white/5 flex items-center justify-center text-[#0f2044] dark:text-[#f5b800] group-hover:bg-[#0f2044] group-hover:text-white transition-colors duration-300">
                <RouteIcon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {isRtl ? "رحلات اليوم" : "Today"}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {isRtl ? "المسافات المقطوعة" : "Distance Covered"}
            </p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-3xl font-black text-[#0f2044] dark:text-white">
                {Number(transport.distance_today).toFixed(1).replace(/\.0$/, "")}
              </h4>
              <span className="text-sm font-bold text-gray-400">{isRtl ? "كم" : "KM"}</span>
            </div>
            <p className="text-[11px] font-semibold text-gray-400 mt-2">
              {isRtl ? "مجموع مسافات الرحلات المكتملة" : "Sum of completed trip odometers"}
            </p>
          </div>

          {/* Card 2: Zero-Incident Days */}
          <div className="group relative p-6 rounded-[24px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                {isRtl ? "سجل السلامة" : "Safety"}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {isRtl ? "أيام عمل بدون حوادث" : "Zero-Incident Days"}
            </p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {transport.zero_incident_days}
              </h4>
              <span className="text-sm font-bold text-gray-400">{isRtl ? "يوم" : "Days"}</span>
            </div>
            <p className="text-[11px] font-semibold text-gray-400 mt-2">
              {isRtl ? "سجل نظيف موثق في الأسطول" : "Verified accident-free history"}
            </p>
          </div>

          {/* Card 3: Trips Completed Today */}
          <div className="group relative p-6 rounded-[24px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                <CheckCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                {transport.total_trips_today > 0
                  ? `${Math.round((transport.completed_trips_today / transport.total_trips_today) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {isRtl ? "الرحلات المكتملة اليوم" : "Trips Completed"}
            </p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-3xl font-black text-[#0f2044] dark:text-white">
                {transport.completed_trips_today}
              </h4>
              <span className="text-sm font-bold text-gray-400">/ {transport.total_trips_today}</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                style={{
                  width: transport.total_trips_today > 0
                    ? `${(transport.completed_trips_today / transport.total_trips_today) * 100}%`
                    : "0%",
                }}
              />
            </div>
          </div>

          {/* Card 4: Students Transported */}
          <div className="group relative p-6 rounded-[24px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                {isRtl ? "ركاب الحافلات" : "Boarded"}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {isRtl ? "الطلاب المنقولون اليوم" : "Students Transported"}
            </p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-3xl font-black text-[#0f2044] dark:text-white">
                {transport.students_transported_today}
              </h4>
              <span className="text-sm font-bold text-gray-400">
                / {studentPulse?.assigned_to_transport || stats.students}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-400 mt-2">
              {isRtl ? "طلاب استقلوا الحافلة اليوم فعلياً" : "Actual check-ins confirmed"}
            </p>
          </div>

        </motion.div>

        {/* ─── Live Telemetry Strip ────────────────────────────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <LiveKpiCard
            title={isRtl ? "رحلات نشطة في الطريق" : "Active Trips Now"}
            value={transport.active_trips_now}
            sub={isRtl ? "تتحرك لحظياً" : "on the road"}
            icon={RouteIcon}
            accent="blue"
          />
          <LiveKpiCard
            title={isRtl ? "حافلات متأخرة" : "Delayed Buses"}
            value={transport.delayed_buses_now}
            sub={isRtl ? (transport.delayed_buses_now > 0 ? "تتطلب انتباهاً" : "كل شيء منتظم") : "requires attention"}
            icon={AlertTriangle}
            accent={transport.delayed_buses_now > 0 ? "rose" : "green"}
          />
          <LiveKpiCard
            title={isRtl ? "كفاءة الأسطول النشط" : "Active Fleet"}
            value={`${transport.active_buses} / ${transport.total_buses}`}
            sub={isRtl ? "حافلات مفعلة" : "active buses"}
            icon={Bus}
            accent="gold"
          />
          <LiveKpiCard
            title={isRtl ? "نسبة نجاح الرحلات (7 أيام)" : "Trip Success Rate"}
            value={`${transport.trip_success_rate}%`}
            sub={isRtl ? "معدل الإنجاز" : "weekly success"}
            icon={CheckCircle2}
            accent="navy"
          />
        </motion.div>

        {/* ─── Action Items & Fleet Operations (Two Columns) ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Attention Items & Pending Requests (Right Column) */}
          <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col">
            <div className="p-6 md:p-7 rounded-[28px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-lg text-[#0f2044] dark:text-white">
                    {isRtl ? "صندوق انتباه الإدارة" : "Administrative Attention"}
                  </h3>
                </div>
                {totalActionItems > 0 ? (
                  <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-black">
                    {totalActionItems} {isRtl ? "مهام معلقة" : "pending"}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                    {isRtl ? "لا توجد متطلبات" : "All Clear"}
                  </span>
                )}
              </div>

              <div className="space-y-3.5 flex-1">
                {/* 1. Unassigned Students Alert */}
                {(attentionItems?.unassigned_students_count ?? 0) > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-amber-900 dark:text-amber-200">
                          {isRtl
                            ? `${attentionItems?.unassigned_students_count} طالب غير مسندين لحافلات`
                            : `${attentionItems?.unassigned_students_count} students unassigned`}
                        </p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                          {isRtl ? "يتطلب تعيين مسار وحافلة لنقلهم" : "Assign to bus route for transport"}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={route("school.students.index")}
                      className="text-xs font-black text-amber-700 dark:text-amber-300 hover:underline shrink-0"
                    >
                      {isRtl ? "تعيين الآن" : "Assign"}
                    </Link>
                  </div>
                )}

                {/* 2. Buses Missing Crew */}
                {(attentionItems?.buses_missing_crew_count ?? 0) > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-rose-900 dark:text-rose-200">
                          {isRtl
                            ? `${attentionItems?.buses_missing_crew_count} حافلة بدون طاقم مكتمل`
                            : `${attentionItems?.buses_missing_crew_count} buses missing driver/assistant`}
                        </p>
                        <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                          {isRtl ? "تحتاج لتعيين سائق أو مشرفة قبل الانطلاق" : "Assign crew to ensure trip readiness"}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={route("school.buses.index")}
                      className="text-xs font-black text-rose-700 dark:text-rose-300 hover:underline shrink-0"
                    >
                      {isRtl ? "إدارة الأسطول" : "Manage"}
                    </Link>
                  </div>
                )}

                {/* 3. Pending Absence Requests */}
                {attentionItems?.pending_absences && attentionItems.pending_absences.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400">
                      <span>{isRtl ? "طلبات إذن الغياب الحديثة" : "Recent Absence Requests"}</span>
                      <Link href={route("school.attendance.index")} className="text-sky-600 hover:underline">
                        {isRtl ? "عرض الكل" : "View all"}
                      </Link>
                    </div>
                    {attentionItems.pending_absences.slice(0, 3).map((abs) => (
                      <div key={abs.id} className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#0f2044] dark:text-white">{abs.student_name}</p>
                          <p className="text-[10px] text-gray-500">{abs.reason || (isRtl ? "عذر مسبق" : "Notice")}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          {isRtl ? "معلق" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* If all items clear */}
                {totalActionItems === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-black text-[#0f2044] dark:text-white">
                      {isRtl ? "العمليات الميدانية تسير بانضباط تام" : "All Operations in Perfect Order"}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">
                      {isRtl
                        ? "لا توجد طلبات غياب أو مواقع معلقة، وجميع الطلاب المشمولين بالنقل مسندون لحافلاتهم."
                        : "No pending absences or unassigned students. Fleet is fully allocated."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Detailed Fleet Status (Left Column) */}
          <motion.div variants={itemVariants} className="lg:col-span-7 flex flex-col">
            <div className="p-6 md:p-7 rounded-[28px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#0f2044]/5 dark:bg-white/5 text-[#0f2044] dark:text-[#f5b800]">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-[#0f2044] dark:text-white">
                      {isRtl ? "جاهزية وحالة أسطول الحافلات" : "School Fleet Status & Readiness"}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {isRtl ? `إجمالي الحافلات: ${fleet.length}` : `Total Buses: ${fleet.length}`}
                    </p>
                  </div>
                </div>

                <Link
                  href={route("school.buses.index")}
                  className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {isRtl ? "تفاصيل الأسطول" : "View Fleet"}
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </div>

              {/* Fleet List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
                {fleet.length > 0 ? (
                  fleet.map((bus) => (
                    <div
                      key={bus.id}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-[#0f2044]/20 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center text-[#0f2044] dark:text-[#f5b800] font-black text-xs shadow-sm">
                            {bus.bus_number}
                          </div>
                          <div>
                            <h5 className="text-xs font-black text-[#0f2044] dark:text-white flex items-center gap-2">
                              {bus.plate_number}
                              <span className="text-[10px] font-semibold text-gray-400 font-mono">
                                ({bus.model} {bus.year})
                              </span>
                            </h5>
                            <p className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                              <span className="inline-flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                                {bus.driver?.name || (isRtl ? "بدون سائق" : "No Driver")}
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                {bus.route?.name || (isRtl ? "بدون مسار محدد" : "No Route")}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="text-left rtl:text-right">
                          <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full ${
                            bus.status === "active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}>
                            {bus.status === "active" ? (isRtl ? "نشطة وجاهزة" : "Active") : (isRtl ? "صيانة/توقف" : "Idle")}
                          </span>
                        </div>
                      </div>

                      {/* Capacity & Occupancy Bar */}
                      <div className="mt-3 pt-2 border-t border-gray-200/50 dark:border-white/5 flex items-center justify-between text-[11px]">
                        <span className="text-gray-500 font-medium">
                          {isRtl ? "نسبة إشغال المقاعد" : "Seat Occupancy"}:{" "}
                          <strong className="text-[#0f2044] dark:text-white">
                            {bus.assigned_students_count} / {bus.capacity}
                          </strong>
                        </span>
                        <span className="font-bold text-[#0f2044] dark:text-white">{bus.occupancy_rate}%</span>
                      </div>
                      <div className="mt-1.5 w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            bus.occupancy_rate > 90 ? "bg-rose-500" : "bg-[#f5b800]"
                          }`}
                          style={{ width: `${Math.min(bus.occupancy_rate, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <Bus className="w-12 h-12 mb-2 opacity-20" />
                    <p className="font-bold text-xs">{isRtl ? "لا توجد حافلات مسجلة بالمدرسة" : "No buses registered"}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>

        {/* ─── Analytics Section: Attendance & Bus Distribution ───────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Attendance Trend Chart */}
          <div className="p-6 md:p-7 rounded-[28px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg text-[#0f2044] dark:text-white">
                    {isRtl ? "مؤشر الحضور الأسبوعي للطلاب" : "Weekly Student Attendance Trend"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isRtl ? "سجل الحضور والغياب لآخر 7 أيام" : "Real attendance for the last 7 days"}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0f204410" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#0f2044",
                      borderRadius: "16px",
                      border: "none",
                      color: "#fff",
                      fontWeight: "bold",
                      padding: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                      direction: isRtl ? "rtl" : "ltr",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPresent)"
                    name={isRtl ? "حاضر" : "Present"}
                    activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={0.02}
                    fill="#ef4444"
                    name={isRtl ? "غائب" : "Absent"}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Students by Bus Distribution */}
          <div className="p-6 md:p-7 rounded-[28px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/10 rounded-xl text-sky-500">
                  <Users2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg text-[#0f2044] dark:text-white">
                    {isRtl ? "توزيع الطلاب على الحافلات" : "Student Distribution Per Bus"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {isRtl ? "أعداد الركاب الفعليين المخصصين" : "Assigned student manifests"}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[280px] w-full">
              {studentsByBus && studentsByBus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentsByBus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0f204410" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }} />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(15, 32, 68, 0.05)" }}
                      contentStyle={{
                        backgroundColor: "#0f2044",
                        borderRadius: "16px",
                        border: "none",
                        color: "#fff",
                        fontWeight: "bold",
                        padding: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                        direction: isRtl ? "rtl" : "ltr",
                      }}
                      itemStyle={{ color: "#f5b800" }}
                    />
                    <Bar dataKey="value" name={isRtl ? "عدد الطلاب" : "Students"} fill="#0f2044" radius={[8, 8, 0, 0]} barSize={36}>
                      {studentsByBus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#0f2044" : "#f5b800"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Bus className="w-12 h-12 mb-2 opacity-20" />
                  <p className="font-bold text-xs">{isRtl ? "لا توجد بيانات توزيع متاحة" : "No distribution data"}</p>
                </div>
              )}
            </div>
          </div>

        </motion.div>

        {/* ─── Quick Actions & Real Database Stream ────────────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Quick Actions Grid */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 md:p-7 rounded-[28px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm h-full">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="p-2 bg-[#f5b800]/10 rounded-xl text-[#f5b800]">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-[#0f2044] dark:text-white">
                  {isRtl ? "إجراءات الإدارة السريعة" : "Quick Operations"}
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <QuickAction icon={Navigation} label={isRtl ? "التتبع المباشر" : "Live Map"} link={route("school.live-tracking.index")} accent="navy" />
                <QuickAction icon={GraduationCap} label={isRtl ? "إدارة الطلاب" : "Students"} link={route("school.students.index")} accent="gold" />
                <QuickAction icon={ClipboardList} label={isRtl ? "سجل الحضور" : "Attendance"} link={route("school.attendance.index")} accent="navy" />
                <QuickAction icon={Bus} label={isRtl ? "أسطول الحافلات" : "Fleet"} link={route("school.buses.index")} accent="gold" />
                <QuickAction icon={RouteIcon} label={isRtl ? "تقارير العمليات" : "Operations Report"} link={route("school.reports.trip-operations")} accent="navy" />
                <QuickAction icon={Bell} label={isRtl ? "مركز التنبيهات" : "Alerts"} link={route("school.notifications.sent")} accent="gold" />
              </div>
            </div>
          </div>

          {/* Real Database Activity Stream */}
          <div className="lg:col-span-4">
            <div className="p-6 md:p-7 rounded-[28px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#0f2044]/5 dark:bg-white/5 rounded-xl text-[#0f2044] dark:text-white">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-lg text-[#0f2044] dark:text-white">
                    {isRtl ? "شريط الأحداث المباشر" : "Live Activity Stream"}
                  </h3>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="flex-1 space-y-4">
                {recentActivities && recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((act, idx) => (
                    <div key={idx} className="relative flex items-start gap-3 text-xs">
                      <div className={`relative z-10 w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center ${
                        act.type === "trip"
                          ? "bg-amber-500/10 text-amber-600"
                          : act.type === "absence"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-emerald-500/10 text-emerald-600"
                      }`}>
                        {act.type === "trip" ? (
                          <RouteIcon className="w-4 h-4" />
                        ) : act.type === "absence" ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="font-black text-[#0f2044] dark:text-white truncate">
                            {act.title}
                          </h5>
                          <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{act.time}</span>
                        </div>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5 line-clamp-1">
                          {isRtl ? act.description_ar : act.description_en}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 opacity-60">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                    <p className="text-xs font-bold text-gray-400">{isRtl ? "لا توجد نشاطات مسجلة حالياً" : "System idling"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </motion.div>

      </motion.div>
    </SchoolDashboardLayout>
  );
}

function SchoolDashboardLayout({ children, user, header }: any) {
  return (
    <SchoolAuthenticatedLayout user={user} header={header}>
      <div className="max-w-[1600px] mx-auto pb-16 px-4 md:px-8 pt-6">
        {children}
      </div>
    </SchoolAuthenticatedLayout>
  );
}

function LiveKpiCard({ title, value, sub, icon: Icon, accent }: any) {
  const accentMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    green: { bg: "bg-white dark:bg-[#1a2845]", text: "text-emerald-500", iconBg: "bg-emerald-500/10" },
    blue: { bg: "bg-white dark:bg-[#1a2845]", text: "text-sky-500", iconBg: "bg-sky-500/10" },
    gold: { bg: "bg-white dark:bg-[#1a2845]", text: "text-[#f5b800]", iconBg: "bg-[#f5b800]/10" },
    navy: { bg: "bg-white dark:bg-[#1a2845]", text: "text-[#0f2044] dark:text-white", iconBg: "bg-[#0f2044]/5 dark:bg-white/5 text-[#0f2044] dark:text-white" },
    rose: { bg: "bg-rose-500/5", text: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-500/20 text-rose-600" },
  };
  const style = accentMap[accent] ?? accentMap.navy;

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className={`relative p-5 rounded-[22px] ${style.bg} border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
          <Icon className={`w-4 h-4 ${accent === "rose" ? "" : style.text}`} />
        </div>
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      <div>
        <h4 className={`text-2xl font-black ${style.text}`}>{value}</h4>
        {sub && <p className="text-[10px] font-semibold text-gray-400 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, link, accent }: any) {
  return (
    <Link
      href={link}
      className={`group relative flex flex-col items-center justify-center p-5 rounded-[22px] transition-all duration-200 hover:-translate-y-1 active:scale-95 border overflow-hidden ${
        accent === "navy"
          ? "bg-[#0f2044] border-transparent text-white shadow-md shadow-[#0f2044]/20"
          : "bg-gray-50 dark:bg-[#243460] border-gray-100 dark:border-white/5 text-[#0f2044] dark:text-white hover:border-[#f5b800]/40"
      }`}
    >
      <div
        className={`mb-2.5 p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
          accent === "navy" ? "bg-white/10 text-[#f5b800]" : "bg-white dark:bg-white/5 text-[#0f2044] dark:text-[#f5b800] shadow-sm"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-xs font-black text-center leading-tight tracking-wide group-hover:text-[#f5b800] transition-colors">
        {label}
      </span>
    </Link>
  );
}
