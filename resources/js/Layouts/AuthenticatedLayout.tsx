import { useState, PropsWithChildren, ReactNode } from "react";
import { Link, usePage } from "@inertiajs/react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { useTheme } from "@/Contexts/ThemeContext";
import { User } from "@/types";
import { ToastContainer } from "react-toastify";
import NotificationDropdown from "@/Components/NotificationDropdown";
// تعريف عناصر القائمة
const getMenuItems = (isRTL: boolean) => [
  {
    label: isRTL ? "لوحة التحكم" : "Dashboard",
    route: "admin.dashboard",
    icon: "grid",
  },
  {
    label: isRTL ? "المدارس" : "Schools",
    route: "admin.schools.index",
    icon: "school",
  },
  {
    label: isRTL ? "الحافلات" : "Buses",
    route: "admin.buses.index",
    icon: "bus",
  },
  {
    label: isRTL ? "طلبات الحافلات" : "Bus Requests",
    route: "admin.bus-requests.index",
    icon: "clipboard",
  },
  {
    label: isRTL ? "السائقين" : "Drivers",
    route: "admin.drivers.index",
    icon: "user",
  },
  {
    label: isRTL ? "المراقبه" : "assignmentHistory",
    route: "admin.assignmentHistory",
    icon: "bell",
  },
  {
    label: isRTL ? "المشرفين" : "Supervisors",
    route: "admin.supervisors.index",
    icon: "teacher",
  },
  {
    label: isRTL ? "المحادثات" : "Conversations",
    route: "admin.chat.index",
    icon: "chat",
  },
  {
    label: isRTL ? "تجربة الشات المباشرة" : "Chat Simulator",
    route: "admin.chat.simulator",
    icon: "chat-sim",
  },
  {
    label: isRTL ? "الإعدادات" : "Settings",
    route: "profile.edit",
    icon: "cog",
  },
];

