import { Head, Link } from "@inertiajs/react";
import { FormEventHandler, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Mail
} from "lucide-react";

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState("advanced");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => {
        setShowSuccess(false);
        setSelectedPlan("advanced");
        (e.target as HTMLFormElement).reset();
      }, 5000);
    }, 1500);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-brand-yellow/30 selection:text-brand-navy" dir="rtl">
      <Head>
        <title>انضم لمنصة مسارات واصل | طلب اشتراك مدرسة</title>
        <meta name="description" content="اشترك الآن في منصة مسارات واصل للتحول الرقمي الكامل في إدارة النقل المدرسي." />
        <link rel="icon" type="image/png" href="/assets/images/masarat-wasel-logo.jpg" />
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
                <img src="/assets/images/masarat-wasel-logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-lg" />
             </div>
             <span className="text-xl font-black text-brand-navy">مسارات واصل</span>
          </Link>
          
          <div className="flex items-center gap-6">
             <Link href="/" className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-navy transition-colors">
                <ArrowRight size={18} className="translate-x-1" />
                العودة للرئيسية
             </Link>
             <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
             <Link href={route("login")} className="px-5 py-2.5 text-sm font-black rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2">
                سجل الدخول
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
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 text-brand-dark text-xs font-bold uppercase tracking-widest">
                   طلب انضمام جديد
                </motion.div>
                <motion.h1 variants={itemVariants} className="text-4xl lg:text-5xl font-black text-brand-navy leading-tight">
                   ابدأ بتجربة <span className="text-brand-yellow">نقل مدرسي</span> أذكى اليوم
                </motion.h1>
                <motion.p variants={itemVariants} className="text-lg text-slate-500 font-medium leading-relaxed">
                   انضم لأكثر من 200 مدرسة تثق بمسارات واصل لإدارة عملياتها اليومية وتأمين رحلات طلابها بضغطة زر.
                </motion.p>
             </div>

             <div className="space-y-8">
                <motion.div variants={itemVariants} className="flex gap-5 group items-start">
                   <div className="w-12 h-12 shrink-0 rounded-2xl bg-brand-navy text-white flex items-center justify-center shadow-xl shadow-brand-navy/20 group-hover:scale-110 transition-transform"><ShieldCheck size={24}/></div>
                   <div>
                      <h3 className="text-lg font-black text-brand-navy mb-1">أمان بيانات مطلق</h3>
                      <p className="text-slate-500 font-medium">نحن نستخدم أعلى معايير التشفير لحماية خصوصية طلابك وأولياء أمورك.</p>
                   </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex gap-5 group items-start">
                   <div className="w-12 h-12 shrink-0 rounded-2xl bg-brand-yellow text-brand-dark flex items-center justify-center shadow-xl shadow-brand-yellow/20 group-hover:scale-110 transition-transform"><Zap size={24}/></div>
                   <div>
                      <h3 className="text-lg font-black text-brand-navy mb-1">تفعيل فوري</h3>
                      <p className="text-slate-500 font-medium">فريقنا جاهز لمساعدتك في رفع البيانات وتدريب السائقين في أقل من 24 ساعة.</p>
                   </div>
                </motion.div>
                
                <motion.div variants={itemVariants} className="flex gap-5 group items-start">
                   <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center shadow-xl shadow-slate-200/20 group-hover:scale-110 transition-transform"><BadgeCheck size={24}/></div>
                   <div>
                      <h3 className="text-lg font-black text-brand-navy mb-1">دعم فني مخصص</h3>
                      <p className="text-slate-500 font-medium">مدير حساب خاص لمدرستك يسهر على حل أي مشكلة قبل وقوعها.</p>
                   </div>
                </motion.div>
             </div>

             <motion.div variants={itemVariants} className="p-8 bg-brand-navy rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-brand-navy/30">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <blockquote className="relative z-10 italic font-medium opacity-80 mb-6 text-lg">
                   "مسارات واصل غيرت تماماً الطريقة التي ندير بها الحافلات، المعلمون وأولياء الأمور مرتاحون جداً الآن."
                </blockquote>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-slate-300 border-2 border-white/20" />
                   <div>
                      <div className="font-black">د. سارة الأحمد</div>
                      <div className="text-xs font-bold text-white/50">مديرة مدرسة الأمل النموذجية</div>
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
                    className="p-12 bg-white rounded-[3rem] shadow-3xl shadow-slate-200/50 border border-emerald-100 flex flex-col items-center text-center gap-6"
                 >
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center"><BadgeCheck size={64}/></div>
                    <h2 className="text-3xl font-black text-brand-navy">شكراً لثقتك بنا!</h2>
                    <p className="text-lg text-slate-500 font-medium">لقد تم استلام طلب مدرستك بنجاح. سيقوم فريق المبيعات الخاص بنا بالتواصل معك خلال الساعات القادمة لإكمال عملية التفعيل.</p>
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
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 text-brand-dark flex items-center justify-center"><UserCircle2 size={24}/></div>
                             <h2 className="text-2xl font-black text-brand-navy">بيانات الحساب الأساسية</h2>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <FormInput label="اسم المستخدم للمشرف (بالإنجليزي)" id="username" icon={<User size={18}/>} placeholder="Admin_School_2024" required />
                             <FormInput label="كلمة المرور الابتدائية" id="password" type="password" icon={<Lock size={18}/>} placeholder="••••••••" required helpText="يمكن تغييرها لاحقاً من لوحة الإعدادات" />
                          </div>
                       </div>

                       {/* Step 2: School Info */}
                       <div className="space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-brand-navy/10 text-brand-navy flex items-center justify-center"><School size={24}/></div>
                             <h2 className="text-2xl font-black text-brand-navy">معلومات المؤسسة التعليمية</h2>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                             <FormInput label="اسم المدرسة (العربية)" id="school_ar" placeholder="مدرسة الأجيال الأهلية" required />
                             <FormInput label="School Name (English)" id="school_en" placeholder="Al-Ajyal School" required dir="ltr" />
                             <FormInput label="المدينة والموقع" id="city" icon={<MapPin size={18}/>} placeholder="الرياض، حي الملقا" required />
                             <FormInput label="الاسم الكامل للمشرف المسؤول" id="admin_name" icon={<Navigation size={18}/>} placeholder="اكتب اسمك الثلاثي" required />
                          </div>
                       </div>

                       {/* Step 3: Contact Info */}
                       <div className="space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><PhoneCall size={24}/></div>
                             <h2 className="text-2xl font-black text-brand-navy">التواصل واللغة</h2>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                             <div className="space-y-3">
                                <label className="text-sm font-black text-brand-navy">رقم الجوال النشط</label>
                                <div className="flex shadow-sm rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 focus-within:ring-2 focus-within:ring-brand-navy/20 focus-within:border-brand-navy transition-all">
                                   <select className="bg-transparent pr-8 border-none text-slate-500 font-bold text-sm w-28" dir="ltr">
                                      <option>🇸🇦 +966</option>
                                      <option>🇾🇪 +967</option>
                                      <option>🇦🇪 +971</option>
                                   </select>
                                   <input type="tel" className="flex-1 bg-transparent border-none py-4 px-4 font-bold text-brand-navy focus:ring-0" placeholder="5xxxxxxxx" dir="ltr" required />
                                </div>
                             </div>

                             <div className="space-y-3">
                                <label className="text-sm font-black text-brand-navy">لغة النظام المفضلة</label>
                                <div className="relative group">
                                   <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-navy transition-colors z-10">
                                      <Globe size={18} />
                                   </div>
                                   <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pr-12 pl-4 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all">
                                      <option value="ar">العربية (Arabic)</option>
                                      <option value="en">English (US)</option>
                                   </select>
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Step 4: Packages */}
                       <div className="space-y-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Briefcase size={24}/></div>
                             <h2 className="text-2xl font-black text-brand-navy">اختر خطة الاشتراك</h2>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <PlanOption 
                                id="basic" 
                                title="الأساسية" 
                                price="50" 
                                selected={selectedPlan === "basic"} 
                                onClick={() => setSelectedPlan("basic")} 
                                features={['حتى 5 حافلات', 'تطبيق السائق']}
                             />
                             <PlanOption 
                                id="advanced" 
                                title="المتقدمة" 
                                price="120" 
                                selected={selectedPlan === "advanced"} 
                                onClick={() => setSelectedPlan("advanced")} 
                                isMostPopular 
                                features={['حتى 15 حافلة', 'تطبيق ولي الأمر', 'إشعارات لا محدودة']}
                             />
                             <PlanOption 
                                id="enterprise" 
                                title="المؤسسات" 
                                price="250" 
                                selected={selectedPlan === "enterprise"} 
                                onClick={() => setSelectedPlan("enterprise")} 
                                features={['حافلات غير محدودة', 'تكامل API', 'دعم مخصص 24/7']}
                             />
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="text-sm font-black text-brand-navy">ملاحظات إضافية</label>
                          <textarea rows={4} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-slate-700 focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all" placeholder="هل لديك متطلبات خاصة تود منا مراعاتها؟"></textarea>
                       </div>

                    </div>

                    <div className="p-10 lg:p-14 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-8">
                       <p className="text-sm font-bold text-slate-400 max-w-lg text-center leading-relaxed">بمجرد النقر على زر الإرسال، فإنك توافق على <a href="#" className="text-brand-navy underline underline-offset-4">سياسة الخصوصية</a> وشروط الاستخدام الخاصة بمنظومة مسارات واصل.</p>
                       <button 
                          disabled={isSubmitting}
                          className="w-full max-w-md py-5 bg-brand-navy text-white text-xl font-black rounded-[1.5rem] shadow-2xl shadow-brand-navy/30 hover:shadow-brand-navy/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-4"
                       >
                          {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <>إرسال الطلب الآن <ArrowRight className="rotate-180" size={24}/></>}
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
                <img src="/assets/images/masarat-wasel-logo.jpg" className="h-8 object-contain" alt="Footer Logo" />
                <span className="font-black text-slate-400">مسارات واصل</span>
             </div>
             <div className="text-sm font-bold text-slate-400">© 2024 جميع الحقوق محفوظة لشركة مسارات واصل للتقنية.</div>
          </div>
      </footer>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────

