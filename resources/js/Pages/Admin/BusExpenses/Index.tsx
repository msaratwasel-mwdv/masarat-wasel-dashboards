import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Fuel,
  Wrench,
  Calendar,
  DollarSign,
  Bus as BusIcon,
  Plus,
  Filter,
  Image as ImageIcon,
  MoreHorizontal,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Zap,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  BarChart3
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer 
} from "recharts";
import PrimaryButton from "@/Components/PrimaryButton";
import ReportModal from "@/Components/Admin/BusExpenses/ReportModal";

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
}

interface Expense {
  id: number;
  bus_id: number;
  bus: Bus;
  type: 'fuel' | 'maintenance';
  amount: number;
  date: string;
  extra_info: string;
  receipt_photo: string | null;
  photo_url: string | null;
}

interface Props {
  expenses: {
    data: Expense[];
    links: any[];
    current_page: number;
    last_page: number;
    total: number;
  };
  buses: Bus[];
  filters: {
    type?: string;
  };
  stats: {
    total_fuel: number;
    total_maintenance: number;
    total_count: number;
    monthly_spending: number;
    trend: Array<{ date: string; count: number }>;
  };
}

export default function BusExpensesIndex({ expenses, buses, filters, stats }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [activeType, setActiveType] = useState(filters.type || "all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterChange = (type: string) => {
    setActiveType(type);
    router.get(route('admin.bus-expenses.index'), { type: type === 'all' ? '' : type }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const filteredExpenses = useMemo(() => {
    return expenses.data.filter(e => 
      e.bus.bus_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.bus.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.extra_info?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
  }, [expenses.data, searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <AuthenticatedLayout>
      <Head title={isRTL ? "إدارة المصاريف" : "Expense Management"} />

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* --- Header Section --- */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6`}>
           <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isRTL ? "سجل مصاريف الأسطول" : "Fleet Expense Logs"}
              </h1>
              <p className={`mt-2 text-lg ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isRTL ? "مراقبة وتحليل تكاليف الوقود والصيانة الحالية." : "Monitor and analyze current fuel and maintenance costs."}
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl border backdrop-blur-md shadow-sm transition-all ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                 <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isRTL ? "تزامن حي" : "Live Sync"}
                 </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest ${
                    isDark ? 'bg-slate-800/40 border-slate-700 text-brand-yellow hover:bg-slate-800' : 'bg-white border-slate-200 text-brand-yellow hover:bg-slate-50 shadow-sm'
                  }`}
                >
                    <BarChart3 size={18} />
                    <span className="hidden sm:inline">{isRTL ? "إنشاء تقرير استهلاك" : "Create Report"}</span>
                </button>
                <PrimaryButton className="bg-brand-yellow text-brand-dark hover:shadow-lg border-none">
                    <Plus className="w-4 h-4 mr-2" />
                    {isRTL ? "إضافة سجل" : "Add Record"}
                </PrimaryButton>
                <button className={`p-3 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/40 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}>
                    <Download size={20} />
                </button>
              </div>
           </div>
        </div>

        {/* --- KPI Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title={isRTL ? "إجمالي الوقود" : "Total Fuel"}
            value={stats.total_fuel}
            suffix="SAR"
            icon={<Fuel className="w-6 h-6" />}
            trend="+12%"
            color="blue"
            isDark={isDark}
            isRTL={isRTL}
          />
          <StatCard 
            title={isRTL ? "إجمالي الصيانة" : "Total Maintenance"}
            value={stats.total_maintenance}
            suffix="SAR"
            icon={<Wrench className="w-6 h-6" />}
            trend="-5%"
            color="indigo"
            isDark={isDark}
            isRTL={isRTL}
          />
          <StatCard 
            title={isRTL ? "مصاريف الشهر" : "Monthly Spending"}
            value={stats.monthly_spending}
            suffix="SAR"
            icon={<TrendingUp className="w-6 h-6" />}
            trend="+18%"
            color="emerald"
            isDark={isDark}
            isRTL={isRTL}
          />
          <StatCard 
            title={isRTL ? "عدد العمليات" : "Total Logs"}
            value={stats.total_count}
            icon={<Activity className="w-6 h-6" />}
            trend={`+${stats.total_count}`}
            color="yellow"
            isDark={isDark}
            isRTL={isRTL}
          />
        </div>

        {/* --- Analytics Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Chart Area (8 cols) */}
            <div className="lg:col-span-8">
                <div className={`p-6 rounded-[32px] border backdrop-blur-md ${isDark ? 'bg-slate-800/40 border-slate-700 shadow-xl' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className={`flex justify-between items-center mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <Activity className="w-5 h-5 text-emerald-500" />
                            {isRTL ? "اتجاه المصاريف (آخر 15 يوم)" : "Expense Trend (Last 15 Days)"}
                        </h3>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.trend}>
                                <defs>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                                <XAxis 
                                  dataKey="date" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10}} 
                                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10}} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#fbbf24" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Quick Actions/Info (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
                <div className={`p-6 rounded-[32px] border backdrop-blur-md ${isDark ? 'bg-brand-navy border-slate-700 text-white' : 'bg-brand-navy border-slate-100 text-white shadow-xl shadow-brand-navy/20'}`}>
                    <h3 className="text-xl font-black mb-2">{isRTL ? "نظام التقارير الذكي" : "Smart Reporting"}</h3>
                    <p className="text-sm opacity-70 mb-6">{isRTL ? "قم بتحميل التقارير التفصيلية المخصصة للمحاسبة." : "Download detailed reports customized for accounting."}</p>
                    <button className="w-full py-4 rounded-2xl bg-brand-yellow text-brand-dark font-black text-sm uppercase tracking-widest hover:shadow-xl hover:shadow-brand-yellow/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Download size={18} />
                        {isRTL ? "تصدير البيانات" : "Export Data"}
                    </button>
                    <div className="mt-8 flex items-center gap-4 text-xs font-bold opacity-60">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        {isRTL ? "تم تحديث البيانات قبل قليل" : "Data updated just now"}
                    </div>
                </div>

                <div className={`p-6 rounded-[32px] border backdrop-blur-md ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <h4 className={`text-sm font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{isRTL ? "إحصائيات سريعة" : "Quick Stats"}</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs">
                           <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{isRTL ? "متوسط الصرف/حافلة" : "Avg/Bus"}</span>
                           <span className="font-bold text-brand-yellow">1,240 SAR</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{isRTL ? "أعلى استهلاك وقود" : "Max Fuel Bus"}</span>
                           <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>#1042</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- List Section --- */}
        <div className="space-y-6 pt-4">
            {/* Toolbar */}
            <div className={`flex flex-col md:flex-row justify-between items-center gap-4`}>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {['all', 'fuel', 'maintenance'].map((type) => (
                        <button
                            key={type}
                            onClick={() => handleFilterChange(type)}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                                activeType === type
                                    ? "bg-brand-dark text-white shadow-lg dark:bg-brand-yellow dark:text-brand-dark"
                                    : (isDark ? "bg-slate-800/50 text-slate-400 hover:bg-slate-700" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100")
                            }`}
                        >
                            {type === 'all' ? (isRTL ? "الكل" : "All") : (type === 'fuel' ? (isRTL ? "الوقود" : "Fuel") : (isRTL ? "الصيانة" : "Maintenance"))}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-yellow transition-colors`} size={18} />
                    <input 
                        type="text" 
                        placeholder={isRTL ? "بحث عن حافلة أو تفاصيل..." : "Search bus or details..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-2xl border-0 focus:ring-2 focus:ring-brand-yellow transition-all ${
                            isDark ? 'bg-slate-800/40 text-white placeholder-slate-500' : 'bg-white shadow-sm placeholder-slate-400'
                        }`}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredExpenses.map((expense, index) => (
                        <motion.div
                            key={expense.id}
                            variants={cardVariants}
                            layout
                            className={`group relative overflow-hidden rounded-[32px] border transition-all duration-300 ${
                                isDark 
                                    ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800" 
                                    : "bg-white border-slate-100 hover:shadow-2xl shadow-sm"
                            }`}
                        >
                            {/* Decorative Background Blob */}
                            <div className={`absolute -top-12 -right-12 w-32 h-32 blur-[60px] opacity-10 rounded-full transition-all group-hover:scale-150 ${expense.type === 'fuel' ? 'bg-blue-500' : 'bg-indigo-500'}`} />

                            <div className="p-8">
                                <div className={`flex justify-between items-start mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div 
                                        onClick={() => expense.photo_url && setSelectedImage(expense.photo_url)}
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                                        expense.photo_url ? "cursor-pointer hover:scale-110 active:scale-95 shadow-lg" : ""
                                      } ${
                                        expense.type === 'fuel' 
                                          ? "bg-blue-500/10 text-blue-500" 
                                          : "bg-indigo-500/10 text-indigo-500"
                                      }`}>
                                        {expense.type === 'fuel' ? <Fuel size={28} /> : <Wrench size={28} />}
                                    </div>
                                    <div className={`text-right ${isRTL ? 'text-left' : ''}`}>
                                        <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            <span className="text-xs font-bold opacity-30 mr-1">SAR</span>
                                            {Number(expense.amount).toLocaleString()}
                                        </div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {new Date(expense.date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })}
                                        </div>
                                    </div>
                                </div>

                                <div className={isRTL ? 'text-right' : ''}>
                                    <h4 className={`text-lg font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {expense.type === 'fuel' ? (isRTL ? "تزود بالوقود" : "Fuel Top-up") : (isRTL ? "أعمال صيانة" : "Maintenance Work")}
                                    </h4>
                                    <div className={`flex items-center gap-3 mt-2 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                                            <BusIcon size={12} className="opacity-60" />
                                            <span>{expense.bus.bus_number}</span>
                                        </div>
                                        <span className="opacity-20">|</span>
                                        <span className="truncate">{expense.bus.plate_number}</span>
                                    </div>
                                </div>

                                <div className={`mt-6 p-4 rounded-2xl text-[11px] font-medium leading-relaxed ${isRTL ? 'text-right' : ''} ${isDark ? 'bg-slate-900/40 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                                    {expense.extra_info || (isRTL ? "لا يوجد تفاصيل إضافية" : "No additional details")}
                                </div>

                                <div className={`mt-6 flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                                    <div className="flex gap-1">
                                        <button className={`p-2 rounded-xl transition-all ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-700' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}>
                                            <Trash2 size={16} />
                                        </button>
                                        <button className={`p-2 rounded-xl transition-all ${isDark ? 'text-slate-500 hover:text-white hover:bg-slate-700' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}>
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => expense.photo_url && setSelectedImage(expense.photo_url)}
                                        disabled={!expense.photo_url}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                            expense.photo_url 
                                                ? "bg-brand-yellow text-brand-dark shadow-lg shadow-brand-yellow/10" 
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                        }`}
                                    >
                                        {isRTL ? "معاينة" : "Preview"}
                                        <ImageIcon size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredExpenses.length === 0 && (
                <div className={`p-24 rounded-[48px] border-2 border-dashed flex flex-col items-center justify-center ${isDark ? "bg-slate-800/20 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <div className="w-24 h-24 rounded-3xl bg-brand-yellow/10 flex items-center justify-center mb-6">
                        <DollarSign className="w-12 h-12 text-brand-yellow" />
                    </div>
                    <h3 className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                        {isRTL ? "لا توجد سجلات مطابقة" : "No Matching Records"}
                    </h3>
                    <p className={`mt-3 ${isDark ? "text-slate-500" : "text-slate-400"} text-center max-w-sm font-medium`}>
                        {isRTL ? "لم نجد أي مصاريف تطابق بحثك. حاول تغيير الفلاتر أو الكلمات الدلالية." : "We couldn't find any expenses matching your search. Try changing filters or keywords."}
                    </p>
                </div>
            )}
        </div>

        {/* Image Preview Modal */}
        <AnimatePresence>
            {selectedImage && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedImage(null)}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md cursor-zoom-out"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.9, opacity: 0, rotate: 2 }}
                        className="relative max-w-5xl w-full max-h-[90vh] overflow-hidden rounded-[40px] bg-white dark:bg-slate-900 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-yellow via-blue-500 to-indigo-500" />
                        <img 
                            src={selectedImage} 
                            alt="Attachment" 
                            className="w-full h-full object-contain"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-black/50 text-white hover:bg-brand-yellow hover:text-brand-dark transition-all flex items-center justify-center shadow-lg backdrop-blur-md"
                        >
                            <Plus className="rotate-45" size={28} />
                        </button>
                        
                        {/* Modal Info Bar */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                            <div className="flex justify-between items-center text-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md">
                                        <ImageIcon size={20} />
                                    </div>
                                    <span className="font-bold text-sm">{isRTL ? "معاينة المرفق" : "Attachment Preview"}</span>
                                </div>
                                <a 
                                  href={selectedImage} 
                                  download 
                                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2"
                                >
                                    <Download size={14} />
                                    {isRTL ? "تحميل" : "Download"}
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <ReportModal 
            isOpen={isReportModalOpen} 
            onClose={() => setIsReportModalOpen(false)} 
            buses={buses}
            isRTL={isRTL}
        />
      </motion.div>
    </AuthenticatedLayout>
  );
}

// --- Internal UI Components ---

function StatCard({ title, value, suffix = "", icon, trend, color, isDark, isRTL }: any) {
  const colorSchemes = {
    blue: "text-blue-500 bg-blue-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    yellow: "text-brand-yellow bg-brand-yellow/10",
    indigo: "text-indigo-500 bg-indigo-500/10",
  } as any;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`p-6 rounded-[32px] border backdrop-blur-md relative overflow-hidden transition-all ${
        isDark ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 shadow-xl' : 'bg-white border-slate-100 hover:bg-slate-50/50 shadow-sm'
      }`}
    >
      <div className={`relative z-10 flex flex-col gap-2 ${isRTL ? 'items-end' : 'items-start'}`}>
         <div className={`p-4 rounded-2xl mb-2 ${colorSchemes[color]}`}>
            {icon}
         </div>
         <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
         <div className={`flex items-baseline gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h4 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{Number(value).toLocaleString()}</h4>
            {suffix && <span className="text-[10px] font-bold opacity-40">{suffix}</span>}
            <span className={`text-[9px] font-black py-1 px-2 rounded-lg ${trend.startsWith('+') && color !== 'indigo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
               {trend}
            </span>
         </div>
      </div>
      {/* Visual Decor */}
      <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-[0.05] pointer-events-none ${colorSchemes[color].split(' ')[1]}`} />
    </motion.div>
  );
}
