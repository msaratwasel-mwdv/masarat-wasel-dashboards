import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import LocationPicker from '@/Components/LocationPicker';
import Modal from '@/Components/Modal';
import { motion } from 'framer-motion';
import { Route as RouteIcon, Search, Plus, MapPin, Edit, Trash2, Eye, MoreVertical, X, Bus, Users, Map, Hash, Sunrise, Sunset } from 'lucide-react';
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
    DS_modalClose,
    DS_badge,
    DS_labelCls,
    DS_btnEdit,
} from '@/lib/DS';
import Dropdown from '@/Components/Dropdown';

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
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<RouteProps | null>(null);
    const [viewRoute, setViewRoute] = useState<RouteProps | null>(null);
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

    const totalBuses = routes.reduce((sum, r) => sum + (r.buses_count || 0), 0);
    const totalStudents = routes.reduce((sum, r) => sum + (r.morning_students_count || 0) + (r.afternoon_students_count || 0), 0);

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

    const openView = (route: RouteProps) => {
        setViewRoute(route);
        setIsViewModalOpen(true);
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
        setIsViewModalOpen(false);
        setShowCreateModal(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t('Are you sure you want to delete this route?'))) {
            router.delete(route('school.routes.destroy', id), {
                onSuccess: () => {
                    setIsViewModalOpen(false);
                }
            });
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
                <div className="mb-2 sm:mb-4">
                    <h3 className="font-black text-[#0f2044] dark:text-white text-lg sm:text-xl flex items-center gap-2 mb-4 px-1">
                        <RouteIcon className="w-5 h-5 text-[#f5b800]" />
                        {isRtl ? "نظرة عامة على المسارات" : "Routes Overview"}
                    </h3>
                    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {[
                            { label: isRtl ? "إجمالي المسارات" : "Total Routes", val: routes.length, icon: <RouteIcon className="w-4 h-4 sm:w-5 sm:h-5" />, accent: "navy" as const },
                            { label: isRtl ? "الحافلات المربوطة" : "Assigned Buses", val: totalBuses, icon: <Bus className="w-4 h-4 sm:w-5 sm:h-5" />, accent: "gold" as const },
                            { label: isRtl ? "الطلاب المنقولين" : "Covered Students", val: totalStudents, icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />, accent: "blue" as const },
                        ].map((s, idx) => (
                            <div key={idx} className={`${DS_statCard(s.accent)} !p-3 sm:!p-5 ${isRtl ? "flex-row-reverse" : ""}`}>
                                <div className={`${DS_statIcon(s.accent)} !w-8 !h-8 sm:!w-12 sm:!h-12 flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                                <div className={`${isRtl ? "text-right" : "text-left"} min-w-0`}>
                                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-500 line-clamp-1 break-words leading-tight mb-1">{s.label}</p>
                                    <p className="text-lg sm:text-2xl font-black text-[#0f2044] dark:text-white leading-none">{s.val}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

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

                        <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                            <div className="relative flex-1 sm:w-64">
                                <Search className={`absolute ${isRtl ? 'right-3 sm:right-4' : 'left-3 sm:left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search routes...')}
                                    className={`${DS_searchInput} w-full h-10 sm:h-11 ${isRtl ? 'pr-9 sm:pr-10 pl-3 sm:pl-4' : 'pl-9 sm:pl-10 pr-3 sm:pr-4'}`}
                                    dir={isRtl ? "rtl" : "ltr"}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setEditingRoute(null);
                                    reset();
                                    setShowCreateModal(true);
                                }}
                                className={`${DS_btnGold} flex-shrink-0 h-10 sm:h-11 flex items-center justify-center gap-2 !px-4 sm:!px-6`}
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('Add Route')}</span>
                                <span className="sm:hidden">{t('Add')}</span>
                            </button>
                        </div>
                    </div>

                    <div className={`${DS_tableWrapper} !mx-0 px-2 sm:px-4`}>
                        <table className={DS_tableBase}>
                            <thead className={DS_tableHead}>
                                <tr>
                                    <th className={`${DS_tableTh(isRtl)} px-2 sm:px-4`}>{t('Route Name')}</th>
                                    <th className={DS_tableTh(isRtl)}>{t('Code')}</th>
                                    <th className={DS_tableTh(isRtl) + " text-center"}>{t('Students')} (AM/PM)</th>
                                    <th className={DS_tableTh(isRtl) + " text-center"}>{t('Buses')}</th>
                                    <th className={`${DS_tableTh(isRtl)} text-center px-2 sm:px-4`}>{t('Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRoutes.length > 0 ? (
                                    filteredRoutes.map((route) => (
                                        <tr key={route.id} className={DS_tableRow}>
                                            <td className={`${DS_tableTd} px-2 sm:px-4`}>
                                                <div className="font-bold text-[#0f2044] dark:text-white mb-0.5 whitespace-nowrap">{route.name}</div>
                                                <div className="text-[10px] sm:text-xs font-semibold text-gray-500 max-w-xs truncate">{route.description || "—"}</div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="px-2.5 py-1 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 rounded-[8px] text-[10px] sm:text-xs font-bold text-[#0f2044] dark:text-[#7ba7e8]">
                                                    {route.code || '---'}
                                                </span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                    <span className="flex items-center gap-1 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8] px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                                                        <Sunrise className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                        {route.morning_students_count}
                                                    </span>
                                                    <span className="flex items-center gap-1 bg-[#f5b800]/10 text-[#7a5c00] dark:text-[#f5b800] px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
                                                        <Sunset className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                        {route.afternoon_students_count}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex justify-center">
                                                    <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-[10px] text-xs font-bold border border-gray-200 dark:border-gray-700">
                                                        <Bus className="w-3.5 h-3.5" />
                                                        {route.buses_count}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={`${DS_tableTd} px-2 sm:px-4`}>
                                                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                                                    <div className="relative group flex items-center justify-center">
                                                        <button onClick={() => openView(route)} className="p-2 rounded-xl text-gray-500 hover:text-[#0f2044] dark:hover:text-white bg-gray-50 dark:bg-gray-800 hover:bg-[#0f2044]/10 dark:hover:bg-white/10 transition-all shadow-sm">
                                                            <Eye size={16} />
                                                        </button>
                                                        <div className="hidden sm:block absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-lg opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all z-[60] whitespace-nowrap shadow-xl">
                                                            {isRtl ? "عرض التفاصيل" : "View Details"}
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="relative group flex items-center justify-center">
                                                        <button onClick={() => handleEdit(route)} className="p-2 rounded-xl text-blue-600 hover:text-white hover:bg-blue-600 dark:text-blue-400 dark:hover:text-white dark:hover:bg-blue-500 bg-blue-50 dark:bg-blue-900/20 transition-all shadow-sm">
                                                            <Edit size={16} />
                                                        </button>
                                                        <div className="hidden sm:block absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-lg opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all z-[60] whitespace-nowrap shadow-xl">
                                                            {isRtl ? "تعديل المسار" : "Edit Route"}
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="relative group flex items-center justify-center">
                                                        <button onClick={() => handleDelete(route.id)} className="p-2 rounded-xl text-red-500 hover:text-white hover:bg-red-500 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-500 bg-red-50 dark:bg-red-900/20 transition-all shadow-sm">
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <div className="hidden sm:block absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-lg opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all z-[60] whitespace-nowrap shadow-xl">
                                                            {isRtl ? "حذف المسار" : "Delete Route"}
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-white"></div>
                                                        </div>
                                                    </div>
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

            {/* View Modal */}
            <Modal show={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} maxWidth="2xl">
                {/* Modal Header */}
                <div className={DS_modalHeader(isRtl)}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
                            <RouteIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className={isRtl ? "text-right" : "text-left"}>
                            <h3 className="text-base sm:text-xl font-bold text-white truncate max-w-[200px] sm:max-w-none">
                                {viewRoute?.name}
                            </h3>
                            <p className="text-[#7ba7e8] text-xs sm:text-sm font-semibold">{viewRoute?.code || t('No Code')}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsViewModalOpen(false)} className={DS_modalClose}><X className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-8 space-y-4 sm:space-y-8 overflow-y-auto max-h-[80vh]">
                    {/* Header Card */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-[18px] sm:rounded-[22px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm text-center sm:text-start">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[16px] sm:rounded-[22px] bg-white dark:bg-[#0f2044] border-4 border-white dark:border-[#243460] flex items-center justify-center shadow-lg text-[#f5b800] flex-shrink-0">
                            <RouteIcon className="w-7 h-7 sm:w-10 sm:h-10" />
                        </div>
                        <div>
                            <h4 className="text-lg sm:text-2xl font-black text-[#0f2044] dark:text-white mb-1">
                                {viewRoute?.name}
                            </h4>
                            <div className="flex items-center justify-center sm:justify-start gap-3">
                                <span className={DS_badge(true)}>{t("Active")}</span>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{viewRoute?.code}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-6">
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-[14px] sm:rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-[10px] sm:rounded-[14px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 flex-shrink-0"><Users className="w-4 h-4 sm:w-6 sm:h-6" /></div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 line-clamp-1">{t("Morning Students")}</p>
                                <p className="font-bold text-[#0f2044] dark:text-white text-base sm:text-lg">{viewRoute?.morning_students_count}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-[14px] sm:rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-[10px] sm:rounded-[14px] bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 flex-shrink-0"><Users className="w-4 h-4 sm:w-6 sm:h-6" /></div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 line-clamp-1">{t("Afternoon Students")}</p>
                                <p className="font-bold text-[#0f2044] dark:text-white text-base sm:text-lg">{viewRoute?.afternoon_students_count}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-[14px] sm:rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-[10px] sm:rounded-[14px] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 flex-shrink-0"><Bus className="w-4 h-4 sm:w-6 sm:h-6" /></div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 line-clamp-1">{t("Buses")}</p>
                                <p className="font-bold text-[#0f2044] dark:text-white text-base sm:text-lg">{viewRoute?.buses_count}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-[14px] sm:rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-[10px] sm:rounded-[14px] bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 flex-shrink-0"><Hash className="w-4 h-4 sm:w-6 sm:h-6" /></div>
                            <div className="min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 line-clamp-1">{t("Code")}</p>
                                <p className="font-bold text-[#0f2044] dark:text-white text-base sm:text-lg">{viewRoute?.code || "—"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Location & Description */}
                    <div className="space-y-6">
                        {viewRoute?.description && (
                            <div className="p-4 sm:p-6 rounded-[18px] sm:rounded-[22px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                <h5 className="font-bold text-[#0f2044] dark:text-white mb-2 flex items-center gap-2 text-sm sm:text-base">
                                    <Map className="w-4 h-4 text-[#f5b800]" /> {t("Description")}
                                </h5>
                                <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
                                    {viewRoute.description}
                                </p>
                            </div>
                        )}

                        <div className="p-4 sm:p-6 rounded-[18px] sm:rounded-[22px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                            <h5 className="font-bold text-[#0f2044] dark:text-white mb-4 flex items-center gap-2 text-sm sm:text-base">
                                <MapPin className="w-4 h-4 text-emerald-500" /> {t("Route Location")}
                            </h5>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                                <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase mb-1">{t("Latitude")}</p>
                                    <p className="font-mono text-xs sm:text-sm font-bold text-[#0f2044] dark:text-white truncate">{viewRoute?.latitude || "—"}</p>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10">
                                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase mb-1">{t("Longitude")}</p>
                                    <p className="font-mono text-xs sm:text-sm font-bold text-[#0f2044] dark:text-white truncate">{viewRoute?.longitude || "—"}</p>
                                </div>
                            </div>
                            
                            {viewRoute?.latitude && viewRoute?.longitude && (
                                <div className="rounded-[16px] sm:rounded-[20px] overflow-hidden border border-gray-100 dark:border-gray-700 h-36 sm:h-48">
                                    <LocationPicker 
                                        lat={Number(viewRoute.latitude)} 
                                        lng={Number(viewRoute.longitude)} 
                                        onChange={() => {}}
                                        readonly={true}
                                        height="100%"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Create/Edit Modal */}
            <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="4xl">
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
                <form onSubmit={handleSubmit} className="p-0">
                    <div className="flex flex-col lg:flex-row overflow-y-auto max-h-[75vh]">
                        {/* Basic Info Pane */}
                        <div className="w-full lg:w-1/3 p-4 sm:p-6 bg-gray-50 dark:bg-white/5 border-b lg:border-b-0 lg:border-l border-gray-100 dark:border-white/5">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3 sm:mb-4 flex items-center gap-2">
                                <RouteIcon className="text-[#f5b800]" size={16} />
                                {isRtl ? "المعلومات الأساسية" : "Basic Information"}
                            </h4>
                            
                            {/* Name + Code in one row */}
                            <div className="grid grid-cols-3 gap-3 mb-3 sm:mb-4">
                                <div className="col-span-2">
                                    <label className={DS_labelCls}>{t('Route Name')} *</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className={DS_searchInput}
                                        placeholder={isRtl ? "مثال: مسار الشمال" : "e.g. North Route"}
                                        required
                                    />
                                    {errors.name && <div className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1"><X className="w-3 h-3" /> {errors.name}</div>}
                                </div>
                                <div>
                                    <label className={DS_labelCls}>{isRtl ? "الرمز" : "Code"}</label>
                                    <input
                                        type="text"
                                        value={data.code}
                                        onChange={e => setData('code', e.target.value)}
                                        className={DS_searchInput}
                                        placeholder="R01"
                                    />
                                    {errors.code && <div className="text-red-500 text-[10px] font-bold mt-1 flex items-center gap-1"><X className="w-3 h-3" /> {errors.code}</div>}
                                </div>
                            </div>
                            
                            {/* Description full width */}
                            <div>
                                <label className={DS_labelCls}>{t('Description')}</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className={`${DS_searchInput} resize-none min-h-[70px] sm:min-h-[100px]`}
                                    placeholder={isRtl ? "وصف اختياري للمسار..." : "Optional route description..."}
                                />
                            </div>
                        </div>

                        {/* Location Picker Pane */}
                        <div className="w-full lg:w-2/3 p-4 sm:p-6 flex flex-col">
                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 sm:mb-4 flex items-center gap-2">
                                <MapPin className="text-emerald-500" size={16} />
                                {t('Route Location')}
                            </h4>
                            <div className="rounded-[16px] sm:rounded-[24px] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner bg-gray-100 dark:bg-gray-800 relative h-[280px] sm:h-[340px]">
                                <LocationPicker 
                                    lat={data.latitude} 
                                    lng={data.longitude} 
                                    height="100%"
                                    onChange={(lat, lng) => {
                                        setData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                    }}
                                />
                            </div>
                            <div className="flex flex-wrap gap-3 sm:gap-4 text-[10px] sm:text-xs font-bold text-gray-500 mt-3 sm:mt-4 px-2 uppercase bg-gray-50 dark:bg-white/5 py-2 sm:py-2.5 rounded-xl border border-gray-100 dark:border-white/5">
                                <span className="flex items-center gap-1.5 text-[#0f2044] dark:text-[#7ba7e8]"><MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> LAT: {data.latitude?.toFixed(6) || '---'}</span>
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> LNG: {data.longitude?.toFixed(6) || '---'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50/80 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800">
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
