import { Head, Link } from "@inertiajs/react";
import { FormEventHandler, useState } from "react";
import {
  UserCircle2,
  User,
  Lock,
  School,
  MapPin,
  Navigation,
  PhoneCall,
  Globe,
  Briefcase,
  BadgeCheck,
  FileText,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState("advanced");
  const [showSuccess, setShowSuccess] = useState(false);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();

    setShowSuccess(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      setShowSuccess(false);
      setSelectedPlan("advanced");
      (e.target as HTMLFormElement).reset();
    }, 5000);
  };

  return (
    <div
      className="min-h-screen bg-[#f8f9fa] font-sans selection:bg-blue-200 selection:text-blue-900 flex flex-col"
      dir="rtl"
    >
      <Head>
        <title>نموذج الاشتراك المدرسي - مسارات واصل</title>
        <meta name="description" content="اشترك في منصة وصل للنقل المدرسي" />
        <link rel="icon" type="image/png" href="/assets/images/icon 3.png" />
      </Head>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center shadow-sm border border-blue-100 group-hover:shadow-md transition-all duration-300">
                <img
                  src="/assets/images/icon 3.png"
                  alt="شعار وصل"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                مسارات واصل
              </span>
            </Link>

            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ArrowRight size={16} /> العودة للرئيسية
              </Link>
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              <Link
                href={route("login")}
                className="px-5 py-2.5 text-sm font-bold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm"
              >
                تسجيل الدخول
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-20 lg:py-28">
        {/* Abstract Background Vectors */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-8 backdrop-blur-sm">
            <ShieldCheck size={16} className="text-emerald-400" />
            المنصة الأكثر أماناً للنقل المدرسي
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-6">
            ابدأ رحلتك مع{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              مسارات واصل
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            منصة ذكية متكاملة لإدارة النقل المدرسي بفعالية وأمان لضمان راحة
            المدارس وأولياء الأمور.
          </p>
        </div>
      </section>

      {/* Content & Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-16 sm:-mt-24 relative z-20 flex-grow w-full">
        {/* Success Notification */}
        <div
          className={`transition-all duration-500 ease-in-out transform ${
            showSuccess
              ? "translate-y-0 opacity-100 mb-8"
              : "-translate-y-10 opacity-0 h-0 overflow-hidden absolute"
          }`}
        >
          <div className="bg-emerald-50 border-2 border-emerald-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 shadow-xl shadow-emerald-500/10">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <BadgeCheck className="text-white w-7 h-7" />
            </div>
            <div className="text-center sm:text-right">
              <h3 className="text-emerald-900 font-bold text-lg">
                تم استلام طلبك بنجاح!
              </h3>
              <p className="text-emerald-700 font-medium mt-1">
                سيتم التواصل معك هاتفياً أو عبر البريد خلال 24 ساعة لتفعيل
                الحساب الخاص بك.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden"
        >
          <div className="p-8 sm:p-12 space-y-12">
            {/* Account Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <UserCircle2 size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  معلومات الحساب
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    className="text-sm font-bold text-slate-700 block"
                    htmlFor="username"
                  >
                    اسم المستخدم
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      id="username"
                      className="block w-full rounded-xl border-0 py-3.5 pr-11 pl-4 text-slate-800 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white hover:bg-slate-100 transition-all duration-200 sm:text-sm"
                      placeholder="Admin_School"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-bold text-slate-700 block"
                    htmlFor="password"
                  >
                    كلمة المرور المشرف
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      id="password"
                      className="block w-full rounded-xl border-0 py-3.5 pr-11 pl-4 text-slate-800 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white hover:bg-slate-100 transition-all duration-200 sm:text-sm"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    سيتم استخدامها لتسجيل الدخول بلوحة التحكم
                  </p>
                </div>
              </div>
            </div>

            {/* School Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <School size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  معلومات المدرسة/المؤسسة
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">
                    اسم المدرسة (باللغة العربية)
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      className="block w-full rounded-xl border-0 py-3.5 px-4 text-slate-800 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white hover:bg-slate-100 transition-all duration-200 sm:text-sm"
                      placeholder="مدرسة الأمل الحديثة"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">
                    School Name (English)
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      className="block w-full rounded-xl border-0 py-3.5 px-4 text-slate-800 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white hover:bg-slate-100 transition-all duration-200 sm:text-sm"
                      placeholder="Al-Amal Modern School"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">
                    المدينة / المحافظة
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <MapPin size={18} />
                    </div>
                    <input
                      type="text"
                      className="block w-full rounded-xl border-0 py-3.5 pr-11 pl-4 text-slate-800 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white hover:bg-slate-100 transition-all duration-200 sm:text-sm"
                      placeholder="صنعاء"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">
                    الاسم الكامل لمدير النظام
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Navigation size={18} />
                    </div>
                    <input
                      type="text"
                      className="block w-full rounded-xl border-0 py-3.5 pr-11 pl-4 text-slate-800 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white hover:bg-slate-100 transition-all duration-200 sm:text-sm"
                      placeholder="الاسم الرباعي"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <PhoneCall size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  معلومات الاتصال
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">
                    رقم الهاتف النشط
                  </label>
                  <div className="flex shadow-sm rounded-xl overflow-hidden ring-1 ring-inset ring-slate-200 focus-within:ring-2 focus-within:ring-blue-500 hover:bg-slate-100 transition-all duration-200 bg-slate-50">
                    <select
                      className="border-0 bg-transparent py-3.5 pl-3 pr-8 text-slate-600 focus:ring-0 sm:text-sm font-medium w-32 border-l border-slate-200"
                      defaultValue="+967"
                      dir="ltr"
                    >
                      <option value="+967">🇾🇪 +967</option>
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+20">🇪🇬 +20</option>
                    </select>
                    <input
                      type="tel"
                      className="block w-full border-0 py-3.5 px-4 text-slate-800 bg-transparent focus:ring-0 sm:text-sm"
                      placeholder="770000000"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 block">
                    لغة النظام المفضلة
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors z-10">
                      <Globe size={18} />
                    </div>
                    <select
                      className="block w-full rounded-xl border-0 py-3.5 pr-11 pl-4 text-slate-800 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white hover:bg-slate-100 transition-all duration-200 sm:text-sm font-medium  appearance-none"
                      required
                      defaultValue="ar"
                    >
                      <option value="ar">العربية (Arabic)</option>
                      <option value="en">English (US)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing / Packages */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <Briefcase size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  الباقة المناسبة
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic */}
                <div
                  onClick={() => setSelectedPlan("basic")}
                  className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-300 p-6 flex flex-col items-center text-center ${
                    selectedPlan === "basic"
                      ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10"
                      : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm"
                  }`}
                >
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    الباقة الأساسية
                  </h3>
                  <div className="text-3xl font-black text-slate-900 mb-1">
                    50$
                    <span className="text-sm text-slate-500 font-medium">
                      /شهر
                    </span>
                  </div>
                  <ul className="text-sm font-medium text-slate-600 mt-4 space-y-2">
                    <li className="flex items-center justify-center gap-2">
                      <Zap size={14} className="text-blue-500" /> إدارة حتى 5
                      حافلات
                    </li>
                    <li className="flex items-center justify-center gap-2">
                      <Zap size={14} className="text-blue-500" /> تطبيق السائق
                      فقط
                    </li>
                  </ul>
                </div>

                {/* Advanced (Recommended) */}
                <div
                  onClick={() => setSelectedPlan("advanced")}
                  className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-300 p-6 flex flex-col items-center text-center transform ${
                    selectedPlan === "advanced"
                      ? "border-blue-600 bg-blue-600 shadow-xl shadow-blue-600/20 scale-105"
                      : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`absolute -top-3.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                      selectedPlan === "advanced"
                        ? "bg-amber-400 text-amber-900"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    الأكثر شيوعاً
                  </div>
                  <h3
                    className={`text-lg font-bold mb-2 ${
                      selectedPlan === "advanced"
                        ? "text-white"
                        : "text-slate-800"
                    }`}
                  >
                    الباقة المتقدمة
                  </h3>
                  <div
                    className={`text-3xl font-black mb-1 ${
                      selectedPlan === "advanced"
                        ? "text-white"
                        : "text-slate-900"
                    }`}
                  >
                    120$
                    <span
                      className={`text-sm font-medium ${
                        selectedPlan === "advanced"
                          ? "text-blue-200"
                          : "text-slate-500"
                      }`}
                    >
                      /شهر
                    </span>
                  </div>
                  <ul
                    className={`text-sm font-medium mt-4 space-y-2 ${
                      selectedPlan === "advanced"
                        ? "text-blue-100"
                        : "text-slate-600"
                    }`}
                  >
                    <li className="flex items-center justify-center gap-2">
                      <Zap
                        size={14}
                        className={
                          selectedPlan === "advanced"
                            ? "text-amber-400"
                            : "text-blue-500"
                        }
                      />{" "}
                      إدارة حتى 15 حافلة
                    </li>
                    <li className="flex items-center justify-center gap-2">
                      <Zap
                        size={14}
                        className={
                          selectedPlan === "advanced"
                            ? "text-amber-400"
                            : "text-blue-500"
                        }
                      />{" "}
                      تطبيق السائق وولي الأمر
                    </li>
                    <li className="flex items-center justify-center gap-2">
                      <Zap
                        size={14}
                        className={
                          selectedPlan === "advanced"
                            ? "text-amber-400"
                            : "text-blue-500"
                        }
                      />{" "}
                      إشعارات فورية
                    </li>
                  </ul>
                </div>

                {/* Enterprise */}
                <div
                  onClick={() => setSelectedPlan("enterprise")}
                  className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-300 p-6 flex flex-col items-center text-center ${
                    selectedPlan === "enterprise"
                      ? "border-blue-500 bg-blue-50/50 shadow-md shadow-blue-500/10"
                      : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm"
                  }`}
                >
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    باقة المؤسسات
                  </h3>
                  <div className="text-3xl font-black text-slate-900 mb-1">
                    250$
                    <span className="text-sm text-slate-500 font-medium">
                      /شهر
                    </span>
                  </div>
                  <ul className="text-sm font-medium text-slate-600 mt-4 space-y-2">
                    <li className="flex items-center justify-center gap-2">
                      <Zap size={14} className="text-blue-500" /> حافلات غير
                      محدودة
                    </li>
                    <li className="flex items-center justify-center gap-2">
                      <Zap size={14} className="text-blue-500" /> تكامل API
                      وأدوات متقدمة
                    </li>
                    <li className="flex items-center justify-center gap-2">
                      <Zap size={14} className="text-blue-500" /> مدير حساب مخصص
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Extra Notes */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                  <FileText size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  ملاحظات إضافية (اختياري)
                </h2>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={4}
                  className="block w-full rounded-xl border-0 py-4 px-4 text-slate-800 bg-slate-50 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white hover:bg-slate-100 transition-all duration-200 sm:text-sm resize-y"
                  placeholder="اكتب متطلباتك الخاصة أو استفساراتك هنا لكي يتم الإجابة عليها عند التواصل معك..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Submit Area */}
          <div className="bg-slate-50 p-8 sm:p-12 border-t border-slate-100 flex flex-col items-center text-center">
            <p className="text-sm font-medium text-slate-500 mb-6 max-w-lg">
              بالنقر على "إرسال الطلب"، فإنك توافق على{" "}
              <a
                href="#"
                className="text-blue-600 hover:text-blue-800 underline font-bold transition-colors"
              >
                سياسة الخصوصية
              </a>{" "}
              و{" "}
              <a
                href="#"
                className="text-blue-600 hover:text-blue-800 underline font-bold transition-colors"
              >
                شروط الاستخدام
              </a>{" "}
              الخاصة بمنصة مسارات واصل.
            </p>

            <button
              type="submit"
              className="group relative overflow-hidden rounded-2xl bg-slate-900 px-12 py-4 text-lg font-bold text-white shadow-xl hover:shadow-2xl hover:bg-slate-800 transition-all duration-300 hover:-translate-y-1 w-full max-w-sm"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                إرسال الطلب الآن{" "}
                <ArrowRight
                  size={20}
                  className="transform group-hover:-translate-x-2 transition-transform"
                />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-inner"></div>
            </button>
          </div>
        </form>
      </div>

      {/* Solid Beautiful Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <img
                  src="/assets/images/icon 3.png"
                  alt="شعار وصل"
                  className="w-8 h-8 object-contain"
                />
                <span className="text-xl font-bold text-slate-800">
                  مسارات واصل
                </span>
              </Link>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                المنصة الأكثر ثقة لإدارة قطاع النقل المدرسي وتوفير بيئة نقل
                آمنة.
              </p>
            </div>
            <div className="md:col-span-1">
              <h4 className="font-bold text-slate-800 mb-4">المنتجات</h4>
              <ul className="space-y-2 text-sm text-slate-500 font-medium">
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    تطبيق الإدارة
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    تطبيق السائق
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    تطبيق ولي الأمر
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    تتبع مسار الأسطول
                  </a>
                </li>
              </ul>
            </div>
            <div className="md:col-span-1">
              <h4 className="font-bold text-slate-800 mb-4">خدمة العملاء</h4>
              <ul className="space-y-2 text-sm text-slate-500 font-medium">
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    مركز المساعدة
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    أتصل بنا
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    الدعم الفني المباشر
                  </a>
                </li>
              </ul>
            </div>
            <div className="md:col-span-1">
              <h4 className="font-bold text-slate-800 mb-4">القانونية</h4>
              <ul className="space-y-2 text-sm text-slate-500 font-medium">
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    شروط الاستخدام
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    سياسة الخصوصية
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    اتفاقية مستوى الخدمة
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 font-medium">
              © {new Date().getFullYear()} مسارات واصل. جميع الحقوق محفوظة.
            </p>
            <div className="flex gap-4">{/* Social Links could go here */}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
