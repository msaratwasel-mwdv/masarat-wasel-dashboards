import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GoogleMap, Marker, Polyline, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import useTranslation from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layers, X, Users, ChevronDown, Gauge, 
    School as SchoolIcon, Navigation, MapPin, 
    Bus as BusIcon, RefreshCw, Crosshair, Activity, Clock,
    Search, Maximize2, Minimize2, Filter, SlidersHorizontal, RotateCcw,
    Download, Phone, PhoneCall, MessageCircle, User as UserIcon, ExternalLink, Backpack,
    Building2,
} from 'lucide-react';
import { 
    createSchoolMarkerSvg, 
    createBusMarkerSvg, 
    createStudentMarkerSvg 
} from './MapMarkerIcons';

export interface StudentAttendance {
    attendance_id: number;
    student_id: number;
    name: string;
    student_code?: string;
    gender?: 'male' | 'female' | string | null;
    photo_url?: string | null;
    grade?: string | null;
    classroom?: string | null;
    guardian_name?: string | null;
    guardian_phone?: string | null;
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
    photo_url?: string | null;
    gender?: string | null;
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
    school?: { id: number; name: string; lat?: number | null; lng?: number | null; logo_url?: string | null; address?: string | null } | null;
}

export interface SchoolItem {
    id: number;
    name: string;
    lat?: number | null;
    lng?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    logo_url?: string | null;
    address?: string | null;
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
    schoolLocation?: {
        id?: number;
        lat: number;
        lng: number;
        name?: string;
        logo_url?: string | null;
        address?: string | null;
    };
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
// HELPER: Smooth Animated Bus Marker for Web
// -------------------------------------------------------------
const AnimatedBusMarker = React.memo(({
    bus,
    targetLat,
    targetLng,
    isSelected,
    isHovered = false,
    isRtl = true,
    onClick,
    onMouseOver,
    onMouseOut,
}: {
    bus: Bus;
    targetLat: number;
    targetLng: number;
    isSelected: boolean;
    isHovered?: boolean;
    isRtl?: boolean;
    onClick: () => void;
    onMouseOver?: () => void;
    onMouseOut?: () => void;
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

    const isMoving = Boolean(bus.is_moving || (bus.speed_kmh && bus.speed_kmh >= 3.0));
    const zIndex = isSelected ? 3000 : isHovered ? 2500 : isMoving ? 150 : 120;

    return (
        <Marker 
            position={pos}
            icon={createBusMarkerSvg(bus, isSelected, isHovered, isRtl)}
            title={`${isRtl ? 'حافلة' : 'Bus'} ${bus.bus_number} (${bus.plate_number})`}
            zIndex={zIndex}
            onClick={onClick}
            onMouseOver={onMouseOver}
            onMouseOut={onMouseOut}
        />
    );
});

// -------------------------------------------------------------
// HELPER: Student Avatar with on-demand Lazy Image & Gender Fallback
// -------------------------------------------------------------
const StudentAvatar = ({ 
    photoUrl, 
    name, 
    gender, 
    size = "md",
    onClick
}: { 
    photoUrl?: string | null; 
    name: string; 
    gender?: string | null; 
    size?: "sm" | "md" | "lg" | "xl";
    onClick?: () => void;
}) => {
    const [imgError, setImgError] = useState(false);
    const sizeClasses = {
        sm: "w-8 h-8 text-[11px]",
        md: "w-11 h-11 text-xs",
        lg: "w-16 h-16 text-base",
        xl: "w-24 h-24 text-2xl",
    }[size];

    const isFemale = gender === 'female';
    const initials = name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('') || 'ط';

    if (photoUrl && !imgError) {
        return (
            <div 
                onClick={onClick} 
                className={`relative group rounded-2xl overflow-hidden shrink-0 border-2 border-white/90 dark:border-slate-700 shadow-md ${sizeClasses} ${onClick ? 'cursor-pointer' : ''}`}
            >
                <img 
                    src={photoUrl} 
                    alt={name} 
                    loading="lazy" 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => setImgError(true)}
                />
                {onClick && (
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div 
            onClick={onClick} 
            className={`relative rounded-2xl flex flex-col items-center justify-center font-black text-white shrink-0 border-2 border-white/90 dark:border-slate-700 shadow-md ${sizeClasses} ${
                isFemale 
                    ? 'bg-gradient-to-br from-rose-500 to-pink-600' 
                    : 'bg-gradient-to-br from-blue-600 to-indigo-700'
            } ${onClick ? 'cursor-pointer' : ''}`}
            title={name}
        >
            <Backpack className={size === 'xl' ? 'w-8 h-8 mb-1 opacity-85' : size === 'lg' ? 'w-5 h-5 mb-0.5 opacity-85' : 'w-3.5 h-3.5 opacity-80'} />
            <span className="leading-none">{initials}</span>
        </div>
    );
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
    const [hoveredBusId, setHoveredBusId] = useState<number | null>(null);
    const [hoveredSchoolId, setHoveredSchoolId] = useState<number | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<{ student: StudentAttendance; bus: Bus; stopNumber: number } | null>(null);
    const [selectedSchoolModal, setSelectedSchoolModal] = useState<{
        id?: number;
        name: string;
        lat: number;
        lng: number;
        logo_url?: string | null;
        address?: string | null;
    } | null>(null);
    const [previewPhoto, setPreviewPhoto] = useState<{
        url: string;
        title: string;
        subtitle?: string;
    } | null>(null);
    const [drawerTab, setDrawerTab] = useState<'buses' | 'students'>('buses');

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
    // SMART ANTI-COLLISION & SCHOOL PARKING BAY DISPERSION
    // Solves bus-under-school occlusion and co-located bus stacking
    // -------------------------------------------------------------
    const activeSchoolsWithCoords = useMemo(() => {
        const list: { id: number; name: string; lat: number; lng: number }[] = [];
        if (schools && schools.length > 0) {
            schools.forEach(s => {
                const lat = parseCoord(s.lat ?? s.latitude);
                const lng = parseCoord(s.lng ?? s.longitude);
                if (lat !== undefined && lng !== undefined) {
                    list.push({ id: s.id, name: s.name, lat, lng });
                }
            });
        } else if (schoolLocation && schoolLocation.lat && schoolLocation.lng) {
            list.push({
                id: schoolLocation.id || 0,
                name: schoolLocation.name || 'المدرسة',
                lat: schoolLocation.lat,
                lng: schoolLocation.lng,
            });
        }
        return list;
    }, [schools, schoolLocation]);

    const { positionedBuses, parkedBusesBySchool } = useMemo(() => {
        const schoolBusMap = new Map<number, Bus[]>();
        const regularBuses: { bus: Bus; lat: number; lng: number }[] = [];

        // Helper: Euclidean distance in meters
        const calcDistMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
            const dLat = (lat2 - lat1) * 111320;
            const dLng = (lng2 - lng1) * 111320 * Math.cos((lat1 * Math.PI) / 180);
            return Math.sqrt(dLat * dLat + dLng * dLng);
        };

        visibleBuses.forEach(bus => {
            const lat = parseCoord(bus.current_latitude ?? bus.latitude);
            const lng = parseCoord(bus.current_longitude ?? bus.longitude);
            if (lat === undefined || lng === undefined) return;

            const isMoving = Boolean(bus.is_moving || (bus.speed_kmh && bus.speed_kmh >= 3.0));

            // Check if bus is parked at/near any school
            let matchedSchool: { id: number; name: string; lat: number; lng: number } | null = null;
            for (const sch of activeSchoolsWithCoords) {
                const dist = calcDistMeters(lat, lng, sch.lat, sch.lng);
                if (dist < 65 || (dist < 90 && !isMoving && bus.school_id === sch.id)) {
                    matchedSchool = sch;
                    break;
                }
            }

            if (matchedSchool && !isMoving) {
                const list = schoolBusMap.get(matchedSchool.id) || [];
                list.push(bus);
                schoolBusMap.set(matchedSchool.id, list);
            } else {
                regularBuses.push({ bus, lat, lng });
            }
        });

        const result: { bus: Bus; lat: number; lng: number }[] = [];
        const parkedCounts = new Map<number, number>();

        // 1. Position buses parked at school in a clean orbital parking fan-out
        schoolBusMap.forEach((busesAtSchool, schoolId) => {
            parkedCounts.set(schoolId, busesAtSchool.length);
            const sch = activeSchoolsWithCoords.find(s => s.id === schoolId);
            if (!sch) return;

            const count = busesAtSchool.length;
            const radiusMeters = 38; // 38 meters clear of school building center
            const rad = Math.PI / 180;
            const cosLat = Math.cos(sch.lat * rad);

            busesAtSchool.forEach((bus, index) => {
                let angleDeg = 180; // South
                if (count === 1) {
                    angleDeg = 135; // South-East
                } else if (count === 2) {
                    angleDeg = index === 0 ? 120 : 240;
                } else if (count === 3) {
                    angleDeg = 90 + index * 90; // 90° (E), 180° (S), 270° (W)
                } else {
                    const startAngle = 60;
                    const endAngle = 300;
                    angleDeg = startAngle + (index / (count - 1)) * (endAngle - startAngle);
                }

                const dLat = (radiusMeters * Math.cos(angleDeg * rad)) / 111320;
                const dLng = (radiusMeters * Math.sin(angleDeg * rad)) / (111320 * cosLat);

                result.push({
                    bus,
                    lat: sch.lat + dLat,
                    lng: sch.lng + dLng,
                });
            });
        });

        // 2. Position regular buses (and disperse any co-located < 12m)
        const groupedByCoord: { bus: Bus; lat: number; lng: number }[][] = [];
        regularBuses.forEach(item => {
            let placed = false;
            for (const grp of groupedByCoord) {
                const first = grp[0];
                if (calcDistMeters(item.lat, item.lng, first.lat, first.lng) < 12) {
                    grp.push(item);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                groupedByCoord.push([item]);
            }
        });

        groupedByCoord.forEach(grp => {
            if (grp.length === 1) {
                result.push(grp[0]);
            } else {
                const count = grp.length;
                const radiusMeters = 18;
                const rad = Math.PI / 180;
                const cosLat = Math.cos(grp[0].lat * rad);

                grp.forEach((item, idx) => {
                    const angleDeg = (idx / count) * 360;
                    const dLat = (radiusMeters * Math.cos(angleDeg * rad)) / 111320;
                    const dLng = (radiusMeters * Math.sin(angleDeg * rad)) / (111320 * cosLat);
                    result.push({
                        bus: item.bus,
                        lat: item.lat + dLat,
                        lng: item.lng + dLng,
                    });
                });
            }
        });

        return { positionedBuses: result, parkedBusesBySchool: parkedCounts };
    }, [visibleBuses, activeSchoolsWithCoords]);

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

    // -------------------------------------------------------------
    // ALL TRIP STUDENTS: For the Fleet Drawer Students Tab
    // -------------------------------------------------------------
    const allStudentsList = useMemo(() => {
        const list: { student: StudentAttendance; bus: Bus; stopNumber?: number }[] = [];
        filteredBuses.forEach(bus => {
            const students = bus.active_trip?.students || [];
            let counter = 1;
            students.forEach(st => {
                list.push({
                    student: st,
                    bus,
                    stopNumber: counter++,
                });
            });
        });
        return list;
    }, [filteredBuses]);

    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return allStudentsList;
        const q = searchQuery.toLowerCase().trim();
        return allStudentsList.filter(({ student, bus }) => {
            const nameMatch = student.name?.toLowerCase().includes(q);
            const codeMatch = student.student_code?.toLowerCase().includes(q);
            const classMatch = student.classroom?.toLowerCase().includes(q);
            const guardianMatch = student.guardian_name?.toLowerCase().includes(q);
            const busMatch = bus.bus_number?.toLowerCase().includes(q);
            return Boolean(nameMatch || codeMatch || classMatch || guardianMatch || busMatch);
        });
    }, [allStudentsList, searchQuery]);

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

                    {/* SCHOOL LANDMARK PINS (CLEAN VECTOR WITH FLOATING NAME BADGE & FLEET COUNT) */}
                    {schools && schools.length > 0 ? (
                        schools.map((sch) => {
                            const sLat = parseCoord(sch.lat ?? sch.latitude);
                            const sLng = parseCoord(sch.lng ?? sch.longitude);
                            if (sLat === undefined || sLng === undefined) return null;
                            const isSelected = currentSchoolId === sch.id || selectedSchoolModal?.id === sch.id;
                            const isHovered = hoveredSchoolId === sch.id;
                            const parkedCount = parkedBusesBySchool.get(sch.id) || 0;
                            return (
                                <Marker
                                    key={`school-landmark-${sch.id}`}
                                    position={{ lat: sLat, lng: sLng }}
                                    icon={createSchoolMarkerSvg(sch.name, isSelected, isHovered, isRtl, parkedCount)}
                                    title={sch.name}
                                    zIndex={isSelected ? 2200 : isHovered ? 2000 : 100}
                                    onMouseOver={() => setHoveredSchoolId(sch.id)}
                                    onMouseOut={() => setHoveredSchoolId(null)}
                                    onClick={() => {
                                        handleSelectSchool(sch.id);
                                        setSelectedSchoolModal({
                                            id: sch.id,
                                            name: sch.name,
                                            lat: sLat,
                                            lng: sLng,
                                            logo_url: sch.logo_url,
                                            address: sch.address,
                                        });
                                        setSelectedStudent(null);
                                    }}
                                />
                            );
                        })
                    ) : schoolLocation && schoolLocation.lat && schoolLocation.lng ? (
                        <Marker
                            key="school-landmark"
                            position={{ lat: schoolLocation.lat, lng: schoolLocation.lng }}
                            icon={createSchoolMarkerSvg(
                                schoolLocation.name || (isRtl ? 'مقر المدرسة' : 'School Campus'), 
                                selectedSchoolModal !== null,
                                hoveredSchoolId === (schoolLocation.id || 0),
                                isRtl,
                                parkedBusesBySchool.get(schoolLocation.id || 0) || 0
                            )}
                            title={schoolLocation.name || (isRtl ? 'المدرسة' : 'School')}
                            zIndex={selectedSchoolModal !== null ? 2200 : hoveredSchoolId === (schoolLocation.id || 0) ? 2000 : 100}
                            onMouseOver={() => setHoveredSchoolId(schoolLocation.id || 0)}
                            onMouseOut={() => setHoveredSchoolId(null)}
                            onClick={() => {
                                if (map) {
                                    map.panTo({ lat: schoolLocation.lat, lng: schoolLocation.lng });
                                    map.setZoom(16);
                                }
                                setSelectedSchoolModal({
                                    id: schoolLocation.id || 0,
                                    name: schoolLocation.name || (isRtl ? 'مقر المدرسة' : 'School Campus'),
                                    lat: schoolLocation.lat,
                                    lng: schoolLocation.lng,
                                    logo_url: schoolLocation.logo_url,
                                    address: schoolLocation.address,
                                });
                                setSelectedStudent(null);
                            }}
                        />
                    ) : null}

                    {/* NUMBERED STUDENT PICKUP STOP MARKERS (PROFESSIONAL STUDENT ICONS) */}
                    {studentStops.map(({ student, bus, lat, lng, stopNumber }) => {
                        const isSelected = selectedStudent?.student.student_id === student.student_id;
                        return (
                            <Marker
                                key={`stop-${student.attendance_id}-${student.student_id}`}
                                position={{ lat, lng }}
                                icon={createStudentMarkerSvg(student.status, stopNumber, isSelected)}
                                title={`${isRtl ? 'محطة طالب' : 'Student Stop'} #${stopNumber}: ${student.name}`}
                                zIndex={isSelected ? 65 : 40}
                                onClick={() => {
                                    setSelectedStudent({ student, bus, stopNumber });
                                    setSelectedSchoolModal(null);
                                }}
                            />
                        );
                    })}



                    {/* BUS MARKERS WITH LIVE SMART POSITIONING (ANTI-COLLISION / SCHOOL PARKING BAY) */}
                    {positionedBuses.map(({ bus, lat, lng }) => {
                        const isSelected = selectedBus?.id === bus.id;

                        return (
                            <AnimatedBusMarker
                                key={`bus-marker-${bus.id}`}
                                bus={bus}
                                targetLat={lat}
                                targetLng={lng}
                                isSelected={isSelected}
                                isHovered={hoveredBusId === bus.id}
                                isRtl={isRtl}
                                onClick={() => handleSelectBus(bus.id)}
                                onMouseOver={() => setHoveredBusId(bus.id)}
                                onMouseOut={() => setHoveredBusId(null)}
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

                        {/* Drawer Tabs (Buses vs Students) */}
                        <div className="flex border-b border-slate-100 dark:border-white/10 px-3 pt-2 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                            <button
                                onClick={() => setDrawerTab('buses')}
                                className={`pb-2 text-xs font-bold transition-all relative ${
                                    drawerTab === 'buses'
                                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <BusIcon className="w-3.5 h-3.5" />
                                    <span>{isRtl ? 'الحافلات' : 'Buses'}</span>
                                    <span className="px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-slate-800 text-[10px] font-mono">
                                        {filteredBuses.length}
                                    </span>
                                </span>
                            </button>
                            <button
                                onClick={() => setDrawerTab('students')}
                                className={`pb-2 text-xs font-bold transition-all relative ${
                                    drawerTab === 'students'
                                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <Backpack className="w-3.5 h-3.5" />
                                    <span>{isRtl ? 'الطلاب والمحطات' : 'Students'}</span>
                                    <span className="px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-slate-800 text-[10px] font-mono">
                                        {allStudentsList.length}
                                    </span>
                                </span>
                            </button>
                        </div>

                        {/* Interactive List (Buses or Students based on tab) */}
                        <div className="flex-1 overflow-y-auto max-h-64 sm:max-h-72 p-2 space-y-1.5 divide-y divide-slate-100/50 dark:divide-white/5">
                            {drawerTab === 'buses' ? (
                                filteredBuses.length === 0 ? (
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
                                )
                            ) : (
                                filteredStudents.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400 text-xs">
                                        <Backpack className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                                        <p className="font-bold">{isRtl ? 'لا يوجد طلاب مطابقين للبحث' : 'No matching students found'}</p>
                                    </div>
                                ) : (
                                    filteredStudents.map(({ student, bus, stopNumber }) => {
                                        const isSelected = selectedStudent?.student.student_id === student.student_id;
                                        return (
                                            <div
                                                key={`drawer-st-${student.attendance_id}-${student.student_id}`}
                                                onClick={() => {
                                                    const lat = parseCoord(student.lat);
                                                    const lng = parseCoord(student.lng);
                                                    if (lat !== undefined && lng !== undefined && map) {
                                                        map.panTo({ lat, lng });
                                                        map.setZoom(17);
                                                    } else if (map) {
                                                        const bLat = parseCoord(bus.current_latitude ?? bus.latitude);
                                                        const bLng = parseCoord(bus.current_longitude ?? bus.longitude);
                                                        if (bLat !== undefined && bLng !== undefined) {
                                                            map.panTo({ lat: bLat, lng: bLng });
                                                            map.setZoom(16);
                                                        }
                                                    }
                                                    setSelectedStudent({ student, bus, stopNumber: stopNumber || 1 });
                                                    setSelectedSchoolModal(null);
                                                }}
                                                className={`p-2.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                                                    isSelected
                                                        ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-500/40 shadow-sm ring-1 ring-blue-500/20'
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <StudentAvatar
                                                        photoUrl={student.photo_url}
                                                        name={student.name}
                                                        gender={student.gender}
                                                        size="sm"
                                                        onClick={() => {
                                                            if (student.photo_url) {
                                                                setPreviewPhoto({
                                                                    url: student.photo_url,
                                                                    title: student.name,
                                                                    subtitle: student.student_code ? `#${student.student_code}` : undefined
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            {stopNumber && (
                                                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-900 text-white font-mono shrink-0">
                                                                    #{stopNumber}
                                                                </span>
                                                            )}
                                                            <h5 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                                                {student.name}
                                                            </h5>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate mt-0.5">
                                                            <span>{isRtl ? `حافلة ${bus.bus_number}` : `Bus ${bus.bus_number}`}</span>
                                                            {student.classroom && <span>• {student.classroom}</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end shrink-0 text-right">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        student.status === 'present' || student.status === 'boarded'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                            : student.status === 'dropped'
                                                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                                                            : student.status === 'absent'
                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                            : student.status === 'late'
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                                    }`}>
                                                        {student.status === 'present' || student.status === 'boarded' ? (isRtl ? 'صعد' : 'Boarded') :
                                                         student.status === 'dropped' ? (isRtl ? 'تم التوصيل' : 'Dropped') :
                                                         student.status === 'absent' ? (isRtl ? 'غائب' : 'Absent') :
                                                         student.status === 'late' ? (isRtl ? 'في الانتظار' : 'Waiting') : (isRtl ? 'مجدول' : 'Scheduled')}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                                                            {isRtl ? 'محدد ✓' : 'Selected ✓'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )
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

            {/* --- SELECTED STUDENT FLOATING DETAIL CARD --- */}
            <AnimatePresence>
                {selectedStudent && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 260, damping: 24 }}
                        className={`absolute bottom-6 ${isRtl ? 'right-4 md:right-8' : 'left-4 md:left-8'} z-[47] w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-slate-200/90 dark:border-white/10 pointer-events-auto`}
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-3 mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <StudentAvatar
                                    photoUrl={selectedStudent.student.photo_url}
                                    name={selectedStudent.student.name}
                                    gender={selectedStudent.student.gender}
                                    size="lg"
                                    onClick={() => {
                                        if (selectedStudent.student.photo_url) {
                                            setPreviewPhoto({
                                                url: selectedStudent.student.photo_url,
                                                title: selectedStudent.student.name,
                                                subtitle: selectedStudent.student.student_code ? `#${selectedStudent.student.student_code}` : undefined
                                            });
                                        }
                                    }}
                                />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-black shrink-0">
                                            #{selectedStudent.stopNumber}
                                        </span>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                            selectedStudent.student.status === 'present' || selectedStudent.student.status === 'boarded'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                : selectedStudent.student.status === 'dropped'
                                                ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                                                : selectedStudent.student.status === 'absent'
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                : selectedStudent.student.status === 'late'
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                                        }`}>
                                            {selectedStudent.student.status === 'present' || selectedStudent.student.status === 'boarded' ? (isRtl ? 'صعد للحافلة' : 'Boarded') :
                                             selectedStudent.student.status === 'dropped' ? (isRtl ? 'تم التوصيل' : 'Dropped') :
                                             selectedStudent.student.status === 'absent' ? (isRtl ? 'غائب' : 'Absent') :
                                             selectedStudent.student.status === 'late' ? (isRtl ? 'في الانتظار' : 'Waiting') : (isRtl ? 'مجدول' : 'Scheduled')}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight truncate">
                                        {selectedStudent.student.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                        {selectedStudent.student.classroom && <span>{selectedStudent.student.classroom}</span>}
                                        {selectedStudent.student.student_code && <span className="font-mono">#{selectedStudent.student.student_code}</span>}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Info list */}
                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3">
                            <div className="flex items-center justify-between p-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                                <span className="text-slate-400 text-[11px]">{isRtl ? 'الحافلة المخصصة:' : 'Assigned Bus:'}</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {isRtl ? `حافلة ${selectedStudent.bus.bus_number}` : `Bus ${selectedStudent.bus.bus_number}`} ({selectedStudent.bus.plate_number})
                                </span>
                            </div>

                            {selectedStudent.student.guardian_name && (
                                <div className="flex items-center justify-between p-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                                    <span className="text-slate-400 text-[11px]">{isRtl ? 'ولي الأمر:' : 'Guardian:'}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[110px]">
                                            {selectedStudent.student.guardian_name}
                                        </span>
                                        {selectedStudent.student.guardian_phone && (
                                            <div className="flex items-center gap-1">
                                                <a
                                                    href={`tel:${selectedStudent.student.guardian_phone}`}
                                                    title={isRtl ? 'اتصال هاتفياً' : 'Call'}
                                                    className="p-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100"
                                                >
                                                    <PhoneCall className="w-3.5 h-3.5" />
                                                </a>
                                                <a
                                                    href={`https://wa.me/${selectedStudent.student.guardian_phone.replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={isRtl ? 'محادثة واتساب' : 'WhatsApp'}
                                                    className="p-1 rounded-lg bg-green-50 text-green-600 dark:bg-green-950/60 dark:text-green-300 hover:bg-green-100"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {selectedStudent.student.address && (
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 p-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{selectedStudent.student.address}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions: Download Photo + Center Map */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/10">
                            {selectedStudent.student.photo_url ? (
                                <a
                                    href={selectedStudent.student.photo_url}
                                    download={`student_${selectedStudent.student.student_code || selectedStudent.student.student_id}.jpg`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 px-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{isRtl ? 'تحميل الصورة' : 'Download Photo'}</span>
                                </a>
                            ) : null}
                            <button
                                onClick={() => {
                                    if (map && selectedStudent.student.lat && selectedStudent.student.lng) {
                                        map.panTo({ 
                                            lat: Number(selectedStudent.student.lat), 
                                            lng: Number(selectedStudent.student.lng) 
                                        });
                                        map.setZoom(17);
                                    }
                                }}
                                className="flex-1 py-2 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                            >
                                <Crosshair className="w-3.5 h-3.5" />
                                <span>{isRtl ? 'تركيز المحطة' : 'Focus Stop'}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- SELECTED SCHOOL MODAL / CARD --- */}
            <AnimatePresence>
                {selectedSchoolModal && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 260, damping: 24 }}
                        className={`absolute bottom-6 ${isRtl ? 'right-4 md:right-8' : 'left-4 md:left-8'} z-[47] w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200/90 dark:border-white/10 pointer-events-auto`}
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-3 mb-3">
                            <div className="flex items-center gap-3">
                                {selectedSchoolModal.logo_url ? (
                                    <div 
                                        onClick={() => setPreviewPhoto({
                                            url: selectedSchoolModal.logo_url!,
                                            title: selectedSchoolModal.name,
                                            subtitle: isRtl ? 'شعار / صورة المدرسة' : 'School Logo / Campus Image'
                                        })}
                                        className="relative group w-12 h-12 rounded-2xl overflow-hidden shrink-0 border-2 border-amber-500/40 shadow-md cursor-pointer bg-white"
                                        title={isRtl ? 'انقر لتكبير الشعار' : 'Click to enlarge'}
                                    >
                                        <img 
                                            src={selectedSchoolModal.logo_url} 
                                            alt={selectedSchoolModal.name}
                                            loading="lazy"
                                            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform" 
                                        />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                            <Maximize2 className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border-2 border-amber-500/30 shrink-0">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                                            {isRtl ? 'منشأة تعليمية' : 'School Campus'}
                                        </span>
                                    </div>
                                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                                        {selectedSchoolModal.name}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedSchoolModal(null)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {selectedSchoolModal.address && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{selectedSchoolModal.address}</span>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 pt-1">
                            {selectedSchoolModal.logo_url && (
                                <a
                                    href={selectedSchoolModal.logo_url}
                                    download={`${selectedSchoolModal.name.replace(/\s+/g, '_')}_logo.jpg`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{isRtl ? 'تحميل الشعار' : 'Download Logo'}</span>
                                </a>
                            )}
                            <button
                                onClick={() => {
                                    if (selectedSchoolModal.id) {
                                        handleSelectSchool(selectedSchoolModal.id);
                                    }
                                    if (map) {
                                        map.panTo({ lat: selectedSchoolModal.lat, lng: selectedSchoolModal.lng });
                                        map.setZoom(16);
                                    }
                                }}
                                className="flex-1 py-2 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                            >
                                <Crosshair className="w-3.5 h-3.5" />
                                <span>{isRtl ? 'تركيز وتصفية الحافلات' : 'Focus & Filter'}</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- FULLSCREEN PHOTO PREVIEW LIGHTBOX MODAL --- */}
            <AnimatePresence>
                {previewPhoto && (
                    <div 
                        className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
                        onClick={() => setPreviewPhoto(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 260, damping: 24 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                        {previewPhoto.title}
                                    </h3>
                                    {previewPhoto.subtitle && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                                            {previewPhoto.subtitle}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setPreviewPhoto(null)}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Photo Body */}
                            <div className="p-6 flex items-center justify-center bg-slate-950/50 min-h-[220px]">
                                <img 
                                    src={previewPhoto.url} 
                                    alt={previewPhoto.title}
                                    className="max-h-[55vh] max-w-full object-contain rounded-2xl shadow-xl border border-white/10"
                                />
                            </div>

                            {/* Footer with Download */}
                            <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                                <span className="text-xs text-slate-400">
                                    {isRtl ? 'عرض مباشر للصورة' : 'Direct photo preview'}
                                </span>
                                <a
                                    href={previewPhoto.url}
                                    download={`${previewPhoto.title.replace(/\s+/g, '_')}.jpg`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>{isRtl ? 'تحميل الصورة' : 'Download Photo'}</span>
                                </a>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );

    if (isFullscreen && typeof document !== 'undefined') {
        return createPortal(mapElement, document.body);
    }

    return mapElement;
}
