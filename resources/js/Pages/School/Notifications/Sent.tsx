import { Head, router } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import { useState } from 'react';
import NotificationModal from '@/Components/NotificationModal';
import { 
    Send, Search, Plus, Megaphone, Bus, AlertTriangle, FileText, 
    CheckCircle2, Clock, Users, Calendar, X, BarChart3, Filter
} from 'lucide-react';
import {
    DS_pageWrapper,
    DS_pageTitle,
    DS_card,
    DS_searchInput,
    DS_btnGold,
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
    DS_badge,
    DS_modalHeader,
    DS_cancelBtn
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
}

interface NotificationTemplate {
    id: number;
    name_en: string;
    name_ar: string;
    title_en: string;
    title_ar: string;
    body_en: string;
    body_ar: string;
    type: string;
}

interface Props {
    notifications: {
        data: Notification[];
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: { total: number; sent_today: number; pending: number; };
    templates: NotificationTemplate[];
    classrooms: any[];
    buses: any[];
    parents: any[];
    auth: any;
}

export default function Sent({ notifications, stats, templates, classrooms, buses, parents, auth }: Props) {
    const { t, lang } = useTranslation();
    const isRtl = lang === 'ar';
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const getTypeDetails = (type: string) => {
        const details: Record<string, { color: string; bg: string; icon: any; label: string }> = {
            school_announcement: { color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: Megaphone, label: isRtl ? 'إعلان مدرسي' : 'School Announcement' },
            bus_notification: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Bus, label: isRtl ? 'إشعار حافلة' : 'Bus Notification' },
            emergency: { color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: AlertTriangle, label: isRtl ? 'إشعار طوارئ' : 'Emergency' },
            general: { color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/50', icon: FileText, label: isRtl ? 'عام' : 'General' },
        };
        return details[type] || { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', icon: FileText, label: type };
    };

    const translateStatus = (status: string) => {
        if (status === 'sent') return isRtl ? 'مرسل' : 'Sent';
        if (status === 'failed') return isRtl ? 'فشل' : 'Failed';
        if (status === 'pending') return isRtl ? 'قيد الانتظار' : 'Pending';
        return status;
    };

    const filteredNotifications = notifications.data.filter(notif => {
        const matchesType = filterType === 'all' || notif.type === filterType;
        const matchesSearch =
            notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notif.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    const statsCards = [
        { label: isRtl ? "إجمالي المرسل" : "Total Sent", val: stats.total, icon: <Send className="w-5 h-5" />, accent: "navy" as const },
        { label: isRtl ? "أُرسل اليوم" : "Sent Today", val: stats.sent_today, icon: <Calendar className="w-5 h-5" />, accent: "blue" as const },
        { label: isRtl ? "قيد الانتظار" : "Pending", val: stats.pending, icon: <Clock className="w-5 h-5" />, accent: "gold" as const },
    ];

    const filterBtns = [
        { key: "all", label: isRtl ? "الكل" : "All" },
        { key: "school_announcement", label: isRtl ? "إعلان مدرسي" : "School Announcement" },
        { key: "bus_notification", label: isRtl ? "إشعار حافلة" : "Bus Notification" },
        { key: "emergency", label: isRtl ? "إشعار طوارئ" : "Emergency" },
    ];

    const tableHeaders = [
        isRtl ? "النوع" : "Type", 
        isRtl ? "العنوان" : "Title", 
        isRtl ? "المحتوى" : "Message", 
        isRtl ? "المستلمون" : "Recipients", 
        isRtl ? "التاريخ" : "Date", 
        isRtl ? "الحالة" : "Status"
    ];

    return (
        <SchoolAuthenticatedLayout 
            user={auth.user}
            header={<h2 className={DS_pageTitle}>{t("Sent Notifications")}</h2>}
        >
            <Head title={t('Sent Notifications')} />

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
                        <button onClick={() => setIsModalOpen(true)} className={DS_btnGold}>
                            <Plus className="w-4 h-4" />{isRtl ? "إشعار جديد" : "New Notification"}
                        </button>
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
                                        <td colSpan={6} className="py-16 text-center text-gray-400">
                                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                            <p className="font-bold">{isRtl ? "لا توجد إشعارات مطابقة" : "No notifications found"}</p>
                                        </td>
                                    </tr>
                                ) : filteredNotifications.map(notification => {
                                    const typeInfo = getTypeDetails(notification.type);
                                    const Icon = typeInfo.icon;

                                    return (
                                        <tr 
                                            key={notification.id} 
                                            className={`${DS_tableRow} cursor-pointer`}
                                            onClick={() => setSelectedNotification(notification)}
                                        >
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${typeInfo.bg} ${typeInfo.color}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-[#0f2044] dark:text-white text-xs block">{typeInfo.label}</span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isRtl ? 'مرجع-' : 'REF-'}{notification.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="font-bold text-[#0f2044] dark:text-white text-sm line-clamp-1">{notification.title}</span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="text-gray-500 dark:text-gray-400 text-xs line-clamp-1 max-w-xs">{notification.message}</span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                    <Users className="w-3.5 h-3.5" /> {notification.total_recipients}
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                    <Calendar className="w-3.5 h-3.5" /> 
                                                    {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className={DS_badge(notification.status === 'sent')}>
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
                                        onClick={() => router.get(route('school.notifications.sent', { page }))}
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
                            className="relative w-full max-w-2xl bg-white dark:bg-[#1a2845] rounded-[24px] shadow-2xl flex flex-col max-h-full overflow-hidden border border-gray-100 dark:border-[#243460]"
                        >
                            <button 
                                onClick={() => setSelectedNotification(null)}
                                className="absolute top-5 right-5 w-8 h-8 bg-gray-100 dark:bg-[#0f2044]/50 rounded-[10px] flex items-center justify-center text-gray-500 hover:text-[#0f2044] dark:hover:text-white transition-colors z-20"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex-1 overflow-y-auto p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-14 h-14 shrink-0 rounded-[16px] flex items-center justify-center ${getTypeDetails(selectedNotification.type).bg} ${getTypeDetails(selectedNotification.type).color}`}>
                                        {(() => {
                                            const Icon = getTypeDetails(selectedNotification.type).icon;
                                            return <Icon className="w-6 h-6" />;
                                        })()}
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
                                        <span className={DS_badge(selectedNotification.status === 'sent')}>{translateStatus(selectedNotification.status)}</span>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-[#0f2044]/10 p-6 rounded-[20px] border border-gray-100 dark:border-[#243460] mb-8">
                                    <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
                                        {selectedNotification.message}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{isRtl ? 'سجل التسليم' : 'Delivery Ledger'}</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-[#0f2044]/5 dark:bg-[#0f2044]/30 p-4 rounded-[16px] text-center border border-[#0f2044]/10 dark:border-[#243460]">
                                            <p className="text-2xl font-black text-[#0f2044] dark:text-white">{selectedNotification.total_recipients}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1">{isRtl ? 'المستلمين' : 'Recipients'}</p>
                                        </div>
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-[16px] text-center border border-emerald-100 dark:border-emerald-900/30">
                                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{selectedNotification.sent_count}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-500/70 mt-1">{isRtl ? 'تم التسليم' : 'Delivered'}</p>
                                        </div>
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-[16px] text-center border border-red-100 dark:border-red-900/30">
                                            <p className="text-2xl font-black text-red-600 dark:text-red-400">{selectedNotification.failed_count}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-red-600/70 dark:text-red-500/70 mt-1">{isRtl ? 'فشل' : 'Failed'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <NotificationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                templates={templates}
                classrooms={classrooms}
                buses={buses}
                parents={parents}
                initialData={null}
            />
        </SchoolAuthenticatedLayout>
    );
}
