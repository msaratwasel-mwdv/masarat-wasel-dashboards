import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';

interface BusRequestsProps {
    auth: any;
    requests: any[];
}

export default function BusRequestsList({ auth, requests: serverRequests }: BusRequestsProps) {
    const { t, isRtl } = useTranslation();

    // Use real server data
    const requests = serverRequests || [];

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    const { data, setData, post, processing, errors, reset } = useForm({
        request_type: 'permanent',
        number_of_buses: 1,
        start_date: '',
        end_date: '',
        reason: '',
        special_requirements: '',
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
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{t('Pending')}</span>;
            case 'approved':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t('Approved')}</span>;
            case 'rejected':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{t('Rejected')}</span>;
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
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {t('My Bus Requests')}
                    </h2>
                </div>
            }
        >
            <Head title={t('Bus Requests')} />

            <div className="space-y-6">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <Link
                        href={route('school.buses.index')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        ← {t('Back to Buses')}
                    </Link>

                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        >
                            <option value="all">{t('All Status')}</option>
                            <option value="pending">{t('Pending')}</option>
                            <option value="approved">{t('Approved')}</option>
                            <option value="rejected">{t('Rejected')}</option>
                        </select>

                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="px-6 py-2 bg-brand-yellow text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-colors whitespace-nowrap"
                        >
                            + {t('Request Additional Bus')}
                        </button>
                    </div>
                </div>


                {/* Premium Requests Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {filteredRequests.length > 0 ? (
                        filteredRequests.map((request) => (
                            <div key={request.id} className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                                {/* Top Gradient Bar */}
                                <div className={`h-2 ${
                                    request.status === 'pending' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                    request.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                    'bg-gradient-to-r from-red-400 to-pink-500'
                                }`} />

                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                                                request.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                                request.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30' :
                                                'bg-red-100 dark:bg-red-900/30'
                                            }`}>
                                                <span className="text-3xl">
                                                    {request.request_type === 'permanent' ? '🔄' : request.request_type === 'field_trip' ? '🎒' : '⏰'}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                                                    {getTypeText(request.request_type)}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {t('Submitted')} {new Date(request.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(request.status)}
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        {/* Number of Buses */}
                                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
    <div className="flex items-center gap-3">
        <span className="text-3xl">🚌</span>
        <div className="flex-1">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">{t('Number of Buses')}</p>
            <p className="text-2xl font-extrabold text-gray-800 dark:text-white">{request.number_of_buses}</p>
        </div>
    </div>
</div>

                                        {/* Start Date */}
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">📅</span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">{t('Start Date')}</p>
                                                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                                                        {new Date(request.start_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* End Date */}
                                        {request.end_date && (
                                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl">🏁</span>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">{t('End Date')}</p>
                                                        <p className="text-lg font-bold text-gray-800 dark:text-white">
                                                            {new Date(request.end_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Reason */}
                                    <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 p-5 rounded-xl border border-orange-200 dark:border-orange-800 mb-4">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl mt-1">📝</span>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-2">{t('Reason')}:</p>
                                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{request.reason}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Special Requirements */}
                                    {request.special_requirements && (
                                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-purple-200 dark:border-purple-800 mb-4">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl mt-1">⭐</span>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-purple-700 dark:text-purple-400 mb-2">{t('Special Requirements')}:</p>
                                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{request.special_requirements}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rejection Reason */}
                                    {request.rejection_reason && (
                                        <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 p-5 rounded-xl border-2 border-red-300 dark:border-red-700">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl mt-1">❌</span>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">{t('Rejection Reason')}:</p>
                                                    <p className="text-red-800 dark:text-red-300 font-medium">{request.rejection_reason}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Approval Info */}
                                    {request.status === 'approved' && request.approved_at && (
                                        <div className="mt-4 flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl">
                                            <span className="text-3xl">✅</span>
                                            <p className="text-sm font-bold text-green-700 dark:text-green-400">
                                                {t('Approved on')} {new Date(request.approved_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">📝</div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                {t('No Requests Found')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {t('You haven\'t submitted any bus requests yet')}
                            </p>
                            <button
                                onClick={() => setShowRequestModal(true)}
                                className="px-6 py-2 bg-brand-yellow text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-colors"
                            >
                                {t('Submit Your First Request')}
                            </button>
                        </div>
                    )}
                </div>


                {/* Premium Request Modal */}
                {showRequestModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform animate-slideUp">
                            {/* Header with Gradient */}
                            <div className="relative overflow-hidden bg-gradient-to-r from-brand-yellow via-orange-400 to-orange-500 p-8">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                                <div className="relative flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                                        <span className="text-4xl">🚌</span>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-extrabold text-white drop-shadow-lg">
                                            {t('Request Additional Bus')}
                                        </h3>
                                        <p className="text-white/90 text-sm mt-1">{t('Fill out the form below to submit your request')}</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                                {/* Request Type */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        <span className="text-xl">🏷️</span>
                                        {t('Request Type')} <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={data.request_type}
                                        onChange={e => setData('request_type', e.target.value)}
                                        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-all font-semibold"
                                        required
                                    >
                                        <option value="permanent">🔄 {t('Permanent')}</option>
                                        <option value="temporary">⏰ {t('Temporary')}</option>
                                        <option value="field_trip">🎒 {t('Field Trip')}</option>
                                    </select>
                                </div>

                                {/* Number of Buses */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        <span className="text-xl">🚌</span>
                                        {t('Number of Buses')} <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.number_of_buses}
                                            onChange={e => setData('number_of_buses', parseInt(e.target.value))}
                                            className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-all font-semibold"
                                            required
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setData('number_of_buses', Math.max(1, data.number_of_buses - 1))}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                            >
                                                −
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('number_of_buses', data.number_of_buses + 1)}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                            <span className="text-xl">📅</span>
                                            {t('Start Date')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={data.start_date}
                                            onChange={e => setData('start_date', e.target.value)}
                                            className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>

                                    {(data.request_type === 'temporary' || data.request_type === 'field_trip') && (
                                        <div className="space-y-2 animate-slideDown">
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                                <span className="text-xl">📅</span>
                                                {t('End Date')}
                                            </label>
                                            <input
                                                type="date"
                                                value={data.end_date}
                                                onChange={e => setData('end_date', e.target.value)}
                                                className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-all"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Reason */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        <span className="text-xl">📝</span>
                                        {t('Reason')} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={data.reason}
                                        onChange={e => setData('reason', e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-all resize-none"
                                        placeholder={t('Explain the reason for this request...')}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{data.reason.length}/1000</p>
                                </div>

                                {/* Special Requirements */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        <span className="text-xl">⭐</span>
                                        {t('Special Requirements')}
                                    </label>
                                    <textarea
                                        value={data.special_requirements}
                                        onChange={e => setData('special_requirements', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-all resize-none"
                                        placeholder={t('Any special requirements or notes...')}
                                    />
                                </div>

                                {/* Footer Actions */}
                                <div className="flex gap-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowRequestModal(false);
                                            reset();
                                        }}
                                        className="flex-1 px-6 py-3.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-bold"
                                    >
                                        ❌ {t('Cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 px-6 py-3.5 bg-gradient-to-r from-brand-yellow to-orange-500 text-gray-900 font-extrabold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {processing ? '⏳ ' + t('Submitting...') : '✅ ' + t('Submit Request')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </SchoolAuthenticatedLayout>
    );
}
