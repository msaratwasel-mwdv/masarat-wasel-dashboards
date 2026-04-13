import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import LocationPicker from '@/Components/LocationPicker';

interface RouteProps {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    latitude: number | null;
    longitude: number | null;
    morning_students_count: number;
    afternoon_students_count: number;
    buses_count: number;
}

interface IndexProps {
    auth: any;
    routes: RouteProps[];
}

export default function Index({ auth, routes }: IndexProps) {
    const { t, isRtl } = useTranslation();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingRoute, setEditingRoute] = useState<RouteProps | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, setData, post, put, processing, reset, errors } = useForm({
        name: '',
        code: '',
        description: '',
        latitude: null as number | null,
        longitude: null as number | null,
    });

    const filteredRoutes = routes.filter(route =>
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (route.code?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRoute) {
            put(route('school.routes.update', editingRoute.id), {
                onSuccess: () => {
                    setShowCreateModal(false);
                    setEditingRoute(null);
                    reset();
                }
            });
        } else {
            post(route('school.routes.store'), {
                onSuccess: () => {
                    setShowCreateModal(false);
                    reset();
                }
            });
        }
    };

    const handleEdit = (route: RouteProps) => {
        setEditingRoute(route);
        setData({
            name: route.name,
            code: route.code || '',
            description: route.description || '',
            latitude: route.latitude ? Number(route.latitude) : null,
            longitude: route.longitude ? Number(route.longitude) : null,
        });
        setShowCreateModal(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t('Are you sure you want to delete this route?'))) {
            router.delete(route('school.routes.destroy', id));
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
                    {t('Routes Management')}
                </h2>
            }
        >
            <Head title={t('Routes')} />

            <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#0e7490] rounded-[20px] flex items-center justify-center text-white text-3xl shadow-sm">
                                🛣️
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('Total Routes')}</p>
                                <p className="text-3xl font-extrabold text-[#0e7490]">{routes.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-gray-800 rounded-[30px] shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#0e7490] text-white rounded-[20px]">
                                    <span className="text-3xl">🏁</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-[#0e7490] dark:text-cyan-400">{t('Routes List')}</h1>
                                    <p className="text-sm text-gray-500">{t('Manage your school bus paths')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('Search routes...')}
                                        className="pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-transparent rounded-[35px] text-gray-700 focus:ring-2 focus:ring-[#0e7490] font-medium"
                                    />
                                    <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingRoute(null);
                                        reset();
                                        setShowCreateModal(true);
                                    }}
                                    className="px-6 py-3 bg-[#0e7490] text-white font-bold rounded-[35px] hover:bg-[#155e75] transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                                >
                                    <span className="text-xl">+</span> {t('Add Route')}
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-start">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] uppercase text-start">{t('Route Name')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] uppercase text-start">{t('Code')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] uppercase text-center">{t('Students')} (AM/PM)</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] uppercase text-center">{t('Buses')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-[#0e7490] uppercase text-center">{t('Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium">
                                    {filteredRoutes.map((route) => (
                                        <tr key={route.id} className="hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-800 dark:text-gray-200">{route.name}</div>
                                                <div className="text-xs text-gray-500 max-w-xs truncate">{route.description}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400">
                                                    {route.code || '---'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-blue-600 dark:text-blue-400">{route.morning_students_count}</span>
                                                    <span className="text-gray-300">/</span>
                                                    <span className="text-orange-600 dark:text-orange-400">{route.afternoon_students_count}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="font-bold text-[#0e7490]">{route.buses_count}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button onClick={() => handleEdit(route)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                                                        ✏️
                                                    </button>
                                                    <button onClick={() => handleDelete(route.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all">
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-[30px] shadow-xl max-w-lg w-full overflow-hidden transform animate-slideUp">
                        <div className="bg-[#0e7490] p-6 text-white">
                            <h3 className="text-2xl font-bold">{editingRoute ? t('Edit Route') : t('Create New Route')}</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('Route Name')} *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full px-5 py-3 border border-gray-200 rounded-[20px] focus:ring-2 focus:ring-[#0e7490]"
                                    required
                                />
                                {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('Route Code')}</label>
                                <input
                                    type="text"
                                    value={data.code}
                                    onChange={e => setData('code', e.target.value)}
                                    className="w-full px-5 py-3 border border-gray-200 rounded-[20px] focus:ring-2 focus:ring-[#0e7490]"
                                />
                                {errors.code && <div className="text-red-500 text-xs mt-1">{errors.code}</div>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{t('Description')}</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="w-full px-5 py-3 border border-gray-200 rounded-[20px] focus:ring-2 focus:ring-[#0e7490]"
                                    rows={2}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">{t('Route Location')}</label>
                                <LocationPicker 
                                    lat={data.latitude} 
                                    lng={data.longitude} 
                                    onChange={(lat, lng) => {
                                        setData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                    }}
                                />
                                <div className="flex gap-4 text-[10px] font-bold text-gray-400 px-2 uppercase tracking-tight">
                                    <span>LAT: {data.latitude?.toFixed(6) || '---'}</span>
                                    <span>LNG: {data.longitude?.toFixed(6) || '---'}</span>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-50 rounded-[20px]">
                                    {t('Cancel')}
                                </button>
                                <button type="submit" disabled={processing} className="px-8 py-2.5 bg-[#0e7490] text-white font-bold rounded-[35px] shadow-md hover:shadow-lg disabled:opacity-50">
                                    {editingRoute ? t('Update Route') : t('Save Route')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SchoolAuthenticatedLayout>
    );
}
