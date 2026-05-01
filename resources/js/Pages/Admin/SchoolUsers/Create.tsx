import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler } from "react";
import { useTheme } from "@/Contexts/ThemeContext";

// تعريف نوع المدرسة لاستقبالها
interface School {
  id: number;
  name: string;
}

export default function CreateSchoolAdmin({ school }: { school: School }) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const { data, setData, post, processing, errors } = useForm({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    // لاحظ كيف نرسل الـ ID في الرابط
    post(route("admin.schools.users.store", school.id));
  };

  return (
    <AuthenticatedLayout
      header={
        <h2
          className={`font-semibold text-xl ${
            isDark ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {isRTL ? "تعيين مدير للمدرسة" : "Assign School Admin"}
        </h2>
      }
    >
      <Head
        title={
          isRTL
            ? `إضافة مدير لـ ${school.name}`
            : `Add Manager to ${school.name}`
        }
      />

      <div
        className={`max-w-2xl mx-auto mt-10 ${
          isRTL ? "text-right" : "text-left"
        }`}
      >
        <div
          className={`p-8 rounded-2xl shadow-sm border ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          <div
            className={`mb-6 border-b pb-4 ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <h1
              className={`text-2xl font-bold ${
                isDark ? "text-white" : "text-brand-dark"
              }`}
            >
              {isRTL ? "مدير جديد" : "New Manager"}
            </h1>
            <p className={`mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {isRTL ? "تعيين مدير لـ:" : "Assigning a manager to:"}{" "}
              <span className="text-white font-bold bg-brand-primary px-2 py-1 rounded text-xs ml-1">
                {school.name}
              </span>
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Name */}
            <div>
              <label
                className={`block text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {isRTL ? "الاسم الكامل" : "Full Name"}
              </label>
              <input
                type="text"
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-brand-yellow focus:ring-brand-yellow ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "border-gray-300"
                }`}
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
              />
              {errors.name && (
                <div className="text-red-500 text-xs mt-1">{errors.name}</div>
              )}
            </div>

            {/* Email & Phone */}
            <div className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
              <div className={isRTL ? "text-right" : ""}>
                <label
                  className={`block text-sm font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {isRTL ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <input
                  type="email"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:border-brand-yellow focus:ring-brand-yellow ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                />
                {errors.email && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.email}
                  </div>
                )}
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <label
                  className={`block text-sm font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {isRTL ? "رقم الهاتف" : "Phone Number"}
                </label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:border-brand-yellow focus:ring-brand-yellow ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                  value={data.phone}
                  onChange={(e) => setData("phone", e.target.value)}
                  placeholder="9687..."
                />
                {errors.phone && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Passwords */}
            <div className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
              <div className={isRTL ? "text-right" : ""}>
                <label
                  className={`block text-sm font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {isRTL ? "كلمة المرور" : "Password"}
                </label>
                <input
                  type="password"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:border-brand-yellow focus:ring-brand-yellow ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                  value={data.password}
                  onChange={(e) => setData("password", e.target.value)}
                />
                {errors.password && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.password}
                  </div>
                )}
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <label
                  className={`block text-sm font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
                </label>
                <input
                  type="password"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:border-brand-yellow focus:ring-brand-yellow ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                  value={data.password_confirmation}
                  onChange={(e) =>
                    setData("password_confirmation", e.target.value)
                  }
                />
              </div>
            </div>

            <div
              className={`flex justify-end pt-4 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <Link
                href={route("admin.schools.index")}
                className={`px-4 py-2 mr-2 ${
                  isDark
                    ? "text-gray-400 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                } ${isRTL ? "ml-2 mr-0" : "mr-2"}`}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-opacity-90"
              >
                {isRTL ? "إنشاء الحساب" : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
