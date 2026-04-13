import { FormEventHandler, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';

interface Bus {
    id?: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
    type: 'permanent' | 'temporary';
    status: 'active' | 'maintenance' | 'inactive';
    model?: string;
    year?: number;
    color?: string;
    driver_id?: number;
    assistant_id?: number;
    field_supervisor_id?: number;
    route_id?: number | null;
}

interface BusModalProps {
    show: boolean;
    onClose: () => void;
    bus?: Bus | null;
    drivers?: Array<{ id: number; name: string }>;
    assistants?: Array<{ id: number; name: string }>;
    field_supervisors?: Array<{ id: number; name: string }>;
    routes?: Array<{ id: number; name: string }>;
}

export default function BusModal({ show, onClose, bus, drivers = [], assistants = [], field_supervisors = [], routes = [] }: BusModalProps) {
    const { t } = useTranslation();
    const isEditing = !!bus;

    const { data, setData, post, put, processing, errors, reset } = useForm<Bus>({
        bus_number: bus?.bus_number || '',
        plate_number: bus?.plate_number || '',
        capacity: bus?.capacity || 30,
        type: bus?.type || 'permanent',
        status: bus?.status || 'active',
        model: bus?.model || '',
        year: bus?.year || new Date().getFullYear(),
        color: bus?.color || '',
        driver_id: bus?.driver_id || undefined,
        assistant_id: bus?.assistant_id || undefined,
        field_supervisor_id: bus?.field_supervisor_id || undefined,
        route_id: bus?.route_id || null,
    });

    useEffect(() => {
        if (bus) {
            setData({
                bus_number: bus.bus_number,
                plate_number: bus.plate_number,
                capacity: bus.capacity,
                type: bus.type,
                status: bus.status,
                model: bus.model || '',
                year: bus.year || new Date().getFullYear(),
                color: bus.color || '',
                driver_id: bus.driver_id,
                assistant_id: bus.assistant_id,
                field_supervisor_id: bus.field_supervisor_id,
                route_id: bus.route_id,
            });
        }
    }, [bus]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (isEditing && bus?.id) {
            put(route('school.buses.update', bus.id), {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post(route('school.buses.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-[30px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-[#0e7490] p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-[15px] flex items-center justify-center">
                                <span className="text-3xl">🛣️</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">
                                    {t('Assign Route')}
                                </h3>
                                <p className="text-blue-100 text-sm">{bus?.bus_number} - {bus?.plate_number}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 ml-1">
                            {t('Select Route for this Bus')}
                        </label>
                        <div className="grid grid-cols-1 gap-4">
                            {routes.map(route => (
                                <button
                                    key={route.id}
                                    type="button"
                                    onClick={() => setData('route_id', route.id)}
                                    className={`flex items-center justify-between p-5 rounded-[25px] border-2 transition-all ${
                                        data.route_id === route.id
                                            ? 'border-[#0e7490] bg-cyan-50 dark:bg-cyan-900/20 ring-4 ring-cyan-100 dark:ring-cyan-900/10'
                                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'
                                    }`}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className={`font-black tracking-tight ${data.route_id === route.id ? 'text-[#0e7490]' : 'text-gray-700 dark:text-white'}`}>
                                            {route.name}
                                        </span>
                                        <span className="text-xs text-gray-400 font-bold uppercase">{route.code || '---'}</span>
                                    </div>
                                    {data.route_id === route.id && (
                                        <div className="w-8 h-8 bg-[#0e7490] rounded-full flex items-center justify-center text-white shadow-lg">
                                            ✓
                                        </div>
                                    )}
                                </button>
                            ))}
                            
                            <button
                                type="button"
                                onClick={() => setData('route_id', null)}
                                className={`p-4 rounded-[25px] border-2 border-dashed transition-all text-sm font-bold ${
                                    data.route_id === null
                                        ? 'border-gray-400 bg-gray-50 text-gray-600'
                                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                }`}
                            >
                                {t('Unassign Route')}
                            </button>
                        </div>
                        {errors.route_id && <p className="mt-4 text-sm text-red-600 text-center font-bold">{errors.route_id}</p>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-3.5 text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all rounded-[25px]"
                        >
                            {t('Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-8 py-3.5 bg-[#0e7490] text-white font-bold rounded-[35px] shadow-xl shadow-cyan-900/20 hover:bg-[#155e75] transition-all disabled:opacity-50"
                        >
                            {processing ? t('Saving...') : t('Save Assignment')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
