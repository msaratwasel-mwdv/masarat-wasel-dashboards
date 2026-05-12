import React from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import {
  Users,
  Bus,
  Shield,
  UserCheck,
  Clock,
  Gauge,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Activity,
  FileText,
} from "lucide-react";
import { DS_pageWrapper, DS_pageTitle, DS_statCard, DS_statIcon, DS_statLabel, DS_statValue2 } from "@/lib/DS";

interface Props {
  stats: {
    totalTripsThisWeek: number;
    totalStudents: number;
    totalBuses: number;
    totalDelaysThisWeek: number;
    totalIncidents: number;
    attendanceRate: number;
  };
  auth?: any;
}

const reportCards = (isRTL: boolean) => [
  {
    title: isRTL ? "تقرير حضور الطلاب" : "Student Attendance Report",
    description: isRTL
      ? "تتبع حضور وغياب الطلاب في الحافلات يومياً مع إحصائيات شاملة"
      : "Track daily student bus attendance with comprehensive statistics",
    icon: Users,
    route: "school.reports.student-attendance",
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50",
    bgDark: "dark:bg-emerald-900/20",
    textColor: "text-emerald-600",
    iconBg: "bg-emerald-500",
  },
  {
    title: isRTL ? "تقرير العمليات والرحلات" : "Trip Operations Report",
    description: isRTL
      ? "عدد الرحلات اليومية والأسبوعية لكل حافلة وأوقات الذهاب والعودة"
      : "Daily and weekly trip counts per bus with departure and arrival times",
    icon: Bus,
    route: "school.reports.trip-operations",
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-900/20",
    textColor: "text-blue-600",
    iconBg: "bg-blue-500",
  },
  {
    title: isRTL ? "تقرير السلامة والامتثال" : "Safety & Compliance Report",
    description: isRTL
      ? "الرحلات الآمنة والحوادث وفحوصات سلامة الحافلات"
      : "Safe trips, incidents, and bus safety inspections",
    icon: Shield,
    route: "school.reports.safety-compliance",
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50",
    bgDark: "dark:bg-amber-900/20",
    textColor: "text-amber-600",
    iconBg: "bg-amber-500",
  },
  {
    title: isRTL ? "تقرير أداء السائقين" : "Driver Performance Report",
    description: isRTL
      ? "تقييم أداء كل سائق بنظام نجوم مع إحصائيات مفصلة"
      : "Rate each driver's performance with star ratings and detailed stats",
    icon: UserCheck,
    route: "school.reports.driver-performance",
    color: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50",
    bgDark: "dark:bg-violet-900/20",
    textColor: "text-violet-600",
    iconBg: "bg-violet-500",
  },
  {
    title: isRTL ? "تقرير التأخيرات والالتزام" : "Delays & Punctuality Report",
    description: isRTL
      ? "حالات التأخير للحافلات والطلاب مع تحليل الأسباب والمدة"
      : "Bus and student delays with cause analysis and duration tracking",
    icon: Clock,
    route: "school.reports.delay-punctuality",
    color: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-50",
    bgDark: "dark:bg-rose-900/20",
    textColor: "text-rose-600",
    iconBg: "bg-rose-500",
  },
  {
    title: isRTL ? "تقرير السرعة والانضباط" : "Speed & Discipline Report",
    description: isRTL
      ? "مراقبة السرعة والمخالفات المرورية لكل حافلة وسائق"
      : "Monitor speed and traffic violations for each bus and driver",
    icon: Gauge,
    route: "school.reports.speed-discipline",
    color: "from-cyan-500 to-sky-600",
    bgLight: "bg-cyan-50",
    bgDark: "dark:bg-cyan-900/20",
    textColor: "text-cyan-600",
    iconBg: "bg-cyan-500",
  },
];

