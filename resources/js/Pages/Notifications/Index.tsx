import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    data: any;
    from_user_name: string;
    status: 'unread' | 'read';
    icon: string;
    color: string;
    created_at: string;
    read_at?: string;
}

interface Props {
    auth: any;
    notifications: Notification[];
}

export default function Index({ auth, notifications: allNotifications }: Props) {
    const { t, isRtl } = useTranslation();
    const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'bus_request' | 'bus_request_status'>('all');

    const filteredNotifications = allNotifications.filter(n => {
        const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
        const matchesType = typeFilter === 'all' || n.type === typeFilter;
        return matchesStatus && matchesType;
    });

    const unreadCount = allNotifications.filter(n => n.status === 'unread').length;
    const readCount = allNotifications.filter(n => n.status === 'read').length;

    const markAsRead = (id: number) => {
        router.post(`/notifications/${id}/read`, {}, {
            preserveScroll: true,
        });
    };

    const markAllAsRead = () => {
        router.post('/notifications/read-all', {}, {
            preserveScroll: true,
        });
    };

    const deleteNotification = (id: number) => {
        if (confirm(t('Are you sure you want to delete this notification?'))) {
            router.delete(`/notifications/${id}`, {
                preserveScroll: true,
            });
        }
    };

    const deleteAll = () => {
        if (confirm(t('Are you sure you want to delete all notifications?'))) {
            router.delete('/notifications', {
                preserveScroll: true,
            });
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (notification.status === 'unread') {
            markAsRead(notification.id);
        }
        
        // Navigate based on type
        if (notification.data?.bus_request_id) {
            router.visit(route('admin.bus-requests.index'));
        }
    };

    const getIconColor = (color: string) => {
        const colors: Record<string, string> = {
            blue: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
            green: 'text-green-500 bg-green-100 dark:bg-green-900/30',
            red: 'text-red-500 bg-red-100 dark:bg-red-900/30',
            yellow: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
            purple: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
        };
        return colors[color] || colors.blue;
    };

    const getIconEmoji = (icon: string) => {
        const icons: Record<string, string> = {
            bell: '🔔',
            bus: '🚌',
            'check-circle': '✅',
            'x-circle': '❌',
            info: 'ℹ️',
            warning: '⚠️',
        };
        return icons[icon] || icons.bell;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return isRtl ? 'الآن' : 'Now';
        if (minutes < 60) return isRtl ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
        if (hours < 24) return isRtl ? `منذ ${hours} ساعة` : `${hours}h ago`;
        if (days < 7) return isRtl ? `منذ ${days} يوم` : `${days}d ago`;
        return date.toLocaleDateString(isRtl ? 'ar' : 'en');
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t('Notifications')}
                </h2>
            }
        >
            <Head title={t('Notifications')} />

            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-semibold uppercase">{t('Unread')}</p>
                                <h3 className="text-5xl font-extrabold text-white mt-2">{unreadCount}</h3>
                            </div>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                                <span className="text-4xl">📬</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-semibold uppercase">{t('Read')}</p>
                                <h3 className="text-5xl font-extrabold text-white mt-2">{readCount}</h3>
                            </div>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                                <span className="text-4xl">✅</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="flex gap-4 flex-wrap">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">{t('All Status')}</option>
                                <option value="unread">{t('Unread')}</option>
                                <option value="read">{t('Read')}</option>
                            </select>

                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">{t('All Types')}</option>
                                <option value="bus_request">{t('New Requests')}</option>
                                <option value="bus_request_status">{t('Request Updates')}</option>
                            </select>
                        </div>

                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
                                >
                                    ✓ {t('Mark all read')}
                                </button>
                            )}
                            {allNotifications.length > 0 && (
                                <button
                                    onClick={deleteAll}
                                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-700 transition-all shadow-lg"
                                >
                                    🗑️ {t('Delete All')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                {filteredNotifications.length > 0 ? (
                    <div className="space-y-4">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer ${
                                    notification.status === 'unread' ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
                                }`}
                            >
                                {/* Gradient Top Bar */}
                                <div className={`h-1 ${notification.status === 'unread' ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-300 dark:bg-gray-700'}`} />
                                
                                <div className="p-6">
                                    <div className="flex gap-4">
                                        {/* Icon */}
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${getIconColor(notification.color)}`}>
                                            <span className="text-3xl">{getIconEmoji(notification.icon)}</span>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <h4 className="font-bold text-gray-800 dark:text-white text-lg">
                                                    {notification.title}
                                                </h4>
                                                {notification.status === 'unread' && (
                                                    <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />
                                                )}
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                                                {notification.message}
                                            </p>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500 dark:text-gray-500">
                                                    {formatTime(notification.created_at)}
                                                </span>
                                                {notification.from_user_name && (
                                                    <span className="text-gray-500 dark:text-gray-500">
                                                        {isRtl ? 'من' : 'from'} <span className="font-semibold">{notification.from_user_name}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {notification.status === 'unread' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title={t('Mark as read')}
                                                >
                                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                title={t('Delete')}
                                            >
                                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-16 text-center">
                        <div className="text-8xl mb-6">🔔</div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                            {t('No Notifications')}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {t('You have no notifications matching these filters')}
                        </p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
