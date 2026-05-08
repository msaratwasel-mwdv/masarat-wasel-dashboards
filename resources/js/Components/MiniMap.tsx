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
    width = 120,
    height = 80,
    zoom = 13
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
            className="rounded-xl border border-gray-200 dark:border-[#243460] overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-default"
        >
            <Map
                defaultCenter={position}
                defaultZoom={zoom}
                mapId="bf5047303847291a"
                disableDefaultUI={true}
                gestureHandling={'none'}
            >
                <AdvancedMarker position={position} />
            </Map>
        </div>
    );
}

