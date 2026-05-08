<<<<<<< HEAD
import { Head, Link, useForm } from "@inertiajs/react";
=======
import { Head, Link } from "@inertiajs/react";
>>>>>>> b353e8e (feat: I update all things on side  welcome screen  also I add new pages  like events dynamic and add full-stack public events forum)
import { FormEventHandler, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PlanOption from "@/Components/PlanOption";
import PlanSelectorGrid from "@/Components/PlanSelectorGrid";
import {
<<<<<<< HEAD
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
=======
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
  Sun
>>>>>>> b353e8e (feat: I update all things on side  welcome screen  also I add new pages  like events dynamic and add full-stack public events forum)
} from "lucide-react";
import OmaniRial from "@/Components/OmaniRial";

export default function Subscription({ plans }: any) {
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(
        plans?.length > 0 ? plans[1]?.id || plans[0]?.id : null,
    );

<<<<<<< HEAD
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            email: "",
            password: "",
            school_ar: "",
            school_en: "",
            city: "",
            district: "",
            admin_name: "",
            admin_name_en: "",
            phone: "",
            language: "ar",
            plan_id: selectedPlanId,
            notes: "",
        });
=======
  // New States
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
>>>>>>> b353e8e (feat: I update all things on side  welcome screen  also I add new pages  like events dynamic and add full-stack public events forum)

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
        visible: { opacity: 1, x: 0 },
    };

