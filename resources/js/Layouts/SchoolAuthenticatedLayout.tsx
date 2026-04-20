import { PropsWithChildren, ReactNode, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { User } from "@/types";
import useTranslation from "@/hooks/useTranslation";
import ApplicationLogo from "@/Components/ApplicationLogo";

// ✅ المعالجة الجذرية: تعريف "عقد" واضح للمكون
// الآن هو يعرف أنه يجب أن يستقبل "user" و "header" و "children"
interface LayoutProps {
  user?: User;
  header?: ReactNode;
}

export default function SchoolAuthenticatedLayout({
  header,
  children,
}: PropsWithChildren<LayoutProps>) {
  console.log("Authenticated layout rendering");
  const { auth } = usePage().props as any;
  const { t, lang, changeLang, isRtl } = useTranslation();

  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "dark";
    }
    return "dark";
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

  const toggleLang = () => {
    const newLang = lang === "ar" ? "en" : "ar";
    changeLang(newLang);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };
  // قائمة الروابط الخاصة بك (تم الحفاظ عليها)
  // قائمة الروابط الخاصة بك
  const menuItems = [
    {
      label: isRtl ? "الرئيسية" : "Dashboard",
      route: "school.dashboard",
      icon: "grid",
    },
    {
      label: isRtl ? "إدارة الفصول" : "Classes Management",
      route: "school.classrooms.index",
      icon: "classes",
    },
    {
      label: isRtl ? "إدارة المعلمين" : "Teachers Management",
      route: "school.teachers.index",
      icon: "teacher",
    },

    {
      label: isRtl ? "الطلاب" : "Students",
      route: "school.students.index",
      icon: "user",
    },
    {
      label: isRtl ? "الباصات" : "Buses",
      route: "school.buses.index",
      icon: "bus",
    },
    {
      label: isRtl ? "طلبات الحافلات" : "Bus Requests",
      route: "school.bus-requests.index",
      icon: "rocket",
    },
    {
      label: isRtl ? "المسارات" : "Routes",
      route: "school.routes.index",
      icon: "map",
    },

    {
      label: isRtl ? "التتبع المباشر" : "Live Tracking",
      route: "school.live-tracking.index",
      icon: "map",
    },
    {
      label: isRtl ? "تعيين الطلاب للباص" : "Assign Bus Students",
      route: "school.buses.students.assign",
      icon: "users",
    },
    {
      label: isRtl ? "الإشعارات" : "Notifications",
      route: "school.notifications.index",
      icon: "bell",
    },

    {
      label: isRtl ? "لوحة الرحلات" : "Trips Dashboard",
      route: "school.trips.dashboard",
      icon: "rocket",
    },
    {
      label: isRtl ? "الرحلات الميدانية" : "Field Trips",
      route: "school.field-trips.index",
      icon: "map",
    },
    {
      label: isRtl ? "تقرير الحضور اليومي" : "Daily Attendance",
      route: "school.reports.attendance",
      icon: "report",
    },
    {
      label: isRtl ? "طلبات الغياب" : "Absence Requests",
      route: "school.absence-requests.index",
      icon: "calendar",
    },
    {
      label: isRtl ? "الإعدادات" : "Settings",
      route: "profile.edit",
      icon: "cog",
    },
  ];

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex font-sans selection:bg-brand-yellow/30"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* MOBILE NAVIGATION BAR */}
      <div className="force-print-hide print:hidden fixed top-0 z-[60] flex items-center justify-between w-full h-16 px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            {auth.user?.school?.logo ? (
              <img
                src={auth.user.school.logo}
                alt="School Logo"
                className="w-8 h-8 rounded-lg object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-yellow/10 text-brand-yellow">
                <span className="text-sm font-bold uppercase">
                  {auth.user?.school?.name?.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-sm font-bold truncate max-w-[150px] text-slate-800 dark:text-white">
              {auth.user?.school?.name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            onClick={toggleLang}
            className="px-2 py-1 text-xs font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`force-print-hide print:hidden
                    fixed inset-y-0 z-50 w-72 bg-slate-900 dark:bg-slate-950 text-white flex flex-col transition-all duration-300 ease-in-out border-r border-white/5 shadow-2xl
                    ${isSidebarOpen
            ? "translate-x-0"
            : isRtl
              ? "translate-x-full"
              : "-translate-x-full"
          }
                    md:translate-x-0
                    ${isRtl ? "right-0 border-l" : "left-0 border-r"}
                `}
      >
        {/* BRANDING SECTION */}
        <div className="flex flex-col items-center justify-center pt-8 pb-6 px-6">
          <div className="p-2 bg-white/5 rounded-2xl">
            <img
              src="/assets/images/masarat-wasel-logo.jpg"
              alt="Masarat Wasel"
              className="h-16 object-contain rounded-xl"
            />
          </div>
        </div>

        <div className="px-6 py-4">
          <hr className="border-white/5" />
        </div>

        {/* MENU SECTION */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar pt-2 hide-scrollbar">
          <p className="px-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {t("Main Menu")}
          </p>
          {menuItems.map((item) => {
            const routeExists = item.route !== "#" && route().has(item.route);
            const isActive = routeExists && route().current(item.route + "*");
            return (
              <Link
                key={item.label}
                href={routeExists ? route(item.route) : "#"}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                                    group flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden
                                    ${isActive
                    ? "bg-brand-yellow text-slate-900 font-bold shadow-lg shadow-brand-yellow/20"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }
                                `}
              >
                <span
                  className={`w-5 h-5 ${isRtl ? "ml-4" : "mr-4"
                    } transition-transform group-hover:scale-110 duration-200`}
                >
                  {/* SVG Icons (Simplified) */}
                  {item.icon === "grid" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  )}
                  {item.icon === "classes" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  )}
                  {item.icon === "teacher" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  )}
                  {item.icon === "user" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  )}
                  {item.icon === "bus" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  )}
                  {item.icon === "users" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  )}
                  {item.icon === "report" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}
                  {item.icon === "bell" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  )}
                  {item.icon === "calendar" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                  {item.icon === "map" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  )}
                  {item.icon === "rocket" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.585 15.585a6.267 6.267 0 001.188-8.844m-5.454 1.151a6.26 6.26 0 108.159 8.159m-8.158-8.158L3 3m3 3l.857.857m0 0L12 14.286m0 0l.857.857m0 0L21 21m-9-6.714V21m0-13.714V3m-3.429 8.571H3m13.714 0H21"
                      />
                    </svg>
                  )}
                  {item.icon === "cog" && (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  )}
                </span>
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <div
                    className={`absolute ${isRtl ? "left-0" : "right-0"
                      } w-1 h-6 bg-slate-900 rounded-full`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* USER SECTION AT BOTTOM */}
        <div className="p-4 mx-4 mb-6 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center text-slate-900 font-bold shadow-lg shadow-brand-yellow/20">
              {auth.user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">
                {auth.user.name}
              </p>
              <p className="text-[10px] text-slate-500 truncate lowercase">
                {auth.user.email}
              </p>
            </div>
          </div>
          <Link
            method="post"
            href={route("logout")}
            className="flex items-center justify-center w-full gap-2 py-2.5 text-xs font-bold text-slate-400 transition-colors rounded-xl hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20"
          >
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>{t("Logout")}</span>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main
        className={`
                    flex-1 flex flex-col transition-all duration-300 min-h-screen
                    ${isRtl ? "md:mr-72" : "md:ml-72"}
                `}
      >
        {/* DESKTOP HEADER */}
        <header className="force-print-hide print:hidden sticky top-0 z-40 hidden md:flex items-center justify-between h-20 px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 p-1.5 pr-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5">
              {auth.user?.school?.logo ? (
                <img
                  src={auth.user.school.logo}
                  alt="School Logo"
                  className="w-11 h-11 rounded-xl object-contain bg-white p-1"
                />
              ) : (
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-yellow text-slate-900 shadow-lg shadow-brand-yellow/20">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                    />
                  </svg>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
                  {t("School Dashboard")}
                </p>
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                  {auth.user?.school?.name}
                </h2>
              </div>
            </div>

            {header && (
              <>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                <div className="text-slate-800 dark:text-white font-bold text-lg">
                  {header}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              className="p-2.5 text-slate-500 hover:text-brand-yellow transition-colors rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5"
              title={theme === "light" ? t("Dark Mode") : t("Light Mode")}
            >
              {theme === "light" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>

            {/* LANGUAGE TOGGLE */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-brand-yellow border border-slate-200/50 dark:border-white/5 transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5a18.022 18.022 0 01-3.827-5.806m6.3 0c-.593 2.515-2.149 4.95-3.596 6.53m4.346-6.53a15.938 15.938 0 01-1.442 4.194m-6.327-4.194c.312.92.744 1.815 1.285 2.651m8.66-8.651L15 7m-5 9.5l-1.5 1.5M11 7L2 7M7 11h8"
                />
              </svg>
              {lang === "ar" ? "English" : "العربية"}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 p-4 md:p-8 pt-20 md:pt-8 bg-[#F8FAFC] dark:bg-slate-950 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
            {/* Flash Messages Display */}
            {(usePage().props.flash as any)?.success && (
              <div className="mb-6 p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50 rounded-3xl flex items-center gap-4 text-emerald-700 dark:text-emerald-400 animate-slideDown shadow-sm">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-lg shadow-lg">✓</div>
                <div className="flex-1 font-bold text-sm">{(usePage().props.flash as any).success}</div>
              </div>
            )}

            {(usePage().props.flash as any)?.error && (
              <div className="mb-6 p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-3xl flex items-center gap-4 text-red-700 dark:text-red-400 animate-slideDown shadow-sm">
                <div className="w-10 h-10 bg-red-500 text-white rounded-2xl flex items-center justify-center text-lg shadow-lg">✕</div>
                <div className="flex-1 font-bold text-sm">{(usePage().props.flash as any).error}</div>
              </div>
            )}

            {children}
          </div>
        </div>
      </main>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `,
        }}
      />
    </div>
  );
}
