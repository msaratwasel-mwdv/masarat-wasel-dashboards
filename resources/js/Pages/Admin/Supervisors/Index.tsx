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

interface Supervisor {
  id: number;
  name: string;
  name_en: string | null;
  email: string;
  phone: string;
  national_id: string;
  user_code: string;
  school_id: number | null;
  supervisor_profile: {
    emergency_contact_name: string;
    emergency_contact_phone: string;
    status: string;
  } | null;
  image?: string | null;
  assigned_bus: AssignedBus | null;
}

type FilterType = "all" | "assigned" | "available";

export default function SupervisorsIndex({
  supervisors,
}: {
  supervisors: Supervisor[];
}) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
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
      emergency_contact_name: "",
      emergency_contact_phone: "",
      status: "Trainee",
      image: null as File | null,
    });

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    reset();
    setData("_method", "post");
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (sup: Supervisor) => {
    setIsEditing(true);
    setCurrentId(sup.id);
    setData({
      _method: "put",
      name: sup.name,
      name_en: sup.name_en || "",
      national_id: sup.national_id || "",
      email: sup.email,
      phone: sup.phone || "",
      emergency_contact_name:
        sup.supervisor_profile?.emergency_contact_name || "",
      emergency_contact_phone:
        sup.supervisor_profile?.emergency_contact_phone || "",
      status: sup.supervisor_profile?.status || "Trainee",
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
    if (isEditing && currentId) {
      post(route("admin.supervisors.update", currentId), {
        forceFormData: true,
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("admin.supervisors.store"), { onSuccess: () => closeModal() });
    }
  };

  const deleteSupervisor = (id: number) => {
    if (confirm(isRTL ? "هل أنت متأكد؟" : "Are you sure?")) {
      router.delete(route("admin.supervisors.destroy", id));
    }
  };

  // ---- فلترة + بحث ----
  const filtered = useMemo(() => {
    let list = supervisors;
    if (filter === "assigned")
      list = list.filter((s) => s.assigned_bus !== null);
    if (filter === "available")
      list = list.filter((s) => s.assigned_bus === null);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.name_en?.toLowerCase().includes(q) ?? false) ||
          s.national_id?.includes(q) ||
          s.phone?.includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.user_code?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [supervisors, filter, search]);

  const counts = useMemo(
    () => ({
      all: supervisors.length,
      assigned: supervisors.filter((s) => s.assigned_bus !== null).length,
      available: supervisors.filter((s) => s.assigned_bus === null).length,
    }),
    [supervisors]
  );

  const filterBtnClass = (f: FilterType) =>
    `px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
      filter === f
        ? "bg-brand-dark text-white border-brand-dark shadow"
        : isDark
        ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
    }`;

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      Active: "نشط",
      Trainee: "متدرب",
      "On Leave": "إجازة",
      Inactive: "غير نشط",
    };
    return isRTL ? map[status] || status : status;
  };

  return (
    <AuthenticatedLayout
      header={
        <h2
          className={`font-bold text-xl ${
            isDark ? "text-gray-200" : "text-gray-800"
          }`}
        >
          {isRTL ? "إدارة المشرفين" : "Supervisors Management"}
        </h2>
      }
    >
      <Head title={isRTL ? "المشرفين" : "Supervisors"} />

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
                {isRTL ? "مشرفو الحافلات" : "Bus Supervisors"}
              </h1>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {isRTL
                  ? `${counts.all} مشرف — ${counts.assigned} محجوز — ${counts.available} متاح`
                  : `${counts.all} total — ${counts.assigned} assigned — ${counts.available} available`}
              </p>
            </div>
            <PrimaryButton
              onClick={openAddModal}
              className="bg-brand-yellow text-brand-dark hover:bg-yellow-500"
            >
              {isRTL ? "+ إضافة مشرف جديد" : "+ Add New Supervisor"}
            </PrimaryButton>
          </div>

          {/* Controls */}
          <div
            className={`flex flex-col sm:flex-row gap-3 ${
              isRTL ? "sm:flex-row-reverse" : ""
            }`}
          >
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
                      isRTL ? "المشرف" : "Supervisor",
                      isRTL ? "الهوية / الكود" : "ID / Code",
                      isRTL ? "الاتصال" : "Contact",
                      isRTL ? "اتصال الطوارئ" : "Emergency",
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
                        {isRTL ? "لا يوجد مشرفين." : "No supervisors found."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((sup) => {
                      const isAssigned = sup.assigned_bus !== null;
                      return (
                        <tr
                          key={sup.id}
                          className={`${
                            isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                          } transition ${
                            isAssigned
                              ? isDark
                                ? "border-l-2 border-purple-500"
                                : "border-l-2 border-purple-400"
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
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm overflow-hidden ring-2 ring-offset-1 ring-purple-200">
                                {sup.image ? (
                                  <img
                                    src={`/storage/${sup.image}`}
                                    alt={sup.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  sup.name.charAt(0)
                                )}
                              </div>
                              <div className={isRTL ? "text-right" : ""}>
                                <div
                                  className={`text-sm font-semibold ${
                                    isDark ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {sup.name}
                                </div>
                                {sup.name_en && (
                                  <div
                                    className={`text-xs ${
                                      isDark ? "text-gray-400" : "text-gray-400"
                                    }`}
                                  >
                                    {sup.name_en}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* ID + Code */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div
                              className={`text-sm font-mono font-medium ${
                                isDark ? "text-gray-300" : "text-gray-800"
                              }`}
                            >
                              {sup.national_id || "—"}
                            </div>
                            <div
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              {sup.user_code}
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div
                              className={`text-sm ${
                                isDark ? "text-gray-300" : "text-gray-800"
                              }`}
                            >
                              {sup.phone}
                            </div>
                            <div
                              className={`text-xs truncate max-w-[160px] ${
                                isDark ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              {sup.email}
                            </div>
                          </td>

                          {/* Emergency */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div
                              className={`text-sm ${
                                isDark ? "text-gray-300" : "text-gray-800"
                              }`}
                            >
                              {sup.supervisor_profile?.emergency_contact_name ||
                                "—"}
                            </div>
                            <div
                              className={`text-xs ${
                                isDark ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              {sup.supervisor_profile
                                ?.emergency_contact_phone || ""}
                            </div>
                          </td>

                          {/* Assigned Bus */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isAssigned ? (
                              <div>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                                    isDark
                                      ? "bg-purple-900/30 text-purple-300 border border-purple-700"
                                      : "bg-purple-100 text-purple-700 border border-purple-200"
                                  }`}
                                >
                                  🚌 {sup.assigned_bus!.bus_code}
                                </span>
                                {sup.assigned_bus!.school && (
                                  <div
                                    className={`text-xs mt-0.5 ${
                                      isDark ? "text-gray-400" : "text-gray-500"
                                    }`}
                                  >
                                    🏫 {sup.assigned_bus!.school.name}
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
                                sup.supervisor_profile?.status === "Active"
                                  ? isDark
                                    ? "bg-green-900/30 text-green-400"
                                    : "bg-green-100 text-green-800"
                                  : isDark
                                  ? "bg-gray-700 text-gray-400"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {statusLabel(
                                sup.supervisor_profile?.status || "Trainee"
                              )}
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
                                onClick={() => openEditModal(sup)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                  isDark
                                    ? "bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/60"
                                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                }`}
                              >
                                {isRTL ? "تعديل" : "Edit"}
                              </button>
                              <button
                                onClick={() => deleteSupervisor(sup.id)}
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
                ? "تعديل بيانات المشرف"
                : "Edit Supervisor"
              : isRTL
              ? "تسجيل مشرف جديد"
              : "New Supervisor"}
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
                  className="mt-1 block w-full"
                  dir="ltr"
                />
                <InputError message={errors.name_en} className="mt-2" />
              </div>
            </div>
            <div className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
              <div className={isRTL ? "text-right" : ""}>
                <InputLabel
                  htmlFor="national_id"
                  value={isRTL ? "الرقم الوطني" : "National ID"}
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
                value={isRTL ? "البريد الإلكتروني" : "Email"}
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
            {/* Emergency Contact */}
            <div
              className={`p-4 rounded-lg border ${
                isDark
                  ? "bg-purple-900/20 border-purple-800"
                  : "bg-purple-50 border-purple-100"
              }`}
            >
              <h3
                className={`text-xs font-bold uppercase tracking-wide mb-3 ${
                  isDark ? "text-purple-400" : "text-purple-700"
                } ${isRTL ? "text-right" : ""}`}
              >
                {isRTL ? "بيانات الطوارئ" : "Emergency Contact"}
              </h3>
              <div className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel
                    htmlFor="ec_name"
                    value={isRTL ? "اسم جهة الاتصال" : "Contact Name"}
                  />
                  <TextInput
                    id="ec_name"
                    value={data.emergency_contact_name}
                    onChange={(e) =>
                      setData("emergency_contact_name", e.target.value)
                    }
                    className={`mt-1 block w-full ${
                      isDark ? "bg-gray-700 border-gray-600 text-white" : ""
                    }`}
                  />
                  <InputError
                    message={errors.emergency_contact_name}
                    className="mt-2"
                  />
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel
                    htmlFor="ec_phone"
                    value={isRTL ? "رقم هاتف الطوارئ" : "Contact Phone"}
                  />
                  <TextInput
                    id="ec_phone"
                    value={data.emergency_contact_phone}
                    onChange={(e) =>
                      setData("emergency_contact_phone", e.target.value)
                    }
                    className={`mt-1 block w-full ${
                      isDark ? "bg-gray-700 border-gray-600 text-white" : ""
                    }`}
                  />
                  <InputError
                    message={errors.emergency_contact_phone}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
            {isEditing && (
              <div className={isRTL ? "text-right" : ""}>
                <InputLabel
                  htmlFor="status"
                  value={isRTL ? "الحالة" : "Status"}
                />
                <select
                  id="status"
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    isDark
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "border-gray-300"
                  }`}
                  value={data.status}
                  onChange={(e) => setData("status", e.target.value)}
                >
                  <option value="Trainee">{isRTL ? "متدرب" : "Trainee"}</option>
                  <option value="Active">{isRTL ? "نشط" : "Active"}</option>
                  <option value="On Leave">
                    {isRTL ? "في إجازة" : "On Leave"}
                  </option>
                  <option value="Inactive">
                    {isRTL ? "غير نشط" : "Inactive"}
                  </option>
                </select>
              </div>
            )}
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
                    ? "تحديث المشرف"
                    : "Update Supervisor"
                  : isRTL
                  ? "حفظ المشرف"
                  : "Save Supervisor"}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </Modal>
    </AuthenticatedLayout>
  );
}
