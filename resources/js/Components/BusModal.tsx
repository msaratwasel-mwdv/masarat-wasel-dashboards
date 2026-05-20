import { FormEventHandler, useEffect, useState, useRef } from 'react';
import { useForm } from '@inertiajs/react';
import useTranslation from '@/hooks/useTranslation';
import Modal from '@/Components/Modal';
import { Map, Check, Search, ChevronDown, Route as RouteIcon, Bus as BusIcon } from 'lucide-react';
import { DS_modalHeader, DS_submitBtn, DS_cancelBtn, DS_searchInput } from '@/lib/DS';
import { motion, AnimatePresence } from 'framer-motion';

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
    routes?: Array<{ id: number; name: string; code?: string }>;
}

export default function BusModal({ show, onClose, bus, drivers = [], assistants = [], field_supervisors = [], routes = [] }: BusModalProps) {
    const { t, isRtl } = useTranslation();
    const isEditing = !!bus;

    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
        if (!show) {
            setIsDropdownOpen(false);
            setSearchQuery('');
        }
    }, [bus, show]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const filteredRoutes = routes.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (r.code && r.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const selectedRoute = routes.find(r => r.id === data.route_id);

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className={DS_modalHeader(isRtl)}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
                        <Map className="w-5 h-5 text-white" />
                    </div>
                    <div className={isRtl ? "text-right" : "text-left"}>
                        <h3 className="text-xl font-bold text-white">
                            {t('Assign Route')}
                        </h3>
                        <p className="text-[#7ba7e8] text-sm font-semibold mt-0.5">{bus?.bus_number}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="p-6 md:p-8">
                
                {/* Bus Info Card */}
                <div className="mb-6 flex items-center gap-4 p-4 rounded-[16px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="w-12 h-12 bg-[#0f2044] rounded-[12px] flex items-center justify-center text-[#f5b800] shadow-sm">
                        <BusIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">{t('Bus details')}</p>
                        <h4 className="font-black text-[#0f2044] dark:text-white text-lg leading-tight">{bus?.bus_number}</h4>
                        <p className="text-xs font-semibold text-gray-500">{bus?.plate_number}</p>
                    </div>
                </div>

                <div className="space-y-2 relative" ref={dropdownRef}>
                    <label className="block text-sm font-bold text-[#0f2044] dark:text-gray-300 ms-1">
                        {t('Select Route for this Bus')}
                    </label>
                    
                    {/* Custom Select Trigger */}
                    <div 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`${DS_searchInput} cursor-pointer flex justify-between items-center transition-all ${isDropdownOpen ? 'ring-2 ring-[#0f2044]/20 dark:ring-[#7ba7e8]/30 border-[#0f2044] dark:border-[#7ba7e8]' : ''}`}
                    >
                        {selectedRoute ? (
                            <div className="flex items-center gap-2">
                                <RouteIcon className="w-4 h-4 text-[#f5b800]" />
                                <span className="font-bold text-[#0f2044] dark:text-white">{selectedRoute.name}</span>
                                {selectedRoute.code && <span className="text-[10px] text-gray-400 font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">{selectedRoute.code}</span>}
                            </div>
                        ) : (
                            <span className="text-gray-400 font-semibold">{t('Click to select a route...')}</span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1a2845] border border-gray-100 dark:border-[#243460] rounded-[16px] shadow-2xl overflow-hidden"
                            >
                                {/* Search Input inside Dropdown */}
                                <div className="p-2 border-b border-gray-50 dark:border-white/5">
                                    <div className="relative">
                                        <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                                        <input 
                                            type="text" 
                                            className={`w-full py-2 bg-gray-50 dark:bg-white/5 border-none rounded-[10px] text-sm font-semibold focus:ring-0 text-[#0f2044] dark:text-white placeholder-gray-400 ${isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
                                            placeholder={t('Search routes...')}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            autoFocus
                                            dir={isRtl ? "rtl" : "ltr"}
                                        />
                                    </div>
                                </div>
                                
                                {/* Options List */}
                                <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                    <button
                                        type="button"
                                        onClick={() => { setData('route_id', null); setIsDropdownOpen(false); }}
                                        className={`w-full text-start px-3 py-2.5 rounded-[10px] text-sm font-bold transition-colors ${data.route_id === null ? 'bg-gray-100 dark:bg-gray-800 text-[#0f2044] dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                    >
                                        {t('None (Unassign)')}
                                    </button>
                                    
                                    {filteredRoutes.length > 0 ? (
                                        filteredRoutes.map(route => (
                                            <button
                                                key={route.id}
                                                type="button"
                                                onClick={() => { setData('route_id', route.id); setIsDropdownOpen(false); }}
                                                className={`w-full text-start px-3 py-2.5 rounded-[10px] text-sm font-bold transition-all flex items-center justify-between group ${
                                                    data.route_id === route.id 
                                                        ? 'bg-[#0f2044]/5 text-[#0f2044] dark:bg-[#7ba7e8]/10 dark:text-[#7ba7e8]' 
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                }`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="group-hover:text-[#0f2044] dark:group-hover:text-white transition-colors">{route.name}</span>
                                                    {route.code && <span className={`text-[10px] font-semibold mt-0.5 ${data.route_id === route.id ? 'text-[#0f2044]/60 dark:text-[#7ba7e8]/60' : 'text-gray-400'}`}>{route.code}</span>}
                                                </div>
                                                {data.route_id === route.id && <Check className="w-4 h-4 text-[#f5b800]" />}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-4 text-center text-gray-400 text-xs font-bold">
                                            {t('No routes found')}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {errors.route_id && <p className="mt-2 text-sm text-red-500 font-bold">{errors.route_id}</p>}
                </div>

                <div className={`flex items-center gap-3 pt-6 mt-8 border-t border-gray-100 dark:border-gray-700 ${isRtl ? 'justify-start' : 'justify-end'}`}>
                    <button type="button" onClick={onClose} className={DS_cancelBtn}>
                        {t('Cancel')}
                    </button>
                    <button type="submit" disabled={processing} className={DS_submitBtn(processing)}>
                        <Check className="w-4 h-4" />
                        {processing ? t('Saving...') : t('Save Assignment')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
