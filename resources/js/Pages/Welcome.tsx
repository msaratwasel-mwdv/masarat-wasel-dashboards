import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import {
    motion,
    useScroll,
    useTransform,
    AnimatePresence,
} from "framer-motion";
import { Play, Bus, Shield, Zap, MapPin, ArrowLeft, CheckCircle2, Users, Clock, BarChart3, Smartphone, ChevronRight, Menu, X, Instagram, Linkedin, Facebook, Award, MessageCircle, Mail, Moon, Sun, Globe, HeartHandshake, Lightbulb, Target, CheckCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Welcome({
    auth,
    latestEvents = [],
}: PageProps<{ laravelVersion: string; phpVersion: string; latestEvents: any[] }>) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [lang, setLang] = useState<"ar" | "en">("ar");
    const [theme, setTheme] = useState<"light" | "dark">("light");

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    };

    const isAr = lang === "ar";
    const dir = isAr ? "rtl" : "ltr";

    return (
        <div
            className={`min-h-screen font-sans selection:bg-brand-yellow/30 selection:text-brand-navy overflow-hidden transition-colors duration-300 ${
                theme === "dark" ? "bg-slate-900 text-slate-100" : "bg-slate-50 text-slate-900"
            }`}
            dir={dir}
        >
            <Head>
                <title>{isAr ? "مسارات واصل | نقل ذكي وآمن للمدارس في سلطنة عمان" : "Masarat Wasel | Smart & Safe School Transport in Oman"}</title>
                <meta
                    name="description"
                    content={isAr ? "شركة مسارات واصل هي المنصة الرائدة لنقل الطلاب وإدارة الحافلات المدرسية في سلطنة عمان. نقدم تطبيقاً ذكياً لتتبع حافلات المدارس بأمان وربط أولياء الأمور والمشرفات والمدارس لحظياً. مع واصل.. الكل واصل! ونقل ذكي وآمن لأبنائكم." : "Masarat Wasel is the leading school transport and bus tracking platform in Oman. We offer a smart and safe application for school bus tracking, connecting parents, schools, and drivers in real-time. With Wasel, everyone arrives safely!"}
                />
                <meta
                    name="keywords"
                    content={isAr ? "شركة مسارات واصل, شركة نقل طلاب, خدمات النقل المدرسي, تطبيق النقل المدرسي, تتبع الحافلات المدرسية, نقل الطلاب بأمان, حافلات المدارس, تطبيق ولي الأمر, تطبيق السائق, تطبيق المشرفة, تطبيق المدرسة, إدارة النقل المدرسي, خدمة النقل الذكي, تطبيق تتبع الطلاب, تطبيق تتبع الحافلات, سلامة الطلاب, نظام النقل المدرسي, اشتراك النقل المدرسي, أسعار النقل المدرسي, تطبيق النقل الذكي, خدمة النقل للمدارس العالمية, تطبيق النقل للطلاب, تطبيق النقل للمدارس, تطبيق النقل للمعلمات, تطبيق النقل للمعلمين, تطبيق النقل للموظفين, تطبيق النقل للجامعات, تطبيق النقل للمدارس الخاصة, تطبيق النقل للمدارس الحكومية, تطبيق النقل للمدارس الدولية, تطبيق النقل للمدارس الأهلية, تطبيق النقل للمدارس العربية, تطبيق النقل للمدارس الإنجليزية, تطبيق النقل للمدارس الفرنسية, تطبيق النقل للمدارس الألمانية, تطبيق النقل للمدارس الهندية, تطبيق النقل للمدارس الباكستانية, تطبيق النقل للمدارس الأمريكية, تطبيق النقل للمدارس الكندية, تطبيق النقل للمدارس العمانية, تطبيق النقل للمدارس الخليجية, تطبيق النقل للمدارس العربية الدولية, افضل تطبيق لنقل طلاب المدارس في سلطنة عمان, افضل شركة نقل طلاب مدارس, تطبيق تتبع حافلات, تطبيق نقل طلاب مدارس" : "Masarat Wasel, school transport Oman, school bus tracking app, safe school bus Oman, parent app school bus tracking, Oman school bus system, smart school transportation Muscat, school bus driver app, school bus empty alert Oman, private school transport Oman, school bus fleet management GCC"}
                />
                <link rel="canonical" href="https://masarat-wasel.com" />
                <link rel="alternate" href="https://masarat-wasel.com" hrefLang="ar" />
                <link rel="alternate" href="https://masarat-wasel.com/en" hrefLang="en" />
                <link rel="alternate" href="https://masarat-wasel.com" hrefLang="x-default" />
                
                {/* Open Graph Tags for Social Media */}
                <meta property="og:title" content={isAr ? "مسارات واصل | نقل ذكي وآمن للمدارس في سلطنة عمان" : "Masarat Wasel | Smart & Safe School Transport in Oman"} />
                <meta property="og:description" content={isAr ? "شركة مسارات واصل هي المنصة الرائدة لنقل الطلاب وإدارة الحافلات المدرسية في سلطنة عمان. نقدم تطبيقاً ذكياً لتتبع حافلات المدارس بأمان." : "Masarat Wasel is the leading school transport and bus tracking platform in Oman. We offer a smart and safe application for school bus tracking."} />
                <meta property="og:image" content="/images/logo2.png" />
                <meta property="og:url" content="https://masarat-wasel.com" />
                <meta property="og:type" content="website" />
                
                {/* Twitter Card Tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={isAr ? "مسارات واصل | نقل ذكي وآمن للمدارس في سلطنة عمان" : "Masarat Wasel | Smart & Safe School Transport in Oman"} />
                <meta name="twitter:description" content={isAr ? "تطبيق ذكي لتتبع حافلات المدارس بأمان في سلطنة عمان." : "Smart school bus tracking and management in Oman."} />
                <meta name="twitter:image" content="/images/logo2.png" />
                

                <link
                    rel="icon"
                    type="image/png"
                    href="/images/logo2.png"
                />
            </Head>

            {/* --- Floating Background Elements --- */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-yellow/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] bg-brand-navy/5 rounded-full blur-[120px]" />
            </div>

            {/* --- Navigation --- */}
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                    isScrolled
                        ? theme === "dark" ? "py-3 bg-slate-900/90 backdrop-blur-xl shadow-lg shadow-black/50 border-b border-slate-800" : "py-3 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50"
                        : "py-6 bg-transparent"
                }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-3 group relative"
                    >
                        <div className="relative w-14 h-14 transition-transform group-hover:scale-110 duration-500">
                            <div className="absolute inset-0 bg-brand-yellow/20 rounded-xl blur-lg group-hover:bg-brand-yellow/40 transition-colors" />
                            <img
                                src="/images/logo2.png"
                                alt="Logo"
                                className="relative h-full w-full object-contain rounded-xl shadow-sm border border-white p-1.5 bg-white"
                            />
                        </div>
                        <span className={`text-xl font-black bg-clip-text text-transparent tracking-tight ${theme === "dark" ? "bg-gradient-to-l from-brand-yellow to-white" : "bg-gradient-to-l from-brand-navy to-slate-600"}`}>
                            {isAr ? "مسارات واصل" : "Masarat Wasel"}
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-1">
                        {[
                            { id: "home", labelAr: "الرئيسية", labelEn: "Home" },
                            { id: "about", labelAr: "من نحن", labelEn: "About Us" },
                            { id: "features", labelAr: "المميزات", labelEn: "Features" },
                            { id: "events", labelAr: "الفعاليات", labelEn: "Events" },
                        ].map(
                            (item, i) => (
                                <a
                                    key={i}
                                    href={`#${item.id}`}
                                    className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                                        theme === "dark" ? "text-slate-300 hover:text-white hover:bg-slate-800" : "text-slate-600 hover:text-brand-navy hover:bg-slate-100/50"
                                    }`}
                                >
                                    {isAr ? item.labelAr : item.labelEn}
                                </a>
                            ),
                        )}
                    </div>

                    <div className="hidden lg:flex items-center gap-4">
                        {/* Toggles */}
                        <div className="flex items-center gap-2 border-r border-slate-200 pr-4 rtl:border-r-0 rtl:border-l rtl:pr-0 rtl:pl-4">
                            <button
                                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                                className={`p-2 rounded-xl transition-colors flex items-center gap-2 text-sm font-bold ${
                                    theme === "dark" ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"
                                }`}
                                title="Change Language"
                            >
                                <Globe size={18} />
                                {lang === "ar" ? "EN" : "عربي"}
                            </button>
                            <button
                                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                                className={`p-2 rounded-xl transition-colors ${
                                    theme === "dark" ? "hover:bg-slate-800 text-brand-yellow" : "hover:bg-slate-100 text-brand-navy"
                                }`}
                                title="Toggle Theme"
                            >
                                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                        </div>

                        {auth.user ? (
                            <Link
                                href={
                                    auth.user.role === "admin"
                                        ? route("admin.dashboard")
                                        : route("school.dashboard")
                                }
                                className="px-6 py-2.5 bg-brand-navy text-white text-sm font-bold rounded-xl shadow-xl shadow-brand-navy/20 hover:shadow-brand-navy/30 hover:-translate-y-0.5 transition-all"
                            >
                                {isAr ? "لوحة التحكم" : "Dashboard"}
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route("login")}
                                    className={`text-sm font-bold px-4 transition-colors ${
                                        theme === "dark" ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-brand-navy"
                                    }`}
                                >
                                    {isAr ? "تسجيل الدخول" : "Login"}
                                </Link>
                                <Link
                                    href={route("subscription")}
                                    className="px-6 py-2.5 bg-brand-yellow text-brand-dark text-sm font-bold rounded-xl shadow-xl shadow-brand-yellow/20 hover:shadow-brand-yellow/30 hover:-translate-y-0.5 transition-all"
                                >
                                    {isAr ? "اشترك الآن" : "Subscribe Now"}
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className={`lg:hidden p-2 ${theme === "dark" ? "text-white" : "text-brand-navy"}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: dir === "rtl" ? 100 : -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: dir === "rtl" ? 100 : -100 }}
                        className={`fixed inset-0 z-40 pt-24 px-8 flex flex-col gap-6 ${
                            theme === "dark" ? "bg-slate-900" : "bg-white"
                        }`}
                    >
                        <div className="flex justify-center gap-4 mb-4">
                            <button onClick={() => {setLang(lang === "ar" ? "en" : "ar"); setMobileMenuOpen(false);}} className={`px-4 py-2 rounded-xl flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <Globe size={18} /> {lang === "ar" ? "English" : "العربية"}
                            </button>
                            <button onClick={() => {setTheme(theme === "light" ? "dark" : "light"); setMobileMenuOpen(false);}} className={`px-4 py-2 rounded-xl flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                {theme === "light" ? <><Moon size={18} /> {isAr ? "ليلي" : "Dark"}</> : <><Sun size={18} /> {isAr ? "نهاري" : "Light"}</>}
                            </button>
                        </div>
                        {[
                            { id: "home", labelAr: "الرئيسية", labelEn: "Home" },
                            { id: "about", labelAr: "من نحن", labelEn: "About Us" },
                            { id: "features", labelAr: "المميزات", labelEn: "Features" },
                            { id: "events", labelAr: "الفعاليات", labelEn: "Events" },
                        ].map(
                            (item, i) => (
                                <a
                                    key={i}
                                    href={`#${item.id}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`text-2xl font-black border-b pb-4 ${
                                        theme === "dark" ? "text-white border-slate-800" : "text-brand-navy border-slate-100"
                                    }`}
                                >
                                    {isAr ? item.labelAr : item.labelEn}
                                </a>
                            ),
                        )}
                        <div className="mt-auto pb-12 flex flex-col gap-4">
                            <Link
                                href={route("login")}
                                className={`w-full py-4 text-center font-bold rounded-2xl ${
                                    theme === "dark" ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-600"
                                }`}
                            >
                                {isAr ? "تسجيل الدخول" : "Login"}
                            </Link>
                            <Link
                                href={route("subscription")}
                                className="w-full py-4 text-center font-bold text-brand-dark bg-brand-yellow rounded-2xl shadow-lg"
                            >
                                {isAr ? "اشترك الآن" : "Subscribe Now"}
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Hero Section --- */}
            <section
                id="home"
                className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-visible"
            >
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        style={{ opacity, scale }}
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className={isAr ? "text-right" : "text-left"}
                    >
                        <motion.div
                            variants={itemVariants}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold mb-6 ${
                                theme === "dark" ? "bg-brand-yellow/20 border-brand-yellow/30 text-brand-yellow" : "bg-brand-yellow/10 border-brand-yellow/20 text-brand-dark"
                            }`}
                        >
                            <Award size={14} className="text-brand-yellow" />
                            {isAr ? "المنصة رقم 1 لإدارة النقل المدرسي في سلطنة عمان" : "The #1 School Transport Platform in Oman"}
                        </motion.div>
                        <motion.h1
                            variants={itemVariants}
                            className={`text-5xl lg:text-7xl font-black leading-[1.15] mb-8 ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}
                        >
                            {isAr ? "نقل ذكي وآمن" : "Smart & Safe"}<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-yellow via-yellow-600 to-amber-500">
                                {isAr ? "مع مسارات واصل" : "Transport"}
                            </span>
                        </motion.h1>
                        <motion.p
                            variants={itemVariants}
                            className={`text-lg lg:text-xl font-medium leading-relaxed mb-12 max-w-xl ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}
                        >
                            {isAr
                              ? "نقدم حلول نقل ذكية وآمنة وحديثة بخدمات رقمية متكاملة لربط المدارس وأولياء الأمور. وفر وقتك، واضمن سلامة أبنائك باحترافية."
                              : "We offer smart, safe, and modern transport solutions with integrated digital services connecting schools and parents. Save time and ensure safety professionally."}
                        </motion.p>
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center gap-4"
                        >
                            <Link
                                href={route("subscription")}
                                className="w-full sm:w-auto px-10 py-5 bg-brand-navy text-white text-lg font-black rounded-2xl shadow-2xl shadow-brand-navy/30 hover:shadow-brand-navy/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 border border-brand-navy"
                            >
                                {isAr ? "ابدأ رحلتك معنا" : "Start Your Journey"}
                                <ChevronRight className={isAr ? "rotate-180" : ""} size={20} />
                            </Link>
                            <Link
                                href={route("subscription")}
                                className={`w-full sm:w-auto px-10 py-5 text-lg font-bold rounded-2xl border transition-all flex items-center justify-center gap-2 ${
                                    theme === "dark" ? "bg-slate-800 text-white border-slate-700 hover:bg-slate-700" : "bg-white text-brand-navy border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                {isAr ? "اشترك الآن" : "Subscribe Now"}
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Hero Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: dir === 'rtl' ? -100 : 100 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-yellow/20 to-transparent rounded-[3rem] blur-3xl rotate-12 -z-10" />
                        <div className={`relative rounded-[3rem] p-4 shadow-3xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 shadow-black/50' : 'bg-white border-white shadow-slate-200/50'}`}>
                            <div
                                className="rounded-[2.5rem] overflow-hidden aspect-[4/3] bg-slate-100 flex items-center justify-center cursor-pointer group/video relative"
                                onClick={togglePlay}
                            >
                                <video
                                    ref={videoRef}
                                    src="/assets/images/intro_video.webm"
                                    className="w-full h-full object-contain transition-transform duration-700"
                                    playsInline
                                    loop
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                />

                                {!isPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover/video:bg-black/20 transition-all duration-500">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="w-20 h-20 bg-brand-yellow text-brand-navy rounded-full flex items-center justify-center shadow-2xl transform group-hover/video:scale-110 transition-transform duration-500"
                                        >
                                            <Play size={32} fill="currentColor" className="mr-[-4px]" />
                                        </motion.div>
                                    </div>
                                )}
                            </div>
                            {/* Floating UI Elements */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className={`absolute -top-10 ${dir === 'rtl' ? '-right-10' : '-left-10'} p-4 rounded-3xl shadow-xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-50'}`}
                            >
                                <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center shadow-inner">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div className={isAr ? "text-right" : "text-left"}>
                                    <div className="text-sm font-black text-green-500">
                                        {isAr ? "آمن 100%" : "100% Safe"}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- About Us & Definitions Section --- */}
            <section id="about" className={`py-24 relative ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-xs font-black text-brand-yellow uppercase tracking-[0.2em] mb-4">
                            {isAr ? "لماذا واصل؟" : "Why Wasel?"}
                        </h2>
                        <h3 className={`text-3xl lg:text-5xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>
                            {isAr ? "رؤيتنا نحو مستقبل النقل" : "Our Vision for Future Transport"}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        {/* من نحن */}
                        <div className={`p-10 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} hover:-translate-y-2 transition-all duration-300`}>
                            <div className="w-14 h-14 rounded-2xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center mb-6">
                                <Users size={28} />
                            </div>
                            <h4 className={`text-2xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>
                                {isAr ? "من نحن" : "About Us"}
                            </h4>
                            <p className={`font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                                {isAr ? "نحن شركة رائدة بخدمات النقل والتوصيل اللوجستي والأنظمة بسلطنة عمان، بدأنا العمل منذ عام 2012 ونقدم حلول نقل ذكية وآمنة وحديثة بخدمات رقمية متكاملة." : "We are a leading transport and logistics company in Oman, established in 2012, offering smart, safe, and modern transport solutions."}
                            </p>
                        </div>

                        {/* رؤيتنا */}
                        <div className={`p-10 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} hover:-translate-y-2 transition-all duration-300`}>
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center mb-6">
                                <Lightbulb size={28} />
                            </div>
                            <h4 className={`text-2xl font-black mb-4 ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>
                                {isAr ? "رؤيتنا" : "Our Vision"}
                            </h4>
                            <p className={`font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                                {isAr ? "إدارة خدمات النقل المدرسي والعام باحترافية، وتقديم الحلول الرقمية واللوجستية بجودة عالية تضمن راحة وأمان عملائنا." : "Managing school and public transport professionally, and providing high-quality digital and logistical solutions."}
                            </p>
                        </div>
                    </div>

                    {/* مستويات الأمان */}
                    <div className={`p-10 lg:p-16 rounded-[3rem] border ${theme === 'dark' ? 'bg-brand-navy border-slate-700 text-white' : 'bg-brand-navy text-white shadow-2xl shadow-brand-navy/30'}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h4 className="text-3xl font-black mb-6 text-brand-yellow">
                                    {isAr ? "5 مستويات للأمان" : "5 Security Levels"}
                                </h4>
                                <ul className="space-y-4">
                                    {[
                                        { ar: "تتبع جغرافي ذكي ولحظي", en: "Smart Real-time Geo-tracking" },
                                        { ar: "مراقبة متقدمة لسلوك القيادة", en: "Advanced Driver Behavior Monitoring" },
                                        { ar: "نظام التحقق الذكي من خلو الحافلة", en: "Smart Bus-Empty Verification System" },
                                        { ar: "أتمتة الحضور والتحضير الرقمي", en: "Digital Attendance & Roll-call Automation" },
                                        { ar: "منظومة الرصد المرئي المباشر", en: "Live Visual Monitoring System" },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-4 font-bold text-lg text-slate-200 group">
                                            <div className="w-8 h-8 rounded-lg bg-brand-yellow/20 flex items-center justify-center text-brand-yellow group-hover:scale-110 transition-transform">
                                                <CheckCircle size={18} />
                                            </div>
                                            {isAr ? item.ar : item.en}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {/* هدفنا */}
                                <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10">
                                    <Target className="text-brand-yellow mb-4" size={32} />
                                    <h5 className="font-black text-xl mb-2 text-white">{isAr ? "هدفنا" : "Our Goal"}</h5>
                                    <p className="text-sm text-white/70 font-medium leading-relaxed">
                                        {isAr ? "الرقي بخدمات النقل المدرسي والعام لأعلى المستويات بتجربة آمنة ومنظمة." : "Elevating transport services to the highest levels securely."}
                                    </p>
                                </div>
                                {/* امتيازاتنا */}
                                <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10">
                                    <Award className="text-brand-yellow mb-4" size={32} />
                                    <h5 className="font-black text-xl mb-2 text-white">{isAr ? "امتيازاتنا" : "Privileges"}</h5>
                                    <ul className="space-y-1">
                                        {(isAr ? ["حافلات حديثة ومجهزة", "ربط مباشر بين ولي الأمر والمدرسة", "صندوق مفقودات", "مراقبة مستمرة"] : ["Modern equipped buses", "Parent-school connection", "Lost & found", "Continuous monitoring"]).map((item, i) => (
                                            <li key={i} className="text-xs text-white/70 font-medium flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Events & Mini Forum --- */}
            <section id="events" className={`py-24 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <h2 className="text-xs font-black text-brand-yellow uppercase tracking-[0.2em] mb-4">
                                {isAr ? "أخبار وفعاليات" : "News & Events"}
                            </h2>
                            <h3 className={`text-3xl lg:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>
                                {isAr ? "المنتدى المصغر" : "Mini Forum"}
                            </h3>
                        </div>
                        <Link href={route('events.index')} className={`font-bold text-sm ${theme === 'dark' ? 'text-brand-yellow hover:text-white' : 'text-brand-navy hover:text-brand-yellow'}`}>
                            {isAr ? "عرض الكل" : "View All"}
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {latestEvents.map((event) => (
                            <Link href={route('events.index')} key={event.id} className={`rounded-[2rem] overflow-hidden border group cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 hover:shadow-xl'}`}>
                                <div className="h-48 bg-slate-200 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-brand-navy/10 group-hover:bg-transparent transition-colors z-10" />
                                    {event.image ? (
                                        <img src={event.image} alt={isAr ? event.title_ar : event.title_en} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700 text-slate-500' : 'bg-slate-200 text-slate-400'}`}>
                                            <Bus size={48} className="opacity-50" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 z-20 bg-brand-yellow text-brand-dark text-xs font-black px-3 py-1 rounded-lg">
                                        {isAr ? event.tag_ar : event.tag_en}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="text-xs text-slate-500 font-bold mb-2">
                                        {event.event_date ? new Date(event.event_date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : '—'}
                                    </div>
                                    <h4 className={`text-xl font-black mb-2 line-clamp-2 transition-colors group-hover:text-brand-yellow ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>
                                        {isAr ? event.title_ar : event.title_en}
                                    </h4>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Features Section --- */}
            <section id="features" className={`py-32 relative ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-xs font-black text-brand-yellow uppercase tracking-[0.2em] mb-4">
                            {isAr ? "مميزات المنصة" : "Platform Features"}
                        </h2>
                        <h3 className={`text-4xl lg:text-5xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>
                            {isAr ? "خدمات النقل الشاملة" : "Comprehensive Transport Services"}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard theme={theme} icon={<Bus size={28} />} title={isAr ? "النقل المدرسي والعام" : "School & Public Transport"} desc={isAr ? "إدارة كاملة لأسطول النقل المدرسي والعام." : "Full management of transport fleet."} color="blue" />
                        <FeatureCard theme={theme} icon={<Shield size={28} />} title={isAr ? "حلول السلامة" : "Safety Solutions"} desc={isAr ? "كاميرات، أحزمة أمان، طفايات حريق، إسعافات أولية." : "Cameras, seatbelts, fire extinguishers."} color="emerald" />
                        <FeatureCard theme={theme} icon={<Smartphone size={28} />} title={isAr ? "إدارة عبر التطبيق" : "App Management"} desc={isAr ? "متابعة الحافلات مباشرة، وتحديث الحالة الفوري." : "Live bus tracking and instant updates."} color="brand" />
                        <FeatureCard theme={theme} icon={<BarChart3 size={28} />} title={isAr ? "الأرشفة الإلكترونية" : "Digital Archiving"} desc={isAr ? "متابعة الحضور والغياب والإشعارات الفورية." : "Attendance tracking and instant notifications."} color="orange" />
                        <FeatureCard theme={theme} icon={<Clock size={28} />} title={isAr ? "الرحلات المدرسية" : "School Trips"} desc={isAr ? "تنظيم رحلات مدرسية آمنة ومراقبة." : "Organizing safe and monitored school trips."} color="purple" />
                        <FeatureCard theme={theme} icon={<HeartHandshake size={28} />} title={isAr ? "الدعم والتدريب" : "Support & Training"} desc={isAr ? "دعم فني وتوعية مستمرة للسائقين." : "Technical support and continuous awareness."} color="rose" />
                    </div>
                </div>
            </section>

            {/* --- Success Stories --- */}
            <section id="success" className="py-24 relative overflow-hidden bg-brand-navy text-white">
                <div className="absolute top-0 right-0 w-full h-full opacity-10 blur-3xl pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-yellow rounded-full" />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block text-xs font-black text-brand-yellow uppercase tracking-[0.2em] mb-4">{isAr ? "إنجازاتنا" : "Our Achievements"}</span>
                        <h3 className="text-3xl lg:text-5xl font-black mb-4 text-white">{isAr ? "قصص النجاح" : "Success Stories"}</h3>
                        <p className="text-slate-300 font-medium">{isAr ? "مدارس ومؤسسات تثق بخدماتنا في سلطنة عمان" : "Schools and institutions that trust our services in Oman"}</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                        {[
                            { label: isAr ? "رحلة آمنة يومياً" : "Safe Daily Trips", val: "100", icon: "🚌" },
                            { label: isAr ? "طالب مسجل" : "Registered Students", val: "2,000", icon: "👨‍🎓" },
                            { label: isAr ? "مدرسة مسجلة" : "Registered Schools", val: "30", icon: "🏫" },
                            { label: isAr ? "نسبة رضا العملاء" : "Customer Satisfaction", val: "98%", icon: "⭐" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/10 border border-white/20 rounded-3xl p-8 hover:bg-white/15 transition-all hover:-translate-y-2 group">
                                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{stat.icon}</div>
                                <div className="text-4xl lg:text-5xl font-black text-brand-yellow mb-3">
                                    {stat.val}
                                </div>
                                <div className="text-sm font-bold text-white uppercase tracking-wider">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FAQ Section --- */}
            <section id="faq" className={`py-24 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="max-w-4xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-xs font-black text-brand-yellow uppercase tracking-[0.2em] mb-4">{isAr ? "دعم وإجابات" : "Support & Answers"}</h2>
                        <h3 className={`text-3xl lg:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}</h3>
                    </div>
                    <div className="space-y-4">
                        {[
                            { q: isAr ? "ما هي مسارات واصل؟" : "What is Masarat Wasel?", a: isAr ? "مسارات واصل هي منصة متكاملة لإدارة النقل المدرسي في سلطنة عمان، تربط المدارس وأولياء الأمور والسائقين في منصة واحدة آمنة وذكية." : "Masarat Wasel is an integrated school transport management platform in Oman, connecting schools, parents, and drivers in one safe and smart platform." },
                            { q: isAr ? "كيف يمكنني الاشتراك؟" : "How can I subscribe?", a: isAr ? "يمكنك الاشتراك بسهولة عبر النقر على زر 'اشترك الآن' وملء النموذج. سيتواصل معك فريقنا خلال 24 ساعة لإتمام التفعيل." : "You can subscribe easily by clicking the 'Subscribe Now' button and filling out the form. Our team will contact you within 24 hours to complete activation." },
                            { q: isAr ? "هل يدعم النظام اللغة العربية؟" : "Does the system support Arabic?", a: isAr ? "نعم، يدعم النظام اللغتين العربية والإنجليزية بشكل كامل مع دعم الاتجاه من اليمين لليسار (RTL)." : "Yes, the system fully supports both Arabic and English with complete RTL support." },
                            { q: isAr ? "ما هي باقات الاشتراك المتاحة؟" : "What subscription plans are available?", a: isAr ? "نقدم ثلاث باقات: الأساسية (حتى 5 حافلات)، والمتقدمة (حتى 15 حافلة)، والمؤسسات (غير محدودة). تواصل معنا لمعرفة المزيد." : "We offer three plans: Basic (up to 5 buses), Advanced (up to 15 buses), and Enterprise (unlimited). Contact us for more details." },
                        ].map((faq, i) => (
                            <div key={i} className={`p-8 rounded-3xl border ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'}`}>
                                <h4 className={`text-lg font-black mb-3 ${theme === 'dark' ? 'text-brand-yellow' : 'text-brand-navy'}`}>{faq.q}</h4>
                                <p className={`font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Guide, Privacy, Terms, Cookies Sections --- */}
            <section id="guide" className={`py-16 border-t ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="max-w-4xl mx-auto px-6">
                    <h3 className={`text-2xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "دليل الاستخدام" : "User Guide"}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { step: "1", title: isAr ? "سجّل مدرستك" : "Register Your School", desc: isAr ? "أكمل نموذج الاشتراك بمعلومات مدرستك وانتظر تأكيد التفعيل خلال 24 ساعة." : "Complete the subscription form with your school information and wait for activation confirmation within 24 hours." },
                            { step: "2", title: isAr ? "أضف الحافلات والسائقين" : "Add Buses & Drivers", desc: isAr ? "قم برفع بيانات الحافلات والسائقين عبر لوحة التحكم، وسيساعدك فريقنا في ذلك." : "Upload bus and driver data through the dashboard, and our team will assist you." },
                            { step: "3", title: isAr ? "ابدأ التتبع الآن" : "Start Tracking Now", desc: isAr ? "شارك رابط التطبيق مع أولياء الأمور وابدأ فوراً في متابعة رحلات الطلاب بشكل آمن." : "Share the app link with parents and immediately start monitoring student trips safely." },
                        ].map((s, i) => (
                            <div key={i} className={`p-6 rounded-2xl border flex flex-col gap-3 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                <div className="w-10 h-10 rounded-xl bg-brand-yellow text-brand-dark font-black flex items-center justify-center text-xl">{s.step}</div>
                                <h4 className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>{s.title}</h4>
                                <p className={`text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="privacy" className={`py-16 border-t ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="max-w-4xl mx-auto px-6">
                    <h3 className={`text-2xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</h3>
                    <div className={`space-y-4 font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <p>{isAr ? "تلتزم مسارات واصل بحماية خصوصية جميع مستخدميها. نجمع البيانات اللازمة فقط لتشغيل خدمات النقل وتحسينها، ولا نشاركها مع أطراف ثالثة إلا بموافقتك الصريحة." : "Masarat Wasel is committed to protecting the privacy of all users. We only collect data necessary to operate and improve transport services, and we do not share it with third parties without your explicit consent."}</p>
                        <p>{isAr ? "نستخدم أعلى معايير التشفير (SSL/TLS) لحماية بياناتك أثناء النقل والتخزين. يحق لك طلب حذف بياناتك في أي وقت عبر التواصل مع فريق الدعم." : "We use the highest encryption standards (SSL/TLS) to protect your data during transmission and storage. You have the right to request deletion of your data at any time by contacting the support team."}</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>{isAr ? "آخر تحديث: مايو 2024 | للاستفسار: msaratwasel@gmail.com" : "Last updated: May 2024 | Inquiries: msaratwasel@gmail.com"}</p>
                    </div>
                </div>
            </section>

            <section id="terms" className={`py-16 border-t ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="max-w-4xl mx-auto px-6">
                    <h3 className={`text-2xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "شروط الخدمة" : "Terms of Service"}</h3>
                    <div className={`space-y-4 font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <p>{isAr ? "باستخدامك لمنصة مسارات واصل فإنك توافق على الشروط التالية: يجب استخدام المنصة لأغراض تعليمية ونقل مشروعة فقط. لا يسمح بمشاركة بيانات تسجيل الدخول مع أطراف غير مصرح لها." : "By using the Masarat Wasel platform, you agree to the following terms: The platform must be used for legitimate educational and transport purposes only. Sharing login credentials with unauthorized parties is not permitted."}</p>
                        <p>{isAr ? "تحتفظ مسارات واصل بحق تحديث هذه الشروط في أي وقت. سيتم إخطار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني المسجل." : "Masarat Wasel reserves the right to update these terms at any time. Users will be notified of any material changes via their registered email address."}</p>
                    </div>
                </div>
            </section>

            <section id="cookies" className={`py-16 border-t ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className="max-w-4xl mx-auto px-6">
                    <h3 className={`text-2xl font-black mb-6 ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>{isAr ? "سياسة ملفات الارتباط" : "Cookies Policy"}</h3>
                    <div className={`space-y-4 font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <p>{isAr ? "نستخدم ملفات الارتباط (Cookies) لتحسين تجربة الاستخدام وتذكر تفضيلاتك مثل اللغة والوضع اللوني. يمكنك التحكم في ملفات الارتباط عبر إعدادات متصفحك في أي وقت." : "We use cookies to improve the user experience and remember your preferences such as language and color mode. You can manage cookies through your browser settings at any time."}</p>
                        <p>{isAr ? "لا نستخدم ملفات الارتباط لأغراض إعلانية أو لمشاركة بياناتك مع أطراف ثالثة." : "We do not use cookies for advertising purposes or to share your data with third parties."}</p>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className={`pt-24 pb-12 border-t ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
                        <div>
                            <Link href="/" className="flex items-center gap-3 mb-8">
                                <img src="/images/logo2.png" alt="Logo" className="h-10 w-10 object-contain rounded-xl" />
                                <span className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>
                                    {isAr ? "مسارات واصل" : "Masarat Wasel"}
                                </span>
                            </Link>
                            <p className={`font-medium leading-relaxed mb-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                {isAr ? "حلول النقل الذكي والأمن المتكامل بسلطنة عمان." : "Smart and safe integrated transport solutions in Oman."}
                            </p>
                            <div className="flex items-center gap-4">
                                <a href="https://www.instagram.com/wasel_company?igsh=MXhvOXhxN3l0c2Zvdw==" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-brand-yellow hover:text-brand-dark' : 'bg-slate-50 text-slate-400 hover:bg-brand-navy hover:text-white'}`}><Instagram size={18} /></a>
                                <a href="#" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all font-black ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-brand-yellow hover:text-brand-dark' : 'bg-slate-50 text-slate-400 hover:bg-brand-navy hover:text-white'}`}>X</a>
                                <a href="https://www.linkedin.com/in/msarat-wasel-company-4a244b3b2" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-brand-yellow hover:text-brand-dark' : 'bg-slate-50 text-slate-400 hover:bg-brand-navy hover:text-white'}`}><Linkedin size={18} /></a>
                                <a href="https://www.facebook.com/share/1F7AL1CXs6/" target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-brand-yellow hover:text-brand-dark' : 'bg-slate-50 text-slate-400 hover:bg-brand-navy hover:text-white'}`}><Facebook size={18} /></a>
                            </div>
                        </div>

                        <div>
                            <h4 className={`text-lg font-black mb-8 ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>
                                {isAr ? "عن المنصة" : "Platform"}
                            </h4>
                            <ul className="space-y-4">
                                <li>
                                    <a href="#about" className={`font-bold transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-brand-yellow' : 'text-slate-500 hover:text-brand-navy'}`}>
                                        {isAr ? "من نحن" : "About Us"}
                                    </a>
                                </li>
                                <li>
                                    <a href="#features" className={`font-bold transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-brand-yellow' : 'text-slate-500 hover:text-brand-navy'}`}>
                                        {isAr ? "المميزات" : "Features"}
                                    </a>
                                </li>
                                <li>
                                    <a href="#success" className={`font-bold transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-brand-yellow' : 'text-slate-500 hover:text-brand-navy'}`}>
                                        {isAr ? "قصص النجاح" : "Success Stories"}
                                    </a>
                                </li>
                                <li>
                                    <a href="#events" className={`font-bold transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-brand-yellow' : 'text-slate-500 hover:text-brand-navy'}`}>
                                        {isAr ? "الفعاليات" : "Events"}
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className={`text-lg font-black mb-8 ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>
                                {isAr ? "الدعم والسياسات" : "Support & Policies"}
                            </h4>
                            <ul className="space-y-4">
                                <li>
                                    <a href="#faq" className={`font-bold transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-brand-yellow' : 'text-slate-500 hover:text-brand-navy'}`}>{isAr ? "الأسئلة الشائعة" : "FAQ"}</a>
                                </li>
                                <li>
                                    <a href="#guide" className={`font-bold transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-brand-yellow' : 'text-slate-500 hover:text-brand-navy'}`}>{isAr ? "دليل الاستخدام" : "User Guide"}</a>
                                </li>
                                <li>
                                    <a href="#privacy" className={`font-bold transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-brand-yellow' : 'text-slate-500 hover:text-brand-navy'}`}>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</a>
                                </li>
                                <li>
                                    <a href="#terms" className={`font-bold transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-brand-yellow' : 'text-slate-500 hover:text-brand-navy'}`}>{isAr ? "شروط الخدمة" : "Terms of Service"}</a>
                                </li>
                                <li>
                                    <a href="#cookies" className={`font-bold transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-brand-yellow' : 'text-slate-500 hover:text-brand-navy'}`}>{isAr ? "ملفات الارتباط" : "Cookies Policy"}</a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className={`text-lg font-black mb-8 ${theme === 'dark' ? 'text-white' : 'text-brand-navy'}`}>
                                {isAr ? "تواصل معنا" : "Contact Us"}
                            </h4>
                            <ul className="space-y-4">
                                <li>
                                    <a href="https://wa.me/96879967769" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 font-bold transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-brand-yellow' : 'text-slate-500 hover:text-brand-navy'}`} >
                                        <MessageCircle className="w-5 h-5 text-brand-yellow" />
                                        <span>+968 7996 7769</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="mailto:msaratwasel@gmail.com" className={`flex items-center gap-2 font-bold transition-colors break-all ${theme === 'dark' ? 'text-slate-400 hover:text-brand-yellow' : 'text-slate-500 hover:text-brand-navy'}`}>
                                        <Mail className="w-5 h-5 text-brand-yellow flex-shrink-0" />
                                        <span>msaratwasel@gmail.com</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className={`pt-12 border-t flex flex-col md:flex-row justify-between items-center gap-6 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className="text-slate-400 font-bold text-sm">
                            {isAr ? "© 2024 مسارات واصل. جميع الحقوق محفوظة." : "© 2024 Masarat Wasel. All rights reserved."}
                        </div>
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
                        theme === 'dark' ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-brand-navy border border-slate-100'
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
                        theme === 'dark' ? 'bg-slate-800' : 'bg-white'
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

function FeatureCard({ icon, title, desc, color, theme }: any) {
    const isDark = theme === 'dark';
    const colorMap: any = {
        blue: isDark ? "text-blue-400 bg-blue-900/30" : "text-blue-500 bg-blue-50",
        emerald: isDark ? "text-emerald-400 bg-emerald-900/30" : "text-emerald-500 bg-emerald-50",
        brand: isDark ? "text-brand-yellow bg-slate-700" : "text-brand-navy bg-slate-50",
        orange: isDark ? "text-orange-400 bg-orange-900/30" : "text-orange-500 bg-orange-50",
        purple: isDark ? "text-purple-400 bg-purple-900/30" : "text-purple-500 bg-purple-50",
        rose: isDark ? "text-rose-400 bg-rose-900/30" : "text-rose-500 bg-rose-50",
    };

    return (
        <motion.div
            whileHover={{ y: -8 }}
            className={`group p-10 border rounded-[2.5rem] transition-all duration-300 ${isDark ? 'bg-slate-800 border-slate-700 hover:border-brand-yellow/50 shadow-black/30 hover:shadow-2xl' : 'bg-white border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-brand-yellow/20'}`}
        >
            <div
                className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300 ${colorMap[color] || colorMap.brand}`}
            >
                {icon}
            </div>
            <h4 className={`text-2xl font-black mb-4 ${isDark ? 'text-white' : 'text-brand-navy'}`}>
                {title}
            </h4>
            <p className={`font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
        </motion.div>
    );
}
