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
    ArrowLeft,
    X as LucideX,
    FileText,
    MessageSquare
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-5">
                <Link
                    href={route("admin.chat.index")}
                    className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0f2044] shadow-xl border border-gray-100 dark:border-white/5 flex items-center justify-center text-[#0f2044] dark:text-[#f5b800] hover:scale-110 transition-all active:scale-95 group"
                >
                    {isRTL ? <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" /> : <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />}
                </Link>
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black text-[#0f2044] dark:text-white tracking-tight">
                        {isRTL ? 'رصد تدفق المحادثة' : 'Mission Stream Intercept'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-[#f5b800] rounded-full animate-pulse shadow-[0_0_8px_rgba(245,184,0,0.8)]" />
                            <span className="text-[10px] font-black text-[#f5b800] uppercase tracking-[0.2em]">{isRTL ? 'رصد مباشر' : 'LIVE FEED'}</span>
                        </div>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em]">
                            CH_ID: {conversation.id} • {conversation.participants.length} Operatives
                        </span>
                    </div>
                </div>
            </div>

            {conversation.school && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-[#0f2044] to-[#1e293b] px-6 py-3 rounded-2xl border border-white/5 shadow-2xl group">
                    <div className="w-10 h-10 bg-white/10 text-[#f5b800] rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                        <SchoolIcon size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isRTL ? 'الوحدة التعليمية' : 'Operational Unit'}</span>
                        <span className="text-sm font-black text-white">
                            {conversation.school.name}
                        </span>
                    </div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Chat Interface */}
            <div className="lg:col-span-8 space-y-6">
                <div className={`${DS_card} flex flex-col h-[75vh] shadow-2xl relative overflow-hidden border-none`}>
                    
                    {/* Header Overlay */}
                    <div className="p-5 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#0f2044]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {conversation.participants.slice(0, 4).map((p, i) => (
                                    <div key={p.id} className={`w-10 h-10 rounded-2xl border-4 border-white dark:border-[#1a2845] ${getRoleColor(p.role)} flex items-center justify-center text-white text-xs font-black shadow-xl relative transition-transform hover:-translate-y-1`} style={{ zIndex: 10 - i }}>
                                        {p.name.charAt(0)}
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-[#0f2044] dark:text-white uppercase tracking-wider">
                                    {isRTL ? `شبكة تضم ${conversation.participants.length} عضو` : `Network: ${conversation.participants.length} Nodes`}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">End-to-End Encrypted</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-xl text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border border-gray-100 dark:border-white/5">
                                {isRTL ? 'قناة مؤمنة' : 'Secure Channel'}
                             </span>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/20 dark:bg-transparent">
                        {groupedMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                                <div className="w-24 h-24 bg-gray-200 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center">
                                    <MessageCircle size={48} className="text-gray-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-black text-gray-500 uppercase tracking-[0.3em]">{isRTL ? 'انتظار البيانات' : 'Awaiting Uplink'}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isRTL ? 'لا يوجد نشاط مسجل في هذه القناة' : 'No transmission data present in local cache'}</p>
                                </div>
                            </div>
                        ) : (
                            groupedMessages.map((group, gIdx) => (
                                <div key={gIdx} className="space-y-8">
                                    <div className="flex items-center justify-center relative">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-white/5"></div></div>
                                        <span className="relative px-6 py-2 bg-white dark:bg-[#0f2044] text-[#0f2044] dark:text-[#f5b800] border border-gray-100 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] shadow-xl">
                                            {group.date}
                                        </span>
                                    </div>

                                    <div className="space-y-8">
                                        {group.messages.map((msg) => (
                                            <div key={msg.id} className={`flex items-start gap-5 group transition-all ${msg.deleted_at ? 'opacity-30' : ''}`}>
                                                <div className={`w-12 h-12 rounded-2xl ${getRoleColor(msg.sender.role)} flex items-center justify-center text-white font-black text-lg shadow-2xl relative ring-4 ring-white dark:ring-[#1a2845] transform transition-transform group-hover:scale-110`}>
                                                    {msg.sender.name.charAt(0)}
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#1a2845] shadow-lg" />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-black text-[#0f2044] dark:text-white tracking-tight">{msg.sender.name}</span>
                                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter border shadow-sm ${getRoleBadge(msg.sender.role)}`}>
                                                            {getRoleLabel(msg.sender.role)}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 ml-auto bg-gray-100/50 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                                            <Clock size={10} />
                                                            {formatTimeOnly(msg.created_at)}
                                                        </div>
                                                    </div>
                                                    <div className={`p-5 rounded-[1.75rem] rounded-tl-none text-sm leading-relaxed relative group/msg transition-all ${
                                                        msg.deleted_at 
                                                        ? 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 italic' 
                                                        : 'bg-white dark:bg-[#1a2845]/40 text-gray-700 dark:text-gray-200 shadow-xl shadow-gray-200/20 dark:shadow-none border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-[#1a2845]/60'
                                                    }`}>
                                                        {msg.deleted_at ? (
                                                            <div className="flex items-center gap-3">
                                                                <Trash2 size={14} className="opacity-50" />
                                                                <span>{isRTL ? "تم حذف المحتوى لدواعي إدارية" : "Relay content redacted by Admin Command"}</span>
                                                            </div>
                                                        ) : msg.body}

                                                        {/* Actions Button */}
                                                        {!msg.deleted_at && (
                                                            <div className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover/msg:opacity-100 transition-opacity`}>
                                                                <button 
                                                                    onClick={() => { setSelectedMessage(msg); setShowDeleteModal(true); }}
                                                                    className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-90 shadow-lg"
                                                                    title={t('Redact')}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
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
                    <div className="p-6 bg-white dark:bg-[#0f2044]/80 border-t border-gray-100 dark:border-white/5 backdrop-blur-md flex items-center justify-between sticky bottom-0 z-20">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{isRTL ? 'إجمالي الرسائل' : 'Packet Flow'}</span>
                                <span className="text-sm font-black text-[#0f2044] dark:text-white flex items-center gap-2">
                                    <MessageCircle size={14} className="text-[#f5b800]" />
                                    {messages.total}
                                </span>
                            </div>
                            <div className="w-px h-8 bg-gray-100 dark:border-white/5" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{isRTL ? 'المشاركون' : 'Nodes Active'}</span>
                                <span className="text-sm font-black text-[#0f2044] dark:text-white flex items-center gap-2">
                                    <Users size={14} className="text-[#f5b800]" />
                                    {conversation.participants.length}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{isRTL ? 'بث حي' : 'STREAMING LIVE'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Controls */}
            <div className="lg:col-span-4 space-y-6">
                <div className={`${DS_card} p-8 space-y-8 border-none shadow-2xl`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#0f2044] text-[#f5b800] rounded-xl flex items-center justify-center shadow-lg">
                                <Users size={20} />
                            </div>
                            <h3 className="text-sm font-black text-[#0f2044] dark:text-white uppercase tracking-wider">{isRTL ? 'قائمة المشاركين' : 'Network Map'}</h3>
                        </div>
                        <span className="px-3 py-1 bg-gray-50 dark:bg-white/5 text-[10px] font-black text-[#f5b800] rounded-full border border-gray-100 dark:border-white/5">
                            {conversation.participants.length}
                        </span>
                    </div>
                    
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                        {conversation.participants.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-4 rounded-[1.25rem] bg-gray-50/50 dark:bg-[#1a2845]/30 border border-transparent hover:border-[#f5b800]/30 hover:bg-white dark:hover:bg-[#1a2845]/50 transition-all group/user shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-2xl ${getRoleColor(p.role)} flex items-center justify-center text-white font-black text-lg shadow-xl group-hover/user:scale-105 transition-transform`}>
                                        {p.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-[#0f2044] dark:text-white group-hover/user:text-[#f5b800] transition-colors">{p.name}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${getRoleBadge(p.role)} px-2 py-0.5 rounded-lg w-fit mt-1 shadow-sm`}>
                                            {getRoleLabel(p.role)}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setSelectedUser(p); setShowAlertModal(true); }}
                                    className="p-2.5 text-gray-400 hover:text-[#f5b800] hover:bg-[#f5b800]/10 dark:hover:bg-[#f5b800]/20 rounded-xl transition-all active:scale-90 group-hover/user:opacity-100"
                                    title={isRTL ? 'إرسال تنبيه إداري' : 'Signal Alert'}
                                >
                                    <ShieldAlert size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-gray-100 dark:border-white/5 space-y-6">
                        <div className="p-6 bg-gradient-to-br from-amber-500/5 to-amber-500/10 dark:from-amber-500/5 dark:to-transparent rounded-[2rem] border border-amber-500/10 relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#f5b800]/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-1000" />
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="w-10 h-10 bg-[#f5b800] text-[#0f2044] rounded-xl flex items-center justify-center shadow-lg shadow-[#f5b800]/20">
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#f5b800] uppercase tracking-[0.25em]">{isRTL ? 'إدارة الشبكة' : 'COMMAND PROTOCOL'}</p>
                                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed font-bold">
                                        {isRTL 
                                            ? "نظام الرصد يمنحك صلاحيات الإشراف المباشر على كافة القنوات. يمكنك رصد التجاوزات والتدخل الفوري عبر حذف الرسائل أو إرسال إنذارات رقمية." 
                                            : "Mission Control provides full visibility. You have authorization to redact any transmission or broadcast direct alerts to operatives."}
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
        <div className="flex flex-col overflow-hidden shadow-2xl rounded-[2rem]">
          <div className="px-8 py-6 bg-[#0f2044] flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-rose-500 flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">{isRTL ? 'تأكيد الحذف الإداري' : 'Admin Redaction'}</h3>
                <p className="text-[10px] font-black text-blue-100 opacity-60 uppercase tracking-widest">{isRTL ? 'إجراء غير قابل للتراجع' : 'IRREVERSIBLE ACTION'}</p>
              </div>
            </div>
            <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <LucideX size={24} />
            </button>
          </div>
          
          <div className="p-10 bg-white dark:bg-[#111827] text-center space-y-6">
            <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-rose-500 shadow-inner">
                <Trash2 size={48} className="animate-pulse" />
            </div>
            <div className="space-y-2">
                <h4 className="text-2xl font-black text-[#0f2044] dark:text-white tracking-tight">{isRTL ? 'هل أنت متأكد من الحذف؟' : 'Finalize Redaction?'}</h4>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                    {isRTL 
                        ? "سيتم حذف محتوى الرسالة نهائياً واستبدالها بتنبيه إداري في سجل المحادثة لجميع الأطراف." 
                        : "The message content will be permanently purged and replaced with an administrative placeholder for all nodes."}
                </p>
            </div>
            
            {selectedMessage && (
                <div className="mt-8 p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-100 dark:border-white/5 text-start relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-3 opacity-5"><MessageSquare size={80} /></div>
                    <p className="text-[10px] font-black text-[#f5b800] uppercase tracking-[0.2em] mb-2">{selectedMessage.sender.name}</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 italic relative z-10">"{selectedMessage.body}"</p>
                </div>
            )}
          </div>

          <div className="px-8 py-6 bg-gray-50 dark:bg-[#0f172a] border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
            <button onClick={() => setShowDeleteModal(false)} className={DS_btnSecondary}>
              {isRTL ? 'تجاهل' : 'Dismiss'}
            </button>
            <button 
                onClick={handleDeleteMessage}
                className="px-10 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-sm font-black shadow-xl shadow-rose-600/20 transition-all active:scale-95 flex items-center gap-3"
            >
              <Trash2 size={16} />
              {isRTL ? 'تأكيد الحذف' : 'EXECUTE PURGE'}
            </button>
          </div>
        </div>
      </Modal>

      {/* --- Signal Alert Modal --- */}
      <Modal show={showAlertModal} onClose={() => setShowAlertModal(false)}>
        <div className="flex flex-col overflow-hidden shadow-2xl rounded-[2rem]">
          <div className="px-8 py-6 bg-[#0f2044] flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#f5b800] flex items-center justify-center">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black">{isRTL ? 'إرسال تنبيه إداري' : 'Administrative Signal'}</h3>
                <p className="text-[10px] font-black text-blue-100 opacity-60 uppercase tracking-widest">{isRTL ? 'بث إنذار فوري للمشارك' : 'INSTANT ALERT BROADCAST'}</p>
              </div>
            </div>
            <button onClick={() => setShowAlertModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <LucideX size={24} />
            </button>
          </div>

          <form onSubmit={handleAlertUser}>
            <div className="p-10 bg-white dark:bg-[#111827] space-y-8">
                <div className="flex items-center gap-5 p-6 bg-[#f5b800]/5 dark:bg-[#f5b800]/5 rounded-[2rem] border border-[#f5b800]/10 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-[#f5b800]/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                    <div className={`w-16 h-16 rounded-2xl ${getRoleColor(selectedUser?.role || '')} flex items-center justify-center text-white font-black text-2xl shadow-2xl ring-4 ring-white dark:ring-[#1a2845]`}>
                        {selectedUser?.name.charAt(0)}
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-[#f5b800] uppercase tracking-[0.25em] mb-1">{isRTL ? 'المستهدف' : 'TARGET OPERATIVE'}</p>
                        <p className="text-lg font-black text-[#0f2044] dark:text-white tracking-tight">{selectedUser?.name}</p>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg mt-1 border ${getRoleBadge(selectedUser?.role || '')}`}>{getRoleLabel(selectedUser?.role || '')}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 block">{isRTL ? 'رسالة التنبيه' : 'ALERT CONTENT'}</label>
                    <textarea
                        value={alertForm.data.alert_message}
                        onChange={(e) => alertForm.setData("alert_message", e.target.value)}
                        rows={5}
                        required
                        placeholder={isRTL ? "أدخل نص التنبيه الإداري هنا لتعريف المشارك بالمخالفة أو التنبيه..." : "Enter formal administrative alert content..."}
                        className="w-full bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 rounded-3xl p-6 text-sm font-bold focus:ring-[#f5b800]/20 focus:border-[#f5b800] transition-all shadow-inner placeholder:opacity-50"
                    />
                </div>
            </div>

            <div className="px-8 py-6 bg-gray-50 dark:bg-[#0f172a] border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <button type="button" onClick={() => setShowAlertModal(false)} className={DS_btnSecondary}>
                    {isRTL ? 'إلغاء' : 'Abort'}
                </button>
                <button 
                    type="submit" 
                    disabled={alertForm.processing}
                    className="px-10 py-3 bg-[#f5b800] hover:bg-[#f5b800]/90 text-[#0f2044] rounded-2xl text-sm font-black shadow-xl shadow-[#f5b800]/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                >
                    <Zap size={16} fill="currentColor" />
                    {alertForm.processing ? (isRTL ? 'جاري الإرسال...' : 'TRANSMITTING...') : (isRTL ? 'إرسال الإنذار' : 'BROADCAST ALERT')}
                </button>
            </div>
          </form>
        </div>
      </Modal>

    </AuthenticatedLayout>
  );
}
