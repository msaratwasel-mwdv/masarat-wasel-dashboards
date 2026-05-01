import React, { useEffect, useMemo, useState } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { User, Classroom } from "@/types";
import useTranslation from "@/hooks/useTranslation";

interface Guardian {
  id: number;
  name: string;
  national_id: string;
  phone: string;
  email?: string | null;
}

interface Supervisor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface Bus {
  id: number;
  bus_number: string;
  plate_number: string;
}

interface Props {
  auth: { user: User };
  classrooms: Classroom[];
  buses?: Bus[];
  guardianResult?: {
    found: boolean;
    guardian: Guardian | null;
  } | null;
}

export default function CreateStudent({
  auth,
  classrooms,
  buses = [],
  guardianResult,
}: Props) {
  const { t, isRtl } = useTranslation();

  // ---------- Step state ----------
  const [step, setStep] = useState<1 | 2>(guardianResult?.found ? 2 : 1);

  const selectedGuardian: Guardian | null = useMemo(() => {
    return guardianResult?.found ? (guardianResult.guardian as any) : null;
  }, [guardianResult]);

  // ---------- Guardian search form ----------
  const guardianSearch = useForm({ national_id: "" });

  const onSearchGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    guardianSearch.post(route("school.guardians.search"), {
      preserveScroll: true,
      onSuccess: () => {
        // page will re-render with guardianResult
      },
    });
  };

  // ---------- Guardian create form (only when not found) ----------
  const guardianCreate = useForm({
    name: "",
    name_en: "",
    national_id: guardianSearch.data.national_id || "",
    phone: "",
    email: "",
    address: "",
    home_number: "",
    preferred_language: "ar",
    image: null as File | null,
  });

  // Update create form national_id if search result changes (and not found)
  useEffect(() => {
    if (!guardianResult?.found && guardianSearch.data.national_id) {
      guardianCreate.setData("national_id", guardianSearch.data.national_id);
    }
  }, [guardianResult, guardianSearch.data.national_id]);

  const onCreateGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    guardianCreate.post(route("school.guardians.store"), {
      preserveScroll: true,
    });
  };

  const handleGuardianImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      guardianCreate.setData("image", file);
    }
  };

  // ---------- Student form (step 2) ----------
  const studentForm = useForm({
    first_name_ar: "",
    second_name_ar: "",
    third_name_ar: "",
    last_name_ar: "",
    first_name_en: "",
    second_name_en: "",
    third_name_en: "",
    last_name_en: "",
    student_code: "",
    national_id: "",
    classroom_id: "",
    guardian_id: selectedGuardian?.id || "",
    forth_bus_id: "",
    back_bus_id: "",
    gender: "",
    image: null as File | null,
  });

  const onSubmitStudent = (e: React.FormEvent) => {
    e.preventDefault();
    studentForm.post(route("school.students.store"));
  };

  const handleStudentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      studentForm.setData("image", file);
    }
  };

  // keep guardian_id in sync if guardianResult comes from server
  useEffect(() => {
    if (selectedGuardian) {
      setStep(2);
      studentForm.setData("guardian_id", selectedGuardian.id as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGuardian?.id]);

  return (
    <SchoolAuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {t("Enroll Student")}
        </h2>
      }
    >
      <Head title={t("Enroll Student")} />

      <div className="max-w-4xl mx-auto">
        <div className="p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 dark:border-gray-700 shadow-xl rounded-2xl transition-all duration-300">
          {/* ------------ Step indicator ------------ */}
          <div className="flex items-center gap-4 pb-6 mb-8 border-b border-gray-200 dark:border-gray-700">
            <div
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                step === 1
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 shadow-md transform scale-105"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              1. {t("Search Guardian")}
            </div>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-2"></div>
            <div
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                step === 2
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 shadow-md transform scale-105"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              }`}
            >
              2. {t("Student Details")}
            </div>
          </div>

          {/* ------------ STEP 1: GUARDIAN ------------ */}
          {step === 1 && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  {t("Guardian Verification")}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("Search by name, National ID or Father ID...")}
                </p>
              </div>

              <form
                onSubmit={onSearchGuardian}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="flex-1">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("National ID")}
                  </label>
                  <input
                    value={guardianSearch.data.national_id}
                    onChange={(e) =>
                      guardianSearch.setData("national_id", e.target.value)
                    }
                    className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4"
                    placeholder="10xxxxxxxxx"
                    required
                  />
                  {guardianSearch.errors.national_id && (
                    <div className="mt-1 text-xs font-medium text-red-500">
                      {guardianSearch.errors.national_id}
                    </div>
                  )}
                </div>

                <div className="sm:self-end">
                  <button
                    type="submit"
                    disabled={guardianSearch.processing}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 font-bold transition-all disabled:opacity-50"
                  >
                    {guardianSearch.processing ? t("Loading") : t("Search")}
                  </button>
                </div>
              </form>

              {/* --- Search Result Logic --- */}
              {guardianResult && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {guardianResult.found && guardianResult.guardian ? (
                    <div className="p-6 border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800 rounded-2xl flex items-center justify-between shadow-sm">
                      <div>
                        <div className="text-lg font-bold text-green-800 dark:text-green-400">
                          ✓ {t("Guardian Found")}
                        </div>
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                          <div>
                            <span className="font-semibold">{t("Name")}:</span>{" "}
                            {guardianResult.guardian.name}
                          </div>
                          <div>
                            <span className="font-semibold">{t("Phone")}:</span>{" "}
                            {guardianResult.guardian.phone}
                          </div>
                          <div>
                            <span className="font-semibold">
                              {t("National ID")}:
                            </span>{" "}
                            {guardianResult.guardian.national_id}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-6 py-3 text-sm text-white bg-green-600 dark:bg-green-700 rounded-xl hover:bg-green-700 dark:hover:bg-green-600 font-bold shadow-lg shadow-green-500/20 transition-all"
                      >
                        {t("Select Guardian & Continue")}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800 rounded-xl">
                        <div className="text-sm font-bold text-yellow-800 dark:text-yellow-400">
                          ! {t("Guardian Not Found")}
                        </div>
                        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-500">
                          {t(
                            "No guardian was found with this national ID. Create a new guardian below"
                          )}
                        </p>
                      </div>

                      {/* --- Create Guardian Form --- */}
                      <div className="p-6 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <h4 className="text-md font-bold text-gray-800 dark:text-white mb-4">
                          {t("Create New Guardian")}
                        </h4>

                        <form
                          onSubmit={onCreateGuardian}
                          className="grid grid-cols-1 md:grid-cols-2 gap-5"
                        >
                          <div className="md:col-span-2">
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("Guardian Name (Arabic)")}
                            </label>
                            <input
                              value={guardianCreate.data.name}
                              onChange={(e) =>
                                guardianCreate.setData("name", e.target.value)
                              }
                              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 focus:ring-blue-500 dark:text-white"
                              required
                              placeholder={t("Guardian Name (Arabic)")}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("Guardian Name (English)")}
                            </label>
                            <input
                              value={guardianCreate.data.name_en}
                              onChange={(e) =>
                                guardianCreate.setData(
                                  "name_en",
                                  e.target.value
                                )
                              }
                              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 focus:ring-blue-500 dark:text-white"
                              placeholder={t("Guardian Name (English)")}
                            />
                          </div>

                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("National ID")}
                            </label>
                            <input
                              value={guardianCreate.data.national_id}
                              onChange={(e) =>
                                guardianCreate.setData(
                                  "national_id",
                                  e.target.value
                                )
                              }
                              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 focus:ring-blue-500 dark:text-white"
                              required
                              readOnly
                            />
                          </div>

                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("Phone")}
                            </label>
                            <input
                              value={guardianCreate.data.phone}
                              onChange={(e) =>
                                guardianCreate.setData("phone", e.target.value)
                              }
                              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 focus:ring-blue-500 dark:text-white"
                              required
                              placeholder="+968..."
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("Email")} ({t("Optional")})
                            </label>
                            <input
                              type="email"
                              value={guardianCreate.data.email}
                              onChange={(e) =>
                                guardianCreate.setData("email", e.target.value)
                              }
                              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 focus:ring-blue-500 dark:text-white"
                              placeholder="example@mail.com"
                            />
                          </div>

                          {/* Address Fields */}
                          <div className="md:col-span-2 grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("Address")}
                              </label>
                              <input
                                value={guardianCreate.data.address}
                                onChange={(e) =>
                                  guardianCreate.setData(
                                    "address",
                                    e.target.value
                                  )
                                }
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 focus:ring-blue-500 dark:text-white"
                                placeholder={t("City, District, Street...")}
                              />
                            </div>
                            <div>
                              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t("Home Number")}
                              </label>
                              <input
                                value={guardianCreate.data.home_number}
                                onChange={(e) =>
                                  guardianCreate.setData(
                                    "home_number",
                                    e.target.value
                                  )
                                }
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl py-3 px-4 focus:ring-blue-500 dark:text-white"
                                placeholder="123"
                              />
                            </div>
                          </div>

                          {/* Guardian Image Upload */}
                          <div className="md:col-span-2">
                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t("Guardian Photo")} ({t("Optional")})
                            </label>
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleGuardianImageChange}
                                className="hidden"
                                id="guardian-image-upload"
                              />
                              <label
                                htmlFor="guardian-image-upload"
                                className="cursor-pointer"
                              >
                                {guardianCreate.data.image ? (
                                  <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                                    <div className="w-24 h-32 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-sm shrink-0 border border-gray-300 dark:border-gray-600">
                                      <img
                                        src={URL.createObjectURL(
                                          guardianCreate.data.image
                                        )}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                      <p className="font-bold text-gray-800 dark:text-white truncate">
                                        {guardianCreate.data.image.name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {(
                                          guardianCreate.data.image.size / 1024
                                        ).toFixed(2)}{" "}
                                        KB
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          guardianCreate.setData("image", null);
                                        }}
                                        className="mt-2 text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                                      >
                                        🗑️ {t("Delete")}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="text-4xl mb-2">📷</div>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">
                                      {t("Click to upload guardian photo")}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      PNG, JPG, JPEG up to 5MB
                                    </p>
                                  </div>
                                )}
                              </label>
                            </div>
                            {guardianCreate.errors.image && (
                              <div className="mt-1 text-xs font-medium text-red-500">
                                {guardianCreate.errors.image}
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-2 pt-2">
                            <button
                              type="submit"
                              disabled={guardianCreate.processing}
                              className="w-full py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 font-bold hover:bg-blue-700 transition"
                            >
                              {guardianCreate.processing
                                ? t("Saving...")
                                : t("Create Guardian")}
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

          {/* ------------ STEP 2: STUDENT ------------ */}
          {step === 2 && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  {t("Student Information")}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("Enter student full name")}
                </p>
              </div>

              {/* Guarding Summary Card */}
              {selectedGuardian ? (
                <div className="p-4 border border-blue-100 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="text-xs uppercase font-bold text-blue-500 dark:text-blue-300 tracking-wider mb-1">
                      {t("Guardian")}
                    </div>
                    <div className="font-bold text-slate-800 dark:text-gray-200">
                      {selectedGuardian.name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-gray-400">
                      {selectedGuardian.national_id}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t("Change")}
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center text-red-500 bg-red-50 rounded-xl dark:bg-red-900/10 dark:text-red-400">
                  {t("Guardian Not Found")} - {t("Please complete Step 1")}
                </div>
              )}

              <form onSubmit={onSubmitStudent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            {studentForm.errors[fieldName] && (
                              <div className="mt-1 text-xs font-medium text-red-500">{studentForm.errors[fieldName]}</div>
                            )}
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
                              placeholder={`${part} Name`}
                            />
                            {studentForm.errors[fieldName] && (
                              <div className="mt-1 text-xs font-medium text-red-500">{studentForm.errors[fieldName]}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("Student ID")} / {t("Code")} *
                    </label>
                    <input
                      value={studentForm.data.student_code}
                      onChange={(e) =>
                        studentForm.setData("student_code", e.target.value)
                      }
                      className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4"
                      required
                      placeholder={t("Student ID")}
                    />
                    {studentForm.errors.student_code && (
                      <div className="mt-1 text-xs font-medium text-red-500">
                        {studentForm.errors.student_code}
                      </div>
                    )}
                  </div>

                  {/* حقل الجنس - قائمة منسدلة */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("Gender")} *
                    </label>
                    <select
                      value={studentForm.data.gender}
                      onChange={(e) =>
                        studentForm.setData("gender", e.target.value)
                      }
                      className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4"
                      required
                    >
                      <option value="" disabled>
                        {t("Select gender...")}
                      </option>
                      <option value="male">{t("Male")}</option>
                      <option value="female">{t("Female")}</option>
                    </select>
                    {studentForm.errors.gender && (
                      <div className="mt-1 text-xs font-medium text-red-500">
                        {studentForm.errors.gender}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("National ID")} *
                    </label>
                    <input
                      value={studentForm.data.national_id}
                      onChange={(e) =>
                        studentForm.setData("national_id", e.target.value)
                      }
                      className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4"
                      required
                      placeholder={t("National ID")}
                    />
                    {studentForm.errors.national_id && (
                      <div className="mt-1 text-xs font-medium text-red-500">
                        {studentForm.errors.national_id}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("Class")}
                    </label>
                    <select
                      value={studentForm.data.classroom_id}
                      onChange={(e) =>
                        studentForm.setData("classroom_id", e.target.value)
                      }
                      className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:text-white py-3 px-4"
                    >
                      <option value="">
                        {t("Select a class...")}
                      </option>
                      {classrooms.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {studentForm.errors.classroom_id && (
                      <div className="mt-1 text-xs font-medium text-red-500">
                        {studentForm.errors.classroom_id}
                      </div>
                    )}
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
                        {studentForm.errors.forth_bus_id && (
                          <div className="mt-1 text-xs font-medium text-red-500">
                            {studentForm.errors.forth_bus_id}
                          </div>
                        )}
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
                        {studentForm.errors.back_bus_id && (
                          <div className="mt-1 text-xs font-medium text-red-500">
                            {studentForm.errors.back_bus_id}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Student Image Upload */}
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("Student Photo")} ({t("Optional")})
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStudentImageChange}
                        className="hidden"
                        id="student-image-upload"
                      />
                      <label
                        htmlFor="student-image-upload"
                        className="cursor-pointer"
                      >
                        {studentForm.data.image ? (
                          <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                            <div className="w-32 h-40 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-md shrink-0">
                              <img
                                src={URL.createObjectURL(
                                  studentForm.data.image
                                )}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-left flex-1 min-w-0 pt-2">
                              <p className="font-bold text-gray-800 dark:text-white truncate">
                                {studentForm.data.image.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {(studentForm.data.image.size / 1024).toFixed(
                                  2
                                )}{" "}
                                KB
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  studentForm.setData("image", null);
                                }}
                                className="mt-3 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                              >
                                {t("Remove")} ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-4xl mb-2">👤</div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                              {t("Click to upload student photo")}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              PNG, JPG, JPEG up to 5MB
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                    {studentForm.errors.image && (
                      <div className="mt-1 text-xs font-medium text-red-500">
                        {studentForm.errors.image}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4 space-x-4">
                  <Link
                    href={route("school.students.index")}
                    className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300 transition bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-bold"
                  >
                    {t("Cancel")}
                  </Link>
                  <button
                    type="submit"
                    disabled={studentForm.processing || !selectedGuardian}
                    className="px-8 py-3 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/30 font-bold transition-all disabled:opacity-50"
                  >
                    {studentForm.processing
                      ? t("Saving...")
                      : t("Enroll Student")}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </SchoolAuthenticatedLayout>
  );
}
