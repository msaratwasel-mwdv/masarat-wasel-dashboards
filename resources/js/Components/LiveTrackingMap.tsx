import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import useTranslation from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layers, X, Users, ChevronDown, Gauge, 
    School as SchoolIcon, Navigation, MapPin, 
    Bus as BusIcon, RefreshCw, Crosshair, Activity, Clock
} from 'lucide-react';

export interface StudentAttendance {
    attendance_id: number;
    student_id: number;
    name: string;
    student_code?: string;
    status: 'present' | 'boarded' | 'dropped' | 'absent' | 'late' | 'pending' | string;
    check_in_time?: string | null;
    check_out_time?: string | null;
    extra_wait_time?: number;
    lat?: number | null;
    lng?: number | null;
    address?: string | null;
}

export interface Waypoint {
    lat: number;
    lng: number;
    student_id?: number;
    name?: string;
    status?: string;
    is_school?: boolean;
}

export interface ActiveTrip {
    id: number;
    type: 'forth' | 'back' | string;
    status: string;
    students?: StudentAttendance[];
    waypoints?: Waypoint[];
}

export interface Bus {
    id: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
    status: 'active' | 'maintenance' | 'inactive' | string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    current_latitude?: number | string | null;
    current_longitude?: number | string | null;
    trip_status?: string | null;
    driver?: { id: number; name?: string; phone?: string } | null;
    route?: { id: number; name?: string } | null;
    students_count?: number;
    students_on_board?: number;
    speed_kmh?: number;
    is_moving?: boolean;
    heading?: number;
    active_trip?: ActiveTrip | null;
    last_update?: string | null;
    last_update_seconds?: number | null;
}

interface Stats {
    total_buses: number;
    active_buses: number;
    moving_buses: number;
    total_students: number;
    students_on_board?: number;
}

interface Props {
    buses: Bus[];
    centerLat?: number;
    centerLng?: number;
    schoolLocation?: { lat: number; lng: number; name?: string };
    stats?: Stats;
    lastSyncTime?: Date;
    isSyncing?: boolean;
    onRefresh?: () => void;
}

// -------------------------------------------------------------
// HELPER: Coordinate Parser
// -------------------------------------------------------------
const parseCoord = (val: any): number | undefined => {
    if (val === null || val === undefined || val === '') return undefined;
    const parsed = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(parsed) ? undefined : parsed;
};

