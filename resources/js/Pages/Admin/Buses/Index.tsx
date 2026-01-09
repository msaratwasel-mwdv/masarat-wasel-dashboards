import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import useTranslation from '@/hooks/useTranslation';

interface User {
    id: number;
    name: string;
}

interface School {
    id: number;
    name: string;
}

interface Bus {
    id: number;
    bus_code: string;
    bus_number: string;
    plate_number: string;
    model: string;
    year: number;
    capacity: number;
    type: 'permanent' | 'temporary';
    status: 'active' | 'maintenance' | 'inactive' | 'out_of_service';
    school_id: number | null;
    driver_id: number | null;
    supervisor_id: number | null;
    driver?: User;
    supervisor?: User;
    school?: School;
}

interface BusesProps {
    auth: any;
    buses: Bus[];
    schools: School[];
    availableDrivers: User[];
    availableSupervisors: User[];
}

export default function Index({
    auth,
    buses,
    schools,
    availableDrivers,
    availableSupervisors
}: BusesProps) {
    const { t, isRtl } = useTranslation();

    // States
    const [searchQuery, setSearchQuery] = useState('');
    const [schoolFilter, setSchoolFilter] = useState<number | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'inactive' | 'out_of_service'>('all');
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [isMainModalOpen, setIsMainModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

    // Forms
    const busForm = useForm({
        bus_number: '',
        plate_number: '',
        model: '',
        year: new Date().getFullYear(),
        capacity: 25,
        type: 'permanent' as 'permanent' | 'temporary',
        status: 'active' as 'active' | 'maintenance' | 'inactive' | 'out_of_service',
        school_id: '',
        driver_id: '',
        supervisor_id: '',
    });

    const assignForm = useForm({
        school_id: '',
    });

    // Filter buses
    const filteredBuses = buses.filter(bus => {
        const matchesSearch =
            bus.bus_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bus.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bus.model?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSchool = schoolFilter === 'all' || bus.school_id === schoolFilter;
        const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
        return matchesSearch && matchesSchool && matchesStatus;
    });

    // Stats
    const totalBuses = buses.length;
    const activeBuses = buses.filter(b => b.status === 'active').length;
    const maintenanceBuses = buses.filter(b => b.status === 'maintenance').length;

    // Helper functions
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'out_of_service': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return t('Active');
            case 'maintenance': return t('Maintenance');
            case 'inactive': return t('Inactive');
            case 'out_of_service': return t('Out of Service');
            default: return status;
        }
    };

    // Modal Handlers
    const openAddModal = () => {
        setIsEditing(false);
        busForm.reset();
        busForm.clearErrors();
        setIsMainModalOpen(true);
    };

    const openEditModal = (bus: Bus) => {
        setIsEditing(true);
        setSelectedBus(bus);
        busForm.setData({
            bus_number: bus.bus_number || '',
            plate_number: bus.plate_number,
            model: bus.model || '',
            year: bus.year,
            capacity: bus.capacity,
            type: bus.type,
            status: bus.status,
            school_id: bus.school_id?.toString() || '',
            driver_id: bus.driver_id?.toString() || '',
            supervisor_id: bus.supervisor_id?.toString() || '',
        });
        busForm.clearErrors();
        setIsMainModalOpen(true);
    };

    const openAssignModal = (bus: Bus) => {
        setSelectedBus(bus);
        assignForm.setData('school_id', bus.school_id?.toString() || '');
        assignForm.clearErrors();
        setIsAssignModalOpen(true);
    };

    const closeModal = () => {
        setIsMainModalOpen(false);
        setIsAssignModalOpen(false);
        busForm.reset();
        assignForm.reset();
    };

    const submitBusForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && selectedBus) {
            busForm.put(route('admin.buses.update', selectedBus.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            busForm.post(route('admin.buses.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const submitAssignForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedBus) {
            assignForm.post(route('admin.buses.assign', selectedBus.id), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const deleteBus = (id: number) => {
        if (confirm(t('Are you sure you want to delete this bus?'))) {
            router.delete(route('admin.buses.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {t('Buses Management')}
                    </h2>
                    <button
                        onClick={openAddModal}
                        className="px-6 py-3 bg-gradient-to-r from-brand-yellow to-orange-500 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        <span className="flex items-center gap-2">
                            <span className="text-xl">+</span>
                            {t('Add Bus')}
                        </span>
                    </button>
                </div>
            }
        >
            <Head title={t('Buses')} />

            <div className="space-y-6">
                {/* Premium Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Buses */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-blue-100 uppercase tracking-wider">{t('Total Buses')}</p>
                                <h3 className="text-5xl font-extrabold text-white mt-2">{totalBuses}</h3>
                            </div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                                <span className="text-3xl">🚌</span>
                            </div>
                        </div>
                    </div>

                    {/* Available Buses */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 shadow-2xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-green-100 uppercase tracking-wider">{t('Available Buses')}</p>
                                <h3 className="text-5xl font-extrabold text-white mt-2">{activeBuses}</h3>
                            </div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                                <span className="text-3xl">✅</span>
                            </div>
                        </div>
                    </div>

                    {/* Under Maintenance */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-6 shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-orange-100 uppercase tracking-wider">{t('Under Maintenance')}</p>
                                <h3 className="text-5xl font-extrabold text-white mt-2">{maintenanceBuses}</h3>
                            </div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                                <span className="text-3xl">🔧</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                        {/* Search */}
                        <div className="flex-1 w-full lg:w-auto">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('Search by Bus Number, Plate, or Model...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow focus:border-transparent transition-all"
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-3 flex-wrap">
                            <select
                                value={schoolFilter}
                                onChange={(e) => setSchoolFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                            >
                                <option value="all">{t('All Schools')}</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.id}>{school.name}</option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                            >
                                <option value="all">{t('All Status')}</option>
                                <option value="active">{t('Active')}</option>
                                <option value="maintenance">{t('Maintenance')}</option>
                                <option value="inactive">{t('Inactive')}</option>
                                <option value="out_of_service">{t('Out of Service')}</option>
                            </select>

                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-gray-800 shadow-md' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-800 shadow-md' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buses Display */}
                {filteredBuses.length > 0 ? (
                    viewMode === 'cards' ? (
                        /* Card View */
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredBuses.map((bus) => (
                                <div
                                    key={bus.id}
                                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                                >
                                    {/* Gradient Overlay */}
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-brand-yellow/20 to-orange-500/20 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500 blur-2xl" />

                                    {/* Content */}
                                    <div className="relative p-6 space-y-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-yellow to-orange-500 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                                                    <span className="text-3xl">🚌</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{bus.bus_code}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{bus.bus_number} - {bus.plate_number}</p>
                                                    <p className="text-xs text-gray-400">{bus.model} ({bus.year})</p>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getStatusColor(bus.status)}`}>
                                                <span className={`w-2 h-2 rounded-full ${bus.status === 'active' ? 'bg-green-500 animate-pulse' : bus.status === 'maintenance' ? 'bg-yellow-500' : bus.status === 'out_of_service' ? 'bg-red-500' : 'bg-gray-500'}`} />
                                                <span className="text-xs font-semibold">{getStatusText(bus.status)}</span>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">School</p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                                                    {bus.school ? bus.school.name : t('Unassigned')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Capacity</p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-white">{bus.capacity} {t('seats')}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-white">{t(bus.type === 'permanent' ? 'Permanent' : 'Temporary')}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Driver</p>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-white">{bus.driver?.name || t('Not Assigned')}</p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-4">
                                            {!bus.school && (
                                                <button
                                                    onClick={() => openAssignModal(bus)}
                                                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-center font-semibold transition-colors"
                                                >
                                                    {t('Assign')}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEditModal(bus)}
                                                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-center font-semibold transition-colors"
                                            >
                                                {t('Edit')}
                                            </button>
                                            <button
                                                onClick={() => deleteBus(bus.id)}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                                            >
                                                {t('Delete')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Table View */
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Bus Code</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">School</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Plate</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Model</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Capacity</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredBuses.map((bus) => (
                                            <tr key={bus.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gray-900 dark:text-white">{bus.bus_code}</span>
                                                    <p className="text-xs text-gray-500">{bus.bus_number}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-semibold ${bus.school ? 'text-gray-900 dark:text-white' : 'text-gray-400 italic'}`}>
                                                        {bus.school ? bus.school.name : t('Unassigned')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{bus.plate_number}</td>
                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{bus.model} ({bus.year})</td>
                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{bus.capacity}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bus.type === 'permanent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                                        {t(bus.type === 'permanent' ? 'Permanent' : 'Temporary')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-2 ${getStatusColor(bus.status)}`}>
                                                        <span className={`w-2 h-2 rounded-full ${bus.status === 'active' ? 'bg-green-500 animate-pulse' : bus.status === 'maintenance' ? 'bg-yellow-500' : bus.status === 'out_of_service' ? 'bg-red-500' : 'bg-gray-500'}`} />
                                                        {getStatusText(bus.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        {!bus.school && (
                                                            <button onClick={() => openAssignModal(bus)} className="text-green-600 hover:text-green-900 dark:text-green-400 font-semibold">
                                                                {t('Assign')}
                                                            </button>
                                                        )}
                                                        <button onClick={() => openEditModal(bus)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 font-semibold">
                                                            {t('Edit')}
                                                        </button>
                                                        <button onClick={() => deleteBus(bus.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 font-semibold">
                                                            {t('Delete')}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                        <div className="text-8xl mb-6">🚌</div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('No Buses Found')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Start by adding your first bus to the system</p>
                        <button
                            onClick={openAddModal}
                            className="inline-block px-8 py-3 bg-gradient-to-r from-brand-yellow to-orange-500 text-gray-900 font-bold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg"
                        >
                            + {t('Add Your First Bus')}
                        </button>
                    </div>
                )}

                {/* --- 1. Main Modal (Create/Edit) --- */}
                <Modal show={isMainModalOpen} onClose={closeModal}>
                    <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-3">
                            {isEditing ? t('Edit Bus Details') : t('Add New Bus to Fleet')}
                        </h2>
                        <form onSubmit={submitBusForm} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel value={t('Bus Number')} />
                                    <TextInput
                                        value={busForm.data.bus_number}
                                        onChange={(e) => busForm.setData('bus_number', e.target.value)}
                                        className="w-full mt-1"
                                        required
                                    />
                                    <InputError message={busForm.errors.bus_number} />
                                </div>
                                <div>
                                    <InputLabel value={t('Plate Number')} />
                                    <TextInput
                                        value={busForm.data.plate_number}
                                        onChange={(e) => busForm.setData('plate_number', e.target.value)}
                                        className="w-full mt-1"
                                        required
                                    />
                                    <InputError message={busForm.errors.plate_number} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel value={t('Model')} />
                                    <TextInput
                                        value={busForm.data.model}
                                        onChange={(e) => busForm.setData('model', e.target.value)}
                                        className="w-full mt-1"
                                        required
                                    />
                                    <InputError message={busForm.errors.model} />
                                </div>
                                <div>
                                    <InputLabel value={t('Year')} />
                                    <TextInput
                                        type="number"
                                        value={busForm.data.year}
                                        onChange={(e) => busForm.setData('year', Number(e.target.value))}
                                        className="w-full mt-1"
                                        required
                                    />
                                    <InputError message={busForm.errors.year} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel value={t('Capacity')} />
                                    <TextInput
                                        type="number"
                                        value={busForm.data.capacity}
                                        onChange={(e) => busForm.setData('capacity', Number(e.target.value))}
                                        className="w-full mt-1"
                                        required
                                    />
                                    <InputError message={busForm.errors.capacity} />
                                </div>
                                <div>
                                    <InputLabel value={t('Type')} />
                                    <select
                                        className="w-full border-gray-300 rounded-md mt-1 text-sm"
                                        value={busForm.data.type}
                                        onChange={(e) => busForm.setData('type', e.target.value as 'permanent' | 'temporary')}
                                    >
                                        <option value="permanent">{t('Permanent')}</option>
                                        <option value="temporary">{t('Temporary')}</option>
                                    </select>
                                    <InputError message={busForm.errors.type} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel value={t('Status')} />
                                    <select
                                        className="w-full border-gray-300 rounded-md mt-1 text-sm"
                                        value={busForm.data.status}
                                        onChange={(e) => busForm.setData('status', e.target.value as any)}
                                    >
                                        <option value="active">{t('Active')}</option>
                                        <option value="maintenance">{t('Maintenance')}</option>
                                        <option value="inactive">{t('Inactive')}</option>
                                        <option value="out_of_service">{t('Out of Service')}</option>
                                    </select>
                                    <InputError message={busForm.errors.status} />
                                </div>
                                <div>
                                    <InputLabel value={t('School')} />
                                    <select
                                        className="w-full border-gray-300 rounded-md mt-1 text-sm"
                                        value={busForm.data.school_id}
                                        onChange={(e) => busForm.setData('school_id', e.target.value)}
                                    >
                                        <option value="">{t('-- Unassigned --')}</option>
                                        {schools.map((school) => (
                                            <option key={school.id} value={school.id}>
                                                {school.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
                                <div>
                                    <InputLabel value={t('Assign Driver')} />
                                    <select
                                        className="w-full border-gray-300 rounded-md mt-1 text-sm"
                                        value={busForm.data.driver_id}
                                        onChange={(e) => busForm.setData('driver_id', e.target.value)}
                                    >
                                        <option value="">{t('-- No Driver --')}</option>
                                        {availableDrivers.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <InputLabel value={t('Assign Supervisor')} />
                                    <select
                                        className="w-full border-gray-300 rounded-md mt-1 text-sm"
                                        value={busForm.data.supervisor_id}
                                        onChange={(e) => busForm.setData('supervisor_id', e.target.value)}
                                    >
                                        <option value="">{t('-- No Supervisor --')}</option>
                                        {availableSupervisors.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <SecondaryButton onClick={closeModal}>{t('Cancel')}</SecondaryButton>
                                <PrimaryButton disabled={busForm.processing}>
                                    {isEditing ? t('Update Bus') : t('Save Bus')}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* --- 2. Assign to School Modal --- */}
                <Modal show={isAssignModalOpen} onClose={closeModal}>
                    <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">
                            {t('Assign Bus to School')}
                        </h2>
                        <p className="text-sm text-gray-500 mb-6 italic">
                            {t('Note: Assigning this bus will also link its current driver and supervisor to the school.')}
                        </p>

                        <form onSubmit={submitAssignForm} className="space-y-6">
                            <div>
                                <InputLabel value={t('Select School')} />
                                <select
                                    className="w-full border-gray-300 focus:border-brand-yellow focus:ring-brand-yellow rounded-lg mt-1"
                                    value={assignForm.data.school_id}
                                    onChange={(e) => assignForm.setData('school_id', e.target.value)}
                                    required
                                >
                                    <option value="">{t('-- Select School --')}</option>
                                    {schools.map((school) => (
                                        <option key={school.id} value={school.id}>
                                            {school.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={assignForm.errors.school_id} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <SecondaryButton onClick={closeModal}>{t('Cancel')}</SecondaryButton>
                                <PrimaryButton
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={assignForm.processing}
                                >
                                    {t('Confirm Assignment')}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}