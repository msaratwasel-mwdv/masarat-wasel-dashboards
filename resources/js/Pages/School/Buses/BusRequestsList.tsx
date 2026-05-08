import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
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
    Clock
} from 'lucide-react';
import OmaniRial from '@/Components/OmaniRial';
import {
    DS_pageWrapper,
    DS_pageTitle,
    DS_sectionHeader,
    DS_searchInput,
    DS_btnGold,
    DS_modalHeader,
    DS_submitBtn,
    DS_cancelBtn,
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

    // Listen for real-time status updates on bus requests
    useEchoEvent(
        'private',
        `App.Models.User.${auth.user.id}`,
        '.bus-request.status-changed',
        (e: any) => {
            // Toast is now handled globally in SchoolAuthenticatedLayout
            router.reload({ only: ['requests'], preserveState: true, preserveScroll: true });
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
                return <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-[8px] bg-[#f5b800]/20 text-[#7a5c00] dark:bg-[#f5b800]/10 dark:text-[#f5b800] border border-[#f5b800]/30"><CheckCircle2 className="w-3.5 h-3.5" />{t('Approved')}</span>;
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
                                className="bg-white dark:bg-[#1a2845] rounded-[24px] shadow-sm border border-gray-100 dark:border-[#243460] overflow-hidden hover:shadow-md transition-all flex flex-col"
                            >
                                {/* Top Color Indicator */}
                                <div className={`h-1.5 w-full ${
                                    request.status === 'pending' ? 'bg-yellow-400' :
                                    request.status === 'approved' ? 'bg-[#0f2044]' :
                                    'bg-red-500'
                                }`} />

                                <div className="p-5 flex flex-col flex-1">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 rounded-[14px] flex items-center justify-center text-[#0f2044] dark:text-[#7ba7e8]">
                                                <BusIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-[#0f2044] dark:text-white">
                                                    {getTypeText(request.request_type)}
                                                </h3>
                                                <p className="text-xs font-semibold text-gray-500">
                                                    {t('Submitted')}: {new Date(request.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>

                                    {/* Quick Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <div className="bg-gray-50 dark:bg-[#0f2044]/20 p-3 rounded-[16px]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">{t('Required Seats')}</span>
                                            </div>
                                            <p className="text-xl font-black text-[#0f2044] dark:text-white">{request.seats}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-[#0f2044]/20 p-3 rounded-[16px]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">{t('Start Date')}</span>
                                            </div>
                                            <p className="text-sm font-bold text-[#0f2044] dark:text-white mt-1">
                                                {new Date(request.start_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Approved Cost */}
                                    {request.status === 'approved' && request.cost && (
                                        <div className="mb-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-4 rounded-[16px] flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                    <OmaniRial size="1.2em" />
                                                </div>
                                                <span className="text-sm font-bold text-[#0f2044] dark:text-white">{t('Approved Price')}</span>
                                            </div>
                                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                                {request.cost}
                                            </p>
                                        </div>
                                    )}

                                    {/* Text Info */}
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mb-1">
                                                <FileText className="w-3.5 h-3.5" />
                                                {t('Purpose')}
                                            </div>
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 line-clamp-2">
                                                {request.purpose}
                                            </p>
                                        </div>
                                        
                                        {request.rejection_reason && (
                                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-[12px]">
                                                <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mb-0.5">{t('Rejection Reason')}:</p>
                                                <p className="text-xs font-semibold text-red-800 dark:text-red-300">{request.rejection_reason}</p>
                                            </div>
                                        )}
                                    </div>
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
            </div>
        </SchoolAuthenticatedLayout>
    );
}
