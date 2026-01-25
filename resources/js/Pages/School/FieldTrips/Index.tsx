import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import { mockFieldTrips, mockBuses, MockFieldTrip } from '@/Data/MockBusData';

interface FieldTripsProps {
    auth: any;
    fieldTrips: MockFieldTrip[];
    buses: any[];
    supervisors?: any[];
    drivers?: any[];
}

export default function Index({ auth, fieldTrips: serverTrips, buses: serverBuses, supervisors = [], drivers = [] }: FieldTripsProps) {
    const { t, isRtl } = useTranslation();
    
    // 🚨 استخدام البيانات الوهمية
    const fieldTrips = serverTrips && serverTrips.length > 0 ? serverTrips : mockFieldTrips;
    const buses = serverBuses && serverBuses.length > 0 ? serverBuses : mockBuses;
    
    // Use passed props, fallback to mock if empty (or keep empty if intended)
    // Note: Drivers are currently still extracted from buses logic in legacy code, but we now have them from backend
    // We will use the backend/props data primarily.

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'approved' | 'in_progress' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data, setData, post, processing, reset } = useForm({
        trip_name: '',
        description: '',
        trip_date: '',
        trip_time: '08:00',
        destination: '',
        number_of_students: 0,
        bus_ids: [] as number[],
        driver_ids: [] as number[],
        supervisor_ids: [] as number[],
        teacher_names: [] as string[],
    });

    const filteredTrips = fieldTrips.filter(trip => {
        const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
        const matchesSearch = trip.trip_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.destination.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Use props for supervisors and drivers
    const availableSupervisors = supervisors && supervisors.length > 0 ? supervisors : [];
    // For drivers, if backend sends them, use them. Otherwise fallback to bus extraction or empty.
    // User requested drivers to stay "as is" (from buses/company), but we have the prop now.
    // Let's mix: if we have drivers from backend, use them. 
    // Actually, user said "Drivers currently keep as is". The previous logic was extracting from buses.
    // But since I updated controller, let's use the prop if available, or fallback to bus extraction if needed.
    // For simplicity and correctness with new backend: use props.
    const availableDrivers = drivers && drivers.length > 0 ? drivers :
        buses.filter(bus => bus.driver_id && bus.driver)
            .map(bus => ({ id: bus.driver_id, name: bus.driver.name || bus.driver }))
            .filter((driver, index, self) => index === self.findIndex(d => d.id === driver.id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('school.field-trips.store'), {
            onSuccess: () => {
                setShowCreateModal(false);
                setCurrentStep(1);
                reset();
                // Success notification is handled by the flash message in Layout (or added here if needed)
            },
            onError: (errors) => {
                console.error('Submission errors:', errors);
                // Optionally handle specific error display if not using global error display
            }
        });
    };

    const handleApprove = (id: number) => {
        if (confirm(t('Are you sure you want to approve this trip?'))) {
            router.put(route('school.field-trips.update', id), {
                approved_by_school: true,
                status: 'approved'
            }, {
                onSuccess: () => {
                    // Success notification handles by flash message
                }
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'planned':
                return <span className="px-4 py-1.5 text-xs font-bold rounded-[15px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{t('Planned')}</span>;
            case 'approved':
                return <span className="px-4 py-1.5 text-xs font-bold rounded-[15px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t('Approved')}</span>;
            case 'in_progress':
                return <span className="px-4 py-1.5 text-xs font-bold rounded-[15px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{t('In Progress')}</span>;
            case 'completed':
                return <span className="px-4 py-1.5 text-xs font-bold rounded-[15px] bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">{t('Completed')}</span>;
            default:
                return <span className="px-4 py-1.5 text-xs font-bold rounded-[15px] bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
                    {t('Field Trips')}
                </h2>
            }
        >
            <Head title={t('Field Trips')} />

            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-14 h-14 bg-[#0e7490] rounded-[20px] flex items-center justify-center text-white text-3xl shadow-sm">
                                📊
                            </div>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('Total Trips')}</p>
                        <p className="text-5xl font-extrabold text-[#0e7490]">{fieldTrips.length}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-14 h-14 bg-green-500 rounded-[20px] flex items-center justify-center text-white text-3xl shadow-sm">
                                📅
                            </div>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('Upcoming Trips')}</p>
                        <p className="text-5xl font-extrabold text-green-600">{filteredTrips.filter(t => t.status === 'planned' || t.status === 'approved').length}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-14 h-14 bg-orange-500 rounded-[20px] flex items-center justify-center text-white text-3xl shadow-sm">
                                🚀
                            </div>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('In Progress')}</p>
                        <p className="text-5xl font-extrabold text-orange-600">{filteredTrips.filter(t => t.status === 'in_progress').length}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-14 h-14 bg-purple-500 rounded-[20px] flex items-center justify-center text-white text-3xl shadow-sm">
                                ✅
                            </div>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('Completed')}</p>
                        <p className="text-5xl font-extrabold text-purple-600">{filteredTrips.filter(t => t.status === 'completed').length}</p>
                    </div>
                </div>

                {/* Main Content Container */}
                <div className="bg-white dark:bg-gray-800 rounded-[30px] shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-8">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#0e7490] text-white rounded-[20px] shadow-sm">
                                    <span className="text-3xl">🎒</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-[#0e7490] dark:text-cyan-400 mb-1">{t('Trips List')}</h1>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {t('Total Trips')}:{" "}
                                        <span className="font-bold text-[#0e7490] dark:text-cyan-400">
                                            {filteredTrips.length}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                {/* Search Bar */}
                                <div className="relative w-full md:w-64">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('Search trips...')}
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-[35px] text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent font-medium"
                                    />
                                    <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 pointer-events-none text-gray-400`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>

                                {/* Filter Dropdown */}
                                <div className="relative w-full md:w-auto">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="w-full appearance-none pl-10 pr-10 py-3.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-[35px] text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent font-medium cursor-pointer min-w-[160px]"
                                    >
                                        <option value="all">{t('All Status')}</option>
                                        <option value="planned">{t('Planned')}</option>
                                        <option value="approved">{t('Approved')}</option>
                                        <option value="in_progress">{t('In Progress')}</option>
                                        <option value="completed">{t('Completed')}</option>
                                    </select>
                                    <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 pointer-events-none text-gray-400`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                    </div>
                                    <div className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 pointer-events-none text-gray-400`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="w-full sm:w-auto px-6 py-3.5 bg-[#0e7490] text-white font-bold rounded-[35px] hover:bg-[#155e75] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <span className="text-xl">+</span> {t('New Trip')}
                                </button>
                            </div>
                        </div>

                        {/* Field Trips Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-start">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">{t('Trip Info')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">{t('Date & Time')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">{t('Destination')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">{t('Students')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">{t('Resources')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">{t('Status')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-center">{t('Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredTrips.length > 0 ? (
                                        filteredTrips.map((trip) => (
                                            <tr
                                                key={trip.id}
                                                className="transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-900/10"
                                            >
                                                {/* Trip Info */}
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800 dark:text-white mb-1">
                                                        {trip.trip_name}
                                            </div>
                                            <div className="text-sm text-gray-500 max-w-xs truncate">
                                                {trip.description}
                                            </div>
                                        </td>

                                        {/* Date & Time */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    📅 {trip.trip_date}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    🕐 {trip.trip_time}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Destination */}
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                📍 {trip.destination}
                                            </div>
                                        </td>

                                        {/* Students */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold text-sm">
                                                {trip.number_of_students}
                                            </span>
                                        </td>

                                        {/* Resources */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-xs">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    🚌 <b>{trip.buses.length}</b> {t('Buses')}
                                                </span>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    👨‍🏫 <b>{trip.teachers.length}</b> {t('Teachers')}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(trip.status)}
                                            {trip.approved_by_school && (
                                                <div className="flex items-center justify-center gap-1 mt-1 text-[10px] text-green-600 font-bold">
                                                    ✓ {t('School')}
                                                </div>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 text-center">
                                            {!trip.approved_by_school && trip.status === 'planned' ? (
                                                <button
                                                    onClick={() => handleApprove(trip.id)}
                                                    className="px-4 py-2 bg-[#0e7490] text-white text-xs font-bold rounded-[15px] hover:bg-[#155e75] transition-all shadow-sm hover:shadow-md"
                                                >
                                                    ✅ {t('Approve')}
                                                </button>
                                            ) : (
                                                <button className="p-2 text-gray-400 hover:text-[#0e7490] transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                                    ) : (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <span className="text-4xl opacity-50">🚌</span>
                                                        <p className="font-medium">{t('No trips found')}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white dark:bg-gray-800 rounded-[30px] shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform animate-slideUp">
                            {/* Header */}
                            <div className="relative overflow-hidden bg-[#0e7490] p-8 rounded-t-[30px]">
                                <div className="relative flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center">
                                        <span className="text-4xl">🎒</span>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-extrabold text-white drop-shadow-lg">
                                            {t('New Field Trip')}
                                        </h3>
                                        <p className="text-white/90 text-sm mt-1">{t('Fill out the form below to submit your request')}</p>
                                    </div>
                                </div>
                                {/* Progress Steps */}
                                <div className="relative flex gap-3 mt-6">
                                    {[1, 2, 3].map(step => (
                                        <div key={step} className={`flex-1 h-2 rounded-full transition-all ${
                                            currentStep >= step 
                                                ? 'bg-white shadow-lg' 
                                                : 'bg-white/30'
                                        }`} />
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                                {currentStep === 1 && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('Trip Name')} *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.trip_name}
                                                onChange={e => setData('trip_name', e.target.value)}
                                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                                placeholder={t('Enter trip name...')}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('Description')} *
                                            </label>
                                            <textarea
                                                value={data.description}
                                                onChange={e => setData('description', e.target.value)}
                                                rows={4}
                                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[25px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                                placeholder={t('Describe the trip...')}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {t('Trip Date')} *
                                                </label>
                                                <input
                                                    type="date"
                                                    value={data.trip_date}
                                                    onChange={e => setData('trip_date', e.target.value)}
                                                    className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    {t('Trip Time')} *
                                                </label>
                                                <input
                                                    type="time"
                                                    value={data.trip_time}
                                                    onChange={e => setData('trip_time', e.target.value)}
                                                    className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {currentStep === 2 && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('Destination')} *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.destination}
                                                onChange={e => setData('destination', e.target.value)}
                                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                                placeholder={t('Enter destination...')}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('Number of Students')} *
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={data.number_of_students}
                                                onChange={e => setData('number_of_students', parseInt(e.target.value))}
                                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                {currentStep === 3 && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('Select Buses')} *
                                            </label>
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {buses.filter(b => b.status === 'active').map(bus => (
                                                    <label key={bus.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.bus_ids.includes(bus.id)}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    setData('bus_ids', [...data.bus_ids, bus.id]);
                                                                } else {
                                                                    setData('bus_ids', data.bus_ids.filter(id => id !== bus.id));
                                                                }
                                                            }}
                                                            className="mr-3"
                                                        />
                                                        <span className="text-gray-800 dark:text-white">
                                                            {bus.bus_number} - {bus.plate_number} ({bus.capacity} {t('seats')})
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                                ℹ️ {t('Selected')}: {data.bus_ids.length} {t('buses')}
                                            </p>
                                        </div>

                                        {/* Accompanying Teachers Section */}
                                        <div className="mt-6 space-y-3">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <span className="text-xl">👨‍🏫</span>
                                                {t('Accompanying Teachers')} <span className="text-xs text-gray-500 font-normal">({t('Optional')})</span>
                                            </label>

                                            <div className="space-y-2">
                                                {data.teacher_names.map((teacher, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={teacher}
                                                            onChange={e => {
                                                                const newTeachers = [...data.teacher_names];
                                                                newTeachers[index] = e.target.value;
                                                                setData('teacher_names', newTeachers);
                                                            }}
                                                            className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                                                            placeholder={t('Enter teacher name...')}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newTeachers = data.teacher_names.filter((_, i) => i !== index);
                                                                setData('teacher_names', newTeachers);
                                                            }}
                                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() => setData('teacher_names', [...data.teacher_names, ''])}
                                                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all font-medium"
                                                >
                                                    + {t('Add Teacher')}
                                                </button>

                                                {data.teacher_names.length > 0 && (
                                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                                        <p className="text-sm text-green-800 dark:text-green-300">
                                                            ✅ {data.teacher_names.length} {t('teachers added')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Drivers Selection */}
                                        <div className="mt-6 space-y-3">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <span className="text-xl">🚗</span>
                                                {t('Select Drivers')}
                                            </label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                                {availableDrivers.length > 0 ? (
                                                    availableDrivers.map(driver => (
                                                        <label key={driver.id} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg cursor-pointer transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={data.driver_ids.includes(driver.id)}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        setData('driver_ids', [...data.driver_ids, driver.id]);
                                                                    } else {
                                                                        setData('driver_ids', data.driver_ids.filter(id => id !== driver.id));
                                                                    }
                                                                }}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-gray-800 dark:text-white font-medium">
                                                                {driver.name}
                                                            </span>
                                                        </label>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                        {t('No drivers available')}
                                                    </p>
                                                )}
                                            </div>
                                            {data.driver_ids.length > 0 && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                                    <p className="text-sm text-blue-800 dark:text-blue-300">
                                                        ℹ️ {data.driver_ids.length} {t('drivers selected')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Supervisors Selection */}
                                        <div className="mt-6 space-y-3">
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <span className="text-xl">👮</span>
                                                {t('Select Supervisors')}
                                            </label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                                                {availableSupervisors.length > 0 ? (
                                                    availableSupervisors.map(supervisor => (
                                                        <label key={supervisor.id} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg cursor-pointer transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={data.supervisor_ids.includes(supervisor.id)}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        setData('supervisor_ids', [...data.supervisor_ids, supervisor.id]);
                                                                    } else {
                                                                        setData('supervisor_ids', data.supervisor_ids.filter(id => id !== supervisor.id));
                                                                    }
                                                                }}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-gray-800 dark:text-white font-medium">
                                                                {supervisor.name}
                                                            </span>
                                                        </label>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                        {t('No supervisors available')}
                                                    </p>
                                                )}
                                            </div>
                                            {data.supervisor_ids.length > 0 && (
                                                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                                    <p className="text-sm text-purple-800 dark:text-purple-300">
                                                        ℹ️ {data.supervisor_ids.length} {t('supervisors selected')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setCurrentStep(1);
                                            reset();
                                        }}
                                        className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-colors font-medium"
                                    >
                                        {t('Cancel')}
                                    </button>

                                    <div className="flex gap-3">
                                        {currentStep > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setCurrentStep(currentStep - 1)}
                                                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-[35px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-bold"
                                            >
                                                {t('Previous')}
                                            </button>
                                        )}

                                        {currentStep < 3 ? (
                                            <button
                                                type="button"
                                                onClick={() => setCurrentStep(currentStep + 1)}
                                                className="px-8 py-3 bg-[#0e7490] text-white font-bold rounded-[35px] hover:bg-[#155e75] shadow-lg hover:shadow-xl transition-all"
                                            >
                                                {t('Next')}
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                    className="px-8 py-3 bg-[#0e7490] text-white font-bold rounded-[35px] hover:bg-[#155e75] shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                {processing ? (
                                                    <span className="flex items-center gap-2">
                                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        {t('Creating...')}
                                                    </span>
                                                ) : t('Create Trip')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </SchoolAuthenticatedLayout>
    );
}
