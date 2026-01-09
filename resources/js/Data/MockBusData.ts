// 🚨 ملف البيانات الوهمية - سيتم حذفه بالكامل عند ربط Backend
// Mock Data for Bus Management System
// This file contains ALL temporary mock data used by frontend components
// DELETE THIS ENTIRE FILE when backend integration is ready

export interface MockBus {
    id: number;
    bus_number: string;
    plate_number: string;
    capacity: number;
    type: 'permanent' | 'temporary';
    status: 'active' | 'maintenance' | 'inactive';
    driver?: {
        id: number;
        name: string;
        phone: string;
    };
    supervisor?: {
        id: number;
        name: string;
        phone: string;
    };
}

export interface MockBusRequest {
    id: number;
    request_type: 'permanent' | 'temporary' | 'field_trip';
    number_of_buses: number;
    start_date: string;
    end_date?: string;
    reason: string;
    special_requirements?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    approved_at?: string;
    rejection_reason?: string;
}

export interface MockTripSchedule {
    id: number;
    bus_id: number;
    bus_number: string;
    day_of_week: number; // 0 = Sunday, 6 = Saturday
    gathering_time: string;
    departure_time: string;
    return_time: string;
    last_dropoff_time: string;
    is_exception: boolean;
    exception_date?: string;
    exception_reason?: string;
}

export interface MockFieldTrip {
    id: number;
    trip_name: string;
    description: string;
    trip_date: string;
    trip_time: string;
    destination: string;
    destination_lat?: number;
    destination_lng?: number;
    number_of_students: number;
    status: 'planned' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
    approved_by_school: boolean;
    approved_by_company: boolean;
    buses: number[];
    drivers: { id: number; name: string }[];
    supervisors: { id: number; name: string }[];
    teachers: string[];
}

// ===== MOCK BUSES =====
export const mockBuses: MockBus[] = [
    {
        id: 1,
        bus_number: 'BUS-001',
        plate_number: 'ABC-1234',
        capacity: 45,
        type: 'permanent',
        status: 'active',
        driver: { id: 101, name: 'أحمد محمد', phone: '0501234567' },
        supervisor: { id: 201, name: 'فاطمة علي', phone: '0509876543' },
    },
    {
        id: 2,
        bus_number: 'BUS-002',
        plate_number: 'XYZ-5678',
        capacity: 40,
        type: 'permanent',
        status: 'active',
        driver: { id: 102, name: 'خالد أحمد', phone: '0502345678' },
        supervisor: { id: 202, name: 'نورة سعد', phone: '0508765432' },
    },
    {
        id: 3,
        bus_number: 'BUS-003',
        plate_number: 'DEF-9012',
        capacity: 35,
        type: 'permanent',
        status: 'maintenance',
        driver: { id: 103, name: 'عبدالله سالم', phone: '0503456789' },
        supervisor: { id: 203, name: 'مريم حسن', phone: '0507654321' },
    },
    {
        id: 4,
        bus_number: 'BUS-004',
        plate_number: 'GHI-3456',
        capacity: 50,
        type: 'temporary',
        status: 'active',
        driver: { id: 104, name: 'سعيد ناصر', phone: '0504567890' },
    },
    {
        id: 5,
        bus_number: 'BUS-005',
        plate_number: 'JKL-7890',
        capacity: 30,
        type: 'permanent',
        status: 'inactive',
    },
];

// ===== MOCK BUS REQUESTS =====
export const mockBusRequests: MockBusRequest[] = [
    {
        id: 1,
        request_type: 'permanent',
        number_of_buses: 2,
        start_date: '2026-02-01',
        reason: 'زيادة عدد الطلاب المسجلين للفصل الدراسي الثاني',
        special_requirements: 'حافلات بسعة 45 راكب على الأقل',
        status: 'pending',
        created_at: '2026-01-08T10:30:00',
    },
    {
        id: 2,
        request_type: 'temporary',
        number_of_buses: 1,
        start_date: '2026-01-20',
        end_date: '2026-01-25',
        reason: 'حافلة احتياطية أثناء صيانة BUS-003',
        status: 'approved',
        created_at: '2026-01-05T14:20:00',
        approved_at: '2026-01-06T09:15:00',
    },
    {
        id: 3,
        request_type: 'field_trip',
        number_of_buses: 3,
        start_date: '2026-01-15',
        reason: 'رحلة ميدانية إلى المتحف الوطني',
        special_requirements: 'حافلات حديثة مكيفة',
        status: 'approved',
        created_at: '2026-01-02T11:00:00',
        approved_at: '2026-01-03T16:45:00',
    },
    {
        id: 4,
        request_type: 'permanent',
        number_of_buses: 1,
        start_date: '2026-03-01',
        reason: 'توسع المدرسة لمنطقة جديدة',
        status: 'rejected',
        created_at: '2025-12-20T13:30:00',
        rejection_reason: 'عدم توفر حافلات إضافية في الوقت الحالي',
    },
];

