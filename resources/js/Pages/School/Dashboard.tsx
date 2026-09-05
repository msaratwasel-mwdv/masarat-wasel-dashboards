import { useState, useMemo } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { useEchoEvent } from "@/hooks/useEcho";
import {
    Bus,
    Users,
    Route as RouteIcon,
    ShieldCheck,
    CheckCircle2,
    Radio,
    Bell,
    Activity,
    ArrowUpRight,
    ArrowRight,
    Layers,
    Sparkles,
    UserCheck,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

interface FleetBus {
    id: number;
    bus_number: string;
    plate_number: string;
    model: string | null;
    capacity: number;
    status: string;
    assigned_students_count: number;
    occupancy_rate: number;
    route: {
        id: number;
        name: string;
        code: string | null;
        distance_km: string | number | null;
    } | null;
    driver: {
        name: string;
        phone: string | null;
    } | null;
    assistant: {
        name: string;
        phone: string | null;
    } | null;
}

interface StudentItem {
    id: number;
    name: string;
    national_id: string | null;
    classroom: string;
    is_assigned: boolean;
    bus_number: string;
    plate_number: string;
    guardian_name: string;
    guardian_phone: string;
}

interface DashboardProps {
    auth: any;
    school?: {
        id: number;
        name: string;
        code?: string;
    } | null;
    fleet?: FleetBus[];
    studentPulse?: {
        total_enrolled: number;
        assigned_to_transport: number;
        unassigned_students: number;
        manifest: StudentItem[];
    };
    transport?: {
        completed_trips_today: number;
        total_trips_today: number;
        students_transported_today: number;
        trip_success_rate: number;
        active_buses: number;
        total_buses: number;
        delays_this_month: number;
        active_trips_now: number;
        delayed_buses_now: number;
        distance_today: number;
        zero_incident_days: number;
    };
    attendanceTrend?: Array<{
        date: string;
        day_ar?: string;
        day_en?: string;
        present: number;
        absent: number;
        total: number;
    }>;
    recentActivities?: Array<{
        id: number;
        type: string;
        title?: string;
        title_ar?: string;
        title_en?: string;
        description?: string;
        description_ar: string;
        description_en: string;
        time?: string;
        time_ar?: string;
        time_en?: string;
        status: string;
    }>;
}

export default function SchoolDashboard({
    auth,
    school,
    fleet = [],
    studentPulse,
    transport,
    attendanceTrend = [],
    recentActivities = [],
}: DashboardProps) {
    const { theme, isRTL: isRtl } = useTheme();
    const isDark = theme === "dark";

    // Period switcher for Attendance Volume (Week / Month)
    const [barPeriod, setBarPeriod] = useState<"weekly" | "monthly">("weekly");

    // Real-time echo updates
    useEchoEvent(
        "private",
        `App.Models.User.${auth.user.id}`,
        ".notification.pushed",
        () => {
            router.reload({
                only: [
                    "fleet",
                    "studentPulse",
                    "recentActivities",
                    "transport",
                    "attendanceTrend",
                ],
            });
        },
    );

    // 1. Attendance Volume Bar Chart Data (Week / Month)
    const barChartData = useMemo(() => {
        if (barPeriod === "monthly") {
            const currentPresent = attendanceTrend.reduce(
                (acc, d) => acc + d.present,
                0,
            );
            const currentAbsent = attendanceTrend.reduce(
                (acc, d) => acc + d.absent,
                0,
            );
            return [
                { label: isRtl ? "أسبوع 1" : "Week 1", present: 0, absent: 0 },
                { label: isRtl ? "أسبوع 2" : "Week 2", present: 0, absent: 0 },
                { label: isRtl ? "أسبوع 3" : "Week 3", present: 0, absent: 0 },
                {
                    label: isRtl ? "أسبوع 4" : "Week 4",
                    present: currentPresent,
                    absent: currentAbsent,
                },
            ];
        }

        const arabicToEnglishDays: Record<string, string> = {
            السبت: "Sat",
            سبت: "Sat",
            الأحد: "Sun",
            أحد: "Sun",
            الإثنين: "Mon",
            الاثنين: "Mon",
            إثنين: "Mon",
            اثنين: "Mon",
            الثلاثاء: "Tue",
            ثلاثاء: "Tue",
            الأربعاء: "Wed",
            الاربعاء: "Wed",
            أربعاء: "Wed",
            اربعاء: "Wed",
            الخميس: "Thu",
            خميس: "Thu",
            الجمعة: "Fri",
            جمعة: "Fri",
        };

        const englishToArabicDays: Record<string, string> = {
            Sat: "السبت",
            Saturday: "السبت",
            Sun: "الأحد",
            Sunday: "الأحد",
            Mon: "الإثنين",
            Monday: "الإثنين",
            Tue: "الثلاثاء",
            Tuesday: "الثلاثاء",
            Wed: "الأربعاء",
            Wednesday: "الأربعاء",
            Thu: "الخميس",
            Thursday: "الخميس",
            Fri: "الجمعة",
            Friday: "الجمعة",
        };

        // Weekly View (Real data from DB)
        if (attendanceTrend.length > 0) {
            return attendanceTrend.map((d) => {
                let label = d.date;
                if (isRtl) {
                    if (d.day_ar) {
                        label = d.day_ar;
                    } else if (englishToArabicDays[d.date]) {
                        label = englishToArabicDays[d.date];
                    } else if (/^\d{4}-\d{2}-\d{2}/.test(d.date)) {
                        try {
                            label = new Intl.DateTimeFormat("ar-SA", {
                                weekday: "short",
                            }).format(new Date(d.date));
                        } catch {
                            label = d.date;
                        }
                    }
                } else {
                    if (d.day_en) {
                        label = d.day_en;
                    } else if (arabicToEnglishDays[d.date]) {
                        label = arabicToEnglishDays[d.date];
                    } else if (/^\d{4}-\d{2}-\d{2}/.test(d.date)) {
                        try {
                            label = new Intl.DateTimeFormat("en-US", {
                                weekday: "short",
                            }).format(new Date(d.date));
                        } catch {
                            label = d.date;
                        }
                    }
                }

                return {
                    label,
                    present: d.present,
                    absent: d.absent,
                    total: d.total,
                };
            });
        }

        const days = isRtl
            ? [
                  "السبت",
                  "الأحد",
                  "الإثنين",
                  "الثلاثاء",
                  "الأربعاء",
                  "الخميس",
                  "الجمعة",
              ]
            : ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
        return days.map((day) => ({
            label: day,
            present: 0,
            absent: 0,
            total: 0,
        }));
    }, [barPeriod, attendanceTrend, isRtl]);

    // 2. Fleet Seating Capacity & Load Utilization Data
    const fleetCapacityData = useMemo(() => {
        if (fleet.length > 0) {
            return fleet.map((b) => {
                const allocated = b.assigned_students_count || 0;
                const capacity = b.capacity || 20;
                const available = Math.max(0, capacity - allocated);
                const name = b.bus_number;
                return {
                    name,
                    bus_number: b.bus_number,
                    plate_number: b.plate_number,
                    route_name:
                        b.route?.name || (isRtl ? "المسار 1" : "Route 1"),
                    allocated,
                    available,
                    capacity,
                    occupancy_rate:
                        b.occupancy_rate ||
                        (capacity > 0
                            ? Math.round((allocated / capacity) * 100)
                            : 0),
                };
            });
        }

        return [
            {
                name: "B-100",
                bus_number: "B-100",
                plate_number: "ABC-7021",
                route_name: isRtl ? "المسار رقم 1" : "Route 1",
                allocated: 2,
                available: 18,
                capacity: 20,
                occupancy_rate: 10,
            },
        ];
    }, [fleet, isRtl]);

    const totalCapacityStats = useMemo(() => {
        const totalCap = fleetCapacityData.reduce(
            (acc, b) => acc + b.capacity,
            0,
        );
        const totalAlloc = fleetCapacityData.reduce(
            (acc, b) => acc + b.allocated,
            0,
        );
        const totalAvail = Math.max(0, totalCap - totalAlloc);
        const avgRate =
            totalCap > 0 ? Math.round((totalAlloc / totalCap) * 100) : 0;
        return { totalCap, totalAlloc, totalAvail, avgRate };
    }, [fleetCapacityData]);

    // 100% REAL Student Manifest from database (take 5)
    const realStudents = useMemo(() => {
        return (studentPulse?.manifest || []).slice(0, 5);
    }, [studentPulse]);

    // 100% REAL Activities from database
    const realActivities = useMemo(() => {
        return recentActivities.slice(0, 4);
    }, [recentActivities]);

    const schoolTitle =
        school?.name || (isRtl ? "إدارة المدرسة" : "School Management");

    // Custom Tooltip for Attendance Volume (sleek, zero clipping, no gray block)
    const CustomAttendanceTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;
        const presentVal =
            payload.find((p: any) => p.dataKey === "present")?.value ?? 0;
        const absentVal =
            payload.find((p: any) => p.dataKey === "absent")?.value ?? 0;
        const totalVal = presentVal + absentVal;
        const rate =
            totalVal > 0 ? Math.round((presentVal / totalVal) * 100) : 100;

        return (
            <div className="bg-[#0B1120]/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-3 text-xs text-white min-w-[160px] pointer-events-none">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60 font-mono">
                    <span className="font-bold text-slate-200 text-[11px]">
                        {label}
                    </span>
                    <span className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25">
                        {isRtl ? "سجل الحضور" : "Attendance"}
                    </span>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-slate-300 text-[11px]">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50" />
                            <span>{isRtl ? "حاضر" : "Present"}</span>
                        </div>
                        <span className="font-bold font-mono text-white text-xs">
                            {presentVal}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 text-[11px]">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 shadow-xs shadow-red-500/50" />
                            <span>{isRtl ? "غائب" : "Absent"}</span>
                        </div>
                        <span className="font-bold font-mono text-white text-xs">
                            {absentVal}
                        </span>
                    </div>
                    {totalVal > 0 && (
                        <div className="pt-1.5 mt-1 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                            <span>
                                {isRtl ? "نسبة الحضور" : "Attendance Rate"}
                            </span>
                            <span className="font-bold font-mono text-emerald-400 text-xs">
                                {rate}%
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Custom Tooltip for Fleet Capacity & Load Utilization (with utilization progress bar)
    const CustomCapacityTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null;
        const data = payload[0]?.payload;
        if (!data) return null;
        return (
            <div className="bg-[#0B1120]/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-3 text-xs text-white min-w-[195px] pointer-events-none">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                        <Bus className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-mono text-blue-400 font-bold text-xs">
                            {data.bus_number}
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80">
                        {data.route_name}
                    </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-300">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50" />
                            <span>
                                {isRtl ? "المقاعد المشغولة" : "Allocated Seats"}
                            </span>
                        </div>
                        <span className="font-bold font-mono text-white text-xs">
                            {data.allocated}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-500 shadow-xs shadow-slate-500/50" />
                            <span>
                                {isRtl ? "المقاعد الشاغرة" : "Free / Available"}
                            </span>
                        </div>
                        <span className="font-bold font-mono text-slate-300 text-xs">
                            {data.available}
                        </span>
                    </div>
                    <div className="pt-2 mt-1.5 border-t border-slate-700/60 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                            <span className="text-[10px] text-slate-400">
                                {isRtl
                                    ? "نسبة إشغال الحافلة"
                                    : "Load Utilization"}
                                :
                            </span>
                            <span className="text-emerald-400 font-mono text-xs">
                                {data.occupancy_rate}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                    data.occupancy_rate > 90
                                        ? "bg-red-500"
                                        : data.occupancy_rate > 75
                                          ? "bg-amber-500"
                                          : "bg-blue-500"
                                }`}
                                style={{
                                    width: `${Math.min(100, data.occupancy_rate)}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <SchoolAuthenticatedLayout user={auth.user} isLiveTracking={true}>
            <Head title={isRtl ? "لوحة العمليات" : "Dashboard"} />

            {/* ── 100vh Rigid Cockpit (No Scroll, App Brand Colors) ── */}
            <div className="w-full h-full flex flex-col justify-between p-3 md:p-4 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 overflow-hidden select-none">
                {/* ── Row 1: 4 Metric Cards (Clean Slate, Distinct Color Accents) ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
                    {/* Card 1: Total Enrolled Students (Blue Accent) */}
                    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                {isRtl ? "إجمالي الطلاب" : "Total Students"}
                            </span>
                        </div>
                        <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono mt-1.5">
                            {studentPulse?.total_enrolled ?? 0}
                        </div>
                    </div>

                    {/* Card 2: Active Buses / Fleet Units (Emerald Accent) */}
                    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                {isRtl ? " الحافلات" : "Active Fleet"}
                            </span>
                        </div>
                        <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono mt-1.5">
                            {fleet.length}
                        </div>
                    </div>

                    {/* Card 3: Trips Today (Indigo Accent) */}
                    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                {isRtl ? "رحلات اليوم" : "Trips Today"}
                            </span>
                        </div>
                        <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono mt-1.5">
                            {transport?.completed_trips_today ?? 0} /{" "}
                            {transport?.total_trips_today ?? 0}
                        </div>
                    </div>

                    {/* Card 4: Quick Action Buttons (Replaces Safe Days) */}
                    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 md:p-3 flex flex-col justify-between shadow-xs transition-all">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <Link
                                href={route("school.live-tracking.index")}
                                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs group"
                                title={
                                    isRtl
                                        ? "تتبع الحافلات المباشر"
                                        : "Live Fleet Tracking"
                                }
                            >
                                <Radio className="w-3.5 h-3.5 animate-pulse text-blue-200" />
                                <span className="truncate">
                                    {isRtl ? "تتبع الحافلات" : "Live Fleet"}
                                </span>
                                <ArrowUpRight className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                            </Link>

                            <Link
                                href={route("school.buses.students.assign")}
                                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs group"
                                title={
                                    isRtl
                                        ? "تعيين الطلاب على الحافلات"
                                        : "Assign Students"
                                }
                            >
                                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="truncate">
                                    {isRtl ? "تعيين الطلاب" : "Assign"}
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Row 2: Middle Charts (Left: Attendance Volume Bar | Right: Fleet Seating Capacity & Load Utilization) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0 my-2.5">
                    {/* Card 1: Attendance Volume Bar Chart with (Week - Month) Switcher */}
                    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col min-h-0 shadow-xs">
                        <div className="flex items-center justify-between flex-shrink-0 mb-1.5">
                            <div>
                                <h2 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                                    {isRtl
                                        ? "سجل حضور وغياب الطلاب"
                                        : "Attendance Volume"}
                                </h2>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {isRtl
                                        ? "معدل حضور وغياب الطلاب بالنظام"
                                        : "Student attendance by period"}
                                </p>
                            </div>

                            {/* Week - Month Switcher Pills */}
                            <div className="flex items-center bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/60 p-0.5 rounded-lg text-[10px] font-bold">
                                <button
                                    onClick={() => setBarPeriod("weekly")}
                                    className={`px-2.5 py-0.5 rounded-md transition-colors ${
                                        barPeriod === "weekly"
                                            ? "bg-blue-600 text-white shadow-xs"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                    }`}
                                >
                                    {isRtl ? "أسبوعي" : "Week"}
                                </button>
                                <button
                                    onClick={() => setBarPeriod("monthly")}
                                    className={`px-2.5 py-0.5 rounded-md transition-colors ${
                                        barPeriod === "monthly"
                                            ? "bg-blue-600 text-white shadow-xs"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                    }`}
                                >
                                    {isRtl ? "شهري" : "Month"}
                                </button>
                            </div>
                        </div>

                        {/* Recharts Bar (Cursor without ugly solid gray block, no stuttering) */}
                        <div className="flex-1 relative min-h-0">
                            <div className="absolute inset-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={barChartData}
                                        margin={{
                                            top: 8,
                                            right: 10,
                                            left: -20,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke={
                                                isDark ? "#334155" : "#E2E8F0"
                                            }
                                            opacity={0.6}
                                        />
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: isDark
                                                    ? "#94A3B8"
                                                    : "#64748B",
                                                fontSize: 10,
                                            }}
                                            dy={6}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: isDark
                                                    ? "#94A3B8"
                                                    : "#64748B",
                                                fontSize: 10,
                                            }}
                                            allowDecimals={false}
                                        />
                                        <RechartsTooltip
                                            isAnimationActive={false}
                                            cursor={false}
                                            allowEscapeViewBox={{
                                                x: false,
                                                y: true,
                                            }}
                                            wrapperStyle={{
                                                outline: "none",
                                                pointerEvents: "none",
                                                zIndex: 20,
                                            }}
                                            content={
                                                <CustomAttendanceTooltip />
                                            }
                                        />
                                        <Bar
                                            dataKey="present"
                                            name={isRtl ? "حاضر" : "Present"}
                                            fill="#3B82F6"
                                            radius={[4, 4, 0, 0]}
                                            barSize={18}
                                            activeBar={{ fill: "#60A5FA" }}
                                        />
                                        <Bar
                                            dataKey="absent"
                                            name={isRtl ? "غائب" : "Absent"}
                                            fill="#EF4444"
                                            radius={[4, 4, 0, 0]}
                                            barSize={18}
                                            activeBar={{ fill: "#F87171" }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Fleet Seating Capacity & Load Utilization (Replacing duplicate attendance rate) */}
                    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col min-h-0 shadow-xs">
                        <div className="flex items-center justify-between flex-shrink-0 mb-1.5">
                            <div>
                                <h2 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                                    {isRtl
                                        ? "توزيع إشغال وسعة مقاعد الحافلات"
                                        : "Fleet Seating Capacity & Load"}
                                </h2>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {isRtl
                                        ? "المقاعد المشغولة مقابل الشاغرة لكل حافلة"
                                        : "Allocated vs available seats per vehicle"}
                                </p>
                            </div>

                            {/* Seating Capacity Ratio Badge (e.g. 2 / 20) */}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/60 shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400">
                                    {totalCapacityStats.totalAlloc}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 font-mono text-xs">
                                    /
                                </span>
                                <span className="font-mono font-bold text-xs text-slate-700 dark:text-slate-300">
                                    {totalCapacityStats.totalCap}
                                </span>
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                    {isRtl ? "مقعد" : "seats"}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                                    {totalCapacityStats.avgRate}%
                                </span>
                            </div>
                        </div>

                        {/* Stacked Capacity Bar Chart */}
                        <div className="flex-1 relative min-h-0">
                            <div className="absolute inset-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={fleetCapacityData}
                                        margin={{
                                            top: 8,
                                            right: 10,
                                            left: -20,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke={
                                                isDark ? "#334155" : "#E2E8F0"
                                            }
                                            opacity={0.6}
                                        />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: isDark
                                                    ? "#94A3B8"
                                                    : "#64748B",
                                                fontSize: 10,
                                            }}
                                            dy={6}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: isDark
                                                    ? "#94A3B8"
                                                    : "#64748B",
                                                fontSize: 10,
                                            }}
                                            allowDecimals={false}
                                        />
                                        <RechartsTooltip
                                            isAnimationActive={false}
                                            cursor={false}
                                            allowEscapeViewBox={{
                                                x: false,
                                                y: true,
                                            }}
                                            wrapperStyle={{
                                                outline: "none",
                                                pointerEvents: "none",
                                                zIndex: 20,
                                            }}
                                            content={<CustomCapacityTooltip />}
                                        />
                                        <Bar
                                            dataKey="allocated"
                                            name={
                                                isRtl
                                                    ? "المقاعد المشغولة"
                                                    : "Allocated"
                                            }
                                            stackId="seatCapacity"
                                            fill="#3B82F6"
                                            radius={[0, 0, 0, 0]}
                                            barSize={32}
                                            activeBar={{ fill: "#60A5FA" }}
                                        />
                                        <Bar
                                            dataKey="available"
                                            name={
                                                isRtl
                                                    ? "المقاعد الشاغرة"
                                                    : "Available"
                                            }
                                            stackId="seatCapacity"
                                            fill={
                                                isDark ? "#334155" : "#CBD5E1"
                                            }
                                            radius={[4, 4, 0, 0]}
                                            barSize={32}
                                            activeBar={{
                                                fill: isDark
                                                    ? "#475569"
                                                    : "#94A3B8",
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Row 3: Bottom Split (History Table 8 cols + Activities 4 cols) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
                    {/* Left: Real Students Table (8 Cols) */}
                    <div className="lg:col-span-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col min-h-0 shadow-xs overflow-hidden">
                        <div className="flex items-center justify-between flex-shrink-0 mb-1.5">
                            <div>
                                <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                                    {isRtl
                                        ? "كشف الطلاب المسجلين"
                                        : "Registered Students"}
                                </h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {isRtl
                                        ? "بيانات الطلاب المسجلين وحالة تعيينهم على الحافلات"
                                        : "Real registered students and bus assignment status"}
                                </p>
                            </div>

                            <Link
                                href={route("school.students.index")}
                                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {isRtl ? "عرض الكل" : "View all"}
                            </Link>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-hidden min-h-0">
                            <div className="w-full h-full overflow-y-auto custom-scrollbar">
                                <table
                                    className={`w-full text-xs ${isRtl ? "text-right" : "text-left"}`}
                                >
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                                            <th
                                                className={`pb-1.5 ${isRtl ? "text-right" : "text-left"}`}
                                            >
                                                {isRtl
                                                    ? "اسم الطالب"
                                                    : "Student Name"}
                                            </th>
                                            <th
                                                className={`pb-1.5 ${isRtl ? "text-right" : "text-left"}`}
                                            >
                                                {isRtl
                                                    ? "الصف / الفصل"
                                                    : "Class"}
                                            </th>
                                            <th
                                                className={`pb-1.5 ${isRtl ? "text-right" : "text-left"}`}
                                            >
                                                {isRtl ? "الحافلة" : "Bus"}
                                            </th>
                                            <th
                                                className={`pb-1.5 ${isRtl ? "text-right" : "text-left"}`}
                                            >
                                                {isRtl
                                                    ? "ولي الأمر والهاتف"
                                                    : "Guardian"}
                                            </th>
                                            <th className="pb-1.5 text-center">
                                                {isRtl
                                                    ? "حالة التعيين"
                                                    : "Status"}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                        {realStudents.length > 0 ? (
                                            realStudents.map((s) => (
                                                <tr
                                                    key={s.id}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                                >
                                                    <td className="py-2">
                                                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[140px] md:max-w-[180px]">
                                                            {s.name}
                                                        </div>
                                                        {s.national_id && (
                                                            <div className="text-[10px] text-slate-400 font-mono">
                                                                {s.national_id}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2 text-slate-600 dark:text-slate-300">
                                                        {s.classroom}
                                                    </td>
                                                    <td className="py-2">
                                                        {s.is_assigned ? (
                                                            <span className="inline-flex items-center gap-1 font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded text-[11px] border border-blue-500/20">
                                                                <Bus className="w-3 h-3" />
                                                                {s.bus_number}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                                                {isRtl
                                                                    ? "غير مخصص"
                                                                    : "Unassigned"}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                                                            {s.guardian_name}
                                                        </div>
                                                        {s.guardian_phone !==
                                                            "—" && (
                                                            <div className="text-[10px] text-slate-400 font-mono">
                                                                {
                                                                    s.guardian_phone
                                                                }
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2 text-center">
                                                        {s.is_assigned ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                                {isRtl
                                                                    ? "مخصص للحافلة"
                                                                    : "Assigned"}
                                                            </span>
                                                        ) : (
                                                            <Link
                                                                href={route(
                                                                    "school.buses.students.assign",
                                                                )}
                                                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
                                                            >
                                                                <span>
                                                                    {isRtl
                                                                        ? "تعيين"
                                                                        : "Assign"}
                                                                </span>
                                                                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="py-6 text-center text-slate-400 text-xs"
                                                >
                                                    {isRtl
                                                        ? "لا توجد سجلات طلاب مسجلة"
                                                        : "No students found"}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right: Real Activities Feed (4 Cols) */}
                    <div className="lg:col-span-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex flex-col min-h-0 shadow-xs overflow-hidden">
                        <div className="flex items-center justify-between flex-shrink-0 mb-1.5">
                            <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                                {isRtl
                                    ? "الأنشطة والعمليات المسجلة"
                                    : "Recorded Activities"}
                            </h3>
                            <Activity className="w-4 h-4 text-slate-400" />
                        </div>

                        {/* Activities Vertical List with Real Data */}
                        <div className="flex-1 overflow-hidden min-h-0">
                            <div className="w-full h-full overflow-y-auto space-y-2 custom-scrollbar">
                                {realActivities.length > 0 ? (
                                    realActivities.map((act) => {
                                        const titleText = isRtl
                                            ? act.title_ar || act.title
                                            : act.title_en || act.title;
                                        const descText = isRtl
                                            ? act.description_ar ||
                                              act.description
                                            : act.description_en ||
                                              act.description;
                                        const timeText = isRtl
                                            ? act.time_ar || act.time
                                            : act.time_en || act.time;

                                        return (
                                            <div
                                                key={act.id}
                                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 transition-all"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                                                        {act.type ===
                                                        "attendance" ? (
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                        ) : (
                                                            <Bus className="w-3.5 h-3.5" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                            {titleText}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                                            {descText}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-[10px] font-mono text-slate-400 whitespace-nowrap ml-2 mr-2">
                                                    {timeText}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                                        <Activity className="w-6 h-6 mb-1 text-slate-300 dark:text-slate-600" />
                                        <span>
                                            {isRtl
                                                ? "لا توجد أنشطة مسجلة اليوم"
                                                : "No activity recorded yet"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
