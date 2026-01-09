import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';

interface BusRequest {
    id: number;
    school_id: number;
    school: { id: number; name: string };
    request_type: 'permanent' | 'temporary' | 'field_trip';
    number_of_buses: number;
    start_date: string;
    end_date?: string;
    reason: string;
    special_requirements?: string;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    approved_at?: string;
    created_at: string;
}

interface Props {
    auth: any;
    requests: BusRequest[];
}

export default function Index({ auth, requests }: Props) {
    const { t, isRtl } = useTranslation();
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<BusRequest | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const filteredRequests = requests.filter(req => 
        statusFilter === 'all' || req.status === statusFilter
    );

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const approvedCount = requests.filter(r => r.status === 'approved').length;
    const rejectedCount = requests.filter(r => r.status === 'rejected').length;

    const handleApprove = (request: BusRequest) => {
        if (confirm(t('Are you sure you want to approve this request?'))) {
            router.post(route('admin.bus-requests.approve', request.id));
        }
    };

    const handleReject = () => {
        if (selectedRequest) {
            router.post(route('admin.bus-requests.reject', selectedRequest.id), {
                rejection_reason: rejectionReason,
            }, {
                onSuccess: () => {
                    setShowRejectModal(false);
                    setSelectedRequest(null);
                    setRejectionReason('');
                }
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                    {t('Pending')}
                </span>;
            case 'approved':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">✅ {t('Approved')}</span>;
            case 'rejected':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">❌ {t('Rejected')}</span>;
            default:
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
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
        <AuthenticatedLayout
            header={
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {t('Bus Requests Management')}
                </h2>
            }
        >
            <Head title={t('Bus Requests')} />

            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Pending */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 p-6 shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-yellow-100 uppercase tracking-wider">{t('Pending')}</p>
                                <h3 className="text-5xl font-extrabold text-white mt-2">{pendingCount}</h3>
                            </div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                                <span className="text-5xl">⏳</span>
                            </div>
                        </div>
                    </div>

                    {/* Approved */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 shadow-2xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-green-100 uppercase tracking-wider">{t('Approved')}</p>
                                <h3 className="text-5xl font-extrabold text-white mt-2">{approvedCount}</h3>
                            </div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                                <span className="text-5xl">✅</span>
                            </div>
                        </div>
                    </div>

                    {/* Rejected */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 p-6 shadow-2xl hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-red-100 uppercase tracking-wider">{t('Rejected')}</p>
                                <h3 className="text-5xl font-extrabold text-white mt-2">{rejectedCount}</h3>
                            </div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                                <span className="text-5xl">❌</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                    >
                        <option value="all">{t('All Status')}</option>
                        <option value="pending">{t('Pending')}</option>
                        <option value="approved">{t('Approved')}</option>
                        <option value="rejected">{t('Rejected')}</option>
                    </select>
                </div>

                {/* Requests List */}
                {filteredRequests.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredRequests.map((request) => (
                            <div
                                key={request.id}
                                className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                            >
                                {/* Gradient Bar */}
                                <div className={`h-2 ${request.status === 'pending' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : request.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-pink-500'}`} />
                                
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                                        {/* Content */}
                                        <div className="flex-1 space-y-4">
                                            {/* Header */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                                                    {request.school.name}
                                                </h3>
                                                {getStatusBadge(request.status)}
                                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-semibold rounded-full">
                                                    {getTypeText(request.request_type)}
                                                </span>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">🚌 {t('Buses')}</p>
                                                    <p className="text-lg font-bold text-gray-800 dark:text-white">{request.number_of_buses}</p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">📅 {t('Start Date')}</p>
                                                    <p className="text-lg font-bold text-gray-800 dark:text-white">{new Date(request.start_date).toLocaleDateString()}</p>
                                                </div>
                                                {request.end_date && (
                                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">📅 {t('End Date')}</p>
                                                        <p className="text-lg font-bold text-gray-800 dark:text-white">{new Date(request.end_date).toLocaleDateString()}</p>
                                                    </div>
                                                )}
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">📝 {t('Submitted')}</p>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-white">{new Date(request.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            {/* Reason */}
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                                                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">{t('Reason')}:</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">{request.reason}</p>
                                            </div>

                                            {request.special_requirements && (
                                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
                                                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-1">{t('Special Requirements')}:</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{request.special_requirements}</p>
                                                </div>
                                            )}

                                            {request.rejection_reason && (
                                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border-l-4 border-red-500">
                                                    <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">{t('Rejection Reason')}:</p>
                                                    <p className="text-sm text-red-700 dark:text-red-400">{request.rejection_reason}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {request.status === 'pending' && (
                                            <div className="flex lg:flex-col gap-3">
                                                <button
                                                    onClick={() => handleApprove(request)}
                                                    className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                                >
                                                    ✅ {t('Approve')}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setShowRejectModal(true);
                                                    }}
                                                    className="flex-1 lg:flex-none px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                                >
                                                    ❌ {t('Reject')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                        <div className="text-8xl mb-6">📋</div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('No Requests Found')}</h3>
                        <p className="text-gray-500 dark:text-gray-400">No bus requests match your filter</p>
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                                    {t('Reject Request')}
                                </h3>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('Rejection Reason')} ({t('Optional')})
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-red-500"
                                        placeholder={t('Explain why this request was rejected...')}
                                    />
                                </div>

                                <div className="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => {
                                            setShowRejectModal(false);
                                            setSelectedRequest(null);
                                            setRejectionReason('');
                                        }}
                                        className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
                                    >
                                        {t('Cancel')}
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-700 transition-all shadow-lg"
                                    >
                                        {t('Reject Request')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
