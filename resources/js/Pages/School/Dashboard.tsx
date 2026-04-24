import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import useTranslation from "@/hooks/useTranslation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Bus, Users, Route as RouteIcon,
  Activity, TrendingUp, Calendar, Rocket,
  UserSquare2, ArrowUpRight, CheckCircle2, BookOpen,
  ClipboardList, MapPin, Zap,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

interface DashboardProps {
  auth: any;
  stats: {
    students: number;
    classes: number;
    buses: number;
    active_buses: number;
    routes: number;
    teachers: number;
    supervisors: number;
    attendance_percentage: number;
    attendance_today_count: number;
    daily_trips_today: number;
  };
  attendanceTrend: Array<{ date: string; present: number; absent: number; total: number }>;
  classDistribution: Array<{ name: string; value: number; color: string }>;
  recent_students: Array<{
    id: number;
    first_name_ar?: string;
    last_name_ar?: string;
    first_name_en?: string;
    last_name_en?: string;
    name?: string;
    full_name?: string;
    image?: string;
    created_at: string;
  }>;
  recentActivities: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    time: string;
    status: string;
  }>;
  system_status: string;
}

export default function SchoolDashboard({
  auth,
  stats,
  attendanceTrend = [],
  classDistribution = [],
  recent_students = [],
  recentActivities = [],
  system_status,
}: DashboardProps) {
  const { t, isRtl } = useTranslation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.08 } },
  };

  const statCards = [
    {
      title: isRtl ? "الطلاب" : "Students",
      value: stats.students,
      icon: <GraduationCap className="w-6 h-6" />,
      color: "blue",
      link: route("school.students.index"),
    },
    {
      title: isRtl ? "الفصول" : "Classes",
      value: stats.classes,
      icon: <BookOpen className="w-6 h-6" />,
      color: "indigo",
      link: route("school.classrooms.index"),
    },
    {
      title: isRtl ? "الحافلات" : "Buses",
      value: stats.buses,
      sub: `${stats.active_buses} ${isRtl ? "نشطة" : "Active"}`,
      icon: <Bus className="w-6 h-6" />,
      color: "emerald",
      link: route("school.buses.index"),
    },
    {
      title: isRtl ? "المسارات" : "Routes",
      value: stats.routes,
      icon: <RouteIcon className="w-6 h-6" />,
      color: "yellow",
      link: route("school.routes.index"),
    },
    {
      title: isRtl ? "المعلمين" : "Teachers",
      value: stats.teachers,
      icon: <UserSquare2 className="w-6 h-6" />,
      color: "rose",
      link: route("school.teachers.index"),
    },
    {
      title: isRtl ? "الرحلات اليوم" : "Trips Today",
      value: stats.daily_trips_today,
      icon: <Rocket className="w-6 h-6" />,
      color: "green",
      link: route("school.trips.dashboard"),
    },
  ];

  return (
    <SchoolAuthenticatedLayout user={auth.user}>
      <Head title={isRtl ? "لوحة التحكم" : "Dashboard"} />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className={isRtl ? "text-right" : "text-left"}>
            <h1 className={`text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              {isRtl ? "مرحباً بك، أيها المدير!" : "Welcome back, Principal!"}
            </h1>
            <p className={`mt-2 text-lg ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {isRtl ? "إليك نظرة عامة على مدرستك اليوم." : "Here is today's overview for your school."}
            </p>
          </div>

        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {statCards.map((card, idx) => (
            <StatCard key={idx} {...card} isDark={isDark} isRTL={isRtl} />
          ))}
        </div>

        {/* Attendance Banner */}
        <div className={`p-6 rounded-3xl border backdrop-blur-md relative overflow-hidden ${isDark ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-800/30" : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100"}`}>
          <div className={`flex flex-col md:flex-row items-center justify-between gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="p-3 bg-blue-500/10 rounded-2xl">
                <ClipboardList className="w-8 h-8 text-blue-500" />
              </div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {isRtl ? "الحضور اليوم" : "Today's Attendance"}
                </h3>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {stats.attendance_today_count} {isRtl ? "سجل" : "records"} • {stats.attendance_percentage}% {isRtl ? "حضور" : "present"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-black ${stats.attendance_percentage >= 80 ? "text-emerald-500" : stats.attendance_percentage >= 50 ? "text-amber-500" : "text-red-500"}`}>
                {stats.attendance_percentage}%
              </div>
              <Link
                href={route("school.attendance.index")}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                {isRtl ? "تسجيل الحضور" : "Take Attendance"}
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT: Charts (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Attendance Trend Chart */}
              <div className={`p-6 rounded-3xl border backdrop-blur-md ${isDark ? "bg-slate-800/40 border-slate-700 shadow-xl" : "bg-white border-slate-100 shadow-sm shadow-slate-200/50"}`}>
                <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""} ${isDark ? "text-white" : "text-slate-900"}`}>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  {isRtl ? "اتجاه الحضور (آخر 7 أيام)" : "Attendance Trend (7 Days)"}
                </h3>
                <div className="h-[230px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceTrend}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 10 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontSize: 10 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: isDark ? "#1e293b" : "#fff", borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                      <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" name={isRtl ? "حاضر" : "Present"} />
                      <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} fillOpacity={0.1} fill="#ef4444" name={isRtl ? "غائب" : "Absent"} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Class Distribution */}
              <div className={`p-6 rounded-3xl border backdrop-blur-md ${isDark ? "bg-slate-800/40 border-slate-700 shadow-xl" : "bg-white border-slate-100 shadow-sm shadow-slate-200/50"}`}>
                <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""} ${isDark ? "text-white" : "text-slate-900"}`}>
                  <Activity className="w-5 h-5 text-amber-500" />
                  {isRtl ? "توزيع الطلاب على الفصول" : "Students by Class"}
                </h3>
                <div className="h-[230px] w-full flex items-center justify-center relative">
                  {classDistribution.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={classDistribution} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                            {classDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center inset-0 pointer-events-none">
                        <span className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>{stats.students}</span>
                        <span className={`text-[10px] uppercase font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{isRtl ? "طالب" : "Students"}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <BookOpen className="w-10 h-10 mb-2" />
                      <p className="text-xs font-bold">{isRtl ? "لا توجد بيانات فصول" : "No class data"}</p>
                    </div>
                  )}
                </div>
                {classDistribution.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {classDistribution.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.name} ({item.value})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`p-6 rounded-3xl border backdrop-blur-md ${isDark ? "bg-slate-800/40 border-slate-700 shadow-xl" : "bg-white border-slate-100 shadow-sm shadow-slate-200/50"}`}>
              <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""} ${isDark ? "text-white" : "text-slate-900"}`}>
                <Zap className="w-5 h-5 text-amber-500" />
                {isRtl ? "إجراءات سريعة" : "Quick Actions"}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <QuickAction icon={<GraduationCap className="w-5 h-5" />} label={isRtl ? "تسجيل طالب" : "Enroll Student"} link={route("school.students.create")} color="blue" />
                <QuickAction icon={<ClipboardList className="w-5 h-5" />} label={isRtl ? "تسجيل الحضور" : "Take Attendance"} link={route("school.attendance.index")} color="emerald" />
                <QuickAction icon={<BookOpen className="w-5 h-5" />} label={isRtl ? "إضافة فصل" : "Add Class"} link={route("school.classrooms.index")} color="amber" />
                <QuickAction icon={<UserSquare2 className="w-5 h-5" />} label={isRtl ? "إضافة معلم" : "Add Teacher"} link={route("school.teachers.index")} color="red" />
              </div>
            </div>
          </div>

          {/* RIGHT: Activities & Info (4 cols) */}
          <div className="lg:col-span-4 space-y-8">

            {/* Recent Activities */}
            <div className={`p-6 rounded-3xl border backdrop-blur-md ${isDark ? "bg-slate-800/40 border-slate-700 shadow-xl" : "bg-white border-slate-100 shadow-sm shadow-slate-200/50"}`}>
              <h3 className={`font-bold text-lg mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>
                {isRtl ? "أحدث النشاطات" : "Recent Activity"}
              </h3>

              <div className="space-y-5">
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 6).map((act, idx) => (
                    <div key={idx} className={`group relative flex gap-4 ${isRtl ? "flex-row-reverse text-right" : "text-left"}`}>
                      {idx !== Math.min(recentActivities.length, 6) - 1 && (
                        <div className={`absolute top-9 ${isRtl ? "right-[19px]" : "left-[19px]"} bottom-0 w-[2px] bg-slate-100 dark:bg-slate-700/50 pointer-events-none`} />
                      )}
                      <div className={`relative z-10 w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm ${
                        act.type === "student" ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
                      }`}>
                        {act.type === "student" ? <GraduationCap className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h5 className={`text-sm font-black truncate ${isDark ? "text-white" : "text-slate-800"}`}>{act.title}</h5>
                          <span className={`text-[9px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"} whitespace-nowrap pt-1`}>{act.time}</span>
                        </div>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"} line-clamp-1 mt-0.5`}>{act.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 opacity-40">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                    <p className="text-xs font-bold">{isRtl ? "لا توجد أنشطة حديثة" : "No recent activity"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recently Added Students */}
            <div className={`p-6 rounded-3xl border backdrop-blur-md ${isDark ? "bg-slate-800/40 border-slate-700 shadow-xl" : "bg-white border-slate-100 shadow-sm shadow-slate-200/50"}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
                  {isRtl ? "الطلاب الجدد" : "New Students"}
                </h3>
                <Link href={route("school.students.index")} className="text-xs text-blue-500 font-bold hover:underline">
                  {isRtl ? "عرض الكل" : "View All"}
                </Link>
              </div>

              {recent_students.length > 0 ? (
                <div className="space-y-3">
                  {recent_students.map((student) => {
                    const displayName = student.full_name || (student.first_name_ar && student.last_name_ar ? `${student.first_name_ar} ${student.last_name_ar}` : student.name) || "—";
                    const initial = displayName.charAt(0) || "?";
                    return (
                      <div key={student.id} className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition ${isRtl ? "flex-row-reverse" : ""}`}>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-sm shrink-0">
                          {initial}
                        </div>
                        <div className={`flex-1 min-w-0 ${isRtl ? "text-right" : "text-left"}`}>
                          <p className={`font-bold text-sm truncate ${isDark ? "text-white" : "text-slate-800"}`}>{displayName}</p>
                          <p className="text-[10px] text-slate-500">{student.created_at ? new Date(student.created_at).toLocaleDateString() : "—"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-4 text-sm">{isRtl ? "لا يوجد طلاب مضافين حديثاً" : "No recent students"}</p>
              )}
            </div>

            {/* System Info Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-brand-dark to-brand-navy text-white text-center">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-brand-yellow" />
              </div>
              <p className="font-bold text-lg">Masarat Wasel</p>
              <p className="text-xs opacity-60 mt-1">{isRtl ? "الإصدار" : "Version"} 2.0.0</p>
            </div>
          </div>
        </div>
      </motion.div>
    </SchoolAuthenticatedLayout>
  );
}

// --- Sub Components ---

function StatCard({ title, value, sub, icon, color, isDark, isRTL, link }: any) {
  const colorSchemes: any = {
    blue: "text-blue-500 bg-blue-500/10",
    green: "text-emerald-500 bg-emerald-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    yellow: "text-amber-500 bg-amber-500/10",
    indigo: "text-indigo-500 bg-indigo-500/10",
    rose: "text-rose-500 bg-rose-500/10",
  };

  return (
    <Link href={link}>
      <motion.div
        whileHover={{ y: -5 }}
        className={`p-6 rounded-3xl border backdrop-blur-md relative overflow-hidden transition-all cursor-pointer ${
          isDark ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 shadow-xl" : "bg-white border-slate-100 hover:bg-slate-50/50 shadow-sm shadow-slate-200/50 hover:shadow-lg"
        }`}
      >
        <div className={`relative z-10 flex flex-col gap-2 ${isRTL ? "items-end" : "items-start"}`}>
          <div className={`p-3 rounded-2xl mb-2 ${colorSchemes[color]}`}>
            {icon}
          </div>
          <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-300" : "text-slate-500"}`}>{title}</p>
          <h4 className={`text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>{value}</h4>
          {sub && <p className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>{sub}</p>}
        </div>
        <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-[0.05] pointer-events-none ${colorSchemes[color]?.split(" ")[1]}`} />
      </motion.div>
    </Link>
  );
}

function QuickAction({ icon, label, link, color }: any) {
  const bgColors: any = {
    blue: "bg-blue-500 shadow-blue-500/20 hover:bg-blue-600",
    emerald: "bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600",
    amber: "bg-amber-500 shadow-amber-500/20 hover:bg-amber-600",
    red: "bg-red-500 shadow-red-500/20 hover:bg-red-600",
  };

  return (
    <Link
      href={link}
      className={`flex flex-col items-center justify-center p-5 rounded-2xl text-white font-black text-[10px] gap-2 transition-all hover:-translate-y-1 active:scale-95 shadow-lg ${bgColors[color]}`}
    >
      {icon}
      <span className="text-center leading-tight">{label}</span>
    </Link>
  );
}
