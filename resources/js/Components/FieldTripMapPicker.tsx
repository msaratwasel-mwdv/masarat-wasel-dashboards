import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, LocateFixed, X } from 'lucide-react';

interface FieldTripMapPickerProps {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number, address?: string) => void;
    isDark?: boolean;
    isRtl?: boolean;
}

export default function FieldTripMapPicker({ lat, lng, onChange, isDark, isRtl }: FieldTripMapPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    const defaultLat = 23.5859;
    const defaultLng = 58.4059;

    // Initialize Leaflet map
    useEffect(() => {
        if (!mapRef.current || leafletMapRef.current) return;

        import('leaflet').then((L) => {
            // Fix default icon paths
            (L as any).Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            const map = L.map(mapRef.current!, {
                center: [lat ?? defaultLat, lng ?? defaultLng],
                zoom: lat && lng ? 14 : 10,
                zoomControl: false,
            });

            // Use OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);

            // Add zoom control to bottom right
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            // Custom marker icon (navy color)
            const customIcon = L.divIcon({
                html: `<div style="
                    width:36px;height:36px;
                    background:#0f2044;
                    border-radius:50% 50% 50% 0;
                    transform:rotate(-45deg);
                    border:3px solid white;
                    box-shadow:0 4px 12px rgba(0,0,0,0.3);
                    display:flex;align-items:center;justify-content:center;
                "><div style="
                    transform:rotate(45deg);
                    width:12px;height:12px;
                    background:#f5b800;
                    border-radius:50%;
                "></div></div>`,
                className: '',
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36],
            });

            // Add initial marker if lat/lng provided
            if (lat && lng) {
                markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
            }

            // Click to set location
            map.on('click', (e: any) => {
                const { lat: clickLat, lng: clickLng } = e.latlng;

                if (markerRef.current) {
                    markerRef.current.setLatLng([clickLat, clickLng]);
                } else {
                    markerRef.current = L.marker([clickLat, clickLng], { icon: customIcon }).addTo(map);
                }

                onChange(clickLat, clickLng);
            });

            leafletMapRef.current = map;
            setMapReady(true);
        });

        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
                markerRef.current = null;
            }
        };
    }, []);

    // Update marker when lat/lng changes externally
    useEffect(() => {
        if (!leafletMapRef.current || !mapReady) return;
        import('leaflet').then((L) => {
            if (lat && lng) {
                const customIcon = L.divIcon({
                    html: `<div style="
                        width:36px;height:36px;
                        background:#0f2044;
                        border-radius:50% 50% 50% 0;
                        transform:rotate(-45deg);
                        border:3px solid white;
                        box-shadow:0 4px 12px rgba(0,0,0,0.3);
                        display:flex;align-items:center;justify-content:center;
                    "><div style="
                        transform:rotate(45deg);
                        width:12px;height:12px;
                        background:#f5b800;
                        border-radius:50%;
                    "></div></div>`,
                    className: '',
                    iconSize: [36, 36],
                    iconAnchor: [18, 36],
                });
                if (markerRef.current) {
                    markerRef.current.setLatLng([lat, lng]);
                } else {
                    markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(leafletMapRef.current);
                }
                leafletMapRef.current.setView([lat, lng], 14);
            }
        });
    }, [lat, lng, mapReady]);

    // Search using Nominatim (OpenStreetMap geocoder - free)
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&accept-language=${isRtl ? 'ar' : 'en'}&countrycodes=om`
            );
            const data = await res.json();
            setSearchResults(data);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSearchResult = (result: any) => {
        const resLat = parseFloat(result.lat);
        const resLng = parseFloat(result.lon);
        const address = result.display_name;
        onChange(resLat, resLng, address);
        setSearchResults([]);
        setSearchQuery(result.display_name.split(',')[0]);
        if (leafletMapRef.current) {
            leafletMapRef.current.setView([resLat, resLng], 15);
        }
    };

    const handleMyLocation = () => {
        if (!navigator.geolocation) return;
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                onChange(latitude, longitude);
                leafletMapRef.current?.setView([latitude, longitude], 15);
                setIsLocating(false);
            },
            () => setIsLocating(false)
        );
    };

    return (
        <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
                <div className={`flex items-center gap-2 bg-white dark:bg-[#1a2845] border border-gray-200 dark:border-[#243460] rounded-[14px] px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#f5b800] transition-all`}>
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={isRtl ? 'ابحث عن موقع في عُمان...' : 'Search location in Oman...'}
                        className="flex-1 bg-transparent text-sm font-medium text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    />
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-gray-400 hover:text-gray-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-3 py-1 bg-[#0f2044] text-[#f5b800] rounded-[10px] text-xs font-bold hover:bg-[#162d60] transition-all disabled:opacity-50"
                    >
                        {isSearching ? '...' : (isRtl ? 'بحث' : 'Search')}
                    </button>
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a2845] border border-gray-200 dark:border-[#243460] rounded-[14px] shadow-xl z-[1000] overflow-hidden">
                        {searchResults.map((result, idx) => (
                            <button
                                key={idx}
                                onClick={() => selectSearchResult(result)}
                                className="w-full px-4 py-3 text-start text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#0f2044]/5 dark:hover:bg-[#0f2044]/30 flex items-start gap-2 border-b border-gray-50 dark:border-[#243460] last:border-0 transition-colors"
                            >
                                <MapPin className="w-3.5 h-3.5 text-[#0f2044] dark:text-[#7ba7e8] mt-0.5 flex-shrink-0" />
                                <span className="leading-relaxed">{result.display_name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Container */}
            <div className="relative rounded-[16px] overflow-hidden border border-gray-200 dark:border-[#243460] shadow-lg" style={{ height: '280px' }}>
                <div ref={mapRef} style={{ height: '100%', width: '100%', zIndex: 1 }} />

                {/* My Location Button */}
                <button
                    onClick={handleMyLocation}
                    disabled={isLocating}
                    type="button"
                    className="absolute top-3 right-3 z-[400] p-2 bg-white dark:bg-[#1a2845] rounded-[10px] shadow-lg border border-gray-200 dark:border-[#243460] text-[#0f2044] dark:text-[#7ba7e8] hover:bg-[#0f2044] hover:text-white dark:hover:bg-[#0f2044] dark:hover:text-[#f5b800] transition-all"
                    title={isRtl ? 'موقعي الحالي' : 'My Location'}
                >
                    <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                </button>

                {/* Status Overlay */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
                    {!lat && !lng ? (
                        <div className="bg-white/90 dark:bg-[#0f2044]/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow border border-gray-100 dark:border-[#243460]">
                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                {isRtl ? '📍 انقر على الخريطة لتحديد الوجهة' : '📍 Click map to select destination'}
                            </p>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-emerald-500/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow"
                        >
                            <p className="text-[10px] font-bold text-white whitespace-nowrap">
                                {isRtl ? '✅ تم تحديد الموقع بنجاح' : '✅ Location selected'}
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Coordinates display */}
            {lat && lng && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-[12px] border border-emerald-100 dark:border-emerald-800/30"
                >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        {lat.toFixed(5)}, {lng.toFixed(5)}
                    </span>
                    <button
                        type="button"
                        onClick={() => onChange(0, 0, '')}
                        className="ms-auto text-[10px] font-bold text-red-400 hover:text-red-600"
                    >
                        {isRtl ? 'مسح' : 'Clear'}
                    </button>
                </motion.div>
            )}
        </div>
    );
}
