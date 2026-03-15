import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import ApplicationLogo from "@/Components/ApplicationLogo";

interface Violation {
  id: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
  bus?: { id: number; bus_code: string; bus_number: string };
  field_supervisor?: { id: number; name: string };
}

interface PaginationData {
  data: Violation[];
  current_page: number;
  last_page: number;
  links: { url: string | null; label: string; active: boolean }[];
  total: number;
}

export default function FieldReports({
  violations,
  filters,
}: {
  violations: PaginationData;
  filters: { search?: string; status?: string; type?: string; date?: string };
}) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch] = useState(filters?.search || "");
  const [statusFilter, setStatusFilter] = useState(filters?.status || "");
  const [typeFilter, setTypeFilter] = useState(filters?.type || "");
  const [dateFilter, setDateFilter] = useState(filters?.date || "");

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.get(
      route("admin.field-reports.index"),
      { search, status: statusFilter, type: typeFilter, date: dateFilter },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: isRTL ? "قيد الانتظار" : "Pending",
      resolved: isRTL ? "محلولة" : "Resolved",
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    if (status === "pending") return "bg-brand-yellow/20 text-brand-dark dark:bg-brand-yellow/10 dark:text-brand-yellow";
    if (status === "resolved") return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    return "bg-gray-100 text-brand-navy dark:bg-brand-navy dark:text-gray-300";
  };

  const [printingViolation, setPrintingViolation] = useState<Violation | null>(null);

  const handlePrintSingle = (violation: Violation) => {
      setPrintingViolation(violation);
      setTimeout(() => {
          window.print();
          // Optional: clear after print dialog closes, but browsers block JS so user has to close manually usually or we leave it.
          // Better to provide a "Close Print View" button just in case.
      }, 100);
  };

  const handleClosePrint = () => {
      setPrintingViolation(null);
  };

  return (
    <AuthenticatedLayout
      header={
        <h2
          className={`font-bold text-xl ${
            isDark ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {isRTL ? "سجل المخالفات" : "Violations Log"}
        </h2>
      }
    >
      <Head title={isRTL ? "سجل المخالفات" : "Violations Log"} />

      {/* Individual Violation Print View */}
      {printingViolation && (
        <div className="fixed inset-0 z-[100] bg-gray-100 text-black p-8 print:p-0 print:bg-white print:block hidden dir-rtl overflow-y-auto print:overflow-visible">
          <div className="max-w-4xl mx-auto bg-white border-2 border-brand-dark shadow-2xl print:shadow-none print:border-none p-10 rounded-xl relative my-8 print:my-0">
            {/* Header */}
            <div className="flex justify-between items-center mb-10 pb-6 border-b-4 border-brand-dark print:border-black">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-brand-navy rounded-xl flex items-center justify-center shadow-md print:bg-brand-navy print:shadow-none">
                  <ApplicationLogo className="w-12 h-12" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-brand-navy tracking-tight leading-tight mb-1 print:text-black">مسارات واصل</h1>
                  <p className="text-sm font-bold text-brand tracking-widest uppercase print:text-gray-600">MASARAT WASEL</p>
                </div>
              </div>
              
              <div className="text-left dir-ltr">
                  <p className="text-sm font-bold text-gray-500 mb-1 print:text-black">Date: {new Date().toLocaleDateString('en-GB')}</p>
                  <p className="text-sm font-bold text-gray-500 print:text-black">Ref: VIOL-{printingViolation.id}</p>
              </div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-brand-dark mb-2 print:text-black tracking-wide border-b-2 border-gray-200 inline-block pb-2 px-8">إشعار مخالفة ميدانية</h2>
            </div>
            <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-10 text-lg">
              <div>
                <p className="text-gray-500 font-bold mb-1">
                  تاريخ ووقت الرصد:
                </p>
                <p className="font-bold border-b border-gray-300 pb-1">
                  {new Date(printingViolation.created_at).toLocaleString(
                    "ar-SA"
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-bold mb-1">حالة المخالفة:</p>
                <p className="font-bold border-b border-gray-300 pb-1">
                  {statusLabel(printingViolation.status)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-bold mb-1">
                  رقم الحافلة الطارئ:
                </p>
                <p className="font-bold border-b border-gray-300 pb-1">
                  {printingViolation.bus?.bus_code || "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-bold mb-1">رقم اللوحة:</p>
                <p className="font-bold border-b border-gray-300 pb-1">
                  {printingViolation.bus?.bus_number || "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-bold mb-1">
                  اسم المشرف الميداني:
                </p>
                <p className="font-bold border-b border-gray-300 pb-1">
                  {printingViolation.field_supervisor?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-bold mb-1">تصنيف المخالفة:</p>
                <p className="font-bold border-b border-gray-300 pb-1">
                  {printingViolation.type}
                </p>
              </div>
            </div>

            <div className="mb-12">
              <p className="text-gray-500 font-bold mb-2 text-lg">
                تفاصيل المخالفة المرصودة:
              </p>
              <div className="min-h-[150px] bg-gray-50 border border-gray-300 p-6 rounded-lg text-lg leading-relaxed whitespace-pre-wrap">
                {printingViolation.description}
              </div>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-8 text-center pt-8">
              <div>
                <p className="font-bold text-lg mb-8">اعتماد المشرف الميداني</p>
                <p>الاسم: .......................................</p>
                <p className="mt-4">
                  التوقيع: .......................................
                </p>
              </div>
              <div>
                <p className="font-bold text-lg mb-8">
                  اعتماد مدير الحركة / الإدارة
                </p>
                <p>الاسم: .......................................</p>
                <p className="mt-4">
                  التوقيع: .......................................
                </p>
              </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-400">
              <p>وثيقة رسمية مطبوعة من نظام مسارات واصل</p>
            </div>
          </div>
        </div>
      )}

      {/* Screen view hidden during Individual Print */}
      <div
        className={`py-6 dir-${isRTL ? "rtl" : "ltr"} ${
          printingViolation ? "print:hidden" : "print:py-0"
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
                ? "تصفية السجلات والتصفح السريع"
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
                  {isRTL ? "نوع المخالفة" : "Violation Type"}
                </label>
                <input
                  type="text"
                  placeholder={isRTL ? "النوع..." : "Type..."}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
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
                  {isRTL ? "حالة المخالفة" : "Status"}
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
                  <option value="pending">
                    {isRTL ? "قيد الانتظار" : "Pending"}
                  </option>
                  <option value="resolved">
                    {isRTL ? "محلولة" : "Resolved"}
                  </option>
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
                    setTypeFilter("");
                    setDateFilter("");
                    router.get(route("admin.field-reports.index"));
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

          {/* Close Print Preview Button (Visible only when previewing on screen before print finishes or if user cancels print) */}
          {printingViolation && (
            <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[200] print:hidden">
              <button
                onClick={handleClosePrint}
                className="bg-brand-navy text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:bg-brand dark:border dark:border-gray-700 flex items-center gap-2 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {isRTL ? "إلغاء وضع الطباعة" : "Cancel Print View"}
              </button>
            </div>
          )}

          {/* Content Area */}
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
                    {[
                      isRTL ? "الرقم" : "ID",
                      isRTL ? "التاريخ والوقت" : "Date & Time",
                      isRTL ? "الحافلة" : "Bus",
                      isRTL ? "المشرف الميداني" : "Field Supervisor",
                      isRTL ? "النوع" : "Type",
                      isRTL ? "وصف المخالفة" : "Description",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-6 py-4 text-xs font-black ${
                          isDark ? "text-gray-300" : "text-gray-600"
                        } uppercase tracking-wider print:text-black ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                    <th
                      className={`px-6 py-4 text-xs font-black ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      } uppercase tracking-wider print:text-black ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {isRTL ? "الحالة" : "Status"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-black ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      } uppercase tracking-wider print:hidden text-center`}
                    >
                      {isRTL ? "إجراءات" : "Actions"}
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
                  {violations.data.map((item) => (
                    <tr
                      key={item.id}
                      className={`${
                        isDark ? "hover:bg-gray-750" : "hover:bg-brand-50"
                      } transition-colors duration-150 group print:hover:bg-transparent`}
                    >
                      <td className="px-6 py-4 text-sm font-bold opacity-70 group-hover:text-brand transition-colors">
                        #{item.id}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <div className="font-bold">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs opacity-70">
                          {new Date(item.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-bold text-lg">
                          {item.bus?.bus_code || "—"}
                        </div>
                        {item.bus?.bus_number && (
                          <div className="text-xs opacity-70">
                            {item.bus.bus_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        {item.field_supervisor?.name || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-brand dark:text-brand-light">
                        {item.type}
                      </td>
                      <td className="px-6 py-4 text-sm max-w-sm">
                        <p className="line-clamp-2 print:line-clamp-none">
                          {item.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${statusColor(
                            item.status
                          )} print:bg-transparent print:text-black print:p-0`}
                        >
                          {item.status === "resolved" ? (
                            <svg
                              className="w-3 h-3 print:hidden"
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
                          ) : (
                            <svg
                              className="w-3 h-3 print:hidden"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center print:hidden">
                        <button
                          onClick={() => handlePrintSingle(item)}
                          className="text-brand hover:text-brand-dark transition bg-brand/10 hover:bg-brand/20 p-2 rounded-full inline-flex items-center justify-center"
                          title={isRTL ? "طباعة الإشعار" : "Print Notice"}
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
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Empty States */}
                  {violations.data.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
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

            {/* Pagination - Hidden when printing */}
            {violations.last_page > 1 && (
              <div className="mt-6 mb-6 flex justify-center print:hidden">
                <nav className="inline-flex rounded-xl shadow-sm space-x-1 space-x-reverse h-10 overflow-hidden bg-white dark:bg-gray-800 border dark:border-gray-700 p-1">
                  {violations.links.map((link, j) => (
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

          <div className="hidden print:block text-center mt-8 text-black dir-rtl">
            <p className="font-bold">توقيع مدير الحركة:</p>
            <br />
            <br />
            <p>_________________________________</p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
