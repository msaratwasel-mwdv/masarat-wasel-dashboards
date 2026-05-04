import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTheme } from '@/Contexts/ThemeContext';
import useTranslation from '@/hooks/useTranslation';
import AdminFieldTripDetailsModal from './Partials/AdminFieldTripDetailsModal';
import PrintReportHeader from "@/Components/PrintReportHeader";
import BaseDataTable from '@/Components/BaseDataTable';
import OmaniRial from '@/Components/OmaniRial';
import Modal from '@/Components/Modal';
import { 
    Zap, 
    Search, 
    CheckCircle2, 
    Play, 
    Printer, 
    X, 
    MapPin, 
    Calendar, 
    Users, 
    Bus as BusIcon,
    Coins,
    ShieldCheck,
    Eye,
    Check,
    Ban
} from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import { 
    DS_pageWrapper, 
    DS_statCard, 
    DS_statIcon, 
    DS_statLabel, 
    DS_statValue, 
    DS_btnPrimary, 
    DS_btnSecondary,
    DS_modalContainer,
    DS_modalHeader,
    DS_modalHeaderTitle,
    DS_modalHeaderAccent,
    DS_modalClose,
    DS_modalBody,
    DS_modalFooter,
    DS_input,
    DS_select,
    DS_label
} from '@/lib/DS';

interface School {
    id: number;
    name: string;
}

interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
    driver?: {
        id: number;
        first_name_ar: string;
        last_name_ar: string;
    };
}

interface FieldTrip {
    id: number;
    name: string;
    description: string;
    date: string;
    departure_time: string;
    arrival_time: string | null;
    destination_address: string;
    status: string;
    cost: string | null;
    school: School;
    bus?: Bus;
    students_count: number;
    internal_teachers_count: number;
}

interface Props {
    auth: any;
    fieldTrips: FieldTrip[];
    buses: Bus[];
}

