import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';

interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
    type: 'permanent' | 'temporary';
    status: 'active' | 'maintenance' | 'inactive';
    driver?: { id: number; name: string };
    assistant?: { id: number; name: string };
}

interface BusesProps {
    auth: any;
    buses: Bus[];
}

export default function Index({ auth, buses }: BusesProps) {
    const { t, isRtl } = useTranslation();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'inactive'>('all');
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

    // Filter buses
    const filteredBuses = buses.filter(bus => {
        const matchesSearch = bus.bus_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            bus.plate_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const totalBuses = buses.length;
    const activeBuses = buses.filter(b => b.status === 'active').length;
    const maintenanceBuses = buses.filter(b => b.status === 'maintenance').length;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-green-500 text-white inline-flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full" />
                    {t('Active')}
                </span>;
            case 'maintenance':
                return <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    🔧 {t('Maintenance')}
                </span>;
            case 'inactive':
                return <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                    {t('Inactive')}
                </span>;
            default:
                return null;
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {t('Buses Management')} 🚌
                </h2>
            }
        >
            <Head title={t('Buses')} />

            <div className="space-y-6">
                {/* Premium Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Buses */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-6 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 blur-2xl" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-blue-100 uppercase tracking-wider">{t('Total Buses')}</p>
                                <h3 className="text-5xl font-extrabold text-white mt-2">{totalBuses}</h3>
                            </div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                                <span className="text-5xl">🚌</span>
                            </div>
                        </div>
                    </div>

                    {/* Available Buses */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 shadow-2xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 blur-2xl" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-green-100 uppercase tracking-wider">{t('Available Buses')}</p>
                                <h3 className="text-5xl font-extrabold text-white mt-2">{activeBuses}</h3>
                            </div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                                <span className="text-5xl">✅</span>
                            </div>
                        </div>
                    </div>

                    {/* Under Maintenance */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-6 shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 blur-2xl" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-orange-100 uppercase tracking-wider">{t('Under Maintenance')}</p>
                                <h3 className="text-5xl font-extrabold text-white mt-2">{maintenanceBuses}</h3>
                            </div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                                <span className="text-5xl">🔧</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        {/* Search */}
                        <div className="relative flex-1 w-full md:max-w-md">
                            <input
                                type="text"
                                placeholder={t('Search by Bus Number or Plate...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-all ${isRtl ? "pr-12 pl-4" : "pl-12 pr-4"}`}
                            />
                            <div className={`absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 pointer-events-none`}>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="flex gap-3 items-center w-full md:w-auto">
                            {/* Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                            >
                                <option value="all">🔍 {t('All Status')}</option>
                                <option value="active">✅ {t('Active')}</option>
                                <option value="maintenance">🔧 {t('Maintenance')}</option>
                                <option value="inactive">⏸️ {t('Inactive')}</option>
                            </select>

                            {/* View Toggle */}
                            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 shadow-md' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                    title="Card View"
                                >
                                    <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-md' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                    title="Table View"
                                >
                                    <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Request Bus Button */}
                            <Link
                                href={route('school.bus-requests.index')}
                                className="px-6 py-3 bg-gradient-to-r from-brand-yellow to-orange-400 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-orange-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
                            >
                                ➕ {t('Request Additional Bus')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* View: Cards or Table */}
                {viewMode === 'cards' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBuses.length > 0 ? (
                            filteredBuses.map((bus) => (
                                <div key={bus.id} className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" />
                                    
                                    <div className="relative p-6">
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-2xl font-extrabold text-gray-800 dark:text-white mb-1">{bus.bus_number}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{bus.plate_number}</p>
                                            </div>
                                            {getStatusBadge(bus.status)}
                                        </div>

                                        {/* Info Grid */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                                <span className="text-2xl">👥</span>
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('Capacity')}</p>
                                                    <p className="font-bold text-gray-800 dark:text-white">{bus.capacity} {t('Student')}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                                <span className="text-2xl">🏷️</span>
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('Type')}</p>
                                                    <p className="font-bold text-gray-800 dark:text-white">{t(bus.type === 'permanent' ? 'Permanent' : 'Temporary')}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                                <span className="text-2xl">🚗</span>
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('Driver')}</p>
                                                    <p className="font-semibold text-gray-800 dark:text-white">
                                                        {bus.driver ? bus.driver.name : <span className="text-gray-400">{t('No Driver')}</span>}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                                <span className="text-2xl">👨‍🏫</span>
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('Assistant')}</p>
                                                    <p className="font-semibold text-gray-800 dark:text-white">
                                                        {bus.assistant ? bus.assistant.name : <span className="text-gray-400">{t('Not Assigned')}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-16 text-center">
                                <div className="text-8xl mb-6">🔍</div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('No Buses Found')}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{t('Try adjusting your search or filters')}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('Bus Number')}</th>
                                        <th className="px-6 py-4 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('Plate Number')}</th>
                                        <th className="px-6 py-4 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('Capacity')}</th>
                                        <th className="px-6 py-4 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('Type')}</th>
                                        <th className="px-6 py-4 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('Driver')}</th>
                                        <th className="px-6 py-4 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('Assistant')}</th>
                                        <th className="px-6 py-4 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('Status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredBuses.length > 0 ? (
                                        filteredBuses.map((bus) => (
                                            <tr key={bus.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{bus.bus_number}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700 dark:text-gray-300">{bus.plate_number}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700 dark:text-gray-300">{bus.capacity} {t('Student')}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${bus.type === 'permanent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                                        {t(bus.type === 'permanent' ? 'Permanent' : 'Temporary')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                                        {bus.driver ? bus.driver.name : <span className="text-gray-400 dark:text-gray-500">{t('No Driver')}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                                        {bus.assistant ? bus.assistant.name : <span className="text-gray-400 dark:text-gray-500">{t('Not Assigned')}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(bus.status)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="text-gray-500 dark:text-gray-400">
                                                    <div className="text-6xl mb-4">🔍</div>
                                                    <p className="text-lg font-bold">{t('No Buses Found')}</p>
                                                    <p className="text-sm mt-2">{t('Try adjusting your search or filters')}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </SchoolAuthenticatedLayout>
    );
}
