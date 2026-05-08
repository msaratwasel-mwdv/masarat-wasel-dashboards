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
import PrintReportHeader from "@/Components/PrintReportHeader";
import { motion } from "framer-motion";
import { Users, CheckCircle2, UserX, UserPlus, Printer } from "lucide-react";
import {
  DS_card, DS_pageWrapper, DS_pageTitle, DS_statLabel, DS_statValue,
  DS_avatar, DS_tableWrapper, DS_tableBase, DS_tableHead, DS_tableRow, DS_tableTd,
  DS_searchInput, DS_btnGold, DS_btnSecondary, DS_btnEdit, DS_btnDanger,
  DS_inputCls, DS_labelCls, DS_cancelBtn, DS_confirmModal,
  DS_statCard, DS_statIcon, DS_badge, DS_filterBtn, DS_tableTh,
  DS_modalHeader, DS_sectionHeader, DS_submitBtn,
  DS_modalContainer, DS_modalHeaderTitle, DS_modalHeaderAccent, DS_modalClose, DS_modalBody,
} from "@/lib/DS";

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

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
}

interface Student {
  id: number;
  first_name_ar: string;
  second_name_ar?: string;
  third_name_ar?: string;
  last_name_ar?: string;
  first_name_en?: string;
  second_name_en?: string;
  third_name_en?: string;
  last_name_en?: string;
  full_name: string;
  full_name_en?: string;
  national_id?: string;
  gender?: string;
  image?: string;
  is_active: boolean;
  guardians?: Guardian[];
  guardian_id?: number;
  forth_bus_id?: number | null;
  back_bus_id?: number | null;
  forth_bus?: { route?: { name?: string } } | null;
  back_bus?: { route?: { name?: string } } | null;
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
  buses?: Bus[];
  storage_url: string;
}

