import React, { useEffect, useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";

interface Incident {
  id: number;
  reporter?: { name: string; role: string };
  bus?: { bus_code: string; bus_number: string; driver?: { name: string } };
  type: string;
  severity: string;
  description: string;
  photo_urls?: string[];
  student_names?: string[];
  location_lat: number | null;
  location_lng: number | null;
  status: string;
  created_at: string;
  updated_at?: string;
}

export default function EmergencyMonitor({
  activeIncidents,
  resolvedIncidents,
}: {
  activeIncidents: Incident[];
  resolvedIncidents: Incident[];
}) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  // Polling every 10 seconds to keep dashboard live
  useEffect(() => {
    const interval = setInterval(() => {
      router.reload({ only: ['activeIncidents', 'resolvedIncidents'], preserveState: true } as any);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = (id: number, status: string) => {
    router.put(route("admin.emergencies.update-status", id), { status }, { preserveScroll: true });
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-600 text-white animate-pulse",
    high: "bg-orange-500 text-white",
    medium: "bg-yellow-400 text-gray-900",
    low: "bg-blue-400 text-white",
  };

  const typeLabels: Record<string, string> = {
    sos: isRTL ? "استغاثة (SOS)" : "SOS",
    accident: isRTL ? "حادث" : "Accident",
    breakdown: isRTL ? "عطل فني" : "Breakdown",
    health: isRTL ? "حالة صحية" : "Health Issue",
    behavioral: isRTL ? "بلاغ سلوكي" : "Behavioral",
    technical: isRTL ? "بلاغ تقني" : "Technical",
    traffic: isRTL ? "حادث مروري" : "Traffic Accident",
  };

  return (
    <AuthenticatedLayout
      header={<h2 className={`font-bold text-xl ${isDark ? "text-gray-200" : "text-gray-800"}`}>{isRTL ? "مراقبة الطوارئ" : "Emergency Monitor"}</h2>}
    >
      <Head title={isRTL ? "مراقبة الطوارئ" : "Emergency Monitor"} />

      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-between items-center text-right">
            <div>
              <h1 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? "text-white" : "text-brand-dark"}`}>
                <span className="relative flex h-4 w-4">
                  {activeIncidents.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-4 w-4 ${activeIncidents.length > 0 ? "bg-red-500" : "bg-green-500"}`}></span>
                </span>
                {isRTL ? "غرفة عمليات الطوارئ الحية" : "Live Emergency Operations Center"}
              </h1>
              <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {isRTL ? "يتم تحديث هذه الصفحة تلقائياً كل 10 ثوانٍ" : "Auto-updates every 10 seconds"}
              </p>
            </div>
          </div>

          {/* Active Incidents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeIncidents.map((incident) => (
              <div key={incident.id} className={`border-l-4 ${incident.severity === 'critical' ? 'border-red-600 shadow-red-900/20' : 'border-orange-500'} ${isDark ? "bg-gray-800" : "bg-white"} overflow-hidden shadow-lg sm:rounded-2xl p-5 flex flex-col justify-between relative`}>
                
                {incident.severity === 'critical' && (
                   <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${severityColors[incident.severity]}`}>
                      {incident.severity}
                    </span>
                    <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {new Date(incident.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {typeLabels[incident.type] || incident.type}
                  </h3>

                  <div className={`space-y-2 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                    <p><strong>{isRTL ? "الحافلة:" : "Bus:"}</strong> {incident.bus?.bus_code} ({incident.bus?.bus_number})</p>
                    <p><strong>{isRTL ? "المبلغ:" : "Reporter:"}</strong> {incident.reporter?.name} - {incident.reporter?.role}</p>
                    <p className="line-clamp-3 mt-2"><strong>{isRTL ? "التفاصيل:" : "Details:"}</strong><br/>{incident.description}</p>
                    
                    {incident.photo_urls && incident.photo_urls.length > 0 && (
                      <div className="mt-3">
                        <a href={incident.photo_urls[0]} target="_blank" rel="noreferrer">
                          <img 
                             src={incident.photo_urls[0]} 
                             alt="Incident details" 
                             className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700 hover:opacity-90 transition"
                          />
                        </a>
                      </div>
                    )}

                    {incident.student_names && incident.student_names.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="p-1 px-2 rounded-lg bg-brand/10 text-brand text-xs font-bold flex items-center gap-1">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                             {isRTL ? "الطلاب المعنيين" : "Involved Students"} ({incident.student_names.length})
                          </span>
                        </div>
                        <ul className={`text-xs space-y-1 p-2 rounded-xl ${isDark ? "bg-gray-900/50" : "bg-gray-50 opacity-90"}`}>
                           {incident.student_names.map((name, idx) => (
                             <li key={idx} className="flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                               {name}
                             </li>
                           ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button
                    onClick={() => updateStatus(incident.id, 'in_progress')}
                    disabled={incident.status === 'in_progress'}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition ${
                      incident.status === 'in_progress'
                        ? "bg-yellow-100 text-yellow-800 cursor-not-allowed dark:bg-yellow-900/30 dark:text-yellow-500"
                        : "bg-gray-100 text-gray-700 hover:bg-yellow-100 hover:text-yellow-800 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-yellow-900/50"
                    }`}
                  >
                    {isRTL ? "قيد المعالجة" : "In Progress"}
                  </button>
                  <button
                    onClick={() => updateStatus(incident.id, 'resolved')}
                    className="flex-1 py-2 text-sm font-bold rounded-xl bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition"
                  >
                    {isRTL ? "تم الحل / إغلاق" : "Mark Resolved"}
                  </button>
                </div>
                
                {incident.location_lat && (
                   <div className="mt-3 text-center">
                     <a href={`https://maps.google.com/?q=${incident.location_lat},${incident.location_lng}`} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">
                       {isRTL ? "📍 عرض الموقع على الخريطة" : "📍 View Location on Map"}
                     </a>
                   </div>
                )}
              </div>
            ))}

            {activeIncidents.length === 0 && (
              <div className={`col-span-full py-16 text-center ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} rounded-2xl border border-dashed`}>
                <div className="text-green-500 mb-3 block">
                  <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  {isRTL ? "لا توجد بلاغات طوارئ نشطة حالياً" : "No active emergencies at the moment"}
                </h3>
              </div>
            )}
          </div>

          {/* Resolved Incidents Table */}
          {resolvedIncidents.length > 0 && (
            <div className="mt-12">
              <h2 className={`text-lg font-bold mb-4 ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                {isRTL ? "أحدث البلاغات المغلقة (خلال 24 ساعة)" : "Recently Resolved (Last 24h)"}
              </h2>
              <div className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} overflow-hidden shadow-sm sm:rounded-2xl border p-4`}>
                <div className="overflow-x-auto">
                  <table className={`min-w-full divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}>
                    <thead className={isDark ? "bg-gray-900/50" : "bg-gray-50"}>
                      <tr>
                        <th className={`px-4 py-3 text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "النوع" : "Type"}</th>
                        <th className={`px-4 py-3 text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الحافلة" : "Bus"}</th>
                        <th className={`px-4 py-3 text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "الوصف" : "Details"}</th>
                        <th className={`px-4 py-3 text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-500"} uppercase ${isRTL ? "text-right" : "text-left"}`}>{isRTL ? "وقت الإغلاق" : "Resolved At"}</th>
                      </tr>
                    </thead>
                    <tbody className={`${isDark ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`}>
                      {resolvedIncidents.map((incident) => (
                        <tr key={incident.id} className={isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}>
                          <td className="px-4 py-3 text-sm font-medium">{typeLabels[incident.type] || incident.type}</td>
                          <td className="px-4 py-3 text-sm">{incident.bus?.bus_code}</td>
                          <td className="px-4 py-3 text-sm truncate max-w-xs">{incident.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{incident.updated_at ? new Date(incident.updated_at).toLocaleString() : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