export default function ReportsHub({ stats, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const cards = reportCards(isRTL);

  return (
    <SchoolAuthenticatedLayout user={auth?.user}>
      <Head title={isRTL ? "مركز التقارير والتحليلات" : "Reports & Analytics Hub"} />

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRTL ? "rtl" : "ltr"}>
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0f2044] via-[#162d60] to-[#1a3570] p-8 md:p-12 mb-8">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#f5b800]/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#f5b800]/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-[#f5b800] rounded-full animate-pulse" />
          <div className="absolute top-1/3 left-1/3 w-1.5 h-1.5 bg-[#f5b800]/60 rounded-full animate-pulse delay-500" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[#f5b800]/10 rounded-2xl">
                  <BarChart3 className="w-8 h-8 text-[#f5b800]" />
                </div>
                <div className="w-1.5 h-8 bg-[#f5b800] rounded-full" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                {isRTL ? "مركز التقارير والتحليلات" : "Reports & Analytics Hub"}
              </h1>
              <p className="text-blue-200/70 text-sm md:text-base max-w-lg">
                {isRTL
                  ? "تقارير تشغيلية شاملة لتعزيز الشفافية والثقة مع أولياء الأمور"
                  : "Comprehensive operational reports to enhance transparency and trust with parents"}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/5">
                <p className="text-2xl font-black text-[#f5b800]">{stats.attendanceRate}%</p>
                <p className="text-[9px] font-bold text-blue-200/60 uppercase tracking-widest mt-1">
                  {isRTL ? "نسبة الحضور" : "Attendance"}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/5">
                <p className="text-2xl font-black text-emerald-400">{stats.totalTripsThisWeek}</p>
                <p className="text-[9px] font-bold text-blue-200/60 uppercase tracking-widest mt-1">
                  {isRTL ? "رحلات الأسبوع" : "Trips/Week"}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/5">
                <p className="text-2xl font-black text-rose-400">{stats.totalDelaysThisWeek}</p>
                <p className="text-[9px] font-bold text-blue-200/60 uppercase tracking-widest mt-1">
                  {isRTL ? "تأخيرات" : "Delays"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className={DS_statCard("navy")}>
            <div className={DS_statIcon("navy")}><Users size={20} /></div>
            <div>
              <p className={DS_statLabel}>{isRTL ? "إجمالي الطلاب" : "Total Students"}</p>
              <p className={DS_statValue2("navy")}>{stats.totalStudents}</p>
            </div>
          </div>
          <div className={DS_statCard("gold")}>
            <div className={DS_statIcon("gold")}><Bus size={20} /></div>
            <div>
              <p className={DS_statLabel}>{isRTL ? "حافلات نشطة" : "Active Buses"}</p>
              <p className={DS_statValue2("gold")}>{stats.totalBuses}</p>
            </div>
          </div>
          <div className={DS_statCard("green")}>
            <div className={DS_statIcon("green")}><CheckCircle2 size={20} /></div>
            <div>
              <p className={DS_statLabel}>{isRTL ? "رحلات الأسبوع" : "Weekly Trips"}</p>
              <p className={DS_statValue2("green")}>{stats.totalTripsThisWeek}</p>
            </div>
          </div>
          <div className={DS_statCard("red")}>
            <div className={DS_statIcon("red")}><AlertTriangle size={20} /></div>
            <div>
              <p className={DS_statLabel}>{isRTL ? "حوادث الأسبوع" : "Weekly Incidents"}</p>
              <p className={DS_statValue2("red")}>{stats.totalIncidents}</p>
            </div>
          </div>
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={index}
                href={route(card.route)}
                className={`group relative overflow-hidden rounded-[22px] border transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 ${
                  isDark
                    ? "bg-[#1a2845] border-[#243460] hover:border-[#f5b800]/30"
                    : "bg-white border-gray-100 hover:border-gray-200"
                }`}
              >
                {/* Gradient top bar */}
                <div className={`h-1.5 bg-gradient-to-r ${card.color}`} />

                <div className="p-6">
                  {/* Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${card.bgLight} ${card.bgDark}`}>
                      <Icon className={`w-6 h-6 ${card.textColor}`} />
                    </div>
                    <div className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 ${card.bgLight} ${card.bgDark}`}>
                      <ArrowIcon className={`w-4 h-4 ${card.textColor}`} />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`text-lg font-black mb-2 ${isDark ? "text-white" : "text-[#0f2044]"}`}>
                    {card.title}
                  </h3>

                  {/* Description */}
                  <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {card.description}
                  </p>

                  {/* View Link */}
                  <div className={`mt-4 flex items-center gap-2 text-xs font-bold ${card.textColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                    <span>{isRTL ? "عرض التقرير" : "View Report"}</span>
                    <ArrowIcon className="w-3 h-3" />
                  </div>
                </div>

                {/* Decorative circle */}
                <div className={`absolute -bottom-8 ${isRTL ? "-left-8" : "-right-8"} w-24 h-24 rounded-full bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
              </Link>
            );
          })}
        </div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
