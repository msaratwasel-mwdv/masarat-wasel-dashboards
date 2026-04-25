import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import SchoolAuthenticatedLayout from '@/Layouts/SchoolAuthenticatedLayout';
import useTranslation from '@/hooks/useTranslation';
import { motion } from 'framer-motion';
import { Bus as BusIcon, CheckCircle2, Wrench, Search, ChevronDown, LayoutGrid, List, Plus, Users, Tag, User, UserPlus } from 'lucide-react';
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
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex bg-[#0f2044]/5 dark:bg-[#0f2044]/30 p-1 rounded-[14px]">
                                <button
                                    onClick={() => setViewMode('cards')}
                                    className={`p-2 rounded-[10px] transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-[#243460] shadow text-[#0f2044] dark:text-white' : 'text-gray-500 hover:text-[#0f2044] dark:hover:text-white'}`}
                                    title={t('Card View')}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-[10px] transition-all ${viewMode === 'table' ? 'bg-white dark:bg-[#243460] shadow text-[#0f2044] dark:text-white' : 'text-gray-500 hover:text-[#0f2044] dark:hover:text-white'}`}
                                    title={t('Table View')}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <Link href={route('school.bus-requests.index')} className={DS_btnGold}>
                                <Plus className="w-4 h-4" />
                                {t('Request Additional Bus')}
                            </Link>
                        </div>
                    </div>

                    {/* View Area */}
                    <div className="p-6">
                        {viewMode === 'cards' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </SchoolAuthenticatedLayout>
    );
}
