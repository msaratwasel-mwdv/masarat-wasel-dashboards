import { useState, useMemo, useEffect } from 'react';
import { 
    APIProvider, 
    Map, 
    AdvancedMarker, 
    useMap,
    InfoWindow
} from '@vis.gl/react-google-maps';
import useTranslation from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Filter, Map as MapIcon, Layers, 
    Maximize2, Minimize2, X, Info, 
    Navigation, School, Settings as SettingsIcon,
    AlertTriangle, CheckCircle2, Clock, Users
} from 'lucide-react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
    status: 'active' | 'maintenance' | 'inactive';
    latitude?: number;
    longitude?: number;
    trip_status?: string;
    driver?: { id: number; name: string };
    students_count?: number;
}

interface Props {
    buses: Bus[];
    centerLat?: number;
    centerLng?: number;
}

// Map Controller for Google Maps
function MapController({ center }: { center: { lat: number, lng: number } }) {
    const map = useMap();
    useEffect(() => {
        if (map && center) {
            map.panTo(center);
        }
    }, [map, center]);
    return null;
}

export default function LiveTrackingMap({ buses, centerLat = 23.5859, centerLng = 58.4059 }: Props) {
    const { t, isRtl } = useTranslation();
    const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
    const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'inactive'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    if (!API_KEY) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold">
                Google Maps API Key is missing in .env (VITE_GOOGLE_MAPS_API_KEY)
            </div>
        );
    }

    // Filter buses
    const busesWithLocation = useMemo(() => buses.filter(bus => {
        const lat = typeof bus.latitude === 'string' ? parseFloat(bus.latitude) : bus.latitude;
        const lng = typeof bus.longitude === 'string' ? parseFloat(bus.longitude) : bus.longitude;
        
        if (!lat || !lng) return false;
        
        const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
        const matchesSearch = bus.bus_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bus.plate_number.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    }), [buses, statusFilter, searchQuery]);

    // Calculate dynamic initial center based on buses
    const initialCenter = useMemo(() => {
        if (busesWithLocation.length > 0) {
            let totalLat = 0;
            let totalLng = 0;
            busesWithLocation.forEach(bus => {
                totalLat += typeof bus.latitude === 'string' ? parseFloat(bus.latitude) : bus.latitude!;
                totalLng += typeof bus.longitude === 'string' ? parseFloat(bus.longitude) : bus.longitude!;
            });
            return {
                lat: totalLat / busesWithLocation.length,
                lng: totalLng / busesWithLocation.length
            };
        }
        return { lat: centerLat, lng: centerLng };
    }, [busesWithLocation, centerLat, centerLng]);

    // Stats
    const stats = useMemo(() => ({
        total: busesWithLocation.length,
        active: busesWithLocation.filter(b => b.status === 'active').length,
        onRoute: busesWithLocation.filter(b => b.trip_status === 'on_route').length,
        atSchool: busesWithLocation.filter(b => b.trip_status === 'at_school').length,
        maintenance: busesWithLocation.filter(b => b.status === 'maintenance').length,
    }), [busesWithLocation]);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Only update map center when a bus is selected
    const mapTarget = useMemo(() => {
        if (!selectedBus) return null;
        const lat = typeof selectedBus.latitude === 'string' ? parseFloat(selectedBus.latitude) : selectedBus.latitude!;
        const lng = typeof selectedBus.longitude === 'string' ? parseFloat(selectedBus.longitude) : selectedBus.longitude!;
        return { lat, lng };
    }, [selectedBus]);

    return (
        <APIProvider apiKey={API_KEY}>
            <div className={`flex flex-col gap-6 ${isFullscreen ? 'fixed inset-0 z-[100] bg-gray-50 dark:bg-[#0f172a] p-6' : ''}`}>
                
                {/* Control Panel: 2026 Command Style */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    
                    {/* Search & Stats: Left/Top Panel */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-[#1a2845] p-6 rounded-[28px] shadow-sm border border-gray-100 dark:border-[#243460]">
                            <div className="flex flex-col gap-4">
                                <div className="relative group">
                                    <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#f5b800] transition-colors`} />
                                    <input
                                        type="text"
                                        placeholder={t('Search by bus number or plate...')}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className={`w-full ${isRtl ? 'pr-12' : 'pl-12'} py-4 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/50 border border-transparent focus:border-[#f5b800]/50 focus:ring-4 focus:ring-[#f5b800]/5 transition-all text-sm font-bold text-gray-700 dark:text-white`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('Status')}</label>
                                        <div className="relative">
                                            <select
                                                value={statusFilter}
                                                onChange={e => setStatusFilter(e.target.value as any)}
                                                className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/50 border border-transparent text-xs font-bold appearance-none cursor-pointer text-gray-700 dark:text-white"
                                            >
                                                <option value="all">{t('All Status')}</option>
                                                <option value="active">{t('Active Only')}</option>
                                                <option value="maintenance">{t('Maintenance')}</option>
                                                <option value="inactive">{t('Inactive')}</option>
                                            </select>
                                            <Filter className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none`} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('Map')}</label>
                                        <div className="flex bg-gray-50 dark:bg-[#0f172a]/50 rounded-2xl p-1">
                                            <button 
                                                onClick={() => setMapType('roadmap')}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${mapType === 'roadmap' ? 'bg-white dark:bg-[#1a2845] text-[#0f2044] dark:text-[#f5b800] shadow-sm' : 'text-gray-400'}`}
                                            >
                                                {t('Standard')}
                                            </button>
                                            <button 
                                                onClick={() => setMapType('satellite')}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${mapType === 'satellite' ? 'bg-white dark:bg-[#1a2845] text-[#0f2044] dark:text-[#f5b800] shadow-sm' : 'text-gray-400'}`}
                                            >
                                                {t('Satellite')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Compact Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <StatBox label={t('Active')} value={stats.active} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-500/10" />
                            <StatBox label={t('On Route')} value={stats.onRoute} icon={Navigation} color="text-[#f5b800]" bg="bg-[#f5b800]/10" />
                        </div>

                        {/* Quick Navigation List */}
                        <div className="bg-white dark:bg-[#1a2845] p-6 rounded-[28px] shadow-sm border border-gray-100 dark:border-[#243460] flex flex-col gap-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                <Navigation className="w-3.5 h-3.5" /> {t('Buses List')}
                            </h4>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {busesWithLocation.map(bus => (
                                    <button
                                        key={bus.id}
                                        onClick={() => setSelectedBus(bus)}
                                        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border-2 ${
                                            selectedBus?.id === bus.id 
                                            ? 'bg-[#0f2044] border-[#f5b800] text-white shadow-lg' 
                                            : 'bg-gray-50 dark:bg-[#0f172a]/50 border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0f172a]'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                                            selectedBus?.id === bus.id ? 'bg-[#f5b800] text-[#0f2044]' : 'bg-white dark:bg-[#1a2845] shadow-sm'
                                        }`}>
                                            🚌
                                        </div>
                                        <div className="flex-1 text-start">
                                            <p className="text-xs font-black leading-tight mb-0.5">{bus.bus_number}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedBus?.id === bus.id ? 'text-gray-400' : 'text-gray-400'}`}>
                                                {bus.plate_number}
                                            </p>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${
                                            bus.status === 'active' ? 'bg-emerald-500' : 
                                            bus.status === 'maintenance' ? 'bg-rose-500' : 'bg-gray-400'
                                        }`} />
                                    </button>
                                ))}
                                {busesWithLocation.length === 0 && (
                                    <p className="text-[11px] text-gray-400 text-center py-8 font-bold">
                                        {t('No buses found')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Map Container: 2026 Command Style */}
                    <div className="xl:col-span-8 relative rounded-[32px] overflow-hidden shadow-2xl border border-gray-200 dark:border-[#243460] bg-gray-100 group/map">
                        <Map
                            defaultCenter={initialCenter}
                            defaultZoom={13}
                            mapId="bf5047303847291a" // Using the verified working Map ID from your project
                            mapTypeId={mapType}
                            style={{ height: isFullscreen ? 'calc(100vh - 48px)' : '700px', width: '100%' }}
                            disableDefaultUI={true}
                            gestureHandling={'greedy'}
                        >
                            {mapTarget && <MapController center={mapTarget} />}

                            {busesWithLocation.map(bus => {
                                const busLat = typeof bus.latitude === 'string' ? parseFloat(bus.latitude) : bus.latitude!;
                                const busLng = typeof bus.longitude === 'string' ? parseFloat(bus.longitude) : bus.longitude!;
                                
                                return (
                                    <AdvancedMarker
                                        key={bus.id}
                                        position={{ lat: busLat, lng: busLng }}
                                        onClick={() => setSelectedBus(bus)}
                                    >
                                        <BusMarker status={bus.status} selected={selectedBus?.id === bus.id} />
                                    </AdvancedMarker>
                                );
                            })}
                        </Map>

                        {/* Floating Controls */}
                        <div className="absolute top-6 right-6 flex flex-col gap-3 z-[1000]">
                            <button
                                onClick={toggleFullscreen}
                                className="w-12 h-12 bg-white/90 backdrop-blur-md dark:bg-[#1a2845]/90 text-[#0f2044] dark:text-white rounded-2xl shadow-xl border border-gray-100 dark:border-[#243460] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                title={isFullscreen ? t('Exit') : t('Fullscreen')}
                            >
                                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setSelectedBus(null)}
                                className="w-12 h-12 bg-white/90 backdrop-blur-md dark:bg-[#1a2845]/90 text-[#0f2044] dark:text-white rounded-2xl shadow-xl border border-gray-100 dark:border-[#243460] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                title={t('Reset')}
                            >
                                <MapIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Enhanced Legend: Minimalist 2026 */}
                        <div className={`absolute bottom-8 ${isRtl ? 'right-8' : 'left-8'} z-[1000]`}>
                            <div className="bg-[#0f2044]/90 backdrop-blur-xl p-6 rounded-[30px] border border-white/10 shadow-2xl min-w-[180px]">
                                <h4 className="text-[10px] font-black text-[#f5b800] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Layers className="w-3.5 h-3.5" /> {t('Legend')}
                                </h4>
                                <div className="space-y-3">
                                    <LegendItem dotColor="bg-[#f5b800]" label={t('active')} />
                                    <LegendItem dotColor="bg-rose-500" label={t('maintenance')} />
                                    <LegendItem dotColor="bg-slate-400" label={t('inactive')} />
                                </div>
                            </div>
                        </div>

                        {/* Selected Info Slide-over (2026 Modern) */}
                        <AnimatePresence>
                            {selectedBus && (
                                <motion.div 
                                    initial={{ x: isRtl ? -400 : 400, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: isRtl ? -400 : 400, opacity: 0 }}
                                    className={`absolute top-8 ${isRtl ? 'left-8' : 'right-8'} bottom-8 w-80 bg-white/95 backdrop-blur-xl dark:bg-[#1a2845]/95 rounded-[35px] shadow-2xl border border-gray-100 dark:border-[#243460] z-[1001] overflow-hidden flex flex-col`}
                                >
                                    <div className="p-8 border-b border-gray-50 dark:border-white/5 relative">
                                        <button 
                                            onClick={() => setSelectedBus(null)}
                                            className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-rose-500 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="w-16 h-16 rounded-[22px] bg-[#0f2044] text-3xl flex items-center justify-center mb-6 shadow-xl shadow-[#0f2044]/20">
                                            🚌
                                        </div>
                                        <h3 className="text-2xl font-black text-[#0f2044] dark:text-white mb-1">{selectedBus.bus_number}</h3>
                                        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">{selectedBus.plate_number}</p>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                        <DetailRow icon={Navigation} label={t('Status')} value={t(selectedBus.status)} color={selectedBus.status === 'active' ? 'text-emerald-500' : 'text-rose-500'} />
                                        <DetailRow icon={Clock} label={t('Trip Status')} value={selectedBus.trip_status ? t(selectedBus.trip_status) : t('idle')} />
                                        <DetailRow icon={Users} label={t('Students')} value={`${selectedBus.students_count || 0} / ${selectedBus.capacity}`} />
                                        
                                        {selectedBus.driver && (
                                            <div className="p-5 rounded-3xl bg-[#f5b800]/5 border border-dashed border-[#f5b800]/30">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-[#f5b800] text-[#0f2044] flex items-center justify-center font-black text-xl shadow-lg">
                                                        {selectedBus.driver.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('Driver')}</p>
                                                        <p className="text-sm font-black text-[#0f2044] dark:text-white">{selectedBus.driver.name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        <button className="w-full py-4 rounded-2xl bg-[#0f2044] text-white font-black text-sm hover:bg-[#1a2d5a] transition-all shadow-xl shadow-[#0f2044]/20">
                                            {t('Details')}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {/* Empty State Overlay */}
                        {busesWithLocation.length === 0 && (
                            <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-sm rounded-[32px] border border-gray-200 dark:border-[#243460] transition-all">
                                <div className="w-24 h-24 rounded-[30px] bg-gray-50 dark:bg-[#1a2845] flex items-center justify-center text-5xl mx-auto mb-8 grayscale opacity-60 shadow-inner">
                                    📍
                                </div>
                                <h3 className="text-2xl font-black text-[#0f2044] dark:text-white mb-3">
                                    {t('No buses with location data')}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                                    {searchQuery || statusFilter !== 'all'
                                        ? t('Try adjusting your filters')
                                        : t('Waiting for GPS data from buses...')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </APIProvider>
    );
}

function BusMarker({ status, selected }: { status: string, selected: boolean }) {
    const colors = {
        active: '#f5b800', // Gold
        maintenance: '#ef4444', // Red
        inactive: '#94a3b8', // Gray
    };

    const color = colors[status as keyof typeof colors] || colors.inactive;

    return (
        <div 
            className={`flex items-center justify-center transition-all duration-300 ${selected ? 'z-50' : 'z-10'}`}
            style={{
                width: selected ? '52px' : '44px',
                height: selected ? '52px' : '44px',
                backgroundColor: selected ? '#0f2044' : color,
                border: `3px solid ${selected ? '#f5b800' : 'white'}`,
                borderRadius: '14px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                fontSize: selected ? '24px' : '20px',
                transform: selected ? 'scale(1.1) translateY(-10px)' : 'scale(1)',
            }}
        >
            <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>🚌</span>
        </div>
    );
}

function StatBox({ label, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white dark:bg-[#1a2845] p-5 rounded-3xl border border-gray-50 dark:border-[#243460] shadow-sm group hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">{label}</p>
                    <p className={`text-2xl font-black ${color}`}>{value}</p>
                </div>
            </div>
        </div>
    );
}

function LegendItem({ dotColor, label }: { dotColor: string, label: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${dotColor} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
            <span className="text-[11px] font-bold text-gray-300 capitalize">{label}</span>
        </div>
    );
}

function DetailRow({ icon: Icon, label, value, color = "text-[#0f2044] dark:text-white" }: any) {
    return (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-sm font-black ${color}`}>{value}</p>
            </div>
        </div>
    );
}
