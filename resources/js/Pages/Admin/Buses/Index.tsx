import { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import BusMediaGallery from "@/Components/BusMediaGallery";
import { useTheme } from "@/Contexts/ThemeContext";

interface User {
  id: number;
  name: string;
}

interface School {
  id: number;
  name: string;
}

interface BusDocument {
  id: number;
  type: string;
  file_path: string;
}

interface Bus {
  id: number;
  bus_code: string;
  plate_number: string;
  model: string;
  year: number;
  capacity: number;
  status: "active" | "maintenance" | "out_of_service" | "inactive";
  qr_code_path: string | null;
  school_id: number | null;
  driver_id: number | null;
  supervisor_id: number | null;
  driver?: User;
  supervisor?: User;
  school?: School;
  documents?: BusDocument[];
  deactivation_reason?: string;
}

interface Props {
  buses: Bus[];
  availableDrivers: User[];
  availableSupervisors: User[];
  schools: School[];
}

export default function Index({
  buses,
  availableDrivers,
  availableSupervisors,
  schools,
}: Props) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  // --- 2. Smart Stats Calculation ---
  const stats = useMemo(() => {
    return {
      total: buses.length,
      active: buses.filter((b) => b.status === "active").length,
      maintenance: buses.filter((b) => b.status === "maintenance").length,
      assigned: buses.filter((b) => b.school_id !== null).length,
    };
  }, [buses]);

  // --- 3. State Management ---
  const [modalState, setModalState] = useState<{
    type: "add" | "edit" | "view" | "assign" | "archive" | null;
    bus: Bus | null;
  }>({ type: null, bus: null });

  // --- 4. Forms ---
  const busForm = useForm({
    plate_number: "",
    model: "",
    year: new Date().getFullYear(),
    capacity: 25,
    status: "active",
    driver_id: "",
    supervisor_id: "",
    photos: [] as File[],
    registration_file: null as File | null,
  });
  const assignForm = useForm({ school_id: "" });
  const archiveForm = useForm({ deactivation_reason: "" });

  // --- 5. Handlers ---
  const closeModal = () => {
    setModalState({ type: null, bus: null });
    busForm.reset();
    assignForm.reset();
    archiveForm.reset();
  };

  const openModal = (
    type: "add" | "edit" | "view" | "assign" | "archive",
    bus: Bus | null = null
  ) => {
    setModalState({ type, bus });
    if (type === "edit" && bus) {
      busForm.setData({
        plate_number: bus.plate_number,
        model: bus.model,
        year: bus.year,
        capacity: bus.capacity,
        status: bus.status as any,
        driver_id: bus.driver_id?.toString() || "",
        supervisor_id: bus.supervisor_id?.toString() || "",
        photos: [],
        registration_file: null,
      });
    }
    if (type === "assign" && bus) {
      assignForm.setData("school_id", bus.school_id?.toString() || "");
    }
    if (type === "archive" && bus) {
      archiveForm.setData("deactivation_reason", bus.deactivation_reason || "");
    }
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalState.type === "add") {
      busForm.post(route("admin.buses.store"), { onSuccess: closeModal });
    } else if (modalState.type === "edit" && modalState.bus) {
      // Use POST with _method=put to emulate PUT for multipart/form-data
      busForm.transform((data) => ({
        ...data,
        _method: "put",
      }));
      busForm.post(route("admin.buses.update", modalState.bus.id), {
        onSuccess: closeModal,
      });
    } else if (modalState.type === "assign" && modalState.bus) {
      assignForm.post(route("admin.buses.assign", modalState.bus.id), {
        onSuccess: closeModal,
      });
    } else if (modalState.type === "archive" && modalState.bus) {
      archiveForm.post(route("admin.buses.archive", modalState.bus.id), {
        onSuccess: closeModal,
      });
    }
  };

  // --- قائمة السائقين للعرض في نافذة التعديل ---
  // تشمل السائقين المتاحين + السائق الحالي للباص المُعدَّل (إن وجد)
  const editDriverOptions = useMemo(() => {
    if (modalState.type !== "edit" || !modalState.bus) return availableDrivers;
    const currentDriver = modalState.bus.driver;
    if (!currentDriver) return availableDrivers;
    // أضف السائق الحالي فقط إذا لم يكن موجوداً في القائمة
    const alreadyIn = availableDrivers.some((d) => d.id === currentDriver.id);
    return alreadyIn ? availableDrivers : [currentDriver, ...availableDrivers];
  }, [modalState, availableDrivers]);

  // --- قائمة المشرفين للعرض في نافذة التعديل ---
  const editSupervisorOptions = useMemo(() => {
    if (modalState.type !== "edit" || !modalState.bus)
      return availableSupervisors;
    const currentSupervisor = modalState.bus.supervisor;
    if (!currentSupervisor) return availableSupervisors;
    const alreadyIn = availableSupervisors.some(
      (s) => s.id === currentSupervisor.id
    );
    return alreadyIn
      ? availableSupervisors
      : [currentSupervisor, ...availableSupervisors];
  }, [modalState, availableSupervisors]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return isDark
          ? "bg-green-900/30 text-green-400 border border-green-800"
          : "bg-green-100 text-green-800 border border-green-200";
      case "maintenance":
        return isDark
          ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
          : "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "out_of_service":
        return isDark
          ? "bg-red-900/30 text-red-400 border border-red-800"
          : "bg-red-100 text-red-800 border border-red-200";
      default:
        return isDark
          ? "bg-gray-700 text-gray-300 border border-gray-600"
          : "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2
          className={`font-semibold text-xl ${
            isDark ? "text-gray-200" : "text-gray-800"
          } leading-tight`}
        >
          {isRTL ? "إدارة أسطول الحافلات" : "Bus Fleet Management"}
        </h2>
      }
    >
      <Head title={isRTL ? "الحافلات" : "Buses"} />

      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* --- 1. DASHBOARD STATS --- */}
          <div
            className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 ${
              isRTL ? "rtl" : ""
            }`}
          >
            {[
              {
                title: isRTL ? "إجمالي الأسطول" : "Total Fleet",
                value: stats.total,
                wrapperClass:
                  "shadow-blue-500/30 bg-gradient-to-br from-blue-400 to-blue-600",
                icon: "M5 13l4 4L19 7",
              },
              {
                title: isRTL ? "عاملة حالياً" : "Active & Running",
                value: stats.active,
                wrapperClass:
                  "shadow-green-500/30 bg-gradient-to-br from-green-400 to-green-600",
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
              },
              {
                title: isRTL ? "تحت الصيانة" : "Under Maintenance",
                value: stats.maintenance,
                wrapperClass:
                  "shadow-yellow-500/30 bg-gradient-to-br from-yellow-400 to-yellow-600",
                icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
              },
              {
                title: isRTL ? "مخصصة للمدارس" : "Assigned to Schools",
                value: stats.assigned,
                wrapperClass:
                  "shadow-purple-500/30 bg-gradient-to-br from-purple-400 to-purple-600",
                icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`${
                  isDark
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                } p-4 rounded-2xl shadow-sm border flex items-center justify-between transition-all hover:shadow-md`}
              >
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {stat.title}
                  </p>
                  <p
                    className={`text-2xl font-extrabold ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${stat.wrapperClass}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={stat.icon}
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* --- 2. HEADER ACTIONS --- */}
          <div
            className={`flex flex-col md:flex-row justify-between items-center mb-6 gap-4 ${
              isRTL ? "md:flex-row-reverse" : ""
            }`}
          >
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder={
                  isRTL ? "البحث برقم اللوحة، الكود..." : "Search fleet..."
                }
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
              <svg
                className={`w-5 h-5 absolute top-2.5 ${
                  isRTL ? "right-3" : "left-3"
                } text-gray-400`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <PrimaryButton
              onClick={() => openModal("add")}
              className="bg-brand-dark px-6 py-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {isRTL ? "تسجيل حافلة جديدة" : "Register New Bus"}
              </span>
            </PrimaryButton>
          </div>

          {/* --- 3. BUSES TABLE --- */}
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } shadow-xl rounded-2xl overflow-hidden border`}
          >
            <div className="overflow-x-auto">
              <table
                className={`min-w-full divide-y ${
                  isDark ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                <thead
                  className={`${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}
                >
                  <tr>
                    <th
                      className={`px-6 py-4 text-xs font-bold ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      } uppercase tracking-wider ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {isRTL ? "معلومات الحافلة" : "Vehicle Info"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-bold ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      } uppercase tracking-wider ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {isRTL ? "الطاقم التشغيلي" : "Crew"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-bold ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      } uppercase tracking-wider ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      {isRTL ? "التعيين الحالي" : "Current Assignment"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-bold ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      } uppercase tracking-wider ${
                        isRTL ? "text-right" : "text-center"
                      }`}
                    >
                      {isRTL ? "الحالة" : "Status"}
                    </th>
                    <th
                      className={`px-6 py-4 text-xs font-bold ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      } uppercase tracking-wider ${
                        isRTL ? "text-left" : "text-right"
                      }`}
                    >
                      {isRTL ? "الإجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`${
                    isDark
                      ? "bg-gray-800 divide-gray-700"
                      : "bg-white divide-gray-200"
                  } divide-y`}
                >
                  {buses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg
                            className="w-12 h-12 mb-3 opacity-50"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="text-sm font-medium">
                            {isRTL
                              ? "لا توجد حافلات مسجلة في الأسطول."
                              : "No buses found in fleet."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    buses.map((bus) => (
                      <tr
                        key={bus.id}
                        className={`${
                          isDark
                            ? "hover:bg-gray-700/50"
                            : "hover:bg-blue-50/30"
                        } transition-colors duration-200`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`flex items-center gap-4 ${
                              isRTL ? "flex-row-reverse" : ""
                            }`}
                          >
                            <div className="flex-shrink-0 h-10 min-w-[3rem] px-2 rounded-lg bg-brand-yellow flex items-center justify-center text-brand-dark font-bold text-xs shadow-sm whitespace-nowrap">
                              {bus.bus_code}
                            </div>
                            <div className={isRTL ? "text-right" : "text-left"}>
                              <div
                                className={`text-sm font-bold ${
                                  isDark ? "text-white" : "text-gray-900"
                                } font-mono`}
                              >
                                {bus.plate_number}
                              </div>
                              <div
                                className={`text-xs ${
                                  isDark ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {bus.model} • {bus.capacity}{" "}
                                {isRTL ? "مقعد" : "Seats"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div
                              className={`flex items-center text-xs ${
                                isRTL ? "flex-row-reverse" : ""
                              }`}
                            >
                              <span
                                className={`font-bold w-16 ${
                                  isDark ? "text-gray-400" : "text-gray-500"
                                } ${isRTL ? "ml-2 text-left" : "mr-2"}`}
                              >
                                {isRTL ? ":السائق" : "Driver:"}
                              </span>
                              <span
                                className={`${
                                  bus.driver
                                    ? isDark
                                      ? "text-gray-200"
                                      : "text-gray-800"
                                    : "text-red-400 italic"
                                }`}
                              >
                                {bus.driver?.name ||
                                  (isRTL ? "غير مسند" : "Unassigned")}
                              </span>
                            </div>
                            <div
                              className={`flex items-center text-xs ${
                                isRTL ? "flex-row-reverse" : ""
                              }`}
                            >
                              <span
                                className={`font-bold w-16 ${
                                  isDark ? "text-gray-400" : "text-gray-500"
                                } ${isRTL ? "ml-2 text-left" : "mr-2"}`}
                              >
                                {isRTL ? ":المشرف" : "Super:"}
                              </span>
                              <span
                                className={`${
                                  bus.supervisor
                                    ? isDark
                                      ? "text-gray-200"
                                      : "text-gray-800"
                                    : "text-red-400 italic"
                                }`}
                              >
                                {bus.supervisor?.name ||
                                  (isRTL ? "غير مسند" : "Unassigned")}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {bus.school ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isDark
                                  ? "bg-blue-900/30 text-blue-300"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {bus.school.name}
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isDark
                                  ? "bg-gray-700 text-gray-400"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {isRTL
                                ? "المقر الرئيسي (مجمع)"
                                : "Central Pool (HQ)"}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(
                              bus.status
                            )}`}
                          >
                            {isRTL
                              ? bus.status === "active"
                                ? "نشط"
                                : bus.status === "maintenance"
                                ? "صيانة"
                                : bus.status === "inactive"
                                ? "غير نشط"
                                : "خارج الخدمة"
                              : bus.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div
                            className={`flex items-center justify-end gap-2 ${
                              isRTL ? "flex-row-reverse" : ""
                            }`}
                          >
                            <button
                              onClick={() => openModal("view", bus)}
                              className={`p-1.5 rounded-lg transition ${
                                isDark
                                  ? "text-gray-400 hover:text-blue-400 hover:bg-gray-700"
                                  : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                              }`}
                              title={isRTL ? "عرض التفاصيل" : "View Details"}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => openModal("assign", bus)}
                              className={`p-1.5 rounded-lg transition ${
                                isDark
                                  ? "text-gray-400 hover:text-purple-400 hover:bg-gray-700"
                                  : "text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                              }`}
                              title={isRTL ? "تعيين المدرسة" : "Assign School"}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => openModal("edit", bus)}
                              className={`p-1.5 rounded-lg transition ${
                                isDark
                                  ? "text-gray-400 hover:text-yellow-500 hover:bg-gray-700"
                                  : "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
                              }`}
                              title={isRTL ? "تعديل" : "Edit"}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => openModal("archive", bus)}
                              className={`p-1.5 rounded-lg transition ${
                                isDark
                                  ? "text-gray-400 hover:text-red-500 hover:bg-gray-700"
                                  : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                              }`}
                              title={isRTL ? "أرشفة" : "Archive"}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- 6. MODALS SECTION --- */}
          {modalState.type === "view" && modalState.bus && (
            <Modal show={true} onClose={closeModal} maxWidth="2xl">
              <div
                className={`overflow-hidden ${
                  isDark ? "bg-gray-800" : "bg-white"
                }`}
              >
                {/* 1. Header Card Style */}
                <div
                  className={`relative p-6 border-b ${
                    isDark
                      ? "border-gray-700 bg-gray-900/50"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div
                    className={`flex justify-between items-start ${
                      isRTL ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* Bus Identity */}
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`px-3 py-1 text-sm font-black rounded border shadow-sm ${
                            isDark
                              ? "bg-gray-800 border-gray-600 text-gray-200"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        >
                          {modalState.bus.plate_number}
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase border rounded ${getStatusStyle(
                            modalState.bus.status
                          )}`}
                        >
                          {isRTL
                            ? modalState.bus.status === "active"
                              ? "نشط"
                              : modalState.bus.status === "maintenance"
                              ? "صيانة"
                              : modalState.bus.status === "inactive"
                              ? "غير نشط"
                              : "خارج الخدمة"
                            : modalState.bus.status}
                        </span>
                      </div>
                      <h2
                        className={`text-3xl font-black tracking-tight ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        #{modalState.bus.bus_code}
                      </h2>
                      <p
                        className={`text-sm font-medium mt-1 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {modalState.bus.model} — {modalState.bus.year}
                      </p>
                    </div>

                    {/* QR Code Block */}
                    {modalState.bus.qr_code_path && (
                      <div className="flex flex-col items-center">
                        <div
                          className={`p-1 bg-white rounded border shadow-sm ${
                            isDark ? "border-gray-600" : "border-gray-200"
                          }`}
                        >
                          <img
                            src={`/storage/${modalState.bus.qr_code_path}`}
                            alt="QR"
                            className="w-20 h-20"
                          />
                        </div>
                        <a
                          href={`/storage/${modalState.bus.qr_code_path}`}
                          download
                          className="mt-2 text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wide"
                        >
                          {isRTL ? "تحميل QR" : "DOWNLOAD QR"}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Technical Specs Grid */}
                <div
                  className={`grid grid-cols-2 divide-x border-b ${
                    isDark
                      ? "divide-gray-700 border-gray-700"
                      : "divide-gray-100 border-gray-100"
                  } ${isRTL ? "rtl divide-x-reverse" : ""}`}
                >
                  <div className="p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50/5 dark:hover:bg-gray-700/20 transition">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {isRTL ? "سعة المقاعد" : "SEATING CAPACITY"}
                    </span>
                    <span
                      className={`text-xl font-black ${
                        isDark ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {modalState.bus.capacity}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50/5 dark:hover:bg-gray-700/20 transition">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {isRTL ? "سنة الصنع" : "MANUFACTURE YEAR"}
                    </span>
                    <span
                      className={`text-xl font-black ${
                        isDark ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      {modalState.bus.year}
                    </span>
                  </div>
                </div>

                {/* 3. Main Content Area */}
                <div className="p-6 space-y-8">
                  {/* Crew Assignment Section */}
                  <div>
                    <h3
                      className={`text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b ${
                        isDark
                          ? "text-gray-400 border-gray-700"
                          : "text-gray-400 border-gray-100"
                      } ${isRTL ? "text-right" : ""}`}
                    >
                      {isRTL
                        ? "جدول التعيين والتشغيل"
                        : "OPERATIONAL ASSIGNMENT"}
                    </h3>

                    <div
                      className={`grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-sm`}
                    >
                      {/* Driver */}
                      <div
                        className={`p-3 rounded border ${
                          isDark
                            ? "bg-gray-700/30 border-gray-700"
                            : "bg-gray-50 border-gray-100"
                        } ${isRTL ? "text-right" : ""}`}
                      >
                        <span
                          className={`block text-[10px] font-bold uppercase mb-1 ${
                            isDark ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {isRTL ? "السائق المعتمد" : "ASSIGNED DRIVER"}
                        </span>
                        <span
                          className={`${
                            isDark ? "text-white" : "text-gray-900"
                          } font-bold`}
                        >
                          {modalState.bus.driver?.name ||
                            (isRTL ? "— غير محدد —" : "— N/A —")}
                        </span>
                      </div>

                      {/* Supervisor */}
                      <div
                        className={`p-3 rounded border ${
                          isDark
                            ? "bg-gray-700/30 border-gray-700"
                            : "bg-gray-50 border-gray-100"
                        } ${isRTL ? "text-right" : ""}`}
                      >
                        <span
                          className={`block text-[10px] font-bold uppercase mb-1 ${
                            isDark ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {isRTL ? "المشرف المسؤول" : "SUPERVISOR"}
                        </span>
                        <span
                          className={`${
                            isDark ? "text-white" : "text-gray-900"
                          } font-bold`}
                        >
                          {modalState.bus.supervisor?.name ||
                            (isRTL ? "— غير محدد —" : "— N/A —")}
                        </span>
                      </div>

                      {/* School */}
                      <div
                        className={`p-3 rounded border ${
                          isDark
                            ? "bg-blue-900/10 border-blue-900/20"
                            : "bg-blue-50 border-blue-100"
                        } ${isRTL ? "text-right" : ""}`}
                      >
                        <span
                          className={`block text-[10px] font-bold uppercase mb-1 ${
                            isDark ? "text-blue-400" : "text-blue-400"
                          }`}
                        >
                          {isRTL ? "جهة العمل (المدرسة)" : "OPERATING ENTITY"}
                        </span>
                        <span
                          className={`${
                            isDark ? "text-blue-100" : "text-blue-900"
                          } font-bold`}
                        >
                          {modalState.bus.school?.name ||
                            (isRTL
                              ? "المقر الرئيسي (مجمع)"
                              : "CENTRAL POOL (HQ)")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Documentation */}
                  <div>
                    <h3
                      className={`text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b ${
                        isDark
                          ? "text-gray-400 border-gray-700"
                          : "text-gray-400 border-gray-100"
                      } ${isRTL ? "text-right" : ""}`}
                    >
                      {isRTL
                        ? "الأرشيف الرقمي والوثائق"
                        : "DIGITAL ARCHIVE & DOCS"}
                    </h3>
                    <BusMediaGallery documents={modalState.bus.documents} />
                  </div>
                </div>

                {/* Footer */}
                <div
                  className={`bg-gray-50 p-4 border-t flex ${
                    isRTL ? "justify-start" : "justify-end"
                  } ${
                    isDark
                      ? "bg-gray-900 border-gray-700"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <SecondaryButton onClick={closeModal} className="shadow-sm">
                    {isRTL ? "إغلاق السجل" : "CLOSE RECORD"}
                  </SecondaryButton>
                </div>
              </div>
            </Modal>
          )}

          {/* B. Add/Edit Modal */}
          <Modal
            show={modalState.type === "add" || modalState.type === "edit"}
            onClose={closeModal}
            maxWidth="3xl"
          >
            <div className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div
                className={`p-6 border-b sticky top-0 z-10 rounded-t-lg ${
                  isDark ? "bg-gray-800 border-gray-700" : "bg-white"
                }`}
              >
                <div
                  className={`flex justify-between items-center ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  <h2
                    className={`text-xl font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {modalState.type === "edit"
                      ? isRTL
                        ? "تحديث بيانات المركبة"
                        : "Update Vehicle"
                      : isRTL
                      ? "تسجيل مركبة جديدة"
                      : "Register New Vehicle"}
                  </h2>
                  {modalState.type === "edit" && (
                    <span className="text-xs font-bold text-brand-navy bg-brand-yellow/20 px-2 py-1 rounded">
                      Code: {modalState.bus?.bus_code}
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable Content */}
              <div
                className={`p-6 overflow-y-auto flex-1 ${
                  isDark ? "bg-gray-800 text-gray-200" : "bg-white"
                }`}
              >
                <form id="bus-form" onSubmit={submitForm} className="space-y-6">
                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${
                      isRTL ? "rtl" : ""
                    }`}
                  >
                    <div className={isRTL ? "text-right" : ""}>
                      <InputLabel
                        value={isRTL ? "رقم اللوحة" : "Plate Number"}
                      />
                      <TextInput
                        value={busForm.data.plate_number}
                        onChange={(e) =>
                          busForm.setData("plate_number", e.target.value)
                        }
                        className="w-full mt-1 font-mono uppercase"
                        placeholder="ABC 1234"
                      />
                      <InputError message={busForm.errors.plate_number} />
                    </div>
                    <div className={isRTL ? "text-right" : ""}>
                      <InputLabel value={isRTL ? "السعة" : "Capacity"} />
                      <TextInput
                        type="number"
                        value={busForm.data.capacity}
                        onChange={(e) =>
                          busForm.setData("capacity", Number(e.target.value))
                        }
                        className="w-full mt-1"
                      />
                      <InputError message={busForm.errors.capacity} />
                    </div>
                    <div className={isRTL ? "text-right" : ""}>
                      <InputLabel value={isRTL ? "الموديل" : "Model"} />
                      <TextInput
                        value={busForm.data.model}
                        onChange={(e) =>
                          busForm.setData("model", e.target.value)
                        }
                        className="w-full mt-1"
                      />
                      <InputError message={busForm.errors.model} />
                    </div>
                    <div className={isRTL ? "text-right" : ""}>
                      <InputLabel value={isRTL ? "سنة الصنع" : "Year"} />
                      <TextInput
                        type="number"
                        value={busForm.data.year}
                        onChange={(e) =>
                          busForm.setData("year", Number(e.target.value))
                        }
                        className="w-full mt-1"
                      />
                      <InputError message={busForm.errors.year} />
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border ${
                      isDark
                        ? "bg-blue-900/10 border-blue-900/30"
                        : "bg-blue-50/50 border-blue-100"
                    }`}
                  >
                    <h3
                      className={`text-xs font-bold uppercase mb-3 flex items-center gap-2 ${
                        isDark ? "text-blue-400" : "text-blue-800"
                      } ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      {isRTL
                        ? "تعيين الطاقم التشغيلي"
                        : "Operational Crew Assignment"}
                    </h3>
                    <div
                      className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                        isRTL ? "rtl" : ""
                      }`}
                    >
                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel value={isRTL ? "السائق" : "Driver"} />
                        <select
                          className={`w-full rounded-lg mt-1 text-sm focus:ring-brand-yellow ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "border-gray-300"
                          }`}
                          value={busForm.data.driver_id}
                          onChange={(e) =>
                            busForm.setData("driver_id", e.target.value)
                          }
                        >
                          <option value="">
                            {isRTL ? "-- غير مسند --" : "-- Unassigned --"}
                          </option>
                          {(modalState.type === "edit"
                            ? editDriverOptions
                            : availableDrivers
                          ).map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                              {modalState.bus?.driver_id === d.id
                                ? isRTL
                                  ? " (الحالي)"
                                  : " (current)"
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel value={isRTL ? "المشرف" : "Supervisor"} />
                        <select
                          className={`w-full rounded-lg mt-1 text-sm focus:ring-brand-yellow ${
                            isDark
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "border-gray-300"
                          }`}
                          value={busForm.data.supervisor_id}
                          onChange={(e) =>
                            busForm.setData("supervisor_id", e.target.value)
                          }
                        >
                          <option value="">
                            {isRTL ? "-- غير مسند --" : "-- Unassigned --"}
                          </option>
                          {(modalState.type === "edit"
                            ? editSupervisorOptions
                            : availableSupervisors
                          ).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                              {modalState.bus?.supervisor_id === s.id
                                ? isRTL
                                  ? " (الحالي)"
                                  : " (current)"
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section: Photos/Documents */}
                  <div
                    className={`border-t pt-4 ${
                      isDark ? "border-gray-700" : ""
                    }`}
                  >
                    <h3
                      className={`text-xs font-bold uppercase mb-3 ${
                        isDark ? "text-gray-400" : "text-gray-400"
                      } ${isRTL ? "text-right" : ""}`}
                    >
                      {isRTL
                        ? "وثائق وصور المركبة"
                        : "Vehicle Documentation & Photos"}
                    </h3>

                    {modalState.type === "edit" &&
                      modalState.bus?.documents &&
                      modalState.bus.documents.length > 0 && (
                        <div
                          className={`mb-4 p-4 rounded-xl border ${
                            isDark
                              ? "bg-gray-700 border-gray-600"
                              : "bg-gray-50 border-gray-100"
                          }`}
                        >
                          <p
                            className={`text-xs font-medium mb-2 ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            } ${isRTL ? "text-right" : ""}`}
                          >
                            {isRTL ? "الوسائط الحالية:" : "Current Media:"}
                          </p>
                          <BusMediaGallery
                            documents={modalState.bus.documents}
                            editable={true}
                            onDelete={(docId) => {
                              if (
                                confirm(
                                  isRTL
                                    ? "هل أنت متأكد من حذف هذا المستند؟"
                                    : "Are you sure you want to delete this document?"
                                )
                              ) {
                                router.delete(
                                  route("admin.buses.documents.destroy", docId),
                                  {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                      if (modalState.bus) {
                                        const updatedDocs =
                                          modalState.bus.documents?.filter(
                                            (d) => d.id !== docId
                                          );
                                        setModalState({
                                          ...modalState,
                                          bus: {
                                            ...modalState.bus,
                                            documents: updatedDocs,
                                          },
                                        });
                                      }
                                    },
                                  }
                                );
                              }
                            }}
                          />
                        </div>
                      )}

                    <div
                      className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                        isRTL ? "rtl" : ""
                      }`}
                    >
                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel
                          value={isRTL ? "إضافة صور جديدة" : "Add New Photos"}
                        />
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) =>
                            busForm.setData(
                              "photos",
                              Array.from(e.target.files || [])
                            )
                          }
                          className="block w-full text-sm text-gray-500 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                        />
                      </div>
                      <div className={isRTL ? "text-right" : ""}>
                        <InputLabel
                          value={
                            isRTL
                              ? "ملف الاستمارة (PDF/صورة)"
                              : "Registration File (PDF/Image)"
                          }
                        />
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) =>
                            busForm.setData(
                              "registration_file",
                              e.target.files?.[0] || null
                            )
                          }
                          className="block w-full text-sm text-gray-500 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                        />
                      </div>
                    </div>
                  </div>

                  {modalState.type === "edit" && (
                    <div
                      className={`p-4 rounded-xl border ${
                        isDark
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      <InputLabel
                        value={
                          isRTL ? "الحالة التشغيلية" : "Operational Status"
                        }
                        className={isRTL ? "text-right" : ""}
                      />
                      <select
                        className={`w-full rounded-lg mt-1 text-sm focus:ring-brand-yellow font-bold ${
                          isDark
                            ? "bg-gray-800 border-gray-600 text-white"
                            : "border-gray-300"
                        }`}
                        value={busForm.data.status}
                        onChange={(e) =>
                          busForm.setData("status", e.target.value as any)
                        }
                      >
                        <option value="active">
                          {isRTL ? "🟢 نشط" : "🟢 Active"}
                        </option>
                        <option value="maintenance">
                          {isRTL ? "🟡 صيانة" : "🟡 Maintenance"}
                        </option>
                        <option value="inactive">
                          {isRTL ? "⚪ غير نشط" : "⚪ Inactive"}
                        </option>
                        <option value="out_of_service">
                          {isRTL ? "🔴 خارج الخدمة" : "🔴 Out of Service"}
                        </option>
                      </select>
                      <InputError
                        message={busForm.errors.status}
                        className="mt-2"
                      />
                    </div>
                  )}
                </form>
              </div>

              {/* Footer */}
              <div
                className={`p-6 border-t flex gap-3 sticky bottom-0 z-10 rounded-b-lg ${
                  isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50"
                } ${isRTL ? "flex-row-reverse" : "justify-end"}`}
              >
                <SecondaryButton onClick={closeModal}>
                  {isRTL ? "إلغاء" : "Cancel"}
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                  form="bus-form"
                  disabled={busForm.processing}
                  className="bg-brand-dark"
                >
                  {modalState.type === "edit"
                    ? isRTL
                      ? "تحديث البيانات"
                      : "Update Details"
                    : isRTL
                    ? "تسجيل المركبة"
                    : "Register Vehicle"}
                </PrimaryButton>
              </div>
            </div>
          </Modal>

          {/* C. Assign Modal */}
          <Modal show={modalState.type === "assign"} onClose={closeModal}>
            <div className="p-6">
              <div className={`text-center mb-6`}>
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </div>
                <h2
                  className={`text-lg font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {isRTL ? "إدارة التعيين" : "Manage Assignment"}
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {isRTL
                    ? "تعيين هذه المركبة لمدرسة محددة أو إعادتها للمقر الرئيسي."
                    : "Assign this vehicle to a specific school or return it to the central pool."}
                </p>
              </div>
              <form onSubmit={submitForm} className="space-y-6">
                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel
                    value={isRTL ? "المدرسة المستهدفة" : "Target School"}
                  />
                  <select
                    className={`w-full rounded-lg mt-1 text-sm focus:border-green-500 focus:ring-green-500 ${
                      isDark
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "border-gray-300"
                    }`}
                    value={assignForm.data.school_id}
                    onChange={(e) =>
                      assignForm.setData("school_id", e.target.value)
                    }
                  >
                    <option value="">
                      {isRTL
                        ? "-- بدون مدرسة (المقر الرئيسي) --"
                        : "-- No School (Central Pool) --"}
                    </option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className={`flex gap-3 ${
                    isRTL ? "flex-row-reverse" : "justify-end"
                  }`}
                >
                  <SecondaryButton onClick={closeModal}>
                    {isRTL ? "إلغاء" : "Cancel"}
                  </SecondaryButton>
                  <PrimaryButton
                    className="bg-green-600 hover:bg-green-700 border-none"
                    disabled={assignForm.processing}
                  >
                    {isRTL ? "تحديث التعيين" : "Update Assignment"}
                  </PrimaryButton>
                </div>
              </form>
            </div>
          </Modal>

          {/* D. Archive Modal */}
          <Modal show={modalState.type === "archive"} onClose={closeModal}>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h2
                  className={`text-lg font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {isRTL ? "أرشفة المركبة" : "Archive Vehicle"}
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {isRTL
                    ? "هذا الإجراء سيزيل الحافلة من الخدمة النشطة. مطلوب وثائق."
                    : "This action will remove the bus from active duty. Documentation required."}
                </p>
              </div>
              <form onSubmit={submitForm} className="space-y-4">
                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel
                    value={isRTL ? "سبب الإلغاء" : "Reason for Deactivation"}
                  />
                  <select
                    className={`w-full rounded-lg mt-1 ${
                      isDark
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "border-gray-300"
                    }`}
                    value={archiveForm.data.deactivation_reason}
                    onChange={(e) =>
                      archiveForm.setData("deactivation_reason", e.target.value)
                    }
                    required
                  >
                    <option value="">
                      {isRTL ? "-- اختر السبب --" : "-- Select Reason --"}
                    </option>
                    <option value="Maintenance">
                      {isRTL ? "صيانة" : "Maintenance"}
                    </option>
                    <option value="Accident">
                      {isRTL ? "حادث" : "Accident"}
                    </option>
                    <option value="Sold">{isRTL ? "تم البيع" : "Sold"}</option>
                    <option value="Other">{isRTL ? "أخرى" : "Other"}</option>
                  </select>
                </div>
                <div
                  className={`flex gap-3 mt-6 ${
                    isRTL ? "flex-row-reverse" : "justify-end"
                  }`}
                >
                  <SecondaryButton onClick={closeModal}>
                    {isRTL ? "إلغاء" : "Cancel"}
                  </SecondaryButton>
                  <PrimaryButton
                    className="bg-red-600 hover:bg-red-700 border-none"
                    disabled={archiveForm.processing}
                  >
                    {isRTL ? "أرشفة نهائية" : "Archive Permanently"}
                  </PrimaryButton>
                </div>
              </form>
            </div>
          </Modal>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
