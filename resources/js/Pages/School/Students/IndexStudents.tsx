import React, { useState, useCallback, useEffect, useMemo } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router, usePage, Link } from "@inertiajs/react";
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
import Dropdown from "@/Components/Dropdown";
import Toggle from "@/Components/Toggle";
import BaseDataTable, { type FilterTab, type PaginationMeta } from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, CheckCircle2, UserX, UserPlus, Printer, Edit2, Trash2, Search, Loader2, 
  UserCheck, ClipboardCheck, HelpCircle, ArrowRight, Camera, ShieldCheck, 
  Bus as BusIcon, GraduationCap, Plus, Eye, MoreVertical, Mail, Phone, MapPin,
  Fingerprint, X
} from "lucide-react";
import {
  DS_card, DS_pageWrapper, DS_pageTitle, DS_statLabel, DS_statValue,
  DS_avatar, DS_tableWrapper, DS_tableBase, DS_tableHead, DS_tableRow, DS_tableTd,
  DS_searchInput, DS_btnGold, DS_btnSecondary, DS_btnEdit, DS_btnDanger,
  DS_inputCls, DS_selectCls, DS_labelCls, DS_cancelBtn, DS_confirmModal,
  DS_statCard, DS_statIcon, DS_badge, DS_filterBtn, DS_tableTh,
  DS_modalHeader, DS_sectionHeader, DS_submitBtn,
  DS_modalContainer, DS_modalHeaderTitle, DS_modalHeaderAccent, DS_modalClose, DS_modalBody,
  DS_statValue2,
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
  pivot?: { relationship_type?: string };
}

interface GuardianEntry {
  national_id: string;
  name: string;
  name_en: string;
  phone: string;
  email: string;
  address: string;
  home_number: string;
  relationship_type: string;
  guardian_id: string;
  verified: boolean;
  hasSearched: boolean;
  isSearching: boolean;
}

const RELATIONSHIP_TYPES = ['father', 'mother', 'uncle', 'aunt', 'grandparent', 'sibling', 'other'] as const;

