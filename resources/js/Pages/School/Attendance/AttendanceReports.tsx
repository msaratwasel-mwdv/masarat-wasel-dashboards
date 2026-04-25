import React, { useEffect, useState } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, usePage } from "@inertiajs/react";
import axios from "axios";
import { useTheme } from "@/Contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import PrintReportHeader from "@/Components/PrintReportHeader";
import { Search, Plus, CalendarCheck, Check, X, Users, Edit3, Trash2 , Printer} from "lucide-react";
import {
    DS_card,
    DS_pageTitle,
    DS_btnPrimary,
    DS_btnGold,
    DS_btnSecondary,
    DS_inputCls,
    DS_labelCls,
    DS_tableWrapper,
    DS_tableBase,
    DS_tableHead,
    DS_tableTh,
    DS_tableRow,
    DS_tableTd,
    DS_modalContainer,
    DS_modalHeader,
    DS_modalHeaderTitle,
    DS_modalHeaderAccent,
    DS_modalClose,
    DS_modalBody,
    DS_cancelBtn,
    DS_submitBtn,
    DS_statCard,
    DS_statIcon,
    DS_statLabel,
    DS_statValue2,
    DS_btnEdit,
    DS_btnDanger
} from "@/lib/DS";

// Types
interface Student {
    id: number;
    name: string;
    full_name?: string;
    student_code?: string;
    national_id?: string;
    student_national_id: string;
    classroom_id: number;
    guardian?: { name: string; phone: string; national_id?: string };
    current_enrollment?: { classroom?: { id: number; name: string } };
}

