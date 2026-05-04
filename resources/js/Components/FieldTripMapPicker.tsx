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
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, LocateFixed, X, Loader2 } from 'lucide-react';

interface FieldTripMapPickerProps {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number, address?: string) => void;
    isDark?: boolean;
    isRtl?: boolean;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function FieldTripMapPicker(props: FieldTripMapPickerProps) {
    if (!API_KEY) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold">
                Google Maps API Key is missing in .env (VITE_GOOGLE_MAPS_API_KEY)
            </div>
        );
    }

    return (
        <APIProvider apiKey={API_KEY} solutionChannel="GMP_GCC_reactgooglemaps_v1">
            <GoogleMapInner {...props} />
        </APIProvider>
    );
}

function GoogleMapInner({ lat, lng, onChange, isDark, isRtl }: FieldTripMapPickerProps) {
    const map = useMap();
    const placesLib = useMapsLibrary('places');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

    const defaultCenter = { lat: 23.5859, lng: 58.4059 }; // Muscat, Oman
    const [center, setCenter] = useState(lat && lng ? { lat, lng } : defaultCenter);

    useEffect(() => {
        if (map && !placesService && placesLib) {
            setPlacesService(new placesLib.PlacesService(map));
        }
    }, [map, placesLib]);

    // Handle map click
    const onMapClick = useCallback((e: any) => {
        if (!e.detail.latLng) return;
        const { lat: newLat, lng: newLng } = e.detail.latLng;
        onChange(newLat, newLng);
        
        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
                onChange(newLat, newLng, results[0].formatted_address);
            }
        });
    }, [onChange]);

    // Search Logic
    const handleSearch = async () => {
        if (!searchQuery.trim() || !placesLib || !map) return;
        setIsSearching(true);
        
        const autocompleteService = new placesLib.AutocompleteService();
        autocompleteService.getPlacePredictions({
            input: searchQuery,
            componentRestrictions: { country: ['om', 'ye'] },
            language: isRtl ? 'ar' : 'en'
        }, (predictions, status) => {
            setIsSearching(false);
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                setSearchResults(predictions);
            } else {
                setSearchResults([]);
            }
        });
    };

    const selectSearchResult = (prediction: google.maps.places.AutocompletePrediction) => {
        if (!placesService || !map) return;

        placesService.getDetails({
            placeId: prediction.place_id,
            fields: ['geometry', 'formatted_address']
        }, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                const newLat = place.geometry.location.lat();
                const newLng = place.geometry.location.lng();
                const address = place.formatted_address;

                onChange(newLat, newLng, address);
                setCenter({ lat: newLat, lng: newLng });
                map.panTo({ lat: newLat, lng: newLng });
                map.setZoom(15);
                setSearchResults([]);
                setSearchQuery(prediction.structured_formatting.main_text);
            }
        });
    };

    const handleMyLocation = () => {
        if (!navigator.geolocation || !map) return;
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                onChange(latitude, longitude);
                map.panTo({ lat: latitude, lng: longitude });
                map.setZoom(15);
                setIsLocating(false);
            },
            () => setIsLocating(false)
        );
    };

    return (
        <div className="space-y-3 flex flex-col h-full">
            {/* Search Bar - High Z-Index */}
            <div className="relative z-[50]">
                <div className="flex items-center gap-2 bg-white dark:bg-[#1a2845] border border-gray-200 dark:border-[#243460] rounded-[14px] px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-[#f5b800] transition-all">
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value.length > 2) handleSearch();
                            else setSearchResults([]);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={isRtl ? 'ابحث عن موقع في عُمان...' : 'Search location in Oman...'}
                        className="flex-1 bg-transparent text-sm font-medium text-gray-700 dark:text-white placeholder-gray-400 focus:outline-none"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    />
                    {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f5b800]" />}
                    {searchQuery && !isSearching && (
                        <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="text-gray-400 hover:text-gray-600">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a2845] border border-gray-200 dark:border-[#243460] rounded-[14px] shadow-2xl z-[100] overflow-hidden"
                        >
                            {searchResults.map((result) => (
                                <button
                                    key={result.place_id}
                                    onClick={() => selectSearchResult(result)}
                                    className="w-full px-4 py-3 text-start text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-[#0f2044]/5 dark:hover:bg-[#0f2044]/30 flex items-start gap-2 border-b border-gray-50 dark:border-[#243460] last:border-0 transition-colors"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-[#0f2044] dark:text-[#7ba7e8] mt-0.5 flex-shrink-0" />
                                    <span className="leading-relaxed">{result.description}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Map Container - Lower Z-Index sibling */}
            <div className="relative flex-1 rounded-[20px] overflow-hidden border border-gray-200 dark:border-[#243460] shadow-lg min-h-[280px] z-[10]">
                <Map
                    defaultCenter={center}
                    defaultZoom={lat && lng ? 15 : 10}
                    onClick={onMapClick}
                    gestureHandling={'greedy'}
                    disableDefaultUI={true}
                    mapId="bf5047303847291a" // Optional: using a generic ID for advanced markers if available, otherwise it works as basic
                    className="w-full h-full"
                    theme={isDark ? 'dark' : 'light'}
                >
                    {lat && lng && (
                        <AdvancedMarker position={{ lat, lng }}>
                            <div className="relative flex items-center justify-center">
                                <div className="w-10 h-10 bg-[#0f2044] rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                                    <div className="w-3 h-3 bg-[#f5b800] rounded-full animate-pulse" />
                                </div>
                                <div className="absolute -bottom-1 w-2 h-2 bg-[#0f2044] rotate-45" />
                            </div>
                        </AdvancedMarker>
                    )}
                </Map>

                {/* My Location Button */}
                <button
                    onClick={handleMyLocation}
                    disabled={isLocating}
                    type="button"
                    className="absolute top-3 right-3 z-[40] p-2 bg-white dark:bg-[#1a2845] rounded-xl shadow-lg border border-gray-200 dark:border-[#243460] text-[#0f2044] dark:text-[#7ba7e8] hover:bg-[#0f2044] hover:text-white transition-all active:scale-95"
                >
                    <LocateFixed className={`w-5 h-5 ${isLocating ? 'animate-spin text-[#f5b800]' : ''}`} />
                </button>

                {/* Status Overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[40] pointer-events-none">
                    {!lat && !lng ? (
                        <div className="bg-white/90 dark:bg-[#0f2044]/90 backdrop-blur-md px-6 py-2 rounded-full shadow-2xl border border-white/20">
                            <p className="text-xs font-bold text-[#0f2044] dark:text-gray-200 whitespace-nowrap">
                                {isRtl ? '📍 انقر على الخريطة لتحديد موقع المدرسة' : '📍 Click map to set school location'}
                            </p>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-emerald-500/90 backdrop-blur-md px-6 py-2 rounded-full shadow-2xl border border-white/20"
                        >
                            <p className="text-xs font-bold text-white whitespace-nowrap">
                                {isRtl ? '✅ تم حفظ الموقع' : '✅ Location set'}
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Coordinates / Address Display */}
            <AnimatePresence>
                {lat && lng && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30"
                    >
                        <div className="p-2 bg-white dark:bg-[#1a2845] rounded-lg shadow-sm">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                                {isRtl ? 'الموقع المحدد' : 'Selected Location'}
                            </p>
                            <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 truncate">
                                {lat.toFixed(6)}, {lng.toFixed(6)}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onChange(0, 0, '')}
                            className="text-[11px] font-black text-red-500 hover:text-red-700 underline underline-offset-4"
                        >
                            {isRtl ? 'مسح' : 'Clear'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
