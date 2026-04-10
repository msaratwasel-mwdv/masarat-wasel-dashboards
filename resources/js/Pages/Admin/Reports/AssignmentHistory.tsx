import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useState, useMemo } from "react";
import Pagination from "@/Components/Pagination";
import SearchableSelect from "@/Components/SearchableSelect";
import { useTheme } from "@/Contexts/ThemeContext";

// تعريف الأنواع
interface HistoryItem {
  id: number;
  event_type: string;
  created_at: string;
  admin?: { name: string };
  bus?: { bus_number: string; plate_number: string };
  old_driver?: { name: string };
  new_driver?: { name: string };
  old_school?: { name: string };
  new_school?: { name: string };
  old_supervisor?: { name: string };
  new_supervisor?: { name: string };
  old_status?: string;
  new_status?: string;
}

export default function AssignmentHistory({
  history,
  buses,
  filters,
  eventTypes,
}: any) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [filterData, setFilterData] = useState({
    bus_id: filters.bus_id || "",
    event_type: filters.event_type || "",
    date_from: filters.date_from || "",
    date_to: filters.date_to || "",
  });

  const busOptions = useMemo(
    () =>
      buses.map((b: any) => ({
        id: b.id,
        label: b.bus_number,
        subLabel: b.plate_number,
      })),
    [buses]
  );

  const applyFilter = () => {
    router.get(route("admin.assignmentHistory"), filterData, {
      preserveState: true,
    });
  };

  const resetFilter = () => {
    const defaultData = {
      bus_id: "",
      event_type: "",
      date_from: "",
      date_to: "",
    };
    setFilterData(defaultData);
    router.get(route("admin.assignmentHistory"), defaultData);
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "driver_change":
        return isDark
          ? "bg-amber-900/30 text-amber-400 border-amber-800"
          : "bg-amber-100 text-amber-700 border-amber-200";
      case "school_change":
        return isDark
          ? "bg-blue-900/30 text-blue-400 border-blue-800"
          : "bg-blue-100 text-blue-700 border-blue-200";
      case "supervisor_change":
        return isDark
          ? "bg-purple-900/30 text-purple-400 border-purple-800"
          : "bg-purple-100 text-purple-700 border-purple-200";
      case "bus_archived":
        return isDark
          ? "bg-red-900/30 text-red-400 border-red-800"
          : "bg-red-100 text-red-700 border-red-200";
      case "bus_restored":
        return isDark
          ? "bg-green-900/30 text-green-400 border-green-800"
          : "bg-green-100 text-green-700 border-green-200";
      default:
        return isDark
          ? "bg-gray-700 text-gray-300 border-gray-600"
          : "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "driver_change":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case "school_change":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getEventMessage = (item: HistoryItem) => {
    switch (item.event_type) {
      case "driver_change":
        return (
          <div className="flex flex-col gap-1">
            <span className={isDark ? "text-gray-400" : "text-gray-500"}>
              {isRTL ? "تم تحديث تعيين السائق" : "Driver Assignment Updated"}
            </span>
            <div
              className={`flex items-center gap-2 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <span
                className={`line-through ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {item.old_driver?.name || (isRTL ? "لا يوجد" : "None")}
              </span>
              <svg
                className={`w-3 h-3 ${
                  isDark ? "text-gray-500" : "text-gray-400"
                } ${isRTL ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-bold text-green-600">
                {item.new_driver?.name || (isRTL ? "لا يوجد" : "None")}
              </span>
            </div>
          </div>
        );
      case "school_change":
        return (
          <div className="flex flex-col gap-1">
            <span className={isDark ? "text-gray-400" : "text-gray-500"}>
              {isRTL ? "إعادة تعيين المدرسة" : "School Reassignment"}
            </span>
            <div
              className={`flex items-center gap-2 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <span
                className={`font-medium ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              >
                {item.old_school?.name ||
                  (isRTL ? "المقر الرئيسي (مجمع)" : "HQ (Pool)")}
              </span>
              <svg
                className={`w-3 h-3 ${
                  isDark ? "text-gray-500" : "text-gray-400"
                } ${isRTL ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-bold text-blue-600">
                {item.new_school?.name ||
                  (isRTL ? "المقر الرئيسي (مجمع)" : "HQ (Pool)")}
              </span>
            </div>
          </div>
        );
      case "supervisor_change":
        return (
          <div className="flex flex-col gap-1">
            <span className={isDark ? "text-gray-400" : "text-gray-500"}>
              {isRTL ? "تم تحديث المشرف" : "Supervisor Updated"}
            </span>
            <div
              className={`flex items-center gap-2 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <span className={isDark ? "text-gray-500" : "text-gray-400"}>
                {item.old_supervisor?.name || (isRTL ? "لا يوجد" : "None")}
              </span>
              <svg
                className={`w-3 h-3 ${
                  isDark ? "text-gray-500" : "text-gray-400"
                } ${isRTL ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-bold text-purple-600">
                {item.new_supervisor?.name || (isRTL ? "لا يوجد" : "None")}
              </span>
            </div>
          </div>
        );
      case "status_change":
        return (
          <div
            className={`flex items-center gap-2 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                isDark
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {item.old_status || "N/A"}
            </span>
            <svg
              className={`w-3 h-3 ${
                isDark ? "text-gray-500" : "text-gray-400"
              } ${isRTL ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                d="M14 5l7 7m0 0l-7 7m7-7H3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="px-2 py-0.5 rounded bg-brand-navy text-white text-[10px] uppercase font-bold">
              {item.new_status || "N/A"}
            </span>
          </div>
        );
      case "bus_archived":
        return (
          <span className="text-red-600 font-bold italic">
            {isRTL
              ? "تمت أرشفة الحافلة (حذف مؤقت)"
              : "Bus has been archived (Soft Deleted)"}
          </span>
        );
      case "bus_restored":
        return (
          <span className="text-green-600 font-bold italic">
            {isRTL
              ? "تمت استعادة الحافلة من الأرشيف"
              : "Bus has been restored from archive"}
          </span>
        );
      default:
        return (
          <span
            className={`${isDark ? "text-gray-400" : "text-gray-500"} italic`}
          >
            {isRTL ? "تم تسجيل إجراء في النظام" : "Action recorded in system"}
          </span>
        );
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div
          className={`flex justify-between items-center w-full ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <h2
            className={`font-bold text-xl ${
              isDark ? "text-gray-200" : "text-gray-800"
            }`}
          >
            {isRTL ? "سجل تدقيق التعيينات" : "Assignment Audit Log"}
          </h2>
          <button
            onClick={() =>
              alert(isRTL ? "قريباً!" : "Export feature coming soon!")
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm ${
              isDark
                ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isRTL ? "تصدير PDF/CSV" : "Export PDF/CSV"}
          </button>
        </div>
      }
    >
      <Head title={isRTL ? "سجل التعيينات" : "Assignment History"} />

      <div
        className={`py-6 min-h-screen dir-${isRTL ? "rtl" : "ltr"} ${
          isDark ? "bg-gray-900" : "bg-gray-50/50"
        }`}
      >
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Quick Stats */}
          <div
            className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 ${
              isRTL ? "rtl" : ""
            }`}
          >
            <div
              className={`${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              } p-4 rounded-xl border shadow-sm`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                  isDark ? "text-gray-400" : "text-gray-400"
                }`}
              >
                {isRTL ? "إجمالي السجلات" : "Total Records"}
              </p>
              <p className="text-2xl font-black text-brand-navy">
                {history.total}
              </p>
            </div>
            <div
              className={`${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              } p-4 rounded-xl border shadow-sm`}
            >
              <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
                {isRTL ? "تغييرات السائقين" : "Driver Changes"}
              </p>
              <p className="text-2xl font-black text-amber-600">
                {
                  history.data.filter(
                    (i: any) => i.event_type === "driver_change"
                  ).length
                }
                +
              </p>
            </div>
            <div
              className={`${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              } p-4 rounded-xl border shadow-sm`}
            >
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">
                {isRTL ? "انتقالات المدارس" : "School Moves"}
              </p>
              <p className="text-2xl font-black text-blue-600">
                {
                  history.data.filter(
                    (i: any) => i.event_type === "school_change"
                  ).length
                }
                +
              </p>
            </div>
            <div
              className={`${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-100"
              } p-4 rounded-xl border shadow-sm text-center`}
            >
              <div className="flex items-center justify-center h-full">
                <p
                  className={`text-[10px] px-2 italic font-medium ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {isRTL
                    ? "أرشفة تلقائية للسجلات الأقدم من سنة"
                    : "Auto-Archiving entries older than 1 year"}
                </p>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div
            className={`p-6 rounded-2xl shadow-sm border mb-6 ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <div
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end ${
                isRTL ? "rtl" : ""
              }`}
            >
              <div className={`lg:col-span-1 ${isRTL ? "text-right" : ""}`}>
                <SearchableSelect
                  label={isRTL ? "تصفية بالحافلة" : "Filter by Bus"}
                  options={busOptions}
                  value={filterData.bus_id}
                  onChange={(val) =>
                    setFilterData({ ...filterData, bus_id: val })
                  }
                  placeholder={
                    isRTL ? "بحث برقم الحافلة..." : "Search bus number..."
                  }
                />
              </div>

              <div className={isRTL ? "text-right" : ""}>
                <label
                  className={`block text-xs font-bold mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {isRTL ? "نوع الحدث" : "Event Category"}
                </label>
                <select
                  className={`w-full rounded-lg text-sm focus:ring-brand-yellow focus:border-brand-yellow ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                  value={filterData.event_type}
                  onChange={(e) =>
                    setFilterData({ ...filterData, event_type: e.target.value })
                  }
                >
                  <option value="">
                    {isRTL ? "جميع الفئات" : "All Categories"}
                  </option>
                  {Object.entries(eventTypes).map(([key, label]: any) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={isRTL ? "text-right" : ""}>
                <label
                  className={`block text-xs font-bold mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {isRTL ? "من تاريخ" : "Start Date"}
                </label>
                <input
                  type="date"
                  className={`w-full rounded-lg text-sm focus:ring-brand-yellow focus:border-brand-yellow ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                  value={filterData.date_from}
                  onChange={(e) =>
                    setFilterData({ ...filterData, date_from: e.target.value })
                  }
                />
              </div>

              <div className={isRTL ? "text-right" : ""}>
                <label
                  className={`block text-xs font-bold mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {isRTL ? "إلى تاريخ" : "End Date"}
                </label>
                <input
                  type="date"
                  className={`w-full rounded-lg text-sm focus:ring-brand-yellow focus:border-brand-yellow ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                  value={filterData.date_to}
                  onChange={(e) =>
                    setFilterData({ ...filterData, date_to: e.target.value })
                  }
                />
              </div>

              <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <button
                  onClick={applyFilter}
                  className="flex-1 bg-brand-navy text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-dark transition shadow-md"
                >
                  {isRTL ? "تطبيق" : "Apply Filters"}
                </button>
                <button
                  onClick={resetFilter}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition ${
                    isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  title={isRTL ? "مسح الكل" : "Clear All"}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Timeline View */}
          <div
            className={`rounded-2xl shadow-xl border p-8 ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <div
              className={`flex items-center justify-between mb-8 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <h3
                className={`text-lg font-black uppercase tracking-tight ${
                  isDark ? "text-white" : "text-gray-800"
                }`}
              >
                {isRTL ? "الخط الزمني للسجل" : "Audit Log Timeline"}
              </h3>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isDark
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {isRTL
                  ? `صفحة ${history.current_page} من ${history.last_page}`
                  : `Page ${history.current_page} of ${history.last_page}`}
              </span>
            </div>

            <div
              className={`relative ${
                isRTL ? "border-r-2 mr-4 pr-10" : "border-l-2 ml-4 pl-10"
              } border-dashed border-gray-200 space-y-10`}
            >
              {history.data.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div
                    className={`p-4 rounded-full mb-4 ${
                      isDark ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p
                    className={`font-bold ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {isRTL ? "لا توجد سجلات مطابقة" : "No matching records"}
                  </p>
                </div>
              ) : (
                history.data.map((item: HistoryItem) => (
                  <div key={item.id} className="relative group">
                    {/* Dot with Icon */}
                    <div
                      className={`absolute top-0 w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center transition-all group-hover:scale-110 shadow-sm ${getEventBadgeColor(
                        item.event_type
                      )} ${isRTL ? "-right-[22px]" : "-left-[22px]"}`}
                    >
                      {getEventIcon(item.event_type)}
                    </div>

                    {/* Content */}
                    <div
                      className={`p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 ${
                        isDark
                          ? "bg-gray-800 border-gray-700 hover:border-brand-yellow/30"
                          : "bg-white border-gray-100 hover:border-brand-yellow/30"
                      }`}
                    >
                      <div
                        className={`flex flex-col md:flex-row justify-between items-start gap-4 mb-4 ${
                          isRTL ? "md:flex-row-reverse" : ""
                        }`}
                      >
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <div
                            className={`flex items-center gap-2 mb-1 ${
                              isRTL ? "flex-row-reverse" : ""
                            }`}
                          >
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${getEventBadgeColor(
                                item.event_type
                              )}`}
                            >
                              {item.event_type.replace("_", " ")}
                            </span>
                            <span className="text-xs text-gray-300">•</span>
                            <span
                              className={`text-xs font-medium ${
                                isDark ? "text-gray-400" : "text-gray-400"
                              }`}
                            >
                              {new Date(item.created_at).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(item.created_at).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                          <h4
                            className={`text-base font-black flex items-center gap-2 ${
                              isDark ? "text-white" : "text-gray-900"
                            } ${isRTL ? "flex-row-reverse" : ""}`}
                          >
                            <span className="text-brand-navy">
                              #{item.bus?.bus_number || "N/A"}
                            </span>
                            {item.bus && (
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded border ${
                                  isDark
                                    ? "bg-gray-700 border-gray-600 text-gray-300"
                                    : "bg-gray-50 border-gray-100 text-gray-400"
                                }`}
                              >
                                {item.bus.plate_number}
                              </span>
                            )}
                          </h4>
                        </div>

                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border self-end md:self-start ${
                            isDark
                              ? "bg-gray-700 border-gray-600"
                              : "bg-gray-50 border-gray-100"
                          } ${isRTL ? "flex-row-reverse" : ""}`}
                        >
                          <div className="w-5 h-5 rounded-full bg-brand-yellow flex items-center justify-center text-[10px] font-bold text-brand-navy">
                            {item.admin?.name?.charAt(0) || "S"}
                          </div>
                          <div
                            className={`flex flex-col ${
                              isRTL ? "text-right" : "text-left"
                            }`}
                          >
                            <span className="text-[10px] text-gray-400 font-bold uppercase leading-none">
                              {isRTL ? "بواسطة" : "Performed By"}
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                isDark ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {item.admin?.name ||
                                (isRTL ? "النظام" : "System")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`p-4 rounded-xl border ${
                          isDark
                            ? "bg-gray-700/50 border-gray-600/50"
                            : "bg-gray-50/50 border-gray-100/50"
                        }`}
                      >
                        {getEventMessage(item)}
                      </div>

                      {/* Interaction hint */}
                      <div
                        className={`mt-4 flex opacity-0 group-hover:opacity-100 transition-opacity ${
                          isRTL ? "justify-start" : "justify-end"
                        }`}
                      >
                        <button className="text-[10px] font-bold text-brand-navy hover:underline">
                          {isRTL ? "عرض التفاصيل ←" : "View Details →"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            <Pagination links={history.links} />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
