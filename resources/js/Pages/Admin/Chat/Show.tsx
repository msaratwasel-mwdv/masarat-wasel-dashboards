import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import Modal from "@/Components/Modal";
import useTranslation from "@/hooks/useTranslation";
import { 
    ChevronRight, 
    ChevronLeft, 
    ShieldAlert, 
    Trash2, 
    Clock, 
    MessageCircle, 
    Users,
    School as SchoolIcon,
    AlertTriangle,
    Zap,
    Info,
    ArrowLeft
} from "lucide-react";
import { 
    DS_pageWrapper, 
    DS_card, 
    DS_modalContainer, 
    DS_modalHeader, 
    DS_modalHeaderTitle, 
    DS_modalHeaderAccent, 
    DS_modalClose, 
    DS_modalBody, 
    DS_modalFooter,
    DS_btnSecondary,
    DS_btnPrimary,
    DS_label,
    DS_input
} from "@/lib/DS";

interface Participant {
  id: number;
  name: string;
  role: string;
}

interface MessageItem {
  id: number;
  body: string;
  type: string;
  sender: {
    id: number;
    name: string;
    role: string;
  };
  created_at: string;
  deleted_at: string | null;
}

interface ConversationDetail {
  id: number;
  type: string;
  title: string | null;
  school: { id: number; name: string } | null;
  participants: Participant[];
}

interface Props {
  auth: any;
  conversation: ConversationDetail;
  messages: {
    data: MessageItem[];
    current_page: number;
    last_page: number;
    total: number;
  };
}

