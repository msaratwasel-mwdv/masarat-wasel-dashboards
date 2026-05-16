import React, { useEffect, useMemo, useState } from 'react';
import { APIProvider, Map, useMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useTheme } from '@/Contexts/ThemeContext';
import { motion } from 'framer-motion';

interface LocationComparisonMapProps {
    oldLat?: number;
    oldLng?: number;
    newLat: number;
    newLng: number;
    height?: string;
}

/**
 * Polyline component for Google Maps
 */
const MapPath = ({ points }: { points: google.maps.LatLngLiteral[] }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !window.google || points.length < 2) return;

        const path = new window.google.maps.Polyline({
            path: points,
            geodesic: true,
            strokeColor: '#f5b800',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            icons: [{
                icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                offset: '100%'
            }]
        });

        path.setMap(map);
        return () => path.setMap(null);
    }, [map, points]);

    return null;
};

/**
 * Helper component to fit map bounds
 */
const MapBoundsAdjuster = ({ oldPos, newPos }: { oldPos?: { lat: number; lng: number }, newPos: { lat: number; lng: number } }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !window.google) return;

        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(newPos);
        if (oldPos) bounds.extend(oldPos);

        const padding = { top: 70, right: 70, bottom: 70, left: 70 };
        map.fitBounds(bounds, padding);
    }, [map, oldPos, newPos]);

    return null;
};

