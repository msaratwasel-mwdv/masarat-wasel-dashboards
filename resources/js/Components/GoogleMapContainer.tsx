import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap, Map as MapIcon, AlertTriangle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface GoogleMapContainerProps {
  apiKey: string;
  data: Array<{ id: number; code: string; lat: number; lng: number; status: string; speed: string }>;
  isDark: boolean;
  isRTL: boolean;
}

export default function GoogleMapContainer({ data, isDark, isRTL }: GoogleMapContainerProps) {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: number]: any }>({});

  const centerLat = 23.5859; // Muscat, Oman
  const centerLng = 58.4059;

  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      if (!leafletMapRef.current) {
        leafletMapRef.current = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([centerLat, centerLng], 12);

        L.control.zoom({ position: isRTL ? 'topleft' : 'topright' }).addTo(leafletMapRef.current);
      }

      setMapReady(true);
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update map tiles based on type & theme
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;
    
    import('leaflet').then((L) => {
      // Clear existing layers
      leafletMapRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          leafletMapRef.current.removeLayer(layer);
        }
      });

      let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      
      if (mapType === 'satellite') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      } else if (isDark) {
        tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      }

      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(leafletMapRef.current);
    });
  }, [mapType, isDark, mapReady]);

  // Update markers
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;

    import('leaflet').then((L) => {
      // Remove old markers
      Object.values(markersRef.current).forEach((marker: any) => {
        leafletMapRef.current.removeLayer(marker);
      });
      markersRef.current = {};

      data.forEach((bus) => {
        const isMoving = bus.status === 'moving' || bus.status === 'active';
        const color = isMoving ? '#10b981' : '#f59e0b';
        
        const customIcon = L.divIcon({
          html: `<div style="
            width:32px;height:32px;
            background:${isDark ? '#1e293b' : '#ffffff'};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:2px solid ${color};
            box-shadow:0 4px 12px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            transition: all 0.3s ease;
          "><div style="
            transform:rotate(45deg);
            width:12px;height:12px;
            background:${color};
            border-radius:50%;
          "></div></div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([bus.lat, bus.lng], { icon: customIcon }).addTo(leafletMapRef.current);
        
        const popupContent = `
          <div dir="${isRTL ? 'rtl' : 'ltr'}" style="text-align: ${isRTL ? 'right' : 'left'}; min-width: 140px; padding: 4px;">
            <p style="font-size: 10px; font-weight: 900; color: #94a3b8; margin: 0 0 4px 0; text-transform: uppercase;">${isRTL ? 'حافلة' : 'BUS'}</p>
            <h5 style="font-size: 14px; font-weight: 900; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin: 0 0 8px 0; text-transform: uppercase;">${bus.code}</h5>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 6px; height: 6px; border-radius: 50%; background-color: ${color};"></div>
                <span style="font-size: 11px; font-weight: 700; color: #475569;">
                  ${isMoving ? (isRTL ? 'متحرك' : 'Moving') : (isRTL ? 'متوقف' : 'Stopped')}
                </span>
              </div>
              <p style="font-size: 11px; font-weight: 900; color: #94a3b8; margin: 0;">${bus.speed}</p>
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        
        marker.on('click', () => {
          setSelectedBusId(bus.id);
        });

        markersRef.current[bus.id] = marker;
      });

      // Fit bounds if there are buses
      if (data.length > 0) {
        const bounds = L.latLngBounds(data.map(b => [b.lat, b.lng]));
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    });
  }, [data, isDark, isRTL, mapReady]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 group/map">
      <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />

      {/* --- Bottom Left Controls Overlay --- */}
      <div className={`absolute bottom-6 ${isRTL ? 'left-6' : 'right-6'} flex flex-col gap-3 z-[1000]`}>
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
      
      {data.length === 0 && (
         <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-sm transition-all pointer-events-none">
             <div className="w-20 h-20 rounded-[24px] bg-gray-50 dark:bg-[#1a2845] flex items-center justify-center text-4xl mx-auto mb-6 grayscale opacity-60 shadow-inner">
                 📍
             </div>
             <h3 className="text-xl font-black text-[#0f2044] dark:text-white mb-2">
                 {isRTL ? "لا توجد حافلات نشطة" : "No active buses"}
             </h3>
             <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed text-center px-4">
                 {isRTL ? "في انتظار إشارات الموقع من أجهزة التتبع الخاصة بالحافلات" : "Waiting for GPS signals from bus tracking devices"}
             </p>
         </div>
      )}
    </div>
  );
}
