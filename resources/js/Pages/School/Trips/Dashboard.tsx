import React, { useState } from 'react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';
import LiveTrackingMap from '@/Components/LiveTrackingMap';

interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
    status: 'active' | 'maintenance' | 'inactive';
    current_latitude?: number;
    current_longitude?: number;
    trip_status?: string;
    driver?: { id: number; name: string };
    assistant?: { id: number; name: string };
}

interface Trip {
    id: number;
    type: 'forth' | 'back' | 'field_trip';
    status: string;
    trip_date: string;
    attendances_count: number;
    bus: Bus;
    route?: { name: string };
}

interface FieldTrip {
    id: number;
    destination_description: string;
    status: string;
    bus: Bus;
}

interface Props {
    auth: any;
    dailyTrips: Trip[];
    fieldTrips: FieldTrip[];
    buses: Bus[];
    filters: { date: string };
    stats: {
        total_trips: number;
        completed: number;
        on_route: number;
        total_buses: number;
        active_buses: number;
        pending_field_trips: number;
    };
}

export default function TripDashboard({ auth, dailyTrips, fieldTrips, buses, filters, stats }: Props) {
    const { t } = useTranslation();
    const [date, setDate] = useState(filters.date);
    const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        router.get(route('school.trips.dashboard'), { date: newDate }, { preserveState: true });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'on_route': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'scheduled': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
            case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
                        {t('Trips Dashboard')} 🚀
                    </h2>
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'map' ? 'bg-white dark:bg-gray-700 text-[#0e7490] shadow-sm' : 'text-gray-500'
                                }`}
                        >
                            🗺️ {t('Live Map')}
                        </button>
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-white dark:bg-gray-700 text-[#0e7490] shadow-sm' : 'text-gray-500'
                                }`}
                        >
                            📋 {t('Trip List')}
                        </button>
                    </div>
                </div>
            }
        >
            <Head title={t('Trips Dashboard')} />

            <div className="space-y-6 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Stats Section */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-[25px] shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Total Trips')}</p>
                        <h3 className="text-2xl font-extrabold text-[#0e7490] mt-1">{stats.total_trips}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-[25px] shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('On Route')}</p>
                        <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{stats.on_route}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-[25px] shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Completed')}</p>
                        <h3 className="text-2xl font-extrabold text-green-600 mt-1">{stats.completed}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-[25px] shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Total Buses')}</p>
                        <h3 className="text-2xl font-extrabold text-cyan-600 mt-1">{stats.total_buses}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-[25px] shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Active')}</p>
                        <h3 className="text-2xl font-extrabold text-green-500 mt-1">{stats.active_buses}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-[25px] shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Pending Requests')}</p>
                        <h3 className="text-2xl font-extrabold text-orange-500 mt-1">{stats.pending_field_trips}</h3>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="bg-white dark:bg-gray-800 p-3 rounded-[35px] shadow-sm flex items-center justify-between border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="px-6 py-2 border border-gray-200 dark:border-gray-600 rounded-[30px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] font-bold text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-[30px] font-bold text-sm hover:bg-gray-200 transition-all">
                            📊 {t('Full Report')}
                        </button>
                    </div>
                </div>

                {activeTab === 'map' ? (
                    <div className="space-y-6">
                        <LiveTrackingMap buses={buses} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Daily Trips */}
                        <div className="bg-white dark:bg-gray-800 rounded-[35px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                                    🌅 {t('Daily Routes')}
                                </h3>
                                <span className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold">
                                    {dailyTrips.length}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-start text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900/30">
                                        <tr>
                                            <th className="px-6 py-3 font-bold text-gray-500 text-start uppercase text-[10px] tracking-wider">{t('Route')}</th>
                                            <th className="px-6 py-3 font-bold text-gray-500 text-start uppercase text-[10px] tracking-wider">{t('Bus')}</th>
                                            <th className="px-6 py-3 font-bold text-gray-500 text-start uppercase text-[10px] tracking-wider">{t('Status')}</th>
                                            <th className="px-6 py-3 font-bold text-gray-500 text-end uppercase text-[10px] tracking-wider">{t('Action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                        {dailyTrips.map(trip => (
                                            <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold">{trip.route?.name || t('N/A')}</div>
                                                    <div className="text-[10px] text-gray-400 capitalize">{t(trip.type)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold">{trip.bus.bus_number}</div>
                                                    <div className="text-[10px] text-gray-500">{trip.bus.driver?.name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(trip.status)}`}>
                                                        {t(trip.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-end">
                                                    <button className="p-2 hover:bg-cyan-50 rounded-lg transition-colors">👁️</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {dailyTrips.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">
                                                    {t('No daily trips scheduled')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Field Trips */}
                        <div className="bg-white dark:bg-gray-800 rounded-[35px] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                                    🎒 {t('Active Field Trips')}
                                </h3>
                                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold">
                                    {fieldTrips.length}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-start text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-900/30">
                                        <tr>
                                            <th className="px-6 py-3 font-bold text-gray-500 text-start uppercase text-[10px] tracking-wider">{t('Destination')}</th>
                                            <th className="px-6 py-3 font-bold text-gray-500 text-start uppercase text-[10px] tracking-wider">{t('Bus')}</th>
                                            <th className="px-6 py-3 font-bold text-gray-500 text-start uppercase text-[10px] tracking-wider">{t('Status')}</th>
                                            <th className="px-6 py-3 font-bold text-gray-500 text-end uppercase text-[10px] tracking-wider">{t('Action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                        {fieldTrips.map(trip => (
                                            <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold truncate max-w-[150px]">{trip.destination_description}</div>
                                                </td>
                                                <td className="px-6 py-4 font-bold">{trip.bus.bus_number}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(trip.status)}`}>
                                                        {t(trip.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-end">
                                                    <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors">👁️</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {fieldTrips.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">
                                                    {t('No active field trips')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SchoolAuthenticatedLayout>
    );
}
