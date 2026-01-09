import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import { mockFieldTrips, mockBuses, MockFieldTrip } from '@/Data/MockBusData';

interface FieldTripsProps {
    auth: any;
    fieldTrips: MockFieldTrip[];
    buses: any[];
}

export default function Index({ auth, fieldTrips: serverTrips, buses: serverBuses }: FieldTripsProps) {
    const { t, isRtl } = useTranslation();
    
    // 🚨 استخدام البيانات الوهمية
    const fieldTrips = serverTrips && serverTrips.length > 0 ? serverTrips : mockFieldTrips;
    const buses = serverBuses && serverBuses.length > 0 ? serverBuses : mockBuses;
    
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'approved' | 'in_progress' | 'completed'>('all');

    const { data, setData, post, processing, reset } = useForm({
        trip_name: '',
        description: '',
        trip_date: '',
        trip_time: '08:00',
        destination: '',
        number_of_students: 0,
        bus_ids: [] as number[],
    });

    const filteredTrips = fieldTrips.filter(trip => 
        statusFilter === 'all' || trip.status === statusFilter
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Creating field trip:', data);
        alert(t('Field trip created successfully! (Mock)'));
        setShowCreateModal(false);
        setCurrentStep(1);
        reset();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'planned':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">{t('Planned')}</span>;
            case 'approved':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t('Approved')}</span>;
            case 'in_progress':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{t('In Progress')}</span>;
            case 'completed':
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">{t('Completed')}</span>;
            default:
                return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                        {t('Field Trips')}
                    </h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-brand-yellow to-orange-500 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        + {t('New Field Trip')}
                    </button>
                </div>
            }
        >
            <Head title={t('Field Trips')} />

            <div className="space-y-6">
                {/* Premium Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-6 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-6xl">📊</span>
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-1">{t('Total Trips')}</p>
                            <p className="text-white text-4xl font-extrabold">{fieldTrips.length}</p>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 shadow-2xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-6xl">📅</span>
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-1">{t('Upcoming Trips')}</p>
                            <p className="text-white text-4xl font-extrabold">{filteredTrips.filter(t => t.status === 'planned' || t.status === 'approved').length}</p>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-6 shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-6xl">🚀</span>
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-1">{t('In Progress')}</p>
                            <p className="text-white text-4xl font-extrabold">{filteredTrips.filter(t => t.status === 'in_progress').length}</p>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-6xl">✅</span>
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-white/90 text-sm font-semibold uppercase tracking-wider mb-1">{t('Completed')}</p>
                            <p className="text-white text-4xl font-extrabold">{filteredTrips.filter(t => t.status === 'completed').length}</p>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-semibold"
                        >
                            <option value="all">🔍 {t('All Status')}</option>
                            <option value="planned">📅 {t('Planned')}</option>
                            <option value="approved">✅ {t('Approved')}</option>
                            <option value="in_progress">🚀 {t('In Progress')}</option>
                            <option value="completed">🏁 {t('Completed')}</option>
                        </select>
                    </div>
                </div>

                {/* Field Trips Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {filteredTrips.length > 0 ? (
                        filteredTrips.map((trip) => (
                            <div key={trip.id} className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                                {/* Top Gradient Bar */}
                                <div className={`h-2 ${
                                    trip.status === 'planned' ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                                    trip.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                    trip.status === 'in_progress' ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                                    'bg-gradient-to-r from-purple-400 to-pink-500'
                                }`} />
                                
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                                                {trip.trip_name}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                {trip.description}
                                            </p>
                                        </div>
                                        {getStatusBadge(trip.status)}
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">📅</span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">{t('Date')}</p>
                                                    <p className="text-lg font-bold text-gray-800 dark:text-white">{trip.trip_date}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">🕐</span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">{t('Time')}</p>
                                                    <p className="text-lg font-bold text-gray-800 dark:text-white">{trip.trip_time}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">👥</span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">{t('Students')}</p>
                                                    <p className="text-lg font-bold text-gray-800 dark:text-white">{trip.number_of_students}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Destination and other info */}
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">📍 {t('Destination')}:</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{trip.destination}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">🚌 {t('Buses')}:</p>
                                            <p className="text-sm text-gray-800 dark:text-white">{trip.buses.length} {t('buses assigned')}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">👨‍🏫 {t('Teachers')}:</p>
                                            <p className="text-sm text-gray-800 dark:text-white">{trip.teachers.join(', ')}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {trip.approved_by_school && (
                                            <span className="px-3 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                                ✓ {t('School Approval')}
                                            </span>
                                        )}
                                        {trip.approved_by_company && (
                                            <span className="px-3 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                                ✓ {t('Company Approval')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">🚌</div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                {t('No Field Trips')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {t('Create your first field trip')}
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-2 bg-brand-yellow text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-colors"
                            >
                                {t('Create Trip')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Premium Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform animate-slideUp">
                            {/* Header with Gradient */}
                            <div className="relative overflow-hidden bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 p-8">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                                <div className="relative flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
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
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
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
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
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
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
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
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
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
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
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
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
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
                                    </>
                                )}

                                <div className="flex gap-4 justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                    {currentStep > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(currentStep - 1)}
                                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            {t('Previous')}
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setCurrentStep(1);
                                            reset();
                                        }}
                                        className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        {t('Cancel')}
                                    </button>

                                    {currentStep < 3 ? (
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep(currentStep + 1)}
                                            className="px-6 py-2 bg-brand-yellow text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-colors"
                                        >
                                            {t('Next')}
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-6 py-2 bg-brand-yellow text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
                                        >
                                            {processing ? t('Creating...') : t('Create Trip')}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </SchoolAuthenticatedLayout>
    );
}
