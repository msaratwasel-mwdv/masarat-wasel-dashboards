import { FormEventHandler, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';
import Modal from '@/Components/Modal';
import { Map, Check } from 'lucide-react';
import { DS_modalHeader, DS_submitBtn, DS_cancelBtn } from '@/lib/DS';

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
    const { t, isRtl } = useTranslation();
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

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className={DS_modalHeader(isRtl)}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
                        <Map className="w-5 h-5 text-white" />
                    </div>
                    <div className={isRtl ? "text-right" : "text-left"}>
                        <h3 className="text-xl font-bold text-white">
                            {t('Assign Route')}
                        </h3>
                        <p className="text-[#7ba7e8] text-sm font-semibold mt-0.5">{bus?.bus_number} - {bus?.plate_number}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 mb-4 ms-1">
                        {t('Select Route for this Bus')}
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                        {routes.map(route => (
                            <button
                                key={route.id}
                                type="button"
                                onClick={() => setData('route_id', route.id)}
                                className={`flex items-center justify-between p-4 rounded-[20px] border-2 transition-all text-start ${
                                    data.route_id === route.id
                                        ? 'border-[#0f2044] bg-[#0f2044]/5 dark:border-[#7ba7e8] dark:bg-[#7ba7e8]/10 ring-4 ring-[#0f2044]/10 dark:ring-[#7ba7e8]/20'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                }`}
                            >
                                <div className="flex flex-col">
                                    <span className={`font-bold tracking-tight text-lg ${data.route_id === route.id ? 'text-[#0f2044] dark:text-[#7ba7e8]' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {route.name}
                                    </span>
                                    <span className="text-xs text-gray-500 font-bold uppercase mt-1">{route.code || '---'}</span>
                                </div>
                                {data.route_id === route.id && (
                                    <div className="w-8 h-8 bg-[#f5b800] rounded-full flex items-center justify-center text-[#0f2044] shadow-sm">
                                        <Check className="w-4 h-4 font-bold" />
                                    </div>
                                )}
                            </button>
                        ))}
                        
                        <button
                            type="button"
                            onClick={() => setData('route_id', null)}
                            className={`p-4 rounded-[20px] border-2 border-dashed transition-all text-sm font-bold ${
                                data.route_id === null
                                    ? 'border-gray-400 bg-gray-50 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
                            }`}
                        >
                            {t('Unassign Route')}
                        </button>
                    </div>
                    {errors.route_id && <p className="mt-4 text-sm text-red-500 text-center font-bold">{errors.route_id}</p>}
                </div>

                <div className="flex justify-between items-center gap-3 pt-4 mt-6 border-t border-gray-100 dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-[#0f2044] dark:hover:text-white transition-colors">
                        {t('Cancel')}
                    </button>
                    <button type="submit" disabled={processing} className={DS_submitBtn(processing)}>
                        {processing ? t('Saving...') : t('Save Assignment')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
