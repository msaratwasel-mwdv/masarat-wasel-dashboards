import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface LocationPickerProps {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number) => void;
    readonly?: boolean;
    height?: string;
}

export default function LocationPicker({
    lat,
    lng,
    onChange,
    readonly = false,
    height = '320px',
}: LocationPickerProps) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const center = useMemo(() => {
        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
            return { lat: Number(lat), lng: Number(lng) };
        }
        return { lat: 23.5859, lng: 58.4059 }; // Muscat, Oman default
    }, [lat, lng]);

    const onLoad = useCallback(
        (mapInstance: google.maps.Map) => {
            setMap(mapInstance);
            setTimeout(() => {
                if (window.google?.maps?.event) {
                    window.google.maps.event.trigger(mapInstance, 'resize');
                    mapInstance.panTo(center);
                }
            }, 250);
        },
        [center]
    );

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    useEffect(() => {
        if (map) {
            map.panTo(center);
        }
    }, [center, map]);

    const handleMapClick = useCallback(
        (e: google.maps.MapMouseEvent) => {
            if (readonly) return;
            if (e.latLng) {
                onChange(e.latLng.lat(), e.latLng.lng());
            }
        },
        [onChange, readonly]
    );

    const handleMarkerDragEnd = useCallback(
        (e: google.maps.MapMouseEvent) => {
            if (readonly) return;
            if (e.latLng) {
                onChange(e.latLng.lat(), e.latLng.lng());
            }
        },
        [onChange, readonly]
    );

    if (loadError) {
        return (
            <div
                style={{ width: '100%', height }}
                className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-[20px] text-xs font-bold text-center gap-1"
            >
                <span>تعذر تحميل خرائط جوجل</span>
                <span className="text-[10px] text-gray-500">يرجى التحقق من الاتصال ومفتاح الخرائط</span>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div
                style={{ width: '100%', height }}
                className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[20px] text-xs font-semibold gap-2"
            >
                <div className="w-6 h-6 border-2 border-[#104382] border-t-transparent rounded-full animate-spin"></div>
                <span>جاري تحميل الخريطة...</span>
            </div>
        );
    }

    const hasLocation = lat !== null && lng !== null && !isNaN(Number(lat)) && !isNaN(Number(lng));

    const mapContainerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        minHeight: readonly ? '160px' : '280px',
    };

    return (
        <div
            style={{ width: '100%', height }}
            className="w-full rounded-[16px] sm:rounded-[24px] overflow-hidden relative z-10"
        >
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={hasLocation ? 14 : 11}
                onClick={handleMapClick}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    disableDefaultUI: false,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                    zoomControl: true,
                    draggableCursor: readonly ? 'default' : 'crosshair',
                }}
            >
                {hasLocation && (
                    <Marker
                        position={{ lat: Number(lat), lng: Number(lng) }}
                        draggable={!readonly}
                        onDragEnd={handleMarkerDragEnd}
                    />
                )}
            </GoogleMap>
        </div>
    );
}