function FormInput({ label, id, type = "text", icon, placeholder, helpText, required, dir = "rtl" }: any) {
  return (
    <div className="space-y-3">
       <label className="text-sm font-black text-brand-navy" htmlFor={id}>{label}</label>
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
             className={`w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 ${icon ? 'pr-12' : 'pr-4'} pl-4 font-bold text-brand-navy focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy transition-all placeholder:text-slate-300`}
          />
       </div>
       {helpText && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{helpText}</p>}
    </div>
  );
}

function PlanOption({ id, title, price, selected, onClick, isMostPopular, features }: any) {
  return (
    <div 
       onClick={onClick}
       className={`relative cursor-pointer p-8 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center text-center ${
         selected 
          ? 'border-brand-navy bg-brand-navy text-white shadow-2xl shadow-brand-navy/30 scale-[1.03]' 
          : 'border-slate-100 bg-white hover:border-brand-yellow hover:shadow-xl'
       }`}
    >
       {isMostPopular && (
         <div className={`absolute -top-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${selected ? 'bg-brand-yellow text-brand-dark' : 'bg-brand-navy text-white'}`}>شائع</div>
       )}
       <h4 className={`text-lg font-black mb-3 ${selected ? 'text-white' : 'text-brand-navy'}`}>{title}</h4>
       <div className="flex items-baseline gap-1 mb-6">
          <span className="text-3xl font-black">{price}$</span>
          <span className={`text-xs font-bold opacity-50`}>/شهرياً</span>
       </div>
       <ul className="space-y-3 w-full">
          {features.map((f: string, i: number) => (
            <li key={i} className={`flex items-center justify-center gap-2 text-xs font-bold ${selected ? 'text-white/70' : 'text-slate-400'}`}>
               <Zap size={14} className={selected ? 'text-brand-yellow' : 'text-brand-navy'} /> {f}
            </li>
          ))}
       </ul>
    </div>
  );
}
