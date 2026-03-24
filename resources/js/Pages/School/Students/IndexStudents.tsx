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

interface BusGroup {
  id: number;
  name: string;
  bus?: {
    capacity: number;
  };
}

interface Student {
  id: number;
  full_name: string;
  full_name_en?: string;
  national_id?: string;
  gender?: string;
  image?: string;
  is_active: boolean;
  guardian?: Guardian;
  supervisor?: Supervisor;
  guardian_id?: number;
  supervisor_id?: number;
  forth_route_id?: number | null;
  back_route_id?: number | null;
  morning_group_id?: number | null;
  afternoon_group_id?: number | null;
  morning_group?: BusGroup | null;
  afternoon_group?: BusGroup | null;
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
  routes: { id: number; name: string }[];
  supervisors: Supervisor[];
  busGroups?: BusGroup[];
  storage_url: string;
}

export default function IndexStudents({
  auth,
  students,
  filters,
  classrooms,
  routes = [],
  supervisors,
  busGroups = [],
  storage_url,
}: Props) {
  const { t, isRtl } = useTranslation();
  const [search, setSearch] = useState(filters.search || "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

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
  const [studentImagePreview, setStudentImagePreview] = useState<string | null>(
    null
  );

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
    full_name_en: "",
    national_id: "",
    gender: "male",
    classroom_id: "",
    guardian_id: "",
    forth_route_id: "",
    back_route_id: "",
    morning_group_id: "",
    afternoon_group_id: "",
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
      full_name_en: student.full_name_en || "",
      national_id: student.national_id || "",
      gender: student.gender || "male",
      classroom_id: student.current_enrollment?.classroom?.id?.toString() || "",
      guardian_id: student.guardian_id?.toString() || "",
      forth_route_id: student.forth_route_id?.toString() || "",
      back_route_id: student.back_route_id?.toString() || "",
      morning_group_id: student.morning_group_id?.toString() || "",
      afternoon_group_id: student.afternoon_group_id?.toString() || "",
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
          studentForm.setData("guardian_id", res.guardian.id.toString());
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
          studentForm.setData("guardian_id", res.guardian.id.toString());
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
  const handleStudentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        console.log("First guardian image path:", students[0].guardian?.image);
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
        <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
          {t("Students Management")}
        </h2>
      }
    >
      <Head title={t("Students")} />

      {/* Main Content */}
      <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-[30px]">
          {/* Header Strip */}
          <div className="flex flex-col justify-between gap-6 mb-8 xl:flex-row xl:items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#0e7490] text-white rounded-[20px] shadow-sm">
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
                <h3 className="text-2xl font-bold text-[#0e7490] dark:text-cyan-400">
                  📚 {t("Students List")}
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t("Total Students")}:{" "}
                  <span className="font-bold text-[#0e7490] dark:text-cyan-400">
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
                  className={`w-full py-3.5 border border-gray-200 dark:border-gray-600 shadow-sm sm:w-72 bg-gray-50 dark:bg-gray-700 rounded-[35px] focus:ring-2 focus:ring-[#0e7490] focus:border-transparent dark:text-white transition-all ${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"}`}
                />
                <div className={`absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 pointer-events-none`}>
                  <svg
                    className="w-5 h-5 text-gray-400"
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
              </div>

              <button
                onClick={openAddModal}
                className="inline-flex justify-center items-center px-8 py-3.5 bg-[#0e7490] text-white hover:bg-[#155e75] rounded-[35px] font-bold shadow-lg hover:shadow-xl transition-all"
              >
                <svg
                  className="w-5 h-5 me-2"
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
          <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-[20px]">
            <table className="min-w-full text-start">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                    {t("Student Name")} (Ar/En)
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                    {t("Civil ID")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                    {t("Gender")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                    {t("Class")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                    {t("Morning Group")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                    {t("Afternoon Group")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                    {t("Guardian Name")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                    {t("Guardian Civil ID")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                    {t("Guardian Phone")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                    {t("Address")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">
                    {t("Guardian Photo")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-end">
                    {t("Actions")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-900/10"
                    >
                      {/* اسم الطالب */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
                            <img
                              src={getImageUrl(student.image, "student")}
                              alt={student.full_name}
                              className="object-cover w-full h-full"
                              onError={(e) => handleImageError(e, "student")}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 dark:text-white">
                              {student.full_name}
                            </span>
                            {student.full_name_en && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {student.full_name_en}
                              </span>
                            )}
                          </div>
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
                        ) : student.gender === "female" ? (
                          <span className="font-bold text-pink-600 dark:text-pink-400">
                            ♀ {t("Female")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* الفصل */}
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {student.current_enrollment?.classroom?.name || "-"}
                      </td>

                      {/* المجموعة الصباحية */}
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {student.morning_group?.name || "-"}
                      </td>

                      {/* المجموعة المسائية */}
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {student.afternoon_group?.name || "-"}
                      </td>

                      {/* اسم ولي الأمر */}
                      <td className="px-4 py-4 text-sm font-bold text-gray-800 dark:text-white">
                        {student.guardian?.name || "-"}
                      </td>

                      {/* الرقم المدني لولي الأمر */}
                      <td className="px-4 py-4 font-mono text-sm text-gray-600 dark:text-gray-300">
                        {student.guardian?.national_id || "-"}
                      </td>

                      {/* جوال ولي الأمر */}
                      <td className="px-4 py-4 font-mono text-sm text-gray-600 dark:text-gray-300">
                        {student.guardian?.phone || "-"}
                      </td>

                      {/* العنوان */}
                      <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {student.guardian?.address || "-"}
                      </td>

                      {/* صورة ولي الأمر */}
                      <td className="px-4 py-4">
                        <div className="w-12 h-12 overflow-hidden bg-gray-100 border border-gray-200 rounded-[15px] dark:bg-gray-700 dark:border-gray-600">
                          <img
                            src={getImageUrl(
                              student.guardian?.image,
                              "guardian"
                            )}
                            alt={student.guardian?.name || "Guardian"}
                            className="object-cover w-full h-full"
                            onError={(e) => handleImageError(e, "guardian")}
                          />
                        </div>
                      </td>

                      {/* الإجراءات */}
                      <td className="px-4 py-4 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-2.5 text-[#0e7490] bg-cyan-50 dark:bg-cyan-900/20 transition-all rounded-[15px] hover:bg-cyan-100 dark:hover:bg-cyan-900/40 hover:scale-105 border border-cyan-100 dark:border-cyan-800"
                            title={t("Edit")}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              setStudentToDelete(student);
                              setShowDeleteModal(true);
                            }}
                            className="p-2.5 text-red-600 bg-red-50 dark:bg-red-900/20 transition-all rounded-[15px] hover:bg-red-100 dark:hover:bg-red-900/40 hover:scale-105 border border-red-100 dark:border-red-800"
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
                    <td colSpan={12} className="py-16 text-center">
                      <div className="text-6xl mb-4 opacity-20">👨‍🎓</div>
                      <p className="text-gray-400 dark:text-gray-500 font-medium">
                        {t("No students found")}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Main Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-[30px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0e7490] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {isEditing
                      ? t("Edit Student")
                      : step === 1
                        ? t("Guardian Verification")
                        : step === 2
                          ? t("Create New Guardian")
                          : t("Student Details")}
                  </h3>
                  {!isEditing && (
                    <p className="mt-1 text-sm text-blue-100">
                      {step === 1 && t("Guardian Verification")}
                      {step === 2 && t("Create New Guardian")}
                      {step === 3 && t("Enter student details")}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 transition-colors rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                >
                  <svg
                    className="w-8 h-8"
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
            </div>

            {/* Content Wrapper */}
            <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Step 1: Search Guardian */}
              {!isEditing && step === 1 && (
                <div className="space-y-6">
                  <div className="p-6 bg-cyan-50 dark:bg-cyan-900/10 rounded-[25px] border border-cyan-100 dark:border-cyan-800">
                    <h4 className="text-lg font-bold text-[#0e7490] dark:text-cyan-400 mb-2">
                      {t("Search Guardian")}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("Search by Civil ID to find existing guardian.")}
                    </p>
                  </div>

                  <form onSubmit={handleGuardianSearch} className="space-y-4">
                    <div>
                      <InputLabel
                        value={t("Civil ID")}
                        className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                      />
                      <div className="flex gap-3">
                        <TextInput
                          value={guardianSearchForm.data.national_id}
                          onChange={(e) =>
                            guardianSearchForm.setData(
                              "national_id",
                              e.target.value
                            )
                          }
                          className="flex-1 px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                          placeholder="10xxxxxxxxx"
                          required
                        />
                        <button
                          type="submit"
                          disabled={guardianSearchForm.processing}
                          className="px-8 py-4 bg-[#0e7490] text-white font-bold rounded-[35px] hover:bg-[#155e75] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {guardianSearchForm.processing
                            ? t("Searching...")
                            : t("Search")}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Search Results */}
                  {guardianResult && (
                    <div
                      className={`p-6 rounded-[25px] border ${guardianResult.found
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700"
                        }`}
                    >
                      {guardianResult.found && guardianResult.guardian ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-green-700 dark:text-green-400 text-lg">
                              ✓ {t("Guardian Found")}
                            </p>
                            <p className="mt-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                              {guardianResult.guardian.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {t("Civil ID")}:{" "}
                              {guardianResult.guardian.national_id}
                            </p>
                          </div>
                          <button
                            onClick={() => setStep(3)}
                            className="px-6 py-3 bg-green-600 text-white font-bold rounded-[25px] hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
                          >
                            {t("Select & Continue")}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-amber-700 dark:text-amber-400 text-lg">
                              ⚠️ {t("Guardian Not Found")}
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                              {t("Please create a new guardian")}
                            </p>
                          </div>
                          <button
                            onClick={() => setStep(2)}
                            className="px-6 py-3 bg-[#0e7490] text-white font-bold rounded-[25px] hover:bg-[#155e75] shadow-md hover:shadow-lg transition-all"
                          >
                            {t("Create New Guardian")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Create Guardian */}
              {!isEditing && step === 2 && (
                <div className="space-y-6">
                  <div className="text-start rtl:text-start">
                    <h4 className="mb-2 text-lg font-bold text-gray-800 dark:text-white">
                      {t("Create New Guardian")}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("Enter new guardian details")}
                    </p>
                  </div>

                  <form onSubmit={handleGuardianCreate} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* الاسم بالعربي */}
                      <div className="md:col-span-2">
                        <InputLabel
                          value={t("Guardian Name (Arabic)") + " *"}
                          className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                          value={guardianCreateForm.data.name}
                          onChange={(e) =>
                            guardianCreateForm.setData("name", e.target.value)
                          }
                          className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                          required
                        />
                        <InputError message={guardianCreateForm.errors.name} />
                      </div>

                      {/* الاسم بالإنجليزي */}
                      <div className="md:col-span-2">
                        <InputLabel
                          value={t("Guardian Name (English)")}
                          className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                          value={guardianCreateForm.data.name_en}
                          onChange={(e) =>
                            guardianCreateForm.setData(
                              "name_en",
                              e.target.value
                            )
                          }
                          className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                        />
                      </div>

                      {/* الرقم المدني */}
                      <div>
                        <InputLabel
                          value={t("Civil ID") + " *"}
                          className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                          value={guardianCreateForm.data.national_id}
                          onChange={(e) =>
                            guardianCreateForm.setData(
                              "national_id",
                              e.target.value
                            )
                          }
                          className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                          required
                        />
                        <InputError
                          message={guardianCreateForm.errors.national_id}
                        />
                      </div>

                      {/* رقم الهاتف */}
                      <div>
                        <InputLabel
                          value={t("Phone Number") + " *"}
                          className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                          value={guardianCreateForm.data.phone}
                          onChange={(e) =>
                            guardianCreateForm.setData("phone", e.target.value)
                          }
                          className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                          required
                          placeholder="+966XXXXXXXXX"
                        />
                        <InputError message={guardianCreateForm.errors.phone} />
                      </div>

                      {/* البريد الإلكتروني */}
                      <div className="md:col-span-2">
                        <InputLabel
                          value={t("Email")}
                          className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                          type="email"
                          value={guardianCreateForm.data.email}
                          onChange={(e) =>
                            guardianCreateForm.setData("email", e.target.value)
                          }
                          className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                          placeholder="example@email.com"
                        />
                      </div>

                      {/* العنوان */}
                      <div className="md:col-span-2">
                        <InputLabel
                          value={t("Address")}
                          className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                          value={guardianCreateForm.data.address}
                          onChange={(e) =>
                            guardianCreateForm.setData(
                              "address",
                              e.target.value
                            )
                          }
                          className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                        />
                      </div>

                      {/* رقم المنزل */}
                      <div>
                        <InputLabel
                          value={t("Home Number")}
                          className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                        />
                        <TextInput
                          value={guardianCreateForm.data.home_number}
                          onChange={(e) =>
                            guardianCreateForm.setData(
                              "home_number",
                              e.target.value
                            )
                          }
                          className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                        />
                      </div>

                      {/* صورة ولي الأمر */}
                      <div className="md:col-span-2">
                        <InputLabel value={t("Guardian Photo")} />
                        <div className="relative flex flex-col items-center justify-center gap-4 p-6 transition-colors border-2 border-gray-300 border-dashed cursor-pointer dark:border-gray-600 rounded-[25px] hover:border-[#0e7490] dark:hover:border-cyan-400">
                          {guardianCreateForm.data.image ||
                            guardianImagePreview ? (
                            <div className="flex items-center w-full gap-4">
                              <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
                                <img
                                  src={
                                    guardianImagePreview ||
                                    (guardianCreateForm.data.image
                                      ? URL.createObjectURL(
                                        guardianCreateForm.data.image
                                      )
                                      : "")
                                  }
                                  className="object-cover w-full h-full"
                                  alt={t("Guardian Photo")}
                                />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {guardianCreateForm.data.image?.name ||
                                    t("Guardian Photo")}
                                </p>
                                <button
                                  type="button"
                                  onClick={removeGuardianImage}
                                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                >
                                  {t("Remove")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-3xl text-gray-400">📷</div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t("Click to upload guardian photo")}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  PNG, JPG {t("up to 5MB")}
                                </p>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleGuardianImageChange}
                              />
                            </>
                          )}
                        </div>
                        <InputError message={guardianCreateForm.errors.image} />
                      </div>
                    </div>

                    <div className="flex justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-[25px] transition-all"
                      >
                        {t("Back")}
                      </button>
                      <button
                        type="submit"
                        disabled={guardianCreateForm.processing}
                        className="px-8 py-3 bg-[#0e7490] text-white font-bold rounded-[35px] hover:bg-[#155e75] transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                      >
                        {guardianCreateForm.processing
                          ? t("Saving...")
                          : t("Create Guardian")}
                      </button>
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
                    <div className="p-6 mb-6 border border-cyan-100 bg-cyan-50 dark:bg-cyan-900/10 dark:border-cyan-800 rounded-[25px]">
                      <h4 className="mb-4 text-lg font-bold text-[#0e7490] dark:text-cyan-400">
                        {t("Guardian Information")}
                      </h4>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <InputLabel
                            value={t("Guardian Name")}
                            className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                          />
                          <TextInput
                            value={studentForm.data.guardian.name}
                            onChange={(e) =>
                              studentForm.setData("guardian", {
                                ...studentForm.data.guardian,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                          />
                          <InputError
                            message={
                              studentForm.errors["guardian.name"] as string
                            }
                          />
                        </div>

                        <div>
                          <InputLabel
                            value={t("Guardian Phone")}
                            className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                          />
                          <TextInput
                            value={studentForm.data.guardian.phone}
                            onChange={(e) =>
                              studentForm.setData("guardian", {
                                ...studentForm.data.guardian,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <InputLabel
                            value={t("Civil ID")}
                            className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                          />
                          <TextInput
                            value={studentForm.data.guardian.national_id}
                            onChange={(e) =>
                              studentForm.setData("guardian", {
                                ...studentForm.data.guardian,
                                national_id: e.target.value,
                              })
                            }
                            className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <h4 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
                    {t("Student Information")}
                  </h4>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <InputLabel
                        value={t("Student Name (Arabic)") + " *"}
                        className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                      />
                      <TextInput
                        value={studentForm.data.full_name}
                        onChange={(e) =>
                          studentForm.setData("full_name", e.target.value)
                        }
                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                        required
                      />
                      <InputError message={studentForm.errors.full_name} />
                    </div>

                    <div>
                      <InputLabel
                        value={t("Student Name (English)") + " *"}
                        className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                      />
                      <TextInput
                        value={studentForm.data.full_name_en}
                        onChange={(e) =>
                          studentForm.setData("full_name_en", e.target.value)
                        }
                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent text-left"
                        dir="ltr"
                        required
                      />
                      <InputError message={studentForm.errors.full_name_en} />
                    </div>

                    <div>
                      <InputLabel
                        value={t("Civil ID") + " *"}
                        className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                      />
                      <TextInput
                        value={studentForm.data.national_id}
                        onChange={(e) =>
                          studentForm.setData("national_id", e.target.value)
                        }
                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                        required
                      />
                      <InputError message={studentForm.errors.national_id} />
                    </div>

                    <div>
                      <InputLabel
                        value={t("Gender") + " *"}
                        className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                      />
                      <select
                        value={studentForm.data.gender}
                        onChange={(e) =>
                          studentForm.setData("gender", e.target.value)
                        }
                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                      >
                        <option value="male">{t("Male")}</option>
                        <option value="female">{t("Female")}</option>
                      </select>
                      <InputError message={studentForm.errors.gender} />
                    </div>

                    <div>
                      <InputLabel
                        value={t("Class") + " *"}
                        className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                      />
                      <select
                        value={studentForm.data.classroom_id}
                        onChange={(e) =>
                          studentForm.setData("classroom_id", e.target.value)
                        }
                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                        required
                      >
                        <option value="">{t("Select Class")}</option>
                        {classrooms.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <InputError message={studentForm.errors.classroom_id} />
                    </div>

                    {/* Forth Route Selection */}
                    <div>
                      <InputLabel
                        value={t("Forth Route") + " (" + t("Optional") + ")"}
                        className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                      />
                      <select
                        value={studentForm.data.forth_route_id}
                        onChange={(e) =>
                          studentForm.setData("forth_route_id", e.target.value)
                        }
                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                      >
                        <option value="">{t("Select a route...")}</option>
                        {routes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <InputError message={studentForm.errors.forth_route_id} />
                    </div>

                    {/* Back Route Selection */}
                    <div>
                      <InputLabel
                        value={t("Back Route") + " (" + t("Optional") + ")"}
                        className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                      />
                      <select
                        value={studentForm.data.back_route_id}
                        onChange={(e) =>
                          studentForm.setData("back_route_id", e.target.value)
                        }
                        className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                      >
                        <option value="">{t("Select a route...")}</option>
                        {routes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <InputError message={studentForm.errors.back_route_id} />
                    </div>

                    {busGroups.length > 0 && (
                      <div>
                        <InputLabel
                          value={
                            t("Morning Bus Group") + " (" + t("Optional") + ")"
                          }
                          className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                        />
                        <select
                          value={studentForm.data.morning_group_id}
                          onChange={(e) =>
                            studentForm.setData(
                              "morning_group_id",
                              e.target.value
                            )
                          }
                          className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                        >
                          <option value="">{t("Select a group...")}</option>
                          {busGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                        <InputError
                          message={
                            studentForm.errors.morning_group_id as string
                          }
                        />
                      </div>
                    )}

                    {/* Afternoon Group Selection */}
                    {busGroups.length > 0 && (
                      <div>
                        <InputLabel
                          value={
                            t("Afternoon Bus Group") +
                            " (" +
                            t("Optional") +
                            ")"
                          }
                          className="mb-2 font-bold text-gray-700 dark:text-gray-300"
                        />
                        <select
                          value={studentForm.data.afternoon_group_id}
                          onChange={(e) =>
                            studentForm.setData(
                              "afternoon_group_id",
                              e.target.value
                            )
                          }
                          className="w-full px-6 py-4 border border-gray-200 dark:border-gray-600 rounded-[35px] bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                        >
                          <option value="">{t("Select a group...")}</option>
                          {busGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                        <InputError
                          message={
                            studentForm.errors.afternoon_group_id as string
                          }
                        />
                      </div>
                    )}

                    {/* صورة الطالب */}
                    <div className="md:col-span-2">
                      <InputLabel value={t("Student Photo")} />
                      <div className="relative flex flex-col items-center justify-center gap-4 p-6 transition-colors border-2 border-gray-300 border-dashed cursor-pointer dark:border-gray-600 rounded-[25px] hover:border-[#0e7490] dark:hover:border-cyan-400">
                        {studentForm.data.image || studentImagePreview ? (
                          <div className="flex items-center w-full gap-4">
                            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
                              <img
                                src={
                                  studentImagePreview ||
                                  (studentForm.data.image
                                    ? URL.createObjectURL(
                                      studentForm.data.image
                                    )
                                    : "")
                                }
                                className="object-cover w-full h-full"
                                alt={t("Student Photo")}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {studentForm.data.image?.name ||
                                  t("Student Photo")}
                              </p>
                              <button
                                type="button"
                                onClick={removeStudentImage}
                                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              >
                                {t("Remove")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-3xl text-gray-400">👤</div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("Click to upload student photo")}
                              </p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                PNG, JPG {t("up to 5MB")}
                              </p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleStudentImageChange}
                            />
                          </>
                        )}
                      </div>
                      <InputError message={studentForm.errors.image} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-[25px] transition-all"
                      >
                        {t("Back")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-6 py-3 font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-[25px] transition-all border border-gray-200 dark:border-gray-600"
                    >
                      {t("Cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={studentForm.processing}
                      className="px-8 py-3 bg-[#0e7490] text-white font-bold rounded-[35px] hover:bg-[#155e75] transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {isEditing ? t("Save Changes") : t("Enroll Student")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl rounded-[30px]">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t("Confirm Deletion")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t("Are you sure you want to delete this student?")}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-3 font-bold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-[25px] transition-all"
              >
                {t("Cancel")}
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 font-bold text-white bg-red-600 hover:bg-red-700 rounded-[25px] shadow-lg hover:shadow-xl transition-all"
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
