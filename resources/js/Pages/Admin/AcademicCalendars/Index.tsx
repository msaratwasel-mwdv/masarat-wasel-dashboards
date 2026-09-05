import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import React, { useState, useEffect } from "react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar as CalendarIcon,
    CheckCircle2,
    XCircle,
    Plus,
    Pencil,
    Trash2,
    X,
    School as SchoolIcon,
    CalendarDays,
} from "lucide-react";

interface School {
    id: number;
    name: string;
}

interface AcademicCalendar {
    id: number;
    school_id: number;
    name: string;
    start_date: string;
    end_date: string;
    working_days: string[] | string;
    is_active: boolean;
    school?: School;
}

interface Props {
    calendars: AcademicCalendar[];
    schools: School[];
}

const ALL_DAYS = [
    { value: "sunday", labelAr: "الأحد", labelEn: "Sunday" },
    { value: "monday", labelAr: "الإثنين", labelEn: "Monday" },
    { value: "tuesday", labelAr: "الثلاثاء", labelEn: "Tuesday" },
    { value: "wednesday", labelAr: "الأربعاء", labelEn: "Wednesday" },
    { value: "thursday", labelAr: "الخميس", labelEn: "Thursday" },
    { value: "friday", labelAr: "الجمعة", labelEn: "Friday" },
    { value: "saturday", labelAr: "السبت", labelEn: "Saturday" },
];

