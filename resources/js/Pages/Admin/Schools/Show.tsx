import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface School {
  id: number;
  name: string;
  location: string;
  status: string;
  users: User[]; // قائمة المدراء القادمة من العلاقة
}

export default function ShowSchool({
  school,
  stats,
}: {
  school: School;
  stats: any;
}) {
  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800">School Details</h2>
      }
    >
      <Head title={school.name} />

      <div className="space-y-6">
        {/* 1. Header Area */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-brand-dark mb-2">
              {school.name}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {school.location}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  school.status === "Active"
                    ? "bg-green-50 text-green-600 border-green-100"
                    : "bg-red-50 text-red-600 border-red-100"
                }`}
              >
                {school.status}
              </span>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              href={route("admin.schools.index")}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Back to List
            </Link>
            {/* زر إضافة مدير جديد مباشرة من هنا */}
            <Link
              href={route("admin.schools.users.create", school.id)}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90 transition"
            >
              + Add Manager
            </Link>
          </div>
        </div>

        {/* 2. Stats Grid (Placeholder) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-bold uppercase">
              Total Students
            </p>
            <p className="text-3xl font-bold text-brand-dark mt-2">
              {stats.students_count}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-bold uppercase">
              Active Buses
            </p>
            <p className="text-3xl font-bold text-brand-dark mt-2">
              {stats.buses_count}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-bold uppercase">
              Staff & Drivers
            </p>
            <p className="text-3xl font-bold text-brand-dark mt-2">
              {stats.drivers_count}
            </p>
          </div>
        </div>

        {/* 3. School Admins List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">School Managers</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {school.users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-400 text-sm"
                  >
                    No managers assigned yet.
                  </td>
                </tr>
              ) : (
                school.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-brand-yellow font-bold">
                      {user.role}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
