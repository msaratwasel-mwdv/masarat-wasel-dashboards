import { useState, useEffect } from 'react';
import useTranslation from '@/hooks/useTranslation';
import axios from 'axios';
import FieldTripMapDisplay from '@/Components/FieldTripMapDisplay';
import { useTheme } from '@/Contexts/ThemeContext';

interface Props {
    show: boolean;
    onClose: () => void;
    tripId: number | null;
}

export default function ViewFieldTripModal({ show, onClose, tripId }: Props) {
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
            const response = await axios.get(route('school.field-trips.show', tripId!));
            setTripData(response.data.trip);
        } catch (error) {
            console.error('Failed to fetch trip details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div className={`bg-white dark:bg-gray-800 rounded-[35px] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform animate-slideUp flex flex-col ${isRTL ? 'rtl' : 'ltr'}`} onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-brand-navy to-brand-dark p-6 text-white flex-shrink-0">
                    <div className="relative flex items-center justify-between z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-2xl shadow-xl border border-white/20">
                                🕵️
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight leading-none">
                                    {loading ? t('Loading Details...') : tripData?.name || t('Trip Details')}
                                </h2>
                                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1.5 lowercase italic">
                                    ID: #{tripId} • {tripData?.status === 'pending' ? t('Pending Review') : t('Operational')}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/10">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <div className="w-12 h-12 border-4 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Synchonizing with HQ...')}</p>
                        </div>
                    ) : tripData ? (
                        <div className="space-y-8 animate-fadeIn">
                            
                            {/* Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">📅 {t('Schedule')}</p>
                                    <p className="font-black text-sm text-gray-800 dark:text-gray-100">{tripData.date}</p>
                                    <p className="text-xs font-bold text-brand-navy dark:text-brand-yellow mt-1">
                                        {tripData.departure_time} {tripData.arrival_time ? `→ ${tripData.arrival_time}` : ''}
                                    </p>
                                </div>
                                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">📍 {t('Deployment')}</p>
                                    <p className="font-black text-sm text-gray-800 dark:text-gray-100 truncate">{tripData.destination_address}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded text-[8px] font-black uppercase tracking-widest">Geo-Linked</span>
                                    </div>
                                </div>
                                <div className="p-6 bg-brand-navy text-white rounded-3xl shadow-xl shadow-brand-navy/10 flex flex-col justify-center">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{t('Expedition Cost')}</p>
                                    <p className="text-2xl font-black">{tripData.cost ? `${tripData.cost} ر.س` : t('Pending Quote')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Map Box */}
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('Location Context')}</h3>
                                    <FieldTripMapDisplay
                                        lat={parseFloat(tripData.destination_latitude)}
                                        lng={parseFloat(tripData.destination_longitude)}
                                        isDark={isDark}
                                    />
                                </div>

                                {/* Participants Summary */}
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('Assigned Faculty')}</h3>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        {tripData.internal_teachers?.map((teacher: any) => (
                                            <div key={teacher.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-between shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-brand-navy rounded-lg flex items-center justify-center text-white text-[10px] font-black uppercase shadow-lg">T</div>
                                                    <div>
                                                        <p className="font-black text-xs text-gray-800 dark:text-gray-100">{teacher.first_name_ar} {teacher.last_name_ar}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('School Faculty')}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-black text-gray-400">{teacher.phone}</span>
                                            </div>
                                        ))}
                                        {tripData.external_members?.map((m: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-purple-50/30 dark:bg-purple-900/10 border border-purple-100/50 dark:border-purple-800/30 rounded-2xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black uppercase shadow-lg shadow-purple-500/20">E</div>
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

                            {/* Students List */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{t('Participating Students')}</h3>
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">
                                        {tripData.students?.length} {t('Total')}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-96 pr-2 custom-scrollbar">
                                    {tripData.students?.map((s: any) => (
                                        <div key={s.id} className="p-4 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center gap-3 transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-md cursor-default group">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center shadow-inner group-hover:bg-brand-navy group-hover:text-white transition-colors duration-500">
                                                <span className="text-[10px] font-black">{s.first_name_ar.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <p className="font-black text-xs text-gray-800 dark:text-gray-100 group-hover:text-brand-navy dark:group-hover:text-cyan-400 transition-colors">{s.first_name_ar} {s.last_name_ar}</p>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                                    {s.current_enrollment?.classroom?.name || '---'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bus & Logistics (Only if assigned) */}
                            {tripData.bus && (
                                <div className="p-8 bg-gradient-to-br from-brand-navy to-brand-dark rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-1000"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                        <div className="text-center md:text-right">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">{t('Logistics Asset')}</p>
                                            <h4 className="text-2xl font-black text-white tracking-tight">{tripData.bus.plate_number}</h4>
                                            <p className="text-[11px] font-bold text-brand-yellow/80 mt-1 uppercase tracking-widest">{tripData.bus.bus_number}</p>
                                        </div>
                                        <div className="h-px w-16 bg-white/20 hidden md:block" />
                                        <div className="flex gap-12 text-center">
                                            <div>
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{t('Captain')}</p>
                                                <p className="text-xs font-black text-white">{tripData.bus.driver?.first_name_ar} {tripData.bus.driver?.last_name_ar}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{t('Logistics Assistant')}</p>
                                                <p className="text-xs font-black text-white">{tripData.bus.assistant?.first_name_ar || '---'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-red-400">
                             <span className="text-4xl mb-4">❌</span>
                             <p className="font-black text-[10px] uppercase tracking-widest">{t('Failed to load asset data')}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end">
                    <button onClick={onClose} className="px-12 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white font-black rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all uppercase tracking-widest text-[10px]">
                        {t('Close Window')}
                    </button>
                </div>
            </div>
        </div>
    );
}
