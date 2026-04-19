import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import ApplicationLogo from "@/Components/ApplicationLogo";

interface Delay {
  id: number;
  type: 'student' | 'bus';
  duration_minutes: number;
  reason: string;
  notes: string;
  created_at: string;
  student?: { id: number; full_name: string; national_id: string };
  bus?: { id: number; bus_code: string; bus_number: string };
  reporter?: { id: number; name: string };
}

interface PaginationData {
  data: Delay[];
  current_page: number;
  last_page: number;
  links: { url: string | null; label: string; active: boolean }[];
  total: number;
}

export default function DelayLogs({
  delays,
  filters,
}: {
  delays: PaginationData;
  filters: { search?: string; type?: string; date?: string };
}) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [search, setSearch] = useState(filters?.search || "");
  const [typeFilter, setTypeFilter] = useState(filters?.type || "");
  const [dateFilter, setDateFilter] = useState(filters?.date || "");

  const handleFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.get(
      route("admin.delay-logs.index"),
      { search, type: typeFilter, date: dateFilter },
      { preserveState: true, preserveScroll: true }
    );
  };

  const [printingDelay, setPrintingDelay] = useState<Delay | null>(null);

  const handlePrintSingle = (delay: Delay) => {
    setPrintingDelay(delay);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleClosePrint = () => {
    setPrintingDelay(null);
  };

  const typeLabel = (type: string) => {
    if (type === 'student') return isRTL ? "تأخير طالب" : "Student Delay";
    if (type === 'bus') return isRTL ? "تأخير حافلة" : "Bus Delay";
    return type;
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className={`font-bold text-xl ${isDark ? "text-gray-200" : "text-gray-800"}`}>
          {isRTL ? "سجلات التأخير" : "Delay Logs"}
        </h2>
      }
    >
      <Head title={isRTL ? "سجلات التأخير" : "Delay Logs"} />

      {/* Print View */}
      {printingDelay && (
        <div className="fixed inset-0 z-[100] bg-gray-100 text-black p-8 print:p-0 print:bg-white print:block hidden dir-rtl overflow-y-auto print:overflow-visible">
          <div className="max-w-4xl mx-auto bg-white border-2 border-brand-dark shadow-2xl print:shadow-none print:border-none p-10 rounded-xl relative my-8 print:my-0">
            <div className="flex justify-between items-center mb-10 pb-6 border-b-4 border-brand-dark print:border-black">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-brand-navy rounded-xl flex items-center justify-center">
                  <ApplicationLogo className="w-12 h-12" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-brand-navy tracking-tight leading-tight mb-1">مسارات واصل</h1>
                  <p className="text-sm font-bold text-brand uppercase tracking-widest">MASARAT WASEL</p>
                </div>
              </div>
              <div className="text-left dir-ltr">
                <p className="text-sm font-bold text-gray-500">Date: {new Date().toLocaleDateString('en-GB')}</p>
                <p className="text-sm font-bold text-gray-500">Ref: DELAY-{printingDelay.id}</p>
              </div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-black text-brand-dark mb-2 border-b-2 border-gray-200 inline-block pb-2 px-8">إشعار تسجيل تأخير</h2>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-10 text-lg">
              <div>
                <p className="text-gray-500 font-bold mb-1">تاريخ ووقت التسجيل:</p>
                <p className="font-bold border-b border-gray-300 pb-1">{new Date(printingDelay.created_at).toLocaleString("ar-SA")}</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold mb-1">نوع التأخير:</p>
                <p className="font-bold border-b border-gray-300 pb-1">{typeLabel(printingDelay.type)}</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold mb-1">مدة التأخير:</p>
                <p className="font-bold border-b border-gray-300 pb-1">{printingDelay.duration_minutes} دقيقة</p>
              </div>
              <div>
                <p className="text-gray-500 font-bold mb-1">المُبلغ:</p>
                <p className="font-bold border-b border-gray-300 pb-1">{printingDelay.reporter?.name || "—"}</p>
              </div>
              {printingDelay.type === 'student' ? (
                <>
                  <div>
                    <p className="text-gray-500 font-bold mb-1">اسم الطالب:</p>
                    <p className="font-bold border-b border-gray-300 pb-1">{printingDelay.student?.full_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-bold mb-1">رقم الهوية:</p>
                    <p className="font-bold border-b border-gray-300 pb-1">{printingDelay.student?.national_id || "—"}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-gray-500 font-bold mb-1">رقم الحافلة:</p>
                    <p className="font-bold border-b border-gray-300 pb-1">{printingDelay.bus?.bus_code || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-bold mb-1">رقم اللوحة:</p>
                    <p className="font-bold border-b border-gray-300 pb-1">{printingDelay.bus?.bus_number || "—"}</p>
                  </div>
                </>
              )}
            </div>

            <div className="mb-6">
              <p className="text-gray-500 font-bold mb-2 text-lg">سبب التأخير:</p>
              <div className="bg-gray-50 border border-gray-300 p-6 rounded-lg text-lg min-h-[100px]">{printingDelay.reason || "—"}</div>
            </div>

            {printingDelay.notes && (
              <div className="mb-12">
                <p className="text-gray-500 font-bold mb-2 text-lg">ملاحظات إضافية:</p>
                <div className="bg-gray-50 border border-gray-300 p-6 rounded-lg text-lg min-h-[100px]">{printingDelay.notes}</div>
              </div>
            )}

            <div className="mt-16 grid grid-cols-2 gap-8 text-center pt-8">
              <div>
                <p className="font-bold text-lg mb-8">اعتماد المشرف الميداني</p>
                <p>الاسم: .......................................</p>
                <p className="mt-4">التوقيع: .......................................</p>
              </div>
              <div>
                <p className="font-bold text-lg mb-8">اعتماد الإدارة</p>
                <p>الاسم: .......................................</p>
                <p className="mt-4">التوقيع: .......................................</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"} ${printingDelay ? "print:hidden" : ""}`}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Filters */}
          <div className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} shadow-lg sm:rounded-2xl border p-6 overflow-hidden relative`}>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-brand-yellow/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-gray-800"}`}>
              {isRTL ? "تصفية السجلات" : "Filter Records"}
            </h3>
            <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className={`block text-xs font-bold mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  {isRTL ? "بحث" : "Search"}
                </label>
                <input
                  type="text"
                  placeholder={isRTL ? "بحث عن طالب، حافلة..." : "Search student, bus..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-yellow focus:ring-brand-yellow ${isDark ? "bg-gray-700 border-gray-600 text-white" : ""}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  {isRTL ? "النوع" : "Type"}
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-yellow focus:ring-brand-yellow ${isDark ? "bg-gray-700 border-gray-600 text-white" : ""}`}
                >
                  <option value="">{isRTL ? "جميع الأنواع" : "All Types"}</option>
                  <option value="student">{isRTL ? "تأخير طالب" : "Student Delay"}</option>
                  <option value="bus">{isRTL ? "تأخير حافلة" : "Bus Delay"}</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  {isRTL ? "التاريخ" : "Date"}
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className={`w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-yellow focus:ring-brand-yellow ${isDark ? "bg-gray-700 border-gray-600 text-white" : ""}`}
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="bg-brand-navy text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-dark transition-all flex-1"
                >
                  {isRTL ? "بحث" : "Search"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("");
                    setDateFilter("");
                    router.get(route("admin.delay-logs.index"));
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition ${isDark ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-brand-navy hover:bg-gray-200"}`}
                >
                  {isRTL ? "إعادة" : "Reset"}
                </button>
              </div>
            </form>
          </div>

          {/* Table */}
          <div className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} shadow-md sm:rounded-3xl border overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
                <thead className={isDark ? "bg-gray-900/80" : "bg-gray-50/80"}>
                  <tr>
                    {[
                      isRTL ? "الرقم" : "ID",
                      isRTL ? "التاريخ والوقت" : "Date & Time",
                      isRTL ? "النوع" : "Type",
                      isRTL ? "الهدف" : "Target",
                      isRTL ? "المدة (د)" : "Duration (m)",
                      isRTL ? "السبب" : "Reason",
                      isRTL ? "المُبلّغ" : "Reporter",
                    ].map((h, i) => (
                      <th key={i} className={`px-6 py-4 text-xs font-black ${isDark ? "text-gray-300" : "text-gray-600"} uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-xs font-black text-center">{isRTL ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className={`${isDark ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-100"} divide-y`}>
                  {delays.data.map((item) => (
                    <tr key={item.id} className={`${isDark ? "hover:bg-gray-750" : "hover:bg-brand-50"} transition-colors duration-150 group`}>
                      <td className="px-6 py-4 text-sm font-bold opacity-70">#{item.id}</td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <div className="font-bold">{new Date(item.created_at).toLocaleDateString()}</div>
                        <div className="text-xs opacity-60">{new Date(item.created_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.type === 'bus' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                          {typeLabel(item.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.type === 'student' ? (
                          <>
                            <div className="font-bold">{item.student?.full_name || "—"}</div>
                            <div className="text-xs opacity-60">{item.student?.national_id}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-bold text-lg">{item.bus?.bus_code || "—"}</div>
                            <div className="text-xs opacity-60">{item.bus?.bus_number}</div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-brand-yellow">{item.duration_minutes}</td>
                      <td className="px-6 py-4 text-sm max-w-xs">
                        <p className="line-clamp-2" title={item.reason}>{item.reason}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold opacity-80">{item.reporter?.name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-center">
                        <button
                          onClick={() => handlePrintSingle(item)}
                          className="text-brand-yellow hover:text-brand-dark transition bg-brand-yellow/10 hover:bg-brand-yellow/20 p-2 rounded-full inline-flex items-center justify-center"
                          title={isRTL ? "طباعة" : "Print"}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {delays.data.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-lg font-bold">{isRTL ? "لا توجد سجلات تأخير" : "No delay records found"}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {delays.last_page > 1 && (
              <div className="py-6 flex justify-center">
                <nav className="inline-flex rounded-xl shadow-sm space-x-1 space-x-reverse bg-white dark:bg-gray-800 border dark:border-gray-700 p-1">
                  {delays.links.map((link, j) => (
                    <Link
                      key={j}
                      href={link.url || "#"}
                      preserveScroll
                      preserveState
                      className={`inline-flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                        link.active
                          ? "bg-brand-yellow text-brand-dark shadow-md"
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
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
