import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  AlertCircle,
  Clock,
  Send,
  Radio,
  Power,
  ShieldCheck,
  ShieldAlert,
  Search,
  Copy,
  Sparkles,
  Phone,
  Layers,
  Info,
  Eye,
  Smartphone,
  Check,
  RotateCcw,
  CheckCheck,
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
  header_image?: string | null;
  sample_body?: string;
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

interface AccountInfo {
  verified_name: string;
  display_phone_number: string;
  phone_number_id: string;
  waba_id: string;
  status: string;
  quality_rating: string;
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
  accountInfo?: AccountInfo;
}

/**
 * مكون مفتاح التبديل السلس المتوافق 100% مع الاتجاهين العربي والإنجليزي (RTL/LTR Switch)
 */
function SmoothToggle({
  checked,
  onChange,
  disabled = false,
  size = "md",
  isRTL = true,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  isRTL?: boolean;
  ariaLabel?: string;
}) {
  const dimensions = {
    sm: { track: "w-11 h-6 p-0.5", thumb: "w-5 h-5", travel: isRTL ? -20 : 20 },
    md: { track: "w-14 h-7 p-0.5", thumb: "w-6 h-6", travel: isRTL ? -28 : 28 },
    lg: { track: "w-20 h-10 p-1", thumb: "w-8 h-8", travel: isRTL ? -40 : 40 },
  }[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex items-center rounded-full transition-colors duration-300 focus:outline-none cursor-pointer flex-shrink-0 select-none ${
        dimensions.track
      } ${
        checked
          ? "bg-emerald-500 shadow-[0_2px_12px_rgba(16,185,129,0.35)]"
          : "bg-slate-300 dark:bg-slate-700 border border-slate-400/20"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-95"}`}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        animate={{
          x: checked ? dimensions.travel : 0,
        }}
        className={`rounded-full bg-white shadow-md flex items-center justify-center pointer-events-none ${dimensions.thumb}`}
      >
        {checked ? (
          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        )}
      </motion.div>
    </button>
  );
}