export default function Show({ auth, conversation, messages }: Props) {
  const { isRTL, theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<Participant | null>(null);

  const alertForm = useForm({ alert_message: "" });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "parent": return "bg-blue-500";
      case "driver": return "bg-emerald-500";
      case "supervisor": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "parent": return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300";
      case "driver": return "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300";
      case "supervisor": return "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300";
      default: return "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getRoleLabel = (role: string) => {
    if (!isRTL) return role;
    switch (role) {
      case "parent": return "ولي أمر";
      case "driver": return "سائق";
      case "supervisor": return "مشرفة";
      default: return role;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(isRTL ? "ar-SA" : "en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatTimeOnly = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(isRTL ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const handleDeleteMessage = () => {
    if (!selectedMessage) return;
    router.delete(route("admin.chat.messages.destroy", selectedMessage.id), {
      onSuccess: () => {
        setShowDeleteModal(false);
        setSelectedMessage(null);
      },
    });
  };

  const handleAlertUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    alertForm.post(route("admin.chat.alert", selectedUser.id), {
      onSuccess: () => {
        setShowAlertModal(false);
        setSelectedUser(null);
        alertForm.reset();
      },
    });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: MessageItem[] }[] = [];
  let currentGroup: { date: string; messages: MessageItem[] } | null = null;

  messages.data.forEach((msg) => {
    const msgDate = new Date(msg.created_at).toLocaleDateString(
      isRTL ? "ar-SA" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
    if (!currentGroup || currentGroup.date !== msgDate) {
      currentGroup = { date: msgDate, messages: [] };
      groupedMessages.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  });

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('Conversation Intercept')} />

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Intelligence Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100 dark:border-[#243460]">
            <div className="flex items-center gap-4">
                <Link
                    href={route("admin.chat.index")}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-[#0f2044] shadow-sm border border-gray-100 dark:border-white/5 flex items-center justify-center text-[#0f2044] dark:text-[#f5b800] hover:scale-105 transition-all"
                >
                    {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </Link>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-[#0f2044] dark:text-white tracking-tight">
                        {isRTL ? 'رصد المحادثة' : 'Relay Intercept'}
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            ID: #{conversation.id} • {isRTL ? 'مراقبة حية' : 'Live Monitoring'}
                        </span>
                    </div>
                </div>
            </div>

            {conversation.school && (
                <div className="flex items-center gap-3 bg-[#0f2044]/5 dark:bg-[#0f2044]/40 px-4 py-2.5 rounded-[1.25rem] border border-[#0f2044]/10 dark:border-white/5">
                    <div className="w-8 h-8 bg-[#0f2044] text-[#f5b800] rounded-lg flex items-center justify-center shadow-lg">
                        <SchoolIcon size={16} />
                    </div>
                    <span className="text-sm font-black text-[#0f2044] dark:text-gray-300">
                        {conversation.school.name}
                    </span>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Chat Interface */}
            <div className="lg:col-span-8 space-y-6">
                <div className={`${DS_card} flex flex-col h-[70vh] shadow-2xl relative`}>
                    {/* Glass Overlay for header */}
                    <div className="p-4 border-b border-gray-100 dark:border-[#243460] bg-gray-50/50 dark:bg-[#0f2044]/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {conversation.participants.slice(0, 3).map((p, i) => (
                                    <div key={p.id} className={`w-8 h-8 rounded-full border-2 border-white dark:border-[#1a2845] ${getRoleColor(p.role)} flex items-center justify-center text-white text-[10px] font-black shadow-lg relative z-[${10-i}]`}>
                                        {p.name.charAt(0)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs font-black text-[#0f2044] dark:text-gray-300 uppercase tracking-wider">
                                {conversation.participants.length} {isRTL ? 'عضو في المحادثة' : 'Operatives Embedded'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-800/30">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Secure Relay</span>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-gray-50/30 dark:bg-transparent">
                        {groupedMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                                <MessageCircle size={64} className="text-gray-400" />
                                <p className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">{isRTL ? 'لا توجد رسائل مسجلة' : 'No Transmission Recorded'}</p>
                            </div>
                        ) : (
                            groupedMessages.map((group, gIdx) => (
                                <div key={gIdx} className="space-y-6">
                                    <div className="flex items-center justify-center">
                                        <span className="px-5 py-1.5 bg-[#0f2044] text-[#f5b800] rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                                            {group.date}
                                        </span>
                                    </div>

                                    <div className="space-y-6">
                                        {group.messages.map((msg) => (
                                            <div key={msg.id} className={`flex items-start gap-4 group ${msg.deleted_at ? 'opacity-40 grayscale' : ''}`}>
                                                <div className={`w-10 h-10 rounded-[14px] ${getRoleColor(msg.sender.role)} flex items-center justify-center text-white font-black shadow-lg shadow-${msg.sender.role === 'parent' ? 'blue' : 'emerald'}-500/20`}>
                                                    {msg.sender.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-[#0f2044] dark:text-white uppercase tracking-tight">{msg.sender.name}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${getRoleBadge(msg.sender.role)}`}>
                                                            {getRoleLabel(msg.sender.role)}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 ml-auto flex items-center gap-1">
                                                            <Clock size={10} />
                                                            {formatTimeOnly(msg.created_at)}
                                                        </span>
                                                    </div>
                                                    <div className={`p-4 rounded-[1.25rem] rounded-tl-none text-sm leading-relaxed relative ${
                                                        msg.deleted_at 
                                                        ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30' 
                                                        : 'bg-white dark:bg-[#0f2044]/30 text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-white/5'
                                                    }`}>
                                                        {msg.deleted_at ? (
                                                            <div className="flex items-center gap-2 italic">
                                                                <Trash2 size={12} />
                                                                {isRTL ? "تم حذف الرسالة لدواعي أمنية" : "Transmission redacted by Admin"}
                                                            </div>
                                                        ) : msg.body}

                                                        {/* Hover Actions */}
                                                        {!msg.deleted_at && (
                                                            <button 
                                                                onClick={() => { setSelectedMessage(msg); setShowDeleteModal(true); }}
                                                                className="absolute -right-10 top-2 p-2 bg-rose-50 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Stats Footer */}
                    <div className="p-4 bg-gray-50/50 dark:bg-[#0f2044]/40 border-t border-gray-100 dark:border-[#243460] flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><MessageCircle size={12} /> {messages.total} {isRTL ? 'رسالة' : 'Packets'}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="flex items-center gap-1.5"><Users size={12} /> {conversation.participants.length} {isRTL ? 'عضو' : 'Nodes'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Controls */}
            <div className="lg:col-span-4 space-y-6">
                <div className={`${DS_card} p-6 space-y-6`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={18} className="text-[#f5b800]" />
                        <h3 className="text-sm font-black text-[#0f2044] dark:text-white uppercase tracking-wider">{isRTL ? 'أطراف المحادثة' : 'Operative Roster'}</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {conversation.participants.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#0f2044]/30 border border-transparent hover:border-[#f5b800]/20 transition-all group/user">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl ${getRoleColor(p.role)} flex items-center justify-center text-white font-black shadow-lg`}>
                                        {p.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-[#0f2044] dark:text-white">{p.name}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${getRoleBadge(p.role)} px-1 rounded w-fit mt-0.5`}>
                                            {getRoleLabel(p.role)}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setSelectedUser(p); setShowAlertModal(true); }}
                                    className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                    title={isRTL ? 'إرسال تنبيه إداري' : 'Signal Alert'}
                                >
                                    <ShieldAlert size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-[#243460] space-y-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">{isRTL ? 'صلاحيات الإدارة' : 'Admin Protocol'}</p>
                                    <p className="text-[10px] text-amber-700 dark:text-amber-500/80 leading-relaxed font-bold">
                                        {isRTL 
                                            ? "بصفتك مسؤولاً، يمكنك رصد كافة المحادثات وحذف أي محتوى مخالف أو إرسال تنبيهات إدارية مباشرة للمشاركين." 
                                            : "As an admin, you have full visibility. You may redact content or signal direct alerts to operatives."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- Delete Message Confirmation Modal --- */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className={DS_modalContainer}>
          <div className={DS_modalHeader(isRTL)}>
            <div className="flex items-center gap-3">
              <div className={DS_modalHeaderAccent} />
              <h3 className={DS_modalHeaderTitle}>{isRTL ? 'تأكيد الحذف' : 'Redaction Protocol'}</h3>
            </div>
            <button onClick={() => setShowDeleteModal(false)} className={DS_modalClose}>
              <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
            </button>
          </div>
          
          <div className={`${DS_modalBody} text-center py-10`}>
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-inner">
                <Trash2 size={40} />
            </div>
            <h4 className="text-xl font-black text-[#0f2044] dark:text-white mb-2">{isRTL ? 'هل أنت متأكد من الحذف؟' : 'Confirm Redaction?'}</h4>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                {isRTL 
                    ? "هل أنت متأكد من حذف هذه الرسالة؟ سيتم استبدال المحتوى بنص إداري تحذيري." 
                    : "Are you sure you want to redact this transmission? The content will be replaced with an admin placeholder."}
            </p>
            
            {selectedMessage && (
                <div className="mt-8 p-4 bg-gray-50 dark:bg-[#0f2044]/30 rounded-2xl border border-dashed border-gray-200 dark:border-white/5 text-start">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{selectedMessage.sender.name}</p>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 italic">{selectedMessage.body}</p>
                </div>
            )}
          </div>

          <div className={DS_modalFooter(isRTL)}>
            <button onClick={() => setShowDeleteModal(false)} className={DS_btnSecondary}>
              {isRTL ? 'إلغاء' : 'Abort'}
            </button>
            <button 
                onClick={handleDeleteMessage}
                className="px-8 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-black shadow-lg shadow-rose-600/20 transition-all active:scale-95"
            >
              {isRTL ? 'حذف الرسالة' : 'Finalize Redaction'}
            </button>
          </div>
        </div>
      </Modal>

      {/* --- Signal Alert Modal --- */}
      <Modal show={showAlertModal} onClose={() => setShowAlertModal(false)}>
        <div className={DS_modalContainer}>
          <div className={DS_modalHeader(isRTL)}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-amber-400 rounded-full" />
              <h3 className={DS_modalHeaderTitle}>{isRTL ? 'إرسال تنبيه إداري' : 'Signal Alert'}</h3>
            </div>
            <button onClick={() => setShowAlertModal(false)} className={DS_modalClose}>
                <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
            </button>
          </div>

          <form onSubmit={handleAlertUser}>
            <div className={DS_modalBody}>
                <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 mb-4">
                    <div className={`w-12 h-12 rounded-xl ${getRoleColor(selectedUser?.role || '')} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                        {selectedUser?.name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">{isRTL ? 'المستلم' : 'Target Operative'}</p>
                        <p className="text-sm font-black text-[#0f2044] dark:text-white">{selectedUser?.name}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className={DS_label}>{isRTL ? 'نص التنبيه' : 'Alert Transmission'}</label>
                    <textarea
                        value={alertForm.data.alert_message}
                        onChange={(e) => alertForm.setData("alert_message", e.target.value)}
                        rows={4}
                        required
                        placeholder={isRTL ? "أدخل تفاصيل التنبيه الإداري هنا..." : "Enter transmission details..."}
                        className={DS_input}
                    />
                </div>
            </div>

            <div className={DS_modalFooter(isRTL)}>
                <button type="button" onClick={() => setShowAlertModal(false)} className={DS_btnSecondary}>
                    {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                    type="submit" 
                    disabled={alertForm.processing}
                    className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-black shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {alertForm.processing ? (isRTL ? 'جاري الإرسال...' : 'Syncing...') : (isRTL ? 'إرسال التنبيه' : 'Broadcast Alert')}
                </button>
            </div>
          </form>
        </div>
      </Modal>

    </AuthenticatedLayout>
  );
}
