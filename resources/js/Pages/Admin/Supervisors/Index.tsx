import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { useTheme } from "@/Contexts/ThemeContext";

// تعريف نوع البيانات
interface Supervisor {
  id: number;
  name: string;
  email: string;
  phone: string;
  user_code: string;
  supervisor_profile: {
    emergency_contact_name: string;
    emergency_contact_phone: string;
    status: string;
  } | null;
}

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

  const { data, setData, post, put, processing, errors, reset, clearErrors } =
    useForm({
      name: "",
      email: "",
      phone: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      status: "Trainee", // Default
    });

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    reset();
    clearErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (sup: Supervisor) => {
    setIsEditing(true);
    setCurrentId(sup.id);
    setData({
      name: sup.name,
      email: sup.email,
      phone: sup.phone || "",
      emergency_contact_name:
        sup.supervisor_profile?.emergency_contact_name || "",
      emergency_contact_phone:
        sup.supervisor_profile?.emergency_contact_phone || "",
      status: sup.supervisor_profile?.status || "Trainee",
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
      put(route("admin.supervisors.update", currentId), {
        onSuccess: () => closeModal(),
      });
    } else {
      post(route("admin.supervisors.store"), {
        onSuccess: () => closeModal(),
      });
    }
  };

  const deleteSupervisor = (id: number) => {
    if (
      confirm(
        isRTL
          ? "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء."
          : "Are you sure? This action cannot be undone."
      )
    ) {
      router.delete(route("admin.supervisors.destroy", id));
    }
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
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div
            className={`flex justify-between items-center mb-6 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <div className={isRTL ? "text-right" : ""}>
              <h1
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-brand-dark"
                }`}
              >
                {isRTL ? "مشرفي الحافلات" : "Bus Supervisors"}
              </h1>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {isRTL
                  ? "إدارة المشرفين وبيانات الطوارئ."
                  : "Manage supervisors and emergency contacts."}
              </p>
            </div>
            <PrimaryButton
              onClick={openAddModal}
              className="bg-brand-yellow text-brand-dark hover:bg-yellow-500"
            >
              {isRTL ? "+ إضافة مشرف جديد" : "+ Add New Supervisor"}
            </PrimaryButton>
          </div>

          {/* Table */}
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-100"
            } overflow-hidden shadow-sm sm:rounded-2xl border`}
          >
            <table
              className={`min-w-full divide-y ${
                isDark ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              <thead className={`${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}>
                <tr>
                  <th
                    className={`px-6 py-3 text-xs font-bold ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    } uppercase tracking-wider ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {isRTL ? "المشرف" : "Supervisor"}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-bold ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    } uppercase tracking-wider ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {isRTL ? "الاتصال" : "Contact"}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-bold ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    } uppercase tracking-wider ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {isRTL ? "اتصال الطوارئ" : "Emergency Contact"}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-bold ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    } uppercase tracking-wider ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {isRTL ? "الحالة" : "Status"}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-bold ${
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
                {supervisors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className={`px-6 py-10 text-center ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {isRTL ? "لا يوجد مشرفين." : "No supervisors found."}
                    </td>
                  </tr>
                ) : (
                  supervisors.map((sup) => (
                    <tr
                      key={sup.id}
                      className={`${
                        isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                      } transition`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`flex items-center ${
                            isRTL ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold ${
                              isRTL ? "ml-4" : "mr-4"
                            }`}
                          >
                            {sup.name.charAt(0)}
                          </div>
                          <div className={isRTL ? "text-right" : "text-left"}>
                            <div
                              className={`text-sm font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {sup.name}
                            </div>
                            <div
                              className={`text-xs ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {sup.user_code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm ${
                            isDark ? "text-gray-300" : "text-gray-900"
                          } ${isRTL ? "text-right" : "text-left"}`}
                        >
                          {sup.phone}
                        </div>
                        <div
                          className={`text-xs ${
                            isDark ? "text-gray-500" : "text-gray-500"
                          } ${isRTL ? "text-right" : "text-left"}`}
                        >
                          {sup.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm ${
                            isDark ? "text-gray-300" : "text-gray-900"
                          } ${isRTL ? "text-right" : "text-left"}`}
                        >
                          {sup.supervisor_profile?.emergency_contact_name}
                        </div>
                        <div
                          className={`text-xs ${
                            isDark ? "text-gray-500" : "text-gray-500"
                          } ${isRTL ? "text-right" : "text-left"}`}
                        >
                          {sup.supervisor_profile?.emergency_contact_phone}
                        </div>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                    ${
                                                      sup.supervisor_profile
                                                        ?.status === "Active"
                                                        ? isDark
                                                          ? "bg-green-900/30 text-green-400"
                                                          : "bg-green-100 text-green-800"
                                                        : isDark
                                                        ? "bg-gray-700 text-gray-400"
                                                        : "bg-gray-100 text-gray-800"
                                                    }`}
                        >
                          {isRTL
                            ? ["Active", "Trainee"].includes(
                                sup.supervisor_profile?.status || ""
                              )
                              ? sup.supervisor_profile?.status === "Active"
                                ? "نشط"
                                : "متدرب"
                              : sup.supervisor_profile?.status
                            : sup.supervisor_profile?.status || "Active"}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          isRTL ? "text-left" : "text-right"
                        }`}
                      >
                        <button
                          onClick={() => openEditModal(sup)}
                          className={`text-indigo-600 hover:text-indigo-900 font-bold ${
                            isRTL ? "ml-4" : "mr-4"
                          } ${
                            isDark
                              ? "text-indigo-400 hover:text-indigo-300"
                              : ""
                          }`}
                        >
                          {isRTL ? "تعديل" : "Edit"}
                        </button>
                        <button
                          onClick={() => deleteSupervisor(sup.id)}
                          className={`text-red-600 hover:text-red-900 font-bold ${
                            isDark ? "text-red-400 hover:text-red-300" : ""
                          }`}
                        >
                          {isRTL ? "حذف" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* --- MODAL --- */}
          <Modal show={isModalOpen} onClose={closeModal}>
            <div
              className={`p-6 ${
                isDark ? "bg-gray-800 text-gray-200" : "bg-white"
              }`}
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
                {/* Name */}
                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel
                    htmlFor="name"
                    value={isRTL ? "الاسم الكامل" : "Full Name"}
                  />
                  <TextInput
                    id="name"
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    className="mt-1 block w-full"
                    placeholder={isRTL ? "اسم المشرف" : "Supervisor Name"}
                  />
                  <InputError message={errors.name} className="mt-2" />
                </div>

                {/* Phone & Email */}
                <div className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
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
                </div>

                {/* Emergency Contact Section */}
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
                  <div
                    className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}
                  >
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
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white"
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
                          isDark
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white"
                        }`}
                      />
                      <InputError
                        message={errors.emergency_contact_phone}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Status (Only show when editing) */}
                {isEditing && (
                  <div className={isRTL ? "text-right" : ""}>
                    <InputLabel
                      htmlFor="status"
                      value={isRTL ? "الحالة" : "Status"}
                    />
                    <select
                      id="status"
                      className={`mt-1 block w-full rounded-md shadow-sm focus:border-brand-yellow focus:ring-brand-yellow ${
                        isDark
                          ? "bg-gray-800 border-gray-600 text-white"
                          : "border-gray-300"
                      }`}
                      value={data.status}
                      onChange={(e) => setData("status", e.target.value)}
                    >
                      <option value="Trainee">
                        {isRTL ? "متدرب" : "Trainee"}
                      </option>
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
                  <PrimaryButton
                    disabled={processing}
                    className="bg-brand-dark"
                  >
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
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
