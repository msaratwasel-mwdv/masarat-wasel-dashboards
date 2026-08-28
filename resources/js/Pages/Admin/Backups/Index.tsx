import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Download,
  Trash2,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  FileArchive,
  Layers,
  ShieldCheck,
  Calendar,
  Sparkles,
  Server,
  FolderArchive,
  ArrowDownToLine,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import useTranslation from "@/hooks/useTranslation";

interface BackupItem {
  file_name: string;
  path: string;
  size_raw: number;
  size_formatted: string;
  created_at: string;
  created_at_human: string;
  created_at_formatted: string;
}

interface Props {
  backups: BackupItem[];
  stats: {
    total_count: number;
    total_size: string;
    last_backup_date: string;
    last_backup_formatted: string;
    backup_name: string;
    disk_name: string;
  };
}

export default function BackupsIndex({ backups, stats }: Props) {
  const { t, isRTL } = useTranslation();

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isFullBackup, setIsFullBackup] = useState(false); // Toggle: false = DB Only, true = Full (DB + Storage)
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // Trigger manual backup
  const handleCreateBackup = () => {
    setIsCreatingBackup(true);
    router.post(
      route("admin.backups.store"),
      { only_db: !isFullBackup },
      {
        preserveScroll: true,
        onSuccess: () => {
          setIsCreatingBackup(false);
          toast.success(
            isFullBackup
              ? "تم إنشاء النسخة الشاملة (قاعدة البيانات والمرفقات) بنجاح!"
              : "تم إنشاء نسخة قاعدة البيانات بنجاح!"
          );
        },
        onError: () => {
          setIsCreatingBackup(false);
          toast.error("فشل إنشاء النسخة الاحتياطية. يرجى مراجعة سجلات الخادم.");
        },
      }
    );
  };

  // Delete Backup
  const handleDeleteBackup = (fileName: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف النسخة الاحتياطية (${fileName})؟`)) {
      return;
    }

    setDeletingFile(fileName);
    router.delete(route("admin.backups.destroy", fileName), {
      preserveScroll: true,
      onSuccess: () => {
        setDeletingFile(null);
        toast.success("تم حذف النسخة الاحتياطية بنجاح");
      },
      onError: () => {
        setDeletingFile(null);
        toast.error("حدث خطأ أثناء حذف الملف");
      },
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-2xl text-gray-800 dark:text-gray-100 flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-brand-yellow/10 text-brand-dark dark:text-brand-yellow border border-brand-yellow/20">
                <Database className="w-6 h-6" />
              </span>
              <span>النسخ الاحتياطي الدوري للنظام</span>
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-3 py-1 rounded-full">
                Spatie Engine Active
              </span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              إدارة وأرشفة نسخ قاعدة البيانات والمرفقات دورياً مع إمكانية التنزيل المباشر للكمبيوتر.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.reload({ preserveScroll: true })}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
              title="تحديث القائمة"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      }
    >
      <Head title="النسخ الاحتياطي للنظام | مسارات واصل" />

      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* --- 1. Top Statistics Bento Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200/80 dark:border-gray-700 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
              <span className="text-xs font-semibold">إجمالي النسخ المتوفرة</span>
              <Layers className="w-4 h-4 text-brand-dark/40 dark:text-gray-400" />
            </div>
            <div className="text-3xl font-black text-gray-900 dark:text-white font-mono mt-3">
              {stats.total_count}
            </div>
            <span className="text-xs text-gray-400 mt-1 block">أرشيف محفوظ ومفهرس</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200/80 dark:border-gray-700 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
              <span className="text-xs font-semibold">المساحة المستهلكة</span>
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono mt-3">
              {stats.total_size}
            </div>
            <span className="text-xs text-gray-400 mt-1 block">ملفات ZIP مضغوطة</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200/80 dark:border-gray-700 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-xs font-semibold">آخر عملية نسخ ناجحة</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white mt-3 truncate">
              {stats.last_backup_date}
            </div>
            <span className="text-xs text-gray-400 mt-1 block font-mono">
              {stats.last_backup_formatted}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200/80 dark:border-gray-700 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span className="text-xs font-semibold">الجدولة التلقائية</span>
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white mt-3">
              يومياً 02:00 ص
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 block font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" /> مجدول آلياً في السيرفر
            </span>
          </motion.div>
        </div>

        {/* --- 2. Interactive Action Card with Sleek Toggle --- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-brand-dark via-gray-900 to-brand-navy rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 relative overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-yellow/20 text-brand-yellow text-xs font-bold border border-brand-yellow/30">
                <ShieldCheck className="w-4 h-4" />
                <span>حماية وتأمين بيانات المنظومة (Disaster Recovery)</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                أخذ نسخة احتياطية فورية عند الطلب
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                حدد نوع النسخة التي ترغب بإنشائها، ثم اضغط على زر البدء. يتم تفريغ الجداول وضغط الأرشيف فوراً مع تطبيق سياسة حذف النسخ الأقدم من 7 أيام لتوفير المساحة.
              </p>
            </div>

            {/* Interactive Control & Toggle Box */}
            <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex flex-col gap-4 w-full lg:w-auto min-w-[320px]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">
                    {isRTL ? "تضمين المرفقات والصور:" : "Include Media & Attachments:"}
                  </span>
                  <span className="text-[11px] text-gray-300 font-medium">
                    {isFullBackup
                      ? (isRTL ? "شامل (قاعدة البيانات + الصور والمرفقات)" : "Full (Database + Media Files)")
                      : (isRTL ? "قاعدة البيانات فقط (سريع وخفيف)" : "Database Only (Fast & Lightweight)")}
                  </span>
                </div>

                {/* Sleek Bulletproof Toggle Switch */}
                <button
                  type="button"
                  dir="ltr"
                  onClick={() => setIsFullBackup(!isFullBackup)}
                  className={`relative inline-flex h-7 w-13 items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer flex-shrink-0 ${
                    isFullBackup ? "bg-brand-yellow" : "bg-gray-700/80 border border-gray-600"
                  }`}
                  role="switch"
                  aria-checked={isFullBackup}
                >
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 600, damping: 35 }}
                    className={`h-6 w-6 rounded-full shadow-md flex items-center justify-center ${
                      isFullBackup
                        ? "bg-brand-dark text-brand-yellow ml-auto"
                        : "bg-white text-gray-400 mr-auto"
                    }`}
                  >
                    {isFullBackup && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </motion.div>
                </button>
              </div>

              {/* Run Backup Button */}
              <button
                disabled={isCreatingBackup}
                onClick={handleCreateBackup}
                className="w-full py-3 px-6 rounded-xl font-bold text-sm bg-brand-yellow text-brand-dark hover:bg-yellow-400 transition-all shadow-lg active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCreatingBackup ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isRTL ? "جاري أخذ النسخة وضغطها..." : "Creating Backup..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isFullBackup
                        ? (isRTL ? "بدء النسخ الشامل الآن" : "Start Full Backup Now")
                        : (isRTL ? "بدء نسخ قاعدة البيانات الآن" : "Start DB Backup Now")}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* --- 3. Backups List Table --- */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-brand-yellow" />
                <span>أرشيف النسخ الاحتياطية المحفوظة</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                يمكنك تحميل أي نسخة احتياطية مباشرة إلى جهاز الكمبيوتر الخاص بك بضغطة زر.
              </p>
            </div>

            <span className="text-xs font-mono font-bold bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-xl text-gray-700 dark:text-gray-300">
              مسار التخزين: storage/app/{stats.backup_name}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50/80 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="py-4 px-6">اسم ملف الأرشيف</th>
                  <th className="py-4 px-6">حجم الملف</th>
                  <th className="py-4 px-6">تاريخ ووقت الإنشاء</th>
                  <th className="py-4 px-6">منذ</th>
                  <th className="py-4 px-6 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {backups.length > 0 ? (
                  backups.map((backup) => (
                    <tr
                      key={backup.file_name}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            <FileArchive className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-gray-900 dark:text-gray-100 font-mono text-xs">
                            {backup.file_name}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg">
                          {backup.size_formatted}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-mono text-gray-600 dark:text-gray-400">
                        {backup.created_at_formatted}
                      </td>

                      <td className="py-4 px-6 text-gray-500 dark:text-gray-400">
                        {backup.created_at_human}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {/* Download Button */}
                          <a
                            href={route("admin.backups.download", backup.file_name)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-all shadow-sm active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تحميل</span>
                          </a>

                          {/* Delete Button */}
                          <button
                            disabled={deletingFile === backup.file_name}
                            onClick={() => handleDeleteBackup(backup.file_name)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-gray-400">
                      <Database className="w-12 h-12 mx-auto mb-3 opacity-30 text-brand-dark dark:text-white" />
                      <p className="text-base font-bold text-gray-700 dark:text-gray-300">
                        لا توجد نسخ احتياطية محفوظة حتى الآن
                      </p>
                      <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                        استخدم مفتاح التحكم بالأعلى لبدء إنشاء أول نسخة احتياطية لقاعدة البيانات.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
