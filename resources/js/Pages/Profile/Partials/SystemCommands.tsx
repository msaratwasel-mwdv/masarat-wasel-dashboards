import { useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Play,
  Download,
  Package,
  RefreshCw,
  RefreshCcw,
  Database,
  HardDrive,
  Terminal,
} from "lucide-react";

export default function SystemCommands() {
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [output, setOutput] = useState<string>("");

  const commands = [
    {
      id: "git_pull",
      label: "Git Pull",
      desc: "تحديث الأكواد من Github",
      icon: <Download className="w-5 h-5" />,
      color: "bg-blue-500",
    },
    {
      id: "composer_update",
      label: "Composer Update",
      desc: "تحديث مكتبات PHP",
      icon: <Package className="w-5 h-5" />,
      color: "bg-purple-500",
    },
    {
      id: "npm_build",
      label: "NPM Build",
      desc: "بناء واجهات React",
      icon: <RefreshCw className="w-5 h-5" />,
      color: "bg-green-500",
    },
    {
      id: "migrate",
      label: "Migrate",
      desc: "ترحيل قواعد البيانات (بدون مسح)",
      icon: <Database className="w-5 h-5" />,
      color: "bg-orange-500",
    },
    {
      id: "migrate_fresh_seed",
      label: "Fresh & Seed",
      desc: "مسح قاعدة البيانات وزرع البيانات وهمية",
      icon: <HardDrive className="w-5 h-5" />,
      color: "bg-red-500",
      requiresConfirm: true,
    },
    {
      id: "clear_cache",
      label: "Clear Cache",
      desc: "مسح الكاش المتراكم (Optimize)",
      icon: <RefreshCcw className="w-5 h-5" />,
      color: "bg-gray-500",
    },
  ];

  const executeCommand = async (
    cmdId: string,
    requiresConfirm: boolean = false
  ) => {
    if (requiresConfirm) {
      if (
        !window.confirm(
          "تحذير: هذا الخيار سيقوم بمسح جميع بيانات قاعدة البيانات الخاصة بك وإعادة بنائها ببيانات وهمية. هل أنت متأكد؟"
        )
      ) {
        return;
      }
    }

    setIsRunning(cmdId);
    setOutput("جاري التنفيذ... الرجاء الانتظار");

    try {
      const response = await axios.post(route("admin.system.execute"), {
        command: cmdId,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setOutput(response.data.output || "تم التنفيذ بدون مخرجات.");
      } else {
        toast.error(response.data.message);
        setOutput("خطأ: " + response.data.message);
      }
    } catch (error: any) {
      toast.error("حدث خطأ غير متوقع!");
      setOutput(
        "Error: " + (error.response?.data?.message || "فشل الاتصال بالخادم.")
      );
    } finally {
      setIsRunning(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mt-8 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white">
          <Terminal className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            أدوات التطوير (Deploy Tools)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            أزرار سريعة للتحكم بصيانة الخادم ورفع التحديثات بضغطة زر
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {commands.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => executeCommand(cmd.id, cmd.requiresConfirm)}
            disabled={isRunning !== null}
            className={`relative overflow-hidden group p-4 rounded-xl border flex items-center gap-4 transition-all
              ${
                isRunning === cmd.id
                  ? "border-gray-300 bg-gray-50 opacity-80 cursor-wait cursor-not-allowed"
                  : "border-gray-200 dark:border-gray-700 hover:border-brand-yellow hover:shadow-md bg-gray-50 dark:bg-gray-900"
              }
              ${
                isRunning && isRunning !== cmd.id
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            `}
          >
            <div
              className={`w-12 h-12 rounded-lg ${cmd.color} flex items-center justify-center text-white shrink-0 shadow-sm`}
            >
              {isRunning === cmd.id ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                cmd.icon
              )}
            </div>
            <div className="text-right flex-1 min-w-0" dir="rtl">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                {cmd.label}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {cmd.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="relative mt-4">
        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block text-right">
          مخرجات الـ Terminal (Logs)
        </label>
        <div className="bg-[#1e1e1e] rounded-xl p-4 h-64 overflow-y-auto">
          <pre
            className="text-green-400 font-mono text-sm whitespace-pre-wrap text-left break-words"
            dir="ltr"
          >
            {output || "$ بانتظار أمر الإطلاق..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
