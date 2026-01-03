import React, { useState } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { User, Classroom } from "@/types";
import useTranslation from "@/hooks/useTranslation";

interface Guardian {
    id: number;
    name: string;
    name_en?: string;
    national_id: string;
    phone: string;
    address?: string;
    home_number?: string;
    image?: string;
}

interface Student {
    id: number;
    full_name: string;
    student_code: string;
    national_id?: string;
    image?: string;
    is_active: boolean;
    guardian_id: number;
    supervisor_id?: number;
    guardian?: Guardian;
    current_enrollment: {
        classroom_id: number;
    } | null;
}

interface Props {
    auth: { user: User };
    student: Student;
    classrooms: Classroom[];
    supervisors: User[];
}

export default function EditStudent({ auth, student, classrooms, supervisors }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        full_name: student.full_name,
        student_code: student.student_code,
        national_id: student.national_id || "",
        classroom_id: student.current_enrollment?.classroom_id || "",
        supervisor_id: student.supervisor_id || "",
        is_active: student.is_active,
        image: null as File | null,

        // Guardian Data
        guardian: {
            name: student.guardian?.name || "",
            name_en: student.guardian?.name_en || "",
            national_id: student.guardian?.national_id || "",
            phone: student.guardian?.phone || "",
            address: student.guardian?.address || "",
            home_number: student.guardian?.home_number || "",
            image: null as File | null,
        }
    });

    const [imagePreview, setImagePreview] = useState<string | null>(student.image ? `/storage/${student.image}` : null);
    const [guardianImagePreview, setGuardianImagePreview] = useState<string | null>(student.guardian?.image ? `/storage/${student.guardian.image}` : null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("school.students.update", student.id), {
            onSuccess: () => {
                // التوجيه لصفحة الطلاب بعد الحفظ الناجح
                window.location.href = route("school.students.index");
            }
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isGuardian: boolean = false) => {
        const file = e.target.files?.[0];
        if (file) {
            if (isGuardian) {
                setData("guardian", { ...data.guardian, image: file });
                setGuardianImagePreview(URL.createObjectURL(file));
            } else {
                setData("image", file);
                setImagePreview(URL.createObjectURL(file));
            }
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {t('Edit Student')}: {student.full_name}
                </h2>
            }
        >
            <Head title={`${t('Edit')} ${student.full_name}`} />

            <div className="max-w-7xl mx-auto p-4 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* LEFT COLUMN: STUDENT INFO */}
                        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 dark:border-gray-700 shadow-xl rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                                1. {t('Student Information')}
                            </h3>

                            <div className="space-y-4">
                                {/* Student Image */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative">
                                        <div className="w-32 h-40 rounded-xl overflow-hidden border-4 border-gray-100 dark:border-gray-700 bg-gray-100 shadow-lg">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Student" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <span className="text-4xl">📷</span>
                                                </div>
                                            )}
                                        </div>
                                        <label htmlFor="student-image" className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-colors border-2 border-white dark:border-gray-800">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        </label>
                                        <input id="student-image" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, false)} />
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Student Name')}</label>
                                    <input
                                        value={data.full_name}
                                        onChange={(e) => setData("full_name", e.target.value)}
                                        className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-blue-500"
                                    />
                                    {errors.full_name && <div className="mt-1 text-xs text-red-500">{errors.full_name}</div>}
                                </div>

                                {/* National ID */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('National ID')}</label>
                                    <input
                                        value={data.national_id}
                                        onChange={(e) => setData("national_id", e.target.value)}
                                        className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-blue-500"
                                    />
                                    {errors.national_id && <div className="mt-1 text-xs text-red-500">{errors.national_id}</div>}
                                </div>

                                {/* Code */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Code')}</label>
                                    <input
                                        value={data.student_code}
                                        onChange={(e) => setData("student_code", e.target.value)}
                                        className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-blue-500"
                                    />
                                    {errors.student_code && <div className="mt-1 text-xs text-red-500">{errors.student_code}</div>}
                                </div>

                                {/* Class */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Class')}</label>
                                    <select
                                        value={data.classroom_id}
                                        onChange={(e) => setData("classroom_id", e.target.value)}
                                        className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-blue-500"
                                    >
                                        <option value="">{t('Select Class')}</option>
                                        {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {errors.classroom_id && <div className="mt-1 text-xs text-red-500">{errors.classroom_id}</div>}
                                </div>

                                {/* Supervisor */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Supervisor')}</label>
                                    <select
                                        value={data.supervisor_id}
                                        onChange={(e) => setData("supervisor_id", e.target.value)}
                                        className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-blue-500"
                                    >
                                        <option value="">{t('Select Supervisor')}</option>
                                        {supervisors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    {errors.supervisor_id && <div className="mt-1 text-xs text-red-500">{errors.supervisor_id}</div>}
                                </div>

                                {/* Status */}
                                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData("is_active", e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{t('Active Student')}</label>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: GUARDIAN INFO */}
                        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 dark:border-gray-700 shadow-xl rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                                2. {t('Guardian Information')}
                            </h3>

                            <div className="space-y-4">
                                {/* Guardian Image */}
                                <div className="flex justify-center mb-6">
                                    <div className="relative">
                                        <div className="w-32 h-40 rounded-xl overflow-hidden border-4 border-gray-100 dark:border-gray-700 bg-gray-100 shadow-lg">
                                            {guardianImagePreview ? (
                                                <img src={guardianImagePreview} alt="Guardian" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <span className="text-4xl">👤</span>
                                                </div>
                                            )}
                                        </div>
                                        <label htmlFor="guardian-image" className="absolute -bottom-2 -right-2 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-colors border-2 border-white dark:border-gray-800">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        </label>
                                        <input id="guardian-image" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, true)} />
                                    </div>
                                </div>

                                {/* Guardian Name */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Guardian Name')}</label>
                                    <input
                                        value={data.guardian.name}
                                        onChange={(e) => setData("guardian", { ...data.guardian, name: e.target.value })}
                                        className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-green-500"
                                    />
                                    {errors['guardian.name'] && <div className="mt-1 text-xs text-red-500">{errors['guardian.name']}</div>}
                                </div>

                                {/* Guardian Name EN */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Guardian Name (EN)')}</label>
                                    <input
                                        value={data.guardian.name_en}
                                        onChange={(e) => setData("guardian", { ...data.guardian, name_en: e.target.value })}
                                        className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-green-500"
                                    />
                                </div>

                                {/* National ID */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('National ID')}</label>
                                    <input
                                        value={data.guardian.national_id}
                                        onChange={(e) => setData("guardian", { ...data.guardian, national_id: e.target.value })}
                                        className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-green-500"
                                    />
                                    {errors['guardian.national_id'] && <div className="mt-1 text-xs text-red-500">{errors['guardian.national_id']}</div>}
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Phone Number')}</label>
                                    <input
                                        value={data.guardian.phone}
                                        onChange={(e) => setData("guardian", { ...data.guardian, phone: e.target.value })}
                                        className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-green-500"
                                    />
                                    {errors['guardian.phone'] && <div className="mt-1 text-xs text-red-500">{errors['guardian.phone']}</div>}
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Address')}</label>
                                    <input
                                        value={data.guardian.address}
                                        onChange={(e) => setData("guardian", { ...data.guardian, address: e.target.value })}
                                        className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-green-500"
                                    />
                                </div>

                                {/* Home Number */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t('Home Number')}</label>
                                    <input
                                        value={data.guardian.home_number}
                                        onChange={(e) => setData("guardian", { ...data.guardian, home_number: e.target.value })}
                                        className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-green-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end pt-6 space-x-4 bg-white/50 dark:bg-gray-900/50 p-4 rounded-xl backdrop-blur-sm sticky bottom-0 border-t border-gray-200 dark:border-gray-700 z-10">
                        <Link
                            href={route("school.students.index")}
                            className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300 transition bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-bold"
                        >
                            {t('Cancel')}
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-8 py-3 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/30 font-bold transition-all disabled:opacity-50"
                        >
                            {processing ? t('Saving...') : t('Save Changes')}
                        </button>
                    </div>
                </form>
            </div>
        </SchoolAuthenticatedLayout>
    );
}
