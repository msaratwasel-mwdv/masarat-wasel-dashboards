import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useTranslation from '@/hooks/useTranslation';
import axios from 'axios';
import FieldTripMapDisplay from '@/Components/FieldTripMapDisplay';
import { useTheme } from '@/Contexts/ThemeContext';
import {
    DS_btnSecondary,
    DS_modalHeader,
    DS_modalHeaderAccent,
    DS_modalClose,
    DS_modalBody,
    DS_statCard,
    DS_statIcon,
    DS_statLabel,
    DS_statValue,
    DS_badge,
    DS_card,
    DS_avatar,
} from '@/lib/DS';
import { Calendar, Clock, MapPin, Users, GraduationCap, Bus, UserCheck, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
    show: boolean;
    onClose: () => void;
    tripId: number | null;
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
    const map: Record<string, { label: string; cls: string }> = {
        pending:     { label: t('Pending Review'), cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/30' },
        approved:    { label: t('Approved'),       cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30' },
        in_progress: { label: t('In Progress'),    cls: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800/30' },
        completed:   { label: t('Completed'),      cls: 'bg-[#0f2044]/10 dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8] border-[#0f2044]/10 dark:border-[#243460]' },
        cancelled:   { label: t('Cancelled'),      cls: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30' },
    };
    const { label, cls } = map[status] ?? { label: status, cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}>
            {label}
        </span>
    );
}

export default function ViewFieldTripModal({ show, onClose, tripId }: Props) {
    const { t } = useTranslation();
    const { isRTL, theme } = useTheme();
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(false);
    const [tripData, setTripData] = useState<any>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (show && tripId) {
            fetchTripDetails();
        } else {
            setTripData(null);
            setError(false);
        }
    }, [show, tripId]);

    const fetchTripDetails = async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await axios.get(route('school.field-trips.show', tripId!));
            setTripData(response.data.trip);
        } catch (err) {
            console.error('Failed to fetch trip details:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const totalParticipants =
        (tripData?.students?.length ?? 0) +
        (tripData?.internal_teachers?.length ?? 0) +
        (tripData?.external_members?.length ?? 0);

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
            onClick={onClose}
        >
            <div
                className={`bg-white dark:bg-[#1a2845] rounded-[22px] shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 dark:border-[#243460] ${isRTL ? 'rtl' : 'ltr'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ──────────────────────────────── */}
                <div className={`${DS_modalHeader(isRTL)} flex-shrink-0`}>
                    <div className="flex items-center gap-3">
                        <div className={DS_modalHeaderAccent} />
                        <div className="w-10 h-10 bg-white/10 rounded-[14px] flex items-center justify-center text-xl border border-white/10">
                            🗺️
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white leading-none">
                                {loading ? t('Loading...') : (tripData?.name || t('Trip Details'))}
                            </h2>
                            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                                {t('Field Trip')} · #{tripId}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {tripData?.status && !loading && (
                            <StatusBadge status={tripData.status} t={t} />
                        )}
                        <button onClick={onClose} className={DS_modalClose}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── Body ────────────────────────────────── */}
                <div className={`${DS_modalBody} custom-scrollbar`}>
                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-60 gap-4">
                            <Loader2 className="w-10 h-10 text-[#0f2044] dark:text-[#7ba7e8] animate-spin" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Loading...')}</p>
                        </div>
                    )}

                    {/* Error State */}
                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center h-60 gap-4">
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                                <AlertCircle className="w-7 h-7 text-red-500" />
                            </div>
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{t('Failed to load asset data')}</p>
                            <button onClick={fetchTripDetails} className={DS_btnSecondary + ' text-xs'}>
                                {t('Retry')}
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    {!loading && !error && tripData && (
                        <div className="space-y-5 animate-fadeIn">

                            {/* ── Stats Row ─────────────────────── */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {/* Date */}
                                <div className={DS_statCard('navy')}>
                                    <div className={DS_statIcon('navy')}>
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={DS_statLabel}>{t('Date')}</p>
                                        <p className="text-sm font-black text-[#0f2044] dark:text-white mt-0.5 leading-none">
                                            {tripData.date ? tripData.date.split('T')[0] : '—'}
                                        </p>
                                    </div>
                                </div>

                                {/* Time */}
                                <div className={DS_statCard('gold')}>
                                    <div className={DS_statIcon('gold')}>
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={DS_statLabel}>{t('Departure')}</p>
                                        <p className="text-sm font-black text-[#b38600] dark:text-[#f5b800] mt-0.5 leading-none">
                                            {tripData.departure_time || '—'}
                                        </p>
                                    </div>
                                </div>

                                {/* Students count */}
                                <div className={DS_statCard('green')}>
                                    <div className={DS_statIcon('green')}>
                                        <GraduationCap className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={DS_statLabel}>{t('Students')}</p>
                                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 leading-none">
                                            {tripData.students?.length ?? 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Total participants */}
                                <div className={DS_statCard('blue')}>
                                    <div className={DS_statIcon('blue')}>
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={DS_statLabel}>{t('Total')}</p>
                                        <p className="text-sm font-black text-sky-600 dark:text-sky-400 mt-0.5 leading-none">
                                            {totalParticipants}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Description ───────────────────── */}
                            {tripData.description && (
                                <div className={`${DS_card} p-4`}>
                                    <p className={DS_statLabel + ' mb-2'}>{t('Description & Objectives')}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                        {tripData.description}
                                    </p>
                                </div>
                            )}

                            {/* ── Map + Faculty ──────────────────── */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                                {/* Map */}
                                <div className={DS_card}>
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-[#243460] flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-[#0f2044]/50 dark:text-[#7ba7e8]/50" />
                                        <span className={DS_statLabel}>{t('Location Context')}</span>
                                        {tripData.destination_address && (
                                            <span className="ms-auto text-[9px] font-bold text-gray-400 truncate max-w-[120px]">{tripData.destination_address}</span>
                                        )}
                                    </div>
                                    <div className="h-52 relative bg-gray-50 dark:bg-[#0f2044]/20">
                                        {tripData.destination_latitude && tripData.destination_longitude ? (
                                            <FieldTripMapDisplay
                                                lat={parseFloat(tripData.destination_latitude)}
                                                lng={parseFloat(tripData.destination_longitude)}
                                                isDark={isDark}
                                            />
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-[#0f2044]/30 rounded-2xl flex items-center justify-center">
                                                    <MapPin className="w-5 h-5 opacity-40" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-widest">{t('No Location Data')}</p>
                                            </div>
                                        )}
                                    </div>
                                    {tripData.arrival_time && (
                                        <div className="px-4 py-2 border-t border-gray-100 dark:border-[#243460] flex items-center justify-between">
                                            <span className={DS_statLabel}>{t('Arrival (Est.)')}</span>
                                            <span className="text-xs font-black text-[#0f2044] dark:text-[#f5b800]">{tripData.arrival_time}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Faculty */}
                                <div className={DS_card}>
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-[#243460] flex items-center gap-2">
                                        <UserCheck className="w-3.5 h-3.5 text-[#0f2044]/50 dark:text-[#7ba7e8]/50" />
                                        <span className={DS_statLabel}>{t('Assigned Faculty')}</span>
                                        <span className="ms-auto px-2 py-0.5 bg-[#0f2044]/10 dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8] rounded-full text-[9px] font-black">
                                            {(tripData.internal_teachers?.length ?? 0) + (tripData.external_members?.length ?? 0)}
                                        </span>
                                    </div>
                                    <div className="p-3 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                                        {/* Internal teachers */}
                                        {tripData.internal_teachers?.map((teacher: any) => (
                                            <div
                                                key={teacher.id}
                                                className="flex items-center gap-3 p-2.5 rounded-[12px] bg-[#0f2044]/[0.04] dark:bg-[#0f2044]/20 hover:bg-[#0f2044]/[0.07] dark:hover:bg-[#0f2044]/30 transition-all"
                                            >
                                                <div className="w-8 h-8 rounded-[10px] bg-[#0f2044] flex items-center justify-center text-[#f5b800] text-[10px] font-black flex-shrink-0">
                                                    {teacher.first_name_ar?.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-gray-800 dark:text-white truncate">{teacher.first_name_ar} {teacher.last_name_ar}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('School Faculty')}</p>
                                                </div>
                                                {teacher.phone && (
                                                    <span className="text-[9px] font-bold text-gray-400 flex-shrink-0">{teacher.phone}</span>
                                                )}
                                            </div>
                                        ))}

                                        {/* External escorts */}
                                        {tripData.external_members?.map((m: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 p-2.5 rounded-[12px] bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                                            >
                                                <div className="w-8 h-8 rounded-[10px] bg-purple-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                                                    {m.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-purple-900 dark:text-purple-300 truncate">{m.name}</p>
                                                    <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">{t('External Escort')}</p>
                                                </div>
                                                {m.phone && (
                                                    <span className="text-[9px] font-bold text-purple-400 flex-shrink-0">{m.phone}</span>
                                                )}
                                            </div>
                                        ))}

                                        {/* Empty state */}
                                        {(!tripData.internal_teachers?.length && !tripData.external_members?.length) && (
                                            <div className="h-32 flex flex-col items-center justify-center gap-2 text-gray-300">
                                                <Users className="w-7 h-7 opacity-40" />
                                                <p className="text-[9px] font-black uppercase tracking-widest">{t('No Faculty Assigned')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Students List ──────────────────── */}
                            <div className={DS_card}>
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-[#243460] flex items-center gap-2">
                                    <GraduationCap className="w-3.5 h-3.5 text-[#0f2044]/50 dark:text-[#7ba7e8]/50" />
                                    <span className={DS_statLabel}>{t('Participating Students')}</span>
                                    <span className="ms-auto px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] font-black">
                                        {tripData.students?.length ?? 0} {t('Total')}
                                    </span>
                                </div>
                                <div className="p-3">
                                    {tripData.students?.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                                            {tripData.students.map((s: any) => (
                                                <div
                                                    key={s.id}
                                                    className="flex items-center gap-2.5 p-2.5 rounded-[12px] bg-[#0f2044]/[0.03] dark:bg-[#0f2044]/20 hover:bg-[#0f2044]/[0.06] dark:hover:bg-[#0f2044]/30 transition-all group cursor-default"
                                                >
                                                    <div className={`${DS_avatar} w-8 h-8 group-hover:bg-[#0f2044] group-hover:text-[#f5b800] transition-colors duration-300`}>
                                                        {s.first_name_ar?.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-black text-gray-800 dark:text-white truncate leading-none">
                                                            {s.first_name_ar} {s.last_name_ar}
                                                        </p>
                                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                            {s.current_enrollment?.classroom?.name || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-24 flex flex-col items-center justify-center gap-2 text-gray-300">
                                            <GraduationCap className="w-7 h-7 opacity-40" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">{t('No Students Assigned')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Bus & Logistics (if assigned) ──── */}
                            {tripData.bus && (
                                <div className="p-5 bg-[#0f2044] rounded-[18px] shadow-xl relative overflow-hidden group">
                                    {/* Decorative glow */}
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#f5b800]/10 rounded-full blur-3xl group-hover:bg-[#f5b800]/20 transition-all duration-1000 pointer-events-none" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-2 h-5 bg-[#f5b800] rounded-full" />
                                            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">{t('Assigned Logistics')}</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {/* Bus info */}
                                            <div className="p-4 bg-white/5 rounded-[14px] border border-white/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Bus className="w-4 h-4 text-[#f5b800]" />
                                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{t('Vehicle')}</p>
                                                </div>
                                                <p className="text-lg font-black text-white">{tripData.bus.plate_number}</p>
                                                <p className="text-[10px] font-bold text-[#f5b800]/70 mt-0.5 uppercase">{tripData.bus.bus_number}</p>
                                            </div>
                                            {/* Driver */}
                                            <div className="p-4 bg-white/5 rounded-[14px] border border-white/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <UserCheck className="w-4 h-4 text-[#f5b800]" />
                                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{t('Captain')}</p>
                                                </div>
                                                <p className="text-sm font-black text-white">
                                                    {tripData.bus.driver?.first_name_ar} {tripData.bus.driver?.last_name_ar}
                                                </p>
                                                {tripData.bus.driver?.phone && (
                                                    <p className="text-[10px] font-bold text-white/40 mt-0.5">{tripData.bus.driver.phone}</p>
                                                )}
                                            </div>
                                            {/* Assistant */}
                                            <div className="p-4 bg-white/5 rounded-[14px] border border-white/10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Users className="w-4 h-4 text-[#f5b800]" />
                                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{t('Logistics Assistant')}</p>
                                                </div>
                                                <p className="text-sm font-black text-white">
                                                    {tripData.bus.assistant?.first_name_ar || '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer ──────────────────────────────── */}
                <div className="px-5 py-3 bg-gray-50/50 dark:bg-[#0f2044]/10 border-t border-gray-100 dark:border-[#243460] flex items-center justify-between rounded-b-[22px] flex-shrink-0">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {t('Field Trip')} · #{tripId}
                    </p>
                    <button onClick={onClose} className={DS_btnSecondary}>
                        {t('Close Window')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
