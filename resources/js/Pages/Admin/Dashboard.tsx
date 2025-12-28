import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";

export default function Dashboard() {
  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      {/* --- Welcome Section --- */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Welcome back, Admin
          </h1>
          <p className="text-gray-500 text-sm">
            Performance summary for Wednesday, December 24
          </p>
        </div>

        {/* System Sync Badge */}
        <div className="flex items-center px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-sm text-gray-700">
          <svg
            className="w-4 h-4 text-yellow-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-semibold mr-1">System Sync:</span> Active
        </div>
      </div>

      {/* --- Stats Cards Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Schools */}
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">
            Total Schools
          </p>
          <p className="text-3xl font-extrabold text-gray-800">4</p>
        </div>

        {/* Card 2: Active Buses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4 text-yellow-600">
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
          <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">
            Active Buses
          </p>
          <p className="text-3xl font-extrabold text-gray-800">142</p>
        </div>

        {/* Card 3: Total Students */}
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4 text-green-600">
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
          <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">
            Total Students
          </p>
          <p className="text-3xl font-extrabold text-gray-800">3,850</p>
        </div>

        {/* Card 4: System Alerts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">
            System Alerts
          </p>
          <p className="text-3xl font-extrabold text-gray-800">12</p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
