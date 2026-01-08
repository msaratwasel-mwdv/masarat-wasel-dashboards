import React, { useState, useCallback, Fragment } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import useTranslation from "@/hooks/useTranslation";
import { debounce } from "lodash";
import Modal from "@/Components/Modal";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react";

export interface Classroom {
    id: number;
    name: string;
    grade_level?: string;
    school_id: number;
    teachers?: { id: number; name: string; email?: string }[];
}

interface Supervisor {
    id: number;
    name: string;
}

interface Props {
    auth: any;
    classrooms: Classroom[];
    supervisors?: Supervisor[];
    filters: { search?: string };
}

export default function ClassroomIndex({ auth, classrooms, supervisors = [], filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || "");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [classToEdit, setClassToEdit] = useState<Classroom | null>(null);
    const [classToDelete, setClassToDelete] = useState<Classroom | null>(null);

    // Form for adding new class
    const addForm = useForm({
        name: "",
        supervisor_id: "",
    });

    // Form for editing class
    const editForm = useForm({
        name: "",
        supervisor_id: "",
    });

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post(route("school.classrooms.store"), {
            preserveScroll: true,
            onSuccess: () => {
                setShowAddModal(false);
                addForm.reset();
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!classToEdit) return;

        // The backend expects teacher_ids (array) for update
        editForm.transform((data) => ({
            ...data,
            teacher_ids: data.supervisor_id ? [parseInt(data.supervisor_id)] : [],
        }));

        editForm.put(route("school.classrooms.update", classToEdit.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowEditModal(false);
                editForm.reset();
                setClassToEdit(null);
            },
        });
    };

    const openEditModal = (classroom: Classroom) => {
        setClassToEdit(classroom);
        editForm.setData({
            name: classroom.name,
            supervisor_id: classroom.teachers && classroom.teachers.length > 0 ? classroom.teachers[0].id.toString() : "",
        });
        setShowEditModal(true);
    };

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            router.get(
                route("school.classrooms.index"),
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

    const confirmDelete = (classroom: Classroom) => {
        setClassToDelete(classroom);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (classToDelete) {
            router.delete(route("school.classrooms.destroy", classToDelete.id), {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setClassToDelete(null);
                }
            });
        }
    };

    const getSupervisorName = (id: string) => {
        const s = supervisors.find(sup => sup.id.toString() === id);
        return s ? s.name : t("Select Supervisor");
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">
                    {t('Classes Management')}
                </h2>
            }
        >
            <Head title={t('Classes Management')} />

            <div className={`max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8`} dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="bg-white dark:bg-[#0f172a] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/5 transition-colors duration-300">
                    <div className="p-8">
                        {/* Header Section */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{t('Classes List')}</h1>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{t('Total Classes')}: {classrooms.length}</p>
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
                                    {t('Add New Class')}
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#1e293b]/20 transition-colors duration-300">
                            <table className={`w-full text-start mb-0`} dir={isRtl ? 'rtl' : 'ltr'}>
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-100/50 dark:bg-white/[0.02]">
                                        <th className={`px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm text-start`}>{t('Class Name')}</th>
                                        <th className={`px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm text-start`}>{t('Supervisor')}</th>
                                        <th className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium text-sm text-center">{t('Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {classrooms.length > 0 ? (
                                        classrooms.map((classroom) => (
                                            <tr key={classroom.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                                <td className={`px-6 py-4 text-gray-800 dark:text-white font-medium text-start`}>{classroom.name}</td>
                                                <td className={`px-6 py-4 text-gray-600 dark:text-gray-300 text-start`}>
                                                    {classroom.teachers && classroom.teachers.length > 0
                                                        ? classroom.teachers.map((t) => t.name).join(", ")
                                                        : "-"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <button
                                                            onClick={() => openEditModal(classroom)}
                                                            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl transition-all"
                                                            title={t('Edit')}
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(classroom)}
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
                                            <td colSpan={3} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 italic">
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

            {/* Add Class Modal */}
            <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="md">
                <div className="bg-white dark:bg-[#1e293b] p-8 border border-gray-100 dark:border-white/10 rounded-2xl min-h-[450px]" dir={isRtl ? 'rtl' : 'ltr'}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Add New Class')}</h2>
                        <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleAddSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('Class Name')}</label>
                            <input
                                type="text"
                                value={addForm.data.name}
                                onChange={(e) => addForm.setData("name", e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all border"
                                placeholder={t('Class Name')}
                                required
                            />
                            {addForm.errors.name && <div className="mt-1 text-xs text-red-500">{addForm.errors.name}</div>}
                        </div>

                        <div>
                            <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('Assign Supervisor')}</label>
                            <Listbox
                                value={addForm.data.supervisor_id}
                                onChange={(val) => addForm.setData("supervisor_id", val)}
                            >
                                <div className="relative mt-1">
                                    <ListboxButton className={`relative w-full cursor-pointer rounded-2xl bg-gray-50 dark:bg-[#0f172a] py-3 ${isRtl ? 'pl-10 pr-4 text-right' : 'pr-10 pl-4 text-left'} text-gray-800 dark:text-white border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm`}>
                                        <span className="block truncate">
                                            {getSupervisorName(addForm.data.supervisor_id)}
                                        </span>
                                        <span className={`pointer-events-none absolute inset-y-0 ${isRtl ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center`}>
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </span>
                                    </ListboxButton>
                                    <Transition
                                        as={Fragment}
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl bg-white dark:bg-[#1e293b] py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-100 dark:border-white/10">
                                            <ListboxOption
                                                value=""
                                                className={({ active }) =>
                                                    `relative cursor-pointer select-none py-3 px-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'
                                                    }`
                                                }
                                            >
                                                {t('Select Supervisor')}
                                            </ListboxOption>
                                            {supervisors.map((s) => (
                                                <ListboxOption
                                                    key={s.id}
                                                    value={s.id.toString()}
                                                    className={({ active }) =>
                                                        `relative cursor-pointer select-none py-3 px-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'
                                                        }`
                                                    }
                                                >
                                                    {s.name}
                                                </ListboxOption>
                                            ))}
                                        </ListboxOptions>
                                    </Transition>
                                </div>
                            </Listbox>
                            {addForm.errors.supervisor_id && <div className="mt-1 text-xs text-red-500">{addForm.errors.supervisor_id}</div>}
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

            {/* Edit Class Modal */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="md">
                <div className="bg-white dark:bg-[#1e293b] p-8 border border-gray-100 dark:border-white/10 rounded-2xl min-h-[450px]" dir={isRtl ? 'rtl' : 'ltr'}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Edit Class')}</h2>
                        <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleEditSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('Class Name')}</label>
                            <input
                                type="text"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData("name", e.target.value)}
                                className="w-full bg-gray-50 dark:bg-[#0f172a] border-gray-200 dark:border-white/10 rounded-2xl py-3 px-4 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-all border"
                                placeholder={t('Class Name')}
                                required
                            />
                            {editForm.errors.name && <div className="mt-1 text-xs text-red-500">{editForm.errors.name}</div>}
                        </div>

                        <div>
                            <label className="block text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{t('Assign Supervisor')}</label>
                            <Listbox
                                value={editForm.data.supervisor_id}
                                onChange={(val) => editForm.setData("supervisor_id", val)}
                            >
                                <div className="relative mt-1">
                                    <ListboxButton className={`relative w-full cursor-pointer rounded-2xl bg-gray-50 dark:bg-[#0f172a] py-3 ${isRtl ? 'pl-10 pr-4 text-right' : 'pr-10 pl-4 text-left'} text-gray-800 dark:text-white border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm`}>
                                        <span className="block truncate">
                                            {getSupervisorName(editForm.data.supervisor_id)}
                                        </span>
                                        <span className={`pointer-events-none absolute inset-y-0 ${isRtl ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center`}>
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </span>
                                    </ListboxButton>
                                    <Transition
                                        as={Fragment}
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-2xl bg-white dark:bg-[#1e293b] py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-100 dark:border-white/10">
                                            <ListboxOption
                                                value=""
                                                className={({ active }) =>
                                                    `relative cursor-pointer select-none py-3 px-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'
                                                    }`
                                                }
                                            >
                                                {t('Select Supervisor')}
                                            </ListboxOption>
                                            {supervisors.map((s) => (
                                                <ListboxOption
                                                    key={s.id}
                                                    value={s.id.toString()}
                                                    className={({ active }) =>
                                                        `relative cursor-pointer select-none py-3 px-4 ${active ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'
                                                        }`
                                                    }
                                                >
                                                    {s.name}
                                                </ListboxOption>
                                            ))}
                                        </ListboxOptions>
                                    </Transition>
                                </div>
                            </Listbox>
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
                        {t('Are you sure you want to delete this class? This action cannot be undone.')}
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