export default function AcademicCalendarsIndex({ calendars, schools }: Props) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === "dark";

    const [modalType, setModalType] = useState<"add" | "edit" | null>(null);
    const [currentCalendar, setCurrentCalendar] = useState<AcademicCalendar | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        school_id: "",
        name: "",
        start_date: "",
        end_date: "",
        working_days: ["sunday", "monday", "tuesday", "wednesday", "thursday"], // default days
        is_active: true,
    });

    const openAddModal = () => {
        setModalType("add");
        setCurrentCalendar(null);
        clearErrors();
        reset();
    };

    const openEditModal = (calendar: AcademicCalendar) => {
        setModalType("edit");
        setCurrentCalendar(calendar);
        clearErrors();
        
        // Parse working days if it's a string
        let parsedDays: string[] = [];
        if (typeof calendar.working_days === 'string') {
            try { parsedDays = JSON.parse(calendar.working_days); } catch(e) {}
        } else {
            parsedDays = calendar.working_days;
        }

        setData({
            school_id: calendar.school_id.toString(),
            name: calendar.name,
            start_date: calendar.start_date,
            end_date: calendar.end_date,
            working_days: parsedDays,
            is_active: calendar.is_active === true || calendar.is_active === 1 as any,
        });
    };

    const closeModal = () => {
        setModalType(null);
        reset();
    };

    const [deleteCalendarId, setDeleteCalendarId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isUnchanged = Boolean(
        modalType === "edit" && currentCalendar !== null &&
        String(data.school_id) === String(currentCalendar.school_id) &&
        data.name.trim() === currentCalendar.name.trim() &&
        data.start_date === currentCalendar.start_date &&
        data.end_date === currentCalendar.end_date &&
        (data.is_active === (currentCalendar.is_active === true || (currentCalendar.is_active as any) === 1)) &&
        JSON.stringify([...data.working_days].sort()) === JSON.stringify(
            (typeof currentCalendar.working_days === 'string'
                ? JSON.parse(currentCalendar.working_days)
                : currentCalendar.working_days || []
            ).slice().sort()
        )
    );

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (modalType === "edit" && isUnchanged) return;

        if (modalType === "add") {
            post(route("admin.academic-calendars.store"), {
                onSuccess: () => closeModal(),
            });
        } else if (modalType === "edit" && currentCalendar) {
            put(route("admin.academic-calendars.update", currentCalendar.id), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmDeleteCalendar = (id: number) => {
        setDeleteCalendarId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!deleteCalendarId) return;
        setIsDeleting(true);
        destroy(route("admin.academic-calendars.destroy", deleteCalendarId), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setDeleteCalendarId(null);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const toggleWorkingDay = (day: string) => {
        const current = data.working_days;
        if (current.includes(day)) {
            setData("working_days", current.filter(d => d !== day));
        } else {
            setData("working_days", [...current, day]);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className={`flex justify-between items-center w-full ${isRTL ? "flex-row" : "flex-row"}`}>
                    <h2 className={`font-bold text-xl flex items-center gap-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                        <CalendarIcon className="w-6 h-6 text-brand-yellow" />
                        {isRTL ? "التقويم الدراسي" : "Academic Calendars"}
                    </h2>

                    <PrimaryButton
                        onClick={openAddModal}
                        className="bg-brand-yellow text-brand-dark hover:bg-yellow-500 shadow-lg px-6 py-2 rounded-xl font-bold border-none"
                    >
                        {isRTL ? "إضافة تقويم" : "Add Calendar"}
                    </PrimaryButton>
                </div>
            }
        >
            <Head title={isRTL ? "التقويم الدراسي" : "Academic Calendars"} />

            <div className={`space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>
                
                {calendars.length === 0 ? (
                    <div className={`p-12 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-100"}`}>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
                            <CalendarIcon className={`w-10 h-10 ${isDark ? "text-gray-500" : "text-gray-300"}`} />
                        </div>
                        <h4 className={`text-lg font-bold ${isDark ? "text-white" : "text-brand-navy"}`}>
                            {isRTL ? "لا توجد تقاويم دراسية" : "No Academic Calendars"}
                        </h4>
                        <p className={`text-sm mt-2 mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {isRTL ? "قم بإضافة تقويم دراسي للمدارس للبدء في جدولة الرحلات" : "Add an academic calendar for schools to start scheduling trips"}
                        </p>
                        <PrimaryButton onClick={openAddModal} className="bg-brand-navy text-white px-8">
                            {isRTL ? "إضافة تقويم" : "Add Calendar"}
                        </PrimaryButton>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {calendars.map((calendar) => {
                            let parsedDays: string[] = [];
                            if (typeof calendar.working_days === 'string') {
                                try { parsedDays = JSON.parse(calendar.working_days); } catch(e) {}
                            } else {
                                parsedDays = calendar.working_days;
                            }

                            return (
                                <motion.div
                                    key={calendar.id}
                                    whileHover={{ y: -5 }}
                                    className={`rounded-3xl border overflow-hidden transition-all duration-300 ${isDark ? "bg-gray-800/40 border-gray-700 hover:bg-gray-800 shadow-2xl" : "bg-white border-gray-100 shadow-sm hover:shadow-xl"}`}
                                >
                                    <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                                        <div className={isRTL ? 'text-right' : 'text-left'}>
                                            <div className="flex items-center gap-2 mb-2 justify-end">
                                                {calendar.is_active ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        {isRTL ? "نشط" : "Active"}
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                        {isRTL ? "غير نشط" : "Inactive"}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className={`text-lg font-black ${isDark ? "text-white" : "text-brand-navy"}`}>{calendar.name}</h4>
                                            <p className={`text-xs flex items-center gap-1 mt-1 ${isDark ? "text-gray-400" : "text-gray-500"} ${isRTL ? 'flex-row-reverse' : ''}`}>
                                                <SchoolIcon className="w-3.5 h-3.5" />
                                                {calendar.school?.name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                <p className="text-[10px] text-gray-500 mb-1">{isRTL ? "تاريخ البدء" : "Start Date"}</p>
                                                <p className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{calendar.start_date}</p>
                                            </div>
                                            <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                                <p className="text-[10px] text-gray-500 mb-1">{isRTL ? "تاريخ الانتهاء" : "End Date"}</p>
                                                <p className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{calendar.end_date}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] text-gray-500 mb-2">{isRTL ? "أيام العمل" : "Working Days"}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {parsedDays.map(day => {
                                                    const dayObj = ALL_DAYS.find(d => d.value === day);
                                                    return (
                                                        <span key={day} className={`px-2 py-1 rounded border text-[10px] font-bold ${isDark ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                                                            {isRTL ? dayObj?.labelAr : dayObj?.labelEn}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className={`mt-6 grid grid-cols-2 gap-3 pt-5 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                                            <button
                                                onClick={() => openEditModal(calendar)}
                                                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-brand-yellow/10 text-brand-yellow hover:bg-brand-yellow/20' : 'bg-brand-yellow/10 text-brand-dark hover:bg-brand-yellow/20'}`}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                                {isRTL ? "تعديل" : "Edit"}
                                            </button>
                                            <button
                                                onClick={() => confirmDeleteCalendar(calendar.id)}
                                                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                {isRTL ? "حذف" : "Delete"}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* MODAL */}
                <Modal show={modalType !== null} onClose={closeModal} maxWidth="2xl">
                    <div className={`relative ${isDark ? "bg-gray-900 border border-gray-700" : "bg-white"} rounded-2xl overflow-hidden shadow-2xl transition-all duration-300`}>
                        <button
                            onClick={closeModal}
                            className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} p-2 rounded-full hover:bg-gray-100 ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'text-gray-400'} z-50`}
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className={`p-8 border-b ${isDark ? "border-gray-800 bg-gray-900/50" : "border-gray-100 bg-gray-50/50"}`}>
                            <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-brand-navy"}`}>
                                <CalendarDays className="w-6 h-6 text-brand-yellow" />
                                {modalType === 'edit' ? (isRTL ? "تعديل التقويم الدراسي" : "Edit Academic Calendar") : (isRTL ? "إضافة تقويم دراسي" : "Add Academic Calendar")}
                            </h2>
                        </div>

                        <form onSubmit={submitForm}>
                            <div className="p-8 space-y-6">
                                <div className={isRTL ? "text-right" : ""}>
                                    <InputLabel value={isRTL ? "المدرسة" : "School"} />
                                    <select
                                        value={data.school_id}
                                        onChange={e => setData("school_id", e.target.value)}
                                        className={`w-full mt-1.5 rounded-xl border-none h-[42px] px-4 text-sm font-semibold transition-all ${isDark ? "bg-gray-800 text-white ring-1 ring-gray-700 focus:ring-brand-yellow" : "bg-gray-50 text-gray-800 ring-1 ring-gray-200 focus:ring-brand-navy"}`}
                                        required
                                    >
                                        <option value="">{isRTL ? "اختر المدرسة..." : "Select school..."}</option>
                                        {schools.map(school => (
                                            <option key={school.id} value={school.id}>{school.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.school_id} />
                                </div>

                                <div className={isRTL ? "text-right" : ""}>
                                    <InputLabel value={isRTL ? "اسم التقويم (مثال: الفصل الأول 1447)" : "Calendar Name (e.g., First Semester 2026)"} />
                                    <TextInput
                                        value={data.name}
                                        onChange={e => setData("name", e.target.value)}
                                        className="w-full mt-1.5"
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className={isRTL ? "text-right" : ""}>
                                        <InputLabel value={isRTL ? "تاريخ البدء" : "Start Date"} />
                                        <TextInput
                                            type="date"
                                            value={data.start_date}
                                            onChange={e => setData("start_date", e.target.value)}
                                            className="w-full mt-1.5"
                                            required
                                        />
                                        <InputError message={errors.start_date} />
                                    </div>
                                    <div className={isRTL ? "text-right" : ""}>
                                        <InputLabel value={isRTL ? "تاريخ الانتهاء" : "End Date"} />
                                        <TextInput
                                            type="date"
                                            value={data.end_date}
                                            onChange={e => setData("end_date", e.target.value)}
                                            className="w-full mt-1.5"
                                            required
                                        />
                                        <InputError message={errors.end_date} />
                                    </div>
                                </div>

                                <div className={isRTL ? "text-right" : ""}>
                                    <InputLabel value={isRTL ? "أيام العمل المعتمدة" : "Working Days"} />
                                    <div className="flex flex-wrap gap-3 mt-3">
                                        {ALL_DAYS.map(day => {
                                            const isActive = data.working_days.includes(day.value);
                                            return (
                                                <button
                                                    key={day.value}
                                                    type="button"
                                                    onClick={() => toggleWorkingDay(day.value)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                                        isActive 
                                                        ? 'bg-brand-navy border-brand-navy text-white shadow-md dark:bg-indigo-600 dark:border-indigo-600' 
                                                        : isDark ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {isRTL ? day.labelAr : day.labelEn}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.working_days} />
                                </div>

                                <div className={isRTL ? "text-right" : ""}>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${data.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${data.is_active ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'}`} />
                                        </div>
                                        <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {isRTL ? "تفعيل التقويم حالياً" : "Set as Active Calendar"}
                                        </span>
                                        <input type="checkbox" className="hidden" checked={data.is_active} onChange={e => setData("is_active", e.target.checked)} />
                                    </label>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        {isRTL ? "تفعيل هذا التقويم سيعطل التقاويم الأخرى لنفس المدرسة." : "Activating this calendar will deactivate other calendars for the same school."}
                                    </p>
                                </div>

                            </div>

                            <div className={`px-8 py-5 border-t flex justify-end gap-3 ${isDark ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
                                <button type="button" onClick={closeModal} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? "text-gray-400 hover:bg-gray-800 hover:text-white" : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"}`}>
                                    {isRTL ? "إلغاء" : "Cancel"}
                                </button>
                                <PrimaryButton
                                    type="submit"
                                    disabled={processing || isUnchanged}
                                    className={`bg-brand-yellow text-brand-dark px-8 py-2.5 rounded-xl border-none font-black transition-all ${isUnchanged ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-yellow/90'}`}
                                >
                                    {processing ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ التقويم" : "Save Calendar")}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </Modal>

                {/* DELETE CONFIRMATION MODAL */}
                <ConfirmationModal
                    show={isDeleteModalOpen}
                    title={isRTL ? "تأكيد حذف التقويم" : "Confirm Calendar Deletion"}
                    message={isRTL ? "هل أنت متأكد من رغبتك في حذف هذا التقويم الدراسي؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this academic calendar? This action cannot be undone."}
                    confirmText={isRTL ? "نعم، حذف" : "Yes, Delete"}
                    cancelText={isRTL ? "إلغاء" : "Cancel"}
                    onConfirm={handleDelete}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setDeleteCalendarId(null);
                    }}
                    type="danger"
                    processing={isDeleting}
                />
            </div>
        </AuthenticatedLayout>
    );
}
