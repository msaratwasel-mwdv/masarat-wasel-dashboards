import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import {
  School as SchoolIcon,
  MapPin,
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

export default function SchoolListRow({ school, isDark, isRTL, onEdit }: Props) {
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
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
        isDark ? "border-gray-700" : "border-gray-100"
      }`}
    >
      {/* School Name & Logo */}
      <td className="px-6 py-4">
        <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div
            className={`w-11 h-11 rounded-xl border ${
              isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"
            } flex items-center justify-center p-1.5 shrink-0 shadow-sm`}
          >
            {school.logo ? (
              <img
                src={`/storage/${school.logo}`}
                className="w-full h-full object-contain"
                alt={school.name}
              />
            ) : (
              <SchoolIcon className={`w-5 h-5 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
            )}
          </div>
          <div className={isRTL ? "text-right" : "text-left"}>
            <div className={`font-bold text-sm ${isDark ? "text-white" : "text-brand-navy"}`}>
              {school.name}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {school.address || (isRTL ? "موقع غير محدد" : "No location")}
            </div>
          </div>
        </div>
      </td>

      {/* Subscription Plan */}
      <td className="px-6 py-4 text-center">
        {planName ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-brand-yellow/20 text-brand-dark dark:text-brand-yellow border border-brand-yellow/40">
            <Sparkles className="w-3 h-3" />
            {planName}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* Status Toggle */}
      <td className="px-6 py-4 text-center">
        <button
          onClick={toggleStatus}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
            localStatus === "Active"
              ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
              : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
          } ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              localStatus === "Active" ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
          {localStatus === "Active" ? (isRTL ? "نشطة" : "Active") : (isRTL ? "غير نشطة" : "Inactive")}
        </button>
      </td>

      {/* Buses Count */}
      <td className="px-6 py-4 text-center font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
        {school.buses_count || 0}
      </td>

      {/* Students Count */}
      <td className="px-6 py-4 text-center font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
        {school.enrollments_count || 0}
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className={`flex items-center justify-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Link
            href={route("admin.schools.show", school.id)}
            className={`p-2 rounded-xl transition-all ${
              isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-50 hover:bg-gray-100 text-gray-600"
            }`}
            title={isRTL ? "التفاصيل" : "Details"}
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            onClick={onEdit}
            className={`p-2 rounded-xl transition-all ${
              isDark
                ? "bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-yellow"
                : "bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-dark"
            }`}
            title={isRTL ? "تعديل" : "Edit"}
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
