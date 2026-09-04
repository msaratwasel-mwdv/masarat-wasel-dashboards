import { Head, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { useState, useEffect } from "react";
import { Globe, Moon, Sun, ArrowRight, ArrowLeft, ChevronDown, Trash2 } from "lucide-react";

export default function PrivacyPolicy() {
  const { isRTL, theme, toggleTheme, language, toggleLanguage } = useTheme();
  const isDark = theme === "dark";
  const isAr = language === "ar";
  const [activeId, setActiveId] = useState<string>("section-1");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Runtime safeguard to ensure html and body do not clip position:sticky
  useEffect(() => {
    document.documentElement.style.overflowX = "clip";
    document.body.style.overflowX = "clip";
    return () => {
      document.documentElement.style.overflowX = "";
      document.body.style.overflowX = "";
    };
  }, []);

  const navItems = [
    { id: "section-1", titleAr: "الجهة المسؤولة عن معالجة البيانات", titleEn: "Data Controller & DPO" },
    { id: "section-2", titleAr: "إفصاح الموقع الجغرافي في الخلفية", titleEn: "Background Location Disclosure" },
    { id: "section-3", titleAr: "نطاق هذه السياسة", titleEn: "Scope of this Policy" },
    { id: "section-4", titleAr: "أنواع البيانات التي نعالجها", titleEn: "Categories of Data" },
    { id: "section-5", titleAr: "لماذا نعالج البيانات الشخصية؟", titleEn: "Purposes of Processing" },
    { id: "section-6", titleAr: "بيانات الأطفال والطلاب", titleEn: "Children & Student Data" },
    { id: "section-7", titleAr: "الوصول إلى الموقع في الخلفية", titleEn: "Background Location Access" },
    { id: "section-8", titleAr: "مشاركة البيانات", titleEn: "Data Sharing & Disclosure" },
    { id: "section-9", titleAr: "خدمات الطرف الثالث", titleEn: "Third-Party Services" },
    { id: "section-10", titleAr: "نقل البيانات خارج سلطنة عمان", titleEn: "Cross-Border Transfers" },
    { id: "section-11", titleAr: "الاحتفاظ بالبيانات", titleEn: "Data Retention Schedule" },
    { id: "section-12", titleAr: "طلب حذف الحساب والبيانات", titleEn: "Account & Data Deletion" },
    { id: "section-13", titleAr: "حقوق أصحاب البيانات", titleEn: "Data Subject Rights" },
    { id: "section-14", titleAr: "أمن البيانات", titleEn: "Data Security Measures" },
    { id: "section-15", titleAr: "الإخلالات الأمنية والتسرب", titleEn: "Security Incidents" },
    { id: "section-16", titleAr: "إدارة أذونات الموقع", titleEn: "Location Permissions" },
    { id: "section-17", titleAr: "عدم استخدام الموقع للإعلانات", titleEn: "No Advertising Usage" },
    { id: "section-18", titleAr: "التحديثات على سياسة الخصوصية", titleEn: "Policy Updates" },
    { id: "section-19", titleAr: "الشكاوى والاستفسارات", titleEn: "Complaints & Inquiries" },
    { id: "section-20", titleAr: "الاختصاص القضائي", titleEn: "Governing Law" },
    { id: "section-21", titleAr: "التواصل معنا", titleEn: "Contact Information" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-15% 0px -65% 0px", threshold: 0 }
    );
    navItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      const y = target.getBoundingClientRect().top + window.pageYOffset - 85;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
      setMobileMenuOpen(false);
      window.history.pushState(null, "", `#${id}`);
    }
  };

  const prose = isDark ? "text-slate-300" : "text-slate-700";
  const proseMuted = isDark ? "text-slate-400" : "text-slate-500";
  const hClass = isDark ? "text-white" : "text-slate-900";
  const borderClass = isDark ? "border-slate-800" : "border-slate-200";

  const Dot = () => (
    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500/80 dark:bg-amber-400/80 flex-none" style={{ marginTop: "0.58rem" }} />
  );

  const SH2 = ({ a, e }: { a: string; e: string }) => (
    <h2 className={`text-xl sm:text-2xl font-bold tracking-tight pb-3.5 border-b ${hClass} ${borderClass}`}>
      {isAr ? a : e}
    </h2>
  );

  return (
    <div
      className={`min-h-screen font-sans ${isDark ? "bg-[#0a0d14] text-slate-300" : "bg-white text-slate-700"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Head>
        <title>{isAr ? "سياسة الخصوصية وحماية البيانات الشخصية | مسارات واصل" : "Privacy & Personal Data Protection Policy | Masarat Wasel"}</title>
        <meta name="description" content={isAr ? "الوثيقة الرسمية لسياسة الخصوصية وحماية البيانات الشخصية لمنصة مسارات واصل وفقاً للمرسوم السلطاني رقم 6/2022." : "Official Privacy and Data Protection Policy for Masarat Wasel in accordance with Omani Royal Decree 6/2022."} />
      </Head>

      {/* ── NAVBAR ── */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-md ${isDark ? "bg-[#0a0d14]/90 border-slate-800/60" : "bg-white/90 border-slate-200/80"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/assets/images/masarat-wasel-logo.jpg" alt="Masarat Wasel" className="w-7 h-7 object-contain rounded-md border border-slate-200 dark:border-slate-700" />
            <span className={`text-sm font-semibold ${hClass}`}>{isAr ? "مسارات واصل" : "Masarat Wasel"}</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage} className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${isDark ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"}`}>
              <Globe size={12} className="text-amber-500" />
              <span>{isAr ? "English" : "عربي"}</span>
            </button>
            <button onClick={toggleTheme} className={`p-2 rounded-md border transition-colors ${isDark ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500"}`} aria-label="Toggle theme">
              {isDark ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <Link href="/" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
              {isRTL ? <ArrowRight size={12} /> : <ArrowLeft size={12} />}
              <span className="hidden sm:inline">{isAr ? "الرئيسية" : "Home"}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── MOBILE TOC ── */}
      <div className={`xl:hidden sticky top-14 z-30 border-b px-4 py-3 ${isDark ? "bg-[#0a0d14]/95 border-slate-800" : "bg-white/95 border-slate-200"}`}>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-full flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2 truncate">
            <span className={`font-mono text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{isAr ? "الانتقال إلى:" : "Jump to:"}</span>
            <span className={`font-semibold truncate ${hClass}`}>
              {isAr ? navItems.find((i) => i.id === activeId)?.titleAr || "فهرس المحتويات" : navItems.find((i) => i.id === activeId)?.titleEn || "Table of Contents"}
            </span>
          </div>
          <ChevronDown size={16} className={`transition-transform duration-200 flex-shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"} ${mobileMenuOpen ? "rotate-180" : ""}`} />
        </button>
        {mobileMenuOpen && (
          <div className={`mt-2 pt-2 border-t max-h-72 overflow-y-auto space-y-1 text-sm hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${borderClass}`}>
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} onClick={(e) => scrollToSection(e, item.id)}
                className={`block px-2.5 py-1.5 rounded text-start transition-colors ${activeId === item.id ? isDark ? "text-white font-medium" : "text-slate-900 font-medium" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"}`}>
                {isAr ? item.titleAr : item.titleEn}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ── BODY (Two-column layout with truly sticky sidebar) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="xl:grid xl:grid-cols-[1fr_280px] xl:gap-14">

          {/* PROSE */}
          <main className="min-w-0 space-y-12 text-base sm:text-[17px] leading-relaxed">

            {/* Page header */}
            <div className={`pb-8 border-b ${borderClass}`}>
              <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight mb-4 ${hClass}`}>
                {isAr ? "سياسة الخصوصية وحماية البيانات الشخصية" : "Privacy Policy"}
              </h1>
              <p className={`text-base sm:text-lg mb-4 max-w-2xl leading-relaxed ${proseMuted}`}>
                {isAr ? "نوضح هنا كيف نحمي بياناتك وكيف نستخدمها لتشغيل خدمات النقل المدرسي الذكي." : "How we protect your data and process it to operate smart school transport services."}
              </p>
              <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                <span>{isAr ? "آخر تحديث: 4 سبتمبر 2026" : "Last updated: September 4, 2026"}</span>
                <span>·</span>
                <span>{isAr ? "منصة وتطبيقات مسارات واصل" : "Masarat Wasel Platform & Applications"}</span>
                <span>·</span>
                <span>{isAr ? "متوافق مع سياسات Google Play" : "Google Play Policy Compliant"}</span>
              </div>
            </div>

            {/* Preamble */}
            <div className={`space-y-4 text-base sm:text-[17px] leading-relaxed ${prose}`}>
              <p>
                {isAr
                  ? (<>توضح سياسة الخصوصية هذه كيفية قيام <strong className={hClass}>منصة مسارات واصل</strong>، ويشار إليها في هذه السياسة باسم <strong className={hClass}>&quot;مسارات واصل&quot; أو &quot;نحن&quot;</strong>، بجمع ومعالجة واستخدام وحماية البيانات الشخصية عند استخدام منصة مسارات واصل وموقعها الإلكتروني ولوحات التحكم وتطبيقاتها، بما في ذلك <strong className={hClass}>تطبيق خدمات مسارات واصل (Msarat Wasel Services)</strong> وتطبيق أولياء الأمور.</>)
                  : (<>This Privacy Policy explains how <strong className={hClass}>Masarat Wasel</strong> collects, processes, uses, and safeguards personal data when accessing or using the Masarat Wasel platform, website, control dashboards, and mobile applications, including the <strong className={hClass}>Msarat Wasel Services</strong> driver application and the Guardian application.</>)}
              </p>
              <p>
                {isAr
                  ? (<>نلتزم في معالجة البيانات الشخصية بأحكام <strong className={hClass}>قانون حماية البيانات الشخصية في سلطنة عمان الصادر بالمرسوم السلطاني رقم 6/2022</strong> ولائحته التنفيذية الصادرة بالقرار الوزاري رقم 34/2024، بالإضافة إلى المتطلبات والسياسات المعمول بها في Google Play عند انطباقها.</>)
                  : (<>We process personal data in strict compliance with the provisions of the <strong className={hClass}>Personal Data Protection Law of the Sultanate of Oman issued by Royal Decree No. 6/2022</strong> and its Executive Regulations issued by Ministerial Decision No. 34/2024, alongside all applicable Google Play User Data Policies.</>)}
              </p>
              <div className={`p-4 rounded-lg border text-sm sm:text-[15px] leading-relaxed ${isDark ? "bg-slate-900/50 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                <strong className={isDark ? "text-amber-400" : "text-amber-600"}>{isAr ? "ملاحظة هامة: " : "Important Notice: "}</strong>
                {isAr ? "إذا كان هناك تعارض بين هذه السياسة وأي متطلب قانوني إلزامي، يسري المتطلب القانوني بالقدر الذي يقتضيه القانون." : "If there is any conflict between this policy and any mandatory statutory requirement, the statutory requirement shall prevail to the extent required by law."}
              </div>
            </div>

            {/* ─── Section 1 ─── */}
            <section id="section-1" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="الجهة المسؤولة عن معالجة البيانات" e="Data Controller and Protection Officer" />
              <p className={`text-base sm:text-[17px] ${prose}`}>{isAr ? "المتحكم/المسؤول عن معالجة البيانات الشخصية:" : "Data Controller Details:"}</p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-base">
                <div><dt className={`text-xs font-mono uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{isAr ? "الاسم التجاري" : "Trade Name"}</dt><dd className={`font-semibold text-base sm:text-[17px] mt-1 ${hClass}`}>مسارات واصل – Masarat Wasel</dd></div>
                <div><dt className={`text-xs font-mono uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{isAr ? "الدولة والاختصاص" : "Jurisdiction"}</dt><dd className={`font-semibold text-base sm:text-[17px] mt-1 ${hClass}`}>{isAr ? "سلطنة عمان" : "Sultanate of Oman"}</dd></div>
                <div><dt className={`text-xs font-mono uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{isAr ? "البريد الإلكتروني" : "Email"}</dt><dd className="mt-1"><a href="mailto:msaratwasel@gmail.com" className="text-amber-600 dark:text-amber-400 hover:underline font-medium text-base">msaratwasel@gmail.com</a></dd></div>
                <div><dt className={`text-xs font-mono uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>{isAr ? "الهاتف / واتساب" : "Phone / WhatsApp"}</dt><dd dir="ltr" className={`text-start font-mono font-medium text-base mt-1 ${isDark ? "text-slate-200" : "text-slate-800"}`}>+968 7996 7769</dd></div>
              </dl>
              <h3 className={`text-base sm:text-lg font-semibold pt-2 ${hClass}`}>{isAr ? "مسؤول حماية البيانات الشخصية (DPO)" : "Data Protection Officer (DPO)"}</h3>
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{isAr ? "يكون مسؤول حماية البيانات نقطة الاتصال المتعلقة بالاستفسارات وطلبات أصحاب البيانات والمسائل المرتبطة بحماية البيانات الشخصية عبر البريد الإلكتروني: msaratwasel@gmail.com أو عبر الهاتف: +968 7996 7769." : "The Data Protection Officer serves as the direct point of contact for inquiries, data subject rights requests, and all matters pertaining to personal data protection via email: msaratwasel@gmail.com or phone: +968 7996 7769."}</p>
            </section>

            {/* ─── Section 2 ─── */}
            <section id="section-2" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="إفصاح مهم بشأن استخدام الموقع الجغرافي في الخلفية" e="Prominent Disclosure: Background Location Usage" />
              <div className={`rounded-xl border p-6 sm:p-7 space-y-5 ${isDark ? "border-amber-500/20 bg-amber-500/5" : "border-amber-400/30 bg-amber-50/60"}`}>
                <p className={`text-base sm:text-[17px] font-medium leading-relaxed ${hClass}`}>
                  {isAr
                    ? (<>يستخدم تطبيق <strong>خدمات مسارات واصل (Msarat Wasel Services)</strong> بيانات الموقع الجغرافي الدقيق والتقريبي لحافلة المدرسة،{" "}<span className="underline decoration-amber-500 decoration-2 font-bold">بما في ذلك عندما يكون التطبيق في الخلفية أو مغلقاً أو عندما تكون شاشة الهاتف مقفلة</span>، وذلك أثناء الرحلات المدرسية النشطة فقط.</>)
                    : (<>The <strong>Msarat Wasel Services</strong> application accesses, collects, and transmits precise and approximate school bus location data,{" "}<span className="underline decoration-amber-500 decoration-2 font-bold">including when the app is running in the background, closed, or when the screen is locked</span>, exclusively during active school transit trips.</>)}
                </p>
                <p className={`text-base font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{isAr ? "يستخدم الموقع الجغرافي للأغراض التالية:" : "Location data is processed strictly for the following purposes:"}</p>
                <ul className={`space-y-2 text-base sm:text-[16.5px] leading-relaxed ${prose}`}>
                  {(isAr
                    ? ["تتبع موقع الحافلة بشكل مباشر من قبل المدرسة والمشرفين المخولين.", "تمكين ولي الأمر من معرفة موقع الحافلة المرتبطة برحلة ابنه أو ابنته.", "حساب الوقت المتوقع لوصول الحافلة (ETA) بدقة.", "إرسال إشعارات الاقتراب عند اقتراب الحافلة من منزل الطالب (ضمن مسافة 2 كم).", "التحقق من التزام الحافلة بالمسار المعتمد وصعود ونزول الطلاب بأمان.", "دعم إجراءات السلامة وإدارة الرحلة المدرسية وحالات الطوارئ."]
                    : ["Live real-time bus tracking by authorized school administrators and supervisors.", "Enabling guardians to view real-time transit location for their child.", "Accurate real-time dynamic arrival time calculations (ETA).", "Dispatching automated proximity alerts when the bus approaches the residence (within 2 km).", "Verifying transit route compliance and confirming designated pickup and drop-off stations.", "Supporting student safety oversight and emergency response management."]
                  ).map((item: string, i: number) => <li key={i} className="flex items-start gap-2.5"><Dot />{item}</li>)}
                </ul>
                <p className={`text-base font-semibold pt-3 border-t ${isDark ? "text-slate-200 border-amber-500/20" : "text-slate-800 border-amber-400/25"}`}>
                  {isAr ? "لا نستخدم بيانات الموقع الجغرافي للإعلانات، ولا نبيعها، ولا نشاركها مع جهات تسويقية لأغراض إعلانية." : "We never use location data for advertising, nor do we sell or share it with marketing entities for commercial advertising."}
                </p>
                <p className={`text-sm font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>{isAr ? "يبدأ تتبع موقع الحافلة عند بدء الرحلة المدرسية ويتوقف عند انتهاء الرحلة." : "Telemetry begins when an active school trip is started and ceases completely once the trip is concluded."}</p>
              </div>
            </section>

            {/* ─── Section 3 ─── */}
            <section id="section-3" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="نطاق هذه السياسة" e="Scope of this Policy" />
              <p className={`text-base sm:text-[17px] ${prose}`}>{isAr ? "تنطبق هذه السياسة على البيانات التي تتم معالجتها من خلال:" : "This Policy governs data processed through:"}</p>
              <ul className={`space-y-2 text-base sm:text-[17px] leading-relaxed ${prose}`}>
                {(isAr
                  ? ["موقع مسارات واصل الإلكتروني.", "لوحات التحكم الخاصة بالمدارس والمشرفين.", "تطبيق خدمات مسارات واصل (Msarat Wasel Services).", "تطبيق أولياء الأمور.", "خدمات إدارة الرحلات والحافلات.", "خدمات الإشعارات والتنبيهات المباشرة.", "خدمات الخرائط والملاحة المرتبطة بالمنصة.", "أي خدمات أو واجهات أخرى تابعة لمسارات واصل وتشير صراحةً إلى هذه السياسة."]
                  : ["The official Masarat Wasel website.", "School administration and supervisor management dashboards.", "The Msarat Wasel Services mobile application.", "The Guardian mobile application.", "Fleet and daily trip management systems.", "Push notification and operational alert services.", "Platform-integrated mapping and navigation telemetry.", "Any other platform interfaces explicitly referencing this policy."]
                ).map((item: string, i: number) => <li key={i} className="flex items-start gap-2.5"><Dot />{item}</li>)}
              </ul>
            </section>

            {/* ─── Section 4 ─── */}
            <section id="section-4" className="scroll-mt-24 space-y-5 pt-2">
              <SH2 a="أنواع البيانات التي قد نقوم بمعالجتها" e="Categories of Data We Process" />
              <p className={`text-base sm:text-[17px] ${prose}`}>{isAr ? "نقوم بجمع ومعالجة البيانات اللازمة لتقديم خدمات النقل المدرسي وإدارة الرحلات والسلامة، وتشمل:" : "We collect and process the data necessary to provide school transport services and safety management:"}</p>
              <div className="space-y-6">
                {[
                  { label: isAr ? "بيانات الحساب والهوية" : "Account & Identity", items: isAr ? ["الاسم الكامل.", "رقم الهاتف.", "البريد الإلكتروني.", "الدور الوظيفي أو نوع الحساب.", "المدرسة المرتبط بها الحساب.", "بيانات تسجيل الدخول والمصادقة."] : ["Full name.", "Phone number.", "Email address.", "Role or account type.", "Associated school institution.", "Authentication credentials and tokens."] },
                  { label: isAr ? "بيانات الموقع الجغرافي" : "Location Data", items: isAr ? ["خط العرض وخط الطول (GPS).", "السرعة والاتجاه عند الحاجة لتشغيل خدمة التتبع.", "موقع الحافلة أثناء الرحلة.", "نقاط التوقف ومحطات الصعود والنزول.", "إحداثيات نقاط النقل المرتبطة بالطالب."] : ["Latitude and longitude coordinates (GPS).", "Speed and bearing during active tracking.", "Bus coordinates throughout the trip route.", "Designated pickup and drop-off stations.", "Student home pickup coordinates required for proximity alerts."], footnote: isAr ? "يتم استخدام هذه البيانات لأغراض تشغيل النقل المدرسي والسلامة وليس للإعلانات." : "Processed exclusively for school transport operations and transit safety, never for advertising." },
                  { label: isAr ? "بيانات الطلاب والنقل المدرسي" : "Student & Transport Records", items: isAr ? ["اسم الطالب، المرحلة أو الصف الدراسي، والمدرسة.", "الحافلة والمسار المخصصان.", "بيانات محطة الصعود والنزول.", "سجلات الصعود والنزول وبيانات مسح رمز QR.", "حالات الغياب والاعتذار.", "سجلات الرحلات المرتبطة بالطالب."] : ["Student name, grade level, and school.", "Assigned school bus and route.", "Pickup and drop-off station records.", "Boarding and alighting logs, including QR code scans.", "Absence logs and excused requests.", "Historical transit records associated with the student."], footnote: isAr ? "يتم الحصول على بيانات الطلاب من الجهات المخولة، مثل المدرسة أو ولي الأمر." : "Student records are provided by authorized entities pursuant to official operational arrangements." },
                  { label: isAr ? "بيانات الإشعارات والأجهزة" : "Device & Notification Identifiers", items: isAr ? ["رمز جهاز الإشعارات (FCM Token).", "نوع الجهاز ونظام التشغيل عند الحاجة للدعم الفني والأمني.", "معلومات تقنية ضرورية لتشغيل الإشعارات والخدمات."] : ["Firebase Cloud Messaging (FCM) device token.", "Device model and operating system for diagnostics.", "Technical parameters required for real-time alert delivery."] },
                  { label: isAr ? "بيانات السجلات والأمان" : "Logs & Security Telemetry", paragraph: isAr ? "نسجل معلومات تقنية ضرورية لحماية الحسابات، اكتشاف الاستخدام غير المصرح به، التحقيق في الحوادث الأمنية، معالجة الأعطال، وتحسين موثوقية الخدمة." : "We record system audit trails essential for account security, anomaly detection, incident response, troubleshooting, and service reliability." },
                ].map((cat) => (
                  <div key={cat.label} className={`p-5 rounded-xl border ${borderClass} ${isDark ? "bg-slate-900/40" : "bg-slate-50/70"}`}>
                    <h3 className={`text-base sm:text-lg font-bold mb-2.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{cat.label}</h3>
                    {(cat as any).paragraph && <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{(cat as any).paragraph}</p>}
                    {cat.items && <ul className={`space-y-1.5 text-base sm:text-[16.5px] leading-relaxed ${prose}`}>{cat.items.map((item: string, i: number) => <li key={i} className="flex items-start gap-2.5"><Dot />{item}</li>)}</ul>}
                    {(cat as any).footnote && <p className={`text-sm font-medium mt-3 pt-2.5 border-t ${borderClass} ${isDark ? "text-amber-400/80" : "text-amber-600/90"}`}>{(cat as any).footnote}</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* ─── Section 5 ─── */}
            <section id="section-5" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="لماذا نعالج البيانات الشخصية؟" e="Why We Process Personal Data" />
              <p className={`text-base sm:text-[17px] ${prose}`}>{isAr ? "نستخدم البيانات الشخصية بالقدر اللازم لتحقيق الأغراض التالية:" : "We process personal data strictly to the extent required for the following purposes:"}</p>
              <ul className={`space-y-2 text-base sm:text-[17px] leading-relaxed ${prose}`}>
                {(isAr ? ["إنشاء وإدارة حسابات المستخدمين.", "تشغيل خدمات النقل المدرسي وإدارة الحافلات والمسارات والرحلات.", "تتبع الحافلات أثناء الرحلات النشطة لضمان السلامة.", "تمكين أولياء الأمور من متابعة الرحلة المرتبطة بأبنائهم.", "إرسال إشعارات الاقتراب والتنبيهات المباشرة.", "تسجيل وتوثيق عمليات الصعود والنزول.", "دعم سلامة الطلاب وإدارة الحالات التشغيلية والطارئة.", "إعداد التقارير التشغيلية وتقارير السلامة والانضباط.", "منع الاستخدام غير المصرح به وحماية المنصة.", "الوفاء بالالتزامات القانونية أو التعاقدية في سلطنة عمان."]
                  : ["Creating and managing user accounts.", "Operating school transport, fleet dispatch, and daily routing.", "Real-time bus tracking during active trips for student safety.", "Enabling guardians to follow the active bus transit of their child.", "Delivering automated proximity alerts and operational notifications.", "Logging student boarding and alighting verification.", "Supporting transit safety oversight and incident mitigation.", "Generating operational efficiency, punctuality, and safety audits.", "Preventing unauthorized access and safeguarding infrastructure.", "Complying with statutory and contractual obligations in Oman."]
                ).map((item: string, i: number) => <li key={i} className="flex items-start gap-2.5"><Dot />{item}</li>)}
              </ul>
            </section>

            {/* ─── Section 6 ─── */}
            <section id="section-6" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="بيانات الأطفال والطلاب" e="Children & Student Data" />
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{isAr ? "تتعامل مسارات واصل مع بيانات مرتبطة بطلاب قد يكونون من الأطفال. نلتزم بتطبيق الضوابط القانونية الخاصة بمعالجة بيانات الأطفال في سلطنة عمان، ولا نعتمد على الطالب نفسه لتقديم الموافقة القانونية عندما تكون موافقة ولي الأمر مطلوبة." : "Masarat Wasel handles data pertaining to students who may be minors. We enforce strict Omani statutory controls governing children's data, never relying on a minor to provide consent when guardian consent is legally required."}</p>
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{isAr ? "تُستخدم بيانات الطالب فقط بالقدر اللازم لتقديم خدمات النقل المدرسي وإدارة الرحلات والسلامة والتقارير المرتبطة بالخدمة." : "Student records are utilized strictly to provide transit logistics, route safety, and official reporting. System access to student records is tightly restricted by role-based permissions."}</p>
            </section>

            {/* ─── Section 7 ─── */}
            <section id="section-7" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="الوصول إلى بيانات الموقع في الخلفية" e="Background Location Access Mechanics" />
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{isAr ? "قد يستمر تطبيق خدمات مسارات واصل في إرسال موقع الحافلة عندما يكون التطبيق في الخلفية أو شاشة الهاتف مقفلة. يحدث ذلك لأن تشغيل خدمة التتبع يتطلب استمرار إرسال موقع الحافلة أثناء الرحلة حتى يتمكن النظام من:" : "The Msarat Wasel Services application continues transmitting bus coordinates while minimized or with the screen locked because reliable transit monitoring requires continuous telemetry to:"}</p>
              <ul className={`space-y-2 text-base sm:text-[17px] leading-relaxed ${prose}`}>
                {(isAr ? ["تحديث موقع الحافلة على الخريطة لحظياً.", "حساب الوقت المتوقع للوصول (ETA).", "إرسال إشعارات الاقتراب لأولياء الأمور.", "دعم مراقبة الرحلة وسلامة الطلاب."] : ["Update real-time bus coordinates across the mapping system.", "Calculate accurate estimated arrival times (ETA).", "Dispatch automated proximity alerts to waiting families.", "Maintain supervisory oversight over route progress and safety."]).map((item: string, i: number) => <li key={i} className="flex items-start gap-2.5"><Dot />{item}</li>)}
              </ul>
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{isAr ? "يتم تشغيل التتبع وفق آلية الرحلات المدرسية. وعند توقف الرحلة أو انتهاء الحاجة التشغيلية، يتم إيقاف جمع الموقع تلقائياً." : "Telemetry is activated strictly during official school transit journeys. When the trip ends, background tracking halts immediately."}</p>
            </section>

            {/* ─── Section 8 ─── */}
            <section id="section-8" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="مشاركة البيانات" e="Data Sharing & Disclosure" />
              <p className={`text-base sm:text-lg font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{isAr ? "لا نبيع البيانات الشخصية ولا نؤجرها ولا نتاجر بها." : "We do not sell, rent, lease, or trade personal data."}</p>
              <p className={`text-base sm:text-[17px] ${prose}`}>{isAr ? "قد تتم مشاركة أو إتاحة البيانات بالقدر الضروري لتشغيل الخدمة مع الفئات التالية:" : "Data access is restricted exclusively to authorized operational parties:"}</p>
              <div className="space-y-3.5 text-base sm:text-[17px] leading-relaxed">
                {[
                  { title: isAr ? "أولياء الأمور المخولون:" : "Authorized Guardians:", body: isAr ? "قد يتمكن ولي الأمر من رؤية موقع الحافلة المرتبطة بالرحلة التي تخص الطالب المرتبط بحسابه." : "Guardians may view real-time bus telemetry only for trips carrying their enrolled child." },
                  { title: isAr ? "المدرسة والمشرفون المخولون:" : "Schools & Designated Supervisors:", body: isAr ? "قد يتمكن المسؤولون والمشرفون المخولون من الوصول إلى بيانات الحافلات والرحلات والطلاب اللازمة لأداء مهامهم." : "Authorized staff access fleet, transit, and attendance records essential for duty execution." },
                  { title: isAr ? "مزودو الخدمات التقنية:" : "Technical Service Providers:", body: isAr ? "خدمات الاستضافة والبنية التحتية، قواعد البيانات، الخرائط والملاحة، خدمات الإشعارات، والأمان التقني، وفق ترتيبات تعاقدية ملزمة." : "Encrypted cloud infrastructure, mapping APIs, and notification gateways bound by statutory data security contracts." },
                ].map((row, i: number) => <div key={i}><strong className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-900"}`}>{row.title}</strong>{" "}<span className={prose}>{row.body}</span></div>)}
              </div>
            </section>

            {/* ─── Section 9 ─── */}
            <section id="section-9" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="خدمات الطرف الثالث" e="Third-Party Technical Services" />
              <ul className={`space-y-2.5 text-base sm:text-[17px] leading-relaxed ${prose}`}>
                <li className="flex items-start gap-2.5"><Dot /><span><strong className={isDark ? "text-slate-200" : "text-slate-800"}>Google Maps Platform:</strong>{" "}{isAr ? "لخدمات الخرائط والمسارات وحساب أوقات الوصول." : "For map rendering, routing, and ETA computation."}</span></li>
                <li className="flex items-start gap-2.5"><Dot /><span><strong className={isDark ? "text-slate-200" : "text-slate-800"}>Firebase Cloud Messaging:</strong>{" "}{isAr ? "لإرسال الإشعارات والتنبيهات المباشرة." : "For real-time push notification delivery."}</span></li>
              </ul>
              <p className={`text-sm font-medium mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{isAr ? "لا نسمح لمزودي الخدمات باستخدام بيانات المستخدمين لأغراض إعلانية نيابةً عن مسارات واصل." : "Service providers are strictly forbidden from utilizing user data for independent advertising or commercial profiling."}</p>
            </section>

            {/* ─── Section 10 ─── */}
            <section id="section-10" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="نقل البيانات خارج سلطنة عمان" e="Cross-Border Data Transfers" />
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{isAr ? "قد يتم تخزين أو معالجة بعض البيانات من خلال مزودي خدمات تقنية يعملون داخل سلطنة عمان أو خارجها. عند نقل البيانات الشخصية أو إتاحتها للمعالجة خارج سلطنة عمان، نلتزم بالضوابط والمتطلبات المنصوص عليها في قانون حماية البيانات الشخصية ولائحته التنفيذية." : "Certain processing may take place through technical service providers located within or outside the Sultanate of Oman. When transferring personal data internationally, we strictly comply with the requirements of Royal Decree No. 6/2022, ensuring adequate contractual safeguards and an equivalent level of data protection."}</p>
            </section>

            {/* ─── Section 11 ─── */}
            <section id="section-11" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="الاحتفاظ بالبيانات" e="Data Retention Schedule" />
              <p className={`text-base sm:text-[17px] ${prose}`}>{isAr ? "نحتفظ بالبيانات الشخصية فقط للمدة اللازمة لتحقيق الأغراض التي جُمعت من أجلها، أو للمدة التي يقتضيها القانون." : "We retain personal data only for as long as necessary to achieve the purposes for which it was gathered, or as mandated by law."}</p>
              <div className={`overflow-x-auto border rounded-xl ${borderClass}`}>
                <table className="w-full text-sm sm:text-base">
                  <thead className={`border-b ${isDark ? "bg-slate-900/70 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                    <tr>
                      <th className="py-3 px-4 text-start font-semibold">{isAr ? "نوع البيانات" : "Data Category"}</th>
                      <th className="py-3 px-4 text-start font-semibold">{isAr ? "الغرض الرئيسي" : "Primary Purpose"}</th>
                      <th className="py-3 px-4 text-start font-semibold">{isAr ? "مدة الاحتفاظ" : "Retention"}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? "divide-slate-800" : "divide-slate-200"}`}>
                    {[
                      { cat: isAr ? "بيانات الحساب" : "Account Data", purp: isAr ? "تشغيل الحساب والخدمة" : "Account operation", ret: isAr ? "حتى طلب الحذف" : "Until deletion" },
                      { cat: isAr ? "بيانات الرحلات" : "Trip Records", purp: isAr ? "التشغيل والسلامة" : "Operations & safety", ret: isAr ? "عام دراسي واحد" : "1 academic year" },
                      { cat: isAr ? "بيانات الموقع الجغرافي" : "Location Data", purp: isAr ? "تتبع الرحلات المباشر" : "Live trip tracking", ret: isAr ? "أثناء الرحلة النشطة" : "Active trip only" },
                      { cat: isAr ? "سجلات الطلاب" : "Student Logs", purp: isAr ? "إدارة النقل" : "Transport management", ret: isAr ? "وفق الأرشيف المدرسي" : "Per school archive rules" },
                      { cat: isAr ? "رموز الإشعارات" : "Notification Tokens", purp: isAr ? "إرسال التنبيهات" : "Push notifications", ret: isAr ? "حتى تسجيل الخروج" : "Until logout" },
                      { cat: isAr ? "سجلات الأمان" : "Security Logs", purp: isAr ? "حماية النظام" : "Security & forensics", ret: isAr ? "6 أشهر – سنة" : "6 months – 1 year" },
                    ].map((row, idx: number) => (
                      <tr key={idx} className={isDark ? "hover:bg-slate-900/40" : "hover:bg-slate-50/60"}>
                        <td className={`py-3 px-4 font-semibold ${hClass}`}>{row.cat}</td>
                        <td className={`py-3 px-4 ${prose}`}>{row.purp}</td>
                        <td className={`py-3 px-4 font-mono text-xs sm:text-sm font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}>{row.ret}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ─── Section 12 ─── */}
            <section id="section-12" className="scroll-mt-24 space-y-5 pt-2">
              <SH2 a="حذف الحساب والبيانات الشخصية" e="Delete Your Account & Associated Data" />
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>
                {isAr
                  ? "تلتزم مسارات واصل بتمكين جميع المستخدمين من ممارسة حقوقهم الرقمية الكاملة بحرية وشفافية، بما في ذلك طلب الحذف النهائي للحساب وكافة السجلات المرتبطة به وفقاً لسياسات Google Play والمرسوم السلطاني رقم 6/2022."
                  : "Masarat Wasel is committed to empowering all users with full transparent control over their personal data, including the right to permanently delete their account and personal records under Google Play policies and Omani Royal Decree 6/2022."}
              </p>

              {/* Prominent Callout Card */}
              <div className={`p-6 sm:p-7 rounded-2xl border space-y-4 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="space-y-1.5">
                  <h3 className={`text-lg sm:text-xl font-bold ${hClass}`}>
                    {isAr ? "حذف حسابك وبياناتك نهائياً" : "Delete your account"}
                  </h3>
                  <p className={`text-sm sm:text-base leading-relaxed ${proseMuted}`}>
                    {isAr
                      ? "يمكنك في أي وقت طلب حذف حسابك والبيانات الشخصية المرتبطة به نهائياً وبشكل فوري عبر الصفحة المخصصة."
                      : "You can permanently delete your account and associated personal data at any time through our dedicated deletion portal."}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    href={route("account.delete")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all shadow-md shadow-red-600/20"
                  >
                    <Trash2 size={16} />
                    <span>{isAr ? "طلب حذف الحساب والبيانات" : "Request Account Deletion"}</span>
                  </Link>
                </div>

                <div className={`mt-4 pt-4 border-t text-xs ${borderClass} ${proseMuted} space-y-1`}>
                  <p>
                    <strong className={hClass}>{isAr ? "التطبيقات المشمولة: " : "Store Listings: "}</strong>
                    {isAr ? "خدمات مسارات واصل (Msarat Wasel Services) • مسارات واصل - أولياء الأمور (Masarat Wasel Guardian)" : "Msarat Wasel Services • Masarat Wasel Guardian"}
                  </p>
                  <p>
                    <strong className={hClass}>{isAr ? "المهلة الزمنية: " : "Timeline: "}</strong>
                    {isAr ? "تعطيل الحساب فورياً، وإتمام مسح البيانات الشخصية خلال 7 أيام عمل." : "Immediate deactivation, permanent data purge within 7 business days."}
                  </p>
                </div>
              </div>
            </section>

            {/* ─── Section 13 ─── */}
            <section id="section-13" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="حقوق أصحاب البيانات" e="Data Subject Rights" />
              <ul className={`space-y-2 text-base sm:text-[17px] leading-relaxed ${prose}`}>
                {(isAr ? ["سحب الموافقة على معالجة البيانات عندما تكون المعالجة قائمة على الموافقة.", "طلب تصحيح أو تحديث البيانات غير الدقيقة.", "طلب حجب البيانات في الحالات التي يسمح بها القانون.", "طلب الحصول على نسخة من البيانات الشخصية التي تتم معالجتها.", "طلب نقل البيانات إلى متحكم آخر عندما تنطبق المتطلبات القانونية.", "طلب محو البيانات في الحالات التي يسمح بها القانون.", "الحصول على المعلومات المتعلقة بكيفية استخدام البيانات الشخصية.", "تلقي الإشعارات المتعلقة بانتهاكات البيانات في الحالات التي يوجب فيها القانون ذلك."]
                  : ["Withdrawing consent where processing is based on consent.", "Requesting rectification or updating of inaccurate data.", "Requesting restriction or blocking of data processing.", "Requesting a copy of personal data processed.", "Requesting data portability to another controller where applicable.", "Requesting erasure of personal data pursuant to statutory rules.", "Obtaining transparent information regarding data processing.", "Receiving breach notifications as mandated by law."]
                ).map((item: string, i: number) => <li key={i} className="flex items-start gap-2.5"><Dot />{item}</li>)}
              </ul>
            </section>

            {/* ─── Section 14 ─── */}
            <section id="section-14" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="أمن البيانات" e="Data Security Measures" />
              <ul className={`space-y-2 text-base sm:text-[17px] leading-relaxed ${prose}`}>
                {(isAr ? ["تأمين الاتصالات باستخدام بروتوكولات التشفير القياسية (HTTPS وTLS).", "حماية بيانات تسجيل الدخول وآليات المصادقة المشفرة.", "التحكم في الوصول وتطبيق مبدأ الحد الأدنى من الصلاحيات (Least Privilege).", "تسجيل ومراقبة الأنشطة والنسخ الاحتياطي المنتظم وإجراءات استعادة الخدمة."]
                  : ["Securing data in transit with industry-standard TLS / HTTPS encryption.", "Protecting authentication credentials with token-based access controls.", "Enforcing role-based access control (RBAC) and least privilege principles.", "Audit logging, redundant backups, and disaster recovery procedures."]
                ).map((item: string, i: number) => <li key={i} className="flex items-start gap-2.5"><Dot />{item}</li>)}
              </ul>
            </section>

            {/* ─── Section 15 ─── */}
            <section id="section-15" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="الإخلالات الأمنية وتسرب البيانات" e="Security Incidents & Breach Response" />
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{isAr ? "في حال وقوع حادث أمني يؤدي إلى انتهاك أو احتمال انتهاك للبيانات الشخصية، نتخذ إجراءات مناسبة لتحديد الحادث واحتوائه وتقييم مخاطره ومعالجته. وعندما يقتضي القانون ذلك، نقوم بإخطار الجهة المختصة وأصحاب البيانات المتأثرين ضمن المدد والإجراءات القانونية المعمول بها في سلطنة عمان." : "In the event of a confirmed or suspected personal data security breach, we take immediate measures to contain the incident and remediate risks. Where statutory thresholds are met, we notify the competent regulatory authority and affected data subjects within prescribed statutory timelines."}</p>
            </section>

            {/* ─── Section 16 ─── */}
            <section id="section-16" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="إدارة أذونات الموقع" e="Location Permissions Management" />
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{isAr ? "يمكن للمستخدم إدارة أذونات الموقع من إعدادات جهاز Android الخاص به لتطبيق خدمات مسارات واصل عبر المسار التالي:" : "Users may manage location permissions through Android device settings:"}</p>
              <div className={`p-4 rounded-xl font-mono text-sm sm:text-base border ${isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-800"}`}>
                Settings &gt; Apps &gt; Msarat Wasel Services &gt; Permissions &gt; Location
              </div>
              <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{isAr ? "بالنسبة للسائق، قد يؤدي تعطيل إذن الموقع إلى توقف وظائف التتبع المباشر للرحلة وإشعارات وصول الحافلة." : "For drivers, revoking location permissions will disable real-time trip tracking and parent proximity alerts."}</p>
            </section>

            {/* ─── Section 17 ─── */}
            <section id="section-17" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="عدم استخدام بيانات الموقع للإعلانات" e="Strict Prohibition of Advertising Usage" />
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{isAr ? "لا نستخدم بيانات الموقع الجغرافي التي يتم جمعها من تطبيق خدمات مسارات واصل لتقديم إعلانات موجهة، ولا نبيع بيانات الموقع للمعلنين أو الوسطاء أو الجهات التسويقية." : "Location telemetry collected by Msarat Wasel Services is never utilized for personalized advertising, nor is it sold or monetized to advertisers or commercial brokers."}</p>
            </section>

            {/* ─── Section 18 ─── */}
            <section id="section-18" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="التحديثات على سياسة الخصوصية" e="Updates to this Privacy Policy" />
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{isAr ? "قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر لتعكس التغييرات في خدمات المنصة أو المتطلبات القانونية والتنظيمية. سيتم تحديث تاريخ 'آخر تحديث' في أعلى الصفحة، وعند الحاجة، قد يتم إشعار المستخدمين بالتغييرات المهمة عبر التطبيق أو البريد الإلكتروني." : "We may update this Privacy Policy periodically to reflect service evolutions or legal amendments. Material changes will be marked with an updated revision date and communicated through in-app notices or direct email."}</p>
            </section>

            {/* ─── Section 19 ─── */}
            <section id="section-19" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="الشكاوى والاستفسارات" e="Complaints and Regulatory Inquiries" />
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{isAr ? "إذا كان لديك استفسار أو اعتراض يتعلق بمعالجة بياناتك الشخصية، يمكنك التواصل معنا أولاً عبر مسؤول حماية البيانات الشخصية على msaratwasel@gmail.com أو عبر الهاتف/واتساب: +968 7996 7769." : "If you have an inquiry or grievance regarding personal data processing, please first reach out to our Data Protection Officer at msaratwasel@gmail.com or via phone/WhatsApp at +968 7996 7769."}</p>
            </section>

            {/* ─── Section 20 ─── */}
            <section id="section-20" className="scroll-mt-24 space-y-4 pt-2">
              <SH2 a="الاختصاص القضائي" e="Governing Law & Jurisdiction" />
              <p className={`text-base sm:text-[17px] leading-relaxed ${prose}`}>{isAr ? "تخضع معالجة البيانات الشخصية والخدمات المقدمة من مسارات واصل للقوانين واللوائح المعمول بها في سلطنة عمان." : "All data processing and platform services are governed exclusively by the applicable laws and regulations of the Sultanate of Oman."}</p>
            </section>

            {/* ─── Section 21 ─── */}
            <section id="section-21" className="scroll-mt-24 space-y-4 pt-2 pb-16">
              <SH2 a="التواصل معنا" e="Contact Information" />
              <div className={`text-base sm:text-[17px] space-y-3 ${prose}`}>
                <p className={`font-bold text-lg ${hClass}`}>مسارات واصل – Masarat Wasel</p>
                <p><strong className={isDark ? "text-slate-200" : "text-slate-800"}>{isAr ? "البريد الإلكتروني: " : "Email: "}</strong><a href="mailto:msaratwasel@gmail.com" className="text-amber-600 dark:text-amber-400 hover:underline font-medium">msaratwasel@gmail.com</a></p>
                <p><strong className={isDark ? "text-slate-200" : "text-slate-800"}>{isAr ? "الهاتف / واتساب: " : "Phone / WhatsApp: "}</strong><span dir="ltr" className={`font-mono font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>+968 7996 7769</span></p>
                <p><strong className={isDark ? "text-slate-200" : "text-slate-800"}>{isAr ? "الموقع الإلكتروني: " : "Website: "}</strong><Link href="/" className="text-amber-600 dark:text-amber-400 hover:underline font-medium">masaratwasel.com</Link></p>
                <p><strong className={isDark ? "text-slate-200" : "text-slate-800"}>{isAr ? "الدولة: " : "Country: "}</strong>{isAr ? "سلطنة عمان" : "Sultanate of Oman"}</p>
              </div>
            </section>

          </main>

          {/* ── STICKY SIDEBAR (Clean, unnumbered, with hidden scrollbar) ── */}
          <aside className="hidden xl:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8 hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pe-2">
              <nav className="text-[13.5px]">
                <p className={`font-mono uppercase text-xs tracking-wider font-semibold mb-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {isAr ? "في هذه الصفحة" : "On this page"}
                </p>
                <ul className={`border-s space-y-1 ${borderClass}`}>
                  {navItems.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={(e) => scrollToSection(e, item.id)}
                          className={`block py-1.5 ps-3.5 pe-2 transition-colors -ms-px border-s-2 leading-snug ${
                            isActive
                              ? `border-amber-500 font-medium ${isDark ? "text-white" : "text-slate-900"}`
                              : isDark
                              ? "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                              : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                          }`}
                        >
                          {isAr ? item.titleAr : item.titleEn}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </aside>

        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className={`border-t py-8 text-xs sm:text-sm ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>{isAr ? "© 2026 مسارات واصل. جميع الحقوق محفوظة وفقاً للمرسوم السلطاني رقم 6/2022." : "© 2026 Masarat Wasel. All rights reserved under Royal Decree No. 6/2022."}</span>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/" className={`transition-colors ${isDark ? "hover:text-slate-200" : "hover:text-slate-900"}`}>{isAr ? "الرئيسية" : "Home"}</Link>
            <Link href="/subscription" className={`transition-colors ${isDark ? "hover:text-slate-200" : "hover:text-slate-900"}`}>{isAr ? "الاشتراكات" : "Subscriptions"}</Link>
            <Link href="/events" className={`transition-colors ${isDark ? "hover:text-slate-200" : "hover:text-slate-900"}`}>{isAr ? "الأخبار والفعاليات" : "News & Events"}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
