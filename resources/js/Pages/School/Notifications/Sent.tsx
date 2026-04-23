import { Head, router } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import { useState } from 'react';
import NotificationModal from '@/Components/NotificationModal';
import { 
    Send, Search, Plus, Megaphone, Bus, AlertTriangle, FileText, 
    CheckCircle2, XCircle, Clock, Users, Calendar, X, BarChart3, Filter
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
        const details: Record<string, { color: string; bg: string; icon: any; border: string }> = {
            school_announcement: { color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', icon: Megaphone },
            bus_notification: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: Bus },
            emergency: { color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', icon: AlertTriangle },
            general: { color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700', icon: FileText },
        };
        return details[type] || { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', icon: FileText };
    };

    const filteredNotifications = notifications.data.filter(notif => {
        const matchesType = filterType === 'all' || notif.type === filterType;
        const matchesSearch =
            notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notif.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    // Theme: Academic Navy & Gold/Amber
    return (
        <SchoolAuthenticatedLayout user={auth.user}>
            <Head title={t('Sent Notifications')} />

            <div className="max-w-7xl mx-auto pb-12">
                
                {/* 
                  1. THE BENTO GRID HERO SECTION
                  A massive, highly visual header that breaks traditional dashboard rules. 
                */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 mb-8">
                    
                    {/* Primary Hero Box */}
                    <div className="md:col-span-8 bg-[#0B1527] dark:bg-[#070D18] rounded-[32px] p-8 md:p-12 relative overflow-hidden flex flex-col justify-between border border-[#1E2D4A] shadow-2xl">
                        {/* Decorative Academic Motif */}
                        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-amber-400 text-sm font-bold tracking-widest uppercase mb-6 backdrop-blur-md">
                                <Send className="w-4 h-4" />
                                {t('Broadcast Center')}
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-4 font-serif">
                                {t('Sent Notifications')}
                            </h1>
                            <p className="text-lg text-slate-400 max-w-xl font-medium leading-relaxed">
                                {t('Manage official communications, track delivery status, and maintain the institutional broadcast ledger.')}
                            </p>
                        </div>

                        <div className="relative z-10 mt-10 flex flex-wrap gap-4">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-2xl transition-all duration-300 flex items-center gap-3 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transform hover:-translate-y-1"
                            >
                                <Plus className="w-5 h-5" strokeWidth={3} />
                                {t('New Notification')}
                            </button>
                        </div>
                    </div>

                    {/* Stats Bento Boxes */}
                    <div className="md:col-span-4 grid grid-rows-2 gap-4 md:gap-6">
                        <div className="bg-white dark:bg-[#111827] rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110" />
                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-3">
                                <BarChart3 className="w-5 h-5" />
                                <h3 className="font-bold uppercase tracking-wider text-sm">{t('Total Sent')}</h3>
                            </div>
                            <p className="text-5xl font-black text-[#0B1527] dark:text-white">{stats.total}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-[32px] p-6 border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-center">
                                <h3 className="font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-wider text-xs mb-2">{t('Sent Today')}</h3>
                                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{stats.sent_today}</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-[32px] p-6 border border-amber-100 dark:border-amber-900/30 flex flex-col justify-center">
                                <h3 className="font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-wider text-xs mb-2">{t('Pending')}</h3>
                                <p className="text-3xl font-black text-amber-700 dark:text-amber-400">{stats.pending}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 
                  2. THE FILTER BAR (Academic Journal Style)
                */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                        <Filter className="w-5 h-5 text-slate-400 mr-2 rtl:ml-2 rtl:mr-0 shrink-0" />
                        {['all', 'school_announcement', 'bus_notification', 'emergency'].map(type => (
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
                  3. THE MASONRY / CARD GRID
                  Displaying notifications as physical "memos" or "tickets".
                */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredNotifications.map(notification => {
                        const typeInfo = getTypeDetails(notification.type);
                        const Icon = typeInfo.icon;
                        
                        return (
                            <div 
                                key={notification.id}
                                onClick={() => setSelectedNotification(notification)}
                                className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-64 group relative overflow-hidden"
                            >
                                {/* Decorative Gradient Overlay on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50 dark:to-slate-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${typeInfo.bg} ${typeInfo.color} ${typeInfo.border} border`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                        notification.status === 'sent' 
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                        {t(notification.status)}
                                    </div>
                                </div>
                                
                                <h3 className="font-black text-lg text-slate-900 dark:text-white line-clamp-2 leading-snug mb-2 relative z-10">
                                    {notification.title}
                                </h3>
                                
                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-auto relative z-10 font-medium">
                                    {notification.message}
                                </p>
                                
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center relative z-10 text-xs font-bold text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4" />
                                        {notification.total_recipients}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredNotifications.length === 0 && (
                    <div className="py-32 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">{t('The Ledger is Empty')}</h3>
                        <p className="text-slate-500 font-medium max-w-sm">
                            {t('No notifications found matching your current filters.')}
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {notifications.last_page > 1 && (
                    <div className="mt-12 flex justify-center">
                        <div className="flex gap-2 p-2 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            {Array.from({ length: notifications.last_page }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => router.get(route('school.notifications.sent', { page }))}
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
              Replaces the right-pane of the split view. 
              Looks like a physical academic letterhead.
            */}
            {selectedNotification && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12 bg-slate-900/60 backdrop-blur-md">
                    {/* Click outside to close overlay */}
                    <div className="absolute inset-0" onClick={() => setSelectedNotification(null)} />
                    
                    <div className="relative w-full max-w-3xl bg-white dark:bg-[#0B1527] rounded-[40px] shadow-2xl flex flex-col max-h-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        
                        {/* Custom Close Button Floating top right */}
                        <button 
                            onClick={() => setSelectedNotification(null)}
                            className="absolute top-6 right-6 w-12 h-12 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 transition-colors z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-14">
                            
                            {/* Academic Letterhead Style */}
                            <div className="border-b-2 border-slate-900 dark:border-white pb-8 mb-8 text-center sm:text-left rtl:sm:text-right">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                    <div className={`w-20 h-20 shrink-0 rounded-[24px] flex items-center justify-center ${getTypeDetails(selectedNotification.type).bg} ${getTypeDetails(selectedNotification.type).color}`}>
                                        {(() => {
                                            const Icon = getTypeDetails(selectedNotification.type).icon;
                                            return <Icon className="w-10 h-10" />;
                                        })()}
                                    </div>
                                    <div className="flex-1">
                                        <span className="inline-block px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
                                            {t(selectedNotification.type)} • REF-{selectedNotification.id}
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
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className={`w-5 h-5 ${selectedNotification.status === 'sent' ? 'text-emerald-500' : 'text-amber-500'}`} />
                                    <span className="uppercase tracking-widest text-xs">{t(selectedNotification.status)}</span>
                                </div>
                            </div>

                            {/* The Official Message */}
                            <div className="prose dark:prose-invert max-w-none mb-16">
                                <p className="text-lg md:text-xl text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
                                    {selectedNotification.message}
                                </p>
                            </div>

                            {/* Delivery Statistics Ledger */}
                            <div className="pt-10 border-t border-slate-200 dark:border-slate-800">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">{t('Delivery Ledger')}</h4>
                                <div className="grid grid-cols-3 gap-4 md:gap-8">
                                    <div>
                                        <p className="text-4xl font-black text-slate-900 dark:text-white">{selectedNotification.total_recipients}</p>
                                        <p className="text-sm font-bold text-slate-500 mt-2">{t('Total Recipients')}</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{selectedNotification.sent_count}</p>
                                        <p className="text-sm font-bold text-slate-500 mt-2">{t('Delivered')}</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black text-rose-600 dark:text-rose-400">{selectedNotification.failed_count}</p>
                                        <p className="text-sm font-bold text-slate-500 mt-2">{t('Failed')}</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

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
