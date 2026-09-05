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
import StudentAnalyticsOverview from "@/Components/StudentAnalyticsOverview";
import Dropdown from "@/Components/Dropdown";
import Toggle from "@/Components/Toggle";
import SearchableSelect from "@/Components/SearchableSelect";
import BaseDataTable, { type FilterTab, type PaginationMeta } from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle2, UserX, UserPlus, Printer, Edit2, Trash2, Search, Loader2,
  UserCheck, ClipboardCheck, HelpCircle, ArrowRight, Camera, ShieldCheck,
  Bus as BusIcon, GraduationCap, Plus, Eye, MoreVertical, Mail, Phone, MapPin,
  Fingerprint, X, Download, Upload
} from "lucide-react";
import {
  DS_card, DS_pageWrapper, DS_pageTitle, DS_statLabel, DS_statValue,
  DS_avatar, DS_tableWrapper, DS_tableBase, DS_tableHead, DS_tableRow, DS_tableTd,
  DS_searchInput, DS_btnGold, DS_btnSuccess, DS_btnSecondary, DS_btnEdit, DS_btnDanger,
  DS_inputCls, DS_selectCls, DS_labelCls, DS_cancelBtn, DS_confirmModal,
  DS_statCard, DS_statIcon, DS_badge, DS_filterBtn, DS_tableTh,
  DS_modalHeader, DS_sectionHeader, DS_submitBtn,
  DS_modalContainer, DS_modalHeaderTitle, DS_modalHeaderAccent, DS_modalClose, DS_modalBody,
  DS_statValue2, DS_gridCols,
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
  first_name_ar?: string;
  last_name_ar?: string;
  first_name_en?: string;
  last_name_en?: string;
  pivot?: { relationship_type?: string };
}

interface GuardianEntry {
  national_id: string;
  first_name_ar: string;
  last_name_ar: string;
  first_name_en: string;
  last_name_en: string;
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
  image?: File | null;
  imagePreview?: string | null;
}

const RELATIONSHIP_TYPES = ['father', 'mother', 'uncle', 'aunt', 'grandparent', 'sibling', 'other'] as const;

