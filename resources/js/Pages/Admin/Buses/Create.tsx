import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';

interface CreateProps {
    auth: any;
    schools: Array<{id: number; name: string}>;
}

export default function Create({ auth, schools }: CreateProps) {
    const { t, isRtl } = useTranslation();
    
    const { data, setData, post, processing, errors } = useForm({
        school_id: '',
        bus_number: '',
        plate_number: '',
        capacity: 30,
        color: '',
        type: 'permanent',
        status: 'active',
        driver_id: null,
        supervisor_id: null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.buses.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {t('Add Bus')}
                    </h2>
                </div>
            }
        >
            <Head title={t('Add Bus')} />

            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* School Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('School')} *
                            </label>
                            <select
                                value={data.school_id}
                                onChange={e => setData('school_id', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                required
                            >
                                <option value="">{t('Select School')}</option>
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
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    placeholder="BUS-001"
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
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    placeholder="ABC-1234"
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
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
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
                                    onChange={e => setData('type', e.target.value as 'permanent' | 'temporary')}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    required
                                >
                                    <option value="permanent">{t('Permanent')}</option>
                                    <option value="temporary">{t('Temporary')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Status & Color */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Status')} *
                                </label>
                                <select
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value as 'active' | 'maintenance' | 'inactive')}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    required
                                >
                                    <option value="active">{t('Active')}</option>
                                    <option value="maintenance">{t('Maintenance')}</option>
                                    <option value="inactive">{t('Inactive')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('Color')}
                                </label>
                                <input
                                    type="text"
                                    value={data.color}
                                    onChange={e => setData('color', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                    placeholder={t('e.g. Yellow, White')}
                                />
                                {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
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
                                className="px-6 py-2 bg-brand-yellow text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50"
                            >
                                {processing ? t('Saving...') : t('Save')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
