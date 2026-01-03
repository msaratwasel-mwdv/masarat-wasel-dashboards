import React from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import { User } from "@/types";
import useTranslation from "@/hooks/useTranslation";

interface Supervisor {
    id: number;
    name: string;
    national_id: string;
    email: string;
    phone?: string | null;
    is_active: boolean;
}

interface Props {
    auth: { user: User };
    teacher: Supervisor;
}

export default function EditSupervisor({ auth, teacher }: Props) {
    const { t } = useTranslation();
    const { data, setData, put, processing, errors } = useForm({
        name: teacher.name || "",
        national_id: teacher.national_id || "",
        email: teacher.email || "",
        phone: teacher.phone || "",
        is_active: teacher.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route("school.teachers.update", teacher.id), {
            onSuccess: () => {
                window.location.href = route("school.teachers.index");
            }
        });
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {t('Edit Supervisor')}: {teacher.name}
                </h2>
            }
        >
            <Head title={`${t('Edit')} ${teacher.name}`} />

            <div className="max-w-3xl mx-auto p-4 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 dark:border-gray-700 shadow-xl rounded-2xl">
                        <h3 className="mb-6 text-lg font-bold text-gray-800 dark:text-gray-100">
                            {t('Supervisor Information')}
                        </h3>

                        <div className="space-y-5">
                            {/* Name */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('Name')}
                                </label>
                                <input
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                {errors.name && <div className="mt-1 text-xs text-red-500">{errors.name}</div>}
                            </div>

                            {/* National ID */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('National ID')}
                                </label>
                                <input
                                    value={data.national_id}
                                    onChange={(e) => setData("national_id", e.target.value)}
                                    className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                {errors.national_id && <div className="mt-1 text-xs text-red-500">{errors.national_id}</div>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('Email')}
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                {errors.email && <div className="mt-1 text-xs text-red-500">{errors.email}</div>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('Phone Number')}
                                </label>
                                <input
                                    value={data.phone}
                                    onChange={(e) => setData("phone", e.target.value)}
                                    className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                />
                                {errors.phone && <div className="mt-1 text-xs text-red-500">{errors.phone}</div>}
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData("is_active", e.target.checked)}
                                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('Active Supervisor')}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end pt-6 space-x-4 rtl:space-x-reverse bg-white/50 dark:bg-gray-900/50 p-4 rounded-xl backdrop-blur-sm sticky bottom-0 border-t border-gray-200 dark:border-gray-700 z-10">
                        <Link
                            href={route("school.teachers.index")}
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
