import React, { useState, useEffect } from 'react';
import useTranslation from '@/hooks/useTranslation';
import axios from 'axios';
import { useTheme } from '@/Contexts/ThemeContext';
import { 
    X, 
    Bus as BusIcon, 
    User, 
    Calendar, 
    Clock, 
    MapPin, 
    ShieldCheck, 
    Video, 
    CheckCircle2, 
    XCircle, 
    Clock3, 
    AlertCircle,
    Play
} from 'lucide-react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { 
    DS_modalContainer, 
    DS_modalHeader, 
    DS_modalHeaderTitle, 
    DS_modalHeaderAccent, 
    DS_modalClose, 
    DS_modalBody
} from '@/lib/DS';

interface Props {
    show: boolean;
    onClose: () => void;
    tripId: number | null;
}

const statusConfig: Record<string, { label: string; labelAr: string; class: string; icon: any }> = {
    pending: { label: 'Pending', labelAr: 'في الانتظار', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', icon: Clock3 },
    awaiting_confirmation: { label: 'Awaiting Confirmation', labelAr: 'بانتظار التأكيد', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300', icon: Clock3 },
    in_progress: { label: 'In Progress', labelAr: 'جارية', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', icon: Play },
    finished: { label: 'Finished', labelAr: 'مكتملة', class: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', icon: CheckCircle2 },
    awaiting_video: { label: 'Awaiting Video Verification', labelAr: 'بانتظار فيديو التوثيق', class: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300', icon: Video },
    cancelled: { label: 'Cancelled', labelAr: 'ملغاة', class: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: XCircle },
};

export default function AdminDailyTripDetailsModal({ show, onClose, tripId }: Props) {
    const { t } = useTranslation();
    const { isRTL } = useTheme();
    const [loading, setLoading] = useState(false);
    const [trip, setTrip] = useState<any>(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    useEffect(() => {
        if (show && tripId) {
            fetchTripDetails();
        } else {
            setTrip(null);
        }
    }, [show, tripId]);

    const fetchTripDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.daily-trips.show', tripId!), {
                headers: { 'Accept': 'application/json' }
            });
            setTrip(response.data.trip);
        } catch (error) {
            console.error('Failed to fetch trip details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSmartStatus = (trip: any) => {
        const status = trip.status;
        if (status === 'cancelled') {
            if (trip.cancellation_reason?.includes('لم يتم مسح الحافلة')) {
                return { label: 'Unscanned Empty Bus', labelAr: 'لم يتم مسح الحافلة من خلوها من طلاب', class: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: XCircle };
            }
            if (trip.cancellation_reason?.includes('لعدم بدء الرحلة')) {
                return { label: 'Cancelled (Not Started)', labelAr: 'ملغاة لعدم بدء الرحلة', class: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400', icon: AlertCircle };
            }
            const isAutoClosed = trip.cancellation_reason?.includes('أغلقت تلقائياً');
            if (isAutoClosed) {
                if (!trip.departure_time) {
                    return { label: 'Not Executed', labelAr: 'غير منفذة', class: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400', icon: AlertCircle };
                } else {
                    return { label: 'Uncompleted', labelAr: 'غير مكتملة', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', icon: AlertCircle };
                }
            }
            return { label: 'Cancelled', labelAr: 'ملغاة', class: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: XCircle };
        }
        return statusConfig[status] || { label: status, labelAr: status, class: 'bg-gray-100 text-gray-700', icon: Clock3 };
    };

    if (!show) return null;

    const st = trip ? getSmartStatus(trip) : null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn" onClick={onClose}>
            <div 
                className={`w-full max-w-5xl max-h-[90vh] ${DS_modalContainer} animate-slideUp`} 
                onClick={e => e.stopPropagation()}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className={DS_modalHeader(isRTL)}>
                    <div className="flex items-center gap-3">
                        <div className={DS_modalHeaderAccent} />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#0f2044] rounded-xl flex items-center justify-center text-white shadow-lg">
                                <BusIcon size={20} className="text-[#f5b800]" />
                            </div>
                            <div>
                                <h2 className={DS_modalHeaderTitle}>
                                    {loading ? (isRTL ? 'جاري التحميل...' : 'Loading...') : (isRTL ? `تفاصيل الرحلة #${tripId}` : `Trip Details #${tripId}`)}
                                </h2>
                                {trip && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm ${st?.class}`}>
                                            {st && <st.icon size={10} />}
                                            {isRTL ? st?.labelAr : st?.label}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm ${
                                            trip.type === 'forth' ? 'bg-[#0f2044] text-white' : 'bg-[#f5b800] text-[#0f2044]'
                                        }`}>
                                            {trip.type === 'forth' ? (isRTL ? 'رحلة الذهاب' : 'Forth Trip') : (isRTL ? 'رحلة العودة' : 'Back Trip')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                        {trip?.video_path && (
                            <button
                                onClick={() => setIsVideoModalOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-black transition-all border border-indigo-200"
                            >
                                <Video size={14} />
                                <span className="hidden sm:inline">{isRTL ? 'فيديو التوثيق' : 'Video'}</span>
                            </button>
                        )}
                        <button onClick={onClose} className={DS_modalClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className={`${DS_modalBody} overflow-y-auto custom-scrollbar p-6 bg-gray-50/50 dark:bg-[#1a2845]`}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 space-y-4">
                            <div className="w-12 h-12 border-4 border-[#0f2044] border-t-[#f5b800] rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">{isRTL ? 'جاري جلب البيانات...' : 'Fetching Data...'}</p>
                        </div>
                    ) : trip ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                            {/* Left Column: Stats & Info */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Bus & Route Card */}
                                <div className="bg-white dark:bg-[#0f2044] rounded-[22px] shadow-sm border border-gray-100 dark:border-white/5 p-6">
                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-[#7ba7e8]/40 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-white/5 pb-2">
                                        {isRTL ? 'معلومات الحافلة والمسار' : 'Bus & Route Information'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                                <BusIcon size={24} />
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold dark:text-white">{trip.bus?.bus_number || '—'}</div>
                                                <div className="text-xs text-gray-500 font-mono tracking-wider">{trip.bus?.plate_number || '—'}</div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-50 dark:border-white/5 space-y-3 font-medium text-gray-700 dark:text-gray-300">
                                            <div className="flex justify-between text-sm">
                                                <span className="opacity-50 flex items-center gap-2"><MapPin size={14} /> {isRTL ? 'المسار' : 'Route'}</span>
                                                <span className="font-bold">{trip.bus?.route?.name || '—'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="opacity-50 flex items-center gap-2"><Calendar size={14} /> {isRTL ? 'التاريخ' : 'Date'}</span>
                                                <span className="font-bold">{new Date(trip.trip_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Staff Card */}
                                <div className="bg-white dark:bg-[#0f2044] rounded-[22px] shadow-sm border border-gray-100 dark:border-white/5 p-6">
                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-[#7ba7e8]/40 uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-white/5 pb-2">
                                        {isRTL ? 'طاقم الرحلة' : 'Trip Crew'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase">{isRTL ? 'السائق' : 'Driver'}</div>
                                                <div className="font-black text-sm dark:text-white">{trip.driver?.name || '—'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase">{isRTL ? 'المشرفة' : 'Assistant'}</div>
                                                <div className="font-black text-sm dark:text-white">{trip.assistant?.name || '—'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Timing Stats */}
                                <div className="bg-gradient-to-br from-[#0f2044] to-[#1a2845] rounded-[22px] shadow-xl p-6 text-white border-b-4 border-[#f5b800]">
                                    <h3 className="text-[10px] font-black text-[#7ba7e8]/60 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                                        {isRTL ? 'الجدول الزمني' : 'Trip Timeline'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] uppercase font-bold opacity-60">{isRTL ? 'وقت الانطلاق' : 'Departure'}</span>
                                                <span className="text-sm font-black flex items-center gap-2">
                                                    <Clock size={14} className="text-[#f5b800]" />
                                                    {trip.departure_time ? new Date(trip.departure_time).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1 text-right">
                                                <span className="text-[10px] uppercase font-bold opacity-60">{isRTL ? 'وقت الوصول' : 'Arrival'}</span>
                                                <span className="text-sm font-black flex items-center gap-2 justify-end">
                                                    {trip.arrival_time ? new Date(trip.arrival_time).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                    <Clock size={14} className="text-emerald-400" />
                                                </span>
                                            </div>
                                        </div>
                                        {trip.departure_time && trip.arrival_time && (
                                            <div className="pt-4 border-t border-white/10">
                                                <div className="flex justify-between items-center text-xs font-black">
                                                    <span className="opacity-70">{isRTL ? 'مدة الرحلة' : 'Duration'}</span>
                                                    <span className="bg-white/10 px-2 py-1 rounded-lg text-[#f5b800]">
                                                        {Math.round((new Date(trip.arrival_time).getTime() - new Date(trip.departure_time).getTime()) / 60000)} {isRTL ? 'دقيقة' : 'mins'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Attendance List */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="bg-white dark:bg-[#0f2044] rounded-[22px] shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col h-full">
                                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-extrabold text-[#0f2044] dark:text-white">{isRTL ? 'قائمة تحضير الطلاب' : 'Student Attendance List'}</h2>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-[#7ba7e8]/40 uppercase tracking-widest mt-1">
                                                {isRTL ? `إجمالي ${trip.attendances?.length || 0} طالباً مخصصين لهذه الرحلة` : `Total ${trip.attendances?.length || 0} students assigned to this trip`}
                                            </p>
                                        </div>
                                        
                                        <div className="flex gap-2 shrink-0">
                                            <div className="text-center px-4 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                                                <span className="block text-emerald-600 font-black text-base leading-none">
                                                    {trip.attendances?.filter((a: any) => a.status === 'dropped' || a.status === 'boarded').length || 0}
                                                </span>
                                                <span className="text-[9px] font-black uppercase text-emerald-600/70">{isRTL ? 'حضور' : 'Present'}</span>
                                            </div>
                                            <div className="text-center px-4 py-1.5 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30">
                                                <span className="block text-rose-600 font-black text-base leading-none">
                                                    {trip.attendances?.filter((a: any) => a.status === 'absent').length || 0}
                                                </span>
                                                <span className="text-[9px] font-black uppercase text-rose-600/70">{isRTL ? 'غائب' : 'Absent'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto flex-1">
                                        <table className="w-full text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
                                            <thead className="bg-gray-50 dark:bg-[#1a2845] sticky top-0 border-b border-gray-100 dark:border-white/5">
                                                <tr>
                                                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-12">#</th>
                                                    <th className={`px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest ${isRTL ? 'text-right' : 'text-left'}`}>
                                                        {isRTL ? 'الطالب' : 'Student'}
                                                    </th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                                                        {isRTL ? 'الحالة' : 'Status'}
                                                    </th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                                                        {isRTL ? 'الركوب' : 'Boarding'}
                                                    </th>
                                                    <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                                                        {isRTL ? 'النزول' : 'Alighting'}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                                                {trip.attendances?.map((attendance: any, index: number) => (
                                                    <tr key={attendance.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2845]/50 transition-colors">
                                                        <td className="px-4 py-3 text-center text-gray-400 font-mono text-xs font-bold">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-800 dark:text-gray-200">{attendance.student.full_name}</span>
                                                                <span className="text-[9px] font-black text-gray-400 uppercase">#{attendance.student.student_code}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                                attendance.status === 'boarded' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' :
                                                                attendance.status === 'dropped' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' :
                                                                'bg-rose-50 text-rose-600 dark:bg-rose-900/30'
                                                            }`}>
                                                                {attendance.status === 'boarded' ? (isRTL ? 'على الحافلة' : 'On Bus') :
                                                                 attendance.status === 'dropped' ? (isRTL ? 'تم النزول' : 'Dropped') :
                                                                 (isRTL ? 'غائب' : 'Absent')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <span>
                                                                    {attendance.check_in_time ? new Date(attendance.check_in_time).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                                </span>
                                                                {attendance.extra_wait_time && attendance.extra_wait_time > 0 ? (
                                                                    <span className="text-[8px] font-black text-rose-500 mt-1 flex items-center gap-0.5 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-900/50" title={isRTL ? "وقت انتظار إضافي" : "Extra wait time"}>
                                                                        <Clock className="w-2 h-2" />
                                                                        {`+${Math.floor(attendance.extra_wait_time / 60).toString().padStart(2, '0')}:${(attendance.extra_wait_time % 60).toString().padStart(2, '0')}`}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-[11px] font-bold text-gray-500 dark:text-gray-400">
                                                            {attendance.check_out_time ? new Date(attendance.check_out_time).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!trip.attendances || trip.attendances.length === 0) && (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 font-bold">
                                                            {isRTL ? 'لا يوجد طلاب مسجلين في هذه الرحلة' : 'No students assigned to this trip'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-96 text-center">
                             <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm">⚠️</div>
                             <h4 className="text-lg font-black text-[#0f2044] dark:text-white mb-2">{isRTL ? 'فشل تحميل البيانات' : 'Failed to load data'}</h4>
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Video Modal */}
            <Modal show={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} maxWidth="2xl">
                <div className={DS_modalContainer} dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className={DS_modalHeader(isRTL)}>
                        <div className="flex items-center gap-3">
                            <div className={DS_modalHeaderAccent} />
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#0f2044] dark:text-white">
                                <Video size={16} className="text-[#f5b800]" />
                                {isRTL ? 'فيديو توثيق الرحلة' : 'Trip Verification Video'}
                            </div>
                        </div>
                        <button onClick={() => setIsVideoModalOpen(false)} className={DS_modalClose}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="aspect-video bg-black flex items-center justify-center">
                        {trip?.video_path ? (
                            <video
                                src={`/storage/${trip.video_path}`}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-white flex flex-col items-center gap-3">
                                <Video size={48} className="opacity-40 animate-pulse" />
                                <span className="opacity-60 text-sm font-bold">{isRTL ? 'جاري التحميل...' : 'Loading...'}</span>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border-t border-emerald-100 dark:border-emerald-800/30">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm text-emerald-900 dark:text-emerald-100 mb-1">{isRTL ? 'توثيق أمني معتمد' : 'Verified Security Check'}</h4>
                                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 leading-relaxed">
                                    {isRTL 
                                        ? 'يتم تسجيل هذا الفيديو من قبل السائق بعد انتهاء الرحلة لضمان خلو الحافلة تماماً من الطلاب ومسح كافة المقاعد.'
                                        : 'This video is recorded by the driver after the trip ends to ensure the bus is completely empty and all seats have been checked.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
