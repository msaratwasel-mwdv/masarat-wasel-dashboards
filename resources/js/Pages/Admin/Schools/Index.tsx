import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";

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
  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Manage Schools
        </h2>
      }
    >
      <Head title="Manage Schools" />

      {/* --- Page Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark mb-1">
            Manage Schools
          </h1>
          <p className="text-gray-500 text-sm">
            Overview of all registered partners
          </p>
        </div>

        <Link
          href={route("admin.schools.create")} // سنقوم بإنشاء هذا الرابط لاحقاً
          className="flex items-center px-6 py-3 bg-brand-yellow text-brand-dark font-bold rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          <svg
            className="w-5 h-5 mr-2"
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
          Register New School
        </Link>
      </div>

      {/* --- Schools Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* 3. التأكد من وجود مدارس قبل العرض */}
        {schools.length === 0 ? (
          <div className="col-span-3 text-center py-10 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="text-lg">لا توجد مدارس مسجلة حتى الآن.</p>
            <p className="text-sm">
              ابدأ بإضافة مدرسة جديدة عبر الزر في الأعلى.
            </p>
          </div>
        ) : (
          schools.map((school) => (
            <div
              key={school.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 p-6 flex flex-col"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                    {school.name}
                  </h3>
                  <div className="flex items-center text-gray-400 text-sm">
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
                    {school.location || "غير محدد"}
                  </div>
                </div>
                <Link
                  href={route("admin.schools.toggle", school.id)}
                  method="post"
                  as="button"
                  preserveScroll
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border transition-all hover:opacity-80 ${
                    school.status === "Active"
                      ? "bg-green-50 text-green-600 border-green-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100" // عند التحويم يتحول للأحمر للإشارة للإيقاف
                      : "bg-red-50 text-red-500 border-red-100 hover:bg-green-50 hover:text-green-600 hover:border-green-100" // عند التحويم يتحول للأخضر للإشارة للتفعيل
                  }`}
                >
                  {/* نعرض أيقونة صغيرة لتبدو تفاعلية */}
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        school.status === "Active"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    {school.status}
                  </span>
                </Link>
              </div>

              {/* Subscription Plan Section (كان مفقوداً في كودك) */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
                  Subscription Plan
                </p>
                <div className="space-y-2">
                  {/* Transport Logic */}
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      Boolean(school.has_transport)
                        ? "bg-blue-50/50 border-blue-100"
                        : "bg-gray-50 border-gray-100 opacity-60"
                    }`}
                  >
                    <div className="flex items-center">
                      <svg
                        className={`w-5 h-5 mr-3 ${
                          Boolean(school.has_transport)
                            ? "text-brand-dark"
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
                            ? "text-brand-dark"
                            : "text-gray-400"
                        }`}
                      >
                        TRANSPORT & TRACKING
                      </span>
                    </div>
                    {Boolean(school.has_transport) ? (
                      <div className="w-5 h-5 rounded-full bg-brand-dark text-white flex items-center justify-center">
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
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 text-gray-300 flex items-center justify-center">
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
                      Boolean(school.has_attendance)
                        ? "bg-green-50/50 border-green-100"
                        : "bg-gray-50 border-gray-100 opacity-60"
                    }`}
                  >
                    <div className="flex items-center">
                      <svg
                        className={`w-5 h-5 mr-3 ${
                          Boolean(school.has_attendance)
                            ? "text-green-600"
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
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        ATTENDANCE SYSTEM
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
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 text-gray-300 flex items-center justify-center">
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
              <div className="mt-auto pt-6 border-t border-gray-100 grid grid-cols-4 gap-2">
                <button className="flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 transition-colors group">
                  <Link
                    href={route("admin.schools.show", school.id)} // 👇 الرابط الجديد
                    className="flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 transition-colors group"
                  >
                    <div className="p-2 rounded-lg group-hover:bg-blue-50 transition-colors mb-1">
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
                      Details
                    </span>
                  </Link>
                </button>

                <button className="flex flex-col items-center justify-center text-gray-400 hover:text-brand-yellow transition-colors group">
                  <Link
                    href={route("admin.schools.edit", school.id)} // رابط صفحة التعديل
                    className="flex flex-col items-center justify-center text-gray-400 hover:text-brand-yellow transition-colors group"
                  >
                    <div className="p-2 rounded-lg group-hover:bg-yellow-50 transition-colors mb-1">
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
                      Edit
                    </span>
                  </Link>
                </button>

                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to delete this school? This action cannot be undone."
                      )
                    ) {
                      router.delete(route("admin.schools.destroy", school.id));
                    }
                  }}
                  className="flex flex-col items-center justify-center text-gray-400 hover:text-red-500 transition-colors group"
                >
                  <div className="p-2 rounded-lg group-hover:bg-red-50 transition-colors mb-1">
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
                    Delete
                  </span>
                </button>

                <button className="flex flex-col items-center justify-center text-gray-400 hover:text-brand-dark transition-colors group">
                  <div className="p-2 rounded-lg group-hover:bg-gray-100 transition-colors mb-1">
                    <Link
                      href={route("admin.schools.users.create", school.id)} // 👇 الرابط السحري
                      className="flex flex-col items-center justify-center text-gray-400 hover:text-brand-dark transition-colors group"
                    >
                      <div className="p-2 rounded-lg group-hover:bg-gray-100 transition-colors mb-1">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {/* أيقونة مستخدم + */}
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wide">
                        Add Admin
                      </span>
                    </Link>
                  </div>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AuthenticatedLayout>
  );
}