const emptyGuardianEntry = (): GuardianEntry => ({
  national_id: '',
  first_name_ar: '',
  last_name_ar: '',
  first_name_en: '',
  last_name_en: '',
  name: '',
  name_en: '',
  phone: '',
  email: '',
  address: '',
  home_number: '',
  relationship_type: 'father',
  guardian_id: '',
  verified: false,
  hasSearched: false,
  isSearching: false,
  image: null,
  imagePreview: null
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
  forth_bus?: { route?: { name?: string }, bus_number?: string } | null;
  back_bus?: { route?: { name?: string }, bus_number?: string } | null;
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
  all_students?: Student[];
  counts: {
    all: number;
    active: number;
    inactive: number;
    male: number;
    female: number;
    with_bus: number;
    no_bus: number;
  };
  filters: { search?: string; status?: string };
  classrooms: Classroom[];
  buses?: Bus[];
  guardians?: any[];
  storage_url: string;
}

// ─── Print CSS ───────────────────────────────────────────────────
const PRINT_STYLES = `
@media print {
  @page {
    size: A4 landscape;
    margin: 12mm 12mm 12mm 12mm;
  }
  body * { visibility: hidden !important; }
  main { margin: 0 !important; position: static !important; }
  #print-area, #print-area * { visibility: visible !important; }
  #print-area {
    position: absolute;
    inset: 0;
    width: 100%;
    padding: 0px;
    background: white !important;
    color: black !important;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  }
  table {
    border-collapse: collapse !important;
    width: 100% !important;
    margin-top: 10px !important;
    border: 1px solid #cbd5e1 !important;
  }
  th {
    background-color: #f8fafc !important;
    color: #000000 !important;
    font-weight: bold !important;
    border: 1px solid #cbd5e1 !important;
    font-size: 11px !important;
    padding: 8px 6px !important;
  }
  td {
    border: 1px solid #cbd5e1 !important;
    font-size: 10px !important;
    padding: 6px 8px !important;
    color: #0f172a !important;
  }
  tr {
    page-break-inside: avoid !important;
  }
  tr:nth-child(even) {
    background-color: #f8fafc !important;
  }
}
`;

// Helper functions for dynamic name translations with fallbacks
const getStudentDisplayName = (student: any, isRtl: boolean): string => {
  const nameAr = student.full_name || "";
  const nameEn = student.full_name_en || "";
  const code = student.student_code || "";

  const cleanAr = (nameAr.trim() && nameAr !== code) ? nameAr : "";
  const cleanEn = (nameEn.trim() && nameEn !== code) ? nameEn : "";

  if (isRtl) {
    return cleanAr || cleanEn || "—";
  } else {
    return cleanEn || cleanAr || "—";
  }
};

const getGuardianDisplayName = (guardian: any, isRtl: boolean): string => {
  if (!guardian) return "—";
  const nameAr = guardian.name || "";
  const nameEn = guardian.name_en || "";

  if (isRtl) {
    return nameAr.trim() ? nameAr : (nameEn.trim() ? nameEn : "—");
  } else {
    return nameEn.trim() ? nameEn : (nameAr.trim() ? nameAr : "—");
  }
};

export default function IndexStudents({
  auth,
  students,
  all_students = [],
  counts,
  filters,
  classrooms,
  buses = [],
  guardians = [],
  storage_url,
}: Props) {
  const { t, isRtl } = useTranslation();
  const [search, setSearch] = useState(filters.search || "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { data: importData, setData: setImportData, post: postImport, reset: resetImport, errors: importErrors } = useForm<{ file: File | null }>({ file: null });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "create">("view");
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  // Form states & Smart Guardian states
  const [studentImagePreview, setStudentImagePreview] = useState<string | null>(null);
  const [selectedGuardianId, setSelectedGuardianId] = useState<string | number>("");
  const [showNewGuardianForm, setShowNewGuardianForm] = useState(false);
  const [guardianEntries, setGuardianEntries] = useState<GuardianEntry[]>([emptyGuardianEntry()]);

  // Form
  const studentForm = useForm({
    first_name_ar: "", second_name_ar: "", third_name_ar: "", last_name_ar: "",
    first_name_en: "", second_name_en: "", third_name_en: "", last_name_en: "",
    national_id: "", gender: "male", classroom_id: "",
    forth_bus_id: "", back_bus_id: "", image: null as File | null,
    is_active: true,
  });

  const updatePrimaryGuardian = (data: Partial<GuardianEntry>) => {
    setGuardianEntries(prev => {
      const current = prev[0] || emptyGuardianEntry();
      return [{ ...current, ...data }];
    });
  };

  const handleSelectParent = (id: string | number) => {
    if (!id) {
      setSelectedGuardianId("");
      updatePrimaryGuardian(emptyGuardianEntry());
      return;
    }

    const selected = (guardians || []).find(g => g.id.toString() === id.toString());
    if (selected) {
      setSelectedGuardianId(id);
      updatePrimaryGuardian({
        guardian_id: selected.id.toString(),
        national_id: selected.national_id || '',
        first_name_ar: selected.first_name_ar || selected.name || '',
        last_name_ar: selected.last_name_ar || '',
        first_name_en: selected.first_name_en || selected.name_en || '',
        last_name_en: selected.last_name_en || '',
        name: selected.name || '',
        name_en: selected.name_en || '',
        phone: selected.phone || '',
        email: selected.email || '',
        address: selected.address || '',
        verified: true,
        hasSearched: true,
        isSearching: false,
      });
      setShowNewGuardianForm(false);
    }
  };

  const parentOptions = useMemo(() => {
    return (guardians || []).map(g => ({
      id: g.id,
      label: `${g.first_name_ar || ''} ${g.last_name_ar || ''} (${g.first_name_en || ''} ${g.last_name_en || ''})`.trim(),
      subLabel: `${t('Civil ID')}: ${g.national_id} | ${t('Phone')}: ${g.phone}`,
    }));
  }, [guardians, t]);

  // Dynamic full-name resolution helper for preview
  const getPreviewFullName = (lang: 'ar' | 'en'): string => {
    const first = lang === 'ar' ? studentForm.data.first_name_ar : studentForm.data.first_name_en;
    const last = lang === 'ar' ? studentForm.data.last_name_ar : studentForm.data.last_name_en;
    if (!first.trim()) return last.trim();
    return `${first.trim()} ${last.trim()}`.trim();
  };

  // Smart Name Inheritance Effect
  useEffect(() => {
    const primaryGuardian = guardianEntries[0];
    if (primaryGuardian && primaryGuardian.relationship_type === 'father') {
      let inheritedAr = "";
      let inheritedEn = "";

      if (selectedGuardianId) {
        const selected = (guardians || []).find(g => g.id.toString() === selectedGuardianId.toString());
        if (selected) {
          inheritedAr = `${selected.first_name_ar || selected.name || ""} ${selected.last_name_ar || ""}`.trim();
          inheritedEn = `${selected.first_name_en || selected.name_en || ""} ${selected.last_name_en || ""}`.trim();
        }
      } else if (showNewGuardianForm) {
        inheritedAr = `${primaryGuardian.first_name_ar || primaryGuardian.name || ""} ${primaryGuardian.last_name_ar || ""}`.trim();
        inheritedEn = `${primaryGuardian.first_name_en || primaryGuardian.name_en || ""} ${primaryGuardian.last_name_en || ""}`.trim();
      }

      if (inheritedAr !== studentForm.data.last_name_ar || inheritedEn !== studentForm.data.last_name_en) {
        studentForm.setData(prev => ({
          ...prev,
          last_name_ar: inheritedAr,
          last_name_en: inheritedEn,
        }));
      }
    }
  }, [selectedGuardianId, guardianEntries[0]?.relationship_type, guardianEntries[0]?.first_name_ar, guardianEntries[0]?.last_name_ar, guardianEntries[0]?.first_name_en, guardianEntries[0]?.last_name_en, showNewGuardianForm, guardians]);

  // Track modifications in edit mode
  const isStudentModified = useMemo(() => {
    if (modalMode !== "edit" || !currentStudent) return true;

    const sf = studentForm.data;
    const cs = currentStudent;

    if ((sf.first_name_ar || "") !== (cs.first_name_ar || "")) return true;
    if ((sf.second_name_ar || "") !== (cs.second_name_ar || "")) return true;
    if ((sf.third_name_ar || "") !== (cs.third_name_ar || "")) return true;
    if ((sf.last_name_ar || "") !== (cs.last_name_ar || "")) return true;
    if ((sf.first_name_en || "") !== (cs.first_name_en || "")) return true;
    if ((sf.second_name_en || "") !== (cs.second_name_en || "")) return true;
    if ((sf.third_name_en || "") !== (cs.third_name_en || "")) return true;
    if ((sf.last_name_en || "") !== (cs.last_name_en || "")) return true;
    if ((sf.national_id || "") !== (cs.national_id || "")) return true;
    if ((sf.gender || "male") !== (cs.gender || "male")) return true;
    if ((sf.classroom_id?.toString() || "") !== (cs.current_enrollment?.classroom?.id?.toString() || "")) return true;
    if ((sf.forth_bus_id?.toString() || "") !== (cs.forth_bus_id?.toString() || "")) return true;
    if ((sf.back_bus_id?.toString() || "") !== (cs.back_bus_id?.toString() || "")) return true;
    if (Boolean(sf.is_active) !== Boolean(cs.is_active)) return true;
    if (sf.image !== null) return true;

    const initialGuardianId = cs.guardians?.[0]?.id?.toString() || "";
    if (selectedGuardianId.toString() !== initialGuardianId) return true;
    if (showNewGuardianForm) return true;

    const primaryG = guardianEntries[0];
    const initialG = cs.guardians?.[0];
    if (primaryG && initialG) {
      if ((primaryG.relationship_type || "father") !== (initialG.pivot?.relationship_type || "father")) return true;
    }

    return false;
  }, [modalMode, currentStudent, studentForm.data, selectedGuardianId, showNewGuardianForm, guardianEntries]);

  const resetForms = () => {
    studentForm.reset();
    studentForm.clearErrors();
    setStudentImagePreview(null);
    setGuardianEntries([emptyGuardianEntry()]);
    setSelectedGuardianId("");
    setShowNewGuardianForm(false);
  };

  const openAdd = () => {
    setModalMode("create");
    resetForms();
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
      first_name_ar: g.first_name_ar || g.name || '',
      last_name_ar: g.last_name_ar || '',
      first_name_en: g.first_name_en || g.name_en || '',
      last_name_en: g.last_name_en || '',
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
      imagePreview: g.image ? getImageUrl(g.image, "guardian") : null,
    }));
    if (entries.length === 0) entries.push(emptyGuardianEntry());
    setGuardianEntries(entries);

    // Set search and expansion states for edit
    if (entries[0] && entries[0].guardian_id) {
      setSelectedGuardianId(entries[0].guardian_id);
      setShowNewGuardianForm(false);
    } else {
      setSelectedGuardianId("");
      setShowNewGuardianForm(false);
    }

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
    setIsModalOpen(true);
  };

  const handleEditGuardian = (index: number) => {
    if (currentStudent) {
      openEdit(currentStudent);
    }
  };

  const handleAddGuardian = () => {
    if (currentStudent) {
      openEdit(currentStudent);
      setShowNewGuardianForm(true);
      setSelectedGuardianId("");
      updatePrimaryGuardian(emptyGuardianEntry());
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForms();
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

  const handleGuardianImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateGuardianEntry(index, { image: file, imagePreview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardian Verification (per entry)
  const handleGuardianLookup = (index: number, term?: string) => {
    const entry = guardianEntries[index];
    const searchId = term || entry.national_id;
    if (!searchId || searchId.length < 5) return;
    updateGuardianEntry(index, { isSearching: true, national_id: searchId });
    router.post(route('school.guardians.search'), { national_id: searchId }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: (page: any) => {
        const res = page.props.guardianResult;
        if (res?.found && res.guardian) {
          toast.success(isRtl ? 'تم العثور على ولي أمر مسجل مسبقاً' : t('Existing guardian found'));
          updateGuardianEntry(index, {
            first_name_ar: res.guardian.first_name_ar || res.guardian.name || '',
            last_name_ar: res.guardian.last_name_ar || '',
            first_name_en: res.guardian.first_name_en || res.guardian.name_en || '',
            last_name_en: res.guardian.last_name_en || '',
            name: res.guardian.name || '', name_en: res.guardian.name_en || '',
            phone: res.guardian.phone || '', email: res.guardian.email || '',
            address: res.guardian.address || '', home_number: res.guardian.home_number || '',
            guardian_id: res.guardian.id.toString(), verified: true, hasSearched: true, isSearching: false,
            imagePreview: res.guardian.image ? getImageUrl(res.guardian.image, "guardian") : null
          });
        } else {
          toast.info(isRtl ? 'لم يتم العثور على ولي الأمر، يرجى إدخال البيانات.' : t('Guardian not found. Please enter details.'));
          updateGuardianEntry(index, { verified: false, guardian_id: '', hasSearched: true, isSearching: false });
        }
      },
      onError: () => updateGuardianEntry(index, { isSearching: false }),
    });
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
    if (!studentToDelete || isDeleting) return;

    setIsDeleting(true);
    router.delete(route("school.students.destroy", studentToDelete.id), {
      preserveScroll: true,
      onSuccess: () => setShowDeleteModal(false),
      onFinish: () => setIsDeleting(false),
    });
  };

  // Export & Import Handlers
  const handleExport = () => {
    window.location.href = route('school.students.export');
  };
  const handleDownloadTemplate = () => {
    window.location.href = route('school.students.template');
  };
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsImporting(true);
    postImport(route('school.students.import'), {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: () => {
        setShowImportModal(false);
        resetImport();
      },
      onFinish: () => setIsImporting(false)
    });
  };

  // Submit Student
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Student Name validation: Arabic provided => English optional; English provided => Arabic optional
    const hasStudentAr = Boolean(studentForm.data.first_name_ar.trim() && studentForm.data.last_name_ar.trim());
    const hasStudentEn = Boolean(studentForm.data.first_name_en.trim() && studentForm.data.last_name_en.trim());

    if (!hasStudentAr && !hasStudentEn) {
      if (studentForm.data.first_name_ar.trim() && !studentForm.data.last_name_ar.trim()) {
        toast.error(isRtl ? 'يرجى إدخال اسم العائلة للطالب بالعربية' : 'Please enter student last name in Arabic');
        return;
      }
      if (!studentForm.data.first_name_ar.trim() && studentForm.data.last_name_ar.trim()) {
        toast.error(isRtl ? 'يرجى إدخال الاسم الأول للطالب بالعربية' : 'Please enter student first name in Arabic');
        return;
      }
      if (studentForm.data.first_name_en.trim() && !studentForm.data.last_name_en.trim()) {
        toast.error(isRtl ? 'يرجى إدخال اسم العائلة للطالب بالإنجليزية' : 'Please enter student last name in English');
        return;
      }
      if (!studentForm.data.first_name_en.trim() && studentForm.data.last_name_en.trim()) {
        toast.error(isRtl ? 'يرجى إدخال الاسم الأول للطالب بالإنجليزية' : 'Please enter student first name in English');
        return;
      }
      toast.error(isRtl ? 'يرجى إدخال الاسم الأول واسم العائلة للطالب (بالعربية أو بالإنجليزية على الأقل)' : 'Please enter student first and last name (in Arabic or English)');
      return;
    }

    // 2. Guardian link validation
    if (!selectedGuardianId && !showNewGuardianForm) {
      toast.error(isRtl ? 'يرجى ارتباط ولي الأمر بالطالب (اختر ولي أمر أو سجل جديد)' : 'Please link a guardian to the student (select existing or register new)');
      return;
    }

    // 3. For entries without guardian_id (new guardian inline registration), create them first
    if (showNewGuardianForm && !guardianEntries[0]?.guardian_id) {
      const entry = guardianEntries[0];
      const hasGuardianAr = Boolean(entry.first_name_ar.trim() && entry.last_name_ar.trim());
      const hasGuardianEn = Boolean(entry.first_name_en.trim() && entry.last_name_en.trim());

      if (!hasGuardianAr && !hasGuardianEn) {
        if (entry.first_name_ar.trim() && !entry.last_name_ar.trim()) {
          toast.error(isRtl ? 'يرجى إدخال اسم العائلة لولي الأمر بالعربية' : 'Please enter guardian last name in Arabic');
          return;
        }
        if (!entry.first_name_ar.trim() && entry.last_name_ar.trim()) {
          toast.error(isRtl ? 'يرجى إدخال الاسم الأول لولي الأمر بالعربية' : 'Please enter guardian first name in Arabic');
          return;
        }
        if (entry.first_name_en.trim() && !entry.last_name_en.trim()) {
          toast.error(isRtl ? 'يرجى إدخال اسم العائلة لولي الأمر بالإنجليزية' : 'Please enter guardian last name in English');
          return;
        }
        if (!entry.first_name_en.trim() && entry.last_name_en.trim()) {
          toast.error(isRtl ? 'يرجى إدخال الاسم الأول لولي الأمر بالإنجليزية' : 'Please enter guardian first name in English');
          return;
        }
        toast.error(isRtl ? 'يرجى إدخال الاسم الأول واسم العائلة لولي الأمر (بالعربية أو بالإنجليزية على الأقل)' : 'Please enter guardian first and last name (in Arabic or English)');
        return;
      }
      if (!entry.national_id.trim() || !entry.phone.trim()) {
        toast.error(isRtl ? 'يرجى إدخال الرقم المدني والجوال لولي الأمر' : 'Please enter guardian Civil ID and phone');
        return;
      }

      toast.info(isRtl ? "جاري تسجيل حساب ولي الأمر أولاً..." : "Creating guardian account first...");
      try {
        const gFirstAr = entry.first_name_ar.trim() || entry.first_name_en.trim();
        const gLastAr = entry.last_name_ar.trim() || entry.last_name_en.trim();
        const gFirstEn = entry.first_name_en.trim() || entry.first_name_ar.trim();
        const gLastEn = entry.last_name_en.trim() || entry.last_name_ar.trim();

        const gNameAr = `${gFirstAr} ${gLastAr}`.trim();
        const gNameEn = `${gFirstEn} ${gLastEn}`.trim();

        await new Promise<void>((resolve, reject) => {
          router.post(route('school.guardians.store'), {
            name: gNameAr,
            name_en: gNameEn,
            national_id: entry.national_id,
            phone: entry.phone,
            email: entry.email,
            address: entry.address,
            home_number: entry.home_number,
            relationship_type: entry.relationship_type,
            ...(entry.image && { image: entry.image })
          }, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: (page: any) => {
              const res = page.props.guardianResult;
              if (res?.found && res.guardian) {
                entry.guardian_id = res.guardian.id.toString();
                entry.verified = true;
              }
              resolve();
            },
            onError: (errors) => {
              toast.error(Object.values(errors)[0] as string);
              reject();
            },
          });
        });
      } catch {
        return; // stop execution if guardian creation fails
      }
    }

    // 4. Prepare student and guardian payload
    const finalGuardians = guardianEntries.map(g => {
      const arFirst = g.first_name_ar?.trim() || g.first_name_en?.trim() || '';
      const arLast = g.last_name_ar?.trim() || g.last_name_en?.trim() || '';
      const enFirst = g.first_name_en?.trim() || g.first_name_ar?.trim() || '';
      const enLast = g.last_name_en?.trim() || g.last_name_ar?.trim() || '';

      const nameAr = g.name || `${arFirst} ${arLast}`.trim();
      const nameEn = g.name_en || `${enFirst} ${enLast}`.trim();

      return {
        guardian_id: g.guardian_id || selectedGuardianId.toString(),
        name: nameAr || nameEn,
        name_en: nameEn || nameAr,
        phone: g.phone,
        email: g.email,
        address: g.address,
        home_number: g.home_number,
        national_id: g.national_id,
        relationship_type: g.relationship_type,
      };
    });

    const finalStudentFirstAr = studentForm.data.first_name_ar.trim() || studentForm.data.first_name_en.trim();
    const finalStudentLastAr = studentForm.data.last_name_ar.trim() || studentForm.data.last_name_en.trim();
    const finalStudentFirstEn = studentForm.data.first_name_en.trim() || studentForm.data.first_name_ar.trim();
    const finalStudentLastEn = studentForm.data.last_name_en.trim() || studentForm.data.last_name_ar.trim();

    const data = {
      first_name_ar: finalStudentFirstAr,
      last_name_ar: finalStudentLastAr,
      first_name_en: finalStudentFirstEn,
      last_name_en: finalStudentLastEn,
      national_id: studentForm.data.national_id,
      gender: studentForm.data.gender,
      classroom_id: studentForm.data.classroom_id,
      forth_bus_id: studentForm.data.forth_bus_id || null,
      back_bus_id: studentForm.data.back_bus_id || null,
      image: studentForm.data.image,
      is_active: studentForm.data.is_active,
      guardians: finalGuardians,
    };

    if (modalMode === "edit" && currentStudent) {
      router.post(
        route("school.students.update_post", currentStudent.id),
        data,
        {
          preserveScroll: true,
          onSuccess: closeModal,
          onError: (errors) => toast.error(Object.values(errors)[0] as string),
          forceFormData: true,
        }
      );
    } else {
      router.post(route("school.students.store"), data, {
        preserveScroll: true,
        onSuccess: closeModal,
        onError: (errors) => toast.error(Object.values(errors)[0] as string),
        forceFormData: true,
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
        const displayName = getStudentDisplayName(student, isRtl);
        return (
          <div className="flex items-center gap-3">
            <div className={DS_avatar}>
              {student.image ? <img src={getImageUrl(student.image, "student")} alt={displayName} className="w-full h-full object-cover" onError={(e) => handleImageError(e, "student")} /> : displayName.charAt(0)}
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <p className="font-semibold text-[#0f2044] dark:text-white text-sm whitespace-nowrap">
                {displayName}
              </p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("national_id", {
      header: t("Student Civil ID"),
      cell: (info) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{info.getValue() || "—"}</span>,
    }),
    columnHelper.accessor("gender", {
      header: t("Gender"),
      cell: (info) => {
        const val = info.getValue();
        return val === "male" ? (
          <span className="text-blue-500 font-bold text-xs whitespace-nowrap">♂ {t("Male")}</span>
        ) : val === "female" ? (
          <span className="text-pink-500 font-bold text-xs whitespace-nowrap">♀ {t("Female")}</span>
        ) : "—";
      },
    }),
    columnHelper.display({
      id: "classroom",
      header: t("Class"),
      cell: (info) => <span className="text-gray-700 dark:text-gray-300 text-xs whitespace-nowrap">{info.row.original.current_enrollment?.classroom?.name || "—"}</span>,
    }),
    columnHelper.display({
      id: "forth_bus",
      header: t("Morning Group"),
      cell: (info) => <span className="text-gray-700 dark:text-gray-300 text-xs whitespace-nowrap">{info.row.original.forth_bus?.route?.name || "—"}</span>,
    }),
    columnHelper.display({
      id: "back_bus",
      header: t("Afternoon Group"),
      cell: (info) => <span className="text-gray-700 dark:text-gray-300 text-xs whitespace-nowrap">{info.row.original.back_bus?.route?.name || "—"}</span>,
    }),
    columnHelper.display({
      id: "guardian_name",
      header: t("Guardian Name"),
      cell: (info) => {
        const student = info.row.original;
        const primaryG = student.guardians?.[0];
        if (!primaryG) return "—";
        const name = getGuardianDisplayName(primaryG, isRtl);
        const rel = primaryG.pivot?.relationship_type ? t(primaryG.pivot.relationship_type.charAt(0).toUpperCase() + primaryG.pivot.relationship_type.slice(1)) : '';
        return (
          <div className="flex items-center gap-3">
            <div className={DS_avatar}>
              {primaryG.image ? <img src={getImageUrl(primaryG.image, "guardian")} alt={name} className="w-full h-full object-cover" onError={(e) => handleImageError(e, "guardian")} /> : name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[#0f2044] dark:text-gray-200 text-xs whitespace-nowrap">{name}</span>
              <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">{rel}</span>
            </div>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "guardian_phone",
      header: t("Guardian Phone"),
      cell: (info) => {
        const primaryG = info.row.original.guardians?.[0];
        return <span className="font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{primaryG?.phone || "—"}</span>;
      },
    }),
    columnHelper.accessor("is_active", {
      header: t("Status"),
      cell: (info) => <span className={`${DS_badge(info.getValue())} whitespace-nowrap`}>{info.getValue() ? t("Active") : t("Inactive")}</span>,
    }),
    columnHelper.display({
      id: "actions",
      header: t("Actions"),
      cell: (info) => {
        const student = info.row.original;
        const isFirstTwo = info.row.index < 2;
        return (
          <div className="flex justify-center">
            <Dropdown>
              <Dropdown.Trigger>
                <button className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-150 dark:hover:bg-white/10 transition-all border border-gray-150 dark:border-white/10">
                  <MoreVertical size={16} />
                </button>
              </Dropdown.Trigger>
              <Dropdown.Content align="right" verticalAlign={isFirstTwo ? "down" : "up"} width="40" contentClasses="py-1 bg-white dark:bg-[#1a2845] border border-gray-150 dark:border-white/10 rounded-xl shadow-xl">
                <button
                  onClick={() => openView(student)}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-start"
                >
                  <Eye size={14} className="text-gray-400 dark:text-gray-500" />
                  <span>{t("View Record")}</span>
                </button>
                <button
                  onClick={() => openEdit(student)}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-start"
                >
                  <Edit2 size={14} className="text-blue-500" />
                  <span>{t("Edit")}</span>
                </button>
                <button
                  onClick={() => {
                    toast.info(isRtl ? "جاري تحضير البطاقة للطباعة..." : "Preparing ID card for print...");
                    const url = route("school.students.print", student.id);
                    window.open(url, "PrintStudentCard", "width=1000,height=800,scrollbars=yes,status=yes,resizable=yes");
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-start"
                >
                  <Printer size={14} className="text-gray-400 dark:text-gray-500" />
                  <span>{t("Print")}</span>
                </button>
                <button
                  onClick={() => {
                    setStudentToDelete(student);
                    setShowDeleteModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all text-start font-bold border-t border-gray-100 dark:border-white/5"
                >
                  <Trash2 size={14} className="text-red-500" />
                  <span>{t("Delete")}</span>
                </button>
              </Dropdown.Content>
            </Dropdown>
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

  // Conditional Name Helpers: Arabic provided => English optional, and vice versa
  const hasStudentArFilled = Boolean(studentForm.data.first_name_ar?.trim() && studentForm.data.last_name_ar?.trim());
  const hasStudentEnFilled = Boolean(studentForm.data.first_name_en?.trim() && studentForm.data.last_name_en?.trim());
  const isAnyStudentArTyped = Boolean(studentForm.data.first_name_ar?.trim() || studentForm.data.last_name_ar?.trim());
  const isAnyStudentEnTyped = Boolean(studentForm.data.first_name_en?.trim() || studentForm.data.last_name_en?.trim());

  const currentGuardian = guardianEntries[0];
  const hasGuardianArFilled = Boolean(currentGuardian?.first_name_ar?.trim() && currentGuardian?.last_name_ar?.trim());
  const hasGuardianEnFilled = Boolean(currentGuardian?.first_name_en?.trim() && currentGuardian?.last_name_en?.trim());
  const isAnyGuardianArTyped = Boolean(currentGuardian?.first_name_ar?.trim() || currentGuardian?.last_name_ar?.trim());
  const isAnyGuardianEnTyped = Boolean(currentGuardian?.first_name_en?.trim() || currentGuardian?.last_name_en?.trim());

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
      <div id="print-area" className="hidden print:block bg-white font-sans text-black w-full" dir={isRtl ? "rtl" : "ltr"}>
        <PrintReportHeader
          title={t("Students Report")}
          schoolName={auth.user?.school?.name || t("School name not available")}
          schoolLogo={auth.user?.school?.logo ? `/storage/${auth.user.school.logo}` : null}
          printDate={`${t("Print Date")}: ${new Date().toLocaleDateString(isRtl ? "ar-SA" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' })}`}
          schoolAdminText={t("School Admin")}
        />

        {/* Print Table */}
        <div className="px-4">
          <table className="w-full border-collapse border border-gray-300 text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className={`border border-gray-300 p-1.5 font-bold w-8 text-black ${isRtl ? "text-right" : "text-left"}`}>#</th>
                <th className={`border border-gray-300 p-1.5 font-bold text-black ${isRtl ? "text-right" : "text-left"}`}>{t("Student Name")}</th>
                <th className={`border border-gray-300 p-1.5 font-bold text-black ${isRtl ? "text-right" : "text-left"}`}>{t("Civil ID")}</th>
                <th className={`border border-gray-300 p-1.5 font-bold text-black ${isRtl ? "text-right" : "text-left"}`}>{t("Gender")}</th>
                <th className={`border border-gray-300 p-1.5 font-bold text-black ${isRtl ? "text-right" : "text-left"}`}>{t("Class")}</th>
                <th className={`border border-gray-300 p-1.5 font-bold text-black ${isRtl ? "text-right" : "text-left"}`}>{isRtl ? "الذهاب" : t("Morning Group")}</th>
                <th className={`border border-gray-300 p-1.5 font-bold text-black ${isRtl ? "text-right" : "text-left"}`}>{isRtl ? "العودة" : t("Afternoon Group")}</th>
                <th className={`border border-gray-300 p-1.5 font-bold text-black ${isRtl ? "text-right" : "text-left"}`}>{t("Guardian Name")}</th>
                <th className={`border border-gray-300 p-1.5 font-bold text-black ${isRtl ? "text-right" : "text-left"}`}>{t("Guardian Phone")}</th>
              </tr>
            </thead>
            <tbody>
              {all_students.map((s, i) => {
                const sName = getStudentDisplayName(s, isRtl);
                const gName = getGuardianDisplayName(s.guardians?.[0], isRtl);
                return (
                  <tr key={s.id} className="border-b border-gray-300">
                    <td className="border border-gray-300 p-1.5 text-center text-gray-700 font-semibold">{i + 1}</td>
                    <td className="border border-gray-300 p-1.5 font-bold text-gray-900">{sName}</td>
                    <td className="border border-gray-300 p-1.5 text-gray-700">{s.national_id || "-"}</td>
                    <td className="border border-gray-300 p-1.5 text-center text-gray-700">
                      {s.gender === "male" ? t("Male") : s.gender === "female" ? t("Female") : "-"}
                    </td>
                    <td className="border border-gray-300 p-1.5 text-gray-700">{s.current_enrollment?.classroom?.name || "-"}</td>
                    <td className="border border-gray-300 p-1.5 text-center text-gray-700">{s.forth_bus?.route?.name || s.forth_bus?.bus_number || "-"}</td>
                    <td className="border border-gray-300 p-1.5 text-center text-gray-700">{s.back_bus?.route?.name || s.back_bus?.bus_number || "-"}</td>
                    <td className="border border-gray-300 p-1.5 text-gray-700">{gName}</td>
                    <td className="border border-gray-300 p-1.5 text-gray-700" dir="ltr">{s.guardians?.[0]?.phone || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-8 flex justify-between items-center text-sm font-bold text-gray-800">
            <p>{t("Total Students")}: {all_students.length}</p>
            <p>{t("Principal Signature")}: ............................</p>
          </div>
        </div>
      </div>

      <div className={`${DS_pageWrapper} px-4 sm:px-6 lg:px-8 py-8`} dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Analytics Overview */}
        <StudentAnalyticsOverview stats={counts} />

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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExport}
                  className={DS_btnGold}
                  title={t("Export Excel")}
                >
                  <Download size={16} />
                  <span className="hidden sm:inline whitespace-nowrap">{t("Export")}</span>
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className={DS_btnSecondary}
                  title={t("Import Excel")}
                >
                  <Upload size={16} />
                  <span className="hidden sm:inline whitespace-nowrap">{t("Import")}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#0f2044] dark:hover:text-white transition-all shadow-sm"
                  title={t("Print")}
                >
                  <Printer size={16} />
                </button>
                <button onClick={openAdd} className={DS_btnSuccess}>
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">{t("Enroll New Student")}</span>
                </button>
              </div>
            }
          />
        </div>
      </div>

      {/* Unified Student Modal */}
      <Modal show={isModalOpen} onClose={closeModal} maxWidth="3xl">
        {/* Modal Header */}
        <div className={DS_modalHeader(isRtl)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <h3 className="text-base font-bold text-white leading-tight">
                {modalMode === "view" ? currentStudent?.full_name : (modalMode === "edit" ? t("Edit Student Profile") : t("Enroll New Student"))}
              </h3>
              {modalMode === "view" && <p className="text-[#7ba7e8] text-xs font-semibold mt-0.5">{currentStudent?.national_id}</p>}
              {(modalMode === "create" || modalMode === "edit") && (
                <p className="text-[#7ba7e8] text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  {modalMode === "edit" ? t("Update Student & Guardian details") : t("Quick Student Enrollment")}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={closeModal} className={DS_modalClose}><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Modal Body */}
        <div className={`p-4 md:p-5 ${modalMode === "view" ? "space-y-4" : "space-y-3"} overflow-y-auto max-h-[85vh] bg-white dark:bg-[#1a2845]`}>
          {modalMode === "view" ? (
            /* View Mode Body */
            <>
              {/* Profile Card */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/5 shadow-sm">
                <div className="w-16 h-16 rounded-xl border-2 border-white dark:border-[#243460] overflow-hidden shadow-md flex-shrink-0">
                  <img src={getImageUrl(currentStudent?.image, "student")} className="w-full h-full object-cover" alt={currentStudent?.full_name} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-[#0f2044] dark:text-white mb-1">
                    {!isRtl && currentStudent?.full_name_en ? currentStudent?.full_name_en : currentStudent?.full_name}
                  </h4>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className={DS_badge(currentStudent?.is_active || false)}>{currentStudent?.is_active ? t("Active") : t("Inactive")}</span>
                    <span className={`text-sm font-bold ${currentStudent?.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}`} title={currentStudent?.gender === 'male' ? t("Male") : t("Female")}>
                      {currentStudent?.gender === 'male' ? "♂" : "♀"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0"><Fingerprint className="w-4.5 h-4.5" /></div>
                  <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t("Civil ID")}</p><p className="font-bold text-xs text-[#0f2044] dark:text-white">{currentStudent?.national_id}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shrink-0"><GraduationCap className="w-4.5 h-4.5" /></div>
                  <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t("Class")}</p><p className="font-bold text-xs text-[#0f2044] dark:text-white">{currentStudent?.current_enrollment?.classroom?.name || "—"}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 shrink-0"><BusIcon className="w-4.5 h-4.5" /></div>
                  <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t("Morning Route")}</p><p className="font-bold text-xs text-[#0f2044] dark:text-white">{currentStudent?.forth_bus?.route?.name || "—"}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-150 dark:border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 shrink-0"><BusIcon className="w-4.5 h-4.5" /></div>
                  <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t("Afternoon Route")}</p><p className="font-bold text-xs text-[#0f2044] dark:text-white">{currentStudent?.back_bus?.route?.name || "—"}</p></div>
                </div>
              </div>

              {/* Guardians */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-[#0f2044] dark:text-white flex items-center justify-between pb-1.5 border-b border-gray-150 dark:border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#f5b800]" /> {t("Guardians")}
                  </div>
                  <button
                    onClick={handleAddGuardian}
                    className="p-1 rounded-lg bg-[#f5b800]/10 text-[#7a5c00] hover:bg-[#f5b800]/20 transition-all flex items-center gap-1 text-[9px] font-bold"
                    title={t("Add Guardian")}
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t("Add")}</span>
                  </button>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {currentStudent?.guardians?.map((g, idx) => (
                    <div key={g.id} className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-150 dark:border-white/5 shadow-sm hover:shadow transition-all relative group">
                      <button
                        onClick={() => handleEditGuardian(idx)}
                        className="absolute top-3 right-3 p-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        title={t("Edit Guardian")}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={DS_avatar}>{g.image ? <img src={getImageUrl(g.image, "guardian")} alt={g.name} className="w-full h-full object-cover" /> : g.name.charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[#0f2044] dark:text-white truncate">{!isRtl && g.name_en ? g.name_en : g.name}</p>
                          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{t(g.pivot?.relationship_type || "Guardian")}</p>
                        </div>
                      </div>
                      <div className="space-y-1 pt-2 border-t border-gray-50 dark:border-white/5">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400"><Phone className="w-3 h-3" /> <span dir="ltr">{g.phone}</span></div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400"><Mail className="w-3 h-3" /> <span className="truncate">{g.email || "—"}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Edit / Create Unified Modern Form */
            <form onSubmit={handleSubmitStudent} className="space-y-3.5 pb-8 max-w-2xl mx-auto">
              {/* SECTION 1: GUARDIAN LIAISON */}
              <div className="p-4 rounded-xl bg-gray-50/40 dark:bg-white/[0.02] border border-gray-150 dark:border-white/5 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-gray-150 dark:border-white/5 pb-2">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-bold text-xs text-[#0f2044] dark:text-white uppercase tracking-wider">
                    {t("Guardian Liaison")}
                  </h4>
                </div>

                {/* Guardian Selector / Search */}
                {!selectedGuardianId && !showNewGuardianForm && (
                  <div className="space-y-2.5">
                    <SearchableSelect
                      label={t("Search Guardian")}
                      placeholder={t("Select Guardian")}
                      value={selectedGuardianId}
                      onChange={handleSelectParent}
                      options={parentOptions}
                      forceBottom={true}
                      onAddNewClick={(term) => {
                          setShowNewGuardianForm(true);
                          setSelectedGuardianId("");
                          if (term && /^\d+$/.test(term)) {
                            updatePrimaryGuardian({ national_id: term });
                            handleGuardianLookup(0, term);
                          } else if (term) {
                            updatePrimaryGuardian({ first_name_ar: term, name: term });
                          } else {
                            updatePrimaryGuardian(emptyGuardianEntry());
                          }
                      }}
                      addNewLabel={t("Add New Guardian")}
                    />
                  </div>
                )}

                {/* Verified Guardian Card */}
                {selectedGuardianId && (
                  <div className="p-3 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] border border-emerald-500/20 dark:border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 transition-all duration-350">
                     <div className="flex items-center gap-2.5 min-w-0">
                       <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                         <ShieldCheck size={20} className="animate-pulse" />
                       </div>
                       <div className="min-w-0">
                         <div className="flex items-center gap-1.5 flex-wrap">
                           <span className="font-bold text-gray-800 dark:text-white text-xs truncate">
                             {guardianEntries[0]?.name || t("Verified Guardian")}
                           </span>
                           <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                             {t("Linked")}
                           </span>
                         </div>
                         <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                           {t("Phone")}: {guardianEntries[0]?.phone} | {t("Civil ID")}: {guardianEntries[0]?.national_id}
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2 shrink-0">
                       {/* Relationship Type Dropdown directly inside the card */}
                       <div className="w-24 text-right">
                         <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">{t("Relationship")}</label>
                         <select
                           value={guardianEntries[0]?.relationship_type || "father"}
                           onChange={e => updatePrimaryGuardian({ relationship_type: e.target.value })}
                           className="w-full bg-white dark:bg-[#1a2845] border border-gray-200 dark:border-white/5 rounded-lg text-xs py-1 px-1.5 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-[#f5b800]"
                         >
                           <option value="father">{t("Father")}</option>
                           <option value="mother">{t("Mother")}</option>
                           <option value="brother">{t("Brother")}</option>
                           <option value="sister">{t("Sister")}</option>
                           <option value="grandfather">{t("Grandfather")}</option>
                           <option value="grandmother">{t("Grandmother")}</option>
                           <option value="uncle_paternal">{t("Uncle (Paternal)")}</option>
                           <option value="aunt_paternal">{t("Aunt (Paternal)")}</option>
                           <option value="uncle_maternal">{t("Uncle (Maternal)")}</option>
                           <option value="aunt_maternal">{t("Aunt (Maternal)")}</option>
                           <option value="other">{t("Other")}</option>
                         </select>
                       </div>

                       <button
                         type="button"
                         onClick={() => {
                           setSelectedGuardianId("");
                           updatePrimaryGuardian(emptyGuardianEntry());
                         }}
                         className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                         title={t("Clear Selection")}
                       >
                         <X size={14} />
                       </button>
                     </div>
                   </div>
                )}

                {/* New Guardian Form (Inline Accordion Card) */}
                {showNewGuardianForm && (
                  <div className="p-3.5 bg-white dark:bg-white/5 border border-gray-150 dark:border-white/5 rounded-xl space-y-3 transition-all duration-300 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-gray-150 dark:border-white/5 pb-1.5">
                      <h5 className="text-[9px] font-black text-[#0f2044] dark:text-[#7ba7e8] uppercase tracking-[0.1em] flex items-center gap-1">
                        <UserPlus size={12} className="text-[#f5b800]" />
                        {t("Register New Guardian")}
                      </h5>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewGuardianForm(false);
                          updatePrimaryGuardian(emptyGuardianEntry());
                        }}
                        className="text-xs text-red-500 hover:text-red-600 font-bold transition-colors"
                      >
                        {t("Cancel")}
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {/* Civil ID, Phone, Relationship Row (FIRST) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="space-y-0.5 relative">
                          <label className={DS_labelCls}>{t("Civil ID")} *</label>
                          <input
                            type="text"
                            value={guardianEntries[0]?.national_id || ""}
                            onChange={e => updatePrimaryGuardian({ national_id: e.target.value.replace(/\D/g, ''), hasSearched: false })} minLength={7} maxLength={20} pattern="\d+"
                            onBlur={() => handleGuardianLookup(0)}
                            className={DS_inputCls}
                            required
                            placeholder={isRtl ? "أدخل رقم الهوية أو الإقامة..." : "Enter Civil ID / Iqama..."}
                          />
                          {guardianEntries[0]?.isSearching && (
                              <div className="absolute top-7 right-3 rtl:right-auto rtl:left-3 flex items-center">
                                  <Loader2 size={16} className="text-amber-500 animate-spin" />
                              </div>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <label className={DS_labelCls}>{t("Phone")} *</label>
                          <input
                            type="text"
                            value={guardianEntries[0]?.phone || ""}
                            onChange={e => updatePrimaryGuardian({ phone: e.target.value.replace(/\D/g, ''), })} minLength={8} maxLength={20} pattern="\d+"
                            className={DS_inputCls}
                            required
                            placeholder="05XXXXXXXX"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className={DS_labelCls}>{t("Relationship")} *</label>
                          <select
                            value={guardianEntries[0]?.relationship_type || "father"}
                            onChange={e => updatePrimaryGuardian({ relationship_type: e.target.value })}
                            className={DS_selectCls}
                            required
                          >
                            <option value="father">{t("Father")}</option>
                            <option value="mother">{t("Mother")}</option>
                            <option value="brother">{t("Brother")}</option>
                            <option value="sister">{t("Sister")}</option>
                            <option value="grandfather">{t("Grandfather")}</option>
                            <option value="grandmother">{t("Grandmother")}</option>
                            <option value="uncle_paternal">{t("Uncle (Paternal)")}</option>
                            <option value="aunt_paternal">{t("Aunt (Paternal)")}</option>
                            <option value="uncle_maternal">{t("Uncle (Maternal)")}</option>
                            <option value="aunt_maternal">{t("Aunt (Maternal)")}</option>
                            <option value="other">{t("Other")}</option>
                          </select>
                        </div>
                      </div>

                      {/* Name Fields Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="space-y-0.5">
                          <label className={DS_labelCls}>
                            {isRtl ? "الاسم الأول (عربي)" : "First Name (Arabic)"}
                            {!hasGuardianEnFilled && " *"}
                          </label>
                          <input
                            type="text"
                            value={guardianEntries[0]?.first_name_ar || ""}
                            onChange={e => {
                              const f_ar = e.target.value;
                              const l_ar = guardianEntries[0]?.last_name_ar || "";
                              updatePrimaryGuardian({
                                first_name_ar: f_ar,
                                name: `${f_ar} ${l_ar}`.trim()
                              });
                            }}
                            className={DS_inputCls}
                            required={!isAnyGuardianEnTyped}
                            dir="rtl"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className={DS_labelCls}>
                            {isRtl ? "اسم العائلة (عربي)" : "Last Name (Arabic)"}
                            {!hasGuardianEnFilled && " *"}
                          </label>
                          <input
                            type="text"
                            value={guardianEntries[0]?.last_name_ar || ""}
                            onChange={e => {
                              const l_ar = e.target.value;
                              const f_ar = guardianEntries[0]?.first_name_ar || "";
                              updatePrimaryGuardian({
                                last_name_ar: l_ar,
                                name: `${f_ar} ${l_ar}`.trim()
                              });
                            }}
                            className={DS_inputCls}
                            required={!isAnyGuardianEnTyped}
                            dir="rtl"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className={DS_labelCls}>
                            {isRtl ? "الاسم الأول (إنجليزي)" : "First Name (English)"}
                            {!hasGuardianArFilled && " *"}
                          </label>
                          <input
                            type="text"
                            value={guardianEntries[0]?.first_name_en || ""}
                            onChange={e => {
                              const f_en = e.target.value;
                              const l_en = guardianEntries[0]?.last_name_en || "";
                              updatePrimaryGuardian({
                                first_name_en: f_en,
                                name_en: `${f_en} ${l_en}`.trim()
                              });
                            }}
                            className={DS_inputCls}
                            required={!isAnyGuardianArTyped}
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className={DS_labelCls}>
                            {isRtl ? "اسم العائلة (إنجليزي)" : "Last Name (English)"}
                            {!hasGuardianArFilled && " *"}
                          </label>
                          <input
                            type="text"
                            value={guardianEntries[0]?.last_name_en || ""}
                            onChange={e => {
                              const l_en = e.target.value;
                              const f_en = guardianEntries[0]?.first_name_en || "";
                              updatePrimaryGuardian({
                                last_name_en: l_en,
                                name_en: `${f_en} ${l_en}`.trim()
                              });
                            }}
                            className={DS_inputCls}
                            required={!isAnyGuardianArTyped}
                            dir="ltr"
                          />
                        </div>
                      </div>

                      {/* Email, Address Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className={DS_labelCls}>{t("Email")}</label>
                          <input
                            type="email"
                            value={guardianEntries[0]?.email || ""}
                            onChange={e => updatePrimaryGuardian({ email: e.target.value })}
                            className={DS_inputCls}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <label className={DS_labelCls}>{t("Address")}</label>
                          <input
                            type="text"
                            value={guardianEntries[0]?.address || ""}
                            onChange={e => updatePrimaryGuardian({ address: e.target.value })}
                            className={DS_inputCls}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: STUDENT OFFICIAL DETAILS */}
              <div className="p-4 rounded-xl bg-gray-50/40 dark:bg-white/[0.02] border border-gray-150 dark:border-white/5 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-gray-150 dark:border-white/5 pb-2">
                  <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-bold text-xs text-[#0f2044] dark:text-white uppercase tracking-wider">
                    {t("Student Official Details")}
                  </h4>
                </div>

                <div className="space-y-3">
                  {/* Row 1: Student Names in a Single Row (Custom width: first names smaller, last names larger) */}
                  <div className="grid grid-cols-2 md:grid-cols-10 gap-2">
                    <div className="space-y-0.5 md:col-span-2">
                      <label className={DS_labelCls}>
                        {isRtl ? "الاسم الأول (عربي)" : "First Name (Arabic)"}
                        {!hasStudentEnFilled && " *"}
                      </label>
                      <input
                        type="text"
                        value={studentForm.data.first_name_ar}
                        onChange={e => studentForm.setData("first_name_ar", e.target.value)}
                        className={DS_inputCls}
                        dir="rtl"
                        required={!isAnyStudentEnTyped}
                      />
                      <InputError message={studentForm.errors.first_name_ar} />
                    </div>
                    <div className="space-y-0.5 md:col-span-3">
                      <label className={DS_labelCls}>
                        {isRtl ? "اسم العائلة (عربي)" : "Last Name (Arabic)"}
                        {!hasStudentEnFilled && " *"}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={studentForm.data.last_name_ar}
                          onChange={e => studentForm.setData("last_name_ar", e.target.value)}
                          className={`${DS_inputCls} ${guardianEntries[0]?.relationship_type === 'father' && (selectedGuardianId || showNewGuardianForm) ? "pr-8 border-yellow-300 dark:border-yellow-600/30 bg-yellow-50/5 text-gray-500 font-medium" : ""}`}
                          dir="rtl"
                          required={!isAnyStudentEnTyped}
                        />
                        {guardianEntries[0]?.relationship_type === 'father' && (selectedGuardianId || showNewGuardianForm) && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none" title={isRtl ? "مورث من الأب" : "Inherited from father"}>
                            <ShieldCheck size={14} className="text-[#f5b800]" />
                          </div>
                        )}
                      </div>
                      <InputError message={studentForm.errors.last_name_ar} />
                    </div>
                    <div className="space-y-0.5 md:col-span-2">
                      <label className={DS_labelCls}>
                        {isRtl ? "الاسم الأول (إنجليزي)" : "First Name (English)"}
                        {!hasStudentArFilled && " *"}
                      </label>
                      <input
                        type="text"
                        value={studentForm.data.first_name_en}
                        onChange={e => studentForm.setData("first_name_en", e.target.value)}
                        className={DS_inputCls}
                        dir="ltr"
                        required={!isAnyStudentArTyped}
                      />
                      <InputError message={studentForm.errors.first_name_en} />
                    </div>
                    <div className="space-y-0.5 md:col-span-3">
                      <label className={DS_labelCls}>
                        {isRtl ? "اسم العائلة (إنجليزي)" : "Last Name (English)"}
                        {!hasStudentArFilled && " *"}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={studentForm.data.last_name_en}
                          onChange={e => studentForm.setData("last_name_en", e.target.value)}
                          className={`${DS_inputCls} ${guardianEntries[0]?.relationship_type === 'father' && (selectedGuardianId || showNewGuardianForm) ? "pl-8 border-yellow-300 dark:border-yellow-600/30 bg-yellow-50/5 text-gray-500 font-medium" : ""}`}
                          dir="ltr"
                          required={!isAnyStudentArTyped}
                        />
                        {guardianEntries[0]?.relationship_type === 'father' && (selectedGuardianId || showNewGuardianForm) && (
                          <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none" title={isRtl ? "مورث من الأب" : "Inherited from father"}>
                            <ShieldCheck size={14} className="text-[#f5b800]" />
                          </div>
                        )}
                      </div>
                      <InputError message={studentForm.errors.last_name_en} />
                    </div>
                  </div>

                  {/* Compact Live Full-Name Preview Strip */}
                  {Boolean(studentForm.data.first_name_ar.trim() || studentForm.data.first_name_en.trim()) && (
                    <div className="p-2 bg-gradient-to-r from-blue-50/55 to-indigo-50/55 dark:from-[#243460]/10 dark:to-[#1e2a4a]/10 border border-blue-100/30 dark:border-blue-900/10 rounded-xl flex flex-wrap items-center justify-between gap-2 transition-all duration-300">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#0f2044] dark:text-[#7ba7e8] uppercase">
                          <Eye size={12} className="text-[#f5b800]" />
                          {isRtl ? "الاسم الكامل:" : "Full Name:"}
                        </span>
                        <span className="text-xs font-black text-[#0f2044] dark:text-white bg-white dark:bg-[#16223b] px-2 py-0.5 rounded border border-gray-100 dark:border-white/5" dir="rtl">
                          {getPreviewFullName('ar') || "—"}
                        </span>
                        <span className="text-xs font-black text-[#0f2044] dark:text-white bg-white dark:bg-[#16223b] px-2 py-0.5 rounded border border-gray-100 dark:border-white/5" dir="ltr">
                          {getPreviewFullName('en') || "—"}
                        </span>
                      </div>
                      {guardianEntries[0]?.relationship_type === 'father' && (selectedGuardianId || showNewGuardianForm) ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#f5b800]/10 text-[#7a5c00] dark:text-[#f5b800] uppercase tracking-wider">
                          {isRtl ? "مورث من الأب" : "Inherited"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-gray-100 dark:bg-white/5 text-gray-500 uppercase tracking-wider">
                          {isRtl ? "تعديل يدوي" : "Manual"}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Row 2: Student Civil ID, Gender, and Photo in a Single Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                    {/* Civil ID (5 Columns) */}
                    <div className="space-y-0.5 md:col-span-5">
                      <label className={DS_labelCls}>{t("Civil ID")} *</label>
                      <input
                        type="text"
                        value={studentForm.data.national_id}
                        onChange={e => studentForm.setData("national_id", e.target.value.replace(/\D/g, ''))} minLength={7} maxLength={20} pattern="\d+"
                        className={DS_inputCls}
                        dir="ltr"
                        required
                      />
                      <InputError message={studentForm.errors.national_id} />
                    </div>

                    {/* Gender Selection (4 Columns) */}
                    <div className="space-y-0.5 md:col-span-4">
                      <label className={DS_labelCls}>{t("Gender")} *</label>
                      <div className="flex gap-1.5 h-9 items-center">
                        {['male', 'female'].map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => studentForm.setData("gender", g)}
                            className={`flex-1 h-full rounded-lg font-bold text-xs border transition-all ${studentForm.data.gender === g ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/10' : 'bg-white dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                          >
                            {g === 'male' ? t("Male") : t("Female")}
                          </button>
                        ))}
                      </div>
                      <InputError message={studentForm.errors.gender} />
                    </div>

                    {/* Student Photo Upload (3 Columns) - InlineHorizontalUpload */}
                    <div className="space-y-0.5 md:col-span-3">
                      <label className={DS_labelCls}>{t("Student Photo")}</label>
                      <div className="relative group cursor-pointer h-9 rounded-lg bg-white dark:bg-[#0f2044]/30 border border-dashed border-gray-300 dark:border-[#243460] shadow-sm flex items-center justify-between px-2 overflow-hidden transition-all hover:border-[#f5b800] hover:bg-[#f5b800]/5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {studentImagePreview ? (
                            <img src={studentImagePreview} alt="Student" className="w-5.5 h-5.5 rounded-full object-cover shrink-0" onError={(e) => handleImageError(e, "student")} />
                          ) : (
                            <div className="w-5.5 h-5.5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                              <Camera className="w-3 h-3 text-gray-400 group-hover:text-[#f5b800]" />
                            </div>
                          )}
                          <span className="text-[10px] font-bold text-gray-500 truncate group-hover:text-[#f5b800]">
                            {studentImagePreview ? t("Change") : t("Upload")}
                          </span>
                        </div>
                        {studentImagePreview && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeStudentImage(); }}
                            className="p-0.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        {!studentImagePreview && <input type="file" accept="image/*" onChange={handleStudentImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: CLASS & ROUTE ASSIGNMENTS */}
              <div className="p-4 rounded-xl bg-gray-50/40 dark:bg-white/[0.02] border border-gray-150 dark:border-white/5 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-1.5 border-b border-gray-150 dark:border-white/5 pb-2">
                  <BusIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="font-bold text-xs text-[#0f2044] dark:text-white uppercase tracking-wider">
                    {t("Class & Route Assignments")}
                  </h4>
                </div>

                {/* Single Row with 3 equal columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div className="space-y-0.5">
                    <SearchableSelect
                      label={`${t("Class")} *`}
                      placeholder={t("Select Class")}
                      value={studentForm.data.classroom_id}
                      onChange={v => studentForm.setData("classroom_id", v as string)}
                      options={classrooms.map(c => ({ id: c.id, label: c.name }))}
                      openDirection="up"
                    />
                    <InputError message={studentForm.errors.classroom_id} />
                  </div>

                  <div className="space-y-0.5">
                    <SearchableSelect
                      label={t("Morning Route")}
                      placeholder={t("None")}
                      value={studentForm.data.forth_bus_id}
                      onChange={v => studentForm.setData("forth_bus_id", v as string)}
                      options={[{ id: "", label: t("None") }, ...buses.map(b => ({ id: b.id, label: `${b.bus_number} - ${b.plate_number}` }))]}
                      openDirection="up"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <SearchableSelect
                      label={t("Afternoon Route")}
                      placeholder={t("None")}
                      value={studentForm.data.back_bus_id}
                      onChange={v => studentForm.setData("back_bus_id", v as string)}
                      options={[{ id: "", label: t("None") }, ...buses.map(b => ({ id: b.id, label: `${b.bus_number} - ${b.plate_number}` }))]}
                      openDirection="up"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons with Bottom Row Status Toggle (Saves a whole section card!) */}
              <div className="flex items-center justify-between border-t border-gray-150 dark:border-white/5 pt-3 mt-4">
                {/* Pure Clean Status Toggle (Independent, Zero formatting card) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => studentForm.setData("is_active", !studentForm.data.is_active)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      studentForm.data.is_active ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isRtl
                          ? (studentForm.data.is_active ? "-translate-x-4" : "translate-x-0")
                          : (studentForm.data.is_active ? "translate-x-4" : "translate-x-0")
                      }`}
                    />
                  </button>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    {studentForm.data.is_active ? t("Active Student") : t("Suspended Student")}
                  </span>
                </div>

                {/* Cancel / Submit Buttons */}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={closeModal} className={DS_cancelBtn}>
                    {t("Cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={studentForm.processing || (modalMode === "edit" && !isStudentModified)}
                    className={DS_submitBtn(studentForm.processing || (modalMode === "edit" && !isStudentModified))}
                  >
                    {modalMode === "edit" ? t("Save Changes") : t("Enroll Student")}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
      {/* Delete Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="md">
        <div className="p-8 text-center">
          <div className="w-20 h-20 rounded-[24px] bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6 border-4 border-red-100 dark:border-red-900/30">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-2xl font-black text-[#0f2044] dark:text-white mb-2">{t("Confirm Deletion")}</h3>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
            {t("Are you sure you want to delete this student?")}
          </p>
          <div className="flex gap-4">
            <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className={`flex-1 py-3 ${DS_cancelBtn} disabled:opacity-50`}>
              {t("Cancel")}
            </button>
            <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-3 px-6 rounded-[14px] bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
              {isDeleting ? t("Deleting...") : t("Delete")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal show={showImportModal} onClose={() => setShowImportModal(false)} maxWidth="md">
        <div className={DS_modalHeader(isRtl)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[12px] flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div className={isRtl ? "text-right" : "text-left"}>
              <h3 className="text-xl font-bold text-white">{t("Import Students & Guardians")}</h3>
              <p className="text-[#7ba7e8] text-xs font-bold tracking-wider">{t("Upload Excel File")}</p>
            </div>
          </div>
          <button onClick={() => setShowImportModal(false)} className={DS_modalClose}>
            <X size={20} />
          </button>
        </div>
        <div className={DS_modalBody}>
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">{t("Important Notes:")}</h4>
            <ul className="text-xs text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
              <li>{t("The file must be an Excel file (.xlsx, .xls) or CSV.")}</li>
              <li>{t("Guardian's Civil ID is strictly required to link the student.")}</li>
              <li>{t("If the guardian does not exist, their Name and Phone must be provided.")}</li>
            </ul>
            <div className="mt-4">
              <button type="button" onClick={handleDownloadTemplate} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <Download size={14} /> {t("Download Excel Template")}
              </button>
            </div>
          </div>
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <InputLabel value={t("Select File")} />
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportData('file', e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#0f2044] file:text-white hover:file:bg-[#162d60] transition-all cursor-pointer border border-gray-200 dark:border-gray-700 rounded-xl"
                required
              />
              <InputError message={importErrors.file} className="mt-2" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowImportModal(false)} className={DS_cancelBtn}>
                {t("Cancel")}
              </button>
              <button type="submit" disabled={isImporting || !importData.file} className={DS_submitBtn(isImporting)}>
                {isImporting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t("Import Data")}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </SchoolAuthenticatedLayout>
  );
}
