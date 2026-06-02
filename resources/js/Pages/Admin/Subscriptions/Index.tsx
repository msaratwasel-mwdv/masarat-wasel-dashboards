import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Eye, 
    AlertTriangle, 
    Wallet, 
    Plus, 
    Search, 
    Filter, 
    Calendar,
    ChevronRight,
    ArrowLeft,
    Trash2,
    Edit2,
    FileText,
    CreditCard,
    PauseCircle,
    PlayCircle,
    Briefcase,
    Settings,
    Mail,
    MapPin
} from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';
import OmaniRial from '@/Components/OmaniRial';
import BaseDataTable, { type PaginationMeta } from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import { toast } from "react-toastify";
import { 
    DS_pageWrapper, 
    DS_card, 
    DS_pageTitle,
    DS_statCard,
    DS_statIcon,
    DS_statLabel,
    DS_statValue2,
    DS_btnGold,
    DS_btnSecondary,
    DS_modalContainer,
    DS_modalHeader,
    DS_modalHeaderTitle,
    DS_modalHeaderAccent,
    DS_modalClose,
    DS_modalBody,
    DS_modalFooter,
    DS_input,
    DS_label,
    DS_btnPrimary,
    DS_badge
} from "@/lib/DS";

interface Plan {
    id: number;
    name: string;
    price_per_student: number;
    max_buses: number | null;
    feature_list: string[];
}

interface Subscription {
    id: number;
    school_id: number;
    plan_id: number;
    status: 'pending_approval' | 'active' | 'cancelled' | 'expired';
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    school: {
        id: number;
        name: string;
        address: string;
        users?: Array<{
            name: string;
            first_name_ar?: string;
            email: string;
            phone: string;
        }>;
    };
    plan: Plan;
    notes?: {
        student_count?: number;
        bus_count?: number;
        billing_type?: string;
        approved_price_per_student?: number;
    } | null;
}

interface Props {
    subscriptions: {
        data: Subscription[];
        links: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    filters: {
        search: string;
    };
    all_plans: Plan[];
    auth: any;
}

export default function SubscriptionsIndex({ subscriptions, filters, all_plans, auth }: Props) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === "dark";
    const [search, setSearch] = useState(filters.search || '');
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [modalStep, setModalStep] = useState<'details' | 'approve'>('details');

    const { data: approveData, setData: setApproveData, post: postApprove, processing: approveProcessing, errors: approveErrors, reset: resetApprove } = useForm({
        price_per_student: 0,
        installments_count: 1,
    });