// -------------------------------------------------------------
// SVG MARKER: Authentic Bus Marker with Live Green / Stopped Beacon
// -------------------------------------------------------------
const createBusMarkerSvg = (bus: Bus, isSelected: boolean, isRtl: boolean = true) => {
    const isMoving = Boolean(bus.is_moving || (bus.speed_kmh && bus.speed_kmh >= 3.0));
    const bgColor = isSelected ? '#4f46e5' : isMoving ? '#059669' : '#64748b';
    const strokeColor = isSelected ? '#a5b4fc' : '#ffffff';
    const speedVal = bus.speed_kmh ? Math.round(bus.speed_kmh) : 0;
    const statusText = isRtl
        ? (isMoving ? `${speedVal} كم/س` : 'متوقفة')
        : (isMoving ? `${speedVal} km/h` : 'Stopped');
    const busNum = bus.bus_number ? (isRtl ? `باص ${bus.bus_number}` : `Bus ${bus.bus_number}`) : (isRtl ? 'باص' : 'Bus');

    const width = 100;
    const height = 62;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <defs>
                <filter id="busShadow" x="-25%" y="-25%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#090d16" flood-opacity="0.45"/>
                </filter>
            </defs>
            <!-- Badge Label with Bus ID & Live State -->
            <g filter="url(#busShadow)">
                <rect x="3" y="3" width="94" height="24" rx="12" fill="#0f172a" stroke="${bgColor}" stroke-width="2" />
                <!-- Green beacon if moving, gray if stopped -->
                <circle cx="16" cy="15" r="4.5" fill="${isMoving ? '#10b981' : '#94a3b8'}" />
                <text x="56" y="17" fill="#ffffff" font-size="10" font-weight="800" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">
                    ${busNum} • ${statusText}
                </text>
            </g>
            <!-- Bus Circle Pin Body -->
            <g filter="url(#busShadow)">
                <circle cx="50" cy="44" r="15" fill="${bgColor}" stroke="${strokeColor}" stroke-width="2.5" />
                <path d="M44 38 C44 36.5 45 36 46.5 36 L53.5 36 C55 36 56 36.5 56 38 L56 47 C56 47.5 55.5 48 55 48 L55 49.5 C55 50 54.5 50.5 54 50.5 L53.5 50.5 C53 50.5 52.5 50 52.5 49.5 L52.5 48 L47.5 48 L47.5 49.5 C47.5 50 47 50.5 46.5 50.5 L46 50.5 C45.5 50.5 45 50 45 49.5 L45 48 C44.5 48 44 47.5 44 47 Z M45.5 38 L45.5 41 L54.5 41 L54.5 38 Z M46.5 45 C47.3 45 48 44.3 48 43.5 C48 42.7 47.3 42 46.5 42 C45.7 42 45 42.7 45 43.5 C45 44.3 45.7 45 46.5 45 Z M53.5 45 C54.3 45 55 44.3 55 43.5 C55 42.7 54.3 42 53.5 42 C52.7 42 52 42.7 52 43.5 C52 44.3 52.7 45 53.5 45 Z" fill="#ffffff" />
            </g>
        </svg>
    `;

    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(width, height) : { width, height } as any,
        anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(50, 44) : { x: 50, y: 44 } as any,
    };
};

// -------------------------------------------------------------
// HELPER: Smooth Animated Bus Marker for Web
// -------------------------------------------------------------
const AnimatedBusMarker = React.memo(({
    bus,
    targetLat,
    targetLng,
    isSelected,
    isRtl = true,
    onClick,
}: {
    bus: Bus;
    targetLat: number;
    targetLng: number;
    isSelected: boolean;
    isRtl?: boolean;
    onClick: () => void;
}) => {
    const [pos, setPos] = useState({ lat: targetLat, lng: targetLng });
    const animRef = useRef<number | null>(null);
    const startPosRef = useRef({ lat: targetLat, lng: targetLng });
    const targetPosRef = useRef({ lat: targetLat, lng: targetLng });
    const startTimeRef = useRef<number>(0);
    const duration = 1500; // 1.5s smooth easing

    useEffect(() => {
        if (targetLat !== targetPosRef.current.lat || targetLng !== targetPosRef.current.lng) {
            startPosRef.current = { ...pos };
            targetPosRef.current = { lat: targetLat, lng: targetLng };
            startTimeRef.current = performance.now();

            if (animRef.current) {
                cancelAnimationFrame(animRef.current);
            }

            const step = (currentTime: number) => {
                const elapsed = currentTime - startTimeRef.current;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

                const currentLat = startPosRef.current.lat + (targetPosRef.current.lat - startPosRef.current.lat) * ease;
                const currentLng = startPosRef.current.lng + (targetPosRef.current.lng - startPosRef.current.lng) * ease;

                setPos({ lat: currentLat, lng: currentLng });

                if (progress < 1) {
                    animRef.current = requestAnimationFrame(step);
                }
            };

            animRef.current = requestAnimationFrame(step);
        }

        return () => {
            if (animRef.current) {
                cancelAnimationFrame(animRef.current);
            }
        };
    }, [targetLat, targetLng]);

    return (
        <Marker 
            position={pos}
            icon={createBusMarkerSvg(bus, isSelected, isRtl)}
            title={`${isRtl ? 'حافلة' : 'Bus'} ${bus.bus_number} (${bus.plate_number})`}
            zIndex={isSelected ? 90 : 50}
            onClick={onClick}
        />
    );
});

// -------------------------------------------------------------
// SVG MARKER: Student Pickup Stop Pin with Numbered Sequence
// -------------------------------------------------------------
const createStudentMarkerSvg = (status: string, studentName: string, stopNumber: number) => {
    let pinColor = '#2563eb'; // Default Blue (مجدول)

    if (status === 'present' || status === 'boarded') {
        pinColor = '#059669'; // Emerald (صعد)
    } else if (status === 'dropped') {
        pinColor = '#0284c7'; // Sky (تم التوصيل)
    } else if (status === 'absent') {
        pinColor = '#e11d48'; // Rose (غائب)
    } else if (status === 'late') {
        pinColor = '#d97706'; // Amber (بالانتظار)
    }

    const width = 40;
    const height = 50;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <defs>
                <filter id="stuShadow" x="-25%" y="-20%" width="150%" height="150%">
                    <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.35"/>
                </filter>
            </defs>
            <g filter="url(#stuShadow)">
                <!-- Teardrop Pin -->
                <path d="M20 47 C20 47 35 31 35 19 C35 9.5 28.3 2 20 2 C11.7 2 5 9.5 5 19 C5 31 20 47 20 47 Z" fill="${pinColor}" stroke="#ffffff" stroke-width="2.2" />
                <!-- Center Inner Circle -->
                <circle cx="20" cy="19" r="10" fill="#ffffff" />
                <!-- Stop Number inside -->
                <text x="20" y="23.5" fill="${pinColor}" font-size="11.5" font-weight="900" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">
                    ${stopNumber}
                </text>
            </g>
        </svg>
    `;

    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(width, height) : { width, height } as any,
        anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(20, 47) : { x: 20, y: 47 } as any,
    };
};

