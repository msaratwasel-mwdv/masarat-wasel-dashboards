import React, { useState } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useEchoEvent } from "@/hooks/useEcho";
import { useTheme } from "@/Contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, FileText, CheckCircle, XCircle, Clock, Search, ChevronRight, AlertCircle } from "lucide-react";
import {
    DS_card,
    DS_pageTitle,
    DS_btnPrimary,
    DS_btnGold,
    DS_btnSecondary,
    DS_inputCls,
    DS_labelCls,
    DS_tableWrapper,
    DS_tableBase,
    DS_tableHead,
    DS_tableTh,
    DS_tableRow,
    DS_tableTd,
    DS_modalContainer,
    DS_modalHeader,
    DS_modalHeaderTitle,
    DS_modalHeaderAccent,
    DS_modalClose,
    DS_modalBody,
    DS_cancelBtn,
    DS_submitBtn,
    DS_badge,
    DS_statLabel,
    DS_statValue2
} from "@/lib/DS";

interface Student {
    id: number;
    full_name: string;
}

interface Guardian {
    id: number;
    name: string;
}

interface AbsenceRequest {
    id: number;
    student_id: number;
    guardian_id: number;
    date: string;
    type: 'morning' | 'afternoon' | 'full_day' | string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | string;
    rejection_reason?: string;
    student: Student;
    guardian: Guardian;
}

interface Props {
    auth: { user: any };
    absenceRequests: {
        data: AbsenceRequest[];
        links: any;
        total: number;
    };
}

