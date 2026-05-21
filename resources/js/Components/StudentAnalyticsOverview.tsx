import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import useTranslation from '@/hooks/useTranslation';
import { useTheme } from '@/Contexts/ThemeContext';
import { Users, UserCheck, UserX, Bus, Activity } from 'lucide-react';
import { DS_card } from '@/lib/DS';

interface AnalyticsProps {
  stats: {
    all: number;
    active: number;
    inactive: number;
    male: number;
    female: number;
    with_bus: number;
    no_bus: number;
  };
}

const COLORS = {
  navy: '#0f2044',
  gold: '#f5b800',
  red: '#ef4444',
  green: '#10b981',
  blue: '#3b82f6',
  pink: '#ec4899',
  gray: '#9ca3af'
};

export default function StudentAnalyticsOverview({ stats }: AnalyticsProps) {
  const { t, isRtl } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const genderData = useMemo(() => [
    { name: t('Male'), value: stats.male, color: COLORS.blue },
    { name: t('Female'), value: stats.female, color: COLORS.pink },
  ].filter(d => d.value > 0), [stats, t]);

  const statusData = useMemo(() => [
    { name: t('Active'), value: stats.active, color: COLORS.green },
    { name: t('Inactive'), value: stats.inactive, color: COLORS.red },
  ].filter(d => d.value > 0), [stats, t]);

  const busUtilization = stats.all > 0 ? Math.round((stats.with_bus / stats.all) * 100) : 0;

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  {/* تم تكبير الـ Padding الداخلي وحجم الخط والأيقونة هنا لتبدو الكروت فخمة وضخمة */}
  const StatWidget = ({ icon: Icon, label, value, colorClass, bgColorClass }: any) => (
    <motion.div variants={itemVariants} className={`p-4 py-3.5 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a2845] shadow-sm hover:shadow-md transition-all relative overflow-hidden group`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColorClass} ${colorClass} group-hover:scale-105 transition-transform duration-300`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{label}</p>
        <h4 className="text-2xl sm:text-3xl font-black text-[#0f2044] dark:text-white leading-none">{value}</h4>
      </div>
      {/* Decorative background element */}
      <div className={`absolute -right-3 -bottom-3 w-16 h-16 rounded-full opacity-[0.04] ${bgColorClass}`} />
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 mb-6 h-fit max-h-none xl:max-h-[160px]"
    >
      {/* Overview Widgets - تم رفع المساحة من col-span-4 إلى col-span-5 لتكبير الكروت الإحصائية */}
      <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatWidget
          icon={Users}
          label={t("Total Students")}
          value={stats.all}
          colorClass="text-[#0f2044] dark:text-[#7ba7e8]"
          bgColorClass="bg-[#0f2044]/10 dark:bg-[#0f2044]/30"
        />
        <StatWidget
          icon={UserCheck}
          label={t("Active")}
          value={stats.active}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgColorClass="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatWidget
          icon={UserX}
          label={t("Inactive")}
          value={stats.inactive}
          colorClass="text-rose-600 dark:text-rose-400"
          bgColorClass="bg-rose-50 dark:bg-rose-900/20"
        />
      </div>

      {/* Analytics Charts - تم خفض المساحة إلى col-span-7 لتصغير الرسوم البيانية */}
      <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-3.5">

        {/* Gender Distribution - تم تصغير الدونات شارت وأقطارها لتبدو ناعمة وملمومة */}
        <motion.div variants={itemVariants} className={`${DS_card} p-3.5 py-2.5 flex flex-col h-full border-gray-100 dark:border-white/5 transition-all`}>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#f5b800]" /> {t("Demographics")}
          </h3>
          <div className="flex-1 flex items-center justify-center min-h-[75px] relative">
            {stats.all > 0 ? (
              <>
                <div className="w-full h-[75px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="45%"
                        cy="50%"
                        innerRadius={24}  
                        outerRadius={34}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: isDark ? '#1a2845' : '#fff', fontSize: '10px' }}
                        itemStyle={{ fontWeight: 'bold', padding: '2px 0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-1' : 'right-1'} flex flex-col gap-1`}>
                  {genderData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 leading-none mb-0.5">{d.name}</p>
                        <p className="text-xs font-black text-[#0f2044] dark:text-white leading-none">{d.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-[10px] font-bold text-gray-400 italic">{t("No Data")}</div>
            )}
          </div>
        </motion.div>

        {/* Bus Utilization Progress */}
        <motion.div variants={itemVariants} className={`${DS_card} p-3.5 py-2.5 flex flex-col h-full justify-between relative overflow-hidden border-gray-100 dark:border-white/5 transition-all`}>
          <div className="absolute top-0 right-0 p-2 opacity-[0.02] pointer-events-none">
            <Bus className="w-16 h-16 text-[#0f2044] dark:text-white" />
          </div>

          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 flex items-center gap-2 relative z-10">
            <Bus className="w-3.5 h-3.5 text-[#f5b800]" /> {t("Transport")}
          </h3>

          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <div className="flex items-end gap-1.5 mb-1">
              <h2 className="text-xl font-black text-[#0f2044] dark:text-white">{busUtilization}%</h2>
              <span className="text-[9px] font-bold text-gray-500 mb-0.5">{t("using buses")}</span>
            </div>

            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden mb-1.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${busUtilization}%` }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#0f2044] to-[#f5b800] rounded-full"
              />
            </div>

            <div className="flex justify-between items-center text-[9px] font-bold px-0.5">
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{stats.with_bus} {t("Subscribed")}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-white/10" />
                <span>{stats.no_bus} {t("Not")}</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