// -------------------------------------------------------------
// SVG MARKER: School Landmark Pin
// -------------------------------------------------------------
const createSchoolMarkerSvg = (schoolName: string = 'المدرسة') => {
    const width = 110;
    const height = 58;
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <defs>
                <filter id="schShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.4"/>
                </filter>
            </defs>
            <g filter="url(#schShadow)">
                <rect x="5" y="2" width="100" height="22" rx="11" fill="#dc2626" stroke="#ffffff" stroke-width="2" />
                <text x="55" y="16" fill="#ffffff" font-size="10" font-weight="bold" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">
                    ${schoolName}
                </text>
            </g>
            <g filter="url(#schShadow)">
                <circle cx="55" cy="42" r="14" fill="#dc2626" stroke="#ffffff" stroke-width="2.5" />
                <path d="M55 35 L63 39 L55 43 L47 39 Z M49 41 L49 45 C49 46.5 51.5 48 55 48 C58.5 48 61 46.5 61 45 L61 41 L55 44 Z" fill="#ffffff" />
            </g>
        </svg>
    `;
    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(width, height) : { width, height } as any,
        anchor: typeof window !== 'undefined' && window.google ? new window.google.maps.Point(55, 42) : { x: 55, y: 42 } as any,
    };
};

export default function LiveTrackingMap({ 
    buses = [], 
    centerLat = 13.9407, 
    centerLng = 43.7873,
    schoolLocation,
    stats,
    lastSyncTime,
    isSyncing = false,
    onRefresh
}: Props) {
    const { t, isRtl } = useTranslation();

    // Active Selection State
    const [selectedBusId, setSelectedBusId] = useState<number | 'all'>('all');
    const [selectedStudent, setSelectedStudent] = useState<{ student: StudentAttendance; bus: Bus; stopNumber: number } | null>(null);

    // Layer Controls
    // By default: student stops are shown, auto-follow is available, and route straight line is optional
    const [showStudentStops, setShowStudentStops] = useState<boolean>(true);
    const [showRoutePath, setShowRoutePath] = useState<boolean>(false); // Off by default to avoid artificial straight lines
    const [autoFollow, setAutoFollow] = useState<boolean>(false);
    const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

    // Google Maps Loader
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const initialBoundsFittedRef = useRef<boolean>(false);

    // Initial map centering ref (stable reference that NEVER triggers re-centering)
    const initialCenterRef = useRef<{ lat: number; lng: number }>({
        lat: schoolLocation?.lat || centerLat || 13.9407,
        lng: schoolLocation?.lng || centerLng || 43.7873
    });

    const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(mapInstance);
        if (!initialBoundsFittedRef.current) {
            initialBoundsFittedRef.current = true;
            const refLat = schoolLocation?.lat || 13.9407;
            const refLng = schoolLocation?.lng || 43.7873;
            mapInstance.setCenter({ lat: refLat, lng: refLng });
            mapInstance.setZoom(14);
        }
    }, [schoolLocation?.lat, schoolLocation?.lng]);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    const safeBuses = useMemo(() => Array.isArray(buses) ? buses : [], [buses]);

    // Buses with valid coordinates
    const busesWithLocation = useMemo(() => {
        return safeBuses.filter(bus => {
            if (!bus) return false;
            const lat = parseCoord(bus.current_latitude ?? bus.latitude);
            const lng = parseCoord(bus.current_longitude ?? bus.longitude);
            return lat !== undefined && lng !== undefined;
        });
    }, [safeBuses]);

    // Currently focused bus (if any)
    const selectedBus = useMemo(() => {
        if (selectedBusId === 'all') return null;
        return safeBuses.find(b => b.id === selectedBusId) || null;
    }, [safeBuses, selectedBusId]);

    // Active buses to show on map (either all buses with location, or the filtered one)
    const visibleBuses = useMemo(() => {
        if (selectedBusId === 'all') return busesWithLocation;
        return busesWithLocation.filter(b => b.id === selectedBusId);
    }, [busesWithLocation, selectedBusId]);

    // -------------------------------------------------------------
    // Auto Follow: Smoothly pan to selected bus coordinates
    // -------------------------------------------------------------
    useEffect(() => {
        if (map && selectedBus && autoFollow) {
            const lat = parseCoord(selectedBus.current_latitude ?? selectedBus.latitude);
            const lng = parseCoord(selectedBus.current_longitude ?? selectedBus.longitude);
            if (lat !== undefined && lng !== undefined) {
                map.panTo({ lat, lng });
            }
        }
    }, [map, selectedBus?.current_latitude, selectedBus?.current_longitude, selectedBus?.latitude, selectedBus?.longitude, autoFollow]);

    // -------------------------------------------------------------
    // OPTIONAL DUAL-TONE ROUTE (If user manually enables it)
    // -------------------------------------------------------------
    const busRoutes = useMemo(() => {
        if (!showRoutePath) return [];

        const targets = selectedBus ? [selectedBus] : busesWithLocation;

        return targets.map(bus => {
            const busLat = parseCoord(bus.current_latitude ?? bus.latitude);
            const busLng = parseCoord(bus.current_longitude ?? bus.longitude);
            if (busLat === undefined || busLng === undefined) return null;

            const waypoints = bus.active_trip?.waypoints || [];
            if (waypoints.length === 0) return null;

            const currentPos = { lat: busLat, lng: busLng };

            const traveledPoints: { lat: number; lng: number }[] = [
                ...waypoints.map(w => ({ lat: w.lat, lng: w.lng })),
                currentPos
            ];

            return {
                busId: bus.id,
                traveledPoints,
            };
        }).filter(Boolean);
    }, [showRoutePath, selectedBus, busesWithLocation]);

    // -------------------------------------------------------------
    // STUDENT STOPS: NUMBERED SEQUENTIAL STATIONS
    // -------------------------------------------------------------
    const studentStops = useMemo(() => {
        if (!showStudentStops) return [];

        const targets = selectedBus ? [selectedBus] : visibleBuses;
        const stops: { student: StudentAttendance; bus: Bus; lat: number; lng: number; stopNumber: number }[] = [];

        targets.forEach(bus => {
            const students = bus.active_trip?.students || [];
            let stopCounter = 1;
            students.forEach(st => {
                const lat = parseCoord(st.lat);
                const lng = parseCoord(st.lng);
                if (lat !== undefined && lng !== undefined) {
                    stops.push({ 
                        student: st, 
                        bus, 
                        lat, 
                        lng, 
                        stopNumber: stopCounter++ 
                    });
                }
            });
        });

        return stops;
    }, [showStudentStops, selectedBus, visibleBuses]);


    const handleSelectBus = (busId: number | 'all') => {
        setSelectedBusId(busId);
        setSelectedStudent(null);

        if (busId !== 'all') {
            const bus = safeBuses.find(b => b.id === busId);
            if (bus && map) {
                const lat = parseCoord(bus.current_latitude ?? bus.latitude);
                const lng = parseCoord(bus.current_longitude ?? bus.longitude);
                if (lat !== undefined && lng !== undefined) {
                    map.panTo({ lat, lng });
                    map.setZoom(16);
                }
            }
        }
    };

    return (
        <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden bg-slate-900 select-none">
            
            {/* --- GOOGLE MAP CANVAS --- */}
            {isLoaded ? (
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={initialCenterRef.current}
                    zoom={14}
                    options={{
                        mapTypeId: mapType,
                        disableDefaultUI: false,
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        styles: mapType === 'roadmap' ? [
                            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                            { featureType: 'transit', stylers: [{ visibility: 'simplified' }] }
                        ] : undefined,
                    }}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onDragStart={() => {
                        if (autoFollow) {
                            setAutoFollow(false);
                        }
                    }}
                    onClick={() => {
                        setSelectedStudent(null);
                    }}
                >
                    {/* OPTIONAL ROUTE LINE (Disabled by default to avoid unrealistic straight lines) */}
                    {showRoutePath && busRoutes.map((route: any) => (
                        <Polyline
                            key={`route-${route.busId}`}
                            path={route.traveledPoints}
                            options={{
                                strokeColor: '#2563eb',
                                strokeOpacity: 0.75,
                                strokeWeight: 4,
                                zIndex: 10,
                                geodesic: true,
                            }}
                        />
                    ))}

                    {/* SCHOOL LANDMARK PIN */}
                    {schoolLocation && schoolLocation.lat && schoolLocation.lng && (
                        <Marker
                            key="school-landmark"
                            position={{ lat: schoolLocation.lat, lng: schoolLocation.lng }}
                            icon={createSchoolMarkerSvg(schoolLocation.name || (isRtl ? 'مقر المدرسة' : 'School Campus'))}
                            title={schoolLocation.name || (isRtl ? 'المدرسة' : 'School')}
                            zIndex={100}
                            onClick={() => {
                                if (map) {
                                    map.panTo({ lat: schoolLocation.lat, lng: schoolLocation.lng });
                                    map.setZoom(16);
                                }
                            }}
                        />
                    )}

                    {/* NUMBERED STUDENT PICKUP STOP MARKERS */}
                    {studentStops.map(({ student, bus, lat, lng, stopNumber }) => (
                        <Marker
                            key={`stop-${student.attendance_id}-${student.student_id}`}
                            position={{ lat, lng }}
                            icon={createStudentMarkerSvg(student.status, student.name, stopNumber)}
                            title={`${isRtl ? 'محطة' : 'Stop'} ${stopNumber}: ${student.name}`}
                            zIndex={40}
                            onClick={() => setSelectedStudent({ student, bus, stopNumber })}
                        />
                    ))}

                    {/* STUDENT INFO WINDOW */}
                    {selectedStudent && selectedStudent.student.lat && selectedStudent.student.lng && (
                        <InfoWindow
                            position={{ 
                                lat: Number(selectedStudent.student.lat), 
                                lng: Number(selectedStudent.student.lng) 
                            }}
                            onCloseClick={() => setSelectedStudent(null)}
                        >
                            <div className={`p-2.5 min-w-[220px] ${isRtl ? 'text-right' : 'text-left'} font-sans`} dir={isRtl ? 'rtl' : 'ltr'}>
                                <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-900 text-white font-mono">
                                                {isRtl ? 'محطة' : 'Stop'} {selectedStudent.stopNumber}
                                            </span>
                                            <h4 className="font-bold text-xs text-slate-900 leading-tight">
                                                {selectedStudent.student.name}
                                            </h4>
                                        </div>
                                        <p className="text-[10px] font-mono text-slate-500">
                                            {selectedStudent.student.student_code || (isRtl ? 'كود غير متوفر' : 'No Code')}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        selectedStudent.student.status === 'present' || selectedStudent.student.status === 'boarded'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : selectedStudent.student.status === 'dropped'
                                            ? 'bg-sky-100 text-sky-700'
                                            : selectedStudent.student.status === 'absent'
                                            ? 'bg-rose-100 text-rose-700'
                                            : selectedStudent.student.status === 'late'
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {selectedStudent.student.status === 'present' || selectedStudent.student.status === 'boarded' ? (isRtl ? 'صعد للحافلة' : 'Boarded') :
                                         selectedStudent.student.status === 'dropped' ? (isRtl ? 'تم التوصيل' : 'Dropped') :
                                         selectedStudent.student.status === 'absent' ? (isRtl ? 'غائب' : 'Absent') :
                                         selectedStudent.student.status === 'late' ? (isRtl ? 'في الانتظار' : 'Waiting') : (isRtl ? 'مجدول' : 'Scheduled')}
                                    </span>
                                </div>

                                <div className="space-y-1.5 text-[11px] text-slate-600">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">{isRtl ? 'الحافلة:' : 'Bus:'}</span>
                                        <span className="font-bold text-slate-800">{selectedStudent.bus.bus_number}</span>
                                    </div>

                                    {selectedStudent.student.extra_wait_time ? (
                                        <div className="flex items-center justify-between text-amber-600 font-semibold">
                                            <span>{isRtl ? 'وقت الانتظار الإضافي:' : 'Extra wait time:'}</span>
                                            <span className="font-mono">+{selectedStudent.student.extra_wait_time} {isRtl ? 'دقيقة' : 'min'}</span>
                                        </div>
                                    ) : null}

                                    {selectedStudent.student.check_in_time ? (
                                        <div className="flex items-center justify-between text-emerald-600 font-semibold">
                                            <span>{isRtl ? 'وقت الصعود:' : 'Boarding time:'}</span>
                                            <span className="font-mono">{selectedStudent.student.check_in_time}</span>
                                        </div>
                                    ) : null}

                                    {selectedStudent.student.address && (
                                        <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-100 truncate flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span>{selectedStudent.student.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </InfoWindow>
                    )}

                    {/* BUS MARKERS WITH LIVE GREEN / STOPPED INDICATOR */}
                    {visibleBuses.map(bus => {
                        const lat = parseCoord(bus.current_latitude ?? bus.latitude);
                        const lng = parseCoord(bus.current_longitude ?? bus.longitude);
                        if (lat === undefined || lng === undefined) return null;

                        const isSelected = selectedBus?.id === bus.id;

                        return (
                            <AnimatedBusMarker
                                key={`bus-marker-${bus.id}`}
                                bus={bus}
                                targetLat={lat}
                                targetLng={lng}
                                isSelected={isSelected}
                                isRtl={isRtl}
                                onClick={() => handleSelectBus(bus.id)}
                            />
                        );
                    })}
                </GoogleMap>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold tracking-wide">{isRtl ? 'جاري تحميل خريطة الأسطول الميداني...' : 'Loading live fleet tracking map...'}</p>
                </div>
            )}

            {/* --- TOP COMMAND BAR (HUD & CONTROLS) --- */}
            <div className="absolute top-4 inset-x-4 md:inset-x-6 z-[45] flex justify-center pointer-events-none">
                <div className="flex items-center justify-between gap-2 lg:gap-3 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-slate-200/80 dark:border-white/10 pointer-events-auto max-w-7xl w-full flex-nowrap overflow-x-auto no-scrollbar">
                    
                    {/* Live Telemetry Metrics */}
                    <div className="flex items-center gap-1.5 md:gap-2 shrink-0 flex-nowrap">
                        {/* Live Ping Beacon */}
                        <div className="flex items-center gap-1.5 px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black shrink-0">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="hidden sm:inline">{isRtl ? "بث حي فوري" : "Live Stream"}</span>
                        </div>

                        {/* Metric: Moving Buses */}
                        {stats && (
                            <div className="flex items-center gap-1 px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>{isRtl ? "متحركة:" : "Moving:"}</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400">{stats.moving_buses}</span>
                            </div>
                        )}

                        {/* Metric: Stopped Buses */}
                        {stats && (
                            <div className="flex items-center gap-1 px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                <span>{isRtl ? "متوقفة:" : "Stopped:"}</span>
                                <span className="font-mono">{stats.total_buses - stats.moving_buses}</span>
                            </div>
                        )}

                        {/* Metric: Students Onboard */}
                        {stats && stats.students_on_board !== undefined && (
                            <div className="flex items-center gap-1 px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span className="hidden md:inline">{isRtl ? "على المتن:" : "Onboard:"}</span>
                                <span className="font-mono text-amber-600 dark:text-amber-400">{stats.students_on_board}</span>
                            </div>
                        )}

                        {/* Refresh */}
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                disabled={isSyncing}
                                title={lastSyncTime ? (isRtl ? `آخر تحديث: ${lastSyncTime.toLocaleTimeString('ar-SA')}` : `Last sync: ${lastSyncTime.toLocaleTimeString('en-US')}`) : (isRtl ? 'تحديث فوري' : 'Sync now')}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                            </button>
                        )}
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-1.5 md:gap-2 shrink-0 flex-nowrap">
                        
                        {/* Bus Filter Dropdown */}
                        <div className="relative shrink-0">
                            <select
                                value={selectedBusId}
                                onChange={(e) => handleSelectBus(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                aria-label={isRtl ? "فلترة الحافلة" : "Filter bus"}
                                className={`text-xs font-bold ${isRtl ? 'pl-7 pr-2.5' : 'pr-7 pl-2.5'} py-1 md:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-0 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none`}
                            >
                                <option value="all">{isRtl ? `كل الأسطول (${safeBuses.length})` : `All Fleet (${safeBuses.length})`}</option>
                                {safeBuses.map(b => {
                                    const isM = Boolean(b.is_moving || (b.speed_kmh && b.speed_kmh >= 3.0));
                                    return (
                                        <option key={`hud-bus-${b.id}`} value={b.id}>
                                            {isRtl ? `حافلة ${b.bus_number}` : `Bus ${b.bus_number}`} ({isM ? (isRtl ? '🟢 متحركة' : '🟢 Moving') : (isRtl ? '⚪ متوقفة' : '⚪ Stopped')})
                                        </option>
                                    );
                                })}
                            </select>
                            <ChevronDown className={`absolute ${isRtl ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none`} />
                        </div>

                        {/* School Center Button */}
                        {schoolLocation && schoolLocation.lat && schoolLocation.lng && (
                            <button
                                onClick={() => {
                                    if (map && schoolLocation.lat && schoolLocation.lng) {
                                        map.panTo({ lat: schoolLocation.lat, lng: schoolLocation.lng });
                                        map.setZoom(16);
                                        setSelectedBusId('all');
                                    }
                                }}
                                title={isRtl ? 'الانتقال لمقر المدرسة' : 'Go to School Campus'}
                                className="px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                            >
                                <SchoolIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{schoolLocation.name || (isRtl ? 'المدرسة' : 'School')}</span>
                            </button>
                        )}

                        {/* Student Stops Toggle */}
                        <button
                            onClick={() => setShowStudentStops(prev => !prev)}
                            title={showStudentStops ? (isRtl ? 'إخفاء محطات الطلاب' : 'Hide student stops') : (isRtl ? 'إظهار محطات الطلاب المرقمة' : 'Show numbered student stops')}
                            className={`px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                                showStudentStops
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{isRtl ? `المحطات (${studentStops.length})` : `Stops (${studentStops.length})`}</span>
                        </button>

                        {/* Route Line Toggle */}
                        <button
                            onClick={() => setShowRoutePath(prev => !prev)}
                            title={showRoutePath ? (isRtl ? 'إخفاء خط المسار' : 'Hide route line') : (isRtl ? 'إظهار خط المسار التوصيلي' : 'Show connected route line')}
                            className={`px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                                showRoutePath
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Navigation className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isRtl ? "خط المسار" : "Route"}</span>
                        </button>

                        {/* Auto-Follow Toggle */}
                        {selectedBus && (
                            <button
                                onClick={() => setAutoFollow(prev => !prev)}
                                title={autoFollow ? (isRtl ? 'إلغاء المتابعة التلقائية للكاميرا' : 'Disable auto camera tracking') : (isRtl ? 'متابعة حركة الحافلة بالكاميرا تلقائياً' : 'Follow bus with camera')}
                                className={`px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                                    autoFollow
                                        ? 'bg-emerald-600 text-white shadow-sm animate-pulse'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Crosshair className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{isRtl ? "متابعة" : "Follow"}</span>
                            </button>
                        )}

                        {/* Map Mode (Roadmap vs Satellite) */}
                        <button
                            onClick={() => setMapType(prev => prev === 'roadmap' ? 'satellite' : 'roadmap')}
                            title={mapType === 'roadmap' ? (isRtl ? 'عرض القمر الصناعي' : 'Satellite view') : (isRtl ? 'عرض الخريطة العادية' : 'Roadmap view')}
                            className="px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">{mapType === 'roadmap' ? (isRtl ? 'قمر صناعي' : 'Satellite') : (isRtl ? 'عادي' : 'Map')}</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* --- SELECTED BUS TELEMETRY DRAWER CARD --- */}
            <AnimatePresence>
                {selectedBus && (
                    <motion.div
                        initial={{ opacity: 0, x: isRtl ? -30 : 30, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: isRtl ? -30 : 30, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        className={`absolute top-20 ${isRtl ? 'left-4 md:left-6' : 'right-4 md:right-6'} z-[46] w-72 md:w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-200/80 dark:border-white/10`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3 mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
                                    selectedBus.is_moving ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    <BusIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">
                                        {isRtl ? `حافلة ${selectedBus.bus_number}` : `Bus ${selectedBus.bus_number}`}
                                    </h3>
                                    <p className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase">
                                        {selectedBus.plate_number}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedBusId('all')}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Prominent Live Movement Banner */}
                        <div className={`p-2.5 rounded-2xl mb-3 flex items-center justify-between ${
                            selectedBus.is_moving
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'
                        }`}>
                            <div className="flex items-center gap-2 text-xs font-bold">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                    selectedBus.is_moving ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                                }`}></span>
                                <span>
                                    {selectedBus.is_moving 
                                        ? (isRtl ? 'الحافلة متحركة ميدانياً' : 'Bus in motion') 
                                        : (isRtl ? 'الحافلة متوقفة' : 'Bus is stopped')}
                                </span>
                            </div>
                            <span className="font-mono font-black text-xs">
                                {selectedBus.is_moving 
                                    ? `${Math.round(selectedBus.speed_kmh || 0)} ${isRtl ? 'كم/س' : 'km/h'}` 
                                    : `0 ${isRtl ? 'كم/س' : 'km/h'}`}
                            </span>
                        </div>

                        {/* Telemetry Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold mb-1">
                                    <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>{isRtl ? "السرعة الحقيقية" : "Live Speed"}</span>
                                </div>
                                <div className="font-mono font-black text-sm text-slate-800 dark:text-white">
                                    {selectedBus.speed_kmh && selectedBus.speed_kmh > 0 
                                        ? `${Math.round(selectedBus.speed_kmh)} ${isRtl ? 'كم/س' : 'km/h'}` 
                                        : `0 ${isRtl ? 'كم/س' : 'km/h'}`}
                                </div>
                            </div>

                            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold mb-1">
                                    <Users className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{isRtl ? "على المتن" : "Onboard"}</span>
                                </div>
                                <div className="font-mono font-black text-sm text-slate-800 dark:text-white">
                                    {selectedBus.students_on_board ?? 0} / {selectedBus.capacity}
                                </div>
                            </div>
                        </div>

                        {/* Driver & Trip Info */}
                        <div className="space-y-2 text-xs">
                            {selectedBus.driver && (
                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200">
                                    <span className="text-slate-400 text-[11px]">{isRtl ? "السائق:" : "Driver:"}</span>
                                    <span className="font-bold">{selectedBus.driver.name}</span>
                                </div>
                            )}

                            {selectedBus.route && (
                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-200">
                                    <span className="text-slate-400 text-[11px]">{isRtl ? "المسار:" : "Route:"}</span>
                                    <span className="font-bold truncate max-w-[140px]">{selectedBus.route.name}</span>
                                </div>
                            )}

                            {selectedBus.last_update && (
                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-500 text-[11px]">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{isRtl ? "آخر إشارة:" : "Last Ping:"}</span>
                                    </span>
                                    <span className="font-semibold">{selectedBus.last_update}</span>
                                </div>
                            )}
                        </div>

                        {/* Action: Center Camera */}
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex gap-2">
                            <button
                                onClick={() => {
                                    if (map) {
                                        const lat = parseCoord(selectedBus.current_latitude ?? selectedBus.latitude);
                                        const lng = parseCoord(selectedBus.current_longitude ?? selectedBus.longitude);
                                        if (lat !== undefined && lng !== undefined) {
                                            map.panTo({ lat, lng });
                                            map.setZoom(16);
                                        }
                                    }
                                }}
                                className="flex-1 py-2 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                            >
                                <Crosshair className="w-3.5 h-3.5" />
                                <span>{isRtl ? "تركيز الكاميرا" : "Focus Camera"}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
