import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';

interface School {
    id: number;
    name: string;
}

interface Bus {
    id: number;
    name: string;
    capacity: number;
    driver?: {
        name: string;
    };
}

interface FieldTrip {
    id: number;
    trip_name: string;
    description: string;
    trip_date: string;
    trip_time: string;
    destination: string;
    duration_days: number;
    number_of_students: number;
    status: string;
    cost: number | null;
    school: School;
    bus?: Bus;
}

interface Props {
    auth: any;
    fieldTrips: FieldTrip[];
    buses: Bus[];
}

export default function Index({ auth, fieldTrips, buses }: Props) {
    const { isRTL } = useTheme();
    const [selectedTrip, setSelectedTrip] = useState<FieldTrip | null>(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

    const [cost, setCost] = useState('');
    const [selectedBus, setSelectedBus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reject Modal state
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [tripToReject, setTripToReject] = useState<FieldTrip | null>(null);

    const openApproveModal = (trip: FieldTrip) => {
        setSelectedTrip(trip);
        setCost(trip.cost?.toString() || '');
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
        setTripToReject(trip);
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tripToReject) return;
        setIsSubmitting(true);
        router.post(route('admin.field-trips.reject', tripToReject.id), {
            rejection_reason: rejectionReason,
        }, {
            onSuccess: () => {
                setIsRejectModalOpen(false);
                setTripToReject(null);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            planned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
            approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200",
            started: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200",
            in_progress: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200",
            completed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200",
            cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200",
            rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200",
        };

        const labels: Record<string, { ar: string, en: string }> = {
            planned: { ar: 'مُخطط الطلب', en: 'Pending' },
            approved: { ar: 'تمت الموافقة', en: 'Approved' },
            started: { ar: 'بدأت', en: 'Started' },
            in_progress: { ar: 'جاري التنفيذ', en: 'In Progress' },
            completed: { ar: 'مكتملة', en: 'Completed' },
            cancelled: { ar: 'ملغاة', en: 'Cancelled' },
            rejected: { ar: 'مرفوضة', en: 'Rejected' },
        };

        const currentStyle = styles[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        const label = labels[status] ? (isRTL ? labels[status].ar : labels[status].en) : status;

        return (
            <span className={`px-3 py-1.5 text-xs font-black rounded-full border uppercase tracking-widest ${currentStyle}`}>
                {label}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
                    {isRTL ? 'إدارة الرحلات الميدانية' : 'Field Trips Management'}
                </h2>
            }
        >
            <Head title={isRTL ? 'إدارة الرحلات الميدانية' : 'Field Trips Management'} />

            <div className={`mt-6 ${isRTL ? 'rtl font-cairo' : 'ltr'}`}>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-bold text-gray-500 mb-1">{isRTL ? 'إجمالي الطلبات' : 'Total Requests'}</p>
                        <p className="text-4xl font-black text-brand-dark dark:text-brand-yellow">{fieldTrips.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-bold text-gray-500 mb-1">{isRTL ? 'بانتظار الموافقة' : 'Pending Approval'}</p>
                        <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{fieldTrips.filter(t => t.status === 'planned').length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-bold text-gray-500 mb-1">{isRTL ? 'الرحلات النشطة والمكتملة' : 'Active & Completed'}</p>
                        <p className="text-4xl font-black text-green-600 dark:text-green-400">{fieldTrips.filter(t => ['approved', 'started', 'in_progress', 'completed'].includes(t.status)).length}</p>
                    </div>
                </div>

                {/* Main Table Container */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-black text-gray-800 dark:text-white">
                            {isRTL ? 'سجل الرحلات' : 'Trips Registry'}
                        </h3>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-start border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-700">
                                    <th className={`px-6 py-5 text-xs font-black text-gray-500 uppercase tracking-widest ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'المدرسة / الرحلة' : 'School / Trip'}</th>
                                    <th className={`px-6 py-5 text-xs font-black text-gray-500 uppercase tracking-widest ${isRTL ? 'text-right' : 'text-left'}`}>{isRTL ? 'الموعد' : 'Schedule'}</th>
                                    <th className="px-6 py-5 text-xs font-black text-gray-500 uppercase tracking-widest text-center">{isRTL ? 'الركاب والتكلفة' : 'Pax & Cost'}</th>
                                    <th className="px-6 py-5 text-xs font-black text-gray-500 uppercase tracking-widest text-center">{isRTL ? 'الحالة' : 'Status'}</th>
                                    <th className="px-6 py-5 text-xs font-black text-gray-500 uppercase tracking-widest text-center">{isRTL ? 'الإجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {fieldTrips.length > 0 ? fieldTrips.map((trip) => (
                                    <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-brand-dark dark:text-brand-yellow mb-1">{trip.school?.name}</div>
                                            <div className="font-black text-gray-800 dark:text-white text-lg">{trip.trip_name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <span className="text-cyan-500">📍</span> {trip.destination}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                    📅 {trip.trip_date}
                                                </div>
                                                <div className="text-xs text-gray-500 font-bold">
                                                    🕐 {trip.trip_time}
                                                </div>
                                                <div className="text-xs text-gray-500 font-bold">
                                                    ⏳ {trip.duration_days || 1} {isRTL ? 'أيام' : 'Days'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center align-top">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-lg font-black text-gray-800 dark:text-white">{trip.number_of_students}</span>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">{isRTL ? 'طالب' : 'Students'}</span>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-sm font-bold text-green-600 dark:text-green-400">
                                                {trip.cost ? `${trip.cost} ${isRTL ? 'ريال' : 'SAR'}` : (isRTL ? '- قيد التحديد -' : '- TBD -')}
                                            </div>
                                            {trip.bus && (
                                                <div className="mt-1 text-xs text-gray-500 font-bold">
                                                    🚌 {trip.bus.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center align-top">
                                            {getStatusBadge(trip.status)}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                {trip.status === 'planned' && (
                                                    <>
                                                        <button
                                                            onClick={() => openApproveModal(trip)}
                                                            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                                                        >
                                                            {isRTL ? 'تحديد وتأكيد' : 'Approve & Assign'}
                                                        </button>
                                                        <button
                                                            onClick={() => openRejectModal(trip)}
                                                            className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl transition-colors"
                                                        >
                                                            {isRTL ? 'رفض الطلب' : 'Reject'}
                                                        </button>
                                                    </>
                                                )}
                                                {trip.status !== 'planned' && (
                                                    <div className="text-xs font-bold text-gray-400 dark:text-gray-600">
                                                        {isRTL ? 'تم الرد' : 'Action Taken'}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-bold">
                                            {isRTL ? 'لا توجد طلبات رحلات حالياً.' : 'No field trips requested yet.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Approval Modal */}
            {isApproveModalOpen && selectedTrip && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-black text-gray-800 dark:text-white">
                                {isRTL ? 'الموافقة على الرحلة' : 'Approve Field Trip'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 font-bold">
                                {selectedTrip.trip_name} - {selectedTrip.school?.name}
                            </p>
                        </div>

                        <form onSubmit={handleApprove} className="p-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'التكلفة المقدرة (ريال)' : 'Estimated Cost (SAR)'}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-yellow focus:border-transparent text-gray-800 dark:text-white font-bold"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'تعيين حافلة' : 'Assign Bus'}
                                    </label>
                                    <select
                                        required
                                        value={selectedBus}
                                        onChange={(e) => setSelectedBus(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-yellow focus:border-transparent text-gray-800 dark:text-white font-bold"
                                    >
                                        <option value="" disabled>{isRTL ? '--- اختر حافلة ---' : '--- Select Bus ---'}</option>
                                        {buses.map(bus => (
                                            <option key={bus.id} value={bus.id}>
                                                {bus.name} ({bus.capacity} {isRTL ? 'مقعد' : 'seats'}) {bus.driver ? `- ${bus.driver.name}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-2 text-xs text-gray-500">
                                        {isRTL ? `المطلوب: ${selectedTrip.number_of_students} مقعد لطلاب الرحلة` : `Required: ${selectedTrip.number_of_students} seats for this trip`}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsApproveModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold rounded-xl transition-colors"
                                >
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 bg-brand-yellow hover:bg-yellow-500 text-brand-dark font-black rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-brand-yellow/30 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        isRTL ? 'تأكيد الموافقة' : 'Confirm Approval'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {isRejectModalOpen && tripToReject && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-black text-gray-800 dark:text-white">
                                {isRTL ? 'رفض الرحلة الميدانية' : 'Reject Field Trip'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 font-bold">
                                {tripToReject.trip_name} - {tripToReject.school?.name}
                            </p>
                        </div>

                        <form onSubmit={handleRejectSubmit} className="p-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        {isRTL ? 'سبب الرفض (اختياري)' : 'Rejection Reason (Optional)'}
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800 dark:text-white font-bold resize-none"
                                        placeholder={isRTL ? 'اكتب سبب الرفض هنا...' : 'Type rejection reason here...'}
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold rounded-xl transition-colors"
                                >
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-red-600/30 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                        isRTL ? 'تأكيد الرفض' : 'Confirm Rejection'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}
