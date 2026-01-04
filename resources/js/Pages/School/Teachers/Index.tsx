import React, { useState, useCallback } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import useTranslation from "@/hooks/useTranslation";
import { debounce } from "lodash";
import Modal from "@/Components/Modal";

interface Teacher {
    id: number;
    name: string;
    national_id: string;
    email: string | null;
    phone: string;
    is_active: boolean;
}

interface Props {
    auth: any;
    teachers: Teacher[];
    filters: { search?: string };
}

export default function TeachersIndex({ auth, teachers, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || "");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

    // Form for adding new teacher
    const addForm = useForm({
        name: "",
        national_id: "",
        email: "",
        phone: "",
        role: "supervisor",
    });

    // Form for editing teacher
    const editForm = useForm({
        name: "",
        national_id: "",
        email: "",
        phone: "",
        is_active: true,
    });

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post(route("school.teachers.store"), {
            preserveScroll: true,
            onSuccess: () => {
                setShowAddModal(false);
                addForm.reset();
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacherToEdit) return;

        editForm.put(route("school.teachers.update", teacherToEdit.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowEditModal(false);
                editForm.reset();
                setTeacherToEdit(null);
            },
        });
    };

    const openEditModal = (teacher: Teacher) => {
        setTeacherToEdit(teacher);
        editForm.setData({
            name: teacher.name,
            national_id: teacher.national_id,
            email: teacher.email || "",
            phone: teacher.phone || "",
            is_active: teacher.is_active,
        });
        setShowEditModal(true);
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

    const confirmDelete = (teacher: Teacher) => {
        setTeacherToDelete(teacher);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (teacherToDelete) {
            router.delete(route("school.teachers.destroy", teacherToDelete.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setTeacherToDelete(null);
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
            <Head title={t('Supervisors Management')} />

            <div className={`max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8`} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="bg-white dark:bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5 transition-colors duration-300">
                    <div className="p-8">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{t('Teachers List')}</h1>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('Total Supervisors')}: {teachers.length}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                {/* Search */}
                                <div className="relative w-full sm:w-80">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={handleSearchChange}
                                        placeholder={t('Search')}
                                        className="w-full bg-gray-50 dark:bg-[#1e293b] border-gray-200 dark:border-white/10 rounded-2xl py-3 pl-10 pr-4 text-gray-800 dark:text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 border transition-all"
                                    />
                                    <div className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-3.5`}>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    {t('Add New Supervisor')}
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#1e293b]/20 transition-colors duration-300">
                            <table className={`w-full text-start mb-0`} dir={isRtl ? 'rtl' : 'ltr'}>
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-100/50 dark:bg-white/[0.02]">
                                        <th className={`px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm text-start`}>{t('Name')}</th>
                                        <th className={`px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm text-start`}>{t('National ID')}</th>
                                        <th className={`px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm text-start`}>{t('Email')}</th>
                                        <th className={`px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm text-start`}>{t('Phone Number')}</th>
                                        <th className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm text-center">{t('Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {teachers.length > 0 ? (
                                        teachers.map((teacher) => (
                                            <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className={`px-6 py-4 text-gray-800 dark:text-white font-medium text-start`}>{teacher.name}</td>
                                                <td className={`px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-sm text-start`}>{teacher.national_id}</td>
                                                <td className={`px-6 py-4 text-gray-600 dark:text-gray-300 text-start`}>{teacher.email || "-"}</td>
                                                <td className={`px-6 py-4 text-gray-600 dark:text-gray-300 text-start`}>{teacher.phone}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <button
                                                            onClick={() => openEditModal(teacher)}
                                                            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl transition-all"
                                                            title={t('Edit')}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(teacher)}
                                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all"
                                                            title={t('Delete')}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 italic">
                                                {t('No Data')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Supervisor Modal */}
            <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="lg">
                <div className="bg-white dark:bg-[#1e293b] p-8 border border-gray-100 dark:border-white/10 rounded-2xl" dir={isRtl ? 'rtl' : 'ltr'}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Add New Supervisor')}</h2>
                        <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleAddSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('Name')}</label>
                                <input
                                    type="text"
                                    value={addForm.data.name}
                                    onChange={(e) => addForm.setData("name", e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all border"
                                    placeholder={t('Name')}
                                    required
                                />
                                {addForm.errors.name && <div className="mt-1 text-xs text-red-500">{addForm.errors.name}</div>}
                            </div>

                            <div>
                                <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('National ID')}</label>
                                <input
                                    type="text"
                                    value={addForm.data.national_id}
                                    onChange={(e) => addForm.setData("national_id", e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all border font-mono"
                                    placeholder={t('National ID')}
                                    required
                                />
                                {addForm.errors.national_id && <div className="mt-1 text-xs text-red-500">{addForm.errors.national_id}</div>}
                            </div>

                            <div>
                                <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('Email')} ({t('Optional')})</label>
                                <input
                                    type="email"
                                    value={addForm.data.email}
                                    onChange={(e) => addForm.setData("email", e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all border"
                                    placeholder="example@school.com"
                                />
                                {addForm.errors.email && <div className="mt-1 text-xs text-red-500">{addForm.errors.email}</div>}
                            </div>

                            <div>
                                <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('Phone Number')}</label>
                                <input
                                    type="text"
                                    value={addForm.data.phone}
                                    onChange={(e) => addForm.setData("phone", e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all border"
                                    placeholder="+966..."
                                    required
                                />
                                {addForm.errors.phone && <div className="mt-1 text-xs text-red-500">{addForm.errors.phone}</div>}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={addForm.processing}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                            >
                                {addForm.processing ? t('Saving...') : t('Add')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 bg-gray-100 dark:bg-[#0f172a] hover:bg-gray-200 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 py-3 rounded-2xl font-bold transition-all border border-gray-200 dark:border-white/10"
                            >
                                {t('Cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Supervisor Modal */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="lg">
                <div className="bg-white dark:bg-[#1e293b] p-8 border border-gray-100 dark:border-white/10 rounded-2xl" dir={isRtl ? 'rtl' : 'ltr'}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Edit Supervisor')}</h2>
                        <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleEditSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('Name')}</label>
                                <input
                                    type="text"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData("name", e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all border"
                                    placeholder={t('Name')}
                                    required
                                />
                                {editForm.errors.name && <div className="mt-1 text-xs text-red-500">{editForm.errors.name}</div>}
                            </div>

                            <div>
                                <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('National ID')}</label>
                                <input
                                    type="text"
                                    value={editForm.data.national_id}
                                    onChange={(e) => editForm.setData("national_id", e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all border font-mono"
                                    placeholder={t('National ID')}
                                    required
                                />
                                {editForm.errors.national_id && <div className="mt-1 text-xs text-red-500">{editForm.errors.national_id}</div>}
                            </div>

                            <div>
                                <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('Email')} ({t('Optional')})</label>
                                <input
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData("email", e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all border"
                                    placeholder="example@school.com"
                                />
                                {editForm.errors.email && <div className="mt-1 text-xs text-red-500">{editForm.errors.email}</div>}
                            </div>

                            <div>
                                <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('Phone Number')}</label>
                                <input
                                    type="text"
                                    value={editForm.data.phone}
                                    onChange={(e) => editForm.setData("phone", e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all border"
                                    placeholder="+966..."
                                    required
                                />
                                {editForm.errors.phone && <div className="mt-1 text-xs text-red-500">{editForm.errors.phone}</div>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.data.is_active}
                                        onChange={(e) => editForm.setData("is_active", e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t('Active')}</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                            >
                                {editForm.processing ? t('Saving...') : t('Save Changes')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 bg-gray-100 dark:bg-[#0f172a] hover:bg-gray-200 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 py-3 rounded-2xl font-bold transition-all border border-gray-200 dark:border-white/10"
                            >
                                {t('Cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="md">
                <div className="bg-white dark:bg-[#1e293b] p-8 border border-gray-100 dark:border-white/10 rounded-2xl transition-colors duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                        {t('Confirm Deletion')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        {t('Are you sure you want to delete this supervisor? This action cannot be undone.')}
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={handleDelete}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-bold shadow-lg shadow-red-500/20 transition-all"
                        >
                            {t('Yes, Delete')}
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="flex-1 bg-gray-100 dark:bg-[#0f172a] hover:bg-gray-200 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 py-3 rounded-2xl font-bold transition-all border border-gray-200 dark:border-white/10"
                        >
                            {t('Cancel')}
                        </button>
                    </div>
                </div>
            </Modal>
        </SchoolAuthenticatedLayout>
    );
}
