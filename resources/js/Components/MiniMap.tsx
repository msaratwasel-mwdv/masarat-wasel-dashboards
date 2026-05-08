import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface MiniMapProps {
    lat: number;
    lng: number;
    width?: number;
    height?: number;
    zoom?: number;
}

export default function MiniMap({
    lat,
    lng,
    width = 140,
    height = 90,
    zoom = 15
}: MiniMapProps) {
    
    const isValid = lat !== null && lat !== undefined && lng !== null && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng));

    if (!isValid) {
        return (
            <div
                style={{ width: `${width}px`, height: `${height}px` }}
                className="rounded-xl bg-gray-100 dark:bg-[#0f2044]/20 flex flex-col items-center justify-center gap-1 text-gray-400 border border-gray-200 dark:border-white/5 shadow-inner"
            >
                <div className="text-xl">📍</div>
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">No Location</span>
            </div>
        );
    }

    const position = { lat: Number(lat), lng: Number(lng) };

    return (
        <div
            style={{ width: `${width}px`, height: `${height}px` }}
            className="rounded-2xl border-2 border-white dark:border-[#243460] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 relative group cursor-pointer"
        >
            <Map
                defaultCenter={position}
                defaultZoom={zoom}
                mapId="bf5047303847291a"
                disableDefaultUI={true}
                gestureHandling={'none'}
                colorScheme='light'
            >
                <AdvancedMarker position={position}>
                    <Pin background={'#0f2044'} glyphColor={'#f5b800'} borderColor={'#f5b800'} scale={0.8} />
                </AdvancedMarker>
            </Map>
            
            {/* Subtle Overlay Label */}
            <div className="absolute bottom-0 inset-x-0 bg-white/80 dark:bg-[#0f2044]/80 backdrop-blur-sm py-1 px-2 border-t border-gray-100 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[8px] font-black text-[#0f2044] dark:text-[#f5b800] uppercase tracking-widest text-center">
                    VIEW MAP
                </p>
            </div>
        </div>
    );
}

