import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import useTranslation from "@/hooks/useTranslation";
import BaseDataTable, {
  ActionButton,
  type FilterTab,
} from "@/Components/BaseDataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  Users,
  CheckCircle2,
  UserX,
  UserPlus,
  GraduationCap,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────

interface Teacher {
  id: number;
  first_name_ar: string;
  second_name_ar: string;
  third_name_ar: string;
  last_name_ar: string;
  first_name_en: string | null;
  second_name_en: string | null;
  third_name_en: string | null;
  last_name_en: string | null;
  name: string;
  name_en: string | null;
  national_id: string;
  email: string | null;
  phone: string;
  is_active: boolean;
  image?: string | null;
  grade_id?: number | null;
  grade_name?: string | null;
}

interface Grade {
  id: number;
  name: string;
}

interface Props {
  auth: any;
  teachers: Teacher[];
  counts: {
    all: number;
    active: number;
    inactive: number;
  };
  grades: Grade[];
  filters: { search?: string };
}

// ─── Component ───────────────────────────────────────────────────

export default function TeachersIndex({ auth, teachers, counts, grades = [], filters }: Props) {
  const { t, isRtl } = useTranslation();

  // --- State ---
  const [search, setSearch] = useState(filters.search || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // --- Form ---
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    _method: "post" as "post" | "put",
    first_name_ar: "",
    second_name_ar: "",
    third_name_ar: "",
    last_name_ar: "",
    first_name_en: "",
    second_name_en: "",
    third_name_en: "",
    last_name_en: "",
    national_id: "",
    email: "",
    phone: "",
    password: "",
    is_active: true,
    image: null as File | null,
    grade_id: "" as string | number,
  });

  // --- Handlers ---
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.get(
          route("school.teachers.index"),
          { search: value },
          { preserveState: true, replace: true }
        );
      }, 300),
    []
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setPreviewImage(null);
    reset();
    setData("_method", "post");
    clearErrors();
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setIsEditing(true);
    setCurrentId(teacher.id);
    setPreviewImage(teacher.image ? `/storage/${teacher.image}` : null);
    setData({
      _method: "put",
      first_name_ar: teacher.first_name_ar || "",
      second_name_ar: teacher.second_name_ar || "",
      third_name_ar: teacher.third_name_ar || "",
      last_name_ar: teacher.last_name_ar || "",
      first_name_en: teacher.first_name_en || "",
      second_name_en: teacher.second_name_en || "",
      third_name_en: teacher.third_name_en || "",
      last_name_en: teacher.last_name_en || "",
      national_id: teacher.national_id || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      password: "",
      is_active: !!teacher.is_active,
      image: null,
      grade_id: teacher.grade_id || "",
    });
    clearErrors();
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPreviewImage(null);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentId) {
      post(route("school.teachers.update", currentId), {
        forceFormData: true,
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("school.teachers.store"), {
        onSuccess: () => closeModal(),
      });
    }
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
        },
      });
    }
  };

  // --- Filter Tabs ---
  const filterTabs: FilterTab[] = [
    { key: "all", label: t("All"), count: counts.all },
    { key: "active", label: t("Active"), count: counts.active, dotColor: "bg-green-400" },
    { key: "inactive", label: t("Inactive"), count: counts.inactive, dotColor: "bg-red-400" },
  ];

  // --- Columns ---
  const columnHelper = createColumnHelper<Teacher>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("Teacher"),
        cell: (info) => {
          const teacher = info.row.original;
          return (
            <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-[#0e7490] dark:text-cyan-400 flex items-center justify-center font-bold text-sm overflow-hidden border border-cyan-200 dark:border-cyan-800">
                {teacher.image ? (
                  <img src={`/storage/${teacher.image}`} alt={teacher.name} className="w-full h-full object-cover" />
                ) : (
                  teacher.name.charAt(0)
                )}
              </div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {teacher.name}
                </div>
                {teacher.name_en && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {teacher.name_en}
                  </div>
                )}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("national_id", {
        header: t("ID / Code"),
        cell: (info) => (
          <div className={`text-sm font-mono font-medium text-gray-600 dark:text-gray-300 ${isRtl ? "text-right" : "text-left"}`}>
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("phone", {
        header: t("Contact"),
        cell: (info) => {
          const teacher = info.row.original;
          return (
            <div className={isRtl ? "text-right" : "text-left"}>
              <div className="text-sm text-gray-800 dark:text-gray-200">{teacher.phone}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{teacher.email}</div>
            </div>
          );
        },
      }),
      columnHelper.accessor("grade_name", {
        header: t("Grade Responsible For"),
        cell: (info) => {
          const name = info.getValue();
          return name ? (
            <span className="px-3 py-1 bg-cyan-50 dark:bg-cyan-900/30 text-[#0e7490] dark:text-cyan-400 rounded-full text-xs font-bold border border-cyan-100 dark:border-cyan-800">
                {name}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-600 text-xs italic">{t("No Grade Assigned")}</span>
          );
        },
      }),
      columnHelper.accessor("is_active", {
        header: t("Status"),
        cell: (info) => {
          const isActive = info.getValue();
          return (
            <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
              {isActive ? t("Active") : t("Inactive")}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: t("Actions"),
        cell: (info) => {
          const teacher = info.row.original;
          return (
            <div className={`flex gap-2 ${isRtl ? "justify-start" : "justify-end"}`}>
              <ActionButton label={t("Edit")} onClick={() => openEditModal(teacher)} color="indigo" />
              <ActionButton label={t("Delete")} onClick={() => confirmDelete(teacher)} color="red" />
            </div>
          );
        },
      }),
    ],
    [isRtl, t]
  );

  const headerAction = (
    <PrimaryButton onClick={openAddModal} className="bg-[#0e7490] hover:bg-[#155e75] text-white">
      {t("+ Add New Teacher")}
    </PrimaryButton>
  );

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-bold text-xl text-[#0e7490] dark:text-cyan-400">{t("Teachers Management")}</h2>}
    >
      <Head title={t("Teachers")} />

      <div className="pb-8 space-y-6">
        {/* Stats Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PersonStatCard label={t("Total Teachers")} value={counts.all} icon={<Users className="w-5 h-5" />} color="blue" isRtl={isRtl} />
          <PersonStatCard label={t("Active")} value={counts.active} icon={<CheckCircle2 className="w-5 h-5" />} color="green" isRtl={isRtl} />
          <PersonStatCard label={t("Inactive")} value={counts.inactive} icon={<UserX className="w-5 h-5" />} color="red" isRtl={isRtl} />
        </motion.div>

        {/* Main Table */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <BaseDataTable<Teacher>
            columns={columns}
            data={teachers}
            title={t("Teachers List")}
            headerAction={headerAction}
            searchValue={search}
            onSearchChange={handleSearch}
            searchPlaceholder={t("Search name, ID, phone...")}
            filterTabs={filterTabs}
            activeFilter="all"
            onFilterChange={() => {}}
            emptyMessage={t("No Teachers Yet")}
            emptyIcon={<GraduationCap className="w-10 h-10" />}
          />
        </motion.div>
      </div>

      {/* Modern Add/Edit Modal */}
      <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
        <div className={`relative bg-white dark:bg-[#1e293b] rounded-2xl overflow-hidden shadow-2xl`}>
          <button type="button" onClick={closeModal} className={`absolute top-6 ${isRtl ? "left-6" : "right-6"} p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500`}>
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor font-bold"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800 bg-[#0e7490]/5">
            <h2 className="text-2xl font-bold text-[#0e7490] dark:text-cyan-400">
              {isEditing ? t("Edit Teacher Details") : t("Register New Teacher")}
            </h2>
            <div className="mt-6 relative flex items-center justify-between px-10">
              <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full z-0"></div>
              <div className="absolute left-10 top-1/2 -translate-y-1/2 h-1 bg-[#0e7490] rounded-full z-0 transition-all duration-300" style={{ width: currentStep === 1 ? '0%' : '100%', [isRtl ? 'right' : 'left']: '10px' }}></div>
              <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow z-10 ${currentStep >= 1 ? 'bg-[#0e7490] text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'}`}>1</div>
              <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow z-10 ${currentStep >= 2 ? 'bg-[#0e7490] text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'}`}>2</div>
            </div>
            <div className="flex justify-between px-4 mt-2 text-xs font-bold text-gray-500">
              <span>{t("Personal Details")}</span>
              <span>{t("Contact & Preferences")}</span>
            </div>
          </div>

          <form onSubmit={submit} className="flex flex-col">
            <div className="p-8 space-y-8">
              {currentStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className={`flex items-start gap-6 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <div className="relative w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                        {data.image ? <img src={URL.createObjectURL(data.image)} alt="Preview" className="w-full h-full object-cover" /> : previewImage ? <img src={previewImage} alt="Current" className="w-full h-full object-cover" /> : <Users className="w-10 h-10 text-gray-300 dark:text-gray-600" />}
                      </div>
                    </div>
                    <div className={isRtl ? "text-right" : "text-left"}>
                      <h4 className="font-bold text-gray-800 dark:text-gray-200">{t("Profile Picture")}</h4>
                      <label className="cursor-pointer inline-block mt-3 px-4 py-2 bg-[#0e7490] text-white rounded-lg text-sm font-semibold hover:bg-[#155e75] transition-colors">
                        {t("Upload Photo")}<input type="file" className="hidden" accept="image/*" onChange={(e) => setData("image", e.target.files?.[0] || null)} />
                      </label>
                      <InputError message={errors.image} className="mt-2" />
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-bold border-b pb-2 mb-4 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 ${isRtl ? "text-right" : "text-left"}`}>{t("Name (Arabic)")}</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {['first_name_ar', 'second_name_ar', 'third_name_ar', 'last_name_ar'].map((key) => (
                        <div key={key}>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-500">{t(key.replace(/_/g, ' ').replace(' ar', ''))}</label>
                          <input type="text" value={(data as any)[key]} onChange={e => setData(key as any, e.target.value)} dir="rtl" className="w-full rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-[#0e7490]" required={key.includes('first') || key.includes('last')} />
                          <InputError message={(errors as any)[key]} className="mt-1" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-bold border-b pb-2 mb-4 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 ${isRtl ? "text-right" : "text-left"}`}>{t("Name (English)")}</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {['first_name_en', 'second_name_en', 'third_name_en', 'last_name_en'].map((key) => (
                        <div key={key}>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-500">{t(key.replace(/_/g, ' ').replace(' en', ''))}</label>
                          <input type="text" value={(data as any)[key]} onChange={e => setData(key as any, e.target.value)} dir="ltr" className="w-full rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-[#0e7490]" />
                          <InputError message={(errors as any)[key]} className="mt-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">{t("National ID")}</label>
                      <input type="text" value={data.national_id} onChange={e => setData("national_id", e.target.value)} dir="ltr" required className="w-full rounded-lg px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white font-mono focus:ring-[#0e7490]" />
                      <InputError message={errors.national_id} className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">{t("Phone Number")}</label>
                      <input type="text" value={data.phone} onChange={e => setData("phone", e.target.value)} dir="ltr" placeholder="5X XXX XXXX" required className="w-full rounded-lg px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white font-mono focus:ring-[#0e7490]" />
                      <InputError message={errors.phone} className="mt-1" />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">{t("Email")}</label>
                       <input type="email" value={data.email} onChange={e => setData("email", e.target.value)} dir="ltr" className="w-full rounded-lg px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-[#0e7490]" />
                       <InputError message={errors.email} className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-gray-500">{t("Grade Responsible For")}</label>
                      <select value={data.grade_id} onChange={e => setData("grade_id", e.target.value)} className="w-full rounded-lg px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:ring-[#0e7490]">
                        <option value="">{t("Unassigned")}</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                      <InputError message={errors.grade_id} className="mt-1" />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input type="checkbox" id="is_active" checked={data.is_active} onChange={e => setData("is_active", e.target.checked)} className="rounded text-[#0e7490] focus:ring-[#0e7490]" />
                      <label htmlFor="is_active" className="text-sm font-bold text-gray-700 dark:text-gray-300">{t("Active Account")}</label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`px-8 py-5 border-t flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 ${isRtl ? "flex-row-reverse" : ""}`}>
              <button type="button" onClick={currentStep === 1 ? closeModal : () => setCurrentStep(1)} className="text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors uppercase tracking-widest">{currentStep === 1 ? t("Cancel") : t("Back")}</button>
              <div className="flex items-center gap-4">
               {currentStep === 1 ? (
                 <button type="button" onClick={() => setCurrentStep(2)} className="px-8 py-2.5 bg-[#0e7490] text-white rounded-xl font-bold text-sm hover:scale-105 transition-all">{t("Next")}</button>
               ) : (
                 <button type="submit" disabled={processing} className="px-8 py-2.5 bg-[#0e7490] text-white rounded-xl font-bold text-sm hover:scale-105 transition-all disabled:opacity-50">{isEditing ? t("Save Changes") : t("Add Teacher")}</button>
               )}
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6"><div className="text-6xl mb-4">⚠️</div><h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("Confirm Deletion")}</h3><p className="text-gray-500 dark:text-gray-400">{t("Are you sure? This cannot be undone.")}</p></div>
            <div className="flex gap-4"><button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-100 dark:bg-gray-800 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300">{t("Cancel")}</button><button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/20">{t("Delete")}</button></div>
          </div>
        </div>
      )}
    </SchoolAuthenticatedLayout>
  );
}

// ─── PersonStatCard ───────────────────────────────────────
function PersonStatCard({ label, value, icon, color, isRtl }: any) {
  const colors: any = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-500 border-blue-100 dark:border-blue-900/30",
    green: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 border-emerald-100 dark:border-emerald-900/30",
    red: "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-100 dark:border-red-900/30",
  };
  return (
    <div className={`flex items-center gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border ${colors[color]} shadow-sm ${isRtl ? "flex-row-reverse" : ""}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-gray-700 shadow-sm`}>{icon}</div>
      <div className={isRtl ? "text-right" : "text-left"}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
