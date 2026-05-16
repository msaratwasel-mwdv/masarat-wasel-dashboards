import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import useTranslation from '@/hooks/useTranslation';
import { useTheme } from '@/Contexts/ThemeContext';
import { Users, UserCheck, UserX, Baby, UsersRound, Globe } from 'lucide-react';
import { DS_card } from '@/lib/DS';

interface GuardianStats {
  total: number;
  active: number;
  inactive: number;
  with_students: number;
  no_students: number;
  multi_students: number;
  ar_lang: number;
  en_lang: number;
}

interface Props {
  stats: GuardianStats;
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08, duration: 0.3 } },
};

const COLORS = { navy: '#0f2044', gold: '#f5b800', green: '#10b981', red: '#ef4444', blue: '#3b82f6', gray: '#9ca3af', purple: '#8b5cf6' };

export default function GuardianAnalyticsOverview({ stats }: Props) {
  const { t, isRtl } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bindingRate = stats.total > 0 ? Math.round((stats.with_students / stats.total) * 100) : 0;

  const langData = useMemo(() => [
    { name: t('Arabic'), value: stats.ar_lang, color: COLORS.navy },
    { name: t('English'), value: stats.en_lang, color: COLORS.gold },
  ].filter(d => d.value > 0), [stats, t]);

  const statusData = useMemo(() => [
    { name: t('Active'), value: stats.active, color: COLORS.green },
    { name: t('Inactive'), value: stats.inactive, color: COLORS.red },
  ].filter(d => d.value > 0), [stats, t]);

  const tooltipStyle = {
    borderRadius: '12px', border: 'none',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
    backgroundColor: isDark ? '#1a2845' : '#fff',
    color: isDark ? '#fff' : '#0f2044',
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mb-8 space-y-4"
    >
      {/* Row 1 – Compact Stat Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {[
          { icon: Users,      label: t('Total Parents'),      value: stats.total,         color: 'text-[#0f2044] dark:text-[#7ba7e8]',     bg: 'bg-[#0f2044]/10 dark:bg-[#0f2044]/30' },
          { icon: UserCheck,  label: t('Active'),             value: stats.active,        color: 'text-emerald-600 dark:text-emerald-400',  bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { icon: UserX,      label: t('Inactive'),           value: stats.inactive,      color: 'text-rose-600 dark:text-rose-400',        bg: 'bg-rose-50 dark:bg-rose-900/20' },
          { icon: Baby,       label: t('With Children'),      value: stats.with_students, color: 'text-sky-600 dark:text-sky-400',          bg: 'bg-sky-50 dark:bg-sky-900/20' },
          { icon: UsersRound, label: t('Multiple Children'),  value: stats.multi_students,color: 'text-purple-600 dark:text-purple-400',    bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { icon: Globe,      label: t('No Students Yet'),    value: stats.no_students,   color: 'text-amber-600 dark:text-amber-400',      bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <motion.div
            key={label}
            variants={itemVariants}
            className="flex items-center gap-3 p-3 md:p-4 rounded-[18px] bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] shadow-sm hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 ${bg} ${color} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-none mb-1 truncate">{label}</p>
              <h4 className="text-lg md:text-xl font-black text-[#0f2044] dark:text-white leading-none">{value}</h4>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Row 2 – Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* Status Donut */}
        <motion.div variants={itemVariants} className={`${DS_card} p-5`}>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-[#f5b800]" /> {t('Account Status')}
          </h3>
          <div className="flex items-center gap-4 min-h-[120px]">
            {stats.total > 0 ? (
              <>
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={32} outerRadius={48} paddingAngle={4} dataKey="value" stroke="none">
                      {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 flex-1">
                  {statusData.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{d.name}</span>
                      </div>
                      <span className="text-sm font-black text-[#0f2044] dark:text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400 italic m-auto">{t('No Data')}</p>
            )}
          </div>
        </motion.div>

        {/* Language Distribution */}
        <motion.div variants={itemVariants} className={`${DS_card} p-5`}>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#f5b800]" /> {t('Preferred Language')}
          </h3>
          <div className="flex items-center gap-4 min-h-[120px]">
            {stats.total > 0 ? (
              <>
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={langData} cx="50%" cy="50%" innerRadius={32} outerRadius={48} paddingAngle={4} dataKey="value" stroke="none">
                      {langData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-3 flex-1">
                  {langData.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{d.name}</span>
                      </div>
                      <span className="text-sm font-black text-[#0f2044] dark:text-white">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-400 italic m-auto">{t('No Data')}</p>
            )}
          </div>
        </motion.div>

        {/* Student Binding Rate */}
        <motion.div variants={itemVariants} className={`${DS_card} p-5 md:col-span-2 xl:col-span-1 flex flex-col justify-between relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-5 opacity-5 pointer-events-none">
            <Baby className="w-28 h-28 text-[#0f2044] dark:text-white" />
          </div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
            <Baby className="w-3.5 h-3.5 text-[#f5b800]" /> {t('Student Binding Rate')}
          </h3>
          <div className="relative z-10">
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-black text-[#0f2044] dark:text-white">{bindingRate}%</span>
              <span className="text-xs font-bold text-gray-400 mb-1.5">{t('linked to students')}</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 dark:bg-[#243460] rounded-full overflow-hidden mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${bindingRate}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-[#0f2044] to-[#f5b800] rounded-full"
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-emerald-600 dark:text-emerald-400">✓ {stats.with_students} {t('linked')}</span>
              <span className="text-gray-400">◌ {stats.no_students} {t('unlinked')}</span>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
