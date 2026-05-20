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
    AlertTriangle, Users2, TrendingDown, LayoutDashboard
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import {
    DS_pageWrapper,
} from "@/lib/DS";

interface DashboardProps {
  auth: any;
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
    id: number;
    type: string;
    title: string;
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
    'private',
    `App.Models.User.${auth.user.id}`,
    '.notification.pushed',
    (e: any) => {
        router.reload({ only: ['stats', 'transport', 'recentActivities'] });
    }
  );
  
  const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.1 } },
    };

    const itemVariants = {
    hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); 
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting = hour < 12 
    ? (isRtl ? 'صباح الخير' : 'Good Morning') 
    : (isRtl ? 'مساء الخير' : 'Good Evening');

  return (
    <SchoolDashboardLayout
        user={auth.user}
        header={
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#0f2044] dark:bg-[#f5b800]/10 rounded-xl">
                    <LayoutDashboard className="w-5 h-5 text-white dark:text-[#f5b800]" />
                </div>
                <h2 className="text-2xl font-black text-[#0f2044] dark:text-white tracking-tight">
                    {(isRtl ? 'اللوحة الرئيسية' : 'Command Center')}
                </h2>
            </div>
        }
    >
      <Head title={isRtl ? "لوحة التحكم" : "Dashboard"} />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
              className="space-y-8"
      >
              {/* World-Class Hero Section */}
              <motion.div variants={itemVariants} className="relative p-6 md:p-10 rounded-[32px] bg-[#0f2044] overflow-hidden shadow-2xl border border-white/10">
                  {/* Animated Glow Effects */}
                  <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-gradient-to-b from-[#f5b800]/20 to-transparent rounded-full blur-[120px] pointer-events-none" />
                  <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[120%] bg-gradient-to-t from-sky-500/20 to-transparent rounded-full blur-[100px] pointer-events-none" />
            
                  <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className={isRtl ? "text-right" : "text-left"}>

                          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3 tracking-tight">
                              {greeting}، <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5b800] to-yellow-200">
                            {isRtl 
                                      ? `${auth.user.first_name_ar || auth.user.name}`.trim()
                                      : `${auth.user.first_name_en || auth.user.name}`.trim()
                            }
                        </span>
                    </h1>
                          <p className="text-blue-100/70 text-base font-medium max-w-xl leading-relaxed">
                              {isRtl ? 'إليك نظرة شاملة وفورية لجميع عمليات النقل المدرسي ومؤشرات الأداء لهذا اليوم.' : 'Here is a comprehensive, real-time overview of all school transport operations and KPIs for today.'}
                          </p>
                </div>
                
                      <div className="flex flex-col items-center justify-center p-6 rounded-[24px] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] min-w-[260px]">
                          <div className="flex items-center gap-3 mb-3">
                              <Calendar className="w-5 h-5 text-[#f5b800]" />
                              <span className="text-white text-sm font-bold tracking-wide">{currentTime.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="text-center">
                              <div className="text-4xl font-black text-white tracking-widest tabular-nums">
                            {currentTime.toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                    </div>
                </div>
            </div>
              </motion.div>

              {/* Stakeholder Priority Metrics */}
              <motion.div variants={itemVariants}>
                  <div className="flex items-center gap-3 mb-5">
                      <div className="p-2.5 bg-gradient-to-br from-[#f5b800] to-yellow-600 rounded-xl shadow-lg shadow-[#f5b800]/20">
                          <Rocket className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-black text-xl text-[#0f2044] dark:text-white tracking-tight">
                          {isRtl ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators'}
                      </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Distance Card */}
                      <div className="group relative p-8 rounded-[32px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0f2044]/5 dark:bg-[#f5b800]/10 rounded-bl-full transition-transform duration-700 group-hover:scale-110" />
                          <div className="relative z-10">
                              <div className="w-14 h-14 rounded-2xl bg-[#0f2044]/5 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:bg-[#0f2044] group-hover:text-white dark:group-hover:bg-[#f5b800] dark:group-hover:text-[#0f2044] transition-colors duration-500 text-[#0f2044] dark:text-[#f5b800]">
                                  <RouteIcon className="w-7 h-7" />
                              </div>
                              <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                                  {isRtl ? 'المسافات المقطوعة' : 'Distance Covered'}
                              </p>
                              <h4 className="text-5xl font-black text-[#0f2044] dark:text-white flex items-baseline gap-2">
                                  {Number(transport.distance_today).toFixed(1).replace(/\.0$/, '')} <span className="text-lg font-bold text-gray-400">{isRtl ? 'كم' : 'KM'}</span>
                              </h4>
                          </div>
                      </div>

                      {/* Trips Card */}
                      <div className="group relative p-8 rounded-[32px] bg-gradient-to-br from-[#0f2044] to-[#162d60] border border-white/10 shadow-xl shadow-[#0f2044]/20 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                          <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#f5b800]/20 rounded-full blur-3xl" />
                          <div className="relative z-10">
                              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 text-[#f5b800]">
                                  <CheckCheck className="w-7 h-7" />
                              </div>
                              <p className="text-[13px] font-bold text-blue-200/70 uppercase tracking-widest mb-2">
                                  {isRtl ? 'الرحلات المنجزة اليوم' : 'Trips Completed Today'}
                              </p>
                              <div className="flex items-baseline gap-3">
                                  <h4 className="text-5xl font-black text-white">
                                      {transport.completed_trips_today}
                                  </h4>
                                  <span className="text-xl font-bold text-blue-200/50">/ {transport.total_trips_today}</span>
                              </div>
                              <div className="mt-4 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                  <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: transport.total_trips_today > 0 ? `${(transport.completed_trips_today / transport.total_trips_today) * 100}%` : '0%' }}
                                      transition={{ duration: 1.5, ease: "easeOut" }}
                                      className="h-full bg-[#f5b800] rounded-full"
                                  />
                              </div>
                          </div>
                      </div>

                      {/* Safety Card */}
                      <div className="group relative p-8 rounded-[32px] bg-emerald-500 text-white border border-emerald-400 shadow-xl shadow-emerald-500/20 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
                          <div className="relative z-10">
                              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6 text-white">
                                  <ShieldCheck className="w-7 h-7" />
                              </div>
                              <p className="text-[13px] font-bold text-emerald-100 uppercase tracking-widest mb-2">
                                  {isRtl ? 'أيام عمل بدون حوادث' : 'Zero-Incident Days'}
                              </p>
                              <h4 className="text-5xl font-black text-white flex items-baseline gap-2">
                                  {transport.zero_incident_days} <span className="text-lg font-bold text-emerald-200">{isRtl ? 'يوم' : 'Days'}</span>
                              </h4>
                          </div>
                      </div>
                  </div>
              </motion.div>

              {/* Live Operations Row */}
              <motion.div variants={itemVariants}>
                  <div className="flex items-center gap-3 mb-5 mt-4">
                      <div className="p-2.5 bg-rose-500/10 rounded-xl shadow-sm">
                          <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                      </div>
                      <h3 className="font-black text-xl text-[#0f2044] dark:text-white tracking-tight">
                          {isRtl ? 'العمليات المباشرة' : 'Live Operations'}
                      </h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                      <LiveKpiCard
                          title={isRtl ? "رحلات نشطة" : "Active Trips"}
                          value={transport.active_trips_now}
                          sub={isRtl ? "في الطريق الآن" : "on the road now"}
                          icon={RouteIcon}
                          accent="blue"
                      />
                      <LiveKpiCard
                          title={isRtl ? "حافلات متأخرة" : "Delayed Buses"}
                          value={transport.delayed_buses_now}
                          sub={isRtl ? "تتطلب انتباه" : "requires attention"}
                          icon={AlertTriangle}
                          accent={transport.delayed_buses_now > 0 ? "rose" : "green"}
                      />
                      <LiveKpiCard
                          title={isRtl ? "طلاب منقولون" : "Transported"}
                          value={transport.students_transported_today}
                          sub={isRtl ? "طالب اليوم" : "students today"}
                          icon={Users}
                          accent="navy"
                      />
                      <LiveKpiCard
                          title={isRtl ? "كفاءة الأسطول" : "Fleet Efficiency"}
                          value={`${transport.active_buses}/${transport.total_buses}`}
                          sub={isRtl ? "حافلة نشطة" : "active buses"}
                          icon={Bus}
                          accent="gold"
                      />
                  </div>
              </motion.div>

              {/* Analytics Section: Students by Bus & Attendance */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Students by Bus Distribution Chart */}
                  <div className="p-8 rounded-[32px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-500">
                                  <Users2 className="w-5 h-5" />
                        </div>
                              <h3 className="font-black text-lg text-[#0f2044] dark:text-white">
                                  {isRtl ? 'توزيع الطلاب حسب الحافلات' : 'Students Distribution by Bus'}
                              </h3>
                          </div>
                      </div>
                      <div className="h-[320px] w-full">
                          {studentsByBus && studentsByBus.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={studentsByBus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0f204410" />
                                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 'bold' }} dy={10} />
                                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 'bold' }} />
                                      <RechartsTooltip
                                          cursor={{ fill: 'rgba(15, 32, 68, 0.05)' }}
                                          contentStyle={{ backgroundColor: "#0f2044", borderRadius: "16px", border: "none", color: "#fff", fontWeight: "bold", padding: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)", direction: isRtl ? "rtl" : "ltr" }}
                                          itemStyle={{ color: "#f5b800" }}
                                      />
                                      <Bar
                                          dataKey="value"
                                          name={isRtl ? "عدد الطلاب" : "Students"}
                                          fill="#0f2044"
                                          radius={[8, 8, 0, 0]}
                                          barSize={40}
                                      >
                                          {studentsByBus.map((entry, index) => (
                                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#0f2044" : "#f5b800"} />
                                          ))}
                                      </Bar>
                                  </BarChart>
                              </ResponsiveContainer>
                          ) : (
                              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                  <Bus className="w-12 h-12 mb-3 opacity-20" />
                                  <p className="font-bold text-sm">{isRtl ? "لا توجد بيانات توزيع متاحة" : "No distribution data available"}</p>
                        </div>
                          )}
                      </div>
                  </div>

                  {/* Attendance Trend Chart */}
                  <div className="p-8 rounded-[32px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                                  <TrendingUp className="w-5 h-5" />
                              </div>
                              <h3 className="font-black text-lg text-[#0f2044] dark:text-white">
                                  {isRtl ? "مؤشر الحضور الأسبوعي" : "Weekly Attendance Trend"}
                              </h3>
                          </div>
                      </div>
                      <div className="h-[320px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <defs>
                                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0f204410" />
                                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 'bold' }} dy={10} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 'bold' }} />
                                  <RechartsTooltip 
                                      contentStyle={{ backgroundColor: "#0f2044", borderRadius: "16px", border: "none", color: "#fff", fontWeight: "bold", padding: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)", direction: isRtl ? "rtl" : "ltr" }}
                                  />
                                  <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorPresent)" name={isRtl ? "حاضر" : "Present"} activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 3 }} />
                                  <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={3} fillOpacity={0.02} fill="#ef4444" name={isRtl ? "غائب" : "Absent"} />
                              </AreaChart>
                          </ResponsiveContainer>
                </div>
            </div>

              </motion.div>

              {/* Quick Actions & Live Feed */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
                  <div className="lg:col-span-8 space-y-6">
                      <div className="p-8 rounded-[32px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm h-full">
                          <div className="flex items-center gap-3 mb-8">
                              <div className="p-2.5 bg-[#f5b800]/10 rounded-xl text-[#f5b800]">
                                  <Zap className="w-5 h-5" />
                              </div>
                              <h3 className="font-black text-lg text-[#0f2044] dark:text-white">
                                  {isRtl ? "إجراءات سريعة" : "Quick Actions"}
                              </h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                              <QuickAction icon={GraduationCap} label={isRtl ? "الطلاب" : "Students"} link={route("school.students.index")} accent="navy" />
                              <QuickAction icon={ClipboardList} label={isRtl ? "الحضور" : "Attendance"} link={route("school.attendance.index")} accent="gold" />
                              <QuickAction icon={Bus} label={isRtl ? "الحافلات" : "Fleet"} link={route("school.buses.index")} accent="navy" />
                              <QuickAction icon={Bell} label={isRtl ? "الإشعارات" : "Alerts"} link={route("school.notifications.sent")} accent="gold" />
                          </div>
                </div>
            </div>

                  <div className="lg:col-span-4">
                      <div className="p-8 rounded-[32px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 shadow-sm h-full flex flex-col">
                          <div className="flex items-center gap-3 mb-6">
                              <div className="p-2.5 bg-[#0f2044]/5 dark:bg-white/5 rounded-xl text-[#0f2044] dark:text-white">
                                  <Activity className="w-5 h-5" />
                              </div>
                              <h3 className="font-black text-lg text-[#0f2044] dark:text-white">
                                  {isRtl ? "النشاطات الحية" : "Live Activity Feed"}
                              </h3>
                          </div>
                          <div className="flex-1 space-y-6">
                        {recentActivities.length > 0 ? (
                                  recentActivities.slice(0, 4).map((act, idx) => (
                                      <div key={idx} className="relative flex items-start gap-4">
                                          {idx !== Math.min(recentActivities.length, 4) - 1 && (
                                              <div className="absolute top-10 rtl:right-[19px] ltr:left-[19px] bottom-[-24px] w-px bg-gray-100 dark:bg-white/5" />
                                    )}
                                    <div className={`relative z-10 w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm ${
                                        act.type === "student" ? "bg-sky-500/10 text-sky-500" : "bg-emerald-500/10 text-emerald-500"
                                    }`}>
                                        {act.type === "student" ? <GraduationCap className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <h5 className="text-[12px] font-black text-[#0f2044] dark:text-white truncate">{act.title}</h5>
                                            <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{act.time}</span>
                                        </div>
                                        <p className="text-[11px] font-medium text-gray-500 mt-1 line-clamp-1">
                                            {isRtl ? act.description_ar : act.description_en}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                                      <div className="flex flex-col items-center justify-center py-8 opacity-50">
                                          <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                                          <p className="text-sm font-bold text-gray-400">{isRtl ? "لا توجد نشاطات حالياً" : "System idling"}</p>
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
        green: { bg: 'bg-white dark:bg-[#1a2845]', text: 'text-emerald-500', iconBg: 'bg-emerald-500/10' },
        blue: { bg: 'bg-white dark:bg-[#1a2845]', text: 'text-sky-500', iconBg: 'bg-sky-500/10' },
        gold: { bg: 'bg-white dark:bg-[#1a2845]', text: 'text-[#f5b800]', iconBg: 'bg-[#f5b800]/10' },
        navy: { bg: 'bg-white dark:bg-[#1a2845]', text: 'text-[#0f2044] dark:text-white', iconBg: 'bg-[#0f2044]/5 dark:bg-white/5 text-[#0f2044] dark:text-white' },
        rose: { bg: 'bg-rose-500/5', text: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-500/20 text-rose-600' },
    };
    const style = accentMap[accent] ?? accentMap.navy;

    return (
      <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          className={`relative p-6 rounded-[24px] ${style.bg} border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300`}
      >
          <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${style.iconBg}`}>
                  <Icon className={`w-5 h-5 ${accent === 'rose' ? '' : style.text}`} />
              </div>
              <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{title}</p>
          </div>
          <div>
              <h4 className={`text-3xl font-black ${style.text}`}>{value}</h4>
              {sub && <p className="text-[11px] font-semibold text-gray-400 mt-2">{sub}</p>}
          </div>
      </motion.div>
  );
}

function QuickAction({ icon: Icon, label, link, accent }: any) {
  return (
    <Link
      href={link}
          className={`group relative flex flex-col items-center justify-center p-6 rounded-[24px] transition-all duration-300 hover:-translate-y-1 active:scale-95 border overflow-hidden ${
          accent === 'navy' 
          ? 'bg-[#0f2044] border-transparent text-white shadow-lg shadow-[#0f2044]/20'
          : 'bg-gray-50 dark:bg-[#243460] border-gray-100 dark:border-white/5 text-[#0f2044] dark:text-white hover:border-[#f5b800]/40'
      }`}
    >
          <div className={`mb-3 p-3.5 rounded-2xl transition-all duration-500 group-hover:scale-110 ${accent === 'navy' ? 'bg-white/10 text-[#f5b800]' : 'bg-white dark:bg-white/5 text-[#0f2044] dark:text-[#f5b800] shadow-sm'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
          <span className="text-[13px] font-black text-center leading-tight tracking-wide group-hover:text-[#f5b800] transition-colors">
          {label}
          </span>
    </Link>
  );
}
