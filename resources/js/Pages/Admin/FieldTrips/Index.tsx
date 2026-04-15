import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import useTranslation from '@/hooks/useTranslation';
import AdminFieldTripDetailsModal from './Partials/AdminFieldTripDetailsModal';

interface School {
    id: number;
    name: string;
}

interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
    driver?: {
        id: number;
        first_name_ar: string;
        last_name_ar: string;
    };
}

interface FieldTrip {
    id: number;
    name: string;
    description: string;
    date: string;
    departure_time: string;
    arrival_time: string | null;
    destination_address: string;
    status: string;
    cost: string | null;
    school: School;
    bus?: Bus;
    students_count: number;
    internal_teachers_count: number;
}

interface Props {
    auth: any;
    fieldTrips: FieldTrip[];
    buses: Bus[];
}

export default function Index({ auth, fieldTrips, buses }: Props) {
    const { isRTL } = useTheme();
    const { t } = useTranslation();
    
    // Detailed View Logic
    const [viewTripId, setViewTripId] = useState<number | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Approval Logic
    const [selectedTrip, setSelectedTrip] = useState<FieldTrip | null>(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [cost, setCost] = useState('');
    const [selectedBus, setSelectedBus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Rejection Logic
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const openDetails = (id: number) => {
        setViewTripId(id);
        setIsDetailsModalOpen(true);
    };

    const openApproveModal = (trip: FieldTrip) => {
        setSelectedTrip(trip);
        setCost(trip.cost || '');
        setSelectedBus(trip.bus?.id?.toString() || '');
        setIsApproveModalOpen(true);
    };

    const handleApprove = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrip || !cost || !selectedBus) return;

        setIsSubmitting(true);
        router.post(route('admin.field-trips.approve', selectedTrip.id), {
            cost: cost,
            bus_id: selectedBus,
        }, {
            onSuccess: () => {
                setIsApproveModalOpen(false);
                setSelectedTrip(null);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const openRejectModal = (trip: FieldTrip) => {
        setSelectedTrip(trip);
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrip) return;
        setIsSubmitting(true);
        router.post(route('admin.field-trips.reject', selectedTrip.id), {
            rejection_reason: rejectionReason,
        }, {
            onSuccess: () => {
                setIsRejectModalOpen(false);
                setSelectedTrip(null);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending':
                return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200";
            case 'approved':
                return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200";
            case 'cancelled':
            case 'rejected':
                return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200";
            default:
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200";
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-brand-yellow/10 rounded-2xl animate-pulse">🚚</span>
                            {t('Field Trips Logistics')}
                        </h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-1 ml-1">
                            {t('Fleet Management & Deployment Approval')}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={t('Field Trips Management')} />

            <div className={`mt-8 ${isRTL ? 'rtl font-cairo' : 'ltr'}`}>
                
                {/* Statistics - Premium Design */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: t('Total Requests'), val: fieldTrips.length, icon: '📊', color: 'bg-white' },
                        { label: t('Pending Review'), val: fieldTrips.filter(t => t.status === 'pending').length, icon: '⏳', color: 'bg-amber-50' },
                        { label: t('Approved Fleet'), val: fieldTrips.filter(t => t.status === 'approved').length, icon: '✅', color: 'bg-emerald-50' },
                        { label: t('Active/Past'), val: fieldTrips.filter(t => !['pending', 'approved'].includes(t.status)).length, icon: '🏁', color: 'bg-blue-50' },
                    ].map((stat, i) => (
                        <div key={i} className={`${stat.color} dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl hover:-translate-y-1 group`}>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-3xl group-hover:scale-125 transition-transform duration-500">{stat.icon}</span>
                                <div className="h-2 w-12 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                     <div className="h-full bg-brand-navy rounded-full w-2/3"></div>
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-4xl font-black text-gray-800 dark:text-white">{stat.val}</p>
                        </div>
                    ))}
                </div>

                {/* Table Section */}
                <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/30 dark:bg-gray-900/30">
                        <h3 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-brand-yellow rounded-full"></span>
                            {t('Logistics Pipeline')}
                        </h3>
                        <div className="flex gap-2">
                             <div className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-inner">
                                {t('Operational View')}
                             </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-start border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-start">{t('Identity')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-start">{t('Schedule')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t('Pax & Faculty')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t('Assets & Quote')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t('Status')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t('Ops')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {fieldTrips.length > 0 ? fieldTrips.map((trip) => (
                                    <tr key={trip.id} className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xl shadow-inner group-hover:bg-brand-navy group-hover:text-white transition-all transform group-hover:rotate-6">
                                                     🏢
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-800 dark:text-white text-base leading-tight">
                                                        {trip.name}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-brand-navy dark:text-brand-yellow">{trip.school?.name}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span className="text-[10px] text-gray-400 font-bold truncate max-w-[150px]">📍 {trip.destination_address}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-sm font-black text-gray-800 dark:text-gray-200">
                                                    📅 {(trip.date as any).split('T')[0]}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <span className="p-1 bg-gray-100 dark:bg-gray-900 rounded-md">🕐</span>
                                                    {trip.departure_time} {trip.arrival_time ? `→ ${trip.arrival_time}` : ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-black text-gray-800 dark:text-white leading-none">{trip.students_count}</span>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('Students')}</span>
                                                </div>
                                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-black text-purple-600 dark:text-purple-400 leading-none">{trip.internal_teachers_count}</span>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t('Staff')}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {trip.bus ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="px-3 py-1 bg-brand-navy text-white rounded-full text-[10px] font-black shadow-lg">
                                                        🚌 {trip.bus.bus_number}
                                                    </div>
                                                    <div className="text-[11px] font-black text-emerald-600">
                                                        {trip.cost} ر.س
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
                                                    --- {t('Pending Logistics')} ---
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 text-[9px] font-black rounded-xl border uppercase tracking-widest ${getStatusStyles(trip.status)}`}>
                                                {t(trip.status.charAt(0).toUpperCase() + trip.status.slice(1))}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openDetails(trip.id)}
                                                    className="p-3 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded-2xl hover:bg-brand-navy hover:text-white transition-all shadow-sm group-hover:shadow-lg"
                                                    title={t('Inspect Request')}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>

                                                {trip.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openApproveModal(trip)}
                                                            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                                        >
                                                            {t('Quote & Assign')}
                                                        </button>
                                                        <button
                                                            onClick={() => openRejectModal(trip)}
                                                            className="p-3 bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                            title={t('Decline Request')}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center text-4xl mb-4 grayscale opacity-50">📫</div>
                                                <p className="text-sm font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest">{t('Logistics pipeline is empty')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detailed Inspection Modal */}
            <AdminFieldTripDetailsModal
                show={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                tripId={viewTripId}
            />

            {/* Premium Approval Modal */}
            {isApproveModalOpen && selectedTrip && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden transform animate-slideUp border border-gray-100 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
                        <div className="p-10 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                            <h3 className="text-3xl font-black tracking-tight leading-none mb-2">
                                {t('Finalize Logistics')}
                            </h3>
                            <p className="text-emerald-100/60 text-xs font-bold uppercase tracking-widest">
                                {selectedTrip.name} • {selectedTrip.school?.name}
                            </p>
                        </div>

                        <form onSubmit={handleApprove} className="p-10 space-y-8">
                            <div className="space-y-6">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1 transition-colors group-focus-within:text-emerald-500">
                                        {t('Service Quote (SAR)')}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 font-black">SAR</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={cost}
                                            onChange={(e) => setCost(e.target.value)}
                                            className="w-full bg-gray-50/50 dark:bg-gray-900/50 border-2 border-gray-100 dark:border-gray-800 rounded-[1.5rem] pl-16 pr-6 py-5 focus:border-emerald-500 focus:ring-0 text-lg font-black transition-all outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1 transition-colors group-focus-within:text-emerald-500">
                                        {t('Asset Deployment')}
                                    </label>
                                    <select
                                        required
                                        value={selectedBus}
                                        onChange={(e) => setSelectedBus(e.target.value)}
                                        className="w-full bg-gray-50/50 dark:bg-gray-900/50 border-2 border-gray-100 dark:border-gray-800 rounded-[1.5rem] px-6 py-5 focus:border-emerald-500 focus:ring-0 text-sm font-black transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>{t('--- Select Heavy Asset ---')}</option>
                                        {buses.map(bus => (
                                            <option key={bus.id} value={bus.id}>
                                                {bus.bus_number} 📡 {bus.plate_number} ({bus.capacity} {t('seats')})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="mt-3 flex items-center gap-2 px-1">
                                         <span className="p-1 bg-gray-100 dark:bg-gray-700 rounded text-[8px]">⚠️</span>
                                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                            {t('Operational limit:')} {selectedTrip.students_count} {t('requested seats')}
                                         </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsApproveModalOpen(false)}
                                    className="flex-1 py-5 bg-gray-50 dark:bg-gray-900 text-gray-400 font-black rounded-[1.5rem] hover:bg-gray-100 transition-all uppercase tracking-widest text-[10px]"
                                >
                                    {t('Abort')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-[1.5rem] transition-all flex justify-center items-center gap-3 shadow-2xl shadow-emerald-500/30 disabled:opacity-50 uppercase tracking-widest text-[10px]"
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>{t('Confirm Deployment')}</span>
                                            <span className="text-lg leading-none">🚀</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Premium Rejection Modal */}
            {isRejectModalOpen && selectedTrip && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden transform animate-slideUp border border-gray-100 dark:border-gray-700" dir={isRTL ? 'rtl' : 'ltr'}>
                        <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 dark:text-white leading-none mb-1">
                                    {t('Decline Requisition')}
                                </h3>
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest italic">
                                    {selectedTrip.name}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-lg">🚫</div>
                        </div>

                        <form onSubmit={handleRejectSubmit} className="p-8">
                            <div className="mb-8">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                                    {t('Official Reason (Optional)')}
                                </label>
                                <textarea
                                    rows={4}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className="w-full bg-gray-50/50 dark:bg-gray-900/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 focus:border-rose-500 focus:ring-0 text-sm font-bold transition-all resize-none outline-none"
                                    placeholder={t('Detail why this request cannot be fulfilled...')}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="flex-1 py-4 bg-gray-50 dark:bg-gray-900 text-gray-400 font-black rounded-2xl text-[10px] uppercase tracking-widest"
                                >
                                    {t('Back')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-rose-600/20 disabled:opacity-50 text-[10px] uppercase tracking-widest"
                                >
                                    {isSubmitting ? t('Processing...') : t('Final Rejection')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
