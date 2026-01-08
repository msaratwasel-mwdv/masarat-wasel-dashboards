import React, { useState, useCallback, useEffect } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router, usePage } from "@inertiajs/react";
import { User, Classroom } from "@/types";
import useTranslation from "@/hooks/useTranslation";
import { debounce } from "lodash";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

interface Guardian {
    id: number;
    name: string;
    name_en?: string;
    phone?: string;
    national_id?: string;
    address?: string;
    home_number?: string;
    image?: string;
    email?: string;
}

interface Supervisor {
    id: number;
    name: string;
}

interface Student {
    id: number;
    full_name: string;
    national_id?: string;
    gender?: string;
    image?: string;
    is_active: boolean;
    guardian?: Guardian;
    supervisor?: Supervisor;
    guardian_id?: number;
    supervisor_id?: number;
    current_enrollment: {
        classroom: Classroom;
        classroom_id?: number;
    } | null;
}

interface Props {
    auth: { user: User };
    students: Student[];
    filters: { search?: string };
    classrooms: Classroom[];
    supervisors: Supervisor[];
    storage_url: string;
}

export default function IndexStudents({
    auth,
    students,
    filters,
    classrooms,
    supervisors,
    storage_url,
}: Props) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || "");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(
        null
    );

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    // Creation Step State
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [guardianResult, setGuardianResult] = useState<{
        found: boolean;
        guardian: Guardian | null;
    } | null>(null);
    const [guardianImagePreview, setGuardianImagePreview] = useState<
        string | null
    >(null);
    const [studentImagePreview, setStudentImagePreview] = useState<
        string | null
    >(null);

    // Get storage URL from props or fallback
    const getStorageUrl = (): string => {
        if (storage_url) return storage_url;

        // Fallback to default storage URL
        const url = window.location.origin;
        return `${url}/storage`;
    };

    const currentStorageUrl = getStorageUrl();

    // دالة ذكية لعرض الصور مع fallback
    const getImageUrl = (
        path: string | null | undefined,
        type: "student" | "guardian" | "avatar" = "student"
    ): string => {
        if (!path) {
            // الصور الافتراضية في storage
            const defaultImages = {
                student: `${currentStorageUrl}/defaults/student.png`,
                guardian: `${currentStorageUrl}/defaults/guardian.png`,
                avatar: `${currentStorageUrl}/defaults/avatar.png`,
            };
            return defaultImages[type];
        }

        // إذا كان رابطاً كاملاً
        if (
            path.startsWith("http://") ||
            path.startsWith("https://") ||
            path.startsWith("//")
        ) {
            return path;
        }

        // تنظيف المسار
        let cleanPath = path;

        // إزالة /storage/ أو storage/ من البداية
        if (cleanPath.startsWith("/storage/")) {
            cleanPath = cleanPath.substring("/storage/".length);
        } else if (cleanPath.startsWith("storage/")) {
            cleanPath = cleanPath.substring("storage/".length);
        }

        // إزالة / من البداية
        if (cleanPath.startsWith("/")) {
            cleanPath = cleanPath.substring(1);
        }

        // إرجاع المسار الكامل بدون timestamp لمنع الحلقات اللانهائية
        return `${currentStorageUrl}/${cleanPath}`;
    };

    // Forms
    const guardianSearchForm = useForm({ national_id: "" });
    const guardianCreateForm = useForm({
        name: "",
        name_en: "",
        national_id: "",
        phone: "",
        email: "",
        address: "",
        home_number: "",
        image: null as File | null,
    });

    const studentForm = useForm({
        full_name: "",
        national_id: "",
        gender: "male",
        classroom_id: "",
        guardian_id: "",
        image: null as File | null,
        is_active: true,
        // For editing guardian inside student modal
        guardian: {
            name: "",
            name_en: "",
            national_id: "",
            phone: "",
            address: "",
            home_number: "",
            image: null as File | null,
        },
    });

    // Reset all forms
    const resetForms = () => {
        guardianSearchForm.reset();
        guardianSearchForm.clearErrors();
        guardianCreateForm.reset();
        guardianCreateForm.clearErrors();
        studentForm.reset();
        studentForm.clearErrors();
        setGuardianResult(null);
        setGuardianImagePreview(null);
        setStudentImagePreview(null);
        setStep(1);
    };

    const openAddModal = () => {
        setIsEditing(false);
        setEditingStudent(null);
        resetForms();
        setStep(1);
        setShowModal(true);
    };

    const openEditModal = (student: Student) => {
        setIsEditing(true);
        setEditingStudent(student);
        resetForms();

        // Populate Form
        studentForm.setData({
            full_name: student.full_name,
            national_id: student.national_id || "",
            gender: student.gender || "male",
            classroom_id:
                student.current_enrollment?.classroom?.id?.toString() || "",
            guardian_id: student.guardian_id?.toString() || "",
            image: null,
            is_active: student.is_active,
            guardian: {
                name: student.guardian?.name || "",
                name_en: student.guardian?.name_en || "",
                national_id: student.guardian?.national_id || "",
                phone: student.guardian?.phone || "",
                address: student.guardian?.address || "",
                home_number: student.guardian?.home_number || "",
                image: null,
            },
        });

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        resetForms();
    };

    // --- Search Debounce ---
    const debouncedSearch = useCallback(
        debounce((val: string) => {
            router.get(
                route("school.students.index"),
                { search: val },
                { preserveState: true, preserveScroll: true }
            );
        }, 300),
        []
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        debouncedSearch(e.target.value);
    };

    // Delete
    const handleDelete = () => {
        if (!studentToDelete) return;

        router.delete(route("school.students.destroy", studentToDelete.id), {
            preserveScroll: true,
            onSuccess: () => setShowDeleteModal(false),
        });
    };

    // Submit Student
    const handleSubmitStudent = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && editingStudent) {
            // Update
            studentForm.post(
                route("school.students.update_post", editingStudent.id),
                {
                    preserveScroll: true,
                    onSuccess: closeModal,
                    forceFormData: true,
                }
            );
        } else {
            // Create
            studentForm.post(route("school.students.store"), {
                preserveScroll: true,
                onSuccess: closeModal,
            });
        }
    };

    // Handle Guardian Search
    const handleGuardianSearch = (e: React.FormEvent) => {
        e.preventDefault();

        guardianSearchForm.post(route("school.guardians.search"), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                const res = page.props.guardianResult;
                setGuardianResult(res);
                if (res?.found && res.guardian) {
                    studentForm.setData(
                        "guardian_id",
                        res.guardian.id.toString()
                    );
                    setStep(3);
                } else if (res && !res.found) {
                    guardianCreateForm.setData(
                        "national_id",
                        guardianSearchForm.data.national_id
                    );
                    setStep(2);
                }
            },
        });
    };

    // Handle Guardian Create
    const handleGuardianCreate = (e: React.FormEvent) => {
        e.preventDefault();

        guardianCreateForm.post(route("school.guardians.store"), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                const res = page.props.guardianResult;
                if (res?.found && res.guardian) {
                    studentForm.setData(
                        "guardian_id",
                        res.guardian.id.toString()
                    );
                    setStep(3);
                }
            },
        });
    };

    // Handle Guardian Image Change
    const handleGuardianImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            guardianCreateForm.setData("image", file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setGuardianImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle Student Image Change
    const handleStudentImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            studentForm.setData("image", file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setStudentImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Remove Guardian Image
    const removeGuardianImage = () => {
        guardianCreateForm.setData("image", null);
        setGuardianImagePreview(null);
    };

    // Remove Student Image
    const removeStudentImage = () => {
        studentForm.setData("image", null);
        setStudentImagePreview(null);
    };

    // Handle image loading errors
    const handleImageError = (
        e: React.SyntheticEvent<HTMLImageElement>,
        type: "student" | "guardian" = "student"
    ) => {
        const target = e.target as HTMLImageElement;
        const defaultImage = `${currentStorageUrl}/defaults/${type}.png`;

        // Prevent infinite loop if default image also fails
        if (!target.src.includes("defaults/")) {
            target.src = defaultImage;
            target.onerror = null; // Prevent further errors trying to load default
        }
    };

    // Debug log للتحقق من المسارات
    useEffect(() => {
        if (students.length > 0) {
            console.log("Storage URL:", currentStorageUrl);
            console.log("First student image path:", students[0].image);
            console.log(
                "First student image full URL:",
                getImageUrl(students[0].image, "student")
            );

            if (students[0].guardian) {
                console.log(
                    "First guardian image path:",
                    students[0].guardian?.image
                );
                console.log(
                    "First guardian image full URL:",
                    getImageUrl(students[0].guardian?.image, "guardian")
                );
            }
        }
    }, [students, currentStorageUrl]);

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-xl font-bold leading-tight text-gray-800 dark:text-white">
                    {t("Students Management")}
                </h2>
            }
        >
            <Head title={t("Students")} />

            {/* Main Content */}
            <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="p-8 border shadow-xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-white/20 dark:border-gray-700 rounded-2xl">
                    {/* Header Strip */}
                    <div className="flex flex-col justify-between gap-6 mb-8 xl:flex-row xl:items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
                                <svg
                                    className="w-8 h-8"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.5"
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                    ></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                    {t("Students List")}
                                </h3>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {t("Total Students")}:{" "}
                                    <span className="font-bold text-gray-800 dark:text-gray-200">
                                        {students.length}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col w-full gap-4 sm:flex-row xl:w-auto">
                            <div className="relative flex-grow sm:flex-grow-0">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={handleSearchChange}
                                    placeholder={t("Search by Name, ID...")}
                                    className="w-full px-4 py-3 transition-shadow border border-gray-200 shadow-sm sm:w-72 bg-white/50 dark:bg-gray-900/50 dark:border-gray-600 rounded-xl pl-11 focus:ring-blue-500 dark:text-white focus:shadow-md"
                                />
                                <svg
                                    className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    ></path>
                                </svg>
                            </div>

                            <button
                                onClick={openAddModal}
                                className="inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:translate-y-[-1px]"
                            >
                                <svg
                                    className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 4v16m8-8H4"
                                    ></path>
                                </svg>
                                {t("Enroll New Student")}
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-gray-100 rounded-xl dark:border-gray-700/50">
                        <table className="min-w-full text-start">
                            <thead className="border-b border-gray-200 bg-gray-50 dark:bg-gray-700/20 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 text-start">
                                        {t("Student Name")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 text-start">
                                        {t("الرقم المدني")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 text-start">
                                        {t("Gender")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 text-start">
                                        {t("Student Photo")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 text-start">
                                        {t("Class")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 text-start">
                                        {t("معلم")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 text-start">
                                        {t("Guardian Name")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 text-start">
                                        {t("Guardian Civil ID")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 text-start">
                                        {t("Guardian Phone")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 text-start">
                                        {t("Address")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 text-start">
                                        {t("Guardian Photo")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase dark:text-gray-400 text-end">
                                        {t("Actions")}
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {students.length > 0 ? (
                                    students.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
                                        >
                                            {/* اسم الطالب */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
                                                        <img
                                                            src={getImageUrl(
                                                                student.image,
                                                                "student"
                                                            )}
                                                            alt={
                                                                student.full_name
                                                            }
                                                            className="object-cover w-full h-full"
                                                            onError={(e) =>
                                                                handleImageError(
                                                                    e,
                                                                    "student"
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    <span className="font-bold text-gray-800 dark:text-white">
                                                        {student.full_name}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* الرقم المدني (الطالب) */}
                                            <td className="px-4 py-4 font-mono text-sm text-gray-600 dark:text-gray-300">
                                                {student.national_id || "-"}
                                            </td>

                                            {/* الجنس */}
                                            <td className="px-4 py-4 text-sm">
                                                {student.gender === "male" ? (
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">
                                                        ♂ {t("Male")}
                                                    </span>
                                                ) : student.gender ===
                                                  "female" ? (
                                                    <span className="font-bold text-pink-600 dark:text-pink-400">
                                                        ♀ {t("Female")}
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>

                                            {/* صورة الطالب */}
                                            <td className="px-4 py-4">
                                                <div className="w-12 h-12 overflow-hidden bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                                    <img
                                                        src={getImageUrl(
                                                            student.image,
                                                            "student"
                                                        )}
                                                        alt={student.full_name}
                                                        className="object-cover w-full h-full"
                                                        onError={(e) =>
                                                            handleImageError(
                                                                e,
                                                                "student"
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </td>

                                            {/* الفصل */}
                                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                {student.current_enrollment
                                                    ?.classroom?.name || "-"}
                                            </td>

                                            {/* المعلم */}
                                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                {student.supervisor?.name ||
                                                    "-"}
                                            </td>

                                            {/* اسم ولي الأمر */}
                                            <td className="px-4 py-4 text-sm font-bold text-gray-800 dark:text-white">
                                                {student.guardian?.name || "-"}
                                            </td>

                                            {/* الرقم المدني لولي الأمر */}
                                            <td className="px-4 py-4 font-mono text-sm text-gray-600 dark:text-gray-300">
                                                {student.guardian
                                                    ?.national_id || "-"}
                                            </td>

                                            {/* جوال ولي الأمر */}
                                            <td className="px-4 py-4 font-mono text-sm text-gray-600 dark:text-gray-300">
                                                {student.guardian?.phone || "-"}
                                            </td>

                                            {/* العنوان */}
                                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                {student.guardian?.address ||
                                                    "-"}
                                            </td>

                                            {/* صورة ولي الأمر */}
                                            <td className="px-4 py-4">
                                                <div className="w-12 h-12 overflow-hidden bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                                                    <img
                                                        src={getImageUrl(
                                                            student.guardian
                                                                ?.image,
                                                            "guardian"
                                                        )}
                                                        alt={
                                                            student.guardian
                                                                ?.name ||
                                                            "Guardian"
                                                        }
                                                        className="object-cover w-full h-full"
                                                        onError={(e) =>
                                                            handleImageError(
                                                                e,
                                                                "guardian"
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </td>

                                            {/* الإجراءات */}
                                            <td className="px-4 py-4 text-end">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(
                                                                student
                                                            )
                                                        }
                                                        className="p-2 text-blue-600 transition-all rounded-lg dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:scale-105"
                                                        title={t("Edit")}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setStudentToDelete(
                                                                student
                                                            );
                                                            setShowDeleteModal(
                                                                true
                                                            );
                                                        }}
                                                        className="p-2 text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:scale-105"
                                                        title={t("Delete")}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={12}
                                            className="py-10 text-center text-gray-400 dark:text-gray-500"
                                        >
                                            {t("No students found")}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Main Modal */}
            <Modal show={showModal} onClose={closeModal} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {isEditing
                                ? t("Edit Student")
                                : step === 1
                                ? t("Step 1: Guardian Verification")
                                : step === 2
                                ? t("Step 2: Create Guardian")
                                : t("Step 3: Student Details")}
                        </h3>
                        <button
                            onClick={closeModal}
                            className="text-gray-400 transition-colors hover:text-gray-600"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                ></path>
                            </svg>
                        </button>
                    </div>

                    {/* Step 1: Search Guardian */}
                    {!isEditing && step === 1 && (
                        <div className="space-y-6">
                            <div className="text-right rtl:text-right">
                                <h4 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">
                                    {t("البحث عن ولي الأمر")}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                        "ابحث بالرقم المدني للتحقق من وجود ولي الأمر"
                                    )}
                                </p>
                            </div>

                            <form
                                onSubmit={handleGuardianSearch}
                                className="space-y-4"
                            >
                                <div>
                                    <InputLabel
                                        value={t("الرقم المدني")}
                                        className="mb-2"
                                    />
                                    <div className="flex gap-3">
                                        <TextInput
                                            value={
                                                guardianSearchForm.data
                                                    .national_id
                                            }
                                            onChange={(e) =>
                                                guardianSearchForm.setData(
                                                    "national_id",
                                                    e.target.value
                                                )
                                            }
                                            className="flex-1"
                                            placeholder="10xxxxxxxxx"
                                            required
                                        />
                                        <PrimaryButton
                                            type="submit"
                                            disabled={
                                                guardianSearchForm.processing
                                            }
                                        >
                                            {guardianSearchForm.processing
                                                ? t("جاري البحث...")
                                                : t("بحث")}
                                        </PrimaryButton>
                                    </div>
                                </div>
                            </form>

                            {/* Search Results */}
                            {guardianResult && (
                                <div
                                    className={`p-4 rounded-xl border ${
                                        guardianResult.found
                                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                                            : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700"
                                    }`}
                                >
                                    {guardianResult.found &&
                                    guardianResult.guardian ? (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-green-700 dark:text-green-400">
                                                    ✓{" "}
                                                    {t(
                                                        "تم العثور على ولي الأمر"
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {
                                                        guardianResult.guardian
                                                            .name
                                                    }{" "}
                                                    (
                                                    {
                                                        guardianResult.guardian
                                                            .phone
                                                    }
                                                    )
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {t("الرقم المدني")}:{" "}
                                                    {
                                                        guardianResult.guardian
                                                            .national_id
                                                    }
                                                </p>
                                            </div>
                                            <PrimaryButton
                                                onClick={() => setStep(3)}
                                            >
                                                {t("اختيار ومتابعة")}
                                            </PrimaryButton>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-yellow-700 dark:text-yellow-400">
                                                    ⚠️{" "}
                                                    {t(
                                                        "لم يتم العثور على ولي الأمر"
                                                    )}
                                                </p>
                                                <p className="text-sm text-yellow-600 dark:text-yellow-300">
                                                    {t(
                                                        "يرجى إنشاء ولي أمر جديد"
                                                    )}
                                                </p>
                                            </div>
                                            <PrimaryButton
                                                onClick={() => setStep(2)}
                                            >
                                                {t("إنشاء ولي أمر جديد")}
                                            </PrimaryButton>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Create Guardian */}
                    {!isEditing && step === 2 && (
                        <div className="space-y-6">
                            <div className="text-right rtl:text-right">
                                <h4 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">
                                    {t("إنشاء ولي أمر جديد")}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t("أدخل بيانات ولي الأمر الجديد")}
                                </p>
                            </div>

                            <form
                                onSubmit={handleGuardianCreate}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* الاسم بالعربي */}
                                    <div className="md:col-span-2">
                                        <InputLabel
                                            value={t("اسم ولي الأمر (عربي) *")}
                                        />
                                        <TextInput
                                            value={guardianCreateForm.data.name}
                                            onChange={(e) =>
                                                guardianCreateForm.setData(
                                                    "name",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full"
                                            required
                                        />
                                        <InputError
                                            message={
                                                guardianCreateForm.errors.name
                                            }
                                        />
                                    </div>

                                    {/* الاسم بالإنجليزي */}
                                    <div className="md:col-span-2">
                                        <InputLabel
                                            value={t("اسم ولي الأمر (إنجليزي)")}
                                        />
                                        <TextInput
                                            value={
                                                guardianCreateForm.data.name_en
                                            }
                                            onChange={(e) =>
                                                guardianCreateForm.setData(
                                                    "name_en",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full"
                                        />
                                    </div>

                                    {/* الرقم المدني */}
                                    <div>
                                        <InputLabel
                                            value={t("الرقم المدني *")}
                                        />
                                        <TextInput
                                            value={
                                                guardianCreateForm.data
                                                    .national_id
                                            }
                                            onChange={(e) =>
                                                guardianCreateForm.setData(
                                                    "national_id",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full"
                                            required
                                        />
                                        <InputError
                                            message={
                                                guardianCreateForm.errors
                                                    .national_id
                                            }
                                        />
                                    </div>

                                    {/* رقم الهاتف */}
                                    <div>
                                        <InputLabel value={t("رقم الهاتف *")} />
                                        <TextInput
                                            value={
                                                guardianCreateForm.data.phone
                                            }
                                            onChange={(e) =>
                                                guardianCreateForm.setData(
                                                    "phone",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full"
                                            required
                                            placeholder="+966XXXXXXXXX"
                                        />
                                        <InputError
                                            message={
                                                guardianCreateForm.errors.phone
                                            }
                                        />
                                    </div>

                                    {/* البريد الإلكتروني */}
                                    <div className="md:col-span-2">
                                        <InputLabel
                                            value={t("البريد الإلكتروني")}
                                        />
                                        <TextInput
                                            type="email"
                                            value={
                                                guardianCreateForm.data.email
                                            }
                                            onChange={(e) =>
                                                guardianCreateForm.setData(
                                                    "email",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full"
                                            placeholder="example@email.com"
                                        />
                                    </div>

                                    {/* العنوان */}
                                    <div className="md:col-span-2">
                                        <InputLabel value={t("العنوان")} />
                                        <TextInput
                                            value={
                                                guardianCreateForm.data.address
                                            }
                                            onChange={(e) =>
                                                guardianCreateForm.setData(
                                                    "address",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full"
                                        />
                                    </div>

                                    {/* رقم المنزل */}
                                    <div>
                                        <InputLabel value={t("رقم المنزل")} />
                                        <TextInput
                                            value={
                                                guardianCreateForm.data
                                                    .home_number
                                            }
                                            onChange={(e) =>
                                                guardianCreateForm.setData(
                                                    "home_number",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full"
                                        />
                                    </div>

                                    {/* صورة ولي الأمر */}
                                    <div className="md:col-span-2">
                                        <InputLabel
                                            value={t("صورة ولي الأمر")}
                                        />
                                        <div className="relative flex flex-col items-center justify-center gap-4 p-6 transition-colors border-2 border-gray-300 border-dashed cursor-pointer dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400">
                                            {guardianCreateForm.data.image ||
                                            guardianImagePreview ? (
                                                <div className="flex items-center w-full gap-4">
                                                    <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
                                                        <img
                                                            src={
                                                                guardianImagePreview ||
                                                                (guardianCreateForm
                                                                    .data.image
                                                                    ? URL.createObjectURL(
                                                                          guardianCreateForm
                                                                              .data
                                                                              .image
                                                                      )
                                                                    : "")
                                                            }
                                                            className="object-cover w-full h-full"
                                                            alt={t(
                                                                "صورة ولي الأمر"
                                                            )}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {guardianCreateForm
                                                                .data.image
                                                                ?.name ||
                                                                t(
                                                                    "صورة ولي الأمر"
                                                                )}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                removeGuardianImage
                                                            }
                                                            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                        >
                                                            {t("إزالة")}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-3xl text-gray-400">
                                                        📷
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {t(
                                                                "انقر لرفع الصورة"
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                            PNG, JPG حتى 5MB
                                                        </p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={
                                                            handleGuardianImageChange
                                                        }
                                                    />
                                                </>
                                            )}
                                        </div>
                                        <InputError
                                            message={
                                                guardianCreateForm.errors.image
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <SecondaryButton
                                        type="button"
                                        onClick={() => setStep(1)}
                                    >
                                        {t("رجوع")}
                                    </SecondaryButton>
                                    <PrimaryButton
                                        type="submit"
                                        disabled={guardianCreateForm.processing}
                                    >
                                        {guardianCreateForm.processing
                                            ? t("جاري الحفظ...")
                                            : t("إنشاء ولي الأمر")}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Step 3: Student Details (Or Edit Mode) */}
                    {(step === 3 || isEditing) && (
                        <form
                            onSubmit={handleSubmitStudent}
                            className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2"
                        >
                            {isEditing && (
                                <div className="p-4 mb-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-700 rounded-xl">
                                    <h4 className="mb-2 font-bold text-yellow-800 dark:text-yellow-400">
                                        {t("Guardian Information")}
                                    </h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <InputLabel
                                                value={t("Guardian Name")}
                                            />
                                            <TextInput
                                                value={
                                                    studentForm.data.guardian
                                                        .name
                                                }
                                                onChange={(e) =>
                                                    studentForm.setData(
                                                        "guardian",
                                                        {
                                                            ...studentForm.data
                                                                .guardian,
                                                            name: e.target
                                                                .value,
                                                        }
                                                    )
                                                }
                                                className="w-full"
                                            />
                                            <InputError
                                                message={
                                                    studentForm.errors[
                                                        "guardian.name"
                                                    ] as string
                                                }
                                            />
                                        </div>

                                        <div>
                                            <InputLabel
                                                value={t("Guardian Phone")}
                                            />
                                            <TextInput
                                                value={
                                                    studentForm.data.guardian
                                                        .phone
                                                }
                                                onChange={(e) =>
                                                    studentForm.setData(
                                                        "guardian",
                                                        {
                                                            ...studentForm.data
                                                                .guardian,
                                                            phone: e.target
                                                                .value,
                                                        }
                                                    )
                                                }
                                                className="w-full"
                                            />
                                        </div>

                                        <div>
                                            <InputLabel
                                                value={t("الرقم المدني")}
                                            />
                                            <TextInput
                                                value={
                                                    studentForm.data.guardian
                                                        .national_id
                                                }
                                                onChange={(e) =>
                                                    studentForm.setData(
                                                        "guardian",
                                                        {
                                                            ...studentForm.data
                                                                .guardian,
                                                            national_id:
                                                                e.target.value,
                                                        }
                                                    )
                                                }
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <h4 className="mb-2 font-bold text-gray-800 dark:text-white">
                                {t("Student Information")}
                            </h4>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <InputLabel
                                        value={t("Student Name") + " *"}
                                    />
                                    <TextInput
                                        value={studentForm.data.full_name}
                                        onChange={(e) =>
                                            studentForm.setData(
                                                "full_name",
                                                e.target.value
                                            )
                                        }
                                        className="w-full"
                                        required
                                    />
                                    <InputError
                                        message={studentForm.errors.full_name}
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        value={t("الرقم المدني") + " *"}
                                    />
                                    <TextInput
                                        value={studentForm.data.national_id}
                                        onChange={(e) =>
                                            studentForm.setData(
                                                "national_id",
                                                e.target.value
                                            )
                                        }
                                        className="w-full"
                                        required
                                    />
                                    <InputError
                                        message={studentForm.errors.national_id}
                                    />
                                </div>

                                <div>
                                    <InputLabel value={t("Gender") + " *"} />
                                    <select
                                        value={studentForm.data.gender}
                                        onChange={(e) =>
                                            studentForm.setData(
                                                "gender",
                                                e.target.value
                                            )
                                        }
                                        className="w-full border-gray-300 rounded-md shadow-sm dark:border-gray-700 dark:bg-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="male">
                                            {t("Male")}
                                        </option>
                                        <option value="female">
                                            {t("Female")}
                                        </option>
                                    </select>
                                    <InputError
                                        message={studentForm.errors.gender}
                                    />
                                </div>

                                <div>
                                    <InputLabel value={t("Class") + " *"} />
                                    <select
                                        value={studentForm.data.classroom_id}
                                        onChange={(e) =>
                                            studentForm.setData(
                                                "classroom_id",
                                                e.target.value
                                            )
                                        }
                                        className="w-full border-gray-300 rounded-md shadow-sm dark:border-gray-700 dark:bg-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">
                                            {t("Select Class")}
                                        </option>
                                        {classrooms.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={
                                            studentForm.errors.classroom_id
                                        }
                                    />
                                </div>

                                {/* صورة الطالب */}
                                <div className="md:col-span-2">
                                    <InputLabel value={t("Student Photo")} />
                                    <div className="relative flex flex-col items-center justify-center gap-4 p-6 transition-colors border-2 border-gray-300 border-dashed cursor-pointer dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400">
                                        {studentForm.data.image ||
                                        studentImagePreview ? (
                                            <div className="flex items-center w-full gap-4">
                                                <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
                                                    <img
                                                        src={
                                                            studentImagePreview ||
                                                            (studentForm.data
                                                                .image
                                                                ? URL.createObjectURL(
                                                                      studentForm
                                                                          .data
                                                                          .image
                                                                  )
                                                                : "")
                                                        }
                                                        className="object-cover w-full h-full"
                                                        alt={t("صورة الطالب")}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {studentForm.data.image
                                                            ?.name ||
                                                            t("صورة الطالب")}
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            removeStudentImage
                                                        }
                                                        className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                    >
                                                        {t("إزالة")}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-3xl text-gray-400">
                                                    👤
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {t(
                                                            "انقر لرفع صورة الطالب"
                                                        )}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        PNG, JPG حتى 5MB
                                                    </p>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={
                                                        handleStudentImageChange
                                                    }
                                                />
                                            </>
                                        )}
                                    </div>
                                    <InputError
                                        message={studentForm.errors.image}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                                {!isEditing && (
                                    <SecondaryButton onClick={() => setStep(1)}>
                                        {t("Back")}
                                    </SecondaryButton>
                                )}
                                <SecondaryButton onClick={closeModal}>
                                    {t("Cancel")}
                                </SecondaryButton>
                                <PrimaryButton
                                    disabled={studentForm.processing}
                                >
                                    {isEditing
                                        ? t("Save Changes")
                                        : t("Enroll Student")}
                                </PrimaryButton>
                            </div>
                        </form>
                    )}
                </div>
            </Modal>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-md p-6 bg-white border border-gray-200 shadow-2xl dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                            {t("Confirm Deletion")}
                        </h3>
                        <p className="mb-6 text-gray-500 dark:text-gray-400">
                            {t("Are you sure you want to delete this student?")}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                            >
                                {t("Cancel")}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
                            >
                                {t("Yes, Delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SchoolAuthenticatedLayout>
    );
}