export default function AbsenceRequests({ auth, absenceRequests }: Props) {
    const { isRTL: isRtl } = useTheme();
    const [processingRequest, setProcessingRequest] = useState<AbsenceRequest | null>(null);
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // --- Real-time Refresh ---
    useEchoEvent(
        'private',
        `App.Models.User.${auth.user.id}`,
        'notification.pushed',
        (data: any) => {
            // If the notification is related to absence requests, refresh the page data
            if (data.type === 'absence_request') {
                router.reload({ 
                    only: ['absenceRequests'],
                    preserveScroll: true,
                    preserveState: true
                });
            }
        }
    );

    const openProcessModal = (request: AbsenceRequest, type: 'approve' | 'reject') => {
        setProcessingRequest(request);
        setAction(type);
        setRejectionReason("");
    };

    const closeProcessModal = () => {
        if (isProcessing) return;
        setProcessingRequest(null);
        setAction(null);
    };

    const handleProcess = () => {
        if (!processingRequest || isProcessing) return;
        
        setIsProcessing(true);
        router.post(route("school.absence-requests.process", processingRequest.id), {
            status: action === 'approve' ? 'approved' : 'rejected',
            rejection_reason: rejectionReason,
        }, {
            onSuccess: () => {
                setIsProcessing(false);
                closeProcessModal();
            },
            onError: () => setIsProcessing(false),
            onFinish: () => setIsProcessing(false),
        });
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'morning': return (isRtl ? 'صباحي فقط' : 'Morning Only');
            case 'afternoon': return (isRtl ? 'مسائي فقط' : 'Afternoon Only');
            case 'full_day': return (isRtl ? 'يوم كامل' : 'Full Day');
            default: return type;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {(isRtl ? 'مقبول' : 'Approved')}
                    </div>
                );
            case 'rejected':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                        <XCircle className="w-3.5 h-3.5" />
                        {(isRtl ? 'مرفوض' : 'Rejected')}
                    </div>
                );
            default:
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        {(isRtl ? 'قيد الانتظار' : 'Pending')}
                    </div>
                );
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className={DS_pageTitle}>
                    {(isRtl ? 'طلبات الغياب' : 'Absence Requests')}
                </h2>
            }
        >
            <Head title={(isRtl ? 'طلبات الغياب' : 'Absence Requests')} />

            <div className="pb-8 space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={DS_card}>
                        <div className="p-6 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-[#0f2044]/5 dark:bg-[#0f2044]/30 flex items-center justify-center text-[#0f2044] dark:text-[#f5b800]">
                                <FileText className="w-7 h-7" />
                            </div>
                            <div>
                                <p className={DS_statLabel}>{(isRtl ? 'إجمالي الطلبات' : 'Total Requests')}</p>
                                <p className={DS_statValue2('navy')}>{absenceRequests?.total || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className={DS_card}>
                        <div className="p-6 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <Clock className="w-7 h-7" />
                            </div>
                            <div>
                                <p className={DS_statLabel}>{(isRtl ? 'قيد الانتظار' : 'Pending Review')}</p>
                                <p className={DS_statValue2('gold')}>{absenceRequests?.data?.filter(r => r.status === 'pending').length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className={DS_card}>
                        <div className="p-6 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <CheckCircle className="w-7 h-7" />
                            </div>
                            <div>
                                <p className={DS_statLabel}>{(isRtl ? 'تمت الموافقة' : 'Approved Today')}</p>
                                <p className={DS_statValue2('green')}>{absenceRequests?.data?.filter(r => r.status === 'approved').length || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={DS_card}>
                    {/* Table Header Section */}
                    <div className="p-6 border-b border-gray-100 dark:border-[#243460] flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-[#0f2044] text-[#f5b800] rounded-xl">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#0f2044] dark:text-white">
                                    {(isRtl ? 'إدارة طلبات الغياب' : 'Manage Absence Requests')}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {(isRtl ? 'مراجعة ومعالجة طلبات غياب الطلاب المقدمة من أولياء الأمور.' : 'Review and process student absence requests submitted by guardians.')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={DS_tableWrapper}>
                        <table className={DS_tableBase}>
                            <thead className={DS_tableHead}>
                                <tr>
                                    <th className={DS_tableTh(isRtl)}>{(isRtl ? 'الطالب' : 'Student')}</th>
                                    <th className={DS_tableTh(isRtl)}>{(isRtl ? 'ولي الأمر' : 'Guardian')}</th>
                                    <th className={DS_tableTh(isRtl)}>{(isRtl ? 'التاريخ' : 'Date')}</th>
                                    <th className={DS_tableTh(isRtl)}>{(isRtl ? 'النوع' : 'Type')}</th>
                                    <th className={DS_tableTh(isRtl)}>{(isRtl ? 'السبب' : 'Reason')}</th>
                                    <th className={DS_tableTh(isRtl)}>{(isRtl ? 'الحالة' : 'Status')}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#0f2044]/60 dark:text-[#7ba7e8]/70 uppercase text-end">{(isRtl ? 'الإجراءات' : 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#243460]">
                                {absenceRequests?.data?.length > 0 ? (
                                    absenceRequests.data.map((request) => (
                                        <tr key={request.id} className={DS_tableRow}>
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#0f2044]/5 flex items-center justify-center text-[#0f2044]">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-[#0f2044] dark:text-white">{request.student.full_name}</span>
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="text-sm text-gray-600 dark:text-gray-300">{request.guardian.name}</span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">{request.date}</span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="px-2 py-0.5 rounded-lg bg-[#0f2044]/5 dark:bg-[#0f2044]/30 text-xs font-medium text-[#0f2044] dark:text-[#7ba7e8]">
                                                    {getTypeLabel(request.type)}
                                                </span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={request.reason}>
                                                    {request.reason}
                                                </p>
                                            </td>
                                            <td className={DS_tableTd}>{getStatusBadge(request.status)}</td>
                                            <td className="px-6 py-4 text-end">
                                                {request.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => openProcessModal(request, 'approve')}
                                                            className="px-3 py-1.5 rounded-[10px] bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-1.5"
                                                        >
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            {(isRtl ? 'موافقة' : 'Approve')}
                                                        </button>
                                                        <button
                                                            onClick={() => openProcessModal(request, 'reject')}
                                                            className="px-3 py-1.5 rounded-[10px] bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all shadow-sm flex items-center gap-1.5"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            {(isRtl ? 'رفض' : 'Reject')}
                                                        </button>
                                                    </div>
                                                )}
                                                {request.status === 'rejected' && request.rejection_reason && (
                                                    <span className="text-[10px] text-red-500 font-medium italic truncate max-w-[150px] inline-block" title={request.rejection_reason}>
                                                        {request.rejection_reason}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="text-6xl mb-4 opacity-10">📅</div>
                                            <p className="text-gray-400 dark:text-gray-500 font-bold">
                                                {(isRtl ? 'لا يوجد طلبات غياب حالياً' : 'No absence requests found')}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {absenceRequests?.data?.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#243460] flex justify-between items-center bg-gray-50/50 dark:bg-transparent">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {(isRtl ? 'عرض' : 'Showing')} {absenceRequests?.data?.length || 0} {(isRtl ? 'من أصل' : 'of')} {absenceRequests?.total || 0}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Process Modal */}
            <AnimatePresence>
                {processingRequest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f2044]/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-[#1a2845] w-full max-w-md rounded-[22px] shadow-2xl overflow-hidden border border-white/10"
                        >
                            <div className={DS_modalHeader(isRtl)}>
                                <div className="flex items-center gap-3">
                                    <div className={DS_modalHeaderAccent} />
                                    <h3 className={DS_modalHeaderTitle}>
                                        {action === 'approve' ? (isRtl ? 'الموافقة على الطلب' : 'Approve Request') : (isRtl ? 'رفض الطلب' : 'Reject Request')}
                                    </h3>
                                </div>
                                <button onClick={closeProcessModal} className={DS_modalClose}>
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>

                            <div className={DS_modalBody}>
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#0f2044]/5 dark:bg-[#0f2044]/20 border border-[#0f2044]/10 dark:border-[#243460]">
                                    <div className={`p-2 rounded-xl ${action === 'approve' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                        <AlertCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#0f2044] dark:text-white mb-1">
                                            {(isRtl ? 'هل أنت متأكد؟' : 'Are you sure?')}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {(isRtl ? 'هل تريد بالتأكيد' : 'Do you want to')} {action === 'approve' ? (isRtl ? 'الموافقة على' : 'approve') : (isRtl ? 'رفض' : 'reject')} {(isRtl ? 'طلب الغياب الخاص بالطالب' : 'the absence request for')} <strong>{processingRequest?.student?.full_name}</strong>؟
                                        </p>
                                    </div>
                                </div>

                                {action === 'reject' && (
                                    <div className="mt-4">
                                        <label className={DS_labelCls}>{(isRtl ? 'سبب الرفض' : 'Rejection Reason')}</label>
                                        <textarea
                                            className={`${DS_inputCls} min-h-[100px] py-3`}
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder={(isRtl ? 'أدخل سبب الرفض هنا...' : 'Enter reason for rejection...')}
                                            required
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={closeProcessModal}
                                        className={DS_cancelBtn}
                                        disabled={isProcessing}
                                    >
                                        {(isRtl ? 'إلغاء' : 'Cancel')}
                                    </button>
                                    <button
                                        onClick={handleProcess}
                                        disabled={isProcessing || (action === 'reject' && !rejectionReason.trim())}
                                        className={`${DS_submitBtn(isProcessing)} ${action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                    >
                                        {isProcessing ? (isRtl ? 'جاري المعالجة...' : 'Processing...') : (action === 'approve' ? (isRtl ? 'تأكيد الموافقة' : 'Confirm Approve') : (isRtl ? 'تأكيد الرفض' : 'Confirm Reject'))}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </SchoolAuthenticatedLayout>
    );
}
