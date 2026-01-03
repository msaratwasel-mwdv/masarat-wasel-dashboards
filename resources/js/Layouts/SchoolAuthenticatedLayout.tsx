import { PropsWithChildren, ReactNode, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { User } from "@/types";
import useTranslation from "@/hooks/useTranslation";
import ApplicationLogo from "@/Components/ApplicationLogo";

// ✅ المعالجة الجذرية: تعريف "عقد" واضح للمكون
// الآن هو يعرف أنه يجب أن يستقبل "user" و "header" و "children"
interface LayoutProps {
    user: User;
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

  const toggleLang = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    changeLang(newLang);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };
    // قائمة الروابط الخاصة بك (تم الحفاظ عليها)
    const menuItems = [
        { label: "لوحة التحكم", route: "school.dashboard", icon: "grid" },
        {
            label: "إدارة الفصول",
            route: "school.classrooms.index",
            icon: "classes",
        },
        {
            label: "إدارة المعلمين",
            route: "school.teachers.index",
            icon: "teacher",
        },
        { label: "إدارة الطلاب", route: "school.students.index", icon: "user" },
        { label: "إدارة الحافلات", route: "#", icon: "bus" }, // رابط مؤقت
      { label: "الحضور اليومي", route: "school.reports.attendance", icon: "report" },
        { label: "الإعدادات", route: "profile.edit", icon: "cog" },
    ];

    return (
    <div
      className="min-h-screen bg-[#f1f5f9] dark:bg-gray-900 flex font-sans"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* MOBILE HEADER (Visible on small screens) */}
      <div className="fixed z-50 flex items-center justify-between w-full h-16 px-4 text-white shadow-md md:hidden bg-brand-dark">
        <div className="flex items-center">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
            <span className="mx-2 text-lg font-bold text-brand-yellow">{auth.user?.school?.name}</span>
        </div>
        <div className="flex items-center justify-center w-8 h-8 font-bold rounded-full bg-brand-yellow text-brand-dark">

        </div>
      </div>

      {/* OVERLAY for Mobile */}
      {
        isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )
      }

      {/* SIDEBAR */}
      <aside className={`
          w-64 bg-brand-dark text-white flex flex-col fixed h-full z-50 transition-transform duration-300
          ${isSidebarOpen ? "translate-x-0" : (isRtl ? "translate-x-full" : "-translate-x-full")}
          md:translate-x-0
          ${isRtl ? 'right-0' : 'left-0'}
      `}>
        {/* Logo Section */}
        <div className="flex items-center justify-center h-20 px-6 pt-4 border-b border-gray-700/50">
          <div className="relative flex items-center justify-center w-full">
            {/* Background Logo Opacity */}
            <div className="absolute scale-150 opacity-10">
              <ApplicationLogo className="w-20 h-20 text-white fill-current" />
            </div>
            <span className="relative z-10 text-2xl font-bold tracking-wide text-brand-yellow drop-shadow-md">
                {auth.user?.school?.name}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
                        const routeExists =
                            item.route !== "#" && route().has(item.route);
                        const isActive =
                            routeExists && route().current(item.route + "*");
            return (
              <Link
                key={item.label}
                                                href={routeExists ? route(item.route) : "#"}

                onClick={() => setIsSidebarOpen(false)} // Close on mobile click
                className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive
                    ? "bg-brand-yellow text-brand-dark font-bold shadow-lg shadow-yellow-500/20"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"}
                `}
              >
                <span className={`w-6 h-6 ${isRtl ? 'ml-3' : 'mr-3'}`}>
                  {/* Simple Icons based on keyword */}
                  {item.icon === 'grid' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                  {item.icon === 'user' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                  {item.icon === 'truck' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                  {item.icon === 'id-card' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .884-.896 1.688-2 1.688a1.688 1.688 0 01-2-1.688L6 6z" /></svg>}
                  {item.icon === 'shield' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                  {item.icon === 'map' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
                  {item.icon === 'document-text' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  {item.icon === 'cog' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                </span>
                <span>{t(item.label)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => route("logout")} // Inertia link preferred but verify logout method
            className="flex items-center w-full text-gray-400 transition hover:text-white"
          >
            <Link method="post" href={route("logout")} as="span" className="flex items-center w-full cursor-pointer">
              <svg className={`w-5 h-5 ${isRtl ? 'ml-3' : 'mr-3'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span>{t('Logout')}</span>
            </Link>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`
          flex-1 transition-all duration-300 pt-16 md:pt-0
          ${isRtl ? 'md:mr-64' : 'md:ml-64'}
      `}>
        <header className="sticky z-10 flex items-center justify-between h-20 px-4 bg-white border-b shadow-sm dark:bg-gray-800 md:px-8 dark:border-gray-700 top-16 md:top-0">
          <h2 className="hidden text-xl font-bold text-brand-dark dark:text-white md:block">{header}</h2>
          <h2 className="text-lg font-bold text-brand-dark dark:text-white md:hidden">{t('Dashboard')}</h2>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 text-gray-500 transition hover:text-brand-yellow">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Lang Toggle */}
            <button
              onClick={toggleLang}
              className="px-3 py-1 text-sm font-bold transition bg-gray-100 rounded-lg text-brand-dark dark:text-white dark:bg-gray-700 hover:bg-gray-200"
            >
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>

            <div className="flex items-center justify-center w-8 h-8 font-bold rounded-full shadow-md bg-brand-yellow text-brand-dark">
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 dark:text-white">
          {children}
        </div>
      </main>
    </div>
  );
}
