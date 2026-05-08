import React, { useState } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, User, FileText, CheckCircle, XCircle, Clock, ChevronRight, AlertCircle, Map as MapIcon, Info } from "lucide-react";
import MiniMap from "@/Components/MiniMap";
import SearchableSelect from "@/Components/SearchableSelect";
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
    forth_bus_id?: number;
    back_bus_id?: number;
}

interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
}

interface Guardian {
    id: number;
    name: string;
}

interface LocationRequest {
    id: number;
    student_id: number;
    guardian_id: number;
    old_latitude: number;
    old_longitude: number;
    new_latitude: number;
    new_longitude: number;
    new_address?: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    created_at: string;
    student: Student;
    guardian: Guardian;
}

interface Props {
    auth: { user: any };
    locationRequests: {
        data: LocationRequest[];
        links: any;
        total: number;
    };
    buses: Bus[];
    stats?: {
        pending: number;
        approved: number;
    };
}

export default function LocationRequests({ auth, locationRequests, buses = [], stats }: Props) {
    const { isRTL: isRtl } = useTheme();
    const [processingRequest, setProcessingRequest] = useState<LocationRequest | null>(null);
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [forthBusId, setForthBusId] = useState<string | number>("");
    const [backBusId, setBackBusId] = useState<string | number>("");
    const [isProcessing, setIsProcessing] = useState(false);

    const openProcessModal = (request: LocationRequest, type: 'approve' | 'reject') => {
        setProcessingRequest(request);
        setAction(type);
        setRejectionReason("");
        setForthBusId(request.student?.forth_bus_id || "");
        setBackBusId(request.student?.back_bus_id || "");
    };

    const closeProcessModal = () => {
        if (isProcessing) return;
        setProcessingRequest(null);
        setAction(null);
    };

    const handleProcess = () => {
        if (!processingRequest || isProcessing) return;
        
        setIsProcessing(true);
        const routeName = action === 'approve' ? "school.location-requests.approve" : "school.location-requests.reject";
        
        router.post(route(routeName, processingRequest.id), {
            rejection_reason: rejectionReason,
            forth_bus_id: forthBusId,
            back_bus_id: backBusId,
        }, {
            onSuccess: () => {
                setIsProcessing(false);
                closeProcessModal();
            },
            onError: () => setIsProcessing(false),
            onFinish: () => setIsProcessing(false),
        });
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
                    {(isRtl ? 'طلبات تغيير الموقع' : 'Location Change Requests')}
                </h2>
            }
        >
            <Head title={(isRtl ? 'طلبات تغيير الموقع' : 'Location Change Requests')} />

            <div className="pb-8 space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={DS_card}>
                        <div className="p-6 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-[#0f2044]/5 dark:bg-[#0f2044]/30 flex items-center justify-center text-[#0f2044] dark:text-[#f5b800]">
                                <MapIcon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className={DS_statLabel}>{(isRtl ? 'إجمالي الطلبات' : 'Total Requests')}</p>
                                <p className={DS_statValue2('navy')}>{locationRequests?.total || 0}</p>
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
                                <p className={DS_statValue2('gold')}>{stats?.pending ?? locationRequests?.data?.filter((r: any) => r.status === 'pending').length ?? 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className={DS_card}>
                        <div className="p-6 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <CheckCircle className="w-7 h-7" />
                            </div>
                            <div>
                                <p className={DS_statLabel}>{(isRtl ? 'تمت الموافقة' : 'Approved')}</p>
                                <p className={DS_statValue2('green')}>{stats?.approved ?? locationRequests?.data?.filter((r: any) => r.status === 'approved').length ?? 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={DS_card}>
                    {/* Table Header Section */}
                    <div className="p-6 border-b border-gray-100 dark:border-[#243460] flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-[#0f2044] text-[#f5b800] rounded-xl">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#0f2044] dark:text-white">
                                    {(isRtl ? 'إدارة طلبات المواقع' : 'Manage Location Requests')}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {(isRtl ? 'مراجعة طلبات تغيير عناوين الطلاب المقدمة من أولياء الأمور.' : 'Review student address change requests submitted by guardians.')}
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
                                    <th className={DS_tableTh(isRtl)}>{(isRtl ? 'الموقع الحالي' : 'Current Location')}</th>
                                    <th className={DS_tableTh(isRtl)}>{(isRtl ? 'الموقع الجديد' : 'New Location')}</th>
                                    <th className={DS_tableTh(isRtl)}>{(isRtl ? 'التاريخ' : 'Date')}</th>
                                    <th className={DS_tableTh(isRtl)}>{(isRtl ? 'الحالة' : 'Status')}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#0f2044]/60 dark:text-[#7ba7e8]/70 uppercase text-end">{(isRtl ? 'الإجراءات' : 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#243460]">
                                {locationRequests?.data?.length > 0 ? (
                                    locationRequests.data.map((request) => (
                                        <tr key={request.id} className={DS_tableRow}>
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#0f2044]/5 flex items-center justify-center text-[#0f2044]">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-[#0f2044] dark:text-white">
                                                        {request.student?.full_name || (isRtl ? 'طالب غير معروف' : 'Unknown Student')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                                    {request.guardian?.name || (isRtl ? 'غير محدد' : 'Not specified')}
                                                </span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex flex-col gap-1">
                                                    {request.old_latitude && request.old_longitude ? (
                                                        <>
                                                            <MiniMap lat={request.old_latitude} lng={request.old_longitude} width={100} height={60} zoom={14} />
                                                            <span className="text-[10px] text-gray-400 font-mono">
                                                                {request.old_latitude.toFixed(4)}, {request.old_longitude.toFixed(4)}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <div className="w-[100px] h-[60px] rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] text-gray-400 text-center px-2">
                                                            {isRtl ? 'لم يحدد سابقاً' : 'Not set'}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex flex-col gap-1">
                                                    {request.new_latitude && request.new_longitude && !isNaN(Number(request.new_latitude)) && !isNaN(Number(request.new_longitude)) ? (
                                                        <>
                                                            <MiniMap lat={Number(request.new_latitude)} lng={Number(request.new_longitude)} width={100} height={60} zoom={14} />
                                                            <span className="text-[10px] text-emerald-600 font-mono font-bold">
                                                                {Number(request.new_latitude).toFixed(4)}, {Number(request.new_longitude).toFixed(4)}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <div className="w-[100px] h-[60px] rounded-lg bg-red-50 flex items-center justify-center text-[10px] text-red-400">
                                                            {isRtl ? 'إحداثيات غير صالحة' : 'Invalid Coordinates'}
                                                        </div>
                                                    )}
                                                    {request.new_address && (
                                                        <span className="text-[10px] text-gray-500 max-w-[100px] truncate" title={request.new_address}>
                                                            {request.new_address}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(request.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                                                </span>
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
                                            <div className="text-6xl mb-4 opacity-10">📍</div>
                                            <p className="text-gray-400 dark:text-gray-500 font-bold">
                                                {(isRtl ? 'لا يوجد طلبات تغيير موقع حالياً' : 'No location requests found')}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {locationRequests?.data?.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#243460] flex justify-between items-center bg-gray-50/50 dark:bg-transparent">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {(isRtl ? 'عرض' : 'Showing')} {locationRequests?.data?.length || 0} {(isRtl ? 'من أصل' : 'of')} {locationRequests?.total || 0}
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
                                        {action === 'approve' ? (isRtl ? 'الموافقة على تغيير الموقع' : 'Approve Location Change') : (isRtl ? 'رفض الطلب' : 'Reject Request')}
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
                                            {(isRtl ? 'مراجعة الطلب' : 'Review Request')}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {action === 'approve' 
                                                ? (isRtl ? 'هل توافق على تغيير موقع منزل الطالب' : 'Are you sure you want to approve the location change for') 
                                                : (isRtl ? 'هل تريد رفض طلب تغيير موقع منزل الطالب' : 'Are you sure you want to reject the location change for')} <strong>{processingRequest?.student?.full_name || (isRtl ? 'هذا الطالب' : 'this student')}</strong>؟
                                        </p>
                                    </div>
                                </div>

                                {action === 'approve' && (
                                    <>
                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{(isRtl ? 'الموقع الحالي' : 'Current')}</p>
                                                {processingRequest.old_latitude && processingRequest.old_longitude ? (
                                                    <MiniMap lat={processingRequest.old_latitude} lng={processingRequest.old_longitude} width={180} height={120} />
                                                ) : (
                                                    <div className="w-[180px] h-[120px] rounded-2xl bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                                                        {(isRtl ? 'غير محدد' : 'Not set')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-emerald-500 uppercase">{(isRtl ? 'الموقع المقترح' : 'Proposed')}</p>
                                                <MiniMap lat={processingRequest.new_latitude} lng={processingRequest.new_longitude} width={180} height={120} />
                                                {processingRequest.new_address && (
                                                    <div className="mt-2 p-2 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                                        <p className="text-[10px] text-gray-500 font-bold mb-1">{(isRtl ? 'العنوان النصي' : 'Textual Address')}</p>
                                                        <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-tight">{processingRequest.new_address}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 dark:bg-amber-500/10 dark:border-amber-500/20">
                                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                                                <Info className="w-4 h-4" />
                                                <p className="text-xs font-bold">{(isRtl ? 'تخصيص الحافلات (إلزامي)' : 'Bus Assignment (Mandatory)')}</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 block uppercase">{(isRtl ? 'حافلة الذهاب (الصباح)' : 'Morning Bus (Forth)')}</label>
                                                    <SearchableSelect
                                                        options={buses.map(b => ({ id: b.id, label: `${isRtl ? 'حافلة' : 'Bus'} ${b.bus_number} (${b.plate_number})` }))}
                                                        value={forthBusId}
                                                        onChange={setForthBusId}
                                                        placeholder={isRtl ? 'اختر حافلة الذهاب' : 'Select Morning Bus'}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 block uppercase">{(isRtl ? 'حافلة العودة (المساء)' : 'Afternoon Bus (Back)')}</label>
                                                    <SearchableSelect
                                                        options={buses.map(b => ({ id: b.id, label: `${isRtl ? 'حافلة' : 'Bus'} ${b.bus_number} (${b.plate_number})` }))}
                                                        value={backBusId}
                                                        onChange={setBackBusId}
                                                        placeholder={isRtl ? 'اختر حافلة العودة' : 'Select Afternoon Bus'}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

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
                                        disabled={isProcessing || (action === 'reject' && !rejectionReason.trim()) || (action === 'approve' && (!forthBusId || !backBusId))}
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
