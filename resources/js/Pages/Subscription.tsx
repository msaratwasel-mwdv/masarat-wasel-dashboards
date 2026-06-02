import { Head, Link, useForm } from "@inertiajs/react";
import { FormEventHandler, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PlanOption from "@/Components/PlanOption";
import PlanSelectorGrid from "@/Components/PlanSelectorGrid";
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
  ChevronLeft,
  Loader2,
  Mail,
  Moon,
  Users,
  Sun
} from "lucide-react";
import OmaniRial from "@/Components/OmaniRial";

export default function Subscription({ plans }: any) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(
    plans?.length > 0 ? plans[1]?.id || plans[0]?.id : null,
  );

  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const { data, setData, post, processing, errors, reset, clearErrors } =
    useForm({
      // School Identity
      school_ar: "",
      school_en: "",
      city: "Muscat",
      district: "",
      // Contact Person
      admin_name: "",
      admin_name_en: "",
      email: "",
      password: "",
      password_confirmation: "",
      phone: "",
      language: "ar",
      // Subscription Preferences
      plan_id: selectedPlanId as number | null,
      billing_type: "yearly" as "monthly" | "yearly",
      student_count: 100,
      bus_count: 0,
      notes: "",
    });

  useEffect(() => {
    setData("billing_type", billingCycle);
  }, [billingCycle]);

  useEffect(() => {
    setData("language", lang);
  }, [lang]);

  useEffect(() => {
    setData("plan_id", selectedPlanId as number | null);
  }, [selectedPlanId]);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    clearErrors();
    post(route('subscription.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setShowSuccess(true);
        reset();
      },
    });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen font-sans selection:bg-brand-yellow/30 selection:text-brand-navy transition-colors duration-300 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`} dir={dir}>
      <Head>
        <title>{isAr ? "انضم لمنصة مسارات واصل | طلب اشتراك مدرسة" : "Join Masarat Wasel | School Subscription"}</title>
        <meta name="description" content={isAr ? "اشترك الآن في منصة مسارات واصل للتحول الرقمي الكامل في إدارة النقل المدرسي. باقات مرنة للسنة والترم الدراسي لتأمين وتتبع حافلات الطلاب." : "Subscribe now to the Masarat Wasel platform for the complete digital transformation of school transport management. Flexible pricing plans for Oman schools."} />
        <meta name="keywords" content={isAr ? "اشتراك النقل المدرسي, أسعار النقل المدرسي, تسجيل مدرسة مسارات واصل, باقات النقل المدرسي, تكلفة نظام تتبع الحافلات, طلب تفعيل النقل المدرسي, باقة النقل المدرسي عمان" : "school transport subscription, school bus tracking price, join Masarat Wasel, school bus management pricing, register school transport Oman"} />
        <link rel="canonical" href="https://masaratwasal.com/subscription" />

        {/* Open Graph Tags */}
        <meta property="og:title" content={isAr ? "انضم لمنصة مسارات واصل | طلب اشتراك مدرسة" : "Join Masarat Wasel | School Subscription"} />
        <meta property="og:description" content={isAr ? "اشترك الآن في منصة مسارات واصل للتحول الرقمي الكامل في إدارة النقل المدرسي." : "Subscribe now to the Masarat Wasel platform for the complete digital transformation of school transport management."} />
        <meta property="og:image" content="https://masaratwasal.com/assets/images/masarat-wasel-logo.jpg" />
        <meta property="og:url" content="https://masaratwasal.com/subscription" />
        <meta property="og:type" content="website" />
      </Head>

      {/* --- Abstract Background Patterns --- */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-brand-yellow/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-brand-navy/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
      </div>

      {/* --- Navigation --- */}
      <nav className={`sticky top-0 z-50 border-b ${isDark ? 'bg-slate-900/90 border-slate-800 backdrop-blur-xl' : 'bg-white/80 border-slate-200/50 backdrop-blur-xl'}`}>
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
             <div className="w-11 h-11 bg-white p-1 rounded-xl shadow-sm border border-slate-100 italic transition-transform hover:scale-105 overflow-hidden">
                <img src="/assets/images/masarat-wasel-logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-lg" />
             </div>
             <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>
                 {isAr ? "مسارات واصل" : "Masarat Wasel"}
             </span>
          </Link>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 border-r border-slate-200 pr-4 rtl:border-r-0 rtl:border-l rtl:pr-0 rtl:pl-4">
                 <button
                     onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                     className={`p-2 rounded-xl transition-colors flex items-center gap-2 text-sm font-bold ${
                         isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"
                     }`}
                     title="Change Language"
                 >
                     <Globe size={18} />
                     {lang === "ar" ? "EN" : "عربي"}
                 </button>
                 <button
                     onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                     className={`p-2 rounded-xl transition-colors ${
                         isDark ? "hover:bg-slate-800 text-brand-yellow" : "hover:bg-slate-100 text-brand-navy"
                     }`}
                     title="Toggle Theme"
                 >
                     {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                 </button>
             </div>

             <Link href="/" className={`hidden sm:flex items-center gap-2 text-sm font-bold transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-brand-navy'}`}>
                <ArrowRight size={18} className="translate-x-1 rtl:-translate-x-1" />
                {isAr ? "العودة للرئيسية" : "Back to Home"}
             </Link>
             <div className={`h-6 w-px hidden sm:block ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
             <Link href={route("login")} className={`px-5 py-2.5 text-sm font-black rounded-xl transition-all flex items-center gap-2 ${isDark ? 'text-white bg-slate-800 hover:bg-slate-700' : 'text-slate-700 bg-slate-100 hover:bg-slate-200'}`}>
                {isAr ? "سجل الدخول" : "Login"}
             </Link>
          </div>
        </div>
      </nav>

      {/* --- Subscription Content --- */}
      <main className="max-w-[1400px] mx-auto px-6 pt-16 pb-32">
        <motion.div
           initial="hidden"
           animate="visible"
           variants={containerVariants}
           className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start"
        >
          {/* Left Column: Info & Perks */}
          <div className="lg:col-span-5 flex flex-col gap-12 lg:sticky lg:top-32">
             <div className="space-y-6">
                <motion.div variants={itemVariants} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest ${isDark ? 'bg-brand-yellow/20 border-brand-yellow/30 text-brand-yellow' : 'bg-brand-yellow/10 border-brand-yellow/20 text-brand-dark'}`}>
                   {isAr ? "طلب انضمام جديد" : "New Registration Request"}
                </motion.div>
                <motion.h1 variants={itemVariants} className={`text-4xl lg:text-5xl font-black leading-tight ${isDark ? 'text-white' : 'text-brand-navy'}`}>
                   {isAr ? "ابدأ بتجربة " : "Start a smarter "}<span className="text-brand-yellow">{isAr ? "نقل مدرسي" : "School Transport"}</span>{isAr ? " أذكى اليوم" : " experience today"}
                </motion.h1>
                <motion.p variants={itemVariants} className={`text-lg font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                   {isAr ? "انضم لأكثر من 200 مدرسة تثق بمسارات واصل لإدارة عملياتها اليومية وتأمين رحلات طلابها بضغطة زر." : "Join over 200 schools that trust Masarat Wasel to manage their daily operations and secure their student trips with a click of a button."}
                </motion.p>
             </div>

             <div className="space-y-8">
                <motion.div variants={itemVariants} className="flex gap-5 group items-start">
                   <div className="w-12 h-12 shrink-0 rounded-2xl bg-brand-navy text-white flex items-center justify-center shadow-xl shadow-brand-navy/20 group-hover:scale-110 transition-transform"><ShieldCheck size={24}/></div>
                   <div>
                      <h3 className={`text-lg font-black mb-1 ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "أمان بيانات مطلق" : "Absolute Data Security"}</h3>
                      <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isAr ? "نحن نستخدم أعلى معايير التشفير لحماية خصوصية طلابك وأولياء أمورك." : "We use the highest encryption standards to protect your students' and parents' privacy."}</p>
                   </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex gap-5 group items-start">
                   <div className="w-12 h-12 shrink-0 rounded-2xl bg-brand-yellow text-brand-dark flex items-center justify-center shadow-xl shadow-brand-yellow/20 group-hover:scale-110 transition-transform"><Zap size={24}/></div>
                   <div>
                      <h3 className={`text-lg font-black mb-1 ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "تفعيل فوري" : "Instant Activation"}</h3>
                      <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isAr ? "فريقنا جاهز لمساعدتك في رفع البيانات وتدريب السائقين في أقل من 24 ساعة." : "Our team is ready to help you upload data and train drivers in less than 24 hours."}</p>
                   </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex gap-5 group items-start">
                   <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center shadow-xl shadow-slate-200/20 group-hover:scale-110 transition-transform"><BadgeCheck size={24}/></div>
                   <div>
                      <h3 className={`text-lg font-black mb-1 ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "دعم فني مخصص" : "Dedicated Support"}</h3>
                      <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isAr ? "مدير حساب خاص لمدرستك يسهر على حل أي مشكلة قبل وقوعها." : "A dedicated account manager for your school ensuring smooth operations."}</p>
                   </div>
                </motion.div>
             </div>

             <motion.div variants={itemVariants} className={`p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl ${isDark ? 'bg-slate-800 border border-slate-700 shadow-black/50 text-white' : 'bg-brand-navy text-white shadow-brand-navy/30'}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <blockquote className="relative z-10 italic font-medium opacity-80 mb-6 text-lg">
                   {isAr ? '"مسارات واصل غيرت تماماً الطريقة التي ندير بها الحافلات، المعلمون وأولياء الأمور مرتاحون جداً الآن."' : '"Masarat Wasel completely changed the way we manage buses; teachers and parents are very relieved now."'}
                </blockquote>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-slate-300 border-2 border-white/20 flex items-center justify-center">
                        <UserCircle2 size={24} className="text-slate-500"/>
                   </div>
                   <div>
                      <div className="font-black">{isAr ? "د. سارة الأحمد" : "Dr. Sara Al-Ahmad"}</div>
                      <div className="text-xs font-bold text-white/50">{isAr ? "مديرة مدرسة الأمل النموذجية" : "Principal of Al-Amal Model School"}</div>
                   </div>
                </div>
             </motion.div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="lg:col-span-7">
             <AnimatePresence mode="wait">
               {showSuccess ? (
                 <motion.div
                    key="success"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className={`p-12 rounded-[3rem] shadow-3xl flex flex-col items-center text-center gap-6 ${isDark ? 'bg-slate-800 shadow-black/50 border border-emerald-900/50' : 'bg-white shadow-slate-200/50 border border-emerald-100'}`}
                 >
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center"><BadgeCheck size={64}/></div>
                    <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "شكراً لثقتك بنا!" : "Thank You for Trusting Us!"}</h2>
                    <p className={`text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isAr ? "لقد تم استلام طلب مدرستك بنجاح. سيقوم فريق المبيعات الخاص بنا بالتواصل معك خلال الساعات القادمة لإكمال عملية التفعيل." : "Your school's request has been received successfully. Our sales team will contact you within the coming hours to complete the activation process."}</p>
                    <button
                       onClick={() => setShowSuccess(false)}
                       className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-3 mt-4"
                    >
                       {isAr ? "العودة للنموذج" : "Back to Form"} <ChevronLeft size={20} className={dir === 'rtl' ? '' : 'rotate-180'} />
                    </button>
                 </motion.div>
               ) : (
                 <motion.form
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onSubmit={submit}
                    className={`rounded-[3rem] shadow-3xl overflow-hidden border ${isDark ? 'bg-slate-800 shadow-black/50 border-slate-700' : 'bg-white shadow-slate-200/50 border-white'}`}
                 >
                    <div className={`p-10 lg:p-14 space-y-14 ${isAr ? 'text-right' : 'text-left'}`}>

                       {Object.keys(errors).length > 0 && (
                          <div className="p-6 bg-red-50 border-2 border-red-100 rounded-3xl text-red-600 space-y-2">
                              <div className="flex items-center gap-3 font-black text-lg mb-2">
                                  <Zap size={24} className="animate-pulse"/>
                                  {isAr ? "هناك أخطاء في النموذج:" : "Form Errors:"}
                              </div>
                              <ul className="list-disc list-inside font-bold text-sm space-y-1 pr-2">
                                  {Object.entries(errors).map(([key, val]) => (
                                      <li key={key}>{val}</li>
                                  ))}
                              </ul>
                          </div>
                       )}

                       {/* Step 1: Contact Person Info */}
                       <div className="space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 text-brand-dark flex items-center justify-center"><UserCircle2 size={24}/></div>
                              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "بيانات المسؤول للتواصل" : "Contact Person Details"}</h2>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <FormInput
                                 theme={theme}
                                 label={isAr ? "البريد الإلكتروني للمسؤول" : "Admin Email"}
                                 id="email"
                                 type="email"
                                 icon={<Mail size={18}/>}
                                 placeholder="admin@school.com"
                                 required
                                 value={data.email}
                                 onChange={(e: any) => setData("email", e.target.value)}
                                 error={errors.email}
                                 helpText={isAr ? "سيتم استخدامه لتسجيل الدخول لاحقاً" : "Will be used to login later"}
                                 dir="ltr"
                              />
                              <div className="hidden md:block"></div>
                              <FormInput
                                 theme={theme}
                                 label={isAr ? "كلمة المرور" : "Password"}
                                 id="password"
                                 type="password"
                                 icon={<Lock size={18}/>}
                                 placeholder="••••••••"
                                 required
                                 value={data.password}
                                 onChange={(e: any) => setData("password", e.target.value)}
                                 error={errors.password}
                                 dir="ltr"
                              />
                              <FormInput
                                 theme={theme}
                                 label={isAr ? "تأكيد كلمة المرور" : "Confirm Password"}
                                 id="password_confirmation"
                                 type="password"
                                 icon={<Lock size={18}/>}
                                 placeholder="••••••••"
                                 required
                                 value={data.password_confirmation}
                                 onChange={(e: any) => setData("password_confirmation", e.target.value)}
                                 error={errors.password_confirmation}
                                 dir="ltr"
                              />
                           </div>
                        </div>

                        {/* Step 2: School Info */}
                       <div className="space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-brand-navy/10 text-brand-navy flex items-center justify-center"><School size={24}/></div>
                             <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "معلومات المؤسسة التعليمية" : "Educational Institution Info"}</h2>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <FormInput
                                theme={theme}
                                label={isAr ? "اسم المدرسة (العربية)" : "School Name (Arabic)"}
                                id="school_ar"
                                placeholder={isAr ? "مدرسة الأجيال الأهلية" : "Al-Ajyal National School"}
                                required
                                value={data.school_ar}
                                onChange={(e: any) => setData("school_ar", e.target.value)}
                                error={errors.school_ar}
                                dir="rtl"
                             />
                             <FormInput
                                theme={theme}
                                label={isAr ? "اسم المدرسة (English)" : "School Name (English)"}
                                id="school_en"
                                placeholder="Al-Ajyal School"
                                required
                                value={data.school_en}
                                onChange={(e: any) => setData("school_en", e.target.value)}
                                error={errors.school_en}
                                dir="ltr"
                             />
                             <FormInput
                                theme={theme}
                                label={isAr ? "المدينة" : "City"}
                                id="city"
                                icon={<MapPin size={18}/>}
                                placeholder={isAr ? "مسقط" : "Muscat"}
                                required
                                value={data.city}
                                onChange={(e: any) => setData("city", e.target.value)}
                                error={errors.city}
                                dir={dir}
                             />
                             <FormInput
                                theme={theme}
                                label={isAr ? "المنطقة / الحي" : "District"}
                                id="district"
                                icon={<Navigation size={18}/>}
                                placeholder={isAr ? "الخوير" : "Al Khuwair"}
                                required
                                value={data.district}
                                onChange={(e: any) => setData("district", e.target.value)}
                                error={errors.district}
                                dir={dir}
                             />
                             <FormInput
                                theme={theme}
                                label={isAr ? "الاسم الكامل للمشرف (عربي)" : "Admin Full Name (Arabic)"}
                                id="admin_name"
                                icon={<User size={18}/>}
                                placeholder={isAr ? "اكتب اسمك الثلاثي" : "Enter full name"}
                                required
                                value={data.admin_name}
                                onChange={(e: any) => setData("admin_name", e.target.value)}
                                error={errors.admin_name}
                                dir="rtl"
                             />
                             <FormInput
                                theme={theme}
                                label={isAr ? "Admin Full Name (English)" : "Admin Full Name (English)"}
                                id="admin_name_en"
                                icon={<User size={18}/>}
                                placeholder="Mohammed Al Busaidi"
                                required
                                value={data.admin_name_en}
                                onChange={(e: any) => setData("admin_name_en", e.target.value)}
                                error={errors.admin_name_en}
                                dir="ltr"
                             />
                          </div>
                       </div>

                       {/* Step 3: Contact Info */}
                       <div className="space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><PhoneCall size={24}/></div>
                             <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "التواصل واللغة" : "Contact & Language"}</h2>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                             <div className="space-y-3">
                                <label className={`text-sm font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "رقم الجوال النشط" : "Active Phone Number"}</label>
                                <div className={`flex items-center shadow-sm rounded-2xl overflow-hidden border transition-all h-[58px] ${isDark ? 'bg-slate-700 border-slate-600 focus-within:ring-brand-yellow/20 focus-within:border-brand-yellow' : 'bg-slate-50 border-slate-100 focus-within:ring-brand-navy/20 focus-within:border-brand-navy'}`} dir="ltr">
                                   <div className={`px-3 border-e h-full flex items-center shrink-0 ${isDark ? 'border-slate-600 bg-slate-800/30' : 'border-slate-200 bg-slate-100/30'}`}>
                                      <select className={`bg-transparent border-none font-bold text-xs focus:ring-0 cursor-pointer py-0 px-1 w-24 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                         <option value="+968">🇴🇲 +968</option>
                                         <option value="+966">🇸🇦 +966</option>
                                         <option value="+971">🇦🇪 +971</option>
                                         <option value="+974">🇶🇦 +974</option>
                                         <option value="+973">🇧🇭 +973</option>
                                         <option value="+965">🇰🇼 +965</option>
                                      </select>
                                   </div>
                                   <input
                                      type="tel"
                                      className={`flex-1 bg-transparent border-none h-full px-4 font-black text-base focus:ring-0 ${isDark ? 'text-white placeholder:text-slate-500' : 'text-brand-navy placeholder:text-slate-400'}`}
                                      placeholder="7xxx xxxx"
                                      required
                                      value={data.phone}
                                      onChange={(e) => setData("phone", e.target.value)}
                                   />
                                </div>
                                {errors.phone && <div className="text-xs text-red-500 font-bold mt-1">{errors.phone}</div>}
                             </div>

                             <div className="space-y-3">
                                <label className={`text-sm font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "لغة النظام المفضلة" : "Preferred System Language"}</label>
                                <div className="relative group">
                                   <div className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-4' : 'left-4'} flex items-center pointer-events-none transition-colors z-10 ${isDark ? 'text-slate-500 group-focus-within:text-brand-yellow' : 'text-slate-400 group-focus-within:text-brand-navy'}`}>
                                      <Globe size={18} />
                                   </div>
                                   <select
                                      value={lang}
                                      onChange={(e) => setLang(e.target.value as "ar" | "en")}
                                      className={`w-full border rounded-2xl py-4 font-bold appearance-none transition-all ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:ring-brand-yellow/20 focus:border-brand-yellow' : 'bg-slate-50 border-slate-100 text-slate-700 focus:ring-brand-navy/20 focus:border-brand-navy'}`}
                                   >
                                      <option value="ar">العربية (Arabic)</option>
                                      <option value="en">English (US)</option>
                                   </select>
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Step 4: Packages */}
                       <div className="space-y-8">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Briefcase size={24}/></div>
                                 <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "اختر خطة الاشتراك" : "Choose Subscription Plan"}</h2>
                              </div>

                              {/* Billing Cycle Switch */}
                              <div className={`p-1.5 rounded-2xl flex items-center gap-1 border ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-100 border-slate-200'}`}>
                                 <button
                                    type="button"
                                    onClick={() => setBillingCycle("monthly")}
                                    className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${billingCycle === 'monthly' ? (isDark ? 'bg-brand-yellow text-brand-dark shadow-lg' : 'bg-brand-navy text-white shadow-lg') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-brand-navy')}`}
                                 >
                                    {isAr ? "شهرياً" : "Monthly"}
                                 </button>
                                 <button
                                    type="button"
                                    onClick={() => setBillingCycle("yearly")}
                                    className={`px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? (isDark ? 'bg-brand-yellow text-brand-dark shadow-lg' : 'bg-brand-navy text-white shadow-lg') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-brand-navy')}`}
                                 >
                                    {isAr ? "سنوياً" : "Yearly"}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${billingCycle === 'yearly' ? (isDark ? 'bg-brand-dark/20' : 'bg-white/20') : (isDark ? 'bg-brand-yellow/20 text-brand-yellow' : 'bg-emerald-100 text-emerald-600')}`}>
                                       {isAr ? "وفر 20%" : "Save 20%"}
                                    </span>
                                 </button>
                              </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end mb-8">
                              <FormInput
                                 theme={theme}
                                 label={isAr ? "عدد الطلاب المتوقع" : "Expected Student Count"}
                                 id="student_count"
                                 type="number"
                                 icon={<Users size={18}/>}
                                 placeholder="100"
                                 required
                                 value={data.student_count}
                                 onChange={(e: any) => setData("student_count", parseInt(e.target.value) || 0)}
                                 error={errors.student_count}
                                 dir="ltr"
                              />
                              <FormInput
                                 theme={theme}
                                 label={isAr ? "عدد الحافلات المتوقع" : "Expected Bus Count"}
                                 id="bus_count"
                                 type="number"
                                 icon={<Zap size={18}/>}
                                 placeholder="5"
                                 value={data.bus_count}
                                 onChange={(e: any) => setData("bus_count", parseInt(e.target.value) || 0)}
                                 error={errors.bus_count}
                                 dir="ltr"
                              />
                           </div>

                           <PlanSelectorGrid 
                               plans={plans}
                               selectedId={selectedPlanId}
                               onSelect={(id: number) => setSelectedPlanId(id)}
                               billingCycle={billingCycle}
                               lang={lang}
                               theme={theme}
                           />
                        </div>

                       <div className="space-y-3">
                          <label className={`text-sm font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "ملاحظات إضافية" : "Additional Notes"}</label>
                          <textarea
                              rows={4}
                              className={`w-full border rounded-2xl p-4 font-bold transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:ring-brand-yellow/20 focus:border-brand-yellow' : 'bg-slate-50 border-slate-100 text-slate-700 placeholder:text-slate-300 focus:ring-brand-navy/20 focus:border-brand-navy'}`}
                              placeholder={isAr ? "هل لديك متطلبات خاصة تود منا مراعاتها؟" : "Do you have any special requirements?"}
                              value={data.notes}
                              onChange={(e) => setData("notes", e.target.value)}
                          ></textarea>
                          {errors.notes && <div className="text-xs text-red-500 font-bold mt-1">{errors.notes}</div>}
                       </div>

                    </div>

                    <div className={`p-10 lg:p-14 border-t flex flex-col items-center gap-8 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                       <p className={`text-sm font-bold max-w-lg text-center leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                          {isAr ? "بمجرد النقر على زر الإرسال، فإنك توافق على " : "By clicking submit, you agree to our "}
                          <a href="#" className={`underline underline-offset-4 ${isDark ? 'text-brand-yellow' : 'text-brand-navy'}`}>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</a>
                          {isAr ? " وشروط الاستخدام الخاصة بمنظومة مسارات واصل." : " and Terms of Service."}
                       </p>
                       <button
                          disabled={processing}
                          className="w-full max-md py-5 bg-brand-navy text-white text-xl font-black rounded-[1.5rem] shadow-2xl shadow-brand-navy/30 hover:shadow-brand-navy/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-4"
                       >
                          {processing ? <Loader2 className="animate-spin" size={24}/> : <>{isAr ? "إرسال الطلب الآن" : "Submit Request Now"} <ArrowRight className={dir === 'rtl' ? 'rotate-180' : ''} size={24}/></>}
                       </button>
                    </div>
                 </motion.form>
               )}
             </AnimatePresence>
          </div>
        </motion.div>
      </main>

      <footer className={`border-t py-12 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-3 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                <img src="/assets/images/masarat-wasel-logo.jpg" className="h-8 object-contain rounded" alt="Footer Logo" />
                <span className={`font-black ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{isAr ? "مسارات واصل" : "Masarat Wasel"}</span>
             </div>
             <div className={`text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {isAr ? "© 2024 جميع الحقوق محفوظة لشركة مسارات واصل للتقنية." : "© 2024 All rights reserved to Masarat Wasel Tech."}
             </div>
          </div>
      </footer>

      {/* --- Enhanced Floating Support Button --- */}
      <a
         href="https://wa.me/96879967769"
         target="_blank"
         rel="noreferrer"
         className={`fixed bottom-8 ${dir === 'rtl' ? 'left-8' : 'right-8'} z-50 group flex items-center gap-4`}
      >
          <div className={`hidden md:flex flex-col items-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 ${dir === 'rtl' ? 'items-start' : 'items-end'}`}>
              <div className={`px-4 py-2 rounded-2xl shadow-2xl text-sm font-black whitespace-nowrap ${
                  isDark ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-brand-navy border border-slate-100'
              }`}>
                  {isAr ? "تحتاج مساعدة؟ تواصل معنا" : "Need help? Contact us"}
              </div>
          </div>

          <div className="relative">
              {/* Pulsing Outer Ring */}
              <div className="absolute inset-0 rounded-full bg-brand-yellow/40 animate-ping scale-150" />
              <div className="absolute inset-0 rounded-full bg-brand-yellow/20 animate-pulse scale-125" />

              {/* Main Avatar Container */}
              <div className={`relative w-20 h-20 rounded-full border-4 border-brand-yellow shadow-[0_0_40px_rgba(255,191,0,0.4)] overflow-hidden hover:scale-110 transition-transform duration-500 hover:rotate-6 ${
                  isDark ? 'bg-slate-800' : 'bg-white'
              }`}>
                  <img
                      src="/assets/images/omani-support-avatar.png"
                      alt="Support"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-3xl">👨‍💼</div>';
                      }}
                  />
                  {/* Live Status Indicator */}
                  <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
          </div>
      </a>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────

function FormInput({ label, id, type = "text", icon, placeholder, helpText, required, dir = "rtl", theme, value, onChange, error }: any) {
  const isDark = theme === 'dark';
  return (
    <div className="space-y-3">
       <label className={`text-sm font-black ${isDark ? 'text-white' : 'text-brand-navy'}`} htmlFor={id}>{label}</label>
       <div className="relative group">
          {icon && (
            <div className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-4' : 'left-4'} flex items-center pointer-events-none transition-colors z-10 ${isDark ? 'text-slate-500 group-focus-within:text-brand-yellow' : 'text-slate-400 group-focus-within:text-brand-navy'}`}>
               {icon}
            </div>
          )}
          <input
             type={type}
             id={id}
             dir={dir}
             placeholder={placeholder}
             required={required}
             value={value}
             onChange={onChange}
             className={`w-full border rounded-2xl py-4 font-bold transition-all ${icon ? (dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4') : 'px-4'} ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:ring-brand-yellow/20 focus:border-brand-yellow' : 'bg-slate-50 border-slate-100 text-brand-navy placeholder:text-slate-300 focus:ring-brand-navy/20 focus:border-brand-navy'} ${error ? 'border-red-500' : ''}`}
          />
       </div>
       {error && <div className="text-xs text-red-500 font-bold mt-1">{error}</div>}
       {helpText && <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{helpText}</p>}
    </div>
  );
}
