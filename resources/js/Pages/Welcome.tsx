import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import {
    motion,
    useScroll,
    useTransform,
    AnimatePresence,
} from "framer-motion";
import { Play, Bus, Shield, Zap, MapPin, Phone, ArrowLeft, CheckCircle2, Users, Clock, BarChart3, Smartphone, ChevronRight, Menu, X, Instagram, Twitter, Linkedin, Facebook, Award, MessageCircle, Mail } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Welcome({
    auth,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

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

    return (
        <div
            className="min-h-screen bg-slate-50 font-sans selection:bg-brand-yellow/30 selection:text-brand-navy overflow-hidden"
            dir="rtl"
        >
            <Head>
                <title>مسارات واصل | ثورة في النقل المدرسي الذكي</title>
                <meta
                    name="description"
                    content="مسارات واصل - المنصة الأكثر أماناً وكفاءة لإدارة الأساطيل المدرسية في الشرق الأوسط."
                />
                <link
                    rel="icon"
                    type="image/png"
                    href="/assets/images/masarat-wasel-logo.jpg"
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
                        ? "py-3 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50"
                        : "py-6 bg-transparent"
                }`}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-3 group relative"
                    >
                        <div className="relative w-11 h-11 transition-transform group-hover:scale-110 duration-500">
                            <div className="absolute inset-0 bg-brand-yellow/20 rounded-xl blur-lg group-hover:bg-brand-yellow/40 transition-colors" />
                            <img
                                src="/assets/images/masarat-wasel-logo.jpg"
                                alt="Logo"
                                className="relative h-full w-full object-contain rounded-xl shadow-sm border border-white"
                            />
                        </div>
                        <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-l from-brand-navy to-slate-600 tracking-tight">
                            مسارات واصل
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-1">
                        {["الرئيسية", "المميزات", "الخدمات", "الأسعار"].map(
                            (item, i) => (
                                <a
                                    key={i}
                                    href={`#${["home", "features", "services", "pricing"][i]}`}
                                    className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-brand-navy hover:bg-slate-100/50 rounded-xl transition-all"
                                >
                                    {item}
                                </a>
                            ),
                        )}
                    </div>

                    <div className="hidden lg:flex items-center gap-4">
                        {auth.user ? (
                            <Link
                                href={
                                    auth.user.role === "admin"
                                        ? route("admin.dashboard")
                                        : route("school.dashboard")
                                }
                                className="px-6 py-2.5 bg-brand-navy text-white text-sm font-bold rounded-xl shadow-xl shadow-brand-navy/20 hover:shadow-brand-navy/30 hover:-translate-y-0.5 transition-all"
                            >
                                لوحة التحكم
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route("login")}
                                    className="text-sm font-bold text-slate-600 hover:text-brand-navy px-4 transition-colors"
                                >
                                    تسجيل الدخول
                                </Link>
                                <Link
                                    href={route("subscription")}
                                    className="px-6 py-2.5 bg-brand-yellow text-brand-dark text-sm font-bold rounded-xl shadow-xl shadow-brand-yellow/20 hover:shadow-brand-yellow/30 hover:-translate-y-0.5 transition-all"
                                >
                                    اشترك الآن
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden p-2 text-brand-navy"
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
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed inset-0 z-40 bg-white pt-24 px-8 flex flex-col gap-6"
                    >
                        {["الرئيسية", "المميزات", "الخدمات", "الأسعار"].map(
                            (item, i) => (
                                <a
                                    key={i}
                                    href={`#${["home", "features", "services", "pricing"][i]}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-2xl font-black text-brand-navy border-b border-slate-100 pb-4"
                                >
                                    {item}
                                </a>
                            ),
                        )}
                        <div className="mt-auto pb-12 flex flex-col gap-4">
                            <Link
                                href={route("login")}
                                className="w-full py-4 text-center font-bold text-slate-600 bg-slate-50 rounded-2xl"
                            >
                                تسجيل الدخول
                            </Link>
                            <Link
                                href={route("subscription")}
                                className="w-full py-4 text-center font-bold text-brand-dark bg-brand-yellow rounded-2xl shadow-lg"
                            >
                                اشترك الآن
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
                        className="text-right"
                    >
                        <motion.div
                            variants={itemVariants}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 text-brand-dark text-xs font-bold mb-6"
                        >
                            <Award size={14} className="text-brand-yellow" />
                            المنصة رقم 1 لإدارة النقل المدرسي في المنطقة
                        </motion.div>
                        <motion.h1
                            variants={itemVariants}
                            className="text-5xl lg:text-7xl font-black text-brand-navy leading-[1.15] mb-8"
                        >
                            ثورة ذكية في <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-yellow via-yellow-600 to-brand-navy">
                                إدارة النقل المدرسي
                            </span>
                        </motion.h1>
                        <motion.p
                            variants={itemVariants}
                            className="text-lg lg:text-xl text-slate-500 font-medium leading-relaxed mb-12 max-w-xl"
                        >
                            نقدم حلولاً رقمية ذكية لربط المدارس، أولياء الأمور،
                            والسائقين في منصة واحدة آمنة. وفر الوقت، قلل
                            التكاليف، واضمن سلامة طفلك في كل رحلة.
                        </motion.p>
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col sm:flex-row items-center gap-4"
                        >
                            <Link
                                href={route("subscription")}
                                className="w-full sm:w-auto px-10 py-5 bg-brand-navy text-white text-lg font-black rounded-2xl shadow-2xl shadow-brand-navy/30 hover:shadow-brand-navy/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                            >
                                ابدأ الآن مجاناً
                                <ChevronRight
                                    className="rotate-180"
                                    size={20}
                                />
                            </Link>
                            <a
                                href="#features"
                                className="w-full sm:w-auto px-10 py-5 bg-white text-brand-navy text-lg font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                اكتشف المميزات
                            </a>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="mt-12 flex items-center gap-4 py-6 border-t border-slate-200"
                        >
                            <div className="flex -space-x-4 space-x-reverse">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 shadow-sm"
                                    />
                                ))}
                            </div>
                            <div className="text-sm font-bold text-slate-400">
                                <span className="text-brand-navy">+500</span>{" "}
                                مدرسة ومنشأة تثق بنا
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Hero Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 100 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-yellow/20 to-transparent rounded-[3rem] blur-3xl rotate-12 -z-10" />
                        <div className="relative rounded-[3rem] bg-white p-4 shadow-3xl shadow-slate-200/50 border border-white">
                            <div 
                                className="rounded-[2.5rem] overflow-hidden aspect-[4/3] bg-slate-100 flex items-center justify-center cursor-pointer group/video relative"
                                onClick={togglePlay}
                            >
                                <video
                                    ref={videoRef}
                                    src="/assets/images/welcome_video.webm"
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
                                className="absolute -top-10 -right-10 bg-white p-4 rounded-3xl shadow-xl border border-slate-50 flex items-center gap-4"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center shadow-inner">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        {isScrolled ? "Status" : "System"}
                                    </div>
                                    <div className="text-sm font-black text-brand-navy">
                                        الرحلة آمنة 100%
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{
                                    duration: 5,
                                    repeat: Infinity,
                                    delay: 0.5,
                                }}
                                className="absolute -bottom-8 -left-8 bg-brand-navy p-5 rounded-3xl shadow-2xl flex items-center gap-4 text-white"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                    <MapPin
                                        size={24}
                                        className="text-brand-yellow"
                                    />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                        التتبع المباشر
                                    </div>
                                    <div className="text-sm font-black">
                                        الحافلة على بعد 2 دقيقة
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- Features Section --- */}
            <section id="features" className="py-32 bg-white relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-xs font-black text-brand-yellow uppercase tracking-[0.2em] mb-4">
                            مميزات المنصة
                        </h2>
                        <h3 className="text-4xl lg:text-5xl font-black text-brand-navy mb-6">
                            كل ما تحتاجه لإدارة النقل بكفاءة عالية
                        </h3>
                        <p className="text-lg text-slate-500 font-medium">
                            أدوات متطورة مصممة بعناية لتلبية احتياجات المدارس
                            الحديثة وضمان راحة البال للجميع.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap size={28} />}
                            title="تتبع GPS فوري"
                            desc="راقب موقع الحافلة والسرعة والمسار بدقة متناهية من أي متصفح أو عبر تطبيق الجوال."
                            color="blue"
                        />
                        <FeatureCard
                            icon={<Shield size={28} />}
                            title="أمان وخصوصية"
                            desc="تشفير كامل لبيانات الطلاب وأولياء الأمور مع نظام صلاحيات صارم لكل مستخدم في النظام."
                            color="emerald"
                        />
                        <FeatureCard
                            icon={<Smartphone size={28} />}
                            title="تطبيقات مخصصة"
                            desc="تطبيقات سهلة الاستخدام للسائقين وأولياء الأمور تضمن التواصل الفوري وقت الضرورة."
                            color="brand"
                        />
                        <FeatureCard
                            icon={<BarChart3 size={28} />}
                            title="تقارير دقيقة"
                            desc="احصل على إحصائيات مفصلة عن استهلاك الوقود، الحضور والغياب، وتنبيهات الصيانة."
                            color="orange"
                        />
                        <FeatureCard
                            icon={<Clock size={28} />}
                            title="تحسين المسارات"
                            desc="خوارزميات ذكية لتخطيط أقصر وأسرع المسارات لتقليل وقت الرحلة وتكاليف التشغيل."
                            color="purple"
                        />
                        <FeatureCard
                            icon={<Users size={28} />}
                            title="إدارة شاملة للمدارس"
                            desc="إشراف كامل على المعلمين، الطلاب، السائقين والحافلات من لوحة تحكم واحدة موحدة."
                            color="rose"
                        />
                    </div>
                </div>
            </section>

            {/* --- Stats / Social Proof --- */}
            <section className="py-24 bg-brand-navy text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full opacity-10 blur-3xl pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-yellow rounded-full" />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                    {[
                        { label: "رحلة آمنة يومياً", val: "50,000+" },
                        { label: "مدرسة مشتركة", val: "200+" },
                        { label: "طالب مسجل", val: "15,000+" },
                        { label: "نسبة رضا العملاء", val: "98%" },
                    ].map((stat, i) => (
                        <div key={i}>
                            <div className="text-4xl lg:text-6xl font-black text-brand-yellow mb-2">
                                {stat.val}
                            </div>
                            <div className="text-sm font-bold text-white/50 uppercase tracking-widest">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- CTA Section --- */}
            <section className="py-32 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="relative bg-gradient-to-r from-brand-navy to-slate-900 rounded-[3rem] p-12 lg:p-24 overflow-hidden shadow-3xl shadow-brand-navy/30">
                        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
                        <div className="relative z-10 max-w-2xl text-right">
                            <h2 className="text-4xl lg:text-6xl font-black text-white mb-8 leading-tight">
                                جاهز لـتطوير تجربة النقل في مدرستك؟
                            </h2>
                            <p className="text-xl text-white/60 font-medium mb-12">
                                انضم إلى مئات المدارس التي واكبت العصر الرقمي
                                وضمنت سلامة طلابها مع مسارات واصل.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <Link
                                    href={route("subscription")}
                                    className="w-full sm:w-auto px-12 py-5 bg-brand-yellow text-brand-dark text-xl font-black rounded-2xl shadow-xl shadow-brand-yellow/20 hover:shadow-brand-yellow/40 hover:-translate-y-1 transition-all"
                                >
                                    اشترك الآن
                                </Link>
                                <a
                                    href="https://wa.me/96879967769"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-lg font-bold text-white hover:text-brand-yellow transition-colors underline underline-offset-8"
                                >
                                    تحدث مع خبير مبيعات
                                </a>
                            </div>
                        </div>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-yellow/10 rounded-full blur-[80px]"
                        />
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="pt-24 pb-12 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20 text-right">
                        <div>
                            <Link
                                href="/"
                                className="flex items-center gap-3 mb-8"
                            >
                                <img
                                    src="/assets/images/masarat-wasel-logo.jpg"
                                    alt="Logo"
                                    className="h-10 w-10 object-contain rounded-xl"
                                />
                                <span className="text-xl font-black text-brand-navy">
                                    مسارات واصل
                                </span>
                            </Link>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                نحن نهتم برحلة طفلك كما تهتم أنت تماماً. حلول
                                ذكية للنقل المدرسي الذكي.
                            </p>
                            <div className="flex items-center gap-4">
                                {[Twitter, Facebook, Instagram, Linkedin].map(
                                    (Icon, i) => (
                                        <a
                                            key={i}
                                            href="#"
                                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-brand-navy hover:text-white transition-all shadow-sm"
                                        >
                                            <Icon size={18} />
                                        </a>
                                    ),
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-black text-brand-navy mb-8">
                                الروابط السريعة
                            </h4>
                            <ul className="space-y-4">
                                {["عن المنصة", "المميزات", "قصص النجاح"].map(
                                    (item, i) => (
                                        <li key={i}>
                                            <a
                                                href="#"
                                                className="text-slate-500 font-bold hover:text-brand-yellow transition-colors"
                                            >
                                                {item}
                                            </a>
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-lg font-black text-brand-navy mb-8">
                                الدعم والمساعدة
                            </h4>
                            <ul className="space-y-4">
                                <li>
                                    <a href="https://wa.me/96879967769" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-500 font-bold hover:text-brand-yellow transition-colors dir-ltr" dir="ltr">
                                        <MessageCircle className="w-5 h-5 text-[#f5b800]" />
                                        <span>+968 7996 7769</span>
                                    </a>
                                </li>
                                <li>
                                    <a href="mailto:msaratwasel@gmail.com" className="flex items-center gap-2 text-slate-500 font-bold hover:text-brand-yellow transition-colors break-all">
                                        <Mail className="w-5 h-5 text-[#f5b800] flex-shrink-0" />
                                        <span>msaratwasel@gmail.com</span>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-slate-500 font-bold hover:text-brand-yellow transition-colors"
                                    >
                                        الأسئلة الشائعة
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-slate-500 font-bold hover:text-brand-yellow transition-colors"
                                    >
                                        دليل الاستخدام
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        className="text-slate-500 font-bold hover:text-brand-yellow transition-colors"
                                    >
                                        سياسة الخصوصية
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-lg font-black text-brand-navy mb-8">
                                اشترك في النشرة
                            </h4>
                            <p className="text-sm text-slate-400 font-bold mb-6 italic">
                                احصل على آخر التحديثات مباشرة في بريدك
                            </p>
                            <form className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="بريدك الإلكتروني"
                                    className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-navy"
                                />
                                <button className="bg-brand-navy text-white px-5 py-3 rounded-xl font-black text-sm shadow-lg shadow-brand-navy/20">
                                    انضم
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-slate-400 font-bold text-sm">
                            © 2024 مسارات واصل. جميع الحقوق محفوظة.
                        </div>
                        <div className="flex items-center gap-8">
                            <a
                                href="#"
                                className="text-xs font-black text-slate-300 hover:text-brand-navy"
                            >
                                شروط الخدمة
                            </a>
                            <a
                                href="#"
                                className="text-xs font-black text-slate-300 hover:text-brand-navy"
                            >
                                ملفات الارتباط
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ─── Sub-Components ───────────────────────────────────────

function FeatureCard({ icon, title, desc, color }: any) {
    const colorMap: any = {
        blue: "text-blue-500 bg-blue-50",
        emerald: "text-emerald-500 bg-emerald-50",
        brand: "text-brand-navy bg-slate-50",
        orange: "text-orange-500 bg-orange-50",
        purple: "text-purple-500 bg-purple-50",
        rose: "text-rose-500 bg-rose-50",
    };

    return (
        <motion.div
            whileHover={{ y: -8 }}
            className="group p-10 bg-white border border-slate-100 rounded-[2.5rem] transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-brand-yellow/20"
        >
            <div
                className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300 ${colorMap[color] || colorMap.brand}`}
            >
                {icon}
            </div>
            <h4 className="text-2xl font-black text-brand-navy mb-4">
                {title}
            </h4>
            <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
        </motion.div>
    );
}
