// resources/js/Pages/Dashboard.tsx
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";

export default function Dashboard() {
    const { isRTL } = useTheme();

    return (
        <AuthenticatedLayout>
            <Head title={isRTL ? "لوحة التحكم" : "Dashboard"} />

            {/* Welcome Section */}
            <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-start mb-8`}>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                        {isRTL ? "مرحبًا بعودتك، المدير" : "Welcome back, Admin"}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {isRTL ? "ملخص الأداء ليوم الأربعاء، 24 ديسمبر" : "Performance summary for Wednesday, December 24"}
                    </p>
                </div>

                {/* System Status */}
                <div className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300 mr-1">
                        {isRTL ? "مزامنة النظام:" : "System Sync:"}
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                        {isRTL ? "نشط" : "Active"}
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Schools */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 group border border-gray-100 dark:border-gray-700">
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-4`}>
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                {isRTL ? "المدارس" : "Total Schools"}
                            </p>
                            <p className="text-3xl font-extrabold text-gray-800 dark:text-white">4</p>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {isRTL ? "+2 هذا الشهر" : "+2 this month"}
                    </div>
                </div>

                {/* Active Buses */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 group border border-gray-100 dark:border-gray-700">
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-4`}>
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                {isRTL ? "الحافلات النشطة" : "Active Buses"}
                            </p>
                            <p className="text-3xl font-extrabold text-gray-800 dark:text-white">142</p>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {isRTL ? "٪95 في الخدمة" : "95% in service"}
                    </div>
                </div>

                {/* Total Students */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 group border border-gray-100 dark:border-gray-700">
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-4`}>
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                {isRTL ? "الطلاب" : "Total Students"}
                            </p>
                            <p className="text-3xl font-extrabold text-gray-800 dark:text-white">3,850</p>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {isRTL ? "+120 هذا الأسبوع" : "+120 this week"}
                    </div>
                </div>

                {/* System Alerts */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 group border border-gray-100 dark:border-gray-700">
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between mb-4`}>
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                {isRTL ? "تنبيهات النظام" : "System Alerts"}
                            </p>
                            <p className="text-3xl font-extrabold text-gray-800 dark:text-white">12</p>
                        </div>
                    </div>
                    <div className="text-sm text-red-500 dark:text-red-400 font-medium">
                        {isRTL ? "٨ تحتاج للاهتمام" : "8 need attention"}
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-6">
                <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between items-center mb-6`}>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {isRTL ? "النشاط الأخير" : "Recent Activity"}
                    </h2>
                    <button className="text-sm text-brand-yellow hover:text-yellow-600 dark:hover:text-yellow-400 font-medium">
                        {isRTL ? "عرض الكل" : "View All"}
                    </button>
                </div>

                <div className="space-y-4">
                    {[
                        {
                            icon: 'bus',
                            title: isRTL ? "حافلة جديدة تمت إضافتها" : "New bus added",
                            time: isRTL ? "منذ ٥ دقائق" : "5 minutes ago",
                            color: 'text-blue-500'
                        },
                        {
                            icon: 'user',
                            title: isRTL ? "تم تسجيل حضور ٥٠ طالب" : "50 students checked in",
                            time: isRTL ? "منذ ٣٠ دقيقة" : "30 minutes ago",
                            color: 'text-green-500'
                        },
                        {
                            icon: 'alert',
                            title: isRTL ? "تنبيه: تأخير الحافلة رقم ١٢" : "Alert: Bus #12 delayed",
                            time: isRTL ? "منذ ساعة" : "1 hour ago",
                            color: 'text-red-500'
                        },
                        {
                            icon: 'school',
                            title: isRTL ? "تم تحديث بيانات المدرسة" : "School data updated",
                            time: isRTL ? "منذ ساعتين" : "2 hours ago",
                            color: 'text-purple-500'
                        }
                    ].map((activity, index) => (
                        <div key={index} className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors`}>
                            <div className={`w-10 h-10 rounded-full ${activity.color.replace('text-', 'bg-')}/10 flex items-center justify-center ${isRTL ? 'ml-4' : 'mr-4'}`}>
                                <svg className={`w-5 h-5 ${activity.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-800 dark:text-gray-200">{activity.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
