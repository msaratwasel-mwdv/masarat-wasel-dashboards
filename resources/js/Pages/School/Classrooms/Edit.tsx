import React from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { User } from "@/types";
import useTranslation from "@/hooks/useTranslation";

interface Teacher {
    id: number;
    name: string;
    email?: string;
}

interface Classroom {
    id: number;
    name: string;
    grade_level?: string | null;
    teachers?: Teacher[];
}

interface Props {
    auth: { user: User };
    classroom: Classroom;
    teachers: Teacher[];
}

export default function EditClassroom({ auth, classroom, teachers }: Props) {
    const { t } = useTranslation();
    const { data, setData, put, processing, errors } = useForm({
        name: classroom.name || "",
        grade_level: classroom.grade_level || "",
        teacher_ids: classroom.teachers ? classroom.teachers.map((t) => t.id) : ([] as number[]),
    });

    const toggleTeacher = (id: number) => {
        const exists = data.teacher_ids.includes(id);
        setData(
            "teacher_ids",
            exists
                ? data.teacher_ids.filter((x) => x !== id)
                : [...data.teacher_ids, id]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("school.classrooms.update", classroom.id), {
            onSuccess: () => {
                window.location.href = route("school.classrooms.index");
            }
        });
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {t('Edit Class')}: {classroom.name}
                </h2>
            }
        >
            <Head title={`${t('Edit')} ${classroom.name}`} />

            <div className="max-w-3xl mx-auto p-4 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 dark:border-gray-700 shadow-xl rounded-2xl">
                        <h3 className="mb-6 text-lg font-bold text-gray-800 dark:text-gray-100">
                            {t('Class Information')}
                        </h3>

                        <div className="space-y-5">
                            {/* Class Name */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('Class Name')}
                                </label>
                                <input
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                {errors.name && <div className="mt-1 text-xs text-red-500">{errors.name}</div>}
                            </div>

                            {/* Grade Level */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('Grade Level')}
                                </label>
                                <input
                                    value={data.grade_level}
                                    onChange={(e) => setData("grade_level", e.target.value)}
                                    className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.grade_level && <div className="mt-1 text-xs text-red-500">{errors.grade_level}</div>}
                            </div>

                            {/* Teachers Selection */}
                            <div>
                                <label className="block mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('Referenced Supervisors')}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                                    {teachers.length > 0 ? (
                                        teachers.map((t) => {
                                            const checked = data.teacher_ids.includes(t.id);
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => toggleTeacher(t.id)}
                                                    className={`text-start px-4 py-3 rounded-xl border transition-all ${checked
                                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm"
                                                            : "border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-sm">{t.name}</span>
                                                        {checked && (
                                                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
                                            {t('No supervisors available')}
                                        </div>
                                    )}
                                </div>
                                {errors.teacher_ids && (
                                    <div className="mt-1 text-xs text-red-500">{String(errors.teacher_ids)}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end pt-6 space-x-4 rtl:space-x-reverse bg-white/50 dark:bg-gray-900/50 p-4 rounded-xl backdrop-blur-sm sticky bottom-0 border-t border-gray-200 dark:border-gray-700 z-10">
                        <Link
                            href={route("school.classrooms.index")}
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
