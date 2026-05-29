import { useState, PropsWithChildren, ReactNode, useEffect, useRef } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import ApplicationLogo from "@/Components/ApplicationLogo";
import { useTheme } from "@/Contexts/ThemeContext";
import { User } from "@/types";
import { toast, ToastContainer, Bounce } from "react-toastify";
import NotificationDropdown from "@/Components/NotificationDropdown";
import { useEchoEvent } from "@/hooks/useEcho";
import { useRealtimeToast } from "@/hooks/useRealtimeToast";
import useTranslation from "@/hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LayoutDashboard,
  School,
  Route as RouteIcon,
  Bus,
  ClipboardList,
  Users,
  UserSquare2,
  Search,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
  Sun,
  Moon,
  Map,
  Video,
} from "lucide-react";

// تعريف عناصر القائمة
const getMenuItems = (isRTL: boolean) => [
  {
    label: isRTL ? "لوحة التحكم" : "Dashboard",
    route: "admin.dashboard",
    icon: "grid",
  },
  {
    label: isRTL ? "المدارس" : "Schools",
    icon: "school",
    subItems: [
      {
        label: isRTL ? "قائمة المدارس" : "Schools List",
        route: "admin.schools.index",
      },
      {
        label: isRTL ? "التقويم الدراسي" : "Academic Calendar",
        route: "admin.academic-calendars.index",
      },
      {
        label: isRTL ? "إدارة العطل" : "Holidays",
        route: "admin.holidays.index",
      },
    ],
  },
  {
    label: isRTL ? "المستخدمين" : "Users",
    icon: "user",
    subItems: [
      {
        label: isRTL ? "السائقين" : "Drivers",
        route: "admin.drivers.index",
      },
      {
        label: isRTL ? "مشرفات الحافلات" : "Bus Supervisors",
        route: "admin.assistants.index",
      },
      {
        label: isRTL ? "المشرفين الميدانيين" : "Field Supervisors",
        route: "admin.field-supervisors.index",
      },
      {
        label: isRTL ? "مدراء المدارس" : "School Admins",
        route: "admin.school-admins.index",
      },
    ],
  },
  {
    label: isRTL ? "الحافلات" : "Buses",
    icon: "bus",
    subItems: [
      {
        label: isRTL ? "قائمة الحافلات" : "Buses List",
        route: "admin.buses.index",
      },
      {
        label: isRTL ? "مصاريف الحافلات" : "Bus Expenses",
        route: "admin.bus-expenses.index",
      },
      {
        label: isRTL ? "طلبات الحافلات" : "Bus Requests",
        route: "admin.bus-requests.index",
      },
      {
        label: isRTL ? "المسارات" : "Routes",
        route: "admin.routes.index",
      },
    ],
  },
  {
    label: isRTL ? "الرقابة الميدانية" : "Field Operations",
    icon: "search",
    subItems: [
      {
        label: isRTL ? "مراقبة الطوارئ" : "Emergency Monitor",
        route: "admin.emergencies.index",
      },
      {
        label: isRTL ? "سجل المخالفات" : "Violations Log",
        route: "admin.field-reports.index",
      },
      {
        label: isRTL ? "سجلات الفحص" : "Inspection Logs",
        route: "admin.inspection-logs.index",
      },
      {
        label: isRTL ? "إدارة بنود الفحص" : "Checklist Manager",
        route: "admin.inspection-items.index",
      },
      /*       {
        label: isRTL ? "سجل التعيينات" : "Assignment History",
        route: "admin.assignmentHistory",
      }, */
      {
        label: isRTL ? "سجلات التأخير" : "Delay Logs",
        route: "admin.delay-logs.index",
      },
    ],
  },
  {
    label: isRTL ? "الاشتراكات والمالية" : "Plans & Billing",
    icon: "clipboard",
    subItems: [
      {
        label: isRTL ? "إدارة الباقات" : "Plans Management",
        route: "admin.plans.index",
      },
      {
        label: isRTL ? "الاشتراكات" : "Subscriptions",
        route: "admin.subscriptions.index",
      },
      {
        label: isRTL ? "الأقساط والدفعات" : "Installments",
        route: "admin.installments.index",
      },
      {
        label: isRTL ? "سجل المعاملات" : "Transactions History",
        route: "admin.transactions.index",
      },
    ],
  },
  {
    label: isRTL ? "التقارير التحليلية" : "Analytics Hub",
    icon: "clipboard",
    subItems: [
      {
        label: isRTL ? "لوحة التقارير" : "Reports Dashboard",
        route: "admin.analytics.index",
      },
      {
        label: isRTL ? "الأداء التشغيلي" : "Operational Reports",
        route: "admin.analytics.operational",
      },
      {
        label: isRTL ? "تحليلات السائقين" : "Driver Analytics",
        route: "admin.analytics.drivers",
      },
      {
        label: isRTL ? "التقارير المالية" : "Financial Reports",
        route: "admin.analytics.financial",
      },
      {
        label: isRTL ? "تحليلات الطلاب" : "Student Insights",
        route: "admin.analytics.students",
      },
    ],
  },
  {
    label: isRTL ? "المحادثات" : "Conversations",
    route: "admin.chat.index",
    icon: "chat",
  },
  {
    label: isRTL ? "إدارة المحتوى" : "Content Management",
    icon: "clipboard",
    subItems: [
      {
        label: isRTL ? "الفعاليات والأخبار" : "News & Events",
        route: "admin.events.index",
      },
    ],
  },
  {
    label: isRTL ? "الرحلات الميدانية" : "Field Trips",
    route: "admin.field-trips.index",
    icon: "map",
  },
  {
    label: isRTL ? "الرحلات اليومية" : "Daily Trips",
    route: "admin.daily-trips.index",
    icon: "grid",
  },
  {
    label: isRTL ? "الإعدادات" : "Settings",
    route: "profile.edit",
    icon: "cog",
  },
];

