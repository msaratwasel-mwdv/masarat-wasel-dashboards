import { FormEventHandler, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';

interface Bus {
    id?: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
    type: 'permanent' | 'temporary';
    status: 'active' | 'maintenance' | 'inactive';
    model?: string;
    year?: number;
    color?: string;
    driver_id?: number;
    supervisor_id?: number;
    route_id?: number | null;
}

interface BusModalProps {
    show: boolean;
    onClose: () => void;
    bus?: Bus | null;
    drivers?: Array<{ id: number; name: string }>;
    supervisors?: Array<{ id: number; name: string }>;
    routes?: Array<{ id: number; name: string }>;
}

export default function BusModal({ show, onClose, bus, drivers = [], supervisors = [], routes = [] }: BusModalProps) {
    const { t } = useTranslation();
    const isEditing = !!bus;

    const { data, setData, post, put, processing, errors, reset } = useForm<Bus>({
        bus_number: bus?.bus_number || '',
        plate_number: bus?.plate_number || '',
        capacity: bus?.capacity || 30,
        type: bus?.type || 'permanent',
        status: bus?.status || 'active',
        model: bus?.model || '',
        year: bus?.year || new Date().getFullYear(),
        color: bus?.color || '',
        driver_id: bus?.driver_id || undefined,
        supervisor_id: bus?.supervisor_id || undefined,
        route_id: bus?.route_id || null,
    });

    useEffect(() => {
        if (bus) {
            setData({
                bus_number: bus.bus_number,
                plate_number: bus.plate_number,
                capacity: bus.capacity,
                type: bus.type,
                status: bus.status,
                model: bus.model || '',
                year: bus.year || new Date().getFullYear(),
                color: bus.color || '',
                driver_id: bus.driver_id,
                supervisor_id: bus.supervisor_id,
                route_id: bus.route_id,
            });
        }
    }, [bus]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (isEditing && bus?.id) {
            put(route('school.buses.update', bus.id), {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post(route('school.buses.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-[30px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-[#0e7490] p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-[15px] flex items-center justify-center">
                                <span className="text-3xl">🚌</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">
                                    {isEditing ? t('Edit Bus') : t('Add New Bus')}
                                </h3>
                                <p className="text-blue-100 text-sm">{t('Fill in the bus details below')}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)] hide-scrollbar">
                    {/* Bus Number & Plate Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                {t('Bus Number')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.bus_number}
                                onChange={e => setData('bus_number', e.target.value)}
                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                                placeholder="BUS-001"
                                required
                            />
                            {errors.bus_number && <p className="mt-2 ml-2 text-sm text-red-600">{errors.bus_number}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                {t('Plate Number')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.plate_number}
                                onChange={e => setData('plate_number', e.target.value)}
                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                                placeholder="ABC-1234"
                                required
                            />
                            {errors.plate_number && <p className="mt-2 ml-2 text-sm text-red-600">{errors.plate_number}</p>}
                        </div>
                    </div>

                    {/* Capacity, Type, Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                {t('Capacity')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={data.capacity}
                                onChange={e => setData('capacity', parseInt(e.target.value))}
                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                {t('Type')} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={data.type}
                                    onChange={e => setData('type', e.target.value as any)}
                                    className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] appearance-none transition-all"
                                    required
                                >
                                    <option value="permanent">{t('Permanent')}</option>
                                    <option value="temporary">{t('Temporary')}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                {t('Status')} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value as any)}
                                    className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] appearance-none transition-all"
                                    required
                                >
                                    <option value="active">{t('Active')}</option>
                                    <option value="maintenance">{t('Maintenance')}</option>
                                    <option value="inactive">{t('Inactive')}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Model, Year, Color */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                {t('Model')}
                            </label>
                            <input
                                type="text"
                                value={data.model}
                                onChange={e => setData('model', e.target.value)}
                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                                placeholder="Mercedes Sprinter"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                {t('Year')}
                            </label>
                            <input
                                type="number"
                                min="1990"
                                max={new Date().getFullYear() + 1}
                                value={data.year}
                                onChange={e => setData('year', parseInt(e.target.value))}
                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                {t('Color')}
                            </label>
                            <input
                                type="text"
                                value={data.color}
                                onChange={e => setData('color', e.target.value)}
                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] focus:border-transparent transition-all"
                                placeholder={t('White')}
                            />
                        </div>
                    </div>

                    {/* Driver & Supervisor */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                {t('Driver')}
                            </label>
                            <div className="relative">
                                <select
                                    value={data.driver_id || ''}
                                    onChange={e => setData('driver_id', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] appearance-none transition-all"
                                >
                                    <option value="">{t('No Driver')}</option>
                                    {drivers.map(driver => (
                                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                                {t('Supervisor')}
                            </label>
                            <div className="relative">
                                <select
                                    value={data.supervisor_id || ''}
                                    onChange={e => setData('supervisor_id', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] appearance-none transition-all"
                                >
                                    <option value="">{t('Not Assigned')}</option>
                                    {supervisors.map(supervisor => (
                                        <option key={supervisor.id} value={supervisor.id}>{supervisor.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Route Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 ml-2">
                            {t('Assigned Route')}
                        </label>
                        <div className="relative">
                            <select
                                value={data.route_id || ''}
                                onChange={e => setData('route_id', e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-[#0e7490] appearance-none transition-all"
                            >
                                <option value="">{t('No Route Assigned')}</option>
                                {routes.map(route => (
                                    <option key={route.id} value={route.id}>{route.name}</option>
                                ))}
                            </select>
                        </div>
                        {errors.route_id && <p className="mt-2 ml-2 text-sm text-red-600">{errors.route_id}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-8 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-[35px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-bold"
                        >
                            {t('Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-8 py-3.5 bg-[#0e7490] text-white font-bold rounded-[35px] hover:bg-[#155e75] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {processing ? t('Saving...') : (isEditing ? t('Update') : t('Add Bus'))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