// ===== MOCK TRIP SCHEDULES =====
export const mockTripSchedules: MockTripSchedule[] = [
    // Sunday schedules
    { id: 1, bus_id: 1, bus_number: 'BUS-001', day_of_week: 0, gathering_time: '06:30', departure_time: '07:00', return_time: '14:00', last_dropoff_time: '15:00', is_exception: false },
    { id: 2, bus_id: 2, bus_number: 'BUS-002', day_of_week: 0, gathering_time: '06:45', departure_time: '07:15', return_time: '14:15', last_dropoff_time: '15:15', is_exception: false },
    { id: 3, bus_id: 4, bus_number: 'BUS-004', day_of_week: 0, gathering_time: '06:30', departure_time: '07:00', return_time: '14:00', last_dropoff_time: '15:00', is_exception: false },
    
    // Monday schedules
    { id: 4, bus_id: 1, bus_number: 'BUS-001', day_of_week: 1, gathering_time: '06:30', departure_time: '07:00', return_time: '14:00', last_dropoff_time: '15:00', is_exception: false },
    { id: 5, bus_id: 2, bus_number: 'BUS-002', day_of_week: 1, gathering_time: '06:45', departure_time: '07:15', return_time: '14:15', last_dropoff_time: '15:15', is_exception: false },
    
    // Tuesday schedules
    { id: 6, bus_id: 1, bus_number: 'BUS-001', day_of_week: 2, gathering_time: '06:30', departure_time: '07:00', return_time: '14:00', last_dropoff_time: '15:00', is_exception: false },
    { id: 7, bus_id: 2, bus_number: 'BUS-002', day_of_week: 2, gathering_time: '06:45', departure_time: '07:15', return_time: '14:15', last_dropoff_time: '15:15', is_exception: false },
    
    // Wednesday schedules
    { id: 8, bus_id: 1, bus_number: 'BUS-001', day_of_week: 3, gathering_time: '06:30', departure_time: '07:00', return_time: '14:00', last_dropoff_time: '15:00', is_exception: false },
    { id: 9, bus_id: 2, bus_number: 'BUS-002', day_of_week: 3, gathering_time: '06:45', departure_time: '07:15', return_time: '14:15', last_dropoff_time: '15:15', is_exception: false },
    
    // Thursday schedules (exception - exam day)
    { id: 10, bus_id: 1, bus_number: 'BUS-001', day_of_week: 4, gathering_time: '07:00', departure_time: '07:30', return_time: '12:00', last_dropoff_time: '13:00', is_exception: true, exception_date: '2026-01-16', exception_reason: 'يوم امتحانات - جدول مخفف' },
];

// ===== MOCK FIELD TRIPS =====
export const mockFieldTrips: MockFieldTrip[] = [
    {
        id: 1,
        trip_name: 'زيارة المتحف الوطني',
        description: 'رحلة تعليمية لطلاب الصف الخامس لزيارة المتحف الوطني والتعرف على تاريخ المملكة',
        trip_date: '2026-01-15',
        trip_time: '08:00',
        destination: 'المتحف الوطني - الرياض',
        destination_lat: 24.6476,
        destination_lng: 46.7197,
        number_of_students: 120,
        status: 'approved',
        approved_by_school: true,
        approved_by_company: true,
        buses: [1, 2, 4],
        drivers: [
            { id: 101, name: 'أحمد محمد' },
            { id: 102, name: 'خالد أحمد' },
            { id: 104, name: 'سعيد ناصر' },
        ],
        supervisors: [
            { id: 201, name: 'فاطمة علي' },
            { id: 202, name: 'نورة سعد' },
        ],
        teachers: ['أ. سارة الغامدي', 'أ. محمد العتيبي', 'أ. ليلى المطيري'],
    },
    {
        id: 2,
        trip_name: 'رحلة إلى حديقة الملك عبدالله',
        description: 'رحلة ترفيهية لطلاب الصف الثالث',
        trip_date: '2026-01-25',
        trip_time: '09:00',
        destination: 'حديقة الملك عبدالله - الرياض',
        destination_lat: 24.6892,
        destination_lng: 46.6693,
        number_of_students: 80,
        status: 'planned',
        approved_by_school: true,
        approved_by_company: false,
        buses: [1, 2],
        drivers: [
            { id: 101, name: 'أحمد محمد' },
            { id: 102, name: 'خالد أحمد' },
        ],
        supervisors: [
            { id: 201, name: 'فاطمة علي' },
        ],
        teachers: ['أ. هند السالم', 'أ. عمر الشهري'],
    },
    {
        id: 3,
        trip_name: 'زيارة مركز الملك عبدالعزيز التاريخي',
        description: 'رحلة تاريخية لطلاب الصف السادس',
        trip_date: '2026-02-10',
        trip_time: '08:30',
        destination: 'مركز الملك عبدالعزيز التاريخي',
        number_of_students: 60,
        status: 'planned',
        approved_by_school: false,
        approved_by_company: false,
        buses: [1],
        drivers: [{ id: 101, name: 'أحمد محمد' }],
        supervisors: [{ id: 201, name: 'فاطمة علي' }],
        teachers: ['أ. خالد الدوسري'],
    },
];
