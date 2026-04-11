import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useTranslation from '@/hooks/useTranslation';

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

export default function LiveTrackingMap({ buses, centerLat = 24.7136, centerLng = 46.6753 }: Props) {
    const { t } = useTranslation();
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
            active: '#10b981',
            maintenance: '#f59e0b',
            inactive: '#6b7280',
        };

        const color = colors[status as keyof typeof colors] || colors.inactive;

        return L.divIcon({
            className: 'custom-bus-marker',
            html: `
                <div style="
                    width: 40px; 
                    height: 40px; 
                    background: ${color}; 
                    border: 3px solid white; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: 20px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                    ${selected ? 'transform: scale(1.2); ring: 4px white;' : ''}
                    transition: all 0.2s;
                ">
                    🚌
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
        <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-[100] bg-white dark:bg-gray-900 p-4' : ''}`}>
            {/* Control Panel */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-[35px] shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Search & Filter */}
                    <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder={t('Search by bus number or plate...')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="px-6 py-3 rounded-[35px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent min-w-[300px]"
                        />
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as any)}
                                className="px-6 py-3 rounded-[35px] bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-[#0e7490] appearance-none pr-10 font-medium"
                            >
                                <option value="all">🔍 {t('All Buses')}</option>
                                <option value="active">✅ {t('Active Only')}</option>
                                <option value="maintenance">🔧 {t('Maintenance')}</option>
                                <option value="inactive">⏸️ {t('Inactive')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Map Type Controls */}
                    <div className="flex gap-2 bg-gray-50 dark:bg-gray-700 p-1.5 rounded-[35px]">
                        <button
                            onClick={() => setMapType('roadmap')}
                            className={`px-6 py-2.5 rounded-[30px] font-bold transition-all ${mapType === 'roadmap'
                                ? 'bg-white dark:bg-gray-600 text-[#0e7490] shadow-md'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                                }`}
                        >
                            🗺️ {t('Map')}
                        </button>
                        <button
                            onClick={() => setMapType('satellite')}
                            className={`px-6 py-2.5 rounded-[30px] font-bold transition-all ${mapType === 'satellite'
                                ? 'bg-white dark:bg-gray-600 text-[#0e7490] shadow-md'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                                }`}
                        >
                            🛰️ {t('Satellite')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Live Stats Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:border-cyan-200 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/30 rounded-[15px] flex items-center justify-center text-2xl text-[#0e7490]">
                            🚌
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('Total')}</p>
                            <p className="text-3xl font-extrabold text-[#0e7490]">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-200 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-[15px] flex items-center justify-center text-2xl text-green-600">
                            ✅
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('Active')}</p>
                            <p className="text-3xl font-extrabold text-green-600">{stats.active}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:border-purple-200 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-[15px] flex items-center justify-center text-2xl text-purple-600">
                            🚗
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('On Route')}</p>
                            <p className="text-3xl font-extrabold text-purple-600">{stats.onRoute}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-[15px] flex items-center justify-center text-2xl text-blue-600">
                            🏫
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('At School')}</p>
                            <p className="text-3xl font-extrabold text-blue-600">{stats.atSchool}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-gray-700 hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-[15px] flex items-center justify-center text-2xl text-orange-500">
                            🔧
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('Maintenance')}</p>
                            <p className="text-3xl font-extrabold text-orange-500">{stats.maintenance}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="relative rounded-[35px] overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 bg-gray-100">
                <MapContainer
                    center={[centerLat, centerLng]}
                    zoom={13}
                    style={{ height: isFullscreen ? 'calc(100vh - 300px)' : '650px', width: '100%' }}
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
                            <Popup minWidth={280}>
                                <div className="p-2">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="text-2xl">🚌</div>
                                        <div>
                                            <h3 className="m-0 text-lg font-bold text-gray-800">{bus.bus_number}</h3>
                                            <p className="m-0 text-sm text-gray-500">{bus.plate_number}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="m-0 text-[10px] text-gray-500 uppercase font-bold">{t('Status')}</p>
                                                <p className={`m-0 text-sm font-bold ${bus.status === 'active' ? 'text-green-600' :
                                                    bus.status === 'maintenance' ? 'text-orange-500' : 'text-gray-500'
                                                    }`}>
                                                    {t(bus.status)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="m-0 text-[10px] text-gray-500 uppercase font-bold">{t('Students')}</p>
                                                <p className="m-0 text-sm font-bold">{bus.students_count || 0}/{bus.capacity}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {bus.driver && (
                                        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-2">
                                            <span>👨‍✈️</span>
                                            <div>
                                                <p className="m-0 text-[10px] text-blue-600 font-bold">{t('Driver')}</p>
                                                <p className="m-0 text-sm font-bold text-blue-800">{bus.driver.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    {bus.trip_status && (
                                        <div className="p-2 bg-indigo-600 text-white rounded-lg text-center text-xs font-bold">
                                            {t(bus.trip_status)}
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Fullscreen Button (Inside Map) */}
                <button
                    onClick={toggleFullscreen}
                    className="absolute top-4 right-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg shadow-md font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-[1000]"
                >
                    {isFullscreen ? '↙️ ' + t('Exit') : '↗️ ' + t('Fullscreen')}
                </button>

                {/* Enhanced Legend */}
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md dark:bg-gray-800/90 p-5 rounded-[25px] shadow-lg border border-gray-100 dark:border-gray-700 z-[1000]">
                    <h4 className="font-extrabold text-sm mb-3 text-gray-800 dark:text-white flex items-center gap-2">
                        <span className="text-lg">📍</span> {t('Legend')}
                    </h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm ring-2 ring-green-100"></div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{t('Active')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm ring-2 ring-orange-100"></div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{t('Maintenance')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-3 h-3 rounded-full bg-gray-500 shadow-sm ring-2 ring-gray-100"></div>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{t('Inactive')}</span>
                        </div>
                    </div>
                </div>

                {/* Selected Bus Info Panel */}
                {selectedBus && (
                    <div className="absolute top-16 right-6 bg-white/95 backdrop-blur-md dark:bg-gray-800/95 p-6 rounded-[25px] shadow-xl border border-gray-100 dark:border-gray-700 max-w-xs animate-in slide-in-from-right-4 duration-300 z-[1000]">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-extrabold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                🚌 {selectedBus.bus_number}
                            </h4>
                            <button
                                onClick={() => setSelectedBus(null)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono text-center">{selectedBus.plate_number}</p>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-400">{t('Status')}</span>
                                <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${selectedBus.status === 'active' ? 'bg-green-100 text-green-700' :
                                    selectedBus.status === 'maintenance' ? 'bg-orange-100 text-orange-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>{t(selectedBus.status)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-gray-500 dark:text-gray-400">{t('Students')}</span>
                                <span className="font-bold text-gray-900 dark:text-white">{selectedBus.students_count || 0} <span className="text-gray-400">/ {selectedBus.capacity}</span></span>
                            </div>
                            {selectedBus.driver && (
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-gray-500 dark:text-gray-400">{t('Driver')}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{selectedBus.driver.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* No Location Notice */}
            {busesWithLocation.length === 0 && (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-[30px] border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="text-6xl mb-6 opacity-20">📍</div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                        {t('No buses with location data')}
                    </h3>
                    <p className="text-gray-500">
                        {searchQuery || statusFilter !== 'all'
                            ? t('Try adjusting your filters')
                            : t('Waiting for GPS data from buses...')}
                    </p>
                </div>
            )}
        </div>
    );
}
