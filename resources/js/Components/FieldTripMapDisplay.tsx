import { 
  APIProvider, 
  Map, 
  AdvancedMarker
} from '@vis.gl/react-google-maps';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const lightStyles = [];
const darkStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#12151a" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#748194" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#12151a" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#2c3544" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#1e2531" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0a0c10" }] }
];

interface FieldTripMapDisplayProps {
    lat: number;
    lng: number;
    isDark?: boolean;
}

export default function FieldTripMapDisplay({ lat, lng, isDark }: FieldTripMapDisplayProps) {
    if (!lat || !lng) return null;

    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <div className="h-full w-full relative group/map">
                <Map
                    defaultCenter={{ lat, lng }}
                    defaultZoom={15}
                    mapId={isDark ? "7d9c6c547846f49d" : "light_map_id"}
                    styles={isDark ? darkStyles : lightStyles}
                    disableDefaultUI={true}
                    gestureHandling={'none'} // Non-interactive as requested
                >
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
                </Map>
                
                {/* Visual Overlay to prevent any interaction */}
                <div className="absolute inset-0 z-10 cursor-default" />
            </div>
        </APIProvider>
    );
}
