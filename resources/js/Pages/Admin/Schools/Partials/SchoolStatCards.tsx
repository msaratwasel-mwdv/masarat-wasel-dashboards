import React from "react";
import { motion } from "framer-motion";
import { School as SchoolIcon, CheckCircle2, XCircle, Bus as BusIcon, Users } from "lucide-react";

interface Props {
  counts: {
    all: number;
    active: number;
    inactive: number;
    buses?: number;
    students?: number;
  };
  isDark: boolean;
  isRTL: boolean;
}

export default function SchoolStatCards({ counts, isDark, isRTL }: Props) {
  const stats = [
    {
      label: isRTL ? "إجمالي المدارس" : "Total Schools",
      value: counts.all,
      icon: <SchoolIcon className="w-5 h-5" />,
      color: "blue" as const,
    },
    {
      label: isRTL ? "إجمالي الطلاب" : "Total Students",
      value: counts.students ?? 0,
      icon: <Users className="w-5 h-5" />,
      color: "emerald" as const,
    },
    {
      label: isRTL ? "إجمالي الحافلات" : "Total Buses",
      value: counts.buses ?? 0,
      icon: <BusIcon className="w-5 h-5" />,
      color: "gold" as const,
    },
    {
      label: isRTL ? "مدارس نشطة" : "Active Schools",
      value: counts.active,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "green" as const,
    },
    {
      label: isRTL ? "غير نشطة" : "Inactive Schools",
      value: counts.inactive,
      icon: <XCircle className="w-5 h-5" />,
      color: "orange" as const,
    },
  ];

  const colorMap = {
    blue: isDark ? "from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20" : "from-blue-50 to-white text-blue-600 border-blue-100",
    emerald: isDark ? "from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20" : "from-emerald-50 to-white text-emerald-600 border-emerald-100",
    gold: isDark ? "from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/20" : "from-amber-50 to-white text-amber-600 border-amber-100",
    green: isDark ? "from-teal-500/20 to-teal-600/5 text-teal-400 border-teal-500/20" : "from-teal-50 to-white text-teal-600 border-teal-100",
    orange: isDark ? "from-orange-500/20 to-orange-600/5 text-orange-400 border-orange-500/20" : "from-orange-50 to-white text-orange-600 border-orange-100",
  };

  const iconBgMap = {
    blue: isDark ? "bg-blue-500/20" : "bg-blue-100/50",
    emerald: isDark ? "bg-emerald-500/20" : "bg-emerald-100/50",
    gold: isDark ? "bg-amber-500/20" : "bg-amber-100/50",
    green: isDark ? "bg-teal-500/20" : "bg-teal-100/50",
    orange: isDark ? "bg-orange-500/20" : "bg-orange-100/50",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          whileHover={{ y: -3, scale: 1.01 }}
          className={`p-5 rounded-[2rem] border flex items-center gap-4 transition-all bg-gradient-to-br ${colorMap[stat.color]} shadow-sm hover:shadow-lg ${
            isRTL ? "flex-row-reverse text-right" : "text-left"
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBgMap[stat.color]}`}>
            {stat.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-black uppercase tracking-wider truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {stat.label}
            </p>
            <p className={`text-2xl lg:text-3xl font-mono font-black mt-1 truncate ${isDark ? "text-white" : "text-brand-navy"}`}>
              {stat.value}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