    const { data: editData, setData: setEditData, put: putEdit, processing: editProcessing, errors: editErrors } = useForm({
        plan_id: '' as string | number,
        status: '' as string,
        start_date: '',
        end_date: '',
    });

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(route('admin.subscriptions.index'), { search: value }, { preserveState: true, replace: true });
    };

    const openApproveModal = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
        
        // Auto-suggest the plan's default price per student
        const suggestedPricePerStudent = subscription.plan.price_per_student || 0;
        
        setApproveData({
            price_per_student: suggestedPricePerStudent,
            installments_count: 1, // Will auto calculate based on billing_type on the backend if needed, or admin chooses.
        });
        
        setModalStep('details');
        setIsApproveModalOpen(true);
    };

    const openEditModal = (sub: Subscription) => {
        setSelectedSubscription(sub);
        setEditData({
            plan_id: sub.plan_id,
            status: sub.status,
            start_date: sub.start_date ? sub.start_date.split('T')[0] : '',
            end_date: sub.end_date ? sub.end_date.split('T')[0] : '',
        });
        setIsEditModalOpen(true);
    };

    const handleApprove = (e: React.FormEvent) => {
        e.preventDefault();
        postApprove(route('admin.subscriptions.approve', selectedSubscription!.id), {
            onSuccess: () => {
                setIsApproveModalOpen(false);
                toast.success(isRTL ? 'تم تفعيل الاشتراك بنجاح' : 'Subscription activated successfully');
            }
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        putEdit(route('admin.subscriptions.update', selectedSubscription!.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                toast.success(isRTL ? 'تم تحديث الاشتراك بنجاح' : 'Subscription updated successfully');
            }
        });
    };

    const handleReject = (subId: number) => {
        if(confirm(isRTL ? 'هل أنت متأكد من رفض هذا الطلب؟' : 'Are you sure you want to reject this request?')) {
            router.post(route('admin.subscriptions.reject', subId), {}, {
                onSuccess: () => toast.success(isRTL ? 'تم رفض الطلب' : 'Request rejected')
            });
        }
    };

    const handlePause = (subId: number) => {
        if(confirm(isRTL ? 'هل أنت متأكد من تجميد هذا الاشتراك؟ لن تتمكن المدرسة من إجراء عمليات جديدة.' : 'Are you sure you want to pause this subscription? The school will not be able to perform new operations.')) {
            router.post(route('admin.subscriptions.pause', subId), {}, {
                onSuccess: () => toast.success(isRTL ? 'تم تجميد الاشتراك' : 'Subscription paused')
            });
        }
    };

    const handleResume = (subId: number) => {
        if(confirm(isRTL ? 'هل أنت متأكد من إعادة تفعيل هذا الاشتراك؟' : 'Are you sure you want to resume this subscription?')) {
            router.post(route('admin.subscriptions.resume', subId), {}, {
                onSuccess: () => toast.success(isRTL ? 'تم إعادة تفعيل الاشتراك' : 'Subscription resumed')
            });
        }
    };

    const handleDelete = (subId: number) => {
        if(confirm(isRTL ? 'هل أنت متأكد من حذف هذا الاشتراك نهائياً؟' : 'Are you sure you want to delete this subscription?')) {
            router.delete(route('admin.subscriptions.destroy', subId), {
                onSuccess: () => toast.success(isRTL ? 'تم حذف الاشتراك' : 'Subscription deleted')
            });
        }
    };

    const columnHelper = createColumnHelper<Subscription>();

    const columns = useMemo(() => [
        columnHelper.accessor("school.name", {
            header: isRTL ? "المدرسة" : "School",
            cell: (info) => (
                <div className="flex flex-col">
                    <span className="font-black text-[#0f2044] dark:text-white">{info.getValue()}</span>
                    <span className="text-[10px] text-gray-400">ID: #{info.row.original.id}</span>
                </div>
            )
        }),
        columnHelper.accessor("plan.name", {
            header: isRTL ? "الخطة" : "Plan",
            cell: (info) => (
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#f5b800]/10 rounded-lg text-[#f5b800]">
                        <Briefcase size={14} />
                    </div>
                    <span className="font-bold">{info.getValue()}</span>
                </div>
            )
        }),
        columnHelper.accessor("status", {
            header: isRTL ? "الحالة" : "Status",
            cell: (info) => {
                const status = info.getValue();
                return (
                    <div className="flex items-center gap-2">
                        {status === 'active' && <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12}/> {isRTL ? 'نشط' : 'Active'}</span>}
                        {status === 'pending_approval' && <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> {isRTL ? 'قيد المراجعة' : 'Pending'}</span>}
                        {status === 'cancelled' && <span className="px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><XCircle size={12}/> {isRTL ? 'ملغي' : 'Cancelled'}</span>}
                        {status === 'expired' && <span className="px-3 py-1 bg-gray-500/10 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><AlertTriangle size={12}/> {isRTL ? 'منتهي' : 'Expired'}</span>}
                    </div>
                );
            }
        }),
        columnHelper.accessor("created_at", {
            header: isRTL ? "تاريخ الطلب" : "Request Date",
            cell: (info) => (
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <Calendar size={14} />
                    {new Date(info.getValue()).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                </div>
            )
        }),
        columnHelper.display({
            id: "actions",
            header: isRTL ? "الإجراءات" : "Actions",
            cell: (info) => {
                const sub = info.row.original;
                return (
                    <div className="flex items-center gap-2">
                        {sub.status === 'pending_approval' ? (
                            <button 
                                onClick={() => openApproveModal(sub)}
                                className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                title={isRTL ? "مراجعة واعتماد" : "Review & Approve"}
                            >
                                <CheckCircle2 size={16} />
                            </button>
                        ) : (
                            <button 
                                onClick={() => openEditModal(sub)}
                                className="p-2 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8] rounded-lg hover:bg-[#0f2044] hover:text-white transition-all shadow-sm"
                                title={isRTL ? "تعديل" : "Edit"}
                            >
                                <Edit2 size={16} />
                            </button>
                        )}
                        {sub.status === 'active' && (
                            <button 
                                onClick={() => handlePause(sub.id)}
                                className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                                title={isRTL ? "تجميد (إيقاف مؤقت)" : "Pause"}
                            >
                                <PauseCircle size={16} />
                            </button>
                        )}
                        {sub.status === 'paused' && (
                            <button 
                                onClick={() => handleResume(sub.id)}
                                className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                title={isRTL ? "إعادة التفعيل" : "Resume"}
                            >
                                <PlayCircle size={16} />
                            </button>
                        )}
                        <button 
                            onClick={() => handleDelete(sub.id)}
                            className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            title={isRTL ? "حذف" : "Delete"}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                );
            }
        })
    ], [isRTL]);

    const pagination: PaginationMeta = {
        links: subscriptions.links,
        current_page: subscriptions.current_page,
        last_page: subscriptions.last_page,
        per_page: subscriptions.per_page,
        total: subscriptions.total,
        from: subscriptions.from,
        to: subscriptions.to,
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? "إدارة الاشتراكات" : "Subscriptions Oversight"} />

            <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex flex-col">
                        <h1 className={DS_pageTitle}>
                            {isRTL ? "نظام إدارة الاشتراكات" : "Subscription Management System"}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {subscriptions.total} {isRTL ? "سجل اشتراك إجمالي" : "Total Subscription Records"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Intelligence Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className={DS_statCard('blue')}>
                        <div className={DS_statIcon('blue')}><Wallet size={20} /></div>
                        <div>
                            <p className={DS_statLabel}>{isRTL ? "إجمالي الاشتراكات" : "Total Subs"}</p>
                            <p className={DS_statValue2('blue')}>{subscriptions.total}</p>
                        </div>
                    </div>
                    <div className={DS_statCard('green')}>
                        <div className={DS_statIcon('green')}><CheckCircle2 size={20} /></div>
                        <div>
                            <p className={DS_statLabel}>{isRTL ? "نشط" : "Active"}</p>
                            <p className={DS_statValue2('green')}>{subscriptions.data.filter(s => s.status === 'active').length}</p>
                        </div>
                    </div>
                    <div className={DS_statCard('gold')}>
                        <div className={DS_statIcon('gold')}><Clock size={20} /></div>
                        <div>
                            <p className={DS_statLabel}>{isRTL ? "قيد الانتظار" : "Pending"}</p>
                            <p className={DS_statValue2('gold')}>{subscriptions.data.filter(s => s.status === 'pending_approval').length}</p>
                        </div>
                    </div>
                    <div className={DS_statCard('red')}>
                        <div className={DS_statIcon('red')}><XCircle size={20} /></div>
                        <div>
                            <p className={DS_statLabel}>{isRTL ? "ملغي" : "Cancelled"}</p>
                            <p className={DS_statValue2('red')}>{subscriptions.data.filter(s => s.status === 'cancelled').length}</p>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className={DS_card}>
                    <BaseDataTable<Subscription>
                        columns={columns}
                        data={subscriptions.data}
                        pagination={pagination}
                        searchValue={search}
                        onSearchChange={handleSearch}
                        searchPlaceholder={isRTL ? "ابحث باسم المدرسة أو الخطة..." : "Search by school or plan..."}
                    />
                </div>

                {/* --- Step-based Approval Modal --- */}
                <Modal show={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} maxWidth="2xl">
                    <div className={DS_modalContainer}>
                        <div className={DS_modalHeader(isRTL)}>
                            <div className="flex items-center gap-3">
                                <div className={DS_modalHeaderAccent} />
                                <h3 className={DS_modalHeaderTitle}>
                                    {isRTL ? "مراجعة وتفعيل الاشتراك" : "Review & Activate Subscription"}
                                </h3>
                            </div>
                            <button onClick={() => setIsApproveModalOpen(false)} className={DS_modalClose}>
                                <XCircle size={18} />
                            </button>
                        </div>

                        <div className={DS_modalBody}>
                            {/* Stepper */}
                            <div className="flex items-center justify-center gap-4 mb-8 border-b border-gray-100 dark:border-[#243460] pb-6">
                                <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${modalStep === 'details' ? 'bg-[#f5b800] text-[#0f2044]' : 'bg-emerald-500 text-white'}`}>
                                        {modalStep === 'approve' ? <CheckCircle2 size={14}/> : '1'}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${modalStep === 'details' ? 'text-[#0f2044] dark:text-[#f5b800]' : 'text-gray-400'}`}>{isRTL ? 'تفاصيل الطلب' : 'Request Details'}</span>
                                </div>
                                <div className="w-8 h-px bg-gray-200 dark:bg-[#243460]"></div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${modalStep === 'approve' ? 'bg-[#f5b800] text-[#0f2044]' : 'bg-gray-100 dark:bg-[#0f2044]/40 text-gray-400'}`}>
                                        2
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${modalStep === 'approve' ? 'text-[#0f2044] dark:text-[#f5b800]' : 'text-gray-400'}`}>{isRTL ? 'خطة التقسيط' : 'Payment Plan'}</span>
                                </div>
                            </div>

                            {modalStep === 'details' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b dark:border-slate-700 pb-2">{isRTL ? 'بيانات التواصل والخدمات' : 'Contact & Services'}</h4>
                                        <div className="space-y-3">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                    <CheckCircle2 size={12} /> {isRTL ? 'المسؤول' : 'Manager'}
                                                </div>
                                                <span className="font-black text-slate-700 dark:text-white text-sm">
                                                    {selectedSubscription?.school?.users?.[0]?.name || selectedSubscription?.school?.users?.[0]?.first_name_ar || '-'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                    <Mail size={12} /> {isRTL ? 'البريد الإلكتروني' : 'Email'}
                                                </div>
                                                <span className="font-black text-slate-700 dark:text-white text-sm">
                                                    {selectedSubscription?.school?.users?.[0]?.email || '-'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                    <AlertTriangle size={12} /> {isRTL ? 'رقم الجوال' : 'Phone'}
                                                </div>
                                                <span className={`font-black text-slate-700 dark:text-white text-sm ${isRTL ? 'text-right' : 'text-left'}`} dir="ltr">
                                                    {selectedSubscription?.school?.users?.[0]?.phone || '-'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                                    <MapPin size={12} /> {isRTL ? 'العنوان' : 'Address'}
                                                </div>
                                                <span className="font-black text-slate-700 dark:text-white text-sm">{selectedSubscription?.school?.address || '-'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4 mt-6">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b dark:border-slate-700 pb-2">{isRTL ? 'بيانات الفوترة والطلاب (من الطلب)' : 'Billing & Students (From Request)'}</h4>
                                            <div className="bg-[#f5b800]/5 border border-[#f5b800]/20 rounded-xl p-4 grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? 'عدد الطلاب المتوقع' : 'Expected Students'}</div>
                                                    <div className="font-black text-slate-700 dark:text-white text-lg">{selectedSubscription?.notes?.student_count || 0}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? 'نظام الدفع المفضل' : 'Preferred Billing'}</div>
                                                    <div className="font-black text-slate-700 dark:text-white text-lg">
                                                        {selectedSubscription?.notes?.billing_type === 'yearly' ? (isRTL ? 'سنوي' : 'Yearly') : (isRTL ? 'شهري' : 'Monthly')}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">{isRTL ? 'عدد الحافلات المتوقع' : 'Expected Buses'}</div>
                                                    <div className="font-black text-slate-700 dark:text-white text-lg">{selectedSubscription?.notes?.bus_count || 0}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b dark:border-slate-700 pb-2">{isRTL ? 'تفاصيل خطة الاشتراك' : 'Subscription Plan Details'}</h4>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                                            <div className="text-xl font-black text-[#0f2044] dark:text-white mb-1">{selectedSubscription?.plan?.name}</div>
                                            <div className="text-[#f5b800] font-black text-2xl mb-4 flex items-center gap-1" dir="ltr">
                                                <OmaniRial className="w-5 h-5" />
                                                {selectedSubscription?.plan?.price_per_student} 
                                                <span className="text-[10px] text-slate-400">{isRTL ? '/ طالب' : '/ Student'}</span>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">{isRTL ? 'الحد الأقصى للباصات:' : 'Max Buses:'}</span>
                                                    <span className="font-black text-[#0f2044] dark:text-white">{(selectedSubscription?.plan?.max_buses === null || selectedSubscription?.plan?.max_buses === 0) ? (isRTL ? 'غير محدود' : 'Unlimited') : selectedSubscription?.plan?.max_buses}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">{isRTL ? 'السعة التقديرية:' : 'Estimated Capacity:'}</span>
                                                    <span className="font-black text-[#0f2044] dark:text-white">{(selectedSubscription?.plan?.max_buses === null || selectedSubscription?.plan?.max_buses === 0) ? (isRTL ? 'غير محدودة' : 'Unlimited') : ((selectedSubscription?.plan?.max_buses * 20) + (isRTL ? ' طالب' : ' Students'))}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">{isRTL ? 'مميزات الخطة:' : 'Plan Features:'}</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedSubscription?.plan?.feature_list?.map((f: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 bg-white dark:bg-[#0f2044] text-[9px] font-bold rounded-lg border border-slate-100 dark:border-slate-800">{f}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleApprove} className="space-y-6">
                                    <div className="p-6 bg-[#f5b800]/5 rounded-2xl border border-[#f5b800]/20">
                                        <div className="mb-4">
                                            <label className={DS_label}>{isRTL ? "السعر المعتمد للطالب الواحد" : "Approved Price Per Student"}</label>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number"
                                                    step="0.01"
                                                    value={approveData.price_per_student}
                                                    onChange={e => setApproveData('price_per_student', parseFloat(e.target.value) || 0)}
                                                    className={DS_input}
                                                />
                                                <span className="text-[#f5b800] font-black shrink-0"><OmaniRial className="w-6 h-6 inline-block" /></span>
                                            </div>
                                            {approveErrors.price_per_student && <InputError message={approveErrors.price_per_student} />}
                                            
                                            {/* --- Subscription Calculator --- */}
                                            <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <h5 className="text-xs font-black uppercase text-slate-400 mb-3 flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#f5b800]" />
                                                    {isRTL ? "حاسبة الاشتراك (تلقائية)" : "Subscription Calculator (Auto)"}
                                                </h5>
                                                
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-slate-500 font-bold">{isRTL ? "عدد الطلاب المسجلين" : "Enrolled Students"}</span>
                                                        <span className="font-black text-slate-700 dark:text-white">{selectedSubscription?.notes?.student_count || 0}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-slate-500 font-bold">{isRTL ? "السعر للطالب" : "Price Per Student"}</span>
                                                        <div className="flex items-center gap-1 font-black text-slate-700 dark:text-white" dir="ltr">
                                                            <span>{approveData.price_per_student || 0}</span>
                                                            <OmaniRial className="w-3.5 h-3.5 text-slate-400" />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="h-px bg-slate-100 dark:bg-slate-800 w-full my-1" />
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-black text-[#0f2044] dark:text-brand-yellow">{isRTL ? "إجمالي الفاتورة المتوقع" : "Estimated Total Bill"}</span>
                                                        <div className="flex items-center gap-1 font-black text-2xl text-[#0f2044] dark:text-brand-yellow" dir="ltr">
                                                            <span>{((approveData.price_per_student || 0) * (selectedSubscription?.notes?.student_count || 0)).toFixed(2)}</span>
                                                            <OmaniRial className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-3 bg-brand-navy/5 border border-brand-navy/10 rounded-lg">
                                                <div className="flex gap-2 items-start text-xs font-bold text-brand-navy">
                                                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                                    <p className="leading-relaxed">
                                                        {isRTL 
                                                            ? "ملاحظة هامة: هذا السعر سيتم اعتماده لحساب التكلفة السنوية الديناميكية. إذا قامت المدرسة بإضافة طالب جديد لاحقاً، سيتم احتساب هذا السعر تلقائياً وتحديث مبالغ الأقساط القادمة." 
                                                            : "Important Note: This price will be used for dynamic annual costing. If the school adds a new student later, this price will be automatically calculated and upcoming installments updated."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <label className={DS_label}>{isRTL ? "عدد الأقساط السنوية" : "Annual Installments"}</label>
                                        <select 
                                            value={approveData.installments_count}
                                            onChange={e => setApproveData('installments_count', parseInt(e.target.value))}
                                            className={DS_input}
                                        >
                                            <option value={1}>{isRTL ? "دفعة واحدة (كامل المبلغ)" : "One Payment (Full)"}</option>
                                            <option value={2}>{isRTL ? "دفعتين (نصف سنوي)" : "2 Payments (Semi-Annual)"}</option>
                                            <option value={4}>{isRTL ? "4 دفعات (ربع سنوي)" : "4 Payments (Quarterly)"}</option>
                                            <option value={12}>{isRTL ? "12 دفعة (شهري)" : "12 Payments (Monthly)"}</option>
                                        </select>
                                        <p className="text-[10px] text-gray-400 mt-2 italic leading-relaxed">
                                            {isRTL ? 'بناءً على اختيارك، سيتم تقسيم التكلفة السنوية الإجمالية على' : 'Based on your selection, the total annual cost will be split into'} 
                                            <span className="font-black mx-1">{approveData.installments_count}</span> 
                                            {isRTL ? 'أقساط متساوية.' : 'equal installments.'}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1 italic">
                                            {isRTL ? "* سيتم إنشاء جدول دفعات تلقائي بناءً على هذا الاختيار." : "* A payment schedule will be auto-generated based on this selection."}
                                        </p>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className={DS_modalFooter(isRTL)}>
                            {modalStep === 'details' ? (
                                <>
                                    <button onClick={() => handleReject(selectedSubscription!.id)} className="px-6 py-2.5 text-xs font-black text-rose-500 hover:text-rose-700 uppercase transition-colors">
                                        {isRTL ? "رفض الطلب" : "Reject Request"}
                                    </button>
                                    <button onClick={() => setModalStep('approve')} className={DS_btnGold}>
                                        {isRTL ? "متابعة" : "Proceed"}
                                        <ChevronRight size={16} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setModalStep('details')} className="px-6 py-2.5 text-xs font-black text-gray-400 hover:text-gray-600 uppercase transition-colors">
                                        <ArrowLeft size={16} className="inline mr-1" /> {isRTL ? "رجوع" : "Back"}
                                    </button>
                                    <button onClick={handleApprove} disabled={approveProcessing} className={DS_btnGold}>
                                        {approveProcessing ? (isRTL ? "جاري التفعيل..." : "Activating...") : (isRTL ? "اعتماد وتفعيل" : "Approve & Activate")}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </Modal>

                {/* --- Edit Modal --- */}
                <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="xl">
                    <div className={DS_modalContainer}>
                        <div className={DS_modalHeader(isRTL)}>
                            <div className="flex items-center gap-3">
                                <div className={DS_modalHeaderAccent} />
                                <h3 className={DS_modalHeaderTitle}>
                                    {isRTL ? "تعديل تفاصيل الاشتراك" : "Edit Subscription Details"}
                                </h3>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className={DS_modalClose}>
                                <XCircle size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate}>
                            <div className={DS_modalBody}>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className={DS_label}>{isRTL ? "الخطة المخصصة" : "Assigned Plan"}</label>
                                        <select 
                                            value={editData.plan_id}
                                            onChange={e => setEditData('plan_id', e.target.value)}
                                            className={DS_input}
                                            required
                                        >
                                            {all_plans.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.price_per_student} ر.ع)</option>
                                            ))}
                                        </select>
                                        <InputError message={editErrors.plan_id} />
                                    </div>

                                    <div>
                                        <label className={DS_label}>{isRTL ? "حالة الاشتراك" : "Subscription Status"}</label>
                                        <select 
                                            value={editData.status}
                                            onChange={e => setEditData('status', e.target.value)}
                                            className={DS_input}
                                            required
                                        >
                                            <option value="pending_approval">{isRTL ? "قيد المراجعة" : "Pending"}</option>
                                            <option value="active">{isRTL ? "نشط" : "Active"}</option>
                                            <option value="cancelled">{isRTL ? "ملغي" : "Cancelled"}</option>
                                            <option value="expired">{isRTL ? "منتهي" : "Expired"}</option>
                                        </select>
                                        <InputError message={editErrors.status} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={DS_label}>{isRTL ? "تاريخ البدء" : "Start Date"}</label>
                                            <input 
                                                type="date"
                                                value={editData.start_date}
                                                onChange={e => setEditData('start_date', e.target.value)}
                                                className={DS_input}
                                            />
                                        </div>
                                        <div>
                                            <label className={DS_label}>{isRTL ? "تاريخ الانتهاء" : "End Date"}</label>
                                            <input 
                                                type="date"
                                                value={editData.end_date}
                                                onChange={e => setEditData('end_date', e.target.value)}
                                                className={DS_input}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={DS_modalFooter(isRTL)}>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-xs font-bold text-gray-400">
                                    {isRTL ? "إلغاء" : "Cancel"}
                                </button>
                                <button type="submit" disabled={editProcessing} className={DS_btnGold}>
                                    {editProcessing ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ التغييرات" : "Save Changes")}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

            </div>
        </AuthenticatedLayout>
    );
}
