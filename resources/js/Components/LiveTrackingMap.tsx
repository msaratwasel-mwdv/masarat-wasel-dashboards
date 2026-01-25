import { useEffect, useRef, useState } from 'react';
import useTranslation from '@/hooks/useTranslation';

interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
    status: 'active' | 'maintenance' | 'inactive';
    current_latitude?: number;
    current_longitude?: number;
    trip_status?: 'at_school' | 'on_route' | 'stopped' | 'idle';
    driver?: { id: number; name: string };
    students_count?: number;
}

interface Props {
    buses: Bus[];
    centerLat?: number;
    centerLng?: number;
}

export default function LiveTrackingMap({ buses, centerLat = 24.7136, centerLng = 46.6753 }: Props) {
    const { t } = useTranslation();
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
    const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'maintenance' | 'inactive'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter buses
    const busesWithLocation = buses.filter(bus => {
        if (!bus.current_latitude || !bus.current_longitude) return false;
        const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
        const matchesSearch = bus.bus_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            bus.plate_number.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Stats
    const stats = {
        total: busesWithLocation.length,
        active: busesWithLocation.filter(b => b.status === 'active').length,
        onRoute: busesWithLocation.filter(b => b.trip_status === 'on_route').length,
        atSchool: busesWithLocation.filter(b => b.trip_status === 'at_school').length,
        maintenance: busesWithLocation.filter(b => b.status === 'maintenance').length,
    };

    // Create custom marker icon
    const createMarkerIcon = (status: string, selected: boolean = false) => {
        const colors = {
            active: '#10b981',
            maintenance: '#f59e0b',
            inactive: '#6b7280',
        };
        
        const svg = `
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="${colors[status as keyof typeof colors]}" stroke="white" stroke-width="3" opacity="${selected ? '1' : '0.9'}"/>
                ${selected ? '<circle cx="20" cy="20" r="22" fill="none" stroke="white" stroke-width="2" opacity="0.5"/>' : ''}
                <text x="20" y="26" text-anchor="middle" font-size="18" fill="white" font-weight="bold">🚌</text>
            </svg>
        `;
        
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    };

    useEffect(() => {
        if (!mapRef.current || !window.google) return;

        // Initialize map with enhanced options
        const map = new google.maps.Map(mapRef.current, {
            center: { lat: centerLat, lng: centerLng },
            zoom: 13,
            mapTypeId: mapType,
            mapTypeControl: false, // We'll use custom control
            fullscreenControl: false,
            streetViewControl: true,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER,
            },
            styles: mapType === 'roadmap' ? [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'simplified' }]
                },
                {
                    featureType: 'road',
                    elementType: 'geometry',
                    stylers: [{ color: '#f5f5f5' }]
                },
                {
                    featureType: 'water',
                    elementType: 'geometry',
                    stylers: [{ color: '#c9e6ff' }]
                }
            ] : [],
        });

        mapInstanceRef.current = map;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Add markers with animation
        busesWithLocation.forEach((bus, index) => {
            setTimeout(() => {
                const position = {
                    lat: bus.current_latitude!,
                    lng: bus.current_longitude!
                };

                const marker = new google.maps.Marker({
                    position,
                    map,
                    title: bus.bus_number,
                    icon: {
                        url: createMarkerIcon(bus.status, selectedBus?.id === bus.id),
                        scaledSize: new google.maps.Size(40, 40),
                        anchor: new google.maps.Point(20, 20),
                    },
                    animation: google.maps.Animation.DROP,
                });

                // Enhanced info window
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding: 16px; min-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <div style="font-size: 32px;">🚌</div>
                                <div>
                                    <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: #1f2937;">
                                        ${bus.bus_number}
                                    </h3>
                                    <p style="margin: 2px 0 0 0; font-size: 13px; color: #6b7280;">
                                        ${bus.plate_number}
                                    </p>
                                </div>
                            </div>
                            
                            <div style="background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                                    <div>
                                        <p style="margin: 0; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600;">
                                            ${t('Status')}
                                        </p>
                                        <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: ${bus.status === 'active' ? '#10b981' : bus.status === 'maintenance' ? '#f59e0b' : '#6b7280'};">
                                            ${t(bus.status)}
                                        </p>
                                    </div>
                                    <div>
                                        <p style="margin: 0; font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600;">
                                            ${t('Students')}
                                        </p>
                                        <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: bold; color: #1f2937;">
                                            ${bus.students_count || 0}/${bus.capacity}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            ${bus.driver ? `
                                <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #eff6ff; border-radius: 6px; margin-bottom: 8px;">
                                    <span style="font-size: 18px;">👨‍✈️</span>
                                    <div>
                                        <p style="margin: 0; font-size: 11px; color: #3b82f6; font-weight: 600;">
                                            ${t('Driver')}
                                        </p>
                                        <p style="margin: 2px 0 0 0; font-size: 13px; color: #1e40af; font-weight: 600;">
                                            ${bus.driver.name}
                                        </p>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${bus.trip_status ? `
                                <div style="padding: 6px 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 6px; text-align: center; font-size: 12px; font-weight: bold;">
                                    ${t(bus.trip_status)}
                                </div>
                            ` : ''}
                        </div>
                    `,
                });

                marker.addListener('click', () => {
                    // Close all other info windows and reset markers
                    markersRef.current.forEach(m => {
                        const icon = m.getIcon() as google.maps.Icon;
                        if (icon?.url) {
                            const busForMarker = busesWithLocation.find(b => 
                                b.current_latitude === m.getPosition()?.lat() && 
                                b.current_longitude === m.getPosition()?.lng()
                            );
                            if (busForMarker) {
                                m.setIcon({
                                    url: createMarkerIcon(busForMarker.status, false),
                                    scaledSize: new google.maps.Size(40, 40),
                                    anchor: new google.maps.Point(20, 20),
                                });
                            }
                        }
                    });
                    
                    // Highlight selected marker
                    marker.setIcon({
                        url: createMarkerIcon(bus.status, true),
                        scaledSize: new google.maps.Size(40, 40),
                        anchor: new google.maps.Point(20, 20),
                    });
                    
                    infoWindow.open(map, marker);
                    setSelectedBus(bus);
                    
                    // Center map on selected bus
                    map.panTo(position);
                });

                markersRef.current.push(marker);
            }, index * 50); // Stagger animation
        });

        // Fit bounds
        if (busesWithLocation.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            busesWithLocation.forEach(bus => {
                bounds.extend({
                    lat: bus.current_latitude!,
                    lng: bus.current_longitude!
                });
            });
            map.fitBounds(bounds);
        }

    }, [buses, centerLat, centerLng, mapType, busesWithLocation, selectedBus]);

    const changeMapType = (type: 'roadmap' | 'satellite' | 'hybrid') => {
        setMapType(type);
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setMapTypeId(type);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    if (!window.google) {
        return (
            <div className="text-center py-12 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl border-2 border-red-200 dark:border-red-800">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-red-800 dark:text-red-400 mb-3">
                    {t('Google Maps Not Loaded')}
                </h3>
                <p className="text-red-600 dark:text-red-500 max-w-md mx-auto">
                    {t('Please check your Google Maps API key in .env file and restart the server')}
                </p>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4' : ''}`}>
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
                            onClick={() => changeMapType('roadmap')}
                            className={`px-6 py-2.5 rounded-[30px] font-bold transition-all ${
                                mapType === 'roadmap'
                                    ? 'bg-white dark:bg-gray-600 text-[#0e7490] shadow-md'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                            }`}
                        >
                            🗺️ {t('Map')}
                        </button>
                        <button
                            onClick={() => changeMapType('satellite')}
                            className={`px-6 py-2.5 rounded-[30px] font-bold transition-all ${
                                mapType === 'satellite'
                                    ? 'bg-white dark:bg-gray-600 text-[#0e7490] shadow-md'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                            }`}
                        >
                            🛰️ {t('Satellite')}
                        </button>
                        <button
                            onClick={() => changeMapType('hybrid')}
                            className={`px-6 py-2.5 rounded-[30px] font-bold transition-all ${
                                mapType === 'hybrid'
                                    ? 'bg-white dark:bg-gray-600 text-[#0e7490] shadow-md'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                            }`}
                        >
                            🌍 {t('Hybrid')}
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
                <div ref={mapRef} style={{ height: isFullscreen ? 'calc(100vh - 300px)' : '650px', width: '100%' }} />
                
                {/* Fullscreen Button (Inside Map) */}
                <button
                    onClick={toggleFullscreen}
                    className="absolute top-4 right-16 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-md font-bold hover:bg-gray-50 transition-all z-10"
                >
                    {isFullscreen ? '↙️ ' + t('Exit') : '↗️ ' + t('Fullscreen')}
                </button>

                {/* Enhanced Legend */}
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md dark:bg-gray-800/90 p-5 rounded-[25px] shadow-lg border border-gray-100 dark:border-gray-700">
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
                    <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md dark:bg-gray-800/95 p-6 rounded-[25px] shadow-xl border border-gray-100 dark:border-gray-700 max-w-xs animate-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-extrabold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                                🚌 {selectedBus.bus_number}
                            </h4>
                            <button
                                onClick={() => setSelectedBus(null)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
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
                                <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                                    selectedBus.status === 'active' ? 'bg-green-100 text-green-700' :
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