export default function Authenticated({
  user: defaultUser,
  header,
  children,
}: PropsWithChildren<{ user?: User; header?: ReactNode }>) {
  const user = defaultUser || usePage().props.auth.user;

  // Sidebar states
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin-sidebar-collapsed");
      return saved === "true";
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resizing and mobile state tracking
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", isCollapsed.toString());
  }, [isCollapsed]);

  const { theme, language, toggleTheme, toggleLanguage, isRTL } = useTheme();
  const { notifyEvent } = useRealtimeToast();

  // Global Real-time Listeners for Admin
  useEchoEvent(
    'private',
    'admin.emergencies',
    '.emergency.reported',
    (e: any) => {
      notifyEvent('emergency', isRTL ? 'تنبيه طوارئ جديد!' : 'New Emergency Alert!', e.description || e.type);
      if (typeof window !== 'undefined' && !route().current('admin.emergencies.index')) {
        router.reload({ only: ['active_emergencies_count'], preserveState: true });
      }
    }
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin-sidebar-expanded");
      try { return saved ? JSON.parse(saved) : []; } catch(e) { return []; }
    }
    return [];
  });

  const sidebarNavRef = useRef<HTMLElement>(null);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem("admin-sidebar-expanded", JSON.stringify(expandedMenus));
  }, [expandedMenus]);

  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem("admin-sidebar-scroll");
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
    sessionStorage.setItem("admin-sidebar-scroll", e.currentTarget.scrollTop.toString());
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const { t } = useTranslation();
  const pageProps = usePage<any>().props;
  const { flash } = pageProps;
  const pending_bus_requests_count = (pageProps.pending_bus_requests_count as number) || 0;
  const active_emergencies_count = (pageProps.active_emergencies_count as number) || 0;
  const notifications_count = (pageProps.notifications_count as number) || 0;
  const lastShownToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (flash?.success && flash.success !== lastShownToastRef.current) {
      toast.success(t(flash.success), {
        toastId: `success-${flash.success}`,
        position: "top-center",
        autoClose: 3000,
        transition: Bounce,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: theme === 'dark' ? 'dark' : 'light',
      });
      lastShownToastRef.current = flash.success;
    }
    
    if (flash?.error && flash.error !== lastShownToastRef.current) {
      toast.error(t(flash.error), {
        toastId: `error-${flash.error}`,
        position: "top-center",
        autoClose: 4000,
        transition: Bounce,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: theme === 'dark' ? 'dark' : 'light',
      });
      lastShownToastRef.current = flash.error;
    }

    // Reset ref when flash is empty to allow showing the same message again if it comes back
    if (!flash?.success && !flash?.error) {
        lastShownToastRef.current = null;
    }
  }, [flash]);

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
      case "school": return <School className={baseClass} />;
      case "bus": return <Bus className={baseClass} />;
      case "user": return <Users className={baseClass} />;
      case "chat": return <MessageSquare className={baseClass} />;
      case "clipboard": return <ClipboardList className={baseClass} />;
      case "teacher": return <UserSquare2 className={baseClass} />;
      case "search": return <Search className={baseClass} />;
      case "map": return <Map className={baseClass} />;
      case "route": return <RouteIcon className={baseClass} />;
      case "calendar": return <Bell className={baseClass} />;
      case "video": return <Video className={baseClass} />;
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
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <motion.aside
        variants={sidebarVariants}
        initial={isMobile ? "expanded" : (isCollapsed ? "collapsed" : "expanded")}
        animate={isMobile ? "expanded" : (isCollapsed ? "collapsed" : "expanded")}
        className={`
          bg-gradient-to-b from-brand-dark to-brand-navy dark:from-gray-900 dark:to-gray-800
          text-white flex flex-col fixed inset-y-0 h-full z-50 shadow-sidebar overflow-hidden
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
            <div className={`rounded-xl flex items-center justify-center bg-white shadow-lg group-hover:scale-105 transition-transform ${isCollapsed ? "w-11 h-11" : "w-16 h-16"} p-1`}>
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
                  {isRTL ? "لوحة الإدارة" : "Admin Panel"}
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
                        layoutId="active-indicator"
                        className={`absolute w-1 h-6 bg-brand-yellow rounded-full ${isRTL ? "left-0" : "right-0"}`}
                      />
                    )}
                  </button>

                  {!isCollapsed && isExpanded && (
                    <div className={`mt-1 space-y-1 ${isRTL ? "pr-12" : "pl-12"}`}>
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
                            <div className="flex items-center justify-between w-full">
                              <span>{sub.label}</span>
                              {sub.route === 'admin.bus-requests.index' && pending_bus_requests_count > 0 && (
                                <motion.span 
                                  initial={{ scale: 0 }} 
                                  animate={{ scale: 1 }}
                                  className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm ml-2"
                                >
                                  {pending_bus_requests_count}
                                </motion.span>
                              )}
                              {sub.route === 'admin.emergencies.index' && active_emergencies_count > 0 && (
                                <motion.span 
                                  initial={{ scale: 0 }} 
                                  animate={{ scale: 1 }}
                                  className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm ml-2"
                                >
                                  {active_emergencies_count}
                                </motion.span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
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
                  <span className={`flex-1 text-sm font-medium ${isRTL ? "text-right" : "text-left"} whitespace-nowrap flex items-center justify-between`}>
                    <span>{item.label}</span>

                    {/* Badge for Conversations */}
                    {item.route === 'admin.chat.index' && notifications_count > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="bg-brand-yellow text-brand-dark text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm ml-2"
                      >
                        {notifications_count}
                      </motion.span>
                    )}

                    {/* Parent Badge for Field Operations (Emergencies) */}
                    {item.label === (isRTL ? "الرقابة الميدانية" : "Field Operations") && active_emergencies_count > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm ml-2"
                      >
                        {active_emergencies_count}
                      </motion.span>
                    )}

                    {/* Parent Badge for Buses (Requests) */}
                    {item.label === (isRTL ? "الحافلات" : "Buses") && pending_bus_requests_count > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="bg-brand-yellow text-brand-dark text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm ml-2"
                      >
                        {pending_bus_requests_count}
                      </motion.span>
                    )}
                  </span>
                )}

                {/* Collapsed Indicator Dot */}
                {isCollapsed && (
                  <>
                    {(item.route === 'admin.chat.index' && notifications_count > 0) && (
                      <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-brand-yellow rounded-full border-2 border-brand-dark shadow-sm" />
                    )}
                    {(item.label === (isRTL ? "الرقابة الميدانية" : "Field Operations") && active_emergencies_count > 0) && (
                      <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brand-dark shadow-sm" />
                    )}
                    {(item.label === (isRTL ? "الحافلات" : "Buses") && pending_bus_requests_count > 0) && (
                      <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-brand-yellow rounded-full border-2 border-brand-dark shadow-sm" />
                    )}
                  </>
                )}

                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
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
                    {isRTL ? "مدير النظام" : "Admin"}
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
        className={`
          flex-1 min-h-screen flex flex-col relative transition-all duration-300
          ${isRTL 
            ? (isCollapsed ? "md:mr-20" : "md:mr-[260px]") 
            : (isCollapsed ? "md:ml-20" : "md:ml-[260px]")
          }
        `}
      >
        {/* Top Header */}
        <header className="h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 border-b border-gray-100 dark:border-gray-700 shadow-sm">
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

            {/* Search Bar */}
            <div className="hidden lg:flex w-96 relative group">
              <span className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-yellow transition-colors`}>
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? "ابحث عن ..." : "Quick Search ..."}
                className={`w-full ${isRTL ? "pr-11 pl-4" : "pl-11 pr-4"} py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow/20 focus:border-brand-yellow/40 transition-all text-sm font-medium dark:text-gray-200`}
              />
            </div>
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
                  <p className="text-[9px] font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-dark dark:bg-gray-700 text-white flex items-center justify-center shadow-lg shrink-0 border-2 border-white dark:border-gray-800">
                <UserSquare2 className="w-5 h-5 text-brand-yellow" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 flex-1">
          <div className="max-w-7xl mx-auto">
            {header && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                {header}
              </motion.div>
            )}
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
