import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/Contexts/ThemeContext";
import { 
    Building2, 
    User, 
    Lock, 
    Bell, 
    ShieldCheck, 
    ChevronRight,
    Smartphone,
    Globe,
    Terminal
} from "lucide-react";

import { 
    DS_card, 
    DS_pageTitle,
    DS_divider
} from "@/lib/DS";

import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateSchoolInformationForm from "./Partials/UpdateSchoolInformationForm";
import SystemCommands from "./Partials/SystemCommands";

interface Props {
    mustVerifyEmail: boolean;
    status?: string;
    auth: { user: any };
}

export default function Edit({ mustVerifyEmail, status, auth }: Props) {
    const { isRTL: isRtl, theme, language, toggleTheme, toggleLanguage } = useTheme();
    const isAdmin = auth.user.role === 'admin';
    const Layout = isAdmin ? AuthenticatedLayout : SchoolAuthenticatedLayout;

    const tabs = [
        { 
            id: 'info', 
            label: isAdmin 
                ? (isRtl ? 'بيانات الشركة' : 'Company Profile') 
                : (isRtl ? 'بيانات المدرسة' : 'School Profile'), 
            icon: Building2 
        },
        { id: 'profile', label: isRtl ? 'الملف الشخصي' : 'Personal Profile', icon: User },
        { id: 'security', label: isRtl ? 'الأمان' : 'Security', icon: Lock },
        { id: 'preferences', label: isRtl ? 'التفضيلات' : 'Preferences', icon: Globe },
    ];

    if (isAdmin) {
        tabs.push({ id: 'system', label: isRtl ? 'أدوات النظام' : 'System Tools', icon: Terminal });
    }

    const [activeTab, setActiveTab] = useState('info'); // 'info' | 'profile' | 'security' | 'preferences' | 'system'

    return (
        <Layout
            user={auth.user}
            header={
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-[#f5b800]" />
                    <h2 className={DS_pageTitle}>
                        {isAdmin ? (isRtl ? 'إعدادات الشركة' : 'Company Settings') : (isRtl ? 'إعدادات النظام' : 'System Settings')}
                    </h2>
                </div>
            }
        >
            <Head title={(isRtl ? 'الإعدادات' : 'Settings')} />

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Tabs - Sidebar on Desktop / Horizontal on Mobile */}
                <aside className="lg:w-72 flex-shrink-0">
                    <div className={`${DS_card} p-2 lg:sticky lg:top-24`}>
                        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar p-1 gap-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3.5 rounded-[18px] text-xs lg:text-[13px] font-bold transition-all duration-300 group relative ${
                                            isActive 
                                                ? 'bg-[#0f2044] text-[#f5b800] shadow-xl shadow-[#0f2044]/30 scale-[1.02]' 
                                                : 'text-gray-500 hover:bg-[#0f2044]/5 dark:hover:bg-[#0f2044]/30 dark:text-gray-400 hover:text-[#0f2044] dark:hover:text-white'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-[#f5b800]/20 text-[#f5b800] rotate-6' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:rotate-12'}`}>
                                            <Icon className="w-4 h-4 lg:w-[18px] h-[18px]" />
                                        </div>
                                        <span className="whitespace-nowrap flex-1 text-start">{tab.label}</span>
                                        {isActive && (
                                            <motion.div 
                                                layoutId="tab-indicator" 
                                                className="hidden lg:block w-1.5 h-6 bg-[#f5b800] rounded-full" 
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Helper Info - Hidden on Mobile */}
                    <div className="hidden lg:block mt-6 p-6 rounded-[20px] bg-gradient-to-br from-[#0f2044] to-[#1B3A5C] text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="text-sm font-black mb-2">{(isRtl ? 'تحتاج للمساعدة؟' : 'Need Help?')}</h4>
                            <p className="text-[11px] text-white/70 leading-relaxed">
                                {(isRtl 
                                    ? 'إذا واجهت أي مشكلة في تحديث البيانات، يرجى التواصل مع الدعم الفني لمسارات واصل.' 
                                    : 'If you encounter any issues updating data, please contact Masarat Wasel technical support.')}
                            </p>
                            <button className="mt-4 text-[10px] font-bold bg-[#f5b800] text-[#0f2044] px-4 py-2 rounded-lg hover:bg-white transition-colors">
                                {(isRtl ? 'اتصل بنا' : 'Contact Support')}
                            </button>
                        </div>
                        <Building2 className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 rotate-12" />
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className={DS_card}
                        >
                            <div className="p-5 md:p-8">
                                {activeTab === 'info' && (
                                    isAdmin ? (
                                        <div className="space-y-6">
                                            <header>
                                                <h2 className="text-lg font-bold text-[#0f2044] dark:text-white">
                                                    {isRtl ? "بيانات الشركة" : "Company Information"}
                                                </h2>
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    {isRtl 
                                                        ? "تحديث البيانات العامة للشركة التي تظهر في اللوحة الرئيسية والتقارير."
                                                        : "Update general company information used in the dashboard and reports."}
                                                </p>
                                            </header>
                                            <div className="p-16 text-center bg-gradient-to-b from-[#f5b800]/[0.02] to-transparent dark:from-[#f5b800]/5 rounded-[32px] border-2 border-dashed border-[#0f2044]/10 dark:border-[#f5b800]/10 group hover:border-[#f5b800]/30 transition-all duration-500">
                                                <div className="w-24 h-24 bg-[#0f2044] dark:bg-[#1a2845] rounded-[24px] flex items-center justify-center text-[#f5b800] mx-auto mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                                    <Building2 className="w-10 h-10" />
                                                </div>
                                                <h3 className="text-xl font-black text-[#0f2044] dark:text-white mb-3">
                                                    {isRtl ? "الهوية المؤسسية" : "Corporate Identity"}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                                                    {isRtl 
                                                        ? "بيانات الشركة مرتبطة تلقائياً بملف المدير العام. يمكنك تحديث الشعار والاسم من خلال تعديل بياناتك الشخصية." 
                                                        : "Company identity is automatically linked to the General Admin profile. You can update logo and name via personal settings."}
                                                </p>
                                                <button 
                                                    onClick={() => setActiveTab('profile')}
                                                    className="mt-10 px-10 py-4 bg-[#f5b800] hover:bg-[#0f2044] hover:text-[#f5b800] text-[#0f2044] rounded-2xl text-sm font-black transition-all duration-300 shadow-xl shadow-[#f5b800]/20"
                                                >
                                                    {isRtl ? "تعديل البيانات الآن" : "Update Profile Now"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : <UpdateSchoolInformationForm />
                                )}
                                
                                {activeTab === 'profile' && (
                                    <UpdateProfileInformationForm 
                                        mustVerifyEmail={mustVerifyEmail} 
                                        status={status} 
                                    />
                                )}
                                
                                {activeTab === 'security' && <UpdatePasswordForm />}

                                {activeTab === 'system' && isAdmin && <SystemCommands />}

                                {activeTab === 'preferences' && (
                                    <div className="space-y-8">
                                        <header>
                                            <h2 className="text-lg font-bold text-[#0f2044] dark:text-white">
                                                {isRtl ? "تفضيلات النظام" : "System Preferences"}
                                            </h2>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                {isRtl 
                                                    ? "تخصيص تجربة استخدامك للنظام من حيث المظهر واللغة والتنبيهات."
                                                    : "Customize your system experience including appearance, language, and notifications."}
                                            </p>
                                        </header>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Appearance Toggle */}
                                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] flex items-center justify-between group hover:border-[#f5b800] transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-xl bg-white dark:bg-[#0f2044] shadow-sm text-[#f5b800]">
                                                        <Smartphone className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#0f2044] dark:text-white">{isRtl ? 'مظهر النظام' : 'System Theme'}</p>
                                                        <p className="text-[10px] text-gray-500">{theme === 'dark' ? (isRtl ? 'الوضع المظلم مفعّل' : 'Dark Mode Enabled') : (isRtl ? 'الوضع الفاتح مفعّل' : 'Light Mode Enabled')}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={toggleTheme}
                                                    className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-[#f5b800]' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${theme === 'dark' ? (isRtl ? 'right-1' : 'left-7') : (isRtl ? 'right-7' : 'left-1')}`} />
                                                </button>
                                            </div>

                                            {/* Language Toggle */}
                                            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] flex items-center justify-between group hover:border-[#f5b800] transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-xl bg-white dark:bg-[#0f2044] shadow-sm text-blue-500">
                                                        <Globe className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[#0f2044] dark:text-white">{isRtl ? 'لغة النظام' : 'System Language'}</p>
                                                        <p className="text-[10px] text-gray-500">{isRtl ? 'اللغة العربية' : 'English Language'}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={toggleLanguage}
                                                    className="px-4 py-1.5 bg-white dark:bg-[#0f2044] border border-gray-200 dark:border-[#243460] rounded-xl text-xs font-black shadow-sm"
                                                >
                                                    {isRtl ? 'English' : 'العربية'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className={DS_divider} />

                                        {/* Notifications Placeholder */}
                                        <div className="p-8 text-center bg-[#f5b800]/5 rounded-[20px] border border-dashed border-[#f5b800]/20">
                                            <Bell className="w-12 h-12 text-[#f5b800] mx-auto mb-4 opacity-40" />
                                            <h4 className="font-bold text-[#0f2044] dark:text-white">{(isRtl ? 'إعدادات التنبيهات قيد التطوير' : 'Notification Settings coming soon')}</h4>
                                            <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
                                                {(isRtl 
                                                    ? 'سنتمكن قريباً من تخصيص أنواع التنبيهات التي ترغب في استلامها عبر البريد أو المتصفح.' 
                                                    : 'You will soon be able to customize what types of notifications you receive via email or browser.')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </Layout>
    );
}
