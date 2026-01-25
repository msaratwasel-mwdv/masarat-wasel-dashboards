import { useEffect, useRef } from 'react';

interface MiniMapProps {
    lat: number;
    lng: number;
    width?: number;
    height?: number;
    zoom?: number;
}

/**
 * MiniMap Component
 * Displays a small static Google Map with a marker
 * Used for showing bus location in cards/lists
 */
export default function MiniMap({ 
    lat, 
    lng, 
    width = 120, 
    height = 80, 
    zoom = 13 
}: MiniMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check if Google Maps is loaded
        if (mapRef.current && window.google && window.google.maps) {
            const map = new window.google.maps.Map(mapRef.current, {
                center: { lat, lng },
                zoom,
                disableDefaultUI: true,
                gestureHandling: 'none',
                zoomControl: false,
                scrollwheel: false,
                draggable: false,
            });

            // Add marker
            new window.google.maps.Marker({
                position: { lat, lng },
                map,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#EF4444">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                    `),
                    scaledSize: new window.google.maps.Size(32, 32),
                },
            });
        }
    }, [lat, lng, zoom]);

    // Fallback if Google Maps is not loaded
    if (!window.google || !window.google.maps) {
        return (
            <div
                style={{ width: `${width}px`, height: `${height}px` }}
                className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
            >
                <span className="text-xs text-gray-400">📍 Map</span>
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            style={{ width: `${width}px`, height: `${height}px` }}
            className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden"
        />
    );
}
