import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GoogleMap, Marker, Polyline, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import useTranslation from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layers, X, Users, ChevronDown, Gauge, 
    School as SchoolIcon, Navigation, MapPin, 
    Bus as BusIcon, RefreshCw, Crosshair, Activity, Clock,
    Search, Maximize2, Minimize2, Filter, SlidersHorizontal, RotateCcw
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
    school_id?: number;
    school?: { id: number; name: string; lat?: number | null; lng?: number | null } | null;
}

export interface SchoolItem {
    id: number;
    name: string;
    lat?: number | null;
    lng?: number | null;
    latitude?: number | null;
    longitude?: number | null;
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
    schools?: SchoolItem[];
    selectedSchoolId?: number | 'all';
    onSelectSchool?: (schoolId: number | 'all') => void;
    stats?: Stats;
    lastSyncTime?: Date;
    isSyncing?: boolean;
    onRefresh?: () => void;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
    height?: string;
    className?: string;
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
    schools,
    selectedSchoolId,
    onSelectSchool,
    stats,
    lastSyncTime,
    isSyncing = false,
    onRefresh,
    isFullscreen = false,
    onToggleFullscreen,
    height,
    className,
}: Props) {
    const { t, isRtl } = useTranslation();

    // Multi-dimensional Filtering State
    const [currentSchoolId, setCurrentSchoolId] = useState<number | 'all'>(selectedSchoolId ?? 'all');
    const [selectedBusId, setSelectedBusId] = useState<number | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'moving' | 'stopped' | 'trip'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<{ student: StudentAttendance; bus: Bus; stopNumber: number } | null>(null);

    // Collapsible Drawer State (Default closed so the map is 100% visible and clean)
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

    // Active filters count for badge indicator
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (currentSchoolId !== 'all') count++;
        if (selectedBusId !== 'all') count++;
        if (statusFilter !== 'all') count++;
        if (searchQuery.trim().length > 0) count++;
        return count;
    }, [currentSchoolId, selectedBusId, statusFilter, searchQuery]);

    const handleResetFilters = useCallback(() => {
        setCurrentSchoolId('all');
        setSelectedBusId('all');
        setStatusFilter('all');
        setSearchQuery('');
    }, []);

    // Sync external selectedSchoolId
    useEffect(() => {
        if (selectedSchoolId !== undefined) {
            setCurrentSchoolId(selectedSchoolId);
        }
    }, [selectedSchoolId]);

    // Layer Controls
    const [showStudentStops, setShowStudentStops] = useState<boolean>(true);
    const [showRoutePath, setShowRoutePath] = useState<boolean>(false);
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
        lat: schoolLocation?.lat || (schools && schools.length > 0 && (schools[0].lat || schools[0].latitude)) || centerLat || 13.9407,
        lng: schoolLocation?.lng || (schools && schools.length > 0 && (schools[0].lng || schools[0].longitude)) || centerLng || 43.7873
    });

    const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(mapInstance);
        if (!initialBoundsFittedRef.current) {
            initialBoundsFittedRef.current = true;
            const refLat = schoolLocation?.lat || (schools && schools.length > 0 && (schools[0].lat || schools[0].latitude)) || centerLat || 13.9407;
            const refLng = schoolLocation?.lng || (schools && schools.length > 0 && (schools[0].lng || schools[0].longitude)) || centerLng || 43.7873;
            mapInstance.setCenter({ lat: Number(refLat), lng: Number(refLng) });
            mapInstance.setZoom(13);
        }
    }, [schoolLocation?.lat, schoolLocation?.lng, schools, centerLat, centerLng]);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    // Fullscreen Keyboard (Esc) & Body Overflow Handling
    useEffect(() => {
        if (!isFullscreen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onToggleFullscreen) {
                onToggleFullscreen();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        if (map) {
            setTimeout(() => {
                window.google?.maps?.event?.trigger(map, 'resize');
            }, 200);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = prevOverflow;
            if (map) {
                setTimeout(() => {
                    window.google?.maps?.event?.trigger(map, 'resize');
                }, 200);
            }
        };
    }, [isFullscreen, onToggleFullscreen, map]);

    const safeBuses = useMemo(() => Array.isArray(buses) ? buses : [], [buses]);

    // Buses filtered by School, Status, and Search Query
    const filteredBuses = useMemo(() => {
        return safeBuses.filter(bus => {
            if (!bus) return false;

            // Filter by school
            if (currentSchoolId !== 'all' && bus.school_id !== currentSchoolId) {
                return false;
            }

            // Filter by status
            const isMoving = Boolean(bus.is_moving || (bus.speed_kmh && bus.speed_kmh >= 3.0));
            if (statusFilter === 'moving' && !isMoving) return false;
            if (statusFilter === 'stopped' && isMoving) return false;
            if (statusFilter === 'trip' && bus.trip_status !== 'in_progress') return false;

            // Search query
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchNum = bus.bus_number?.toString().toLowerCase().includes(q);
                const matchPlate = bus.plate_number?.toLowerCase().includes(q);
                const matchDriver = bus.driver?.name?.toLowerCase().includes(q);
                const matchRoute = bus.route?.name?.toLowerCase().includes(q);
                const matchSchool = bus.school?.name?.toLowerCase().includes(q);
                if (!matchNum && !matchPlate && !matchDriver && !matchRoute && !matchSchool) {
                    return false;
                }
            }

            return true;
        });
    }, [safeBuses, currentSchoolId, statusFilter, searchQuery]);

    // Handle school selection with camera pan
    const handleSelectSchool = (schoolId: number | 'all') => {
        setCurrentSchoolId(schoolId);
        if (onSelectSchool) onSelectSchool(schoolId);
        setSelectedBusId('all');

        if (schoolId !== 'all' && schools && map) {
            const sch = schools.find(s => s.id === schoolId);
            const sLat = parseCoord(sch?.lat ?? sch?.latitude);
            const sLng = parseCoord(sch?.lng ?? sch?.longitude);
            if (sLat !== undefined && sLng !== undefined) {
                map.panTo({ lat: sLat, lng: sLng });
                map.setZoom(15);
            }
        }
    };

    // Buses for dropdown based only on selected school
    const busesForDropdown = useMemo(() => {
        if (currentSchoolId === 'all') return safeBuses;
        return safeBuses.filter(b => b.school_id === currentSchoolId);
    }, [safeBuses, currentSchoolId]);

    // Buses with valid coordinates
    const busesWithLocation = useMemo(() => {
        return filteredBuses.filter(bus => {
            const lat = parseCoord(bus.current_latitude ?? bus.latitude);
            const lng = parseCoord(bus.current_longitude ?? bus.longitude);
            return lat !== undefined && lng !== undefined;
        });
    }, [filteredBuses]);

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

    const containerClasses = isFullscreen
        ? 'fixed inset-0 z-[999999] w-screen h-screen overflow-hidden bg-slate-900 select-none'
        : `relative w-full ${className || 'rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-xl'} overflow-hidden bg-slate-900 select-none`;

    const containerStyles: React.CSSProperties = isFullscreen
        ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: 999999, margin: 0, padding: 0 }
        : { height: height || 'calc(100vh - 80px)' };

    const mapElement = (
        <div 
            className={containerClasses}
            style={containerStyles}
        >
            
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

                    {/* SCHOOL LANDMARK PINS */}
                    {schools && schools.length > 0 ? (
                        schools.map((sch) => {
                            const sLat = parseCoord(sch.lat ?? sch.latitude);
                            const sLng = parseCoord(sch.lng ?? sch.longitude);
                            if (sLat === undefined || sLng === undefined) return null;
                            const isSelected = currentSchoolId === sch.id;
                            return (
                                <Marker
                                    key={`school-landmark-${sch.id}`}
                                    position={{ lat: sLat, lng: sLng }}
                                    icon={createSchoolMarkerSvg(sch.name)}
                                    title={sch.name}
                                    zIndex={isSelected ? 105 : 98}
                                    onClick={() => handleSelectSchool(sch.id)}
                                />
                            );
                        })
                    ) : schoolLocation && schoolLocation.lat && schoolLocation.lng ? (
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
                    ) : null}

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

            {/* --- TOP COMMAND DECK (SLIM SINGLE-TIER HUD) --- */}
            <div className="absolute top-3 inset-x-3 md:inset-x-5 z-[45] pointer-events-none">
                <div className="flex items-center justify-between gap-2 pointer-events-auto flex-wrap">
                    
                    {/* Telemetry Metrics Pod */}
                    <div className="flex items-center gap-1.5 md:gap-2 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/80 dark:border-white/10 shrink-0">
                        {/* Live Ping Beacon */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black shrink-0">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>{isRtl ? "بث حي" : "Live"}</span>
                        </div>

                        {/* Metric: Moving Buses */}
                        {stats && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>{isRtl ? "متحركة:" : "Moving:"}</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400">{stats.moving_buses}</span>
                            </div>
                        )}

                        {/* Metric: Stopped Buses */}
                        {stats && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                <span>{isRtl ? "متوقفة:" : "Stopped:"}</span>
                                <span className="font-mono">{stats.total_buses - stats.moving_buses}</span>
                            </div>
                        )}

                        {/* Metric: Students Onboard */}
                        {stats && stats.students_on_board !== undefined && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span className="hidden sm:inline">{isRtl ? "على المتن:" : "Onboard:"}</span>
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

                    {/* View Tools & Drawer Trigger Pod */}
                    <div className="flex items-center gap-1.5 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/80 dark:border-white/10 shrink-0">
                        
                        {/* THE SMART DRAWER TRIGGER BUTTON */}
                        <button
                            onClick={() => setIsDrawerOpen(prev => !prev)}
                            title={isDrawerOpen ? (isRtl ? 'إغلاق درج الفلترة' : 'Close drawer') : (isRtl ? 'فتح درج الفلترة والبحث وقائمة الأسطول' : 'Open fleet & filters')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                isDrawerOpen || activeFiltersCount > 0
                                    ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-400/40'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>{isRtl ? "الفلاتر والأسطول" : "Fleet & Filters"}</span>
                            {activeFiltersCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black leading-none">
                                    {activeFiltersCount}
                                </span>
                            )}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDrawerOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* School Campus Jump */}
                        {schoolLocation && schoolLocation.lat && schoolLocation.lng && (
                            <button
                                onClick={() => {
                                    if (map && schoolLocation.lat && schoolLocation.lng) {
                                        map.panTo({ lat: schoolLocation.lat, lng: schoolLocation.lng });
                                        map.setZoom(16);
                                        setSelectedBusId('all');
                                    }
                                }}
                                title={isRtl ? 'الانتقال لمقر المدرسة' : 'School Campus'}
                                className="px-2 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1 transition-all"
                            >
                                <SchoolIcon className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{schoolLocation.name || (isRtl ? 'المدرسة' : 'School')}</span>
                            </button>
                        )}

                        {/* Stops Toggle */}
                        <button
                            onClick={() => setShowStudentStops(prev => !prev)}
                            title={showStudentStops ? (isRtl ? 'إخفاء محطات الطلاب' : 'Hide stops') : (isRtl ? 'إظهار محطات الطلاب المرقمة' : 'Show stops')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
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
                            title={showRoutePath ? (isRtl ? 'إخفاء مسار الرحلة' : 'Hide route') : (isRtl ? 'إظهار خط المسار' : 'Show route')}
                            className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                showRoutePath
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Navigation className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isRtl ? "المسار" : "Route"}</span>
                        </button>

                        {/* Auto-Follow Toggle */}
                        {selectedBus && (
                            <button
                                onClick={() => setAutoFollow(prev => !prev)}
                                title={autoFollow ? (isRtl ? 'إلغاء المتابعة التلقائية' : 'Disable auto-follow') : (isRtl ? 'متابعة الحافلة بالكاميرا' : 'Follow bus')}
                                className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
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
                            className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 text-xs font-bold flex items-center gap-1 transition-all"
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">{mapType === 'roadmap' ? (isRtl ? 'قمر صناعي' : 'Satellite') : (isRtl ? 'عادي' : 'Map')}</span>
                        </button>

                        {/* Fullscreen Toggle */}
                        {onToggleFullscreen && (
                            <button
                                onClick={onToggleFullscreen}
                                title={isFullscreen ? (isRtl ? 'إنهاء وضع ملء الشاشة (Esc)' : 'Exit fullscreen (Esc)') : (isRtl ? 'وضع ملء الشاشة' : 'Fullscreen')}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                                    isFullscreen 
                                        ? 'bg-amber-500 text-white shadow-amber-500/25' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                                <span>{isFullscreen ? (isRtl ? "تصغير (Esc)" : "Exit (Esc)") : (isRtl ? "توسيع" : "Expand")}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- SMART COLLAPSIBLE FLEET & FILTERS DRAWER --- */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: isRtl ? 40 : -40, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: isRtl ? 40 : -40, y: -8, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 280, damping: 26 }}
                        className={`absolute top-16 ${isRtl ? 'right-3 md:right-5' : 'left-3 md:left-5'} z-[48] w-80 sm:w-96 max-h-[calc(100%-80px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-slate-200/90 dark:border-white/10 flex flex-col overflow-hidden pointer-events-auto`}
                    >
                        {/* Drawer Header */}
                        <div className="p-3.5 px-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                    <SlidersHorizontal className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                                        {isRtl ? 'تصفية وقائمة الأسطول' : 'Fleet Filters & Fleet'}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                                        {isRtl ? `مطابقة ${filteredBuses.length} من أصل ${safeBuses.length} حافلة` : `${filteredBuses.length} of ${safeBuses.length} buses`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {activeFiltersCount > 0 && (
                                    <button
                                        onClick={handleResetFilters}
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
                                        title={isRtl ? 'إعادة ضبط كل الفلاتر' : 'Reset filters'}
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>{isRtl ? 'إعادة ضبط' : 'Reset'}</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsDrawerOpen(false)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title={isRtl ? 'إغلاق الدرج' : 'Close drawer'}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Drawer Filter Controls */}
                        <div className="p-3 space-y-2.5 border-b border-slate-100 dark:border-white/10 bg-slate-50/40 dark:bg-slate-900/40">
                            {/* Instant Search Bar */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={isRtl ? "بحث بالحافلة، اللوحة، السائق، المدرسة..." : "Search bus, plate, driver, school..."}
                                    className={`text-xs ${isRtl ? 'pr-8 pl-7' : 'pl-8 pr-7'} py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 w-full shadow-sm placeholder:text-slate-400`}
                                />
                                <Search className={`absolute ${isRtl ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none`} />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className={`absolute ${isRtl ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white`}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* School Dropdown Filter */}
                            {schools && schools.length > 0 && (
                                <div className="relative">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <SchoolIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                        <select
                                            value={currentSchoolId}
                                            onChange={(e) => handleSelectSchool(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                            className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-100 border-0 cursor-pointer outline-none appearance-none pr-5 pl-1 w-full"
                                        >
                                            <option value="all">{isRtl ? `كل المدارس (${schools.length})` : `All Schools (${schools.length})`}</option>
                                            {schools.map(s => (
                                                <option key={`drawer-sch-${s.id}`} value={s.id} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none -mr-4 ml-1 shrink-0" />
                                    </div>
                                </div>
                            )}

                            {/* Status Filter Tabs */}
                            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`py-1 rounded-lg text-[11px] font-bold transition-all text-center ${statusFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                >
                                    {isRtl ? 'الكل' : 'All'}
                                </button>
                                <button
                                    onClick={() => setStatusFilter('moving')}
                                    className={`py-1 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 ${statusFilter === 'moving' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    <span>{isRtl ? 'متحركة' : 'Moving'}</span>
                                </button>
                                <button
                                    onClick={() => setStatusFilter('stopped')}
                                    className={`py-1 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 ${statusFilter === 'stopped' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    <span>{isRtl ? 'متوقفة' : 'Stopped'}</span>
                                </button>
                                <button
                                    onClick={() => setStatusFilter('trip')}
                                    className={`py-1 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 ${statusFilter === 'trip' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-amber-600'}`}
                                >
                                    <span>{isRtl ? 'في رحلة' : 'On Trip'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Interactive Bus Cards (Scrollable Fleet List) */}
                        <div className="flex-1 overflow-y-auto max-h-64 sm:max-h-72 p-2 space-y-1.5 divide-y divide-slate-100/50 dark:divide-white/5">
                            {filteredBuses.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-xs">
                                    <BusIcon className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                                    <p className="font-bold">{isRtl ? 'لا توجد حافلات مطابقة للفلترة' : 'No matching buses found'}</p>
                                    <button
                                        onClick={handleResetFilters}
                                        className="mt-2 text-[11px] text-blue-500 font-bold hover:underline"
                                    >
                                        {isRtl ? 'إعادة تعيين الفلاتر' : 'Reset filters'}
                                    </button>
                                </div>
                            ) : (
                                filteredBuses.map(bus => {
                                    const isSelected = selectedBusId === bus.id;
                                    const isMoving = Boolean(bus.is_moving || (bus.speed_kmh && bus.speed_kmh >= 3.0));
                                    return (
                                        <div
                                            key={`drawer-bus-${bus.id}`}
                                            onClick={() => {
                                                handleSelectBus(isSelected ? 'all' : bus.id);
                                            }}
                                            className={`p-2.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                                                isSelected
                                                    ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-500/40 shadow-sm ring-1 ring-blue-500/20'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                    isMoving 
                                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                }`}>
                                                    <BusIcon className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                                            {isRtl ? `حافلة ${bus.bus_number}` : `Bus ${bus.bus_number}`}
                                                        </span>
                                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                                                            {bus.plate_number}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                                        {bus.school?.name || (bus.driver?.name ? (isRtl ? `السائق: ${bus.driver.name}` : `Driver: ${bus.driver.name}`) : (isRtl ? 'بدون سائق' : 'No driver'))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end shrink-0 text-right">
                                                {isMoving ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        <span>{Math.round(bus.speed_kmh || 0)} {isRtl ? 'كم/س' : 'km/h'}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                        <span>{isRtl ? 'متوقفة' : 'Stopped'}</span>
                                                    </span>
                                                )}
                                                {isSelected && (
                                                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                                                        {isRtl ? 'مُحددة ومتبوعة ✓' : 'Tracked ✓'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Drawer Footer */}
                        {selectedBusId !== 'all' && (
                            <div className="p-2 px-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                    {isRtl ? 'حافلة محددة على الخريطة' : 'Bus selected on map'}
                                </span>
                                <button
                                    onClick={() => setSelectedBusId('all')}
                                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {isRtl ? 'إلغاء التحديد وتتبع الكل' : 'Clear selection (Show All)'}
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

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

                        {/* Driver, School & Trip Info */}
                        <div className="space-y-2 text-xs">
                            {selectedBus.school && (
                                <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900/40">
                                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                        <SchoolIcon className="w-3 h-3 text-blue-500" />
                                        <span>{isRtl ? "المدرسة:" : "School:"}</span>
                                    </span>
                                    <span className="font-bold truncate max-w-[140px] text-blue-600 dark:text-blue-400">{selectedBus.school.name}</span>
                                </div>
                            )}

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

    if (isFullscreen && typeof document !== 'undefined') {
        return createPortal(mapElement, document.body);
    }

    return mapElement;
}
