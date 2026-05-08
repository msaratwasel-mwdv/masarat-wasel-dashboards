import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import GoogleMapContainer from "@/Components/GoogleMapContainer";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bus, School as SchoolIcon, Users, GraduationCap, 
  Activity, AlertTriangle, ShieldCheck, TrendingUp, 
  Map as MapIcon, Plus, FileText, Settings, 
  Navigation, CheckCircle2, Clock, ArrowUpRight,
  Info, Bell, Zap, Sun, Moon, Calendar as CalendarIcon, Sparkles, XCircle
} from "lucide-react";
import { usePage } from "@inertiajs/react";
import { DS_card, DS_pageTitle, DS_statLabel, DS_statValue, DS_btnGold, DS_btnPrimary } from "@/lib/DS";
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
    field_supervisors: { total: number; available: number; booked: number };
    assistants: { total: number; available: number; booked: number };
    daily_trips_today: { pending: number; ongoing: number; completed: number };
  };
  alerts: Array<{ type: "warning" | "critical"; category?: string; message: string }>;
  mapData: Array<{ id: number; code: string; lat: number; lng: number; status: string; speed: string; school_id?: number }>;
  filterSchools: Array<{ id: number; name: string }>;
  tripsTrend: Array<{ date: string; count: number }>;
  fleetDistribution: Array<{ name: string; value: number; color: string }>;
  recentActivities: Array<{ id: number; type: string; title: string; description: string; time: string; status: string; link: string }>;
  pendingSubscriptions: Array<{ 
    id: number; 
    status: string; 
    created_at: string; 
    school: { 
      name: string;
      address: string;
      users: Array<{ name: string; phone: string }>;
    }; 
    plan: { 
      name: string; 
      price: number;
      max_buses: number;
      feature_list: string[];
    } 
  }>;
}

