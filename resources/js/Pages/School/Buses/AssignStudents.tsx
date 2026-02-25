import React, { useState, useEffect, useMemo } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import useTranslation from "@/hooks/useTranslation";

interface BusGroup {
  id: number;
  name: string;
  bus: {
    capacity: number;
  };
}

interface Student {
  id: number;
  name: string;
  student_code: string;
  national_id: string;
  gender: string;
  morning_group_id?: number | null;
  afternoon_group_id?: number | null;
}

interface PageProps {
  groups: BusGroup[];
  students: Student[];
  selectedGroupId?: string | number;
  flash?: {
    success?: string;
    error?: string;
  };
}

export default function AssignStudents() {
  const {
    auth,
    groups,
    students,
    selectedGroupId: initialGroupId,
    flash,
  } = usePage().props as unknown as PageProps & { auth: any };
  const { t, isRtl } = useTranslation();

  const [selectedGroupId, setSelectedGroupId] = useState<number | "">(
    initialGroupId
      ? Number(initialGroupId)
      : groups.length > 0
      ? groups[0].id
      : ""
  );
  const [selectedMorningStudents, setSelectedMorningStudents] = useState<
    number[]
  >([]);
  const [selectedAfternoonStudents, setSelectedAfternoonStudents] = useState<
    number[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selected students when the selected group changes
  useEffect(() => {
    if (selectedGroupId) {
      const assignedMorning = students
        .filter((s) => s.morning_group_id === selectedGroupId)
        .map((s) => s.id);

      const assignedAfternoon = students
        .filter((s) => s.afternoon_group_id === selectedGroupId)
        .map((s) => s.id);

      setSelectedMorningStudents(assignedMorning);
      setSelectedAfternoonStudents(assignedAfternoon);
    } else {
      setSelectedMorningStudents([]);
      setSelectedAfternoonStudents([]);
    }
  }, [selectedGroupId, students]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId),
    [groups, selectedGroupId]
  );

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        student.name.toLowerCase().includes(searchLower) ||
        (student.student_code &&
          student.student_code.toLowerCase().includes(searchLower)) ||
        (student.national_id &&
          student.national_id.toLowerCase().includes(searchLower))
      );
    });
  }, [students, searchQuery]);

  const toggleMorningStudent = (studentId: number) => {
    setSelectedMorningStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAfternoonStudent = (studentId: number) => {
    setSelectedAfternoonStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const isAllMorningSelected =
    filteredStudents.length > 0 &&
    selectedMorningStudents.length === filteredStudents.length;
  const isAllAfternoonSelected =
    filteredStudents.length > 0 &&
    selectedAfternoonStudents.length === filteredStudents.length;

  const toggleAllMorning = () => {
    if (isAllMorningSelected) {
      setSelectedMorningStudents([]);
    } else {
      setSelectedMorningStudents(filteredStudents.map((s) => s.id));
    }
  };

  const toggleAllAfternoon = () => {
    if (isAllAfternoonSelected) {
      setSelectedAfternoonStudents([]);
    } else {
      setSelectedAfternoonStudents(filteredStudents.map((s) => s.id));
    }
  };

  // Combine unique students for capacity counting
  const totalUniqueSelected = useMemo(() => {
    return Array.from(
      new Set([...selectedMorningStudents, ...selectedAfternoonStudents])
    ).length;
  }, [selectedMorningStudents, selectedAfternoonStudents]);

  const handleSave = () => {
    if (!selectedGroupId) return;
    setIsSubmitting(true);
    router.post(
      route("school.buses.students.save"),
      {
        group_id: selectedGroupId,
        morning_student_ids: selectedMorningStudents,
        afternoon_student_ids: selectedAfternoonStudents,
      },
      {
        onFinish: () => setIsSubmitting(false),
      }
    );
  };

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
          {t("Assign Bus Students")} 🚌
        </h2>
      }
    >
      <Head title={t("Assign Bus Students")} />

      <div className="p-6 mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {t("Assign Bus Students")}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("Select a group and assign students to it easily")}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={selectedGroupId}
              onChange={(e) =>
                setSelectedGroupId(e.target.value ? Number(e.target.value) : "")
              }
              className="bg-white border text-sm rounded-xl focus:ring-brand-yellow focus:border-brand-yellow dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-white px-4 py-2 min-w-[200px]"
            >
              <option value="">{t("Select Group")}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleSave}
              disabled={!selectedGroupId || isSubmitting}
              className="flex items-center gap-2 px-6 py-2 text-sm font-bold transition-all shadow-lg rounded-xl bg-brand-yellow text-slate-900 shadow-brand-yellow/20 hover:shadow-brand-yellow/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {t("Save Changes")}
            </button>
          </div>
        </div>

        {flash?.success && (
          <div className="p-4 mb-6 border rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400">
            {flash.success}
          </div>
        )}

        {/* Main Content Area */}
        {selectedGroupId ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Summary Widget */}
            <div className="lg:col-span-1">
              <div className="sticky p-6 bg-white border shadow-sm top-24 rounded-2xl dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <h3 className="mb-4 text-lg font-bold text-slate-800 dark:text-white">
                  {t("Group Overview")}
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      {t("Capacity")}
                    </p>
                    <p className="mt-1 text-xl font-black text-slate-800 dark:text-white">
                      {selectedGroup?.bus?.capacity ?? 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      {t("Assigned Students")}
                    </p>
                    <div className="flex items-end gap-2 mt-1">
                      <p
                        className={`text-xl font-black ${
                          selectedGroup?.bus?.capacity &&
                          totalUniqueSelected > selectedGroup.bus.capacity
                            ? "text-red-500"
                            : "text-brand-yellow"
                        }`}
                      >
                        {totalUniqueSelected}
                      </p>
                      <p className="pb-1 text-xs font-medium text-slate-500">
                        / {selectedGroup?.bus?.capacity ?? 0}
                      </p>
                    </div>
                  </div>

                  {selectedGroup?.bus?.capacity &&
                  totalUniqueSelected > selectedGroup.bus.capacity ? (
                    <div className="p-3 mt-4 border rounded-xl bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">
                      <p className="text-xs font-bold">
                        {t("Warning: Bus is over capacity!")}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="lg:col-span-3">
              <div className="p-6 bg-white border shadow-sm rounded-2xl dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="flex flex-col justify-between gap-4 mb-6 md:flex-row md:items-center">
                  <div className="relative flex-1 max-w-md">
                    <svg
                      className={`absolute w-5 h-5 text-slate-400 top-1/2 -translate-y-1/2 ${
                        isRtl ? "right-3" : "left-3"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("Search by name or national ID...")}
                      className={`w-full py-2 ${
                        isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
                      } text-sm bg-slate-50 border rounded-xl focus:ring-brand-yellow focus:border-brand-yellow dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 dark:text-white`}
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={toggleAllMorning}
                      className="text-sm font-bold text-brand-yellow hover:text-yellow-600"
                    >
                      {isAllMorningSelected
                        ? t("Unselect All Morning")
                        : t("Select All Morning")}
                    </button>
                    <button
                      onClick={toggleAllAfternoon}
                      className="text-sm font-bold text-brand-yellow hover:text-yellow-600"
                    >
                      {isAllAfternoonSelected
                        ? t("Unselect All Afternoon")
                        : t("Select All Afternoon")}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const isMorningSelected =
                        selectedMorningStudents.includes(student.id);
                      const isAfternoonSelected =
                        selectedAfternoonStudents.includes(student.id);
                      const isEitherSelected =
                        isMorningSelected || isAfternoonSelected;

                      return (
                        <div
                          key={student.id}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all flex flex-col gap-3
                            ${
                              isEitherSelected
                                ? "border-brand-yellow bg-brand-yellow/5 dark:bg-brand-yellow/10"
                                : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-800"
                            }
                          `}
                        >
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white text-md line-clamp-1">
                              {student.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {t("ID")}: {student.national_id || "-"}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isMorningSelected}
                                  onChange={() =>
                                    toggleMorningStudent(student.id)
                                  }
                                  className="w-5 h-5 rounded border-slate-300 text-brand-yellow focus:ring-brand-yellow cursor-pointer"
                                />
                              </div>
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-brand-yellow transition-colors">
                                {t("TripMorning")} 🌅
                              </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer group">
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isAfternoonSelected}
                                  onChange={() =>
                                    toggleAfternoonStudent(student.id)
                                  }
                                  className="w-5 h-5 rounded border-slate-300 text-brand-yellow focus:ring-brand-yellow cursor-pointer"
                                />
                              </div>
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-brand-yellow transition-colors">
                                {t("TripAfternoon")} 🌇
                              </span>
                            </label>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center col-span-full text-slate-500">
                      {t("No students found")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center bg-white border border-dashed rounded-2xl dark:bg-slate-900 border-slate-300 dark:border-slate-700">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              {t("No Group Selected")}
            </h3>
            <p className="text-slate-500">
              {t(
                "Please select a group from the dropdown above to manage its students."
              )}
            </p>
          </div>
        )}
      </div>
    </SchoolAuthenticatedLayout>
  );
}
