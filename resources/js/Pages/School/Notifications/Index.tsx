import { Head, router } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import { useState } from 'react';
import NotificationModal from '@/Components/NotificationModal';

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

interface Classroom {
    id: number;
    name: string;
}

interface Bus {
    id: number;
    bus_number: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    notifications: {
        data: Notification[];
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: {
        total: number;
        sent_today: number;
        pending: number;
    };
    templates: NotificationTemplate[];
    classrooms: Classroom[];
    buses: Bus[];
    parents: User[];
    auth: any;
}

export default function Index({ notifications, stats, templates, classrooms, buses, parents, auth }: Props) {
    const { t, lang } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received');
    const [selectedIncident, setSelectedIncident] = useState<any>(null);

    const getSuccessRate = (notification: Notification) => {
        if (notification.total_recipients === 0) return 0;
        return Math.round((notification.sent_count / notification.total_recipients) * 100);
    };

    const getTypeColor = (type: string) => {
        const colors: { [key: string]: string } = {
            school_announcement: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400',
            bus_notification: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
            emergency: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
            general: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
        };
        return colors[type] || 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    };

    const getTypeIcon = (type: string) => {
        const icons: { [key: string]: string } = {
            school_announcement: '📢',
            bus_notification: '🚌',
            emergency: '🚨',
            general: '📝',
        };
        return icons[type] || '📩';
    };

    const filteredNotifications = notifications.data.filter(notif => {
        const matchesTab = activeTab === 'sent' ? notif.sender_id === auth.user.id : notif.sender_id !== auth.user.id;
        const matchesType = filterType === 'all' || notif.type === filterType;
        const matchesSearch = 
            notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            notif.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesType && matchesSearch;
    });

    const [initialNotificationData, setInitialNotificationData] = useState<any>(null);

    const handleForwardIncident = (incident: any) => {
        setInitialNotificationData({
            type: "bus_notification",
            title_ar: "إشعار طارئ بخصوص حافلة " + (incident.bus?.bus_code || ''),
            title_en: "Emergency Notification for Bus " + (incident.bus?.bus_code || ''),
            body_ar: "نود إعلامكم بالآتي:\n\n" + incident.description,
            body_en: "We would like to inform you about the following:\n\n" + incident.description,
            recipient_type: "by_bus",
            recipient_filter: incident.bus_id ? { bus_id: String(incident.bus_id) } : {},
        });
        setSelectedIncident(null);
        setIsModalOpen(true);
    };

    return (
        <SchoolAuthenticatedLayout
            header={
                <h2 className="font-extrabold text-3xl text-[#0e7490] dark:text-cyan-400">
                    {t('Notifications Management')}
                </h2>
            } 
            user={auth.user}        
        >
            <Head title={t('Notifications')} />

            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-cyan-50 dark:bg-cyan-900/30 rounded-[20px] flex items-center justify-center text-3xl text-[#0e7490]">
                                📊
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('Total Sent')}</p>
                                <p className="text-5xl font-extrabold text-[#0e7490] mt-1">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-[20px] flex items-center justify-center text-3xl text-green-600">
                                📅
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('Sent Today')}</p>
                                <p className="text-5xl font-extrabold text-green-600 mt-1">{stats.sent_today}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/30 rounded-[20px] flex items-center justify-center text-3xl text-orange-500">
                                ⏳
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('Pending')}</p>
                                <p className="text-5xl font-extrabold text-orange-500 mt-1">{stats.pending}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white dark:bg-gray-800 rounded-[30px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    {/* Top Tabs */}
                    <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
                        <button
                            onClick={() => setActiveTab('received')}
                            className={`flex-1 py-4 font-bold text-lg transition-all border-b-2 ${
                                activeTab === 'received' 
                                ? 'text-[#0e7490] border-[#0e7490] bg-white dark:bg-gray-800' 
                                : 'text-gray-500 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            الإشعارات المستلمة (طوارئ وبلاغات)
                        </button>
                        <button
                            onClick={() => setActiveTab('sent')}
                            className={`flex-1 py-4 font-bold text-lg transition-all border-b-2 ${
                                activeTab === 'sent' 
                                ? 'text-[#0e7490] border-[#0e7490] bg-white dark:bg-gray-800' 
                                : 'text-gray-500 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            الإشعارات المرسلة
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className={`p-6 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-center ${activeTab === 'sent' ? 'justify-between' : 'justify-end'} bg-gray-50/50 dark:bg-gray-900/50`}>
                        {activeTab === 'sent' && (
                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                {['all', 'school_announcement', 'bus_notification', 'emergency', 'general'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-4 py-2 rounded-[20px] font-bold text-sm whitespace-nowrap transition-all border flex-grow sm:flex-grow-0 text-center ${
                                            filterType === type
                                                ? 'bg-[#0e7490] text-white border-[#0e7490] shadow-md'
                                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {t(type === 'all' ? 'All Types' : type)}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                            <div className="relative w-full sm:w-auto sm:min-w-[280px]">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search notifications...')}
                                    className="w-full pl-11 pr-4 py-2.5 rounded-[20px] border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                />
                                <svg className={`w-5 h-5 text-gray-400 absolute top-3 ${lang === 'ar' ? 'left-4' : 'left-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {activeTab === 'sent' && (
                                <button
                                    onClick={() => {
                                        setInitialNotificationData(null);
                                        setIsModalOpen(true);
                                    }}
                                    className="px-6 py-2.5 bg-[#0e7490] text-white font-bold rounded-[20px] hover:bg-[#155e75] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <span className="text-xl leading-none">+</span>
                                    {t('New Notification')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                                    <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">الإشعار</th>
                                    <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 text-center uppercase">{t('Type')}</th>
                                    {activeTab === 'sent' && (
                                        <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">{t('Recipients')}</th>
                                    )}
                                    <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">{t('Status')}</th>
                                    <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">{t('Date')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredNotifications.map((notification) => (
                                    <tr 
                                        key={notification.id} 
                                        className={`group hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 transition-colors ${activeTab === 'received' && notification.incident ? 'cursor-pointer' : ''}`}
                                        onClick={() => {
                                            if (activeTab === 'received' && notification.incident) {
                                                setSelectedIncident(notification.incident);
                                            }
                                        }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center justify-center text-center">
                                                {notification.type !== 'incident' && (
                                                    <p className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-[#0e7490] transition-colors">
                                                        {notification.title}
                                                    </p>
                                                )}
                                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 line-clamp-2 max-w-md">
                                                    {notification.message}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[15px] text-xs font-bold ${getTypeColor(notification.type)}`}>
                                                {notification.type === 'incident' ? (
                                                    <span>{notification.title}</span>
                                                ) : (
                                                    <>
                                                        <span>{getTypeIcon(notification.type)}</span>
                                                        {t(notification.type)}
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        {activeTab === 'sent' && (
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-gray-900 dark:text-white text-lg">
                                                        {notification.total_recipients}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                                        <span className="text-green-600">{notification.sent_count} ✓</span>
                                                        <span className="text-red-500">{notification.failed_count} ✗</span>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1.5 rounded-[10px] text-xs font-bold capitalize ${
                                                notification.status === 'sent'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                                {t(notification.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(notification.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredNotifications.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center">
                                            <div className="text-5xl mb-4 opacity-20">📭</div>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                                                {t('No notifications found')}
                                            </h3>
                                            <p className="text-gray-500 text-sm">
                                                {searchQuery ? t('Try adjusting your search or filters') : t('Start by sending a new notification')}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Pagination */}
                    {notifications.last_page > 1 && (
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-center">
                            <div className="flex gap-2">
                                {Array.from({ length: notifications.last_page }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => router.get(route('school.notifications.index', { page }))}
                                        className={`w-10 h-10 rounded-full font-bold text-sm transition-all flex items-center justify-center ${
                                            page === notifications.current_page
                                                ? 'bg-[#0e7490] text-white shadow-lg scale-110'
                                                : 'bg-white dark:bg-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notification Modal */}
            <NotificationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                templates={templates}
                classrooms={classrooms}
                buses={buses}
                parents={parents}
                initialData={initialNotificationData}
            />

            {/* Incident Details Modal */}
            {selectedIncident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-[30px] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <h3 className="text-xl font-bold text-[#0e7490] dark:text-cyan-400">
                                {t('تفاصيل البلاغ / الحادث')}
                            </h3>
                            <button
                                onClick={() => setSelectedIncident(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* General Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-[20px]">
                                    <p className="text-sm font-bold text-gray-500 mb-1">{t('المبلغ (من رفع البلاغ)')}</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {selectedIncident.reporter ? selectedIncident.reporter.name : 'غير معروف'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-[20px]">
                                    <p className="text-sm font-bold text-gray-500 mb-1">{t('نوع البلاغ')}</p>
                                    <p className="font-bold text-gray-900 dark:text-white capitalize">
                                        {t(selectedIncident.type)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-[20px]">
                                    <p className="text-sm font-bold text-gray-500 mb-1">{t('الحافلة (المركبة)')}</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {selectedIncident.bus ? selectedIncident.bus.bus_code : 'لم يُحدد'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-[20px]">
                                    <p className="text-sm font-bold text-gray-500 mb-1">{t('السائق')}</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {selectedIncident.bus?.driver ? selectedIncident.bus.driver.name : 'لا يوجد سائق'}
                                    </p>
                                </div>
                            </div>

                            {/* Bus Supervisor (If Any) */}
                            {selectedIncident.bus?.supervisor && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-[20px]">
                                    <p className="text-sm font-bold text-gray-500 mb-1">{t('مشرفة الحافلة')}</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {selectedIncident.bus.supervisor.name}
                                    </p>
                                </div>
                            )}

                            {/* Student Info (If Behavioral) */}
                            {selectedIncident.students_list && selectedIncident.students_list.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-[20px]">
                                    <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">{t('الطلاب المعنيين')}</p>
                                    <ul className="list-disc list-inside">
                                        {selectedIncident.students_list.map((student: any) => (
                                            <li key={student.id} className="font-bold text-gray-900 dark:text-white">
                                                {student.name} {student.uuid ? `(${student.uuid})` : ''}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-[20px]">
                                <p className="text-sm font-bold text-gray-500 mb-1">{t('الوصف')}</p>
                                <p className="font-bold text-gray-900 dark:text-white whitespace-pre-wrap">
                                    {selectedIncident.description || 'لا يوجد وصف'}
                                </p>
                            </div>

                            {selectedIncident.photo_urls && selectedIncident.photo_urls.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-[20px]">
                                    <p className="text-sm font-bold text-gray-500 mb-3">{t('صورة المرفقات')}</p>
                                    <div className="flex gap-4 overflow-x-auto">
                                        {selectedIncident.photo_urls.map((photoUrl: string, index: number) => (
                                            <a key={index} href={photoUrl} target="_blank" rel="noopener noreferrer">
                                                <img 
                                                    src={photoUrl} 
                                                    alt="Incident Photo" 
                                                    className="h-32 w-32 object-cover rounded-[15px] border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                            {selectedIncident.bus_id ? (
                                <button
                                    onClick={() => handleForwardIncident(selectedIncident)}
                                    className="px-6 py-2.5 rounded-[15px] font-bold bg-[#0e7490] text-white hover:bg-[#155e75] transition-colors shadow-sm flex items-center gap-2"
                                >
                                    <span>📨</span>
                                    {t('تحويل الرسالة لأولياء أمور الحافلة')}
                                </button>
                            ) : (
                                <div />
                            )}
                            <button
                                onClick={() => setSelectedIncident(null)}
                                className="px-6 py-2.5 rounded-[15px] font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SchoolAuthenticatedLayout>
    );
}
