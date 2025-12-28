import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function SchoolDashboard() {
  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800">
          School Control Panel
        </h2>
      }
    >
      <Head title="School Dashboard" />

      <div className="space-y-6">
        {/* 1. ترحيب خاص بمدير المدرسة */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-brand-yellow">
          <h1 className="text-2xl font-bold text-brand-dark">
            Welcome back, Principal!
          </h1>
          <p className="text-gray-500 mt-1">
            Here is today's overview for your school.
          </p>
        </div>

        {/* 2. الإحصائيات السريعة (حسب المواصفات) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* الطلاب */}
          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Students
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800">0</p>
            <p className="text-xs text-gray-400 mt-2">Registered Students</p>
          </div>

          {/* الحافلات */}
          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-full">
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
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Buses
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800">0</p>
            <p className="text-xs text-gray-400 mt-2">Assigned Buses</p>
          </div>

          {/* المشرفات والسائقين */}
          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-full">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Staff
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800">0</p>
            <p className="text-xs text-gray-400 mt-2">Drivers & Supervisors</p>
          </div>

          {/* الحضور اليومي */}
          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-full">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Attendance
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800">--%</p>
            <p className="text-xs text-gray-400 mt-2">Today's Presence</p>
          </div>
        </div>

        {/* 3. منطقة العمليات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-center transition">
                <span className="block text-2xl mb-2">🚌</span>
                <span className="text-sm font-medium text-gray-600">
                  Track Buses
                </span>
              </button>
              <button className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-center transition">
                <span className="block text-2xl mb-2">📢</span>
                <span className="text-sm font-medium text-gray-600">
                  Send Alert
                </span>
              </button>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <h3 className="font-bold text-gray-800 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Contact Wasel Support Center for any technical issues.
            </p>
            <span className="text-xl font-mono font-bold text-brand-navy">
              19992
            </span>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
