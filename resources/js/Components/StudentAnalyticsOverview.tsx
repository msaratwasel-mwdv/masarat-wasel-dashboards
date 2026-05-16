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

  const StatWidget = ({ icon: Icon, label, value, colorClass, bgColorClass }: any) => (
    <motion.div variants={itemVariants} className={`p-4 md:p-5 rounded-[20px] flex items-center gap-4 border border-gray-100 dark:border-[#243460] bg-white dark:bg-[#1a2845] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}>
      <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 ${bgColorClass} ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{label}</p>
        <h4 className="text-xl md:text-2xl font-black text-[#0f2044] dark:text-white leading-none">{value}</h4>
      </div>
      {/* Decorative background element */}
      <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-5 ${bgColorClass}`} />
    </motion.div>
  );

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 mb-8"
    >
      {/* Overview Widgets */}
      <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
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

      {/* Analytics Charts */}
      <div className="xl:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* Gender Distribution */}
        <motion.div variants={itemVariants} className={`${DS_card} p-5 flex flex-col h-full`}>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#f5b800]" /> {t("Demographics")}
          </h3>
          <div className="flex-1 flex items-center justify-center min-h-[140px] relative">
            {stats.all > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', backgroundColor: isDark ? '#1a2845' : '#fff', color: isDark ? '#fff' : '#0f2044' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-2' : 'right-2'} flex flex-col gap-3`}>
                  {genderData.map(d => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 leading-none mb-0.5">{d.name}</p>
                        <p className="text-xs font-black text-[#0f2044] dark:text-white leading-none">{d.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs font-bold text-gray-400 italic">{t("No Data")}</div>
            )}
          </div>
        </motion.div>

        {/* Bus Utilization Progress */}
        <motion.div variants={itemVariants} className={`${DS_card} p-5 flex flex-col h-full justify-between relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Bus className="w-32 h-32 text-[#0f2044] dark:text-white" />
          </div>
          
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
            <Bus className="w-4 h-4 text-[#f5b800]" /> {t("Transport Utilization")}
          </h3>
          
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <div className="flex items-end gap-2 mb-2">
              <h2 className="text-4xl md:text-5xl font-black text-[#0f2044] dark:text-white">{busUtilization}%</h2>
              <span className="text-xs font-bold text-gray-500 mb-1.5">{t("using buses")}</span>
            </div>
            
            <div className="w-full h-3 bg-gray-100 dark:bg-[#243460] rounded-full overflow-hidden mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${busUtilization}%` }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#0f2044] to-[#f5b800] rounded-full"
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] md:text-xs font-bold px-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{stats.with_bus} {t("Subscribed")}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span>{stats.no_bus} {t("Not Subscribed")}</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
