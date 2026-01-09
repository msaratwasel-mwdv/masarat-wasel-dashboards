import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

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

interface NotificationDropdownProps {
    isRTL?: boolean;
}

export default function NotificationDropdown({ isRTL = false }: NotificationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/notifications');
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mark as read
    const markAsRead = async (id: number) => {
        try {
            await axios.post(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, status: 'read', read_at: new Date().toISOString() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await axios.post('/notifications/read-all');
            setNotifications(prev =>
                prev.map(n => ({ ...n, status: 'read' as const, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    // Delete notification
    const deleteNotification = async (id: number) => {
        try {
            await axios.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notifications.find(n => n.id === id)?.status === 'unread') {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch on mount and when opened
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isOpen) {
                fetchNotifications();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [isOpen]);

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, []);

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

        if (minutes < 1) return isRTL ? 'الآن' : 'Now';
        if (minutes < 60) return isRTL ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
        if (hours < 24) return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
        return isRTL ? `منذ ${days} يوم` : `${days}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-brand-dark dark:hover:text-white transition-all"
            >
                {/* Badge */}
                {unreadCount > 0 && (
                    <span className={`absolute ${isRTL ? 'left-1.5' : 'right-1.5'} top-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse`}>
                        <span className="text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
                
                {/* Bell Icon */}
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col`}>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">
                                {isRTL ? 'الإشعارات' : 'Notifications'}
                            </h3>
                            {notifications.length > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-white/90 hover:text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
                                >
                                    {isRTL ? 'تحديد الكل كمقروء' : 'Mark all read'}
                                </button>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <p className="text-sm text-white/80 mt-1">
                                {isRTL ? `${unreadCount} غير مقروء` : `${unreadCount} unread`}
                            </p>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                                    {isRTL ? 'جاري التحميل...' : 'Loading...'}
                                </p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="text-6xl mb-4">🔔</div>
                                <p className="text-gray-500 dark:text-gray-400 font-semibold">
                                    {isRTL ? 'لا توجد إشعارات' : 'No notifications'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative group ${
                                            notification.status === 'unread' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                        }`}
                                        onClick={() => {
                                            if (notification.status === 'unread') {
                                                markAsRead(notification.id);
                                            }
                                            if (notification.data?.bus_request_id) {
                                                router.visit('/admin/buses');
                                                setIsOpen(false);
                                            }
                                        }}
                                    >
                                        <div className="flex gap-3">
                                            {/* Icon */}
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconColor(notification.color)}`}>
                                                <span className="text-xl">{getIconEmoji(notification.icon)}</span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <h4 className="font-bold text-gray-800 dark:text-white text-sm">
                                                        {notification.title}
                                                    </h4>
                                                    {notification.status === 'unread' && (
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-gray-500 dark:text-gray-500">
                                                        {formatTime(notification.created_at)}
                                                    </span>
                                                    {notification.from_user_name && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-500">
                                                            {isRTL ? 'من' : 'from'} {notification.from_user_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                            >
                                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
                            <button
                                onClick={() => {
                                    router.visit('/notifications/all');
                                    setIsOpen(false);
                                }}
                                className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                            >
                                {isRTL ? 'عرض جميع الإشعارات' : 'View all notifications'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