export default function Authenticated({
  header,
  children,
}: PropsWithChildren<{ header?: ReactNode }>) {
  const user = usePage().props.auth.user;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, language, toggleTheme, toggleLanguage, isRTL } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  // إعادة ترتيب الفئات بناءً على اللغة
  const rtlClasses = isRTL ? "rtl" : "ltr";
  const textAlign = isRTL ? "text-right" : "text-left";
  const flexDirection = isRTL ? "flex-row-reverse" : "flex-row";
  const marginSide = isRTL ? "mr-4" : "ml-4";
  const paddingSide = isRTL ? "pr-12" : "pl-12";
  const sidebarPosition = isRTL ? "right-0" : "left-0";
  const mainMargin = isRTL ? "mr-72" : "ml-72";

  const menuItems = getMenuItems(isRTL);

  // دالة لعرض الأيقونات
  const renderIcon = (name: string, isActive: boolean) => {
    const baseClass = `w-5 h-5 transition-colors duration-200 ${
      isActive
        ? "text-brand-yellow"
        : "text-gray-400 group-hover:text-white dark:group-hover:text-gray-200"
    }`;

    switch (name) {
      case "grid":
        return (
          <svg
            className={baseClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        );
      case "school":
        return (
          <svg
            className={baseClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        );
      case "bus":
        return (
          <svg
            className={baseClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        );
      case "user":
        return (
          <svg
            className={baseClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        );
      case "bell":
        return (
          <svg
            className={baseClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        );
      case "cog":
        return (
          <svg
            className={baseClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        );
      case "chat":
        return (
          <svg
            className={baseClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case "chat-sim":
        return (
          <svg
            className={baseClass}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex font-sans ${rtlClasses}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* --- SIDEBAR --- */}
      <aside
        className={`w-72 bg-gradient-to-b from-brand-dark to-brand-navy dark:from-gray-900 dark:to-gray-800 text-white flex flex-col fixed h-full z-20 shadow-sidebar transition-all duration-300 ${sidebarPosition} ${
          isSidebarOpen
            ? "translate-x-0"
            : isRTL
            ? "translate-x-full"
            : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="h-24 flex items-center px-8 border-b border-white/10 dark:border-gray-700">
          <Link
            href="/"
            className={`flex items-center gap-3 group ${flexDirection}`}
          >
            <div className="rounded-lg flex items-center justify-center bg-white shadow-lg group-hover:scale-105 transition-transform">
              <ApplicationLogo className="w-16 h-16 p-2" />
            </div>
            <div
              className={`flex flex-col ${isRTL ? "text-right" : "text-left"}`}
            >
              <span className="text-xl font-bold tracking-wider text-white">
                {isRTL ? "مسارات واصل" : "EduTrack"}
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                {isRTL ? "لوحة الإدارة" : "Admin Panel"}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 space-y-2 mt-8 overflow-y-auto">
          <p
            className={`px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            {isRTL ? "القائمة الرئيسية" : "Main Menu"}
          </p>

          {menuItems.map((item) => {
            const isActive = !!(item.route && route().current(item.route));

            return (
              <Link
                key={item.label}
                href={item.route ? route(item.route) : "#"}
                className={`
                  relative group flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300
                  ${flexDirection}
                  ${
                    isActive
                      ? "bg-brand-yellow/20 text-brand-yellow shadow-lg"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }
                `}
                style={{
                  borderRight:
                    isActive && !isRTL ? "4px solid #facc15" : "none",
                  borderLeft: isActive && isRTL ? "4px solid #facc15" : "none",
                }}
              >
                <span
                  className={`${isRTL ? "ml-4" : "mr-4"} ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  } transition-transform duration-300`}
                >
                  {renderIcon(item.icon, isActive)}
                </span>

                <span
                  className={`flex-1 text-sm font-medium ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {item.label}
                </span>

                {/* Arrow Icon */}
                {!isActive && (
                  <svg
                    className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                      isRTL ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-white/10 dark:border-gray-700 bg-brand-navy/50">
          <div
            className={`rounded-xl p-3 flex items-center ${flexDirection} justify-between group hover:bg-white/5 transition-colors`}
          >
            <div className={`flex items-center gap-3 ${flexDirection}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-yellow to-yellow-600 flex items-center justify-center text-white font-bold shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div
                className={`flex flex-col ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                <span className="text-sm font-bold text-white">
                  {user.name}
                </span>
                <span className="text-xs text-gray-400">
                  {isRTL ? "مدير النظام" : "System Admin"}
                </span>
              </div>
            </div>

            <Link
              method="post"
              href={route("logout")}
              as="button"
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title={isRTL ? "تسجيل الخروج" : "Logout"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </Link>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? mainMargin : ""
        }`}
      >
        {/* Top Header */}
        <header className="h-20 bg-white dark:bg-gray-800 flex items-center justify-between px-8 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700 shadow-sm">
          {/* Search Bar */}
          <div className={`w-96 relative ${flexDirection}`}>
            <span
              className={`absolute ${
                isRTL ? "right-4" : "left-4"
              } top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-yellow transition-colors`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isRTL
                  ? "ابحث عن مدارس، سائقين..."
                  : "Search schools, drivers..."
              }
              className={`w-full ${paddingSide} pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 focus:border-brand-yellow transition-all text-sm font-medium dark:text-gray-200`}
            />
          </div>

          {/* Right Side Controls */}
          <div className={`flex items-center gap-4 ${flexDirection}`}>
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-brand-dark dark:hover:text-white transition-all"
              title={isRTL ? "Switch to English" : "التبديل إلى العربية"}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {language === "ar" ? "EN" : "ع"}
                </span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
              </div>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-brand-dark dark:hover:text-white transition-all"
              title={
                theme === "dark"
                  ? isRTL
                    ? "الوضع الفاتح"
                    : "Light Mode"
                  : isRTL
                  ? "الوضع المظلم"
                  : "Dark Mode"
              }
            >
              {theme === "dark" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Notifications Dropdown */}
            <NotificationDropdown isRTL={isRTL} />

            {/* User Profile */}
            <div
              className={`flex items-center gap-3 ${flexDirection} ${
                isRTL ? "pr-6 border-r" : "pl-6 border-l"
              } border-gray-100 dark:border-gray-700`}
            >
              <div
                className={`hidden md:block ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                  {isRTL ? "مدير الشركة" : "Company Admin"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isRTL ? "المقر الرئيسي" : "Headquarters"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-brand-dark dark:bg-gray-700 text-white flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {header && <div className="mb-8 animate-fade-in">{header}</div>}
            <div className="animate-slide-in">{children}</div>
          </div>
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
