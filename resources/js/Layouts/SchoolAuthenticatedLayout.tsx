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
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  ChevronRight,
  ChevronsUpDown,
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
  BarChart3,
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
    label: isRTL ? "الحافلات" : "Buses",
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
        label: isRTL ? "تعيين الطلاب للحافلة" : "Assign Bus Students",
        route: "school.buses.students.assign",
      },
      {
        label: isRTL ? "السائقين" : "Drivers",
        route: "school.drivers.index",
      },
      {
        label: isRTL ? "مشرفات الحافلات" : "Bus Supervisors",
        route: "school.assistants.index",
      },
      {
        label: isRTL ? "المسارات" : "Routes",
        route: "school.routes.index",
      },
    ],
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
        label: isRTL ? "سجل المعاملات" : "Transactions History",
        route: "school.transactions.index",
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
    label: isRTL ? "طلبات تغيير الموقع" : "Location Requests",
    route: "school.location-requests.index",
    icon: "navigation",
  },
  {
    label: isRTL ? "التقارير والتحليلات" : "Reports & Analytics",
    icon: "chart",
    subItems: [
      {
        label: isRTL ? "مركز التقارير" : "Reports Hub",
        route: "school.reports.index",
      },
      {
        label: isRTL ? "تقرير حضور الطلاب" : "Student Attendance",
        route: "school.reports.student-attendance",
      },
      {
        label: isRTL ? "تقرير الرحلات" : "Trip Operations",
        route: "school.reports.trip-operations",
      },
      {
        label: isRTL ? "تقرير السلامة" : "Safety & Compliance",
        route: "school.reports.safety-compliance",
      },
      {
        label: isRTL ? "أداء السائقين" : "Driver Performance",
        route: "school.reports.driver-performance",
      },
      {
        label: isRTL ? "تقرير التأخيرات" : "Delays & Punctuality",
        route: "school.reports.delay-punctuality",
      },
      {
        label: isRTL ? "السرعة والانضباط" : "Speed & Discipline",
        route: "school.reports.speed-discipline",
      },
    ],
  }
];

