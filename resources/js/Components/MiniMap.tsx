import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MiniMapProps {
    lat: number;
    lng: number;
    width?: number;
    height?: number;
    zoom?: number;
}

// Custom simple marker for mini map
const miniMapIcon = L.divIcon({
    className: 'custom-mini-marker',
    html: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#EF4444">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
});

/**
 * MiniMap Component
 * Displays a small static Leaflet Map with a marker
 * Used for showing bus location in cards/lists
 */
export default function MiniMap({
    lat,
    lng,
    width = 120,
    height = 80,
    zoom = 13
}: MiniMapProps) {
    return (
        <div
            style={{ width: `${width}px`, height: `${height}px` }}
            className="rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden"
        >
            <MapContainer
                center={[lat, lng]}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                scrollWheelZoom={false}
                dragging={false}
                doubleClickZoom={false}
                touchZoom={false}
                attributionControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]} icon={miniMapIcon} />
            </MapContainer>
        </div>
    );
}
