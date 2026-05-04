import React, { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import useTranslation from "@/hooks/useTranslation";
import BaseDataTable from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { 
    MessageSquare, 
    Search, 
    Users, 
    School as SchoolIcon, 
    Clock, 
    Eye,
    MessageCircle,
    User,
    ShieldCheck,
    Zap,
    Navigation
} from "lucide-react";
import { 
    DS_pageWrapper, 
    DS_statCard, 
    DS_statIcon, 
    DS_statLabel, 
    DS_statValue, 
    DS_btnSecondary,
    DS_select,
    DS_input
} from "@/lib/DS";

interface Participant {
  id: number;
  name: string;
  role: string;
}

interface LastMessage {
  body: string;
  sender: string;
  created_at: string;
}

interface ConversationItem {
  id: number;
  type: string;
  title: string | null;
  school: { id: number; name: string } | null;
  participants: Participant[];
  last_message: LastMessage | null;
  messages_count: number;
  updated_at: string;
}

interface SchoolFilter {
  id: number;
  name: string;
}

interface Props {
  auth: any;
  conversations: {
    data: ConversationItem[];
    current_page: number;
    last_page: number;
    total: number;
  };
  schools: SchoolFilter[];
  filters: {
    search?: string;
    school_id?: string;
  };
}

export default function Index({ auth, conversations, schools, filters }: Props) {
  const { isRTL, theme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const [search, setSearch] = useState(filters.search || "");
  const [schoolFilter, setSchoolFilter] = useState(filters.school_id || "");

  const applyFilters = () => {
    router.get(
      route("admin.chat.index"),
      {
        search: search || undefined,
        school_id: schoolFilter || undefined,
      },
      { preserveState: true, replace: true }
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "parent": return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
      case "driver": return "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800";
      case "supervisor": return "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800";
      default: return "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return isRTL ? "الآن" : "Just now";
    if (hours < 24) return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
    if (days < 7) return isRTL ? `منذ ${days} يوم` : `${days}d ago`;
    return d.toLocaleDateString(isRTL ? "ar-SA" : "en-US", { month: "short", day: "numeric" });
  };

  // Table Setup
  const columnHelper = createColumnHelper<ConversationItem>();
  const columns = useMemo(() => [
    columnHelper.accessor('participants', {
      header: isRTL ? 'أطراف المحادثة' : 'Participants',
      cell: info => (
        <div className="flex flex-col gap-2 py-1">
          {info.getValue().map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-inner ${
                p.role === "parent" ? "bg-blue-500" : p.role === "driver" ? "bg-emerald-500" : "bg-purple-500"
              } text-white`}>
                {p.name.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-[#0f2044] dark:text-white truncate leading-tight">{p.name}</span>
                <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-tighter w-fit mt-0.5 border ${getRoleBadge(p.role)}`}>
                  {getRoleLabel(p.role)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )
    }),
    columnHelper.accessor('school', {
      header: isRTL ? 'المدرسة' : 'Educational Unit',
      cell: info => info.getValue() ? (
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-50 dark:bg-[#0f2044]/40 rounded-lg flex items-center justify-center text-[#f5b800] border border-gray-100 dark:border-white/5 shadow-sm">
                <SchoolIcon size={14} />
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{info.getValue()?.name}</span>
        </div>
      ) : <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">— {t('Global Channel')} —</span>
    }),
    columnHelper.accessor('last_message', {
      header: isRTL ? 'آخر نشاط' : 'Intel Summary',
      cell: info => {
        const msg = info.getValue();
        return msg ? (
          <div className="max-w-[200px] flex flex-col gap-1">
            <p className="text-xs font-black text-[#0f2044] dark:text-gray-100 truncate">
              <span className="text-[#f5b800]">{msg.sender}:</span> {msg.body}
            </p>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              <Clock size={10} />
              {formatDate(msg.created_at)}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest italic">
            <Zap size={12} className="opacity-30" />
            {t('Radio Silence')}
          </div>
        );
      }
    }),
    columnHelper.accessor('messages_count', {
      header: isRTL ? 'إجمالي الرسائل' : 'Traffic',
      cell: info => (
        <div className="flex flex-col items-center gap-1">
            <span className="px-3 py-1 bg-[#0f2044] text-[#f5b800] rounded-lg text-[10px] font-black shadow-lg shadow-[#0f2044]/10">
                {info.getValue()}
            </span>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{t('Units')}</span>
        </div>
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: isRTL ? 'الإجراءات' : 'Ops',
      cell: info => (
        <div className="flex items-center justify-center">
            <Link
                href={route("admin.chat.show", info.row.original.id)}
                className="p-3 bg-gray-50 dark:bg-[#0f2044]/40 text-gray-500 hover:bg-[#0f2044] hover:text-white rounded-xl transition-all shadow-sm group"
                title={t('Live Intercept')}
            >
                <Eye size={18} className="group-hover:scale-110 transition-transform" />
            </Link>
        </div>
      )
    })
  ], [isRTL, t, isDark]);

  const statsGrid = [
    { label: isRTL ? 'إجمالي القنوات' : 'Total Channels', val: conversations.total, icon: <MessageSquare size={24} />, color: 'blue' },
    { label: isRTL ? 'المحادثات النشطة' : 'Active Traffic', val: conversations.data.filter((c) => c.last_message).length, icon: <Zap size={24} />, color: 'gold' },
    { label: isRTL ? 'الوحدات التعليمية' : 'Educational Units', val: schools.length, icon: <SchoolIcon size={24} />, color: 'navy' },
  ];

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title={t('Conversation Monitor')} />

      <div className={`${DS_pageWrapper} space-y-8 px-4 sm:px-6 lg:px-8 pt-8 pb-12`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* Premium Command Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-gray-100 dark:border-[#243460]">
            <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-[#0f2044] rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-[#0f2044]/30 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <MessageCircle size={28} fill="#f5b800" className="text-[#f5b800] relative z-10" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-3xl font-black text-[#0f2044] dark:text-white tracking-tight">
                        {isRTL ? 'مراقب المحادثات' : 'Communication Relay'}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                            {isRTL ? 'رصد وتحليل تدفق البيانات الحي' : 'Live Intercept & Network Oversight'}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Intelligence Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statsGrid.map((s, i) => (
                <div key={i} className={`${DS_statCard(s.color as any)} group/card hover:shadow-2xl transition-all duration-500 relative overflow-hidden border-b-4 border-[#0f2044]/20`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 dark:bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover/card:scale-150 transition-transform duration-700" />
                    <div className={`${DS_statIcon(s.color as any)} group-hover/card:rotate-12 transition-transform`}>{s.icon}</div>
                    <div className="relative z-10">
                        <p className={DS_statLabel}>{s.label}</p>
                        <p className={DS_statValue}>{s.val}</p>
                    </div>
                </div>
            ))}
        </div>

        {/* Deployment Matrix (Table) */}
        <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/5 to-[#f5b800]/5 rounded-[2.5rem] blur-2xl opacity-50" />
            <div className="relative">
                <BaseDataTable<ConversationItem>
                    columns={columns}
                    data={conversations.data}
                    exportEnabled={true}
                    headerAction={
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                                    className={`${DS_input} pl-10 min-w-[240px] h-10`}
                                    placeholder={isRTL ? "البحث عن مشارك..." : "Search operative..."}
                                />
                            </div>
                            <div className="relative">
                                <Navigation size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <select
                                    value={schoolFilter}
                                    onChange={(e) => {
                                        setSchoolFilter(e.target.value);
                                        router.get(
                                            route("admin.chat.index"),
                                            {
                                                search: search || undefined,
                                                school_id: e.target.value || undefined,
                                            },
                                            { preserveState: true, replace: true }
                                        );
                                    }}
                                    className={`${DS_select} pl-10 h-10`}
                                >
                                    <option value="">{isRTL ? "جميع الوحدات التعليمية" : "All Operational Units"}</option>
                                    {schools.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    }
                    emptyMessage={isRTL ? 'لم يتم رصد أي نشاط في الشبكة' : 'No network activity detected'}
                />
            </div>
        </div>

        {/* Global Network Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-[#0f2044] rounded-[2rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#f5b800]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-2">
                <h4 className="text-xl font-black text-white">{isRTL ? 'الشبكة التشغيلية الموحدة' : 'Unified Operational Network'}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{isRTL ? 'إدارة قنوات الاتصال بين المدارس، السائقين، وأولياء الأمور' : 'Overseeing channels between Schools, Logistics, & Guardians'}</p>
            </div>
            <div className="relative z-10 mt-6 md:mt-0 flex gap-10">
                <div className="text-center">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{isRTL ? 'أولياء الأمور' : 'Parent Node'}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <span className="text-xs font-black text-white">{isRTL ? 'نشط' : 'Active'}</span>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{isRTL ? 'السائقون' : 'Logistics Node'}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span className="text-xs font-black text-white">{isRTL ? 'نشط' : 'Active'}</span>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{isRTL ? 'المشرفات' : 'Control Node'}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                        <span className="text-xs font-black text-white">{isRTL ? 'نشط' : 'Active'}</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </AuthenticatedLayout>
  );
}
