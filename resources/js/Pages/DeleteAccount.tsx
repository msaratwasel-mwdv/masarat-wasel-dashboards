import { Head, Link, useForm } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { FormEventHandler } from "react";
import {
  Globe,
  Moon,
  Sun,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";

interface DeleteAccountProps {
  status?: string;
  ticket?: string;
}

export default function DeleteAccount({ status, ticket }: DeleteAccountProps) {
  const { isRTL, theme, toggleTheme, language, toggleLanguage } = useTheme();
  const isDark = theme === "dark";
  const isAr = language === "ar";

  const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
    name: "",
    phone: "",
    email: "",
    app_name: "خدمات مسارات واصل (Msarat Wasel Services)",
    account_role: "guardian",
    school_name: "",
    reason: "",
    confirm_understanding: false,
  });

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route("account.delete.store"), {
      onSuccess: () => {
        reset();
      },
    });
  };

  const isSubmitted = status === "success" || recentlySuccessful;

  // Typographic tokens
  const hClass = isDark ? "text-white" : "text-slate-900";
  const prose = isDark ? "text-slate-300" : "text-slate-700";
  const proseMuted = isDark ? "text-slate-400" : "text-slate-500";
  const borderClass = isDark ? "border-slate-800" : "border-slate-200";
  const inputClass = `w-full px-3.5 py-2 text-sm rounded-lg border bg-transparent transition-colors focus:outline-none ${
    isDark
      ? "border-slate-800 text-white placeholder:text-slate-600 focus:border-slate-400"
      : "border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-900"
  }`;

  return (
    <div
      className={`min-h-screen font-sans antialiased ${
        isDark ? "bg-[#0a0d14] text-slate-300" : "bg-white text-slate-800"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Head>
        <title>
          {isAr
            ? "طلب حذف الحساب والبيانات | مسارات واصل"
            : "Account & Data Deletion Request | Masarat Wasel"}
        </title>
        <meta
          name="description"
          content={
            isAr
              ? "طلب الحذف الدائم للحساب والبيانات الشخصية لتطبيقات مسارات واصل وفقاً لسياسات Google Play والمرسوم السلطاني رقم 6/2022."
              : "Official Account and Data Deletion Request for Masarat Wasel applications under Google Play policies and Omani Royal Decree 6/2022."
          }
        />
      </Head>

      {/* ── NAVBAR ── */}
      <nav
        className={`sticky top-0 z-50 border-b backdrop-blur-md ${
          isDark ? "bg-[#0a0d14]/90 border-slate-800/80" : "bg-white/90 border-slate-200/80"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/assets/images/masarat-wasel-logo.jpg"
              alt="Masarat Wasel"
              className="w-7 h-7 object-contain rounded-md border border-slate-200 dark:border-slate-800"
            />
            <span className={`text-sm font-semibold tracking-tight ${hClass}`}>
              {isAr ? "مسارات واصل" : "Masarat Wasel"}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={route("privacy.policy")}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <button
              onClick={toggleLanguage}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                isDark
                  ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
              }`}
            >
              <Globe size={12} className="text-amber-500" />
              <span>{isAr ? "English" : "عربي"}</span>
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-md border transition-colors ${
                isDark
                  ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300"
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {isRTL ? <ArrowRight size={12} /> : <ArrowLeft size={12} />}
              <span className="hidden sm:inline">{isAr ? "الرئيسية" : "Home"}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── CONTENT CONTAINER ── */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        {/* Header */}
        <header className="space-y-3 pb-8 border-b border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isAr ? "المطور: مسارات واصل • سلطنة عمان" : "Developer: Masarat Wasel • Sultanate of Oman"}
          </p>
          <h1 className={`text-2xl sm:text-3xl font-semibold tracking-tight ${hClass}`}>
            {isAr ? "حذف الحساب والبيانات الشخصية" : "Account & Data Deletion"}
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${proseMuted}`}>
            {isAr
              ? "تتيح مسارات واصل لجميع المستخدمين طلب الحذف الدائم للحساب والبيانات الشخصية المرتبطة به مباشرةً عبر هذه الصفحة، امتثالاً لسياسات Google Play وقانون حماية البيانات الشخصية الصادر بالمرسوم السلطاني رقم 6/2022."
              : "Masarat Wasel provides this dedicated portal allowing users to permanently delete their account and associated personal data directly without requiring app installation, adhering to Google Play policies and Omani Royal Decree 6/2022."}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>
              {isAr ? "التطبيقات المشمولة:" : "Covered Apps:"}{" "}
              <strong className="font-sans font-medium text-slate-700 dark:text-slate-300">
                {isAr
                  ? "خدمات مسارات واصل (Msarat Wasel Services) • مسارات واصل - ولي الأمر"
                  : "Msarat Wasel Services • Masarat Wasel Guardian"}
              </strong>
            </span>
          </div>
        </header>

        {/* Success Confirmation Notice */}
        {isSubmitted && (
          <section
            aria-live="polite"
            className={`p-5 rounded-lg border text-sm space-y-3 ${
              isDark
                ? "border-emerald-800/80 bg-emerald-950/20 text-emerald-200"
                : "border-emerald-200 bg-emerald-50/70 text-emerald-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
              <h2 className="font-semibold text-base">
                {isAr ? "تم تسجيل طلب الحذف بنجاح" : "Deletion Request Logged Successfully"}
              </h2>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed">
              {isAr
                ? "تم تعطيل الوصول إلى الحساب فوراً، وستكتمل عملية الحذف النهائي والتطهير الرقمي للبيانات خلال مدة لا تتجاوز 7 أيام عمل."
                : "Account access has been revoked immediately. Complete data purge will finalize within 7 business days."}
            </p>
            {ticket && (
              <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                <span className="text-emerald-700 dark:text-emerald-400">
                  {isAr ? "الرقم المرجعي للتذكرة:" : "Reference Ticket:"}
                </span>
                <span className="font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {ticket}
                </span>
              </div>
            )}
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 pt-2 border-t border-emerald-500/20">
              {isAr
                ? "إذا قُدّم هذا الطلب بالخطأ، يرجى مراسلة: msaratwasel@gmail.com أو الاتصال بـ 7769 7996 968+ فوراً."
                : "If requested in error, contact msaratwasel@gmail.com or call +968 7996 7769 immediately."}
            </p>
          </section>
        )}

        {/* Procedure Outline */}
        <section className="space-y-4">
          <h2 className={`text-xs font-mono uppercase tracking-wider font-semibold ${hClass}`}>
            {isAr ? "خطوات التنفيذ والجدول الزمني" : "Process & Timeline"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1">
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">01</span>
              <h3 className={`text-sm font-medium ${hClass}`}>
                {isAr ? "تقديم البيانات" : "Submit Details"}
              </h3>
              <p className={`text-xs leading-relaxed ${proseMuted}`}>
                {isAr
                  ? "إدخال الاسم ورقم الهاتف المسجل واختيار التطبيق التابع له."
                  : "Submit registered phone, name, and associated application."}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">02</span>
              <h3 className={`text-sm font-medium ${hClass}`}>
                {isAr ? "التعطيل الفوري" : "Instant Deactivation"}
              </h3>
              <p className={`text-xs leading-relaxed ${proseMuted}`}>
                {isAr
                  ? "تعطيل صلاحيات الدخول وإلغاء جلسات الأجهزة المسجلة فوراً."
                  : "Immediate authentication revocation and session invalidation."}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">03</span>
              <h3 className={`text-sm font-medium ${hClass}`}>
                {isAr ? "التطهير النهائي" : "Complete Purge"}
              </h3>
              <p className={`text-xs leading-relaxed ${proseMuted}`}>
                {isAr
                  ? "حذف السجلات نهائياً خلال 7 أيام عمل وإصدار تذكرة مرجعية."
                  : "Permanent database wipe within 7 business days with reference code."}
              </p>
            </div>
          </div>
        </section>

        {/* Data Schedule: What is deleted vs What is retained */}
        <section className="space-y-4 pt-2">
          <h2 className={`text-xs font-mono uppercase tracking-wider font-semibold ${hClass}`}>
            {isAr ? "بيان البيانات المحذوفة والمستبقاة" : "Data Deletion & Retention Schedule"}
          </h2>

          <div className={`border rounded-lg divide-y text-xs sm:text-sm ${borderClass} divide-slate-200 dark:divide-slate-800`}>
            {/* Row 1: Deleted */}
            <div className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {isAr ? "البيانات التي تُحذف نهائياً" : "Data Permanently Deleted"}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {isAr ? "خلال 7 أيام عمل" : "Within 7 business days"}
                </span>
              </div>
              <ul className={`space-y-1.5 leading-relaxed list-disc list-inside ${proseMuted}`}>
                <li>
                  <strong className={`font-normal ${hClass}`}>
                    {isAr ? "بيانات الهوية والحساب: " : "Identity & credentials: "}
                  </strong>
                  {isAr
                    ? "الاسم، رقم الهاتف، البريد الإلكتروني، وكلمات المرور المشفرة."
                    : "Name, phone number, email address, and encrypted credentials."}
                </li>
                <li>
                  <strong className={`font-normal ${hClass}`}>
                    {isAr ? "معرفات الأجهزة: " : "Device tokens: "}
                  </strong>
                  {isAr
                    ? "رموز إشعارات FCM ومعلومات الجلسات النشطة."
                    : "FCM push notification tokens and active sessions."}
                </li>
                <li>
                  <strong className={`font-normal ${hClass}`}>
                    {isAr ? "التتبع والربط: " : "Telemetry & links: "}
                  </strong>
                  {isAr
                    ? "بيانات التتبع اللحظي المؤقتة وفك ارتباط أولياء الأمور بالطلاب."
                    : "Live location caches and parent-student relationship mapping."}
                </li>
              </ul>
            </div>

            {/* Row 2: Retained */}
            <div className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {isAr ? "البيانات المستبقاة قانونياً وأسبابها" : "Data Retained for Legal Compliance"}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {isAr ? "مدد نظامية محددة" : "Statutory periods"}
                </span>
              </div>
              <ul className={`space-y-1.5 leading-relaxed list-disc list-inside ${proseMuted}`}>
                <li>
                  <strong className={`font-normal ${hClass}`}>
                    {isAr ? "سجلات الفواتير والاشتراكات: " : "Financial & billing records: "}
                  </strong>
                  {isAr
                    ? "تُحفظ لمدة 5 سنوات التزاماً بأحكام القانون التجاري والضريبي العماني."
                    : "Retained for 5 years in compliance with Omani commercial and fiscal tax regulations."}
                </li>
                <li>
                  <strong className={`font-normal ${hClass}`}>
                    {isAr ? "سجلات سلامة الحافلات (مجهولة الهوية): " : "Anonymized transit safety logs: "}
                  </strong>
                  {isAr
                    ? "تُحفظ بصيغة مجهولة ومفصولة عن الهوية لمدة سنة دراسية واحدة (365 يوماً) لرقابة النقل المدرسي."
                    : "Retained in anonymized, decoupled form for 1 academic year (365 days) for school transit safety audits."}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Deletion Request Form */}
        <section className="space-y-6 pt-2">
          <div className="space-y-1">
            <h2 className={`text-base font-semibold ${hClass}`}>
              {isAr ? "نموذج طلب حذف الحساب" : "Deletion Request Form"}
            </h2>
            <p className={`text-xs sm:text-sm ${proseMuted}`}>
              {isAr
                ? "أدخل بيانات حسابك بدقة لمطابقتها في قاعدة البيانات وتنفيذ الحذف."
                : "Enter your registered account credentials to verify identity and execute deletion."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${hClass}`}>
                {isAr ? "الاسم الكامل المسجل *" : "Registered Full Name *"}
              </label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
                placeholder={isAr ? "مثال: أحمد بن علي المعمري" : "e.g. Ahmed Al-Maamari"}
                className={inputClass}
                required
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${hClass}`}>
                  {isAr ? "رقم الهاتف المسجل *" : "Registered Phone Number *"}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={data.phone}
                  onChange={(e) => setData("phone", e.target.value)}
                  placeholder="+968 9XXXXXXX"
                  className={`${inputClass} text-start font-mono`}
                  required
                />
                {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${hClass}`}>
                  {isAr ? "البريد الإلكتروني (إن وجد)" : "Email Address (Optional)"}
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                  placeholder="name@example.com"
                  className={`${inputClass} text-start font-mono`}
                />
                {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* App & Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${hClass}`}>
                  {isAr ? "التطبيق المعني *" : "Target Application *"}
                </label>
                <select
                  value={data.app_name}
                  onChange={(e) => setData("app_name", e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="خدمات مسارات واصل (Msarat Wasel Services)">
                    {isAr
                      ? "خدمات مسارات واصل (Msarat Wasel Services)"
                      : "Msarat Wasel Services (Driver/Supervisor)"}
                  </option>
                  <option value="مسارات واصل - ولي الأمر (Masarat Wasel Guardian)">
                    {isAr
                      ? "مسارات واصل - ولي الأمر (Masarat Wasel Guardian)"
                      : "Masarat Wasel Guardian (Parent app)"}
                  </option>
                </select>
                {errors.app_name && <p className="text-xs text-rose-500 mt-1">{errors.app_name}</p>}
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1.5 ${hClass}`}>
                  {isAr ? "نوع الحساب / الدور *" : "Account Role *"}
                </label>
                <select
                  value={data.account_role}
                  onChange={(e) => setData("account_role", e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="guardian">{isAr ? "ولي أمر طالب" : "Student Guardian"}</option>
                  <option value="driver">{isAr ? "سائق حافلة مدرسية" : "School Bus Driver"}</option>
                  <option value="supervisor">{isAr ? "مشرف حافلة مدرسية" : "Bus Supervisor"}</option>
                  <option value="other">{isAr ? "مستخدم آخر" : "Other"}</option>
                </select>
                {errors.account_role && <p className="text-xs text-rose-500 mt-1">{errors.account_role}</p>}
              </div>
            </div>

            {/* School Name */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${hClass}`}>
                {isAr ? "اسم المدرسة المرتبطة (اختياري)" : "Associated School (Optional)"}
              </label>
              <input
                type="text"
                value={data.school_name}
                onChange={(e) => setData("school_name", e.target.value)}
                placeholder={isAr ? "مثال: مدرسة مسقط للتعليم الأساسي" : "e.g. Muscat Basic Education School"}
                className={inputClass}
              />
            </div>

            {/* Reason */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${hClass}`}>
                {isAr ? "سبب طلب الحذف (اختياري)" : "Reason for Deletion (Optional)"}
              </label>
              <textarea
                rows={2}
                value={data.reason}
                onChange={(e) => setData("reason", e.target.value)}
                placeholder={
                  isAr
                    ? "تخرج الطالب، انتهاء عقد النقل، عدم الحاجة للتطبيق..."
                    : "Student graduated, contract ended, no longer needed..."
                }
                className={inputClass}
              />
            </div>

            {/* Confirmation Checkbox */}
            <div className={`pt-2 pb-1`}>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={data.confirm_understanding}
                  onChange={(e) => setData("confirm_understanding", e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-0"
                  required
                />
                <span className={`text-xs leading-relaxed ${proseMuted}`}>
                  <strong className={hClass}>
                    {isAr
                      ? "أؤكد رغبتي في الحذف النهائي للحساب والبيانات التابعة له. "
                      : "I confirm my request to permanently delete this account and associated data. "}
                  </strong>
                  {isAr
                    ? "وأدرك أن هذا الإجراء نهائي ولا يمكن التراجع عنه أو استعادة الإشعارات وسجلات الحافلة بعد اكتماله."
                    : "I understand that this action is irreversible and active notifications or bus tracking cannot be restored."}
                </span>
              </label>
              {errors.confirm_understanding && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.confirm_understanding}
                </p>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link
                href={route("privacy.policy")}
                className={`text-xs hover:underline ${proseMuted}`}
              >
                {isAr ? "← العودة إلى سياسة الخصوصية" : "← Back to Privacy Policy"}
              </Link>

              <button
                type="submit"
                disabled={processing}
                className={`px-5 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${
                  isDark
                    ? "bg-white text-slate-950 hover:bg-slate-200 disabled:opacity-50"
                    : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{isAr ? "جارٍ إرسال الطلب..." : "Submitting..."}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>{isAr ? "تأكيد وإرسال طلب الحذف" : "Submit Deletion Request"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Alternative Email Support */}
        <section className={`pt-6 border-t ${borderClass} text-xs ${proseMuted} space-y-1`}>
          <p>
            {isAr
              ? "طريقة بديلة: يمكنك أيضاً إرسال طلب الحذف بالبريد الإلكتروني إلى مسؤول حماية البيانات:"
              : "Alternative method: You may also email our Data Protection Officer directly:"}{" "}
            <a
              href="mailto:msaratwasel@gmail.com?subject=Account%20Deletion%20Request%20-%20Masarat%20Wasel"
              className={`font-mono underline ${hClass}`}
            >
              msaratwasel@gmail.com
            </a>
          </p>
          <p>
            {isAr
              ? "يرجى تضمين رقم الهاتف والاسم المسجل واسم التطبيق للتحقق من ملكية الحساب."
              : "Please include your registered phone number, full name, and application name to verify ownership."}
          </p>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className={`border-t py-8 text-xs ${borderClass} ${proseMuted}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>
            {isAr
              ? "© 2026 مسارات واصل. خاضع لقانون حماية البيانات الشخصية العماني (6/2022)."
              : "© 2026 Masarat Wasel. Governed by Omani Personal Data Protection Law (6/2022)."}
          </span>
          <div className="flex items-center gap-5 font-medium">
            <Link href="/" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-slate-900"}`}>
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <Link
              href={route("privacy.policy")}
              className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-slate-900"}`}
            >
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <Link
              href={route("subscription")}
              className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-slate-900"}`}
            >
              {isAr ? "الاشتراكات" : "Subscriptions"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
