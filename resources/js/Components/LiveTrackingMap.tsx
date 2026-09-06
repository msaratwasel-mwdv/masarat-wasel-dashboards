import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import useTranslation from '@/hooks/useTranslation';
import { motion } from 'framer-motion';
import { 
    Search, Filter, Layers, X, Clock, Users, ChevronDown, Check 
} from 'lucide-react';
import { SlidersHorizontal } from 'lucide-react';

interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
    status: 'active' | 'maintenance' | 'inactive' | string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    current_latitude?: number | string | null;
    current_longitude?: number | string | null;
    trip_status?: string | null;
    driver?: { id: number; name?: string } | null;
    students_count?: number;
}

interface Props {
    buses: Bus[];
    centerLat?: number;
    centerLng?: number;
}

// -------------------------------------------------------------
// HELPER: Parse Coordinates Safely
// -------------------------------------------------------------
const parseCoord = (val: any) => {
    if (val === null || val === undefined || val === '') return undefined;
    const parsed = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(parsed) ? undefined : parsed;
};

// -------------------------------------------------------------
// HELPER: Create Custom Bus Google Marker Icon
// -------------------------------------------------------------
const createBusIconSvg = (status: string, isSelected: boolean) => {
    const colors: Record<string, string> = {
        active: '#10b981', // Emerald
        maintenance: '#f59e0b', // Amber
        inactive: '#94a3b8', // Slate
    };
    const color = colors[status] || colors.inactive;
    const bg = isSelected ? '#4f46e5' : color; // Indigo if selected
    const size = isSelected ? 48 : 36;
    const fontSize = isSelected ? 24 : 18;
    
    // SVG equivalent of the previous div icon
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <rect width="${size}" height="${size}" rx="${isSelected ? 16 : 12}" fill="${bg}" stroke="white" stroke-width="3" />
            <text x="50%" y="50%" font-size="${fontSize}" fill="white" font-family="sans-serif" text-anchor="middle" dominant-baseline="central">🚌</text>
        </svg>
    `;
    
    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(size, size) : { width: size, height: size } as any,
        anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(size / 2, size / 2) : { x: size / 2, y: size / 2 } as any,
    };
};

// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------
export default function LiveTrackingMap({ buses = [], centerLat = 31.9522, centerLng = 35.2332 }: Props) {
    const { t, isRtl } = useTranslation();
    const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

    // Google Maps Initialization
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(mapInstance);
    }, []);

    const onUnmount = useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(null);
    }, []);
    
    // Main State applied to map
    const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'inactive'>('all');
    
    // Local State for the Panel
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [localMapType, setLocalMapType] = useState(mapType);
    const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
    
    // Select Search state
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const [selectSearch, setSelectSearch] = useState('');

    // DOM Refs for Outside Click Detection
    const panelRef = useRef<HTMLDivElement>(null);
    const panelTriggerRef = useRef<HTMLButtonElement>(null);
    const selectBusRef = useRef<HTMLDivElement>(null);
    const busCardRef = useRef<HTMLDivElement>(null);

    // Click Outside listener to close panel, bus dropdown, and selected bus card
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;

            // Close select bus dropdown if clicked outside
            if (isSelectOpen && selectBusRef.current && !selectBusRef.current.contains(target)) {
                setIsSelectOpen(false);
            }

            // Close main control panel if clicked outside panel and not on trigger button
            if (
                isPanelOpen &&
                panelRef.current &&
                !panelRef.current.contains(target) &&
                panelTriggerRef.current &&
                !panelTriggerRef.current.contains(target)
            ) {
                setIsPanelOpen(false);
            }

            // Close selected bus card if clicked outside
            if (
                selectedBus &&
                busCardRef.current &&
                !busCardRef.current.contains(target)
            ) {
                setSelectedBus(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isPanelOpen, isSelectOpen, selectedBus]);

    const openControlPanel = () => {
        setLocalMapType(mapType);
        setLocalStatusFilter(statusFilter);
        setIsPanelOpen(prev => !prev);
        setIsSelectOpen(false); // Reset internal dropdown
    };

    const applyFilters = () => {
        setMapType(localMapType);
        setStatusFilter(localStatusFilter);
        setIsPanelOpen(false);
    };

    // Robust Fallback: Prevent any possible 'undefined' array crashes
    const safeBuses = Array.isArray(buses) ? buses : [];

    // Filter buses (using applied main state)
    const busesWithLocation = useMemo(() => {
        return safeBuses.filter(bus => {
            if (!bus) return false;
            const lat = parseCoord(bus.current_latitude ?? bus.latitude);
            const lng = parseCoord(bus.current_longitude ?? bus.longitude);
            if (lat === undefined || lng === undefined) return false;
            const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
            return matchesStatus;
        });
    }, [safeBuses, statusFilter]);

    // Target for map flyTo
    const mapTarget = useMemo(() => {
        if (!selectedBus) return undefined;
        const lat = parseCoord(selectedBus.current_latitude ?? selectedBus.latitude);
        const lng = parseCoord(selectedBus.current_longitude ?? selectedBus.longitude);
        if (lat === undefined || lng === undefined) return undefined;
        return { lat, lng };
    }, [selectedBus]);

    // Google Maps Bounds Management
    useEffect(() => {
        if (map && busesWithLocation && busesWithLocation.length > 0 && !selectedBus) {
            const bounds = new window.google.maps.LatLngBounds();
            let hasValidBounds = false;
            busesWithLocation.forEach(bus => {
                const lat = parseCoord(bus.current_latitude ?? bus.latitude);
                const lng = parseCoord(bus.current_longitude ?? bus.longitude);
                if (lat !== undefined && lng !== undefined) {
                    bounds.extend(new window.google.maps.LatLng(lat, lng));
                    hasValidBounds = true;
                }
            });
            if (hasValidBounds) {
                map.fitBounds(bounds);
            }
        }
    }, [map, busesWithLocation, selectedBus]);

    // Google Maps Pan Management
    useEffect(() => {
        if (map && mapTarget) {
            map.panTo({ lat: mapTarget.lat, lng: mapTarget.lng });
            map.setZoom(16);
        }
    }, [map, mapTarget]);

    // Navigation between buses
    const navigateBus = (direction: 'next' | 'prev') => {
        if (!busesWithLocation || busesWithLocation.length <= 1) return;
        
        try {
            const currentIndex = selectedBus ? busesWithLocation.findIndex(b => b.id === selectedBus.id) : -1;
            let nextIndex = 0;
            
            if (currentIndex !== -1) {
                if (direction === 'next') {
                    nextIndex = (currentIndex + 1) % busesWithLocation.length;
                } else {
                    nextIndex = (currentIndex - 1 + busesWithLocation.length) % busesWithLocation.length;
                }
            }
            
            const nextBus = busesWithLocation[nextIndex];
            if (nextBus) setSelectedBus(nextBus);
        } catch (e) {
            console.error("Navigation error:", e);
        }
    };

    // Filtered list for the Select dropdown
    const filteredSelectBuses = useMemo(() => {
        return safeBuses.filter(bus => {
            if (!bus) return false;
            const bNum = bus.bus_number || '';
            const pNum = bus.plate_number || '';
            const sQuery = selectSearch || '';
            return `${bNum} ${pNum}`.toLowerCase().includes(sQuery.toLowerCase());
        });
    }, [safeBuses, selectSearch]);

    const isNavDisabled = busesWithLocation.length <= 1;
    const initialCenter = { lat: centerLat, lng: centerLng };

    return (
        <div className="relative bg-[#f8fafc] overflow-hidden transition-all duration-300 w-full h-full md:rounded-[30px] md:border-4 md:border-white md:shadow-inner md:mx-4 md:my-4 md:h-[calc(100vh-120px)] md:w-[calc(100%-32px)]">
            
            {/* --- GOOGLE MAPS --- */}
            {isLoaded ? (
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%', zIndex: 0 }}
                    center={initialCenter}
                    zoom={13}
                    options={{
                        mapTypeId: mapType,
                        disableDefaultUI: true, // We use custom overlays
                        zoomControl: true, // Optional default control
                    }}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={() => {
                        setIsPanelOpen(false);
                        setIsSelectOpen(false);
                        setSelectedBus(null);
                    }}
                >
                    {busesWithLocation.map(bus => {
                        const busLat = parseCoord(bus.current_latitude ?? bus.latitude);
                        const busLng = parseCoord(bus.current_longitude ?? bus.longitude);
                        if (busLat === undefined || busLng === undefined) return null;
                        
                        const isSelected = selectedBus?.id === bus.id;
                        return (
                            <Marker 
                                key={`bus-${bus.id}`}
                                position={{ lat: busLat, lng: busLng }}
                                icon={createBusIconSvg(bus.status || 'inactive', isSelected)}
                                onClick={() => setSelectedBus(bus)}
                            />
                        );
                    })}
                </GoogleMap>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                </div>
            )}

            {/* --- 1. SMART CONTROL BUTTON --- */}
            <div className={`absolute top-4 md:top-6 ${isRtl ? 'right-4 md:right-6' : 'left-4 md:left-6'} z-[50]`}>
                <motion.button
                    ref={panelTriggerRef}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={openControlPanel}
                    className="flex items-center gap-3 px-5 py-3.5 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl text-slate-800 dark:text-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/20 group transition-all"
                >
                    <div className="w-8 h-8 rounded-[12px] bg-slate-100 dark:bg-white/10 flex items-center justify-center text-indigo-500 dark:text-[#f5b800]">
                        <SlidersHorizontal className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                    </div>
                    <span className="font-black text-sm tracking-wide pr-2">{isRtl ? 'أدوات التحكم' : 'Controls'}</span>
                </motion.button>
            </div>



            {/* --- 2. COMPACT FLOATING CONTROL PANEL (No AnimatePresence for extreme stability) --- */}
            {isPanelOpen && (
                <motion.div
                    ref={panelRef}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`absolute top-20 md:top-24 left-4 right-4 md:w-[320px] bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] rounded-[28px] border border-white/20 dark:border-white/10 z-[101] flex flex-col ${
                        isRtl ? 'md:right-6 md:left-auto' : 'md:left-6 md:right-auto'
                    }`}
                >
                    <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
                        <span className="font-black text-sm text-slate-800 dark:text-white">
                            {isRtl ? 'الإعدادات والبحث' : 'Settings & Search'}
                        </span>
                        <button 
                            onClick={() => setIsPanelOpen(false)}
                            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Map Type */}
                        <div className="bg-slate-100 dark:bg-white/5 rounded-[16px] p-1 flex">
                            <button 
                                onClick={() => setLocalMapType('roadmap')}
                                className={`flex-1 py-2 rounded-[12px] text-[11px] font-black transition-all ${localMapType === 'roadmap' ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-[#f5b800] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t('Standard') || 'Standard'}
                            </button>
                            <button 
                                onClick={() => setLocalMapType('satellite')}
                                className={`flex-1 py-2 rounded-[12px] text-[11px] font-black transition-all ${localMapType === 'satellite' ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-[#f5b800] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {t('Satellite') || 'Satellite'}
                            </button>
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={localStatusFilter}
                                onChange={e => setLocalStatusFilter(e.target.value as any)}
                                className="w-full px-4 py-3 rounded-[16px] bg-slate-100 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 text-xs font-bold appearance-none cursor-pointer text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                            >
                                <option value="all" className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white py-1">{t('All Status') || 'All Status'}</option>
                                <option value="active" className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white py-1">{t('Active Only') || 'Active Only'}</option>
                                <option value="maintenance" className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white py-1">{t('Maintenance') || 'Maintenance'}</option>
                                <option value="inactive" className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white py-1">{t('Inactive') || 'Inactive'}</option>
                            </select>
                            <ChevronDown className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none`} />
                        </div>

                        {/* Select Bus Search */}
                        <div ref={selectBusRef} className="relative z-50">
                            <button 
                                onClick={() => setIsSelectOpen(!isSelectOpen)}
                                className="w-full px-4 py-3 rounded-[16px] bg-slate-50 dark:bg-white/5 border border-transparent flex justify-between items-center text-slate-700 dark:text-white transition-all focus:ring-2 focus:ring-indigo-500/20 hover:bg-slate-100"
                            >
                                <span className="text-xs font-bold truncate">
                                    {selectedBus ? `${selectedBus.bus_number || ''} - ${selectedBus.plate_number || ''}` : isRtl ? 'اختر حافلة للتركيز عليها...' : 'Select bus...'}
                                </span>
                                <Search className="w-3.5 h-3.5 text-slate-400" />
                            </button>

                            {/* Dropdown Overlay (Simple conditional, ultra-safe) */}
                            {isSelectOpen && (
                                <div className="absolute top-[110%] left-0 right-0 bg-white dark:bg-[#1e293b] rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-white/10 z-[100] overflow-hidden flex flex-col max-h-[260px] animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-2 border-b border-slate-50 dark:border-white/5">
                                        <input
                                            type="text"
                                            placeholder={isRtl ? 'بحث...' : 'Search...'}
                                            value={selectSearch}
                                            onChange={e => setSelectSearch(e.target.value)}
                                            className="w-full px-3 py-2 rounded-[12px] bg-slate-50 dark:bg-white/5 border-none text-xs font-bold text-slate-700 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500/30"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                                        {filteredSelectBuses.map(bus => (
                                            <button
                                                key={`dropdown-bus-${bus.id}`}
                                                onClick={() => {
                                                    setSelectedBus(bus);
                                                    setIsSelectOpen(false);
                                                    setSelectSearch('');
                                                }}
                                                className="w-full p-2.5 rounded-[12px] flex items-center gap-3 transition-all hover:bg-slate-50 dark:hover:bg-white/5 text-start"
                                            >
                                                <div className="w-6 h-6 flex-shrink-0 rounded-md bg-indigo-50 dark:bg-white/10 flex items-center justify-center text-[10px]">
                                                    🚌
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-black truncate text-slate-700 dark:text-slate-200">{bus.bus_number || 'N/A'}</p>
                                                </div>
                                                {selectedBus?.id === bus.id && (
                                                    <Check className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                        {filteredSelectBuses.length === 0 && (
                                            <p className="text-[10px] text-slate-400 text-center py-4 font-bold">{t('No buses found') || 'Not found'}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0f172a]/50 backdrop-blur-xl rounded-b-[28px]">
                        <button 
                            onClick={applyFilters}
                            className="w-full py-3 rounded-[14px] bg-indigo-600 dark:bg-[#f5b800] text-white dark:text-slate-900 font-black text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <Filter className="w-3.5 h-3.5" />
                            {isRtl ? 'تطبيق الفلاتر' : 'Apply Filters'}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* --- 3. ULTRA COMPACT SELECTED BUS CARD --- */}
            {selectedBus && (
                <motion.div 
                    ref={busCardRef}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`absolute bottom-4 left-4 right-4 md:bottom-auto md:top-6 md:w-[280px] bg-white/95 backdrop-blur-3xl dark:bg-[#0f172a]/95 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-white/10 z-[60] flex flex-col ${
                        isRtl ? 'md:left-6 md:right-auto' : 'md:right-6 md:left-auto'
                    }`}
                >
                    {/* Horizontal Compact Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-3 relative">
                        <div className="w-12 h-12 flex-shrink-0 rounded-[14px] bg-indigo-50 dark:bg-[#1e293b] text-xl flex items-center justify-center shadow-sm">
                            🚌
                        </div>
                        <div className="flex-1 pr-6">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white leading-tight mb-0.5 truncate">{selectedBus.bus_number || 'No Number'}</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{selectedBus.plate_number || '-'}</p>
                        </div>
                        <button 
                            onClick={() => setSelectedBus(null)}
                            className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} p-1.5 rounded-full bg-slate-50 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors`}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Compact Details */}
                    <div className="p-4 space-y-2 bg-slate-50/50 dark:bg-transparent">
                        <CompactInfo 
                            icon={Layers} 
                            label={isRtl ? 'الحالة' : 'Status'} 
                            value={t(selectedBus.status || 'inactive') || 'Inactive'} 
                            color={selectedBus.status === 'active' ? 'text-emerald-500' : 'text-slate-500'} 
                        />
                        <CompactInfo 
                            icon={Clock} 
                            label={isRtl ? 'الرحلة' : 'Trip'} 
                            value={selectedBus.trip_status ? t(selectedBus.trip_status) : (t('idle') || 'Idle')} 
                            color="text-indigo-600 dark:text-indigo-400"
                        />
                        <CompactInfo 
                            icon={Users} 
                            label={isRtl ? 'الطلاب' : 'Students'} 
                            value={`${selectedBus.students_count || 0} / ${selectedBus.capacity || 0}`} 
                            color="text-slate-700 dark:text-slate-300"
                        />
                        
                        {selectedBus.driver && selectedBus.driver.name && (
                            <div className="mt-3 p-2.5 rounded-[14px] bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-[10px]">
                                    {selectedBus.driver.name.charAt(0) || 'D'}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{isRtl ? 'السائق' : 'Driver'}</p>
                                    <p className="text-[11px] font-black text-slate-800 dark:text-white truncate">{selectedBus.driver.name}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#0f172a] grid grid-cols-2 gap-2 rounded-b-[24px]">
                        <button 
                            onClick={() => navigateBus('prev')}
                            disabled={isNavDisabled}
                            className={`py-2 rounded-[12px] font-black text-[11px] flex items-center justify-center transition-all ${isNavDisabled ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                            {isRtl ? 'السابق' : 'Prev'}
                        </button>
                        <button 
                            onClick={() => navigateBus('next')}
                            disabled={isNavDisabled}
                            className={`py-2 rounded-[12px] font-black text-[11px] flex items-center justify-center transition-all ${isNavDisabled ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-indigo-600 text-white hover:scale-[1.02] active:scale-95 shadow-sm'}`}
                        >
                            {isRtl ? 'التالي' : 'Next'}
                        </button>
                    </div>
                </motion.div>
            )}

        </div>
    );
}

function CompactInfo({ icon: Icon, label, value, color }: any) {
    return (
        <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
            </div>
            <p className={`text-xs font-black ${color} truncate max-w-[120px] text-end`}>{value}</p>
        </div>
    );
}

function LegendItem({ dotColor, label }: { dotColor: string, label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${dotColor} shadow-sm`} />
            <span className="text-[10px] font-black tracking-widest text-slate-600 dark:text-slate-300 uppercase">{label}</span>
        </div>
    );
}
