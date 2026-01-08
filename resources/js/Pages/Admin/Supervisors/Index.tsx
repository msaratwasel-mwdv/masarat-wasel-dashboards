import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

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
    if (confirm("Are you sure? This action cannot be undone.")) {
      router.delete(route("admin.supervisors.destroy", id));
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-bold text-xl text-gray-800">
          Supervisors Management
        </h2>
      }
    >
      <Head title="Supervisors" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark">
                Bus Supervisors
              </h1>
              <p className="text-sm text-gray-500">
                Manage supervisors and emergency contacts.
              </p>
            </div>
            <PrimaryButton
              onClick={openAddModal}
              className="bg-brand-yellow text-brand-dark hover:bg-yellow-500"
            >
              + Add New Supervisor
            </PrimaryButton>
          </div>

          {/* Table */}
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-2xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Supervisor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Emergency Contact
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
                {supervisors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-400"
                    >
                      No supervisors found.
                    </td>
                  </tr>
                ) : (
                  supervisors.map((sup) => (
                    <tr key={sup.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                            {sup.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {sup.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {sup.user_code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{sup.phone}</div>
                        <div className="text-xs text-gray-500">{sup.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {sup.supervisor_profile?.emergency_contact_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sup.supervisor_profile?.emergency_contact_phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                    ${
                                                      sup.supervisor_profile
                                                        ?.status === "Active"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                    }`}
                        >
                          {sup.supervisor_profile?.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(sup)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSupervisor(sup.id)}
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

          {/* --- MODAL --- */}
          <Modal show={isModalOpen} onClose={closeModal}>
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {isEditing ? "Edit Supervisor" : "New Supervisor"}
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
                    placeholder="Supervisor Name"
                  />
                  <InputError message={errors.name} className="mt-2" />
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <InputLabel htmlFor="email" value="Email" />
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
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-3">
                    Emergency Contact
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <InputLabel htmlFor="ec_name" value="Contact Name" />
                      <TextInput
                        id="ec_name"
                        value={data.emergency_contact_name}
                        onChange={(e) =>
                          setData("emergency_contact_name", e.target.value)
                        }
                        className="mt-1 block w-full bg-white"
                      />
                      <InputError
                        message={errors.emergency_contact_name}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <InputLabel htmlFor="ec_phone" value="Contact Phone" />
                      <TextInput
                        id="ec_phone"
                        value={data.emergency_contact_phone}
                        onChange={(e) =>
                          setData("emergency_contact_phone", e.target.value)
                        }
                        className="mt-1 block w-full bg-white"
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
                  <div>
                    <InputLabel htmlFor="status" value="Status" />
                    <select
                      id="status"
                      className="mt-1 block w-full border-gray-300 focus:border-brand-yellow focus:ring-brand-yellow rounded-md shadow-sm"
                      value={data.status}
                      onChange={(e) => setData("status", e.target.value)}
                    >
                      <option value="Trainee">Trainee</option>
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                  <PrimaryButton
                    disabled={processing}
                    className="bg-brand-dark"
                  >
                    {isEditing ? "Update Supervisor" : "Save Supervisor"}
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