<<<<<<< HEAD
    return (
        <div
            className="min-h-screen bg-slate-50 font-sans selection:bg-brand-yellow/30 selection:text-brand-navy"
            dir="rtl"
        >
            <Head>
                <title>انضم لمنصة مسارات واصل | طلب اشتراك مدرسة</title>
                <meta
                    name="description"
                    content="اشترك الآن في منصة مسارات واصل للتحول الرقمي الكامل في إدارة النقل المدرسي."
                />
                <link
                    rel="icon"
                    type="image/png"
                    href="/assets/images/masarat-wasel-logo.jpg"
                />
            </Head>

            {/* --- Abstract Background Patterns --- */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-brand-yellow/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-brand-navy/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
            </div>

            {/* --- Navigation --- */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-white p-1 rounded-xl shadow-sm border border-slate-100 italic transition-transform hover:scale-105 overflow-hidden">
                            <img
                                src="/assets/images/masarat-wasel-logo.jpg"
                                alt="Logo"
                                className="w-full h-full object-contain rounded-lg"
                            />
                        </div>
                        <span className="text-xl font-black text-brand-navy">
                            مسارات واصل
                        </span>
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-navy transition-colors"
                        >
                            <ArrowRight size={18} className="translate-x-1" />
                            العودة للرئيسية
                        </Link>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                        <Link
                            href={route("login")}
                            className="px-5 py-2.5 text-sm font-black rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2"
                        >
                            سجل الدخول
                        </Link>
                    </div>
=======
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
        <meta name="description" content="اشترك الآن في منصة مسارات واصل للتحول الرقمي الكامل في إدارة النقل المدرسي." />
        <link rel="icon" type="image/png" href="/assets/images/masarat-wasel-logo.jpg" />
      </Head>

      {/* --- Abstract Background Patterns --- */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-brand-yellow/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-brand-navy/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
      </div>

      {/* --- Navigation --- */}
      <nav className={`sticky top-0 z-50 border-b ${isDark ? 'bg-slate-900/90 border-slate-800 backdrop-blur-xl' : 'bg-white/80 border-slate-200/50 backdrop-blur-xl'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
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
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-32">
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
>>>>>>> b353e8e (feat: I update all things on side  welcome screen  also I add new pages  like events dynamic and add full-stack public events forum)
                </div>
            </nav>

<<<<<<< HEAD
            {/* --- Subscription Content --- */}
            <main className="max-w-7xl mx-auto px-6 pt-16 pb-32">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start"
                >
                    {/* Left Column: Info & Perks */}
                    <div className="lg:col-span-5 flex flex-col gap-12 lg:sticky lg:top-32">
                        <div className="space-y-6">
                            <motion.div
                                variants={itemVariants}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 text-brand-dark text-xs font-bold uppercase tracking-widest"
                            >
                                طلب انضمام جديد
                            </motion.div>
                            <motion.h1
                                variants={itemVariants}
                                className="text-4xl lg:text-5xl font-black text-brand-navy leading-tight"
                            >
                                ابدأ بتجربة{" "}
                                <span className="text-brand-yellow">
                                    نقل مدرسي
                                </span>{" "}
                                أذكى اليوم
                            </motion.h1>
                            <motion.p
                                variants={itemVariants}
                                className="text-lg text-slate-500 font-medium leading-relaxed"
                            >
                                انضم لأكثر من 200 مدرسة تثق بمسارات واصل لإدارة
                                عملياتها اليومية وتأمين رحلات طلابها بضغطة زر.
                            </motion.p>
                        </div>

                        <div className="space-y-8">
                            <motion.div
                                variants={itemVariants}
                                className="flex gap-5 group items-start"
                            >
                                <div className="w-12 h-12 shrink-0 rounded-2xl bg-brand-navy text-white flex items-center justify-center shadow-xl shadow-brand-navy/20 group-hover:scale-110 transition-transform">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-brand-navy mb-1">
                                        أمان بيانات مطلق
                                    </h3>
                                    <p className="text-slate-500 font-medium">
                                        نحن نستخدم أعلى معايير التشفير لحماية
                                        خصوصية طلابك وأولياء أمورك.
                                    </p>
=======
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

                       {/* Step 1: Account Info */}
                       <div className="space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 text-brand-dark flex items-center justify-center"><UserCircle2 size={24}/></div>
                             <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "بيانات الحساب الأساسية" : "Basic Account Info"}</h2>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <FormInput theme={theme} label={isAr ? "اسم المستخدم للمشرف (بالإنجليزي)" : "Admin Username (English)"} id="username" icon={<User size={18}/>} placeholder="Admin_School_2024" required dir="ltr" />
                             <FormInput theme={theme} label={isAr ? "كلمة المرور الابتدائية" : "Initial Password"} id="password" type="password" icon={<Lock size={18}/>} placeholder="••••••••" required helpText={isAr ? "يمكن تغييرها لاحقاً من لوحة الإعدادات" : "Can be changed later from dashboard settings"} dir="ltr" />
                          </div>
                       </div>

                       {/* Step 2: School Info */}
                       <div className="space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-brand-navy/10 text-brand-navy flex items-center justify-center"><School size={24}/></div>
                             <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "معلومات المؤسسة التعليمية" : "Educational Institution Info"}</h2>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <FormInput theme={theme} label={isAr ? "اسم المدرسة (العربية)" : "School Name (Arabic)"} id="school_ar" placeholder={isAr ? "مدرسة الأجيال الأهلية" : "Al-Ajyal National School"} required dir="rtl" />
                             <FormInput theme={theme} label={isAr ? "School Name (English)" : "School Name (English)"} id="school_en" placeholder="Al-Ajyal School" required dir="ltr" />
                             <FormInput theme={theme} label={isAr ? "المدينة والموقع" : "City & Location"} id="city" icon={<MapPin size={18}/>} placeholder={isAr ? "مسقط" : "Muscat"} required defaultValue={isAr ? "مسقط" : "Muscat"} dir={dir} />
                             <FormInput theme={theme} label={isAr ? "الاسم الكامل للمشرف المسؤول" : "Admin Full Name"} id="admin_name" icon={<Navigation size={18}/>} placeholder={isAr ? "اكتب اسمك الثلاثي" : "Enter full name"} required dir={dir} />
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
                                <div className={`flex shadow-sm rounded-2xl overflow-hidden border transition-all ${isDark ? 'bg-slate-700 border-slate-600 focus-within:ring-brand-yellow/20 focus-within:border-brand-yellow' : 'bg-slate-50 border-slate-100 focus-within:ring-brand-navy/20 focus-within:border-brand-navy'}`}>
                                   <select className={`bg-transparent pr-8 border-none font-bold text-sm w-28 focus:ring-0 ${isDark ? 'text-slate-300' : 'text-slate-500'}`} dir="ltr">
                                      <option>🇴🇲 +968</option>
                                      <option>🇸🇦 +966</option>
                                      <option>🇦🇪 +971</option>
                                   </select>
                                   <input type="tel" className={`flex-1 bg-transparent border-none py-4 px-4 font-bold focus:ring-0 ${isDark ? 'text-white placeholder:text-slate-500' : 'text-brand-navy placeholder:text-slate-300'}`} placeholder="xxxx xxxx" dir="ltr" required />
                                </div>
                             </div>

                             <div className="space-y-3">
                                <label className={`text-sm font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "لغة النظام المفضلة" : "Preferred System Language"}</label>
                                <div className="relative group">
                                   <div className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-4' : 'left-4'} flex items-center pointer-events-none transition-colors z-10 ${isDark ? 'text-slate-500 group-focus-within:text-brand-yellow' : 'text-slate-400 group-focus-within:text-brand-navy'}`}>
                                      <Globe size={18} />
                                   </div>
                                   <select className={`w-full border rounded-2xl py-4 font-bold appearance-none transition-all ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} ${isDark ? 'bg-slate-700 border-slate-600 text-white focus:ring-brand-yellow/20 focus:border-brand-yellow' : 'bg-slate-50 border-slate-100 text-slate-700 focus:ring-brand-navy/20 focus:border-brand-navy'}`}>
                                      <option value="ar">العربية (Arabic)</option>
                                      <option value="en">English (US)</option>
                                   </select>
>>>>>>> b353e8e (feat: I update all things on side  welcome screen  also I add new pages  like events dynamic and add full-stack public events forum)
                                </div>
                            </motion.div>

<<<<<<< HEAD
                            <motion.div
                                variants={itemVariants}
                                className="flex gap-5 group items-start"
                            >
                                <div className="w-12 h-12 shrink-0 rounded-2xl bg-brand-yellow text-brand-dark flex items-center justify-center shadow-xl shadow-brand-yellow/20 group-hover:scale-110 transition-transform">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-brand-navy mb-1">
                                        تفعيل فوري
                                    </h3>
                                    <p className="text-slate-500 font-medium">
                                        فريقنا جاهز لمساعدتك في رفع البيانات
                                        وتدريب السائقين في أقل من 24 ساعة.
                                    </p>
                                </div>
                            </motion.div>

                            <motion.div
                                variants={itemVariants}
                                className="flex gap-5 group items-start"
                            >
                                <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center shadow-xl shadow-slate-200/20 group-hover:scale-110 transition-transform">
                                    <BadgeCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-brand-navy mb-1">
                                        دعم فني مخصص
                                    </h3>
                                    <p className="text-slate-500 font-medium">
                                        مدير حساب خاص لمدرستك يسهر على حل أي
                                        مشكلة قبل وقوعها.
                                    </p>
                                </div>
                            </motion.div>
                        </div>
=======
                       {/* Step 4: Packages */}
                       <div className="space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Briefcase size={24}/></div>
                             <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "اختر خطة الاشتراك" : "Choose Subscription Plan"}</h2>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <PlanOption 
                                theme={theme}
                                isAr={isAr}
                                id="basic" 
                                title={isAr ? "الأساسية" : "Basic"} 
                                price="50" 
                                selected={selectedPlan === "basic"} 
                                onClick={() => setSelectedPlan("basic")} 
                                features={isAr ? ['حتى 5 حافلات', 'تطبيق السائق', 'دعم فني عادي'] : ['Up to 5 buses', 'Driver App', 'Standard Support']}
                             />
                             <PlanOption 
                                theme={theme}
                                isAr={isAr}
                                id="advanced" 
                                title={isAr ? "المتقدمة" : "Advanced"} 
                                price="120" 
                                selected={selectedPlan === "advanced"} 
                                onClick={() => setSelectedPlan("advanced")} 
                                isMostPopular 
                                features={isAr ? ['حتى 15 حافلة', 'تطبيق ولي الأمر', 'إشعارات لا محدودة'] : ['Up to 15 buses', 'Parent App', 'Unlimited Notifications']}
                             />
                             <PlanOption 
                                theme={theme}
                                isAr={isAr}
                                id="enterprise" 
                                title={isAr ? "المؤسسات" : "Enterprise"} 
                                price="250" 
                                selected={selectedPlan === "enterprise"} 
                                onClick={() => setSelectedPlan("enterprise")} 
                                features={isAr ? ['حافلات غير محدودة', 'تكامل API', 'دعم مخصص 24/7'] : ['Unlimited Buses', 'API Integration', '24/7 Dedicated Support']}
                             />
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className={`text-sm font-black ${isDark ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "ملاحظات إضافية" : "Additional Notes"}</label>
                          <textarea rows={4} className={`w-full border rounded-2xl p-4 font-bold transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:ring-brand-yellow/20 focus:border-brand-yellow' : 'bg-slate-50 border-slate-100 text-slate-700 placeholder:text-slate-300 focus:ring-brand-navy/20 focus:border-brand-navy'}`} placeholder={isAr ? "هل لديك متطلبات خاصة تود منا مراعاتها؟" : "Do you have any special requirements?"}></textarea>
                       </div>
>>>>>>> b353e8e (feat: I update all things on side  welcome screen  also I add new pages  like events dynamic and add full-stack public events forum)

                        <motion.div
                            variants={itemVariants}
                            className="p-8 bg-brand-navy rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-brand-navy/30"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <blockquote className="relative z-10 italic font-medium opacity-80 mb-6 text-lg">
                                "مسارات واصل غيرت تماماً الطريقة التي ندير بها
                                الحافلات، المعلمون وأولياء الأمور مرتاحون جداً
                                الآن."
                            </blockquote>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-300 border-2 border-white/20" />
                                <div>
                                    <div className="font-black">
                                        د. سارة الأحمد
                                    </div>
                                    <div className="text-xs font-bold text-white/50">
                                        مديرة مدرسة الأمل النموذجية
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

<<<<<<< HEAD
                    {/* Right Column: Registration Form */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {showSuccess ? (
                                <motion.div
                                    key="success"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="p-12 bg-white rounded-[3rem] shadow-3xl shadow-slate-200/50 border border-emerald-100 flex flex-col items-center text-center gap-6"
                                >
                                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                                        <BadgeCheck size={64} />
                                    </div>
                                    <h2 className="text-3xl font-black text-brand-navy">
                                        شكراً لثقتك بنا!
                                    </h2>
                                    <p className="text-lg text-slate-500 font-medium">
                                        لقد تم استلام طلب مدرستك بنجاح. سيقوم
                                        فريق المبيعات الخاص بنا بالتواصل معك
                                        خلال الساعات القادمة لإكمال عملية
                                        التفعيل.
                                    </p>
                                    <button
                                        onClick={() => setShowSuccess(false)}
                                        className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-3 mt-4"
                                    >
                                        العودة للنموذج <ChevronLeft size={20} />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onSubmit={submit}
                                    className="bg-white rounded-[3rem] shadow-3xl shadow-slate-200/50 border border-white overflow-hidden"
                                >
                                    <div className="p-10 lg:p-14 space-y-14 text-right">
                                        {/* Step 1: Account Info */}
                                        <div className="space-y-8">
                                            {Object.keys(errors).length > 0 && (
                                                <div className="p-6 bg-red-50 border-2 border-red-100 rounded-3xl text-red-600 space-y-2">
                                                    <div className="flex items-center gap-3 font-black text-lg mb-2">
                                                        <Zap size={24} className="animate-pulse"/>
                                                        هناك أخطاء في النموذج:
                                                    </div>
                                                    <ul className="list-disc list-inside font-bold text-sm space-y-1 pr-2">
                                                        {Object.entries(errors).map(([key, val]) => (
                                                            <li key={key}>{val}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 text-brand-dark flex items-center justify-center">
                                                    <UserCircle2 size={24} />
                                                </div>
                                                <h2 className="text-2xl font-black text-brand-navy">
                                                    بيانات الحساب الأساسية
                                                </h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <FormInput
                                                    label="البريد الإلكتروني للمسؤول"
                                                    id="email"
                                                    type="email"
                                                    icon={<Mail size={18} />}
                                                    placeholder="admin@school.com"
                                                    required
                                                    value={data.email}
                                                    onChange={(e: any) =>
                                                        setData(
                                                            "email",
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={errors.email}
                                                />
                                                <FormInput
                                                    label="كلمة المرور الابتدائية"
                                                    id="password"
                                                    type="password"
                                                    icon={<Lock size={18} />}
                                                    placeholder="••••••••"
                                                    required
                                                    helpText="يمكن تغييرها لاحقاً من لوحة الإعدادات"
                                                    value={data.password}
                                                    onChange={(e: any) =>
                                                        setData(
                                                            "password",
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={errors.password}
                                                />
                                            </div>
                                        </div>

                                        {/* Step 2: School Info */}
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-brand-navy/10 text-brand-navy flex items-center justify-center">
                                                    <School size={24} />
                                                </div>
                                                <h2 className="text-2xl font-black text-brand-navy">
                                                    معلومات المؤسسة التعليمية
                                                </h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                                                <FormInput
                                                    label="اسم المدرسة (العربية)"
                                                    id="school_ar"
                                                    placeholder="مدرسة الأجيال الأهلية"
                                                    required
                                                    value={data.school_ar}
                                                    onChange={(e: any) =>
                                                        setData(
                                                            "school_ar",
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={errors.school_ar}
                                                />
                                                <FormInput
                                                    label="School Name (English)"
                                                    id="school_en"
                                                    placeholder="Al-Ajyal School"
                                                    required
                                                    dir="ltr"
                                                    value={data.school_en}
                                                    onChange={(e: any) =>
                                                        setData(
                                                            "school_en",
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={errors.school_en}
                                                />
                                                <FormInput
                                                    label="المدينة"
                                                    id="city"
                                                    icon={<MapPin size={18} />}
                                                    placeholder="مسقط"
                                                    required
                                                    value={data.city}
                                                    onChange={(e: any) =>
                                                        setData(
                                                            "city",
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={errors.city}
                                                />
                                                <FormInput
                                                    label="المنطقة / الحي"
                                                    id="district"
                                                    icon={<Navigation size={18} />}
                                                    placeholder="الخوير"
                                                    required
                                                    value={data.district}
                                                    onChange={(e: any) =>
                                                        setData(
                                                            "district",
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={errors.district}
                                                />
                                                <FormInput
                                                    label="الاسم الكامل للمشرف (عربي)"
                                                    id="admin_name"
                                                    icon={<User size={18} />}
                                                    placeholder="محمد بن أحمد البوسعيدي"
                                                    required
                                                    value={data.admin_name}
                                                    onChange={(e: any) =>
                                                        setData(
                                                            "admin_name",
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={errors.admin_name}
                                                />
                                                <FormInput
                                                    label="Admin Full Name (English)"
                                                    id="admin_name_en"
                                                    icon={<User size={18} />}
                                                    placeholder="Mohammed Al Busaidi"
                                                    required
                                                    dir="ltr"
                                                    value={data.admin_name_en}
                                                    onChange={(e: any) =>
                                                        setData(
                                                            "admin_name_en",
                                                            e.target.value,
                                                        )
                                                    }
                                                    error={errors.admin_name_en}
                                                />
                                            </div>
                                        </div>

                                        {/* Step 3: Contact Info */}
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                    <PhoneCall size={24} />
                                                </div>
                                                <h2 className="text-2xl font-black text-brand-navy">
                                                    التواصل واللغة
                                                </h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                                <div className="space-y-3">
                                                    <label className="text-sm font-black text-brand-navy">
                                                        رقم الجوال النشط
                                                    </label>
                                                    <div className="flex shadow-sm rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 focus-within:ring-2 focus-within:ring-brand-navy/20 focus-within:border-brand-navy transition-all">
                                                        <select
                                                            className="bg-transparent pr-8 border-none text-slate-500 font-bold text-sm w-28"
                                                            dir="ltr"
                                                        >
                                                            <option>
                                                                🇸🇦 +968
                                                            </option>
                                                            <option>
                                                                🇾🇪 +967
                                                            </option>
                                                            <option>
                                                                🇦🇪 +971
                                                            </option>
                                                        </select>
                                                        <input
                                                            type="tel"
                                                            className="flex-1 bg-transparent border-none py-4 px-4 font-bold text-brand-navy focus:ring-0"
                                                            placeholder="5xxxxxxxx"
                                                            dir="ltr"
                                                            required
                                                            value={data.phone}
                                                            onChange={(e) =>
                                                                setData(
                                                                    "phone",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    {errors.phone && (
                                                        <div className="text-xs text-red-500 font-bold mt-1 text-right">
                                                            {errors.phone}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-sm font-black text-brand-navy">
                                                        لغة النظام المفضلة
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-navy transition-colors z-10">
                                                            <Globe size={18} />
                                                        </div>
                                                        <select
                                                            value={
                                                                data.language
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    "language",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pr-12 pl-4 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all"
                                                        >
                                                            <option value="ar">
                                                                العربية (Arabic)
                                                            </option>
                                                            <option value="en">
                                                                English (US)
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step 4: Packages */}
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                                    <Briefcase size={24} />
                                                </div>
                                                <h2 className="text-2xl font-black text-brand-navy">
                                                    اختر خطة الاشتراك
                                                </h2>
                                            </div>
                                            <PlanSelectorGrid 
                                                plans={plans}
                                                selectedId={selectedPlanId}
                                                onSelect={(id) => {
                                                    setSelectedPlanId(id);
                                                    setData("plan_id", id);
                                                }}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-black text-brand-navy">
                                                ملاحظات إضافية
                                            </label>
                                            <textarea
                                                rows={4}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all"
                                                placeholder="هل لديك متطلبات خاصة تود منا مراعاتها؟"
                                                value={data.notes}
                                                onChange={(e) =>
                                                    setData(
                                                        "notes",
                                                        e.target.value,
                                                    )
                                                }
                                            ></textarea>
                                            {errors.notes && (
                                                <div className="text-xs text-red-500 font-bold mt-1 text-right">
                                                    {errors.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-10 lg:p-14 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-8">
                                        <p className="text-sm font-bold text-slate-400 max-w-lg text-center leading-relaxed">
                                            بمجرد النقر على زر الإرسال، فإنك
                                            توافق على{" "}
                                            <a
                                                href="#"
                                                className="text-brand-navy underline underline-offset-4"
                                            >
                                                سياسة الخصوصية
                                            </a>{" "}
                                            وشروط الاستخدام الخاصة بمنظومة
                                            مسارات واصل.
                                        </p>
                                        <button
                                            disabled={processing}
                                            className="w-full max-w-md py-5 bg-brand-navy text-white text-xl font-black rounded-[1.5rem] shadow-2xl shadow-brand-navy/30 hover:shadow-brand-navy/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-4"
                                        >
                                            {processing ? (
                                                <Loader2
                                                    className="animate-spin"
                                                    size={24}
                                                />
                                            ) : (
                                                <>
                                                    إرسال الطلب الآن{" "}
                                                    <ArrowRight
                                                        className="rotate-180"
                                                        size={24}
                                                    />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </main>

            <footer className="border-t border-slate-200 bg-white py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3 grayscale">
                        <img
                            src="/assets/images/masarat-wasel-logo.jpg"
                            className="h-8 object-contain"
                            alt="Footer Logo"
                        />
                        <span className="font-black text-slate-400">
                            مسارات واصل
                        </span>
                    </div>
                    <div className="text-sm font-bold text-slate-400">
                        © 2024 جميع الحقوق محفوظة لشركة مسارات واصل للتقنية.
                    </div>
                </div>
            </footer>
        </div>
    );
=======
                    <div className={`p-10 lg:p-14 border-t flex flex-col items-center gap-8 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                       <p className={`text-sm font-bold max-w-lg text-center leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                          {isAr ? "بمجرد النقر على زر الإرسال، فإنك توافق على " : "By clicking submit, you agree to our "}
                          <a href="#" className={`underline underline-offset-4 ${isDark ? 'text-brand-yellow' : 'text-brand-navy'}`}>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</a>
                          {isAr ? " وشروط الاستخدام الخاصة بمنظومة مسارات واصل." : " and Terms of Service."}
                       </p>
                       <button 
                          disabled={isSubmitting}
                          className="w-full max-w-md py-5 bg-brand-navy text-white text-xl font-black rounded-[1.5rem] shadow-2xl shadow-brand-navy/30 hover:shadow-brand-navy/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-4"
                       >
                          {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <>{isAr ? "إرسال الطلب الآن" : "Submit Request Now"} <ArrowRight className={dir === 'rtl' ? 'rotate-180' : ''} size={24}/></>}
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

      {/* --- Floating Support Icon --- */}
      <a 
         href="https://wa.me/96879967769" 
         target="_blank"
         rel="noreferrer"
         className={`fixed bottom-8 ${dir === 'rtl' ? 'left-8' : 'right-8'} z-50 w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform border-4 border-brand-yellow`}
         title={isAr ? "تحدث مع الدعم الفني" : "Customer Support"}
      >
          {/* Temporary placeholder for Omani Character Head */}
          <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-brand-navy">
              <UserCircle2 size={32} />
          </div>
      </a>
    </div>
  );
>>>>>>> b353e8e (feat: I update all things on side  welcome screen  also I add new pages  like events dynamic and add full-stack public events forum)
}

// ─── Sub-Components ───────────────────────────────────────

<<<<<<< HEAD
function FormInput({
    label,
    id,
    type = "text",
    icon,
    placeholder,
    helpText,
    required,
    dir = "rtl",
    value,
    onChange,
    error,
}: any) {
    return (
        <div className="space-y-3">
            <label className="text-sm font-black text-brand-navy" htmlFor={id}>
                {label}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-navy transition-colors">
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
                    className={`w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 ${icon ? "pr-12" : "pr-4"} pl-4 font-bold text-brand-navy focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all placeholder:text-slate-300 ${error ? "border-red-500" : "border-slate-100"}`}
                />
            </div>
            {error && (
                <div className="text-xs text-red-500 font-bold mt-1 text-right">
                    {error}
                </div>
            )}
            {helpText && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {helpText}
                </p>
            )}
        </div>
    );
=======
function FormInput({ label, id, type = "text", icon, placeholder, helpText, required, dir = "rtl", theme, defaultValue }: any) {
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
             defaultValue={defaultValue}
             className={`w-full border rounded-2xl py-4 font-bold transition-all ${icon ? (dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4') : 'px-4'} ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:ring-brand-yellow/20 focus:border-brand-yellow' : 'bg-slate-50 border-slate-100 text-brand-navy placeholder:text-slate-300 focus:ring-brand-navy/20 focus:border-brand-navy'}`}
          />
       </div>
       {helpText && <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{helpText}</p>}
    </div>
  );
}

function PlanOption({ id, title, price, selected, onClick, isMostPopular, features, theme, isAr }: any) {
  const isDark = theme === 'dark';
  return (
    <div 
       onClick={onClick}
       className={`relative cursor-pointer p-8 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center text-center ${
         selected 
          ? 'border-brand-navy bg-brand-navy text-white shadow-2xl shadow-brand-navy/30 scale-[1.03]' 
          : (isDark ? 'border-slate-700 bg-slate-800 hover:border-brand-yellow hover:shadow-xl shadow-black/30' : 'border-slate-100 bg-white hover:border-brand-yellow hover:shadow-xl')
       }`}
    >
       {isMostPopular && (
         <div className={`absolute -top-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${selected ? 'bg-brand-yellow text-brand-dark' : (isDark ? 'bg-slate-600 text-white' : 'bg-brand-navy text-white')}`}>{isAr ? "شائع" : "Popular"}</div>
       )}
       <h4 className={`text-lg font-black mb-3 ${selected ? 'text-white' : (isDark ? 'text-white' : 'text-brand-navy')}`}>{title}</h4>
       <div className={`flex items-center justify-center gap-2 mb-6 ${isAr ? 'flex-row-reverse' : ''}`}>
          <span className={`text-3xl font-black ${selected ? 'text-white' : (isDark ? 'text-white' : 'text-slate-900')}`}>{price}</span>
          <OmaniRial size={24} color={selected ? "currentColor" : (isDark ? "#f5b800" : "#0f172a")} className="mt-1" />
       </div>
       <div className={`text-xs font-bold mb-4 opacity-70 ${selected ? 'text-white' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
          {isAr ? "/ شهرياً" : "/ monthly"}
       </div>
       <ul className="space-y-3 w-full">
          {features.map((f: string, i: number) => (
            <li key={i} className={`flex items-center justify-center gap-2 text-xs font-bold ${selected ? 'text-white/70' : (isDark ? 'text-slate-300' : 'text-slate-500')}`}>
               <Zap size={14} className={selected ? 'text-brand-yellow' : 'text-brand-navy'} /> {f}
            </li>
          ))}
       </ul>
    </div>
  );
>>>>>>> b353e8e (feat: I update all things on side  welcome screen  also I add new pages  like events dynamic and add full-stack public events forum)
}
