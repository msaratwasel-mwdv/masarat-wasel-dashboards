import React, { useEffect, useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { useEchoEvent } from "@/hooks/useEcho";
import { useRealtimeToast } from "@/hooks/useRealtimeToast";
import { 
    AlertTriangle, 
    Clock, 
    CheckCircle2, 
    Trash2, 
    MapPin, 
    User, 
    Bus, 
    Info, 
    Activity, 
    History,
    ShieldAlert,
    ExternalLink,
    Camera,
    Users,
    ChevronRight,
    XCircle
} from "lucide-react";
import { 
    DS_pageWrapper, 
    DS_card, 
    DS_pageTitle, 
    DS_statCard, 
    DS_statIcon, 
    DS_statLabel, 
    DS_statValue2, 
    DS_badge,
    DS_btnPrimary,
    DS_btnSecondary,
    DS_btnGold
} from "@/lib/DS";
import ConfirmationModal from "@/Components/ConfirmationModal";
import BaseDataTable from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";

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
  resolver?: { name: string };
}

interface Props {
  activeIncidents: Incident[];
  resolvedIncidents: Incident[];
  auth?: any;
}

export default function EmergencyMonitor({ activeIncidents, resolvedIncidents, auth }: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";
  const { notifyEvent } = useRealtimeToast();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<number | null>(null);

  // Listen for real-time emergency incidents
  useEchoEvent(
    'private',
    'admin.emergencies',
    '.emergency.reported',
    (e: any) => {
      router.reload({ only: ['activeIncidents', 'resolvedIncidents'], preserveState: true } as any);
    }
  );

  const updateStatus = (id: number, status: string) => {
    router.put(route("admin.emergencies.update-status", id), { status }, { preserveScroll: true });
  };

  const handleDelete = () => {
    if (incidentToDelete) {
      router.delete(route("admin.emergencies.destroy", incidentToDelete), {
        onSuccess: () => setIsDeleteModalOpen(false),
      });
    }
  };

  const severityStyles: Record<string, { badge: string; border: string; bg: string }> = {
    critical: { 
        badge: "bg-rose-500 text-white animate-pulse", 
        border: "border-rose-500", 
        bg: "bg-rose-50/30 dark:bg-rose-900/10" 
    },
    high: { 
        badge: "bg-orange-500 text-white", 
        border: "border-orange-500", 
        bg: "bg-orange-50/30 dark:bg-orange-900/10" 
    },
    medium: { 
        badge: "bg-amber-400 text-slate-900", 
        border: "border-amber-400", 
        bg: "bg-amber-50/30 dark:bg-amber-900/10" 
    },
    low: { 
        badge: "bg-blue-400 text-white", 
        border: "border-blue-400", 
        bg: "bg-blue-50/30 dark:bg-blue-900/10" 
    },
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

  const columnHelper = createColumnHelper<Incident>();
  const resolvedColumns = useMemo(() => [
    columnHelper.accessor("id", {
        header: "#",
        cell: (info) => <span className="font-bold text-slate-400">#{info.getValue()}</span>
    }),
    columnHelper.accessor("type", {
        header: isRTL ? "النوع" : "Type",
        cell: (info) => <span className="font-black text-slate-700 dark:text-slate-200">{typeLabels[info.getValue()] || info.getValue()}</span>
    }),
    columnHelper.accessor("bus.bus_number", {
        header: isRTL ? "الحافلة" : "Bus",
        cell: (info) => <span className="font-bold">{info.getValue() || "—"}</span>
    }),
    columnHelper.accessor("updated_at", {
        header: isRTL ? "وقت الإغلاق" : "Resolved At",
        cell: (info) => (
            <div className="flex flex-col text-xs">
                <span className="font-bold text-slate-500">{new Date(info.getValue()!).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>
                <span>{new Date(info.getValue()!).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')}</span>
            </div>
        )
    }),
    columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => (
            <div className="flex justify-end">
                <button
                    onClick={() => {
                        setIncidentToDelete(info.row.original.id);
                        setIsDeleteModalOpen(true);
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        )
    })
  ], [isRTL]);

  return (
    <AuthenticatedLayout user={auth?.user}>
      <Head title={isRTL ? "مركز عمليات الطوارئ" : "Emergency Ops Center"} />

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex flex-col">
                <h1 className={`${DS_pageTitle} flex items-center gap-3`}>
                    <div className="relative flex h-3 w-3">
                        {activeIncidents.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${activeIncidents.length > 0 ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                    </div>
                    {isRTL ? "مركز عمليات الطوارئ الحية" : "Live Emergency Ops Center"}
                </h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                    {isRTL ? "مراقبة لحظية لكافة بلاغات الميدان" : "Real-time monitoring of all field reports"}
                </p>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex items-center gap-3 shadow-sm">
                    <Activity size={18} className="text-emerald-500" />
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                        {isRTL ? "النظام متصل" : "System Connected"}
                    </span>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className={DS_statCard('red')}>
                <div className={DS_statIcon('red')}><ShieldAlert size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "نشط حالياً" : "Active Now"}</p>
                    <p className={DS_statValue2('red')}>{activeIncidents.length}</p>
                </div>
            </div>
            <div className={DS_statCard('yellow')}>
                <div className={DS_statIcon('yellow')}><Clock size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "قيد المعالجة" : "In Progress"}</p>
                    <p className={DS_statValue2('yellow')}>{activeIncidents.filter(i => i.status === 'in_progress').length}</p>
                </div>
            </div>
            <div className={DS_statCard('green')}>
                <div className={DS_statIcon('green')}><CheckCircle2 size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "تم حلها اليوم" : "Resolved Today"}</p>
                    <p className={DS_statValue2('green')}>{resolvedIncidents.length}</p>
                </div>
            </div>
            <div className={DS_statCard('navy')}>
                <div className={DS_statIcon('navy')}><History size={20} /></div>
                <div>
                    <p className={DS_statLabel}>{isRTL ? "معدل الاستجابة" : "Avg Response"}</p>
                    <p className={DS_statValue2('navy')}>12m</p>
                </div>
            </div>
        </div>

        {/* Active Incidents Section */}
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-6 bg-rose-500 rounded-full" />
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
                    {isRTL ? "البلاغات النشطة" : "Active Incidents"}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeIncidents.map((incident) => (
                    <div key={incident.id} className={`group relative flex flex-col border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 border-t-8 ${severityStyles[incident.severity]?.border || 'border-slate-200'}`}>
                        
                        {/* Status Overlay for Critical */}
                        {incident.severity === 'critical' && (
                            <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse z-10" />
                        )}

                        <div className="p-6 flex-1">
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${severityStyles[incident.severity]?.badge || 'bg-slate-100'}`}>
                                    {incident.severity}
                                </span>
                                <div className="flex items-center gap-1.5 text-slate-400">
                                    <Clock size={12} />
                                    <span className="text-[10px] font-bold">
                                        {new Date(incident.created_at).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4">
                                {typeLabels[incident.type] || incident.type}
                            </h3>

                            {/* Info Grid */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <Bus size={16} className="text-brand-navy" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? "رقم الحافلة" : "Bus Number"}</span>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{incident.bus?.bus_number} ({incident.bus?.bus_code})</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <User size={16} className="text-brand-navy" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isRTL ? "المُبلغ" : "Reporter"}</span>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{incident.reporter?.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className={`p-4 rounded-2xl mb-6 border ${severityStyles[incident.severity]?.bg || 'bg-slate-50 border-slate-100 dark:bg-slate-900 dark:border-slate-800'}`}>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                                    {incident.description}
                                </p>
                            </div>

                            {/* Media & Students (Collapsible/Conditional) */}
                            <div className="flex items-center gap-3">
                                {incident.photo_urls && incident.photo_urls.length > 0 && (
                                    <div className="flex -space-x-2 rtl:space-x-reverse">
                                        {incident.photo_urls.map((url, i) => (
                                            <a key={i} href={url} target="_blank" className="w-8 h-8 rounded-lg border-2 border-white dark:border-slate-800 bg-slate-200 flex items-center justify-center overflow-hidden hover:scale-110 transition-transform shadow-sm">
                                                <Camera size={14} className="text-slate-600" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                                {incident.student_names && incident.student_names.length > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500">
                                        <Users size={12} />
                                        <span className="text-[10px] font-black">{incident.student_names.length}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                             <button
                                onClick={() => updateStatus(incident.id, 'in_progress')}
                                disabled={incident.status === 'in_progress'}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                                    incident.status === 'in_progress'
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:text-amber-500'
                                }`}
                             >
                                <Clock size={14} />
                                {isRTL ? "قيد المعالجة" : "Progress"}
                             </button>
                             <button
                                onClick={() => updateStatus(incident.id, 'resolved')}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
                             >
                                <CheckCircle2 size={14} />
                                {isRTL ? "تم الحل" : "Resolve"}
                             </button>
                             {incident.location_lat && (
                                <a 
                                    href={`https://maps.google.com/?q=${incident.location_lat},${incident.location_lng}`} 
                                    target="_blank"
                                    className="p-2.5 bg-brand-navy text-white rounded-xl shadow-lg shadow-brand-navy/20 hover:bg-brand-navy/90 transition-all"
                                >
                                    <MapPin size={18} />
                                </a>
                             )}
                        </div>

                        {/* Delete Button (Hover Only) */}
                        <button 
                            onClick={() => {
                                setIncidentToDelete(incident.id);
                                setIsDeleteModalOpen(true);
                            }}
                            className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}

                {activeIncidents.length === 0 && (
                    <div className="col-span-full py-20 bg-emerald-50/30 dark:bg-emerald-900/10 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-[40px] flex flex-col items-center justify-center">
                        <div className="p-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full mb-4">
                            <CheckCircle2 size={48} />
                        </div>
                        <h3 className="text-xl font-black text-emerald-800 dark:text-emerald-400">
                            {isRTL ? "المنطقة آمنة - لا توجد بلاغات نشطة" : "Area Secured - No Active Incidents"}
                        </h3>
                    </div>
                )}
            </div>
        </div>

        {/* Resolved History */}
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-6 bg-slate-200 rounded-full" />
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
                    {isRTL ? "أحدث البلاغات المحلولة (24 ساعة)" : "Recently Resolved (24h)"}
                </h2>
            </div>

            <div className={DS_card}>
                <BaseDataTable<Incident>
                    columns={resolvedColumns}
                    data={resolvedIncidents}
                    title={isRTL ? "سجل الطوارئ المؤرشف" : "Archived Emergency Log"}
                    subtitle={isRTL ? "آخر البلاغات التي تم إغلاقها بنجاح" : "Latest reports that have been successfully closed"}
                />
            </div>
        </div>

        {/* Delete Confirmation */}
        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDelete}
            title={isRTL ? "حذف بلاغ الطوارئ" : "Delete Emergency Report"}
            message={isRTL ? "هل أنت متأكد من رغبتك في حذف هذا البلاغ؟ سيتم مسحه نهائياً من السجلات." : "Are you sure you want to delete this report? It will be permanently removed from the logs."}
            confirmText={isRTL ? "حذف" : "Delete"}
            cancelText={isRTL ? "إلغاء" : "Cancel"}
            type="danger"
        />

      </div>
    </AuthenticatedLayout>
  );
}
