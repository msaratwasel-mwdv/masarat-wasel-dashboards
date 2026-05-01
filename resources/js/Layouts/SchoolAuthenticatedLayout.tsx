import { useState, PropsWithChildren, ReactNode, useEffect, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { useTheme } from "@/Contexts/ThemeContext";
import { User } from "@/types";
import { toast, ToastContainer, Bounce } from "react-toastify";
import NotificationDropdown from "@/Components/NotificationDropdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Menu,
  X,
  LayoutDashboard,
  GraduationCap,
  Users,
  Bus,
  Route as RouteIcon,
  Bell,
  Calendar,
  Map,
  Rocket,
  UserSquare2,
  Settings,
  LogOut,
  Sun,
  Moon,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
  Search,
  Navigation,
  FileText,
  Baby,
} from "lucide-react";

// تعريف عناصر القائمة لإدارة المدرسة
const getMenuItems = (isRTL: boolean) => [
  {
    label: isRTL ? "الرئيسية" : "Dashboard",
    route: "school.dashboard",
    icon: "grid",
  },
  {
    label: isRTL ? "التتبع المباشر" : "Live Tracking",
    route: "school.live-tracking.index",
    icon: "navigation",
  },
  {
    label: isRTL ? "إدارة الفصول" : "Classes Management",
    route: "school.classrooms.index",
    icon: "classes",
  },
  {
    label: isRTL ? "إدارة المعلمين" : "Teachers Management",
    route: "school.teachers.index",
    icon: "teacher",
  },
  {
    label: isRTL ? "الطلاب" : "Students",
    route: "school.students.index",
    icon: "parents",
  },
  {
    label: isRTL ? "إدارة أولياء الأمور" : "Parents Management",
    route: "school.parents.index",
    icon: "user",
  },
  {
    label: isRTL ? "الباصات" : "Buses",
    icon: "bus",
    subItems: [
      {
        label: isRTL ? "قائمة الحافلات" : "Buses List",
        route: "school.buses.index",
      },
      {
        label: isRTL ? "طلبات الحافلات" : "Bus Requests",
        route: "school.bus-requests.index",
      },
      {
        label: isRTL ? "تعيين الطلاب للباص" : "Assign Bus Students",
        route: "school.buses.students.assign",
      },
    ],
  },
  {
    label: isRTL ? "المسارات" : "Routes",
    route: "school.routes.index",
    icon: "route",
  },
  {
    label: isRTL ? "الإشعارات" : "Notifications",
    icon: "bell",
    subItems: [
      {
        label: isRTL ? "الإشعارات المرسلة" : "Sent Notifications",
        route: "school.notifications.sent",
      },
      {
        label: isRTL ? "الإشعارات المستلمة (حوادث وبلاغات)" : "Received (Incidents & Reports)",
        route: "school.notifications.received",
      },
    ],
  },
  {
    label: isRTL ? "الرحلات اليومية" : "Daily Trips",
    route: "school.trips.dashboard",
    icon: "rocket",
  },
  {
    label: isRTL ? "الرحلات الميدانية" : "Field Trips",
    route: "school.field-trips.index",
    icon: "map",
  },
  {
    label: isRTL ? "الباقات والاشتراكات" : "Plans & Billing",
    icon: "report",
    subItems: [
      {
        label: isRTL ? "مركز الاشتراكات" : "Subscription Center",
        route: "school.plans.index",
      },
      {
        label: isRTL ? "الفواتير" : "Invoices",
        route: "school.invoices.index",
      },
    ],
  },
  {
    label: isRTL ? "تقرير الحضور اليومي" : "Daily Attendance",
    route: "school.attendance.index",
    icon: "report",
  },
  {
    label: isRTL ? "طلبات الغياب" : "Absence Requests",
    route: "school.absence-requests.index",
    icon: "calendar",
  },
  {
    label: isRTL ? "الإعدادات" : "Settings",
    route: "profile.edit",
    icon: "cog",
  },
];

