import React, { useState, useCallback } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { User, Classroom } from "@/types";
import useTranslation from "@/hooks/useTranslation";
import { debounce } from "lodash";

interface Guardian {
  id: number;
  name: string;
  name_en?: string;
  phone?: string;
  national_id?: string;
  address?: string;
  image?: string;
}

interface Supervisor {
  id: number;
  name: string;
}

interface Student {
  id: number;
  full_name: string;
  student_code: string;
  national_id?: string;
  gender?: string;
  image?: string;
  is_active: boolean;
  guardian?: Guardian | null;
  supervisor?: Supervisor | null;
  current_enrollment: {
    classroom: Classroom;
  } | null;
}

interface Props {
  auth: { user: User };
  students: Student[];
  filters?: { search?: string };
}

export default function IndexStudents({ auth, students, filters }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(filters?.search || "");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Search debounce
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      router.get(
        route("school.students.index"),
        { search: query },
        { preserveState: true, preserveScroll: true }
      );
    }, 500),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const confirmDelete = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (studentToDelete) {
      router.delete(route("school.students.destroy", studentToDelete.id), {
        onSuccess: () => {
          setShowDeleteModal(false);
          setStudentToDelete(null);
        },
      });
    }
  };

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">
          {t('Students Directory')}
        </h2>
      }
    >
      <Head title={t('Students')} />

      <div className="max-w-full overflow-hidden p-4 sm:p-6 lg:p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 dark:border-gray-700 shadow-xl rounded-2xl transition-all duration-300">

        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
            {t('Students List')}
          </h3>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder={t('Search by Name, ID...')}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/50 dark:bg-gray-900/50 focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>

            <Link
              href={route("school.students.create")}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 whitespace-nowrap"
            >
              + {t('Enroll New Student')}
            </Link>
          </div>
        </div>

        {/* Mobile & Tablet Card View (hidden on xl screens) */}
        <div className="xl:hidden space-y-4">
          {students.length > 0 ? (
            students.map((student) => (
              <div key={student.id} className="bg-white dark:bg-gray-900/50 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Student Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-5 border-b-2 border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-32 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-500 shadow-lg flex-shrink-0 relative group">
                      {student.image ? (
                        <img src={`/storage/${student.image}`} alt="Student" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">👤</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1 truncate">{student.full_name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md font-mono font-semibold">
                          {student.student_code}
                        </span>
                        {student.gender && (
                          <span className={`px-2 py-1 rounded-md font-semibold ${student.gender === 'male' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'}`}>
                            {student.gender === 'male' ? '♂ ' + t('Male') : '♀ ' + t('Female')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Details Grid */}
                <div className="p-5 bg-white dark:bg-gray-800/50">
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('Civil ID')}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.national_id || '-'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('Class')}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.current_enrollment?.classroom?.name || '-'}</p>
                    </div>
                  </div>

                  {student.supervisor && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-5">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('Supervisor')}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.supervisor.name}</p>
                    </div>
                  )}
                </div>

                {/* Guardian Section */}
                {student.guardian && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700/50 dark:to-gray-600/50 p-5 border-t-2 border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-20 h-24 rounded-xl overflow-hidden bg-white dark:bg-gray-700 border-2 border-white dark:border-gray-500 shadow-md flex-shrink-0 relative">
                        {student.guardian.image ? (
                          <img src={`/storage/${student.guardian.image}`} alt="Guardian" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">👤</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{t('Guardian Name')}</p>
                        <p className="font-bold text-lg text-gray-900 dark:text-white truncate">{student.guardian.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('Guardian ID')}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{student.guardian.national_id || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('Guardian Phone')}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white direction-ltr">{student.guardian.phone || '-'}</p>
                      </div>
                    </div>

                    {student.guardian.address && (
                      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('Address')}</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{student.guardian.address}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t-2 border-gray-200 dark:border-gray-700 flex gap-3">
                  <Link
                    href={route("school.students.edit", student.id)}
                    className="flex-1 text-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    ✏️ {t('Edit')}
                  </Link>
                  <button
                    onClick={() => confirmDelete(student)}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold uppercase rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    🗑️ {t('Delete')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
              <span className="text-6xl text-gray-300 dark:text-gray-600 block mb-3">📭</span>
              <p className="text-lg font-semibold text-gray-400 dark:text-gray-500">{t('No Data Found')}</p>
            </div>
          )}
        </div>

        {/* Desktop Table View (hidden on smaller screens, shown on xl+) */}
        <div className="hidden xl:block overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
          <table className="min-w-full text-start bg-white dark:bg-gray-800 table-fixed">
            <thead className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {/* 1. Student Name */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-start w-[140px]">
                  {t('Student Name')}
                </th>
                {/* 2. Student Code */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-start w-[80px]">
                  {t('Code')}
                </th>
                {/* 3. Student National ID */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-start w-[100px]">
                  {t('Civil ID')}
                </th>
                {/* 4. Student Gender */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-start w-[70px]">
                  {t('Gender')}
                </th>
                {/* 5. Student Image */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-center w-[60px]">
                  {t('Photo')}
                </th>
                {/* 6. Class */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-start w-[100px]">
                  {t('Class')}
                </th>
                {/* 7. Supervisor */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-start w-[120px]">
                  {t('Supervisor')}
                </th>
                {/* 8. Guardian Name */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-start w-[140px]">
                  {t('Guardian Name')}
                </th>
                {/* 9. Guardian National ID */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-start w-[100px]">
                  {t('Guardian ID')}
                </th>
                {/* 10. Guardian Phone */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-start w-[100px]">
                  {t('Guardian Phone')}
                </th>
                {/* 11. Guardian Address */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-start w-[140px]">
                  {t('Address')}
                </th>
                {/* 12. Guardian Image */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-center w-[60px]">
                  {t('G. Photo')}
                </th>
                {/* 13. Actions */}
                <th className="px-2 py-2 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-end w-[140px] sticky right-0 bg-gray-100 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
                  {t('Actions')}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {/* 1. Student Name */}
                    <td className="px-2 py-2 align-middle">
                      <p className="font-semibold text-[11px] text-gray-900 dark:text-white truncate" title={student.full_name}>
                        {student.full_name}
                      </p>
                    </td>

                    {/* 2. Student Code */}
                    <td className="px-2 py-2 align-middle">
                      <p className="font-mono text-[10px] font-medium text-gray-600 dark:text-gray-300">
                        {student.student_code}
                      </p>
                    </td>

                    {/* 3. Student National ID */}
                    <td className="px-2 py-2 align-middle">
                      <p className="text-[10px] text-gray-600 dark:text-gray-300 truncate" title={student.national_id || ""}>
                        {student.national_id || "-"}
                      </p>
                    </td>

                    {/* 4. Gender */}
                    <td className="px-2 py-2 align-middle">
                      <div className="flex items-center gap-1">
                        {student.gender === 'male' ? (
                          <>
                            <span className="text-blue-500 text-sm">♂</span>
                            <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">{t('Male')}</span>
                          </>
                        ) : student.gender === 'female' ? (
                          <>
                            <span className="text-pink-500 text-sm">♀</span>
                            <span className="text-[10px] font-semibold text-pink-700 dark:text-pink-300">{t('Female')}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* 5. Student Image */}
                    <td className="px-2 py-2 align-middle text-center">
                      <div className="w-12 h-16 mx-auto rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm relative group">
                        {student.image ? (
                          <img src={`/storage/${student.image}`} alt="Student" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">👤</div>
                        )}
                      </div>
                    </td>

                    {/* 6. Class */}
                    <td className="px-2 py-2 align-middle">
                      <p className="text-[10px] font-medium text-gray-600 dark:text-gray-300 truncate" title={student.current_enrollment?.classroom?.name || ""}>
                        {student.current_enrollment?.classroom?.name || "-"}
                      </p>
                    </td>

                    {/* 7. Supervisor */}
                    <td className="px-2 py-2 align-middle">
                      <p className="text-[10px] text-gray-600 dark:text-gray-300 truncate" title={student.supervisor?.name || ""}>
                        {student.supervisor?.name || "-"}
                      </p>
                    </td>

                    {/* 8. Guardian Name */}
                    <td className="px-2 py-2 align-middle">
                      <p className="font-medium text-[10px] text-gray-700 dark:text-gray-200 truncate" title={student.guardian?.name || ""}>
                        {student.guardian?.name || "-"}
                      </p>
                    </td>

                    {/* 9. Guardian National ID */}
                    <td className="px-2 py-2 align-middle">
                      <p className="text-[10px] text-gray-600 dark:text-gray-300 truncate" title={student.guardian?.national_id || ""}>
                        {student.guardian?.national_id || "-"}
                      </p>
                    </td>

                    {/* 10. Guardian Phone */}
                    <td className="px-2 py-2 align-middle">
                      <p className="text-[10px] text-gray-600 dark:text-gray-300 direction-ltr">
                        {student.guardian?.phone || "-"}
                      </p>
                    </td>

                    {/* 11. Guardian Address */}
                    <td className="px-2 py-2 align-middle">
                      <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate" title={student.guardian?.address || ""}>
                        {student.guardian?.address || "-"}
                      </p>
                    </td>

                    {/* 12. Guardian Image */}
                    <td className="px-2 py-2 align-middle text-center">
                      <div className="w-12 h-16 mx-auto rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm relative group">
                        {student.guardian?.image ? (
                          <img src={`/storage/${student.guardian.image}`} alt="Guardian" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">👤</div>
                        )}
                      </div>
                    </td>

                    {/* 13. Actions */}
                    <td className="px-2 py-2 text-end align-middle sticky right-0 bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={route("school.students.edit", student.id)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded transition-colors"
                        >
                          {t('Edit')}
                        </Link>

                        <button
                          onClick={() => confirmDelete(student)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold rounded transition-colors"
                        >
                          {t('Delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={13} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl text-gray-300 dark:text-gray-600">📭</span>
                        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">{t('No Data Found')}</p>
                      </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
              {t('Are you sure you want to delete this student? This action cannot be undone.')}
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
