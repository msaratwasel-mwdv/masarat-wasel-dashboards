import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useTranslation from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Filter, Map as MapIcon, Layers, 
    Maximize2, Minimize2, X, Info, 
    Navigation, School, Settings as SettingsIcon,
    AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';

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

// Helper component to handle map interactions like centering
function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    if (center) {
        map.setView(center, map.getZoom());
    }
    return null;
}

export default function LiveTrackingMap({ buses, centerLat = 23.5859, centerLng = 58.4059 }: Props) {
    const { t, isRtl } = useTranslation();
    const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
    const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'inactive'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter buses
    const busesWithLocation = useMemo(() => buses.filter(bus => {
        if (!bus.latitude || !bus.longitude) return false;
        const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
        const matchesSearch = bus.bus_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bus.plate_number.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    }), [buses, statusFilter, searchQuery]);

    // Stats
    const stats = useMemo(() => ({
        total: busesWithLocation.length,
        active: busesWithLocation.filter(b => b.status === 'active').length,
        onRoute: busesWithLocation.filter(b => b.trip_status === 'on_route').length,
        atSchool: busesWithLocation.filter(b => b.trip_status === 'at_school').length,
        maintenance: busesWithLocation.filter(b => b.status === 'maintenance').length,
    }), [busesWithLocation]);

    // Create custom marker icon
    const createMarkerIcon = (status: string, selected: boolean = false) => {
        const colors = {
            active: '#f5b800', // Gold
            maintenance: '#ef4444', // Red
            inactive: '#94a3b8', // Gray
        };

        const color = colors[status as keyof typeof colors] || colors.inactive;

        return L.divIcon({
            className: 'custom-bus-marker',
            html: `
                <div class="marker-container ${selected ? 'selected' : ''}" style="
                    width: ${selected ? '48px' : '40px'}; 
                    height: ${selected ? '48px' : '40px'}; 
                    background: ${selected ? '#0f2044' : color}; 
                    border: 3px solid ${selected ? '#f5b800' : 'white'}; 
                    border-radius: 12px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: ${selected ? '24px' : '20px'};
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    z-index: ${selected ? '1000' : '1'};
                ">
                    <span style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2))">🚌</span>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        });
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const mapCenter: [number, number] = selectedBus?.latitude && selectedBus?.longitude
        ? [selectedBus.latitude, selectedBus.longitude]
        : [centerLat, centerLng];

    return (
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
                                    className={`w-full ${isRtl ? 'pr-12' : 'pl-12'} py-4 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/50 border border-transparent focus:border-[#f5b800]/50 focus:ring-4 focus:ring-[#f5b800]/5 transition-all text-sm font-bold`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('Status')}</label>
                                    <div className="relative">
                                        <select
                                            value={statusFilter}
                                            onChange={e => setStatusFilter(e.target.value as any)}
                                            className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/50 border border-transparent text-xs font-bold appearance-none cursor-pointer"
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
                        <StatBox label={t('At School')} value={stats.atSchool} icon={School} color="text-blue-500" bg="bg-blue-500/10" />
                        <StatBox label={t('Maintenance')} value={stats.maintenance} icon={AlertTriangle} color="text-rose-500" bg="bg-rose-500/10" />
                    </div>
                </div>

                {/* Map Container: 2026 Command Style */}
                <div className="xl:col-span-8 relative rounded-[32px] overflow-hidden shadow-2xl border border-gray-200 dark:border-[#243460] bg-gray-100 group/map">
                    <MapContainer
                        center={[centerLat, centerLng]}
                        zoom={13}
                        style={{ height: isFullscreen ? 'calc(100vh - 48px)' : '700px', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer
                            url={mapType === 'satellite'
                                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                                : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                            attribution={mapType === 'satellite' ? 'Tiles &copy; Esri' : '&copy; OpenStreetMap contributors'}
                        />

                        <MapController center={mapCenter} />

                        {busesWithLocation.map(bus => (
                            <Marker
                                key={bus.id}
                                position={[bus.latitude!, bus.longitude!]}
                                icon={createMarkerIcon(bus.status, selectedBus?.id === bus.id)}
                                eventHandlers={{
                                    click: () => setSelectedBus(bus),
                                }}
                            >
                                <Popup minWidth={300} className="custom-modern-popup">
                                    <div className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                                        <div className={`flex items-center gap-4 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-12 h-12 rounded-2xl bg-[#0f2044] flex items-center justify-center text-2xl shadow-lg">
                                                🚌
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="m-0 text-xl font-black text-[#0f2044] dark:text-white leading-tight">
                                                    {bus.bus_number}
                                                </h3>
                                                <p className="m-0 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {bus.plate_number}
                                                </p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                                bus.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 
                                                bus.status === 'maintenance' ? 'bg-rose-500/10 text-rose-500' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {t(bus.status)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/50 border border-gray-100 dark:border-white/5">
                                                <p className="m-0 text-[9px] text-gray-400 font-bold uppercase mb-1">{t('Students')}</p>
                                                <p className="m-0 text-sm font-black text-[#0f2044] dark:text-white">
                                                    {bus.students_count || 0} <span className="text-gray-300 font-normal">/ {bus.capacity}</span>
                                                </p>
                                            </div>
                                            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#0f172a]/50 border border-gray-100 dark:border-white/5">
                                                <p className="m-0 text-[9px] text-gray-400 font-bold uppercase mb-1">{t('Trip Status')}</p>
                                                <p className="m-0 text-sm font-black text-blue-600">
                                                    {bus.trip_status ? t(bus.trip_status) : t('idle')}
                                                </p>
                                            </div>
                                        </div>

                                        {bus.driver && (
                                            <div className={`flex items-center gap-3 p-3 bg-[#f5b800]/10 rounded-2xl border border-[#f5b800]/20 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                <div className="w-8 h-8 rounded-xl bg-[#f5b800] text-[#0f2044] flex items-center justify-center font-bold">
                                                    {bus.driver.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="m-0 text-[9px] text-[#0f2044]/50 dark:text-[#f5b800]/50 font-black uppercase tracking-tighter">{t('Driver')}</p>
                                                    <p className="m-0 text-[11px] font-black text-[#0f2044] dark:text-white truncate">
                                                        {bus.driver.name}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

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
