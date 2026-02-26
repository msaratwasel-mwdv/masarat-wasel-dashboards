import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal"; // تأكد أن لديك مكون Modal في Laravel Breeze/Inertia
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton"; // زر إلغاء
import { toast } from "react-toastify";
import { useTheme } from "@/Contexts/ThemeContext";

// تعريف نوع البيانات القادمة من الباك إند
interface Driver {
  id: number;
  name: string;
  name_en: string | null;
  email: string;
  phone: string;
  national_id: string;
  user_code: string;
  driver_profile: {
    license_number: string;
    license_expiry_date: string;
    status: string;
  } | null;
  image?: string | null;
}

export default function DriversIndex({ drivers }: { drivers: Driver[] }) {
  const { isRTL, theme } = useTheme();
  const isDark = theme === "dark";

  // --- State Management ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDriverId, setCurrentDriverId] = useState<number | null>(null);

  // --- Form Handling ---
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

  // فتح المودال للإضافة
  const openAddModal = () => {
    setIsEditing(false);
    setCurrentDriverId(null);
    reset();
    setData("_method", "post");
    clearErrors();
    setIsModalOpen(true);
  };

  // فتح المودال للتعديل
  const openEditModal = (driver: Driver) => {
    setIsEditing(true);
    setCurrentDriverId(driver.id);
    // تعبئة البيانات الموجودة
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

  // إرسال النموذج (إضافة أو تعديل)
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentDriverId) {
      post(route("admin.drivers.update", currentDriverId), {
        forceFormData: true,
        onSuccess: () => {
          toast(isRTL ? "تم التعديل بنجاح" : "Updated Successfully");
          closeModal();
        },
      });
    } else {
      post(route("admin.drivers.store"), {
        onSuccess: () => {
          toast(isRTL ? "تم الحفظ بنجاح" : "Saved Successfully");
          closeModal();
        },
      });
    }
  };

  // الحذف
  const deleteDriver = (driverId: number) => {
    if (
      confirm(
        isRTL
          ? "هل أنت متأكد من حذف هذا السائق؟ لا يمكن التراجع عن هذا الإجراء."
          : "Are you sure you want to delete this driver? This action cannot be undone."
      )
    ) {
      router.delete(route("admin.drivers.destroy", driverId));
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
          {isRTL ? "إدارة السائقين" : "Drivers Management"}
        </h2>
      }
    >
      <Head title={isRTL ? "السائقين" : "Drivers"} />

      <div className={`py-6 dir-${isRTL ? "rtl" : "ltr"}`}>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header: Title + Add Button */}
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
                {isRTL ? "سائقي الأسطول" : "Fleet Drivers"}
              </h1>
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {isRTL
                  ? "إدارة مجموعة السائقين الخاصة بالشركة."
                  : "Manage your company drivers pool."}
              </p>
            </div>
            <PrimaryButton
              onClick={openAddModal}
              className="bg-brand-yellow text-brand-dark hover:bg-yellow-500"
            >
              {isRTL ? "+ إضافة سائق جديد" : "+ Add New Driver"}
            </PrimaryButton>
          </div>

          {/* Drivers Table */}
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
                    {isRTL ? "بيانات السائق" : "Driver Info"}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-bold ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    } uppercase tracking-wider ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {isRTL ? "معلومات الاتصال" : "Contact"}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-bold ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    } uppercase tracking-wider ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                  >
                    {isRTL ? "الرخص" : "License"}
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
                {drivers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className={`px-6 py-10 text-center ${
                        isDark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {isRTL
                        ? "لا يوجد سائقين. اضغط على 'إضافة سائق جديد' للبدء."
                        : 'No drivers found. Click "Add New Driver" to start.'}
                    </td>
                  </tr>
                ) : (
                  drivers.map((driver) => (
                    <tr
                      key={driver.id}
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
                            className={`flex-shrink-0 h-10 w-10 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold overflow-hidden ${
                              isRTL ? "ml-4" : "mr-4"
                            }`}
                          >
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
                          <div className={isRTL ? "text-right" : "text-left"}>
                            <div
                              className={`text-sm font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {driver.name}
                            </div>
                            <div
                              className={`text-xs ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              ID: {driver.national_id}
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
                          {driver.phone}
                        </div>
                        <div
                          className={`text-xs ${
                            isDark ? "text-gray-500" : "text-gray-500"
                          } ${isRTL ? "text-right" : "text-left"}`}
                        >
                          {driver.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm ${
                            isDark ? "text-gray-300" : "text-gray-900"
                          } ${isRTL ? "text-right" : "text-left"}`}
                        >
                          {driver.driver_profile?.license_number}
                        </div>
                        <div
                          className={`text-xs ${
                            isDark ? "text-gray-500" : "text-gray-500"
                          } ${isRTL ? "text-right" : "text-left"}`}
                        >
                          Exp: {driver.driver_profile?.license_expiry_date}
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
                                                      driver.driver_profile
                                                        ?.status === "Active"
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
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          isRTL ? "text-left" : "text-right"
                        }`}
                      >
                        <button
                          onClick={() => openEditModal(driver)}
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
                          onClick={() => deleteDriver(driver.id)}
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

          {/* --- MODAL FOR CREATE / EDIT --- */}
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
                    ? "تعديل بيانات السائق"
                    : "Edit Driver Details"
                  : isRTL
                  ? "تسجيل سائق جديد"
                  : "Register New Driver"}
              </h2>

              <form onSubmit={submit} className="space-y-4">
                {/* Names */}
                <div className={`grid grid-cols-2 gap-4 ${isRTL ? "rtl" : ""}`}>
                  <div className={isRTL ? "text-right" : ""}>
                    <InputLabel
                      htmlFor="name"
                      value={
                        isRTL ? "الاسم الكامل (عربي)" : "Full Name (Arabic)"
                      }
                    />
                    <TextInput
                      id="name"
                      value={data.name}
                      onChange={(e) => setData("name", e.target.value)}
                      className="mt-1 block w-full"
                      placeholder={isRTL ? "اسم السائق" : "Driver Name"}
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
                      placeholder="e.g. John Doe"
                    />
                    <InputError message={errors.name_en} className="mt-2" />
                  </div>
                </div>

                {/* Grid for ID & Phone */}
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

                {/* Email */}
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

                {/* Profile Picture */}
                <div className={isRTL ? "text-right" : ""}>
                  <InputLabel
                    value={isRTL ? "الصورة الشخصية" : "Profile Picture"}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setData(
                        "image",
                        e.target.files ? e.target.files[0] : null
                      )
                    }
                    className={`mt-1 block w-full text-sm ${
                      isDark
                        ? "text-gray-400 file:bg-gray-700 file:text-gray-200"
                        : "text-gray-500 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    }
                    file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold transition-all cursor-pointer`}
                  />
                  <InputError message={errors.image} className="mt-2" />
                </div>

                {/* Grid for License */}
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
                      onChange={(e) =>
                        setData("license_number", e.target.value)
                      }
                      className={`mt-1 block w-full ${
                        isDark
                          ? "border-gray-600 bg-gray-800"
                          : "border-gray-300"
                      }`}
                    />
                    <InputError
                      message={errors.license_number}
                      className="mt-2"
                    />
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
                        isDark
                          ? "border-gray-600 bg-gray-800"
                          : "border-gray-300"
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
                  <PrimaryButton
                    disabled={processing}
                    className="bg-brand-dark"
                  >
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
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