export default function WhatsAppIndex({
  stats,
  templates,
  logs,
  filters,
  metaConfigured,
  accountInfo,
}: Props) {
  const { isRTL } = useTranslation();

  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [selectedStatus, setSelectedStatus] = useState(filters.status || "all");
  const [selectedTemplate, setSelectedTemplate] = useState(filters.template || "all");

  // ⚡ Optimistic UI States (استجابة فورية 0ms بدون إعادة تحميل الصفحة)
  const [masterSwitch, setMasterSwitch] = useState<boolean>(stats.master_switch);
  const [templateStates, setTemplateStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(templates.map((t) => [t.name, t.is_enabled]))
  );

  // Sync state when props change
  useEffect(() => {
    setMasterSwitch(stats.master_switch);
  }, [stats.master_switch]);

  useEffect(() => {
    setTemplateStates(Object.fromEntries(templates.map((t) => [t.name, t.is_enabled])));
  }, [templates]);

  // Modals state
  const [showTestModal, setShowTestModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<WhatsAppLogItem | null>(null);
  const [retryingLogId, setRetryingLogId] = useState<number | null>(null);

  // Test form state
  const [testPhone, setTestPhone] = useState("");
  const [testTemplate, setTestTemplate] = useState(templates[0]?.name || "student_bus_status");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // ⚡ Optimistic Master Switch Toggle
  const handleToggleMaster = () => {
    const nextState = !masterSwitch;
    // تحديث الحالة التفاعلية في رياكت فوراً
    setMasterSwitch(nextState);

    router.post(
      route("admin.whatsapp.toggle-master"),
      { enabled: nextState },
      {
        preserveState: true,
        preserveScroll: true,
        only: ["stats"],
        onSuccess: () => {
          toast.success(
            nextState
              ? "تم تشغيل خدمة رسائل الواتساب بنجاح"
              : "تم إيقاف خدمة رسائل الواتساب بالكامل"
          );
        },
        onError: () => {
          // التراجع في حال حدوث خطأ
          setMasterSwitch(!nextState);
          toast.error("حدث خطأ أثناء تحديث حالة الخدمة");
        },
      }
    );
  };

  // ⚡ Optimistic Template Switch Toggle
  const handleToggleTemplate = (templateName: string) => {
    const currentState = templateStates[templateName] ?? true;
    const nextState = !currentState;

    // تحديث الحالة التفاعلية للقالب فوراً في واجهة رياكت
    setTemplateStates((prev) => ({
      ...prev,
      [templateName]: nextState,
    }));

    router.post(
      route("admin.whatsapp.toggle-template"),
      { template_name: templateName, enabled: nextState },
      {
        preserveState: true,
        preserveScroll: true,
        only: ["templates"],
        onSuccess: () => {
          toast.success(
            nextState
              ? "تم تفعيل إرسال القالب بنجاح"
              : "تم تعطيل إرسال القالب مؤقتاً"
          );
        },
        onError: () => {
          // التراجع في حال حدوث خطأ
          setTemplateStates((prev) => ({
            ...prev,
            [templateName]: currentState,
          }));
          toast.error("حدث خطأ أثناء تحديث حالة القالب");
        },
      }
    );
  };

  // Search & Filter Apply
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

  // Retry Failed Message
  const handleRetryMessage = (log: WhatsAppLogItem) => {
    setRetryingLogId(log.id);
    router.post(
      route("admin.whatsapp.retry", log.id),
      {},
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setRetryingLogId(null);
          if (selectedLogForDetails) {
            setSelectedLogForDetails(null);
          }
          toast.success("تمت إعادة إرسال الرسالة بنجاح!");
        },
        onError: () => {
          setRetryingLogId(null);
          toast.error("فشلت إعادة الإرسال. تأكد من صحة رقم المستلم.");
        },
      }
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
      },
      {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setIsSendingTest(false);
          setShowTestModal(false);
          setTestPhone("");
          toast.success("تم إرسال الرسالة التجريبية بنجاح!");
        },
        onError: () => {
          setIsSendingTest(false);
          toast.error("فشل الإرسال. تأكد من أن القالب معتمد في ميتا.");
        },
      }
    );
  };

  const copyToClipboard = (text: string, label: string = "النص") => {
    navigator.clipboard.writeText(text);
    toast.info(`تم نسخ ${label} بنجاح`);
  };

  const getStatusBadge = (status: WhatsAppLogItem["status"]) => {
    switch (status) {
      case "read":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <CheckCheck className="w-3.5 h-3.5" /> مقروءة
          </span>
        );
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCheck className="w-3.5 h-3.5" /> تم التسليم
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Send className="w-3.5 h-3.5" /> مرسلة
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> تعثر الإرسال
          </span>
        );
      case "skipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
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
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                <MessageSquare className="w-6 h-6" />
              </span>
              <div>
                <h2 className="font-extrabold text-2xl text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>مركز تحكم رسائل الواتساب</span>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-300/40">
                    الربط السحابي المعتمد
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  إدارة البث المباشر للإشعارات، مفاتيح الإيقاف الفورية، ومتابعة سجلات التسليم لأولياء الأمور والمدارس.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTestModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-brand-yellow text-brand-dark hover:bg-yellow-400 transition-all shadow-sm active:scale-95 border border-yellow-500/20"
            >
              <Send className="w-4 h-4" />
              <span>إرسال إشعار تجريبي</span>
            </button>
          </div>
        </div>
      }
    >
      <Head title="إدارة رسائل الواتساب | مسارات واصل" />

      <div className="max-w-7xl mx-auto space-y-8 pb-14">
        {/* --- 1. Top Section: Master Switch + Account Card --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Master Kill Switch Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`lg:col-span-2 rounded-3xl p-6 sm:p-8 border shadow-sm transition-all relative overflow-hidden ${
              masterSwitch
                ? "bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/30 text-white"
                : "bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/30 text-white"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div
                  className={`p-4 rounded-2xl ${
                    masterSwitch
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  <Power className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black">
                      {masterSwitch
                        ? "خدمة الواتساب مفعلة وتعمل بكفاءة"
                        : "خدمة الواتساب متوقفة حالياً (مفتاح الإيقاف العام)"}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        masterSwitch
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      <Radio className="w-3 h-3" />
                      {masterSwitch ? "متصل ويعمل لحظياً" : "متوقف مؤقتاً"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 max-w-xl leading-relaxed">
                    {masterSwitch
                      ? "يتم إرسال كافة إشعارات صعود ونزول الطلاب وتقارير الرحلات المعتمدة تلقائياً لجميع أولياء الأمور وإدارات المدارس."
                      : "تم إيقاف كافة الرسائل الصادرة فوراً. لن يتم خصم أي رصيد أو إرسال أي إشعار حتى إعادة التفعيل."}
                  </p>
                </div>
              </div>

              {/* Responsive Smooth Toggle Switch */}
              <div className="flex flex-col items-center gap-2 self-end sm:self-center">
                <SmoothToggle
                  checked={masterSwitch}
                  onChange={handleToggleMaster}
                  size="lg"
                  isRTL={isRTL}
                  ariaLabel="تبديل المفتاح العام لخدمة الواتساب"
                />
                <span className="text-[11px] font-bold text-slate-300">
                  {masterSwitch ? "انقر للإيقاف العام" : "انقر للتشغيل العام"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Connected WhatsApp Business Account Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">بيانات الحساب المعتمد</span>
                {metaConfigured ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" /> حساب موثق ورسمي
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                    <ShieldAlert className="w-3.5 h-3.5" /> قيد التكوين
                  </span>
                )}
              </div>

              <div className="mt-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">الاسم التجاري:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {accountInfo?.verified_name || "wasel_company"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">رقم الإرسال الرسمي:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono dir-ltr">
                    {accountInfo?.display_phone_number || "+968 7736 5677"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">معرف الحساب التجاري:</span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[140px]" title={accountInfo?.waba_id}>
                    {accountInfo?.waba_id || "3466768820164365"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">معدل النجاح الإجمالي:</span>
              <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                {stats.success_rate}%
              </span>
            </div>
          </motion.div>
        </div>

        {/* --- 2. KPI Metrics Grid --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold">إجمالي الرسائل</span>
              <Layers className="w-4 h-4 text-brand-dark/40 dark:text-slate-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {stats.total.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">كافة العمليات المسجلة</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold">تم التسليم والقراءة</span>
              <CheckCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.delivered.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">وصلت لهاتف المستلم بنجاح</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold">رسائل اليوم</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {stats.today.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">منذ بداية اليوم الحالي</span>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
              <span className="text-xs font-bold">الرسائل المتعثرة</span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {stats.failed.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">أرقام غير مفعلة أو أخطاء تسليم</span>
          </div>
        </div>

        {/* --- 3. Smart Template Controls with Live Preview --- */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-yellow" />
                <span>التحكم بالقوالب الذكية والمعاينة الحية</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                يمكنك إيقاف أو تشغيل أي قالب على حدة، أو معاينة شكله الحقيقي كما يظهر في تطبيق واتساب.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => {
              const isEnabled = templateStates[tpl.name] ?? tpl.is_enabled;
              return (
                <div
                  key={tpl.name}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-brand-yellow/50 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-lg">
                            {tpl.title_ar}
                          </span>
                          <span className="text-[11px] font-bold text-brand-dark dark:text-brand-yellow bg-yellow-50 dark:bg-yellow-950/40 px-2 py-0.5 rounded-lg">
                            {tpl.target === "parent" ? "أولياء الأمور" : "إدارة المدرسة"}
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-2.5">
                          {tpl.title_ar}
                        </h4>
                      </div>

                      {/* Smooth Toggle for Individual Template */}
                      <SmoothToggle
                        checked={isEnabled && masterSwitch}
                        onChange={() => handleToggleTemplate(tpl.name)}
                        disabled={!masterSwitch}
                        size="md"
                        isRTL={isRTL}
                        ariaLabel={`تبديل حالة قالب ${tpl.title_ar}`}
                      />
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                      {tpl.description_ar}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="text-slate-500 dark:text-slate-400">
                      <span>مرسلة: </span>
                      <b className="text-slate-900 dark:text-white font-mono">{tpl.total_sent}</b>
                      <span className="mx-1.5">|</span>
                      <span>فشل: </span>
                      <b className="text-rose-600 font-mono">{tpl.total_failed}</b>
                    </div>

                    <button
                      onClick={() => setPreviewTemplate(tpl)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark dark:text-brand-yellow hover:underline p-1"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>معاينة القالب</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- 4. Live WhatsApp Logs Table & Search --- */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Table Header & Filter Bar */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>سجل الإرسال والتسليم المباشر</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تحديث فوري لجميع الرسائل الصادرة ومعرفات الاستلام وحالات التسليم.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilterApply(undefined, undefined, searchTerm)}
                  placeholder="ابحث برقم الهاتف أو المعرف..."
                  className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-yellow focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  handleFilterApply(e.target.value, undefined, undefined);
                }}
                className="py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-yellow font-bold"
              >
                <option value="all">كافة الحالات</option>
                <option value="sent">مرسلة</option>
                <option value="delivered">تم التسليم</option>
                <option value="read">مقروءة</option>
                <option value="failed">تعثر الإرسال</option>
                <option value="skipped">تم التخطي</option>
              </select>

              {/* Template Filter (Arabic Template Names) */}
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  handleFilterApply(undefined, e.target.value, undefined);
                }}
                className="py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-yellow font-bold"
              >
                <option value="all">كافة القوالب المعتمدة</option>
                {templates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.title_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">المستلم ورقم الهاتف</th>
                  <th className="py-3.5 px-4">القالب المعتمد</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4">معرف الرسالة</th>
                  <th className="py-3.5 px-4">وقت الإرسال</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {logs.data.length > 0 ? (
                  logs.data.map((log) => {
                    const matchedTemplate = templates.find((t) => t.name === log.template_name);
                    const templateDisplayTitle = matchedTemplate ? matchedTemplate.title_ar : log.template_name;

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-slate-400 font-bold">{log.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono dir-ltr text-right">
                              {log.recipient_phone}
                            </span>
                            {log.recipient_name && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {log.recipient_name} ({log.recipient_type || "مستخدم"})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold">
                            {templateDisplayTitle}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(log.status)}
                          {log.error_message && (
                            <div className="text-[10px] text-rose-500 mt-1 max-w-xs truncate font-medium" title={log.error_message}>
                              {log.error_message}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {log.wamid ? (
                            <div className="flex items-center gap-1.5">
                              <span className="truncate max-w-[120px]" title={log.wamid}>
                                {log.wamid}
                              </span>
                              <button
                                onClick={() => copyToClipboard(log.wamid!, "معرف الرسالة")}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="نسخ المعرف"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                          {new Date(log.created_at).toLocaleString("ar-SA", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedLogForDetails(log)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="عرض تفاصيل الرسالة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {log.status === "failed" && (
                              <button
                                disabled={retryingLogId === log.id}
                                onClick={() => handleRetryMessage(log)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-50"
                                title="إعادة الإرسال الآن"
                              >
                                <RotateCcw className={`w-4 h-4 ${retryingLogId === log.id ? "animate-spin" : ""}`} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <span className="text-xs font-bold">لا توجد سجلات رسائل مطابقة لخيارات البحث.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logs.last_page > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                عرض {logs.from} إلى {logs.to} من أصل {logs.total} رسالة
              </span>

              <div className="flex items-center gap-1">
                {logs.links.map((link, idx) => (
                  <button
                    key={idx}
                    disabled={!link.url}
                    onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true, preserveState: true })}
                    className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all ${
                      link.active
                        ? "bg-brand-yellow text-brand-dark shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    } ${!link.url ? "opacity-30 cursor-not-allowed" : ""}`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- 5. Interactive WhatsApp Phone Mockup Modal --- */}
      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="bg-slate-900 rounded-[2.5rem] p-4 max-w-sm w-full shadow-2xl border-4 border-slate-800 text-white relative overflow-hidden"
            >
              {/* Phone Speaker Notch */}
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />

              {/* Mockup WhatsApp Header */}
              <div className="bg-emerald-800/90 rounded-2xl p-3 flex items-center justify-between text-white mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                    🚌
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">مسارات واصل الرسمية</h4>
                    <span className="text-[10px] text-emerald-200 block">حساب أعمال موثق</span>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Chat Bubble Body */}
              <div className="bg-[#0b141a] p-3 rounded-2xl space-y-3 min-h-[340px] max-h-[460px] overflow-y-auto">
                <div className="bg-[#1f2c34] rounded-2xl p-2.5 text-right space-y-2.5 shadow-md border border-slate-700/50">
                  {/* Header Image Preview */}
                  {previewTemplate.header_image && (
                    <div className="rounded-xl overflow-hidden border border-slate-700">
                      <img
                        src={previewTemplate.header_image}
                        alt={previewTemplate.title_ar}
                        className="w-full h-36 object-cover"
                      />
                    </div>
                  )}

                  {/* Body Text */}
                  <div className="text-xs leading-relaxed text-slate-100 whitespace-pre-line font-medium">
                    {previewTemplate.sample_body || previewTemplate.description_ar}
                  </div>

                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                    <span>12:00 م</span>
                    <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-3 text-center">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- 6. Log Details Modal --- */}
      <AnimatePresence>
        {selectedLogForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-right"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Info className="w-5 h-5 text-brand-yellow" />
                  <span>تفاصيل سجل الرسالة #{selectedLogForDetails.id}</span>
                </h3>
                <button
                  onClick={() => setSelectedLogForDetails(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="text-slate-400 block mb-1">المستلم:</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-slate-100 block dir-ltr text-right">
                      {selectedLogForDetails.recipient_phone}
                    </span>
                    {selectedLogForDetails.recipient_name && (
                      <span className="text-slate-500 block text-[11px] mt-0.5">
                        {selectedLogForDetails.recipient_name}
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="text-slate-400 block mb-1">الحالة الحالية:</span>
                    {getStatusBadge(selectedLogForDetails.status)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">القالب المستخدم:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {templates.find((t) => t.name === selectedLogForDetails.template_name)?.title_ar || selectedLogForDetails.template_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">نوع الحدث:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedLogForDetails.event_type || "تلقائي"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">معرف الرسالة:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 truncate max-w-[200px]" title={selectedLogForDetails.wamid || ""}>
                      {selectedLogForDetails.wamid || "غير متوفر"}
                    </span>
                  </div>
                </div>

                {selectedLogForDetails.error_message && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl text-rose-600 dark:text-rose-300">
                    <span className="font-bold block mb-1">سبب تعثر الإرسال:</span>
                    <p className="font-mono text-[11px] leading-relaxed break-all">
                      {selectedLogForDetails.error_message}
                    </p>
                  </div>
                )}

                {/* Parameters preview if available */}
                {selectedLogForDetails.parameters && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <span className="text-slate-400 block mb-2 font-bold">المتغيرات المرسلة مع القالب:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(selectedLogForDetails.parameters) ? (
                        selectedLogForDetails.parameters.map((param, i) => (
                          <span
                            key={i}
                            className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                          >
                            <span className="text-slate-400 font-mono text-[10px] ml-1">{`{{${i + 1}}}`}:</span>
                            {param}
                          </span>
                        ))
                      ) : (
                        <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                          {JSON.stringify(selectedLogForDetails.parameters, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedLogForDetails(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  إغلاق
                </button>
                {selectedLogForDetails.status === "failed" && (
                  <button
                    disabled={retryingLogId === selectedLogForDetails.id}
                    onClick={() => handleRetryMessage(selectedLogForDetails)}
                    className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${retryingLogId === selectedLogForDetails.id ? "animate-spin" : ""}`} />
                    <span>إعادة المحاولة الآن</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- 7. Test Message Sender Modal --- */}
      <AnimatePresence>
        {showTestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-right"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Send className="w-4 h-4 text-brand-yellow" />
                  <span>إرسال إشعار واتساب تجريبي</span>
                </h3>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendTest} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    رقم الهاتف المستلم (بالصيغة الدولية أو المحلية):
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="مثال: 775376507 أو 96877365677"
                      className="w-full pl-3 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-yellow focus:outline-none font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    يقوم النظام بتهيئة مفتاح الدولة تلقائياً وفق الرقم المدخل.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    القالب المعتمد للإرسال:
                  </label>
                  <select
                    value={testTemplate}
                    onChange={(e) => setTestTemplate(e.target.value)}
                    className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-yellow font-bold"
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.name} value={tpl.name}>
                        {tpl.title_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowTestModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingTest}
                    className="px-5 py-2 text-xs font-black bg-brand-yellow text-brand-dark rounded-xl hover:bg-yellow-400 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {isSendingTest ? "جاري الإرسال..." : "إرسال الآن"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthenticatedLayout>
  );
}
