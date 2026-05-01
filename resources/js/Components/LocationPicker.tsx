import { useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet + React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

interface LocationPickerProps {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number) => void;
}

function LocationMarker({ lat, lng, onChange }: LocationPickerProps) {
    useMapEvents({
        click(e) {
            onChange(e.latlng.lat, e.latlng.lng);
        },
    });

    return lat === null || lng === null ? null : (
        <Marker position={[lat, lng]} />
    );
}

export default function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
    const center = useMemo(() => {
        if (lat !== null && lng !== null) return [lat, lng] as [number, number];
        return [23.5859, 58.4059] as [number, number]; // Muscat, Oman default
    }, [lat, lng]);

    return (
        <div className="h-48 w-full rounded-[25px] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner relative z-10">
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker lat={lat} lng={lng} onChange={onChange} />
            </MapContainer>
            <div className="absolute bottom-2 left-2 z-[400] bg-white/90 dark:bg-slate-800/90 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 shadow-sm border border-slate-200 dark:border-slate-700">
                {lat ? `${lat.toFixed(4)}, ${lng?.toFixed(4)}` : 'Click to pick location'}
            </div>
        </div>
    );
}
