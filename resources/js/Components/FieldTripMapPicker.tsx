import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  useMap,
  useMapsLibrary,
  ControlPosition,
  MapControl
} from '@vis.gl/react-google-maps';
import { motion } from 'framer-motion';
import { Search, Navigation, MapPin, LocateFixed } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// Custom styles to keep things premium but readable for POIs
const lightStyles = [];
const darkStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#12151a" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#748194" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#12151a" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#2c3544" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#1e2531" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0a0c10" }] }
];

interface FieldTripMapPickerProps {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number, address?: string) => void;
    isDark?: boolean;
    isRtl?: boolean;
}

export default function FieldTripMapPicker({ lat, lng, onChange, isDark, isRtl }: FieldTripMapPickerProps) {
    const defaultCenter = { lat: 23.5859, lng: 58.4059 }; // Muscat, Oman
    const center = lat && lng ? { lat, lng } : defaultCenter;

    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
            <div className="h-64 w-full rounded-[30px] overflow-hidden border-2 border-gray-100 dark:border-gray-700/50 shadow-2xl relative group/map">
                <Map
                    defaultCenter={center}
                    defaultZoom={11}
                    mapId={isDark ? "7d9c6c547846f49d" : "light_map_id"}
                    styles={isDark ? darkStyles : lightStyles}
                    disableDefaultUI={true}
                    gestureHandling={'greedy'}
                    onClick={(e) => {
                        if (e.detail.latLng) {
                            onChange(e.detail.latLng.lat, e.detail.latLng.lng);
                        }
                    }}
                >
                    <MapControls onChange={onChange} isRtl={isRtl} />
                    
                    {lat && lng && (
                        <AdvancedMarker position={{ lat, lng }}>
                            <motion.div 
                                initial={{ scale: 0, y: 10 }}
                                animate={{ scale: 1, y: 0 }}
                                className="relative flex flex-col items-center"
                            >
                                <div className="p-2 bg-brand-navy rounded-2xl shadow-xl border-2 border-white">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                                <div className="absolute -bottom-1 w-2 h-2 bg-brand-navy rotate-45 border-r border-b border-white" />
                            </motion.div>
                        </AdvancedMarker>
                    )}
                </Map>
            </div>
        </APIProvider>
    );
}

function MapControls({ onChange, isRtl }: { onChange: (lat: number, lng: number, address?: string) => void, isRtl?: boolean }) {
    const map = useMap();
    const placesLib = useMapsLibrary('places');
    const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!placesLib || !inputRef.current || !map) return;

        const sb = new placesLib.SearchBox(inputRef.current);
        setSearchBox(sb);

        sb.addListener('places_changed', () => {
            const places = sb.getPlaces();
            if (places && places.length > 0) {
                const place = places[0];
                if (place.geometry && place.geometry.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    const address = place.name || place.formatted_address;
                    
                    map.setCenter({ lat, lng });
                    map.setZoom(16);
                    onChange(lat, lng, address);
                }
            }
        });

        // Bias search to Oman
        const omanBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(16.0, 52.0),
            new google.maps.LatLng(26.0, 60.0)
        );
        sb.setBounds(omanBounds);

        return () => {
            google.maps.event.clearInstanceListeners(sb);
        };
    }, [placesLib, map]);

    const handleMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map?.setCenter({ lat, lng });
                map?.setZoom(15);
                onChange(lat, lng);
            });
        }
    };

    return (
        <>
            <MapControl position={ControlPosition.TOP_LEFT}>
                <div className={`mt-4 ${isRtl ? 'mr-4' : 'ml-4'} relative flex items-center group w-64 md:w-80`}>
                    <div className="absolute left-4 z-10">
                        <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={isRtl ? 'ابحث عن حديقة، متحف، أو وجهة...' : 'Search for park, museum, or destination...'}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 border-0 shadow-2xl backdrop-blur-md font-bold text-xs text-gray-700 dark:text-white focus:ring-2 focus:ring-brand-navy dark:focus:ring-brand-yellow transition-all outline-none"
                    />
                </div>
            </MapControl>

            <MapControl position={ControlPosition.RIGHT_BOTTOM}>
                <div className={`mb-6 ${isRtl ? 'ml-6' : 'mr-6'} flex flex-col gap-2`}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleMyLocation}
                        className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 text-brand-navy dark:text-brand-yellow"
                        title={isRtl ? 'موقعي الحالي' : 'My Location'}
                    >
                        <LocateFixed className="w-6 h-6" />
                    </motion.button>
                </div>
            </MapControl>
        </>
    );
}
