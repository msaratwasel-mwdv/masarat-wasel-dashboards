/**
 * Dashboard Version: 2026.04.25.02
 * Design System: Navy & Gold (Masarat Wasel)
 * Localization: 100% Bilingual Support (Arabic/English)
 */
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Bus, Users, Route as RouteIcon,
  Activity, TrendingUp, Calendar, Rocket,
  UserSquare2, ArrowUpRight, CheckCircle2, BookOpen,
  ClipboardList, MapPin, Zap, Clock, ShieldCheck,
  ChevronRight, ArrowRight, Bell
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  DS_card,
  DS_pageTitle,
  DS_statLabel,
  DS_statValue2,
  DS_statIcon,
  DS_statCard
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
    description_ar: string;
    description_en: string;
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
  const { isRTL: isRtl } = useTheme();
  
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.08 } },
  };

  const statCards = [
    {
      title: isRtl ? "إجمالي الطلاب" : "Total Students",
      value: stats.students,
      icon: GraduationCap,
      accent: "blue" as const,
      link: route("school.students.index"),
    },
    {
      title: isRtl ? "الفصول الدراسية" : "Classrooms",
      value: stats.classes,
      icon: BookOpen,
      accent: "gold" as const,
      link: route("school.classrooms.index"),
    },
    {
      title: isRtl ? "أسطول الحافلات" : "Bus Fleet",
      value: stats.buses,
      icon: Bus,
      accent: "navy" as const,
      link: route("school.buses.index"),
    },
    {
      title: isRtl ? "المسارات المعتمدة" : "Active Routes",
      value: stats.routes,
      icon: RouteIcon,
      accent: "green" as const,
      link: route("school.routes.index"),
    },
    {
      title: isRtl ? "الهيئة التعليمية" : "Teaching Staff",
      value: stats.teachers,
      icon: UserSquare2,
      accent: "red" as const,
      link: route("school.teachers.index"),
    },
    {
      title: isRtl ? "رحلات اليوم" : "Today's Trips",
      value: stats.daily_trips_today,
      icon: Rocket,
      accent: "blue" as const,
      link: route("school.trips.dashboard"),
    },
  ];

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); 
    return () => clearInterval(timer);
  }, []);

  // Dynamic Greeting
  const hour = currentTime.getHours();
  const greeting = hour < 12 
    ? (isRtl ? 'صباح الخير' : 'Good Morning') 
    : (isRtl ? 'مساء الخير' : 'Good Evening');

  return (
    <SchoolDashboardLayout
        user={auth.user}
        header={
            <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-[#f5b800]" />
                <h2 className={DS_pageTitle}>
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
        {/* Welcome Hero Section */}
        <div className="relative p-4 md:p-5 rounded-[32px] bg-gradient-to-br from-[#0f2044] via-[#162d60] to-[#0f2044] overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f5b800]/10 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className={isRtl ? "text-right" : "text-left"}>
                    <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
                        {greeting}، <span className="text-[#f5b800]">
                            {isRtl 
                                ? `${auth.user.first_name_ar || auth.user.name} ${auth.user.last_name_ar || ''}`.trim()
                                : `${auth.user.first_name_en || auth.user.name} ${auth.user.last_name_en || ''}`.trim()
                            }
                        </span>
                    </h1>
                </div>
                
                <div className="flex flex-col items-center justify-center p-3 md:p-4 rounded-[20px] bg-white/5 border border-white/10 backdrop-blur-xl min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-3 h-3 text-[#f5b800]" />
                        <span className="text-white text-xs font-bold">{currentTime.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl md:text-3xl font-black text-white">
                            {currentTime.toLocaleTimeString(isRtl ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <p className="text-[8px] text-blue-200/50 uppercase tracking-[0.2em] font-bold">
                            {isRtl ? 'التوقيت المحلي الحالي' : 'Current Local Time'}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {statCards.map((card, idx) => (
            <StatCard key={idx} {...card} isRtl={isRtl} />
          ))}
        </div>

        {/* Highlights & Attendance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-8 group relative overflow-hidden p-8 rounded-[28px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] shadow-sm hover:shadow-xl transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] -mr-32 -mt-32 transition-all group-hover:scale-150" />
                
                <div className={`relative z-10 flex flex-col md:flex-row items-center gap-8 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <div className="flex-1 space-y-6">
                        <div className={`flex items-center gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500">
                                <ClipboardList className="w-8 h-8" />
                            </div>
                            <div className={isRtl ? "text-right" : "text-left"}>
                                <h3 className="text-xl font-black text-[#0f2044] dark:text-white">
                                    {isRtl ? "مؤشر الحضور اليومي" : "Today's Attendance"}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {stats.attendance_today_count} {isRtl ? "عملية تسجيل تمت اليوم" : "records processed today"}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#243460]/50 border border-gray-100 dark:border-white/5 text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{isRtl ? 'حاضر' : 'Present'}</p>
                                <p className="text-xl font-black text-emerald-500">{stats.attendance_percentage}%</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#243460]/50 border border-gray-100 dark:border-white/5 text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{isRtl ? 'غائب' : 'Absent'}</p>
                                <p className="text-xl font-black text-rose-500">{Math.max(0, 100 - stats.attendance_percentage)}%</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#243460]/50 border border-gray-100 dark:border-white/5 text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{isRtl ? 'الكل' : 'Total'}</p>
                                <p className="text-xl font-black text-[#0f2044] dark:text-white">{stats.students}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-px h-32 bg-gray-100 dark:bg-[#243460] hidden md:block" />

                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle className="text-gray-100 dark:text-[#243460] stroke-current" strokeWidth="10" cx="50" cy="50" r="40" fill="transparent"></circle>
                                <circle 
                                    className="text-emerald-500 stroke-current transition-all duration-1000" 
                                    strokeWidth="10" 
                                    strokeLinecap="round" 
                                    cx="50" cy="50" r="40" 
                                    fill="transparent" 
                                    strokeDasharray="251.2" 
                                    strokeDashoffset={251.2 - (251.2 * stats.attendance_percentage) / 100}
                                    transform="rotate(-90 50 50)"
                                ></circle>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-[#0f2044] dark:text-white">
                                {stats.attendance_percentage}%
                            </div>
                        </div>
                        <Link
                            href={route("school.attendance.index")}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0f2044] dark:bg-[#f5b800] text-white dark:text-[#0f2044] rounded-2xl font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                            {isRtl ? "إدارة الحضور" : "Manage Attendance"}
                            <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-4 p-8 rounded-[28px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] shadow-sm flex flex-col justify-between overflow-hidden relative">
                <div className="relative z-10">
                    <h3 className="font-black text-lg text-[#0f2044] dark:text-white mb-6">
                        {isRtl ? 'أداء النظام' : 'System Performance'}
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                <span>{isRtl ? 'كفاءة النقل' : 'Transport Efficiency'}</span>
                                <span className="text-emerald-500">98%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-[#243460] rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '98%' }} className="h-full bg-emerald-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                                <span>{isRtl ? 'التزام المعلمين' : 'Teacher Adherence'}</span>
                                <span className="text-[#f5b800]">85%</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-[#243460] rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-[#f5b800]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-[#0f2044]/5 dark:bg-[#f5b800]/5 border border-dashed border-[#0f2044]/20 dark:border-[#f5b800]/20 flex items-center gap-4">
                    <ShieldCheck className="w-10 h-10 text-[#f5b800]" />
                    <div>
                        <p className="text-xs font-bold text-[#0f2044] dark:text-white">{isRtl ? 'حماية البيانات مفعلة' : 'Data Protection Active'}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{isRtl ? 'يتم تشفير كافة البيانات بشكل لحظي' : 'All data encrypted in real-time'}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={DS_card}>
                    <div className="p-6 border-b border-gray-50 dark:border-[#243460] flex items-center justify-between">
                        <h3 className={`text-sm font-black flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""} text-[#0f2044] dark:text-white`}>
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            {isRtl ? "إحصائيات الحضور الأسبوعية" : "Weekly Attendance Trend"}
                        </h3>
                    </div>
                    <div className="p-6 h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendanceTrend}>
                                <defs>
                                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0f204410" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                                <RechartsTooltip 
                                    contentStyle={{ 
                                        backgroundColor: "#0f2044", 
                                        borderRadius: "16px", 
                                        border: "none", 
                                        color: "#fff",
                                        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" 
                                    }} 
                                />
                                <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorPresent)" name={isRtl ? "حاضر" : "Present"} />
                                <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} fillOpacity={0.05} fill="#ef4444" name={isRtl ? "غائب" : "Absent"} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={DS_card}>
                    <div className="p-6 border-b border-gray-50 dark:border-[#243460] flex items-center justify-between">
                        <h3 className={`text-sm font-black flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""} text-[#0f2044] dark:text-white`}>
                            <Activity className="w-5 h-5 text-[#f5b800]" />
                            {isRtl ? "توزيع الطلاب حسب الفصول" : "Class Distribution"}
                        </h3>
                    </div>
                    <div className="p-6 h-[280px] flex items-center justify-center relative">
                        {classDistribution.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={classDistribution} 
                                            innerRadius={70} 
                                            outerRadius={100} 
                                            paddingAngle={8} 
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {classDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute flex flex-col items-center justify-center inset-0 pointer-events-none">
                                    <span className="text-3xl font-black text-[#0f2044] dark:text-white">{stats.students}</span>
                                    <span className="text-[9px] uppercase font-black text-gray-400 tracking-widest">{isRtl ? "طالب" : "Students"}</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center opacity-40">
                                <BookOpen className="w-12 h-12 mb-2 text-gray-300" />
                                <p className="text-xs font-bold text-gray-400">{isRtl ? "لا توجد بيانات فصول" : "No class data"}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={DS_card}>
                <div className="p-6 border-b border-gray-50 dark:border-[#243460] flex items-center justify-between">
                    <h3 className="font-black text-sm text-[#0f2044] dark:text-white">
                        {isRtl ? "الطلاب المضافون حديثاً" : "Recently Enrolled Students"}
                    </h3>
                    <Link href={route("school.students.index")} className="px-4 py-1.5 bg-[#0f2044]/5 dark:bg-white/5 rounded-full text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] hover:bg-[#f5b800] hover:text-[#0f2044] transition-all">
                        {isRtl ? "عرض السجل الكامل" : "View Full Records"}
                    </Link>
                </div>
                <div className="p-6">
                    {recent_students.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {recent_students.map((student) => {
                                const displayName = student.full_name || (student.first_name_ar && student.last_name_ar ? `${student.first_name_ar} ${student.last_name_ar}` : student.name) || "—";
                                return (
                                    <div key={student.id} className="flex flex-col items-center p-4 rounded-2xl bg-gray-50 dark:bg-[#243460]/30 border border-transparent hover:border-[#f5b800]/50 transition-all text-center">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0f2044] to-[#243460] flex items-center justify-center text-white font-black text-xl mb-3 shadow-lg border-2 border-white dark:border-[#1a2845]">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                        <h5 className="text-xs font-black text-[#0f2044] dark:text-white line-clamp-1">{displayName}</h5>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {new Date(student.created_at).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-gray-400 py-4 text-xs font-bold">{isRtl ? "لا يوجد طلاب مضافين حديثاً" : "No recent enrollments"}</p>
                    )}
                </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className={DS_card}>
                <div className="p-6 border-b border-gray-50 dark:border-[#243460]">
                    <h3 className="font-black text-sm text-[#0f2044] dark:text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[#f5b800]" />
                        {isRtl ? "إجراءات سريعة" : "Operational Actions"}
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                    <QuickAction icon={GraduationCap} label={isRtl ? "تسجيل طالب" : "Enroll Student"} link={route("school.students.create")} accent="navy" />
                    <QuickAction icon={ClipboardList} label={isRtl ? "رصد حضور" : "Record Attendance"} link={route("school.attendance.index")} accent="gold" />
                    <QuickAction icon={Bus} label={isRtl ? "إدارة باصات" : "Fleet Control"} link={route("school.buses.index")} accent="navy" />
                    <QuickAction icon={Bell} label={isRtl ? "الإشعارات" : "Notifications"} link={route("school.notifications.sent")} accent="gold" />
                </div>
            </div>

            <div className={DS_card}>
                <div className="p-6 border-b border-gray-50 dark:border-[#243460]">
                    <h3 className="font-black text-sm text-[#0f2044] dark:text-white">
                        {isRtl ? "النشاطات الحية" : "Live Activity Feed"}
                    </h3>
                </div>
                <div className="p-6">
                    <div className="space-y-6">
                        {recentActivities.length > 0 ? (
                            recentActivities.slice(0, 5).map((act, idx) => (
                                <div key={idx} className={`relative flex gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                                    {idx !== Math.min(recentActivities.length, 5) - 1 && (
                                        <div className={`absolute top-10 ${isRtl ? "right-[19px]" : "left-[19px]"} bottom-0 w-px bg-gray-100 dark:bg-[#243460]`} />
                                    )}
                                    <div className={`relative z-10 w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm ${
                                        act.type === "student" ? "bg-sky-500/10 text-sky-500" : "bg-emerald-500/10 text-emerald-500"
                                    }`}>
                                        {act.type === "student" ? <GraduationCap className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`flex justify-between items-start gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <h5 className="text-[11px] font-black text-[#0f2044] dark:text-white truncate">{act.title}</h5>
                                            <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap pt-1">{act.time}</span>
                                        </div>
                                        <p className={`text-[10px] text-gray-500 mt-1 line-clamp-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                                            {isRtl ? act.description_ar : act.description_en}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 opacity-40">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
                                <p className="text-xs font-bold text-gray-400">{isRtl ? "لا توجد نشاطات حالياً" : "System idling"}</p>
                            </div>
                        )}
                    </div>
                    <button className="w-full mt-6 py-3 rounded-2xl bg-gray-50 dark:bg-white/5 text-[10px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase tracking-widest hover:bg-[#0f2044] hover:text-white transition-all">
                        {isRtl ? 'مشاهدة كافة النشاطات' : 'View Full Audit Log'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      </motion.div>
    </SchoolDashboardLayout>
  );
}

function SchoolDashboardLayout({ children, user, header }: any) {
    return (
        <SchoolAuthenticatedLayout user={user} header={header}>
            <div className="max-w-[1600px] mx-auto pb-12">
                {children}
            </div>
        </SchoolAuthenticatedLayout>
    );
}

function StatCard({ title, value, sub, icon: Icon, accent, isRtl }: any) {
  return (
    <Link href={route("school.dashboard")}>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        className={DS_statCard(accent)}
      >
        <div className={`flex flex-col gap-2 ${isRtl ? "items-end text-right" : "items-start text-left"}`}>
          <div className={DS_statIcon(accent)}>
            <Icon className="w-6 h-6" />
          </div>
          <p className={DS_statLabel}>{title}</p>
          <h4 className={DS_statValue2(accent)}>{value}</h4>
          {sub && <p className="text-[10px] font-medium text-gray-400 mt-1">{sub}</p>}
        </div>
      </motion.div>
    </Link>
  );
}

function QuickAction({ icon: Icon, label, link, accent }: any) {
  return (
    <Link
      href={link}
      className={`group relative flex flex-col items-center justify-center p-6 rounded-[22px] transition-all duration-300 hover:-translate-y-2 active:scale-95 border border-gray-100 dark:border-[#243460] overflow-hidden ${
          accent === 'navy' 
            ? 'bg-[#0f2044] text-white shadow-xl shadow-[#0f2044]/20' 
            : 'bg-white dark:bg-[#1a2845] text-[#0f2044] dark:text-white hover:border-[#f5b800]/40'
      }`}
    >
      <div className={`mb-3 p-3 rounded-2xl transition-all duration-500 group-hover:scale-125 ${
          accent === 'navy' ? 'bg-white/10 text-[#f5b800]' : 'bg-[#0f2044]/5 dark:bg-[#f5b800]/10 text-[#0f2044] dark:text-[#f5b800]'
      }`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-[11px] font-black text-center leading-tight uppercase tracking-wide group-hover:text-[#f5b800] transition-colors">
          {label}
      </span>
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
    </Link>
  );
}