interface Classroom {
    id: number;
    name: string;
    teachers?: any[];
    supervisor?: any;
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


// Print CSS
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

export default function AttendanceReports() {
    const { isRTL: isRtl } = useTheme();
    const { auth } = usePage().props as any;
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        student_id: '',
        classroom_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present' as 'present' | 'absent',
    });

    const [bulkData, setBulkData] = useState({
        classroom_id: '',
        date: new Date().toISOString().split('T')[0],
        attendance: [] as { student_id: number; status: 'present' | 'absent' }[],
    });

    const [filters, setFilters] = useState({
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        classroom_id: '',
        student_national_id: '',
    });

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
            showToast((isRtl ? 'خطأ في تحميل البيانات' : 'Error loading metadata'), 'error');
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
            if (filters.student_national_id) params.student_national_id = filters.student_national_id;

            const res = await axios.get('/school/attendance', { params });
            let data = res.data;

            // Optional client filter for ID just in case
            if (filters.student_national_id) {
                data = data.filter((r: AttendanceRecord) =>
                    r.student?.student_national_id?.includes(filters.student_national_id) ||
                    r.student?.national_id?.includes(filters.student_national_id)
                );
            }

            setAttendance(data);

            const total = data.length;
            const present = data.filter((a: AttendanceRecord) => a.status === 'present').length;
            const absent = data.filter((a: AttendanceRecord) => a.status === 'absent').length;
            setStats({ total, present, absent });
        } catch (error) {
            console.error('Error fetching attendance:', error);
            showToast((isRtl ? 'خطأ في تحميل بيانات الحضور' : 'Error loading attendance data'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Single Record Modal
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
            if (!editingRecord && (formData.student_id === 'all' || formData.classroom_id === 'all')) {
                // Bulk (using Create modal 'all' options)
                let targetStudents = students;
                if (formData.classroom_id && formData.classroom_id !== 'all') {
                    targetStudents = targetStudents.filter(s => String(s.classroom_id) === formData.classroom_id);
                }
                if (formData.student_id !== 'all') {
                    const s = students.find(x => String(x.id) === formData.student_id);
                    const payload = { ...formData, classroom_id: s?.classroom_id || formData.classroom_id };
                    await axios.post('/school/attendance', payload);
                } else {
                    if (targetStudents.length === 0) {
                        showToast((isRtl ? 'لا يوجد طلاب' : 'No students found'), 'error');
                        setProcessing(false);
                        return;
                    }
                    const payload = {
                        classroom_id: formData.classroom_id === 'all' ? null : formData.classroom_id,
                        date: formData.date,
                        attendance: targetStudents.map(s => ({
                            student_id: s.id,
                            status: formData.status,
                            classroom_id: s.classroom_id
                        }))
                    };
                    await axios.post('/school/attendance/bulk', payload);
                }
                showToast((isRtl ? 'تم تسجيل الحضور الجماعي بنجاح' : 'Bulk attendance recorded successfully'), 'success');
            } else {
                if (editingRecord) {
                    await axios.put(`/school/attendance/${editingRecord.id}`, formData);
                    showToast((isRtl ? 'تم تحديث الحضور بنجاح' : 'Attendance updated successfully'), 'success');
                } else {
                    await axios.post('/school/attendance', formData);
                    showToast((isRtl ? 'تم تسجيل الحضور بنجاح' : 'Attendance recorded successfully'), 'success');
                }
            }
            setShowModal(false);
            fetchData();
        } catch (error: any) {
            showToast(error.response?.data?.message || (isRtl ? 'خطأ في الحفظ' : 'Error saving attendance'), 'error');
        } finally {
            setProcessing(false);
        }
    };

    // Bulk Modal
    const openBulkModal = () => {
        setBulkData({
            classroom_id: '',
            date: new Date().toISOString().split('T')[0],
            attendance: [],
        });
        setShowBulkModal(true);
    };

    const handleClassSelectForBulk = (classId: string) => {
        setBulkData(prev => ({ ...prev, classroom_id: classId }));
        if (classId) {
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
                a.student_id === studentId ? { ...a, status: a.status === 'present' ? 'absent' : 'present' } : a
            )
        }));
    };

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkData.classroom_id || bulkData.attendance.length === 0) return;
        setProcessing(true);
        try {
            await axios.post('/school/attendance/bulk', bulkData);
            showToast((isRtl ? 'تم تسجيل الحضور الجماعي بنجاح' : 'Bulk attendance recorded successfully'), 'success');
            setShowBulkModal(false);
            fetchData();
        } catch (error: any) {
            showToast(error.response?.data?.message || (isRtl ? 'خطأ في الحفظ' : 'Error saving bulk attendance'), 'error');
        } finally {
            setProcessing(false);
        }
    };

    // Delete
    const handleDelete = (id: number) => {
        setRecordToDelete(id);
        setConfirmingDeletion(true);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;
        setProcessing(true);
        try {
            await axios.delete(`/school/attendance/${recordToDelete}`);
            showToast((isRtl ? 'تم حذف السجل' : 'Attendance record deleted'), 'success');
            fetchData();
        } catch (error) {
            showToast((isRtl ? 'خطأ في الحذف' : 'Error deleting record'), 'error');
        } finally {
            setProcessing(false);
            setConfirmingDeletion(false);
            setRecordToDelete(null);
        }
    };

    // Find student info for the search card
    const handlePrint = () => window.print();

    const getFoundEntity = () => {
        if (!filters.student_national_id) return null;
        const nid = filters.student_national_id;
        const studentFound = students.find(s => s.national_id === nid || s.student_national_id === nid);
        const guardianFoundStudent = students.find(s => s.guardian?.national_id === nid);
        const supervisorFoundClass = classrooms.find(c => c.teachers?.some(t => t.national_id === nid) || c.supervisor?.national_id === nid);

        if (studentFound) return { type: 'student', data: studentFound };
        if (guardianFoundStudent) return { type: 'guardian', data: guardianFoundStudent };
        if (supervisorFoundClass) return { type: 'supervisor', data: supervisorFoundClass };
        return null;
    };
    const foundEntity = getFoundEntity();

    return (
        <SchoolAuthenticatedLayout user={auth.user}>
            <Head title={(isRtl ? 'تقرير الحضور اليومي' : 'Daily Attendance Report')} />

            <style>{PRINT_STYLES}</style>

            {/* Print Area */}
            <div id="print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRtl ? 'rtl' : 'ltr'}>
                <PrintReportHeader 
                    title={(isRtl ? 'تقرير الحضور اليومي' : 'Daily Attendance Report')}
                    schoolName={auth.user?.school?.name || (isRtl ? 'اسم المدرسة غير متوفر' : 'School name not available')}
                    schoolLogo={auth.user?.school?.logo || null}
                    printDate={`${isRtl ? 'تاريخ الطباعة' : 'Print Date'}: ${new Date().toLocaleDateString(isRtl ? "ar-SA" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' })}`}
                    schoolAdminText={(isRtl ? 'إدارة المدرسة' : 'School Admin')}
                />
                <div className="px-4">
                    <table className="w-full border-collapse border border-gray-300 text-[10px]">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-1.5 text-right font-bold w-8 text-black">#</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{(isRtl ? 'التاريخ' : 'Date')}</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{(isRtl ? 'اسم الطالب' : 'Student Name')}</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{(isRtl ? 'الرقم المدني' : 'Civil ID')}</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{(isRtl ? 'الفصل' : 'Class')}</th>
                                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{(isRtl ? 'المشرف' : 'Supervisor')}</th>
                                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{(isRtl ? 'الحالة' : 'Status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.map((a, i) => (
                                <tr key={a.id} className="border-b border-gray-300">
                                    <td className="border border-gray-300 p-1.5 text-center text-gray-700 font-semibold">{i + 1}</td>
                                    <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{new Date(a.date).toLocaleDateString('en-GB')}</td>
                                    <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{a.student?.full_name || a.student?.name || (isRtl ? 'غير معروف' : 'Unknown')}</td>
                                    <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{a.student?.national_id || a.student?.student_national_id || '-'}</td>
                                    <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{a.classroom?.name || '-'}</td>
                                    <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{a.classroom?.teachers?.[0]?.name || a.classroom?.supervisor?.name || '-'}</td>
                                    <td className="border border-gray-300 p-1.5 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${a.status === 'present' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                            {a.status === 'present' ? (isRtl ? 'حاضر' : 'Present') : (isRtl ? 'غائب' : 'Absent')}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
                        <p>{(isRtl ? 'إجمالي السجلات' : 'Total Records')}: {stats.total}</p>
                        <p>{(isRtl ? 'توقيع المدير' : 'Principal Signature')}: ............................</p>
                    </div>
                </div>
            </div>


            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-[16px] shadow-2xl font-bold text-sm ${
                            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                        }`}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="pb-8 space-y-6 print:hidden">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className={DS_pageTitle}>{(isRtl ? 'تقرير الحضور اليومي' : 'Daily Attendance Report')}</h2>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                            {(isRtl ? 'تتبع وإدارة سجلات حضور الطلاب' : 'Track and manage student attendance records')}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={handlePrint} className={DS_btnSecondary}>
                            <Printer className="w-4 h-4" />
                            {(isRtl ? 'طباعة' : 'Print')}
                        </button>
                        <button onClick={openBulkModal} className={DS_btnGold}>
                            <Users className="w-4 h-4" />
                            {(isRtl ? 'تحضير فصل كامل' : 'Take Class Attendance')}
                        </button>
                        <button onClick={openCreateModal} className={DS_btnPrimary}>
                            <Plus className="w-4 h-4" />
                            {(isRtl ? 'إضافة سجل' : 'Add Record')}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className={`${DS_card} p-5`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className={DS_labelCls}>{(isRtl ? 'البحث بالرقم المدني' : 'Search by ID')}</label>
                            <div className="relative">
                                <Search className={`w-4 h-4 absolute top-3.5 ${isRtl ? 'right-4' : 'left-4'} text-gray-400`} />
                                <input
                                    type="text"
                                    className={`${DS_inputCls} ${isRtl ? 'pr-11' : 'pl-11'}`}
                                    placeholder={(isRtl ? 'الرقم المدني...' : 'Civil ID...')}
                                    value={filters.student_national_id}
                                    onChange={e => setFilters({ ...filters, student_national_id: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={DS_labelCls}>{(isRtl ? 'الفصل' : 'Class')}</label>
                            <select
                                className={`${DS_inputCls} appearance-none rtl:pl-12 ltr:pr-12`} style={{ backgroundImage: "url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22currentColor%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22/%3E%3C/svg%3E')", backgroundRepeat: "no-repeat", backgroundPosition: isRtl ? "left 1rem center" : "right 1rem center", backgroundSize: "1em" }}
                                value={filters.classroom_id}
                                onChange={e => setFilters({ ...filters, classroom_id: e.target.value })}
                            >
                                <option value="">{(isRtl ? 'جميع الفصول' : 'All Classes')}</option>
                                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
                            <div>
                                <label className={DS_labelCls}>{(isRtl ? 'من تاريخ' : 'From Date')}</label>
                                    <input
                                        type="date"
                                        className={DS_inputCls}
                                    value={filters.start_date}
                                    onChange={e => setFilters({ ...filters, start_date: e.target.value })}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <label className={DS_labelCls}>{(isRtl ? 'إلى تاريخ' : 'To Date')}</label>
                                    <input
                                        type="date"
                                        className={`${DS_inputCls} appearance-none rtl:pl-12 ltr:pr-12`} style={{ backgroundImage: "url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22currentColor%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22/%3E%3C/svg%3E')", backgroundRepeat: "no-repeat", backgroundPosition: isRtl ? "left 1rem center" : "right 1rem center", backgroundSize: "1em" }}
                                        value={filters.end_date}
                                        onChange={e => setFilters({ ...filters, end_date: e.target.value })}
                                    />
                                </div>
                                <button onClick={fetchData} className="w-11 h-11 rounded-[14px] bg-[#0f2044] text-[#f5b800] flex items-center justify-center shadow-lg hover:bg-[#162d60] transition-all flex-shrink-0">
                                    <Search className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Found Entity Info Card */}
                {foundEntity && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`${DS_card} border-[#f5b800]/30`}>
                        <div className="bg-[#f5b800]/10 p-4 border-b border-[#f5b800]/20 flex justify-between items-center">
                            <h3 className="font-bold text-[#0f2044] dark:text-[#f5b800] flex items-center gap-2">
                                {foundEntity.type === 'student' && <span>🎓 {(isRtl ? 'تم العثور على الطالب' : 'Student Found')}</span>}
                                {foundEntity.type === 'guardian' && <span>👨‍👩‍👧‍👦 {(isRtl ? 'تم العثور على ولي الأمر' : 'Guardian Found')}</span>}
                                {foundEntity.type === 'supervisor' && <span>👨‍🏫 {(isRtl ? 'تم العثور على المشرف' : 'Supervisor Found')}</span>}
                            </h3>
                            <button onClick={openCreateModal} className="px-4 py-1.5 bg-[#0f2044] text-white text-xs font-bold rounded-full hover:bg-black transition-all">
                                {(isRtl ? 'إضافة حضور الآن' : 'Add Attendance Now')}
                            </button>
                        </div>
                        <div className="p-5 flex flex-col md:flex-row gap-5 items-center md:items-start text-center md:text-start">
                            <div className="w-20 h-20 rounded-[20px] bg-[#0f2044] text-[#f5b800] flex flex-col items-center justify-center border-2 border-[#f5b800]/30 shadow-lg shrink-0">
                                <span className="text-2xl font-black">
                                    {foundEntity.type === 'student' ? (foundEntity.data.full_name || foundEntity.data.name).charAt(0) :
                                     foundEntity.type === 'guardian' ? (foundEntity.data.guardian?.name || '?').charAt(0) :
                                     (foundEntity.data.teachers?.[0]?.name || '?').charAt(0)}
                                </span>
                            </div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                                {foundEntity.type === 'student' && (
                                    <>
                                        <div><p className={DS_labelCls}>{(isRtl ? 'الاسم' : 'Name')}</p><p className="font-bold text-[#0f2044] dark:text-white">{foundEntity.data.full_name || foundEntity.data.name}</p></div>
                                        <div><p className={DS_labelCls}>{(isRtl ? 'الفصل' : 'Class')}</p><p className="font-bold text-[#0f2044] dark:text-white">{foundEntity.data.current_enrollment?.classroom?.name || classrooms.find(c => c.id === foundEntity.data.classroom_id)?.name || '-'}</p></div>
                                        <div><p className={DS_labelCls}>{(isRtl ? 'ولي الأمر' : 'Guardian')}</p><p className="font-bold text-[#0f2044] dark:text-white">{foundEntity.data.guardian?.name}</p></div>
                                    </>
                                )}
                                {foundEntity.type === 'guardian' && (
                                    <>
                                        <div><p className={DS_labelCls}>{(isRtl ? 'الاسم' : 'Name')}</p><p className="font-bold text-[#0f2044] dark:text-white">{foundEntity.data.guardian?.name}</p></div>
                                        <div><p className={DS_labelCls}>{(isRtl ? 'رقم الجوال' : 'Phone')}</p><p className="font-bold font-mono text-[#0f2044] dark:text-white">{foundEntity.data.guardian?.phone}</p></div>
                                        <div><p className={DS_labelCls}>{(isRtl ? 'الأبناء' : 'Children')}</p><p className="font-bold text-[#0f2044] dark:text-white">{students.filter(s => s.guardian?.national_id === filters.student_national_id).map(s => s.name).join(', ')}</p></div>
                                    </>
                                )}
                                {foundEntity.type === 'supervisor' && (
                                    <>
                                        <div><p className={DS_labelCls}>{(isRtl ? 'اسم المشرف' : 'Supervisor Name')}</p><p className="font-bold text-[#0f2044] dark:text-white">{foundEntity.data.teachers?.[0]?.name}</p></div>
                                        <div><p className={DS_labelCls}>{(isRtl ? 'الفصل المشرف عليه' : 'Class Managed')}</p><span className="px-3 py-1 bg-[#0f2044] text-[#f5b800] rounded-full text-xs font-bold">{foundEntity.data.name}</span></div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className={DS_statCard('blue')}>
                        <div className={DS_statIcon('blue')}><CalendarCheck className="w-6 h-6" /></div>
                        <div><p className={DS_statLabel}>{(isRtl ? 'إجمالي السجلات' : 'Total Records')}</p><p className={DS_statValue2('blue')}>{stats.total}</p></div>
                    </div>
                    <div className={DS_statCard('green')}>
                        <div className={DS_statIcon('green')}><Check className="w-6 h-6" /></div>
                        <div>
                            <p className={DS_statLabel}>{(isRtl ? 'حاضر' : 'Present')}</p>
                            <p className={DS_statValue2('green')}>{stats.present}</p>
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%</p>
                        </div>
                    </div>
                    <div className={DS_statCard('red')}>
                        <div className={DS_statIcon('red')}><X className="w-6 h-6" /></div>
                        <div>
                            <p className={DS_statLabel}>{(isRtl ? 'غائب' : 'Absent')}</p>
                            <p className={DS_statValue2('red')}>{stats.absent}</p>
                            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 mt-1">{stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}%</p>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className={DS_card}>
                    {loading ? (
                        <div className="p-16 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-[#0f2044]/20 border-t-[#f5b800] rounded-full animate-spin mb-4" />
                            <p className="text-gray-500 font-bold">{(isRtl ? 'جاري تحميل البيانات...' : 'Loading data...')}</p>
                        </div>
                    ) : attendance.length > 0 ? (
                        <div className={DS_tableWrapper}>
                            <table className={DS_tableBase}>
                                <thead className={DS_tableHead}>
                                    <tr>
                                        <th className={DS_tableTh(isRtl)}>{(isRtl ? 'التاريخ' : 'Date')}</th>
                                        <th className={DS_tableTh(isRtl)}>{(isRtl ? 'الطالب' : 'Student')}</th>
                                        <th className={DS_tableTh(isRtl)}>{(isRtl ? 'الرقم المدني' : 'Civil ID')}</th>
                                        <th className={DS_tableTh(isRtl)}>{(isRtl ? 'الفصل' : 'Class')}</th>
                                        <th className={DS_tableTh(isRtl)}>{(isRtl ? 'المشرف' : 'Supervisor')}</th>
                                        <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#0f2044]/60 dark:text-[#7ba7e8]/70 text-center">{(isRtl ? 'الحالة' : 'Status')}</th>
                                        <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#0f2044]/60 dark:text-[#7ba7e8]/70 text-end">{(isRtl ? 'الإجراءات' : 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-[#243460]">
                                    {attendance.map((a) => (
                                        <tr key={a.id} className={DS_tableRow}>
                                            <td className={DS_tableTd}>
                                                <span className="font-bold font-mono text-[#0f2044] dark:text-white bg-[#0f2044]/5 dark:bg-[#0f2044]/30 px-3 py-1.5 rounded-lg border border-[#0f2044]/10 dark:border-[#243460]">
                                                    {new Date(a.date).toLocaleDateString('en-GB')}
                                                </span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#0f2044] dark:text-white">{a.student?.full_name || a.student?.name || (isRtl ? 'غير معروف' : 'Unknown')}</span>
                                                    <span className="text-xs text-gray-500 font-mono mt-0.5">#{a.student?.student_code || a.student_id}</span>
                                                </div>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="font-mono text-[#0f2044]/70 dark:text-gray-400 text-xs font-bold">{a.student?.national_id || a.student?.student_national_id || '-'}</span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="px-3 py-1 rounded-[8px] text-xs font-bold bg-[#0f2044]/5 text-[#0f2044] border border-[#0f2044]/10 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                                    {a.classroom?.name || '-'}
                                                </span>
                                            </td>
                                            <td className={DS_tableTd}>
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                    {a.classroom?.teachers?.[0]?.name || a.classroom?.supervisor?.name || '-'}
                                                </span>
                                            </td>
                                            <td className={`${DS_tableTd} text-center`}>
                                                {a.status === 'present' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 shadow-sm">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> {(isRtl ? 'حاضر' : 'Present')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50 shadow-sm">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {(isRtl ? 'غائب' : 'Absent')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`${DS_tableTd} text-end`}>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEditModal(a)} className={DS_btnEdit} title={(isRtl ? 'تعديل' : 'Edit')}><Edit3 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(a.id)} className={DS_btnDanger} title={(isRtl ? 'حذف' : 'Delete')}><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-16 flex flex-col items-center justify-center opacity-60">
                            <div className="w-16 h-16 mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-3xl">📭</div>
                            <p className="text-gray-500 font-bold">{(isRtl ? 'لا توجد سجلات حضور' : 'No attendance records found')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Single Record Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-[#0f2044]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className={`bg-white dark:bg-[#1a2845] rounded-[24px] max-w-lg w-full ${DS_modalContainer} shadow-2xl border border-white/10`}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={DS_modalHeader(isRtl)}>
                                <div className="flex items-center gap-3">
                                    <div className={DS_modalHeaderAccent} />
                                    <h2 className={DS_modalHeaderTitle}>{editingRecord ? (isRtl ? 'تعديل الحضور' : 'Edit Attendance') : (isRtl ? 'إضافة سجل حضور' : 'Add Record')}</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className={DS_modalClose}><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className={`${DS_modalBody} min-h-[400px]`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={DS_labelCls}>{(isRtl ? 'الفصل' : 'Class')}</label>
                                        <select value={formData.classroom_id} onChange={e => setFormData({ ...formData, classroom_id: e.target.value })} className={`${DS_inputCls} appearance-none rtl:pl-12 ltr:pr-12`} style={{ backgroundImage: "url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22currentColor%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22/%3E%3C/svg%3E')", backgroundRepeat: "no-repeat", backgroundPosition: isRtl ? "left 1rem center" : "right 1rem center", backgroundSize: "1em" }} required disabled={!!editingRecord}>
                                            <option value="">{(isRtl ? 'الفصل' : 'Select Class')}</option>
                                            {!editingRecord && <option value="all">{(isRtl ? 'جميع الفصول' : 'All Classes')}</option>}
                                            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={DS_labelCls}>{(isRtl ? 'الطالب' : 'Student')}</label>
                                        <select value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })} className={`${DS_inputCls} appearance-none rtl:pl-12 ltr:pr-12`} style={{ backgroundImage: "url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22currentColor%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22/%3E%3C/svg%3E')", backgroundRepeat: "no-repeat", backgroundPosition: isRtl ? "left 1rem center" : "right 1rem center", backgroundSize: "1em" }} required disabled={!!editingRecord}>
                                            <option value="">{(isRtl ? 'اختر الطالب' : 'Select Student')}</option>
                                            {!editingRecord && <option value="all">{(isRtl ? 'جميع الطلاب' : 'All Students')}</option>}
                                            {students
                                                .filter(s => formData.classroom_id === 'all' || !formData.classroom_id || String(s.classroom_id) === formData.classroom_id)
                                                .map(s => <option key={s.id} value={s.id}>{s.name} {s.student_national_id ? `(${s.student_national_id})` : ''}</option>)
                                            }
                                        </select>
                                    </div>
                                    <div>
                                        <label className={DS_labelCls}>{(isRtl ? 'التاريخ' : 'Date')}</label>
                                        <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className={DS_inputCls} required />
                                    </div>
                                    <div>
                                        <label className={DS_labelCls}>{(isRtl ? 'الحالة' : 'Status')}</label>
                                        <div className="flex h-[42px] bg-[#0f2044]/5 dark:bg-[#0f2044]/30 rounded-[14px] p-1 border border-[#0f2044]/10 dark:border-[#243460]">
                                            <button type="button" onClick={() => setFormData({ ...formData, status: 'present' })} className={`flex-1 rounded-[10px] text-xs font-bold transition-all ${formData.status === 'present' ? 'bg-emerald-500 text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}>{(isRtl ? 'حاضر' : 'Present')}</button>
                                            <button type="button" onClick={() => setFormData({ ...formData, status: 'absent' })} className={`flex-1 rounded-[10px] text-xs font-bold transition-all ${formData.status === 'absent' ? 'bg-red-500 text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}>{(isRtl ? 'غائب' : 'Absent')}</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-[#243460] mt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className={DS_cancelBtn}>{(isRtl ? 'إلغاء' : 'Cancel')}</button>
                                    <button type="submit" disabled={processing} className={DS_submitBtn(processing)}>{processing ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (editingRecord ? (isRtl ? 'تحديث' : 'Update') : (isRtl ? 'حفظ' : 'Save'))}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bulk Attendance Modal */}
            <AnimatePresence>
                {showBulkModal && (
                    <div className="fixed inset-0 bg-[#0f2044]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBulkModal(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className={`bg-white dark:bg-[#1a2845] rounded-[24px] max-w-2xl w-full ${DS_modalContainer} shadow-2xl border border-white/10`}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={DS_modalHeader(isRtl)}>
                                <div className="flex items-center gap-3">
                                    <div className={DS_modalHeaderAccent} />
                                    <div>
                                        <h2 className={DS_modalHeaderTitle}>{(isRtl ? 'تحضير فصل كامل' : 'Take Class Attendance')}</h2>
                                        <p className="text-white/70 text-xs mt-0.5">{(isRtl ? 'تسجيل الحضور لجميع طلاب الفصل دفعة واحدة' : 'Mark attendance for all students in a class')}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowBulkModal(false)} className={DS_modalClose}><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleBulkSubmit} className={`${DS_modalBody} max-h-[80vh] flex flex-col`}>
                                <div className="grid grid-cols-2 gap-4 shrink-0">
                                    <div>
                                        <label className={DS_labelCls}>{(isRtl ? 'الفصل' : 'Select Class')}</label>
                                        <select value={bulkData.classroom_id} onChange={e => handleClassSelectForBulk(e.target.value)} className={`${DS_inputCls} appearance-none rtl:pl-12 ltr:pr-12`} style={{ backgroundImage: "url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22currentColor%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22/%3E%3C/svg%3E')", backgroundRepeat: "no-repeat", backgroundPosition: isRtl ? "left 1rem center" : "right 1rem center", backgroundSize: "1em" }} required>
                                            <option value="">{(isRtl ? 'الفصل' : 'Select Class')}</option>
                                            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={DS_labelCls}>{(isRtl ? 'التاريخ' : 'Date')}</label>
                                        <input type="date" value={bulkData.date} onChange={e => setBulkData({ ...bulkData, date: e.target.value })} className={DS_inputCls} required />
                                    </div>
                                </div>

                                {bulkData.attendance.length > 0 && (
                                    <div className="flex-1 overflow-hidden flex flex-col mt-4">
                                        <div className="flex gap-2 justify-end mb-3 shrink-0">
                                            <button type="button" onClick={() => setBulkData(p => ({ ...p, attendance: p.attendance.map(a => ({ ...a, status: 'present' })) }))} className="px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all flex items-center gap-1"><Check className="w-3.5 h-3.5"/> {(isRtl ? 'الكل حاضر' : 'All Present')}</button>
                                            <button type="button" onClick={() => setBulkData(p => ({ ...p, attendance: p.attendance.map(a => ({ ...a, status: 'absent' })) }))} className="px-4 py-1.5 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800/50 rounded-lg text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-1"><X className="w-3.5 h-3.5"/> {(isRtl ? 'الكل غائب' : 'All Absent')}</button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto border border-[#0f2044]/10 dark:border-[#243460] rounded-[16px]">
                                            <table className="w-full text-sm">
                                                <thead className="bg-[#0f2044]/5 dark:bg-[#0f2044]/40 sticky top-0 z-10 backdrop-blur-md">
                                                    <tr>
                                                        <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#0f2044]/60 dark:text-[#7ba7e8]/70 text-start">{(isRtl ? 'الطالب' : 'Student')}</th>
                                                        <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#0f2044]/60 dark:text-[#7ba7e8]/70 text-center w-32">{(isRtl ? 'الحالة' : 'Status')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#0f2044]/5 dark:divide-[#243460]">
                                                    {bulkData.attendance.map((record, index) => {
                                                        const student = students.find(s => s.id === record.student_id);
                                                        return (
                                                            <tr key={record.student_id} className="hover:bg-[#0f2044]/[0.02] dark:hover:bg-[#0f2044]/20 transition-colors">
                                                                <td className="px-4 py-2.5">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-gray-400 font-mono text-[10px] w-4 text-center">#{index + 1}</span>
                                                                        <div>
                                                                            <p className="font-bold text-[#0f2044] dark:text-white text-sm">{student?.full_name || student?.name}</p>
                                                                            <p className="font-mono text-[10px] text-gray-500">{student?.national_id || student?.student_national_id}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2.5 text-center">
                                                                    <div className="flex p-0.5 bg-[#0f2044]/5 dark:bg-[#0f2044]/30 rounded-lg w-full border border-[#0f2044]/10 dark:border-[#243460]">
                                                                        <button type="button" onClick={() => toggleBulkStatus(record.student_id)} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${record.status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-[#0f2044] dark:hover:text-white'}`}>{(isRtl ? 'حاضر' : 'Present')}</button>
                                                                        <button type="button" onClick={() => toggleBulkStatus(record.student_id)} className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${record.status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:text-[#0f2044] dark:hover:text-white'}`}>{(isRtl ? 'غائب' : 'Absent')}</button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {bulkData.classroom_id && bulkData.attendance.length === 0 && (
                                    <div className="text-center p-8 text-gray-500 dark:text-gray-400 font-bold border-2 border-dashed border-[#0f2044]/10 dark:border-[#243460] rounded-[16px] mt-4">
                                        {(isRtl ? 'لا يوجد طلاب في هذا الفصل' : 'No students found in this class')}
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-[#0f2044]/10 dark:border-[#243460] mt-4 shrink-0">
                                    <button type="button" onClick={() => setShowBulkModal(false)} className={DS_cancelBtn}>{(isRtl ? 'إلغاء' : 'Cancel')}</button>
                                    <button type="submit" disabled={processing || bulkData.attendance.length === 0} className={DS_submitBtn(processing || bulkData.attendance.length === 0)}>
                                        {processing ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ التحضير' : 'Save Attendance')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirm Delete Modal */}
            <AnimatePresence>
                {confirmingDeletion && (
                    <div className="fixed inset-0 bg-[#0f2044]/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setConfirmingDeletion(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-[#1a2845] rounded-[24px] max-w-sm w-full p-8 shadow-2xl text-center border border-white/10"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-[18px] flex items-center justify-center mx-auto mb-5 rotate-12">
                                <Trash2 className="w-8 h-8 -rotate-12" />
                            </div>
                            <h2 className="text-xl font-black text-[#0f2044] dark:text-white mb-2">{(isRtl ? 'حذف السجل؟' : 'Delete Record?')}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                {(isRtl ? 'هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this record? This action cannot be undone.')}
                            </p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => setConfirmingDeletion(false)} className={DS_cancelBtn}>{(isRtl ? 'إلغاء' : 'Cancel')}</button>
                                <button onClick={confirmDelete} disabled={processing} className="px-6 py-2.5 rounded-[14px] bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all disabled:opacity-50">
                                    {processing ? (isRtl ? 'جاري الحذف...' : 'Deleting...') : (isRtl ? 'حذف' : 'Delete')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </SchoolAuthenticatedLayout>
    );
}