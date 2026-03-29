import React, { useState, useEffect } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  InfoWindow,
  ControlPosition,
  useMap
} from '@vis.gl/react-google-maps';
import { motion } from 'framer-motion';
import { Layers, Zap, Map as MapIcon, Navigation } from 'lucide-react';

// --- Deep Black Style (Snazzy Maps Style: Charcoal/Midnight) ---
export const deepBlackStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#12151a" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#5e6a7e" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#12151a" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#2c3544" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#1e2531" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#4b5563" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0a0c10" }] }
];

interface GoogleMapContainerProps {
  apiKey: string;
  data: Array<{ id: number; code: string; lat: number; lng: number; status: string; speed: string }>;
  isDark: boolean;
  isRTL: boolean;
}

export default function GoogleMapContainer({ apiKey, data, isDark, isRTL }: GoogleMapContainerProps) {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [showTraffic, setShowTraffic] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);

  const center = { lat: 15.3694, lng: 44.191 }; // Sana'a

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 group/map">
        <Map
          defaultCenter={center}
          defaultZoom={13}
          mapId={isDark ? "7d9c6c547846f49d" : "light_map_id"} // Consider using a real Map ID if you have advanced styles in Console
          styles={isDark ? deepBlackStyles : []}
          mapTypeId={mapType}
          disableDefaultUI={true}
          gestureHandling={'greedy'}
        >
          {/* Traffic Layer Management */}
          <TrafficLayer show={showTraffic} />

          {/* Markers */}
          {data.map((bus) => (
            <React.Fragment key={bus.id}>
              <AdvancedMarker
                position={{ lat: bus.lat, lng: bus.lng }}
                onClick={() => setSelectedBusId(bus.id)}
              >
                <motion.div 
                  whileHover={{ scale: 1.2 }}
                  className="relative cursor-pointer flex flex-col items-center group"
                >
                  <div className={`p-1.5 rounded-full border-2 border-white shadow-xl ${
                    bus.status === 'moving' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}>
                    <Navigation className={`w-3 h-3 text-white transform transition-transform ${bus.status === 'moving' ? 'animate-pulse' : ''}`} />
                  </div>
                  
                  {/* Miniature Label */}
                  <div className={`absolute -bottom-6 bg-slate-900/90 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg`}>
                    {bus.code}
                  </div>
                </motion.div>
              </AdvancedMarker>

              {/* Info Window */}
              {selectedBusId === bus.id && (
                <InfoWindow 
                  position={{ lat: bus.lat, lng: bus.lng }}
                  onCloseClick={() => setSelectedBusId(null)}
                >
                  <div className={`p-2 min-w-[140px] ${isRTL ? 'text-right' : 'text-left'} bg-white`}>
                    <p className="text-[10px] font-black text-slate-400 mb-1">{isRTL ? 'حافلة' : 'BUS'}</p>
                    <h5 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-1.5 mb-2 uppercase">{bus.code}</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${bus.status === 'moving' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="text-[10px] font-bold text-slate-600">
                              {bus.status === 'moving' ? (isRTL ? 'متحرك' : 'Moving') : (isRTL ? 'متوقف' : 'Stopped')}
                            </span>
                         </div>
                         <p className="text-[10px] font-black text-slate-400">{bus.speed}</p>
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </React.Fragment>
          ))}

          {/* --- Bottom Left Controls Overlay --- */}
          <div className={`absolute bottom-6 ${isRTL ? 'left-6' : 'right-6'} flex flex-col gap-3 z-10`}>
              {/* Traffic Toggle */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTraffic(!showTraffic)}
                className={`flex items-center justify-center gap-2 h-10 px-4 rounded-xl border backdrop-blur-md transition-all shadow-xl font-black text-[10px] tracking-widest uppercase ${
                  showTraffic 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-slate-900/80 border-slate-700 text-slate-400'
                }`}
              >
                <Zap className={`w-4 h-4 ${showTraffic ? 'fill-current' : ''}`} />
                {isRTL ? 'حركة المرور' : 'Traffic'}
              </motion.button>

              {/* Map Type Toggle */}
              <div className="bg-slate-900/80 p-1.5 border border-slate-700 rounded-2xl backdrop-blur-md flex gap-2 shadow-2xl">
                <button 
                  onClick={() => setMapType('roadmap')}
                  className={`flex-1 flex items-center justify-center h-10 px-3 rounded-xl transition-all ${mapType === 'roadmap' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <MapIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setMapType('satellite')}
                  className={`flex-1 flex items-center justify-center h-10 px-3 rounded-xl transition-all ${mapType === 'satellite' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Layers className="w-4 h-4" />
                </button>
              </div>
          </div>
        </Map>
      </div>
    </APIProvider>
  );
}

/**
 * TrafficLayer helper component
 */
function TrafficLayer({ show }: { show: boolean }) {
  const map = useMap();
  const [trafficLayer, setTrafficLayer] = useState<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map) return;
    const layer = new google.maps.TrafficLayer();
    setTrafficLayer(layer);
  }, [map]);

  useEffect(() => {
    if (!trafficLayer) return;
    trafficLayer.setMap(show ? map : null);
  }, [trafficLayer, show, map]);

  return null;
}
