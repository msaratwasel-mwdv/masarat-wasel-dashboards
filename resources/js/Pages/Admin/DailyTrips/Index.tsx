import React, { useState, useEffect, useMemo } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import { toast } from 'react-toastify';
import Modal from '@/Components/Modal';
import BaseDataTable, { ActionButton, StatusBadge, type FilterTab, type PaginationMeta } from '@/Components/BaseDataTable';
import PrintReportHeader from "@/Components/PrintReportHeader";
import {
    DS_pageWrapper,
    DS_statCard,
    DS_statIcon,
    DS_statLabel,
    DS_statValue,
    DS_modalContainer,
    DS_modalHeader,
    DS_modalHeaderTitle,
    DS_modalHeaderAccent,
    DS_modalClose,
    DS_modalBody,
    DS_btnSecondary,
    DS_inputCls,
    DS_labelCls,
    DS_selectCls
} from "@/lib/DS";
import SearchableSelect from '@/Components/SearchableSelect';
import {
    Video,
    ShieldCheck,
    Play,
    X,
    Eye,
    Edit2,
    Trash2,
    CheckCircle2,
    Printer,
    ArrowUpRight,
    ArrowDownLeft,
    Zap,
    Search,
    Clock3,
    Bus as BusIcon,
    MapPin,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';

interface Driver {
    name: string;
}

interface Bus {
    id: number;
    bus_number: string;
    driver?: Driver;
    route?: {
        name: string;
    };
}

interface Trip {
    id: number;
    trip_date: string;
    type: 'forth' | 'back';
    status: string;
    departure_time: string | null;
    arrival_time: string | null;
    bus?: Bus;
    driver?: Driver;
    assistant?: {
        name: string;
    };
    video_check: boolean;
    video_path: string | null;
    cancellation_reason?: string | null;
}

interface PaginatedTrips {
    data: Trip[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

interface Props {
    auth: any;
    trips: PaginatedTrips;
    filters: {
        date?: string;
        status?: string;
    };
    buses: Bus[];
    routes: Route[];
}

const statusConfig: Record<string, { label: string; labelAr: string; class: string }> = {
    pending: { label: 'Pending', labelAr: 'في الانتظار', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
    awaiting_confirmation: { label: 'Awaiting Confirmation', labelAr: 'بانتظار التأكيد', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
    in_progress: { label: 'In Progress', labelAr: 'جارية', class: 'bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300' },
    finished: { label: 'Completed', labelAr: 'مكتملة', class: 'bg-green-100  text-green-800  dark:bg-green-900/40  dark:text-green-300' },
    completed: { label: 'Completed', labelAr: 'مكتملة', class: 'bg-green-100  text-green-800  dark:bg-green-900/40  dark:text-green-300' },
    awaiting_video: { label: 'Awaiting Video', labelAr: 'بانتظار فيديو التوثيق', class: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' },
    cancelled: { label: 'Cancelled', labelAr: 'ملغاة', class: 'bg-red-100    text-red-800    dark:bg-red-900/40    dark:text-red-300' },
};

export default function Index({ auth, trips, filters, buses, routes }: Props) {
    const { isRTL, isDarkMode } = useTheme();
    const { flash } = usePage().props as any;
    const [dateFilter, setDateFilter] = useState(filters.date || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [autoCreateDate, setAutoCreateDate] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [dateValidation, setDateValidation] = useState<{ status: string; message: string; message_ar: string; is_working: boolean } | null>(null);

    // Manual Create Form
    const { data: createData, setData: setCreateData, post: postCreate, processing: processingCreate, errors: createErrors, reset: resetCreate } = useForm({
        bus_id: '',
        route_id: '',
        type: 'forth',
        date: autoCreateDate,
    });

    // Handle overnight tab sessions by refreshing the date when the window gains focus
    useEffect(() => {
        const handleFocus = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const today = `${year}-${month}-${day}`;
            
            // Only update if the user hasn't manually selected a different date
            // (assuming autoCreateDate is either today or whatever they chose). 
            // Actually, to be safe, we just set it to today if it's a new day.
            // But let's just update the initial state if it's lagging.
            setAutoCreateDate(prev => {
                if (prev !== today) return today;
                return prev;
            });
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') handleFocus();
        });

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, []);

    useEffect(() => {
        if (createData.bus_id) {
            const bus = buses.find(b => b.id === parseInt(createData.bus_id));
            if (bus && bus.route_id) {
                setCreateData('route_id', bus.route_id.toString());
            }
        }
    }, [createData.bus_id]);

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate(route('admin.daily-trips.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
                toast.success(isRTL ? 'تمت إضافة الرحلة بنجاح' : 'Trip added successfully');
            }
        });
    };

    const busOptions = useMemo(() => buses.map(bus => ({
        id: bus.id,
        label: `${bus.bus_number} (${bus.plate_number})`,
        subLabel: (!bus.driver_id || !bus.supervisor_id) ? (isRTL ? 'تفاصيل ناقصة' : 'Missing Info') : undefined
    })), [buses, isRTL]);

    const routeOptions = useMemo(() => routes.map(route => {
        const selectedBus = buses.find(b => b.id === parseInt(createData.bus_id));
        const isDefault = selectedBus?.route_id === route.id;
        return {
            id: route.id,
            label: route.name,
            subLabel: isDefault ? (isRTL ? 'المسار الافتراضي' : 'Bus Default') : undefined
        };
    }), [routes, createData.bus_id, buses, isRTL]);

    const handlePrint = () => window.print();

    const PRINT_STYLES = `
    @media print {
      body * { visibility: hidden !important; }
      main { margin: 0 !important; position: static !important; }
      #trip-print-area, #trip-print-area * { visibility: visible !important; }
      #trip-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
      @page { size: landscape; margin: 1cm; }
    }
    `;

    useEffect(() => {
        if (!autoCreateDate) {
            setDateValidation(null);
            return;
        };
        axios.get(route('admin.daily-trips.validate-date'), { params: { date: autoCreateDate } })
            .then(res => setDateValidation(res.data))
            .catch(err => console.error('Date validation failed:', err));
    }, [autoCreateDate]);

    useEffect(() => {
        if (flash?.error) {
            toast.error(flash.error);
        }
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    const applyFilters = () => {
        router.get(route('admin.daily-trips.index'), {
            date: dateFilter || undefined,
            status: statusFilter || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setDateFilter('');
        setStatusFilter('');
        router.get(route('admin.daily-trips.index'));
    };

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
                    variant: 'red' as const
                };
            }
            if (trip.cancellation_reason?.includes('لعدم بدء الرحلة')) {
                return {
                    label: 'Cancelled (Not Started)',
                    labelAr: 'ملغاة لعدم بدء الرحلة',
                    variant: 'gray' as const
                };
            }
            const isAutoClosed = trip.cancellation_reason?.includes('أغلقت تلقائياً');
            if (isAutoClosed) {
                if (!trip.departure_time) {
                    return {
                        label: 'Not Executed',
                        labelAr: 'غير منفذة',
                        variant: 'gray' as const
                    };
                } else {
                    return {
                        label: 'Uncompleted',
                        labelAr: 'غير مكتملة',
                        variant: 'orange' as const
                    };
                }
            }
            return {
                label: 'Cancelled',
                labelAr: 'ملغاة',
                variant: 'red' as const
            };
        }
        
        switch (status) {
            case 'pending':
                return {
                    label: 'Pending',
                    labelAr: 'في الانتظار',
                    variant: 'yellow' as const
                };
            case 'awaiting_confirmation':
                return {
                    label: 'Awaiting Confirmation',
                    labelAr: 'بانتظار التأكيد',
                    variant: 'orange' as const
                };
            case 'in_progress':
                return {
                    label: 'In Progress',
                    labelAr: 'جارية',
                    variant: 'blue' as const
                };
            case 'awaiting_video':
                return {
                    label: 'Awaiting Video',
                    labelAr: 'بانتظار فيديو التوثيق',
                    variant: 'orange' as const
                };
            case 'finished':
            case 'completed':
                return {
                    label: 'Completed',
                    labelAr: 'مكتملة',
                    variant: 'green' as const
                };
            default:
                return {
                    label: status,
                    labelAr: status,
                    variant: 'gray' as const
                };
        }
    };

    const pagination: PaginationMeta = {
        links: (trips as any).links || [],
        current_page: trips.current_page,
        last_page: trips.last_page,
        per_page: trips.per_page,
        total: trips.total,
        from: (trips as any).from,
        to: (trips as any).to,
    };

    const filterTabs: FilterTab[] = [
        { key: 'all', label: isRTL ? 'الكل' : 'All', count: trips.total },
        { key: 'pending', label: isRTL ? 'انتظار' : 'Pending', dotColor: 'bg-yellow-400' },
        { key: 'in_progress', label: isRTL ? 'جارية' : 'In Progress', dotColor: 'bg-blue-400' },
        { key: 'completed', label: isRTL ? 'مكتملة' : 'Completed', dotColor: 'bg-green-400' },
    ];

    const columnHelper = createColumnHelper<Trip>();
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'index',
            header: '#',
            cell: (info) => (trips.current_page - 1) * trips.per_page + info.row.index + 1,
        }),
        columnHelper.accessor('trip_date', {
            header: isRTL ? 'التاريخ' : 'Date',
            cell: (info) => {
                const val = info.getValue();
                if (!val) return <span className="text-gray-400">—</span>;
                const d = new Date(val);
                if (isNaN(d.getTime())) return <span className="font-bold">{String(val)}</span>;
                const dateStr = d.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                return <span className="font-bold">{dateStr}</span>;
            }
        }),
        columnHelper.accessor('type', {
            header: isRTL ? 'الاتجاه' : 'Direction',
            cell: (info) => {
                const isForte = info.getValue() === 'forth';
                return (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${isForte
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                        : 'bg-orange-50 text-orange-600 dark:bg-orange-900/20'
                        }`}>
                        {isForte ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                        {isForte ? (isRTL ? 'ذهاب' : 'Forth') : (isRTL ? 'إياب' : 'Back')}
                    </span>
                );
            }
        }),
        columnHelper.accessor('bus.bus_number', {
            header: isRTL ? 'الحافلة' : 'Bus',
            cell: (info) => <span className="font-bold">{info.getValue() || '—'}</span>
        }),
        columnHelper.accessor('status', {
            header: isRTL ? 'الحالة' : 'Status',
            cell: (info) => {
                const trip = info.row.original;
                const smartStatus = getSmartStatus(trip);
                return <StatusBadge label={isRTL ? smartStatus.labelAr : smartStatus.label} variant={smartStatus.variant} />;
            }
        }),
        columnHelper.accessor('video_path', {
            header: isRTL ? 'التوثيق' : 'Verification',
            cell: (info) => info.getValue() ? (
                <button onClick={() => { setSelectedVideo(info.getValue()); setIsVideoModalOpen(true); }} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Video size={16} />
                </button>
            ) : <span className="text-gray-300">—</span>
        }),
        columnHelper.display({
            id: 'actions',
            header: isRTL ? 'الإجراءات' : 'Actions',
            cell: (info) => {
                const trip = info.row.original;
                return (
                    <div className="flex justify-center gap-1">
                        {trip.status === 'awaiting_confirmation' && (
                            <ActionButton label={isRTL ? 'تأكيد' : 'Confirm'} onClick={() => { if (confirm(isRTL ? 'تأكيد بدء هذه الرحلة؟' : 'Confirm starting this trip?')) router.post(route('admin.daily-trips.confirm', trip.id)); }} color="indigo" icon={<CheckCircle2 size={14} />} />
                        )}
                        <ActionButton label={isRTL ? 'عرض' : 'View'} onClick={() => router.get(route('admin.daily-trips.show', trip.id))} color="green" icon={<Eye size={14} />} />
                        <ActionButton label={isRTL ? 'تعديل' : 'Edit'} onClick={() => router.get(route('admin.daily-trips.edit', trip.id))} color="blue" icon={<Edit2 size={14} />} />
                        <ActionButton label={isRTL ? 'حذف' : 'Delete'} onClick={() => { if (confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) router.delete(route('admin.daily-trips.destroy', trip.id)); }} color="red" icon={<Trash2 size={14} />} />
                    </div>
                );
            }
        })
    ], [isRTL, trips]);

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={isRTL ? 'الرحلات اليومية' : 'Daily Trips'} />
            <style>{PRINT_STYLES}</style>

            {/* ── Print Area ── */}
            <div id="trip-print-area" className="hidden print:block bg-white text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
                <PrintReportHeader
                    title={isRTL ? "تقرير الرحلات اليومية" : "Daily Trips Report"}
                    schoolName={isRTL ? "إدارة شركة مسارات واصل" : "Masarat Wasel Company"}
                    printDate={`${isRTL ? "تاريخ التقرير" : "Report Date"}: ${new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US")}`}
                    schoolAdminText={isRTL ? "إدارة العمليات" : "Operations Dept"}
                />
                <div className="px-4 mt-6">
                    <table className="w-full border-collapse border border-gray-300 text-[10px]">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-300 p-2">#</th>
                                <th className="border border-gray-300 p-2">{isRTL ? 'التاريخ' : 'Date'}</th>
                                <th className="border border-gray-300 p-2">{isRTL ? 'الاتجاه' : 'Direction'}</th>
                                <th className="border border-gray-300 p-2">{isRTL ? 'الحافلة' : 'Bus'}</th>
                                <th className="border border-gray-300 p-2">{isRTL ? 'السائق' : 'Driver'}</th>
                                <th className="border border-gray-300 p-2">{isRTL ? 'الحالة' : 'Status'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trips.data.map((trip, i) => (
                                <tr key={trip.id}>
                                    <td className="border border-gray-300 p-2 text-center">{i + 1}</td>
                                    <td className="border border-gray-300 p-2 text-center">{trip.trip_date}</td>
                                    <td className="border border-gray-300 p-2 text-center">{trip.type === 'forth' ? (isRTL ? 'ذهاب' : 'Forth') : (isRTL ? 'إياب' : 'Back')}</td>
                                    <td className="border border-gray-300 p-2 text-center">{trip.bus?.bus_number}</td>
                                    <td className="border border-gray-300 p-2">{trip.driver?.name || '—'}</td>
                                    <td className="border border-gray-300 p-2 text-center">{isRTL ? getSmartStatus(trip).labelAr : getSmartStatus(trip).label}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={`${DS_pageWrapper} space-y-6 px-4 sm:px-6 lg:px-8 pt-6 pb-12`} dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-gray-100 dark:border-[#243460]">
                    <div>
                        <h1 className="text-3xl font-black text-[#0f2044] dark:text-white flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#0f2044] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#0f2044]/20">
                                <Zap size={24} fill="#f5b800" className="text-[#f5b800]" />
                            </div>
                            <div className="flex flex-col">
                                <span>{isRTL ? 'الرحلات اليومية' : 'Daily Trips'}</span>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">
                                    {isRTL ? 'إدارة ومتابعة الرحلات المجدولة' : 'Operational Schedule Management'}
                                </span>
                            </div>
                        </h1>
                    </div>
                </div>

                {/* Premium Statistics Grid */}
                <div className="relative group/stats">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#0f2044]/5 to-[#f5b800]/5 rounded-[32px] blur-xl opacity-50 group-hover/stats:opacity-100 transition-duration-500" />
                    <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className={`${DS_statCard("blue")} hover:shadow-2xl hover:shadow-[#0f2044]/10 transition-all duration-300 group/card border-b-4 border-b-[#0f2044]/20`}>
                            <div className={`${DS_statIcon("blue")} group-hover/card:scale-110 transition-transform`}><Zap size={24} /></div>
                            <div>
                                <p className={DS_statLabel}>{isRTL ? 'إجمالي الرحلات' : 'Total Trips'}</p>
                                <p className={DS_statValue}>{trips?.total || 0}</p>
                            </div>
                        </div>
                        <div className={`${DS_statCard("gold")} hover:shadow-2xl hover:shadow-[#f5b800]/10 transition-all duration-300 group/card border-b-4 border-b-[#f5b800]/20`}>
                            <div className={`${DS_statIcon("gold")} group-hover/card:scale-110 transition-transform`}><Search size={24} /></div>
                            <div>
                                <p className={DS_statLabel}>{isRTL ? 'قيد الانتظار' : 'Pending'}</p>
                                <p className={DS_statValue}>{(trips as any)?.pending_count || 0}</p>
                            </div>
                        </div>
                        <div className={`${DS_statCard("green")} hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group/card border-b-4 border-b-emerald-500/20`}>
                            <div className={`${DS_statIcon("green")} group-hover/card:scale-110 transition-transform`}><CheckCircle2 size={24} /></div>
                            <div>
                                <p className={DS_statLabel}>{isRTL ? 'المكتملة' : 'Completed'}</p>
                                <p className={DS_statValue}>{(trips as any)?.completed_count || 0}</p>
                            </div>
                        </div>
                        <div className={`${DS_statCard("blue")} bg-white dark:bg-[#1a2845] hover:shadow-2xl hover:shadow-[#0f2044]/10 transition-all duration-300 group/card border border-white/10 dark:border-white/5`}>
                            <div className={`${DS_statIcon("blue")} group-hover/card:scale-110 transition-transform`}><Play size={24} /></div>
                            <div>
                                <p className={DS_statLabel}>{isRTL ? 'جارية حالياً' : 'In Progress'}</p>
                                <p className={DS_statValue}>{(trips as any)?.in_progress_count || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Command Center */}
                <div className="bg-white/80 dark:bg-[#1a2845]/80 backdrop-blur-xl p-4 rounded-[28px] border border-white/20 dark:border-white/5 shadow-2xl shadow-[#0f2044]/5 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="relative overflow-hidden inline-flex items-center gap-4 px-10 py-4 bg-[#0f2044] text-white rounded-[22px] text-sm font-black shadow-2xl shadow-[#0f2044]/20 transition-all active:scale-95 group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#f5b800]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative w-8 h-8 bg-[#f5b800] rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg shadow-[#f5b800]/20">
                                <Zap size={16} className="text-[#0f2044]" fill="currentColor" />
                            </div>
                            <span className="relative">{isRTL ? 'إضافة رحلة جديدة' : 'Add New Trip'}</span>
                        </button>
                    </div>

                    <div className="h-12 w-px bg-gray-100 dark:bg-white/5 hidden md:block" />

                    <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="flex items-center gap-3 bg-white dark:bg-[#0f2044]/40 border border-gray-200 dark:border-white/10 rounded-[22px] p-2 pr-6 group transition-all focus-within:ring-2 focus-within:ring-[#f5b800]/30 shadow-sm hover:border-[#f5b800]/50">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-[#f5b800] transition-colors">
                                    <Calendar size={18} />
                                </div>
                                <input
                                    type="date"
                                    className="bg-transparent border-none focus:ring-0 text-xs dark:text-white p-0 font-black w-32 tracking-wider"
                                    value={autoCreateDate}
                                    onChange={(e) => setAutoCreateDate(e.target.value)}
                                />
                                <button
                                    onClick={() => {
                                        if (confirm(isRTL ? 'هل أنت متأكد من إنشاء رحلات لهذا اليوم؟' : 'Are you sure you want to create trips for this date?')) {
                                            router.post(route('admin.daily-trips.auto-create'), { date: autoCreateDate });
                                        }
                                    }}
                                    className="px-8 py-2.5 bg-[#f5b800] hover:bg-[#e5ac00] text-[#0f2044] rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#f5b800]/10 active:scale-95"
                                >
                                    {isRTL ? 'توليد تلقائي' : 'Auto-Generate'}
                                </button>
                            </div>

                            {dateValidation && (
                                <div className={`flex flex-col gap-2 p-3.5 rounded-[22px] border transition-all animate-in zoom-in-95 duration-500 shadow-sm min-w-[280px] max-w-[450px] ${
                                    dateValidation.is_working
                                    ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/10'
                                    : 'bg-amber-50/80 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/10'
                                }`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="relative">
                                            <div className={`w-2 h-2 rounded-full ${dateValidation.is_working ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            <div className={`absolute -inset-1 rounded-full ${dateValidation.is_working ? 'bg-emerald-500/30' : 'bg-amber-500/30'} animate-ping`} />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${dateValidation.is_working ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {dateValidation.is_working ? (isRTL ? 'حالة التوليد' : 'Generation Status') : (isRTL ? 'ملاحظات التوليد' : 'Generation Notes')}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 pl-4">
                                        {(isRTL ? dateValidation.message_ar : dateValidation.message).split('.').filter(t => t.trim()).map((line, idx) => {
                                            const parts = line.split(':');
                                            return (
                                                <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                                                    <AlertCircle size={12} className={`mt-0.5 flex-shrink-0 ${dateValidation.is_working ? 'text-emerald-500' : 'text-amber-500'}`} />
                                                    <div className={dateValidation.is_working ? 'text-emerald-900/80 dark:text-emerald-400' : 'text-amber-900/80 dark:text-amber-400'}>
                                                        {parts.length > 1 ? (
                                                            <>
                                                                <span className="font-black underline decoration-[#0f2044]/10">{parts[0]}:</span>
                                                                <span className="opacity-90"> {parts[1]}</span>
                                                            </>
                                                        ) : (
                                                            <span className="font-bold">{line}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                             {/* Placeholder for any future right-side quick actions */}
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <BaseDataTable<Trip>
                        columns={columns}
                        data={trips.data}
                        pagination={pagination}
                        exportEnabled={true}
                        headerAction={
                            <div className="flex items-center gap-2">
                                <button onClick={handlePrint} className={DS_btnSecondary}>
                                    <Printer size={16} />
                                    {isRTL ? 'طباعة اليومية' : 'Print Log'}
                                </button>
                            </div>
                        }
                        filterTabs={filterTabs}
                        activeFilter={statusFilter || 'all'}
                        onFilterChange={(key) => setStatusFilter(key === 'all' ? '' : key)}
                        searchPlaceholder={isRTL ? 'بحث عن حافلة...' : 'Search bus...'}
                        emptyMessage={isRTL ? 'لا توجد رحلات لهذا اليوم' : 'No trips found for this date'}
                    />
                </div>
            </div>

            {/* Video Verification Modal */}
            <Modal show={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} maxWidth="2xl">
                <div className={`bg-white dark:bg-[#1a2845] w-full ${DS_modalContainer}`}>
                    <div className={DS_modalHeader(isRTL)}>
                        <div className="flex items-center gap-3">
                            <div className={DS_modalHeaderAccent} />
                            <div className="flex items-center gap-2">
                                <Video className="w-5 h-5 text-[#f5b800]" />
                                <h2 className={DS_modalHeaderTitle}>
                                    {isRTL ? 'فيديو توثيق الرحلة' : 'Trip Verification Video'}
                                </h2>
                            </div>
                        </div>
                        <button onClick={() => setIsVideoModalOpen(false)} className={DS_modalClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className={DS_modalBody}>
                        <div className="aspect-video bg-black rounded-2xl overflow-hidden relative group shadow-2xl">
                            <AnimatePresence mode="wait">
                                {selectedVideo ? (
                                    <video
                                        key={selectedVideo}
                                        src={`/storage/${selectedVideo}`}
                                        controls
                                        autoPlay
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-white flex flex-col items-center justify-center h-full gap-3">
                                        <Video size={48} className="opacity-40 animate-pulse" />
                                        <span className="opacity-60 italic text-sm">{isRTL ? 'جاري تحميل الفيديو...' : 'Loading video...'}</span>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="mt-6 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-[#0f2044] dark:text-white mb-1">{isRTL ? 'تم التحقق أمنياً' : 'Security Verified'}</h4>
                                    <p className="text-xs font-bold text-[#0f2044]/60 dark:text-[#7ba7e8]/60 leading-relaxed">
                                        {isRTL
                                            ? 'هذا الفيديو تم تسجيله بواسطة السائق لتوثيق خلو الحافلة تماماً من الركاب بعد انتهاء الرحلة.'
                                            : 'This video was recorded by the driver to document that the bus is completely empty after the trip finished.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={`mt-6 flex ${isRTL ? 'flex-row-reverse' : 'justify-end'}`}>
                            <button onClick={() => setIsVideoModalOpen(false)} className="px-8 py-2.5 bg-[#0f2044] text-white rounded-xl font-bold hover:bg-[#1a2845] transition-all">
                                {isRTL ? 'إغلاق' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
            {/* Manual Create Modal */}
            <Modal show={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="2xl">
                <div className={`bg-white dark:bg-[#1a2845] w-full ${DS_modalContainer}`}>
                    <div className={DS_modalHeader(isRTL)}>
                        <div className="flex items-center gap-3">
                            <div className={DS_modalHeaderAccent} />
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-[#f5b800]" fill="currentColor" />
                                <h2 className={DS_modalHeaderTitle}>
                                    {isRTL ? 'إضافة رحلة جديدة' : 'Add New Trip'}
                                </h2>
                            </div>
                        </div>
                        <button onClick={() => setIsCreateModalOpen(false)} className={DS_modalClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleCreateSubmit}>
                        <div className={DS_modalBody}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Bus Selection */}
                                <div>
                                    <SearchableSelect
                                        label={isRTL ? 'الحافلة' : 'Bus'}
                                        options={busOptions}
                                        value={createData.bus_id}
                                        onChange={val => setCreateData('bus_id', val.toString())}
                                        placeholder={isRTL ? 'اختر الحافلة' : 'Select Bus'}
                                    />
                                    {createErrors.bus_id && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{createErrors.bus_id}</p>}
                                </div>

                                {/* Route Selection */}
                                <div>
                                    <SearchableSelect
                                        label={isRTL ? 'المسار' : 'Route'}
                                        options={routeOptions}
                                        value={createData.route_id}
                                        onChange={val => setCreateData('route_id', val.toString())}
                                        placeholder={isRTL ? 'اختر المسار' : 'Select Route'}
                                    />
                                    {createErrors.route_id && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{createErrors.route_id}</p>}
                                </div>

                                {/* Date */}
                                <div>
                                    <label className={DS_labelCls}>
                                        <Calendar className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
                                        {isRTL ? 'التاريخ' : 'Date'}
                                    </label>
                                    <input
                                        type="date"
                                        value={createData.date}
                                        onChange={e => setCreateData('date', e.target.value)}
                                        className={DS_inputCls}
                                        required
                                    />
                                    {createErrors.date && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{createErrors.date}</p>}
                                </div>

                                {/* Trip Type */}
                                <div>
                                    <label className={DS_labelCls}>
                                        <Zap className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
                                        {isRTL ? 'نوع الرحلة' : 'Trip Type'}
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setCreateData('type', 'forth')}
                                            className={`px-3 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${createData.type === 'forth'
                                                ? 'bg-[#0f2044] border-[#0f2044] text-white shadow-lg'
                                                : 'bg-gray-50 dark:bg-[#243460] border-transparent text-gray-500 dark:text-[#7ba7e8]/60 hover:bg-gray-100'
                                                }`}
                                        >
                                            ↗ {isRTL ? 'ذهاب' : 'Forth'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCreateData('type', 'back')}
                                            className={`px-3 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${createData.type === 'back'
                                                ? 'bg-[#f5b800] border-[#f5b800] text-[#0f2044] shadow-lg'
                                                : 'bg-gray-50 dark:bg-[#243460] border-transparent text-gray-500 dark:text-[#7ba7e8]/60 hover:bg-gray-100'
                                                }`}
                                        >
                                            ↙ {isRTL ? 'إياب' : 'Back'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCreateData('type', 'both')}
                                            className={`px-3 py-2.5 rounded-xl text-[10px] font-black transition-all border-2 ${createData.type === 'both'
                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg'
                                                : 'bg-gray-50 dark:bg-[#243460] border-transparent text-gray-500 dark:text-[#7ba7e8]/60 hover:bg-gray-100'
                                                }`}
                                        >
                                            🔁 {isRTL ? 'ذهاب وإياب' : 'Both'}
                                        </button>
                                    </div>
                                    {createErrors.type && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{createErrors.type}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-[#243460] flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-6 py-2.5 text-xs font-black text-gray-400 dark:text-[#7ba7e8]/40 hover:text-gray-600 transition-colors uppercase tracking-widest"
                            >
                                {isRTL ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                                type="submit"
                                disabled={processingCreate}
                                className="px-10 py-2.5 bg-[#f5b800] hover:bg-[#e5ac00] text-[#0f2044] rounded-xl text-xs font-black shadow-lg shadow-[#f5b800]/20 transition-all disabled:opacity-50 active:scale-95"
                            >
                                {processingCreate ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'إضافة الرحلة' : 'Add Trip')}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
