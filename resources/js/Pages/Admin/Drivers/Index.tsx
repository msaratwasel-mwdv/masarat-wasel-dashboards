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

// تعريف نوع البيانات القادمة من الباك إند
interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string;
  national_id: string;
  user_code: string;
  driver_profile: {
    license_number: string;
    license_expiry_date: string;
    status: string;
  } | null;
}

export default function DriversIndex({ drivers }: { drivers: Driver[] }) {
  // --- State Management ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDriverId, setCurrentDriverId] = useState<number | null>(null);

  // --- Form Handling ---
  const { data, setData, post, put, processing, errors, reset, clearErrors } =
    useForm({
      name: "",
      national_id: "",
      email: "",
      phone: "",
      license_number: "",
      license_expiry_date: "",
    });

  // فتح المودال للإضافة
  const openAddModal = () => {
    setIsEditing(false);
    setCurrentDriverId(null);
    reset();
    clearErrors();
    setIsModalOpen(true);
  };

  // فتح المودال للتعديل
  const openEditModal = (driver: Driver) => {
    setIsEditing(true);
    setCurrentDriverId(driver.id);
    // تعبئة البيانات الموجودة
    setData({
      name: driver.name,
      national_id: driver.national_id || "",
      email: driver.email,
      phone: driver.phone || "",
      license_number: driver.driver_profile?.license_number || "",
      license_expiry_date: driver.driver_profile?.license_expiry_date || "",
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
      put(route("admin.drivers.update", currentDriverId), {
        onSuccess: () => {
      toast("تم العديل بانجاح");
            closeModal()
        }

            ,
      });
    } else {
      post(route("admin.drivers.store"), {
        onSuccess: () => {
      toast(
        "تم الحفظ بانجاح"
      );

            closeModal()
        },
      });
    }
  };

  // الحذف
  const deleteDriver = (driverId: number) => {
    if (

      toast("Are you sure you want to delete this driver? This action cannot be undone.")
    ) {
      router.delete(route("admin.drivers.destroy", driverId));
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-bold text-xl text-gray-800">Drivers Management</h2>
      }
    >
      <Head title="Drivers" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header: Title + Add Button */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark">
                Fleet Drivers
              </h1>
              <p className="text-sm text-gray-500">
                Manage your company drivers pool.
              </p>
            </div>
            <PrimaryButton
              onClick={openAddModal}
              className="bg-brand-yellow text-brand-dark hover:bg-yellow-500"
            >
              + Add New Driver
            </PrimaryButton>
          </div>

          {/* Drivers Table */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-2xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Driver Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    License
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      No drivers found. Click "Add New Driver" to start.
                    </td>
                  </tr>
                ) : (
                  drivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-navy/10 text-brand-navy flex items-center justify-center font-bold">
                            {driver.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {driver.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {driver.national_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {driver.phone}
                        </div>
                        <div className="text-xs text-gray-500">
                          {driver.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {driver.driver_profile?.license_number}
                        </div>
                        <div className="text-xs text-gray-500">
                          Exp: {driver.driver_profile?.license_expiry_date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                    ${
                                                      driver.driver_profile
                                                        ?.status === "Active"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                    }`}
                        >
                          {driver.driver_profile?.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(driver)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteDriver(driver.id)}
                          className="text-red-600 hover:text-red-900 font-bold"
                        >
                          Delete
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
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? "Edit Driver Details" : "Register New Driver"}
              </h2>

              <form onSubmit={submit} className="space-y-4">
                {/* Name */}
                <div>
                  <InputLabel htmlFor="name" value="Full Name" />
                  <TextInput
                    id="name"
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    className="mt-1 block w-full"
                    placeholder="Driver Name"
                  />
                  <InputError message={errors.name} className="mt-2" />
                </div>

                {/* Grid for ID & Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InputLabel htmlFor="national_id" value="National ID" />
                    <TextInput
                      id="national_id"
                      value={data.national_id}
                      onChange={(e) => setData("national_id", e.target.value)}
                      className="mt-1 block w-full"
                    />
                    <InputError message={errors.national_id} className="mt-2" />
                  </div>
                  <div>
                    <InputLabel htmlFor="phone" value="Phone Number" />
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
                <div>
                  <InputLabel htmlFor="email" value="Email Address" />
                  <TextInput
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData("email", e.target.value)}
                    className="mt-1 block w-full"
                  />
                  <InputError message={errors.email} className="mt-2" />
                </div>

                {/* Grid for License */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border">
                  <div>
                    <InputLabel
                      htmlFor="license_number"
                      value="License Number"
                    />
                    <TextInput
                      id="license_number"
                      value={data.license_number}
                      onChange={(e) =>
                        setData("license_number", e.target.value)
                      }
                      className="mt-1 block w-full border-gray-300"
                    />
                    <InputError
                      message={errors.license_number}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <InputLabel
                      htmlFor="license_expiry_date"
                      value="Expiry Date"
                    />
                    <TextInput
                      id="license_expiry_date"
                      type="date"
                      value={data.license_expiry_date}
                      onChange={(e) =>
                        setData("license_expiry_date", e.target.value)
                      }
                      className="mt-1 block w-full border-gray-300"
                    />
                    <InputError
                      message={errors.license_expiry_date}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                  <PrimaryButton
                    disabled={processing}
                    className="bg-brand-dark"
                  >
                    {isEditing ? "Update Driver" : "Save Driver"}
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
