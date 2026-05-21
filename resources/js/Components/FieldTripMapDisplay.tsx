import React from 'react';
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

interface FieldTripMapDisplayProps {
    lat: number;
    lng: number;
    isDark?: boolean;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function FieldTripMapDisplay({ lat, lng, isDark }: FieldTripMapDisplayProps) {
    if (!API_KEY) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold">
                Google Maps API Key is missing in .env (VITE_GOOGLE_MAPS_API_KEY)
            </div>
        );
    }

    if (!lat || !lng) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900/20 text-gray-400">
                <p className="text-[10px] font-black uppercase tracking-widest">No Location Data</p>
            </div>
        );
    }

    const center = { lat, lng };

    return (
        <div className="h-full w-full relative">
            <APIProvider apiKey={API_KEY} solutionChannel="GMP_GCC_reactgooglemaps_v1">
                <Map
                    defaultCenter={center}
                    defaultZoom={15}
                    gestureHandling={"none"}
                    disableDefaultUI={true}
                    mapId="bf5047303847291a"
                    className="w-full h-full"
                    colorScheme={isDark ? "dark" : "light"}
                >
                    <AdvancedMarker position={center}>
                        <div className="relative flex items-center justify-center">
                            <div className="w-10 h-10 bg-[#0f2044] rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                                <div className="w-3 h-3 bg-[#f5b800] rounded-full animate-pulse" />
                            </div>
                            <div className="absolute -bottom-1 w-2 h-2 bg-[#0f2044] rotate-45" />
                        </div>
                    </AdvancedMarker>
                </Map>
            </APIProvider>
            {/* Transparent overlay to guarantee absolutely no interaction with the map */}
            <div className="absolute inset-0 z-[1000] cursor-default" />
        </div>
    );
}
