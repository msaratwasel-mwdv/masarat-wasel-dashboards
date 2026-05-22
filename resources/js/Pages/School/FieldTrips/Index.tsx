import { useState } from 'react';
import { Head } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import CreateFieldTripModal from './Partials/CreateFieldTripModal';
import ViewFieldTripModal from './Partials/ViewFieldTripModal';
import { motion } from 'framer-motion';
import { 
    Map, Clock, CheckCircle, Navigation, 
    Search, Plus, Eye, 
    Calendar, MapPin, Users
} from 'lucide-react';
import {
    DS_pageWrapper,
    DS_pageTitle,
    DS_statCard,
    DS_statIcon,
    DS_statLabel,
    DS_statValue,
    DS_card,
    DS_searchInput,
    DS_btnGold,
    DS_tableWrapper,
    DS_tableBase,
    DS_tableHead,
    DS_tableRow,
    DS_tableTh,
    DS_tableTd,
    DS_filterBtn,
} from '@/lib/DS';

interface FieldTripsProps {
    auth: any;
    fieldTrips: any[];
    buses: any[];
    classrooms: any[];
    teachers: any[];
}

export default function Index({ auth, fieldTrips = [], classrooms = [], teachers = [] }: FieldTripsProps) {
    const { t, lang } = useTranslation();
    const isRtl = lang === 'ar';

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'in_progress' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTrips = fieldTrips.filter(trip => {
        const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
        const matchesSearch = trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.destination_address.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleView = (id: number) => {
        setSelectedTripId(id);
        setShowViewModal(true);
    };

    const translateStatus = (status: string) => {
        return t(status);
    };

    const getStatusBadge = (status: string) => {
        const configs: Record<string, string> = {
            pending:     'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
            approved:    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
            in_progress: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
            completed:   'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
            cancelled:   'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        };
        const cls = configs[status] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
        return (
            <span className={`px-2.5 py-1 text-xs font-bold rounded-[8px] border inline-flex items-center gap-1.5 ${cls}`}>
                {status === 'in_progress' && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                {translateStatus(status)}
            </span>
        );
    };

    const filterBtns = [
        { key: 'all',         label: t('All') },
        { key: 'pending',     label: t('Pending') },
        { key: 'approved',    label: t('Approved') },
        { key: 'in_progress', label: t('In Progress') },
        { key: 'completed',   label: t('Completed') },
    ];

    const statsCards = [
        { label: t('Total Trips'),      val: fieldTrips.length,                                           icon: <Map className="w-5 h-5" />,        accent: 'navy' as const },
        { label: t('Pending Requests'), val: fieldTrips.filter(x => x.status === 'pending').length,      icon: <Clock className="w-5 h-5" />,      accent: 'gold' as const },
        { label: t('Active Now'),       val: fieldTrips.filter(x => x.status === 'in_progress').length,  icon: <Navigation className="w-5 h-5" />, accent: 'blue' as const },
        { label: t('Finalized'),        val: fieldTrips.filter(x => x.status === 'completed').length,    icon: <CheckCircle className="w-5 h-5" />, accent: 'green' as const },
    ];

    const tableHeaders = [
        t('Trip & Description'),
        t('Schedule'),
        t('Destination'),
        t('Participants'),
        t('Status'),
        t('Operations'),
    ];

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={<h2 className={DS_pageTitle}>{t('Field Trips')}</h2>}
        >
            <Head title={t('Field Trips')} />

            <div className={DS_pageWrapper}>
                {/* Stats Cards */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {statsCards.map((s, idx) => (
                        <div key={idx} className={`${DS_statCard(s.accent)} ${isRtl ? "flex-row-reverse" : ""}`}>
                            <div className={DS_statIcon(s.accent)}>{s.icon}</div>
                            <div className={isRtl ? "text-right" : "text-left"}>
                                <p className={DS_statLabel}>{s.label}</p>
                                <p className={DS_statValue}>{s.val}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Main Card */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={DS_card}>

                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 dark:border-[#243460] flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 dark:bg-[#0f2044]/5">
                        <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
                            <div className="w-10 h-10 rounded-[14px] bg-[#0f2044]/5 dark:bg-[#0f2044]/30 flex items-center justify-center text-[#0f2044] dark:text-[#7ba7e8]">
                                <Map className="w-5 h-5" />
                            </div>
                            <div className={isRtl ? "text-right" : "text-left"}>
                                <h3 className="text-base font-bold text-[#0f2044] dark:text-white">
                                    {t('Registered Field Trips')}
                                </h3>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {t('Showing')} {filteredTrips.length} {t('trips')}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-row items-center gap-2 sm:gap-3 w-full lg:w-auto mt-4 lg:mt-0">
                            <div className="relative flex-1 sm:w-60">
                                <Search className={`absolute ${isRtl ? "right-3 sm:right-4" : "left-3 sm:left-4"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                                <input
                                    type="text"
                                    placeholder={t('Search trips...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`${DS_searchInput} w-full h-10 sm:h-11 ${isRtl ? "pr-9 sm:pr-10 pl-3 sm:pl-4" : "pl-9 sm:pl-10 pr-3 sm:pr-4"}`}
                                    dir={isRtl ? "rtl" : "ltr"}
                                />
                            </div>
                            <button onClick={() => setShowCreateModal(true)} className={`${DS_btnGold} flex-shrink-0 h-10 sm:h-11 flex items-center justify-center gap-2 !px-4 sm:!px-6`}>
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('Request New Trip')}</span>
                                <span className="sm:hidden">{t('Request')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-[#243460] flex gap-2 flex-wrap bg-white dark:bg-transparent">
                        {filterBtns.map(f => (
                            <button key={f.key} onClick={() => setStatusFilter(f.key as any)} className={DS_filterBtn(statusFilter === f.key)}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    <div className={`${DS_tableWrapper} !mx-0 px-2 sm:px-4`}>
                        <table className={DS_tableBase}>
                            <thead className={DS_tableHead}>
                                <tr>
                                    {tableHeaders.map(h => <th key={h} className={DS_tableTh(isRtl)}>{h}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTrips.length > 0 ? (
                                    filteredTrips.map((trip) => (
                                        <tr key={trip.id} className={`${DS_tableRow} cursor-pointer`} onClick={() => handleView(trip.id)}>
                                            {/* Trip Name */}
                                            <td className={DS_tableTd}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-[12px] bg-[#0f2044]/5 dark:bg-[#0f2044]/30 flex items-center justify-center text-[#0f2044] dark:text-[#7ba7e8] flex-shrink-0">
                                                        <Map className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-[#0f2044] dark:text-white">{trip.name}</div>
                                                        <div className="text-xs text-gray-400 max-w-[180px] truncate mt-0.5">{trip.description}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Schedule */}
                                            <td className={DS_tableTd}>
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                                                        <Calendar className="w-3.5 h-3.5 text-[#0f2044]/40" /> {trip.date ? trip.date.split('T')[0] : ''}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                                        <Clock className="w-3 h-3" /> {trip.departure_time}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Destination */}
                                            <td className={DS_tableTd}>
                                                <div className="flex items-start gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    <MapPin className="w-3.5 h-3.5 text-[#0f2044]/50 dark:text-[#7ba7e8] mt-0.5 flex-shrink-0" />
                                                    <span className="max-w-[140px] leading-tight">{trip.destination_address}</span>
                                                </div>
                                            </td>
                                            {/* Participants */}
                                            <td className={DS_tableTd}>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="text-[10px] font-bold text-[#0f2044] dark:text-[#7ba7e8] bg-[#0f2044]/5 dark:bg-[#0f2044]/30 px-2 py-0.5 rounded-[6px]">
                                                            {trip.students_count || 0} {t('Students')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-[6px]">
                                                            {trip.internal_teachers_count || 0} {t('Teachers')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Status */}
                                            <td className={DS_tableTd}>
                                                <div className="flex flex-col gap-2">
                                                    {getStatusBadge(trip.status)}
                                                    {trip.status === 'cancelled' && trip.rejection_reason && (
                                                        <div className="text-[10px] text-red-500 max-w-[140px] bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded-[8px] leading-relaxed border border-red-100 dark:border-red-900/30">
                                                            <span className="font-bold">{t('Reason')}:</span> {trip.rejection_reason}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Actions */}
                                            <td className={`${DS_tableTd} ${isRtl ? 'text-left' : 'text-right'}`}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleView(trip.id); }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f2044]/5 hover:bg-[#0f2044]/10 text-[#0f2044] dark:text-[#7ba7e8] font-black rounded-xl transition-all text-[10px] uppercase tracking-widest group-hover:bg-brand-navy group-hover:text-white"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>{t('Explore')}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-[#0f2044]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Map className="w-7 h-7 text-gray-300" />
                                            </div>
                                            <h3 className="text-base font-bold text-[#0f2044] dark:text-white mb-1">
                                                {t('No Trips Found')}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                {t('Try adjusting your search or filters')}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Create Modal */}
                <CreateFieldTripModal
                    show={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    teachers={teachers}
                    classrooms={classrooms}
                />

                {/* View Modal */}
                <ViewFieldTripModal
                    show={showViewModal}
                    onClose={() => setShowViewModal(false)}
                    tripId={selectedTripId}
                />
            </div>
        </SchoolAuthenticatedLayout>
    );
}
