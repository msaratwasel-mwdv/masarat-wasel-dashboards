import React, { useState, useCallback } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, Link, router } from "@inertiajs/react";
import { User } from "@/types";
import useTranslation from "@/hooks/useTranslation";
import { debounce } from "lodash";

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
    teachers: Supervisor[];
    filters: { search?: string };
}

export default function SupervisorsIndex({ auth, teachers, filters }: Props) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || "");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [supervisorToDelete, setSupervisorToDelete] = useState<Supervisor | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        national_id: "",
        email: "",
        phone: "",
        role: "supervisor",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("school.teachers.store"), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            router.get(
                route("school.teachers.index"),
                { search: value },
                { preserveState: true, preserveScroll: true }
            );
        }, 300),
        []
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
        debouncedSearch(value);
    };

    const confirmDelete = (supervisor: Supervisor) => {
        setSupervisorToDelete(supervisor);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (supervisorToDelete) {
            router.delete(route("school.teachers.destroy", supervisorToDelete.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSupervisorToDelete(null);
                }
            });
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">
                    {t('Supervisors Management')}
                </h2>
            }
        >
            <Head title={t('Supervisors')} />

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* --- Add Supervisor Form --- */}
                <div className="lg:col-span-1 space-y-8">
                    {/* --- Stats Card --- */}
                    <div className="p-6 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-xl text-white transform hover:scale-[1.02] transition-transform duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium mb-1">{t('Total Supervisors')}</p>
                                <h3 className="text-4xl font-bold">{teachers.length}</h3>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <span className="text-2xl">👥</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-purple-200">
                            <span className="bg-white/20 px-2 py-1 rounded-lg">{t('Active')}</span>
                            <span>{t('All systems operational')}</span>
                        </div>
                    </div>

                    <div className="h-fit p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 dark:border-gray-700 shadow-xl rounded-2xl">
                        <h3 className="mb-2 text-lg font-bold text-gray-800 dark:text-gray-100">
                            {t('Add New Supervisor')}
                        </h3>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                            {t('Enter supervisor details')}
                        </p>

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('Name')}
                                </label>
                                <input
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4"
                                    required
                                    placeholder={t('Name')}
                                />
                                {errors.name && <div className="mt-1 text-xs text-red-500">{errors.name}</div>}
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('National ID')}
                                </label>
                                <input
                                    value={data.national_id}
                                    onChange={(e) => setData("national_id", e.target.value)}
                                    className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4"
                                    required
                                    placeholder={t('National ID')}
                                />
                                {errors.national_id && <div className="mt-1 text-xs text-red-500">{errors.national_id}</div>}
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('Email')}
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4"
                                    required
                                    placeholder="example@school.com"
                                />
                                {errors.email && <div className="mt-1 text-xs text-red-500">{errors.email}</div>}
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('Phone Number')} ({t('Optional')})
                                </label>
                                <input
                                    value={data.phone}
                                    onChange={(e) => setData("phone", e.target.value)}
                                    className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4"
                                    placeholder="+966..."
                                />
                                {errors.phone && <div className="mt-1 text-xs text-red-500">{errors.phone}</div>}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? t('Saving...') : t('Save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* --- Current Supervisors Table --- */}
                <div className="lg:col-span-2">
                    <div className="p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 dark:border-gray-700 shadow-xl rounded-2xl">
                        {/* Header with Search */}
                        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                {t('Supervisors')}
                            </h3>

                            {/* Search Input */}
                            <div className="relative w-full md:w-auto">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={handleSearchChange}
                                    placeholder={t('Search by Name, ID...')}
                                    className="w-full md:w-64 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2 pl-10 text-sm dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                />
                                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-start">
                                <thead className="border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase text-start">
                                            {t('Name')}
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase text-start">
                                            {t('National ID')}
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase text-start">
                                            {t('Email')}
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase text-start">
                                            {t('Phone')}
                                        </th>
                                        <th className="px-4 py-3 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase text-end">
                                            {t('Actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {teachers.length > 0 ? (
                                        teachers.map((supervisor: Supervisor) => (
                                            <tr key={supervisor.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-4 font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                                                    {supervisor.name}
                                                </td>
                                                <td className="px-4 py-4 font-mono text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {supervisor.national_id || "-"}
                                                </td>
                                                <td className="px-4 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {supervisor.email}
                                                </td>
                                                <td className="px-4 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {supervisor.phone || "-"}
                                                </td>
                                                <td className="px-4 py-4 text-end space-x-3 rtl:space-x-reverse">
                                                    <Link
                                                        href={route("school.teachers.edit", supervisor.id)}
                                                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                    >
                                                        {t('Edit')}
                                                    </Link>

                                                    <button
                                                        onClick={() => confirmDelete(supervisor)}
                                                        className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                    >
                                                        {t('Delete')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                                <td colSpan={5} className="py-10 text-center text-gray-400 dark:text-gray-500">
                                                    {t('No supervisors found')}
                                                </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 transform scale-100 transition-all">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('Confirm Deletion')}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {t('Are you sure you want to delete this supervisor? This action cannot be undone.')}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-bold transition-colors"
                            >
                                {t('Cancel')}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold shadow-lg shadow-red-500/30 transition-colors"
                            >
                                {t('Yes, Delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SchoolAuthenticatedLayout>
    );
}
