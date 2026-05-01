import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface FieldTripMapDisplayProps {
    lat: number;
    lng: number;
    isDark?: boolean;
}

export default function FieldTripMapDisplay({ lat, lng, isDark }: FieldTripMapDisplayProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || !lat || !lng) return;

        // Dynamic import of Leaflet
        import('leaflet').then((L) => {
            if (leafletMapRef.current) return;

            const map = L.map(mapRef.current!, {
                center: [lat, lng],
                zoom: 15,
                zoomControl: false,
                dragging: false,
                touchZoom: false,
                doubleClickZoom: false,
                scrollWheelZoom: false,
                boxZoom: false,
                keyboard: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Custom marker icon (navy color to match brand)
            const customIcon = L.divIcon({
                html: `<div style="
                    width:32px;height:32px;
                    background:#0f2044;
                    border-radius:50% 50% 50% 0;
                    transform:rotate(-45deg);
                    border:2px solid white;
                    box-shadow:0 4px 10px rgba(0,0,0,0.3);
                    display:flex;align-items:center;justify-content:center;
                "><div style="
                    transform:rotate(45deg);
                    width:10px;height:10px;
                    background:#f5b800;
                    border-radius:50%;
                "></div></div>`,
                className: '',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            });

            L.marker([lat, lng], { icon: customIcon }).addTo(map);
            leafletMapRef.current = map;
        });

        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, [lat, lng]);

    if (!lat || !lng) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900/20 text-gray-400">
                <p className="text-[10px] font-black uppercase tracking-widest">No Location Data</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative">
            <div ref={mapRef} className="h-full w-full" style={{ zIndex: 1 }} />
            {/* Overlay to ensure non-interactivity */}
            <div className="absolute inset-0 z-[1000] cursor-default" />
        </div>
    );
}
