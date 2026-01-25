import { FormEventHandler } from 'react';
import { useForm } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';

interface BusRequest {
    id: number;
    request_type: string;
    number_of_buses: number;
    start_date: string;
    end_date?: string;
    reason: string;
    special_requirements?: string;
}

interface Props {
    show: boolean;
    onClose: () => void;
    request?: BusRequest | null;
}

export default function BusRequestModal({ show, onClose, request }: Props) {
    const { t } = useTranslation();

    const { data, setData, post, put, processing, errors, reset } = useForm({
        request_type: request?.request_type || 'permanent',
        number_of_buses: request?.number_of_buses || 1,
        start_date: request?.start_date || '',
        end_date: request?.end_date || '',
        reason: request?.reason || '',
        special_requirements: request?.special_requirements || '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        
        if (request) {
            put(route('school.bus-requests.update', request.id), {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            post(route('school.bus-requests.store'), {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-[30px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar">
                {/* Header */}
                <div className="bg-[#0e7490] p-6 text-white">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-extrabold flex items-center gap-3">
                            <span className="text-3xl">{request ? '✏️' : '➕'}</span>
                            {request ? t('Edit Request') : t('New Bus Request')}
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-[12px] flex items-center justify-center text-white transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Request Type */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                            {t('Request Type')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={data.request_type}
                                onChange={e => setData('request_type', e.target.value)}
                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] appearance-none transition-all"
                                required
                            >
                                <option value="permanent">{t('Permanent Bus')}</option>
                                <option value="temporary">{t('Temporary Bus')}</option>
                            </select>
                        </div>
                        {errors.request_type && <p className="text-red-500 text-sm mt-2 ml-2">{errors.request_type}</p>}
                    </div>

                    {/* Number of Buses */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                            {t('Number of Buses')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={data.number_of_buses}
                            onChange={e => setData('number_of_buses', parseInt(e.target.value))}
                            className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                            required
                        />
                        {errors.number_of_buses && <p className="text-red-500 text-sm mt-2 ml-2">{errors.number_of_buses}</p>}
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                {t('Start Date')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={data.start_date}
                                onChange={e => setData('start_date', e.target.value)}
                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                                required
                            />
                            {errors.start_date && <p className="text-red-500 text-sm mt-2 ml-2">{errors.start_date}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                {t('End Date')} ({t('Optional')})
                            </label>
                            <input
                                type="date"
                                value={data.end_date}
                                onChange={e => setData('end_date', e.target.value)}
                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                            />
                            {errors.end_date && <p className="text-red-500 text-sm mt-2 ml-2">{errors.end_date}</p>}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                            {t('Reason')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={data.reason}
                            onChange={e => setData('reason', e.target.value)}
                            rows={3}
                            className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                            placeholder={t('Explain why you need this bus request...')}
                            required
                        />
                        {errors.reason && <p className="text-red-500 text-sm mt-2 ml-2">{errors.reason}</p>}
                    </div>

                    {/* Special Requirements */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                            {t('Special Requirements')} ({t('Optional')})
                        </label>
                        <textarea
                            value={data.special_requirements}
                            onChange={e => setData('special_requirements', e.target.value)}
                            rows={2}
                            className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                            placeholder={t('Any special requirements or notes...')}
                        />
                        {errors.special_requirements && <p className="text-red-500 text-sm mt-2 ml-2">{errors.special_requirements}</p>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-8 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-[35px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        >
                            {t('Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-8 py-3.5 bg-[#0e7490] text-white font-bold rounded-[35px] hover:bg-[#155e75] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {processing ? '⏳ ' + t('Saving...') : request ? '💾 ' + t('Update') : '➕ ' + t('Submit Request')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
