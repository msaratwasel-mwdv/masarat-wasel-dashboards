import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { 
    Bus as BusIcon, 
    User, 
    Calendar, 
    Clock, 
    MapPin, 
    ShieldCheck, 
    Play, 
    Video, 
    X,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock3,
    AlertCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import { 
    DS_pageWrapper, 
    DS_modalContainer,
    DS_labelCls
} from "@/lib/DS";

interface Student {
    id: number;
    full_name: string;
    student_code: string;
}

interface Attendance {
    id: number;
    student_id: number;
    status: string;
    check_in_time: string | null;
    check_out_time: string | null;
    extra_wait_time?: number;
    student: Student;
}

interface Trip {
    id: number;
    type: 'forth' | 'back';
    status: string;
    trip_date: string;
    departure_time: string | null;
    arrival_time: string | null;
    video_check: boolean;
    video_path: string | null;
    cancellation_reason?: string | null;
    bus: {
        id: number;
        bus_number: string;
        plate_number: string;
        school?: { name: string };
        route?: { name: string };
    };
    driver?: { name: string };
    assistant?: { name: string };
    attendances: Attendance[];
}

interface Props {
    auth: any;
    trip: Trip;
}

const statusConfig: Record<string, { label: string; labelAr: string; class: string; icon: any }> = {
    pending: { label: 'Pending', labelAr: 'في الانتظار', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', icon: Clock3 },
    awaiting_confirmation: { label: 'Awaiting Confirmation', labelAr: 'بانتظار التأكيد', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300', icon: Clock3 },
    in_progress: { label: 'In Progress', labelAr: 'جارية', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', icon: Play },
    finished: { label: 'Finished', labelAr: 'مكتملة', class: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', icon: CheckCircle2 },
    awaiting_video: { label: 'Awaiting Video Verification', labelAr: 'بانتظار فيديو التوثيق', class: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300', icon: Video },
    cancelled: { label: 'Cancelled', labelAr: 'ملغاة', class: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', icon: XCircle },
};

export default function Show({ auth, trip }: Props) {
    const { isRTL, isDarkMode } = useTheme();
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    const getStatus = (status: string) => statusConfig[status] || { 
        label: status, 
        labelAr: status, 
        class: 'bg-gray-100 text-gray-700',
        icon: Clock3
    };

    const getSmartStatus = (trip: Trip) => {
        const status = trip.status;
        
        if (status === 'cancelled') {
            if (trip.cancellation_reason?.includes('لم يتم مسح الحافلة')) {
                return {
                    label: 'Unscanned Empty Bus',
                    labelAr: 'لم يتم مسح الحافلة من خلوها من طلاب',
                    class: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
                    icon: XCircle
                };
            }
            if (trip.cancellation_reason?.includes('لعدم بدء الرحلة')) {
                return {
                    label: 'Cancelled (Not Started)',
                    labelAr: 'ملغاة لعدم بدء الرحلة',
                    class: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400',
                    icon: AlertCircle
                };
            }
            const isAutoClosed = trip.cancellation_reason?.includes('أغلقت تلقائياً');
            if (isAutoClosed) {
                if (!trip.departure_time) {
                    return {
                        label: 'Not Executed',
                        labelAr: 'غير منفذة',
                        class: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400',
                        icon: AlertCircle
                    };
                } else {
                    return {
                        label: 'Uncompleted',
                        labelAr: 'غير مكتملة',
                        class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
                        icon: AlertCircle
                    };
                }
            }
            return {
                label: 'Cancelled',
                labelAr: 'ملغاة',
                class: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
                icon: XCircle
            };
        }
        
        const config = statusConfig[status] || { 
            label: status, 
            labelAr: status, 
            class: 'bg-gray-100 text-gray-700',
            icon: Clock3
        };

        return {
            label: config.label,
            labelAr: config.labelAr,
            class: config.class,
            icon: config.icon
        };
    };

    const st = getSmartStatus(trip);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? `تفاصيل الرحلة #${trip.id}` : `Trip Details #${trip.id}`} />

            <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 pt-6 pb-12`}>
                {/* Unified Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.get(route('admin.daily-trips.index'))}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-[#1a2845] rounded-xl transition-all"
                        >
                            <ArrowLeft className={`w-5 h-5 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-extrabold text-[#0f2044] dark:text-white">
                                    {isRTL ? 'تفاصيل الرحلة' : 'Trip Details'}
                                </h1>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-[#243460] rounded-lg text-[10px] font-black text-gray-400 dark:text-[#7ba7e8]/60 uppercase tracking-widest">
                                    #{trip.id}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 ml-0.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${st.class}`}>
                                    <st.icon size={10} />
                                    {isRTL ? st.labelAr : st.label}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                                    trip.type === 'forth' 
                                    ? 'bg-[#0f2044] text-white' 
                                    : 'bg-[#f5b800] text-[#0f2044]'
                                }`}>
                                    {trip.type === 'forth' ? (isRTL ? 'رحلة الذهاب' : 'Forth Trip') : (isRTL ? 'رحلة العودة' : 'Back Trip')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {trip.video_path && (
                        <button
                            onClick={() => setIsVideoModalOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0f2044] hover:bg-[#1a2845] text-white rounded-xl text-xs font-black shadow-lg shadow-[#0f2044]/10 transition-all active:scale-95 border border-[#243460]"
                        >
                            <Video size={14} />
                            {isRTL ? 'مشاهدة فيديو التوثيق' : 'Watch Verification Video'}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Stats & Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Bus & Route Card */}
                        <div className="bg-white dark:bg-[#1a2845] rounded-[22px] shadow-2xl shadow-[#0f2044]/5 border border-gray-100 dark:border-[#243460] p-8">
                            <h3 className="text-[10px] font-black text-gray-400 dark:text-[#7ba7e8]/40 uppercase tracking-widest mb-6 border-b border-gray-100 dark:border-[#243460] pb-2">
                                {isRTL ? 'معلومات الحافلة والمسار' : 'Bus & Route Information'}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                        <BusIcon size={24} />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold">{trip.bus?.bus_number || '—'}</div>
                                        <div className="text-xs opacity-60 font-mono tracking-wider">{trip.bus?.plate_number || '—'}</div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-gray-50 dark:border-gray-700 space-y-3 font-medium">
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-50 flex items-center gap-2"><MapPin size={14} /> {isRTL ? 'المسار' : 'Route'}</span>
                                        <span>{trip.bus?.route?.name || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="opacity-50 flex items-center gap-2"><Calendar size={14} /> {isRTL ? 'التاريخ' : 'Date'}</span>
                                        <span>{new Date(trip.trip_date).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Staff Card */}
                        <div className="bg-white dark:bg-[#1a2845] rounded-[22px] shadow-2xl shadow-[#0f2044]/5 border border-gray-100 dark:border-[#243460] p-8">
                            <h3 className="text-[10px] font-black text-gray-400 dark:text-[#7ba7e8]/40 uppercase tracking-widest mb-6 border-b border-gray-100 dark:border-[#243460] pb-2">
                                {isRTL ? 'طاقم الرحلة' : 'Trip Crew'}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs opacity-50 mb-0.5">{isRTL ? 'السائق' : 'Driver'}</div>
                                        <div className="font-bold">{trip.driver?.name || '—'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs opacity-50 mb-0.5">{isRTL ? 'المشرفة' : 'Assistant'}</div>
                                        <div className="font-bold">{trip.assistant?.name || '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timing Stats */}
                        <div className="bg-gradient-to-br from-[#0f2044] to-[#1a2845] rounded-[22px] shadow-xl p-8 text-white">
                            <h3 className="text-[10px] font-black text-[#7ba7e8]/60 uppercase tracking-widest mb-6 border-b border-white/10 pb-2">
                                {isRTL ? 'الجدول الزمني' : 'Trip Timeline'}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold opacity-60">{isRTL ? 'وقت الانطلاق' : 'Departure'}</span>
                                        <span className="text-lg font-bold flex items-center gap-2">
                                            <Clock size={16} />
                                            {trip.departure_time ? new Date(trip.departure_time).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 text-right">
                                        <span className="text-[10px] uppercase font-bold opacity-60">{isRTL ? 'وقت الوصول' : 'Arrival'}</span>
                                        <span className="text-lg font-bold flex items-center gap-2 justify-end">
                                            {trip.arrival_time ? new Date(trip.arrival_time).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                            <Clock size={16} />
                                        </span>
                                    </div>
                                </div>
                                {trip.departure_time && trip.arrival_time && (
                                    <div className="pt-4 border-t border-white/20">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="opacity-70">{isRTL ? 'مدة الرحلة' : 'Duration'}</span>
                                            <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                                                {Math.round((new Date(trip.arrival_time).getTime() - new Date(trip.departure_time).getTime()) / 60000)} {isRTL ? 'دقيقة' : 'mins'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Attendance List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-[#1a2845] rounded-[22px] shadow-2xl shadow-[#0f2044]/5 border border-gray-100 dark:border-[#243460] overflow-hidden">
                            <div className="p-8 border-b border-gray-50 dark:border-[#243460] flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-extrabold text-[#0f2044] dark:text-white">{isRTL ? 'قائمة تحضير الطلاب' : 'Student Attendance List'}</h2>
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-[#7ba7e8]/40 uppercase tracking-widest mt-1">
                                        {isRTL ? `إجمالي ${trip.attendances.length} طالب مخصصين لهذه الرحلة` : `Total ${trip.attendances.length} students assigned to this trip`}
                                    </p>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="text-center px-4 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100">
                                        <span className="block text-emerald-600 font-bold text-lg leading-none">
                                            {trip.attendances.filter(a => a.status === 'dropped' || a.status === 'boarded').length}
                                        </span>
                                        <span className="text-[10px] text-emerald-600 font-medium">{isRTL ? 'حضور' : 'Present'}</span>
                                    </div>
                                    <div className="text-center px-4 py-1.5 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100">
                                        <span className="block text-red-600 font-bold text-lg leading-none">
                                            {trip.attendances.filter(a => a.status === 'absent').length}
                                        </span>
                                        <span className="text-[10px] text-red-600 font-medium">{isRTL ? 'غائب' : 'Absent'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
                                    <thead>
                                        <tr className="bg-gray-50/50 dark:bg-gray-900/20">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center min-w-[80px]">#</th>
                                            <th className={`px-6 py-4 text-xs font-bold text-gray-400 uppercase ${isRTL ? 'text-right' : 'text-left'}`}>
                                                {isRTL ? 'الطالب' : 'Student'}
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">
                                                {isRTL ? 'الحالة' : 'Status'}
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">
                                                {isRTL ? 'وقت الركوب' : 'Boarding'}
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-center">
                                                {isRTL ? 'وقت النزول' : 'Alighting'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                        {trip.attendances.map((attendance, index) => (
                                            <tr key={attendance.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 text-center text-gray-400 font-mono text-xs">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-800 dark:text-gray-200">{attendance.student.full_name}</span>
                                                        <span className="text-[10px] font-mono opacity-50 uppercase tracking-tighter">Code: {attendance.student.student_code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                                                        attendance.status === 'boarded' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40' :
                                                        attendance.status === 'dropped' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/40'
                                                    }`}>
                                                        {attendance.status === 'boarded' ? (isRTL ? 'على الحافلة' : 'On Bus') :
                                                         attendance.status === 'dropped' ? (isRTL ? 'تم النزول' : 'Dropped') :
                                                         (isRTL ? 'غائب' : 'Absent')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono text-xs text-gray-500">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <span>
                                                            {attendance.check_in_time ? new Date(attendance.check_in_time).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                                                        </span>
                                                        {attendance.extra_wait_time && attendance.extra_wait_time > 0 ? (
                                                            <span className="text-[10px] font-black text-rose-500 mt-1 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30" title={isRTL ? "وقت انتظار إضافي" : "Extra wait time"}>
                                                                <Clock className="w-2.5 h-2.5" />
                                                                {`+${Math.floor(attendance.extra_wait_time / 60).toString().padStart(2, '0')}:${(attendance.extra_wait_time % 60).toString().padStart(2, '0')}`}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono text-xs text-gray-500">
                                                    {attendance.check_out_time ? new Date(attendance.check_out_time).toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Verification Modal */}
            <Modal show={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} maxWidth="2xl">
                <div className={DS_modalContainer}>
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#243460]">
                        <div className="flex items-center gap-3 font-black text-[#0f2044] dark:text-white uppercase tracking-widest text-xs">
                            <Video size={16} className="text-[#f5b800]" />
                            {isRTL ? 'فيديو توثيق الرحلة' : 'Trip Verification Video'}
                        </div>
                        <button onClick={() => setIsVideoModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1a2845] rounded-xl transition-colors">
                            <X size={18} className="text-gray-400" />
                        </button>
                    </div>
                    
                    <div className="aspect-video bg-black flex items-center justify-center">
                        {trip.video_path ? (
                            <video
                                src={`/storage/${trip.video_path}`}
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-white flex flex-col items-center gap-3">
                                <Video size={48} className="opacity-40 animate-pulse" />
                                <span className="opacity-60">{isRTL ? 'جاري تحميل الفيديو...' : 'Loading video...'}</span>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-emerald-500/5">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg mb-1">{isRTL ? 'توثيق أمني معتمد' : 'Verified Security Check'}</h4>
                                <p className="text-sm opacity-70 leading-relaxed">
                                    {isRTL 
                                        ? 'يتم تسجيل هذا الفيديو من قبل السائق بعد انتهاء الرحلة لضمان خلو الحافلة تماماً من الطلاب ومسح كافة المقاعد.'
                                        : 'This video is recorded by the driver after the trip ends to ensure the bus is completely empty and all seats have been checked.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                        <SecondaryButton onClick={() => setIsVideoModalOpen(false)}>
                            {isRTL ? 'إغلاق' : 'Close'}
                        </SecondaryButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
