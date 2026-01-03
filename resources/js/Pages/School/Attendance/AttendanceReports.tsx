import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import axios from "axios";
import useTranslation from "@/hooks/useTranslation";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

interface Student {
    id: number;
    name: string;
    full_name?: string;
    student_code?: string;
    national_id?: string;
    student_national_id: string;
    classroom_id: number;
    classroom?: { id: number; name: string };
    guardian?: {
        name: string;
        phone: string;
        national_id?: string;
    };
    current_enrollment?: {
        classroom?: {
            id: number;
            name: string;
        }
    };
}

interface Supervisor {
    id: number;
    name: string;
    phone: string;
    national_id?: string;
}

interface Classroom {
    id: number;
    name: string;
    grade: string;
    students?: Student[];
    supervisor?: Supervisor;
    teachers?: Supervisor[]; // Added from backend
    supervisors?: Supervisor[];
}

interface AttendanceRecord {
    id: number;
    date: string;
    status: 'present' | 'absent';
    student_id: number;
    classroom_id: number;
    student?: Student;
    classroom?: Classroom;
}

export default function AttendanceReports() {
    const { t, isRtl } = useTranslation();
    const {auth} = usePage().props as any;
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    // CRUD Modal States
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        student_id: '',
        classroom_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present' as 'present' | 'absent',
    });

    // Bulk Attendance Data
    const [bulkData, setBulkData] = useState({
        classroom_id: '',
        date: new Date().toISOString().split('T')[0],
        attendance: [] as {student_id: number; status: 'present' | 'absent'}[],
    });

    // Filters
    const [filters, setFilters] = useState({
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        classroom_id: '',
        student_id: '',
        student_national_id: '', // Added filter
        status: '',
    });

    // Stats
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });

    useEffect(() => {
        fetchMetadata();
        fetchData();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [classRes, studentRes] = await Promise.all([
                axios.get('/school/classes-api'),
                axios.get('/school/students-api')
            ]);
            setClassrooms(classRes.data);
            setStudents(studentRes.data);
        } catch (error) {
            console.error('Error fetching metadata:', error);
            showToast(t('Error loading metadata'), 'error');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filters.start_date && filters.end_date) {
                params.start_date = filters.start_date;
                params.end_date = filters.end_date;
            }
            if (filters.classroom_id) params.classroom_id = filters.classroom_id;
            if (filters.student_id) params.student_id = filters.student_id;
            if (filters.student_national_id) params.student_national_id = filters.student_national_id; // Pass to backend
            if (filters.status) params.status = filters.status;

            const res = await axios.get('/school/attendance', { params });
            // Client-side filtering for National ID if backend doesn't support it yet
            let data = res.data;
            if (filters.student_national_id) {
                data = data.filter((r: AttendanceRecord) => 
                    r.student?.student_national_id?.includes(filters.student_national_id)
                );
            }

            setAttendance(data);

            // Calculate stats
            const total = data.length;
            const present = data.filter((a: AttendanceRecord) => a.status === 'present').length;
            const absent = data.filter((a: AttendanceRecord) => a.status === 'absent').length;
            setStats({ total, present, absent });
        } catch (error) {
            console.error('Error fetching attendance:', error);
            showToast(t('Error loading attendance data'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const resetFilters = () => {
        setFilters({
            start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            classroom_id: '',
            student_id: '',
            student_national_id: '',
            status: '',
        });
    };

    // CRUD Operations
    const openCreateModal = () => {
        setEditingRecord(null);
        setFormData({
            student_id: '',
            classroom_id: '',
            date: new Date().toISOString().split('T')[0],
            status: 'present',
        });
        setShowModal(true);
    };

    const openEditModal = (record: AttendanceRecord) => {
        setEditingRecord(record);
        setFormData({
            student_id: String(record.student_id),
            classroom_id: String(record.classroom_id),
            date: record.date,
            status: record.status,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        try {
            // BULK OPERATION if 'all' is selected (Only for Creation)
            if (!editingRecord && (formData.student_id === 'all' || formData.classroom_id === 'all')) {
                // Determine target students
                let targetStudents = students;

                if (formData.classroom_id && formData.classroom_id !== 'all') {
                    targetStudents = targetStudents.filter(s => String(s.classroom_id) === formData.classroom_id);
                }

                if (formData.student_id !== 'all') {
                    // Single Student (but maybe "All Classes" was selected)
                    const s = students.find(x => String(x.id) === formData.student_id);
                    // Use student's actual class ID if "All Classes" was picked
                    const payload = { 
                        ...formData, 
                        classroom_id: s?.classroom_id || (formData.classroom_id === 'all' ? '' : formData.classroom_id) 
                    };
                    await axios.post('/school/attendance', payload);
                } else {
                    // ALL Students (filtered by class if specific class selected)
                    if (targetStudents.length === 0) {
                         showToast(t('No students found'), 'error');
                         setProcessing(false);
                         return;
                    }

                    const payload = {
                        classroom_id: formData.classroom_id === 'all' ? null : formData.classroom_id,
                        date: formData.date,
                        attendance: targetStudents.map(s => ({
                            student_id: s.id,
                            status: formData.status,
                            classroom_id: s.classroom_id // Send per-student class ID
                        }))
                    };
                    await axios.post('/school/attendance/bulk', payload);
                }
                showToast(t('Bulk attendance recorded successfully'), 'success');
            } else {
                // NORMAL SINGLE OPERATION
                if (editingRecord) {
                    await axios.put(`/school/attendance/${editingRecord.id}`, formData);
                    showToast(t('Attendance updated successfully'), 'success');
                } else {
                    await axios.post('/school/attendance', formData);
                    showToast(t('Attendance recorded successfully'), 'success');
                }
            }
            setShowModal(false);
            fetchData();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || t('Error saving attendance'), 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = (id: number) => {
        setRecordToDelete(id);
        setConfirmingDeletion(true);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;
        setProcessing(true);

        try {
            await axios.delete(`/school/attendance/${recordToDelete}`);
            showToast(t('Attendance record deleted'), 'success');
            fetchData();
        } catch (error) {
            showToast(t('Error deleting record'), 'error');
        } finally {
            setProcessing(false);
            setConfirmingDeletion(false);
            setRecordToDelete(null);
        }
    };

    // Bulk Attendance
    const openBulkModal = () => {
        setBulkData({
            classroom_id: '',
            date: new Date().toISOString().split('T')[0],
            attendance: [],
        });
        setShowBulkModal(true);
    };

    const handleClassSelectForBulk = async (classId: string) => {
        setBulkData(prev => ({ ...prev, classroom_id: classId }));
        if (classId) {
            // Get students in this class
            const classStudents = students.filter(s => String(s.classroom_id) === classId);
            setBulkData(prev => ({
                ...prev,
                attendance: classStudents.map(s => ({
                    student_id: s.id,
                    status: 'present' as const
                }))
            }));
        }
    };

    const toggleBulkStatus = (studentId: number) => {
        setBulkData(prev => ({
            ...prev,
            attendance: prev.attendance.map(a =>
                a.student_id === studentId
                    ? { ...a, status: a.status === 'present' ? 'absent' : 'present' }
                    : a
            )
        }));
    };

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkData.classroom_id || bulkData.attendance.length === 0) {
            showToast(t('Please select a class first'), 'error');
            return;
        }
        setProcessing(true);

        try {
            await axios.post('/school/attendance/bulk', bulkData);
            showToast(t('Bulk attendance recorded successfully'), 'success');
            setShowBulkModal(false);
            fetchData();
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || t('Error saving bulk attendance'), 'error');
        } finally {
            setProcessing(false);
        }
    };

    const markAllPresent = () => {
        setBulkData(prev => ({
            ...prev,
            attendance: prev.attendance.map(a => ({ ...a, status: 'present' as const }))
        }));
    };

    const markAllAbsent = () => {
        setBulkData(prev => ({
            ...prev,
            attendance: prev.attendance.map(a => ({ ...a, status: 'absent' as const }))
        }));
    };

    // Get selected student details for header display
    const selectedStudent = filters.student_id ?
        students.find(s => s.id === parseInt(filters.student_id)) : null;

    // Helper to get supervisor name from class ID (since it might not be in attendance record directly)
    const getSupervisorName = (classId: number) => {
        const cls = classrooms.find(c => c.id === classId);
        if (cls?.supervisor) return cls.supervisor.name;
        if (cls?.supervisors && cls.supervisors.length > 0) return cls.supervisors[0].name;
        return '-';
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-bold text-2xl text-brand-dark dark:text-brand-yellow">
                    {t('Attendance Management')}
                </h2>
            }
        >
            <Head title={t('Attendance')} />

            <div className="space-y-6 animate-in fade-in duration-500">
                {/* --- TOAST --- */}
                {toast && (
                    <div className={`fixed top-24 ${isRtl ? 'left-8' : 'right-8'} z-[100] animate-in slide-in-from-top-4 p-4 rounded-xl shadow-2xl border flex items-center gap-3 backdrop-blur-md
                        ${toast.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' : 'bg-red-500/90 border-red-400 text-white'}`}>
                        <span>{toast.type === 'success' ? '✅' : '❌'}</span>
                        <span className="font-bold">{toast.message}</span>
                    </div>
                )}

                {/* --- HEADER WITH ACTIONS --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400">
                            {t('Track and manage student attendance records.')}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={openBulkModal}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2"
                        >
                            <span>📋</span> {t('Take Class Attendance')}
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="bg-brand-yellow hover:bg-yellow-500 text-brand-dark font-bold px-6 py-3 rounded-xl shadow-lg shadow-brand-yellow/20 transition-all flex items-center gap-2 group"
                        >
                            <span className="text-xl group-hover:rotate-90 transition-transform">+</span>
                            {t('Add Record')}
                        </button>
                    </div>
                </div>

                {/* --- FILTERS & SEARCH --- */}
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 dark:border-gray-700/50 p-6 rounded-2xl shadow-xl">
                    <h3 className="font-bold text-lg mb-4 text-brand-dark dark:text-white flex items-center gap-2">
                        <span>🔍</span> {t('Search Filtering')}
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* --- Main Search (National ID) --- */}
                        <div className="lg:col-span-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                             <label className="block text-brand-dark dark:text-blue-300 text-sm mb-2 font-bold">
                                {t('Search by ID (Student / Guardian / Supervisor)')}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all font-mono text-lg"
                                    value={filters.student_national_id}
                                    onChange={e => {
                                        const nid = e.target.value;
                                        setFilters(prev => ({...prev, student_national_id: nid}));
                                        // Optional: Auto-select student if exact match found to filter table immediately
                                        // const found = students.find(s => s.student_national_id === nid);
                                        // if (found) setFilters(prev => ({...prev, student_id: String(found.id)}));
                                    }}
                                    placeholder={t('Enter National ID...')}
                                />
                                <button
                                    onClick={fetchData}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all"
                                >
                                    {t('Search')}
                                </button>
                            </div>
                        </div>

                        {/* --- Advanced Filters --- */}
                        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <div>
                                <label className="block text-gray-500 dark:text-gray-400 text-sm mb-1 font-medium">{t('From Date')}</label>
                                <input
                                    type="date"
                                    className="w-full bg-gray-50 dark:bg-gray-900/50   dark:outline-gray-600 border rounded-xl px-3 py-2"
                                    value={filters.start_date}
                                    onChange={e => setFilters({...filters, start_date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-500 dark:text-gray-400 text-sm mb-1 font-medium">{t('To Date')}</label>
                                <input
                                    type="date"
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border rounded-xl px-3 py-2"
                                    value={filters.end_date}
                                    onChange={e => setFilters({...filters, end_date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-500 dark:text-gray-400 text-sm mb-1 font-medium">{t('Class')}</label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border rounded-xl px-3 py-2"
                                    value={filters.classroom_id}
                                    onChange={e => setFilters({...filters, classroom_id: e.target.value})}
                                >
                                    <option value="">{t('All Classes')}</option>
                                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={resetFilters}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-4 py-2 rounded-xl"
                                >
                                    {t('Reset Filters')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- STUDENT INFO CARD (Visible on Search) --- */}
                {/* --- SEARCH RESULT INFO CARD --- */}
                {filters.student_national_id && (() => {
                    const nid = filters.student_national_id;
                    const studentFound = students.find(s => s.national_id === nid || s.student_national_id === nid);
                    // Check if guardian match? We need to look through all students to find a guardian match used 
                    // (Note: Backend filters attendance, but here we scan metadata students list for specific person info)
                    // If metadata students list is partial, this might miss. But fetchMetadata loads ALL students? 
                    // Assuming students list contains full enrollment data.
                    const guardianFoundStudent = students.find(s => s.guardian?.national_id === nid); // Find ANY student linked to this guardian
                    const supervisorFoundClass = classrooms.find(c => c.teachers?.some(t => (t as any).national_id === nid) || (c.supervisor as any)?.national_id === nid);

                    if (!studentFound && !guardianFoundStudent && !supervisorFoundClass) return null;

                    return (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-brand-yellow/30 animate-in slide-in-from-top-4">
                            <div className="bg-brand-yellow/10 p-4 border-b border-brand-yellow/20 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-brand-dark dark:text-brand-yellow flex items-center gap-2">
                                    {studentFound && <span>🎓 {t('Student Found')}</span>}
                                    {!studentFound && guardianFoundStudent && <span>👨‍👩‍👧‍👦 {t('Guardian Found')}</span>}
                                    {!studentFound && !guardianFoundStudent && supervisorFoundClass && <span>👨‍🏫 {t('Supervisor Found')}</span>}
                                </h3>
                                <button 
                                    onClick={() => openCreateModal()} 
                                    className="text-sm bg-brand-dark text-white px-4 py-2 rounded-lg hover:bg-black transition shadow-lg"
                                >
                                    {t('Add Attendance Now')}
                                </button>
                            </div>
                            <div className="p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
                                {/* IMAGE SECTION */}
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-dark to-gray-800 flex flex-col items-center justify-center text-white border-4 border-brand-yellow/30 shadow-2xl shrink-0">
                                     {studentFound ? (
                                        <>
                                            <span className="text-3xl font-bold">{(studentFound.full_name || studentFound.name).charAt(0)}</span>
                                            <span className="text-[10px] mt-1 opacity-70">{t('Student')}</span>
                                        </>
                                     ) : guardianFoundStudent ? (
                                        <>
                                            <span className="text-3xl font-bold">{(guardianFoundStudent.guardian?.name || '?').charAt(0)}</span>
                                            <span className="text-[10px] mt-1 opacity-70">{t('Guardian')}</span>
                                        </>
                                     ) : (
                                        <>
                                            <span className="text-3xl font-bold">{(supervisorFoundClass?.teachers?.[0]?.name || '?').charAt(0)}</span>
                                            <span className="text-[10px] mt-1 opacity-70">{t('Teacher')}</span>
                                        </>
                                     )}
                                </div>

                                {/* DETAILS SECTION */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-center md:text-right">
                                    {studentFound && (
                                        <>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('Name')}</p>
                                                <p className="text-xl font-bold text-brand-dark dark:text-white mt-1">{studentFound.full_name || studentFound.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('Class')}</p>
                                                <p className="text-lg font-bold text-blue-600 mt-1">{studentFound.current_enrollment?.classroom?.name || classrooms.find(c => c.id === studentFound.classroom_id)?.name || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('Guardian')}</p>
                                                <p className="text-lg text-gray-700 dark:text-gray-300 mt-1">{studentFound.guardian?.name}</p>
                                            </div>
                                        </>
                                    )}

                                    {!studentFound && guardianFoundStudent && (
                                        <>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('Guardian Name')}</p>
                                                <p className="text-xl font-bold text-brand-dark dark:text-white mt-1">{guardianFoundStudent.guardian?.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('Contact')}</p>
                                                <p className="text-lg font-mono text-gray-700 dark:text-gray-300 mt-1" dir="ltr">{guardianFoundStudent.guardian?.phone}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('Children')}</p>
                                                <p className="text-sm font-bold text-blue-600 mt-1">
                                                    {students.filter(s => s.guardian?.national_id === nid).map(s => s.name).join(', ')}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {!studentFound && !guardianFoundStudent && supervisorFoundClass && (
                                        <>
                                             <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('Supervisor Name')}</p>
                                                <p className="text-xl font-bold text-brand-dark dark:text-white mt-1">{supervisorFoundClass.teachers?.[0]?.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t('Class Managed')}</p>
                                                <div className="mt-1">
                                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                                                        {supervisorFoundClass.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}


                {/* --- STATS CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl text-white">
                        <p className="text-blue-100 text-sm">{t('Total Records')}</p>
                        <p className="text-3xl font-bold mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-5 rounded-2xl text-white">
                        <p className="text-green-100 text-sm">{t('Present')}</p>
                        <p className="text-3xl font-bold mt-1">{stats.present}</p>
                        <p className="text-green-200 text-xs mt-1">
                            {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-5 rounded-2xl text-white">
                        <p className="text-red-100 text-sm">{t('Absent')}</p>
                        <p className="text-3xl font-bold mt-1">{stats.absent}</p>
                        <p className="text-red-200 text-xs mt-1">
                            {stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                </div>

                {/* --- RESULTS TABLE --- */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border dark:border-gray-700">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow"></div>
                            <p className="mt-2">{t('Loading...')}</p>
                        </div>
                    ) : attendance.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                    <tr className="text-gray-400 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                                        <th className="p-5">{t('Date')}</th>
                                        <th className="p-5">{t('Student')}</th>
                                        <th className="p-5">{t('National ID')}</th>
                                        <th className="p-5">{t('Class')}</th>
                                        <th className="p-5">{t('Supervisor')}</th>
                                        <th className="p-5 text-center">{t('Status')}</th>
                                        <th className="p-5 text-center">{t('Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {attendance.map((a) => (
                                        <tr key={a.id} className="hover:bg-brand-yellow/5 dark:hover:bg-brand-yellow/5 transition-colors">
                                            <td className="p-4 font-medium text-gray-800 dark:text-white">
                                                {new Date(a.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-yellow to-yellow-500 flex items-center justify-center font-bold text-brand-dark text-xs">
                                                        {(a.student?.full_name || a.student?.name)?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 dark:text-white">
                                                            {a.student?.full_name || a.student?.name || t('Unknown Student')}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {a.student?.student_code || `#${a.student_id}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-sm text-gray-600 dark:text-gray-400">
                                                {a.student?.national_id || a.student?.student_national_id || '-'}
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg text-xs font-bold">
                                                    {a.classroom?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                 <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    {/* Check for teachers array from backend, usually the first one is the supervisor */}
                                                    {a.classroom?.teachers?.[0]?.name || a.classroom?.supervisor?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`relative inline-flex h-8 w-24 items-center rounded-full transition-all 
                                                    ${a.status === 'present'
                                                        ? 'bg-green-500 shadow-md shadow-green-500/20'
                                                        : 'bg-red-500 shadow-md shadow-red-500/20'}`}>
                                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-200
                                                        ${a.status === 'present' ? 'translate-x-[4.25rem] rtl:-translate-x-1' : 'translate-x-1 rtl:-translate-x-[4.25rem]'}`}
                                                    />
                                                    <span className={`absolute text-xs font-bold text-white w-full text-center uppercase tracking-wider
                                                        ${a.status === 'present' ? 'pr-6 rtl:pl-6' : 'pl-6 rtl:pr-6'}`}>
                                                        {t(a.status === 'present' ? 'Present' : 'Absent')}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEditModal(a)}
                                                        className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition-all"
                                                        title={t('Edit')}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(a.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                                                        title={t('Delete')}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t dark:border-gray-700 text-center">
                                <p className="text-xs text-gray-400">
                                    {t('Showing')} {attendance.length} {t('records')}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-10 text-center">
                            <div className="text-4xl mb-4">📋</div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                {t('No attendance data found')}
                            </p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                                {t('Click Search to load records or Add Record to create new ones')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- SINGLE RECORD MODAL --- */}
            <Modal show={showModal} onClose={() => setShowModal(false)} maxWidth="lg">
                <div className="p-0 overflow-hidden rounded-2xl dark:bg-gray-800">
                    <div className="bg-brand-dark p-6 flex justify-between items-center text-white">
                        <div>
                            <h2 className="text-xl font-bold">
                                {editingRecord ? t('Edit Attendance') : t('Add Attendance Record')}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {t('Record student attendance')}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowModal(false)}
                            className="text-gray-400 hover:text-white transition"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel value={t('Class')} className="dark:text-gray-300 font-bold"/>
                                <select
                                    value={formData.classroom_id}
                                    onChange={e => setFormData({...formData, classroom_id: e.target.value})}
                                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-brand-yellow focus:border-brand-yellow mt-1 p-3"
                                    required
                                    disabled={!!editingRecord}
                                >
                                    <option value="">{t('Select Class')}</option>
                                    {!editingRecord && <option value="all">{t('All Classes')}</option>}
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <InputLabel value={t('Student')} className="dark:text-gray-300 font-bold"/>
                                <select
                                    value={formData.student_id}
                                    onChange={e => setFormData({...formData, student_id: e.target.value})}
                                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-brand-yellow focus:border-brand-yellow mt-1 p-3"
                                    required
                                    disabled={!!editingRecord}
                                >
                                    <option value="">{t('Select Student')}</option>
                                    {!editingRecord && <option value="all">{t('All Students')}</option>}
                                    {students
                                        .filter(s => 
                                            formData.classroom_id === 'all' || 
                                            !formData.classroom_id || 
                                            String(s.classroom_id) === formData.classroom_id
                                        )
                                        .map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} {s.student_national_id ? `(${s.student_national_id})` : ''} 
                                                {(formData.classroom_id === 'all' || !formData.classroom_id) && s.classroom_id 
                                                    ? ` - ${classrooms.find(c => c.id === s.classroom_id)?.name}` 
                                                    : ''}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel value={t('Date')} className="dark:text-gray-300 font-bold"/>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-brand-yellow focus:border-brand-yellow mt-1 p-3"
                                    required
                                />
                            </div>
                                <div>
                                    <InputLabel value={t('Status')} className="dark:text-gray-300 font-bold"/>
                                    <div className="flex justify-center mt-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({...formData, status: formData.status === 'present' ? 'absent' : 'present'})}
                                            className={`relative inline-flex h-12 w-48 items-center rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-offset-2
                                                ${formData.status === 'present'
                                                    ? 'bg-green-500 focus:ring-green-400 shadow-xl shadow-green-500/30'
                                                    : 'bg-red-500 focus:ring-red-400 shadow-xl shadow-red-500/30'}`}
                                        >
                                            <span className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out
                                                ${formData.status === 'present' ? 'translate-x-[9rem] rtl:-translate-x-1' : 'translate-x-1 rtl:-translate-x-[9rem]'}`}
                                            ></span>
                                            <span className={`absolute text-base font-bold text-white w-full text-center uppercase tracking-wider
                                                ${formData.status === 'present' ? 'pr-10 rtl:pl-10' : 'pl-10 rtl:pr-10'}`}>
                                                {t(formData.status === 'present' ? 'Present' : 'Absent')}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                        </div>

                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 -mx-6 -mb-6 p-6 mt-8">
                            <SecondaryButton
                                onClick={() => setShowModal(false)}
                                className="rounded-xl"
                                disabled={processing}
                            >
                                {t('Cancel')}
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={processing}
                                className="bg-brand-dark rounded-xl px-10"
                            >
                                {processing ? t('Saving...') : (editingRecord ? t('Update') : t('Save'))}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* --- BULK ATTENDANCE MODAL --- */}
            <Modal show={showBulkModal} onClose={() => setShowBulkModal(false)} maxWidth="xl">
                <div className="p-0 overflow-hidden rounded-2xl dark:bg-gray-800">
                    <div className="bg-brand-dark p-6 flex justify-between items-center text-white">
                        <div>
                            <h2 className="text-xl font-bold">{t('Take Class Attendance')}</h2>
                            <p className="text-gray-400 text-sm">
                                {t('Mark attendance for all students in a class')}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowBulkModal(false)}
                            className="text-gray-400 hover:text-white transition"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleBulkSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel value={t('Select Class')} className="dark:text-gray-300 font-bold"/>
                                <select
                                    value={bulkData.classroom_id}
                                    onChange={e => handleClassSelectForBulk(e.target.value)}
                                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-brand-yellow focus:border-brand-yellow mt-1 p-3"
                                    required
                                >
                                    <option value="">{t('Select Class')}</option>
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <InputLabel value={t('Date')} className="dark:text-gray-300 font-bold"/>
                                <input
                                    type="date"
                                    value={bulkData.date}
                                    onChange={e => setBulkData({...bulkData, date: e.target.value})}
                                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-brand-yellow focus:border-brand-yellow mt-1 p-3"
                                    required
                                />
                            </div>
                        </div>

                        {bulkData.attendance.length > 0 && (
                            <>
                                <div className="flex gap-2 justify-center pb-2">
                                    <button
                                        type="button"
                                        onClick={markAllPresent}
                                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition"
                                    >
                                        ✓ {t('All Present')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={markAllAbsent}
                                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition"
                                    >
                                        ✗ {t('All Absent')}
                                    </button>
                                </div>

                                <div className="max-h-96 overflow-y-auto border dark:border-gray-700 rounded-xl">
                                    <table className="w-full">
                                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10">
                                            <tr className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                                                <th className="p-4 text-left">{t('Student')}</th>
                                                <th className="p-4 text-center">{t('National ID')}</th>
                                                <th className="p-4 text-center w-32">{t('Status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {bulkData.attendance.map((record, index) => {
                                                const student = students.find(s => s.id === record.student_id);
                                                return (
                                                    <tr key={record.student_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-gray-300 text-[10px] w-4 text-center font-mono">#{index + 1}</span>
                                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-yellow to-yellow-500 flex items-center justify-center font-bold text-brand-dark shadow-sm text-xs">
                                                                     {(student?.full_name || student?.name)?.charAt(0) || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-800 dark:text-white text-sm">
                                                                        {student?.full_name || student?.name || t('Unknown')}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400">
                                                                         {student?.student_code || '-'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center font-mono text-xs text-gray-500 dark:text-gray-400">
                                                             {student?.student_national_id || student?.national_id || '-'}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleBulkStatus(record.student_id)}
                                                                className={`relative inline-flex h-7 w-20 items-center rounded-full transition-all focus:outline-none 
                                                                    ${record.status === 'present'
                                                                        ? 'bg-green-500 hover:bg-green-600'
                                                                        : 'bg-red-500 hover:bg-red-600'}`}
                                                            >
                                                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200
                                                                    ${record.status === 'present' ? 'translate-x-[3.25rem] rtl:-translate-x-1' : 'translate-x-1 rtl:-translate-x-[3.25rem]'}`}
                                                                />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {bulkData.classroom_id && bulkData.attendance.length === 0 && (
                            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                                {t('No students found in this class')}
                            </div>
                        )}

                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 -mx-6 -mb-6 p-6 mt-8">
                            <SecondaryButton
                                onClick={() => setShowBulkModal(false)}
                                className="rounded-xl"
                                disabled={processing}
                            >
                                {t('Cancel')}
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={processing || bulkData.attendance.length === 0}
                                className="bg-brand-dark rounded-xl px-10"
                            >
                                {processing ? t('Saving...') : t('Save Attendance')}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
            
            {/* Delete Confirmation Modal */}
            <Modal
                show={confirmingDeletion}
                onClose={() => setConfirmingDeletion(false)}
                maxWidth="sm"
            >
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {t('Delete Attendance Record?')}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {t('Are you sure you want to delete this record? This action cannot be undone.')}
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <SecondaryButton onClick={() => setConfirmingDeletion(false)}>
                            {t('Cancel')}
                        </SecondaryButton>
                        <PrimaryButton
                            className="bg-red-600 hover:bg-red-700"
                            onClick={confirmDelete}
                            disabled={processing}
                        >
                            {t('Delete')}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </SchoolAuthenticatedLayout>
    );
}