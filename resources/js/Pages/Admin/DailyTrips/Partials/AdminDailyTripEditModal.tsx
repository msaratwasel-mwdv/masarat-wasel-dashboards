import React, { useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';
import { useTheme } from '@/Contexts/ThemeContext';
import { toast } from 'react-toastify';
import Modal from '@/Components/Modal';
import SearchableSelect from '@/Components/SearchableSelect';
import { 
    X, 
    Edit2,
    Calendar,
    Route,
    User,
    Bus as BusIcon,
    AlertCircle,
    Check
} from 'lucide-react';
import { 
    DS_modalContainer, 
    DS_modalHeader, 
    DS_modalHeaderTitle, 
    DS_modalHeaderAccent, 
    DS_modalClose, 
    DS_modalBody,
    DS_modalFooter,
    DS_btnPrimary,
    DS_btnSecondary,
    DS_labelCls,
    DS_inputCls,
    DS_selectCls
} from '@/lib/DS';

interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
    driver_id: number | null;
    supervisor_id: number | null;
    route_id: number | null;
}

interface TripRoute {
    id: number;
    name: string;
}

interface Trip {
    id: number;
    route_id: number | null;
    driver_id: number | null;
    assistant_id: number | null;
    status: string;
    departure_time: string | null;
    arrival_time: string | null;
}

interface Props {
    show: boolean;
    onClose: () => void;
    trip: Trip | null;
    buses: Bus[];
    routes: TripRoute[];
}

export default function AdminDailyTripEditModal({ show, onClose, trip, buses, routes }: Props) {
    const { t } = useTranslation();
    const { isRTL } = useTheme();

    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        route_id: '',
        driver_id: '',
        assistant_id: '',
        status: '',
        departure_time: '',
        arrival_time: '',
    });

    useEffect(() => {
        if (trip && show) {
            setData({
                route_id: trip.route_id?.toString() || '',
                driver_id: trip.driver_id?.toString() || '',
                assistant_id: trip.assistant_id?.toString() || '',
                status: trip.status || '',
                departure_time: trip.departure_time ? new Date(trip.departure_time).toISOString().slice(0, 16) : '',
                arrival_time: trip.arrival_time ? new Date(trip.arrival_time).toISOString().slice(0, 16) : '',
            });
            clearErrors();
        }
    }, [trip, show]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!trip) return;

        put(route('admin.daily-trips.update', trip.id), {
            onSuccess: () => {
                toast.success(isRTL ? 'تم تحديث الرحلة بنجاح' : 'Trip updated successfully');
                onClose();
            },
            onError: () => {
                toast.error(isRTL ? 'يرجى مراجعة الأخطاء' : 'Please check the errors');
            }
        });
    };

    const routeOptions = useMemo(() => routes.map(r => ({
        id: r.id,
        label: r.name
    })), [routes]);

    if (!show || !trip) return null;

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className={`w-full ${DS_modalContainer} !overflow-visible`} dir={isRTL ? 'rtl' : 'ltr'}>
                <div className={DS_modalHeader(isRTL)}>
                    <div className="flex items-center gap-3">
                        <div className={DS_modalHeaderAccent} />
                        <div className="flex items-center gap-2">
                            <Edit2 className="w-5 h-5 text-[#f5b800]" />
                            <h2 className={DS_modalHeaderTitle}>
                                {isRTL ? 'تعديل تفاصيل الرحلة' : 'Edit Trip Details'}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className={DS_modalClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="!overflow-visible">
                    <div className={`${DS_modalBody} !overflow-visible p-6 space-y-6`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 !overflow-visible">
                            <div className="relative !overflow-visible md:col-span-2">
                                <SearchableSelect
                                    label={isRTL ? 'المسار' : 'Route'}
                                    options={routeOptions}
                                    value={data.route_id}
                                    onChange={val => setData('route_id', val.toString())}
                                    placeholder={isRTL ? 'اختر المسار' : 'Select Route'}
                                    icon={<Route size={16} />}
                                />
                                {errors.route_id && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.route_id}</p>}
                            </div>

                            <div>
                                <label className={DS_labelCls}>
                                    {isRTL ? 'الحالة' : 'Status'}
                                </label>
                                <select
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                    className={DS_selectCls}
                                >
                                    <option value="pending">{isRTL ? 'في الانتظار' : 'Pending'}</option>
                                    <option value="awaiting_confirmation">{isRTL ? 'بانتظار التأكيد' : 'Awaiting Confirmation'}</option>
                                    <option value="in_progress">{isRTL ? 'جارية' : 'In Progress'}</option>
                                    <option value="awaiting_video">{isRTL ? 'بانتظار فيديو التوثيق' : 'Awaiting Video'}</option>
                                    <option value="finished">{isRTL ? 'مكتملة' : 'Finished'}</option>
                                    <option value="cancelled">{isRTL ? 'ملغاة' : 'Cancelled'}</option>
                                </select>
                                {errors.status && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.status}</p>}
                            </div>

                            <div>
                                <label className={DS_labelCls}>
                                    <Calendar className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
                                    {isRTL ? 'وقت الانطلاق' : 'Departure Time'}
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.departure_time}
                                    onChange={e => setData('departure_time', e.target.value)}
                                    className={DS_inputCls}
                                    required
                                />
                                {errors.departure_time && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.departure_time}</p>}
                            </div>

                            <div>
                                <label className={DS_labelCls}>
                                    <Calendar className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
                                    {isRTL ? 'وقت الوصول (اختياري)' : 'Arrival Time (Optional)'}
                                </label>
                                <input
                                    type="datetime-local"
                                    value={data.arrival_time}
                                    onChange={e => setData('arrival_time', e.target.value)}
                                    className={DS_inputCls}
                                />
                                {errors.arrival_time && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.arrival_time}</p>}
                            </div>
                        </div>
                        
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-4 rounded-xl flex items-start gap-3">
                            <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="text-xs font-bold text-amber-800 dark:text-amber-400">
                                {isRTL 
                                    ? 'ملاحظة: السائق والمشرفة مرتبطان تلقائياً بالحافلة. لا يمكن تغييرهما من هنا لتجنب تضارب البيانات. إذا أردت تغييرهما، يرجى تعديل تعيينات الحافلة أولاً.'
                                    : 'Note: Driver and Assistant are tied to the bus automatically. They cannot be changed here to avoid data conflicts. Please edit the bus assignments first.'}
                            </div>
                        </div>
                    </div>

                    <div className={DS_modalFooter(isRTL)}>
                        <button type="button" onClick={onClose} className={DS_btnSecondary}>
                            {isRTL ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button type="submit" disabled={processing} className={DS_btnPrimary}>
                            {processing ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Check size={16} />
                                    {isRTL ? 'حفظ التعديلات' : 'Save Changes'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