export default function SchoolAuthenticatedLayout({
  user: defaultUser,
  header,
  children,
  isLiveTracking,
}: PropsWithChildren<{ user?: User; header?: ReactNode; isLiveTracking?: boolean }>) {
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
    localStorage.setItem("school-sidebar-collapsed", isCollapsed.toString());
  }, [isCollapsed]);

  const { flash } = usePage<any>().props;
  const { theme, language, toggleTheme, toggleLanguage, isRTL } = useTheme();
  const { notifyEvent } = useRealtimeToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (flash?.success) {
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
    }
    if (flash?.error) {
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
    }
  }, [flash]);

  // --- Real-time Badge Updates ---
  useEchoEvent(
    'private',
    `App.Models.User.${user.id}`,
    'notification.pushed',
    (data: any) => {
      // Show notification toast
      notifyEvent('notification', data.title, data.message);
      
      // Refresh badge counts from server without full page reload
      router.reload({ 
        only: [
          'pending_location_requests_count', 
          'pending_absence_requests_count', 
          'received_incidents_count', 
          'notifications_count'
        ]
      });
    }
  );

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
      width: 256,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    },
    collapsed: {
      width: 64,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    }
  };

  const menuItems = getMenuItems(isRTL);

  // Icon renderer (using modern Lucide icons)
  const renderIcon = (name: string, isActive: boolean) => {
    const baseClass = `w-5 h-5 transition-colors duration-200 ${isActive
      ? "text-white"
      : "text-slate-400 group-hover:text-slate-200"
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
      case "chart": return <BarChart3 className={baseClass} />;
      case "calendar": return <Calendar className={baseClass} />;
      case "cog": return <Settings className={baseClass} />;
      default: return null;
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#0A101D] flex font-sans overflow-x-hidden relative w-full ${rtlClasses}`}
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
          force-print-hide print:hidden
          bg-transparent
          text-white flex flex-col fixed inset-y-0 h-full z-50 overflow-hidden
          ${sidebarPosition}
          ${isMobileMenuOpen ? "translate-x-0" : isRTL ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0"}
          transition-transform duration-300 md:transition-none
        `}
      >
        <div className={`h-14 flex items-center overflow-hidden ${isCollapsed ? "justify-center px-0" : "px-4"}`}>
          <Link
            href={route("school.dashboard")}
            className={`flex items-center gap-2 group ${flexDirection}`}
          >
            <div className={`rounded-md flex items-center justify-center bg-white text-black shadow-sm ${isCollapsed ? "w-8 h-8" : "w-8 h-8"} p-1`}>
              <ApplicationLogo className="w-full h-full fill-current" />
            </div>

            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex flex-col ${isRTL ? "text-right" : "text-left"}`}
              >
                <span className="text-[15px] font-semibold text-white whitespace-nowrap">
                  {isRTL ? "مسارات واصل" : "Masarat Wasel"}
                </span>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Navigation Section */}
        <nav
          ref={sidebarNavRef}
          onScroll={handleSidebarScroll}
          className="flex-1 px-3 space-y-0.5 mt-2 overflow-y-auto custom-scrollbar"
        >

          {menuItems.map((item) => {
            const hasActiveChild = item.subItems?.some(sub => sub.route && route().current(sub.route));
            const isActive = !!(item.route && route().current(item.route)) || !!hasActiveChild;

            if (item.subItems) {
              return (
                <Popover key={item.label} className="w-full">
                  {({ open }) => (
                    <>
                      <PopoverButton
                        onClick={() => {
                          if (isCollapsed) {
                            setIsCollapsed(false);
                          }
                        }}
                        title={isCollapsed ? item.label : ""}
                        className={`
                          w-full relative group flex items-center p-2 text-sm font-medium rounded-md transition-all duration-200 outline-none
                          ${flexDirection}
                          ${isActive || open
                            ? "bg-white/10 text-white"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                          }
                          ${isCollapsed ? "justify-center" : ""}
                        `}
                      >
                        <span className={`${!isCollapsed ? (isRTL ? "ml-2" : "mr-2") : ""} flex items-center shrink-0`}>
                          {item.icon && renderIcon(item.icon, isActive)}
                        </span>

                        {!isCollapsed && (
                          <>
                            <span className={`flex-1 text-sm font-medium ${isRTL ? "text-right" : "text-left"} whitespace-nowrap`}>
                              {item.label}
                            </span>
                            <ChevronRight className={`w-4 h-4 transition-all duration-300 ${open ? "rotate-90 text-white" : `opacity-40 group-hover:opacity-100 ${isRTL ? "rotate-180" : ""}`}`} />
                          </>
                        )}
                      </PopoverButton>

                      <PopoverPanel
                        anchor={isMobile ? (isRTL ? "bottom end" : "bottom start") : (isRTL ? "left start" : "right start")}
                        className={`
                          z-[9999] flex flex-col gap-0.5 min-w-[180px] p-1.5 rounded-lg bg-slate-800 border border-slate-700 shadow-2xl outline-none relative
                          ${isMobile ? "mt-2" : (isRTL ? "mr-4" : "ml-4")}
                        `}
                      >
                        {/* Caret pointing to the button (only on desktop where it opens sideways) */}
                        {!isMobile && (
                          <div className={`absolute top-4 w-2.5 h-2.5 rotate-45 bg-slate-800 border-slate-700 ${isRTL ? "-right-[6px] border-r border-t" : "-left-[6px] border-l border-b"}`} />
                        )}
                        
                        {item.subItems.map((sub) => {
                          const isSubActive = route().current(sub.route);
                          return (
                            <Link
                              key={sub.label}
                              href={route(sub.route)}
                              className={`flex items-center justify-between w-full p-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                isSubActive
                                  ? "text-white font-medium bg-white/5"
                                  : "text-slate-300 hover:text-white hover:bg-slate-700"
                              } ${isRTL ? "text-right" : "text-left"}`}
                            >
                              <span className="relative z-10">{sub.label}</span>
                              {sub.route === 'school.notifications.received' && usePage<any>().props.received_incidents_count > 0 && (
                                <span className="relative z-10 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm ml-2">
                                  {usePage<any>().props.received_incidents_count}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </PopoverPanel>
                    </>
                  )}
                </Popover>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.route ? route(item.route) : "#"}
                title={isCollapsed ? item.label : ""}
                className={`
                  relative group flex items-center p-2 text-sm font-medium rounded-md transition-all duration-200
                  ${flexDirection}
                  ${isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }
                  ${isCollapsed ? "justify-center" : ""}
                `}
              >
                <span className={`${!isCollapsed ? (isRTL ? "ml-2" : "mr-2") : ""} flex items-center shrink-0`}>
                  {item.icon && renderIcon(item.icon, isActive)}
                </span>

                {!isCollapsed && (
                  <span className={`flex-1 text-sm font-medium ${isRTL ? "text-right" : "text-left"} whitespace-nowrap flex items-center justify-between`}>
                    <span>{item.label}</span>
                    
                    {/* Badge for Location Requests */}
                    {item.route === 'school.location-requests.index' && usePage<any>().props.pending_location_requests_count > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm ml-2"
                      >
                        {usePage<any>().props.pending_location_requests_count}
                      </motion.span>
                    )}

                    {/* Badge for Absence Requests */}
                    {item.route === 'school.absence-requests.index' && usePage<any>().props.pending_absence_requests_count > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm ml-2"
                      >
                        {usePage<any>().props.pending_absence_requests_count}
                      </motion.span>
                    )}

                    {/* Badge for General Notifications Parent */}
                    {item.label === (isRTL ? "الإشعارات" : "Notifications") && (usePage<any>().props.notifications_count > 0 || usePage<any>().props.received_incidents_count > 0) && (
                      <motion.span 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="bg-brand-yellow text-brand-dark text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm ml-2"
                      >
                        {Number(usePage<any>().props.notifications_count || 0) + Number(usePage<any>().props.received_incidents_count || 0)}
                      </motion.span>
                    )}
                  </span>
                )}

                {/* Collapsed Indicator Dot */}
                {isCollapsed && (
                  <>
                    {item.route === 'school.location-requests.index' && usePage<any>().props.pending_location_requests_count > 0 && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-brand-dark shadow-sm" />
                    )}
                    {item.route === 'school.absence-requests.index' && usePage<any>().props.pending_absence_requests_count > 0 && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-brand-dark shadow-sm" />
                    )}
                    {item.label === (isRTL ? "الإشعارات" : "Notifications") && (usePage<any>().props.notifications_count > 0 || usePage<any>().props.received_incidents_count > 0) && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-slate-100 rounded-full border border-slate-800 shadow-sm" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 bg-transparent mt-auto">
          <Popover className="relative w-full">
            {({ open }) => (
              <>
                <PopoverButton
                  className={`w-full rounded-lg ${isCollapsed ? "p-2 justify-center" : "p-2"} flex items-center ${flexDirection} group hover:bg-white/5 transition-colors overflow-hidden outline-none ${open ? "bg-white/5" : ""}`}
                  title={isCollapsed ? (!isRTL && user.name_en ? user.name_en : user.name) : ""}
                >
                  <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2"} ${flexDirection} flex-1 min-w-0`}>
                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-slate-900 dark:text-white font-medium text-[12px] shrink-0">
                      {(!isRTL && user.name_en ? user.name_en : user.name).charAt(0).toUpperCase()}
                    </div>
                    {!isCollapsed && (
                      <div className={`grid flex-1 ${isRTL ? "text-right" : "text-left"} text-sm leading-tight min-w-0`}>
                        <span className="truncate font-medium text-slate-900 dark:text-white" dir="auto">
                          {!isRTL && user.name_en ? user.name_en : user.name}
                        </span>
                        <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {isRTL ? "مدير مدرسة" : "School Admin"}
                        </span>
                      </div>
                    )}
                  </div>
                  {!isCollapsed && (
                    <ChevronsUpDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0 ml-auto" />
                  )}
                </PopoverButton>

                <PopoverPanel
                  anchor={isMobile ? "top" : (isCollapsed ? (isRTL ? "left end" : "right end") : "top start")}
                  className={`
                    z-[9999] flex flex-col min-w-[224px] p-1 rounded-lg bg-white dark:bg-[#18181B] border border-gray-200 dark:border-white/10 shadow-lg outline-none relative
                    ${isMobile ? "mb-2" : (isCollapsed ? (isRTL ? "mr-4" : "ml-4") : "mb-2")}
                  `}
                >
                  <div className={`flex items-center gap-2 px-1 py-1.5 ${isRTL ? "text-right" : "text-left"} text-sm`}>
                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-slate-900 dark:text-white font-medium text-[12px] shrink-0">
                      {(!isRTL && user.name_en ? user.name_en : user.name).charAt(0).toUpperCase()}
                    </div>
                    <div className={`grid flex-1 ${isRTL ? "text-right" : "text-left"} text-sm leading-tight min-w-0`}>
                      <span className="truncate font-medium text-slate-900 dark:text-white" dir="auto">
                        {!isRTL && user.name_en ? user.name_en : user.name}
                      </span>
                      <span className="truncate text-xs text-slate-500 dark:text-slate-400" dir="auto">
                        {user.email || 'admin@school.com'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="h-px bg-gray-200 dark:bg-white/10 my-1 -mx-1" />
                  
                  <Link
                    href={route('profile.edit')}
                    className={`flex items-center w-full px-2 py-1.5 text-sm font-normal text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-sm transition-colors cursor-pointer ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <Settings className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    <span>{isRTL ? "الإعدادات" : "Settings"}</span>
                  </Link>

                  <div className="h-px bg-gray-200 dark:bg-white/10 my-1 -mx-1" />

                  <Link
                    method="post"
                    href={route("logout")}
                    as="button"
                    className={`flex items-center w-full px-2 py-1.5 text-sm font-normal text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-sm transition-colors cursor-pointer ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <LogOut className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    <span>{isRTL ? "تسجيل الخروج" : "Log out"}</span>
                  </Link>
                </PopoverPanel>
              </>
            )}
          </Popover>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT --- */}
      <main
        className={`
          flex-1 min-w-0 min-h-screen flex flex-col relative transition-all duration-300
          ${isRTL 
            ? (isCollapsed ? "md:mr-[64px]" : "md:mr-[256px]") 
            : (isCollapsed ? "md:ml-[64px]" : "md:ml-[256px]")
          }
          p-2
        `}
      >
        <div className="flex-1 bg-white dark:bg-[#0B1120] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden relative min-h-0">
        
        {/* Top Header */}
        <header className="force-print-hide print:hidden h-16 bg-transparent flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 w-full">
          <div className="flex items-center gap-4">
            {/* Collapse Toggle - Desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2.5 rounded-xl bg-transparent text-gray-500 hover:text-brand-dark dark:hover:text-white transition-all"
              title={isCollapsed ? (isRTL ? "توسيع" : "Expand") : (isRTL ? "تقليص" : "Collapse")}
            >
              {isRTL ? (
                isCollapsed ? <PanelRight className="w-5 h-5" /> : <PanelRightClose className="w-5 h-5" />
              ) : (
                isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 transition-all border border-gray-100 dark:border-gray-600"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-brand-yellow" /> : <Menu className="w-6 h-6" />}
            </button>

            {header && (
              <>
                <div className="hidden md:block w-px h-4 bg-gray-200 dark:bg-gray-700" />
                <div className="hidden md:block text-gray-800 dark:text-white font-bold text-lg">
                  {header}
                </div>
              </>
            )}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2 md:gap-4 ">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-2 sm:p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-brand-dark dark:hover:text-white transition-colors"
              title={isRTL ? "Switch to English" : "التبديل إلى العربية"}
            >
              <span className="text-xs font-bold">
                {language === "ar" ? "EN" : "ع"}
              </span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl text-gray-600 dark:text-gray-400 hover:text-brand-dark dark:hover:text-white transition-all"
              title={theme === "dark" ? (isRTL ? "الوضع الفاتح" : "Light Mode") : (isRTL ? "الوضع المظلم" : "Dark Mode")}
            >
              {theme === "dark" ? (
                <motion.div initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                  <Sun className="w-5 h-5 text-brand-yellow dark:hover:text-white transition-colors" />
                </motion.div>
              ) : (
                <motion.div initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                  <Moon className="w-5 h-5 text-gray-400" />
                </motion.div>
              )}
            </button>

            {/* Notifications Dropdown */}
            <NotificationDropdown isRTL={isRTL} />

            {/* User Profile - Hidden on mobile as it is inside the sidebar drawer */}
            
          </div>
        </header>

        {/* Page Content */}
        <div className={`flex-1 overflow-auto bg-gray-50/30 dark:bg-transparent ${isLiveTracking ? 'p-0' : 'p-4 md:p-6'}`}>
          <div className={isLiveTracking ? 'w-full h-full' : 'max-w-7xl mx-auto h-full'}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </div>
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
