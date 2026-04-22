import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { PageProps } from "@/types";
import { Head, usePage, useForm } from "@inertiajs/react";
import { FormEventHandler, useRef, useState, useEffect } from "react";
import InputError from "@/Components/InputError";
import { Transition } from "@headlessui/react";

export default function Edit({
  mustVerifyEmail,
  status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
  const user = usePage().props.auth.user;
  const { locale } = usePage().props as any;

  const Layout =
    user.role === "school_admin"
      ? SchoolAuthenticatedLayout
      : AuthenticatedLayout;

  // ─── Theme State ───
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isDark);
  };

  // ─── Language State ───
  const currentLang = (locale as string) || "ar";
  const isRtl = currentLang === "ar";

  const switchLanguage = (lang: string) => {
    window.location.href = `/lang/${lang}`;
  };

  // ─── Password Form ───
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);

  const {
    data,
    setData,
    errors,
    put,
    reset,
    processing,
    recentlySuccessful,
  } = useForm({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const updatePassword: FormEventHandler = (e) => {
    e.preventDefault();
    put(route("password.update"), {
      preserveScroll: true,
      onSuccess: () => reset(),
      onError: (errors) => {
        if (errors.password) {
          reset("password", "password_confirmation");
          passwordInput.current?.focus();
        }
        if (errors.current_password) {
          reset("current_password");
          currentPasswordInput.current?.focus();
        }
      },
    });
  };

  // ─── Section Card Component ───
  const SectionCard = ({
    icon,
    title,
    subtitle,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden transition-all hover:shadow-md">
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-gradient-to-r from-[#041b3a] to-[#1B3A5C]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl text-white">{icon}</div>
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-xs text-white/60 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  return (
    <Layout user={user}>
      <Head title={isRtl ? "الإعدادات" : "Settings"} />

      <div className="py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {isRtl ? "الإعدادات" : "Settings"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isRtl
                ? "إدارة إعدادات حسابك وتخصيص النظام"
                : "Manage your account settings and customize the system"}
            </p>
          </div>

          <div className="space-y-6">
            {/* ═══════════ 1. THEME SECTION ═══════════ */}
            <SectionCard
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  {isDark ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  )}
                </svg>
              }
              title={isRtl ? "المظهر" : "Appearance"}
              subtitle={
                isRtl
                  ? "تخصيص مظهر الواجهة"
                  : "Customize the interface appearance"
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">
                    {isRtl ? "الوضع الداكن" : "Dark Mode"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isRtl
                      ? isDark
                        ? "الوضع الداكن مفعّل حالياً"
                        : "الوضع الفاتح مفعّل حالياً"
                      : isDark
                        ? "Dark mode is currently enabled"
                        : "Light mode is currently enabled"}
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isDark ? "bg-blue-600" : "bg-slate-300"
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${isDark
                        ? isRtl
                          ? "translate-x-1"
                          : "translate-x-6"
                        : isRtl
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                  />
                </button>
              </div>
            </SectionCard>

            {/* ═══════════ 2. LANGUAGE SECTION ═══════════ */}
            <SectionCard
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
              }
              title={isRtl ? "اللغة" : "Language"}
              subtitle={
                isRtl
                  ? "اختيار لغة واجهة النظام"
                  : "Choose the system interface language"
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => switchLanguage("ar")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${currentLang === "ar"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                      : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                >
                  <span className="text-lg">🇸🇦</span>
                  العربية
                  {currentLang === "ar" && (
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => switchLanguage("en")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${currentLang === "en"
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                      : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                >
                  <span className="text-lg">🇺🇸</span>
                  English
                  {currentLang === "en" && (
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </SectionCard>

            {/* ═══════════ 3. CHANGE PASSWORD SECTION ═══════════ */}
            <SectionCard
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
              title={isRtl ? "تغيير كلمة المرور" : "Change Password"}
              subtitle={
                isRtl
                  ? "تأكد من استخدام كلمة مرور قوية وآمنة"
                  : "Ensure your account uses a strong, secure password"
              }
            >
              <form onSubmit={updatePassword} className="space-y-5">
                <div>
                  <label
                    htmlFor="current_password"
                    className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {isRtl ? "كلمة المرور الحالية" : "Current Password"}
                  </label>
                  <input
                    id="current_password"
                    ref={currentPasswordInput}
                    value={data.current_password}
                    onChange={(e) =>
                      setData("current_password", e.target.value)
                    }
                    type="password"
                    autoComplete="current-password"
                    className="block w-full rounded-xl border-0 py-3 px-4 text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700/50 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-600 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <InputError
                    message={errors.current_password}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {isRtl ? "كلمة المرور الجديدة" : "New Password"}
                  </label>
                  <input
                    id="password"
                    ref={passwordInput}
                    value={data.password}
                    onChange={(e) => setData("password", e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    className="block w-full rounded-xl border-0 py-3 px-4 text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700/50 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-600 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <InputError message={errors.password} className="mt-1.5" />
                </div>

                <div>
                  <label
                    htmlFor="password_confirmation"
                    className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {isRtl ? "تأكيد كلمة المرور" : "Confirm Password"}
                  </label>
                  <input
                    id="password_confirmation"
                    value={data.password_confirmation}
                    onChange={(e) =>
                      setData("password_confirmation", e.target.value)
                    }
                    type="password"
                    autoComplete="new-password"
                    className="block w-full rounded-xl border-0 py-3 px-4 text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700/50 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-600 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <InputError
                    message={errors.password_confirmation}
                    className="mt-1.5"
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#041b3a] to-[#1B3A5C] hover:from-[#1B3A5C] hover:to-[#244b73] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isRtl ? "حفظ التغييرات" : "Save Changes"}
                  </button>
                  <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                  >
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {isRtl ? "✓ تم الحفظ بنجاح" : "✓ Saved successfully"}
                    </p>
                  </Transition>
                </div>
              </form>
            </SectionCard>

            {/* ═══════════ 4. ACCOUNT INFO (READ-ONLY) ═══════════ */}
            <SectionCard
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
              title={isRtl ? "معلومات الحساب" : "Account Information"}
              subtitle={
                isRtl
                  ? "بيانات حسابك — للعرض فقط"
                  : "Your account details — read only"
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-100 dark:border-slate-600/30">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {isRtl ? "الاسم" : "Name"}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {user.name}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-100 dark:border-slate-600/30">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {isRtl ? "البريد الإلكتروني" : "Email"}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {user.email}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-100 dark:border-slate-600/30">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {isRtl ? "الدور" : "Role"}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {user.role === "school_admin"
                      ? isRtl
                        ? "مدير المدرسة"
                        : "School Admin"
                      : user.role === "admin"
                        ? isRtl
                          ? "مدير النظام"
                          : "System Admin"
                        : user.role}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-100 dark:border-slate-600/30">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    {isRtl ? "الهاتف" : "Phone"}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {(user as any).phone || (isRtl ? "غير محدد" : "Not set")}
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* ═══════════ 5. SYSTEM VERSION ═══════════ */}
            <div className="text-center py-4">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {isRtl ? "مسارات واصل — نظام النقل المدرسي الذكي" : "Masarat Wasel — Smart Transport System"}{" "}
                · v1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