export default function SchoolAuthenticatedLayout({
  user: defaultUser,
  header,
  children,
}: PropsWithChildren<{ user?: User; header?: ReactNode }>) {
  const user = defaultUser || (usePage().props.auth as any).user;

  // Sidebar states
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("school-sidebar-collapsed");
      return saved === "true";
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("school-sidebar-collapsed", isCollapsed.toString());
  }, [isCollapsed]);

  const { flash } = usePage<any>().props;
  const { theme, language, toggleTheme, toggleLanguage, isRTL } = useTheme();

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success, {
        position: "top-center",
        autoClose: 3000,
        transition: Bounce,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: theme === 'dark' ? 'dark' : 'light',
      });
    }
    if (flash?.error) {
      toast.error(flash.error, {
        position: "top-center",
        autoClose: 4000,
        transition: Bounce,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: theme === 'dark' ? 'dark' : 'light',
      });
    }
  }, [flash, theme]);

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("school-sidebar-expanded");
      try { return saved ? JSON.parse(saved) : []; } catch (e) { return []; }
    }
    return [];
  });

  const sidebarNavRef = useRef<HTMLElement>(null);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem("school-sidebar-expanded", JSON.stringify(expandedMenus));
  }, [expandedMenus]);

  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem("school-sidebar-scroll");
    if (savedScrollPos && sidebarNavRef.current) {
      // Use a small delay to allow DOM to settle after navigation
      const nav = sidebarNavRef.current;
      const timer = setTimeout(() => {
        if (nav) nav.scrollTop = parseInt(savedScrollPos);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSidebarScroll = (e: React.UIEvent<HTMLElement>) => {
    sessionStorage.setItem("school-sidebar-scroll", e.currentTarget.scrollTop.toString());
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  // Layout calculations
  const rtlClasses = isRTL ? "rtl" : "ltr";
  const flexDirection = "flex-row";
  const paddingSide = isRTL ? "pr-12" : "pl-12";
  const sidebarPosition = isRTL ? "right-0" : "left-0";

  // Animation Variants
  const sidebarVariants = {
    expanded: {
      width: 260,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    },
    collapsed: {
      width: 80,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    }
  };

  const menuItems = getMenuItems(isRTL);

  // Icon renderer (using modern Lucide icons)
  const renderIcon = (name: string, isActive: boolean) => {
    const baseClass = `w-5 h-5 transition-colors duration-200 ${isActive
      ? "text-brand-yellow scale-110"
      : "text-gray-400 group-hover:text-white dark:group-hover:text-gray-200"
      }`;

    switch (name) {
      case "grid": return <LayoutDashboard className={baseClass} />;
      case "classes": return <GraduationCap className={baseClass} />;
      case "teacher": return <UserSquare2 className={baseClass} />;
      case "user": return <Users className={baseClass} />;
      case "parents": return <Baby className={baseClass} />;
      case "bus": return <Bus className={baseClass} />;
      case "route": return <RouteIcon className={baseClass} />;
      case "map": return <Map className={baseClass} />;
      case "navigation": return <Navigation className={baseClass} />;
      case "bell": return <Bell className={baseClass} />;
      case "rocket": return <Rocket className={baseClass} />;
      case "users": return <Users className={baseClass} />;
      case "report": return <FileText className={baseClass} />;
      case "calendar": return <Calendar className={baseClass} />;
      case "cog": return <Settings className={baseClass} />;
      default: return null;
    }
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex font-sans ${rtlClasses}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-[45] md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <motion.aside
        variants={sidebarVariants}
        initial={isCollapsed ? "collapsed" : "expanded"}
        animate={isCollapsed ? "collapsed" : "expanded"}
        className={`
          force-print-hide print:hidden
          bg-gradient-to-b from-brand-dark to-brand-navy dark:from-gray-900 dark:to-gray-800
          text-white flex flex-col fixed h-full z-50 shadow-sidebar overflow-hidden
          ${sidebarPosition}
          ${isMobileMenuOpen ? "translate-x-0" : isRTL ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0"}
          transition-transform duration-300 md:transition-none
        `}
      >
        {/* Logo Section */}
        <div className={`h-20 flex items-center border-b border-white/10 dark:border-gray-700 overflow-hidden ${isCollapsed ? "justify-center px-0" : "px-8"}`}>
          <Link
            href="/"
            className={`flex items-center gap-3 group ${flexDirection}`}
          >
            <div className={`rounded-xl flex items-center justify-center bg-white shadow-lg group-hover:scale-105 transition-transform ${isCollapsed ? "w-11 h-11" : "w-14 h-14"} p-1.5`}>
              <ApplicationLogo className="w-full h-full" />
            </div>

            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex flex-col ${isRTL ? "text-right" : "text-left"}`}
              >
                <span className="text-lg font-bold tracking-wider text-white whitespace-nowrap">
                  {isRTL ? "مسارات واصل" : "Masarat Wasel"}
                </span>
                <span className="text-[9px] text-gray-400 uppercase tracking-widest font-medium whitespace-nowrap">
                  {isRTL ? "لوحة المدرسة" : "School Panel"}
                </span>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Navigation Section */}
        <nav
          ref={sidebarNavRef}
          onScroll={handleSidebarScroll}
          className="flex-1 px-3 space-y-1.5 mt-8 overflow-y-auto custom-scrollbar"
        >
          {!isCollapsed && (
            <p className={`px-4 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 ${isRTL ? "text-right" : "text-left"}`}>
              {isRTL ? "القائمة الرئيسية" : "Main Menu"}
            </p>
          )}

          {menuItems.map((item) => {
            const hasActiveChild = item.subItems?.some(sub => sub.route && route().current(sub.route));
            const isActive = !!(item.route && route().current(item.route)) || !!hasActiveChild;
            const isExpanded = expandedMenus.includes(item.label) || !!hasActiveChild;

            if (item.subItems) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => {
                      if (isCollapsed) {
                        setIsCollapsed(false);
                      }
                      toggleMenu(item.label);
                    }}
                    title={isCollapsed ? item.label : ""}
                    className={`
                      w-full relative group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                      ${flexDirection}
                      ${isActive || isExpanded
                        ? "bg-brand-yellow/10 text-brand-yellow"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }
                      ${isCollapsed ? "justify-center" : ""}
                    `}
                  >
                    <span className={`${!isCollapsed ? (isRTL ? "ml-4" : "mr-4") : ""} ${isActive ? "scale-110 text-brand-yellow" : "group-hover:scale-110"} transition-transform duration-300`}>
                      {item.icon && renderIcon(item.icon, isActive)}
                    </span>

                    {!isCollapsed && (
                      <>
                        <span className={`flex-1 text-sm font-medium ${isRTL ? "text-right" : "text-left"} whitespace-nowrap`}>
                          {item.label}
                        </span>
                        <ChevronRight className={`w-4 h-4 transition-all duration-300 ${isExpanded ? "rotate-90 text-brand-yellow" : `opacity-40 group-hover:opacity-100 ${isRTL ? "rotate-180" : ""}`}`} />
                      </>
                    )}

                    {isActive && (
                      <motion.div
                        layoutId="school-active-indicator"
                        className={`absolute w-1 h-6 bg-brand-yellow rounded-full ${isRTL ? "left-0" : "right-0"}`}
                      />
                    )}
                  </button>

                  {!isCollapsed && isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={`mt-1 space-y-1 ${isRTL ? "pr-12" : "pl-12"}`}
                    >
                      {item.subItems.map((sub) => {
                        const isSubActive = route().current(sub.route);
                        return (
                          <Link
                            key={sub.label}
                            href={route(sub.route)}
                            className={`block px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                              isSubActive
                                ? "text-brand-yellow font-bold"
                                : "text-gray-400 hover:text-white"
                            } ${isRTL ? "text-right" : "text-left"}`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.route ? route(item.route) : "#"}
                title={isCollapsed ? item.label : ""}
                className={`
                  relative group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                  ${flexDirection}
                  ${isActive
                    ? "bg-brand-yellow/10 text-brand-yellow font-bold"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }
                  ${isCollapsed ? "justify-center" : ""}
                `}
              >
                <span className={`${!isCollapsed ? (isRTL ? "ml-4" : "mr-4") : ""} ${isActive ? "scale-110 text-brand-yellow" : "group-hover:scale-110"} transition-transform duration-200`}>
                  {item.icon && renderIcon(item.icon, isActive)}
                </span>

                {!isCollapsed && (
                  <span className={`flex-1 text-sm font-medium ${isRTL ? "text-right" : "text-left"} whitespace-nowrap`}>
                    {item.label}
                  </span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="school-active-indicator"
                    className={`absolute w-1 h-6 bg-brand-yellow rounded-full ${isRTL ? "left-0" : "right-0"}`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-white/10 dark:border-gray-700 bg-brand-navy/30 ${isCollapsed ? "flex flex-col items-center gap-4" : "overflow-hidden"}`}>
          <div className={`rounded-xl ${isCollapsed ? "p-1" : "p-3"} flex items-center ${flexDirection} justify-between group hover:bg-white/5 transition-colors w-full overflow-hidden`}>
            {!isCollapsed && (
              <Link
                method="post"
                href={route("logout")}
                as="button"
                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title={isRTL ? "تسجيل الخروج" : "Logout"}
              >
                <LogOut className="w-4 h-4" />
              </Link>
            )}

            <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} ${flexDirection} min-w-0`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-yellow to-yellow-600 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className={`flex flex-col ${isRTL ? "text-right" : "text-left"} overflow-hidden min-w-0`}>
                  <span className="text-sm font-bold text-white truncate" dir="auto">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase font-medium">
                    {isRTL ? "مدير المدرسة" : "School Admin"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isCollapsed && (
            <Link
              method="post"
              href={route("logout")}
              as="button"
              className="p-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
              title={isRTL ? "تسجيل الخروج" : "Logout"}
            >
              <LogOut className="w-5 h-5" />
            </Link>
          )}
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT --- */}
      <main
        style={{
          [isRTL ? 'marginRight' : 'marginLeft']: typeof window !== "undefined" && window.innerWidth >= 768 ? (isCollapsed ? "80px" : "260px") : "0px",
          transition: "margin 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        className="flex-1 min-h-screen flex flex-col relative"
      >
        {/* Top Header */}
        <header className="force-print-hide print:hidden h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 border-b border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Collapse Toggle - Desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-brand-dark dark:hover:text-white hover:bg-brand-yellow/10 transition-all border border-gray-100 dark:border-gray-600 shadow-sm"
              title={isCollapsed ? (isRTL ? "توسيع" : "Expand") : (isRTL ? "تقليص" : "Collapse")}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isCollapsed ? "collapsed" : "expanded"}
                  initial={{ rotate: isRTL ? 180 : 0, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: isRTL ? -180 : 0, opacity: 0 }}
                >
                  {isRTL ? (
                    isCollapsed ? <PanelRight className="w-5 h-5 text-brand-yellow" /> : <PanelRightClose className="w-5 h-5" />
                  ) : (
                    isCollapsed ? <PanelLeft className="w-5 h-5 text-brand-yellow" /> : <PanelLeftClose className="w-5 h-5" />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 transition-all border border-gray-100 dark:border-gray-600"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-brand-yellow" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* School Info Badge (Optional context for school layout) */}
            <div className="hidden md:flex items-center gap-3 p-1.5 pr-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
              {user?.school?.logo ? (
                <img src={user.school.logo} alt="School" className="w-11 h-11 rounded-xl object-contain bg-white p-1" />
              ) : (
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-yellow text-slate-900 shadow-lg shadow-brand-yellow/20">
                  <GraduationCap className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight">
                  {isRTL ? "لوحة المدرسة" : "School Dashboard"}
                </p>
                <h2 className="text-sm font-black text-gray-800 dark:text-white leading-tight">
                  {user?.school?.name}
                </h2>
              </div>
            </div>

            {header && (
              <>
                <div className="hidden md:block w-px h-8 bg-gray-200 dark:bg-gray-700" />
                <div className="hidden md:block text-gray-800 dark:text-white font-bold text-lg">
                  {header}
                </div>
              </>
            )}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Logout Button (Far Left in RTL) */}
            <Link
              method="post"
              href={route("logout")}
              as="button"
              className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
              title={isRTL ? "تسجيل الخروج" : "Logout"}
            >
              <LogOut className="w-5 h-5" />
            </Link>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-brand-dark dark:hover:text-white transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
              title={isRTL ? "Switch to English" : "التبديل إلى العربية"}
            >
              <span className="text-xs font-bold leading-none">
                {language === "ar" ? "EN" : "ع"}
              </span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-brand-dark dark:hover:text-white transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600"
              title={theme === "dark" ? (isRTL ? "الوضع الفاتح" : "Light Mode") : (isRTL ? "الوضع المظلم" : "Dark Mode")}
            >
              {theme === "dark" ? (
                <motion.div initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                  <Sun className="w-5 h-5 text-brand-yellow" />
                </motion.div>
              ) : (
                <motion.div initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                  <Moon className="w-5 h-5 text-gray-400" />
                </motion.div>
              )}
            </button>

            {/* Notifications Dropdown */}
            <NotificationDropdown isRTL={isRTL} />

            {/* User Profile */}
            <div className={`flex items-center gap-3 ${isRTL ? "pr-4 md:pr-6 border-r" : "pl-4 md:pl-6 border-l"} border-gray-100 dark:border-gray-700`}>
              <div className={`hidden sm:block ${isRTL ? "text-right" : "text-left"}`}>
                <p className="text-[13px] font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap truncate max-w-[120px] leading-none mb-1" dir="auto">
                  {user.name}
                </p>
                <div className={`flex items-center gap-1.5 ${flexDirection} opacity-50`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[9px] font-bold uppercase tracking-widest">
                    {isRTL ? "متصل الآن" : "Online"}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-dark dark:bg-gray-700 text-white flex items-center justify-center shadow-lg shrink-0 border-2 border-white dark:border-gray-800">
                <UserSquare2 className="w-5 h-5 text-brand-yellow" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 flex-1 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </main>
      <ToastContainer 
        theme={theme === 'dark' ? 'dark' : 'light'}
        limit={3}
        className="!top-20"
        hideProgressBar
      />
    </div>
  );
}
