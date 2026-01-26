import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";

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
  users: User[];
}

interface Stats {
  students_count: number;
  buses_count: number;
  active_buses: number;
  maintenance_buses: number;
  drivers_count: number;
  supervisors_count: number;
  admins_count: number;
}

export default function ShowSchool({
  school,
  stats,
}: {
  school: School;
  stats: Stats;
}) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <AuthenticatedLayout
      header={
        <h2
          className={`font-semibold text-xl ${
            isDark ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {isRTL ? "تفاصيل المدرسة" : "School Details"}
        </h2>
      }
    >
      <Head title={school.name} />

      <div className="space-y-6">
        {/* 1. Header Area - Enhanced */}
        <div
          className={`rounded-2xl shadow-lg border overflow-hidden ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          <div
            className={`h-32 bg-gradient-to-r ${
              school.status === "Active"
                ? "from-blue-500 to-blue-600"
                : "from-gray-400 to-gray-500"
            }`}
          ></div>
          <div className="px-6 pb-6 -mt-16">
            <div className="flex justify-between items-start">
              <div className="flex items-end gap-4">
                <div
                  className={`w-24 h-24 rounded-2xl shadow-xl flex items-center justify-center text-3xl font-bold text-white ${
                    school.status === "Active"
                      ? "bg-gradient-to-br from-blue-500 to-blue-600"
                      : "bg-gradient-to-br from-gray-400 to-gray-500"
                  }`}
                >
                  {school.name.charAt(0).toUpperCase()}
                </div>
                <div className="mb-2">
                  <h1
                    className={`text-3xl font-bold ${
                      isDark ? "text-white" : "text-gray-100"
                    }`}
                  >
                    {school.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`flex items-center text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
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
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        school.status === "Active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {school.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  href={route("admin.schools.index")}
                  className={`px-4 py-2 rounded-lg transition ${
                    isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {isRTL ? "العودة" : "Back"}
                </Link>
                <Link
                  href={route("admin.schools.users.create", school.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {isRTL ? "إضافة مدير" : "Add Manager"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Stats Grid - Enhanced with Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Students */}
          <div
            className={`p-6 rounded-2xl shadow-sm border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {isRTL ? "الطلاب" : "Students"}
                </p>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {stats.students_count}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-lg">
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
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Buses */}
          <div
            className={`p-6 rounded-2xl shadow-sm border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {isRTL ? "الباصات" : "Buses"}
                </p>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {stats.buses_count}
                </p>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {stats.active_buses} {isRTL ? "نشط" : "Active"}
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {stats.maintenance_buses} {isRTL ? "صيانة" : "Maint."}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white shadow-lg">
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
            </div>
          </div>

          {/* Drivers */}
          <div
            className={`p-6 rounded-2xl shadow-sm border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {isRTL ? "السائقين" : "Drivers"}
                </p>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {stats.drivers_count}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="3" strokeWidth="2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Supervisors */}
          <div
            className={`p-6 rounded-2xl shadow-sm border ${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {isRTL ? "المشرفين" : "Supervisors"}
                </p>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {stats.supervisors_count}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white shadow-lg">
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
            </div>
          </div>
        </div>

        {/* 3. School Admins List - Enhanced */}
        <div
          className={`rounded-2xl shadow-sm border overflow-hidden ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          <div
            className={`px-6 py-4 border-b flex items-center justify-between ${
              isDark
                ? "border-gray-700 bg-gray-750"
                : "border-gray-100 bg-gray-50"
            }`}
          >
            <div>
              <h3
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {isRTL ? "مدراء المدرسة" : "School Managers"}
              </h3>
              <p
                className={`text-sm mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {stats.admins_count}{" "}
                {isRTL
                  ? stats.admins_count === 1
                    ? "مدير"
                    : "مدراء"
                  : stats.admins_count === 1
                  ? "manager"
                  : "managers"}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                className={`text-xs uppercase ${
                  isDark
                    ? "bg-gray-700/50 text-gray-400"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                <tr>
                  <th className="px-6 py-3 font-medium text-left">
                    {isRTL ? "الاسم" : "Name"}
                  </th>
                  <th className="px-6 py-3 font-medium text-left">
                    {isRTL ? "البريد الإلكتروني" : "Email"}
                  </th>
                  <th className="px-6 py-3 font-medium text-left">
                    {isRTL ? "الهاتف" : "Phone"}
                  </th>
                  <th className="px-6 py-3 font-medium text-left">
                    {isRTL ? "الدور" : "Role"}
                  </th>
                  <th className="px-6 py-3 font-medium text-center">
                    {isRTL ? "الإجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? "divide-gray-700" : "divide-gray-100"
                }`}
              >
                {school.users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                            isDark ? "bg-gray-700" : "bg-gray-100"
                          }`}
                        >
                          <svg
                            className={`w-8 h-8 ${
                              isDark ? "text-gray-500" : "text-gray-400"
                            }`}
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
                        <p
                          className={`font-medium ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {isRTL
                            ? "لم يتم تعيين مدراء بعد"
                            : "No managers assigned yet"}
                        </p>
                        <p
                          className={`text-sm mt-1 ${
                            isDark ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {isRTL
                            ? "اضغط على زر 'إضافة مدير' لتعيين مدير جديد"
                            : "Click 'Add Manager' to assign a new manager"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  school.users.map((user) => (
                    <tr
                      key={user.id}
                      className={`transition ${
                        isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td
                        className={`px-6 py-4 text-sm font-medium ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          {user.name}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {user.email}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={route("admin.schools.users.edit", [
                              school.id,
                              user.id,
                            ])}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition"
                          >
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            {isRTL ? "تعديل" : "Edit"}
                          </Link>

                          <Link
                            href={route("admin.schools.users.destroy", [
                              school.id,
                              user.id,
                            ])}
                            method="delete"
                            as="button"
                            className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition"
                            onBefore={() =>
                              confirm(
                                isRTL
                                  ? "هل أنت متأكد من حذف هذا المدير؟"
                                  : "Are you sure you want to delete this manager?"
                              )
                            }
                          >
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            {isRTL ? "حذف" : "Delete"}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
