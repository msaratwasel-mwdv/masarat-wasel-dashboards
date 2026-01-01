import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

export default function SchoolDashboard({ auth }: { auth: any }) {
    return (
        <SchoolAuthenticatedLayout
            // ✅ تم تمرير المستخدم ليعمل الشريط العلوي وتختفي الصفحة البيضاء
            user={auth.user}
            header={
                <h2 className="text-xl font-semibold text-gray-800">
                    School Control Panel
                </h2>
            }
        >
            <Head title="School Dashboard" />

            <div className="space-y-6">
                {/* 1. ترحيب خاص بمدير المدرسة */}
                <div className="p-6 bg-white border-l-4 border-yellow-400 shadow-sm rounded-2xl">
                    <h1 className="text-2xl font-bold text-slate-800">
                        Welcome back, {auth.user.name}!
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Here is today's overview for your school.
                    </p>
                </div>

                {/* 2. الإحصائيات السريعة */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* الطلاب */}
                    <div className="p-6 transition bg-white border border-transparent shadow-sm rounded-2xl hover:shadow-md hover:border-blue-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 text-blue-600 rounded-full bg-blue-50">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase">Students</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">0</p>
                        <p className="mt-2 text-xs text-gray-400">Registered Students</p>
                    </div>

                    {/* الفصول */}
                    <Link href={route("school.classrooms.index")} className="block p-6 transition bg-white border border-transparent shadow-sm rounded-2xl hover:shadow-md hover:border-yellow-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 text-yellow-600 rounded-full bg-yellow-50">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase">Classrooms</span>
                        </div>
                        <p className="text-lg font-bold text-gray-800">إدارة الفصول</p>
                        <p className="mt-2 text-xs font-medium tracking-wide text-blue-500">Enter Management ⬅️</p>
                    </Link>

                    {/* الموظفين */}
                    <div className="p-6 transition bg-white border border-transparent shadow-sm rounded-2xl hover:shadow-md hover:border-green-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 text-green-600 rounded-full bg-green-50">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase">Staff</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">0</p>
                        <p className="mt-2 text-xs text-gray-400">Drivers & Supervisors</p>
                    </div>

                    {/* الحضور */}
                    <div className="p-6 transition bg-white border border-transparent shadow-sm rounded-2xl hover:shadow-md hover:border-red-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 text-red-600 rounded-full bg-red-50">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase">Attendance</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">--%</p>
                        <p className="mt-2 text-xs text-gray-400">Today's Presence</p>
                    </div>
                </div>

                {/* 3. منطقة العمليات السريعة */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                        <h3 className="mb-4 font-bold text-gray-800">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="p-4 text-center transition border border-gray-200 rounded-xl hover:bg-gray-50 group">
                                <span className="block mb-2 text-2xl transition-transform group-hover:scale-110">🚌</span>
                                <span className="text-sm font-medium text-gray-600">Track Buses</span>
                            </button>
                            <button className="p-4 text-center transition border border-gray-200 rounded-xl hover:bg-gray-50 group">
                                <span className="block mb-2 text-2xl transition-transform group-hover:scale-110">📢</span>
                                <span className="text-sm font-medium text-gray-600">Send Alert</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 text-center bg-white border border-gray-100 shadow-sm rounded-2xl">
                        <h3 className="mb-2 font-bold text-gray-800">Need Help?</h3>
                        <p className="mb-4 text-sm text-gray-500">Contact Wasel Support Center for any technical issues.</p>
                        <span className="font-mono text-xl font-bold text-[#0f2847]">19992</span>
                    </div>
                </div>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
