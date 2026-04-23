import { Head, router } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import { useState } from 'react';
import { 
    Inbox, Search, AlertTriangle, FileText, Calendar, 
    User as UserIcon, Bus, ImageIcon, CheckCircle2,
    ShieldAlert, Clock, X, Filter
} from 'lucide-react';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    status: string;
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    created_at: string;
    sender_id: number;
    incident?: any;
}

interface Props {
    notifications: {
        data: Notification[];
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: { total: number; unread: number; incidents: number; };
    auth: any;
}

export default function Received({ notifications, stats, auth }: Props) {
    const { t, lang } = useTranslation();
    const isRtl = lang === 'ar';
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const filteredNotifications = notifications.data.filter(notif => {
        const matchesType = filterType === 'all' || notif.type === filterType;
        const matchesSearch =
            notif.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notif.message?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    // Theme: Academic Navy & Gold/Amber
    return (
        <SchoolAuthenticatedLayout user={auth.user}>
            <Head title={t('Received Notifications')} />

            <div className="max-w-7xl mx-auto pb-12">
                
                {/* 
                  1. THE BENTO GRID HERO SECTION
                */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 mb-8">
                    
                    {/* Primary Hero Box */}
                    <div className="md:col-span-8 bg-[#0B1527] dark:bg-[#070D18] rounded-[32px] p-8 md:p-12 relative overflow-hidden flex flex-col justify-between border border-[#1E2D4A] shadow-2xl">
                        {/* Decorative Academic Motif */}
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-sm font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
                                <Inbox className="w-4 h-4" />
                                {t('The Logbook')}
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4 font-serif">
                                {t('Received Notifications')}
                            </h1>
                            <p className="text-lg text-slate-400 max-w-xl font-medium leading-relaxed">
                                {t('Review official incoming dispatches, monitor safety incident reports, and manage critical alerts.')}
                            </p>
                        </div>
                    </div>

                    {/* Stats Bento Boxes */}
                    <div className="md:col-span-4 grid grid-rows-2 gap-4 md:gap-6">
                        <div className="bg-white dark:bg-[#111827] rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-3">
                                <Inbox className="w-5 h-5" />
                                <h3 className="font-bold uppercase tracking-wider text-sm">{t('Total Received')}</h3>
                            </div>
                            <p className="text-5xl font-black text-[#0B1527] dark:text-white">{stats.total}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-[32px] p-6 border border-rose-100 dark:border-rose-900/30 flex flex-col justify-center">
                                <h3 className="font-bold text-rose-600/70 dark:text-rose-500/70 uppercase tracking-wider text-xs mb-2">{t('Incidents')}</h3>
                                <p className="text-3xl font-black text-rose-700 dark:text-rose-400">{stats.incidents}</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-[32px] p-6 border border-amber-100 dark:border-amber-900/30 flex flex-col justify-center">
                                <h3 className="font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-wider text-xs mb-2">{t('Unread')}</h3>
                                <p className="text-3xl font-black text-amber-700 dark:text-amber-400">{stats.unread}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 
                  2. THE FILTER BAR
                */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 border-b border-slate-200 dark:border-slate-800 pb-6">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                        <Filter className="w-5 h-5 text-slate-400 mr-2 rtl:ml-2 rtl:mr-0 shrink-0" />
                        {['all', 'incident', 'general'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                                    filterType === type 
                                    ? 'bg-[#0B1527] text-white dark:bg-white dark:text-[#0B1527] shadow-md' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-800'
                                }`}
                            >
                                {t(type === 'all' ? 'All' : type)}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80 group">
                        <Search className={`w-5 h-5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'} group-focus-within:text-[#0B1527] dark:group-focus-within:text-white transition-colors`} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('Search notifications...')}
                            className={`w-full py-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-[#0B1527] dark:focus:ring-white transition-all font-medium shadow-sm ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                        />
                    </div>
                </div>

                {/* 
                  3. THE TIMELINE LOGBOOK
                */}
                <div className="relative max-w-4xl mx-auto pl-4 sm:pl-8 rtl:pl-0 rtl:pr-4 rtl:sm:pr-8">
                    {/* The Timeline Line */}
                    <div className="absolute top-0 bottom-0 left-8 sm:left-12 rtl:left-auto rtl:right-8 rtl:sm:right-12 w-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>

                    <div className="space-y-12">
                        {filteredNotifications.map((notification, index) => {
                            const isIncident = notification.type === 'incident';
                            
                            return (
                                <div key={notification.id} className="relative z-10 flex flex-col sm:flex-row items-start gap-6 sm:gap-8 group">
                                    
                                    {/* Timeline Node & Timestamp */}
                                    <div className="flex flex-row sm:flex-col items-center sm:items-end sm:w-24 shrink-0 gap-4 sm:gap-2 pt-2">
                                        <div className="text-left sm:text-right rtl:text-right rtl:sm:text-left order-2 sm:order-1">
                                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                                {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                                {new Date(notification.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border-4 border-slate-50 dark:border-slate-900 order-1 sm:order-2 shadow-sm transition-transform duration-300 group-hover:scale-110 ${
                                            isIncident 
                                            ? 'bg-rose-500 text-white' 
                                            : 'bg-cyan-600 text-white'
                                        }`}>
                                            {isIncident ? <ShieldAlert className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                        </div>
                                    </div>

                                    {/* Content Card (Case File) */}
                                    <div 
                                        onClick={() => setSelectedNotification(notification)}
                                        className="flex-1 bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer w-full relative overflow-hidden"
                                    >
                                        {/* Colored Border Accent */}
                                        <div className={`absolute top-0 bottom-0 w-1.5 left-0 rtl:left-auto rtl:right-0 ${isIncident ? 'bg-rose-500' : 'bg-cyan-500'}`} />

                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                            <div className="space-y-1">
                                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                    isIncident ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                                                }`}>
                                                    {isIncident ? 'INCIDENT REPORT' : 'DISPATCH'} • REF-{notification.id}
                                                </span>
                                                <h3 className="font-black text-xl text-slate-900 dark:text-white leading-snug">
                                                    {isIncident ? notification.title : notification.title}
                                                </h3>
                                            </div>
                                            <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${
                                                notification.status === 'read' || notification.status === 'sent'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                                {t(notification.status)}
                                            </div>
                                        </div>

                                        <p className="text-base text-slate-600 dark:text-slate-400 line-clamp-2 font-medium mb-6">
                                            {notification.message}
                                        </p>

                                        {isIncident && notification.incident && notification.incident.photo_urls && notification.incident.photo_urls.length > 0 && (
                                            <div className="flex gap-3 overflow-hidden">
                                                {notification.incident.photo_urls.slice(0, 3).map((url: string, i: number) => (
                                                    <div key={i} className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                                                        <img src={url} alt="Attachment" className="w-full h-full object-cover opacity-80" />
                                                    </div>
                                                ))}
                                                {notification.incident.photo_urls.length > 3 && (
                                                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                                        +{notification.incident.photo_urls.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {filteredNotifications.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center text-center relative z-10">
                                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                    <ShieldAlert className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{t('The Logbook is Empty')}</h3>
                                <p className="text-slate-500 font-medium max-w-sm">
                                    {t('No incidents or notifications recorded in this timeline.')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {notifications.last_page > 1 && (
                    <div className="mt-16 flex justify-center">
                        <div className="flex gap-2 p-2 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            {Array.from({ length: notifications.last_page }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => router.get(route('school.notifications.received', { page }))}
                                    className={`w-12 h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${
                                        page === notifications.current_page
                                            ? 'bg-[#0B1527] text-white dark:bg-white dark:text-[#0B1527] shadow-lg'
                                            : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 
              4. THE DOCUMENT OVERLAY (Full Screen Reading Pane)
            */}
            {selectedNotification && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12 bg-slate-900/60 backdrop-blur-md">
                    {/* Click outside to close overlay */}
                    <div className="absolute inset-0" onClick={() => setSelectedNotification(null)} />
                    
                    <div className="relative w-full max-w-3xl bg-white dark:bg-[#0B1527] rounded-[40px] shadow-2xl flex flex-col max-h-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        
                        {/* Custom Close Button */}
                        <button 
                            onClick={() => setSelectedNotification(null)}
                            className="absolute top-6 right-6 w-12 h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 transition-colors z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-14">
                            
                            {selectedNotification.type === 'incident' && selectedNotification.incident ? (
                                // PREMIUM INCIDENT REPORT VIEW (Academic Style)
                                <div className="space-y-12">
                                    
                                    {/* Document Header */}
                                    <div className="border-b-2 border-slate-900 dark:border-white pb-8 mb-8 text-center sm:text-left rtl:sm:text-right">
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                            <div className="w-20 h-20 shrink-0 rounded-[24px] bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                                                <ShieldAlert className="w-10 h-10" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="inline-block px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-4 bg-rose-50 dark:bg-rose-900/10">
                                                    {t('Incident Report')} • REF-INC-{selectedNotification.incident.id}
                                                </span>
                                                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight font-serif">
                                                    {selectedNotification.title || t('Incident')}
                                                </h1>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta Data Ribbon */}
                                    <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500 dark:text-slate-400 mb-10 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            <span>{new Date(selectedNotification.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5" />
                                            <span>{new Date(selectedNotification.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="w-5 h-5" />
                                            <span className="capitalize">{t(selectedNotification.incident.type)}</span>
                                        </div>
                                    </div>

                                    {/* The Official Description */}
                                    <div className="prose dark:prose-invert max-w-none">
                                        <div className="absolute top-4 left-4 text-9xl text-slate-100 dark:text-slate-800/30 font-serif leading-none select-none z-0">
                                            "
                                        </div>
                                        <p className="relative z-10 text-lg md:text-xl text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap bg-slate-50/50 dark:bg-[#111827] rounded-3xl p-8 border border-slate-100 dark:border-slate-800/60">
                                            {selectedNotification.incident.description || <span className="italic opacity-50">{t('No description')}</span>}
                                        </p>
                                    </div>

                                    {/* Involved Entities Ledger */}
                                    <div className="pt-10 border-t border-slate-200 dark:border-slate-800">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">{t('Involved Entities')}</h4>
                                        
                                        <div className="flex flex-wrap gap-4 mb-8">
                                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex-1 min-w-[200px]">
                                                <UserIcon className="w-6 h-6 text-slate-400" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Reporter')}</p>
                                                    <p className="font-bold text-slate-900 dark:text-white text-lg">
                                                        {selectedNotification.incident.reporter ? selectedNotification.incident.reporter.name : t('Unknown')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex-1 min-w-[200px]">
                                                <Bus className="w-6 h-6 text-slate-400" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Bus')}</p>
                                                    <p className="font-bold text-slate-900 dark:text-white text-lg">
                                                        {selectedNotification.incident.bus ? selectedNotification.incident.bus.bus_code : t('Not specified')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex-1 min-w-[200px]">
                                                <UserIcon className="w-6 h-6 text-slate-400" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Driver')}</p>
                                                    <p className="font-bold text-slate-900 dark:text-white text-lg">
                                                        {selectedNotification.incident.bus?.driver ? selectedNotification.incident.bus.driver.name : t('No driver')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Students Log */}
                                        {selectedNotification.incident.students_list && selectedNotification.incident.students_list.length > 0 && (
                                            <div className="mb-8">
                                                <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-4">
                                                    {t('Involved Students')}
                                                </p>
                                                <div className="flex flex-wrap gap-3">
                                                    {selectedNotification.incident.students_list.map((student: any) => (
                                                        <div key={student.id} className="inline-flex items-center gap-3 bg-white dark:bg-[#111827] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                                <UserIcon className="w-4 h-4" />
                                                            </div>
                                                            <span className="font-bold text-slate-800 dark:text-slate-200">{student.name}</span>
                                                            {student.student_code && (
                                                                <span className="text-xs text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md ml-2 rtl:mr-2 rtl:ml-0">{student.student_code}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Attachments */}
                                        {selectedNotification.incident.photo_urls && selectedNotification.incident.photo_urls.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">{t('Exhibits / Attachments')}</h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                    {selectedNotification.incident.photo_urls.map((photoUrl: string, index: number) => (
                                                        <a 
                                                            key={index} 
                                                            href={photoUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm block aspect-square bg-slate-50 dark:bg-slate-900"
                                                        >
                                                            <img
                                                                src={photoUrl}
                                                                alt="Exhibit"
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-slate-900/40 backdrop-blur-[0px] group-hover:backdrop-blur-sm transition-all flex items-center justify-center">
                                                                <Search className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity transform scale-50 group-hover:scale-100 duration-300" />
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // STANDARD NOTIFICATION VIEW
                                <div className="space-y-12">
                                    {/* Academic Letterhead Style */}
                                    <div className="border-b-2 border-slate-900 dark:border-white pb-8 mb-8 text-center sm:text-left rtl:sm:text-right">
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                            <div className="w-20 h-20 shrink-0 rounded-[24px] bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center">
                                                <FileText className="w-10 h-10" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="inline-block px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
                                                    {t('DISPATCH')} • REF-{selectedNotification.id}
                                                </span>
                                                <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight font-serif">
                                                    {selectedNotification.title}
                                                </h1>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meta Data Ribbon */}
                                    <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-500 dark:text-slate-400 mb-10 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5" />
                                            <span>{new Date(selectedNotification.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-5 h-5" />
                                            <span>{new Date(selectedNotification.created_at).toLocaleTimeString()}</span>
                                        </div>
                                    </div>

                                    {/* The Official Message */}
                                    <div className="prose dark:prose-invert max-w-none">
                                        <div className="absolute top-4 left-4 text-9xl text-slate-100 dark:text-slate-800/30 font-serif leading-none select-none z-0">
                                            "
                                        </div>
                                        <p className="relative z-10 text-lg md:text-xl text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap bg-slate-50/50 dark:bg-[#111827] rounded-3xl p-8 border border-slate-100 dark:border-slate-800/60">
                                            {selectedNotification.message}
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </SchoolAuthenticatedLayout>
    );
}
