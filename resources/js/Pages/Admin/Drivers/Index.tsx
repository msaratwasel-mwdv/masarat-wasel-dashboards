import { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { useTheme } from "@/Contexts/ThemeContext";

interface AssignedBus {
  id: number;
  bus_code: string;
  school: { id: number; name: string } | null;
}

interface Driver {
  id: number;
  name: string;
  name_en: string | null;
  email: string;
  phone: string;
  national_id: string;
  user_code: string;
  school_id: number | null;
  driver_profile: {
    license_number: string;
    license_expiry_date: string;
    status: string;
  } | null;
  image?: string | null;
  assigned_bus: AssignedBus | null;
}

type FilterType = "all" | "assigned" | "available";

export default function DriversIndex({ drivers }: { drivers: Driver[] }) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDriverId, setCurrentDriverId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const { data, setData, post, processing, errors, reset, clearErrors } =
    useForm({
      _method: "post",
      name: "",
      name_en: "",
      national_id: "",
      email: "",
      phone: "",
      license_number: "",
      license_expiry_date: "",
      image: null as File | null,
    });

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentDriverId(null);
    reset();
    setData("_method", "post");
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setIsEditing(true);
    setCurrentDriverId(driver.id);
    setData({
      _method: "put",
      name: driver.name,
      name_en: driver.name_en || "",
      national_id: driver.national_id || "",
      email: driver.email,
      phone: driver.phone || "",
      license_number: driver.driver_profile?.license_number || "",
      license_expiry_date: driver.driver_profile?.license_expiry_date || "",
      image: null,
    });
    clearErrors();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentDriverId) {
      post(route("admin.drivers.update", currentDriverId), {
        forceFormData: true,
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("admin.drivers.store"), {
        onSuccess: () => closeModal(),
      });
    }
  };

  const deleteDriver = (driverId: number) => {
    if (confirm(isRTL ? "هل أنت متأكد من حذف هذا السائق؟" : "Are you sure?")) {
      router.delete(route("admin.drivers.destroy", driverId));
    }
  };

  // ---- فلترة + بحث ----
  const filtered = useMemo(() => {
    let list = drivers;
    if (filter === "assigned")
      list = list.filter((d) => d.assigned_bus !== null);
    if (filter === "available")
      list = list.filter((d) => d.assigned_bus === null);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.name_en?.toLowerCase().includes(q) ?? false) ||
          d.national_id?.includes(q) ||
          d.phone?.includes(q) ||
          d.email?.toLowerCase().includes(q) ||
          d.user_code?.toLowerCase().includes(q) ||
          d.driver_profile?.license_number?.includes(q)
      );
    }
    return list;
  }, [drivers, filter, search]);

  const counts = useMemo(
    () => ({
      all: drivers.length,
      assigned: drivers.filter((d) => d.assigned_bus !== null).length,
      available: drivers.filter((d) => d.assigned_bus === null).length,
    }),
    [drivers]
  );

  const filterBtnClass = (f: FilterType) =>
    `px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
      filter === f
        ? "bg-brand-dark text-white border-brand-dark shadow"
        : isDark
        ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
    }`;

  const IS_EXPIRED = (date: string) => date && new Date(date) < new Date();

  return (
    <AuthenticatedLayout
      header={
        <h2
          className={`font-bold text-xl ${
            isDark ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {isRTL ? "إدارة السائقين" : "Drivers Management"}
        </h2>
      }
    >
      <Head title={isRTL ? "السائقين" : "Drivers"} />

      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-5">
          {/* Header */}
          <div
            className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
              isRTL ? "md:flex-row-reverse" : ""
            }`}
          >
            <div className={isRTL ? "text-right" : ""}>
              <h1
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-brand-dark"
                }`}
              >
                {isRTL ? "سائقو الأسطول" : "Fleet Drivers"}
              </h1>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {isRTL
                  ? `${counts.all} سائق — ${counts.assigned} محجوز — ${counts.available} متاح`
                  : `${counts.all} total — ${counts.assigned} assigned — ${counts.available} available`}
              </p>
            </div>
            <PrimaryButton
              onClick={openAddModal}
              className="bg-brand-yellow text-brand-dark hover:bg-yellow-500"
            >
              {isRTL ? "+ إضافة سائق جديد" : "+ Add New Driver"}
            </PrimaryButton>
          </div>

          {/* Controls: Filter + Search */}
          <div
            className={`flex flex-col sm:flex-row gap-3 ${
              isRTL ? "sm:flex-row-reverse" : ""
            }`}
          >
            {/* Filter Pills */}
            <div className="flex gap-2">
              <button
                className={filterBtnClass("all")}
                onClick={() => setFilter("all")}
              >
                {isRTL ? "الكل" : "All"} ({counts.all})
              </button>
              <button
                className={filterBtnClass("available")}
                onClick={() => setFilter("available")}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />
                {isRTL ? "متاح" : "Available"} ({counts.available})
              </button>
              <button
                className={filterBtnClass("assigned")}
                onClick={() => setFilter("assigned")}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1" />
                {isRTL ? "محجوز" : "Assigned"} ({counts.assigned})
              </button>
            </div>
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <svg
                className={`w-4 h-4 absolute top-2.5 ${
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
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isRTL
                    ? "بحث بالاسم، الهوية، الهاتف..."
                    : "Search name, ID, phone..."
                }
                className={`w-full ${
                  isRTL ? "pr-9 pl-4" : "pl-9 pr-4"
                } py-2 text-sm rounded-lg border focus:ring-2 focus:ring-brand-dark focus:border-transparent transition ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    : "bg-white border-gray-200"
                }`}
              />
            </div>
          </div>

          {/* Table */}
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } overflow-hidden shadow-sm sm:rounded-2xl border`}
          >
            <div className="overflow-x-auto">
              <table
                className={`min-w-full divide-y ${
                  isDark ? "divide-gray-700" : "divide-gray-200"
                }`}
              >
                <thead className={isDark ? "bg-gray-900/50" : "bg-gray-50"}>
                  <tr>
                    {[
                      isRTL ? "السائق" : "Driver",
                      isRTL ? "الهوية / الكود" : "ID / Code",
                      isRTL ? "الاتصال" : "Contact",
                      isRTL ? "الرخصة" : "License",
                      isRTL ? "الباص المُعيَّن" : "Assigned Bus",
                      isRTL ? "الحالة" : "Status",
                      isRTL ? "الإجراءات" : "Actions",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-4 py-3 text-xs font-bold ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        } uppercase tracking-wider ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className={`${
                    isDark
                      ? "bg-gray-800 divide-gray-700"
                      : "bg-white divide-gray-200"
                  } divide-y`}
                >
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className={`px-6 py-10 text-center ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {isRTL ? "لا يوجد سائقين." : "No drivers found."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((driver) => {
                      const isAssigned = driver.assigned_bus !== null;
                      const licExpired = IS_EXPIRED(
                        driver.driver_profile?.license_expiry_date || ""
                      );
                      return (
                        <tr
                          key={driver.id}
                          className={`${
                            isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                          } transition ${
                            isAssigned
                              ? isDark
                                ? "border-l-2 border-orange-500"
                                : "border-l-2 border-orange-400"
                              : ""
                          }`}
                        >
                          {/* Avatar + Name */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div
                              className={`flex items-center gap-3 ${
                                isRTL ? "flex-row-reverse" : ""
                              }`}
                            >
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold text-sm overflow-hidden ring-2 ring-offset-1 ring-brand-dark/10">
                                {driver.image ? (
                                  <img
                                    src={`/storage/${driver.image}`}
                                    alt={driver.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  driver.name.charAt(0)
                                )}
                              </div>
                              <div className={isRTL ? "text-right" : ""}>
                                <div
                                  className={`text-sm font-semibold ${
                                    isDark ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {driver.name}
                                </div>
                                {driver.name_en && (
                                  <div
                                    className={`text-xs ${
                                      isDark ? "text-gray-400" : "text-gray-400"
                                    }`}
                                  >
                                    {driver.name_en}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* National ID + Code */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div
                              className={`text-sm font-mono font-medium ${
                                isDark ? "text-gray-300" : "text-gray-800"
                              }`}
                            >
                              {driver.national_id || "—"}
                            </div>
                            <div
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              {driver.user_code}
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div
                              className={`text-sm ${
                                isDark ? "text-gray-300" : "text-gray-800"
                              }`}
                            >
                              {driver.phone}
                            </div>
                            <div
                              className={`text-xs truncate max-w-[160px] ${
                                isDark ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              {driver.email}
                            </div>
                          </td>

                          {/* License */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div
                              className={`text-sm font-mono ${
                                isDark ? "text-gray-300" : "text-gray-800"
                              }`}
                            >
                              {driver.driver_profile?.license_number || "—"}
                            </div>
                            <div
                              className={`text-xs font-medium ${
                                licExpired
                                  ? "text-red-500"
                                  : isDark
                                  ? "text-gray-500"
                                  : "text-gray-400"
                              }`}
                            >
                              {driver.driver_profile?.license_expiry_date
                                ? (licExpired ? "⚠ " : "") +
                                  (isRTL ? "ينتهي: " : "Exp: ") +
                                  driver.driver_profile.license_expiry_date
                                : "—"}
                            </div>
                          </td>

                          {/* Assigned Bus */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isAssigned ? (
                              <div>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                    isDark
                                      ? "bg-orange-900/30 text-orange-300 border border-orange-700"
                                      : "bg-orange-100 text-orange-700 border border-orange-200"
                                  }`}
                                >
                                  🚌 {driver.assigned_bus!.bus_code}
                                </span>
                                {driver.assigned_bus!.school && (
                                  <div
                                    className={`text-xs mt-0.5 ${
                                      isDark ? "text-gray-400" : "text-gray-500"
                                    }`}
                                  >
                                    🏫 {driver.assigned_bus!.school.name}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  isDark
                                    ? "bg-green-900/20 text-green-400 border border-green-800"
                                    : "bg-green-50 text-green-700 border border-green-200"
                                }`}
                              >
                                {isRTL ? "متاح" : "Available"}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                                driver.driver_profile?.status === "Active"
                                  ? isDark
                                    ? "bg-green-900/30 text-green-400"
                                    : "bg-green-100 text-green-800"
                                  : isDark
                                  ? "bg-yellow-900/30 text-yellow-400"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {isRTL
                                ? driver.driver_profile?.status === "Active"
                                  ? "نشط"
                                  : driver.driver_profile?.status || "غير محدد"
                                : driver.driver_profile?.status || "N/A"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                              isRTL ? "text-left" : "text-right"
                            }`}
                          >
                            <div
                              className={`flex gap-2 ${
                                isRTL ? "justify-start" : "justify-end"
                              }`}
                            >
                              <button
                                onClick={() => openEditModal(driver)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                  isDark
                                    ? "bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/60"
                                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                }`}
                              >
                                {isRTL ? "تعديل" : "Edit"}
                              </button>
                              <button
                                onClick={() => deleteDriver(driver.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                  isDark
                                    ? "bg-red-900/30 text-red-400 hover:bg-red-900/60"
                                    : "bg-red-50 text-red-700 hover:bg-red-100"
                                }`}
                              >
                                {isRTL ? "حذف" : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal show={isModalOpen} onClose={closeModal}>
        <div
          className={`p-6 ${isDark ? "bg-gray-800 text-gray-200" : "bg-white"}`}
        >
          <h2
            className={`text-lg font-medium mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            } ${isRTL ? "text-right" : ""}`}
          >
            {isEditing
              ? isRTL
                ? "تعديل بيانات السائق"
                : "Edit Driver Details"
              : isRTL
              ? "تسجيل سائق جديد"
              : "Register New Driver"}
          </h2>
          <form onSubmit={submit} className="space-y-4">
            <div className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
              <div className={isRTL ? "text-right" : ""}>
                <InputLabel
                  htmlFor="name"
                  value={isRTL ? "الاسم الكامل (عربي)" : "Full Name (Arabic)"}
                />
                <TextInput
                  id="name"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  className="mt-1 block w-full"
                />
                <InputError message={errors.name} className="mt-2" />
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <InputLabel
                  htmlFor="name_en"
                  value={isRTL ? "الاسم بالإنجليزية" : "English Name"}
                />
                <TextInput
                  id="name_en"
                  value={data.name_en}
                  onChange={(e) => setData("name_en", e.target.value)}
                  className="mt-1 block w-full text-left"
                  dir="ltr"
                />
                <InputError message={errors.name_en} className="mt-2" />
              </div>
            </div>
            <div className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
              <div className={isRTL ? "text-right" : ""}>
                <InputLabel
                  htmlFor="national_id"
                  value={isRTL ? "رقم الهوية" : "National ID"}
                />
                <TextInput
                  id="national_id"
                  value={data.national_id}
                  onChange={(e) => setData("national_id", e.target.value)}
                  className="mt-1 block w-full"
                />
                <InputError message={errors.national_id} className="mt-2" />
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <InputLabel
                  htmlFor="phone"
                  value={isRTL ? "رقم الهاتف" : "Phone Number"}
                />
                <TextInput
                  id="phone"
                  value={data.phone}
                  onChange={(e) => setData("phone", e.target.value)}
                  className="mt-1 block w-full"
                />
                <InputError message={errors.phone} className="mt-2" />
              </div>
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <InputLabel
                htmlFor="email"
                value={isRTL ? "البريد الإلكتروني" : "Email Address"}
              />
              <TextInput
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData("email", e.target.value)}
                className="mt-1 block w-full"
              />
              <InputError message={errors.email} className="mt-2" />
            </div>
            <div className={isRTL ? "text-right" : ""}>
              <InputLabel
                value={isRTL ? "الصورة الشخصية" : "Profile Picture"}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setData("image", e.target.files?.[0] || null)}
                className={`mt-1 block w-full text-sm ${
                  isDark
                    ? "text-gray-400 file:bg-gray-700 file:text-gray-200"
                    : "text-gray-500 file:bg-indigo-50 file:text-indigo-700"
                } file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold`}
              />
              <InputError message={errors.image} className="mt-2" />
            </div>
            <div
              className={`grid grid-cols-2 gap-4 p-3 rounded-lg border ${
                isDark
                  ? "bg-gray-700 border-gray-600"
                  : "bg-gray-50 border-gray-200"
              } ${isRTL ? "rtl" : ""}`}
            >
              <div className={isRTL ? "text-right" : ""}>
                <InputLabel
                  htmlFor="license_number"
                  value={isRTL ? "رقم الرخصة" : "License Number"}
                />
                <TextInput
                  id="license_number"
                  value={data.license_number}
                  onChange={(e) => setData("license_number", e.target.value)}
                  className={`mt-1 block w-full ${
                    isDark ? "border-gray-600 bg-gray-800" : ""
                  }`}
                />
                <InputError message={errors.license_number} className="mt-2" />
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <InputLabel
                  htmlFor="license_expiry_date"
                  value={isRTL ? "تاريخ الانتهاء" : "Expiry Date"}
                />
                <TextInput
                  id="license_expiry_date"
                  type="date"
                  value={data.license_expiry_date}
                  onChange={(e) =>
                    setData("license_expiry_date", e.target.value)
                  }
                  className={`mt-1 block w-full ${
                    isDark ? "border-gray-600 bg-gray-800" : ""
                  }`}
                />
                <InputError
                  message={errors.license_expiry_date}
                  className="mt-2"
                />
              </div>
            </div>
            <div
              className={`mt-6 flex gap-3 ${
                isRTL ? "flex-row-reverse" : "justify-end"
              }`}
            >
              <SecondaryButton onClick={closeModal}>
                {isRTL ? "إلغاء" : "Cancel"}
              </SecondaryButton>
              <PrimaryButton disabled={processing} className="bg-brand-dark">
                {isEditing
                  ? isRTL
                    ? "تحديث السائق"
                    : "Update Driver"
                  : isRTL
                  ? "حفظ السائق"
                  : "Save Driver"}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
