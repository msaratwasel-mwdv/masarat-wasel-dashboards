import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useTheme } from "@/Contexts/ThemeContext";
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Trash2, 
  Inbox, 
  User, 
  Filter,
  CheckCheck,
  Calendar,
  Bus as BusIcon
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  from_user_name: string;
  status: "unread" | "read";
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
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredNotifications = allNotifications.filter((n) => {
    const matchesStatus = statusFilter === "all" || n.status === statusFilter;
    const matchesType = typeFilter === "all" || n.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const unreadCount = allNotifications.filter((n) => n.status === "unread").length;
  const readCount = allNotifications.filter((n) => n.status === "read").length;

  const markAsRead = (id: number) => {
    router.post(`/admin/notifications/${id}/read`, {}, { preserveScroll: true });
  };

  const markAllAsRead = () => {
    router.post("/admin/notifications/read-all", {}, { preserveScroll: true });
  };

  const deleteNotification = (id: number) => {
    if (confirm(isRTL ? "هل أنت متأكد من حذف هذا الإشعار؟" : "Are you sure you want to delete this notification?")) {
      router.delete(`/admin/notifications/${id}`, { preserveScroll: true });
    }
  };

  const deleteAll = () => {
    if (confirm(isRTL ? "هل أنت متأكد من مسح جميع الإشعارات؟" : "Are you sure you want to clear all notifications?")) {
      router.delete("/admin/notifications", { preserveScroll: true });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === "unread") {
      markAsRead(notification.id);
    }
    if (notification.data?.bus_request_id) {
      router.visit(route("admin.bus-requests.index"));
    }
  };

  const getIcon = (type: string) => {
    const baseClass = "w-6 h-6";
    switch (type) {
      case "bus_request":
      case "bus":
        return <BusIcon className={baseClass} />;
      case "check-circle":
      case "success":
        return <CheckCircle className={baseClass} />;
      case "warning":
        return <AlertTriangle className={baseClass} />;
      case "info":
        return <Info className={baseClass} />;
      default:
        return <Bell className={baseClass} />;
    }
  };

  const getIconStyles = (color: string) => {
    switch (color) {
      case "blue":
        return isDark ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-50 text-blue-600 border-blue-100";
      case "green":
        return isDark ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-green-50 text-green-600 border-green-100";
      case "red":
        return isDark ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-50 text-red-600 border-red-100";
      case "yellow":
        return isDark ? "bg-brand-yellow/20 text-brand-yellow border-brand-yellow/30" : "bg-brand-yellow/10 text-brand-dark border-brand-yellow/20";
      default:
        return isDark ? "bg-gray-500/20 text-gray-400 border-gray-500/30" : "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return isRTL ? "الآن" : "Just now";
    if (minutes < 60) return isRTL ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    if (hours < 24) return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
    if (days < 7) return isRTL ? `منذ ${days} يوم` : `${days}d ago`;
    return date.toLocaleDateString(isRTL ? "ar" : "en");
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className={`font-semibold text-xl ${isDark ? "text-gray-200" : "text-gray-800"} leading-tight`}>
          {isRTL ? "مركز الإشعارات" : "Notification Center"}
        </h2>
      }
    >
      <Head title={isRTL ? "الإشعارات" : "Notifications"} />

      {/* --- Page Header --- */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className={isRTL ? "text-right" : "text-left"}>
          <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-brand-dark"} mb-1`}>
            {isRTL ? "الإشعارات" : "Notifications"}
          </h1>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {isRTL ? "إدارة وتتبع تنبيهات النظام والنشاطات" : "Manage and track system alerts and activities"}
          </p>
        </div>

        <div className="flex gap-3">
          {unreadCount > 0 && (
            <PrimaryButton
              onClick={markAllAsRead}
              className="flex items-center px-6 py-3 bg-brand-yellow text-brand-dark font-bold rounded-full shadow-md hover:shadow-lg transition-all"
            >
              <CheckCheck className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
              {isRTL ? "تحديد الكل كمقروء" : "Mark All Read"}
            </PrimaryButton>
          )}
          {allNotifications.length > 0 && (
            <SecondaryButton
              onClick={deleteAll}
              className="flex items-center px-6 py-3 font-bold rounded-full transition-all border-red-500 text-red-500 hover:bg-red-50"
            >
              <Trash2 className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
              {isRTL ? "مسح السجل" : "Clear History"}
            </SecondaryButton>
          )}
        </div>
      </div>

      {/* --- Stats Summary --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          { label: isRTL ? "الإجمالي" : "Total", value: allNotifications.length, icon: Inbox, color: "gray" },
          { label: isRTL ? "غير مقروء" : "Unread", value: unreadCount, icon: Bell, color: "yellow" },
          { label: isRTL ? "تم العرض" : "Viewed", value: readCount, icon: CheckCircle, color: "green" },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-2xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} shadow-sm transition-all hover:shadow-md`}>
            <div className={`flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className={`text-3xl font-black mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl ${getIconStyles(stat.color)}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Filter Bar --- */}
      <div className={`mb-6 p-4 rounded-2xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm"} flex flex-col md:flex-row gap-4 items-center`}>
        <div className={`flex-1 flex gap-4 w-full ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="relative flex-1 max-w-xs">
            <Filter className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`w-full py-2.5 ${isRTL ? "pr-10" : "pl-10"} bg-transparent border-none rounded-xl text-sm font-bold focus:ring-0 ${isDark ? "text-white" : "text-gray-700"}`}
            >
              <option value="all">{isRTL ? "جميع الحالات" : "All Status"}</option>
              <option value="unread">{isRTL ? "غير مقروء" : "Unread"}</option>
              <option value="read">{isRTL ? "مقروء" : "Read"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- Notifications Content --- */}
      <div className="grid grid-cols-1 gap-4">
        {filteredNotifications.length === 0 ? (
          <div className={`text-center py-20 rounded-3xl border ${isDark ? "bg-gray-800 border-gray-700 text-gray-500" : "bg-white border-gray-100 text-gray-400"} shadow-sm`}>
            <Inbox className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-bold">{isRTL ? "لا توجد إشعارات حالياً" : "No notifications found"}</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                notification.status === "unread"
                  ? isDark 
                    ? "bg-brand-yellow/5 border-brand-yellow/30" 
                    : "bg-white border-brand-yellow/40 shadow-sm"
                  : isDark
                    ? "bg-gray-800/50 border-gray-700 opacity-80"
                    : "bg-white border-gray-100 shadow-sm"
              } hover:shadow-md hover:-translate-y-0.5`}
            >
              <div className={`flex items-start gap-4 sm:gap-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                {/* Icon Wrapper */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-sm transition-transform group-hover:scale-105 ${getIconStyles(notification.color)}`}>
                  {getIcon(notification.icon)}
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : "text-left"}`}>
                  <div className={`flex justify-between items-center mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <h3 className={`text-lg font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">
                        {formatTime(notification.created_at)}
                      </span>
                      {notification.status === "unread" && (
                        <span className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm leading-relaxed mb-4 ${isDark ? "text-gray-400" : "text-gray-600"} line-clamp-2`}>
                    {notification.message}
                  </p>

                  <div className={`flex items-center gap-4 text-[11px] font-bold uppercase tracking-tight text-gray-400 ${isRTL ? "flex-row-reverse" : ""}`}>
                    {notification.from_user_name && (
                      <span className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        {isRTL ? `كُتب بواسطة: ${notification.from_user_name}` : `By: ${notification.from_user_name}`}
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(notification.created_at).toLocaleDateString(isRTL ? "ar" : "en")}
                    </span>
                  </div>
                </div>

                {/* Floating Actions */}
                <div className={`flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 ${isRTL ? "left-6" : "right-6"}`}>
                  {notification.status === "unread" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                      className="p-2.5 bg-brand-yellow text-brand-dark rounded-xl shadow-lg transition-transform hover:scale-110"
                      title={isRTL ? "تحديد كمقروء" : "Mark as read"}
                    >
                      <CheckCheck className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                    className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl transition-transform hover:scale-110"
                    title={isRTL ? "حذف" : "Delete"}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AuthenticatedLayout>
  );
}
