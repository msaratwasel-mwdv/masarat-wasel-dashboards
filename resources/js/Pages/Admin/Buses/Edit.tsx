import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';

interface Bus {
    id: number;
    school_id: number;
    school: { id: number; name: string };
    bus_number: string;
    plate_number: string;
    capacity: number;
    type: 'permanent' | 'temporary';
    status: 'active' | 'maintenance' | 'inactive';
    color?: string;
    driver_id?: number;
    assistant_id?: number;
    field_supervisor_id?: number;
}

interface EditProps {
    auth: any;
    bus: Bus;
    schools: Array<{id: number; name: string}>;
    drivers: Array<{id: number; name: string}>;
    assistants: Array<{id: number; name: string}>;
    fieldSupervisors: Array<{id: number; name: string}>;
}

export default function Edit({ auth, bus, schools, drivers, assistants, fieldSupervisors }: EditProps) {
    const { t, isRtl } = useTranslation();
    
    const { data, setData, put, processing, errors } = useForm({
        school_id: bus.school_id,
        bus_number: bus.bus_number,
        plate_number: bus.plate_number,
        capacity: bus.capacity,
        type: bus.type,
        status: bus.status,
        color: bus.color || '',
        driver_id: bus.driver_id || null,
        assistant_id: bus.assistant_id || null,
        field_supervisor_id: bus.field_supervisor_id || null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.buses.update', bus.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {t('Edit Bus')} - {bus.bus_number}
                    </h2>
                </div>
            }
        >
            <Head title={`${t('Edit Bus')} - ${bus.bus_number}`} />

            <div className="max-w-4xl mx-auto">
                {/* Gradient Header Card */}
                <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                            <span className="text-4xl">🚌</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">{bus.bus_number}</h3>
                            <p className="text-white/80">{bus.plate_number}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* School Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('School')} *
                            </label>
                            <select
                                value={data.school_id || ''}
                                onChange={e => setData('school_id', e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                            >
                                <option value="">{t('Unassigned (Central Pool)')}</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.id}>
                                        {school.name}
                                    </option>
                                ))}
                            </select>
                            {errors.school_id && <p className="text-red-500 text-sm mt-1">{errors.school_id}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Bus Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Bus Number')} *
                                </label>
                                <input
                                    type="text"
                                    value={data.bus_number}
                                    onChange={e => setData('bus_number', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                                    required
                                />
                                {errors.bus_number && <p className="text-red-500 text-sm mt-1">{errors.bus_number}</p>}
                            </div>

                            {/* Plate Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Plate Number')} *
                                </label>
                                <input
                                    type="text"
                                    value={data.plate_number}
                                    onChange={e => setData('plate_number', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                                    required
                                />
                                {errors.plate_number && <p className="text-red-500 text-sm mt-1">{errors.plate_number}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Capacity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Capacity')} *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.capacity}
                                    onChange={e => setData('capacity', parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                                    required
                                />
                                {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Type')} *
                                </label>
                                <select
                                    value={data.type}
                                    onChange={e => setData('type', e.target.value as any)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                                    required
                                >
                                    <option value="permanent">{t('Permanent')}</option>
                                    <option value="temporary">{t('Temporary')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Status')} *
                                </label>
                                <select
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value as any)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                                    required
                                >
                                    <option value="active">{t('Active')}</option>
                                    <option value="maintenance">{t('Maintenance')}</option>
                                    <option value="inactive">{t('Inactive')}</option>
                                </select>
                            </div>

                            {/* Color Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Color')}
                                </label>
                                <input
                                    type="text"
                                    value={data.color}
                                    onChange={e => setData('color', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                                    placeholder={t('e.g. Yellow, White')}
                                />
                                {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
                            </div>

                            {/* Driver */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Driver')}
                                </label>
                                <select
                                    value={data.driver_id || ''}
                                    onChange={e => setData('driver_id', e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                                >
                                    <option value="">{t('Select Driver')}</option>
                                    {drivers.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Assistant */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Assistant')}
                                </label>
                                <select
                                    value={data.assistant_id || ''}
                                    onChange={e => setData('assistant_id', e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                                >
                                    <option value="">{t('Select Assistant')}</option>
                                    {assistants.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Field Supervisor */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Field Supervisor')}
                                </label>
                                <select
                                    value={data.field_supervisor_id || ''}
                                    onChange={e => setData('field_supervisor_id', e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-yellow"
                                >
                                    <option value="">{t('Select Field Supervisor')}</option>
                                    {fieldSupervisors.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => router.visit(route('admin.buses.index'))}
                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                {t('Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
                            >
                                {processing ? t('Saving...') : t('Update')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