export default function LocationComparisonMap({
    oldLat,
    oldLng,
    newLat,
    newLng,
    height = '350px'
}: LocationComparisonMapProps) {
    const { isRTL: isRtl } = useTheme();
    const [oldAddress, setOldAddress] = useState<string>('');
    const [newAddress, setNewAddress] = useState<string>('');
    const [isMapReady, setIsMapReady] = useState(false);

    // Filter out zero coordinates which often mean "null" in database
    const oldPos = useMemo(() => {
        const lat = Number(oldLat);
        const lng = Number(oldLng);
        if (!lat || !lng || lat === 0 || lng === 0) return undefined;
        return { lat, lng };
    }, [oldLat, oldLng]);

    const newPos = useMemo(() => ({ lat: Number(newLat), lng: Number(newLng) }), [newLat, newLng]);

    const pathPoints = useMemo(() => {
        if (!oldPos) return [];
        return [oldPos, newPos];
    }, [oldPos, newPos]);

    // Force re-mount of the map when locations change to prevent "White Screen" or stale tiles
    const mapKey = useMemo(() => `map-${newLat}-${newLng}-${oldLat || 'none'}`, [newLat, newLng, oldLat]);

    // Distance Calculation (Haversine)
    const distance = useMemo(() => {
        if (!oldPos) return null;
        const R = 6371e3; // metres
        const φ1 = oldPos.lat * Math.PI/180;
        const φ2 = newPos.lat * Math.PI/180;
        const Δφ = (newPos.lat-oldPos.lat) * Math.PI/180;
        const Δλ = (newPos.lng-oldPos.lng) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        const d = R * c; // in metres
        return d > 1000 ? `${(d/1000).toFixed(2)} km` : `${Math.round(d)} m`;
    }, [oldPos, newPos]);

    // Reverse Geocoding
    useEffect(() => {
        if (!window.google) return;
        const geocoder = new window.google.maps.Geocoder();

        if (oldPos) {
            geocoder.geocode({ location: oldPos }, (results, status) => {
                if (status === 'OK' && results?.[0]) setOldAddress(results[0].formatted_address);
                else setOldAddress(isRtl ? 'لا يوجد عنوان مسجل' : 'No address found');
            });
        }

        geocoder.geocode({ location: newPos }, (results, status) => {
            if (status === 'OK' && results?.[0]) setNewAddress(results[0].formatted_address);
            else setNewAddress(isRtl ? 'موقع جديد غير مسمى' : 'Unnamed new location');
        });
    }, [oldPos, newPos, isRtl]);

    // Delay map rendering slightly to allow modal animation to stabilize
    useEffect(() => {
        const timer = setTimeout(() => setIsMapReady(true), 150);
        return () => clearTimeout(timer);
    }, [mapKey]);

    return (
        <div className="flex flex-col gap-4">
            <div 
                className="w-full rounded-[32px] overflow-hidden border-4 border-white dark:border-[#243460] shadow-2xl bg-[#f8fafc] dark:bg-[#0f172a] relative hide-google-branding" 
                style={{ height }}
            >
                {isMapReady ? (
                    <Map
                        key={mapKey}
                        defaultCenter={newPos}
                        center={newPos}
                        defaultZoom={15}
                        mapId="bf5047303847291a"
                        disableDefaultUI={true}
                        gestureHandling={'greedy'}
                        colorScheme='light'
                    >

                            <MapBoundsAdjuster oldPos={oldPos} newPos={newPos} />
                            <MapPath points={pathPoints} />

                            {oldPos && (
                                <AdvancedMarker position={oldPos}>
                                    <Pin background={'#ef4444'} glyphColor={'#ffffff'} borderColor={'#991b1b'} scale={1}>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-black text-white px-1">{isRtl ? 'السابق' : 'OLD'}</span>
                                        </div>
                                    </Pin>
                                </AdvancedMarker>
                            )}

                            <AdvancedMarker position={newPos}>
                                <Pin background={'#10b981'} glyphColor={'#ffffff'} borderColor={'#065f46'} scale={1.2}>
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-black text-white px-1">{isRtl ? 'الجديد' : 'NEW'}</span>
                                    </div>
                                </Pin>
                            </AdvancedMarker>
                        </Map>
                ) : (

                    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-[#1a2845]">
                        <div className="w-8 h-8 border-4 border-[#f5b800] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Overlays */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10] flex flex-col gap-2 w-full px-10 pointer-events-none">
                    {!oldPos && isMapReady && (
                        <div className="bg-white/95 dark:bg-[#0f2044]/95 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/20 shadow-2xl">
                            <p className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">
                                {isRtl ? '⚠️ أول تحديد للموقع - لا يوجد بيانات سابقة' : '⚠️ FIRST TIME SETUP - NO PREVIOUS DATA'}
                            </p>
                        </div>
                    )}
                    
                    {oldPos && isMapReady && (
                        <div className="bg-[#0f2044]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-xl self-center flex items-center gap-2 pointer-events-auto">
                            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                            <p className="text-[10px] font-black text-white uppercase tracking-wider text-center">
                                {isRtl ? `تغيير المسافة: ${distance}` : `DISTANCE SHIFT: ${distance}`}
                            </p>
                        </div>
                    )}

                    {/* External Link Shortcut */}
                    <a 
                        href={`https://www.google.com/maps/dir/?api=1&origin=${oldPos?.lat},${oldPos?.lng}&destination=${newPos.lat},${newPos.lng}&travelmode=driving`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-4 right-4 z-[10] bg-white/90 dark:bg-[#0f2044]/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 hover:bg-white dark:hover:bg-[#0f2044] transition-all pointer-events-auto group"
                        title={isRtl ? 'فتح في خرائط جوجل' : 'Open in Google Maps'}
                    >
                        <svg className="w-4 h-4 text-[#f5b800] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </div>

            {/* Address Details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border transition-all ${!oldPos ? 'bg-gray-100/50 dark:bg-white/5 border-gray-200 dark:border-white/5 opacity-60' : 'bg-white dark:bg-[#1a2845]/50 border-gray-100 dark:border-[#243460]'}`}>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        {isRtl ? 'الموقع السابق المسجل' : 'CURRENT REGISTERED LOCATION'}
                    </p>
                    <p className="text-xs font-bold text-[#0f2044] dark:text-gray-300 leading-relaxed">
                        {oldPos ? (oldAddress || (isRtl ? 'جاري جلب العنوان...' : 'Fetching address...')) : (isRtl ? 'لا يوجد موقع سابق مخزن لهذا الطالب' : 'No previous location stored for this student')}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {isRtl ? 'الموقع الجديد المطلوب' : 'REQUESTED NEW LOCATION'}
                    </p>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 leading-relaxed">
                        {newAddress || (isRtl ? 'جاري جلب العنوان...' : 'Fetching address...')}
                    </p>
                </div>
            </div>
        </div>
    );
}

