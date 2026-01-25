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
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

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
        const matchesType = filterType === 'all' || notif.type === filterType;
        const matchesSearch = 
            notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            notif.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

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
                    {/* Toolbar */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col xl:flex-row gap-6 items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
                            {['all', 'school_announcement', 'bus_notification', 'emergency', 'general'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-5 py-2.5 rounded-[20px] font-bold text-sm whitespace-nowrap transition-all border ${
                                        filterType === type
                                            ? 'bg-[#0e7490] text-white border-[#0e7490] shadow-md'
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {t(type === 'all' ? 'All Types' : type)}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                            <div className="relative flex-grow sm:flex-grow-0 min-w-[300px]">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search notifications...')}
                                    className="w-full pl-11 pr-4 py-3 rounded-[20px] border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-6 py-3 bg-[#0e7490] text-white font-bold rounded-[20px] hover:bg-[#155e75] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <span className="text-xl">+</span>
                                {t('New Notification')}
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                                    <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase">{t('Notification')}</th>
                                    <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase">{t('Type')}</th>
                                    <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">{t('Recipients')}</th>
                                    <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">{t('Status')}</th>
                                    <th className="px-6 py-5 text-sm font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">{t('Date')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredNotifications.map((notification) => (
                                    <tr key={notification.id} className="group hover:bg-cyan-50/50 dark:hover:bg-cyan-900/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-[#0e7490] transition-colors">
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-md">
                                                    {notification.message}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[15px] text-xs font-bold ${getTypeColor(notification.type)}`}>
                                                <span>{getTypeIcon(notification.type)}</span>
                                                {t(notification.type)}
                                            </span>
                                        </td>
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
            />
        </SchoolAuthenticatedLayout>
    );
}
