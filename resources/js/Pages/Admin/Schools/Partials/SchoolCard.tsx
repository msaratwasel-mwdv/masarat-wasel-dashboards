import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import {
  School as SchoolIcon,
  MapPin,
  Bus as BusIcon,
  Users as UsersIcon,
  ExternalLink,
  Pencil,
  Sparkles,
} from "lucide-react";
import { School } from "./types";

interface Props {
  school: School;
  isDark: boolean;
  isRTL: boolean;
  onEdit: () => void;
}

export default function SchoolCard({ school, isDark, isRTL, onEdit }: Props) {
  const [localStatus, setLocalStatus] = useState(school.status);

  useEffect(() => {
    setLocalStatus(school.status);
  }, [school.status]);

  const toggleStatus = () => {
    const nextStatus = localStatus === "Active" ? "Inactive" : "Active";
    setLocalStatus(nextStatus);

    router.post(
      route("admin.schools.toggle", school.id),
      {},
      {
        preserveScroll: true,
        onError: () => setLocalStatus(school.status),
      }
    );
  };

  const planName = school.current_subscription?.plan?.name_ar || school.current_subscription?.plan?.name;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`rounded-[2rem] border overflow-hidden transition-all duration-300 ${
        isDark
          ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800 shadow-xl"
          : "bg-white border-gray-100 shadow-sm hover:shadow-xl group"
      }`}
    >
      <div
        className={`h-24 relative ${
          localStatus === "Active"
            ? "bg-gradient-to-r from-brand-navy to-[#041b3a]"
            : "bg-gray-600"
        }`}
      >
        {/* Status Badge & Plan Badge */}
        <div className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} flex items-center gap-2`}>
          {planName && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-brand-yellow text-brand-dark shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {planName}
            </span>
          )}
          <span
            className={`px-3 py-0.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 ${
              localStatus === "Active"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-white/20 text-white border border-white/30"
            }`}
          >
            {localStatus === "Active" ? (isRTL ? "نشطة" : "Active") : (isRTL ? "غير نشطة" : "Inactive")}
          </span>
        </div>

        {/* Logo Overlapping */}
        <div
          className={`absolute -bottom-8 ${
            isRTL ? "right-6" : "left-6"
          } w-[72px] h-[72px] rounded-2xl border-[3px] ${
            isDark ? "bg-gray-900 border-gray-800" : "bg-white border-white"
          } shadow-lg overflow-hidden flex items-center justify-center p-1.5 z-10`}
        >
          {school.logo ? (
            <img
              src={`/storage/${school.logo}`}
              className="w-full h-full object-contain"
              alt={school.name}
            />
          ) : (
            <SchoolIcon className={`w-7 h-7 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
          )}
        </div>
      </div>

      <div className="pt-11 px-6 pb-6 space-y-4">
        <div className={isRTL ? "text-right" : "text-left"}>
          <h4 className={`text-lg font-black truncate ${isDark ? "text-white" : "text-brand-navy"}`}>
            {school.name}
          </h4>
          <p
            className={`text-xs flex items-center gap-1 mt-1 ${
              isDark ? "text-gray-400" : "text-gray-500"
            } ${isRTL ? "flex-row-reverse" : ""}`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <span className="truncate">{school.address || (isRTL ? "موقع غير محدد" : "No location")}</span>
          </p>
        </div>

        {/* Metrics Stats Pill */}
        <div
          className={`grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-xs`}
        >
          <div className="flex items-center gap-2 justify-center">
            <BusIcon className="w-4 h-4 text-blue-500" />
            <span className="font-mono font-bold">{school.buses_count || 0}</span>
            <span className="text-gray-400 text-[11px]">{isRTL ? "حافلة" : "Buses"}</span>
          </div>
          <div className="flex items-center gap-2 justify-center border-s border-gray-200 dark:border-gray-700">
            <UsersIcon className="w-4 h-4 text-emerald-500" />
            <span className="font-mono font-bold">{school.enrollments_count || 0}</span>
            <span className="text-gray-400 text-[11px]">{isRTL ? "طالب" : "Students"}</span>
          </div>
        </div>

        {/* Actions */}
        <div
          className={`grid grid-cols-2 gap-2.5 pt-2 border-t ${
            isDark ? "border-gray-700/50" : "border-gray-100"
          }`}
        >
          <Link
            href={route("admin.schools.show", school.id)}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isDark
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-brand-navy/5 text-brand-navy hover:bg-brand-navy/10"
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{isRTL ? "التفاصيل" : "Details"}</span>
          </Link>
          <button
            onClick={onEdit}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isDark
                ? "bg-brand-yellow/20 text-brand-yellow hover:bg-brand-yellow/30"
                : "bg-brand-yellow text-brand-dark hover:bg-yellow-400 shadow-sm"
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{isRTL ? "تعديل" : "Edit"}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
