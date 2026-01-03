import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext"; // تأكد من المسار الصحيح

// 1. تعريف شكل البيانات القادمة من الـ DB
interface School {
  id: number;
  name: string;
  location: string;
  status: string; // Active or Inactive
  has_transport: number; // يأتي 0 أو 1 من قاعدة البيانات
  has_attendance: number;
}

// 2. استقبال البيانات عبر الـ Props
export default function SchoolsIndex({ schools }: { schools: School[] }) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <AuthenticatedLayout
      header={
        <h2
          className={`font-semibold text-xl ${
            isDark ? "text-gray-200" : "text-gray-800"
          } leading-tight`}
        >
          {isRTL ? "إدارة المدارس" : "Manage Schools"}
        </h2>
      }
    >
      <Head title={isRTL ? "إدارة المدارس" : "Manage Schools"} />

      {/* --- Page Header --- */}
      <div
        className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <div className={isRTL ? "text-right" : "text-left"}>
          <h1
            className={`text-3xl font-bold ${
              isDark ? "text-white" : "text-brand-dark"
            } mb-1`}
          >
            {isRTL ? "إدارة المدارس" : "Manage Schools"}
          </h1>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            {isRTL
              ? "نظرة عامة على جميع المدارس المسجلة"
              : "Overview of all registered partners"}
          </p>
        </div>

        <Link
          href={route("admin.schools.create")}
          className={`flex items-center px-6 py-3 bg-brand-yellow text-brand-dark font-bold rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <svg
            className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`}
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
          {isRTL ? "تسجيل مدرسة جديدة" : "Register New School"}
        </Link>
      </div>

      {/* --- Schools Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 3. التأكد من وجود مدارس قبل العرض */}
        {schools.length === 0 ? (
          <div
            className={`col-span-3 text-center py-10 ${
              isDark
                ? "text-gray-400 bg-gray-800 border-gray-700"
                : "text-gray-500 bg-white border-gray-100"
            } rounded-lg shadow-sm border`}
          >
            <p className="text-lg mb-2">
              {isRTL
                ? "لا توجد مدارس مسجلة حتى الآن."
                : "No schools registered yet."}
            </p>
            <p className="text-sm">
              {isRTL
                ? "ابدأ بإضافة مدرسة جديدة عبر الزر في الأعلى."
                : "Start by adding a new school via the button above."}
            </p>
          </div>
        ) : (
          schools.map((school) => (
            <div
              key={school.id}
              className={`rounded-2xl shadow-sm border hover:shadow-md transition-shadow duration-300 p-6 flex flex-col ${
                isDark
                  ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                  : "bg-white border-gray-100 hover:border-gray-200"
              }`}
            >
              {/* Card Header */}
              <div
                className={`flex justify-between items-start mb-4 ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <div className={isRTL ? "text-right" : "text-left"}>
                  <h3
                    className={`text-lg font-bold leading-tight mb-1 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {school.name}
                  </h3>
                  <div
                    className={`flex items-center text-sm ${
                      isRTL ? "flex-row-reverse" : ""
                    } ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    <svg
                      className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`}
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
                    {school.location || (isRTL ? "غير محدد" : "Undefined")}
                  </div>
                </div>
                <Link
                  href={route("admin.schools.toggle", school.id)}
                  method="post"
                  as="button"
                  preserveScroll
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border transition-all hover:opacity-80 ${
                    school.status === "Active"
                      ? isDark
                        ? "bg-green-900/30 text-green-400 border-green-800 hover:bg-red-900/30 hover:text-red-400 hover:border-red-800"
                        : "bg-green-50 text-green-600 border-green-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                      : isDark
                      ? "bg-red-900/30 text-red-400 border-red-800 hover:bg-green-900/30 hover:text-green-400 hover:border-green-800"
                      : "bg-red-50 text-red-500 border-red-100 hover:bg-green-50 hover:text-green-600 hover:border-green-100"
                  }`}
                >
                  <span
                    className={`flex items-center gap-1 ${
                      isRTL ? "flex-row-reverse" : ""
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        school.status === "Active"
                          ? isDark
                            ? "bg-green-500"
                            : "bg-green-500"
                          : isDark
                          ? "bg-red-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    {isRTL
                      ? school.status === "Active"
                        ? "نشط"
                        : "غير نشط"
                      : school.status}
                  </span>
                </Link>
              </div>

              {/* Subscription Plan Section */}
              <div className="mb-6">
                <p
                  className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                    isDark ? "text-gray-500" : "text-gray-300"
                  }`}
                >
                  {isRTL ? "الاشتراك" : "Subscription Plan"}
                </p>
                <div className="space-y-2">
                  {/* Transport Logic */}
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isRTL ? "flex-row-reverse" : ""
                    } ${
                      Boolean(school.has_transport)
                        ? isDark
                          ? "bg-blue-900/20 border-blue-800"
                          : "bg-blue-50/50 border-blue-100"
                        : isDark
                        ? "bg-gray-800 border-gray-700 opacity-70"
                        : "bg-gray-50 border-gray-100 opacity-60"
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${isRTL ? "ml-3" : "mr-3"} ${
                          Boolean(school.has_transport)
                            ? isDark
                              ? "text-blue-400"
                              : "text-brand-dark"
                            : isDark
                            ? "text-gray-500"
                            : "text-gray-400"
                        }`}
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
                      <span
                        className={`text-sm font-bold ${
                          Boolean(school.has_transport)
                            ? isDark
                              ? "text-blue-400"
                              : "text-brand-dark"
                            : isDark
                            ? "text-gray-500"
                            : "text-gray-400"
                        }`}
                      >
                        {isRTL ? "النقل والتتبع" : "TRANSPORT & TRACKING"}
                      </span>
                    </div>
                    {Boolean(school.has_transport) ? (
                      <div
                        className={`w-5 h-5 rounded-full ${
                          isDark ? "bg-blue-500" : "bg-brand-dark"
                        } text-white flex items-center justify-center`}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${
                          isDark
                            ? "border-gray-600 text-gray-600"
                            : "border-gray-300 text-gray-300"
                        } flex items-center justify-center`}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Attendance Logic */}
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isRTL ? "flex-row-reverse" : ""
                    } ${
                      Boolean(school.has_attendance)
                        ? isDark
                          ? "bg-green-900/20 border-green-800"
                          : "bg-green-50/50 border-green-100"
                        : isDark
                        ? "bg-gray-800 border-gray-700 opacity-70"
                        : "bg-gray-50 border-gray-100 opacity-60"
                    }`}
                  >
                    <div
                      className={`flex items-center ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 ${isRTL ? "ml-3" : "mr-3"} ${
                          Boolean(school.has_attendance)
                            ? isDark
                              ? "text-green-400"
                              : "text-green-600"
                            : isDark
                            ? "text-gray-500"
                            : "text-gray-400"
                        }`}
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
                      <span
                        className={`text-sm font-bold ${
                          Boolean(school.has_attendance)
                            ? isDark
                              ? "text-green-400"
                              : "text-green-600"
                            : isDark
                            ? "text-gray-500"
                            : "text-gray-400"
                        }`}
                      >
                        {isRTL ? "نظام الحضور" : "ATTENDANCE SYSTEM"}
                      </span>
                    </div>
                    {Boolean(school.has_attendance) ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div
                        className={`w-5 h-5 rounded-full border-2 ${
                          isDark
                            ? "border-gray-600 text-gray-600"
                            : "border-gray-300 text-gray-300"
                        } flex items-center justify-center`}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div
                className={`mt-auto pt-6 ${
                  isDark ? "border-gray-700" : "border-gray-100"
                } border-t grid grid-cols-4 gap-2`}
              >
                {/* Details Button */}
                <Link
                  href={route("admin.schools.show", school.id)}
                  className="flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                >
                  <div
                    className={`p-2 rounded-lg mb-1 transition-colors ${
                      isDark
                        ? "group-hover:bg-blue-900/20"
                        : "group-hover:bg-blue-50"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide">
                    {isRTL ? "تفاصيل" : "Details"}
                  </span>
                </Link>

                {/* Edit Button */}
                <Link
                  href={route("admin.schools.edit", school.id)}
                  className="flex flex-col items-center justify-center text-gray-400 hover:text-brand-yellow transition-colors group"
                >
                  <div
                    className={`p-2 rounded-lg mb-1 transition-colors ${
                      isDark
                        ? "group-hover:bg-yellow-900/20"
                        : "group-hover:bg-yellow-50"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide">
                    {isRTL ? "تعديل" : "Edit"}
                  </span>
                </Link>

                {/* Delete Button */}
                <button
                  onClick={() => {
                    if (
                      confirm(
                        isRTL
                          ? "هل أنت متأكد من حذف هذه المدرسة؟ لا يمكن التراجع عن هذا الإجراء."
                          : "Are you sure you want to delete this school? This action cannot be undone."
                      )
                    ) {
                      router.delete(route("admin.schools.destroy", school.id));
                    }
                  }}
                  className="flex flex-col items-center justify-center text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors group"
                >
                  <div
                    className={`p-2 rounded-lg mb-1 transition-colors ${
                      isDark
                        ? "group-hover:bg-red-900/20"
                        : "group-hover:bg-red-50"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
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
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide">
                    {isRTL ? "حذف" : "Delete"}
                  </span>
                </button>

                {/* Add Admin Button */}
                <Link
                  href={route("admin.schools.users.create", school.id)}
                  className="flex flex-col items-center justify-center text-gray-400 hover:text-brand-dark dark:hover:text-gray-200 transition-colors group"
                >
                  <div
                    className={`p-2 rounded-lg mb-1 transition-colors ${
                      isDark
                        ? "group-hover:bg-gray-700"
                        : "group-hover:bg-gray-100"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide">
                    {isRTL ? "إضافة مدير" : "Add Admin"}
                  </span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </AuthenticatedLayout>
  );
}
