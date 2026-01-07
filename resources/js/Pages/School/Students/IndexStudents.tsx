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

interface Guardian {
  id: number;
  name: string;
  name_en?: string;
  phone: string;
  national_id: string;
  address?: string;
  home_number?: string;
  image?: string;
}

interface Supervisor {
  id: number;
  name: string;
  email?: string;
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
  student_code?: string;
  current_enrollment: {
    classroom: Classroom;
    classroom_id?: number;
  } | null;
  classroom: Classroom;
  classroom_id?: number;
}

interface Props {
  auth: { user: User };
  user: User;
  students: Student[];
  filters: { search?: string };
  search?: string;
  classrooms: Classroom[];
  supervisors: Supervisor[];
  guardianResult?: {
    found: boolean;
    guardian: Guardian | null;
  } | null;
  found: boolean;
  guardian: Guardian | null;
}

export default function IndexStudents({ auth, students, filters, classrooms, supervisors, guardianResult }: Props) {
  const { t, isRtl } = useTranslation();
  const [search, setSearch] = useState(filters.search || "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Step state logic from CreateStudent
  const [step, setStep] = useState<1 | 2>(1);

  const selectedGuardian: Guardian | null = useMemo(() => {
    if (isEditing && editingStudent?.guardian) return editingStudent.guardian;
    return guardianResult?.found ? guardianResult.guardian : null;
  }, [guardianResult, isEditing, editingStudent]);

  // Sync step with search result
  useEffect(() => {
    if (!isEditing && guardianResult?.found) {
      setStep(2);
    }
  }, [guardianResult, isEditing]);

  // Forms
  const guardianSearch = useForm({ national_id: "" });

  const guardianCreate = useForm({
    name: "",
    name_en: "",
    national_id: "",
    phone: "",
    email: "",
    address: "",
    home_number: "",
    preferred_language: "ar",
    image: null as File | null,
  });

  const studentForm = useForm({
    full_name: "",
    student_code: "",
    national_id: "",
    classroom_id: "",
    guardian_id: "" as string | number,
    supervisor_id: "",
    gender: "",
    image: null as File | null,
    is_active: true,
  });

  // Update guardian_id in student form when selectedGuardian changes
  useEffect(() => {
    if (selectedGuardian) {
      studentForm.setData("guardian_id", selectedGuardian.id);
    }
  }, [selectedGuardian]);

  // Update guardianCreate national_id if search result changes (and not found)
  useEffect(() => {
    if (!guardianResult?.found && guardianSearch.data.national_id) {
      guardianCreate.setData("national_id", guardianSearch.data.national_id);
    }
  }, [guardianResult, guardianSearch.data.national_id]);

  const resetForms = () => {
    guardianSearch.reset();
    guardianSearch.clearErrors();
    guardianCreate.reset();
    guardianCreate.clearErrors();
    studentForm.reset();
    studentForm.clearErrors();
    setStep(1);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingStudent(null);
    resetForms();
    setShowModal(true);
  };

  const openEditModal = (student: Student) => {
    setIsEditing(true);
    setEditingStudent(student);
    resetForms();
    setStep(2);

    studentForm.setData({
      full_name: student.full_name,
      student_code: student.student_code || "",
      national_id: student.national_id || "",
      gender: student.gender || "",
      classroom_id: student.current_enrollment?.classroom?.id?.toString() || "",
      guardian_id: student.guardian_id || "",
      supervisor_id: student.supervisor?.id.toString() || "",
      is_active: student.is_active,
      image: null,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForms();
  }

  const onSearchGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    guardianSearch.post(route("school.guardians.search"), {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const onCreateGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    guardianCreate.post(route("school.guardians.store"), {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const onSubmitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && editingStudent) {
      studentForm.post(route("school.students.update", editingStudent.id), {
        onSuccess: closeModal,
        preserveScroll: true,
      });
    } else {
      studentForm.post(route("school.students.store"), {
        onSuccess: closeModal,
        preserveScroll: true,
      });
    }
  };

  const debouncedSearch = useCallback(
    debounce((val: string) => {
      router.get(route("school.students.index"), { search: val }, { preserveState: true, preserveScroll: true });
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleDelete = () => {
    if (!studentToDelete) return;
    router.delete(route("school.students.destroy", studentToDelete.id), {
      preserveScroll: true,
      onSuccess: () => {
        setShowDeleteModal(false);
        setStudentToDelete(null);
      }
    });
  };

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">
          {t('Students')}
        </h2>
      }
    >
      <Head title={t('Students')} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 dark:border-gray-700 shadow-xl rounded-2xl">
          {/* Header Strip */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 italic">
                  {t('Students List')}
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('Total Students')}: <span className="font-bold text-gray-800 dark:text-gray-200">{students.length}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder={t('البحث بالاسم، الرقم المدني...')}
                  className="w-full sm:w-72 bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 pl-11 focus:ring-blue-500 dark:text-white transition-shadow shadow-sm focus:shadow-md"
                />
                <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>

              <button
                onClick={openAddModal}
                className="inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:translate-y-[-1px]"
              >
                <svg className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                {t('Enroll New Student')}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700/50">
                  <th className="px-6 py-4 text-[10px] sm:text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{t('Student')}</th>
                  <th className="px-6 py-4 text-[10px] sm:text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t('Academic')}</th>
                  <th className="px-6 py-4 text-[10px] sm:text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-widest">{t('الرقم المدني')}</th>
                  <th className="px-6 py-4 text-[10px] sm:text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t('Guardian')}</th>
                  <th className="px-6 py-4 text-[10px] sm:text-xs font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-widest">{t('Address')}</th>
                  <th className="px-6 py-4 text-[10px] sm:text-xs font-extrabold text-gray-500 uppercase tracking-widest text-center">{t('Control')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 flex-shrink-0">
                            {student.image ? (
                              <img src={student.image} alt={student.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center grayscale opacity-10 font-bold">👤</div>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-800 dark:text-gray-100 text-sm leading-tight group-hover:text-blue-600 transition-colors uppercase">{student.full_name}</div>
                            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase">
                              {student.gender === 'male' ? (
                                <><span className="mr-1">♂</span> {t('Male')}</>
                              ) : (
                                <><span className="mr-1">♀</span> {t('Female')}</>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300 text-xs">
                            <div className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[8px]">🏫</div>
                            {student.current_enrollment?.classroom?.name || <span className="text-gray-400 font-medium italic">{t('Unassigned')}</span>}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                            <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[8px]">👨‍🏫</div>
                            {student.supervisor?.name || <span className="italic">{t('No supervisor')}</span>}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono font-bold text-gray-600 dark:text-gray-400 tracking-wider">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">{student.national_id}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 overflow-hidden flex-shrink-0">
                            {student.guardian?.image ? (
                              <img src={student.guardian.image} alt={student.guardian.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-20">👤</div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-gray-800 dark:text-gray-200">{student.guardian?.name || '-'}</div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{student.guardian?.phone || '-'}</div>
                            <div className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold tracking-tight opacity-70">{t('الرقم المدني')}: {student.guardian?.national_id || '-'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="max-w-[150px] truncate text-xs text-gray-600 dark:text-gray-400 group-hover:whitespace-normal group-hover:overflow-visible group-hover:bg-white dark:group-hover:bg-gray-800 group-hover:shadow-lg group-hover:p-2 group-hover:rounded-lg group-hover:z-10 group-hover:relative transition-all duration-300">
                          {student.guardian?.address || <span className="italic opacity-50 text-[10px]">{t('No address')}</span>}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                            title={t('Edit')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                          </button>
                          <button
                            onClick={() => {
                              setStudentToDelete(student);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-all"
                            title={t('Delete')}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-4xl opacity-20">📂</span>
                          <p className="text-gray-400 font-bold">{t('No students found')}</p>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Main Enrollment Modal */}
      <Modal show={showModal} onClose={closeModal} maxWidth="2xl">
        <div className="p-0 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all">

          <div className="p-8">
            {/* Stepper */}
            {!isEditing && (
              <div className="flex items-center justify-center gap-3 mb-12">
                {[1, 2].map((s) => (
                  <React.Fragment key={s}>
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all ${step === s ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-900/50 text-slate-500'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm transition-all ${step === s ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                        {s}.
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest leading-none">
                        {s === 1 ? t('البحث عن ولي أمر') : t('تفاصيل الطالب')}
                      </span>
                    </div>
                    {s === 1 && <div className="h-px w-20 bg-slate-800" />}
                  </React.Fragment>
                ))}
              </div>
            )}

            <div className="max-h-[75vh] overflow-y-auto custom-scrollbar px-2 pb-4">
              {/* STEP 1: GUARDIAN */}
              {!isEditing && step === 1 && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="text-right rtl:text-right">
                    <h3 className="text-2xl font-black text-white mb-2">{t('التحقق من ولي الأمر')}</h3>
                    <p className="text-slate-400 text-sm italic">{t('ابحث بالاسم أو الرقم المدني أو رقم هوية الأب...')}</p>
                  </div>

                  <form onSubmit={onSearchGuardian} className="space-y-4">
                    <div className="relative group">
                      <InputLabel value={t('الرقم المدني')} className="mb-2 text-slate-400 text-xs font-black uppercase tracking-widest" />
                      <div className="flex gap-3">
                        <TextInput
                          value={guardianSearch.data.national_id}
                          onChange={e => guardianSearch.setData('national_id', e.target.value)}
                          className="flex-1 bg-slate-900/50 border-slate-700 focus:border-blue-500 focus:ring-blue-500 text-white rounded-2xl py-4 h-[60px] text-lg font-bold"
                          placeholder="10xxxxxxxxx"
                          required
                        />
                        <button
                          type="submit"
                          disabled={guardianSearch.processing}
                          className="px-10 h-[60px] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all transform active:scale-95 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                          {guardianSearch.processing ? t('جاري البحث...') : t('بحث...')}
                        </button>
                      </div>
                      {guardianSearch.errors.national_id && <InputError message={guardianSearch.errors.national_id} className="mt-2" />}
                    </div>
                  </form>

                  {/* Search Result Logic */}
                  {guardianResult && (
                    <div className="animate-slideUp mt-8 pt-8 border-t border-slate-800">
                      {guardianResult.found && guardianResult.guardian ? (
                        <div className="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/30 flex justify-between items-center group hover:border-blue-500/50 transition-all">
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0">
                              {guardianResult.guardian.image ? (
                                <img src={guardianResult.guardian.image} className="w-full h-full object-cover" />
                              ) : <div className="w-full h-full flex items-center justify-center text-3xl grayscale opacity-20">👤</div>}
                            </div>
                            <div>
                              <p className="text-blue-400 text-[10px] font-black mb-1 uppercase tracking-widest">✓ {t('Guardian Found')}</p>
                              <p className="text-xl font-black text-white">{guardianResult.guardian.name}</p>
                              <p className="text-slate-500 font-bold text-sm tracking-widest opacity-70">{guardianResult.guardian.national_id}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="bg-white hover:bg-slate-200 text-slate-950 px-8 py-3.5 rounded-2xl font-black transition-all transform active:scale-95 shadow-xl"
                          >
                            {t('اختيار ومتابعة')}
                          </button>
                        </div>
                      ) : (
                          <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-bold animate-pulse text-center">
                              ! {t('لا يوجد ولي أمر مسجل بهذا الرقم المدني. قم بإنشاء ملف جديد أدناه.')}
                            </div>

                            <div className="p-8 bg-slate-900/50 rounded-3xl border border-slate-800 mt-6 shadow-inner">
                              <h4 className="text-md font-black text-white mb-6 uppercase tracking-wider text-right">{t('إنشاء ولي أمر جديد')}</h4>

                              <form onSubmit={onCreateGuardian} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                  <InputLabel value={t('اسم ولي الأمر (عربي)')} className="mb-2 text-slate-500 text-xs font-black uppercase" />
                                  <TextInput value={guardianCreate.data.name} onChange={e => guardianCreate.setData('name', e.target.value)} required className="w-full bg-slate-950 border-slate-800 text-white rounded-xl h-[55px] font-bold" placeholder={t("Guardian Name (Arabic)")} />
                                  {guardianCreate.errors.name && <InputError message={guardianCreate.errors.name} />}
                                </div>
                                <div className="md:col-span-2">
                                  <InputLabel value={t('اسم ولي الأمر (إنجليزي)')} className="mb-2 text-slate-500 text-xs font-black uppercase" />
                                  <TextInput value={guardianCreate.data.name_en} onChange={e => guardianCreate.setData('name_en', e.target.value)} className="w-full bg-slate-950 border-slate-800 text-white rounded-xl h-[55px] font-bold" placeholder={t("Guardian Name (English)")} />
                                </div>
                                <div>
                                  <InputLabel value={t('الرقم المدني')} className="mb-2 text-slate-500 text-xs font-black uppercase" />
                                  <TextInput value={guardianCreate.data.national_id} className="w-full bg-slate-800 border-slate-700 text-slate-400 rounded-xl h-[55px] cursor-not-allowed font-mono font-bold" readOnly />
                                </div>
                                <div>
                                  <InputLabel value={t('Phone')} className="mb-2 text-slate-500 text-xs font-black uppercase" />
                                  <TextInput value={guardianCreate.data.phone} onChange={e => guardianCreate.setData('phone', e.target.value)} required className="w-full bg-slate-950 border-slate-800 text-white rounded-xl h-[55px] font-bold pr-4" placeholder="+966..." />
                                  {guardianCreate.errors.phone && <InputError message={guardianCreate.errors.phone} />}
                                </div>
                                <div className="md:col-span-2">
                                  <InputLabel value={t('Email')} className="mb-2 text-slate-500 text-xs font-black uppercase" />
                                  <TextInput type="email" value={guardianCreate.data.email} onChange={e => guardianCreate.setData('email', e.target.value)} className="w-full bg-slate-950 border-slate-800 text-white rounded-xl h-[55px] font-bold" placeholder="example@mail.com" />
                                </div>
                                <div className="md:col-span-2 grid grid-cols-3 gap-4">
                                  <div className="col-span-2">
                                    <InputLabel value={t('Address')} className="mb-2 text-slate-500 text-xs font-black uppercase" />
                                    <TextInput value={guardianCreate.data.address} onChange={e => guardianCreate.setData('address', e.target.value)} className="w-full bg-slate-950 border-slate-800 text-white rounded-xl h-[55px] font-bold" placeholder={t("City, District, Street...")} />
                                  </div>
                                  <div>
                                    <InputLabel value={t('Home Number')} className="mb-2 text-slate-500 text-xs font-black uppercase" />
                                    <TextInput value={guardianCreate.data.home_number} onChange={e => guardianCreate.setData('home_number', e.target.value)} className="w-full bg-slate-950 border-slate-800 text-white rounded-xl h-[55px] font-bold" placeholder="123" />
                                  </div>
                                </div>

                                <div className="md:col-span-2">
                                  <InputLabel value={t('Guardian Photo')} className="mb-4 text-slate-500 text-xs font-black uppercase" />
                                  <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-500 transition-colors group cursor-pointer relative overflow-hidden bg-slate-950/50">
                                    {guardianCreate.data.image ? (
                                      <div className="flex items-center gap-6 w-full animate-fadeIn">
                                        <div className="w-24 h-32 rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl">
                                          {/* @ts-ignore */}
                                          <img src={URL.createObjectURL(guardianCreate.data.image)} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 text-right">
                                          <p className="text-white font-black truncate">{guardianCreate.data.image.name}</p>
                                          <p className="text-slate-500 text-xs mt-1">{(guardianCreate.data.image.size / 1024).toFixed(2)} KB</p>
                                          <button type="button" onClick={() => guardianCreate.setData('image', null)} className="mt-2 text-red-500 hover:text-red-400 font-bold text-xs uppercase tracking-widest">🗑️ {t('Remove')}</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-2xl grayscale group-hover:scale-110 transition-transform">📷</div>
                                        <p className="text-slate-400 text-sm font-black">{t('اضغط لرفع صورة ولي الأمر')}</p>
                                        <p className="text-slate-600 text-[10px] font-bold uppercase">PNG, JPG up to 5MB</p>
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => guardianCreate.setData("image", e.target.files?.[0] || null)} />
                                      </>
                                    )}
                                  </div>
                                  {guardianCreate.errors.image && <InputError message={guardianCreate.errors.image} />}
                                </div>

                                <div className="md:col-span-2 pt-6">
                                  <button
                                    type="submit"
                                    disabled={guardianCreate.processing}
                                    className="w-full h-[65px] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-500/30 transform active:scale-[0.98] disabled:opacity-50"
                                  >
                                    {guardianCreate.processing ? t('Saving...') : t('إنشاء ولي أمر')}
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: STUDENT DETAILS */}
              {step === 2 && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="text-right rtl:text-right">
                    <h3 className="text-2xl font-black text-white">{t('بيانات الطالب')}</h3>
                    <p className="text-slate-400 text-sm italic">{t('أدخل اسم الطالب الكامل والحالة...')}</p>
                  </div>

                  {/* Selected Guardian Summary */}
                  {selectedGuardian ? (
                    <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/20 flex justify-between items-center group shadow-sm transition-all hover:bg-blue-600/10">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg animate-pulse">
                          {selectedGuardian.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{t('Guardian Selected')}</p>
                          <p className="text-xl font-black text-white leading-tight">{selectedGuardian.name}</p>
                          <p className="text-slate-500 text-sm font-bold tracking-widest">{selectedGuardian.national_id}</p>
                        </div>
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => setStep(1)}
                          className="bg-slate-900 border border-slate-800 text-slate-400 px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all hover:text-white hover:bg-slate-800 uppercase"
                        >
                          {t('Change')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-red-400 bg-red-500/5 border border-red-500/20 rounded-2xl font-black text-sm animate-shake">
                      ⚠️ {t('Guardian Not Found')}  - {t('Please complete Step 1')}
                    </div>
                  )}

                  <form onSubmit={onSubmitStudent} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Basic Student Information */}
                      <div className="md:col-span-1">
                        <InputLabel value={t('اسم الطالب *')} className="mb-2 text-slate-500 text-xs font-black uppercase tracking-widest" />
                        <TextInput value={studentForm.data.full_name} onChange={e => studentForm.setData('full_name', e.target.value)} required className="w-full bg-slate-900/50 border-slate-800 text-white rounded-2xl h-[55px] font-black text-lg focus:bg-slate-900 transition-all" placeholder={t("Full Name")} />
                        {studentForm.errors.full_name && <InputError message={studentForm.errors.full_name} />}
                      </div>

                      <div className="md:col-span-1">
                        <InputLabel value={t('Student Code *')} className="mb-2 text-slate-500 text-xs font-black uppercase tracking-widest" />
                        <TextInput value={studentForm.data.student_code} onChange={e => studentForm.setData('student_code', e.target.value)} className="w-full bg-slate-900/50 border-slate-800 text-white rounded-2xl h-[55px] font-black text-lg focus:bg-slate-900 transition-all" placeholder="STU-001" required />
                        {studentForm.errors.student_code && <InputError message={studentForm.errors.student_code} />}
                      </div>

                      <div className="md:col-span-1">
                        <InputLabel value={t('الرقم المدني *')} className="mb-2 text-slate-500 text-xs font-black uppercase tracking-widest" />
                        <TextInput value={studentForm.data.national_id} onChange={e => studentForm.setData('national_id', e.target.value)} required className="w-full bg-slate-900/50 border-slate-800 text-white rounded-2xl h-[55px] font-black text-lg focus:bg-slate-900 transition-all font-mono" placeholder="10xxxxxxxxx" />
                        {studentForm.errors.national_id && <InputError message={studentForm.errors.national_id} />}
                      </div>

                      <div className="md:col-span-1">
                        <InputLabel value={t('Gender *')} className="mb-2 text-slate-500 text-xs font-black uppercase tracking-widest" />
                        <div className="relative" dir={isRtl ? 'rtl' : 'ltr'}>
                          <select
                            value={studentForm.data.gender}
                            onChange={e => studentForm.setData('gender', e.target.value)} 
                            required
                            className="w-full bg-slate-900/50 dark:bg-slate-900/50 border border-slate-800 dark:border-slate-700 text-white dark:text-white rounded-2xl h-[55px] px-6 font-black focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 appearance-none transition-all cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: isRtl ? 'left 1rem center' : 'right 1rem center',
                              backgroundSize: '1.5rem',
                            }}
                          >
                            <option value="" className="bg-slate-900 text-white">{t('Select Gender...')}</option>
                            <option value="male" className="bg-slate-900 text-white">{t('Male')}</option>
                            <option value="female" className="bg-slate-900 text-white">{t('Female')}</option>
                          </select>
                        </div>
                        {studentForm.errors.gender && <InputError message={studentForm.errors.gender} />}
                      </div>

                      {/* Student Photo */}
                      <div className="md:col-span-2">
                        <InputLabel value={t('Student Photo')} className="mb-6 text-slate-500 text-xs font-black uppercase tracking-widest text-center" />
                        <div className="border-2 border-dashed border-slate-800 dark:border-slate-700 rounded-3xl p-12 flex flex-col items-center justify-center gap-6 hover:border-blue-600 dark:hover:border-blue-500 transition-all group cursor-pointer relative overflow-hidden bg-slate-950/20 dark:bg-slate-900/20 shadow-inner">
                          {studentForm.data.image ? (
                            <div className="flex flex-col items-center animate-fadeIn">
                              <div className="w-40 h-52 rounded-2xl overflow-hidden border-4 border-slate-800 dark:border-slate-700 shadow-2xl shadow-black group-hover:scale-105 transition-transform">
                                {/* @ts-ignore */}
                                <img src={URL.createObjectURL(studentForm.data.image)} className="w-full h-full object-cover" />
                              </div>
                              <div className="mt-4 flex gap-3">
                                <p className="text-white dark:text-white font-black text-sm">{studentForm.data.image.name}</p>
                                <button type="button" onClick={() => studentForm.setData('image', null)} className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1 rounded-lg text-[10px] font-black transition-all">✕ {t('Remove')}</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-24 h-24 bg-slate-900 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-4xl grayscale transition-transform group-hover:scale-110 shadow-lg">👤</div>
                              <div className="text-center">
                                <p className="text-white dark:text-white font-black text-lg tracking-tight">{t('Click to upload student photo')}</p>
                                <p className="text-slate-600 dark:text-slate-500 text-xs mt-2 font-bold uppercase tracking-widest italic opacity-50">PNG, JPG up to 5MB</p>
                              </div>
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => studentForm.setData('image', e.target.files?.[0] || null)} />
                            </>
                          )}
                        </div>
                        {studentForm.errors.image && <InputError message={studentForm.errors.image} />}
                      </div>

                      {/* Selection Fields - At the End for Better UX */}
                      <div className="md:col-span-2 pt-6 border-t border-slate-800 dark:border-slate-700 mt-4">
                        <h4 className="text-slate-400 dark:text-slate-500 text-sm font-black uppercase tracking-widest mb-6 text-center">{t('Academic Assignment')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Class Selection */}
                          <div>
                            <InputLabel value={t('Class *')} className="mb-2 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest" />
                            <div className="relative" dir={isRtl ? 'rtl' : 'ltr'}>
                              <select
                                value={studentForm.data.classroom_id}
                                onChange={e => studentForm.setData('classroom_id', e.target.value)} 
                                required 
                                className="w-full bg-slate-900/50 dark:bg-slate-900/50 border border-slate-800 dark:border-slate-700 text-white dark:text-white rounded-2xl h-[55px] px-6 font-black focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 appearance-none transition-all cursor-pointer"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: isRtl ? 'left 1rem center' : 'right 1rem center',
                                  backgroundSize: '1.5rem',
                                }}
                              >
                                <option value="" className="bg-slate-900 dark:bg-slate-950 text-white dark:text-white">{t('Select Class...')}</option>
                                {classrooms.map(c => <option key={c.id} value={c.id} className="bg-slate-900 dark:bg-slate-950 text-white dark:text-white">{c.name}</option>)}
                              </select>
                            </div>
                            {studentForm.errors.classroom_id && <InputError message={studentForm.errors.classroom_id} />}
                          </div>

                          {/* Supervisor Selection */}
                          <div>
                            <InputLabel value={t('Supervisor')} className="mb-2 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest" />
                            <div className="relative" dir={isRtl ? 'rtl' : 'ltr'}>
                              <select
                                value={studentForm.data.supervisor_id}
                                onChange={e => studentForm.setData('supervisor_id', e.target.value)} 
                                className="w-full bg-slate-900/50 dark:bg-slate-900/50 border border-slate-800 dark:border-slate-700 text-white dark:text-white rounded-2xl h-[55px] px-6 font-black focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 appearance-none transition-all cursor-pointer"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23ffffff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: isRtl ? 'left 1rem center' : 'right 1rem center',
                                  backgroundSize: '1.5rem',
                                }}
                              >
                                <option value="" className="bg-slate-900 dark:bg-slate-950 text-white dark:text-white">{t('Select Supervisor...')}</option>
                                {supervisors.map(s => <option key={s.id} value={s.id} className="bg-slate-900 dark:bg-slate-950 text-white dark:text-white">{s.name}</option>)}
                              </select>
                            </div>
                            {studentForm.errors.supervisor_id && <InputError message={studentForm.errors.supervisor_id} />}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-10 border-t border-slate-900">
                      <button onClick={closeModal} type="button" className="px-10 py-5 text-slate-500 hover:text-white font-black transition-all uppercase tracking-widest text-xs">
                        {t('Cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={studentForm.processing || !selectedGuardian}
                        className="flex-1 h-[70px] bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-xl transition-all shadow-2xl shadow-blue-600/30 transform active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest"
                      >
                        {studentForm.processing ? t('Saving...') : (isEditing ? t('Update Student') : t('Enroll Student'))}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fadeIn">
          <div className="bg-slate-950 rounded-[2.5rem] shadow-[0_0_100px_rgba(239,68,68,0.2)] max-w-md w-full p-12 border border-red-500/20 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />

            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mb-8 animate-pulse shadow-inner">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <h3 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">{t('Delete Student?')}</h3>
              <p className="text-slate-400 mb-12 leading-relaxed font-medium">
                {t('This will permanently delete this student record and all associated enrollment data.')}
                <span className="block text-red-500 mt-4 font-black uppercase text-xs tracking-widest animate-pulse">{t('Action cannot be undone')}</span>
              </p>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-5 text-slate-500 hover:text-white font-black transition-all uppercase text-xs tracking-widest"
                >
                  {t('No, Keep It')}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-2xl shadow-red-600/40 transition-all transform active:scale-95 text-xs uppercase tracking-widest"
                >
                  {t('Yes, Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SchoolAuthenticatedLayout>
  );
}