export default function Index({ auth, fieldTrips = [], buses = [] }: Props) {
    const { isRTL } = useTheme();
    const { t } = useTranslation();
    
    const PRINT_STYLES = `
    @media print {
      body * { visibility: hidden !important; }
      main { margin: 0 !important; position: static !important; }
      #field-trip-print-area, #field-trip-print-area * { visibility: visible !important; }
      #field-trip-print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
      @page { size: landscape; margin: 1cm; }
    }
    `;
    
    // Detailed View Logic
    const [viewTripId, setViewTripId] = useState<number | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Approval Logic
    const [selectedTrip, setSelectedTrip] = useState<FieldTrip | null>(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [cost, setCost] = useState('');
    const [selectedBus, setSelectedBus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Rejection Logic
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const openDetails = (id: number) => {
        setViewTripId(id);
        setIsDetailsModalOpen(true);
    };

    const openApproveModal = (trip: FieldTrip) => {
        setSelectedTrip(trip);
        setCost(trip.cost || '');
        setSelectedBus(trip.bus?.id?.toString() || '');
        setIsApproveModalOpen(true);
    };

    const handleApprove = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrip || !cost || !selectedBus) return;

        setIsSubmitting(true);
        router.post(route('admin.field-trips.approve', selectedTrip.id), {
            cost: cost,
            bus_id: selectedBus,
        }, {
            onSuccess: () => {
                setIsApproveModalOpen(false);
                setSelectedTrip(null);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const openRejectModal = (trip: FieldTrip) => {
        setSelectedTrip(trip);
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTrip) return;
        setIsSubmitting(true);
        router.post(route('admin.field-trips.reject', selectedTrip.id), {
            rejection_reason: rejectionReason,
        }, {
            onSuccess: () => {
                setIsRejectModalOpen(false);
                setSelectedTrip(null);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Table Setup
    const columnHelper = createColumnHelper<FieldTrip>();
    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            header: t('Trip Identity'),
            cell: info => (
                <div className="flex items-center gap-4 py-1">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-[#0f2044]/40 flex items-center justify-center text-xl shadow-inner border border-gray-100 dark:border-white/5 transition-transform group-hover:rotate-6">
                        🚚
                    </div>
                    <div>
                        <div className="font-black text-[#0f2044] dark:text-white text-sm leading-tight group-hover:text-[#f5b800] transition-colors">
                            {info.getValue()}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{info.row.original.school?.name}</span>
                        </div>
                    </div>
                </div>
            )
        }),
        columnHelper.accessor('destination_address', {
            header: t('Destination'),
            cell: info => (
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                    <MapPin size={14} className="text-[#f5b800]" />
                    <span className="max-w-[150px] truncate">{info.getValue()}</span>
                </div>
            )
        }),
        columnHelper.accessor('date', {
            header: t('Schedule'),
            cell: info => (
                <div className="flex flex-col gap-1">
                    <div className="text-xs font-black text-[#0f2044] dark:text-gray-100 flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-400" />
                        {(info.getValue() as any)?.split('T')[0] || info.getValue() || '---'}
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-5">
                        {info.row.original.departure_time}
                    </div>
                </div>
            )
        }),
        columnHelper.accessor('students_count', {
            header: t('Pax'),
            cell: info => (
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-[#0f2044] dark:text-white leading-none">{info.getValue()}</span>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('Students')}</span>
                    </div>
                    <div className="w-px h-6 bg-gray-100 dark:bg-gray-800" />
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-[#f5b800] leading-none">{info.row.original.internal_teachers_count}</span>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{t('Staff')}</span>
                    </div>
                </div>
            )
        }),
        columnHelper.accessor('bus', {
            header: t('Logistics'),
            cell: info => {
                const bus = info.getValue();
                const costVal = info.row.original.cost;
                return bus ? (
                    <div className="flex flex-col gap-1.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0f2044] text-white rounded-lg text-[9px] font-black shadow-lg shadow-[#0f2044]/10">
                            <BusIcon size={10} className="text-[#f5b800]" />
                            {bus.bus_number}
                        </div>
                        {costVal && (
                            <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Coins size={12} />
                                {costVal} <OmaniRial className="inline-block align-middle me-1" size="1.2em" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] animate-pulse flex items-center gap-2">
                        <Zap size={10} />
                        {t('Pending')}
                    </div>
                );
            }
        }),
        columnHelper.accessor('status', {
            header: t('Status'),
            cell: info => {
                const status = info.getValue();
                const config: any = {
                    pending: { label: 'Pending', labelAr: 'قيد الانتظار', class: 'bg-amber-50 text-amber-600 border-amber-200' },
                    approved: { label: 'Approved', labelAr: 'تمت الموافقة', class: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
                    rejected: { label: 'Rejected', labelAr: 'مرفوض', class: 'bg-rose-50 text-rose-600 border-rose-200' },
                    cancelled: { label: 'Cancelled', labelAr: 'ملغي', class: 'bg-gray-50 text-gray-500 border-gray-200' }
                };
                const s = config[status] || { label: status, labelAr: status, class: 'bg-blue-50 text-blue-600' };
                return (
                    <span className={`px-4 py-1.5 text-[9px] font-black rounded-xl border uppercase tracking-widest ${s.class}`}>
                        {t(status)}
                    </span>
                );
            }
        }),
        columnHelper.display({
            id: 'actions',
            header: t('Ops'),
            cell: info => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => openDetails(info.row.original.id)}
                        className="p-2.5 bg-gray-50 dark:bg-[#0f2044]/40 text-gray-500 hover:bg-[#0f2044] hover:text-white rounded-xl transition-all shadow-sm"
                        title={t('Inspect')}
                    >
                        <Eye size={16} />
                    </button>
                    {info.row.original.status === 'pending' && (
                        <>
                            <button
                                onClick={() => openApproveModal(info.row.original)}
                                className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm"
                                title={t('Approve')}
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={() => openRejectModal(info.row.original)}
                                className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"
                                title={t('Reject')}
                            >
                                <Ban size={16} />
                            </button>
                        </>
                    )}
                </div>
            )
        })
    ], [isRTL, t]);

    const handlePrint = () => window.print();

    const stats = [
        { label: t('Total Requests'), val: fieldTrips.length, icon: <Zap size={24} />, color: 'blue' },
        { label: t('Pending Review'), val: fieldTrips.filter(t => t.status === 'pending').length, icon: <Search size={24} />, color: 'gold' },
        { label: t('Approved Fleet'), val: fieldTrips.filter(t => t.status === 'approved').length, icon: <CheckCircle2 size={24} />, color: 'green' },
        { label: t('Active/Past'), val: fieldTrips.filter(t => !['pending', 'approved'].includes(t.status)).length, icon: <Play size={24} />, color: 'blue' },
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={t('Field Trips Management')} />

            <div className={`${DS_pageWrapper} space-y-8 px-4 sm:px-6 lg:px-8 pt-8 pb-12`} dir={isRTL ? 'rtl' : 'ltr'}>
                
                {/* Premium Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-gray-100 dark:border-[#243460]">
                    <div>
                        <h1 className="text-3xl font-black text-[#0f2044] dark:text-white flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#0f2044] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#0f2044]/20">
                                <Zap size={24} fill="#f5b800" className="text-[#f5b800]" />
                            </div>
                            <div className="flex flex-col">
                                <span>{t('Field Trips Logistics')}</span>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">
                                    {t('Fleet Deployment & Quote Management')}
                                </span>
                            </div>
                        </h1>
                    </div>
                </div>

                {/* Premium Statistics Grid */}
                <div className="relative group/stats">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#0f2044]/5 to-[#f5b800]/5 rounded-[32px] blur-xl opacity-50 group-hover/stats:opacity-100 transition-duration-500" />
                    <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((s, i) => (
                            <div key={i} className={`${DS_statCard(s.color as any)} hover:shadow-2xl hover:shadow-[#0f2044]/10 transition-all duration-300 group/card border-b-4 border-b-[#0f2044]/20`}>
                                <div className={`${DS_statIcon(s.color as any)} group-hover/card:scale-110 transition-transform`}>{s.icon}</div>
                                <div>
                                    <p className={DS_statLabel}>{s.label}</p>
                                    <p className={DS_statValue}>{s.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table Section */}
                <div className="w-full">
                    <BaseDataTable<FieldTrip>
                        columns={columns}
                        data={fieldTrips}
                        exportEnabled={true}
                        headerAction={
                            <div className="flex items-center gap-2">
                                <button onClick={handlePrint} className={DS_btnSecondary}>
                                    <Printer size={16} />
                                    {t('Print Report')}
                                </button>
                            </div>
                        }
                        searchPlaceholder={isRTL ? 'بحث عن رحلة...' : 'Search trip...'}
                        emptyMessage={t('No field trips in the pipeline')}
                    />
                </div>
            </div>

            {/* Detailed Inspection Modal */}
            <AdminFieldTripDetailsModal
                show={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                tripId={viewTripId}
            />

            {/* Standardized Approval Modal */}
            <Modal show={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} maxWidth="lg">
                <div className={`bg-white dark:bg-[#1a2845] w-full ${DS_modalContainer}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className={DS_modalHeader(isRTL)}>
                        <div className="flex items-center gap-3">
                            <div className={DS_modalHeaderAccent} />
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-[#f5b800]" />
                                <h2 className={DS_modalHeaderTitle}>
                                    {t('Finalize Logistics')}
                                </h2>
                            </div>
                        </div>
                        <button onClick={() => setIsApproveModalOpen(false)} className={DS_modalClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleApprove}>
                        <div className={DS_modalBody}>
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-[#0f2044]/40 rounded-2xl border border-gray-100 dark:border-white/5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('Trip Identity')}</p>
                                <p className="text-sm font-black text-[#0f2044] dark:text-white">{selectedTrip?.name}</p>
                                <p className="text-[11px] font-bold text-[#f5b800] mt-1">{selectedTrip?.school?.name}</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className={DS_label}>{t('Service Quote')} (<OmaniRial size="1em" />)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Coins size={18} />
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            value={cost}
                                            onChange={(e) => setCost(e.target.value)}
                                            className={`${DS_input} pl-12`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={DS_label}>{t('Asset Deployment')}</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                            <BusIcon size={18} />
                                        </div>
                                        <select
                                            required
                                            value={selectedBus}
                                            onChange={(e) => setSelectedBus(e.target.value)}
                                            className={`${DS_select} pl-12`}
                                        >
                                            <option value="" disabled>{t('--- Select Heavy Asset ---')}</option>
                                            {buses.map(bus => (
                                                <option key={bus.id} value={bus.id}>
                                                    {bus.bus_number} | {bus.plate_number} ({bus.capacity} {t('seats')})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                        <Users size={12} className="text-amber-500" />
                                        {t('Required Seats:')} {selectedTrip?.students_count}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={DS_modalFooter(isRTL)}>
                            <button
                                type="button"
                                onClick={() => setIsApproveModalOpen(false)}
                                className={DS_btnSecondary}
                            >
                                {t('Abort')}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={DS_btnPrimary}
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <ShieldCheck size={16} />
                                        {t('Confirm Deployment')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Standardized Rejection Modal */}
            <Modal show={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} maxWidth="md">
                <div className={`bg-white dark:bg-[#1a2845] w-full ${DS_modalContainer}`} dir={isRTL ? 'rtl' : 'ltr'}>
                    <div className={DS_modalHeader(isRTL)}>
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-rose-500 rounded-full" />
                            <div className="flex items-center gap-2">
                                <Ban className="w-5 h-5 text-rose-500" />
                                <h2 className={DS_modalHeaderTitle}>
                                    {t('Decline Requisition')}
                                </h2>
                            </div>
                        </div>
                        <button onClick={() => setIsRejectModalOpen(false)} className={DS_modalClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleRejectSubmit}>
                        <div className={DS_modalBody}>
                            <div className="mb-6">
                                <label className={DS_label}>{t('Official Reason')}</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    className={DS_input}
                                    placeholder={t('Detail why this request cannot be fulfilled...')}
                                />
                            </div>
                        </div>

                        <div className={DS_modalFooter(isRTL)}>
                            <button
                                type="button"
                                onClick={() => setIsRejectModalOpen(false)}
                                className={DS_btnSecondary}
                            >
                                {t('Back')}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-2 px-8 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? t('Processing...') : t('Final Rejection')}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* ── Print Area (Standardized) ── */}
            <style>{PRINT_STYLES}</style>
            <div id="field-trip-print-area" className="hidden print:block bg-white text-black w-full" dir={isRTL ? "rtl" : "ltr"}>
                <PrintReportHeader
                    title={t('Field Trips Report')}
                    schoolName={t('Masarat Wasel Admin')}
                    schoolLogo={null}
                    printDate={`${t('Print Date')}: ${new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" })}`}
                    schoolAdminText={t('Operations Dept')}
                />
                
                <div className="px-4">
                    <table className="w-full border-collapse border border-gray-300 text-[10px]">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-1.5 text-center font-bold text-black w-8">#</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{t('Trip Name')}</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{t('School')}</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{t('Destination')}</th>
                                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{t('Date')}</th>
                                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{t('Bus')}</th>
                                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{t('Cost')}</th>
                                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{t('Status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fieldTrips.map((trip, i) => (
                                <tr key={trip.id} className="border-b border-gray-300">
                                    <td className="border border-gray-300 p-1.5 text-center font-bold">{i + 1}</td>
                                    <td className="border border-gray-300 p-1.5 font-bold">{trip.name}</td>
                                    <td className="border border-gray-300 p-1.5">{trip.school?.name}</td>
                                    <td className="border border-gray-300 p-1.5">{trip.destination_address}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{trip.date}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">{trip.bus?.bus_number || '---'}</td>
                                    <td className="border border-gray-300 p-1.5 text-center font-bold">{trip.cost || '---'} ر.ع</td>
                                    <td className="border border-gray-300 p-1.5 text-center">
                                        <span className="px-2 py-0.5 border border-gray-400 rounded text-[8px] font-black uppercase">
                                            {trip.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="mt-12 flex justify-between items-end text-xs font-black text-gray-800">
                        <div className="space-y-1">
                            <p>{t('Total Trips')}: {fieldTrips.length}</p>
                            <p>{t('Approved')}: {fieldTrips.filter(t => t.status === 'approved').length}</p>
                        </div>
                        <div className="text-center pb-2">
                            <div className="w-48 h-px bg-gray-300 mb-2" />
                            <p>{t('Operations Manager Signature')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