export default function Dashboard({
  stats,
  alerts,
  mapData,
  filterSchools,
  tripsTrend,
  fleetDistribution,
  recentActivities,
  pendingSubscriptions,
}: DashboardProps) {
  const { isRTL, theme } = useTheme();
  const { auth } = usePage().props as any;
  const isDark = theme === "dark";

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return isRTL ? "صباح الخير" : "Good Morning";
    if (hour < 18) return isRTL ? "مساء الخير" : "Good Afternoon";
    return isRTL ? "طاب مساؤك" : "Good Evening";
  };

  const formattedDate = currentTime.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [installmentsCount, setInstallmentsCount] = useState(1);

  const openApproveModal = (sub: any) => {
    setSelectedSub(sub);
    setApproveModalOpen(true);
  };

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    router.post(route('admin.subscriptions.approve', selectedSub.id), {
      installments_count: installmentsCount
    }, {
      onSuccess: () => setApproveModalOpen(false)
    });
  };

  const handleReject = (subId: number) => {
    if(confirm(isRTL ? 'هل أنت متأكد من رفض هذا الاشتراك؟' : 'Are you sure you want to reject this subscription?')) {
        router.post(route('admin.subscriptions.reject', subId));
    }
  };

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
        {/* --- Header Section (Identical to School for Unity) --- */}
        <div className="relative overflow-hidden p-4 md:p-5 rounded-[32px] bg-[#0f2044] text-white shadow-2xl shadow-[#0f2044]/30 border border-[#f5b800]/10">
           {/* Visual Decor */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#f5b800]/10 to-transparent blur-[120px] -mr-32 -mt-32 rounded-full pointer-events-none" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 blur-[80px] -ml-32 -mb-32 rounded-full pointer-events-none" />
           
           <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Left Side: Greeting */}
              <div className="flex-1">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                    <span className="text-white opacity-90">{getGreeting()}، </span>
                    <span className="text-[#f5b800] drop-shadow-[0_2px_10px_rgba(245,184,0,0.3)]">
                        {isRTL 
                           ? `${auth.user.first_name_ar || auth.user.name} ${auth.user.last_name_ar || ''}`.trim()
                           : `${auth.user.first_name_en || auth.user.name} ${auth.user.last_name_en || ''}`.trim()
                        }
                    </span>
                  </h1>
              </div>

              {/* Right Side: Digital Time Box (Exactly as in the image) */}
              <div className="flex-shrink-0">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[20px] p-3 md:p-4 min-w-[200px] text-center shadow-2xl">
                      <div className="flex items-center justify-center gap-2 mb-2">
                          <CalendarIcon className="w-3 h-3 text-[#f5b800]" />
                          <span className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                            {currentTime.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                          </span>
                      </div>
                      
                      <div className="space-y-0.5">
                          <div className="text-2xl md:text-3xl font-black text-white tracking-tighter" dir="ltr">
                            {currentTime.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                            })}
                          </div>
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#f5b800]">
                             {isRTL ? "التوقيت المحلي الحالي" : "Current Local Time"}
                          </p>
                      </div>
                  </div>
              </div>
           </div>
        </div>

        {/* --- KPI Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <StatCard 
            title={isRTL ? "إجمالي الحافلات" : "Total Buses"}
            value={stats.buses.total}
            icon={<Bus className="w-6 h-6" />}
            trend="+12%"
            color="gold"
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
            title={isRTL ? "السائقين" : "Drivers"}
            value={stats.drivers.total}
            icon={<Users className="w-6 h-6" />}
            trend="+8%"
            color="gold"
            isDark={isDark}
            isRTL={isRTL}
          />
          <StatCard 
            title={isRTL ? "المشرفات" : "Assistants"}
            value={stats.assistants.total}
            icon={<Users className="w-6 h-6" />}
            trend="+15%"
            color="indigo"
            isDark={isDark}
            isRTL={isRTL}
          />
          <StatCard 
            title={isRTL ? "المشرفين" : "Field Supervisors"}
            value={stats.field_supervisors.total}
            icon={<Users className="w-6 h-6" />}
            trend="+3%"
            color="rose"
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


        {/* --- Pending Subscriptions Section (NEW) --- */}
        {pendingSubscriptions.length > 0 && (
          <motion.div variants={containerVariants} className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                   <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                   {isRTL ? "طلبات اشتراك بانتظار الموافقة" : "Pending Subscription Requests"}
                </h2>
                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                   {pendingSubscriptions.length}
                </span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {pendingSubscriptions.map((sub) => (
                  <div key={sub.id} className={`p-6 rounded-[28px] border transition-all ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                           <h4 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{sub.school.name}</h4>
                           <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                              <MapIcon size={10} />
                              <span className="truncate">{sub.school.address}</span>
                           </div>
                           <p className="text-xs text-[#f5b800] font-black mt-2">{sub.plan.name} - ${sub.plan.price}</p>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                           <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                     </div>

                     <div className={`p-3 rounded-xl mb-4 text-[10px] ${isDark ? 'bg-slate-900/30' : 'bg-slate-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="opacity-60">{isRTL ? "المسؤول:" : "Admin:"}</span>
                          <span className="font-bold">{sub.school.users?.[0]?.name || sub.school.users?.[0]?.first_name_ar || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="opacity-60">{isRTL ? "الجوال:" : "Phone:"}</span>
                          <span className="font-bold">{sub.school.users?.[0]?.phone || '-'}</span>
                        </div>
                     </div>

                     <div className="flex flex-wrap gap-1 mb-6">
                        {sub.plan.feature_list?.slice(0, 3).map((f, i) => (
                           <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-[8px] font-bold rounded-full opacity-70">{f}</span>
                        ))}
                     </div>

                     <div className="flex gap-2">
                        <button 
                           onClick={() => openApproveModal(sub)}
                           className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all"
                        >
                           {isRTL ? "موافقة" : "Approve"}
                        </button>
                        <button 
                           onClick={() => handleReject(sub.id)}
                           className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-xs font-black rounded-xl transition-all"
                        >
                           {isRTL ? "رفض" : "Reject"}
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

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
                 <div className="h-[300px] w-full min-w-0 min-h-[300px]">
                    <ResponsiveContainer width="100%" height={260}>
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
                    <Settings className="w-5 h-5 text-[#f5b800]" />
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
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#f5b800' : entry.color} />
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
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? "رصد حركة الحافلات في سلطنة عمان" : "Active fleet monitoring in Oman"}</p>
                    </div>
                 </div>
                 
                 <div className={`flex items-center gap-3 w-full md:w-auto`}>
                    <select 
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                      className={`text-xs font-black rounded-xl py-2 px-6 appearance-none focus:ring-2 ring-[#f5b800]/50 border-0 ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-slate-900'}`}
                    >
                      <option value="">{isRTL ? "كل المدارس" : "All Schools"}</option>
                      {filterSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <button 
                      onClick={() => setIsTrackingEnabled(!isTrackingEnabled)}
                      className={`text-xs font-black px-6 py-2 rounded-xl transition-all shadow-xl ${
                        isTrackingEnabled 
                          ? 'bg-red-500 text-white shadow-red-500/30' 
                          : 'bg-[#0f2044] text-[#f5b800] shadow-[#0f2044]/20'
                      }`}
                    >
                      {isTrackingEnabled ? (isRTL ? "إغلاق الخريطة" : "Pause Tracking") : (isRTL ? "بدء الرصد" : "Start Tracking")}
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
                             apiKey=""
                             data={filteredMapData}
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
                           <p className={`text-sm max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? "تم إيقاف تفعيل الخريطة لتسريع تحميل الصفحة وتوفير موارد النظام. قم بتفعيلها لمراقبة حركة الأسطول في عُمان." : "Map tracking is disabled to optimize performance. Enable it to monitor real-time fleet movement in Oman."}</p>
                         </div>
                          <button 
                            onClick={() => setIsTrackingEnabled(true)}
                            className="px-10 py-4 bg-[#f5b800] hover:bg-[#0f2044] hover:text-[#f5b800] text-[#0f2044] rounded-[22px] font-black text-sm tracking-widest uppercase transition-all shadow-2xl shadow-[#f5b800]/20 active:scale-95 flex items-center gap-3"
                          >
                             <Zap className="w-5 h-5 fill-current" />
                             {isRTL ? "تفعيل الرصد المباشر الآن" : "Enable Live Tracking"}
                          </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
          </div>

          {/* RIGHT: Operations Control Center (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <div className={`p-8 rounded-[32px] border backdrop-blur-md ${isDark ? 'bg-slate-800/40 border-[#243460] shadow-2xl' : 'bg-white border-gray-100 shadow-sm shadow-slate-200/50'}`}>
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#f5b800]/10 text-[#f5b800] flex items-center justify-center shadow-lg">
                     <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-black leading-tight ${isDark ? 'text-white' : 'text-[#0f2044]'}`}>
                        {isRTL ? "مركز التحكم والعمليات" : "Operations Control Center"}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">
                        {isRTL ? "إدارة الموارد والأنظمة الفورية" : "Immediate Resource & System Management"}
                    </p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <QuickActionItem 
                    icon={<SchoolIcon className="w-5 h-5" />}
                    label={isRTL ? "إضافة مدرسة جديدة" : "Add New School"}
                    link={route('admin.schools.create')}
                    color="navy"
                  />
                  <QuickActionItem 
                    icon={<Bus className="w-5 h-5" />}
                    label={isRTL ? "إضافة حافلة" : "Add New Bus"}
                    link={route('admin.buses.create')}
                    color="gold"
                  />
                  <QuickActionItem 
                    icon={<Users className="w-5 h-5" />}
                    label={isRTL ? "إدارة السائقين" : "Drivers Hub"}
                    link={route('admin.drivers.index')}
                    color="navy"
                  />
                  <QuickActionItem 
                    icon={<Bell className="w-5 h-5" />}
                    label={isRTL ? "طلبات الباصات" : "Bus Requests"}
                    link={route('admin.bus-requests.index')}
                    color="gold"
                  />
                  <QuickActionItem 
                    icon={<FileText className="w-5 h-5" />}
                    label={isRTL ? "سجل التعيينات" : "Assignment Log"}
                    link={route('admin.assignmentHistory')}
                    color="navy"
                  />
                  <QuickActionItem 
                    icon={<AlertTriangle className="w-5 h-5" />}
                    label={isRTL ? "البلاغات النشطة" : "Active Alerts"}
                    link={route('admin.emergencies.index')}
                    color="red"
                  />
               </div>
            </div>

            {/* Daily Trips Today Summary */}
            <div className={`p-6 rounded-3xl border backdrop-blur-md ${isDark ? 'bg-slate-800/40 border-slate-700 shadow-xl' : 'bg-white border-slate-100 shadow-sm shadow-slate-200/50'}`}>
               <div className="flex justify-between items-center mb-6">
                 <h3 className={`text-lg font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''} ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Activity className="w-5 h-5 text-blue-500" />
                    {isRTL ? "ملخص الرحلات اليومية (اليوم)" : "Daily Trips Summary (Today)"}
                 </h3>
                 <Link href={route('admin.daily-trips.index')} className="text-xs text-blue-500 font-bold hover:underline">
                    {isRTL ? "عرض الكل" : "View All"}
                 </Link>
               </div>
               
               <div className="grid grid-cols-3 gap-4">
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} flex flex-col items-center justify-center`}>
                     <span className={`text-2xl font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{stats.daily_trips_today.pending}</span>
                     <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{isRTL ? "انتظار" : "Pending"}</span>
                  </div>
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-sky-500/10' : 'bg-sky-50'} flex flex-col items-center justify-center border border-sky-500/20`}>
                     <span className={`text-2xl font-black text-sky-500`}>{stats.daily_trips_today.ongoing}</span>
                     <span className={`text-[10px] font-bold uppercase text-sky-400`}>{isRTL ? "جارية" : "Ongoing"}</span>
                  </div>
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'} flex flex-col items-center justify-center border border-emerald-500/20`}>
                     <span className={`text-2xl font-black text-emerald-500`}>{stats.daily_trips_today.completed}</span>
                     <span className={`text-[10px] font-bold uppercase text-emerald-400`}>{isRTL ? "مكتملة" : "Completed"}</span>
                  </div>
               </div>

               <div className="mt-6">
                   <button 
                    onClick={() => router.post(route('admin.daily-trips.auto-create'))}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-[#0f2044] hover:bg-[#1a2845] text-[#f5b800] rounded-2xl font-black text-sm transition-all shadow-xl shadow-[#0f2044]/20 active:scale-95 border border-[#f5b800]/30"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    {isRTL ? "توليد الرحلات اليومية آلياً" : "Auto-Create Daily Trips"}
                  </button>
                  <p className={`text-[9px] text-center mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isRTL ? "* يقوم بإنشاء رحلات لليوم بناءً على مسارات الحافلات النشطة" : "* Generates trips for today based on active bus routes"}
                  </p>
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
      {/* Approval Modal */}
      {approveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
          <motion.form 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onSubmit={handleApprove} 
            className={`rounded-[40px] w-full max-w-md p-10 shadow-2xl relative border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
          >
            <button type="button" onClick={() => setApproveModalOpen(false)} className="absolute top-8 left-8 text-slate-400 hover:text-rose-500 transition-colors"><XCircle size={28}/></button>
            <h3 className="text-3xl font-black mb-2">{isRTL ? "تفعيل الاشتراك" : "Activate Subscription"}</h3>
            <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
               {isRTL ? "يرجى تحديد عدد الأقساط المناسبة لهذه المدرسة" : "Please specify the number of installments for this school."}
            </p>
            
            <div className={`p-6 rounded-3xl mb-8 border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-xs font-bold uppercase tracking-widest opacity-60">{isRTL ? "تفاصيل الخطة" : "Plan Details"}</span>
                </div>
                <div className="text-lg font-black">{selectedSub?.plan?.name}</div>
                <div className="flex items-baseline gap-2 mt-1">
                   <div className="text-2xl font-black text-[#f5b800]">
                      ${(selectedSub?.plan?.max_buses || 1) * 20 * (selectedSub?.plan?.price || 0)}
                   </div>
                   <div className="text-[10px] font-bold opacity-50">
                      (إجمالي التقدير السنوي)
                   </div>
                </div>
                <div className={`text-[10px] mt-2 font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                   {isRTL ? "سعر الطالب:" : "Price per student:"} ${selectedSub?.plan?.price} | 
                   {isRTL ? " الحافلات:" : " Buses:"} {selectedSub?.plan?.max_buses || 1} | 
                   {isRTL ? " السعة:" : " Capacity:"} {(selectedSub?.plan?.max_buses || 1) * 20}
                </div>
                <div className={`text-[10px] mt-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isRTL ? "مقدم من مدرسة:" : "Request from:"} <span className="text-emerald-500">{selectedSub?.school?.name}</span></div>
            </div>

            <div className="space-y-5">
                <label className="block text-sm font-black opacity-70 px-1">{isRTL ? "خطة تقسيط المبالغ (نظام الأقساط)" : "Installment Plan"}</label>
                <div className="relative">
                   <select 
                      value={installmentsCount}
                      onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                      className={`w-full h-14 rounded-2xl border-2 px-5 font-black appearance-none focus:ring-0 ${isDark ? 'bg-slate-900 border-slate-700 focus:border-emerald-500' : 'bg-white border-slate-200 focus:border-emerald-500'}`}
                   >
                      <option value={1}>{isRTL ? "دفعة واحدة (كامل المبلغ)" : "Single Payment (Full Amount)"}</option>
                      <option value={2}>{isRTL ? "دفعتين (كل 6 أشهر)" : "2 Installments (Every 6 Months)"}</option>
                      <option value={3}>{isRTL ? "3 دفعات" : "3 Installments"}</option>
                      <option value={4}>{isRTL ? "4 دفعات (ربع سنوي)" : "4 Installments (Quarterly)"}</option>
                      <option value={12}>{isRTL ? "12 دفعة (شهري)" : "12 Installments (Monthly)"}</option>
                   </select>
                   <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
                      <Clock size={20} />
                   </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed px-1">
                   {isRTL 
                     ? `سيتم تقسيم مبلغ $${(selectedSub?.plan?.max_buses || 1) * 20 * (selectedSub?.plan?.price || 0)} تلقائياً على ${installmentsCount} مواعيد استحقاق منفصلة لهذا العام.`
                     : `The amount of $${(selectedSub?.plan?.max_buses || 1) * 20 * (selectedSub?.plan?.price || 0)} will be automatically split into ${installmentsCount} separate due dates.`
                   }
                </p>
            </div>

            <div className="mt-10 flex gap-4">
                <button type="submit" className="flex-[2] h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95">{isRTL ? "اعتماد وترخيص المدرسة" : "Approve & Activate"}</button>
                <button type="button" onClick={() => setApproveModalOpen(false)} className={`flex-1 h-14 font-bold rounded-2xl transition-all active:scale-95 ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}>{isRTL ? "إلغاء" : "Cancel"}</button>
            </div>
          </motion.form>
        </div>
      )}
    </AuthenticatedLayout>
  );
}

// --- Internal UI Components ---

function StatCard({ title, value, icon, trend, color, isDark, isRTL }: any) {
  const colorSchemes = {
    navy: "text-[#7ba7e8] bg-[#0f2044]/10",
    gold: "text-[#f5b800] bg-[#f5b800]/10",
    blue: "text-blue-500 bg-blue-500/10",
    green: "text-emerald-500 bg-emerald-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    yellow: "text-amber-500 bg-amber-500/10",
    indigo: "text-indigo-500 bg-indigo-500/10",
    rose: "text-rose-500 bg-rose-500/10",
  } as any;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`p-6 rounded-[28px] border backdrop-blur-md relative overflow-hidden transition-all duration-300 ${
        isDark ? 'bg-slate-800/40 border-[#243460] hover:bg-slate-800/60 shadow-xl' : 'bg-white border-gray-100 hover:bg-slate-50/50 shadow-sm shadow-slate-200/50 hover:shadow-2xl'
      }`}
    >
      <div className={`relative z-10 flex flex-col gap-3 ${isRTL ? 'items-end' : 'items-start'}`}>
         <div className={`p-4 rounded-2xl mb-2 ${colorSchemes[color]}`}>
            {icon}
         </div>
         <p className={DS_statLabel}>{title}</p>
         <div className={`flex items-baseline gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h4 className={DS_statValue}>{value}</h4>
            <span className={`text-[9px] font-black py-0.5 px-2 rounded-full ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
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
    navy: "bg-[#0f2044] text-[#f5b800] shadow-[#0f2044]/20 border border-[#f5b800]/20",
    gold: "bg-[#f5b800] text-[#0f2044] shadow-[#f5b800]/20",
    blue: "bg-blue-500 shadow-blue-500/20 hover:bg-blue-600",
    emerald: "bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600",
    amber: "bg-amber-500 shadow-amber-500/20 hover:bg-amber-600",
    red: "bg-red-500 shadow-red-500/20 hover:bg-red-600",
  } as any;

  return (
    <Link 
      href={link}
      className={`flex flex-col items-center justify-center p-6 rounded-[22px] font-black text-xs gap-3 transition-all hover:-translate-y-2 active:scale-95 shadow-2xl ${bgColors[color]}`}
    >
      <div className="p-2 rounded-xl bg-white/10">
        {icon}
      </div>
      <span className="text-center leading-tight uppercase tracking-tighter">{label}</span>
    </Link>
  );
}
