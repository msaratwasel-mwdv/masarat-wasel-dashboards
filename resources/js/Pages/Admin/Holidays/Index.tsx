import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import { useTheme } from "@/Contexts/ThemeContext";
import React, { useState } from "react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import { motion, AnimatePresence } from "framer-motion";
import {
    CalendarOff,
    CheckCircle2,
    XCircle,
    Plus,
    Pencil,
    Trash2,
    X,
    School as SchoolIcon,
    AlertTriangle,
    Globe,
} from "lucide-react";

interface School {
    id: number;
    name: string;
}

interface Holiday {
    id: number;
    school_id: number | null;
    name: string;
    start_date: string;
    end_date: string;
    type: "official" | "school_specific" | "emergency";
    notes: string | null;
    school?: School;
}

interface Props {
    holidays: Holiday[];
    schools: School[];
}

export default function HolidaysIndex({ holidays, schools }: Props) {
    const { isRTL, theme } = useTheme();
    const isDark = theme === "dark";

    const [modalType, setModalType] = useState<"add" | "edit" | null>(null);
    const [currentHoliday, setCurrentHoliday] = useState<Holiday | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        school_id: "", // empty means all schools (official)
        name: "",
        start_date: "",
        end_date: "",
        type: "official" as "official" | "school_specific" | "emergency",
        notes: "",
    });

    const openAddModal = () => {
        setModalType("add");
        setCurrentHoliday(null);
        clearErrors();
        reset();
    };

    const openEditModal = (holiday: Holiday) => {
        setModalType("edit");
        setCurrentHoliday(holiday);
        clearErrors();
        
        setData({
            school_id: holiday.school_id ? holiday.school_id.toString() : "",
            name: holiday.name,
            start_date: holiday.start_date,
            end_date: holiday.end_date,
            type: holiday.type,
            notes: holiday.notes || "",
        });
    };

    const closeModal = () => {
        setModalType(null);
        reset();
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Before sending, if school_id is empty string, make it null
        const payload = {
            ...data,
            school_id: data.school_id === "" ? null : data.school_id
        };

        if (modalType === "add") {
            post(route("admin.holidays.store"), {
                onSuccess: () => closeModal(),
            });
        } else if (modalType === "edit" && currentHoliday) {
            put(route("admin.holidays.update", currentHoliday.id), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm(isRTL ? "هل أنت متأكد من حذف هذه العطلة؟" : "Are you sure you want to delete this holiday?")) {
            destroy(route("admin.holidays.destroy", id));
        }
    };

    const getHolidayTypeLabel = (type: string) => {
        switch (type) {
            case "official": return isRTL ? "عطلة رسمية (عامة)" : "Official Holiday";
            case "school_specific": return isRTL ? "عطلة خاصة بمدرسة" : "School Specific";
            case "emergency": return isRTL ? "عطلة طارئة" : "Emergency";
            default: return type;
        }
    };

    const getHolidayTypeColor = (type: string) => {
        switch (type) {
            case "official": return isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200';
            case "school_specific": return isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case "emergency": return isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-700 border-red-200';
            default: return '';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className={`flex justify-between items-center w-full ${isRTL ? "flex-row" : "flex-row"}`}>
                    <h2 className={`font-bold text-xl flex items-center gap-2 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                        <CalendarOff className="w-6 h-6 text-brand-yellow" />
                        {isRTL ? "إدارة العطل والمناسبات" : "Holidays Management"}
                    </h2>

                    <PrimaryButton
                        onClick={openAddModal}
                        className="bg-brand-yellow text-brand-dark hover:bg-yellow-500 shadow-lg px-6 py-2 rounded-xl font-bold border-none"
                    >
                        {isRTL ? "إضافة عطلة" : "Add Holiday"}
                    </PrimaryButton>
                </div>
            }
        >
            <Head title={isRTL ? "إدارة العطل" : "Holidays"} />

            <div className={`space-y-6 dir-${isRTL ? "rtl" : "ltr"}`}>
                
                {holidays.length === 0 ? (
                    <div className={`p-12 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-100"}`}>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
                            <CalendarOff className={`w-10 h-10 ${isDark ? "text-gray-500" : "text-gray-300"}`} />
                        </div>
                        <h4 className={`text-lg font-bold ${isDark ? "text-white" : "text-brand-navy"}`}>
                            {isRTL ? "لا توجد عطل مسجلة" : "No Holidays Registered"}
                        </h4>
                        <p className={`text-sm mt-2 mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {isRTL ? "قم بإضافة العطل الرسمية لتفادي إرسال الحافلات في أيام الإجازات" : "Add official holidays to prevent buses from being dispatched on non-working days"}
                        </p>
                        <PrimaryButton onClick={openAddModal} className="bg-brand-navy text-white px-8">
                            {isRTL ? "إضافة عطلة" : "Add Holiday"}
                        </PrimaryButton>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {holidays.map((holiday) => (
                            <motion.div
                                key={holiday.id}
                                whileHover={{ y: -5 }}
                                className={`rounded-3xl border overflow-hidden transition-all duration-300 ${isDark ? "bg-gray-800/40 border-gray-700 hover:bg-gray-800 shadow-2xl" : "bg-white border-gray-100 shadow-sm hover:shadow-xl"}`}
                            >
                                <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <div className={isRTL ? 'text-right w-full' : 'text-left w-full'}>
                                        <div className="flex items-center justify-between mb-2 w-full">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getHolidayTypeColor(holiday.type)} flex items-center gap-1`}>
                                                {holiday.type === 'official' && <Globe className="w-3 h-3" />}
                                                {holiday.type === 'emergency' && <AlertTriangle className="w-3 h-3" />}
                                                {getHolidayTypeLabel(holiday.type)}
                                            </span>
                                        </div>
                                        <h4 className={`text-lg font-black ${isDark ? "text-white" : "text-brand-navy"}`}>{holiday.name}</h4>
                                        <p className={`text-xs flex items-center gap-1 mt-1 ${isDark ? "text-gray-400" : "text-gray-500"} ${isRTL ? 'flex-row-reverse' : ''}`}>
                                            <SchoolIcon className="w-3.5 h-3.5" />
                                            {holiday.school_id ? holiday.school?.name : (isRTL ? "جميع المدارس" : "All Schools")}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <p className="text-[10px] text-gray-500 mb-1">{isRTL ? "تاريخ البدء" : "Start Date"}</p>
                                            <p className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{holiday.start_date}</p>
                                        </div>
                                        <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <p className="text-[10px] text-gray-500 mb-1">{isRTL ? "تاريخ الانتهاء" : "End Date"}</p>
                                            <p className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{holiday.end_date}</p>
                                        </div>
                                    </div>

                                    {holiday.notes && (
                                        <div className="mb-2">
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{holiday.notes}</p>
                                        </div>
                                    )}

                                    <div className={`mt-6 grid grid-cols-2 gap-3 pt-5 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                                        <button
                                            onClick={() => openEditModal(holiday)}
                                            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-brand-yellow/10 text-brand-yellow hover:bg-brand-yellow/20' : 'bg-brand-yellow/10 text-brand-dark hover:bg-brand-yellow/20'}`}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                            {isRTL ? "تعديل" : "Edit"}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(holiday.id)}
                                            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            {isRTL ? "حذف" : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
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
                                <CalendarOff className="w-6 h-6 text-brand-yellow" />
                                {modalType === 'edit' ? (isRTL ? "تعديل العطلة" : "Edit Holiday") : (isRTL ? "إضافة عطلة جديدة" : "Add New Holiday")}
                            </h2>
                        </div>

                        <form onSubmit={submitForm}>
                            <div className="p-8 space-y-6">
                                
                                <div className={isRTL ? "text-right" : ""}>
                                    <InputLabel value={isRTL ? "نوع العطلة" : "Holiday Type"} />
                                    <div className="grid grid-cols-3 gap-3 mt-1.5">
                                        {[
                                            { value: 'official', label: isRTL ? 'عامة لجميع المدارس' : 'Official (All Schools)', icon: Globe },
                                            { value: 'school_specific', label: isRTL ? 'خاصة بمدرسة' : 'School Specific', icon: SchoolIcon },
                                            { value: 'emergency', label: isRTL ? 'طارئة' : 'Emergency', icon: AlertTriangle },
                                        ].map(t => {
                                            const Icon = t.icon;
                                            return (
                                                <button
                                                    key={t.value}
                                                    type="button"
                                                    onClick={() => setData('type', t.value as any)}
                                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                                        data.type === t.value 
                                                        ? 'bg-brand-navy border-brand-navy text-white shadow-md dark:bg-indigo-600 dark:border-indigo-600'
                                                        : isDark ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    <span className="text-xs font-bold text-center">{t.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <InputError message={errors.type} />
                                </div>

                                {data.type !== 'official' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className={isRTL ? "text-right" : ""}>
                                        <InputLabel value={isRTL ? "المدرسة المستهدفة" : "Target School"} />
                                        <select
                                            value={data.school_id}
                                            onChange={e => setData("school_id", e.target.value)}
                                            className={`w-full mt-1.5 rounded-xl border-none h-[42px] px-4 text-sm font-semibold transition-all ${isDark ? "bg-gray-800 text-white ring-1 ring-gray-700 focus:ring-brand-yellow" : "bg-gray-50 text-gray-800 ring-1 ring-gray-200 focus:ring-brand-navy"}`}
                                            required={data.type !== 'official'}
                                        >
                                            <option value="">{isRTL ? "اختر المدرسة..." : "Select school..."}</option>
                                            {schools.map(school => (
                                                <option key={school.id} value={school.id}>{school.name}</option>
                                            ))}
                                        </select>
                                        <InputError message={errors.school_id} />
                                    </motion.div>
                                )}

                                <div className={isRTL ? "text-right" : ""}>
                                    <InputLabel value={isRTL ? "اسم المناسبة/العطلة (مثال: عيد الفطر)" : "Holiday Name (e.g., Eid Al-Fitr)"} />
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
                                    <InputLabel value={isRTL ? "ملاحظات إضافية" : "Additional Notes"} />
                                    <TextInput
                                        value={data.notes}
                                        onChange={e => setData("notes", e.target.value)}
                                        className="w-full mt-1.5"
                                    />
                                    <InputError message={errors.notes} />
                                </div>

                            </div>

                            <div className={`px-8 py-5 border-t flex justify-end gap-3 ${isDark ? "bg-gray-800/50 border-gray-800" : "bg-gray-50 border-gray-100"} ${isRTL ? "flex-row-reverse" : ""}`}>
                                <button type="button" onClick={closeModal} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? "text-gray-400 hover:bg-gray-800 hover:text-white" : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"}`}>
                                    {isRTL ? "إلغاء" : "Cancel"}
                                </button>
                                <PrimaryButton
                                    type="submit"
                                    disabled={processing}
                                    className="bg-brand-yellow text-brand-dark px-8 py-2.5 rounded-xl border-none font-black"
                                >
                                    {processing ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ العطلة" : "Save Holiday")}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
