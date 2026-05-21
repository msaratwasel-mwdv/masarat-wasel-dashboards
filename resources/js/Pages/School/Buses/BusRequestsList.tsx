import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import Modal from '@/Components/Modal';
import { motion } from 'framer-motion';
import {
    Bus as BusIcon,
    Calendar,
    Users,
    FileText,
    Info,
    ArrowLeft,
    ArrowRight,
    Plus,
    XCircle,
    CheckCircle2,
    Clock,
    Printer
} from 'lucide-react';
import OmaniRial from '@/Components/OmaniRial';
import BusRequestInvoice from '@/Components/Reports/BusRequestInvoice';
import {
    DS_pageWrapper,
    DS_pageTitle,
    DS_sectionHeader,
    DS_searchInput,
    DS_btnGold,
    DS_modalHeader,
    DS_submitBtn,
    DS_cancelBtn,
    DS_card,
} from '@/lib/DS';
import { useEchoEvent } from '@/hooks/useEcho';
import { useRealtimeToast } from '@/hooks/useRealtimeToast';

interface BusRequestsProps {
    auth: any;
    requests: any[];
}

export default function BusRequestsList({ auth, requests: serverRequests }: BusRequestsProps) {
    const { t, isRtl } = useTranslation();
    const { notifyEvent } = useRealtimeToast();
    const [selectedInvoiceRequest, setSelectedInvoiceRequest] = useState<any | null>(null);

    const getCrewName = (person?: any) => {
        if (!person) return isRtl ? "غير معين" : "Not Assigned";
        const actualPerson = person.user || person;

        const nameAr = actualPerson.first_name_ar || actualPerson.last_name_ar
            ? `${actualPerson.first_name_ar || ""} ${actualPerson.last_name_ar || ""}`.trim()
            : actualPerson.name;

        const nameEn = actualPerson.first_name_en || actualPerson.last_name_en
            ? `${actualPerson.first_name_en || ""} ${actualPerson.last_name_en || ""}`.trim()
            : actualPerson.name_en;

        const email = actualPerson.email || "";

        if (isRtl) {
            return nameAr || nameEn || email || "غير معين";
        } else {
            return nameEn || nameAr || email || "Not Assigned";
        }
    };

    // Listen for real-time status updates on bus requests
    useEchoEvent(
        'private',
        `App.Models.User.${auth.user.id}`,
        '.bus-request.status-changed',
        (e: any) => {
            // Toast is now handled globally in SchoolAuthenticatedLayout
            router.reload({ only: ['requests'], preserveState: true, preserveScroll: true } as any);
        }
    );

    const requests = serverRequests || [];

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    const { data, setData, post, processing, errors, reset } = useForm({
        request_type: 'permanent',
        seats: 20,
        start_date: '',
        end_date: '',
        purpose: '',
        details: '',
    });

    const filteredRequests = requests.filter(req =>
        statusFilter === 'all' || req.status === statusFilter
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('school.bus-requests.store'), {
            onSuccess: () => {
                setShowRequestModal(false);
                reset();
            }
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-[8px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50"><Clock className="w-3.5 h-3.5" />{t('Pending')}</span>;
            case 'approved':
                return <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-[8px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"><CheckCircle2 className="w-3.5 h-3.5" />{t('Approved')}</span>;
            case 'rejected':
                return <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-[8px] bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50"><XCircle className="w-3.5 h-3.5" />{t('Rejected')}</span>;
            default:
                return <span className="px-3 py-1 text-xs font-bold rounded-[8px] bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const getTypeText = (type: string) => {
        switch (type) {
            case 'permanent': return t('Permanent');
            case 'temporary': return t('Temporary');
            case 'field_trip': return t('Field Trip');
            default: return type;
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={<h2 className={DS_pageTitle}>{t('My Bus Requests')}</h2>}
        >
            <Head title={t('Bus Requests')} />

            <div className={DS_pageWrapper}>
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <Link
                        href={route('school.buses.index')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-[#0f2044] dark:hover:text-white transition-all bg-white dark:bg-[#1a2845] rounded-[14px] shadow-sm border border-gray-100 dark:border-[#243460]"
                    >
                        {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        {t('Back to Buses')}
                    </Link>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className={`${DS_searchInput} w-full sm:w-48 font-semibold`}
                        >
                            <option value="all">{t('All Status')}</option>
                            <option value="pending">{t('Pending')}</option>
                            <option value="approved">{t('Approved')}</option>
                            <option value="rejected">{t('Rejected')}</option>
                        </select>

                        <button
                            onClick={() => setShowRequestModal(true)}
                            className={DS_btnGold}
                        >
                            <Plus className="w-4 h-4" />
                            {t('Request Additional Bus')}
                        </button>
                    </div>
                </div>

                {/* Requests Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRequests.length > 0 ? (
                        filteredRequests.map((request, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={request.id}
                                className={`${DS_card} hover:shadow-md flex flex-col`}
                            >
                                {/* Top Color Indicator */}
                                <div className={`h-1 w-full ${
                                    request.status === 'pending' ? 'bg-yellow-400' :
                                    request.status === 'approved' ? 'bg-[#0f2044]' :
                                    'bg-red-500'
                                }`} />

                                <div className="p-4 flex flex-col flex-1 gap-3.5">
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 rounded-[10px] flex items-center justify-center text-[#0f2044] dark:text-[#7ba7e8]">
                                                <BusIcon className="w-4.5 h-4.5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-[#0f2044] dark:text-white leading-tight">
                                                    {getTypeText(request.request_type)}
                                                </h3>
                                                <p className="text-[10px] font-bold text-gray-400 leading-none mt-0.5">
                                                    {t('Submitted')}: {new Date(request.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                                        <div className="bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">{t('Required Seats')}</span>
                                            <span className="text-base font-black text-[#0f2044] dark:text-white leading-tight">{request.seats}</span>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">{t('Start Date')}</span>
                                            <span className="text-xs font-extrabold text-[#0f2044] dark:text-white leading-normal mt-0.5">
                                                {new Date(request.start_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Approved Cost */}
                                    {request.status === 'approved' && request.cost && (
                                        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-800/20 p-2.5 rounded-xl flex items-center justify-between text-xs">
                                            <span className="font-bold text-[#0f2044] dark:text-gray-300">{t('Approved Price')}</span>
                                            <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                {request.cost} <OmaniRial size="1em" />
                                            </span>
                                        </div>
                                    )}

                                    {/* Assigned Bus & Crew Details */}
                                    {request.bus && (
                                        <div className="bg-[#0f2044]/5 dark:bg-[#0f2044]/15 border border-[#0f2044]/10 dark:border-[#243460] p-3 rounded-xl flex flex-col gap-2 text-xs">
                                            <div className="flex justify-between items-center pb-1.5 border-b border-gray-200/50 dark:border-gray-700">
                                                <span className="font-black text-[#0f2044] dark:text-white flex items-center gap-1.5">
                                                    <BusIcon className="w-3.5 h-3.5 text-[#f5b800]" />
                                                    #{request.bus.bus_number}
                                                </span>
                                                <span className="text-[9px] font-black bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                                    {request.bus.plate_number}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold opacity-60 dark:text-slate-50  text-[10px]">{isRtl ? 'السائق:' : 'Driver:'}</span>
                                                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">{getCrewName(request.bus.driver)}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold opacity-60  dark:text-slate-50 text-[10px]">{isRtl ? 'المشرفة:' : 'Supervisor:'}</span>
                                                    <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">{getCrewName(request.bus.assistant)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Text Info */}
                                    <div className="bg-gray-50 dark:bg-gray-800/20 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                                        <span className="text-[9px] font-bold text-gray-400 block mb-1">{t('Purpose')}</span>
                                        <p className="font-bold text-[#0f2044] dark:text-gray-300 line-clamp-1">
                                            {request.purpose}
                                        </p>
                                        {request.rejection_reason && (
                                            <div className="mt-1.5 pt-1.5 border-t border-red-100 dark:border-red-900/20">
                                                <span className="text-[9px] font-bold text-red-600 block">{t('Rejection Reason')}</span>
                                                <p className="text-red-700 dark:text-red-400 font-semibold">{request.rejection_reason}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Print Button */}
                                    <button
                                        onClick={() => setSelectedInvoiceRequest(request)}
                                        className="w-full mt-auto py-2 px-3 rounded-xl bg-[#0f2044]/5 hover:bg-[#f5b800] hover:text-[#0f2044] text-[#0f2044] dark:text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                    >
                                        <Printer className="w-3.5 h-3.5" />
                                        {isRtl ? 'التقرير الرسمي / الفاتورة' : 'Official Report / Invoice'}
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white dark:bg-[#1a2845] rounded-[24px] shadow-sm border border-gray-100 dark:border-[#243460] p-16 text-center">
                            <div className="w-20 h-20 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 rounded-[20px] flex items-center justify-center mx-auto mb-5 text-[#0f2044] dark:text-[#7ba7e8]">
                                <BusIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-[#0f2044] dark:text-white mb-2">
                                {t('No Requests Found')}
                            </h3>
                            <p className="text-gray-500 font-semibold mb-6">
                                {t('You haven\'t submitted any bus requests yet')}
                            </p>
                            <button
                                onClick={() => setShowRequestModal(true)}
                                className={DS_btnGold + " mx-auto"}
                            >
                                <Plus className="w-4 h-4" />
                                {t('Submit Your First Request')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Request Modal */}
                <Modal show={showRequestModal} onClose={() => setShowRequestModal(false)} maxWidth="2xl">
                    <div className={DS_modalHeader(isRtl)}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-[14px] flex items-center justify-center">
                                <BusIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className={isRtl ? "text-right" : "text-left"}>
                                <h3 className="text-2xl font-bold text-white">
                                    {t('Request Additional Bus')}
                                </h3>
                                <p className="text-[#7ba7e8] text-sm font-semibold mt-0.5">
                                    {t('Fill out the form below to submit your request')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Request Type */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 ms-1">
                                    {t('Request Type')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.request_type}
                                    onChange={e => setData('request_type', e.target.value)}
                                    className={`${DS_searchInput} font-semibold`}
                                    required
                                >
                                    <option value="permanent">{t('Permanent')}</option>
                                    <option value="temporary">{t('Temporary')}</option>
                                </select>
                            </div>

                            {/* Number of Seats */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 ms-1">
                                    {t('Required Seats')} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.seats}
                                        onChange={e => setData('seats', parseInt(e.target.value))}
                                        className={`${DS_searchInput} font-bold`}
                                        required
                                    />
                                    <div className={`absolute ${isRtl ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 flex gap-1`}>
                                        <button
                                            type="button"
                                            onClick={() => setData('seats', Math.max(1, data.seats - 1))}
                                            className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-[#243460] rounded-[10px] text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition-colors font-bold"
                                        >
                                            −
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData('seats', data.seats + 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-[#0f2044]/10 dark:bg-[#243460] rounded-[10px] text-[#0f2044] dark:text-[#7ba7e8] hover:bg-[#0f2044]/20 transition-colors font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 ms-1">
                                    {t('Start Date')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.start_date}
                                    onChange={e => setData('start_date', e.target.value)}
                                    className={`${DS_searchInput} font-semibold`}
                                    required
                                />
                            </div>

                            {(data.request_type === 'temporary' || data.request_type === 'field_trip') && (
                                <div className="space-y-2 animate-slideDown">
                                    <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 ms-1">
                                        {t('End Date')}
                                    </label>
                                    <input
                                        type="date"
                                        value={data.end_date}
                                        onChange={e => setData('end_date', e.target.value)}
                                        className={`${DS_searchInput} font-semibold`}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 ms-1">
                                {t('Purpose')} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={data.purpose}
                                onChange={e => setData('purpose', e.target.value)}
                                rows={3}
                                className={`${DS_searchInput} resize-none`}
                                placeholder={t('Explain the purpose of this request...')}
                                required
                            />
                        </div>

                        {/* Details */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 ms-1">
                                {t('Details')}
                            </label>
                            <textarea
                                value={data.details}
                                onChange={e => setData('details', e.target.value)}
                                rows={2}
                                className={`${DS_searchInput} resize-none`}
                                placeholder={t('Any special requirements or details...')}
                            />
                        </div>

                        <div className={`flex gap-3 pt-4 border-t border-gray-100 dark:border-[#243460] ${isRtl ? 'justify-start' : 'justify-end'}`}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRequestModal(false);
                                    reset();
                                }}
                                className={DS_cancelBtn}
                            >
                                {t('Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className={DS_submitBtn(processing)}
                            >
                                {processing ? t('Submitting...') : t('Submit Request')}
                            </button>
                        </div>
                    </form>
                </Modal>

                {/* Print/Invoice Preview Modal */}
                <BusRequestInvoice
                    show={!!selectedInvoiceRequest}
                    onClose={() => setSelectedInvoiceRequest(null)}
                    request={selectedInvoiceRequest}
                    isRtl={isRtl}
                    schoolName={auth.user?.school?.name || auth.user?.name}
                />
            </div>
        </SchoolAuthenticatedLayout>
    );
}
