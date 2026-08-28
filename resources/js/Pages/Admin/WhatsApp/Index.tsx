import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Radio,
  Power,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Phone,
  Layers,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import useTranslation from "@/hooks/useTranslation";

interface TemplateItem {
  name: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  target: string;
  is_enabled: boolean;
  total_sent: number;
  total_failed: number;
}

interface WhatsAppLogItem {
  id: number;
  user_id: number | null;
  recipient_phone: string;
  recipient_name: string | null;
  recipient_type: string | null;
  template_name: string;
  event_type: string | null;
  parameters: string[] | Record<string, any> | null;
  header_image_url: string | null;
  wamid: string | null;
  status: "sent" | "delivered" | "read" | "failed" | "skipped";
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  user?: {
    id: number;
    first_name_ar: string;
    last_name_ar: string;
    phone: string;
    role: string;
  } | null;
}

interface Props {
  stats: {
    total: number;
    delivered: number;
    sent: number;
    failed: number;
    today: number;
    success_rate: number;
    master_switch: boolean;
  };
  templates: TemplateItem[];
  logs: {
    data: WhatsAppLogItem[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
  };
  filters: {
    search: string;
    status: string;
    template: string;
  };
  metaConfigured: boolean;
}

export default function WhatsAppIndex({
  stats,
  templates,
  logs,
  filters,
  metaConfigured,
}: Props) {
  const { t, isRTL } = useTranslation();

  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [selectedStatus, setSelectedStatus] = useState(filters.status || "all");
  const [selectedTemplate, setSelectedTemplate] = useState(filters.template || "all");
  const [isTogglingMaster, setIsTogglingMaster] = useState(false);
  const [togglingTemplate, setTogglingTemplate] = useState<string | null>(null);

  // Test Sender State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testTemplate, setTestTemplate] = useState(templates[0]?.name || "student_bus_status");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Master Switch Toggle
  const handleToggleMaster = (currentState: boolean) => {
    setIsTogglingMaster(true);
    router.post(
      route("admin.whatsapp.toggle-master"),
      { enabled: !currentState },
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsTogglingMaster(false);
          toast.success(!currentState ? "تم تفعيل خدمة الواتساب بالكامل" : "تم إيقاف خدمة الواتساب بالكامل");
        },
        onError: () => {
          setIsTogglingMaster(false);
          toast.error("حدث خطأ أثناء تحديث حالة المفتاح");
        },
      }
    );
  };

  // Template Switch Toggle
  const handleToggleTemplate = (templateName: string, currentState: boolean) => {
    setTogglingTemplate(templateName);
    router.post(
      route("admin.whatsapp.toggle-template"),
      { template_name: templateName, enabled: !currentState },
      {
        preserveScroll: true,
        onSuccess: () => {
          setTogglingTemplate(null);
          toast.success(!currentState ? `تم تفعيل قالب ${templateName}` : `تم إيقاف قالب ${templateName}`);
        },
        onError: () => {
          setTogglingTemplate(null);
          toast.error("حدث خطأ أثناء تحديث القالب");
        },
      }
    );
  };

  // Search and Filter apply
  const handleFilterApply = (newStatus?: string, newTemplate?: string, newSearch?: string) => {
    router.get(
      route("admin.whatsapp.index"),
      {
        search: newSearch !== undefined ? newSearch : searchTerm,
        status: newStatus !== undefined ? newStatus : selectedStatus,
        template: newTemplate !== undefined ? newTemplate : selectedTemplate,
      },
      { preserveState: true, preserveScroll: true }
    );
  };

  // Send Direct Test Message
  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.error("يرجى إدخال رقم الهاتف");
      return;
    }

    setIsSendingTest(true);
    router.post(
      route("admin.whatsapp.send-test"),
      {
        phone: testPhone,
        template_name: testTemplate,
        parameters: ["ولي الأمر التجريبي", "أحمد", "صعد الحافلة ✅", "سائق تجريبي", "مشرفة تجريبية", "770000000", "المدرسة التجريبية"],
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsSendingTest(false);
          setShowTestModal(false);
          setTestPhone("");
          toast.success("تم إرسال رسالة الاختبار بنجاح!");
        },
        onError: () => {
          setIsSendingTest(false);
          toast.error("فشل إرسال رسالة الاختبار. تأكد من إعدادات Meta ورقم الهاتف.");
        },
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info("تم نسخ المعرف إلى الحافظة");
  };

  const getStatusBadge = (status: WhatsAppLogItem["status"]) => {
    switch (status) {
      case "read":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> مقروءة
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> تم التسليم
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Send className="w-3.5 h-3.5" /> مرسلة
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> فشلت
          </span>
        );
      case "skipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
            <Clock className="w-3.5 h-3.5" /> تم التخطي
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl text-gray-800 dark:text-gray-100 flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <MessageSquare className="w-6 h-6" />
              </span>
              <span>مركز التحكم ورسائل الواتساب</span>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-3 py-1 rounded-full">
                Meta Cloud API v25.0
              </span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              مراقبة وإدارة إرسال إشعارات الواتساب، مفاتيح الإيقاف الفورية، وسجلات التسليم لحظياً.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTestModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-yellow text-brand-dark hover:bg-yellow-400 transition-all shadow-sm active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>إرسال رسالة تجريبية</span>
            </button>
          </div>
        </div>
      }
    >
      <Head title="إدارة رسائل الواتساب | مسارات واصل" />

      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* --- 1. Top Status Banner & Master Kill Switch --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Master Kill Switch Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`lg:col-span-2 rounded-3xl p-6 sm:p-8 border shadow-sm transition-all relative overflow-hidden ${
              stats.master_switch
                ? "bg-gradient-to-br from-emerald-950/30 via-gray-900 to-gray-900 border-emerald-500/30 text-white"
                : "bg-gradient-to-br from-rose-950/30 via-gray-900 to-gray-900 border-rose-500/30 text-white"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div
                  className={`p-4 rounded-2xl ${
                    stats.master_switch
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  <Power className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">
                      {stats.master_switch ? "خدمة الواتساب مفعلة وتعمل بكفاءة" : "خدمة الواتساب متوقفة حالياً (Kill Switch)"}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        stats.master_switch
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      <Radio className="w-3 h-3" />
                      {stats.master_switch ? "Live / Active" : "Paused / Disabled"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 max-w-xl leading-relaxed">
                    {stats.master_switch
                      ? "يتم إرسال كافة إشعارات صعود ونزول الطلاب وتقارير الرحلات المعتمدة تلقائياً لأولياء الأمور والمدارس."
                      : "تم إيقاف كافة الرسائل الصادرة فوراً. لن يتم إرسال أي رسالة عبر Meta API حتى إعادة التفعيل."}
                  </p>
                </div>
              </div>

              {/* Big Interactive Toggle */}
              <div className="flex flex-col items-center gap-2 self-end sm:self-center">
                <button
                  disabled={isTogglingMaster}
                  onClick={() => handleToggleMaster(stats.master_switch)}
                  className={`relative inline-flex h-12 w-24 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none shadow-inner ${
                    stats.master_switch ? "bg-emerald-500" : "bg-gray-700"
                  } ${isTogglingMaster ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-11 w-11 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out flex items-center justify-center ${
                      stats.master_switch
                        ? isRTL
                          ? "-translate-x-12 text-emerald-600"
                          : "translate-x-12 text-emerald-600"
                        : isRTL
                        ? "translate-x-0 text-gray-400"
                        : "translate-x-0 text-gray-400"
                    }`}
                  >
                    <Power className="w-5 h-5" />
                  </span>
                </button>
                <span className="text-xs font-semibold text-gray-300">
                  {stats.master_switch ? "اضغط للإيقاف" : "اضغط للتشغيل"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Meta API Configuration Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">حالة الربط مع ميتا</span>
                {metaConfigured ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" /> تم التكوين
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                    <ShieldAlert className="w-3.5 h-3.5" /> ينقصه الـ Token
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-3">
                Meta WhatsApp Business API
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Graph API v25.0 مع دعم الـ Webhooks لتحديث حالات التسليم التلقائي.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>نسبة النجاح الإجمالية:</span>
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                {stats.success_rate}%
              </span>
            </div>
          </motion.div>
        </div>

        {/* --- 2. Metric Counters Bento Grid --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
              <span className="text-xs font-semibold">إجمالي الرسائل</span>
              <Layers className="w-4 h-4 text-brand-dark/40 dark:text-gray-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white font-mono">
              {stats.total.toLocaleString()}
            </div>
            <span className="text-xs text-gray-400 mt-1 block">كل السجلات المسجلة</span>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-semibold">تم التسليم والقراءة</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.delivered.toLocaleString()}
            </div>
            <span className="text-xs text-gray-400 mt-1 block">استلمها المستخدم بأمان</span>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-semibold">رسائل اليوم</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {stats.today.toLocaleString()}
            </div>
            <span className="text-xs text-gray-400 mt-1 block">منذ منتصف الليل</span>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-semibold">الرسائل الفاشلة</span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {stats.failed.toLocaleString()}
            </div>
            <span className="text-xs text-gray-400 mt-1 block">تعثر تسليمها أو رقم غير نشط</span>
          </div>
        </div>

        {/* --- 3. Per-Template Control Cards --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-yellow" />
              <span>مفاتيح التحكم بالقوالب المعتمدة (Template Switches)</span>
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              يمكنك تعطيل قالب محدد دون التأثير على باقي القوالب
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((tpl) => (
              <div
                key={tpl.name}
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200/80 dark:border-gray-700 shadow-sm flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300 font-bold">
                          {tpl.name}
                        </span>
                        <span className="text-xs font-semibold text-brand-dark dark:text-brand-yellow bg-yellow-50 dark:bg-yellow-950/40 px-2 py-0.5 rounded">
                          {tpl.target === "parent" ? "أولياء الأمور" : "إدارة المدرسة"}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-2">
                        {isRTL ? tpl.title_ar : tpl.title_en}
                      </h4>
                    </div>

                    {/* Template Switch Button */}
                    <button
                      disabled={!stats.master_switch || togglingTemplate === tpl.name}
                      onClick={() => handleToggleTemplate(tpl.name, tpl.is_enabled)}
                      className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        tpl.is_enabled && stats.master_switch ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                      } ${!stats.master_switch || togglingTemplate === tpl.name ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          tpl.is_enabled && stats.master_switch
                            ? isRTL
                              ? "-translate-x-6"
                              : "translate-x-6"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                    {isRTL ? tpl.description_ar : tpl.description_en}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    تم الإرسال: <b className="text-gray-900 dark:text-white font-mono">{tpl.total_sent}</b> | الفشل:{" "}
                    <b className="text-rose-600 font-mono">{tpl.total_failed}</b>
                  </span>

                  <span
                    className={`font-bold ${
                      tpl.is_enabled && stats.master_switch
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-400"
                    }`}
                  >
                    {tpl.is_enabled && stats.master_switch ? "مفعل للإرسال" : "معطل"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- 4. Live WhatsApp Logs Table & Search --- */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Table Header & Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>سجل رسائل الواتساب الحية (Live Logs)</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                تحديث فوري لجميع الرسائل الصادرة ومعرفات الاستلام وحالات التسليم.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilterApply(undefined, undefined, searchTerm)}
                  placeholder="ابحث برقم الهاتف أو المعرف..."
                  className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-yellow focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  handleFilterApply(e.target.value, undefined, undefined);
                }}
                className="py-2 px-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-yellow"
              >
                <option value="all">كافة الحالات</option>
                <option value="sent">مرسلة (Sent)</option>
                <option value="delivered">تم التسليم (Delivered)</option>
                <option value="read">مقروءة (Read)</option>
                <option value="failed">فشلت (Failed)</option>
                <option value="skipped">تم التخطي (Skipped)</option>
              </select>

              {/* Template Filter */}
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  handleFilterApply(undefined, e.target.value, undefined);
                }}
                className="py-2 px-3 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-yellow"
              >
                <option value="all">كافة القوالب</option>
                {templates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50/80 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">المستلم ورقم الهاتف</th>
                  <th className="py-3.5 px-4">القالب المعتمد</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4">معرف ميتا (WAMID)</th>
                  <th className="py-3.5 px-4">وقت الإرسال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {logs.data.length > 0 ? (
                  logs.data.map((log, idx) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-gray-400">{log.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-gray-100 font-mono dir-ltr text-right">
                            {log.recipient_phone}
                          </span>
                          {log.recipient_name && (
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              {log.recipient_name} ({log.recipient_type || "مستخدم"})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono text-[11px]">
                          {log.template_name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(log.status)}
                        {log.error_message && (
                          <div className="text-[10px] text-rose-500 mt-1 max-w-xs truncate" title={log.error_message}>
                            {log.error_message}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                        {log.wamid ? (
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[120px]" title={log.wamid}>
                              {log.wamid}
                            </span>
                            <button
                              onClick={() => copyToClipboard(log.wamid!)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                              title="نسخ المعرف"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("ar-SA", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <span>لا توجد سجلات رسائل مطابقة لخيارات البحث.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logs.last_page > 1 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                عرض {logs.from} إلى {logs.to} من أصل {logs.total} رسالة
              </span>

              <div className="flex items-center gap-1">
                {logs.links.map((link, idx) => (
                  <button
                    key={idx}
                    disabled={!link.url}
                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true, preserveState: true })}
                    className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-all ${
                      link.active
                        ? "bg-brand-yellow text-brand-dark font-bold shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    } ${!link.url ? "opacity-30 cursor-not-allowed" : ""}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Test Message Modal --- */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-brand-yellow" />
                <span>إرسال رسالة واتساب تجريبية</span>
              </h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendTest} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  رقم الهاتف المستلم (بالصيغة الدولية أو المحلية):
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="مثال: 771234567 أو 966501234567"
                    className="w-full pl-3 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-yellow focus:outline-none font-mono text-left"
                    dir="ltr"
                  />
                </div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  سيتم تحويل الرقم تلقائياً إلى الصيغة الدولية المتوافقة مع ميتا.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  القالب المعتمد:
                </label>
                <select
                  value={testTemplate}
                  onChange={(e) => setTestTemplate(e.target.value)}
                  className="w-full py-2.5 px-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-yellow"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.name} value={tpl.name}>
                      {isRTL ? tpl.title_ar : tpl.title_en} ({tpl.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="px-5 py-2 text-xs font-bold bg-brand-yellow text-brand-dark rounded-xl hover:bg-yellow-400 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isSendingTest ? "جاري الإرسال..." : "إرسال الآن"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