const emptyGuardianEntry = (): GuardianEntry => ({
  national_id: '', name: '', name_en: '', phone: '', email: '', address: '', home_number: '',
  relationship_type: 'father', guardian_id: '', verified: false, hasSearched: false, isSearching: false,
});

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
  students: {
    data: Student[];
    links: PaginationMeta["links"];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  counts: { all: number; active: number; inactive: number };
  filters: { search?: string; status?: string };
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
  counts,
  filters,
  classrooms,
  buses = [],
  storage_url,
}: Props) {
  const { t, isRtl } = useTranslation();
  const [search, setSearch] = useState(filters.search || "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [editingGuardianIndex, setEditingGuardianIndex] = useState<number>(-1);

  // Creation Step State
  const [studentImagePreview, setStudentImagePreview] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState<1 | 2>(1);

  // Multi-guardian state
  const [guardianEntries, setGuardianEntries] = useState<GuardianEntry[]>([emptyGuardianEntry()]);

  // Form
  const studentForm = useForm({
    first_name_ar: "", second_name_ar: "", third_name_ar: "", last_name_ar: "",
    first_name_en: "", second_name_en: "", third_name_en: "", last_name_en: "",
    national_id: "", gender: "male", classroom_id: "",
    forth_bus_id: "", back_bus_id: "", image: null as File | null,
    is_active: true,
  });

  const resetForms = () => {
    studentForm.reset();
    studentForm.clearErrors();
    setStudentImagePreview(null);
    setCreateStep(1);
    setGuardianEntries([emptyGuardianEntry()]);
  };

  const openAdd = () => {
    setModalMode("create");
    setCreateStep(1);
    setGuardianEntries([emptyGuardianEntry()]);
    studentForm.reset();
    setStudentImagePreview(null);
    setIsModalOpen(true);
  };

  const openView = (s: Student) => {
    setCurrentStudent(s);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openEdit = (student: Student) => {
    setModalMode("edit");
    setCurrentStudent(student);
    resetForms();

    // Populate guardian entries from student's guardians
    const entries: GuardianEntry[] = (student.guardians || []).map(g => ({
      national_id: g.national_id || '',
      name: g.name || '',
      name_en: g.name_en || '',
      phone: g.phone || '',
      email: g.email || '',
      address: g.address || '',
      home_number: g.home_number || '',
      relationship_type: g.pivot?.relationship_type || 'father',
      guardian_id: g.id.toString(),
      verified: true,
      hasSearched: true,
      isSearching: false,
    }));
    if (entries.length === 0) entries.push(emptyGuardianEntry());
    setGuardianEntries(entries);

    studentForm.setData({
      first_name_ar: student.first_name_ar || '',
      second_name_ar: student.second_name_ar || '',
      third_name_ar: student.third_name_ar || '',
      last_name_ar: student.last_name_ar || '',
      first_name_en: student.first_name_en || '',
      second_name_en: student.second_name_en || '',
      third_name_en: student.third_name_en || '',
      last_name_en: student.last_name_en || '',
      national_id: student.national_id || '',
      gender: student.gender || 'male',
      classroom_id: student.current_enrollment?.classroom?.id?.toString() || '',
      forth_bus_id: student.forth_bus_id?.toString() || '',
      back_bus_id: student.back_bus_id?.toString() || '',
      is_active: student.is_active,
    });

    setStudentImagePreview(student.image ? getImageUrl(student.image, "student") : null);
    setCreateStep(2); // Default to student info for edit mode
    setEditingGuardianIndex(-1);
    setIsModalOpen(true);
  };

  const handleEditGuardian = (index: number) => {
    if (currentStudent) {
      openEdit(currentStudent);
      setCreateStep(1);
      setEditingGuardianIndex(index);
    }
  };

  const handleAddGuardian = () => {
    if (currentStudent) {
      openEdit(currentStudent);
      setCreateStep(1);
      const newEntry = emptyGuardianEntry();
      setGuardianEntries(prev => [...prev, newEntry]); 
      setEditingGuardianIndex(guardianEntries.length);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    studentForm.reset();
    setCreateStep(1);
    setGuardianEntries([emptyGuardianEntry()]);
    setStudentImagePreview(null);
  };

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

  // Helper to update a single guardian entry
  const updateGuardianEntry = (index: number, data: Partial<GuardianEntry>) => {
    setGuardianEntries(prev => prev.map((g, i) => i === index ? { ...g, ...data } : g));
  };

  const addGuardianEntry = () => {
    setGuardianEntries(prev => [...prev, emptyGuardianEntry()]);
  };

  const removeGuardianEntry = (index: number) => {
    if (guardianEntries.length <= 1) return;
    setGuardianEntries(prev => prev.filter((_, i) => i !== index));
  };

  // Guardian Verification (per entry)
  const handleGuardianLookup = (index: number) => {
    const entry = guardianEntries[index];
    if (!entry.national_id || entry.national_id.length < 5) return;
    updateGuardianEntry(index, { isSearching: true });
    router.post(route('school.guardians.search'), { national_id: entry.national_id }, {
      preserveScroll: true,
      onSuccess: (page: any) => {
        const res = page.props.guardianResult;
        if (res?.found && res.guardian) {
          toast.success(t('Existing guardian found'));
          updateGuardianEntry(index, {
            name: res.guardian.name || '', name_en: res.guardian.name_en || '',
            phone: res.guardian.phone || '', email: res.guardian.email || '',
            address: res.guardian.address || '', home_number: res.guardian.home_number || '',
            guardian_id: res.guardian.id.toString(), verified: true, hasSearched: true, isSearching: false,
          });
        } else {
          toast.info(t('Guardian not found. Please enter details.'));
          updateGuardianEntry(index, { verified: false, guardian_id: '', hasSearched: true, isSearching: false });
        }
      },
      onError: () => updateGuardianEntry(index, { isSearching: false }),
    });
  };

  // Step 1 submit: ensure all guardians are verified or create new ones, then go to step 2
  const handleGuardiansSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check all entries have searched
    const allReady = guardianEntries.every(g => g.hasSearched);
    if (!allReady) { toast.error(t('Please verify all guardian Civil IDs')); return; }

    // For entries without guardian_id (new guardians), we need to create them
    const unregistered = guardianEntries.filter(g => !g.guardian_id);
    if (unregistered.length === 0) {
      if (modalMode === "edit") {
        handleSubmitStudent(e);
      } else {
        setCreateStep(2);
      }
      return;
    }

    // Create unregistered guardians sequentially
    for (const entry of guardianEntries) {
      if (entry.guardian_id) continue;
      const idx = guardianEntries.indexOf(entry);
      try {
        await new Promise<void>((resolve, reject) => {
          router.post(route('school.guardians.store'), {
            name: entry.name, name_en: entry.name_en, national_id: entry.national_id,
            phone: entry.phone, email: entry.email, address: entry.address, home_number: entry.home_number,
          }, {
            preserveScroll: true,
            onSuccess: (page: any) => {
              const res = page.props.guardianResult;
              if (res?.found && res.guardian) {
                updateGuardianEntry(idx, { guardian_id: res.guardian.id.toString(), verified: true });
              }
              resolve();
            },
            onError: () => reject(),
          });
        });
      } catch { return; }
    }
    if (modalMode === "edit") {
      handleSubmitStudent(e);
    } else {
      setCreateStep(2);
    }
  };

  // --- Search Debounce ---
  const debouncedSearch = useCallback(
    debounce((val: string) => {
      router.get(
        route("school.students.index"),
        { search: val, status: filters.status === "all" ? undefined : filters.status },
        { preserveState: true, preserveScroll: true }
      );
    }, 300),
    [filters.status]
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (key: string) => {
    router.get(
      route("school.students.index"),
      { search: filters.search, status: key === "all" ? undefined : key },
      { preserveState: true, replace: true }
    );
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

    // Prepare data
    const data = {
      ...studentForm.data,
      guardians: guardianEntries.map(g => ({
        guardian_id: g.guardian_id,
        name: g.name,
        name_en: g.name_en,
        phone: g.phone,
        email: g.email,
        address: g.address,
        home_number: g.home_number,
        national_id: g.national_id,
        relationship_type: g.relationship_type,
      })),
    };

    if (modalMode === "edit" && currentStudent) {
      // Update
      router.post(
        route("school.students.update_post", currentStudent.id),
        data,
        {
          preserveScroll: true,
          onSuccess: closeModal,
          forceFormData: true,
        }
      );
    } else {
      // Create
      router.post(route("school.students.store"), data, {
        preserveScroll: true,
        onSuccess: closeModal,
      });
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
    if (students.data.length > 0) {
      console.log("Storage URL:", currentStorageUrl);
      console.log("First student image path:", students.data[0].image);
      console.log(
        "First student image full URL:",
        getImageUrl(students.data[0].image, "student")
      );

      if (students.data[0].guardians && students.data[0].guardians.length > 0) {
        console.log("First guardian image path:", students.data[0].guardians[0].image);
        console.log(
          "First guardian image full URL:",
          getImageUrl(students.data[0].guardians[0].image, "guardian")
        );
      }
    }
  }, [students, currentStorageUrl]);

  // --- Column Definitions ---
  const columnHelper = createColumnHelper<Student>();

  const columns = useMemo(() => [
    columnHelper.accessor("full_name", {
      header: t("Student Name"),
      cell: (info) => {
        const student = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className={DS_avatar}>
              {student.image ? <img src={getImageUrl(student.image, "student")} alt={student.full_name} className="w-full h-full object-cover" onError={(e) => handleImageError(e, "student")} /> : student.full_name.charAt(0)}
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <p className="font-semibold text-[#0f2044] dark:text-white text-sm">
                {!isRtl && student.full_name_en ? student.full_name_en : student.full_name}
              </p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("national_id", {
      header: t("Civil ID"),
      cell: (info) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{info.getValue() || "—"}</span>,
    }),
    columnHelper.accessor("gender", {
      header: t("Gender"),
      cell: (info) => {
        const val = info.getValue();
        return val === "male" ? (
          <span className="font-bold text-[#0f2044] dark:text-[#7ba7e8] text-xs">♂ {t("Male")}</span>
        ) : val === "female" ? (
          <span className="font-bold text-[#f5b800]/80 dark:text-[#f5b800] text-xs">♀ {t("Female")}</span>
        ) : "—";
      },
    }),
    columnHelper.display({
      id: "classroom",
      header: t("Class"),
      cell: (info) => <span className="text-gray-700 dark:text-gray-300 text-xs">{info.row.original.current_enrollment?.classroom?.name || "—"}</span>,
    }),
    columnHelper.display({
      id: "forth_bus",
      header: t("Morning Group"),
      cell: (info) => <span className="text-gray-700 dark:text-gray-300 text-xs">{info.row.original.forth_bus?.route?.name || "—"}</span>,
    }),
    columnHelper.display({
      id: "back_bus",
      header: t("Afternoon Group"),
      cell: (info) => <span className="text-gray-700 dark:text-gray-300 text-xs">{info.row.original.back_bus?.route?.name || "—"}</span>,
    }),
    columnHelper.display({
      id: "guardian_name",
      header: t("Guardian Name"),
      cell: (info) => {
        const student = info.row.original;
        const primaryG = student.guardians?.[0];
        if (!primaryG) return "—";
        const name = !isRtl && primaryG.name_en ? primaryG.name_en : primaryG.name;
        const rel = primaryG.pivot?.relationship_type ? ` (${t(primaryG.pivot.relationship_type.charAt(0).toUpperCase() + primaryG.pivot.relationship_type.slice(1))})` : '';
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-[#0f2044] dark:text-gray-200 text-xs">{name}</span>
            <span className="text-[10px] text-gray-400 font-bold">{rel}</span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "guardian_phone",
      header: t("Guardian Phone"),
      cell: (info) => {
        const primaryG = info.row.original.guardians?.[0];
        return <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{primaryG?.phone || "—"}</span>;
      },
    }),
    columnHelper.accessor("is_active", {
      header: t("Status"),
      cell: (info) => <span className={DS_badge(info.getValue())}>{info.getValue() ? t("Active") : t("Inactive")}</span>,
    }),
    columnHelper.display({
      id: "actions",
      header: t("Actions"),
      cell: (info) => {
        const student = info.row.original;
        return (
          <div className={`flex items-center gap-2 ${isRtl ? 'justify-start' : 'justify-end'}`}>
            <button onClick={() => openView(student)} className={DS_btnEdit} title={t("View Record")}>
              <Eye size={14} />
            </button>
            <button
              onClick={() => {
                toast.info(isRtl ? "جاري تحضير البطاقة للطباعة..." : "Preparing ID card for print...");
                const url = route("school.students.print", student.id);
                window.open(url, "PrintStudentCard", "width=1000,height=800,scrollbars=yes,status=yes,resizable=yes");
              }}
              className="p-2 bg-gray-100 dark:bg-[#0f2044] text-gray-600 dark:text-gray-300 rounded-lg hover:bg-[#0f2044] hover:text-[#f5b800] transition-all shadow-sm"
              title={t("Print")}
            >
              <Printer size={16} />
            </button>
          </div>
        );
      },
    }),
  ], [isRtl]);

  // --- Filter Tabs ---
  const filterTabs: FilterTab[] = [
    { key: "all", label: t("All"), count: counts.all },
    { key: "active", label: t("Active"), count: counts.active, dotColor: "bg-emerald-400" },
    { key: "inactive", label: t("Inactive"), count: counts.inactive, dotColor: "bg-rose-400" },
  ];

  // --- Pagination ---
  const pagination: PaginationMeta = {
    links: students.links,
    current_page: students.current_page,
    last_page: students.last_page,
    per_page: students.per_page,
    total: students.total,
    from: students.from,
    to: students.to,
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
              {students.data.map((s, i) => (
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
            <p>{t("Total Students")}: {students.data.length}</p>
            <p>{t("Principal Signature")}: ............................</p>
          </div>
        </div>
      </div>

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex flex-col">
            <h1 className={DS_pageTitle}>
              {t("Students Management")}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-[#f5b800] rounded-full" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {students.total} {t("Total Students")}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={DS_statCard('blue')}>
            <div className={DS_statIcon('blue')}><Users size={20} /></div>
            <div>
              <p className={DS_statLabel}>{t("Total Students")}</p>
              <p className={DS_statValue2('blue')}>{counts.all}</p>
            </div>
          </div>
          <div className={DS_statCard('green')}>
            <div className={DS_statIcon('green')}><CheckCircle2 size={20} /></div>
            <div>
              <p className={DS_statLabel}>{t("Active")}</p>
              <p className={DS_statValue2('green')}>{counts.active}</p>
            </div>
          </div>
          <div className={DS_statCard('red')}>
            <div className={DS_statIcon('red')}><UserX size={20} /></div>
            <div>
              <p className={DS_statLabel}>{t("Inactive")}</p>
              <p className={DS_statValue2('red')}>{counts.inactive}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 mb-4">
          <button onClick={openAdd} className={DS_btnGold}>
            <UserPlus className="w-4 h-4" />
            <span>{t("Enroll New Student")}</span>
          </button>
        </div>

        {/* Main DataTable */}
        <div className={DS_card}>
          <BaseDataTable<Student>
            columns={columns}
            data={students.data}
            pagination={pagination}
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder={t("Search by Name, ID...")}
            filterTabs={filterTabs}
            activeFilter={filters.status}
            onFilterChange={handleFilterChange}
            headerAction={
              <button onClick={handlePrint} className={DS_btnSecondary}>
                <Printer size={16} />
                <span>{t("Print")}</span>
              </button>
            }
          />
        </div>
      </div>

      {/* Unified Student Modal */}
      <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
        {/* Modal Header */}
        <div className={DS_modalHeader(isRtl)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <h3 className="text-xl font-bold text-white">
                {modalMode === "view" ? currentStudent?.full_name : (modalMode === "edit" ? t("Edit Student") : t("Enroll New Student"))}
              </h3>
              {modalMode === "view" && <p className="text-[#7ba7e8] text-sm font-semibold">{currentStudent?.national_id}</p>}
              {(modalMode === "create" || modalMode === "edit") && (
                <p className="text-[#7ba7e8] text-xs font-bold uppercase tracking-wider">
                  {createStep === 1 ? t("Guardian Information") : t("Student Information")}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {modalMode === "view" && (
              <Dropdown>
                <Dropdown.Trigger>
                  <button className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </Dropdown.Trigger>
                <Dropdown.Content align={isRtl ? "left" : "right"} width="32" contentClasses="py-2 bg-white dark:bg-[#1a2845] shadow-2xl rounded-[16px] border border-gray-100 dark:border-[#243460]">
                  <button onClick={() => currentStudent && openEdit(currentStudent)} className="w-full px-4 py-2.5 text-sm font-bold text-[#0f2044] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-start flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-blue-500" />
                    {t("Edit")}
                  </button>
                  <button 
                    onClick={() => { 
                      if (currentStudent) {
                        setStudentToDelete(currentStudent); 
                        setShowDeleteModal(true); 
                      }
                    }} 
                    className="w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-start flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("Delete")}
                  </button>
                </Dropdown.Content>
              </Dropdown>
            )}
            <button onClick={closeModal} className={DS_modalClose}><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Modal Body */}
        <div className={`p-8 ${modalMode === "view" ? "space-y-8" : "space-y-4"} overflow-y-auto max-h-[80vh]`}>
          {modalMode === "view" ? (
            /* View Mode Body */
            <>
              {/* Profile Card */}
              <div className="flex items-center gap-6 p-6 rounded-[22px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="w-24 h-24 rounded-[22px] border-4 border-white dark:border-[#243460] overflow-hidden shadow-lg">
                  <img src={getImageUrl(currentStudent?.image, "student")} className="w-full h-full object-cover" alt={currentStudent?.full_name} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-[#0f2044] dark:text-white mb-1">
                    {!isRtl && currentStudent?.full_name_en ? currentStudent?.full_name_en : currentStudent?.full_name}
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className={DS_badge(currentStudent?.is_active || false)}>{currentStudent?.is_active ? t("Active") : t("Inactive")}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{currentStudent?.gender === 'male' ? t("Male") : t("Female")}</span>
                  </div>
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600"><Fingerprint className="w-6 h-6" /></div>
                  <div><p className={DS_labelCls}>{t("Civil ID")}</p><p className="font-bold text-[#0f2044] dark:text-white">{currentStudent?.national_id}</p></div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-[14px] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600"><GraduationCap className="w-6 h-6" /></div>
                  <div><p className={DS_labelCls}>{t("Class")}</p><p className="font-bold text-[#0f2044] dark:text-white">{currentStudent?.current_enrollment?.classroom?.name || "—"}</p></div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-[14px] bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600"><BusIcon className="w-6 h-6" /></div>
                  <div><p className={DS_labelCls}>{t("Morning Route")}</p><p className="font-bold text-[#0f2044] dark:text-white">{currentStudent?.forth_bus?.route?.name || "—"}</p></div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-[18px] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-12 h-12 rounded-[14px] bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600"><BusIcon className="w-6 h-6" /></div>
                  <div><p className={DS_labelCls}>{t("Afternoon Route")}</p><p className="font-bold text-[#0f2044] dark:text-white">{currentStudent?.back_bus?.route?.name || "—"}</p></div>
                </div>
              </div>

              {/* Guardians */}
              <div>
                  <h4 className="font-bold text-[#0f2044] dark:text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#f5b800]" /> {t("Guardians")}
                    </div>
                    <button 
                      onClick={handleAddGuardian}
                      className="p-1.5 rounded-lg bg-[#f5b800]/10 text-[#7a5c00] hover:bg-[#f5b800]/20 transition-all flex items-center gap-1 text-[10px] font-bold"
                      title={t("Add Guardian")}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t("Add")}</span>
                    </button>
                  </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {currentStudent?.guardians?.map((g, idx) => (
                    <div key={g.id} className="p-4 rounded-[18px] bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all relative group">
                      <button 
                        onClick={() => handleEditGuardian(idx)} 
                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title={t("Edit Guardian")}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center gap-4 mb-3">
                        <div className={DS_avatar}>{g.image ? <img src={getImageUrl(g.image, "guardian")} alt={g.name} className="w-full h-full object-cover" /> : g.name.charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[#0f2044] dark:text-white truncate">{!isRtl && g.name_en ? g.name_en : g.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t(g.pivot?.relationship_type || "Guardian")}</p>
                        </div>
                      </div>
                      <div className="space-y-2 pt-3 border-t border-gray-50 dark:border-white/5">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><Phone className="w-3 h-3" /> <span dir="ltr">{g.phone}</span></div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><Mail className="w-3 h-3" /> <span className="truncate">{g.email || "—"}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Edit / Create Mode Body */
            <div className="space-y-6">
              {/* Step Indicator (Only for Create or when explicitly editing guardians) */}
              {(modalMode === "create" || (modalMode === "edit" && createStep === 1)) && (
                <div className="flex items-center justify-center gap-4 mb-6">
                  {[1, 2].map(s => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center font-bold transition-all ${createStep === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : (createStep > s ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400')}`}>
                        {createStep > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                      </div>
                      <span className={`text-xs font-bold ${createStep === s ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                        {s === 1 ? t("Guardian") : t("Student")}
                      </span>
                      {s === 1 && <div className={`w-8 h-px ${createStep > 1 ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'}`} />}
                    </div>
                  ))}
                </div>
              )}

              {createStep === 1 ? (
                /* Guardian Form */
                <form onSubmit={handleGuardiansSubmit} className="space-y-6">
                  {/* Reuse Existing Guardian Form Logic but styled */}
                  <div className="space-y-6">
                    {guardianEntries.map((entry, idx) => {
                      // In edit mode, if we are editing a specific guardian, hide others
                      if (modalMode === "edit" && editingGuardianIndex !== -1 && idx !== editingGuardianIndex) return null;
                      
                      return (
                        <div key={idx} className="p-6 rounded-[22px] bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 relative">
                          {guardianEntries.length > 1 && modalMode === "create" && (
                            <button type="button" onClick={() => removeGuardianEntry(idx)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <h5 className="font-bold text-sm text-[#0f2044] dark:text-white mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> {t("Guardian")} {modalMode === "create" ? `#${idx + 1}` : ""}
                          </h5>
                          
                          <div className="mb-4">
                            <label className={DS_labelCls}>{t("Civil ID")} *</label>
                            <div className="flex gap-2">
                              <input type="text" value={entry.national_id} onChange={e => updateGuardianEntry(idx, { national_id: e.target.value, hasSearched: false, verified: false })} className={DS_inputCls} placeholder="10xxxxxxxx" />
                              <button type="button" onClick={() => handleGuardianLookup(idx)} disabled={entry.isSearching} className="px-4 py-2 bg-[#0f2044] text-white rounded-[14px] font-bold text-xs hover:bg-[#1a2e5a] transition-all disabled:opacity-50">
                                {entry.isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : t("Verify")}
                              </button>
                            </div>
                          </div>

                          {(entry.hasSearched || modalMode === "edit") && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div><label className={DS_labelCls}>{t("Name (Arabic)")} *</label><input type="text" value={entry.name} onChange={e => updateGuardianEntry(idx, { name: e.target.value })} className={DS_inputCls} dir="rtl" required /></div>
                              <div><label className={DS_labelCls}>{t("Name (English)")}</label><input type="text" value={entry.name_en} onChange={e => updateGuardianEntry(idx, { name_en: e.target.value })} className={DS_inputCls} dir="ltr" /></div>
                              <div><label className={DS_labelCls}>{t("Relationship")} *</label>
                                <select value={entry.relationship_type} onChange={e => updateGuardianEntry(idx, { relationship_type: e.target.value })} className={DS_selectCls}>
                                  {RELATIONSHIP_TYPES.map(r => <option key={r} value={r}>{t(r.charAt(0).toUpperCase() + r.slice(1))}</option>)}
                                </select>
                              </div>
                              <div><label className={DS_labelCls}>{t("Phone")} *</label><input type="text" value={entry.phone} onChange={e => updateGuardianEntry(idx, { phone: e.target.value })} className={DS_inputCls} dir="ltr" required /></div>
                              <div><label className={DS_labelCls}>{t("Email")}</label><input type="email" value={entry.email} onChange={e => updateGuardianEntry(idx, { email: e.target.value })} className={DS_inputCls} dir="ltr" /></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {modalMode === "create" && (
                      <button type="button" onClick={addGuardianEntry} className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[22px] text-gray-400 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" /> {t("Add Another Guardian")}
                      </button>
                    )}
                  </div>
                  <div className={`flex ${modalMode === "edit" ? "justify-end" : "justify-end"} pt-4`}>
                    <button type="submit" disabled={studentForm.processing} className={DS_submitBtn(studentForm.processing)}>
                      {modalMode === "edit" ? t("Save Changes") : t("Continue")} {modalMode === "create" && <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />}
                    </button>
                  </div>
                </form>
              ) : (
                /* Student Form */
                <form onSubmit={handleSubmitStudent} className="space-y-6">
                   <div className="p-6 rounded-[22px] bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-6">
                      <div>
                        <label className={DS_labelCls}>{t("Gender")} *</label>
                        <div className="flex gap-2">
                          {['male', 'female'].map(g => (
                            <button key={g} type="button" onClick={() => studentForm.setData("gender", g)} className={`flex-1 py-2.5 rounded-xl font-bold text-xs border-2 transition-all ${studentForm.data.gender === g ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/5'}`}>
                              {g === 'male' ? t("Male") : t("Female")}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-2">
                           {["first", "second", "third", "last"].map(p => (
                             <div key={p}><label className="text-[10px] font-bold text-gray-400 mb-1 block">{t(`${p} Name`)} (Ar)</label>
                             <input type="text" value={(studentForm.data as any)[`${p}_name_ar`]} onChange={e => studentForm.setData(`${p}_name_ar` as any, e.target.value)} className={DS_inputCls} dir="rtl" required /></div>
                           ))}
                        </div>
                        <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
                           {["first", "second", "third", "last"].map(p => (
                             <div key={p}><label className="text-[10px] font-bold text-gray-400 mb-1 block">{t(`${p} Name`)} (En)</label>
                             <input type="text" value={(studentForm.data as any)[`${p}_name_en`]} onChange={e => studentForm.setData(`${p}_name_en` as any, e.target.value)} className={`${DS_inputCls} text-left`} dir="ltr" /></div>
                           ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className={DS_labelCls}>{t("Civil ID")} *</label><input type="text" value={studentForm.data.national_id} onChange={e => studentForm.setData("national_id", e.target.value)} className={DS_inputCls} dir="ltr" required /></div>
                        <div><label className={DS_labelCls}>{t("Class")} *</label>
                          <select value={studentForm.data.classroom_id} onChange={e => studentForm.setData("classroom_id", e.target.value)} className={DS_selectCls} required>
                            <option value="">{t("Select Class")}</option>
                            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className={DS_labelCls}>{t("Morning Route")}</label>
                          <select value={studentForm.data.forth_bus_id} onChange={e => studentForm.setData("forth_bus_id", e.target.value)} className={DS_selectCls}>
                            <option value="">{t("None")}</option>
                            {buses.map(b => <option key={b.id} value={b.id}>{b.bus_number} - {b.plate_number}</option>)}
                          </select>
                        </div>
                        <div><label className={DS_labelCls}>{t("Afternoon Route")}</label>
                          <select value={studentForm.data.back_bus_id} onChange={e => studentForm.setData("back_bus_id", e.target.value)} className={DS_selectCls}>
                            <option value="">{t("None")}</option>
                            {buses.map(b => <option key={b.id} value={b.id}>{b.bus_number} - {b.plate_number}</option>)}
                          </select>
                        </div>
                      </div>

                      <Toggle 
                        label={t("Status")}
                        description={studentForm.data.is_active ? t("Active Student") : t("Suspended Student")}
                        enabled={studentForm.data.is_active}
                        onChange={v => studentForm.setData("is_active", v)}
                      />
                   </div>

                   <div className={`flex ${modalMode === "create" ? "justify-between" : "justify-end"} pt-4`}>
                      {modalMode === "create" && (
                        <button type="button" onClick={() => setCreateStep(1)} className={DS_cancelBtn}>{t("Back")}</button>
                      )}
                      <button type="submit" disabled={studentForm.processing} className={DS_submitBtn(studentForm.processing)}>
                        {modalMode === "edit" ? t("Save Changes") : t("Enroll Student")}
                      </button>
                   </div>
                </form>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
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
