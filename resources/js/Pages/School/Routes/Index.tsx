import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import LocationPicker from '@/Components/LocationPicker';
import Modal from '@/Components/Modal';
import { motion } from 'framer-motion';
import { Route as RouteIcon, Search, Plus, MapPin, Edit, Trash2 } from 'lucide-react';
import {
    DS_pageWrapper,
    DS_pageTitle,
    DS_statCard,
    DS_statIcon,
    DS_statLabel,
    DS_statValue,
    DS_card,
    DS_sectionHeader,
    DS_searchInput,
    DS_btnGold,
    DS_tableWrapper,
    DS_tableBase,
    DS_tableHead,
    DS_tableRow,
    DS_tableTh,
    DS_tableTd,
    DS_modalHeader,
    DS_submitBtn,
    DS_cancelBtn,
} from '@/lib/DS';

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
            header={<h2 className={DS_pageTitle}>{t('Routes Management')}</h2>}
        >
            <Head title={t('Routes')} />

            <div className={DS_pageWrapper}>
                {/* Stats Summary */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={DS_statCard('navy')}>
                        <div className={DS_statIcon('navy')}><RouteIcon className="w-5 h-5" /></div>
                        <div className={isRtl ? "text-right" : "text-left"}>
                            <p className={DS_statLabel}>{t('Total Routes')}</p>
                            <p className={DS_statValue}>{routes.length}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={DS_card}>
                    <div className={DS_sectionHeader(isRtl)}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[14px] bg-[#f5b800]/10 dark:bg-[#f5b800]/20 flex items-center justify-center text-[#b38600] flex-shrink-0">
                                <RouteIcon className="w-6 h-6" />
                            </div>
                            <div className={isRtl ? "text-right" : "text-left"}>
                                <h1 className="text-xl font-bold text-[#0f2044] dark:text-white">{t('Routes List')}</h1>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('Manage your school bus paths')}</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search routes...')}
                                    className={`${DS_searchInput} ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                    dir={isRtl ? "rtl" : "ltr"}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setEditingRoute(null);
                                    reset();
                                    setShowCreateModal(true);
                                }}
                                className={DS_btnGold}
                            >
                                <Plus className="w-4 h-4" />
                                {t('Add Route')}
                            </button>
                        </div>
                    </div>

                    <div className={DS_tableWrapper}>
                        <table className={DS_tableBase}>
                            <thead className={DS_tableHead}>
                                <tr>
                                    <th className={DS_tableTh(isRtl)}>{t('Route Name')}</th>
                                    <th className={DS_tableTh(isRtl)}>{t('Code')}</th>
                                    <th className={DS_tableTh(isRtl) + " text-center"}>{t('Students')} (AM/PM)</th>
                                    <th className={DS_tableTh(isRtl) + " text-center"}>{t('Buses')}</th>
                                    <th className={DS_tableTh(isRtl) + " text-center"}>{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRoutes.length > 0 ? (
                                    filteredRoutes.map((route) => (
                                        <tr key={route.id} className={DS_tableRow}>
                                            <td className={DS_tableTd}>
                                                <div className="font-bold text-[#0f2044] dark:text-white mb-0.5">{route.name}</div>
                                                <div className="text-xs font-semibold text-gray-500 max-w-xs truncate">{route.description}</div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="px-2.5 py-1 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 rounded-[8px] text-xs font-bold text-[#0f2044] dark:text-[#7ba7e8]">
                                                    {route.code || '---'}
                                                </span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center justify-center gap-2 font-bold text-sm">
                                                    <span className="text-[#0f2044] dark:text-[#7ba7e8]">{route.morning_students_count}</span>
                                                    <span className="text-gray-300 dark:text-gray-600">/</span>
                                                    <span className="text-[#f5b800]">{route.afternoon_students_count}</span>
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="text-center font-bold text-[#0f2044] dark:text-white">
                                                    {route.buses_count}
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEdit(route)} className="p-2 text-gray-500 hover:text-[#0f2044] hover:bg-[#0f2044]/5 dark:hover:text-white dark:hover:bg-[#243460] rounded-[10px] transition-all" title={t('Edit Route')}>
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(route.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-[10px] transition-all" title={t('Delete')}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center">
                                            <div className="w-20 h-20 bg-gray-50 dark:bg-[#0f2044]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <RouteIcon className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-[#0f2044] dark:text-white mb-1">{t('No Routes Found')}</h3>
                                            <p className="text-gray-500 text-sm">{t('Try adjusting your search or filters')}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {/* Create/Edit Modal */}
            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="lg">
                <div className={DS_modalHeader(isRtl)}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
                            <RouteIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className={isRtl ? "text-right" : "text-left"}>
                            <h3 className="text-xl font-bold text-white">{editingRoute ? t('Edit Route') : t('Create New Route')}</h3>
                        </div>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('Route Name')} *</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className={`${DS_searchInput} w-full`}
                            required
                        />
                        {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('Route Code')}</label>
                        <input
                            type="text"
                            value={data.code}
                            onChange={e => setData('code', e.target.value)}
                            className={`${DS_searchInput} w-full`}
                        />
                        {errors.code && <div className="text-red-500 text-xs mt-1">{errors.code}</div>}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('Description')}</label>
                        <textarea
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            className={`${DS_searchInput} w-full resize-none`}
                            rows={2}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t('Route Location')}</label>
                        <div className="rounded-[20px] overflow-hidden border border-gray-100 dark:border-gray-700">
                            <LocationPicker 
                                lat={data.latitude} 
                                lng={data.longitude} 
                                onChange={(lat, lng) => {
                                    setData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                }}
                            />
                        </div>
                        <div className="flex gap-4 text-xs font-bold text-gray-500 px-2 pt-1 uppercase">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> LAT: {data.latitude?.toFixed(6) || '---'}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> LNG: {data.longitude?.toFixed(6) || '---'}</span>
                        </div>
                    </div>

                    <div className={`flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 ${isRtl ? 'justify-start' : 'justify-end'}`}>
                        <button type="button" onClick={() => setShowCreateModal(false)} className={DS_cancelBtn}>
                            {t('Cancel')}
                        </button>
                        <button type="submit" disabled={processing} className={DS_submitBtn(processing)}>
                            {editingRoute ? t('Update Route') : t('Save Route')}
                        </button>
                    </div>
                </form>
            </Modal>
        </SchoolAuthenticatedLayout>
    );
}
