import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import GoogleMapContainer from "@/Components/GoogleMapContainer";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bus, School as SchoolIcon, Users, GraduationCap, 
  Activity, AlertTriangle, ShieldCheck, TrendingUp, 
  Map as MapIcon, Plus, FileText, Settings, 
  Navigation, CheckCircle2, Clock, ArrowUpRight,
  Info, Bell, Zap
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// --- Interfaces ---
interface DashboardProps {
  stats: {
    total_schools: number;
    total_students: number;
    total_trips: number;
    buses: { total: number; available: number; booked: number; maintenance: number };
    drivers: { total: number; available: number; booked: number };
    supervisors: { total: number; available: number; booked: number };
  };
  alerts: Array<{ type: "warning" | "critical"; category?: string; message: string }>;
  mapData: Array<{ id: number; code: string; lat: number; lng: number; status: string; speed: string; school_id?: number }>;
  filterSchools: Array<{ id: number; name: string }>;
  tripsTrend: Array<{ date: string; count: number }>;
  fleetDistribution: Array<{ name: string; value: number; color: string }>;
  recentActivities: Array<{ id: number; type: string; title: string; description: string; time: string; status: string; link: string }>;
}

export default function Dashboard({
  stats,
  alerts,
  mapData,
  filterSchools,
  tripsTrend,
  fleetDistribution,
  recentActivities,
}: DashboardProps) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMapData = useMemo(() => {
    return mapData.filter((bus) => {
      if (selectedSchool && bus.school_id?.toString() !== selectedSchool) return false;
      if (searchQuery && !bus.code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [mapData, selectedSchool, searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  return (
    <AuthenticatedLayout>
      <Head title={isRTL ? "لوحة التحكم الذكية" : "Smart Dashboard"} />

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* --- Header Section --- */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
           <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isRTL ? "مرحباً بك في مسارات" : "Welcome to Masarat"}
              </h1>
              <p className={`mt-2 text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isRTL ? "نظرة شاملة على أداء الأسطول والعمليات الحالية." : "A comprehensive look at fleet performance and current operations."}
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border backdrop-blur-md shadow-sm transition-all ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                 <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                 </div>
                 <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isRTL ? "النظام متصل" : "System Online"}
                 </span>
              </div>
           </div>
        </div>

        {/* --- KPI Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title={isRTL ? "إجمالي الحافلات" : "Total Buses"}
            value={stats.buses.total}
            icon={<Bus className="w-6 h-6" />}
            trend="+12%"
            color="yellow"
            isDark={isDark}
            isRTL={isRTL}
          />
          <StatCard 
            title={isRTL ? "الطلاب النشطين" : "Active Students"}
            value={stats.total_students}
            icon={<GraduationCap className="w-6 h-6" />}
            trend="+5%"
            color="blue"
            isDark={isDark}
            isRTL={isRTL}
          />
          <StatCard 
            title={isRTL ? "المدارس المشتركة" : "Partner Schools"}
            value={stats.total_schools}
            icon={<SchoolIcon className="w-6 h-6" />}
            trend="0%"
            color="indigo"
            isDark={isDark}
            isRTL={isRTL}
          />
          <StatCard 
            title={isRTL ? "إجمالي الرحلات" : "Total Trips"}
            value={stats.total_trips}
            icon={<Activity className="w-6 h-6" />}
            trend="+18%"
            color="green"
            isDark={isDark}
            isRTL={isRTL}
          />
        </div>

        {/* --- Main Dashboard Content --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Analytics & Live Tracking (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Analytics Section */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6`}>
              {/* Trips Trend Chart */}
              <div className={`p-6 rounded-3xl border backdrop-blur-md ${isDark ? 'bg-slate-800/40 border-slate-700 shadow-xl' : 'bg-white border-slate-100 shadow-sm shadow-slate-200/50'}`}>
                 <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''} ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    {isRTL ? "اتجاه الرحلات (آخر 7 أيام)" : "Trips Trend (Last 7 Days)"}
                 </h3>
                 <div className="h-[230px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={tripsTrend}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10}} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Fleet Distribution */}
              <div className={`p-6 rounded-3xl border backdrop-blur-md ${isDark ? 'bg-slate-800/40 border-slate-700 shadow-xl' : 'bg-white border-slate-100 shadow-sm shadow-slate-200/50'}`}>
                 <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''} ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Activity className="w-5 h-5 text-amber-500" />
                    {isRTL ? "توزيع الأسطول" : "Fleet Distribution"}
                 </h3>
                 <div className="h-[230px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={fleetDistribution}
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {fleetDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center justify-center inset-0 pointer-events-none">
                       <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.buses.total}</span>
                       <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? "حافلة" : "Buses"}</span>
                    </div>
                 </div>
                 <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {fleetDistribution.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                         <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}} />
                         <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.name} ({item.value})</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            {/* Live Map Tracking */}
            <div className={`p-6 rounded-3xl border backdrop-blur-md overflow-hidden ${isDark ? 'bg-slate-800/40 border-slate-700 shadow-xl' : 'bg-white border-slate-100 shadow-sm shadow-slate-200/50'}`}>
               <div className={`flex flex-col md:flex-row justify-between items-center mb-6 gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                 <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                       <Navigation className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{isRTL ? "التتبع المباشر" : "Live Tracking"}</h3>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? "رصد حركة الحافلات في صنعاء" : "Active fleet monitoring in Sana'a"}</p>
                    </div>
                 </div>
                 
                 <div className={`flex items-center gap-3 w-full md:w-auto`}>
                    <select 
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                      className={`text-sm rounded-xl py-2 px-4 appearance-none focus:ring-2 ring-blue-500/50 border-0 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-50 text-slate-600'}`}
                    >
                      <option value="">{isRTL ? "كل المدارس" : "All Schools"}</option>
                      {filterSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <button 
                      onClick={() => setIsTrackingEnabled(!isTrackingEnabled)}
                      className={`text-sm font-black px-5 py-2 rounded-xl transition-all shadow-lg ${
                        isTrackingEnabled 
                          ? 'bg-red-500 text-white shadow-red-500/30' 
                          : 'bg-emerald-500 text-white shadow-emerald-500/30'
                      }`}
                    >
                      {isTrackingEnabled ? (isRTL ? "إغلاق الخريطة" : "Pause") : (isRTL ? "فتح الخريطة" : "Track Live")}
                    </button>
                 </div>
               </div>

               <div className="relative h-[450px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <AnimatePresence mode="wait">
                    {isTrackingEnabled ? (
                      <motion.div 
                        key="map-active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0"
                      >
                         <GoogleMapContainer 
                           apiKey={GOOGLE_MAPS_API_KEY}
                           data={filteredMapData} // Use the filtered data
                           isDark={isDark}
                           isRTL={isRTL}
                         />
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="map-paused"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 flex flex-col items-center justify-center gap-6 p-12 text-center z-10 ${isDark ? 'bg-slate-900/40' : 'bg-slate-50'}`}
                      >
                         <div className={`p-6 rounded-full ${isDark ? 'bg-slate-800' : 'bg-white shadow-xl shadow-slate-200'}`}>
                            <div className="relative">
                               <MapIcon className={`w-16 h-16 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                               <div className="absolute top-0 right-0 w-4 h-4 bg-amber-500 rounded-full border-4 border-slate-900 animate-ping" />
                            </div>
                         </div>
                         <div>
                           <h4 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{isRTL ? "نظام التتبع في وضع الاستعداد" : "Tracking System on Standby"}</h4>
                           <p className={`text-sm max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? "تم إيقاف تفعيل الخريطة لتسريع تحميل الصفحة وتوفير موارد النظام. قم بتفعيلها لمراقبة حركة الأسطول في صنعاء." : "Map tracking is disabled to optimize performance. Enable it to monitor real-time fleet movement in Sana'a."}</p>
                         </div>
                         <button 
                           onClick={() => setIsTrackingEnabled(true)}
                           className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-3"
                         >
                            <Zap className="w-5 h-5 fill-current" />
                            {isRTL ? "تفعيل الرصد المباشر الآن" : "Enable Live Tracking Now"}
                         </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
          </div>

          {/* RIGHT: Quick Actions & Alerts (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Quick Actions Panel */}
            <div className={`p-6 rounded-3xl border backdrop-blur-md ${isDark ? 'bg-slate-800/40 border-slate-700 shadow-xl' : 'bg-white border-slate-100 shadow-sm shadow-slate-200/50'}`}>
               <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''} ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Settings className="w-5 h-5 text-indigo-500" />
                  {isRTL ? "وصول سريع" : "Quick Access"}
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  <QuickActionItem 
                    icon={<Plus className="w-5 h-5" />}
                    label={isRTL ? "إضافة حافلة" : "Add Bus"}
                    link={route('admin.buses.create')}
                    color="blue"
                  />
                  <QuickActionItem 
                    icon={<Plus className="w-5 h-5" />}
                    label={isRTL ? "إضافة مدرسة" : "Add School"}
                    link={route('admin.schools.create')}
                    color="emerald"
                  />
                  <QuickActionItem 
                    icon={<FileText className="w-5 h-5" />}
                    label={isRTL ? "سجل التعيينات" : "Assignment Log"}
                    link={route('admin.assignmentHistory')}
                    color="amber"
                  />
                  <QuickActionItem 
                    icon={<AlertTriangle className="w-5 h-5" />}
                    label={isRTL ? "البلاغات/الحوادث" : "Emergencies"}
                    link={route('admin.emergencies.index')}
                    color="red"
                  />
               </div>
            </div>

            {/* Unified Activity Feed */}
            <div className={`p-6 rounded-3xl border backdrop-blur-md ${isDark ? 'bg-slate-800/40 border-slate-700 shadow-xl' : 'bg-white border-slate-100 shadow-sm shadow-slate-200/50'}`}>
               <div className={`flex justify-between items-center mb-6`}>
                  <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{isRTL ? "أحدث النشاطات" : "Latest Activities"}</h3>
                  <Link href="#" className="text-xs text-blue-500 font-bold hover:underline">{isRTL ? "الكل" : "All"}</Link>
               </div>
               
               <div className="space-y-5">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((act, idx) => (
                      <div key={idx} className={`group relative flex gap-4 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                         {/* Connector Line */}
                         {idx !== recentActivities.length - 1 && (
                           <div className={`absolute top-9 ${isRTL ? 'right-[19px]' : 'left-[19px]'} bottom-0 w-[2px] bg-slate-100 dark:bg-slate-700/50 pointer-events-none`} />
                         )}
                         
                         <div className={`relative z-10 w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm ${
                           act.type === 'request' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                         }`}>
                            {act.type === 'request' ? <Bus className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                         </div>
                         
                         <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                               <h5 className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{act.title}</h5>
                               <span className={`text-[9px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} whitespace-nowrap pt-1`}>{act.time}</span>
                            </div>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} line-clamp-1 mt-0.5`}>{act.description}</p>
                            <Link href={act.link} className={`inline-flex items-center gap-1 text-[10px] font-black mt-2 text-blue-500 hover:text-blue-600 group-hover:gap-1.5 transition-all`}>
                               {isRTL ? "عرض الإجراء" : "View Action"}
                               <ArrowUpRight className="w-3 h-3" />
                            </Link>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 opacity-40">
                       <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                       <p className="text-xs font-bold">{isRTL ? "النظام يعمل بكفاءة" : "Systems Operational"}</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Critical Alerts Card */}
            {alerts.filter(a => a.type === 'critical').length > 0 && (
              <div className="space-y-4">
                 {alerts.filter(a => a.type === 'critical').map((a, idx) => (
                   <motion.div 
                     key={idx}
                     initial={{ x: 30, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     className={`p-4 rounded-2xl border-2 border-red-500/10 bg-red-500/5 backdrop-blur-sm flex gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                   >
                      <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                         <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                         <h6 className="text-[10px] font-black text-red-500 uppercase tracking-widest">{isRTL ? "تنبيه طارئ" : "CRITICAL ALERT"}</h6>
                         <p className={`text-xs font-bold mt-1 leading-snug ${isDark ? 'text-white' : 'text-slate-800'}`}>{a.message}</p>
                      </div>
                   </motion.div>
                 ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AuthenticatedLayout>
  );
}

// --- Internal UI Components ---

function StatCard({ title, value, icon, trend, color, isDark, isRTL }: any) {
  const colorSchemes = {
    blue: "text-blue-500 bg-blue-500/10",
    green: "text-emerald-500 bg-emerald-500/10",
    yellow: "text-amber-500 bg-amber-500/10",
    indigo: "text-indigo-500 bg-indigo-500/10",
  } as any;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`p-6 rounded-3xl border backdrop-blur-md relative overflow-hidden transition-all ${
        isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 shadow-xl' : 'bg-white border-slate-100 hover:bg-slate-50/50 shadow-sm shadow-slate-200/50 hover:shadow-lg'
      }`}
    >
      <div className={`relative z-10 flex flex-col gap-2 ${isRTL ? 'items-end' : 'items-start'}`}>
         <div className={`p-3 rounded-2xl mb-2 ${colorSchemes[color]}`}>
            {icon}
         </div>
         <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{title}</p>
         <div className={`flex items-baseline gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h4 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</h4>
            <span className={`text-[9px] font-black py-0.5 px-1.5 rounded-lg ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
               {trend}
            </span>
         </div>
      </div>
      {/* Visual Decor */}
      <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-[0.05] pointer-events-none ${colorSchemes[color].split(' ')[1]}`} />
    </motion.div>
  );
}

function QuickActionItem({ icon, label, link, color }: any) {
  const bgColors = {
    blue: "bg-blue-500 shadow-blue-500/20 hover:bg-blue-600",
    emerald: "bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600",
    amber: "bg-amber-500 shadow-amber-500/20 hover:bg-amber-600",
    red: "bg-red-500 shadow-red-500/20 hover:bg-red-600",
  } as any;

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
