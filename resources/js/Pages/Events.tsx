import { Head, Link } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar, Newspaper, Camera, Users, ChevronLeft, ChevronRight, Globe, Moon, Sun } from "lucide-react";

interface Event {
  id: number;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  type: "news" | "workshop" | "bus_photos" | "activity";
  event_date: string;
  image: string | null;
}

interface Props {
  events: Event[];
}

export default function Events({ events }: Props) {
  const { isRTL, theme, toggleTheme, language, toggleLanguage } = useTheme();
  const isDark = theme === "dark";

  // Re-usable header component to match Welcome page style
  const Header = () => (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 dark:bg-brand-dark/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group relative">
          <div className="relative w-11 h-11 transition-transform group-hover:scale-110 duration-500">
             <div className="absolute inset-0 bg-brand-yellow/20 rounded-xl blur-lg group-hover:bg-brand-yellow/40 transition-colors" />
             <img src="/assets/images/masarat-wasel-logo.jpg" alt="Masarat Wasel Logo" className="relative h-full w-full object-contain rounded-xl shadow-sm border border-white dark:border-gray-800" />
          </div>
          <div className={`flex flex-col ${isRTL ? "text-right" : "text-left"}`}>
            <span className={`text-xl font-black tracking-tight ${isDark ? "text-white" : "text-brand-navy"}`}>
              {isRTL ? "مسارات واصل" : "Masarat Wasel"}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-yellow">
              {isRTL ? "المنتدى المصغر" : "Mini Forum"}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4 rtl:border-r-0 rtl:border-l rtl:pr-0 rtl:pl-4">
              <button
                  onClick={toggleLanguage}
                  className={`p-2 rounded-xl transition-colors flex items-center gap-2 text-sm font-bold ${
                      isDark ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100 text-slate-600"
                  }`}
                  title="Change Language"
              >
                  <Globe size={18} />
                  {language === "ar" ? "EN" : "عربي"}
              </button>
              <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-xl transition-colors ${
                      isDark ? "hover:bg-slate-800 text-brand-yellow" : "hover:bg-slate-100 text-brand-navy"
                  }`}
                  title="Toggle Theme"
              >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
          </div>

          <Link
            href="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isDark
                ? "bg-brand-navy text-white hover:bg-brand-dark"
                : "bg-brand-navy text-white hover:bg-brand-dark"
            }`}
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRTL ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </div>
      </div>
    </header>
  );

  const getEventIcon = (type: string) => {
    switch (type) {
      case "news": return <Newspaper className="w-5 h-5" />;
      case "workshop": return <Users className="w-5 h-5" />;
      case "bus_photos": return <Camera className="w-5 h-5" />;
      case "activity": return <Calendar className="w-5 h-5" />;
      default: return <Newspaper className="w-5 h-5" />;
    }
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "news": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "workshop": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "bus_photos": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "activity": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getEventTypeName = (type: string) => {
    switch (type) {
      case "news": return isRTL ? "أخبار" : "News";
      case "workshop": return isRTL ? "ورشة عمل" : "Workshop";
      case "bus_photos": return isRTL ? "صور" : "Photos";
      case "activity": return isRTL ? "نشاط" : "Activity";
      default: return type;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-brand-dark text-white" : "bg-gray-50 text-gray-900"} font-sans`} dir={isRTL ? "rtl" : "ltr"}>
      <Head>
        <title>{isRTL ? "الفعاليات والأخبار | مسارات واصل" : "News & Events | Masarat Wasel"}</title>
        <meta name="description" content={isRTL ? "تابع أحدث أخبار شركة مسارات واصل، فعالياتنا، ورش العمل، وأحدث الإضافات لأسطول النقل المدرسي في سلطنة عمان." : "Follow the latest news from Masarat Wasel, our events, workshops, and the newest additions to our school transport fleet in Oman."} />
        <meta name="keywords" content={isRTL ? "أخبار النقل المدرسي, فعاليات مسارات واصل, ورش عمل سلامة الحافلات, أخبار حافلات عمان, المنتدى المصغر مسارات واصل" : "school transport news, Masarat Wasel events, school bus safety workshops, Oman school bus news, mini forum Masarat Wasel"} />
        <link rel="canonical" href="https://masaratwasal.com/events" />

        {/* Open Graph Tags */}
        <meta property="og:title" content={isRTL ? "الفعاليات والأخبار | مسارات واصل" : "News & Events | Masarat Wasel"} />
        <meta property="og:description" content={isRTL ? "تابع أحدث أخبار شركة مسارات واصل، فعالياتنا، ورش العمل، وأحدث الإضافات لأسطول النقل المدرسي." : "Follow the latest news from Masarat Wasel, our events, workshops, and the newest additions to our school transport fleet."} />
        <meta property="og:image" content="https://masaratwasal.com/assets/images/masarat-wasel-logo.jpg" />
        <meta property="og:url" content="https://masaratwasal.com/events" />
        <meta property="og:type" content="website" />
      </Head>
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} w-full h-full overflow-hidden -z-10`}>
          <div className={`absolute top-[-10%] ${isRTL ? 'right-[-5%]' : 'left-[-5%]'} w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 ${isDark ? "bg-brand-yellow" : "bg-brand-yellow"}`}></div>
          <div className={`absolute bottom-[-10%] ${isRTL ? 'left-[-10%]' : 'right-[-10%]'} w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[120px] opacity-20 ${isDark ? "bg-blue-600" : "bg-brand-navy"}`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-200 shadow-sm"}`}>
              <span className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest">{isRTL ? "آخر التحديثات" : "Latest Updates"}</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              {isRTL ? (
                <>المنتدى المصغر <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-yellow-600">والأخبار</span></>
              ) : (
                <>Mini Forum <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-yellow-600">& News</span></>
              )}
            </h1>

            <p className={`max-w-2xl text-lg md:text-xl font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              {isRTL
                ? "تابع أحدث أخبار شركة مسارات واصل، فعالياتنا، ورش العمل، وأحدث الإضافات لأسطول النقل المدرسي."
                : "Follow the latest news from Masarat Wasel, our events, workshops, and the newest additions to our school transport fleet."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {events.length === 0 ? (
          <div className={`text-center py-20 rounded-3xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
            <Newspaper className={`w-16 h-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
            <h3 className="text-xl font-bold mb-2">{isRTL ? "لا توجد أخبار حالياً" : "No news available"}</h3>
            <p className={isDark ? "text-gray-400" : "text-gray-500"}>
              {isRTL ? "ترقبوا أحدث أخبارنا وفعالياتنا قريباً." : "Stay tuned for our latest news and events."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <motion.article
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`group rounded-3xl overflow-hidden border transition-all duration-500 hover:-translate-y-2 ${
                  isDark
                    ? "bg-white/5 border-white/10 hover:border-brand-yellow/30 hover:bg-white/10"
                    : "bg-white border-gray-200 shadow-sm hover:shadow-xl hover:border-brand-yellow/30"
                }`}
              >
                {/* Image or Placeholder */}
                <div className="relative h-56 overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={isRTL ? event.title_ar : event.title_en}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                      <img src="/assets/images/logo.png" alt="Logo" className="w-24 h-24 opacity-20 grayscale" />
                    </div>
                  )}

                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md ${getEventBadgeColor(event.type)}`}>
                      {getEventIcon(event.type)}
                      {getEventTypeName(event.type)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                  <div className={`flex items-center gap-2 text-xs font-bold mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    <Calendar className="w-4 h-4 text-brand-yellow" />
                    {event.event_date ? new Date(event.event_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    }) : '—'}
                  </div>

                  <h3 className="text-xl font-black mb-3 line-clamp-2 group-hover:text-brand-yellow transition-colors">
                    {isRTL ? event.title_ar : event.title_en}
                  </h3>

                  <p className={`text-sm leading-relaxed mb-6 line-clamp-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {isRTL ? event.content_ar : event.content_en}
                  </p>

                  <button className={`inline-flex items-center gap-2 text-sm font-bold transition-colors ${
                    isDark ? "text-brand-yellow hover:text-white" : "text-brand-navy hover:text-brand-yellow"
                  }`}>
                    {isRTL ? "اقرأ المزيد" : "Read More"}
                    {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* Simple Footer */}
      <footer className={`py-8 text-center border-t ${isDark ? "border-white/10 text-gray-500" : "border-gray-200 text-gray-400"}`}>
        <p className="text-sm font-bold">
          © {new Date().getFullYear()} Masarat Wasel. {isRTL ? "جميع الحقوق محفوظة." : "All rights reserved."}
        </p>
      </footer>
    </div>
  );
}
