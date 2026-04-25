import { Head, router } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import { useState } from 'react';
import { 
    Inbox, Search, AlertTriangle, FileText, Calendar, 
    User as UserIcon, Bus, CheckCircle2,
    ShieldAlert, Clock, X, Filter
} from 'lucide-react';
import {
    DS_pageWrapper,
    DS_pageTitle,
    DS_card,
    DS_searchInput,
    DS_statCard,
    DS_statIcon,
    DS_statLabel,
    DS_statValue,
    DS_tableWrapper,
    DS_tableBase,
    DS_tableHead,
    DS_tableTh,
    DS_tableRow,
    DS_tableTd,
    DS_sectionHeader,
    DS_filterBtn,
    DS_badge
} from '@/lib/DS';
import { motion, AnimatePresence } from 'framer-motion';

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

    const getTypeDetails = (type: string) => {
        const details: Record<string, { color: string; bg: string; icon: any; label: string }> = {
            incident: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: ShieldAlert, label: isRtl ? 'بلاغ حادث' : 'Incident Report' },
            general: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20', icon: FileText, label: isRtl ? 'إشعار عام' : 'General Dispatch' },
        };
        return details[type] || { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', icon: FileText, label: type };
    };

    const translateStatus = (status: string) => {
        if (status === 'unread') return isRtl ? 'غير مقروء' : 'Unread';
        if (status === 'read') return isRtl ? 'مقروء' : 'Read';
        return status;
    };

    const filteredNotifications = notifications.data.filter(notif => {
        const matchesType = filterType === 'all' || notif.type === filterType;
        const matchesSearch =
            notif.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notif.message?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const statsCards = [
        { label: isRtl ? "إجمالي المستلم" : "Total Received", val: stats.total, icon: <Inbox className="w-5 h-5" />, accent: "navy" as const },
        { label: isRtl ? "بلاغات وحوادث" : "Incidents", val: stats.incidents, icon: <AlertTriangle className="w-5 h-5" />, accent: "red" as const },
        { label: isRtl ? "غير مقروء" : "Unread", val: stats.unread, icon: <Clock className="w-5 h-5" />, accent: "gold" as const },
    ];

    const filterBtns = [
        { key: "all", label: isRtl ? "الكل" : "All" },
        { key: "incident", label: isRtl ? "بلاغات وحوادث" : "Incidents" },
        { key: "general", label: isRtl ? "عام" : "General" },
    ];

    const tableHeaders = [
        isRtl ? "النوع" : "Type", 
        isRtl ? "العنوان" : "Title", 
        isRtl ? "المحتوى" : "Message", 
        isRtl ? "التاريخ" : "Date", 
        isRtl ? "الحالة" : "Status"
    ];

    return (
        <SchoolAuthenticatedLayout 
            user={auth.user}
            header={<h2 className={DS_pageTitle}>{isRtl ? "الإشعارات المستلمة" : "Received Notifications"}</h2>}
        >
            <Head title={isRtl ? 'الإشعارات المستلمة' : 'Received Notifications'} />

            <div className={DS_pageWrapper}>
                
                {/* Stats Cards */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statsCards.map(s => (
                        <div key={s.label} className={`${DS_statCard(s.accent)} ${isRtl ? "flex-row-reverse" : ""}`}>
                            <div className={DS_statIcon(s.accent)}>{s.icon}</div>
                            <div className={isRtl ? "text-right" : "text-left"}>
                                <p className={DS_statLabel}>{s.label}</p>
                                <p className={DS_statValue}>{s.val}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Main Table Card */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={DS_card}>
                    {/* Toolbar */}
                    <div className={DS_sectionHeader(isRtl)}>
                        <div className="flex-1 min-w-[200px] relative max-w-sm">
                            <Search className={`absolute w-4 h-4 text-gray-400 top-1/2 -translate-y-1/2 ${isRtl ? "right-4" : "left-4"}`} />
                            <input 
                                type="text" 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                                placeholder={isRtl ? "ابحث في الإشعارات..." : "Search notifications..."} 
                                className={`${DS_searchInput} ${isRtl ? "pr-10" : "pl-10"}`} 
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {filterBtns.map(f => (
                                <button key={f.key} onClick={() => setFilterType(f.key)} className={DS_filterBtn(filterType === f.key)}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className={DS_tableWrapper}>
                        <table className={DS_tableBase}>
                            <thead className={DS_tableHead}>
                                <tr>{tableHeaders.map(h => <th key={h} className={DS_tableTh(isRtl)}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {filteredNotifications.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-gray-400">
                                            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                            <p className="font-bold">{isRtl ? "لا توجد إشعارات مطابقة" : "No notifications found"}</p>
                                        </td>
                                    </tr>
                                ) : filteredNotifications.map(notification => {
                                    const typeInfo = getTypeDetails(notification.type);
                                    const Icon = typeInfo.icon;
                                    const isIncident = notification.type === 'incident';

                                    return (
                                        <tr 
                                            key={notification.id} 
                                            className={`${DS_tableRow} cursor-pointer ${notification.status === 'unread' ? 'bg-[#0f2044]/5 dark:bg-[#0f2044]/30' : ''}`}
                                            onClick={() => setSelectedNotification(notification)}
                                        >
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${typeInfo.bg} ${typeInfo.color}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <span className={`font-bold text-xs block ${isIncident ? 'text-red-600 dark:text-red-400' : 'text-[#0f2044] dark:text-white'}`}>{typeInfo.label}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isRtl ? 'مرجع-' : 'REF-'}{notification.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className={`text-sm line-clamp-1 ${notification.status === 'unread' ? 'font-black text-[#0f2044] dark:text-white' : 'font-bold text-gray-700 dark:text-gray-300'}`}>{notification.title}</span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1 max-w-xs">{notification.message}</span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                    <Calendar className="w-3.5 h-3.5" /> 
                                                    {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className={DS_badge(notification.status === 'read' || notification.status === 'sent')}>
                                                    {translateStatus(notification.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {notifications.last_page > 1 && (
                        <div className="p-4 border-t border-gray-100 dark:border-[#243460] flex justify-center bg-gray-50/50 dark:bg-[#0f2044]/5">
                            <div className="flex gap-2">
                                {Array.from({ length: notifications.last_page }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => router.get(route('school.notifications.received', { page }))}
                                        className={`w-8 h-8 rounded-[10px] font-bold text-xs transition-all flex items-center justify-center ${
                                            page === notifications.current_page
                                                ? 'bg-[#0f2044] text-[#f5b800] shadow-sm'
                                                : 'bg-[#0f2044]/5 text-gray-500 hover:bg-[#0f2044]/10 dark:bg-[#0f2044]/30 dark:text-gray-400 dark:hover:bg-[#0f2044]/50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Notification Reading Modal Overlay */}
            <AnimatePresence>
                {selectedNotification && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#0f2044]/80 backdrop-blur-sm"
                    >
                        <div className="absolute inset-0" onClick={() => setSelectedNotification(null)} />
                        
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.95, y: 20 }}
                            className="relative w-full max-w-3xl bg-white dark:bg-[#1a2845] rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-[#243460]"
                        >
                            <button 
                                onClick={() => setSelectedNotification(null)}
                                className="absolute top-5 right-5 w-8 h-8 bg-gray-100 dark:bg-[#0f2044]/50 rounded-[10px] flex items-center justify-center text-gray-500 hover:text-[#0f2044] dark:hover:text-white transition-colors z-20"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex-1 overflow-y-auto p-8">
                                {selectedNotification.type === 'incident' && selectedNotification.incident ? (
                                    <>
                                        {/* Incident Report View */}
                                        <div className="flex items-center gap-4 mb-6 border-b border-gray-100 dark:border-[#243460] pb-6">
                                            <div className="w-16 h-16 shrink-0 rounded-[16px] flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                                                <ShieldAlert className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <span className="inline-block px-3 py-1 rounded-[8px] bg-red-50 dark:bg-red-900/30 text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-2">
                                                    {isRtl ? 'تقرير بلاغ / حادث' : 'Incident Report'} • {isRtl ? 'مرجع-' : 'REF-INC-'}{selectedNotification.incident.id}
                                                </span>
                                                <h2 className="text-2xl font-black text-red-700 dark:text-red-400 leading-tight">
                                                    {selectedNotification.title || (isRtl ? 'بلاغ' : 'Incident')}
                                                </h2>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500 dark:text-gray-400 mb-8 bg-gray-50 dark:bg-[#0f2044]/20 p-4 rounded-[16px] border border-gray-100 dark:border-[#243460]">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(selectedNotification.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                <span>{new Date(selectedNotification.created_at).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 ml-auto rtl:ml-0 rtl:mr-auto text-red-600 dark:text-red-400">
                                                <ShieldAlert className="w-4 h-4" />
                                                <span className="capitalize">{isRtl && selectedNotification.incident.type === 'accident' ? 'حادث مروري' : (isRtl && selectedNotification.incident.type === 'emergency' ? 'حالة طارئة' : (isRtl ? 'عام' : selectedNotification.incident.type))}</span>
                                            </div>
                                        </div>

                                        <div className="bg-red-50/50 dark:bg-[#0f2044]/10 p-6 rounded-[20px] border border-red-100 dark:border-[#243460] mb-8 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-[0.03] dark:opacity-5 pointer-events-none">
                                                <ShieldAlert className="w-48 h-48" />
                                            </div>
                                            <p className="relative z-10 text-sm md:text-base text-gray-800 dark:text-gray-200 leading-relaxed font-medium whitespace-pre-wrap">
                                                {selectedNotification.incident.description || <span className="italic opacity-50">{isRtl ? 'لا يوجد تفاصيل إضافية' : 'No description'}</span>}
                                            </p>
                                        </div>

                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{isRtl ? 'الأطراف المعنية' : 'Involved Entities'}</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                            <div className="bg-[#0f2044]/5 dark:bg-[#0f2044]/30 p-4 rounded-[16px] border border-[#0f2044]/10 dark:border-[#243460] flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white dark:bg-[#0f2044] rounded-[10px] flex items-center justify-center text-gray-400 shrink-0">
                                                    <UserIcon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase">{isRtl ? 'المُبلغ' : 'Reporter'}</p>
                                                    <p className="font-black text-[#0f2044] dark:text-white truncate">{selectedNotification.incident.reporter ? selectedNotification.incident.reporter.name : (isRtl ? 'مجهول' : 'Unknown')}</p>
                                                </div>
                                            </div>
                                            <div className="bg-[#0f2044]/5 dark:bg-[#0f2044]/30 p-4 rounded-[16px] border border-[#0f2044]/10 dark:border-[#243460] flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white dark:bg-[#0f2044] rounded-[10px] flex items-center justify-center text-gray-400 shrink-0">
                                                    <Bus className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase">{isRtl ? 'الحافلة' : 'Bus'}</p>
                                                    <p className="font-black text-[#0f2044] dark:text-white truncate">{selectedNotification.incident.bus ? selectedNotification.incident.bus.bus_code : (isRtl ? 'غير محدد' : 'Not specified')}</p>
                                                </div>
                                            </div>
                                            <div className="bg-[#0f2044]/5 dark:bg-[#0f2044]/30 p-4 rounded-[16px] border border-[#0f2044]/10 dark:border-[#243460] flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white dark:bg-[#0f2044] rounded-[10px] flex items-center justify-center text-gray-400 shrink-0">
                                                    <UserIcon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase">{isRtl ? 'السائق' : 'Driver'}</p>
                                                    <p className="font-black text-[#0f2044] dark:text-white truncate">{selectedNotification.incident.bus?.driver ? selectedNotification.incident.bus.driver.name : (isRtl ? 'لا يوجد سائق' : 'No driver')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedNotification.incident.students_list && selectedNotification.incident.students_list.length > 0 && (
                                            <div className="mb-8">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4">{isRtl ? 'الطلاب المرتبطين بالحادث' : 'Involved Students'}</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedNotification.incident.students_list.map((student: any) => (
                                                        <div key={student.id} className="inline-flex items-center gap-2 bg-white dark:bg-[#0f2044]/30 px-3 py-1.5 rounded-[10px] border border-gray-100 dark:border-[#243460]">
                                                            <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#0f2044] flex items-center justify-center text-gray-500">
                                                                <UserIcon className="w-3 h-3" />
                                                            </div>
                                                            <span className="font-bold text-xs text-gray-700 dark:text-gray-300">{student.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedNotification.incident.photo_urls && selectedNotification.incident.photo_urls.length > 0 && (
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{isRtl ? 'المرفقات / الصور' : 'Attachments'}</h4>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                    {selectedNotification.incident.photo_urls.map((photoUrl: string, index: number) => (
                                                        <a 
                                                            key={index} 
                                                            href={photoUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="block relative rounded-[16px] overflow-hidden border border-gray-100 dark:border-[#243460] aspect-square bg-gray-50 dark:bg-[#0f2044]/10 group"
                                                        >
                                                            <img
                                                                src={photoUrl}
                                                                alt="Attachment"
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-[#0f2044]/40 transition-colors flex items-center justify-center">
                                                                <Search className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100 duration-300" />
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {/* Standard Notification View */}
                                        <div className="flex items-center gap-4 mb-6 border-b border-gray-100 dark:border-[#243460] pb-6">
                                            <div className="w-14 h-14 shrink-0 rounded-[16px] flex items-center justify-center bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900/30">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className="inline-block px-3 py-1 rounded-[8px] bg-[#0f2044]/5 dark:bg-[#0f2044]/30 text-[10px] font-black uppercase tracking-widest text-[#0f2044]/70 dark:text-[#7ba7e8] mb-2">
                                                    {getTypeDetails(selectedNotification.type).label} • {isRtl ? 'مرجع-' : 'REF-'}{selectedNotification.id}
                                                </span>
                                                <h2 className="text-2xl font-black text-[#0f2044] dark:text-white leading-tight">
                                                    {selectedNotification.title}
                                                </h2>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500 dark:text-gray-400 mb-8 bg-gray-50 dark:bg-[#0f2044]/20 p-4 rounded-[16px] border border-gray-100 dark:border-[#243460]">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(selectedNotification.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                <span>{new Date(selectedNotification.created_at).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 ml-auto rtl:ml-0 rtl:mr-auto">
                                                <span className={DS_badge(selectedNotification.status === 'read' || selectedNotification.status === 'sent')}>{translateStatus(selectedNotification.status)}</span>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-[#0f2044]/10 p-6 rounded-[20px] border border-gray-100 dark:border-[#243460]">
                                            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
                                                {selectedNotification.message}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </SchoolAuthenticatedLayout>
    );
}
