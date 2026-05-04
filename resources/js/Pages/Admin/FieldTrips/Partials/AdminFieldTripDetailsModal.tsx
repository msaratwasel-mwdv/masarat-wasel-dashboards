import { useState, useEffect } from 'react';
import useTranslation from '@/hooks/useTranslation';
import axios from 'axios';
import FieldTripMapDisplay from '@/Components/FieldTripMapDisplay';
import { useTheme } from '@/Contexts/ThemeContext';
import OmaniRial from '@/Components/OmaniRial';
import { 
    X, 
    Search, 
    MapPin, 
    Calendar, 
    Users, 
    Bus as BusIcon, 
    User, 
    Navigation,
    Info,
    ShieldCheck
} from 'lucide-react';
import { 
    DS_modalContainer, 
    DS_modalHeader, 
    DS_modalHeaderTitle, 
    DS_modalHeaderAccent, 
    DS_modalClose, 
    DS_modalBody, 
    DS_modalFooter, 
    DS_btnSecondary,
    DS_label
} from '@/lib/DS';

interface Props {
    show: boolean;
    onClose: () => void;
    tripId: number | null;
}

export default function AdminFieldTripDetailsModal({ show, onClose, tripId }: Props) {
    const { t } = useTranslation();
    const { isRTL, theme } = useTheme();
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(false);
    const [tripData, setTripData] = useState<any>(null);

    useEffect(() => {
        if (show && tripId) {
            fetchTripDetails();
        } else {
            setTripData(null);
        }
    }, [show, tripId]);

    const fetchTripDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.field-trips.show', tripId!));
            setTripData(response.data.trip);
        } catch (error) {
            console.error('Failed to fetch trip details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div 
                className={`bg-white dark:bg-[#1a2845] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden ${DS_modalContainer} animate-slideUp`} 
                onClick={e => e.stopPropagation()}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                {/* Modernized Header */}
                <div className={DS_modalHeader(isRTL)}>
                    <div className="flex items-center gap-3">
                        <div className={DS_modalHeaderAccent} />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#0f2044] rounded-xl flex items-center justify-center text-white shadow-lg">
                                <Search size={20} className="text-[#f5b800]" />
                            </div>
                            <div>
                                <h2 className={DS_modalHeaderTitle}>
                                    {loading ? t('Loading...') : tripData?.name || t('Trip Inspection')}
                                </h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                    ID: #{tripId} • {tripData?.school?.name}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className={DS_modalClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={`${DS_modalBody} overflow-y-auto custom-scrollbar`}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 space-y-4">
                            <div className="w-12 h-12 border-4 border-[#0f2044] border-t-[#f5b800] rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">{t('Synchronizing Assets...')}</p>
                        </div>
                    ) : tripData ? (
                        <div className="space-y-10 animate-fadeIn">
                            
                            {/* Operational Summary Strip */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 bg-gray-50 dark:bg-[#0f2044]/40 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1a2845] flex items-center justify-center text-[#f5b800] shadow-sm border border-gray-100 dark:border-white/5">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('Deployment Date')}</p>
                                        <p className="font-black text-sm text-[#0f2044] dark:text-white">{tripData.date}</p>
                                        <p className="text-[10px] font-bold text-[#f5b800]">{tripData.departure_time} {tripData.arrival_time ? `→ ${tripData.arrival_time}` : ''}</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-gray-50 dark:bg-[#0f2044]/40 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1a2845] flex items-center justify-center text-[#f5b800] shadow-sm border border-gray-100 dark:border-white/5">
                                        <Navigation size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('Target Objective')}</p>
                                        <p className="font-black text-sm text-[#0f2044] dark:text-white truncate">{tripData.destination_address}</p>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest mt-1">
                                            <ShieldCheck size={8} /> {t('Verified')}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-5 bg-[#0f2044] rounded-2xl shadow-xl shadow-[#0f2044]/10 flex flex-col justify-center border-b-4 border-[#f5b800]">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{t('Service Quote')}</p>
                                    <p className="text-2xl font-black text-white flex items-center justify-center gap-2">
                                        {tripData.cost ? <>{tripData.cost} <OmaniRial size="1.2em" className="inline-block align-middle me-1 opacity-80" /></> : t('Pending Quote')}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Geographic Intelligence */}
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-black text-[#0f2044] dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <MapPin size={14} className="text-[#f5b800]" />
                                        {t('Geographic Intel')}
                                    </h3>
                                    <div className="rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-inner bg-gray-50 dark:bg-[#0f2044]/20 p-2">
                                        <FieldTripMapDisplay
                                            lat={parseFloat(tripData.destination_latitude)}
                                            lng={parseFloat(tripData.destination_longitude)}
                                            isDark={isDark}
                                        />
                                    </div>
                                </div>

                                {/* Deployment Personnel */}
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-black text-[#0f2044] dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Users size={14} className="text-[#f5b800]" />
                                        {t('Deployment Faculty')}
                                    </h3>
                                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                        {tripData.internal_teachers?.map((teacher: any) => (
                                            <div key={teacher.id} className="p-4 bg-white dark:bg-[#0f2044]/40 border border-gray-100 dark:border-white/5 rounded-2xl flex items-center justify-between shadow-sm transition-all hover:border-[#f5b800]/30 group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gray-50 dark:bg-[#1a2845] rounded-xl flex items-center justify-center text-[#0f2044] dark:text-white text-[10px] font-black uppercase shadow-inner group-hover:bg-[#0f2044] group-hover:text-white transition-colors duration-300">
                                                        {teacher.first_name_ar.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-xs text-[#0f2044] dark:text-white">{teacher.first_name_ar} {teacher.last_name_ar}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('Internal Faculty')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-black text-[#f5b800]">{teacher.phone}</div>
                                            </div>
                                        ))}
                                        {tripData.external_members?.map((m: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-purple-50/20 dark:bg-purple-900/10 border border-purple-100/30 dark:border-purple-800/20 rounded-2xl flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 text-[10px] font-black uppercase">
                                                        {t('EXT')}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-xs text-purple-900 dark:text-purple-300">{m.name}</p>
                                                        <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">{t('External Escort')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Manifest (Students) */}
                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[11px] font-black text-[#0f2044] dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <User size={14} className="text-[#f5b800]" />
                                        {t('Deployment Manifest')}
                                    </h3>
                                    <span className="px-4 py-1.5 bg-[#0f2044] text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                                        {tripData.students?.length} {t('Active Seats')}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {tripData.students?.map((s: any) => (
                                        <div key={s.id} className="p-4 bg-gray-50/50 dark:bg-[#0f2044]/20 border border-gray-100 dark:border-white/5 rounded-2xl flex items-center gap-4 transition-all hover:bg-white dark:hover:bg-[#0f2044]/40 hover:shadow-lg group cursor-default">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-white/5 flex flex-col items-center justify-center shadow-inner group-hover:bg-[#f5b800] group-hover:text-white transition-all duration-500">
                                                <span className="text-[10px] font-black leading-none">{s.first_name_ar.charAt(0)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-xs text-[#0f2044] dark:text-white truncate group-hover:text-[#f5b800] transition-colors">{s.first_name_ar} {s.last_name_ar}</p>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                                    {s.current_enrollment?.classroom?.name || '---'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Asset Logistics */}
                            {tripData.bus && (
                                <div className="p-8 bg-[#0f2044] rounded-[2.5rem] shadow-2xl relative overflow-hidden group border-b-8 border-[#f5b800]">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-[#f5b800]/5 transition-all duration-700"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                        <div className="text-center md:text-right">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f5b800] text-[#0f2044] rounded-lg text-[9px] font-black uppercase tracking-widest mb-4">
                                                <BusIcon size={12} />
                                                {t('Assigned Asset')}
                                            </div>
                                            <h4 className="text-3xl font-black text-white tracking-tight leading-none mb-1">{tripData.bus.plate_number}</h4>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">{t('Bus Number')} {tripData.bus.bus_number}</p>
                                        </div>
                                        <div className="flex gap-16">
                                            <div className="text-center md:text-right">
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <Info size={10} className="text-[#f5b800]" />
                                                    {t('Command Captain')}
                                                </p>
                                                <p className="text-sm font-black text-white">{tripData.bus.driver?.first_name_ar} {tripData.bus.driver?.last_name_ar}</p>
                                                <div className="h-0.5 w-8 bg-[#f5b800] mt-2 rounded-full mx-auto md:mx-0" />
                                            </div>
                                            <div className="text-center md:text-right">
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <Info size={10} className="text-[#f5b800]" />
                                                    {t('Support Staff')}
                                                </p>
                                                <p className="text-sm font-black text-white">{tripData.bus.assistant?.first_name_ar || '---'}</p>
                                                <div className="h-0.5 w-8 bg-white/20 mt-2 rounded-full mx-auto md:mx-0" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-96 text-center">
                             <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-[2.5rem] flex items-center justify-center text-4xl mb-6 shadow-inner animate-pulse">⚠️</div>
                             <h4 className="text-xl font-black text-[#0f2044] dark:text-white mb-2">{t('Logistics Desync')}</h4>
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-xs">{t('We encountered an error while synchronizing the trip manifest. Please try again.')}</p>
                        </div>
                    )}
                </div>

                <div className={DS_modalFooter(isRTL)}>
                    <button onClick={onClose} className={DS_btnSecondary + " px-12"}>
                        {t('Terminate Session')}
                    </button>
                </div>
            </div>
        </div>
    );
}
