import React from "react";
import { motion } from "framer-motion";
import { Wallet, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import OmaniRial from "@/Components/OmaniRial";

interface Props {
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  overdueCount: number;
  isDark: boolean;
  isRTL: boolean;
}

export default function InstallmentStatCards({
  totalAmount,
  totalPaid,
  totalRemaining,
  overdueCount,
  isDark,
  isRTL,
}: Props) {
  const stats = [
    {
      id: "total",
      label: isRTL ? "إجمالي قيمة العقود" : "Total Subscribed",
      amount: totalAmount,
      isCurrency: true,
      icon: Wallet,
      color: "blue",
      bg: isDark ? "bg-blue-950/40 text-blue-400" : "bg-blue-50 text-blue-600",
      border: isDark ? "border-blue-800/40" : "border-blue-100",
    },
    {
      id: "paid",
      label: isRTL ? "المبالغ المحصلة" : "Collected Payments",
      amount: totalPaid,
      isCurrency: true,
      icon: CheckCircle2,
      color: "emerald",
      bg: isDark ? "bg-emerald-950/40 text-emerald-400" : "bg-emerald-50 text-emerald-600",
      border: isDark ? "border-emerald-800/40" : "border-emerald-100",
    },
    {
      id: "remaining",
      label: isRTL ? "المبالغ المعلقة" : "Pending Balance",
      amount: totalRemaining,
      isCurrency: true,
      icon: Clock,
      color: "amber",
      bg: isDark ? "bg-amber-950/40 text-amber-400" : "bg-amber-50 text-amber-600",
      border: isDark ? "border-amber-800/40" : "border-amber-100",
    },
    {
      id: "overdue",
      label: isRTL ? "أقساط متأخرة" : "Overdue Installments",
      amount: overdueCount,
      isCurrency: false,
      icon: AlertTriangle,
      color: "rose",
      bg: isDark ? "bg-rose-950/40 text-rose-400" : "bg-rose-50 text-rose-600",
      border: isDark ? "border-rose-800/40" : "border-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            className={`p-5 rounded-3xl border ${
              isDark ? "bg-gray-800/80 border-gray-700" : "bg-white border-gray-100"
            } shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {stat.label}
              </span>
              <div className={`p-2.5 rounded-2xl ${stat.bg} border ${stat.border}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5" dir="ltr">
              <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-gray-900 dark:text-white">
                {stat.isCurrency ? stat.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : stat.amount}
              </span>
              {stat.isCurrency && (
                <OmaniRial className="w-4 h-4 inline-block text-gray-400 dark:text-gray-500" />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