// ─── Print CSS ───────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area { position: absolute; inset: 0; width: 100%; padding: 20px; background: white; }
}
`;

export default function IndexStudents({
  auth,
  students,
  filters,
  classrooms,
  buses = [],
  storage_url,
}: Props) {
  const { t, isRtl } = useTranslation();
  const [search, setSearch] = useState(filters.search || "");
  const [activeFilter, setActiveFilter] = useState("all");
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
    first_name_ar: "",
    second_name_ar: "",
    third_name_ar: "",
    last_name_ar: "",
    first_name_en: "",
    second_name_en: "",
    third_name_en: "",
    last_name_en: "",
    national_id: "",
    gender: "male",
    classroom_id: "",
    guardian_id: "",
    forth_bus_id: "",
    back_bus_id: "",
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
    const currentGuardian = student.guardians && student.guardians.length > 0 ? student.guardians[0] : null;

    studentForm.setData({
      first_name_ar: student.first_name_ar || "",
      second_name_ar: student.second_name_ar || "",
      third_name_ar: student.third_name_ar || "",
      last_name_ar: student.last_name_ar || "",
      first_name_en: student.first_name_en || "",
      second_name_en: student.second_name_en || "",
      third_name_en: student.third_name_en || "",
      last_name_en: student.last_name_en || "",
      national_id: student.national_id || "",
      gender: student.gender || "male",
      classroom_id: student.current_enrollment?.classroom?.id?.toString() || "",
      guardian_id: currentGuardian?.id?.toString() || "",
      forth_bus_id: student.forth_bus_id?.toString() || "",
      back_bus_id: student.back_bus_id?.toString() || "",
      image: null,
      is_active: student.is_active,
      guardian: {
        name: currentGuardian?.name || "",
        name_en: currentGuardian?.name_en || "",
        national_id: currentGuardian?.national_id || "",
        phone: currentGuardian?.phone || "",
        address: currentGuardian?.address || "",
        home_number: currentGuardian?.home_number || "",
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

      if (students[0].guardians && students[0].guardians.length > 0) {
        console.log("First guardian image path:", students[0].guardians[0].image);
        console.log(
          "First guardian image full URL:",
          getImageUrl(students[0].guardians[0].image, "guardian")
        );
      }
    }
  }, [students, currentStorageUrl]);

  // Filter
  const filteredStudents = React.useMemo(() => {
    let filtered = students;
    if (activeFilter === "active") filtered = students.filter(s => s.is_active);
    if (activeFilter === "inactive") filtered = students.filter(s => !s.is_active);
    return filtered;
  }, [students, activeFilter]);

  // Counts
  const counts = {
    all: students.length,
    active: students.filter(s => s.is_active).length,
    inactive: students.filter(s => !s.is_active).length,
  };

  // Print
  const handlePrint = () => window.print();

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={
        <h2 className={DS_pageTitle}>
          {t("Students Management")}
        </h2>
      }
    >
      <Head title={t("Students")} />
      <style>{PRINT_STYLES}</style>

      {/* Print Area */}
      <div id="print-area" className="hidden print:block bg-white font-sans text-black w-full" dir="rtl">
        <PrintReportHeader 
          title={t("Students Report")}
          schoolName={auth.user?.school?.name || t("School name not available")}
          schoolLogo={auth.user?.school?.logo || null}
          printDate={`${t("Print Date")}: ${new Date().toLocaleDateString("ar-SA", { year: 'numeric', month: 'long', day: 'numeric' })}`}
          schoolAdminText={t("School Admin")}
        />

        {/* Print Table */}
        <div className="px-4">
          <table className="w-full border-collapse border border-gray-300 text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-1.5 text-right font-bold w-8 text-black">#</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{t("Student Name")}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{t("Civil ID")}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{t("Gender")}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{t("Class")}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{t("Guardian Name")}</th>
                <th className="border border-gray-300 p-1.5 text-right font-bold text-black">{t("Guardian Phone")}</th>
                <th className="border border-gray-300 p-1.5 text-center font-bold text-black">{t("Status")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, i) => (
                <tr key={s.id} className="border-b border-gray-300">
                  <td className="border border-gray-300 p-1.5 text-center text-gray-700 font-semibold">{i + 1}</td>
                  <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{s.full_name}</td>
                  <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{s.national_id || "-"}</td>
                  <td className="border border-gray-300 p-1.5 text-gray-700">{s.gender === "male" ? t("Male") : s.gender === "female" ? t("Female") : "-"}</td>
                  <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{s.current_enrollment?.classroom?.name || "-"}</td>
                  <td className="border border-gray-300 p-1.5 font-mono text-gray-700">{(s.guardians && s.guardians.length > 0) ? s.guardians[0].name : "-"}</td>
                  <td className="border border-gray-300 p-1.5 font-mono text-gray-700" dir="ltr">{(s.guardians && s.guardians.length > 0) ? s.guardians[0].phone : "-"}</td>
                  <td className="border border-gray-300 p-1.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.is_active ? "bg-gray-100 text-black border border-gray-400" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                      {s.is_active ? t("Active") : t("Inactive")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{t("Total Students")}: {filteredStudents.length}</p>
            <p>{t("Principal Signature")}: ............................</p>
          </div>
        </div>
      </div>

      <div className={DS_pageWrapper}>
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: t("Total Students"), val: counts.all,     icon: <Users className="w-5 h-5" />,        accent: "navy" as const },
            { label: t("Active"),         val: counts.active,  icon: <CheckCircle2 className="w-5 h-5" />, accent: "gold" as const },
            { label: t("Inactive"),       val: counts.inactive, icon: <UserX className="w-5 h-5" />,       accent: "red"  as const },
          ].map((s) => (
            <div key={s.label} className={`${DS_statCard(s.accent)} ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className={DS_statIcon(s.accent)}>{s.icon}</div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <p className={DS_statLabel}>{s.label}</p>
                <p className={DS_statValue}>{s.val}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Table Card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={DS_card}>
          {/* Toolbar */}
          <div className={DS_sectionHeader(isRtl)}>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder={t("Search by Name, ID...")}
                className={DS_searchInput}
                dir={isRtl ? "rtl" : "ltr"}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[["all", t("All")], ["active", t("Active")], ["inactive", t("Inactive")]].map(([key, lbl]) => (
                <button key={key} onClick={() => setActiveFilter(key)} className={DS_filterBtn(activeFilter === key)}>{lbl}</button>
              ))}
            </div>
            <button onClick={handlePrint} className={DS_btnSecondary}>
              <Printer className="w-4 h-4" />
              {t("Print")}
            </button>
            <button onClick={openAddModal} className={DS_btnGold}>
              <UserPlus className="w-4 h-4" />
              {t("Enroll New Student")}
            </button>
          </div>

          {/* Table */}
          <div className={DS_tableWrapper}>
            <table className={DS_tableBase}>
              <thead className={DS_tableHead}>
                <tr>
                  {[
                    t("Student Name"),
                    t("Civil ID"),
                    t("Gender"),
                    t("Class"),
                    t("Morning Group"),
                    t("Afternoon Group"),
                    t("Guardian Name"),
                    t("Guardian Phone"),
                    t("Status"),
                    t("Actions"),
                  ].map(h => (
                    <th key={h} className={DS_tableTh(isRtl)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan={10} className="py-16 text-center text-gray-400"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-bold">{t("No students found")}</p></td></tr>
                ) : filteredStudents.map(student => (
                  <tr key={student.id} className={DS_tableRow}>
                    <td className={DS_tableTd}>
                      <div className="flex items-center gap-3">
                        <div className={DS_avatar}>
                          {student.image ? <img src={getImageUrl(student.image, "student")} alt={student.full_name} className="w-full h-full object-cover" onError={(e) => handleImageError(e, "student")} /> : student.full_name.charAt(0)}
                        </div>
                        <div className={isRtl ? "text-right" : "text-left"}>
                          <p className="font-semibold text-[#0f2044] dark:text-white">
                            {!isRtl && student.full_name_en ? student.full_name_en : student.full_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`${DS_tableTd} font-mono text-xs text-gray-500 dark:text-gray-400`}>{student.national_id || "-"}</td>
                    <td className={`${DS_tableTd} text-xs`}>
                      {student.gender === "male" ? (
                        <span className="font-bold text-[#0f2044] dark:text-[#7ba7e8]">♂ {t("Male")}</span>
                      ) : student.gender === "female" ? (
                        <span className="font-bold text-[#f5b800]/80 dark:text-[#f5b800]">♀ {t("Female")}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className={`${DS_tableTd} text-gray-700 dark:text-gray-300 text-xs`}>{student.current_enrollment?.classroom?.name || "-"}</td>
                    <td className={`${DS_tableTd} text-gray-700 dark:text-gray-300 text-xs`}>{student.forth_bus?.route?.name || "-"}</td>
                    <td className={`${DS_tableTd} text-gray-700 dark:text-gray-300 text-xs`}>{student.back_bus?.route?.name || "-"}</td>
                    <td className={`${DS_tableTd} font-semibold text-[#0f2044] dark:text-gray-200 text-xs`}>{(student.guardians && student.guardians.length > 0) ? (!isRtl && student.guardians[0].name_en ? student.guardians[0].name_en : student.guardians[0].name) : "-"}</td>
                    <td className={`${DS_tableTd} font-mono text-xs text-gray-500 dark:text-gray-400`}>{(student.guardians && student.guardians.length > 0) ? student.guardians[0].phone : "-"}</td>
                    <td className={DS_tableTd}>
                      <span className={DS_badge(student.is_active)}>
                        {student.is_active ? t("Active") : t("Inactive")}
                      </span>
                    </td>
                    <td className={DS_tableTd}>
                      <div className={`flex gap-2 ${isRtl ? "justify-start" : "justify-end"}`}>
                        <button onClick={() => openEditModal(student)} className={DS_btnEdit}>{t("Edit")}</button>
                        <button onClick={() => { setStudentToDelete(student); setShowDeleteModal(true); }} className={DS_btnDanger}>{t("Delete")}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Main Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-[#1a2845] rounded-[22px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0f2044] p-6 text-white">
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
                          placeholder="+968XXXXXXXXX"
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
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("Student Name (Arabic)")} *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {["first", "second", "third", "last"].map((part) => {
                          const fieldName = `${part}_name_ar` as keyof typeof studentForm.data;
                          return (
                            <div key={fieldName}>
                              <input
                                value={studentForm.data[fieldName] as string}
                                onChange={(e) => studentForm.setData(fieldName, e.target.value)}
                                className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4"
                                required
                                placeholder={t(`${part} Name`)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t("Student Name (English)")} *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {["first", "second", "third", "last"].map((part) => {
                          const fieldName = `${part}_name_en` as keyof typeof studentForm.data;
                          return (
                            <div key={fieldName}>
                              <input
                                value={studentForm.data[fieldName] as string}
                                onChange={(e) => studentForm.setData(fieldName, e.target.value)}
                                className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4 text-left"
                                dir="ltr"
                                required
                                placeholder={t(`${part} Name`)}
                              />
                            </div>
                          );
                        })}
                      </div>
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

                    {/* Bus Selection */}
                    {buses.length > 0 && (
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("Morning Bus Assignment")} ({t("Optional")})
                          </label>
                          <select
                            value={studentForm.data.forth_bus_id}
                            onChange={(e) =>
                              studentForm.setData("forth_bus_id", e.target.value)
                            }
                            className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4"
                          >
                            <option value="">{t("No bus assigned")}</option>
                            {buses.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.bus_number} - {b.plate_number}
                              </option>
                            ))}
                          </select>
                          <InputError message={studentForm.errors.forth_bus_id as string} />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t("Afternoon Bus Assignment")} ({t("Optional")})
                          </label>
                          <select
                            value={studentForm.data.back_bus_id}
                            onChange={(e) =>
                              studentForm.setData("back_bus_id", e.target.value)
                            }
                            className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4"
                          >
                            <option value="">{t("No bus assigned")}</option>
                            {buses.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.bus_number} - {b.plate_number}
                              </option>
                            ))}
                          </select>
                          <InputError message={studentForm.errors.back_bus_id as string} />
                        </div>
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
                      className={DS_cancelBtn}
                    >
                      {t("Back")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    className={DS_cancelBtn}
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={studentForm.processing}
                    className={DS_submitBtn(studentForm.processing)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={DS_confirmModal}>
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-[#0f2044] dark:text-white mb-2">
              {t("Confirm Deletion")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {t("Are you sure you want to delete this student?")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`flex-1 py-3 ${DS_cancelBtn}`}
              >
                {t("Cancel")}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-[14px] bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow"
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
