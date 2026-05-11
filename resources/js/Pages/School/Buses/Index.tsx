import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus as BusIcon, CheckCircle2, Wrench, Search, ChevronDown, LayoutGrid, List, Plus, Users, Tag, User, UserPlus, Eye, X, Fingerprint } from 'lucide-react';
import Modal from '@/Components/Modal';
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
    DS_tableTd,
    DS_modalHeader,
    DS_modalClose,
    DS_badge,
    DS_labelCls,
    DS_gridCols,
} from '@/lib/DS';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

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
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                    {t('Active')}
                </span>;
            case 'maintenance':
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50">
                    {t('Maintenance')}
                </span>;
            case 'inactive':
                return <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                    {t('Inactive')}
                </span>;
            default:
                return null;
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={<h2 className={DS_pageTitle}>{t('Buses Management')}</h2>}
        >
            <Head title={t('Buses')} />

            <div className={DS_pageWrapper}>
                {/* Stats Cards */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className={DS_gridCols}>
                    {[
                        { label: t('Total Buses'), val: totalBuses, icon: <BusIcon className="w-5 h-5" />, accent: 'navy' as const },
                        { label: t('Available Buses'), val: activeBuses, icon: <CheckCircle2 className="w-5 h-5" />, accent: 'gold' as const },
                        { label: t('Under Maintenance'), val: maintenanceBuses, icon: <Wrench className="w-5 h-5" />, accent: 'red' as const },
                    ].map((s) => (
                        <div key={s.label} className={DS_statCard(s.accent)}>
                            <div className={DS_statIcon(s.accent)}>{s.icon}</div>
                            <div className={isRtl ? "text-right" : "text-left"}>
                                <p className={DS_statLabel}>{s.label}</p>
                                <p className={DS_statValue}>{s.val}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Main Content Area */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={DS_card}>
                    
                    {/* Header Toolbar */}
                    <div className={DS_sectionHeader(isRtl)}>
                        {/* Search & Filter */}
                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                            <div className="relative w-full sm:max-w-md">
                                <Search className={`absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                                <input
                                    type="text"
                                    placeholder={t('Search by Bus Number or Plate...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`${DS_searchInput} ${isRtl ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                                    dir={isRtl ? "rtl" : "ltr"}
                                />
                            </div>
                            
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className={`${DS_searchInput} cursor-pointer appearance-none ${isRtl ? "pl-10" : "pr-10"}`}
                                >
                                    <option value="all">{t('All Status')}</option>
                                    <option value="active">{t('Active')}</option>
                                    <option value="maintenance">{t('Maintenance')}</option>
                                    <option value="inactive">{t('Inactive')}</option>
                                </select>
                                <ChevronDown className={`absolute ${isRtl ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
                            </div>
                        </div>

                        {/* View Toggles & Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                            <div className="flex bg-[#0f2044]/5 dark:bg-[#0f2044]/30 p-1 rounded-[14px]">
                                <button
                                    onClick={() => setViewMode('cards')}
                                    type="button"
                                    className={`flex-1 sm:flex-none p-2 rounded-[10px] transition-all flex items-center justify-center ${viewMode === 'cards' ? 'bg-white dark:bg-[#243460] shadow text-[#0f2044] dark:text-white' : 'text-gray-500 hover:text-[#0f2044] dark:hover:text-white'}`}
                                    title={t('Card View')}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    type="button"
                                    className={`flex-1 sm:flex-none p-2 rounded-[10px] transition-all flex items-center justify-center ${viewMode === 'table' ? 'bg-white dark:bg-[#243460] shadow text-[#0f2044] dark:text-white' : 'text-gray-500 hover:text-[#0f2044] dark:hover:text-white'}`}
                                    title={t('Table View')}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <Link href={route('school.bus-requests.index')} className={DS_btnGold + " justify-center"}>
                                <Plus className="w-4 h-4" />
                                {t('Request Additional Bus')}
                            </Link>
                        </div>
                    </div>

                    {/* View Area */}
                    <div className="p-4 md:p-6">
                        {viewMode === 'cards' ? (
                            <div className={DS_gridCols}>
                                {filteredBuses.length > 0 ? (
                                    filteredBuses.map((bus) => (
                                        <div key={bus.id} className="relative overflow-hidden bg-white dark:bg-[#1a2845] rounded-[20px] border border-gray-100 dark:border-[#243460] shadow-sm hover:shadow-xl transition-all duration-300">
                                            {/* Colored Top Border based on status */}
                                            <div className={`h-1.5 w-full ${bus.status === 'active' ? 'bg-emerald-500' : bus.status === 'maintenance' ? 'bg-orange-500' : 'bg-gray-400'}`} />
                                            
                                            <div className="p-5">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-[#0f2044] dark:text-white mb-0.5">{bus.bus_number}</h3>
                                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{bus.plate_number}</p>
                                                    </div>
                                                    {getStatusBadge(bus.status)}
                                                </div>

                                                <div className="space-y-2 mt-6">
                                                    <div className="flex items-center gap-3 p-2.5 rounded-[12px] bg-[#0f2044]/[0.03] dark:bg-[#0f2044]/20">
                                                        <Users className="w-4 h-4 text-[#0f2044]/60 dark:text-[#7ba7e8]" />
                                                        <div className="flex-1 flex justify-between items-center">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('Capacity')}</span>
                                                            <span className="text-sm font-bold text-[#0f2044] dark:text-white">{bus.capacity} {t('Student')}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3 p-2.5 rounded-[12px] bg-[#0f2044]/[0.03] dark:bg-[#0f2044]/20">
                                                        <Tag className="w-4 h-4 text-[#0f2044]/60 dark:text-[#7ba7e8]" />
                                                        <div className="flex-1 flex justify-between items-center">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('Type')}</span>
                                                            <span className="text-sm font-bold text-[#0f2044] dark:text-white">{t(bus.type === 'permanent' ? 'Permanent' : 'Temporary')}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 p-2.5 rounded-[12px] bg-[#0f2044]/[0.03] dark:bg-[#0f2044]/20">
                                                        <User className="w-4 h-4 text-[#0f2044]/60 dark:text-[#7ba7e8]" />
                                                        <div className="flex-1 flex justify-between items-center">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('Driver')}</span>
                                                            <span className="text-sm font-bold text-[#0f2044] dark:text-white">
                                                                {bus.driver ? bus.driver.name : <span className="text-gray-400 font-normal italic">{t('No Driver')}</span>}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 p-2.5 rounded-[12px] bg-[#0f2044]/[0.03] dark:bg-[#0f2044]/20">
                                                        <UserPlus className="w-4 h-4 text-[#0f2044]/60 dark:text-[#7ba7e8]" />
                                                        <div className="flex-1 flex justify-between items-center">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('Assistant')}</span>
                                                            <span className="text-sm font-bold text-[#0f2044] dark:text-white">
                                                                {bus.assistant ? bus.assistant.name : <span className="text-gray-400 font-normal italic">{t('Not Assigned')}</span>}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                                    <button onClick={() => { setSelectedBus(bus); setIsModalOpen(true); }} className="w-full py-2.5 rounded-[12px] flex items-center justify-center gap-2 text-sm font-bold bg-[#0f2044]/5 dark:bg-white/5 text-[#0f2044] dark:text-white hover:bg-[#0f2044]/10 dark:hover:bg-white/10 transition-all">
                                                        <Eye size={16} />
                                                        {t('View Details')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-16 text-center">
                                        <div className="w-20 h-20 bg-gray-50 dark:bg-[#0f2044]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-[#0f2044] dark:text-white mb-1">{t('No Buses Found')}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('Try adjusting your search or filters')}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={DS_tableWrapper}>
                                <table className={DS_tableBase}>
                                    <thead className={DS_tableHead}>
                                        <tr>
                                            <th className={DS_tableTh(isRtl)}>{t('Bus Number')}</th>
                                            <th className={DS_tableTh(isRtl)}>{t('Plate Number')}</th>
                                            <th className={DS_tableTh(isRtl)}>{t('Capacity')}</th>
                                            <th className={DS_tableTh(isRtl)}>{t('Type')}</th>
                                            <th className={DS_tableTh(isRtl)}>{t('Driver')}</th>
                                            <th className={DS_tableTh(isRtl)}>{t('Assistant')}</th>
                                            <th className={DS_tableTh(isRtl)}>{t('Status')}</th>
                                            <th className={DS_tableTh(isRtl)}>{t('Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBuses.length > 0 ? (
                                            filteredBuses.map((bus) => (
                                                <tr key={bus.id} className={DS_tableRow}>
                                                    <td className={DS_tableTd}>
                                                        <span className="font-bold text-[#0f2044] dark:text-white">{bus.bus_number}</span>
                                                    </td>
                                                    <td className={DS_tableTd}>
                                                        <span className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{bus.plate_number}</span>
                                                    </td>
                                                    <td className={DS_tableTd}>
                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{bus.capacity} {t('Student')}</span>
                                                    </td>
                                                    <td className={DS_tableTd}>
                                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-[8px] ${bus.type === 'permanent' ? 'bg-[#0f2044]/10 text-[#0f2044] dark:bg-[#0f2044]/30 dark:text-[#7ba7e8]' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                                            {t(bus.type === 'permanent' ? 'Permanent' : 'Temporary')}
                                                        </span>
                                                    </td>
                                                    <td className={DS_tableTd}>
                                                        {bus.driver ? (
                                                            <span className="font-semibold text-gray-800 dark:text-gray-300">{bus.driver.name}</span>
                                                        ) : (
                                                            <span className="text-gray-400 italic text-sm">{t('No Driver')}</span>
                                                        )}
                                                    </td>
                                                    <td className={DS_tableTd}>
                                                        {bus.assistant ? (
                                                            <span className="font-semibold text-gray-800 dark:text-gray-300">{bus.assistant.name}</span>
                                                        ) : (
                                                            <span className="text-gray-400 italic text-sm">{t('Not Assigned')}</span>
                                                        )}
                                                    </td>
                                                    <td className={DS_tableTd}>
                                                        {getStatusBadge(bus.status)}
                                                    </td>
                                                    <td className={DS_tableTd}>
                                                        <button onClick={() => { setSelectedBus(bus); setIsModalOpen(true); }} className="p-2 rounded-xl text-gray-500 hover:text-[#0f2044] dark:hover:text-white bg-gray-50 dark:bg-gray-800 hover:bg-[#0f2044]/10 dark:hover:bg-white/10 transition-all">
                                                            <Eye size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-gray-400 font-bold">
                                                    {t('No Buses Found')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* --- View Details Modal --- */}
            <AnimatePresence>
                {isModalOpen && selectedBus && (
                    <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="2xl">
                        <div className={DS_modalHeader(isRtl)}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
                                    <BusIcon className="w-5 h-5 text-white" />
                                </div>
                                <div className={isRtl ? "text-right" : "text-left"}>
                                    <h3 className="text-xl font-bold text-white">
                                        {selectedBus.bus_number}
                                    </h3>
                                    <p className="text-[#7ba7e8] text-sm font-semibold">{selectedBus.plate_number}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className={DS_modalClose}><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="p-8 space-y-8 overflow-y-auto max-h-[80vh]">
                            <div className="flex items-center gap-6 p-6 rounded-[22px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="w-24 h-24 rounded-[22px] border-4 border-white dark:border-[#243460] overflow-hidden shadow-lg bg-[#0f2044] flex items-center justify-center">
                                    <BusIcon className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-[#0f2044] dark:text-white mb-2">
                                        {selectedBus.bus_number}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(selectedBus.status)}
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#0f2044]/[0.07] dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8]">
                                            {t(selectedBus.type === 'permanent' ? 'Permanent' : 'Temporary')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <div className="w-12 h-12 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600"><Fingerprint className="w-6 h-6" /></div>
                                    <div><p className={DS_labelCls}>{t('Plate Number')}</p><p className="font-bold text-[#0f2044] dark:text-white">{selectedBus.plate_number}</p></div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <div className="w-12 h-12 rounded-[14px] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600"><Users className="w-6 h-6" /></div>
                                    <div><p className={DS_labelCls}>{t('Capacity')}</p><p className="font-bold text-[#0f2044] dark:text-white">{selectedBus.capacity} {t('Student')}</p></div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <div className="w-12 h-12 rounded-[14px] bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600"><User className="w-6 h-6" /></div>
                                    <div className="min-w-0"><p className={DS_labelCls}>{t('Driver')}</p><p className="font-bold text-[#0f2044] dark:text-white truncate">{selectedBus.driver ? selectedBus.driver.name : t('No Driver')}</p></div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                    <div className="w-12 h-12 rounded-[14px] bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600"><UserPlus className="w-6 h-6" /></div>
                                    <div className="min-w-0"><p className={DS_labelCls}>{t('Assistant')}</p><p className="font-bold text-[#0f2044] dark:text-white truncate">{selectedBus.assistant ? selectedBus.assistant.name : t('Not Assigned')}</p></div>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </SchoolAuthenticatedLayout>
    );
}
