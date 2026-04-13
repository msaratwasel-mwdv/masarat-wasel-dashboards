import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import CreateFieldTripModal from './Partials/CreateFieldTripModal';
import { mockFieldTrips, MockFieldTrip } from '@/Data/MockBusData';

interface FieldTripsProps {
    auth: any;
    fieldTrips: MockFieldTrip[];
    buses: any[];
    assistants?: any[];
    drivers?: any[];
    teachers?: any[];
}

export default function Index({ auth, fieldTrips: serverTrips, teachers = [] }: FieldTripsProps) {
    const { t, isRtl } = useTranslation();

    // Use server data if provided, otherwise fallback to mock data for demonstration
    const fieldTrips = serverTrips ? serverTrips : mockFieldTrips;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'approved' | 'in_progress' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTrips = fieldTrips.filter(trip => {
        const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
        const matchesSearch = trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.destination_address.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleApprove = (id: number) => {
        if (confirm(t('Are you sure you want to approve this trip?'))) {
            router.put(route('school.field-trips.update', id), {
                approved_by_school: true,
                status: 'approved'
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            planned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
            approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
            in_progress: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
            completed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
            cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
        };
        const currentStyle = styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";

        const label = t(status === 'cancelled' ? 'Rejected/Cancelled' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '));

        return (
            <span className={`px-4 py-1.5 text-xs font-black rounded-full border shadow-sm uppercase tracking-widest ${currentStyle}`}>
                {label}
            </span>
        );
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight">
                    {t('Field Trips')} <span className="text-[#0e7490] font-normal text-lg ml-2">/ {t('Resource Management')}</span>
                </h2>
            }
        >
            <Head title={t('Field Trips')} />

            <div className={`space-y-8 pb-10 ${isRtl ? 'rtl' : 'ltr'}`}>
                {/* Stats Cards - Sleek Design */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Trips', value: fieldTrips.length, icon: '📊', color: 'bg-cyan-600' },
                        { label: 'Upcoming', value: fieldTrips.filter(t => t.status === 'planned' || t.status === 'approved').length, icon: '📅', color: 'bg-emerald-600' },
                        { label: 'Active Now', value: fieldTrips.filter(t => t.status === 'in_progress').length, icon: '🚀', color: 'bg-orange-500' },
                        { label: 'Finalized', value: fieldTrips.filter(t => t.status === 'completed').length, icon: '✅', color: 'bg-purple-600' },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-[35px] shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-xl group overflow-hidden relative">
                            <div className={`absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 opacity-5 rounded-full ${stat.color} transition-transform group-hover:scale-150`}></div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-cyan-500/10`}>
                                    {stat.icon}
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{t(stat.label)}</p>
                            <p className="text-4xl font-black text-gray-800 dark:text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Container */}
                <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-8">
                        {/* Header Section with Actions */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10 pb-8 border-b border-gray-50 dark:border-gray-700">
                            <div className="flex items-center gap-5">
                                <div className="p-5 bg-gradient-to-br from-[#0e7490] to-blue-600 text-white rounded-[25px] shadow-xl shadow-cyan-500/20">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-gray-800 dark:text-white mb-1 uppercase tracking-tight">{t('Registered Trips')}</h1>
                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                        {t('Showing')} <span className="text-[#0e7490]">{filteredTrips.length}</span> {t('active requests')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                {/* Search Bar */}
                                <div className="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('Global Search...')}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-gray-700 border-2 border-transparent dark:border-transparent rounded-full text-gray-700 dark:text-gray-200 focus:bg-white dark:focus:bg-gray-900 focus:border-[#0e7490] transition-all font-bold placeholder-gray-400 shadow-inner"
                                    />
                                    <div className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-400`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>

                                {/* Filter Dropdown */}
                                <div className="relative w-full sm:w-auto">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="w-full lg:w-48 appearance-none pl-12 pr-10 py-4 bg-gray-50 dark:bg-gray-700 border-2 border-transparent rounded-full text-xs font-black uppercase tracking-widest text-[#0e7490] dark:text-cyan-400 focus:bg-white dark:focus:bg-gray-900 focus:border-[#0e7490] transition-all cursor-pointer shadow-inner shadow-cyan-500/5 hover:bg-gray-100 transition-colors"
                                    >
                                        <option value="all">{t('Live All Status')}</option>
                                        <option value="planned">{t('Planned Only')}</option>
                                        <option value="approved">{t('Admin Approved')}</option>
                                        <option value="in_progress">{t('Trips In Progress')}</option>
                                        <option value="completed">{t('Past Trips')}</option>
                                    </select>
                                    <div className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-[#0e7490] dark:text-cyan-400`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                    </div>
                                    <div className={`absolute ${isRtl ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 text-gray-300`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#0e7490] to-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-full hover:shadow-2xl hover:shadow-cyan-500/30 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg"
                                >
                                    <span className="text-xl leading-none font-normal">+</span> {t('Request New Trip')}
                                </button>
                            </div>
                        </div>

                        {/* Professional Table */}
                        <div className="overflow-x-auto custom-scrollbar rounded-3xl border border-gray-50 dark:border-gray-700">
                            <table className="w-full text-start border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-start">{t('Identity')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-start">{t('Dep. Schedule')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-start">{t('Target Hub')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-center">{t('Status')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-center">{t('Operations')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {filteredTrips.length > 0 ? (
                                        filteredTrips.map((trip) => (
                                            <tr key={trip.id} className="group transition-all hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                                                <td className="px-8 py-6">
                                                    <div className="font-black text-gray-800 dark:text-white mb-1 group-hover:text-[#0e7490] transition-colors">{trip.name}</div>
                                                    <div className="text-[10px] font-bold text-gray-400 group-hover:text-gray-500 max-w-xs truncate">{trip.description}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="flex items-center gap-2 text-xs font-black text-gray-700 dark:text-gray-300">
                                                            <span className="opacity-40">📅</span> {trip.date}
                                                        </span>
                                                        <span className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                                            <span className="opacity-40">🕐</span> {trip.departure_time}
                                                        </span>
                                                        <span className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                                            <span className="opacity-40">⏳</span> {trip.duration_days || 1} {t('Days')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="text-xs font-black text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                        <span className="text-cyan-500">📍</span> {trip.destination_address}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="flex flex-wrap gap-1 justify-center max-w-[150px] mx-auto">
                                                        {(trip.teachers && trip.teachers.length > 0) ? (
                                                            trip.teachers.map((tea, idx) => (
                                                                <span key={idx} className="text-[8px] font-bold text-[#0e7490] bg-cyan-50 dark:bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-100 dark:border-cyan-900/10 whitespace-nowrap">
                                                                    {tea.name}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-[8px] font-bold text-gray-300">---</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        {getStatusBadge(trip.status)}
                                                        {trip.status === 'cancelled' && trip.rejection_reason && (
                                                            <div className="text-[9px] text-red-500 mt-1 max-w-[120px] text-justify break-words">
                                                                <span className="font-bold">{t('Reason')}:</span> {trip.rejection_reason}
                                                            </div>
                                                        )}
                                                        {trip.approved_by_school && trip.status !== 'cancelled' && (
                                                            <div className="flex items-center justify-center gap-1.5 text-[8px] text-green-500 font-black uppercase tracking-widest bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-md">
                                                                <span className="scale-75">✓</span> {t('Verified By School')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {!trip.approved_by_school && trip.status === 'planned' ? (
                                                            <button
                                                                onClick={() => handleApprove(trip.id)}
                                                                className="px-6 py-2.5 bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-cyan-600 hover:text-white transition-all shadow-sm border border-cyan-600/20"
                                                            >
                                                                {t('Verify Now')}
                                                            </button>
                                                        ) : (
                                                            <button className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-[#0e7490] dark:hover:text-cyan-400 hover:shadow-md rounded-2xl transition-all">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-5 opacity-40">
                                                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900 rounded-[35px] flex items-center justify-center text-5xl">🚌</div>
                                                    <p className="text-sm font-black text-gray-500 uppercase tracking-widest">{t('No Deployment Found')}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Create Modal - High Professional Standalone */}
                <CreateFieldTripModal
                    show={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    teachers={teachers}
                />
            </div>
        </SchoolAuthenticatedLayout>
    );
}
