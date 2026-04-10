import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import ApplicationLogo from "@/Components/ApplicationLogo";

interface InspectionResult {
  id: number;
  is_passed: boolean;
  notes: string | null;
  item: {
    id: number;
    name: string;
  };
}

interface Inspection {
  id: number;
  field_supervisor_id: number;
  bus_id: number;
  overall_status: string;
  notes: string | null;
  created_at: string;
  field_supervisor: {
    id: number;
    name: string;
  };
  bus: {
    id: number;
    bus_number: string;
  };
  results: InspectionResult[];
}

interface PaginationData {
  data: Inspection[];
  current_page: number;
  last_page: number;
  links: { url: string | null; label: string; active: boolean }[];
  total: number;
}

export default function InspectionLogs({
  inspections,
  filters,
}: {
  inspections: PaginationData;
  filters: { search?: string; status?: string; date?: string };
}) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch] = useState(filters.search || "");
  const [statusFilter, setStatusFilter] = useState(filters.status || "");
  const [dateFilter, setDateFilter] = useState(filters.date || "");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.get(
      route("admin.inspection-logs.index"),
      { search, status: statusFilter, date: dateFilter },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const statusColors: Record<string, string> = {
    pass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    fail: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    warning: "bg-brand-yellow/20 text-brand-dark dark:bg-brand-yellow/10 dark:text-brand-yellow",
  };

  const statusLabels: Record<string, string> = {
    pass: isRTL ? "اجتياز" : "Pass",
    fail: isRTL ? "فشل" : "Fail",
    warning: isRTL ? "تحذير" : "Warning",
  };

  const openDetails = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setIsDetailsModalOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedInspection(null);
  };

  const handlePrintSingle = () => {
      // Small timeout to ensure modal is rendered and ready for print styles if any
      setTimeout(() => {
          window.print();
      }, 100);
  };

  return (
    <AuthenticatedLayout
      header={
        <h2
          className={`font-bold text-xl ${
            isDark ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {isRTL ? "سجلات الفحص الميداني" : "Inspection Logs"}
        </h2>
      }
    >
      <Head title={isRTL ? "سجلات الفحص الميداني" : "Inspection Logs"} />

      {/* Main Content (Hidden when printing a specific modal) */}
      <div
        className={`py-6 dir-${isRTL ? "rtl" : "ltr"} ${
          isDetailsModalOpen ? "print:hidden" : "print:py-0"
        }`}
      >
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Filters - Hidden when printing */}
          <div
            className={`print:hidden ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } shadow-lg sm:rounded-2xl border p-6 overflow-hidden relative`}
          >
            {/* Decorative Background Element */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-brand/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>

            <h3
              className={`text-lg font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              {isRTL
                ? "تصفية السجلات للبحث السريع"
                : "Filter Records & Quick Browse"}
            </h3>

            <form
              onSubmit={handleFilter}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4"
            >
              <div className="md:col-span-2">
                <label
                  className={`block text-xs font-bold mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {isRTL ? "بحث (حافلة أو مشرف)" : "Search (Bus or Supervisor)"}
                </label>
                <input
                  type="text"
                  placeholder={
                    isRTL
                      ? "بحث برقم الحافلة الطارئ أو اسم المشرف..."
                      : "Search bus code/number or supervisor..."
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full rounded-xl border-gray-300 shadow-sm focus:border-brand focus:ring-brand ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : ""
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-bold mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {isRTL ? "النتيجة النهائية" : "Overall Status"}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full rounded-xl border-gray-300 shadow-sm focus:border-brand focus:ring-brand ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : ""
                  }`}
                >
                  <option value="">
                    {isRTL ? "جميع الحالات" : "All Statuses"}
                  </option>
                  <option value="pass">{isRTL ? "اجتياز" : "Pass"}</option>
                  <option value="fail">{isRTL ? "رسوب / فشل" : "Fail"}</option>
                  <option value="warning">{isRTL ? "تحذير" : "Warning"}</option>
                </select>
              </div>

              <div className="flex items-end space-x-2 rtl:space-x-reverse h-full">
                <div className="flex-1">
                  <label
                    className={`block text-xs font-bold mb-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {isRTL ? "تاريخ محدد" : "Specific Date"}
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className={`w-full rounded-xl border-gray-300 shadow-sm focus:border-brand focus:ring-brand ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "text-gray-700"
                    }`}
                  />
                </div>
              </div>

              <div className="md:col-span-5 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setDateFilter("");
                    router.get(route("admin.inspection-logs.index"));
                  }}
                  className={`px-6 py-2 rounded-xl font-bold transition hover:bg-gray-200 dark:hover:bg-brand-navy ${
                    isDark
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-brand-navy"
                  }`}
                >
                  {isRTL ? "إعادة ضبط" : "Reset"}
                </button>
                <button
                  type="submit"
                  className="bg-brand-navy text-white px-8 py-2 rounded-xl font-bold hover:bg-brand-dark hover:shadow-lg hover:-translate-y-0.5 transition-all transform"
                >
                  {isRTL ? "بحث وتصفية" : "Search & Filter"}
                </button>
              </div>
            </form>
          </div>

          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } shadow-md sm:rounded-3xl border overflow-hidden print:shadow-none print:border-none`}
          >
            <div className="overflow-x-auto print:overflow-visible">
              <table
                className={`min-w-full divide-y print:divide-gray-400 print:text-black ${
                  isDark ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                <thead
                  className={`${
                    isDark ? "bg-gray-900/80" : "bg-gray-50/80"
                  } backdrop-blur-sm print:bg-gray-200`}
                >
                  <tr>
                    <th
                      className={`px-6 py-4 text-xs font-black ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      } uppercase print:text-black ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      ID
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-black ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      } uppercase print:text-black ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {isRTL ? "التاريخ والوقت" : "Date & Time"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-black ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      } uppercase print:text-black ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {isRTL ? "الحافلة" : "Bus"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-black ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      } uppercase print:text-black ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {isRTL ? "المشرف الميداني" : "Field Supervisor"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-black ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      } uppercase print:text-black text-center`}
                    >
                      {isRTL ? "النتيجة" : "Status"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-black ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      } uppercase print:hidden text-center`}
                    >
                      {isRTL ? "التفاصيل" : "Details"}
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`${
                    isDark
                      ? "bg-gray-800 divide-gray-700"
                      : "bg-white divide-gray-100"
                  } divide-y print:divide-gray-300 print:bg-white`}
                >
                  {inspections.data.map((insp) => (
                    <tr
                      key={insp.id}
                      className={`${
                        isDark ? "hover:bg-gray-750" : "hover:bg-brand-50"
                      } transition-colors duration-150 group print:hover:bg-transparent`}
                    >
                      <td className="px-6 py-4 text-sm font-bold opacity-70 group-hover:text-brand transition-colors">
                        #{insp.id}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <div className="font-bold">
                          {new Date(insp.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs opacity-70">
                          {new Date(insp.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-bold text-lg">
                          {insp.bus?.bus_number || "—"}
                        </div>
                        {insp.bus?.bus_number && (
                          <div className="text-xs opacity-70">
                            {insp.bus.bus_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        {insp.field_supervisor?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-block border print:border-none print:p-0 ${
                            statusColors[insp.overall_status]
                              ? statusColors[insp.overall_status].split(
                                  " "
                                )[0] +
                                " " +
                                statusColors[insp.overall_status].split(" ")[1]
                              : "bg-gray-100 text-gray-800"
                          } dark:bg-transparent dark:border-current`}
                        >
                          {statusLabels[insp.overall_status] ||
                            insp.overall_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center print:hidden">
                        <button
                          onClick={() => openDetails(insp)}
                          className="bg-brand/10 text-brand hover:bg-brand hover:text-white px-3 py-1.5 rounded-lg font-bold transition"
                        >
                          {isRTL ? "عرض النتيجة" : "View Results"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {inspections.data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                          <svg
                            className="w-16 h-16 mb-4 opacity-50"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="text-lg font-bold">
                            {isRTL
                              ? "لا يوجد بيانات توافق بحثك"
                              : "No data matching your search"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {inspections.last_page > 1 && (
              <div className="mt-6 mb-6 flex justify-center print:hidden">
                <nav className="inline-flex rounded-xl shadow-sm space-x-1 space-x-reverse h-10 overflow-hidden bg-white dark:bg-gray-800 border dark:border-gray-700 p-1">
                  {inspections.links.map((link, j) => (
                    <Link
                      key={j}
                      href={link.url || "#"}
                      preserveScroll
                      preserveState
                      className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                        link.active
                          ? "bg-brand text-white shadow-md"
                          : isDark
                          ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      } ${!link.url && "opacity-30 cursor-not-allowed hidden"}`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </nav>
              </div>
            )}
          </div>

          {!isDetailsModalOpen && (
            <div className="hidden print:block text-center mt-8 text-black dir-rtl">
              <p className="font-bold">توقيع المفتش المختص:</p>
              <br />
              <br />
              <p>_________________________________</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal / Individual Print View */}
      {isDetailsModalOpen && selectedInspection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:block">
          <div
            className={`${
              isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            } rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none print:text-black dir-rtl print:overflow-visible`}
          >
            {/* Modal Header (Screen Only) */}
            <div
              className={`px-6 py-5 border-b ${
                isDark
                  ? "border-gray-700 bg-gray-900/50"
                  : "border-gray-100 bg-gray-50"
              } flex justify-between items-center print:hidden`}
            >
              <h3 className="text-xl font-black text-brand">
                {isRTL
                  ? `تفاصيل الفحص #${selectedInspection.id}`
                  : `Inspection Details #${selectedInspection.id}`}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintSingle}
                  className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl font-bold hover:bg-brand-dark transition shadow-sm"
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
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  {isRTL ? "طباعة" : "Print"}
                </button>
                <button
                  onClick={closeDetails}
                  className={`p-2 rounded-full transition-colors ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block mb-10 pb-6 border-b-4 border-brand-dark print:border-black mt-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-brand-navy rounded-xl flex items-center justify-center shadow-md print:bg-brand-navy print:shadow-none">
                    <ApplicationLogo className="w-12 h-12" />
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-black text-brand-navy tracking-tight leading-tight mb-1 print:text-black">مسارات واصل</h1>
                    <p className="text-sm font-bold text-brand tracking-widest uppercase print:text-gray-600">MASARAT WASEL</p>
                  </div>
                </div>
                
                <div className="text-left dir-ltr">
                    <p className="text-sm font-bold text-gray-500 mb-1 print:text-black">Date: {new Date().toLocaleDateString('en-GB')}</p>
                    <p className="text-sm font-bold text-gray-500 print:text-black">Ref: INSP-{selectedInspection.id}</p>
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-3xl font-black text-brand-dark mb-2 print:text-black tracking-wide border-b-2 border-gray-200 inline-block pb-2 px-8">تقرير فحص حافلة ميداني</h2>
              </div>
            </div>

            <div
              className={`p-6 overflow-y-auto print:overflow-visible dir-${
                isRTL ? "rtl" : "ltr"
              } bg-gray-50/50 dark:bg-transparent print:bg-white`}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div
                  className={`p-4 rounded-2xl border print:col-span-1 print:border-gray-300 ${
                    isDark
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-white border-gray-100 shadow-sm"
                  }`}
                >
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1 print:text-black">
                    الحافلة
                  </p>
                  <p className="font-black text-lg print:text-black">
                    {selectedInspection.bus?.bus_number}
                  </p>
                  {selectedInspection.bus?.bus_number && (
                    <p className="text-sm opacity-70 print:text-black">
                      {selectedInspection.bus?.bus_number}
                    </p>
                  )}
                </div>
                <div
                  className={`p-4 rounded-2xl border print:col-span-1 print:border-gray-300 ${
                    isDark
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-white border-gray-100 shadow-sm"
                  }`}
                >
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1 print:text-black">
                    المشرف الميداني
                  </p>
                  <p className="font-black text-lg print:text-black">
                    {selectedInspection.field_supervisor?.name}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-2xl border print:col-span-1 print:border-gray-300 ${
                    isDark
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-white border-gray-100 shadow-sm"
                  }`}
                >
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1 print:text-black">
                    تاريخ الفحص
                  </p>
                  <p className="font-black print:text-black">
                    {new Date(selectedInspection.created_at).toLocaleDateString(
                      "ar-SA"
                    )}
                  </p>
                  <p className="text-sm opacity-70 print:text-black">
                    {new Date(selectedInspection.created_at).toLocaleTimeString(
                      "ar-SA"
                    )}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-2xl border print:col-span-1 print:border-gray-300 flex flex-col justify-center ${
                    isDark
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-brand/5 border-brand/20 shadow-sm"
                  } print:bg-transparent`}
                >
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1 print:text-black text-center">
                    النتيجة النهائية
                  </p>
                  <div className="flex justify-center mt-1">
                    <span
                      className={`px-4 py-1.5 rounded-full text-base font-black border print:border-2 print:border-black print:text-black print:bg-transparent ${
                        statusColors[selectedInspection.overall_status]
                          ? statusColors[
                              selectedInspection.overall_status
                            ].split(" ")[0] +
                            " " +
                            statusColors[
                              selectedInspection.overall_status
                            ].split(" ")[1]
                          : "bg-gray-100 text-brand-navy"
                      }`}
                    >
                      {statusLabels[selectedInspection.overall_status] ||
                        selectedInspection.overall_status}
                    </span>
                  </div>
                </div>
              </div>

              {selectedInspection.notes && (
                <div
                  className={`mb-8 p-5 rounded-2xl border-l-4 border-l-brand ${
                    isDark
                      ? "bg-gray-800/80 border-gray-700"
                      : "bg-white shadow-sm border-gray-100"
                  } text-sm relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <svg
                      className="w-16 h-16"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                  <strong className="text-brand dark:text-brand-light block mb-2">
                    {isRTL ? "ملاحظات وتوجيهات:" : "General Notes:"}
                  </strong>
                  <p className="whitespace-pre-wrap leading-relaxed relative z-10 font-medium">
                    {selectedInspection.notes}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mb-4 border-b pb-2 dark:border-gray-700">
                <h4 className="font-black text-lg">
                  {isRTL ? "نتائج بنود الشيك لست" : "Checklist Item Results"}
                </h4>
                <span
                  className={`px-4 py-1.5 rounded-full text-sm font-black border uppercase tracking-wider ${
                    statusColors[selectedInspection.overall_status]
                      ? statusColors[selectedInspection.overall_status].split(
                          " "
                        )[0] +
                        " " +
                        statusColors[selectedInspection.overall_status].split(
                          " "
                        )[1]
                      : "bg-gray-100 text-gray-800"
                  } dark:bg-transparent dark:border-current`}
                >
                  {isRTL ? "النتيجة: " : "Status: "}{" "}
                  {statusLabels[selectedInspection.overall_status] ||
                    selectedInspection.overall_status}
                </span>
              </div>

              <div className="space-y-3 print:space-y-4">
                {selectedInspection.results.map((result) => (
                  <div
                    key={result.id}
                    className={`flex items-start justify-between p-4 border rounded-2xl ${
                      isDark
                        ? "border-gray-700 bg-gray-800/30 hover:bg-gray-800"
                        : "border-gray-100 bg-white hover:shadow-md"
                    } transition-all print:border-gray-300 print:bg-white print:rounded-none`}
                  >
                    <div className="flex-1 pr-4">
                      <h5 className="font-bold text-md print:text-black">
                        {result.item.name}
                      </h5>
                      {result.notes && (
                        <div
                          className={`mt-2 text-sm p-3 rounded-xl border-l-2 ${
                            isDark
                              ? "bg-gray-900 border-gray-600 text-gray-400"
                              : "bg-gray-50 border-gray-300 text-gray-600"
                          } print:bg-gray-50 print:border-gray-400 print:text-black`}
                        >
                          <span className="font-bold block mb-1">
                            ملاحظة البند:
                          </span>
                          {result.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 pt-1">
                      {result.is_passed ? (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 flex items-center justify-center mb-1 print:bg-transparent print:border print:border-green-600 print:text-green-700">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 print:text-green-700">
                            اجتياز
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 flex items-center justify-center mb-1 print:bg-transparent print:border print:border-red-600 print:text-red-700">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-red-600 dark:text-red-400 print:text-red-700">
                            فشل
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {selectedInspection.results.length === 0 && (
                  <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-2xl dark:border-gray-700 print:border-gray-300 print:text-black">
                    لا توجد تفاصيل (بنود) مسجلة لهذا الفحص.
                  </div>
                )}
              </div>

              {/* Print Only Footer inside modal view */}
              <div className="hidden print:grid print:grid-cols-2 mt-16 text-center gap-8 pb-10">
                <div>
                  <p className="font-bold text-lg mb-8 text-black">
                    اعتماد المشرف الميداني
                  </p>
                  <p className="text-black">
                    الاسم: .......................................
                  </p>
                  <p className="mt-4 text-black">
                    التوقيع: .......................................
                  </p>
                </div>
                <div>
                  <p className="font-bold text-lg mb-8 text-black">
                    اعتماد مدير الحركة / الإدارة
                  </p>
                  <p className="text-black">
                    الاسم: .......................................
                  </p>
                  <p className="mt-4 text-black">
                    التوقيع: .......................................
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-4 border-t ${
                isDark
                  ? "border-gray-700 bg-gray-900/50"
                  : "border-gray-100 bg-gray-50"
              } text-center flex justify-center print:hidden`}
            >
              <button
                onClick={closeDetails}
                className="px-8 py-2.5 rounded-xl font-bold transition-all bg-gray-200 hover:bg-gray-300 text-brand-navy shadow-sm"
              >
                {isRTL ? "إغلاق التفاصيل" : "Close Details"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
