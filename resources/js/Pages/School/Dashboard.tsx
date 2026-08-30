import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { router } from "@inertiajs/react";
import { useEchoEvent } from "@/hooks/useEcho";
import { 
  Bus, Users, Route as RouteIcon, 
  Activity, Calendar, ShieldCheck, 
  CheckCircle2, AlertTriangle, GraduationCap, 
  ClipboardList, Bell
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";

interface DashboardProps {
  auth: any;
  stats: any;
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
}

export default function SchoolDashboard({
  auth,
  transport,
  attendanceTrend = [],
  studentsByBus = [],
  recentActivities = [],
}: DashboardProps) {
  const { isRTL: isRtl } = useTheme();

  // Real-time updates
  useEchoEvent(
    'private',
    `App.Models.User.${auth.user.id}`,
    '.notification.pushed',
    () => {
        router.reload({ only: ['stats', 'transport', 'recentActivities'] });
    }
  );

  const isSystemNormal = transport.delayed_buses_now === 0;

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      isLiveTracking={true}
      header={
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isSystemNormal ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
          <span className="text-sm font-bold tracking-widest uppercase text-slate-800 dark:text-slate-200">
            {isSystemNormal ? (isRtl ? 'النظام يعمل بشكل طبيعي' : 'SYSTEM NOMINAL') : (isRtl ? 'تنبيه: تأخير حافلات' : 'ALERT: DELAYED BUSES')}
          </span>
        </div>
      }
    >
      <Head title={isRtl ? "لوحة العمليات" : "Operations"} />

      {/* 100vh container minus header (handled by layout) */}
      <div className="w-full h-full flex flex-col gap-4 p-4 md:p-6 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 overflow-hidden">
        
        {/* TOP ROW: Quick Actions & Date */}
        <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            
            <div className="flex items-center gap-3">
                <ActionLink href={route("school.students.index")} icon={GraduationCap} label={isRtl ? "الطلاب" : "Students"} />
                <ActionLink href={route("school.attendance.index")} icon={ClipboardList} label={isRtl ? "الحضور" : "Attendance"} />
                <ActionLink href={route("school.buses.index")} icon={Bus} label={isRtl ? "الحافلات" : "Fleet"} />
                <ActionLink href={route("school.notifications.sent")} icon={Bell} label={isRtl ? "الإشعارات" : "Alerts"} />
            </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-shrink-0">
          <MetricBlock 
            label={isRtl ? "رحلات نشطة" : "ACTIVE TRIPS"} 
            value={transport.active_trips_now} 
            icon={Activity} 
          />
          <MetricBlock 
            label={isRtl ? "حافلات متأخرة" : "DELAYED"} 
            value={transport.delayed_buses_now} 
            icon={AlertTriangle} 
            alert={transport.delayed_buses_now > 0} 
          />
          <MetricBlock 
            label={isRtl ? "الرحلات المنجزة" : "TRIPS COMPLETED"} 
            value={`${transport.completed_trips_today} / ${transport.total_trips_today}`} 
            icon={CheckCircle2} 
          />
          <MetricBlock 
            label={isRtl ? "طلاب تم نقلهم" : "TRANSPORTED"} 
            value={transport.students_transported_today} 
            icon={Users} 
          />
          <MetricBlock 
            label={isRtl ? "أيام أمان" : "SAFE DAYS"} 
            value={transport.zero_incident_days} 
            icon={ShieldCheck} 
            success={true}
          />
        </div>

        {/* MAIN CONTENT ROW (Fills remaining height) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* CHARTS SECTIONS */}
          <div className="col-span-8 flex flex-col gap-4 min-h-0">
             
             {/* Upper Chart: Attendance */}
             <div className="flex-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col min-h-0">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4" />
                    {isRtl ? "مؤشر الحضور الأسبوعي" : "ATTENDANCE TREND"}
                </div>
                <div className="flex-1 relative min-h-0">
                    <div className="absolute inset-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendanceTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", color: "#F8FAFC", fontSize: "12px", direction: isRtl ? "rtl" : "ltr" }}
                                    itemStyle={{ color: "#F8FAFC" }}
                                />
                                <Area type="step" dataKey="present" stroke="#10b981" strokeWidth={2} fillOpacity={0.1} fill="#10b981" name={isRtl ? "حاضر" : "Present"} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
             </div>

             {/* Lower Chart: Distribution */}
             <div className="flex-1 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col min-h-0">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <RouteIcon className="w-4 h-4" />
                    {isRtl ? "توزيع الطلاب" : "LOAD DISTRIBUTION"}
                </div>
                <div className="flex-1 relative min-h-0">
                    <div className="absolute inset-0">
                        {studentsByBus.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={studentsByBus} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(51, 65, 85, 0.1)' }}
                                        contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #1E293B", color: "#F8FAFC", fontSize: "12px", direction: isRtl ? "rtl" : "ltr" }}
                                    />
                                    <Bar dataKey="value" name={isRtl ? "طلاب" : "Students"} fill="#3B82F6" barSize={32}>
                                        {studentsByBus.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#3B82F6" : "#6366F1"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs uppercase">
                                {isRtl ? "لا توجد بيانات" : "NO DATA"}
                            </div>
                        )}
                    </div>
                </div>
             </div>
          </div>

          {/* ACTIVITY FEED */}
          <div className="col-span-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col overflow-hidden min-h-0">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-shrink-0">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {isRtl ? "سجل العمليات" : "OPERATION LOG"}
                  </span>
              </div>
              
              <div className="flex-1 relative overflow-hidden">
                  <div className="absolute inset-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {recentActivities.length > 0 ? (
                          recentActivities.map((act, idx) => (
                              <div key={idx} className="flex gap-3">
                                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${act.type === 'alert' ? 'bg-rose-500' : 'bg-slate-500'}`} />
                                  <div className="min-w-0 flex-1">
                                      <div className="flex justify-between items-start gap-2">
                                          <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">
                                              {act.title}
                                          </p>
                                          <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono mt-0.5">
                                              {act.time}
                                          </span>
                                      </div>
                                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                          {isRtl ? act.description_ar : act.description_en}
                                      </p>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-500">
                              <span className="text-xs font-mono uppercase">{isRtl ? "لا توجد نشاطات" : "EMPTY LOG"}</span>
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

function MetricBlock({ label, value, icon: Icon, alert, success }: any) {
    const colorClass = alert 
        ? "text-rose-600 dark:text-rose-500 border-rose-500/30 bg-rose-500/5" 
        : success 
            ? "text-emerald-600 dark:text-emerald-500 border-emerald-500/30 bg-emerald-500/5"
            : "text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A]";

    return (
        <div className={`p-4 rounded-lg border ${colorClass} flex flex-col`}>
            <div className="flex items-center gap-2 mb-2 opacity-70">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest truncate">{label}</span>
            </div>
            <div className="text-2xl font-mono tracking-tight font-medium">
                {value}
            </div>
        </div>
    );
}

function ActionLink({ href, icon: Icon, label }: any) {
    return (
        <Link 
            href={href}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#1E293B] dark:hover:bg-[#334155] border border-slate-200 dark:border-slate-700 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
        </Link>
    );
}
