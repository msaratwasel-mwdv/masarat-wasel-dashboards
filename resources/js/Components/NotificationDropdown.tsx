import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Bell, CheckCircle, AlertTriangle, Info, Trash2, Bus as BusIcon, User } from "lucide-react";

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
            const response = await axios.get('/admin/notifications');
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
            await axios.post(`/admin/notifications/${id}/read`);
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
            await axios.post('/admin/notifications/read-all');
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
            await axios.delete(`/admin/notifications/${id}`);
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

    const getIcon = (type: string, color: string) => {
        const baseClass = "w-6 h-6";
        switch (type) {
            case 'bus_request':
            case 'bus':
                return <BusIcon className={baseClass} />;
            case 'check-circle':
            case 'success':
                return <CheckCircle className={baseClass} />;
            case 'warning':
                return <AlertTriangle className={baseClass} />;
            case 'info':
                return <Info className={baseClass} />;
            default:
                return <Bell className={baseClass} />;
        }
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
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-3 w-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 max-h-[600px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
                    {/* Header */}
                    <div className="p-5 bg-gradient-to-br from-brand-dark to-brand-navy dark:from-gray-900 dark:to-gray-800 border-b border-white/10">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-brand-yellow/20 flex items-center justify-center text-brand-yellow">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </span>
                                {isRTL ? 'الإشعارات' : 'Notifications'}
                            </h3>
                            {notifications.length > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[11px] font-bold text-brand-yellow bg-brand-yellow/10 hover:bg-brand-yellow/20 px-3 py-1.5 rounded-lg transition-all border border-brand-yellow/20"
                                >
                                    {isRTL ? 'تحديد الكل كمقروء' : 'Mark all read'}
                                </button>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <p className="text-xs text-brand-yellow/80 mt-2 font-medium bg-brand-yellow/10 inline-block px-2 py-0.5 rounded-full border border-brand-yellow/10">
                                {isRTL ? `${unreadCount} تنبيهات جديدة` : `${unreadCount} new alerts`}
                            </p>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin w-10 h-10 border-4 border-brand-yellow border-t-transparent rounded-full mx-auto" />
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 animate-pulse uppercase tracking-widest font-bold">
                                    {isRTL ? 'جاري التحميل...' : 'Loading...'}
                                </p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-16 text-center">
                                <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Bell className="w-12 h-12 text-gray-400" />
                                </div>
                                <p className="text-gray-800 dark:text-white font-bold text-lg">
                                    {isRTL ? 'القائمة فارغة' : 'Inbox is empty'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {isRTL ? 'لا توجد إشعارات جديدة في سحابتك' : 'No new notifications in your cloud'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-brand-navy/10 transition-colors cursor-pointer relative group ${
                                            notification.status === 'unread' ? 'bg-brand-yellow/5' : ''
                                        }`}
                                        onClick={() => {
                                            if (notification.status === 'unread') markAsRead(notification.id);
                                            if (notification.data?.bus_request_id) {
                                                router.visit('/admin/bus-requests');
                                                setIsOpen(false);
                                            }
                                        }}
                                    >
                                        <div className="flex gap-4">
                                            {/* Icon */}
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
                                                notification.status === 'unread' 
                                                    ? 'bg-white dark:bg-gray-700 border-brand-yellow/30' 
                                                    : 'bg-gray-50 dark:bg-gray-800 border-transparent opacity-60'
                                            }`}>
                                                <div className={notification.status === 'unread' ? 'text-brand-dark dark:text-brand-yellow' : 'text-gray-400'}>
                                                    {getIcon(notification.icon, notification.color)}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`font-bold text-sm truncate ${
                                                        notification.status === 'unread' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                        {notification.title}
                                                    </h4>
                                                    {notification.status === 'unread' && (
                                                        <span className="w-2.5 h-2.5 bg-brand-yellow rounded-full flex-shrink-0 animate-pulse-slow shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                                                    )}
                                                </div>
                                                <p className={`text-[13px] line-clamp-2 ${
                                                    notification.status === 'unread' ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'
                                                }`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex justify-between items-center mt-3">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                        {formatTime(notification.created_at)}
                                                    </span>
                                                    {notification.from_user_name && (
                                                        <span className="text-[10px] font-medium text-brand-navy/60 dark:text-white/40 italic">
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
                                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    router.visit('/admin/notifications/all');
                                    setIsOpen(false);
                                }}
                                className="w-full py-3 bg-white dark:bg-gray-800 text-sm text-brand-navy dark:text-white hover:text-brand-yellow dark:hover:text-brand-yellow font-bold rounded-xl transition-all shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700"
                            >
                                {isRTL ? 'عرض جميع الإشعارات' : 'View full history'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
