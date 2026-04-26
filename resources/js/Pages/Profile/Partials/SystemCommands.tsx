import { useState } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Terminal,
  Activity,
  Cpu,
  ShieldAlert,
  Zap,
  RefreshCw,
  Database
} from "lucide-react";
import { useTheme } from "@/Contexts/ThemeContext";
import { DS_card, DS_divider } from "@/lib/DS";

export default function SystemCommands() {
  const { isRTL: isRtl } = useTheme();
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [output, setOutput] = useState<string>("");

  const commands = [
    {
      id: "git_pull",
      label: "Update Source",
      labelAr: "تحديث الكود",
      desc: "تحديث الأكواد من Github",
      icon: <RefreshCw className="w-5 h-5" />,
      color: "bg-blue-500",
    },
    {
      id: "composer_update",
      label: "Dependencies",
      labelAr: "تحديث المكتبات",
      desc: "تحديث مكتبات PHP",
      icon: <Zap className="w-5 h-5" />,
      color: "bg-purple-500",
    },
    {
      id: "migrate",
      label: "Database Update",
      labelAr: "تحديث القاعدة",
      desc: "ترحيل قواعد البيانات (بدون مسح)",
      icon: <Database className="w-5 h-5" />,
      color: "bg-amber-500",
    },
    {
      id: "clear_cache",
      label: "Optimize System",
      labelAr: "تحسين النظام",
      desc: "مسح الكاش المتراكم (Optimize)",
      icon: <Cpu className="w-5 h-5" />,
      color: "bg-emerald-500",
    },
    {
      id: "migrate_fresh_seed",
      label: "Factory Reset",
      labelAr: "إعادة ضبط المصنع",
      desc: "مسح شامل وإعادة بناء البيانات",
      icon: <ShieldAlert className="w-5 h-5" />,
      color: "bg-red-500",
      requiresConfirm: true,
    },
  ];

  const executeCommand = async (
    cmdId: string,
    requiresConfirm: boolean = false
  ) => {
    if (requiresConfirm) {
      if (
        !window.confirm(
          isRtl 
            ? "تحذير: هذا الخيار سيقوم بمسح جميع بيانات قاعدة البيانات الخاصة بك وإعادة بنائها ببيانات وهمية. هل أنت متأكد؟"
            : "Warning: This will delete ALL database data and rebuild it with fake data. Are you sure?"
        )
      ) {
        return;
      }
    }

    setIsRunning(cmdId);
    setOutput(isRtl ? "جاري التنفيذ... الرجاء الانتظار" : "Executing... Please wait");

    try {
      const response = await axios.post(route("admin.system.execute"), {
        command: cmdId,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setOutput(response.data.output || (isRtl ? "تم التنفيذ بدون مخرجات." : "Executed with no output."));
      } else {
        toast.error(response.data.message);
        setOutput((isRtl ? "خطأ: " : "Error: ") + response.data.message);
      }
    } catch (error: any) {
      toast.error(isRtl ? "حدث خطأ غير متوقع!" : "Unexpected error occurred!");
      setOutput(
        "Error: " + (error.response?.data?.message || (isRtl ? "فشل الاتصال بالخادم." : "Server connection failed."))
      );
    } finally {
      setIsRunning(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#0f2044] flex items-center justify-center text-[#f5b800] shadow-lg shadow-[#0f2044]/20">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0f2044] dark:text-white uppercase tracking-tighter">
              {isRtl ? "مركز تحكم النظام" : "System Control Center"}
            </h2>
            <p className="text-xs text-gray-500 font-bold dark:text-gray-400">
              {isRtl ? "أدوات الصيانة المتقدمة والتحكم في السيرفر" : "Advanced maintenance tools & server control"}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {commands.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => executeCommand(cmd.id, cmd.requiresConfirm)}
            disabled={isRunning !== null}
            className={`group p-5 rounded-[24px] border-2 transition-all duration-300 relative overflow-hidden flex flex-col items-start gap-4 ${
              isRunning === cmd.id
                ? "bg-[#0f2044]/5 border-[#f5b800] opacity-90 cursor-wait scale-[0.98]"
                : "bg-white dark:bg-[#1a2845] border-gray-100 dark:border-[#243460] hover:border-[#f5b800] hover:shadow-2xl hover:shadow-[#f5b800]/10 hover:-translate-y-1"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl ${cmd.color} flex items-center justify-center text-white shadow-lg shadow-black/10 group-hover:scale-110 transition-transform`}>
              {isRunning === cmd.id ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                cmd.icon
              )}
            </div>
            
            <div className="text-start space-y-1">
              <h3 className="font-black text-sm text-[#0f2044] dark:text-white">
                {isRtl ? cmd.labelAr : cmd.label}
              </h3>
              <p className="text-[10px] text-gray-500 font-bold dark:text-gray-400 uppercase tracking-widest">
                {cmd.id.replace('_', ' ')}
              </p>
            </div>

            {isRunning === cmd.id && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#f5b800]/20 text-[#f5b800] text-[8px] font-black uppercase tracking-tighter">
                    <div className="w-1 h-1 rounded-full bg-[#f5b800] animate-ping" />
                    Running
                </div>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Terminal className="w-3 h-3" />
                Terminal Logs Output
            </label>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-gray-400 uppercase">System Ready</span>
            </div>
        </div>
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0f2044] to-[#f5b800] rounded-[24px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#0a0a0a] rounded-[24px] p-6 h-72 border border-white/5 overflow-hidden shadow-inner">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#f5b800]/30 to-transparent"></div>
            <pre
              className="text-emerald-400/90 font-mono text-xs leading-relaxed h-full overflow-y-auto custom-scrollbar whitespace-pre-wrap"
              dir="ltr"
            >
              <span className="text-[#f5b800] opacity-50">$</span> {output || (isRtl ? "بانتظار أمر الإطلاق..." : "Waiting for command input...")}
              {isRunning && <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse" />}
            </pre>
          </div>
        </div>
      </div>
    </div>

  );
}
